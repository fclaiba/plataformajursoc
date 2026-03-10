import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Book, FileText, FileType, ExternalLink, Download, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import type { Materia } from '../../types';
import { useMutation, useQuery } from 'convex/react';
import { resourcesCreate, resourcesDelete, resourcesListBySubject } from '../../convex/functions';
import { useAuth } from '../../context/AuthContext';

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
    const { isAdmin } = useAuth();
    const createResource = useMutation(resourcesCreate);
    const deleteResource = useMutation(resourcesDelete);
    const resources = useQuery(
        resourcesListBySubject,
        materia ? { subjectExternalId: materia.id } : 'skip'
    );
    if (!materia) return null;

    const getResources = (type: 'biblio' | 'apuntes' | 'resumenes'): Resource[] => {
        return (resources || [])
            .filter((r) => r.category === type)
            .map((r) => ({
                id: r._id,
                title: r.title,
                author: r.author,
                type: r.type,
                url: r.url,
                size: r.size,
            }));
    };

    const addQuickResource = async (category: 'biblio' | 'apuntes' | 'resumenes') => {
        await createResource({
            subjectExternalId: materia.id,
            category,
            title: `Nuevo recurso - ${materia.nombre}`,
            author: 'Admin',
            type: 'link',
            url: 'https://example.com',
            size: undefined,
        });
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
                            {isAdmin && (
                                <div className="mb-2">
                                    <Button size="sm" variant="outline" onClick={() => void addQuickResource(tab)}>
                                        <Plus className="w-4 h-4 mr-1" /> Agregar recurso
                                    </Button>
                                </div>
                            )}
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
                                                <div className="flex gap-1">
                                                    <a href={res.url} target="_blank" rel="noreferrer">
                                                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-full">
                                                            <Download className="w-5 h-5" />
                                                        </Button>
                                                    </a>
                                                    {isAdmin && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                                            onClick={() => void deleteResource({ resourceId: res.id })}
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </Button>
                                                    )}
                                                </div>
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
