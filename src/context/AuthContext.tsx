import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useConvexAuth, useQuery, useMutation } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import type { User } from '../types';
import { COMISIONES } from '../data/mock';
import { CORRELATIVES_NODES, CORRELATIVES_EDGES } from '../data/correlativas';
import { useNotifications } from './NotificationsContext';
import { hasEnrollmentConflict } from '../domain/scheduleRules';
import { usersEnsureCurrentProfile, usersGetMe } from '../convex/functions';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => void;
    addDocument: (docUrl: string) => void;
    addEnrollment: (materiaId: string, catedraId: string, comisionId: string) => void;
    removeEnrollment: (materiaId: string) => void;
    toggleApproved: (materiaId: string) => void;
    submitReview: (targetUserId: string, rating: number, comment: string, requestId: string) => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated: authSessionActive } = useConvexAuth();
    const { signIn, signOut } = useAuthActions();
    const me = useQuery(usersGetMe, {});
    const ensureCurrentProfile = useMutation(usersEnsureCurrentProfile);
    const { addNotification } = useNotifications();
    const [localUserPatch, setLocalUserPatch] = useState<Partial<User>>({});
    const [patchedUserId, setPatchedUserId] = useState<string | null>(null);
    const [pendingProfileName, setPendingProfileName] = useState<string | undefined>(undefined);

    useEffect(() => {
        const authUserId = me?.user?._id ?? null;
        if (authUserId && authUserId !== patchedUserId) {
            setLocalUserPatch({});
            setPatchedUserId(authUserId);
            return;
        }
        if (!authUserId && patchedUserId !== null) {
            setLocalUserPatch({});
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
            enrollments: [],
            approvedSubjects: [],
            documents: [],
            reviews: [],
        };
    }, [me]);

    const user = useMemo<User | null>(() => {
        if (!baseUser) return null;
        return {
            ...baseUser,
            ...localUserPatch,
            enrollments: localUserPatch.enrollments ?? baseUser.enrollments ?? [],
            approvedSubjects: localUserPatch.approvedSubjects ?? baseUser.approvedSubjects ?? [],
            documents: localUserPatch.documents ?? baseUser.documents ?? [],
            reviews: localUserPatch.reviews ?? baseUser.reviews ?? [],
        };
    }, [baseUser, localUserPatch]);

    const updateLocalUser = (updater: (current: User) => User) => {
        if (!user) return;
        const updated = updater(user);
        setLocalUserPatch({
            documents: updated.documents ?? [],
            enrollments: updated.enrollments ?? [],
            approvedSubjects: updated.approvedSubjects ?? [],
            reviews: updated.reviews ?? [],
            reputation: updated.reputation,
            reviewsCount: updated.reviewsCount,
        });
    };

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
        setLocalUserPatch({});
        setPatchedUserId(null);
        void signOut();
    };

    // Derived state
    const isAuthenticated = authSessionActive;
    const loading = false;

    const addDocument = (docUrl: string) => {
        if (!user) return;
        updateLocalUser((current) => ({ ...current, documents: [...(current.documents || []), docUrl] }));
    };

    const addEnrollment = (materiaId: string, catedraId: string, comisionId: string) => {
        if (!user) return;
        // Check if already enrolled in this materia
        if (user.enrollments?.some(e => e.materiaId === materiaId)) {
            throw new Error('Ya estás inscripto en esta materia.');
        }

        const selectedCommission = COMISIONES.find((commission) => commission.id === comisionId);
        if (!selectedCommission) {
            throw new Error('La comisión seleccionada no existe.');
        }

        if (selectedCommission.cuposDisponibles <= 0) {
            throw new Error('No hay cupos disponibles en esa comisión.');
        }

        const existingSchedules = (user.enrollments || [])
            .map((enrollment) => COMISIONES.find((commission) => commission.id === enrollment.comisionId)?.horarios)
            .filter((schedule): schedule is NonNullable<typeof schedule> => !!schedule);
        const hasScheduleConflict = hasEnrollmentConflict(existingSchedules, selectedCommission.horarios);

        if (hasScheduleConflict) {
            throw new Error('Existe un conflicto horario con otra materia en la que ya estás inscripto.');
        }

        const newEnrollment = { materiaId, catedraId, comisionId };
        const updatedEnrollments = [...(user.enrollments || []), newEnrollment];
        updateLocalUser((current) => ({ ...current, enrollments: updatedEnrollments }));
    };

    const removeEnrollment = (materiaId: string) => {
        if (!user) return;
        const updatedEnrollments = user.enrollments?.filter(e => e.materiaId !== materiaId) || [];
        updateLocalUser((current) => ({ ...current, enrollments: updatedEnrollments }));
    };

    const toggleApproved = (materiaId: string) => {
        if (!user) return;
        const currentApproved = user.approvedSubjects || [];

        // If ALREADY approved, we are UN-approving (removing). No validation needed.
        if (currentApproved.includes(materiaId)) {
            const updatedApproved = currentApproved.filter(id => id !== materiaId);
            updateLocalUser((current) => ({ ...current, approvedSubjects: updatedApproved }));
            return;
        }

        // If NOT approved, we are trying to APPROVE. VALIDATION REQUIRED.
        const node = CORRELATIVES_NODES.find(n => n.materiaId === materiaId);

        if (node) {
            // Find prerequisites (incoming edges)
            const prerequisites = CORRELATIVES_EDGES
                .filter(e => e.target === node.id)
                .map(e => {
                    const sourceNode = CORRELATIVES_NODES.find(n => n.id === e.source);
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
                addNotification(
                    "No puedes aprobar esta materia",
                    `Te faltan las siguientes correlativas: ${missingNames}`,
                    'error'
                );
                return; // BLOCK ACTION
            }
        }

        // If validation passed (or node not found in map, which implies no constraints known), proceed.
        const updatedApproved = [...currentApproved, materiaId];

        // Remove from enrollments if exists (Simulating "Passed" state logic)
        const updatedEnrollments = user.enrollments?.filter(e => e.materiaId !== materiaId) || [];

        const updatedUser = {
            ...user,
            approvedSubjects: updatedApproved,
            enrollments: updatedEnrollments
        };
        updateLocalUser((current) => ({ ...current, approvedSubjects: updatedUser.approvedSubjects, enrollments: updatedUser.enrollments }));
    };

    const submitReview = (_targetUserId: string, _rating: number, _comment: string, _requestId: string) => {
        if (!user) return;
        addNotification('Reseñas en migración', 'Las reseñas se moverán a Convex en Sprint 5.', 'info');
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout, loading, addDocument, addEnrollment, removeEnrollment, toggleApproved, submitReview }}>
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
