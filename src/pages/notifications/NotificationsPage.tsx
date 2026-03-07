import { useNotifications } from '../../context/NotificationsContext';
import { Card, CardContent } from '../../components/ui/card';
import { Bell, CheckCircle, Info, AlertTriangle, XCircle, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';

export function NotificationsPage() {
    const { notifications, markAsRead, clearAll } = useNotifications();

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <div className="p-2 rounded-full bg-emerald-100 text-emerald-600"><CheckCircle className="w-6 h-6" /></div>;
            case 'warning': return <div className="p-2 rounded-full bg-amber-100 text-amber-600"><AlertTriangle className="w-6 h-6" /></div>;
            case 'error': return <div className="p-2 rounded-full bg-red-100 text-red-600"><XCircle className="w-6 h-6" /></div>;
            default: return <div className="p-2 rounded-full bg-blue-100 text-blue-600"><Info className="w-6 h-6" /></div>;
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <h1 className="text-3xl font-bold flex items-center text-slate-900">
                    <div className="bg-primary-100 p-2 rounded-xl mr-3 text-primary-600">
                        <Bell className="w-6 h-6" />
                    </div>
                    Notificaciones
                </h1>
                <div className="text-sm text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">
                    {notifications.filter(n => !n.read).length} nuevas
                </div>
            </div>

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-200 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <Bell className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Estás al día</h3>
                        <p className="text-slate-500 max-w-sm">No tenés notificaciones nuevas en este momento. Te avisaremos cuando haya novedades sobre tus permutas.</p>
                    </div>
                ) : (
                    notifications.map((n, i) => (
                        <div key={n.id} style={{ animationDelay: `${i * 100}ms` }} className="animate-in slide-in-from-bottom-5 fade-in">
                            <Card className={cn(
                                "transition-all duration-300 border-l-4 overflow-hidden group",
                                !n.read ? "bg-white border-l-primary-500 shadow-md transform scale-[1.01]" : "bg-slate-50/80 border-l-slate-300 hover:bg-white"
                            )}>
                                <CardContent className="p-5 flex items-start space-x-5">
                                    <div className="shrink-0">{getIcon(n.type)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={cn("font-bold text-lg", !n.read ? "text-slate-900" : "text-slate-600")}>{n.title}</h3>
                                            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-md whitespace-nowrap ml-2">
                                                {n.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 leading-relaxed">{n.message}</p>
                                    </div>
                                    {!n.read && (
                                        <div className="self-center pl-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => markAsRead(n.id)}
                                                className="hover:bg-primary-50 hover:text-primary-600 rounded-full h-8 w-8 p-0"
                                                title="Marcar como leída"
                                            >
                                                <div className="w-2 h-2 rounded-full bg-primary-500" />
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    ))
                )}
            </div>

            {notifications.length > 0 && (
                <div className="flex justify-center pt-4">
                    <Button variant="ghost" className="text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={clearAll}>
                        <Trash2 className="w-4 h-4 mr-2" /> Limpiar historial
                    </Button>
                </div>
            )}
        </div>
    );
}
