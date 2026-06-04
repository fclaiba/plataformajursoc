import React, { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { BookOpen } from 'lucide-react';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!email || !password) {
            setError('Por favor complete todos los campos');
            setIsLoading(false);
            return;
        }

        const success = await login(email, password);
        if (!success) {
            setError('Credenciales inválidas o cuenta inexistente.');
        }
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] animate-in fade-in duration-700">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-600 shadow-lg shadow-primary-500/30 mb-4 animate-in slide-in-from-bottom-5 duration-700">
                        <BookOpen className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Bienvenido de nuevo</h2>
                    <p className="text-slate-500">
                        Ingresa a tu cuenta para gestionar tus permutas
                    </p>
                </div>

                <div className="glass-card p-8 rounded-2xl animate-in slide-in-from-bottom-5 duration-700 delay-150 relative overflow-hidden">
                    {/* Decorative blob inside card */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl"></div>

                    <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <Input
                                id="email"
                                type="email"
                                label="Email Institucional"
                                placeholder="juan@estudiante.unlp.edu.ar"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                error={error && !email ? 'Campo requerido' : ''}
                                disabled={isLoading}
                            />
                            <Input
                                id="password"
                                type="password"
                                label="Contraseña"
                                placeholder="••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="text-right">
                            <button
                                type="button"
                                onClick={() => navigate('/forgot-password')}
                                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 font-medium animate-in fade-in">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4 pt-2">
                            <Button type="submit" className="w-full text-lg shadow-primary-500/25" isLoading={isLoading} size="lg">
                                Ingresar
                            </Button>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white/50 backdrop-blur-sm text-slate-500">O</span>
                                </div>
                            </div>
                            <Button type="button" variant="ghost" className="w-full text-slate-600" onClick={() => navigate('/register')}>
                                Crear una cuenta nueva
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
