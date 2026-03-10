import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRequests } from '../../context/RequestsContext';
import { useNotifications } from '../../context/NotificationsContext';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { PrioritySelector } from '../../components/requests/PrioritySelector';
import { CommissionCard } from '../../components/dashboard/CommissionCard';
import type { Comision } from '../../types';
import { ArrowLeft, ArrowRight, Check, BookOpen, MapPin, ListOrdered, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCatalog } from '../../context/CatalogContext';

// Steps: 0 = Select Origin, 1 = Select Destination(s), 2 = Confirm
type WizardStep = 0 | 1 | 2;

export function CreateRequestPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const { materias, comisiones } = useCatalog();
    const { addRequest } = useRequests();
    const { addNotification } = useNotifications();

    const [step, setStep] = useState<WizardStep>(0);

    // State for selections
    const [originMateriaId, setOriginMateriaId] = useState<string>(searchParams.get('materia') || '');
    // originCommissionId removed as it is now derived
    const [destinationCommissions, setDestinationCommissions] = useState<Comision[]>([]);

    // Derived Data
    const mySubjects = (user?.enrollments || [])
        .map((enrollment) => materias.find((materia) => materia.id === enrollment.materiaId))
        .filter((materia): materia is NonNullable<typeof materia> => Boolean(materia));
    const selectedMateria = materias.find(m => m.id === originMateriaId);

    const currentCommission = useMemo(() => {
        if (!originMateriaId || !user) return null;
        const myEnrollment = user.enrollments?.find((enrollment) => enrollment.materiaId === originMateriaId);
        if (!myEnrollment) return null;
        return comisiones.find((commission) => commission.id === myEnrollment.comisionId) || null;
    }, [originMateriaId, user, comisiones]);

    const availableDestinations = useMemo(() => {
        if (!originMateriaId || !currentCommission) return [];
        return comisiones.filter(c =>
            c.materiaId === originMateriaId &&
            c.id !== currentCommission.id &&
            !destinationCommissions.find(selected => selected.id === c.id)
        );
    }, [originMateriaId, currentCommission, destinationCommissions, comisiones]);


    // Handlers
    const handleSelectOrigin = (materiaId: string) => {
        setOriginMateriaId(materiaId);
        setDestinationCommissions([]); // Clear previous selections
        // currentCommission is automatically derived from originMateriaId
    };

    const toggleDestination = (comision: Comision) => {
        if (destinationCommissions.find(c => c.id === comision.id)) {
            setDestinationCommissions(prev => prev.filter(c => c.id !== comision.id));
        } else {
            if (destinationCommissions.length >= 3) {
                addNotification('Límite alcanzado', 'Máximo 3 opciones de destino', 'warning');
                return;
            }
            setDestinationCommissions(prev => [...prev, comision]);
        }
    };

    const handleNext = () => {
        if (step === 0 && originMateriaId) setStep(1);
        else if (step === 1 && destinationCommissions.length > 0) setStep(2);
    };

    const handleBack = () => {
        if (step > 0) setStep(prev => (prev - 1) as WizardStep);
        else navigate('/dashboard');
    };

    const handleSubmit = async () => {
        if (!user || !originMateriaId) {
            console.error("Missing user or originMateriaId");
            return;
        }

        const commissionToSwap = currentCommission?.id;
        if (!commissionToSwap) {
            addNotification('Error', 'No se pudo identificar tu comisión actual.', 'error');
            return;
        }

        await addRequest({
            userId: user.id,
            materiaId: originMateriaId,
            comisionOrigenId: commissionToSwap,
            comisionesDestino: destinationCommissions.map((c, index) => ({
                comisionId: c.id,
                prioridad: index + 1
            }))
        });

        addNotification('¡Solicitud Creada!', 'Tu pedido de permuta ya está visible para otros alumnos.', 'success');
        navigate('/dashboard');
    };

    const stepInfo = [
        { title: 'Elegí Materia', icon: BookOpen },
        { title: 'Seleccioná Destinos', icon: MapPin },
        { title: 'Confirmar', icon: ListOrdered },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-36 md:pb-40">
            {/* Header & Steps */}
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <Button variant="ghost" onClick={handleBack} className="self-start text-slate-500 hover:text-slate-900 group">
                        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Volver
                    </Button>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-secondary-700 text-center">
                        Nueva Solicitud de Permuta
                    </h1>
                    <div className="w-24 hidden md:block"></div>
                </div>

                {/* Refined Progress Bar */}
                <div className="max-w-3xl mx-auto px-4">
                    <div className="relative">
                        {/* Background Line */}
                        <div className="absolute top-5 left-0 w-full h-1 bg-slate-200 -z-10 rounded-full" />

                        {/* Active Line - Dynamic width calculation */}
                        <div
                            className="absolute top-5 left-0 h-1 bg-gradient-to-r from-primary-500 to-secondary-500 -z-10 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${(step / (stepInfo.length - 1)) * 100}%` }}
                        />

                        <div className="flex justify-between w-full">
                            {stepInfo.map((s, index) => {
                                const Icon = s.icon;
                                const isActive = index <= step;

                                return (
                                    <div key={index} className="flex flex-col items-center group cursor-default">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 z-10 border-4",
                                            isActive
                                                ? "bg-white border-primary-500 text-primary-600 shadow-lg shadow-primary-500/30 scale-110"
                                                : "bg-slate-100 border-slate-200 text-slate-400"
                                        )}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <span className={cn(
                                            "text-xs font-bold mt-3 transition-colors duration-300 uppercase tracking-wide",
                                            isActive ? "text-primary-700" : "text-slate-400"
                                        )}>
                                            {s.title}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 min-h-[400px]">
                {/* STEP 1: ORIGIN */}
                {step === 0 && (
                    <div className="animate-in slide-in-from-right-10 duration-500 fade-in">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-800">¿Qué cursada querés cambiar?</h2>
                            <p className="text-slate-500 mt-2">Seleccioná una de las materias en las que estás inscripto actualmente.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                            {mySubjects.map(materia => (
                                <button
                                    key={materia.id}
                                    onClick={() => handleSelectOrigin(materia.id)}
                                    className={cn(
                                        "relative group flex flex-col items-start p-6 rounded-2xl border-2 transition-all duration-300 text-left outline-none",
                                        originMateriaId === materia.id
                                            ? "border-primary-500 bg-primary-50/50 shadow-xl shadow-primary-500/10 scale-[1.02]"
                                            : "border-slate-100 bg-white hover:border-primary-200 hover:shadow-lg"
                                    )}
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors",
                                        originMateriaId === materia.id ? "bg-primary-100 text-primary-600" : "bg-slate-100 text-slate-500 group-hover:bg-primary-50 group-hover:text-primary-600"
                                    )}>
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <h3 className={cn(
                                        "text-lg font-bold mb-2 transition-colors",
                                        originMateriaId === materia.id ? "text-primary-900" : "text-slate-700 group-hover:text-primary-900"
                                    )}>
                                        {materia.nombre}
                                    </h3>
                                    <div className="mt-auto pt-4 flex items-center text-xs font-medium text-slate-500 w-full border-t border-slate-200/50">
                                        <span className="bg-slate-200/50 px-2 py-1 rounded mr-2">Cátedra I</span>
                                        <span className="truncate">Comisión 1 (Mañana)</span>
                                    </div>

                                    {originMateriaId === materia.id && (
                                        <div className="absolute top-4 right-4 text-primary-500 animate-in zoom-in duration-300">
                                            <Check className="w-6 h-6 bg-primary-100 rounded-full p-1" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 2: DESTINATION */}
                {step === 1 && (
                    <div className="animate-in slide-in-from-right-10 duration-500 fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                                        Elegí tus destinos ideales
                                        <span className="ml-3 px-3 py-1 bg-primary-100 text-primary-700 text-xs font-bold rounded-full uppercase tracking-wider">
                                            {destinationCommissions.length}/3
                                        </span>
                                    </h2>
                                    <p className="text-slate-500 mt-2">Seleccioná los horarios a los que te gustaría cambiarte.</p>
                                </div>

                                <div className="grid gap-4">
                                    {availableDestinations.length > 0 ? (
                                        availableDestinations.map(comision => (
                                            <CommissionCard
                                                key={comision.id}
                                                comision={comision}
                                                selected={!!destinationCommissions.find(c => c.id === comision.id)}
                                                onClick={() => toggleDestination(comision)}
                                            />
                                        ))
                                    ) : (
                                        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                                            <p className="text-slate-500">No hay otras comisiones disponibles para esta materia.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="lg:col-span-1">
                                <div className="sticky top-24 space-y-4">
                                    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl shadow-slate-900/20">
                                        <h3 className="font-bold text-lg mb-2 flex items-center">
                                            <ListOrdered className="w-5 h-5 mr-2 text-primary-400" />
                                            Prioridades
                                        </h3>
                                        <p className="text-slate-400 text-sm mb-6">
                                            Si hay multiple coincidencia, usaremos este orden. Arrastrá para organizar.
                                        </p>

                                        <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10 min-h-[150px]">
                                            <PrioritySelector
                                                selectedCommissions={destinationCommissions}
                                                onRemove={(id) => setDestinationCommissions(prev => prev.filter(c => c.id !== id))}
                                                onReorder={setDestinationCommissions}
                                            />
                                            {destinationCommissions.length === 0 && (
                                                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-8">
                                                    <MapPin className="w-8 h-8 mb-2 opacity-50" />
                                                    <p className="text-xs">Seleccioná comisiones del listado para armar tu ranking.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-primary-50 p-4 rounded-xl border border-primary-100 flex items-start">
                                        <Sparkles className="w-5 h-5 text-primary-600 mr-3 mt-0.5 shrink-0" />
                                        <div className="text-sm text-primary-800">
                                            <span className="font-bold block mb-1">Tip de Experto</span>
                                            Seleccioná al menos 2 opciones para aumentar tus chances de Match en un 80%.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: CONFIRM */}
                {step === 2 && (
                    <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-500 fade-in">
                        <Card className="border-t-4 border-t-emerald-500 shadow-2xl">
                            <CardHeader className="text-center pb-8 pt-10">
                                <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600 shadow-inner">
                                    <Check className="w-10 h-10" />
                                </div>
                                <CardTitle className="text-3xl font-bold text-slate-900">Confirmar Solicitud</CardTitle>
                                <p className="text-slate-500 text-lg mt-2">Estás a un paso de publicar tu permuta.</p>
                            </CardHeader>
                            <CardContent className="space-y-8 pb-10 px-8 md:px-16">
                                <div className="flex flex-col md:flex-row gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 items-center">
                                    <div className="flex-1 text-center md:text-left">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Estás ofreciendo</h4>
                                        <p className="font-bold text-xl text-slate-900">{selectedMateria?.nombre}</p>
                                        <p className="text-slate-500">Comisión #{currentCommission?.numero}</p>
                                    </div>
                                    <ArrowRight className="text-slate-300 w-8 h-8 hidden md:block" />
                                    <ArrowRight className="text-slate-300 w-8 h-8 md:hidden rotate-90" />
                                    <div className="flex-1 text-center md:text-right">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Buscas cambiar a</h4>
                                        <div className="font-bold text-xl text-primary-700">{destinationCommissions.length} Comisiones</div>
                                        <p className="text-slate-500">Seleccionadas</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center">
                                        <ListOrdered className="w-4 h-4 mr-2 text-primary-500" />
                                        Orden de Prioridad Confirmado
                                    </h4>
                                    <div className="space-y-3">
                                        {destinationCommissions.map((c, i) => (
                                            <div key={c.id} className="flex items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
                                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-500 to-teal-500" />
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-emerald-700 mr-4 text-sm shrink-0 shadow-inner group-hover:bg-emerald-100 transition-colors">
                                                    {i + 1}º
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-bold text-slate-800">Comisión {c.numero}</span>
                                                        <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-right font-medium">
                                                            {c.horarios[0].dia} {c.horarios[0].inicio}hs
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 truncate">{c.catedraId} - {c.profesor}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] rounded-t-2xl">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div className="text-sm text-slate-500 hidden md:block">
                        Paso {step + 1} de 3
                    </div>
                    <div className="flex w-full md:w-auto gap-4">
                        {step === 0 && (
                            <Button variant="outline" onClick={() => navigate('/dashboard')} className="flex-1 md:flex-none">
                                Cancelar
                            </Button>
                        )}

                        {step < 2 ? (
                            <Button
                                onClick={handleNext}
                                size="lg"
                                className="flex-1 md:flex-none min-w-[200px] shadow-xl shadow-primary-500/20"
                                disabled={(step === 0 && !originMateriaId) || (step === 1 && destinationCommissions.length === 0)}
                            >
                                Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <div className="flex gap-4 w-full">
                                <Button variant="outline" onClick={handleBack} className="flex-1 md:flex-none">Atrás</Button>
                                <Button onClick={handleSubmit} size="lg" className="flex-1 md:flex-none min-w-[200px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/30">
                                    Confirmar Solicitud <Check className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
