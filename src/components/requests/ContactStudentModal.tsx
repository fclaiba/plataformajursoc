import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { User, Mail, Phone, ShieldCheck, MessageSquare, CheckCircle } from 'lucide-react';
import type { ExchangeRequest } from '../../types';

interface ContactStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartChat: () => void;
    onConfirm: () => void;
    request: ExchangeRequest | null;
}

export function ContactStudentModal({ isOpen, onClose, onStartChat, onConfirm, request }: ContactStudentModalProps) {
    if (!request) return null;

    // Mock data for the matched student - In a real app this would come from the match object
    const matchedStudent = {
        name: 'Martina Rodríguez',
        email: 'martina.rod@alumno.unlp.edu.ar',
        phone: '+5492215550123',
        legajo: '12345/6'
    };

    const handleWhatsApp = () => {
        const message = `Hola ${matchedStudent.name}! Vi que tenemos un Match en la Plataforma JurSoc para permutar en la materia...`;
        const url = `https://wa.me/${matchedStudent.phone.replace('+', '')}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const handleEmail = () => {
        const subject = 'Permuta Plataforma JurSoc - Match Confirmado';
        const body = `Hola ${matchedStudent.name},\n\nVi que hicimos match para permutar comisiones. ¿Te parece si coordinamos para realizar el cambio administrativo?`;
        window.open(`mailto:${matchedStudent.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto bg-emerald-100 p-3 rounded-full mb-4">
                        <User className="h-8 w-8 text-emerald-600" />
                    </div>
                    <DialogTitle className="text-center text-xl">¡Contactar a {matchedStudent.name}!</DialogTitle>
                    <DialogDescription className="text-center">
                        Han coincidido en sus preferencias de comisión.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                        <div className="flex items-center text-sm">
                            <ShieldCheck className="w-4 h-4 text-emerald-500 mr-2" />
                            <span className="text-slate-600 font-medium">Identidad Verificada (Legajo {matchedStudent.legajo})</span>
                        </div>
                        <div className="text-xs text-slate-400">
                            Recuerda que el cambio administrativo deben realizarlo personalmente en la facultad.
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <Button onClick={handleWhatsApp} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white border-0 shadow-lg shadow-[#25D366]/20">
                            <Phone className="mr-2 h-4 w-4" /> WhatsApp
                        </Button>
                        <div className="grid grid-cols-2 gap-3">
                            <Button onClick={onStartChat} className="w-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/20">
                                <MessageSquare className="mr-2 h-4 w-4" /> Chatear
                            </Button>
                            <Button onClick={handleEmail} variant="outline" className="w-full">
                                <Mail className="mr-2 h-4 w-4" /> Email
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
