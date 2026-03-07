import { useTour } from '../../context/TourContext';
import { HelpCircle } from 'lucide-react';
import { ConvexStatus } from '../system/ConvexStatus';

export function Footer() {
    const { resetTour } = useTour();

    return (
        <footer className="bg-gray-100 border-t border-gray-200 mt-auto relative w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-6">
                <p className="text-center md:text-left text-xs sm:text-sm leading-relaxed text-gray-500 max-w-3xl">
                    &copy; {new Date().getFullYear()} Plataforma JurSoc - Facultad de Ciencias Jurídicas y Sociales UNLP
                </p>

                <button
                    onClick={resetTour}
                    className="shrink-0 self-center md:self-auto flex items-center text-xs text-gray-400 hover:text-primary-600 transition-colors opacity-60 hover:opacity-100 whitespace-nowrap"
                    title="Reiniciar guía de usuario"
                >
                    <HelpCircle className="w-3 h-3 mr-1" />
                    ¿Necesitas ayuda? Ver guía
                </button>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 flex justify-center md:justify-end">
                <ConvexStatus />
            </div>
        </footer>
    );
}
