import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ConvexRootProvider } from './convex/ConvexRootProvider'

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('[frontend:error]', event.error ?? event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[frontend:unhandledrejection]', event.reason);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexRootProvider>
      <App />
    </ConvexRootProvider>
  </StrictMode>,
)
