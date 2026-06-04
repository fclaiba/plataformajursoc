import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { CommissionCard } from '../../components/dashboard/CommissionCard';
import { PrioritySelector } from '../../components/requests/PrioritySelector';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { useCatalog } from '../../context/CatalogContext';
import { requestsListVisibleByUser, requestsEdit } from '../../convex/functions';
import type { Comision } from '../../types';

export function EditRequestPage() {
    const navigate = useNavigate();
    const { requestId } = useParams<{ requestId: string }>();
    const { user } = useAuth();
    const { materias, comisiones } = useCatalog();
    const { addNotification } = useNotifications();
    const editMutation = useMutation(requestsEdit);

    const allRequests = useQuery(
        requestsListVisibleByUser,
        user?.id ? { userId: user.id } : "skip",
    ) || [];

    const request = allRequests.find((r: any) => String(r._id) === requestId);
    const materia = request ? materias.find((m) => m.id === request.subjectExternalId) : null;

    const currentOriginCommission = request
        ? comisiones.find((c) => c.id === request.commissionOriginExternalId)
        : null;

    // Parse existing destinations as initial state
    const [selectedDestinations, setSelectedDestinations] = useState<Comision[]>([]);

    // Initialize once data loads
    const initialized = useMemo(() => {
        if (!request || selectedDestinations.length > 0) return true;
        const existing = (request.destinationsExternal || [])
            .map((d: any) => comisiones.find((c) => c.id === d.commissionId))
            .filter(Boolean) as Comision[];
        if (existing.length > 0) {
            setSelectedDestinations(existing);
        }
        return true;
    }, [request, comisiones, selectedDestinations.length]);

    void initialized; // suppress unused warning

    const availableDestinations = useMemo(() => {
        if (!request) return [];
        return comisiones.filter(
            (c) =>
                c.materiaId === request.subjectExternalId &&
                c.id !== request.commissionOriginExternalId &&
                !selectedDestinations.find((s) => s.id === c.id),
        );
    }, [request, comisiones, selectedDestinations]);

    const toggleDestination = (comision: Comision) => {
        setSelectedDestinations((prev) =>
            prev.find((c) => c.id === comision.id)
                ? prev.filter((c) => c.id !== comision.id)
                : [...prev, comision],
        );
    };

    const removeDestination = (id: string) => {
        setSelectedDestinations((prev) => prev.filter((c) => c.id !== id));
    };

    const handleSave = async () => {
        if (!requestId || selectedDestinations.length === 0) return;
        try {
            const dests = selectedDestinations.map((c, i) => ({
                commissionId: c.id,
                priority: i + 1,
            }));
            await editMutation({
                requestId: requestId as any,
                destinations: dests as any,
            });
            addNotification('Solicitud actualizada', 'Los destinos fueron modificados correctamente.', 'success');
            navigate('/my-requests');
        } catch (err: any) {
            addNotification('Error', err.message || 'No se pudo editar la solicitud.', 'error');
        }
    };

    if (!request) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <p className="text-slate-500">Cargando solicitud...</p>
            </div>
        );
    }

    if (request.status !== 'PENDING') {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <p className="text-slate-700 font-semibold">Solo se pueden editar solicitudes pendientes.</p>
                <Button variant="outline" onClick={() => navigate('/my-requests')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-28 animate-in fade-in duration-700">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => navigate('/my-requests')}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">Editar Solicitud</h1>
                    <p className="text-sm text-slate-500">
                        {materia?.nombre} — Comisión {currentOriginCommission?.numero}
                    </p>
                </div>
            </div>

            {/* Current selections */}
            {selectedDestinations.length > 0 && (
                <Card className="border-primary-200 bg-primary-50/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base text-slate-800">
                            Destinos seleccionados ({selectedDestinations.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {selectedDestinations.map((dest, i) => (
                            <div key={dest.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                                <div>
                                    <span className="text-xs font-bold text-primary-600 mr-2">#{i + 1}</span>
                                    <span className="font-medium text-slate-800">Comisión {dest.numero}</span>
                                    <span className="text-sm text-slate-500 ml-2">— {dest.profesor}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600" onClick={() => removeDestination(dest.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                        <PrioritySelector
                            selectedCommissions={selectedDestinations}
                            onRemove={removeDestination}
                            onReorder={setSelectedDestinations}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Available destinations */}
            <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Agregar destinos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableDestinations.map((comision) => (
                        <div key={comision.id} className="cursor-pointer" onClick={() => toggleDestination(comision)}>
                            <CommissionCard
                                comision={comision}
                                onClick={() => {}}
                                selected={false}
                            />
                        </div>
                    ))}
                    {availableDestinations.length === 0 && (
                        <p className="text-sm text-slate-400 col-span-2 text-center py-8">
                            No hay más comisiones disponibles para agregar.
                        </p>
                    )}
                </div>
            </div>

            {/* Save */}
            <div className="flex gap-3 pt-4">
                <Button
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white shadow-lg"
                    disabled={selectedDestinations.length === 0}
                    onClick={handleSave}
                >
                    <Save className="w-4 h-4 mr-2" /> Guardar Cambios
                </Button>
                <Button variant="outline" onClick={() => navigate('/my-requests')}>
                    Cancelar
                </Button>
            </div>
        </div>
    );
}
