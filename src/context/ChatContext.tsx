import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useAuth } from './AuthContext';
import type { Message } from '../types';
import { chatGenerateUploadUrl, chatGetOrCreateThread, chatListMessagesByThread, chatMarkThreadMessagesAsRead, chatSendMessage } from '../convex/functions';

interface ChatContextType {
    messages: Message[];
    sendMessage: (content: string, requestId: string, file?: File) => Promise<void>;
    getMessagesByRequest: (requestId: string) => Message[];
    markAsRead: (_messageId: string) => void;
    subscribeToRequest: (requestId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);
const CHAT_DEBUG = import.meta.env.DEV;

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [messagesByRequest, setMessagesByRequest] = useState<Record<string, Message[]>>({});
    const getOrCreateThread = useMutation(chatGetOrCreateThread);
    const generateUploadUrl = useMutation(chatGenerateUploadUrl);
    const sendMessageMutation = useMutation(chatSendMessage);
    const markThreadMessagesAsRead = useMutation(chatMarkThreadMessagesAsRead);
    const rows = useQuery(
        chatListMessagesByThread,
        activeThreadId ? { threadId: activeThreadId, limit: 200 } : "skip"
    );

    useEffect(() => {
        if (!activeRequestId || !rows) return;
        if (CHAT_DEBUG) {
            console.info('[chat:rows]', { activeRequestId, activeThreadId, count: rows.length });
        }
        const normalized: Message[] = rows.map((row) => ({
            id: row._id,
            senderId: row.senderUserId,
            receiverId: '',
            requestId: row.requestId,
            content: row.content,
            timestamp: new Date(row.createdAt),
            read: !!row.readAt,
            type: row.type,
            mediaUrl: row.mediaUrl,
        }));
        setMessagesByRequest((current) => ({ ...current, [activeRequestId]: normalized }));
    }, [activeRequestId, rows]);

    const sendMessage = useCallback(async (content: string, requestId: string, file?: File) => {
        if (!user) return;
        const threadId =
            activeThreadId ??
            await getOrCreateThread({
                requestId,
            });
        if (!activeThreadId) setActiveThreadId(threadId);
        if (CHAT_DEBUG) {
            console.info('[chat:send:prepare]', { requestId, threadId, type: file ? 'image' : 'text' });
        }

        let mediaStorageId: string | undefined;
        if (file) {
            const postUrl = await generateUploadUrl({});
            const uploadResponse = await fetch(postUrl, {
                method: 'POST',
                headers: { 'Content-Type': file.type },
                body: file,
            });
            if (!uploadResponse.ok) {
                throw new Error('No se pudo subir el archivo a Convex.');
            }
            const payload = await uploadResponse.json() as { storageId?: string };
            mediaStorageId = payload.storageId;
        }

        await sendMessageMutation({
            threadId,
            requestId,
            senderUserId: user.id,
            content,
            type: file ? 'image' : 'text',
            mediaStorageId,
        });
        if (CHAT_DEBUG) {
            console.info('[chat:send:ok]', { requestId, threadId });
        }
    }, [user, activeThreadId, getOrCreateThread, generateUploadUrl, sendMessageMutation]);
    const getMessagesByRequest = useCallback((requestId: string) => {
        return messagesByRequest[requestId] || [];
    }, [messagesByRequest]);

    const markAsRead = useCallback((messageId: string) => {
        void messageId;
        if (!user || !activeThreadId) return;
        void markThreadMessagesAsRead({
            threadId: activeThreadId,
            readerUserId: user.id,
        });
    }, [user, activeThreadId, markThreadMessagesAsRead]);
    const subscribeToRequest = useCallback((requestId: string) => {
        setActiveRequestId((current) => {
            if (current === requestId) return current;
            setActiveThreadId(null);
            return requestId;
        });
    }, []);
    const messages = useMemo(() => Object.values(messagesByRequest).flat(), [messagesByRequest]);

    useEffect(() => {
        if (!user || !activeRequestId) return;
        void getOrCreateThread({
            requestId: activeRequestId,
        }).then((threadId) => {
            if (CHAT_DEBUG) {
                console.info('[chat:subscribe]', { activeRequestId, threadId });
            }
            setActiveThreadId(threadId);
            void markThreadMessagesAsRead({
                threadId,
                readerUserId: user.id,
            });
        }).catch((error) => {
            console.error('[chat:get-or-create-thread]', error);
        });
    }, [user, activeRequestId, getOrCreateThread, markThreadMessagesAsRead]);

    return (
        <ChatContext.Provider value={{ messages, sendMessage, getMessagesByRequest, markAsRead, subscribeToRequest }}>
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
