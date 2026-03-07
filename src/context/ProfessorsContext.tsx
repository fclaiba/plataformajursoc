import React, { createContext, useContext, useState, useEffect } from 'react';
import { COMISIONES } from '../data/mock';

export type ProfessorRole = 'Titular' | 'Adjunto' | 'Auxiliar' | 'JTP' | 'Ayudante';
export type RankingContextType = 'general' | 'subject' | 'catedra';

export interface CategoryStats {
    elo: number;
    matches: number;
    wins: number;
    tier?: 'Diamond' | 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
}

export interface Professor {
    id: string;
    name: string;
    subjects: string[];
    catedras: string[];
    roles: ProfessorRole[];
    avatar?: string;
    // Stats per context
    stats: {
        general: CategoryStats;
        bySubject: Record<string, CategoryStats>;
        byCatedra: Record<string, CategoryStats>;
    };
}

export interface VoteContext {
    type: RankingContextType;
    id: string; // 'general' or subjectId or catedraId
}

interface ProfessorsContextType {
    professors: Professor[];
    vote: (winnerId: string, loserId: string, context: VoteContext) => { ok: boolean; reason?: string };
    getTwoRandomProfessors: (filters?: { role?: string, subjectId?: string, catedraId?: string }) => [Professor, Professor] | null;
    resetRatings: () => void;
}

const ProfessorsContext = createContext<ProfessorsContextType | undefined>(undefined);

const K_FACTOR = 32;
const INITIAL_ELO = 1200;
const MAX_DAILY_VOTES = 120;
const DUPLICATE_PAIR_COOLDOWN_MS = 2500;
const VOTES_META_STORAGE_KEY = 'juridica_professors_votes_meta_v1';

interface VoteMeta {
    dayKey: string;
    votesToday: number;
    lastVoteByPair: Record<string, number>;
}

const getTier = (elo: number) => {
    if (elo >= 1800) return 'Diamond';
    if (elo >= 1600) return 'Platinum';
    if (elo >= 1400) return 'Gold';
    if (elo >= 1200) return 'Silver';
    return 'Bronze';
};

const getInitialStats = (): CategoryStats => ({
    elo: INITIAL_ELO,
    matches: 0,
    wins: 0,
    tier: 'Bronze'
});

const extractProfessors = (): Professor[] => {
    const map = new Map<string, Professor>();

    COMISIONES.forEach(c => {
        if (!c.profesor || c.profesor.includes('Cátedra')) return;

        const name = c.profesor;
        let role: ProfessorRole = 'Adjunto';
        if (name.toLowerCase().includes('titular')) role = 'Titular';
        else if (name.toLowerCase().includes('adjunto')) role = 'Adjunto';
        else if (name.toLowerCase().includes('auxiliar')) role = 'Auxiliar';
        else if (name.toLowerCase().includes('jtp')) role = 'JTP';

        if (!map.has(name)) {
            map.set(name, {
                id: `prof-${name.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).substr(2, 4)}`,
                name: name,
                subjects: [c.materiaId],
                catedras: [c.catedraId],
                roles: [role],
                stats: {
                    general: getInitialStats(),
                    bySubject: {},
                    byCatedra: {}
                }
            });
        } else {
            const prof = map.get(name)!;
            if (!prof.subjects.includes(c.materiaId)) prof.subjects.push(c.materiaId);
            if (!prof.catedras.includes(c.catedraId)) prof.catedras.push(c.catedraId);
            if (!prof.roles.includes(role)) prof.roles.push(role);
        }
    });

    const mocks: { name: string, role: ProfessorRole }[] = [
        { name: "Dr. Juan Carlos Prof", role: 'Titular' },
        { name: "Dra. Ana Maria Leyes", role: 'Adjunto' },
        { name: "Dr. Ricardo Doctrina", role: 'Titular' },
        { name: "Dra. Sofia Jurisprudencia", role: 'Auxiliar' },
        { name: "Dr. Esteban Codigo", role: 'JTP' },
        { name: "Dra. Lucia Fallos", role: 'Titular' }
    ];

    mocks.forEach(m => {
        if (!map.has(m.name)) {
            map.set(m.name, {
                id: `prof-mock-${m.name.replace(/\s+/g, '-').toLowerCase()}`,
                name: m.name,
                subjects: ['intro-der', 'der-civ-5'],
                catedras: ['cat1-intro-der'],
                roles: [m.role],
                stats: {
                    general: getInitialStats(),
                    bySubject: {},
                    byCatedra: {}
                }
            });
        }
    });

    // Initialize specific stats context for known subjects/catedras
    const professors = Array.from(map.values());
    professors.forEach(p => {
        p.subjects.forEach(s => {
            if (!p.stats.bySubject[s]) p.stats.bySubject[s] = getInitialStats();
        });
        p.catedras.forEach(c => {
            if (!p.stats.byCatedra[c]) p.stats.byCatedra[c] = getInitialStats();
        });
    });

    return professors;
};

