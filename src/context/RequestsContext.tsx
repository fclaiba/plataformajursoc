import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ExchangeRequest } from '../types';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationsContext';

interface RequestsContextType {
    requests: ExchangeRequest[];
    addRequest: (request: Omit<ExchangeRequest, 'id' | 'createdAt' | 'status'>) => void;
    myRequests: ExchangeRequest[];
    createMatchingRequest: (targetRequestId: string) => void;
    finalizeRequest: (requestId: string) => void;
    cancelRequest: (requestId: string) => void;
}

const RequestsContext = createContext<RequestsContextType | undefined>(undefined);

// Mock Data for other users
const MOCK_OTHER_REQUESTS: ExchangeRequest[] = [
    {
        id: 'req-101',
        userId: 'user-2',
        materiaId: 'civ-1', // Civil I
        comisionOrigenId: 'com-2', // Has Com 2
        comisionesDestino: [{ comisionId: 'com-1', prioridad: 1 }], // Wants Com 1
        status: 'PENDING',
        createdAt: new Date()
    }
];

export function RequestsProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    const [requests, setRequests] = useState<ExchangeRequest[]>([]);

    // Load initial mock data
    useEffect(() => {
        setRequests(prev => [...prev, ...MOCK_OTHER_REQUESTS]);
    }, []);

    const myRequests = requests.filter(r => r.userId === user?.id);

    const checkForMatches = (currentParams: ExchangeRequest[]) => {
        // Simple Direct Match Logic: A has X wants Y <-> B has Y wants X
        // We only check against the newest request usually, but here we scan all for demo

        // For every request of mine
        const myPending = currentParams.filter(r => r.userId === user?.id && r.status === 'PENDING');

        myPending.forEach(myReq => {
            // Find a match in others
            const match = currentParams.find(other =>
                other.userId !== user?.id &&
                other.status === 'PENDING' &&
                other.materiaId === myReq.materiaId &&
                other.comisionOrigenId === myReq.comisionesDestino[0].comisionId && // Keeps simple: checks first preference
                other.comisionesDestino.some(d => d.comisionId === myReq.comisionOrigenId)
            );

            if (match) {
                // Found a match!
                updateStatus(myReq.id, 'MATCHED');
                updateStatus(match.id, 'MATCHED');
                addNotification(
                    '¡Tenés un Match!',
                    `Alguien tiene la comisión que buscás en ${myReq.materiaId} y quiere la tuya.`,
                    'success'
                );
            }
        });
    };

    const updateStatus = (id: string, status: ExchangeRequest['status']) => {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    };

    const addRequest = (newRequestData: Omit<ExchangeRequest, 'id' | 'createdAt' | 'status'>) => {
        const newRequest: ExchangeRequest = {
            ...newRequestData,
            id: Math.random().toString(36).substr(2, 9),
            status: 'PENDING',
            createdAt: new Date(),
        };

        setRequests(prev => {
            const updated = [...prev, newRequest];
            // Auto-check for matches after adding
            setTimeout(() => checkForMatches(updated), 500);
            return updated;
        });
    };

    const cancelRequest = (requestId: string) => {
        setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'CANCELLED' } : r));
        addNotification('Solicitud Cancelada', 'Tu pedido ha sido dado de baja.', 'info');
    };

    const createMatchingRequest = (targetRequestId: string) => {
        const targetRequest = requests.find(r => r.id === targetRequestId);
        if (!targetRequest || targetRequest.status !== 'PENDING') return;

        // Create a perfect counter-request
        const counterRequest: ExchangeRequest = {
            id: `match-${Date.now()}`,
            userId: 'virtual-student',
            materiaId: targetRequest.materiaId,
            comisionOrigenId: targetRequest.comisionesDestino[0].comisionId, // Has what you want
            comisionesDestino: [{ comisionId: targetRequest.comisionOrigenId, prioridad: 1 }], // Wants what you have
            status: 'PENDING',
            createdAt: new Date()
        };

        setRequests(prev => {
            const updated = [...prev, counterRequest];
            // Check matches immediately
            setTimeout(() => checkForMatches(updated), 500);
            return updated;
        });
    };

    const finalizeRequest = (requestId: string) => {
        if (!user) return;

        setRequests(prev => {
            const currentReq = prev.find(r => r.id === requestId);
            if (!currentReq) return prev;

            const updatedFinalizedBy = [...(currentReq.finalizedBy || []), user.id];

            // Logic: Check if partner also finalized (Simulated for Demo)
            // In a real app we would check the 'matchedRequestId' and its 'finalizedBy'
            // For Demo: If I finalize, I wait. If Partner finalized, we Confirm.
            // We will simulate Partner finalizing after 3 seconds if they haven't.

            const isComplete = updatedFinalizedBy.length >= 2; // Simplification: if this single object has 2 IDs (requires shared object model which we don't strictly have, but we can simulate by adding 'virtual-student' id immediately for demo)

            // Demo Hack: If I finalize, assume Virtual Student finalizes after 2s
            if (!updatedFinalizedBy.includes('virtual-student') && currentReq.userId !== 'virtual-student') {
                setTimeout(() => {
                    setRequests(current => current.map(r => {
                        if (r.id === requestId) {
                            return {
                                ...r,
                                finalizedBy: [...(r.finalizedBy || []), 'virtual-student'],
                                status: 'CONFIRMED'
                            };
                        }
                        return r;
                    }));
                    addNotification('¡Permuta Confirmada!', 'Tu compañero también ha finalizado el intercambio.', 'success');
                }, 3000);
            }

            return prev.map(r => r.id === requestId ? {
                ...r,
                finalizedBy: updatedFinalizedBy,
                // Status remains MATCHED until both finalize, or we can use a transient status? 
                // Let's keep MATCHED but UI will show "Waiting" based on finalizedBy.includes(me)
                status: isComplete ? 'CONFIRMED' : 'MATCHED'
            } : r);
        });
    };

    return (
        <RequestsContext.Provider value={{ requests, addRequest, myRequests, createMatchingRequest, finalizeRequest, cancelRequest }}>
            {children}
        </RequestsContext.Provider>
    );
}

export function useRequests() {
    const context = useContext(RequestsContext);
    if (context === undefined) {
        throw new Error('useRequests must be used within a RequestsProvider');
    }
    return context;
}
