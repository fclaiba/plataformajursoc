import { useState } from 'react';
import { useRequests } from '../../context/RequestsContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BadgeCheck, Clock, XCircle, CheckCircle, ArrowRightLeft, User, RefreshCw, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MATERIAS } from '../../data/mock';
import { cn } from '../../lib/utils';
import { ChatWindow } from '../../components/chat/ChatWindow';
import { ReviewModal } from '../../components/reviews/ReviewModal';
import { StarRating } from '../../components/reviews/StarRating';
import { ContactStudentModal } from '../../components/requests/ContactStudentModal';
import type { ExchangeRequest } from '../../types';

export function MyRequestsPage() {
    const { user } = useAuth(); // Need user ID
    const { myRequests, createMatchingRequest, cancelRequest, finalizeRequest } = useRequests();
    const { addNotification } = useNotifications();
    const navigate = useNavigate();
    const [selectedRequest, setSelectedRequest] = useState<ExchangeRequest | null>(null);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    // Mock matched user (consistent with ContactModal)
    const MATCHED_USER = {
        id: 'user-martina',
        name: 'Martina Rodríguez'
    };


    const handleSimulateMatch = () => {
        const pending = myRequests.find(r => r.status === 'PENDING');
        if (pending) {
            createMatchingRequest(pending.id);
        }
    };

    const handleContact = (request: ExchangeRequest) => {
        setSelectedRequest(request);
        setIsContactModalOpen(true);
    };

    const handleChat = (request: ExchangeRequest) => {
        setSelectedRequest(request);
        setIsChatOpen(true);
    };

    const handleEndExchange = () => {
        setIsChatOpen(false);
        setIsReviewOpen(true);
    };

    const handleSubmitReview = (rating: number, comment: string) => {
        console.log({ rating, comment });
        setIsReviewOpen(false);
        addNotification('¡Permuta Completada!', 'Gracias por calificar tu experiencia.', 'success');
        // Here we would strictly update the status in context
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

    const getMateriaName = (id: string) => MATERIAS.find(m => m.id === id)?.nombre || id;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
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

                {/* Only show button if there are pending requests */}
                {myRequests.some(r => r.status === 'PENDING') && (
                    <Button onClick={handleSimulateMatch} variant="outline" size="sm" className="bg-white/80 hover:bg-white shadow-sm border-primary-200 text-primary-700 hover:text-primary-800">
                        <RefreshCw className="mr-2 h-4 w-4" /> Simular Match (Demo)
                    </Button>
                )}
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
                                                                onClick={() => finalizeRequest(req.id)}
                                                                className="w-full mt-2 bg-emerald-700 hover:bg-emerald-800 text-white"
                                                            >
                                                                <CheckCircle className="w-4 h-4 mr-2" /> Confirmar Intercambio
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            ) : req.status === 'CONFIRMED' ? (
                                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center space-y-3 animate-in fade-in zoom-in">
                                                    <p className="text-blue-800 font-bold flex items-center justify-center">
                                                        <CheckCircle className="w-5 h-5 mr-2" />
                                                        ¡Permuta Completada!
                                                    </p>
                                                    <p className="text-xs text-blue-600">Ambos confirmaron el intercambio.</p>
                                                    <Button
                                                        onClick={() => {
                                                            setSelectedRequest(req);
                                                            setIsReviewOpen(true);
                                                        }}
                                                        className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 border-0"
                                                    >
                                                        <StarRating rating={1} size="sm" className="mr-2 text-blue-200" /> Calificar Experiencia
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="text-center py-2">
                                                    <p className="text-sm text-slate-400 italic mb-4">
                                                        Estamos buscando compañeros compatibles con tu solicitud...
                                                    </p>
                                                    <Button variant="outline" size="sm" className="w-full text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50" onClick={() => cancelRequest(req.id)}>
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
                    if (selectedRequest) finalizeRequest(selectedRequest.id);
                    setIsContactModalOpen(false);
                }}
                request={selectedRequest}
            />

            {selectedRequest && isChatOpen && (
                <ChatWindow
                    receiverId={MATCHED_USER.id}
                    receiverName={MATCHED_USER.name}
                    requestId={selectedRequest.id}
                    onClose={() => setIsChatOpen(false)}
                    onEndExchange={handleEndExchange}
                />
            )}

            <ReviewModal
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
                onSubmit={(rating, comment) => handleSubmitReview(rating, comment)}
                targetName={MATCHED_USER.name}
            />
        </div>
    );
}
