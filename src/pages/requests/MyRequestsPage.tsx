import { useState } from 'react';
import { useQuery } from 'convex/react';
import { useRequests } from '../../context/RequestsContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BadgeCheck, Clock, XCircle, CheckCircle, ArrowRightLeft, User, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { ChatWindow } from '../../components/chat/ChatWindow';
import { ReviewModal } from '../../components/reviews/ReviewModal';
import { StarRating } from '../../components/reviews/StarRating';
import { ContactStudentModal } from '../../components/requests/ContactStudentModal';
import type { ExchangeRequest } from '../../types';
import { useCatalog } from '../../context/CatalogContext';
import { reviewsListByReviewer } from '../../convex/functions';

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
        user?.id ? { reviewerUserId: user.id } : "skip",
    ) || [];
    const reviewedRequestIds = new Set(reviewerReviews.map((row) => row.requestId));

    const handleContact = (request: ExchangeRequest) => {
        const matchedRequest = requests.find((r) => r.id === request.matchedRequestId);
        if (!matchedRequest?.userId) {
            addNotification('Aún sin contraparte', 'Esta solicitud todavía no tiene usuario emparejado.', 'warning');
            return;
        }
        setSelectedPeer({ id: matchedRequest.userId, name: `Estudiante ${matchedRequest.userId.slice(0, 6)}` });
        setSelectedRequest(request);
        setIsContactModalOpen(true);
    };

    const handleChat = (request: ExchangeRequest) => {
        const matchedRequest = requests.find((r) => r.id === request.matchedRequestId);
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
        const matchedRequest = requests.find((request) => request.id === selectedRequest.matchedRequestId);
        const targetUserId = matchedRequest?.userId || selectedPeer?.id;
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

                <div />
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
                                                            <div className="grid grid-cols-2 gap-2 w-full">
                                                                <Button
                                                                    onClick={() => handleChat(req)}
                                                                    className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 border-0"
                                                                >
                                                                    <MessageSquare className="w-4 h-4 mr-2" /> Chatear
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleContact(req)}
                                                                    variant="outline"
                                                                    className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                                                >
                                                                    <User className="w-4 h-4 mr-2" /> Contactar
                                                                </Button>
                                                            </div>
                                                            <Button
                                                                onClick={() => {
                                                                    const matchedRequest = requests.find((request) => request.id === req.matchedRequestId);
                                                                    handleViewProfile(matchedRequest?.userId);
                                                                }}
                                                                variant="outline"
                                                                className="w-full mt-2 border-slate-200 text-slate-700 hover:bg-slate-50"
                                                            >
                                                                <User className="w-4 h-4 mr-2" /> Ver perfil
                                                            </Button>
                                                            <Button
                                                                onClick={() => void finalizeRequest(req.id)}
                                                                className="w-full mt-2 bg-emerald-700 hover:bg-emerald-800 text-white"
                                                            >
                                                                <CheckCircle className="w-4 h-4 mr-2" /> Confirmar Intercambio
                                                            </Button>
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
                                                    {reviewedRequestIds.has(req.id) ? (
                                                        <Button
                                                            disabled
                                                            className="w-full bg-emerald-600/90 text-white border-0 cursor-not-allowed"
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-2" /> Reseña enviada
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            onClick={() => {
                                                                const matchedRequest = requests.find((request) => request.id === req.matchedRequestId);
                                                                if (matchedRequest?.userId) {
                                                                    setSelectedPeer({ id: matchedRequest.userId, name: `Estudiante ${matchedRequest.userId.slice(0, 6)}` });
                                                                }
                                                                setSelectedRequest(req);
                                                                setIsReviewOpen(true);
                                                            }}
                                                            className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 border-0"
                                                        >
                                                            <StarRating rating={1} size="sm" className="mr-2 text-indigo-200" /> Calificar Experiencia
                                                        </Button>
                                                    )}
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
                                                    <Button variant="outline" size="sm" className="w-full text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50" onClick={() => void cancelRequest(req.id)}>
                                                        Cancelar Solicitud
                                                    </Button>
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
