import { useMemo, useState } from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';
import {
  adminGetDashboardOverview,
  adminGetReleaseReadiness,
  adminListOperationalLogs,
  adminListRecentRequestEvents,
  adminListSupportReports,
  adminRecomputeMatchingBySubject,
  adminResetRanking,
  adminSeedCatalog,
  adminSyncProfessorsFromCatalog,
} from '../../convex/functions';
import { useCatalog } from '../../context/CatalogContext';
import { useNotifications } from '../../context/NotificationsContext';
import { Button } from '../../components/ui/button';

export function AdminDashboardPage() {
  const { materias } = useCatalog();
  const { addNotification } = useNotifications();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const overview = useQuery(adminGetDashboardOverview, {});
  const readiness = useQuery(adminGetReleaseReadiness, {});
  const recentEvents = useQuery(adminListRecentRequestEvents, { limit: 20 });
  const supportReports = useQuery(adminListSupportReports, { limit: 20 });
  const operationalLogs = useQuery(adminListOperationalLogs, {
    domain: selectedDomain === 'all' ? undefined : selectedDomain,
    level: selectedLevel === 'all' ? undefined : selectedLevel as 'info' | 'warning' | 'error',
    limit: 50,
  });
  const seedCatalog = useAction(adminSeedCatalog);
  const syncProfessors = useAction(adminSyncProfessorsFromCatalog);
  const resetRanking = useMutation(adminResetRanking);
  const recomputeMatchingBySubject = useAction(adminRecomputeMatchingBySubject);

  const stats = useMemo(() => {
    if (!overview) return null;
    return [
      { label: 'Jobs Totales', value: overview.jobs.total },
      { label: 'Jobs Fallidos', value: overview.jobs.failed },
      { label: 'Jobs En Cola', value: overview.jobs.queued },
      { label: 'Jobs Running', value: overview.jobs.running },
    ];
  }, [overview]);
  const hasOperationalIssues = (overview?.jobs.failed || 0) > 0;

  const runSeed = async () => {
    try {
      await seedCatalog({});
      addNotification('Admin', 'Seed de catálogo ejecutado.', 'success', 'system');
    } catch (error) {
      addNotification('Admin', error instanceof Error ? error.message : 'Error ejecutando seed.', 'error', 'system');
    }
  };

  const runResetRanking = async () => {
    try {
      const result = await resetRanking({});
      addNotification('Admin', `Ranking reiniciado (${result.deletedSnapshots} snapshots).`, 'success', 'system');
    } catch (error) {
      addNotification('Admin', error instanceof Error ? error.message : 'Error reseteando ranking.', 'error', 'system');
    }
  };

  const runSyncProfessors = async () => {
    try {
      const result = await syncProfessors({});
      addNotification('Admin', `Profesores sincronizados (${result.count}).`, 'success', 'system');
    } catch (error) {
      addNotification('Admin', error instanceof Error ? error.message : 'Error sincronizando profesores.', 'error', 'system');
    }
  };

  const runRecompute = async () => {
    if (!selectedSubjectId) return;
    try {
      await recomputeMatchingBySubject({ subjectId: selectedSubjectId });
      addNotification('Admin', 'Recompute de matching encolado.', 'success', 'system');
    } catch (error) {
      addNotification('Admin', error instanceof Error ? error.message : 'Error encolando recompute.', 'error', 'system');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
      <div className={`rounded-xl border px-4 py-3 text-sm ${hasOperationalIssues ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
        {hasOperationalIssues
          ? `Atención: hay ${overview?.jobs.failed || 0} jobs fallidos en matching.`
          : 'Estado operativo saludable: sin jobs fallidos actualmente.'}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(stats || []).map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-500">{stat.label}</div>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Release Readiness</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(readiness?.checks || []).map((check) => (
            <div key={check.id} className={`rounded-xl border px-4 py-3 ${check.ok ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
              <div className="font-semibold text-slate-900">{check.label}</div>
              <div className="text-sm text-slate-600">{check.detail}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Acciones Administrativas</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button onClick={runSeed}>Seed Catálogo</Button>
            <Button variant="outline" onClick={runSyncProfessors}>Sync Profesores</Button>
            <Button variant="outline" onClick={runResetRanking}>Reset Ranking</Button>
          </div>
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <select
              className="h-10 rounded-lg border border-slate-200 px-3"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
            >
              <option value="">Seleccionar materia para recompute</option>
              {materias.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
            <Button variant="outline" onClick={runRecompute} disabled={!selectedSubjectId}>
              Recompute Matching (materia)
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Logs Operativos</h2>
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <select
              className="h-10 rounded-lg border border-slate-200 px-3"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
            >
              <option value="all">Todos los dominios</option>
              <option value="admin">admin</option>
              <option value="auth">auth</option>
              <option value="chat">chat</option>
              <option value="matching">matching</option>
              <option value="requests">requests</option>
            </select>
            <select
              className="h-10 rounded-lg border border-slate-200 px-3"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
            >
              <option value="all">Todos los niveles</option>
              <option value="info">info</option>
              <option value="warning">warning</option>
              <option value="error">error</option>
            </select>
          </div>
          <div className="space-y-2 max-h-[360px] overflow-auto">
            {(operationalLogs || overview?.recentLogs || []).map((log: any) => (
              <div key={log._id} className="text-sm border-b pb-2">
                <div className="font-semibold">{log.domain} - {log.level}</div>
                <div className="text-slate-600">{log.message}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Eventos de Requests</h2>
          <div className="space-y-2 max-h-[360px] overflow-auto">
            {(recentEvents || []).map((event: any) => (
              <div key={event._id} className="text-sm border-b pb-2">
                <div className="font-semibold">{event.type}</div>
                <div className="text-slate-600">{event.requestId}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Reportes de soporte</h2>
          <div className="space-y-2 max-h-[360px] overflow-auto">
            {(supportReports || []).map((report: any) => (
              <div key={report._id} className="text-sm border-b pb-2">
                <div className="font-semibold">{report.category} - {report.status}</div>
                <div className="text-slate-600">{report.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
