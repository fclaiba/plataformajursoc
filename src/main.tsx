import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
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
    <Sentry.ErrorBoundary fallback={<div className="p-10 text-center">Ocurrio un error inesperado.</div>}>
      <ConvexRootProvider>
        <App />
      </ConvexRootProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
