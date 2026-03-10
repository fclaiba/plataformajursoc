import { useProfessors } from '../../context/ProfessorsContext';
import type { ProfessorRole } from '../../context/ProfessorsContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Trophy, Search, ArrowLeft, Filter, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState, useMemo } from 'react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useCatalog } from '../../context/CatalogContext';

export function LeaderboardPage() {
    const { professors } = useProfessors();
    const { materias, catedras } = useCatalog();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    // Filters State
    const [selectedMateriaId, setSelectedMateriaId] = useState<string>('all');
    const [selectedCatedraId, setSelectedCatedraId] = useState<string>('all');
    const [selectedRole, setSelectedRole] = useState<string>('all');

    // Derived Lists for Selects
    const filteredCatedras = useMemo(() => {
        if (selectedMateriaId === 'all') return [];
        return catedras.filter(c => c.materiaId === selectedMateriaId);
    }, [selectedMateriaId, catedras]);

    // Determine current ranking context label
    const currentContextLabel = useMemo(() => {
        if (selectedCatedraId !== 'all') {
            const cat = catedras.find(c => c.id === selectedCatedraId);
            return `Ranking Cátedra: ${cat?.nombre}`;
        }
        if (selectedMateriaId !== 'all') {
            const mat = materias.find(m => m.id === selectedMateriaId);
            return `Ranking Materia: ${mat?.nombre}`;
        }
        return 'Ranking General';
    }, [selectedMateriaId, selectedCatedraId, materias, catedras]);

    // Sorting & Filtering Logic
    const sortedProfessors = useMemo(() => {
        return [...professors].sort((a, b) => {
            let eloA = 1200;
            let eloB = 1200;

            if (selectedCatedraId !== 'all') {
                eloA = a.stats?.byCatedra?.[selectedCatedraId]?.elo || 1200;
                eloB = b.stats?.byCatedra?.[selectedCatedraId]?.elo || 1200;
            } else if (selectedMateriaId !== 'all') {
                eloA = a.stats?.bySubject?.[selectedMateriaId]?.elo || 1200;
                eloB = b.stats?.bySubject?.[selectedMateriaId]?.elo || 1200;
            } else {
                eloA = a.stats?.general?.elo || 1200;
                eloB = b.stats?.general?.elo || 1200;
            }

            return eloB - eloA;
        });
    }, [professors, selectedMateriaId, selectedCatedraId]);

    const displayedProfessors = useMemo(() => {
        return sortedProfessors
            .filter(p => {
                // Search Text
                const matchesSearch = p.name ? p.name.toLowerCase().includes(searchTerm.toLowerCase()) : false ||
                    (p.subjects || []).some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
                if (!matchesSearch) return false;

                // Filter by Materia
                if (selectedMateriaId !== 'all') {
                    if (!p.subjects.includes(selectedMateriaId)) return false;
                }

                // Filter by Catedra
                if (selectedCatedraId !== 'all') {
                    // Check if professor belongs to this catedra
                    if (!p.catedras.includes(selectedCatedraId)) return false;
                }

                // Filter by Role
                if (selectedRole !== 'all') {
                    if (p.role !== (selectedRole as ProfessorRole)) return false;
                }

                return true;
            })
            .slice(0, 50); // Top 50 of filtered results
    }, [sortedProfessors, searchTerm, selectedMateriaId, selectedCatedraId, selectedRole]);

    const handleMateriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedMateriaId(e.target.value);
        setSelectedCatedraId('all'); // Reset catedra when materia changes
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedMateriaId('all');
        setSelectedCatedraId('all');
        setSelectedRole('all');
    };

    const hasActiveFilters = selectedMateriaId !== 'all' || selectedCatedraId !== 'all' || selectedRole !== 'all' || searchTerm !== '';
    const getRankBadgeClasses = (index: number) => {
        if (!hasActiveFilters && index === 0) return 'bg-amber-100 text-amber-700 ring-2 ring-amber-200';
        if (!hasActiveFilters && index === 1) return 'bg-slate-200 text-slate-700';
        if (!hasActiveFilters && index === 2) return 'bg-orange-100 text-orange-700';
        return 'bg-slate-100 text-slate-500';
    };

    return (
        <div className="max-w-5xl mx-auto py-6 md:py-8 animate-in fade-in duration-700 px-3 sm:px-4 pb-28 sm:pb-32">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-yellow-500 flex items-center">
                        <Trophy className="w-7 h-7 md:w-8 md:h-8 text-amber-500 mr-3" />
                        Ranking de Docentes
                    </h1>
                    <p className="text-sm md:text-base text-slate-500 mt-1">
                        Consultá posiciones y rendimiento por materia, cátedra y rol.
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="ghost" onClick={() => navigate('/ranking/vote')} className="text-slate-600">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver a votar
                    </Button>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Filter className="w-4 h-4" /> Filtros
                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs text-red-500 hover:text-red-600">
                                <X className="w-3 h-3 mr-1" /> Limpiar
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Buscar docente..."
                            className="pl-9 bg-slate-50 border-slate-200 h-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Materia Select */}
                    <div>
                        <select
                            className="w-full h-10 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={selectedMateriaId}
                            onChange={handleMateriaChange}
                        >
                            <option value="all">Todas las Materias</option>
                            {materias.map(m => (
                                <option key={m.id} value={m.id}>{m.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Catedra Select - Dependent */}
                    <div>
                        <select
                            className="w-full h-10 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                            value={selectedCatedraId}
                            onChange={(e) => setSelectedCatedraId(e.target.value)}
                            disabled={selectedMateriaId === 'all'}
                        >
                            <option value="all">Todas las Cátedras</option>
                            {filteredCatedras.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Role Select */}
                    <div>
                        <select
                            className="w-full h-10 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                        >
                            <option value="all">Todos los Roles</option>
                            <option value="Titular">Titulares</option>
                            <option value="Adjunto">Adjuntos</option>
                        </select>
                    </div>
                </div>
            </div>

            <Card className="shadow-xl border-slate-200 overflow-hidden rounded-2xl">
                <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg text-slate-700 flex items-center gap-2">
                        {currentContextLabel}
                        <span className="text-slate-400 text-sm font-normal">({displayedProfessors.length})</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                        {displayedProfessors.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                No se encontraron docentes con estos filtros.
                            </div>
                        ) : (
                            displayedProfessors.map((p, index) => {
                                let stats = p.stats?.general || { elo: 1200, matches: 0, wins: 0 };
                                if (selectedCatedraId !== 'all') {
                                    stats = p.stats?.byCatedra?.[selectedCatedraId] || { elo: 1200, matches: 0, wins: 0 };
                                } else if (selectedMateriaId !== 'all') {
                                    stats = p.stats?.bySubject?.[selectedMateriaId] || { elo: 1200, matches: 0, wins: 0 };
                                }

                                return (
                                    <div
                                        key={p.id}
                                        className={cn(
                                            "p-4 sm:p-5 hover:bg-slate-50 transition-colors",
                                            index < 3 && !hasActiveFilters ? "bg-gradient-to-r from-white" : "",
                                            !hasActiveFilters && index === 0 ? "to-amber-50" : !hasActiveFilters && index === 1 ? "to-slate-50" : !hasActiveFilters && index === 2 ? "to-orange-50" : ""
                                        )}
                                    >
                                        <div className="flex items-start gap-3 sm:gap-4">
                                            {/* Rank */}
                                            <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full font-bold text-sm shadow-sm mt-1">
                                                <span className={cn("w-9 h-9 rounded-full flex items-center justify-center", getRankBadgeClasses(index))}>
                                                    {index + 1}
                                                </span>
                                            </div>

                                            {/* Avatar */}
                                            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-100 flex items-center justify-center text-base sm:text-lg font-bold text-slate-500 border border-slate-200 shadow-sm flex-shrink-0">
                                                {p.name.charAt(0)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                {/* Info */}
                                                <h3 className="font-bold text-slate-800 truncate flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                                    {p.name}
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 uppercase tracking-wider font-bold">
                                                        {p.role}
                                                    </span>
                                                </h3>
                                                <p className="text-xs text-slate-500 truncate mt-1">
                                                    {p.subjects.slice(0, 3).join(', ')}
                                                </p>

                                                {/* Stats */}
                                                <div className="mt-3 flex items-end justify-between gap-3">
                                                    <div className="text-left">
                                                        <div className="text-[11px] text-slate-400 uppercase font-bold">Votos</div>
                                                        <div className="text-sm font-semibold text-slate-600">{stats.matches}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xl sm:text-2xl font-black text-indigo-600 leading-none">
                                                            {stats.elo}
                                                        </div>
                                                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                                            ELO
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
