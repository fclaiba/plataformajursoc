import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';

export function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulation
        alert('Registro simulado exitoso. Ahora puede iniciar sesión.');
        navigate('/login');
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
                        />
                        <Input
                            id="email"
                            type="email"
                            label="Email"
                            placeholder="juan@estudiante.unlp.edu.ar"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            id="password"
                            type="password"
                            label="Contraseña"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            id="confirmPassword"
                            type="password"
                            label="Confirmar Contraseña"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-2">
                        <Button type="submit" className="w-full">
                            Registrarse
                        </Button>
                        <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/login')}>
                            ¿Ya tienes cuenta? Inicia Sesión
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
