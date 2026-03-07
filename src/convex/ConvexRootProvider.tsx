import type { ReactNode } from 'react';
import { ConvexReactClient } from 'convex/react';
import { ConvexAuthProvider } from '@convex-dev/auth/react';

const convexUrl = import.meta.env.VITE_CONVEX_URL;

let convexClient: ConvexReactClient | null = null;
if (convexUrl) {
  convexClient = new ConvexReactClient(convexUrl);
}

export function ConvexRootProvider({ children }: { children: ReactNode }) {
  if (!convexClient) return <>{children}</>;
  return <ConvexAuthProvider client={convexClient}>{children}</ConvexAuthProvider>;
}
