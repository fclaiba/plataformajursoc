import { useAuth } from '../../context/AuthContext';
import { useQuery } from 'convex/react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { StarRating } from '../../components/reviews/StarRating';
import { SecureUpload } from '../../components/security/SecureUpload';
import { User, ShieldCheck, FileText, Calendar, Mail, FileCheck } from 'lucide-react';
import { reviewsListByTarget, usersGetVisibleProfile, usersListVisibleActivity } from '../../convex/functions';

export function ProfilePage() {
    const { userId: routeUserId } = useParams();
    const { user, addDocument } = useAuth();
    const isOwnProfile = !routeUserId || routeUserId === user?.id;
    const visibleProfile = useQuery(
        usersGetVisibleProfile,
        routeUserId && !isOwnProfile ? { targetUserId: routeUserId } : "skip",
    );
    const targetUserId = isOwnProfile ? user?.id : visibleProfile?.user._id;
    const reviewRows = useQuery(
        reviewsListByTarget,
        targetUserId ? { targetUserId } : "skip",
    );
    const activityRows = useQuery(
        usersListVisibleActivity,
        targetUserId ? { targetUserId, limit: 8 } : "skip",
    );

    if (!user) return <div className="p-8 text-center text-slate-500">Cargando perfil...</div>;
    if (!isOwnProfile && visibleProfile === undefined) {
        return <div className="p-8 text-center text-slate-500">Cargando perfil...</div>;
    }
    if (!isOwnProfile && visibleProfile === null) {
        return (
            <div className="max-w-3xl mx-auto p-8 text-center bg-white rounded-3xl border border-slate-200">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Perfil no disponible</h1>
                <p className="text-slate-500">Solo podés ver perfiles de usuarios con los que ya interactuaste.</p>
            </div>
        );
    }

    const profileUser = isOwnProfile
        ? { id: user.id, name: user.name, email: user.email, reputation: user.reputation || 0, reviewsCount: user.reviewsCount || 0 }
        : {
            id: visibleProfile?.user._id || '',
            name: visibleProfile?.user.name || 'Usuario',
            email: '',
            reputation: visibleProfile?.profile.reputation || 0,
            reviewsCount: visibleProfile?.profile.reviewsCount || 0,
        };

    const reviews = (reviewRows || []).map((review) => ({
        id: review._id,
        reviewerId: review.reviewerUserId,
        reviewerName: review.reviewerName,
        targetUserId: review.targetUserId,
        requestId: review.requestId,
        rating: review.rating,
        comment: review.comment,
        createdAt: new Date(review.createdAt),
    }));

    const documents = user.documents || [];

    const handleUploadComplete = (file: File) => {
        addDocument(file.name);
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
                            <h1 className="text-3xl font-bold text-slate-900">{profileUser.name}</h1>
                            <div className="flex items-center text-slate-500 mt-1 space-x-4">
                                {isOwnProfile && <span className="flex items-center"><Mail className="w-4 h-4 mr-1.5" /> {profileUser.email}</span>}
                                <span className="flex items-center"><ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-500" /> Identidad Verificada</span>
                            </div>
                        </div>
                        {isOwnProfile ? (
                            <div className="flex items-center gap-2">
                                <Button variant="outline" className="text-slate-600">Editar Perfil</Button>
                            </div>
                        ) : null}
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
                                    {(profileUser.reputation || 0).toFixed(1)}
                                </span>
                                <div className="flex justify-center my-2">
                                    <StarRating rating={Math.round(profileUser.reputation || 0)} size="md" />
                                </div>
                                <p className="text-sm text-slate-500">
                                    basado en {profileUser.reviewsCount || reviews.length} reseñas
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {isOwnProfile ? (
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
                    ) : null}

                    <Card className="border-slate-200 shadow-lg shadow-slate-200/40">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                                <Calendar className="w-5 h-5 mr-2 text-primary-500" />
                                Actividad reciente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {(activityRows || []).length === 0 ? (
                                <p className="text-sm text-slate-400 italic">No hay actividad visible reciente.</p>
                            ) : (
                                (activityRows || []).map((item) => (
                                    <div key={item.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                                        <div className="font-medium text-slate-800">{item.title}</div>
                                        <div className="text-sm text-slate-500">{item.description}</div>
                                        <div className="mt-1 text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</div>
                                    </div>
                                ))
                            )}
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
                            {reviews.length === 0 ? (
                                <div className="p-6 rounded-xl bg-slate-50 border border-slate-100 text-center text-slate-500">
                                    Aún no recibiste reseñas.
                                </div>
                            ) : reviews.map((review) => (
                                <div key={review.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-slate-200 mr-3 text-xs font-bold text-slate-500">
                                                {review.reviewerName.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{review.reviewerName}</p>
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
