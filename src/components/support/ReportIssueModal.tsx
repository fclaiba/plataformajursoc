import { useState } from 'react';
import { useMutation } from 'convex/react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { supportCreateReport } from '../../convex/functions';
import { useNotifications } from '../../context/NotificationsContext';

interface ReportIssueModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ReportIssueModal({ isOpen, onClose }: ReportIssueModalProps) {
    const createReport = useMutation(supportCreateReport);
    const { addNotification } = useNotifications();
    const [category, setCategory] = useState<'bug' | 'abuse' | 'support'>('support');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        setSubmitting(true);
        setError(null);
        try {
            await createReport({ category, message });
            setMessage('');
            addNotification('Reporte enviado', 'Tu reporte fue recibido por soporte.', 'success', 'system');
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo enviar el reporte.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reportar un problema</DialogTitle>
                    <DialogDescription>
                        Enviá un reporte corto para soporte, bug o conducta inapropiada.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <select
                        className="w-full h-10 rounded-lg border border-slate-200 px-3"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as 'bug' | 'abuse' | 'support')}
                    >
                        <option value="support">Soporte</option>
                        <option value="bug">Bug</option>
                        <option value="abuse">Abuso</option>
                    </select>
                    <Textarea
                        placeholder="Contanos qué pasó..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    {error ? <p className="text-sm text-red-600">{error}</p> : null}
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={submitting || !message.trim()}>
                        {submitting ? 'Enviando...' : 'Enviar reporte'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
