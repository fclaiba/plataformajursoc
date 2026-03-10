import { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useRequests } from '../../context/RequestsContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Send, X, User, Image as ImageIcon, Loader2, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';
import { validateFileSignature, scanFile } from '../../utils/security';

interface ChatWindowProps {
    receiverName: string;
    receiverUserId?: string;
    requestId: string;
    onClose: () => void;
}

export function ChatWindow({ receiverName, receiverUserId, requestId, onClose }: ChatWindowProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { sendMessage, getMessagesByRequest, subscribeToRequest, markAsRead } = useChat();
    const { finalizeRequest } = useRequests();
    const [newMessage, setNewMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messages = getMessagesByRequest(requestId);

    useEffect(() => {
        subscribeToRequest(requestId);
    }, [requestId, subscribeToRequest]);

    const handleEndExchange = async () => {
        await finalizeRequest(requestId);
        onClose();
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isUploading]);

    useEffect(() => {
        if (messages.length === 0) return;
        markAsRead(messages[messages.length - 1].id);
    }, [messages, markAsRead]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim()) return;
        try {
            await sendMessage(newMessage, requestId);
            setNewMessage('');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'No se pudo enviar el mensaje.';
            setUploadError(message);
            setTimeout(() => setUploadError(null), 4000);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadError(null);

        try {
            // 1. Validate Signature
            const isValidSignature = await validateFileSignature(file);
            if (!isValidSignature) {
                throw new Error('Archivo no válido (Firma incorrecta)');
            }

            // 2. Scan for Virus
            const scanResult = await scanFile(file);
            if (scanResult === 'infected') {
                throw new Error('Amenaza detectada: Archivo bloqueado por CyberGuard™');
            }

            // 3. Send
            await sendMessage('', requestId, file);

        } catch (err: any) {
            setUploadError(err.message || 'Error al subir imagen');
            setTimeout(() => setUploadError(null), 4000);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="bg-primary-600 p-4 text-white flex justify-between items-center shadow-md z-10">
                <div className="flex items-center">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3 backdrop-blur-sm">
                        <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">{receiverName}</h3>
                        <div className="flex items-center">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full mr-1.5 animate-pulse"></span>
                            <span className="text-[10px] opacity-90">En línea</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => receiverUserId && navigate(`/users/${receiverUserId}`)}
                        disabled={!receiverUserId}
                        className="text-xs bg-white/10 hover:bg-white/20 text-white h-7 px-3 font-bold shadow-sm"
                        title="Ver reputación del usuario"
                    >
                        <User className="w-4 h-4 mr-1.5" /> Perfil
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleEndExchange}
                        className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white h-7 px-3 font-bold shadow-sm"
                        title="Confirmar que el intercambio fue exitoso"
                    >
                        Confirmar Permuta
                    </Button>
                    <Button size="icon" variant="ghost" onClick={onClose} className="hover:bg-white/20 text-white h-8 w-8 rounded-full">
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.length === 0 && (
                    <div className="text-center text-slate-400 text-sm py-10">
                        <p>Comienza la conversación con {receiverName}.</p>
                        <p className="text-xs mt-2">¡Saluda para coordinar el intercambio!</p>
                    </div>
                )}

                {messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                        <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                            <div className={cn(
                                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                                isMe
                                    ? "bg-primary-600 text-white rounded-tr-none"
                                    : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                            )}>
                                {msg.type === 'image' && msg.mediaUrl && (
                                    <div className="mb-2 rounded-lg overflow-hidden border border-black/10">
                                        <img src={msg.mediaUrl} alt="Adjunto" className="max-w-full h-auto max-h-48 object-cover" />
                                    </div>
                                )}
                                {msg.content && <p>{msg.content}</p>}
                                <span className={cn(
                                    "text-[10px] block text-right mt-1 opacity-70",
                                    isMe ? "text-primary-100" : "text-slate-400"
                                )}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}

                {isUploading && (
                    <div className="flex justify-end">
                        <div className="bg-slate-100 rounded-2xl rounded-tr-none px-4 py-3 text-sm text-slate-500 flex items-center shadow-sm border border-slate-200">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin text-primary-500" />
                            Escaneando seguridad...
                        </div>
                    </div>
                )}

                {uploadError && (
                    <div className="flex justify-center animate-in mb-2">
                        <div className="bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-xs flex items-center shadow-sm border border-red-100">
                            <ShieldAlert className="w-3 h-3 mr-1.5" />
                            {uploadError}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100">
                <div className="flex gap-2 items-center">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/jpeg,image/png"
                        onChange={handleFileSelect}
                    />
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-slate-400 hover:text-primary-600 hover:bg-slate-50"
                        onClick={() => fileInputRef.current?.click()}
                        title="Adjuntar Imagen"
                    >
                        <ImageIcon className="w-5 h-5" />
                    </Button>

                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="rounded-full bg-slate-50 border-slate-200 focus-visible:ring-primary-500"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className={cn(
                            "rounded-full transition-all duration-300",
                            newMessage.trim() ? "bg-primary-600 hover:bg-primary-700 scale-100" : "bg-slate-200 text-slate-400 scale-90"
                        )}
                        disabled={!newMessage.trim()}
                    >
                        <Send className="w-4 h-4 ml-0.5" />
                    </Button>
                </div>
            </form>
        </div>
    );
}
