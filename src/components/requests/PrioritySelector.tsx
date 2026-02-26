import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import type { Comision } from '../../types';
import { X, ArrowUp, ArrowDown } from 'lucide-react';

interface PrioritySelectorProps {
    selectedCommissions: Comision[];
    onRemove: (comisionId: string) => void;
    onReorder: (newOrder: Comision[]) => void;
}

export function PrioritySelector({ selectedCommissions, onRemove, onReorder }: PrioritySelectorProps) {
    const moveUp = (index: number) => {
        if (index === 0) return;
        const newOrder = [...selectedCommissions];
        const temp = newOrder[index];
        newOrder[index] = newOrder[index - 1];
        newOrder[index - 1] = temp;
        onReorder(newOrder);
    };

    const moveDown = (index: number) => {
        if (index === selectedCommissions.length - 1) return;
        const newOrder = [...selectedCommissions];
        const temp = newOrder[index];
        newOrder[index] = newOrder[index + 1];
        newOrder[index + 1] = temp;
        onReorder(newOrder);
    };

    if (selectedCommissions.length === 0) {
        return (
            <div className="text-center p-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-500">
                No has seleccionado ninguna comisión de destino aún.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {selectedCommissions.map((comision, index) => (
                <Card key={comision.id} className="relative overflow-hidden">
                    <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="flex flex-col items-center justify-center bg-gray-100 rounded p-1 space-y-1">
                                <button
                                    onClick={() => moveUp(index)}
                                    disabled={index === 0}
                                    className="disabled:opacity-30 hover:text-primary-600"
                                >
                                    <ArrowUp className="w-4 h-4" />
                                </button>
                                <span className="font-bold text-sm text-primary-700">{index + 1}º</span>
                                <button
                                    onClick={() => moveDown(index)}
                                    disabled={index === selectedCommissions.length - 1}
                                    className="disabled:opacity-30 hover:text-primary-600"
                                >
                                    <ArrowDown className="w-4 h-4" />
                                </button>
                            </div>

                            <div>
                                <p className="font-bold text-gray-800">Comisión {comision.numero}</p>
                                <p className="text-xs text-gray-500">{comision.profesor} - {comision.horarios[0].dia} {comision.horarios[0].inicio}hs</p>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-red-500"
                            onClick={() => onRemove(comision.id)}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
