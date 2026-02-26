import { useTour } from '../../context/TourContext';
import { HelpCircle } from 'lucide-react';

export function Footer() {
    const { resetTour } = useTour();

    return (
        <footer className="bg-gray-100 border-t border-gray-200 mt-auto relative">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-center text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} Plataforma JurSoc - Facultad de Ciencias Jurídicas y Sociales UNLP
                </p>

                <button
                    onClick={resetTour}
                    className="flex items-center text-xs text-gray-400 hover:text-primary-600 transition-colors opacity-60 hover:opacity-100"
                    title="Reiniciar guía de usuario"
                >
                    <HelpCircle className="w-3 h-3 mr-1" />
                    ¿Necesitas ayuda? Ver guía
                </button>
            </div>
        </footer>
    );
}
