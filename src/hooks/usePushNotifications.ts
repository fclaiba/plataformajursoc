import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

const urlB64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  const subscribeMutation = useMutation(api.push.subscribe);
  const unsubscribeMutation = useMutation(api.push.unsubscribe);
  const vapidPublicKey = useQuery(api.push.getVapidPublicKey);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (e) {
      console.error('Error checking push subscription', e);
    }
  };

  const subscribe = async () => {
    if (!isSupported || !vapidPublicKey) return false;

    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        throw new Error('Permission denied.');
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(vapidPublicKey)
        });
      }

      // Convert to format
      const subJSON = subscription.toJSON();
      if (!subJSON.endpoint || !subJSON.keys) throw new Error('Invalid subscription');

      await subscribeMutation({
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys.p256dh,
        auth: subJSON.keys.auth
      });

      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error('Error subscribing to push', error);
      return false;
    }
  };

  const unsubscribe = async () => {
    if (!isSupported) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await unsubscribeMutation({ endpoint: subscription.endpoint });
        await subscription.unsubscribe();
        setIsSubscribed(false);
      }
      return true;
    } catch (error) {
      console.error('Error unsubscribing', error);
      return false;
    }
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
    isReady: vapidPublicKey !== undefined
  };
};
