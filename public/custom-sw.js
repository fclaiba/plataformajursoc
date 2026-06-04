self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const title = data.title || 'App Permutas JurSoc';
    const options = {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-icon.svg',
      data: { url: data.url || '/' },
      vibrate: [200, 100, 200]
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('Error parsing push data', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    let matchingClient = null;
    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      if (windowClient.url === urlToOpen) {
        matchingClient = windowClient;
        break;
      }
    }
    if (matchingClient) {
      return matchingClient.focus();
    } else {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});
