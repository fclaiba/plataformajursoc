import React from 'react';
import * as Sentry from '@sentry/react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: React.ReactNode;
    /** Shown in the fallback UI to give context. Defaults to "esta sección". */
    section?: string;
}

interface FallbackProps {
    error: Error;
    resetError: () => void;
    section: string;
}

function ErrorFallback({ error, resetError, section }: FallbackProps) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-6 animate-in fade-in duration-500">
            <div className="max-w-lg w-full text-center space-y-6">
                {/* Icon */}
                <div className="mx-auto w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center shadow-inner">
                    <AlertTriangle className="w-10 h-10 text-red-500 dark:text-red-400" />
                </div>

                {/* Heading */}
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Algo salió mal
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        Ocurrió un error inesperado al cargar {section}. Podés intentar de nuevo o volver al inicio.
                    </p>
                </div>

                {/* Error detail (dev only) */}
                {import.meta.env.DEV && (
                    <div className="text-left bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm font-mono text-red-600 dark:text-red-400 break-words max-h-32 overflow-auto">
                        {error.message}
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={resetError}
                        className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-lg shadow-primary-500/20 transition-all duration-200 active:scale-95"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reintentar
                    </button>
                    <a
                        href="/dashboard"
                        className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 active:scale-95"
                    >
                        <Home className="w-4 h-4 mr-2" />
                        Ir al Dashboard
                    </a>
                </div>
            </div>
        </div>
    );
}

/**
 * Wraps children with a Sentry-instrumented error boundary that shows
 * a user-friendly fallback with retry + navigation actions.
 */
export function RouteErrorBoundary({ children, section = 'esta sección' }: Props) {
    return (
        <Sentry.ErrorBoundary
            fallback={({ error, resetError }) => (
                <ErrorFallback
                    error={error as Error}
                    resetError={resetError}
                    section={section}
                />
            )}
            onError={(error) => {
                console.error('[RouteErrorBoundary]', error);
            }}
        >
            {children}
        </Sentry.ErrorBoundary>
    );
}
