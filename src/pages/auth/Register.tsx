import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';

export function Register() {
    const navigate = useNavigate();
    const { register, isAuthenticated } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (formData.password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        setIsSubmitting(true);
        const result = await register(formData.name, formData.email, formData.password);
        setIsSubmitting(false);

        if (!result.success) {
            setError(result.message || 'No se pudo crear la cuenta.');
            return;
        }

    };

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Crear Cuenta</CardTitle>
                    <CardDescription>Regístrese para comenzar a usar Plataforma JurSoc.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <Input
                            id="name"
                            label="Nombre Completo"
                            placeholder="Juan Perez"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                        />
                        <Input
                            id="email"
                            type="email"
                            label="Email"
                            placeholder="juan@estudiante.unlp.edu.ar"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                        />
                        <Input
                            id="password"
                            type="password"
                            label="Contraseña"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                        />
                        <Input
                            id="confirmPassword"
                            type="password"
                            label="Confirmar Contraseña"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                        />
                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                {error}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-2">
                        <Button type="submit" className="w-full" isLoading={isSubmitting}>
                            Registrarse
                        </Button>
                        <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/login')} disabled={isSubmitting}>
                            ¿Ya tienes cuenta? Inicia Sesión
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
