import React, { createContext, useContext } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useAuth } from './AuthContext';
import {
    notificationsClearByUser,
    notificationsCreate,
    notificationsListByUser,
    notificationsMarkRead,
} from '../convex/functions';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    source?: 'auth' | 'requests' | 'chat' | 'ranking' | 'system';
    read: boolean;
    createdAt: Date;
}

interface NotificationsContextType {
    notifications: Notification[];
    addNotification: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error', source?: Notification['source']) => void;
    markAsRead: (id: string) => void;
    clearAll: () => void;
    unreadCount: number;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const createNotificationMutation = useMutation(notificationsCreate);
    const markReadMutation = useMutation(notificationsMarkRead);
    const clearByUserMutation = useMutation(notificationsClearByUser);
    const rows = useQuery(
        notificationsListByUser,
        user?.id ? { userId: user.id, limit: 100 } : "skip"
    );

    const notifications: Notification[] = (rows || []).map((row) => ({
        id: row._id,
        title: row.title,
        message: row.message,
        type: row.type,
        source: row.source,
        read: !!row.readAt,
        createdAt: new Date(row.createdAt),
    }));

    const addNotification = (
        title: string,
        message: string,
        type: 'info' | 'success' | 'warning' | 'error' = 'info',
        source: Notification['source'] = 'system'
    ) => {
        if (!user?.id) return;
        void createNotificationMutation({
            userId: user.id,
            title,
            message,
            type,
            source,
        });
    };

    const markAsRead = (id: string) => {
        void markReadMutation({ notificationId: id });
    };

    const clearAll = () => {
        if (!user?.id) return;
        void clearByUserMutation({ userId: user.id });
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationsContext.Provider value={{ notifications, addNotification, markAsRead, clearAll, unreadCount }}>
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationsContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationsProvider');
    }
    return context;
}
