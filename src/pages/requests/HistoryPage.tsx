import { useQuery } from 'convex/react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { CheckCircle, Clock, Calendar } from 'lucide-react';
import { requestsListVisibleByUser } from '../../convex/functions';

export function HistoryPage() {
    const { user } = useAuth();
    const allRequests = useQuery(requestsListVisibleByUser, user?.id ? { userId: user.id } : "skip") || [];

    const completedRequests = allRequests
        .filter((r: any) => r.status === 'COMPLETED')
        .sort((a: any, b: any) => b.updatedAt - a.updatedAt);

    const formatDate = (timestamp: number) => {
        const d = new Date(timestamp);
        return d.toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <div className="space-y-6 pb-28 animate-in fade-in duration-700">
            <section className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                    Historial de Permutas
                </h1>
                <p className="text-slate-500">
                    Todas tus permutas completadas exitosamente.
                </p>
            </section>

            {completedRequests.length > 0 ? (
                <div className="space-y-4">
                    {completedRequests.map((request: any, i: number) => (
                        <Card
                            key={request._id}
                            className="border-l-4 border-l-emerald-500 animate-in slide-in-from-bottom-5 fade-in"
                            style={{ animationDelay: `${i * 60}ms` }}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                        Permuta Completada
                                    </CardTitle>
                                    <span className="inline-flex items-center text-xs text-slate-400 gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(request.updatedAt)}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-400 text-xs uppercase tracking-wider">Materia</span>
                                        <p className="font-semibold text-slate-800">{request.subjectExternalId}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 text-xs uppercase tracking-wider">Comisión origen</span>
                                        <p className="font-medium text-slate-700">{request.commissionOriginExternalId}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                        <Clock className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Sin permutas completadas</h3>
                    <p className="text-slate-500 max-w-sm text-center">
                        Cuando completes tu primera permuta aparecerá acá.
                    </p>
                </div>
            )}
        </div>
    );
}
