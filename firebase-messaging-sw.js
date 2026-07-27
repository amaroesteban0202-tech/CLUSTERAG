/* global firebase, clients */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

const config = JSON.parse(new URL(self.location.href).searchParams.get('config') || '{}');

const showGroupedNotification = async ({ title, body, data = {} }) => {
    const groupId = data.clientId || data.type || 'general';
    const tag = `cluster-chat-${groupId}`;
    const existing = await self.registration.getNotifications({ tag });
    const previousCount = Number(existing[0]?.data?.messageCount || 0);
    const messageCount = previousCount + 1;
    const groupedBody = messageCount > 1
        ? `${body}\n${messageCount} mensajes nuevos`
        : body;

    return self.registration.showNotification(title || 'Cluster Agency OS', {
        body: groupedBody || 'Tienes una notificación nueva',
        icon: '/src/app/assets/cluster-symbol.webp',
        badge: '/src/app/assets/cluster-symbol.webp',
        tag,
        renotify: true,
        silent: false,
        timestamp: Date.now(),
        data: { ...data, messageCount }
    });
};

if (config.projectId && config.messagingSenderId && config.appId) {
    firebase.initializeApp(config);
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
        const data = payload?.data || {};
        return showGroupedNotification({
            title: data.title || payload?.notification?.title,
            body: data.body || payload?.notification?.body,
            data
        });
    });
}

self.addEventListener('message', (event) => {
    if (event.data?.type !== 'cluster:show-notification') return;
    event.waitUntil(showGroupedNotification(event.data.notification || {}));
});

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
