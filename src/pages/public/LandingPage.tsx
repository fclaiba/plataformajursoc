import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { ArrowRight, Search, ArrowRightLeft, Bell, Star, Shield, Users } from 'lucide-react';

export function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                <div className="absolute top-0 left-1/2 -ml-[40rem] w-[80rem] h-[30rem] bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-full blur-3xl -z-10 animate-blob" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold text-primary-600 ring-1 ring-inset ring-primary-600/20 bg-primary-50 mb-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <span className="flex h-2 w-2 rounded-full bg-primary-600 mr-2 animate-pulse"></span>
                        Nuevo: Sistema de Matches Inteligentes
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-150">
                        Gestioná tus horarios <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">sin complicaciones.</span>
                    </h1>

                    <p className="mt-4 text-xl text-slate-600 max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-300">
                        La plataforma oficial para estudiantes de la Facultad de Ciencias Jurídicas y Sociales. Encontrá comisiones, solicitá permutas y mejorá tu cursada.
                    </p>

                    <div className="flex justify-center gap-4 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-500">
                        <Button size="lg" onClick={() => navigate('/register')} className="text-lg px-8 py-6 shadow-xl shadow-primary-500/20 hover:shadow-primary-500/40 hover:-translate-y-1 transition-all duration-300">
                            Comenzar Ahora <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <Button variant="outline" size="lg" onClick={() => navigate('/login')} className="text-lg px-8 py-6 bg-white/50 backdrop-blur-sm border-slate-200 hover:bg-white hover:text-primary-700">
                            Iniciar Sesión
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-white/50 backdrop-blur-sm relative border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Todo lo que necesitás para tu cursada</h2>
                        <p className="mt-4 text-lg text-slate-500">Herramientas diseñadas específicamente para la vida universitaria.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {/* Feature 1 */}
                        <div className="group relative p-8 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-300 hover:-translate-y-1">
                            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-primary-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Search className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Buscador Inteligente</h3>
                            <p className="text-slate-500 leading-relaxed">
                                Filtrá comisiones por materia, cátedra, profesor y horario. Encontrá vacantes disponibles en tiempo real.
                            </p>
                        </div>

                        {/* Feature 2 (Main) */}
                        <div className="group relative p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl shadow-slate-900/20 text-white transform md:-translate-y-4 hover:scale-[1.02] transition-all duration-300">
                            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-primary-500/20 to-transparent opacity-20" />
                            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-6 border border-white/20">
                                <ArrowRightLeft className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Permutas Simplificadas</h3>
                            <p className="text-slate-300 leading-relaxed">
                                Publicá tu solicitud de cambio y dejá que nuestro sistema encuentre el compañero ideal automáticamente.
                            </p>
                            <div className="mt-6 flex items-center text-sm font-medium text-primary-200">
                                <Star className="w-4 h-4 mr-2 text-yellow-400 fill-yellow-400" /> Sistema de Prioridades
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="group relative p-8 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-secondary-500/10 transition-all duration-300 hover:-translate-y-1">
                            <div className="absolute top-0 left-0 -ml-8 -mt-8 w-32 h-32 bg-secondary-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="w-14 h-14 bg-secondary-100 rounded-2xl flex items-center justify-center text-secondary-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Bell className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Notificaciones al Instante</h3>
                            <p className="text-slate-500 leading-relaxed">
                                Recibí alertas cuando encontremos un match para tu permuta o cuando se liberen cupos en tus materias favoritas.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section className="py-16 border-t border-slate-200/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-8">Confianza y Seguridad</p>
                    <div className="flex flex-wrap justify-center gap-12 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex items-center space-x-2">
                            <Shield className="w-6 h-6 text-emerald-600" />
                            <span className="font-bold text-lg text-slate-700">Datos Protegidos</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Users className="w-6 h-6 text-blue-600" />
                            <span className="font-bold text-lg text-slate-700">Solo Estudiantes Regulares</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-serif">U</div>
                            <span className="font-bold text-lg text-slate-700">UNLP Oficial</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary-600">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                    <div className="absolute -top-[20rem] -right-[20rem] w-[50rem] h-[50rem] bg-secondary-500/30 rounded-full blur-3xl" />
                </div>
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">¿Listo para optimizar tu cursada?</h2>
                    <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">Unite a miles de estudiantes que ya están gestionando sus horarios de forma inteligente.</p>
                    <Button size="lg" onClick={() => navigate('/register')} className="bg-white text-primary-700 hover:bg-slate-50 border-0 text-lg px-10 py-7 shadow-2xl">
                        Registrate Gratis
                    </Button>
                </div>
            </section>
        </div>
    );
}
