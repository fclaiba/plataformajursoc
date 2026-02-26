import type { Comision } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';
import { Users, Clock, GraduationCap, MapPin } from 'lucide-react';

interface CommissionCardProps {
    comision: Comision;
    onClick?: () => void;
    selected?: boolean;
}

export function CommissionCard({ comision, onClick, selected }: CommissionCardProps) {
    const availabilityColor =
        comision.cuposDisponibles === 0 ? 'bg-red-100 text-red-700' :
            comision.cuposDisponibles < 5 ? 'bg-amber-100 text-amber-700' :
                'bg-emerald-100 text-emerald-700';

    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer",
                selected ? "ring-2 ring-primary-500 ring-offset-2 ring-offset-slate-50" : "hover:shadow-xl hover:shadow-primary-500/10"
            )}
        >
            <Card className={cn("h-full border border-slate-200 bg-white shadow-sm overflow-hidden", selected && "border-primary-200 bg-primary-50/30")}>
                <div className={cn("absolute top-0 left-0 w-1 h-full bg-slate-200 transition-colors group-hover:bg-primary-500", selected && "bg-primary-500")} />

                <CardHeader className="pb-3 pl-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Comisión</div>
                            <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-primary-700 transition-colors">
                                #{comision.numero}
                            </CardTitle>
                        </div>
                        <span className={cn("text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-sm", availabilityColor)}>
                            <div className={cn("w-1.5 h-1.5 rounded-full mr-2",
                                comision.cuposDisponibles === 0 ? 'bg-red-500' : comision.cuposDisponibles < 5 ? 'bg-amber-500' : 'bg-emerald-500'
                            )} />
                            {comision.cuposDisponibles} vacantes
                        </span>
                    </div>
                </CardHeader>

                <CardContent className="space-y-3 pl-6 text-sm">
                    <div className="flex items-start text-slate-600">
                        <GraduationCap className="w-5 h-5 mr-3 text-primary-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-slate-900">{comision.profesor}</p>
                            <p className="text-xs text-slate-400">Titular de Cátedra</p>
                        </div>
                    </div>

                    <div className="flex items-start text-slate-600">
                        <Clock className="w-5 h-5 mr-3 text-primary-500 shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                            {comision.horarios.map((h, i) => (
                                <span key={i} className="font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block mb-1 w-fit">
                                    {h.dia} • {h.inicio} - {h.fin} hs
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center text-slate-500 pt-2 border-t border-slate-100 mt-2">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span className="text-xs">Sede Central - Aula 104</span>
                        <div className="ml-auto flex items-center text-xs">
                            <Users className="w-4 h-4 mr-1" />
                            {comision.cuposTotales} Total
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
