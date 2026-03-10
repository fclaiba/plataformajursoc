import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { List, ArrowRightLeft, Search } from 'lucide-react';
import { useCatalog } from '../../context/CatalogContext';

export function Dashboard() {
    const { user } = useAuth();
    const { materias, catedras, comisiones } = useCatalog();
    const navigate = useNavigate();

    const mySubjects = (user?.enrollments || []).map((enrollment) => {
        const materia = materias.find((subject) => subject.id === enrollment.materiaId);
        const catedra = catedras.find((cathedra) => cathedra.id === enrollment.catedraId);
        const comision = comisiones.find((commission) => commission.id === enrollment.comisionId);
        return { materia, catedra, comision };
    }).filter((entry) => entry.materia && entry.catedra && entry.comision);

    return (
        <div className="space-y-6 sm:space-y-10 pb-28 sm:pb-32">
            {/* Welcome Section */}
            <section className="space-y-2 animate-in slide-in-from-bottom-5 duration-700">
                <h1 id="tour-welcome" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                    Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">{user?.name}</span>
                </h1>
                <p className="text-base sm:text-lg text-slate-500 max-w-2xl">
                    Gestiona tus inscripciones, busca nuevas oportunidades y organiza tu cursada de manera inteligente.
                </p>
            </section>

            {/* Quick Actions */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-5 duration-700 delay-150">
                <Card
                    id="tour-create-request-card"
                    className="group hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/10 cursor-pointer transition-all duration-300 relative overflow-hidden"
                    onClick={() => navigate('/requests/new')}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader className="relative">
                        <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-4 text-primary-600 group-hover:scale-110 transition-transform duration-300">
                            <ArrowRightLeft className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-xl sm:text-2xl text-slate-800 group-hover:text-primary-700 transition-colors">Publicar Permuta</CardTitle>
                        <CardDescription className="text-sm sm:text-base mt-2">Creá una solicitud para cambiar tu comisión actual por una que te convenga.</CardDescription>
                    </CardHeader>
                </Card>

                <Card
                    id="tour-search-card"
                    className="group hover:border-secondary-200 hover:shadow-lg hover:shadow-secondary-500/10 cursor-pointer transition-all duration-300 relative overflow-hidden"
                    onClick={() => navigate('/search')}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader className="relative">
                        <div className="w-12 h-12 rounded-xl bg-secondary-100 flex items-center justify-center mb-4 text-secondary-600 group-hover:scale-110 transition-transform duration-300">
                            <Search className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-xl sm:text-2xl text-slate-800 group-hover:text-secondary-700 transition-colors">Buscar Permutas</CardTitle>
                        <CardDescription className="text-sm sm:text-base mt-2">Explora comisiones disponibles, filtra por horarios y encuentra tu match ideal.</CardDescription>
                    </CardHeader>
                </Card>
            </section>

            <section className="animate-in slide-in-from-bottom-5 duration-700 delay-200">
                <Card className="border-slate-200 bg-slate-50/80">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-900">Primeros pasos</CardTitle>
                        <CardDescription>
                            Seguí este orden para usar la plataforma con menos fricción.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Paso 1</div>
                            <div className="font-semibold text-slate-800">Inscribite a tus materias</div>
                            <p className="text-sm text-slate-500 mt-1">Registrá la comisión que estás cursando para habilitar permutas.</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Paso 2</div>
                            <div className="font-semibold text-slate-800">Publicá o buscá una permuta</div>
                            <p className="text-sm text-slate-500 mt-1">Elegí tus destinos y dejá que el matching encuentre la mejor coincidencia.</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Paso 3</div>
                            <div className="font-semibold text-slate-800">Chateá, confirmá y reseñá</div>
                            <p className="text-sm text-slate-500 mt-1">Coordiná con la otra persona, completá la permuta y dejá reputación real.</p>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* My Enrollments */}
            <section className="animate-in slide-in-from-bottom-5 duration-700 delay-300">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                        <div className="bg-slate-100 p-2 rounded-lg mr-3">
                            <List className="w-5 h-5 text-slate-600" />
                        </div>
                        Mis Materias en Curso
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {mySubjects.map(({ materia, catedra, comision }) => (
                        <Card key={materia!.id} className="border-t-4 border-t-primary-500 hover:-translate-y-1 transition-transform duration-300">
                            <CardHeader className="pb-2">
                                <div className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-1">Año {materia!.anio}</div>
                                <CardTitle className="text-lg text-slate-900">{materia!.nombre}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-slate-500 mb-4">
                                    {catedra!.nombre} - Comisión {comision!.numero}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-dashed group-hover:border-solid hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 transition-all"
                                    onClick={() => navigate(`/search?materia=${materia!.id}`)}
                                >
                                    Ver Opciones
                                </Button>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Add Placeholder for Enrollment */}
                    <Card className="border-2 border-dashed border-slate-200 hover:border-slate-300 bg-transparent shadow-none flex items-center justify-center min-h-[180px] cursor-pointer group" onClick={() => navigate('/mis-materias')}>
                        <div className="text-center">
                            <div className="w-10 h-10 rounded-full bg-slate-100 mx-auto flex items-center justify-center mb-2 group-hover:bg-slate-200 transition-colors">
                                <span className="text-2xl text-slate-400 group-hover:text-slate-500">+</span>
                            </div>
                            <p className="text-sm font-medium text-slate-500 group-hover:text-slate-600">Inscribirse a Materia</p>
                        </div>
                    </Card>
                </div>
            </section>
        </div>
    );
}
