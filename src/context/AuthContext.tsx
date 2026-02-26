import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { MOCK_USERS } from '../data/mock';
import { CORRELATIVES_NODES, CORRELATIVES_EDGES } from '../data/correlativas';
import { useNotifications } from './NotificationsContext';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string) => Promise<boolean>;
    logout: () => void;
    addDocument: (docUrl: string) => void;
    addEnrollment: (materiaId: string, catedraId: string, comisionId: string) => void;
    removeEnrollment: (materiaId: string) => void;
    toggleApproved: (materiaId: string) => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const { addNotification } = useNotifications();

    useEffect(() => {
        // Check local storage on mount
        const storedUser = localStorage.getItem('app-permutas-user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email: string): Promise<boolean> => {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                const foundUser = MOCK_USERS.find(u => u.email === email);
                if (foundUser) {
                    setUser(foundUser);
                    localStorage.setItem('app-permutas-user', JSON.stringify(foundUser));
                    resolve(true);
                } else {
                    resolve(false);
                }
            }, 500);
        });
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('app-permutas-user');
    };

    // Derived state
    const isAuthenticated = !!user;

    const addDocument = (docUrl: string) => {
        if (!user) return;
        const updatedDocs = [...(user.documents || []), docUrl];
        const updatedUser = { ...user, documents: updatedDocs };
        setUser(updatedUser);
        localStorage.setItem('app-permutas-user', JSON.stringify(updatedUser)); // Persist mock update
    };

    const addEnrollment = (materiaId: string, catedraId: string, comisionId: string) => {
        if (!user) return;
        // Check if already enrolled in this materia
        if (user.enrollments?.some(e => e.materiaId === materiaId)) {
            throw new Error('Ya estás inscripto en esta materia.');
        }

        const newEnrollment = { materiaId, catedraId, comisionId };
        const updatedEnrollments = [...(user.enrollments || []), newEnrollment];
        const updatedUser = { ...user, enrollments: updatedEnrollments };

        setUser(updatedUser);
        localStorage.setItem('app-permutas-user', JSON.stringify(updatedUser));
    };

    const removeEnrollment = (materiaId: string) => {
        if (!user) return;
        const updatedEnrollments = user.enrollments?.filter(e => e.materiaId !== materiaId) || [];
        const updatedUser = { ...user, enrollments: updatedEnrollments };

        setUser(updatedUser);
        localStorage.setItem('app-permutas-user', JSON.stringify(updatedUser));
    };

    const toggleApproved = (materiaId: string) => {
        if (!user) return;
        const currentApproved = user.approvedSubjects || [];

        // If ALREADY approved, we are UN-approving (removing). No validation needed.
        if (currentApproved.includes(materiaId)) {
            const updatedApproved = currentApproved.filter(id => id !== materiaId);
            const updatedUser = { ...user, approvedSubjects: updatedApproved };
            setUser(updatedUser);
            localStorage.setItem('app-permutas-user', JSON.stringify(updatedUser));
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

        setUser(updatedUser);
        localStorage.setItem('app-permutas-user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, logout, loading, addDocument, addEnrollment, removeEnrollment, toggleApproved }}>
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
