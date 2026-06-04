import { useState } from 'react';
import { useQuery } from 'convex/react';
import { useRequests } from '../../context/RequestsContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BadgeCheck, Clock, XCircle, CheckCircle, ArrowRightLeft, User, MessageSquare, Pencil, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { ChatWindow } from '../../components/chat/ChatWindow';
import { ReviewModal } from '../../components/reviews/ReviewModal';
import { StarRating } from '../../components/reviews/StarRating';
import { ContactStudentModal } from '../../components/requests/ContactStudentModal';
import type { ExchangeRequest } from '../../types';
import { useCatalog } from '../../context/CatalogContext';
import { reviewsListByReviewer } from '../../convex/functions';
import { downloadCSV } from '../../lib/exportCsv';

export function MyRequestsPage() {
    const { user, submitReview } = useAuth(); // Need user ID
    const { materias } = useCatalog();
    const { requests, myRequests, cancelRequest, finalizeRequest } = useRequests();
    const { addNotification } = useNotifications();
    const navigate = useNavigate();
    const [selectedRequest, setSelectedRequest] = useState<ExchangeRequest | null>(null);
    const [selectedPeer, setSelectedPeer] = useState<{ id: string; name: string } | null>(null);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const reviewerReviews = useQuery(
        reviewsListByReviewer,
        user?.id ? {} : "skip",
    ) || [];

    const handleContact = (request: ExchangeRequest, counterpartId?: string) => {
        const idToFind = counterpartId || request.giveToRequestId || request.receiveFromRequestId;
        const matchedRequest = requests.find((r) => r.id === idToFind);
        if (!matchedRequest?.userId) {
            addNotification('Aún sin contraparte', 'Esta solicitud todavía no tiene usuario emparejado.', 'warning');
            return;
        }
        setSelectedPeer({ id: matchedRequest.userId, name: `Estudiante ${matchedRequest.userId.slice(0, 6)}` });
        setSelectedRequest(request);
        setIsContactModalOpen(true);
    };

    const handleChat = (request: ExchangeRequest, counterpartId?: string) => {
        const idToFind = counterpartId || request.giveToRequestId || request.receiveFromRequestId;
        const matchedRequest = requests.find((r) => r.id === idToFind);
        if (!matchedRequest?.userId) {
            addNotification('Aún sin contraparte', 'Esta solicitud todavía no tiene usuario emparejado.', 'warning');
            return;
        }
        setSelectedPeer({ id: matchedRequest.userId, name: `Estudiante ${matchedRequest.userId.slice(0, 6)}` });
        setSelectedRequest(request);
        setIsChatOpen(true);
    };

    const handleViewProfile = (userId?: string) => {
        if (!userId) {
            addNotification('Perfil no disponible', 'No se pudo identificar al otro usuario.', 'warning');
            return;
        }
        navigate(`/users/${userId}`);
    };

    const handleSubmitReview = async (rating: number, comment: string) => {
        if (!selectedRequest) return;
        const targetUserId = selectedPeer?.id;
        if (!targetUserId) {
            addNotification('No se pudo enviar la reseña', 'No se encontró la contraparte de la permuta.', 'warning');
            return;
        }
        try {
            await submitReview(targetUserId, rating, comment, selectedRequest.id);
            setIsReviewOpen(false);
            addNotification('¡Reseña enviada!', 'Gracias por calificar tu experiencia.', 'success');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'No se pudo enviar la reseña.';
            addNotification('No se pudo enviar la reseña', message, 'warning');
        }
    };



    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'MATCHED':
                return (
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-sm border border-emerald-200">
                        <BadgeCheck className="w-4 h-4 mr-1.5" /> MATCH (Confirmar)
                    </span>
                );
            case 'CONFIRMED':
                return (
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-sm border border-blue-200">
                        <CheckCircle className="w-4 h-4 mr-1.5" /> Confirmada
                    </span>
                );
            case 'COMPLETED':
                return (
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-sm border border-indigo-200">
                        <CheckCircle className="w-4 h-4 mr-1.5" /> Completada
                    </span>
                );
            case 'CANCELLED':
                return (
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-sm border border-red-200">
                        <XCircle className="w-4 h-4 mr-1.5" /> Cancelada
                    </span>
                );
            default:
                return (
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-sm border border-amber-200 animate-pulse">
                        <Clock className="w-4 h-4 mr-1.5" /> Buscando permuta...
                    </span>
                );
        }
    };

    const getMateriaName = (id: string) => materias.find(m => m.id === id)?.nombre || id;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 pb-28 sm:pb-32">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center text-slate-900">
                        <div className="bg-primary-100 p-2 rounded-xl mr-3 text-primary-600">
                            <ArrowRightLeft className="w-6 h-6" />
                        </div>
                        Mis Solicitudes
                    </h1>
                    <p className="text-slate-500 mt-2 ml-14">
                        Gestioná el estado de tus pedidos de cambio de comisión.
                    </p>
                </div>

                <div>
                    {myRequests.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const data = myRequests.map((r) => ({
                                    materia: getMateriaName(r.materiaId),
                                    comisionOrigen: r.comisionOrigenId,
                                    destinos: r.comisionesDestino.map((d) => d.comisionId).join('; '),
                                    estado: r.status,
                                    creada: new Date(r.createdAt).toLocaleDateString('es-AR'),
                                }));
                                downloadCSV(data, 'mis-permutas', [
                                    { key: 'materia', label: 'Materia' },
                                    { key: 'comisionOrigen', label: 'Comisión Origen' },
                                    { key: 'destinos', label: 'Destinos' },
                                    { key: 'estado', label: 'Estado' },
                                    { key: 'creada', label: 'Fecha' },
                                ]);
                            }}
                        >
                            <Download className="w-4 h-4 mr-1" /> Exportar CSV
                        </Button>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                {myRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-200 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <ArrowRightLeft className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Sin solicitudes activas</h3>
                        <p className="text-slate-500 max-w-sm mb-6">¿Necesitás cambiar de horario? Creá una nueva solicitud para empezar.</p>
                        <Button onClick={() => navigate('/requests/new')} size="lg" className="shadow-lg shadow-primary-500/20">
                            Crear Nueva Permuta
                        </Button>
                    </div>
                ) : (
                    myRequests.map((req, i) => (
                        <div key={req.id} style={{ animationDelay: `${i * 150}ms` }} className="animate-in slide-in-from-bottom-5 fade-in">
                            <Card className={cn(
                                "overflow-hidden transition-all duration-300 hover:shadow-lg",
                                req.status === 'MATCHED' ? "border-emerald-500 shadow-md shadow-emerald-500/10" : ""
                            )}>
                                {req.status === 'MATCHED' && <div className="h-1 w-full bg-emerald-500" />}
                                <CardHeader className="pb-4 bg-slate-50/50 border-b border-slate-100">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                        <div>
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Materia</div>
                                            <CardTitle className="text-xl font-bold text-slate-900">{getMateriaName(req.materiaId)}</CardTitle>
                                            <div className="flex items-center mt-2 text-sm font-medium text-slate-600 bg-white px-2 py-1 rounded border border-slate-200 w-fit">
                                                <span className="text-slate-400 mr-2">Tu Comisión:</span>
                                                #{req.comisionOrigenId.replace('com-', '')}
                                            </div>
                                        </div>
                                        {getStatusBadge(req.status)}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="text-sm">
                                            <p className="font-bold text-slate-700 mb-3 flex items-center">
                                                <Clock className="w-4 h-4 mr-2 text-primary-500" />
                                                Destinos Solicitados
                                            </p>
                                            <div className="space-y-2">
                                                {req.comisionesDestino.map((d, i) => (
                                                    <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                                                        <span className="text-slate-600 font-medium">Comisión {d.comisionId.replace('com-', '')}</span>
                                                        <span className="text-xs font-bold bg-white text-primary-600 px-2 py-0.5 rounded border border-slate-100">Prioridad {d.prioridad}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                                            {req.status === 'MATCHED' ? (
                                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center space-y-3">
                                                    {(req.finalizedBy?.includes(user?.id || '')) ? (
                                                        <>
                                                            <p className="text-emerald-800 font-bold flex items-center justify-center animate-pulse">
                                                                <Clock className="w-5 h-5 mr-2" />
                                                                Esperando confirmación...
                                                            </p>
                                                            <p className="text-xs text-emerald-600">
                                                                Ya indicaste que finalizaste. Esperando que tu compañero confirme.
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="text-emerald-800 font-bold flex items-center justify-center">
                                                                <CheckCircle className="w-5 h-5 mr-2" />
                                                                ¡Match Encontrado!
                                                            </p>
                                                            <p className="text-xs text-emerald-600">Un compañero aceptó tu intercambio.</p>
                                                            {(() => {
                                                                const giveToRequest = requests.find((request) => request.id === req.giveToRequestId);
                                                                const receiveFromRequest = requests.find((request) => request.id === req.receiveFromRequestId);
                                                                const isThreeWay = giveToRequest && receiveFromRequest && giveToRequest.id !== receiveFromRequest.id;

                                                                const renderCounterpart = (r: ExchangeRequest, label: string) => (
                                                                    <div key={r.id} className="mt-4 p-3 bg-white/50 rounded-lg text-left">
                                                                        <p className="text-sm font-semibold text-emerald-900 mb-2">{label}</p>
                                                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                                                            <Button
                                                                                onClick={() => handleChat(req, r.id)}
                                                                                className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 border-0 text-xs py-1 h-8"
                                                                            >
                                                                                <MessageSquare className="w-3 h-3 mr-1" /> Chatear
                                                                            </Button>
                                                                            <Button
                                                                                onClick={() => handleContact(req, r.id)}
                                                                                variant="outline"
                                                                                className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs py-1 h-8"
                                                                            >
                                                                                <User className="w-3 h-3 mr-1" /> Contactar
                                                                            </Button>
                                                                        </div>
                                                                        <Button
                                                                            onClick={() => handleViewProfile(r.userId)}
                                                                            variant="outline"
                                                                            className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 text-xs py-1 h-8"
                                                                        >
                                                                            <User className="w-3 h-3 mr-1" /> Ver perfil
                                                                        </Button>
                                                                    </div>
                                                                );

                                                                return (
                                                                    <>
                                                                        {isThreeWay && <p className="text-xs font-semibold text-amber-700 bg-amber-100 p-1 rounded mb-2">🔄 Permuta Triangular</p>}
                                                                        {isThreeWay && giveToRequest ? renderCounterpart(giveToRequest, "Le cedes tu cupo a:") : null}
                                                                        {isThreeWay && receiveFromRequest ? renderCounterpart(receiveFromRequest, "Recibes el cupo de:") : null}
                                                                        {!isThreeWay && giveToRequest ? renderCounterpart(giveToRequest, "Compañero asignado:") : null}
                                                                        
                                                                        <Button
                                                                            onClick={() => void finalizeRequest(req.id)}
                                                                            className="w-full mt-4 bg-emerald-700 hover:bg-emerald-800 text-white shadow-xl"
                                                                        >
                                                                            <CheckCircle className="w-4 h-4 mr-2" /> Confirmar Permuta {isThreeWay ? "Triangular" : ""}
                                                                        </Button>
                                                                    </>
                                                                );
                                                            })()}
                                                        </>
                                                    )}
                                                </div>
                                            ) : req.status === 'COMPLETED' ? (
                                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center space-y-3 animate-in fade-in zoom-in">
                                                    <p className="text-indigo-800 font-bold flex items-center justify-center">
                                                        <CheckCircle className="w-5 h-5 mr-2" />
                                                        ¡Permuta Completada!
                                                    </p>
                                                    <p className="text-xs text-indigo-600">Ambos confirmaron el intercambio. Ya podés dejar tu reseña.</p>
                                                    {(() => {
                                                        const giveToRequest = requests.find((request) => request.id === req.giveToRequestId);
                                                        const receiveFromRequest = requests.find((request) => request.id === req.receiveFromRequestId);
                                                        const isThreeWay = giveToRequest && receiveFromRequest && giveToRequest.id !== receiveFromRequest.id;
                                                        
                                                        const renderReviewButton = (r: ExchangeRequest, label: string) => {
                                                            const hasReviewed = reviewerReviews.some(
                                                                (rev: any) => rev.requestId === req.id && rev.targetUserId === r.userId
                                                            );
                                                            if (hasReviewed) {
                                                                return (
                                                                    <div key={`review-done-${r.id}`} className="mt-2">
                                                                        <Button disabled className="w-full bg-emerald-600/90 text-white border-0 cursor-not-allowed">
                                                                            <CheckCircle className="w-4 h-4 mr-2" /> Reseña enviada
                                                                        </Button>
                                                                    </div>
                                                                );
                                                            }
                                                            return (
                                                                <div key={`review-${r.id}`} className="mt-2 text-left">
                                                                    <p className="text-xs font-semibold text-indigo-900 mb-1">{label}</p>
                                                                    <Button
                                                                        onClick={() => {
                                                                            setSelectedPeer({ id: r.userId, name: `Estudiante ${r.userId.slice(0, 6)}` });
                                                                            setSelectedRequest(req);
                                                                            setIsReviewOpen(true);
                                                                        }}
                                                                        className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 border-0 text-xs h-8"
                                                                    >
                                                                        <StarRating rating={1} size="sm" className="mr-2 text-indigo-200" /> Calificar
                                                                    </Button>
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <>
                                                                {isThreeWay && giveToRequest ? renderReviewButton(giveToRequest, "A quien cediste:") : null}
                                                                {isThreeWay && receiveFromRequest ? renderReviewButton(receiveFromRequest, "De quien recibiste:") : null}
                                                                {!isThreeWay && giveToRequest ? renderReviewButton(giveToRequest, "Tu compañero:") : null}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            ) : req.status === 'CONFIRMED' ? (
                                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center space-y-3 animate-in fade-in zoom-in">
                                                    <p className="text-blue-800 font-bold flex items-center justify-center">
                                                        <Clock className="w-5 h-5 mr-2" />
                                                        Confirmada
                                                    </p>
                                                    <p className="text-xs text-blue-600">Cierre automático en curso (se completa cuando ambas confirmaciones se sincronizan).</p>
                                                </div>
                                            ) : (
                                                <div className="text-center py-2">
                                                    <p className="text-sm text-slate-400 italic mb-4">
                                                        Estamos buscando compañeros compatibles con tu solicitud...
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="sm" className="flex-1 text-primary-600 hover:text-primary-700 hover:border-primary-200 hover:bg-primary-50" onClick={() => navigate(`/requests/edit/${req.id}`)}>
                                                            <Pencil className="w-4 h-4 mr-1" /> Editar
                                                        </Button>
                                                        <Button variant="outline" size="sm" className="flex-1 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50" onClick={() => void cancelRequest(req.id)}>
                                                            Cancelar
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ))
                )}
            </div>

            <ContactStudentModal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
                onStartChat={() => {
                    setIsContactModalOpen(false);
                    setIsChatOpen(true);
                }}
                onConfirm={() => {
                    if (selectedRequest) void finalizeRequest(selectedRequest.id);
                    setIsContactModalOpen(false);
                }}
                onViewProfile={() => handleViewProfile(selectedPeer?.id)}
                peerUserId={selectedPeer?.id}
                peerName={selectedPeer?.name || 'Estudiante'}
                request={selectedRequest}
            />

            {selectedRequest && isChatOpen && (
                <ChatWindow
                    receiverName={selectedPeer?.name || 'Estudiante'}
                    receiverUserId={selectedPeer?.id}
                    requestId={selectedRequest.id}
                    onClose={() => setIsChatOpen(false)}
                />
            )}

            <ReviewModal
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
                onSubmit={(rating, comment) => handleSubmitReview(rating, comment)}
                targetName={selectedPeer?.name || 'Estudiante'}
            />
        </div>
    );
}
