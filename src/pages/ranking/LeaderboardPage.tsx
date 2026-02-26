import { useProfessors } from '../../context/ProfessorsContext';
import { MATERIAS, CATEDRAS } from '../../data/mock';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Trophy, Search, ArrowLeft, Filter, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState, useMemo } from 'react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router-dom';

export function LeaderboardPage() {
    const { professors } = useProfessors();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    // Filters State
    const [selectedMateriaId, setSelectedMateriaId] = useState<string>('all');
    const [selectedCatedraId, setSelectedCatedraId] = useState<string>('all');
    const [selectedRole, setSelectedRole] = useState<string>('all');

    // Derived Lists for Selects
    const filteredCatedras = useMemo(() => {
        if (selectedMateriaId === 'all') return [];
        return CATEDRAS.filter(c => c.materiaId === selectedMateriaId);
    }, [selectedMateriaId]);

    // Determine current ranking context label
    const currentContextLabel = useMemo(() => {
        if (selectedCatedraId !== 'all') {
            const cat = CATEDRAS.find(c => c.id === selectedCatedraId);
            return `Ranking Cátedra: ${cat?.nombre}`;
        }
        if (selectedMateriaId !== 'all') {
            const mat = MATERIAS.find(m => m.id === selectedMateriaId);
            return `Ranking Materia: ${mat?.nombre}`;
        }
        return 'Ranking General';
    }, [selectedMateriaId, selectedCatedraId]);

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
                    if (!p.roles.includes(selectedRole as any)) return false;
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

    return (
        <div className="max-w-5xl mx-auto py-8 animate-in fade-in duration-700 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/ranking/vote')} className="text-slate-500">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Votar
                    </Button>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-yellow-500 flex items-center">
                        <Trophy className="w-8 h-8 text-amber-500 mr-3" />
                        Ranking de Docentes
                    </h1>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 space-y-4">
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

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Buscar docente..."
                            className="pl-9 bg-slate-50 border-slate-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Materia Select */}
                    <div>
                        <select
                            className="w-full h-10 px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={selectedMateriaId}
                            onChange={handleMateriaChange}
                        >
                            <option value="all">Todas las Materias</option>
                            {MATERIAS.map(m => (
                                <option key={m.id} value={m.id}>{m.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Catedra Select - Dependent */}
                    <div>
                        <select
                            className="w-full h-10 px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
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
                            className="w-full h-10 px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

            <Card className="shadow-xl border-slate-200 overflow-hidden">
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
                                            "flex items-center p-4 hover:bg-slate-50 transition-colors",
                                            index < 3 && !hasActiveFilters ? "bg-gradient-to-r from-white" : "", // Highlight top 3 only on global list
                                            !hasActiveFilters && index === 0 ? "to-amber-50" : !hasActiveFilters && index === 1 ? "to-slate-50" : !hasActiveFilters && index === 2 ? "to-orange-50" : ""
                                        )}
                                    >
                                        {/* Rank */}
                                        <div className="w-16 flex-shrink-0 flex justify-center">
                                            {!hasActiveFilters && index === 0 ? (
                                                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-black shadow-sm ring-2 ring-amber-200">1</div>
                                            ) : !hasActiveFilters && index === 1 ? (
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">2</div>
                                            ) : !hasActiveFilters && index === 2 ? (
                                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold">3</div>
                                            ) : (
                                                <span className="text-slate-400 font-mono font-bold text-lg">#{index + 1}</span>
                                            )}
                                        </div>

                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-500 mr-4 border border-slate-200 shadow-sm flex-shrink-0">
                                            {p.name.charAt(0)}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0 mr-4">
                                            <h3 className="font-bold text-slate-800 truncate flex items-center gap-2">
                                                {p.name}
                                                {p.roles?.map(r => (
                                                    <span key={r} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 uppercase tracking-wider font-bold">
                                                        {r}
                                                    </span>
                                                ))}
                                            </h3>
                                            <p className="text-xs text-slate-500 truncate mt-1">
                                                {p.subjects.slice(0, 3).join(', ')}
                                            </p>
                                        </div>

                                        {/* Stats */}
                                        <div className="text-right flex items-center gap-6">
                                            <div className="hidden sm:block text-center w-20">
                                                <div className="text-xs text-slate-400 uppercase font-bold">Votos</div>
                                                <div className="text-sm font-semibold text-slate-600">{stats.matches}</div>
                                            </div>
                                            <div className="w-24 text-right">
                                                <div className="text-2xl font-black text-indigo-600 flex items-center justify-end gap-1">
                                                    {stats.elo}
                                                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider relative -top-1">ELO</span>
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
