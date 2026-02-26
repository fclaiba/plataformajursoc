import { useState, useEffect, useMemo } from 'react';
import { useProfessors } from '../../context/ProfessorsContext';
import type { Professor, RankingContextType } from '../../context/ProfessorsContext';
import { MATERIAS, CATEDRAS } from '../../data/mock';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Trophy, Swords, SkipForward, Info, BookOpen, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export function EloTrainingPage() {
    const { getTwoRandomProfessors, vote } = useProfessors();
    const navigate = useNavigate();

    // Voting Context State
    const [votingMode, setVotingMode] = useState<RankingContextType>('general');
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
    const [selectedCatedraId, setSelectedCatedraId] = useState<string>('all');
    const [selectedRole, setSelectedRole] = useState<string>('all');

    // Pair Management
    const [pair, setPair] = useState<[Professor, Professor] | null>(null);
    const [loading, setLoading] = useState(true);
    const [animating, setAnimating] = useState(false);
    const [lastWinnerId, setLastWinnerId] = useState<string | null>(null);

    // Derived Data
    const filteredCatedras = useMemo(() => {
        if (selectedSubjectId === 'all') return [];
        return CATEDRAS.filter(c => c.materiaId === selectedSubjectId);
    }, [selectedSubjectId]);

    const isContextReady = useMemo(() => {
        if (votingMode === 'general') return true;
        if (votingMode === 'subject') return selectedSubjectId !== 'all';
        if (votingMode === 'catedra') return selectedCatedraId !== 'all';
        return false;
    }, [votingMode, selectedSubjectId, selectedCatedraId]);

    const loadNewPair = () => {
        if (!isContextReady) {
            setPair(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        // Small delay to allow UI to settle if changing modes roughly
        setTimeout(() => {
            const filters: any = { role: selectedRole !== 'all' ? selectedRole : undefined };

            if (votingMode === 'subject') filters.subjectId = selectedSubjectId;
            if (votingMode === 'catedra') filters.catedraId = selectedCatedraId;

            const newPair = getTwoRandomProfessors(filters);
            setPair(newPair);
            setLoading(false);
        }, 300);
    };

    // Initial Load & Filter Changes
    useEffect(() => {
        loadNewPair();
    }, [votingMode, selectedSubjectId, selectedCatedraId, selectedRole]); // eslint-disable-line

    const handleVote = (winner: Professor, loser: Professor) => {
        if (animating) return;
        setAnimating(true);
        setLastWinnerId(winner.id);

        // Determine Context ID
        let contextId = 'general';
        if (votingMode === 'subject') contextId = selectedSubjectId;
        if (votingMode === 'catedra') contextId = selectedCatedraId;

        // Execute Vote
        vote(winner.id, loser.id, { type: votingMode, id: contextId });

        // Animation Delay for next pair
        setTimeout(() => {
            loadNewPair();
            setLastWinnerId(null);
            setAnimating(false);
        }, 800);
    };

    const handleSkip = () => {
        setAnimating(true);
        setTimeout(() => {
            loadNewPair();
            setAnimating(false);
        }, 300);
    };

    const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedSubjectId(e.target.value);
        setSelectedCatedraId('all');
    };

    return (
        <div className="max-w-6xl mx-auto py-4 md:py-8 px-4 animate-in fade-in duration-700">
            {/* Header */}
            <div className="text-center mb-6 md:mb-10 space-y-3 md:space-y-4">
                <div className="inline-flex items-center justify-center p-2 md:p-3 bg-indigo-100 rounded-full mb-2">
                    <Swords className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" />
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                    Ranking Docente
                </h1>

                <div className="flex justify-center gap-4 mt-2">
                    <Button variant="outline" onClick={() => navigate('/ranking/leaderboard')} className="gap-2 text-xs md:text-sm h-8 md:h-10">
                        <Trophy className="w-3 h-3 md:w-4 md:h-4 text-amber-500" /> Ver Tabla
                    </Button>
                </div>

                {/* Context Selector Panel */}
                <div className="max-w-3xl mx-auto mt-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-center">

                        {/* Mode Tabs */}
                        <div className="flex p-1 bg-slate-100 rounded-lg">
                            <button
                                onClick={() => { setVotingMode('general'); setSelectedSubjectId('all'); setSelectedCatedraId('all'); }}
                                className={cn("px-4 py-2 rounded-md text-sm font-medium transition-all", votingMode === 'general' ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                            >General</button>
                            <button
                                onClick={() => { setVotingMode('subject'); setSelectedSubjectId('all'); }}
                                className={cn("px-4 py-2 rounded-md text-sm font-medium transition-all", votingMode === 'subject' ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                            >Por Materia</button>
                            <button
                                onClick={() => { setVotingMode('catedra'); setSelectedSubjectId('all'); setSelectedCatedraId('all'); }}
                                className={cn("px-4 py-2 rounded-md text-sm font-medium transition-all", votingMode === 'catedra' ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                            >Por Cátedra</button>
                        </div>

                        {/* Filters based on Mode */}
                        <div className="flex flex-1 gap-2 w-full md:w-auto">
                            {(votingMode === 'subject' || votingMode === 'catedra') && (
                                <select
                                    className="h-10 px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1"
                                    value={selectedSubjectId}
                                    onChange={handleSubjectChange}
                                >
                                    <option value="all">Seleccionar Materia...</option>
                                    {MATERIAS.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                </select>
                            )}

                            {votingMode === 'catedra' && (
                                <select
                                    className="h-10 px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 disabled:opacity-50"
                                    value={selectedCatedraId}
                                    onChange={(e) => setSelectedCatedraId(e.target.value)}
                                    disabled={selectedSubjectId === 'all'}
                                >
                                    <option value="all">Seleccionar Cátedra...</option>
                                    {filteredCatedras.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                </select>
                            )}
                        </div>

                        {/* Role Filter (Always Available) */}
                        <div className="w-full md:w-auto">
                            <select
                                className="w-full md:w-32 h-10 px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                            >
                                <option value="all">Todos los Roles</option>
                                <option value="Titular">Titulares</option>
                                <option value="Adjunto">Adjuntos</option>
                                <option value="JTP">JTP</option>
                                <option value="Auxiliar">Auxiliares</option>
                            </select>
                        </div>
                    </div>
                </div>

                <p className="text-slate-600 text-lg font-medium max-w-2xl mx-auto px-4 mt-6 animate-in slide-in-from-bottom-2 fade-in duration-300 min-h-[3rem] flex items-center justify-center">
                    {votingMode === 'general' ? "¿Quién es mejor docente en general?" :
                        votingMode === 'subject' ? "¿Quién es mejor para esta materia?" :
                            "¿Quién es mejor en esta cátedra?"}
                </p>
            </div>

            {/* Content Area */}
            {!isContextReady ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-4">
                    <BookOpen className="w-12 h-12 text-slate-200" />
                    <p>Selecciona una {votingMode === 'subject' ? 'materia' : 'cátedra'} para comenzar a votar.</p>
                </div>
            ) : loading ? (
                <div className="flex h-64 items-center justify-center text-slate-400">
                    <span className="animate-pulse">Buscando docentes...</span>
                </div>
            ) : !pair ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <AlertCircle className="w-10 h-10 text-slate-300" />
                    <p>No hay suficientes docentes para comparar con estos filtros.</p>
                    <Button variant="ghost" onClick={() => setSelectedRole('all')}>Limpiar filtros de rol</Button>
                </div>
            ) : (
                <>
                    {/* Battle Arena */}
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 relative min-h-[auto] md:min-h-[400px]">

                        {/* Desktop VS Badge */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-xl border-4 border-indigo-50 hidden md:block animate-bounce">
                            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black text-xl italic skew-x-[-10deg]">
                                VS
                            </div>
                        </div>

                        {/* Left Card */}
                        <ProfessorBattleCard
                            professor={pair[0]}
                            onClick={() => handleVote(pair[0], pair[1])}
                            isWinner={lastWinnerId === pair[0].id}
                            isLoser={lastWinnerId === pair[1].id}
                            disabled={animating}
                        />

                        {/* Mobile VS Badge */}
                        <div className="md:hidden relative z-10 -my-4">
                            <div className="bg-white rounded-full p-1.5 shadow-lg border-2 border-indigo-50">
                                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black text-xs italic">
                                    VS
                                </div>
                            </div>
                        </div>

                        {/* Right Card */}
                        <ProfessorBattleCard
                            professor={pair[1]}
                            onClick={() => handleVote(pair[1], pair[0])}
                            isWinner={lastWinnerId === pair[1].id}
                            isLoser={lastWinnerId === pair[0].id}
                            disabled={animating}
                        />

                    </div>

                    {/* Skip Action */}
                    <div className="text-center mt-8 md:mt-12">
                        <Button variant="ghost" className="text-slate-400 hover:text-slate-600" onClick={handleSkip} disabled={animating}>
                            <SkipForward className="w-4 h-4 mr-2" />
                            Saltar esta comparación
                        </Button>
                    </div>

                    <div className="mt-8 text-center text-xs text-slate-300 flex items-center justify-center gap-1">
                        <Info className="w-3 h-3" />
                        Votando en: <span className="font-bold text-indigo-400">
                            {votingMode === 'general' ? 'General' :
                                votingMode === 'subject' ? MATERIAS.find(m => m.id === selectedSubjectId)?.nombre :
                                    CATEDRAS.find(c => c.id === selectedCatedraId)?.nombre}
                        </span>
                    </div>
                </>
            )}
        </div>
    );
}

function ProfessorBattleCard({
    professor,
    onClick,
    isWinner,
    isLoser,
    disabled
}: {
    professor: Professor;
    onClick: () => void;
    isWinner: boolean;
    isLoser: boolean;
    disabled: boolean;
}) {
    return (
        <div
            className={cn(
                "relative w-full max-w-sm transition-all duration-500 transform cursor-pointer group px-4 md:px-0",
                isWinner ? "scale-105 z-20" : isLoser ? "scale-90 opacity-50 grayscale blur-sm" : "hover:scale-[1.02]",
                disabled ? "pointer-events-none" : ""
            )}
            onClick={onClick}
        >
            <Card className={cn(
                "overflow-hidden border-2 h-full flex flex-col items-center p-6 md:p-8 text-center transition-all bg-white relative",
                isWinner ? "border-emerald-500 shadow-2xl shadow-emerald-500/30 ring-4 ring-emerald-100" : "border-slate-100 shadow-lg hover:shadow-xl hover:border-indigo-200"
            )}>
                {/* Avatar Placeholder */}
                <div className={cn(
                    "w-24 h-24 md:w-32 md:h-32 rounded-full mb-4 md:mb-6 flex items-center justify-center text-3xl md:text-4xl font-bold shadow-inner transition-colors",
                    isWinner ? "bg-emerald-100 text-emerald-600" : "bg-gradient-to-br from-slate-100 to-indigo-50 text-indigo-400 group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:text-indigo-600"
                )}>
                    {professor.name.charAt(0)}
                </div>

                <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-2 group-hover:text-indigo-700 transition-colors line-clamp-2 min-h-[3.5rem] md:min-h-0 flex items-center justify-center">
                    {professor.name}
                </h3>

                {/* New Role Badge */}
                <div className="flex justify-center mb-2">
                    {professor.roles?.map(r => (
                        <span key={r} className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 uppercase tracking-wider font-bold">
                            {r}
                        </span>
                    ))}
                </div>

                <div className="flex flex-wrap gap-1.5 md:gap-2 justify-center mb-4 md:mb-6">
                    {professor.subjects.slice(0, 2).map((s, i) => (
                        <span key={i} className="text-[10px] md:text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded border border-slate-200">
                            {s}
                        </span>
                    ))}
                    {professor.subjects.length > 2 && (
                        <span className="text-[10px] md:text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded border border-slate-200">
                            +{professor.subjects.length - 2}
                        </span>
                    )}
                </div>

                <div className="mt-auto pt-2 md:pt-4 w-full">
                    <Button
                        className={cn(
                            "w-full font-bold text-base md:text-lg h-10 md:h-12 shadow-md transition-all active:scale-95",
                            isWinner ? "bg-emerald-600 hover:bg-emerald-700" : "bg-white border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200"
                        )}
                    >
                        {isWinner ? "¡Ganador!" : "Votar"}
                    </Button>
                </div>

                {isWinner && (
                    <div className="absolute inset-0 bg-emerald-500/10 animate-pulse pointer-events-none" />
                )}
            </Card>
        </div>
    );
}
