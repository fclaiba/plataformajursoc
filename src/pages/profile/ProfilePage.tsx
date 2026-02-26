import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { StarRating } from '../../components/reviews/StarRating';
import { SecureUpload } from '../../components/security/SecureUpload';
import { User, ShieldCheck, FileText, Calendar, Mail, FileCheck } from 'lucide-react';

export function ProfilePage() {
    const { user, addDocument } = useAuth();

    if (!user) return <div className="p-8 text-center text-slate-500">Cargando perfil...</div>;

    // Mock Reviews if empty
    const reviews = user.reviews || [
        { id: '1', reviewerId: 'xx', targetUserId: user.id, requestId: 'r1', rating: 5, comment: '¡Excelente predisposición! Muy rápido el trámite.', createdAt: new Date('2023-11-15') },
        { id: '2', reviewerId: 'xy', targetUserId: user.id, requestId: 'r2', rating: 4, comment: 'Todo correcto, buen compañero.', createdAt: new Date('2023-10-20') }
    ];

    const documents = user.documents || [];

    const handleUploadComplete = (file: File) => {
        addDocument(file);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 pb-10">
            {/* Header Profile */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                <div className="h-32 bg-gradient-to-r from-primary-600 to-secondary-600 relative">
                    <div className="absolute -bottom-16 left-8 p-1 bg-white rounded-full">
                        <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-inner">
                            <User className="w-16 h-16 text-slate-300" />
                        </div>
                    </div>
                </div>
                <div className="pt-20 pb-8 px-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
                            <div className="flex items-center text-slate-500 mt-1 space-x-4">
                                <span className="flex items-center"><Mail className="w-4 h-4 mr-1.5" /> {user.email}</span>
                                <span className="flex items-center"><ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-500" /> Identidad Verificada</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" className="text-slate-600">Editar Perfil</Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Left Column: Stats & Docs */}
                <div className="space-y-8">
                    {/* Reputation Card */}
                    <Card className="border-slate-200 shadow-lg shadow-slate-200/40">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center">
                                <StarRating rating={1} size="sm" className="mr-2 text-yellow-500" />
                                Reputación
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-4">
                                <span className="text-5xl font-extrabold text-slate-900 block">
                                    {(user.reputation || 4.8).toFixed(1)}
                                </span>
                                <div className="flex justify-center my-2">
                                    <StarRating rating={Math.round(user.reputation || 4.8)} size="md" />
                                </div>
                                <p className="text-sm text-slate-500">
                                    basado en {user.reviewsCount || reviews.length} reseñas
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Documents */}
                    <Card className="border-slate-200 shadow-lg shadow-slate-200/40">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                                <FileCheck className="w-5 h-5 mr-2 text-primary-500" />
                                Documentación
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <SecureUpload onUploadComplete={handleUploadComplete} />

                            <div className="space-y-2 mt-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Archivos Verificados</h4>
                                {documents.length === 0 ? (
                                    <p className="text-sm text-slate-400 italic">No hay documentos subidos.</p>
                                ) : (
                                    documents.map((doc, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-100/50">
                                            <div className="flex items-center overflow-hidden">
                                                <div className="bg-white p-1.5 rounded-md shadow-sm mr-3">
                                                    <FileText className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <span className="text-sm font-medium text-emerald-900 truncate max-w-[140px]" title={doc}>
                                                    {doc}
                                                </span>
                                            </div>
                                            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Reviews */}
                <div className="md:col-span-2">
                    <Card className="border-slate-200 shadow-lg shadow-slate-200/40 h-full">
                        <CardHeader>
                            <CardTitle className="text-xl">Reseñas de la Comunidad</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {reviews.map((review) => (
                                <div key={review.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-slate-200 mr-3 text-xs font-bold text-slate-500">
                                                {review.reviewerId.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">Usuario #{review.reviewerId.substring(0, 4)}</p>
                                                <p className="text-xs text-slate-400 flex items-center">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {new Date(review.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <StarRating rating={review.rating} size="sm" />
                                    </div>
                                    <p className="text-slate-600 text-sm leading-relaxed pl-11">
                                        "{review.comment}"
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
