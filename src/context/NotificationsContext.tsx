import React, { createContext, useContext, useState } from 'react';

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
const NOTIFICATIONS_STORAGE_KEY = 'app-permutas-notifications-v1';

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>(() => {
        const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw) as Array<Notification & { createdAt: string }>;
            return parsed.map((notification) => ({ ...notification, createdAt: new Date(notification.createdAt) }));
        } catch {
            return [];
        }
    });

    const persistNotifications = (updater: (current: Notification[]) => Notification[]) => {
        setNotifications((prev) => {
            const next = updater(prev);
            localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    };

    const addNotification = (
        title: string,
        message: string,
        type: 'info' | 'success' | 'warning' | 'error' = 'info',
        source: Notification['source'] = 'system'
    ) => {
        const newNotification: Notification = {
            id: crypto.randomUUID(),
            title,
            message,
            type,
            source,
            read: false,
            createdAt: new Date(),
        };
        persistNotifications((current) => [newNotification, ...current]);
    };

    const markAsRead = (id: string) => {
        persistNotifications((current) => current.map((notification) => (
            notification.id === id ? { ...notification, read: true } : notification
        )));
    };

    const clearAll = () => {
        persistNotifications(() => []);
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
