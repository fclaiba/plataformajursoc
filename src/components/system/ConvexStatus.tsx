import { useQuery } from 'convex/react';
import { healthPing } from '../../convex/functions';

export function ConvexStatus() {
  const enabled = import.meta.env.VITE_USE_CONVEX === 'true' && !!import.meta.env.VITE_CONVEX_URL;
  if (!enabled) return null;
  return <ConvexStatusConnected />;
}

function ConvexStatusConnected() {
  const health = useQuery(healthPing, {});
  if (health === undefined) return <div className="text-[11px] text-slate-400">Convex: conectando...</div>;
  return <div className="text-[11px] text-emerald-600">Convex: online</div>;
}