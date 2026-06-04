import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthActions } from '@convex-dev/auth/react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export function ForgotPasswordPage() {
    const navigate = useNavigate();
    const { signIn } = useAuthActions();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email.trim()) {
            setError('Ingresá tu email.');
            return;
        }
        setIsLoading(true);
        try {
            await signIn('password', {
                email: email.trim().toLowerCase(),
                flow: 'reset',
            });
            setSent(true);
        } catch (err: any) {
            const msg = err?.message || '';
            if (msg.includes('not configured') || msg.includes('email')) {
                setError('El envío de emails no está configurado todavía. Contactá al administrador.');
            } else {
                setError('No se pudo procesar la solicitud. Verificá el email e intentá de nuevo.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] animate-in fade-in duration-700">
                <div className="w-full max-w-md text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Revisá tu correo</h2>
                    <p className="text-slate-500">
                        Si la cuenta existe, vas a recibir un email con instrucciones para restablecer tu contraseña en <strong>{email}</strong>.
                    </p>
                    <Button variant="outline" onClick={() => navigate('/login')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver al login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] animate-in fade-in duration-700">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30 mb-4">
                        <Mail className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">¿Olvidaste tu contraseña?</h2>
                    <p className="text-slate-500">
                        Ingresá tu email y te enviaremos instrucciones para restablecerla.
                    </p>
                </div>

                <div className="glass-card p-8 rounded-2xl relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>

                    <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
                        <Input
                            id="reset-email"
                            type="email"
                            label="Email"
                            placeholder="juan@estudiante.unlp.edu.ar"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                        />

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 font-medium animate-in fade-in">
                                {error}
                            </div>
                        )}

                        <div className="space-y-3 pt-2">
                            <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
                                Enviar instrucciones
                            </Button>
                            <Button type="button" variant="ghost" className="w-full text-slate-600" onClick={() => navigate('/login')}>
                                <ArrowLeft className="w-4 h-4 mr-2" /> Volver al login
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
