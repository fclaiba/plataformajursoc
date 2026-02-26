import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea'; // Assuming we have this, if not I'll use simple textarea or create it
import { StarRating } from './StarRating';
import { Award, CheckCircle } from 'lucide-react';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => void;
    targetName: string;
}

export function ReviewModal({ isOpen, onClose, onSubmit, targetName }: ReviewModalProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = () => {
        if (rating === 0) return;
        onSubmit(rating, comment);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto bg-gradient-to-br from-yellow-100 to-amber-100 p-4 rounded-full mb-4 shadow-inner border border-yellow-200">
                        <Award className="h-10 w-10 text-yellow-600" />
                    </div>
                    <DialogTitle className="text-center text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-amber-600">
                        ¡Felicitaciones!
                    </DialogTitle>
                    <DialogDescription className="text-center text-base mt-2">
                        Has completado tu permuta con <span className="font-bold text-slate-800">{targetName}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    <div className="text-center space-y-3">
                        <p className="text-sm font-medium text-slate-600">¿Cómo fue tu experiencia?</p>
                        <div className="flex justify-center">
                            <StarRating rating={rating} onRatingChange={setRating} size="lg" />
                        </div>
                        <p className="text-xs text-slate-400 min-h-[1rem]">
                            {rating === 5 && "¡Excelente! Altamente recomendado."}
                            {rating === 4 && "Muy buena experiencia."}
                            {rating === 3 && "Buena, cumplió con lo acordado."}
                            {rating === 2 && "Podría haber sido mejor."}
                            {rating === 1 && "Mala experiencia."}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Dejar un comentario (opcional)</label>
                        <Textarea
                            className="w-full min-h-[100px] bg-slate-50 focus:bg-white transition-all resize-none"
                            placeholder="Contanos más detalles..."
                            value={comment}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} className="text-slate-400">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={rating === 0}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg shadow-yellow-500/20 border-0"
                    >
                        <CheckCircle className="mr-2 h-4 w-4" /> Enviar Reseña
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
