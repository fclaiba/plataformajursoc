import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { LogOut, Bell, Trophy, BookOpen, LayoutDashboard, ArrowRightLeft, Library, Network, Shield } from 'lucide-react';
import { Button } from '../ui/button';

export function Navbar() {
    const { user, logout, isAuthenticated, isAdmin } = useAuth();
    const { unreadCount } = useNotifications();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="sticky top-0 z-50 w-full glass border-b-0 rounded-b-2xl mx-auto max-w-7xl mt-4">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-2 group">
                            <div className="bg-primary-600 p-1.5 rounded-lg text-white group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary-500/30">
                                <BookOpen className="h-6 w-6" />
                            </div>
                            <span className="font-bold text-lg sm:text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-secondary-700 group-hover:from-primary-600 group-hover:to-secondary-600 transition-all">
                                Plataforma JurSoc
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center space-x-4">
                        {isAuthenticated ? (
                            <>
                                <Link to="/dashboard" id="tour-dashboard" className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all" title="Dashboard">
                                    <LayoutDashboard className="h-5 w-5" />
                                </Link>

                                <Link to="/mis-materias" id="tour-mis-materias" className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all" title="Mis Materias">
                                    <Library className="h-5 w-5" />
                                </Link>

                                <Link to="/my-requests" id="tour-mis-solicitudes" className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all" title="Mis Solicitudes">
                                    <ArrowRightLeft className="h-5 w-5" />
                                </Link>

                                <Link to="/mapa-correlativas" id="tour-correlativas" className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all" title="Mapa de Correlativas">
                                    <Network className="h-5 w-5" />
                                </Link>

                                <Link to="/ranking/vote" id="tour-ranking" className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-all" title="Ranking Docente">
                                    <Trophy className="h-5 w-5" />
                                </Link>
                                {isAdmin && (
                                    <Link to="/admin" className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-all" title="Admin">
                                        <Shield className="h-5 w-5" />
                                    </Link>
                                )}

                                <Link to="/notifications" id="tour-notifications" className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all relative" title="Notificaciones">
                                    <Bell className="h-5 w-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-sm">
                                            {unreadCount}
                                        </span>
                                    )}
                                </Link>

                                <div className="flex items-center gap-2 sm:gap-3 ml-1.5 sm:ml-2 pl-3 sm:pl-4 border-l border-gray-200 shrink-0">
                                    <Link
                                        to="/profile"
                                        className="hidden md:flex items-center gap-2.5 bg-white/70 border border-slate-200 rounded-xl px-2.5 lg:px-3 py-1.5 min-w-[160px] lg:min-w-[190px] max-w-[220px] hover:border-primary-200 hover:bg-primary-50/60 transition-all"
                                    >
                                        <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                            {(user?.name?.charAt(0) || 'U').toUpperCase()}
                                        </div>
                                        <div className="min-w-0 text-left leading-tight">
                                            <div className="text-sm font-bold text-gray-700 truncate">
                                                {user?.name || 'Usuario'}
                                            </div>
                                            <div className="text-[11px] text-primary-500 font-medium truncate">
                                                {isAdmin ? 'Admin' : 'Estudiante'}
                                            </div>
                                        </div>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleLogout}
                                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full w-9 h-9 p-0 flex-shrink-0"
                                    >
                                        <LogOut className="h-4 w-4" />
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center space-x-4 animate-in fade-in slide-in-from-right-5 duration-700">
                                <Link to="/login" className="text-sm font-semibold text-gray-600 hover:text-primary-600 transition-colors">Ingresar</Link>
                                <Link to="/register">
                                    <Button size="sm" className="shadow-lg shadow-primary-500/20">Registrarse</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
