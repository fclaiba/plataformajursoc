import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useConvexAuth, useQuery, useMutation } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import type { User } from '../types';
import { hasEnrollmentConflict } from '../domain/scheduleRules';
import { useCatalog } from './CatalogContext';
import {
    correlativesGetMap,
    reviewsCreate,
    subjectsAddEnrollmentByExternal,
    subjectsListEnrollmentsByUser,
    subjectsRemoveEnrollmentByExternal,
    usersAddDocument,
    usersEnsureCurrentProfile,
    usersGetMe,
    usersToggleApprovedSubject,
} from '../convex/functions';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => void;
    addDocument: (docUrl: string) => void;
    addEnrollment: (materiaId: string, catedraId: string, comisionId: string) => Promise<void>;
    removeEnrollment: (materiaId: string) => Promise<void>;
    toggleApproved: (materiaId: string) => void;
    submitReview: (targetUserId: string, rating: number, comment: string, requestId: string) => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated: authSessionActive } = useConvexAuth();
    const { signIn, signOut } = useAuthActions();
    const { comisiones } = useCatalog();
    const correlativesMap = useQuery(correlativesGetMap, {});
    const me = useQuery(usersGetMe, {});
    const ensureCurrentProfile = useMutation(usersEnsureCurrentProfile);
    const addEnrollmentByExternal = useMutation(subjectsAddEnrollmentByExternal);
    const removeEnrollmentByExternal = useMutation(subjectsRemoveEnrollmentByExternal);
    const createReview = useMutation(reviewsCreate);
    const addDocumentMutation = useMutation(usersAddDocument);
    const toggleApprovedSubjectMutation = useMutation(usersToggleApprovedSubject);
    const [patchedUserId, setPatchedUserId] = useState<string | null>(null);
    const [pendingProfileName, setPendingProfileName] = useState<string | undefined>(undefined);
    const enrollments = useQuery(
        subjectsListEnrollmentsByUser,
        me?.user?._id ? { userId: me.user._id } : "skip"
    );

    useEffect(() => {
        const authUserId = me?.user?._id ?? null;
        if (authUserId && authUserId !== patchedUserId) {
            setPatchedUserId(authUserId);
            return;
        }
        if (!authUserId && patchedUserId !== null) {
            setPatchedUserId(null);
        }
    }, [me?.user?._id, patchedUserId]);

    useEffect(() => {
        if (!authSessionActive || !me?.user) return;
        if (me.profile && !pendingProfileName) return;

        void ensureCurrentProfile({ name: pendingProfileName })
            .then(() => {
                if (pendingProfileName) {
                    setPendingProfileName(undefined);
                }
            })
            .catch((error) => {
                console.error('[auth:ensure-profile]', error);
            });
    }, [authSessionActive, me?.user?._id, me?.profile, pendingProfileName, ensureCurrentProfile]);

    const baseUser = useMemo<User | null>(() => {
        if (!me?.user) return null;
        return {
            id: me.user._id,
            name: me.user.name || 'Usuario',
            email: me.user.email || '',
            reputation: me.profile?.reputation ?? 0,
            reviewsCount: me.profile?.reviewsCount ?? 0,
            role: me.profile?.role ?? 'student',
            enrollments: (enrollments || []).map((enrollment) => ({
                materiaId: enrollment.materiaId,
                catedraId: enrollment.catedraId,
                comisionId: enrollment.comisionId,
            })),
            approvedSubjects: me.profile?.approvedSubjectExternalIds ?? [],
            documents: me.profile?.documentUrls ?? [],
            reviews: [],
        };
    }, [me, enrollments]);

    const user = baseUser;

    const login = async (email: string, password: string): Promise<boolean> => {
        const normalizedEmail = email.trim().toLowerCase();
        try {
            const result = await signIn('password', {
                email: normalizedEmail,
                password,
                flow: 'signIn',
            });
            return result.signingIn;
        } catch (error) {
            console.error('[auth:login]', error);
            return false;
        }
    };

    const register = async (name: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
        const normalizedEmail = email.trim().toLowerCase();
        const trimmedName = name.trim();

        if (!trimmedName) {
            return { success: false, message: 'El nombre es obligatorio.' };
        }

        try {
            const result = await signIn('password', {
                email: normalizedEmail,
                password,
                name: trimmedName,
                flow: 'signUp',
            });
            if (!result.signingIn) {
                return { success: false, message: 'No se pudo iniciar sesión después del registro.' };
            }
            setPendingProfileName(trimmedName);
            return { success: true };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'No se pudo crear la cuenta.';
            return { success: false, message };
        }
    };

    const logout = () => {
        setPatchedUserId(null);
        void signOut();
    };

    // Derived state
    const isAuthenticated = authSessionActive;
    const isAdmin = user?.role === 'admin';
    const loading = false;

    const addDocument = (docUrl: string) => {
        if (!user) return;
        void addDocumentMutation({ url: docUrl });
    };

    const addEnrollment = async (materiaId: string, catedraId: string, comisionId: string) => {
        if (!user) return;
        // Check if already enrolled in this materia
        if (user.enrollments?.some(e => e.materiaId === materiaId)) {
            throw new Error('Ya estás inscripto en esta materia.');
        }

        const selectedCommission = comisiones.find((commission) => commission.id === comisionId);
        if (!selectedCommission) {
            throw new Error('La comisión seleccionada no existe.');
        }

        const existingSchedules = (user.enrollments || [])
            .map((enrollment) => comisiones.find((commission) => commission.id === enrollment.comisionId)?.horarios)
            .filter((schedule): schedule is NonNullable<typeof schedule> => !!schedule);
        const hasScheduleConflict = hasEnrollmentConflict(existingSchedules, selectedCommission.horarios);

        if (hasScheduleConflict) {
            throw new Error('Existe un conflicto horario con otra materia en la que ya estás inscripto.');
        }

        await addEnrollmentByExternal({
            userId: user.id,
            subjectExternalId: materiaId,
            cathedraExternalId: catedraId,
            commissionExternalId: comisionId,
        });
    };

    const removeEnrollment = async (materiaId: string) => {
        if (!user) return;
        await removeEnrollmentByExternal({ userId: user.id, subjectExternalId: materiaId });
    };

    const toggleApproved = (materiaId: string) => {
        if (!user) return;
        const currentApproved = user.approvedSubjects || [];

        // If ALREADY approved, we are UN-approving (removing). No validation needed.
        if (currentApproved.includes(materiaId)) {
            void toggleApprovedSubjectMutation({ subjectExternalId: materiaId });
            return;
        }

        // If NOT approved, we are trying to APPROVE. VALIDATION REQUIRED.
        const correlativesNodes = correlativesMap?.nodes || [];
        const correlativesEdges = correlativesMap?.edges || [];
        const node = correlativesNodes.find((n: any) => n.materiaId === materiaId);

        if (node) {
            // Find prerequisites (incoming edges)
            const prerequisites = correlativesEdges
                .filter(e => e.target === node.id)
                .map(e => {
                    const sourceNode = correlativesNodes.find((n: any) => n.id === e.source);
                    return sourceNode;
                })
                .filter(n => n !== undefined); // Ensure we found them

            // Check if user has approved them
            const missingPrereqs = prerequisites.filter(p =>
                !p?.materiaId || (!currentApproved.includes(p.materiaId) && p.duration !== 'Root')
                // Note: Root nodes usually don't have prereqs, but just in case. 
                // Also Check if source is 'Root' type? Usually Root has no incoming edges.
            );

            if (missingPrereqs.length > 0) {
                // Formatting message
                const missingNames = missingPrereqs.map(p => p?.label).join(', ');
                console.warn(`No puedes aprobar esta materia. Correlativas faltantes: ${missingNames}`);
                return; // BLOCK ACTION
            }
        }

        // If validation passed (or node not found in map, which implies no constraints known), proceed.
        void toggleApprovedSubjectMutation({ subjectExternalId: materiaId });
    };

    const submitReview = async (targetUserId: string, rating: number, comment: string, requestId: string) => {
        if (!user) return;
        await createReview({
            requestId,
            reviewerUserId: user.id,
            targetUserId,
            rating,
            comment,
        });
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, login, register, logout, loading, addDocument, addEnrollment, removeEnrollment, toggleApproved, submitReview }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
