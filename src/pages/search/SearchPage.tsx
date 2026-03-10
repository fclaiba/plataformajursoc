import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { CommissionCard } from '../../components/dashboard/CommissionCard';
import { Filter, X, Search as SearchIcon, SlidersHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from '../../components/ui/card';
import { useCatalog } from '../../context/CatalogContext';

export function SearchPage() {
    const { comisiones, materias, catedras } = useCatalog();
    const [params] = useSearchParams();
    const initialMateriaId = params.get('materia');

    const [selectedMateria, setSelectedMateria] = useState<string>(initialMateriaId || '');
    const [selectedCatedra, setSelectedCatedra] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>(''); // manana, tarde, noche
    const [showFilters, setShowFilters] = useState(false);

    // Derived state for available options
    const availableCatedras = useMemo(() => {
        if (!selectedMateria) return [];
        return catedras.filter(c => c.materiaId === selectedMateria);
    }, [selectedMateria, catedras]);

    // Filter Logic
    const filteredCommissions = useMemo(() => {
        let result = comisiones;

        if (selectedMateria) {
            result = result.filter(c => c.materiaId === selectedMateria);
        }

        if (selectedCatedra) {
            result = result.filter(c => c.catedraId === selectedCatedra);
        }

        if (selectedTime) {
            result = result.filter(c => {
                // Simple logic: Morning < 13hs, Afternoon < 18hs, Evening >= 18hs
                const firstSchedule = c.horarios[0];
                const startHour = parseInt(firstSchedule.inicio.split(':')[0]);

                if (selectedTime === 'manana') return startHour < 13;
                if (selectedTime === 'tarde') return startHour >= 13 && startHour < 18;
                if (selectedTime === 'noche') return startHour >= 18;
                return true;
            });
        }

        return result;
    }, [selectedMateria, selectedCatedra, selectedTime, comisiones]);

    const clearFilters = () => {
        setSelectedMateria('');
        setSelectedCatedra('');
        setSelectedTime('');
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 animate-in fade-in duration-700">
            {/* Mobile Filter Toggle */}
            <div className="md:hidden flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold text-slate-900">Buscar</h1>
                <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                    <SlidersHorizontal className="w-4 h-4 mr-2" /> Filtros
                </Button>
            </div>

            {/* Sidebar Filters */}
            <aside className={cn(
                "fixed inset-0 z-40 bg-white/95 backdrop-blur-xl p-6 transition-transform duration-300 md:relative md:transform-none md:w-72 md:bg-transparent md:backdrop-blur-none md:p-0 md:block",
                showFilters ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="md:sticky md:top-24 space-y-6">
                    <div className="flex items-center justify-between md:hidden mb-6">
                        <h2 className="text-xl font-bold">Filtros</h2>
                        <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <Card className="border-0 shadow-lg md:shadow-sm bg-white/50 backdrop-blur-md">
                        <div className="p-5 space-y-6">
                            <div className="flex items-center space-x-2 text-primary-700 mb-2">
                                <Filter className="w-5 h-5" />
                                <h3 className="font-bold text-lg">Filtrar por</h3>
                            </div>

                            {/* Materia Filter */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">Materia</label>
                                <div className="relative">
                                    <select
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 appearance-none transition-all"
                                        value={selectedMateria}
                                        onChange={(e) => {
                                            setSelectedMateria(e.target.value);
                                            setSelectedCatedra('');
                                        }}
                                    >
                                        <option value="">Todas las materias</option>
                                        {materias.map(m => (
                                            <option key={m.id} value={m.id}>{m.nombre}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                    </div>
                                </div>
                            </div>

                            {/* Catedra Filter */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">Cátedra</label>
                                <div className="relative">
                                    <select
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 appearance-none transition-all disabled:opacity-50"
                                        value={selectedCatedra}
                                        onChange={(e) => setSelectedCatedra(e.target.value)}
                                        disabled={!selectedMateria}
                                    >
                                        <option value="">Todas las cátedras</option>
                                        {availableCatedras.map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                    </div>
                                </div>
                            </div>

                            {/* Time Filter */}
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-slate-700">Turno preferido</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {[
                                        { v: 'manana', l: 'Mañana (07-13hs)' },
                                        { v: 'tarde', l: 'Tarde (13-18hs)' },
                                        { v: 'noche', l: 'Noche (18-22hs)' }
                                    ].map((opt) => (
                                        <label key={opt.v} className={cn(
                                            "flex items-center p-3 rounded-lg border cursor-pointer transition-all",
                                            selectedTime === opt.v
                                                ? "bg-primary-50 border-primary-500 text-primary-700 shadow-sm"
                                                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                                        )}>
                                            <input
                                                type="radio"
                                                name="time"
                                                value={opt.v}
                                                checked={selectedTime === opt.v}
                                                onChange={(e) => setSelectedTime(e.target.value)}
                                                className="hidden"
                                            />
                                            <span className="text-sm font-medium">{opt.l}</span>
                                            {selectedTime === opt.v && <div className="ml-auto w-2 h-2 rounded-full bg-primary-500" />}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            {(selectedMateria || selectedCatedra || selectedTime) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={clearFilters}
                                >
                                    <X className="w-4 h-4 mr-2" /> Limpiar filtros
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>
            </aside>

            {/* Main Results */}
            <main className="flex-1 min-w-0">
                <div className="mb-6 flex items-end justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Comisiones</h2>
                        <p className="text-slate-500 flex items-center mt-1">
                            <SearchIcon className="w-4 h-4 mr-1" />
                            Mostrando {filteredCommissions.length} resultados
                        </p>
                    </div>
                </div>

                {filteredCommissions.length > 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 animate-in slide-in-from-bottom-5 duration-700">
                        {filteredCommissions.map((comision, i) => (
                            <div
                                key={comision.id}
                                style={{ animationDelay: `${i * 50}ms` }}
                                className="animate-in slide-in-from-bottom-5 fade-in cursor-pointer"
                                onClick={() => {
                                    // Simple navigation to start the flow
                                    // Could be enhanced to pre-select subject if we parse comision.materiaId
                                    // But sticking to simple entry for now as requested "function completely"
                                    window.location.href = `/requests/new?materia=${comision.materiaId}`;
                                }}
                            >
                                <CommissionCard
                                    comision={comision}
                                    onClick={() => { }} // Pass empty specific handler to rely on parent div or card behavior
                                    selected={false}
                                />
                                <div className="mt-2 text-right">
                                    <Button size="sm" variant="ghost" className="text-primary-600 p-0 h-auto font-semibold hover:bg-transparent hover:underline hover:text-primary-700">
                                        Solicitar Permuta &rarr;
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                            <SearchIcon className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Sin resultados</h3>
                        <p className="text-slate-500 max-w-sm text-center mb-6">No encontramos comisiones que coincidan con tus filtros. Probá borrando algunos.</p>
                        <Button variant="outline" onClick={clearFilters}>Limpiar búsqueda</Button>
                    </div>
                )}
            </main>
        </div>
    );
}
