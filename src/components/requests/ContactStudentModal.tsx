import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { useQuery } from 'convex/react';
import { Button } from '../ui/button';
import { User, ShieldCheck, MessageSquare, CheckCircle } from 'lucide-react';
import type { ExchangeRequest } from '../../types';
import { usersGetVisibleProfile } from '../../convex/functions';

interface ContactStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartChat: () => void;
    onConfirm: () => void;
    onViewProfile: () => void;
    peerUserId?: string;
    peerName: string;
    request: ExchangeRequest | null;
}

export function ContactStudentModal({ isOpen, onClose, onStartChat, onConfirm, onViewProfile, peerUserId, peerName, request }: ContactStudentModalProps) {
    const visibleProfile = useQuery(
        usersGetVisibleProfile,
        request && peerUserId ? { targetUserId: peerUserId } : "skip",
    );
    if (!request) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto bg-emerald-100 p-3 rounded-full mb-4">
                        <User className="h-8 w-8 text-emerald-600" />
                    </div>
                    <DialogTitle className="text-center text-xl">Perfil y contacto de {peerName}</DialogTitle>
                    <DialogDescription className="text-center">
                        Ya hubo match entre ustedes. Podés chatear, revisar su reputación y luego confirmar la permuta.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                        <div className="flex items-center text-sm">
                            <ShieldCheck className="w-4 h-4 text-emerald-500 mr-2" />
                            <span className="text-slate-600 font-medium">Solo se muestra reputación y datos permitidos.</span>
                        </div>
                        <div className="text-sm text-slate-600">
                            Reputación: <span className="font-semibold">{(visibleProfile?.profile.reputation ?? 0).toFixed(1)}</span>
                            {' '}sobre {visibleProfile?.profile.reviewsCount ?? 0} reseñas.
                        </div>
                        <div className="text-xs text-slate-400">
                            El correo electrónico del otro usuario no se expone a terceros desde esta vista.
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <div className="grid grid-cols-2 gap-3">
                            <Button onClick={onStartChat} className="w-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/20">
                                <MessageSquare className="mr-2 h-4 w-4" /> Chatear
                            </Button>
                            <Button onClick={onViewProfile} variant="outline" className="w-full">
                                <User className="mr-2 h-4 w-4" /> Ver perfil
                            </Button>
                        </div>
                        <Button onClick={() => { onClose(); onConfirm(); }} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
                            <CheckCircle className="mr-2 h-4 w-4" /> Confirmar Permuta
                        </Button>
                    </div>
                </div>

                <DialogFooter className="sm:justify-center">
                    <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400">
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
