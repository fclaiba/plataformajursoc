import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MATERIAS, CATEDRAS, COMISIONES } from '../../data/mock';
import { Button } from '../../components/ui/button';
import { Plus, Trash2, BookOpen, Calendar, GraduationCap, Users } from 'lucide-react';
import { AddSubjectModal } from '../../components/subjects/AddSubjectModal';
import { SubjectResourcesModal } from '../../components/subjects/SubjectResourcesModal';
import { Link } from 'react-router-dom';

export function MySubjectsPage() {
    const { user, removeEnrollment } = useAuth();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isResourcesModalOpen, setIsResourcesModalOpen] = useState(false);
    const [selectedMateriaForResources, setSelectedMateriaForResources] = useState<any>(null);

    const getEnrollmentDetails = (enrollment: { materiaId: string, catedraId: string, comisionId: string }) => {
        const materia = MATERIAS.find(m => m.id === enrollment.materiaId);
        const catedra = CATEDRAS.find(c => c.id === enrollment.catedraId);
        const comision = COMISIONES.find(c => c.id === enrollment.comisionId);
        return { materia, catedra, comision };
    };

    const hasEnrollments = user?.enrollments && user.enrollments.length > 0;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mis Materias</h1>
                    <p className="text-slate-500 mt-1">Gestiona tus inscripciones actuales para poder realizar permutas.</p>
                </div>
                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="shadow-lg shadow-primary-500/20 bg-primary-600 hover:bg-primary-700 transition-all hover:scale-105"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Inscribirse a Materia
                </Button>
            </div>

            {!hasEnrollments ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No tienes materias inscriptas</h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-6">
                        Para comenzar a utilizar la plataforma y solicitar permutas, primero debes registrar las materias que estás cursando.
                    </p>
                    <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>
                        Agregar mi primera materia
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {user?.enrollments?.map((enrollment, idx) => {
                        const { materia, catedra, comision } = getEnrollmentDetails(enrollment);
                        if (!materia || !catedra || !comision) return null;

                        return (
                            <div key={idx} className="group bg-white rounded-2xl border border-slate-200 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300 overflow-hidden flex flex-col">
                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-primary-50 p-2.5 rounded-xl group-hover:bg-primary-100 transition-colors">
                                            <BookOpen className="w-6 h-6 text-primary-600" />
                                        </div>
                                        <div className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                                            Anual
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-lg text-slate-900 line-clamp-2 min-h-[3.5rem] flex-1 mr-2">
                                            {materia.nombre}
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-full h-8 w-8 -mt-1 -mr-1"
                                            onClick={() => {
                                                setSelectedMateriaForResources(materia);
                                                setIsResourcesModalOpen(true);
                                            }}
                                            title="Ver Material de Estudio"
                                        >
                                            <BookOpen className="w-5 h-5" />
                                        </Button>
                                    </div>

                                    <div className="space-y-3 mt-4">
                                        <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                                            <GraduationCap className="w-4 h-4 mr-2 text-primary-500" />
                                            <span className="font-medium truncate">{catedra.nombre}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                                            <Users className="w-4 h-4 mr-2 text-primary-500" />
                                            <span className="font-medium">Comisión {comision.numero}</span>
                                        </div>
                                        <div className="flex items-start text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                                            <Calendar className="w-4 h-4 mr-2 text-primary-500 mt-0.5" />
                                            <div className="flex flex-wrap gap-1">
                                                {comision.horarios.map((h, i) => (
                                                    <span key={i} className="block">
                                                        {h.dia} {h.inicio}-{h.fin}{i < comision.horarios.length - 1 ? ',' : ''}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-2">
                                    <Link to={`/requests/new?materia=${materia.id}`} className="flex-1">
                                        <Button variant="primary" className="w-full bg-slate-900 hover:bg-primary-600 text-white">
                                            Solicitar Permuta
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                                        onClick={() => {
                                            if (window.confirm('¿Seguro que quieres eliminar esta inscripción?')) {
                                                removeEnrollment(materia.id);
                                            }
                                        }}
                                        title="Eliminar inscripción"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <AddSubjectModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
            <SubjectResourcesModal
                isOpen={isResourcesModalOpen}
                onClose={() => setIsResourcesModalOpen(false)}
                materia={selectedMateriaForResources}
            />
        </div>
    );
}
