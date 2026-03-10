import React, { createContext, useContext, useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useAuth } from './AuthContext';
import {
    rankingCastVote,
    rankingListProfessorsWithStats,
} from '../convex/functions';

export type ProfessorRole = 'Titular' | 'Adjunto';
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
    role: ProfessorRole;
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
    vote: (winnerId: string, loserId: string, context: VoteContext) => Promise<{ ok: boolean; reason?: string }>;
    getTwoRandomProfessors: (filters?: { role?: string, subjectId?: string, catedraId?: string }) => [Professor, Professor] | null;
    resetRatings: () => void;
}

const ProfessorsContext = createContext<ProfessorsContextType | undefined>(undefined);

const INITIAL_ELO = 1200;

const getTier = (elo: number): CategoryStats['tier'] => {
    if (elo >= 1800) return 'Diamond';
    if (elo >= 1600) return 'Platinum';
    if (elo >= 1400) return 'Gold';
    if (elo >= 1200) return 'Silver';
    return 'Bronze';
};

export function ProfessorsProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const castVoteMutation = useMutation(rankingCastVote);
    const professorRows = useQuery(rankingListProfessorsWithStats, {});

    const professors = useMemo<Professor[]>(() => {
        return (professorRows || []).map((professor) => {
            const bySubject = Object.fromEntries(
                (professor.bySubject || []).map((entry: any) => [
                    entry.contextId,
                    { elo: entry.elo, matches: entry.matches, wins: entry.wins, tier: getTier(entry.elo) },
                ]),
            );
            const byCatedra = Object.fromEntries(
                (professor.byCathedra || []).map((entry: any) => [
                    entry.contextId,
                    { elo: entry.elo, matches: entry.matches, wins: entry.wins, tier: getTier(entry.elo) },
                ]),
            );
            return {
                id: professor._id,
                name: professor.name,
                role: professor.roles?.[0] === 'Titular' ? 'Titular' : 'Adjunto',
                roles: [professor.roles?.[0] === 'Titular' ? 'Titular' : 'Adjunto'],
                subjects: professor.subjectExternalIds || [],
                catedras: professor.cathedraExternalIds || [],
                stats: {
                    general: {
                        elo: professor.general?.elo ?? INITIAL_ELO,
                        matches: professor.general?.matches ?? 0,
                        wins: professor.general?.wins ?? 0,
                        tier: getTier(professor.general?.elo ?? INITIAL_ELO),
                    },
                    bySubject,
                    byCatedra,
                },
            };
        });
    }, [professorRows]);

    const vote = async (winnerId: string, loserId: string, context: VoteContext) => {
        if (!user?.id) return { ok: false, reason: 'Debes iniciar sesión para votar.' };
        if (winnerId === loserId) return { ok: false, reason: 'No se puede votar por el mismo docente.' };
        try {
            await castVoteMutation({
                voterUserId: user.id,
                winnerProfessorId: winnerId,
                loserProfessorId: loserId,
                contextType: context.type === 'catedra' ? 'cathedra' : context.type,
                contextId: context.id,
            });
            return { ok: true };
        } catch (error) {
            const reason = error instanceof Error ? error.message : 'No se pudo registrar el voto.';
            return { ok: false, reason };
        }
    };

    const getTwoRandomProfessors = (filters?: { role?: string, subjectId?: string, catedraId?: string }): [Professor, Professor] | null => {
        if (professors.length < 2) return null;

        let pool = professors;

        if (filters?.role && filters.role !== 'all') {
            pool = pool.filter(p => p.role === (filters.role as ProfessorRole));
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
        // Ratings are persisted in Convex and should be reset via backend tools/migrations.
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
