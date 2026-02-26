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

// Mock initial messages
const INITIAL_MESSAGES: Message[] = [];

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);

    const sendMessage = (receiverId: string, content: string, _requestId: string, file?: File) => {
        if (!user) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            senderId: user.id,
            receiverId,
            content, // Check: if content is empty but file exists?
            timestamp: new Date(),
            read: false,
            type: file ? 'image' : 'text',
            mediaUrl: file ? URL.createObjectURL(file) : undefined
        };

        setMessages(prev => [...prev, newMessage]);

        // Auto-reply for demo
        if (content.toLowerCase().includes('hola') || (file && Math.random() > 0.5)) {
            setTimeout(() => {
                const reply: Message = {
                    id: (Date.now() + 1).toString(),
                    senderId: receiverId,
                    receiverId: user.id,
                    content: '¡Hola! Recibí tu mensaje. ¿Te parece si coordinamos?',
                    timestamp: new Date(),
                    read: false,
                    type: 'text'
                };
                setMessages(prev => [...prev, reply]);
            }, 2000);
        }
    };
    const getMessagesByRequest = (_requestId: string) => {
        // Mock filtering
        return messages.filter(m => m.senderId === user?.id || m.receiverId === user?.id);
    };

    const markAsRead = (messageId: string) => {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, read: true } : m));
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