export function ProfessorsProvider({ children }: { children: React.ReactNode }) {
    const [professors, setProfessors] = useState<Professor[]>([]);
    const [voteMeta, setVoteMeta] = useState<VoteMeta>(() => {
        const raw = localStorage.getItem(VOTES_META_STORAGE_KEY);
        if (raw) {
            try {
                return JSON.parse(raw);
            } catch {
                // Fallback to defaults.
            }
        }
        return { dayKey: new Date().toDateString(), votesToday: 0, lastVoteByPair: {} };
    });

    useEffect(() => {
        const stored = localStorage.getItem('juridica_professors_elo_v3'); // Bump version
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Validate new structure
                if (parsed.length > 0 && parsed[0].stats && parsed[0].stats.general && parsed[0].stats.bySubject) {
                    setProfessors(parsed);
                } else {
                    console.warn('Legacy data detected, resetting.');
                    setProfessors(extractProfessors());
                }
            } catch (e) {
                setProfessors(extractProfessors());
            }
        } else {
            setProfessors(extractProfessors());
        }
    }, []);

    useEffect(() => {
        if (professors.length > 0) {
            localStorage.setItem('juridica_professors_elo_v3', JSON.stringify(professors));
        }
    }, [professors]);

    useEffect(() => {
        localStorage.setItem(VOTES_META_STORAGE_KEY, JSON.stringify(voteMeta));
    }, [voteMeta]);

    const vote = (winnerId: string, loserId: string, context: VoteContext) => {
        if (winnerId === loserId) {
            return { ok: false, reason: 'No se puede votar por el mismo docente.' };
        }

        const now = Date.now();
        const today = new Date().toDateString();
        const normalizedMeta = voteMeta.dayKey === today
            ? voteMeta
            : { dayKey: today, votesToday: 0, lastVoteByPair: {} };

        if (normalizedMeta.votesToday >= MAX_DAILY_VOTES) {
            return { ok: false, reason: 'Alcanzaste el límite diario de votos.' };
        }

        const pairKey = [winnerId, loserId].sort().join('__') + `__${context.type}__${context.id}`;
        const lastVoteAt = normalizedMeta.lastVoteByPair[pairKey];
        if (lastVoteAt && (now - lastVoteAt) < DUPLICATE_PAIR_COOLDOWN_MS) {
            return { ok: false, reason: 'Debes esperar un momento antes de votar el mismo par.' };
        }

        setProfessors(prev => {
            const winnerIndex = prev.findIndex(p => p.id === winnerId);
            const loserIndex = prev.findIndex(p => p.id === loserId);

            if (winnerIndex === -1 || loserIndex === -1) return prev;

            const winner = JSON.parse(JSON.stringify(prev[winnerIndex])); // Deep copy
            const loser = JSON.parse(JSON.stringify(prev[loserIndex]));

            // Helper to get stats ref
            const getStats = (p: Professor, ctx: VoteContext) => {
                if (ctx.type === 'general') return p.stats.general;
                if (ctx.type === 'subject') {
                    if (!p.stats.bySubject[ctx.id]) p.stats.bySubject[ctx.id] = getInitialStats();
                    return p.stats.bySubject[ctx.id];
                }
                if (ctx.type === 'catedra') {
                    if (!p.stats.byCatedra[ctx.id]) p.stats.byCatedra[ctx.id] = getInitialStats();
                    return p.stats.byCatedra[ctx.id];
                }
                return p.stats.general;
            };

            const winnerStats = getStats(winner, context);
            const loserStats = getStats(loser, context);

            // ELO Calculation
            const expectedWinner = 1 / (1 + Math.pow(10, (loserStats.elo - winnerStats.elo) / 400));
            const expectedLoser = 1 / (1 + Math.pow(10, (winnerStats.elo - loserStats.elo) / 400));

            const newWinnerElo = Math.round(winnerStats.elo + K_FACTOR * (1 - expectedWinner));
            const newLoserElo = Math.round(loserStats.elo + K_FACTOR * (0 - expectedLoser));

            winnerStats.elo = newWinnerElo;
            winnerStats.matches += 1;
            winnerStats.wins += 1;
            winnerStats.tier = getTier(newWinnerElo);

            loserStats.elo = newLoserElo;
            loserStats.matches += 1;
            loserStats.tier = getTier(newLoserElo);

            const newProfs = [...prev];
            newProfs[winnerIndex] = winner;
            newProfs[loserIndex] = loser;

            return newProfs;
        });
        setVoteMeta({
            ...normalizedMeta,
            votesToday: normalizedMeta.votesToday + 1,
            lastVoteByPair: {
                ...normalizedMeta.lastVoteByPair,
                [pairKey]: now
            }
        });
        return { ok: true };
    };

    const getTwoRandomProfessors = (filters?: { role?: string, subjectId?: string, catedraId?: string }): [Professor, Professor] | null => {
        if (professors.length < 2) return null;

        let pool = professors;

        if (filters?.role && filters.role !== 'all') {
            pool = pool.filter(p => p.roles.includes(filters.role as any));
        }

        if (filters?.subjectId && filters.subjectId !== 'all') {
            pool = pool.filter(p => p.subjects.includes(filters.subjectId!));
        }

        if (filters?.catedraId && filters.catedraId !== 'all') {
            pool = pool.filter(p => p.catedras.includes(filters.catedraId!));
        }

        if (pool.length < 2) return null;

        const idx1 = Math.floor(Math.random() * pool.length);
        let idx2 = Math.floor(Math.random() * pool.length);
        while (idx2 === idx1) idx2 = Math.floor(Math.random() * pool.length);

        return [pool[idx1], pool[idx2]];
    };

    const resetRatings = () => {
        setProfessors(extractProfessors());
        localStorage.removeItem('juridica_professors_elo_v3');
        localStorage.removeItem(VOTES_META_STORAGE_KEY);
        setVoteMeta({ dayKey: new Date().toDateString(), votesToday: 0, lastVoteByPair: {} });
    };

    return (
        <ProfessorsContext.Provider value={{ professors, vote, getTwoRandomProfessors, resetRatings }}>
            {children}
        </ProfessorsContext.Provider>
    );
}

export function useProfessors() {
    const context = useContext(ProfessorsContext);
    if (context === undefined) {
        throw new Error('useProfessors must be used within a ProfessorsProvider');
    }
    return context;
}
