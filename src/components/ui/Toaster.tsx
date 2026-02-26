import { useEffect, useState } from 'react';
import { useNotifications } from '../../context/NotificationsContext';
import { X } from 'lucide-react';

export function Toaster() {
    const { notifications } = useNotifications();
    const [show, setShow] = useState(false);
    const [latest, setLatest] = useState(notifications[0]);

    useEffect(() => {
        if (notifications.length > 0) {
            const newNotification = notifications[0];
            // Only show if it's recent (created in the last few seconds)
            const now = new Date();
            const diff = now.getTime() - new Date(newNotification.createdAt).getTime();

            if (diff < 1000) { // If less than 1 second old
                setLatest(newNotification);
                setShow(true);
                const timer = setTimeout(() => setShow(false), 3000);
                return () => clearTimeout(timer);
            }
        }
    }, [notifications]);

    if (!show || !latest) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className={`
        flex items-center p-4 rounded-lg shadow-lg text-white max-w-sm
        ${latest.type === 'success' ? 'bg-green-600' :
                    latest.type === 'error' ? 'bg-red-600' : 'bg-gray-800'}
      `}>
                <div className="flex-1 mr-2">
                    <h4 className="font-bold text-sm">{latest.title}</h4>
                    <p className="text-xs opacity-90">{latest.message}</p>
                </div>
                <button onClick={() => setShow(false)} className="opacity-70 hover:opacity-100">
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
