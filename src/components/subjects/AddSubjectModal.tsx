import { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCatalog } from '../../context/CatalogContext';
import { Button } from '../ui/button';
import { X, Search, Check, BookOpen, GraduationCap, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Input } from '../ui/input';

interface AddSubjectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddSubjectModal({ isOpen, onClose }: AddSubjectModalProps) {
    const { addEnrollment, user } = useAuth();
    const { materias, catedras, comisiones } = useCatalog();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMateriaId, setSelectedMateriaId] = useState<string | null>(null);
    const [selectedCatedraId, setSelectedCatedraId] = useState<string | null>(null);
    const [selectedComisionId, setSelectedComisionId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Filtered materias
    const filteredMaterias = useMemo(() => {
        if (!searchQuery) return materias;
        return materias.filter(m =>
            m.nombre.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, materias]);

    // Available Catedras for selected Materia
    const availableCatedras = useMemo(() => {
        if (!selectedMateriaId) return [];
        return catedras.filter(c => c.materiaId === selectedMateriaId);
    }, [selectedMateriaId, catedras]);

    // Available Comisiones for selected Catedra
    const availableComisiones = useMemo(() => {
        if (!selectedCatedraId) return [];
        return comisiones.filter(c => c.catedraId === selectedCatedraId);
    }, [selectedCatedraId, comisiones]);

    const handleNext = () => {
        if (step === 1 && selectedMateriaId) setStep(2);
        else if (step === 2 && selectedCatedraId) setStep(3);
    };

    const handleBack = () => {
        if (step === 2) setStep(1);
        else if (step === 3) setStep(2);
    };

    const handleSubmit = async () => {
        if (selectedMateriaId && selectedCatedraId && selectedComisionId) {
            try {
                await addEnrollment(selectedMateriaId, selectedCatedraId, selectedComisionId);
                onClose();
                // Reset state
                setStep(1);
                setSelectedMateriaId(null);
                setSelectedCatedraId(null);
                setSelectedComisionId(null);
                setSearchQuery('');
            } catch (err: any) {
                setError(err.message);
                setTimeout(() => setError(null), 3000);
            }
        }
    };

    const isAlreadyEnrolled = (materiaId: string) => {
        return user?.enrollments?.some(e => e.materiaId === materiaId);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="font-bold text-lg text-slate-800">Inscribirse en Materia</h2>
                        <div className="flex space-x-2 mt-1">
                            <div className={cn("h-1 w-8 rounded-full transition-colors", step >= 1 ? "bg-primary-500" : "bg-slate-200")} />
                            <div className={cn("h-1 w-8 rounded-full transition-colors", step >= 2 ? "bg-primary-500" : "bg-slate-200")} />
                            <div className={cn("h-1 w-8 rounded-full transition-colors", step >= 3 ? "bg-primary-500" : "bg-slate-200")} />
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-200/50">
                        <X className="w-5 h-5 text-slate-500" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Step 1: Select Materia */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Buscar materia..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-primary-500"
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                {filteredMaterias.map((m) => {
                                    const enrolled = isAlreadyEnrolled(m.id);
                                    return (
                                        <div
                                            key={m.id}
                                            onClick={() => !enrolled && setSelectedMateriaId(m.id)}
                                            className={cn(
                                                "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                                                selectedMateriaId === m.id
                                                    ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500"
                                                    : enrolled
                                                        ? "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
                                                        : "border-slate-200 hover:border-primary-300 hover:bg-slate-50"
                                            )}
                                        >
                                            <div className="flex items-center">
                                                <div className={cn("p-2 rounded-lg mr-3", selectedMateriaId === m.id ? "bg-white" : "bg-slate-100")}>
                                                    <BookOpen className={cn("w-4 h-4", selectedMateriaId === m.id ? "text-primary-600" : "text-slate-500")} />
                                                </div>
                                                <div>
                                                    <p className={cn("font-medium text-sm", selectedMateriaId === m.id ? "text-primary-900" : "text-slate-700")}>{m.nombre}</p>
                                                    <p className="text-xs text-slate-400">Año {m.anio}</p>
                                                </div>
                                            </div>
                                            {selectedMateriaId === m.id && <Check className="w-5 h-5 text-primary-600" />}
                                            {enrolled && <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Inscripto</span>}
                                        </div>
                                    );
                                })}
                                {filteredMaterias.length === 0 && (
                                    <p className="text-center text-slate-400 text-sm py-8">No se encontraron materias</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Select Catedra */}
                    {step === 2 && (
                        <div className="space-y-4 animate-in slide-in-from-right-10 fade-in duration-300">
                            <h3 className="font-medium text-slate-700">Selecciona la Cátedra</h3>
                            <div className="space-y-2">
                                {availableCatedras.map((c) => (
                                    <div
                                        key={c.id}
                                        onClick={() => setSelectedCatedraId(c.id)}
                                        className={cn(
                                            "p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                                            selectedCatedraId === c.id
                                                ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500"
                                                : "border-slate-200 hover:border-primary-300 hover:bg-slate-50"
                                        )}
                                    >
                                        <div className="flex items-center">
                                            <div className={cn("p-2 rounded-lg mr-3", selectedCatedraId === c.id ? "bg-white" : "bg-slate-100")}>
                                                <GraduationCap className={cn("w-5 h-5", selectedCatedraId === c.id ? "text-primary-600" : "text-slate-500")} />
                                            </div>
                                            <span className={cn("font-medium", selectedCatedraId === c.id ? "text-primary-900" : "text-slate-700")}>{c.nombre}</span>
                                        </div>
                                        {selectedCatedraId === c.id && <Check className="w-5 h-5 text-primary-600" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Select Comision */}
                    {step === 3 && (
                        <div className="space-y-4 animate-in slide-in-from-right-10 fade-in duration-300">
                            <h3 className="font-medium text-slate-700">Selecciona tu Comisión Actual</h3>
                            <div className="space-y-2">
                                {availableComisiones.map((c) => (
                                    <div
                                        key={c.id}
                                        onClick={() => setSelectedComisionId(c.id)}
                                        className={cn(
                                            "p-4 rounded-xl border transition-all cursor-pointer",
                                            selectedComisionId === c.id
                                                ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500"
                                                : "border-slate-200 hover:border-primary-300 hover:bg-slate-50"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center">
                                                <div className={cn("p-1.5 rounded-lg mr-2", selectedComisionId === c.id ? "bg-white" : "bg-slate-100")}>
                                                    <Users className={cn("w-4 h-4", selectedComisionId === c.id ? "text-primary-600" : "text-slate-500")} />
                                                </div>
                                                <span className={cn("font-bold", selectedComisionId === c.id ? "text-primary-900" : "text-slate-800")}>
                                                    Comisión {c.numero}
                                                </span>
                                            </div>
                                            {selectedComisionId === c.id && <Check className="w-5 h-5 text-primary-600" />}
                                        </div>

                                        <div className="pl-9 space-y-1">
                                            <p className="text-sm text-slate-600"><span className="font-medium">Prof:</span> {c.profesor}</p>
                                            <div className="flex flex-wrap gap-1">
                                                {c.horarios.map((h, idx) => (
                                                    <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                                        {h.dia} {h.inicio}-{h.fin}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {error && (
                                <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 animate-pulse">
                                    {error}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between">
                    {step > 1 ? (
                        <Button variant="outline" onClick={handleBack}>
                            Atrás
                        </Button>
                    ) : (
                        <div /> // Spacer
                    )}

                    {step < 3 ? (
                        <Button
                            onClick={handleNext}
                            disabled={(step === 1 && !selectedMateriaId) || (step === 2 && !selectedCatedraId)}
                            className="bg-primary-600 hover:bg-primary-700"
                        >
                            Siguiente
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={!selectedComisionId}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                        >
                            Confirmar Inscripción
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
