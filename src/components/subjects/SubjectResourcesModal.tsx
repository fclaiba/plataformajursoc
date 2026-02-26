import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Book, FileText, FileType, ExternalLink, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import type { Materia } from '../../types';

interface SubjectResourcesModalProps {
    isOpen: boolean;
    onClose: () => void;
    materia: Materia | null;
}

// Mock Data Structure
interface Resource {
    id: string;
    title: string;
    author?: string;
    type: 'pdf' | 'link' | 'video';
    url: string;
    size?: string;
}

export function SubjectResourcesModal({ isOpen, onClose, materia }: SubjectResourcesModalProps) {
    if (!materia) return null;

    // Generate Dynamic Resources based on Subject Name to simulate real data
    const getResources = (type: 'biblio' | 'apuntes' | 'resumenes'): Resource[] => {
        switch (type) {
            case 'biblio':
                return [
                    { id: 'b1', title: `Manual de ${materia.nombre} - Ed. 2024`, author: 'Cátedra Oficial', type: 'pdf', url: '#', size: '15 MB' },
                    { id: 'b2', title: `Tratado de ${materia.nombre}`, author: 'Autor Recomendado', type: 'pdf', url: '#', size: '22 MB' },
                    { id: 'b3', title: 'Código Comentado y Concordado', author: 'InfoLeg', type: 'link', url: '#' },
                ];
            case 'apuntes':
                return [
                    { id: 'a1', title: `Apuntes de Clase - ${materia.nombre} (Parte 1)`, author: 'Comisión 2 - 2024', type: 'pdf', url: '#', size: '4 MB' },
                    { id: 'a2', title: 'Resumen para el Primer Parcial', author: 'Estudiante Anónimo', type: 'pdf', url: '#', size: '2 MB' },
                    { id: 'a3', title: 'Guía de Preguntas Frecuentes', author: 'Centro de Estudiantes', type: 'pdf', url: '#', size: '1 MB' },
                ];
            case 'resumenes':
                return [
                    { id: 'r1', title: `Resumen Completo ${materia.nombre}`, author: 'Grupo de Estudio', type: 'pdf', url: '#', size: '8 MB' },
                    { id: 'r2', title: 'Cuadros Sinópticos - Unidad 1-5', author: 'Sofía L.', type: 'pdf', url: '#', size: '1.5 MB' },
                ];
            default: return [];
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-6 gap-0 bg-white/95 backdrop-blur-xl border-slate-200 shadow-2xl">
                <DialogHeader className="mb-4 flex-shrink-0">
                    <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-slate-800">
                        <div className="bg-primary-100 p-2 rounded-xl text-primary-600">
                            <Book className="w-6 h-6" />
                        </div>
                        {materia.nombre}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 text-base">
                        Material de estudio, apuntes y resúmenes compartidos por la comunidad.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="biblio" className="flex-1 flex flex-col min-h-0">
                    <TabsList className="grid w-full grid-cols-3 mb-4 bg-slate-100/50 p-1 rounded-xl">
                        <TabsTrigger value="biblio" className="data-[state=active]:bg-white data-[state=active]:text-primary-700 data-[state=active]:shadow-sm rounded-lg transition-all">
                            <Book className="w-4 h-4 mr-2" /> Bibliografía
                        </TabsTrigger>
                        <TabsTrigger value="apuntes" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm rounded-lg transition-all">
                            <FileText className="w-4 h-4 mr-2" /> Apuntes
                        </TabsTrigger>
                        <TabsTrigger value="resumenes" className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm rounded-lg transition-all">
                            <FileType className="w-4 h-4 mr-2" /> Resúmenes
                        </TabsTrigger>
                    </TabsList>

                    {(['biblio', 'apuntes', 'resumenes'] as const).map((tab) => (
                        <TabsContent key={tab} value={tab} className="flex-1 min-h-0 mt-0">
                            <ScrollArea className="h-[calc(100%-2rem)] pr-4">
                                <div className="space-y-3 pb-4">
                                    {getResources(tab).map((res) => (
                                        <div key={res.id} className="group flex items-start p-3 bg-white border border-slate-100 rounded-xl hover:border-primary-200 hover:shadow-md hover:shadow-primary-500/5 transition-all duration-200">
                                            <div className={cn(
                                                "p-3 rounded-lg mr-4 flex-shrink-0",
                                                tab === 'biblio' ? "bg-blue-50 text-blue-600" :
                                                    tab === 'apuntes' ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                                            )}>
                                                {res.type === 'link' ? <ExternalLink className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-slate-800 group-hover:text-primary-700 transition-colors leading-tight mb-1">
                                                    {res.title}
                                                </h4>
                                                <p className="text-sm text-slate-500 flex items-center">
                                                    {res.author && <span className="font-medium mr-2">{res.author}</span>}
                                                    {res.size && <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{res.size}</span>}
                                                </p>
                                            </div>

                                            <div className="flex-shrink-0 ml-4 self-center">
                                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-full">
                                                    <Download className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    ))}
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
