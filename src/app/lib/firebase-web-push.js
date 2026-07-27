const FIREBASE_SDK_VERSION = '10.14.1';
const FIREBASE_APP_SCRIPT = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app-compat.js`;
const FIREBASE_MESSAGING_SCRIPT = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-messaging-compat.js`;

const loadScript = (src) => new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing?.dataset.loaded === 'true') {
        resolve();
        return;
    }

    const script = existing || document.createElement('script');
    script.addEventListener('load', () => {
        script.dataset.loaded = 'true';
        resolve();
    }, { once: true });
    script.addEventListener('error', () => {
        reject(new Error(`No se pudo cargar ${src}`));
    }, { once: true });
    if (!existing) {
        script.src = src;
        script.async = true;
        document.head.appendChild(script);
    }
});

const getFirebaseMessaging = async () => {
    await loadScript(FIREBASE_APP_SCRIPT);
    await loadScript(FIREBASE_MESSAGING_SCRIPT);

    const firebase = window.firebase;
    const config = window.__cluster_firebase_config;
    if (!firebase?.messaging || !config?.projectId || !config?.messagingSenderId || !config?.appId) {
        throw new Error('Firebase Messaging no está configurado.');
    }

    const app = firebase.apps.find((entry) => entry.name === 'cluster-web-push')
        || firebase.initializeApp(config, 'cluster-web-push');
    return app.messaging();
};

export const registerFirebaseWebPush = async ({ onMessage, vapidKey: configuredVapidKey } = {}) => {
    if (
        typeof window === 'undefined'
        || !window.isSecureContext
        || !('serviceWorker' in navigator)
        || typeof Notification === 'undefined'
        || Notification.permission !== 'granted'
    ) {
        return null;
    }

    const config = window.__cluster_firebase_config;
    const workerUrl = `/firebase-messaging-sw.js?config=${encodeURIComponent(JSON.stringify(config || {}))}`;
    const serviceWorkerRegistration = await navigator.serviceWorker.register(workerUrl);
    const messaging = await getFirebaseMessaging();
    const vapidKey = String(
        configuredVapidKey || window.__cluster_firebase_web_push_vapid_key || ''
    ).trim();
    const token = await messaging.getToken({
        serviceWorkerRegistration,
        ...(vapidKey ? { vapidKey } : {})
    });
    if (!token) throw new Error('Firebase no devolvió un token Web Push.');

    return {
        token,
        unsubscribe: typeof onMessage === 'function'
            ? messaging.onMessage(onMessage)
            : null
    };
};
