import type { ReactNode } from 'react';
import { ConvexReactClient } from 'convex/react';
import { ConvexAuthProvider } from '@convex-dev/auth/react';

const convexUrl = import.meta.env.VITE_CONVEX_URL;

let convexClient: ConvexReactClient | null = null;
if (convexUrl) {
  convexClient = new ConvexReactClient(convexUrl);
}

function ConvexConfigError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="max-w-xl w-full rounded-2xl border border-amber-200 bg-white p-8 shadow-lg">
        <div className="text-sm font-bold uppercase tracking-wider text-amber-600 mb-2">
          Configuración requerida
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          Falta `VITE_CONVEX_URL` en el entorno
        </h1>
        <p className="text-slate-600 mb-4">
          La app no puede inicializar Convex y por eso cualquier `useQuery` o `useMutation`
          terminaría fallando fuera del provider.
        </p>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700 space-y-2">
          <div>Verificá estas variables en el entorno activo:</div>
          <ul className="list-disc pl-5 space-y-1">
            <li>`VITE_CONVEX_URL`</li>
            <li>`VITE_CONVEX_SITE_URL`</li>
            <li>`CONVEX_DEPLOYMENT`</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function ConvexRootProvider({ children }: { children: ReactNode }) {
  if (!convexClient) return <ConvexConfigError />;
  return <ConvexAuthProvider client={convexClient}>{children}</ConvexAuthProvider>;
}
