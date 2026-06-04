import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useConvex, useMutation, useQuery } from 'convex/react';
import type { ExchangeRequest } from '../types';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationsContext';
import {
    requestsCancel,
    requestsComplete,
    requestsCreate,
    requestsFinalize,
    requestsListVisibleByUser,
    subjectsGetCatalogIdsByExternal,
} from '../convex/functions';

interface RequestsContextType {
    requests: ExchangeRequest[];
    addRequest: (request: Omit<ExchangeRequest, 'id' | 'createdAt' | 'status'>) => Promise<void>;
    myRequests: ExchangeRequest[];
    createMatchingRequest: (_targetRequestId: string) => void;
    finalizeRequest: (requestId: string) => Promise<void>;
    cancelRequest: (requestId: string) => Promise<void>;
}

const RequestsContext = createContext<RequestsContextType | undefined>(undefined);

export function RequestsProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    const convex = useConvex();
    const createRequestMutation = useMutation(requestsCreate);
    const cancelRequestMutation = useMutation(requestsCancel);
    const finalizeRequestMutation = useMutation(requestsFinalize);
    const completeRequestMutation = useMutation(requestsComplete);
    const autoClosingRequestsRef = useRef<Set<string>>(new Set());
    const rows = useQuery(
        requestsListVisibleByUser,
        user?.id ? { userId: user.id, limit: 100 } : "skip"
    );

    const requests = useMemo<ExchangeRequest[]>(() => {
        return (rows || []).map((row) => ({
            id: row._id,
            userId: row.userId,
            materiaId: row.subjectExternalId ?? row.subjectId,
            comisionOrigenId: row.commissionOriginExternalId ?? row.commissionOriginId,
            comisionesDestino: (row.destinationsExternal || row.destinations || []).map((destination: any) => ({
                comisionId: destination.commissionId,
                prioridad: destination.priority,
            })),
            status: row.status,
            createdAt: new Date(row.createdAt),
            giveToRequestId: row.giveToRequestId,
            receiveFromRequestId: row.receiveFromRequestId,
            finalizedBy: row.finalizedBy,
        }));
    }, [rows]);

    const myRequests = requests.filter((request) => request.userId === user?.id);

    useEffect(() => {
        if (!user?.id) return;
        for (const request of myRequests) {
            if (request.status !== 'CONFIRMED' || (!request.giveToRequestId && !request.receiveFromRequestId)) continue;
            if (autoClosingRequestsRef.current.has(request.id)) continue;
            autoClosingRequestsRef.current.add(request.id);
            void completeRequestMutation({ requestId: request.id })
                .catch((error) => {
                    const message = error instanceof Error ? error.message : 'No se pudo cerrar automáticamente la permuta.';
                    addNotification('Cierre automático pendiente', message, 'warning', 'requests');
                })
                .finally(() => {
                    autoClosingRequestsRef.current.delete(request.id);
                });
        }
    }, [myRequests, user?.id, completeRequestMutation, addNotification]);

    const addRequest = async (newRequestData: Omit<ExchangeRequest, 'id' | 'createdAt' | 'status'>) => {
        if (!user?.id) return;
        const destinationExternalIds = newRequestData.comisionesDestino.map((destination) => destination.comisionId);
        const mapping = await convex.query(subjectsGetCatalogIdsByExternal, {
            subjectExternalId: newRequestData.materiaId,
            commissionExternalIds: [newRequestData.comisionOrigenId, ...destinationExternalIds],
        });

        if (!mapping.subjectId) {
            throw new Error('La materia seleccionada no existe en Convex.');
        }

        const commissionMap = new Map(mapping.commissions.map((commission) => [commission.externalId, commission.id]));
        const originCommissionId = commissionMap.get(newRequestData.comisionOrigenId);
        if (!originCommissionId) {
            throw new Error('No se pudo resolver la comisión de origen.');
        }

        const destinations = newRequestData.comisionesDestino
            .map((destination) => ({
                commissionId: commissionMap.get(destination.comisionId),
                priority: destination.prioridad,
            }))
            .filter((destination): destination is { commissionId: string; priority: number } => !!destination.commissionId);

        if (destinations.length === 0) {
            throw new Error('No se pudieron resolver comisiones de destino en Convex.');
        }

        await createRequestMutation({
            subjectId: mapping.subjectId,
            commissionOriginId: originCommissionId,
            destinations,
        });

        addNotification('Solicitud creada', 'Tu solicitud ya está publicada en Convex.', 'success', 'requests');
    };

    const cancelRequest = async (requestId: string) => {
        if (!user?.id) return;
        try {
            await cancelRequestMutation({ requestId });
            addNotification('Solicitud cancelada', 'Tu pedido fue dado de baja y el matching se recalculará.', 'info', 'requests');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'No se pudo cancelar la solicitud.';
            addNotification('Cancelación inválida', message, 'warning', 'requests');
        }
    };

    const createMatchingRequest = () => {
        addNotification('Matching automático', 'El matching ahora se ejecuta desde Convex.', 'info', 'requests');
    };

    const finalizeRequest = async (requestId: string) => {
        if (!user?.id) return;
        try {
            await finalizeRequestMutation({ requestId });
            addNotification('Confirmación enviada', 'Tu confirmación fue registrada. El cierre se completa cuando ambos confirman.', 'success', 'requests');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'No se pudo confirmar la solicitud.';
            addNotification('Confirmación inválida', message, 'warning', 'requests');
        }
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
