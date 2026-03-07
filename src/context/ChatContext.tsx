import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import type { Message } from '../types';

interface ChatContextType {
    messages: Message[];
    sendMessage: (receiverId: string, content: string, requestId: string, file?: File) => void;
    getMessagesByRequest: (requestId: string) => Message[];
    markAsRead: (messageId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);
const CHAT_STORAGE_KEY = 'app-permutas-chat-v1';

// Mock initial messages
const INITIAL_MESSAGES: Message[] = [];

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>(() => {
        const raw = localStorage.getItem(CHAT_STORAGE_KEY);
        if (!raw) return INITIAL_MESSAGES;
        try {
            const parsed = JSON.parse(raw) as Array<Message & { timestamp: string }>;
            return parsed.map((message) => ({ ...message, timestamp: new Date(message.timestamp) }));
        } catch {
            return INITIAL_MESSAGES;
        }
    });

    const persistMessages = (updater: (current: Message[]) => Message[]) => {
        setMessages((prev) => {
            const next = updater(prev);
            localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    };

    const sendMessage = (receiverId: string, content: string, requestId: string, file?: File) => {
        if (!user) return;

        const newMessage: Message = {
            id: crypto.randomUUID(),
            senderId: user.id,
            receiverId,
            requestId,
            content,
            timestamp: new Date(),
            read: false,
            type: file ? 'image' : 'text',
            mediaUrl: file ? URL.createObjectURL(file) : undefined
        };

        persistMessages((current) => [...current, newMessage]);

        // Auto-reply for demo
        if (content.toLowerCase().includes('hola') || (file && Math.random() > 0.5)) {
            setTimeout(() => {
                const reply: Message = {
                    id: crypto.randomUUID(),
                    senderId: receiverId,
                    receiverId: user.id,
                    requestId,
                    content: '¡Hola! Recibí tu mensaje. ¿Te parece si coordinamos?',
                    timestamp: new Date(),
                    read: false,
                    type: 'text'
                };
                persistMessages((current) => [...current, reply]);
            }, 2000);
        }
    };
    const getMessagesByRequest = (requestId: string) => {
        return messages.filter((message) => (
            message.requestId === requestId &&
            (message.senderId === user?.id || message.receiverId === user?.id)
        ));
    };

    const markAsRead = (messageId: string) => {
        persistMessages((current) => current.map((message) => (
            message.id === messageId ? { ...message, read: true } : message
        )));
    };

    return (
        <ChatContext.Provider value={{ messages, sendMessage, getMessagesByRequest, markAsRead }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}
