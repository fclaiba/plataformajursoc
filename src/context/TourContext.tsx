import React, { createContext, useContext, useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import '../components/tour/TourStyles.css';
import { useAuth } from './AuthContext';

const TOUR_SYNC_MODE = 'local_only';

interface TourContextType {
    startTour: () => void;
    resetTour: () => void;
    hasSeenTour: boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const useTour = () => {
    const context = useContext(TourContext);
    if (!context) {
        throw new Error('useTour must be used within a TourProvider');
    }
    return context;
};

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const [driverObj, setDriverObj] = useState<any>(null);
    const [hasSeenTour, setHasSeenTour] = useState(false);

    // Initialize the driver on mount
    useEffect(() => {
        const driverInstance = driver({
            showProgress: true,
            animate: true,
            allowClose: true,
            overlayColor: 'rgba(15, 23, 42, 0.85)',
            // Translate buttons
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            doneBtnText: 'Finalizar',
            steps: [
                {
                    element: '#tour-welcome',
                    popover: {
                        title: '¡Bienvenido a App Permutas!',
                        description: 'Esta es tu plataforma para gestionar tus materias y encontrar las mejores opciones para cursar. Te guiaremos brevemente por las funciones principales.',
                        side: "bottom",
                        align: 'start'
                    }
                },
                {
                    element: '#tour-create-request-card',
                    popover: {
                        title: 'Solicitar Permuta',
                        description: '¿Necesitas cambiar de comisión o de horario? Desde aquí podrás crear una nueva solicitud de permuta para que otros estudiantes la vean.',
                        side: "right",
                        align: 'start'
                    }
                },
                {
                    element: '#tour-search-card',
                    popover: {
                        title: 'Buscar Permutas',
                        description: 'Explora solicitudes de otros estudiantes. Puedes filtrar por materia y encontrar la oportunidad perfecta para cambiar.',
                        side: "left",
                        align: 'start'
                    }
                },
                {
                    element: '#tour-dashboard',
                    popover: {
                        title: 'Dashboard',
                        description: 'Este acceso te devuelve al panel principal con el resumen de tu actividad y accesos rápidos.',
                        side: "bottom",
                        align: 'center'
                    }
                },
                {
                    element: '#tour-mis-materias',
                    popover: {
                        title: 'Mis Materias',
                        description: 'Aquí podrás ver las materias en las que estás inscripto. Es fundamental tener esta información actualizada para realizar permutas.',
                        side: "bottom",
                        align: 'center'
                    }
                },
                {
                    element: '#tour-mis-solicitudes',
                    popover: {
                        title: 'Mis Solicitudes',
                        description: 'Gestiona el estado de tus solicitudes activas. Podrás ver si alguien está interesado o si ya has conseguido tu permuta.',
                        side: "bottom",
                        align: 'center'
                    }
                },
                {
                    element: '#tour-correlativas',
                    popover: {
                        title: 'Mapa de Correlativas',
                        description: 'Visualiza el plan de estudios y cómo se conectan las materias entre sí. Ideal para planificar tu carrera.',
                        side: "bottom",
                        align: 'center'
                    }
                },
                {
                    element: '#tour-ranking',
                    popover: {
                        title: 'Ranking Docente',
                        description: 'Desde aquí puedes votar y consultar el ranking de docentes por materia y cátedra.',
                        side: "bottom",
                        align: 'center'
                    }
                },
                {
                    element: '#tour-notifications',
                    popover: {
                        title: 'Notificaciones',
                        description: 'Te avisaremos aquí cuando haya novedades sobre tus permutas o mensajes de otros usuarios.',
                        side: "bottom",
                        align: 'end'
                    }
                },
                {
                    popover: {
                        title: '¡Estás listo!',
                        description: 'Ya conoces lo básico. ¡Empieza a explorar y optimiza tu cursada!',
                        side: "left",
                        align: 'center'
                    }
                }
            ],
            onDestroyStarted: () => {
                if (!driverInstance.hasNextStep() || confirm("¿Seguro que quieres salir de la guía?")) {
                    driverInstance.destroy();
                    completeTour();
                }
            },
        });

        setDriverObj(driverInstance);

        // Check existing status
        const seen = localStorage.getItem('hasSeenTour');
        if (seen === 'true') {
            setHasSeenTour(true);
        }
    }, []);

    const completeTour = () => {
        if (TOUR_SYNC_MODE !== 'local_only') return;
        localStorage.setItem('hasSeenTour', 'true');
        setHasSeenTour(true);
    };

    const startTour = () => {
        if (driverObj) {
            // Small timeout to ensure elements are rendered if called immediately typically
            setTimeout(() => {
                driverObj.drive();
            }, 100);
        }
    };

    const resetTour = () => {
        localStorage.removeItem('hasSeenTour');
        setHasSeenTour(false);
        startTour();
    };

    // Trigger tour automatically on first login
    useEffect(() => {
        if (isAuthenticated && !hasSeenTour && driverObj && user) {
            // Only start if we are on the dashboard or main layout
            // We might want to wait a split second for the layout to mount completely
            const timer = setTimeout(() => {
                driverObj.drive();
            }, 1500); // 1.5s delay for smooth entrance
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, hasSeenTour, driverObj, user]);

    return (
        <TourContext.Provider value={{ startTour, resetTour, hasSeenTour }}>
            {children}
        </TourContext.Provider>
    );
};
