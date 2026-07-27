/* global firebase, clients */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

const config = JSON.parse(new URL(self.location.href).searchParams.get('config') || '{}');

if (config.projectId && config.messagingSenderId && config.appId) {
    firebase.initializeApp(config);
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
        const data = payload?.data || {};
        return self.registration.showNotification(
            data.title || payload?.notification?.title || 'Cluster Agency OS',
            {
                body: data.body || payload?.notification?.body || 'Tienes una notificación nueva',
                icon: '/src/app/assets/cluster-symbol.webp',
                tag: data.messageId ? `cluster-message-${data.messageId}` : 'cluster-notification',
                data
            }
        );
    });
}

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const link = new URL(event.notification.data?.link || '/', self.location.origin).href;
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
            const existing = windows.find((client) => client.url.startsWith(self.location.origin));
            return existing ? existing.focus() : clients.openWindow(link);
        })
    );
});
