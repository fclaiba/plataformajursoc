import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ExchangeRequest } from '../types';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationsContext';
import { recomputePendingMatches } from '../domain/requestMatching';

interface RequestsContextType {
    requests: ExchangeRequest[];
    addRequest: (request: Omit<ExchangeRequest, 'id' | 'createdAt' | 'status'>) => void;
    myRequests: ExchangeRequest[];
    createMatchingRequest: (targetRequestId: string) => void;
    finalizeRequest: (requestId: string) => void;
    completeRequest: (requestId: string) => void;
    cancelRequest: (requestId: string) => void;
}

const RequestsContext = createContext<RequestsContextType | undefined>(undefined);
const STORAGE_KEY = 'app-permutas-requests-v2';

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
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as Array<ExchangeRequest & { createdAt: string }>;
                setRequests(parsed.map((r) => ({ ...r, createdAt: new Date(r.createdAt) })));
                return;
            } catch {
                // Fallback to seeds.
            }
        }
        setRequests(MOCK_OTHER_REQUESTS);
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    }, [requests]);

    const myRequests = requests.filter(r => r.userId === user?.id);

    const addRequest = (newRequestData: Omit<ExchangeRequest, 'id' | 'createdAt' | 'status'>) => {
        const newRequest: ExchangeRequest = {
            ...newRequestData,
            id: crypto.randomUUID(),
            status: 'PENDING',
            createdAt: new Date(),
            finalizedBy: [],
        };

        setRequests(prev => {
            const updated = recomputePendingMatches([...prev, newRequest]);
            const created = updated.find((r) => r.id === newRequest.id);
            if (created?.status === 'MATCHED') {
                addNotification('¡Tenés un Match!', 'Encontramos una solicitud compatible con tus prioridades.', 'success');
            }
            return updated;
        });
    };

    const cancelRequest = (requestId: string) => {
        setRequests(prev => {
            const marked: ExchangeRequest[] = prev.map((r) => (
                r.id === requestId
                    ? { ...r, status: 'CANCELLED' as ExchangeRequest['status'], matchedRequestId: undefined, finalizedBy: [] }
                    : r
            ));
            return recomputePendingMatches(marked);
        });
        addNotification('Solicitud Cancelada', 'Tu pedido ha sido dado de baja.', 'info');
    };

    const createMatchingRequest = (targetRequestId: string) => {
        const targetRequest = requests.find(r => r.id === targetRequestId);
        if (!targetRequest || targetRequest.status !== 'PENDING') return;

        // Create a perfect counter-request
        const counterRequest: ExchangeRequest = {
            id: crypto.randomUUID(),
            userId: 'virtual-student',
            materiaId: targetRequest.materiaId,
            comisionOrigenId: targetRequest.comisionesDestino[0].comisionId, // Has what you want
            comisionesDestino: [{ comisionId: targetRequest.comisionOrigenId, prioridad: 1 }], // Wants what you have
            status: 'PENDING',
            createdAt: new Date(),
            finalizedBy: [],
        };

        setRequests(prev => {
            const updated = recomputePendingMatches([...prev, counterRequest]);
            addNotification('Match simulado', 'Se creó una contraparte para probar el flujo de intercambio.', 'info');
            return updated;
        });
    };

    const finalizeRequest = (requestId: string) => {
        if (!user) return;

        setRequests(prev => {
            const currentReq = prev.find((r) => r.id === requestId);
            if (!currentReq || !currentReq.matchedRequestId) return prev;

            const partnerReq = prev.find((r) => r.id === currentReq.matchedRequestId);
            if (!partnerReq) return prev;

            const updateFinalizers = (request: ExchangeRequest, actorId: string) => {
                const set = new Set(request.finalizedBy || []);
                set.add(actorId);
                return Array.from(set);
            };

            const requestFinalizers = updateFinalizers(currentReq, user.id);
            const partnerFinalizers = partnerReq.userId === 'virtual-student'
                ? updateFinalizers(partnerReq, 'virtual-student')
                : (partnerReq.finalizedBy || []);

            const confirmed = requestFinalizers.length > 0 && partnerFinalizers.length > 0;

            const updated = prev.map((request) => {
                if (request.id === currentReq.id) {
                    const nextStatus: ExchangeRequest['status'] = confirmed ? 'CONFIRMED' : 'MATCHED';
                    return {
                        ...request,
                        finalizedBy: requestFinalizers,
                        status: nextStatus
                    };
                }
                if (request.id === partnerReq.id) {
                    const nextStatus: ExchangeRequest['status'] = confirmed ? 'CONFIRMED' : 'MATCHED';
                    return {
                        ...request,
                        finalizedBy: partnerFinalizers,
                        status: nextStatus
                    };
                }
                return request;
            });

            if (confirmed) {
                addNotification('¡Permuta Confirmada!', 'Ambas partes confirmaron el intercambio.', 'success');
            } else {
                addNotification('Confirmación enviada', 'Falta la confirmación de la otra parte.', 'info');
            }

            return updated;
        });
    };

    const completeRequest = (requestId: string) => {
        setRequests((prev) => {
            const currentReq = prev.find((r) => r.id === requestId);
            if (!currentReq) return prev;
            return prev.map((request) => {
                if (request.id === requestId || request.id === currentReq.matchedRequestId) {
                    return { ...request, status: 'COMPLETED' };
                }
                return request;
            });
        });
    };

    return (
        <RequestsContext.Provider value={{ requests, addRequest, myRequests, createMatchingRequest, finalizeRequest, completeRequest, cancelRequest }}>
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
