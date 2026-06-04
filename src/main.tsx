import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import './i18n';
import App from './App.tsx'
import { ConvexRootProvider } from './convex/ConvexRootProvider'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: Boolean(import.meta.env.VITE_SENTRY_DSN),
});

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('[frontend:error]', event.error ?? event.message);
    Sentry.captureException(event.error ?? new Error(String(event.message)));
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[frontend:unhandledrejection]', event.reason);
    Sentry.captureException(event.reason);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="text-6xl">💥</div>
            <h1 className="text-2xl font-bold text-slate-900">Error crítico</h1>
            <p className="text-slate-500">
              La aplicación encontró un error inesperado. Intentá recargar la página.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={resetError}
                className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
              >
                Reintentar
              </button>
              <button
                onClick={() => window.location.assign('/')}
                className="px-6 py-3 border border-slate-200 bg-white text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Ir al inicio
              </button>
            </div>
          </div>
        </div>
      )}
    >
      <ConvexRootProvider>
        <App />
      </ConvexRootProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
