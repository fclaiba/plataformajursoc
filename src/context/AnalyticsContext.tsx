import React, { createContext, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface AnalyticsContextType {
    trackEvent: (eventName: string, properties?: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    const location = useLocation();

    // Auto-track page views
    useEffect(() => {
        trackEvent('page_view', { path: location.pathname });
    }, [location.pathname]);

    const trackEvent = (eventName: string, properties?: Record<string, any>) => {
        // In a real app, this would send to PostHog, Mixpanel, Google Analytics, etc.
        if (import.meta.env.MODE === 'development') {
            console.log(`[Analytics] ${eventName}`, properties || {});
        }
    };

    return (
        <AnalyticsContext.Provider value={{ trackEvent }}>
            {children}
        </AnalyticsContext.Provider>
    );
}

export const useAnalytics = () => {
    const context = useContext(AnalyticsContext);
    if (!context) {
        throw new Error('useAnalytics must be used within an AnalyticsProvider');
    }
    return context;
};
