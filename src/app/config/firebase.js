import { getApp, getApps, initializeApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = typeof window !== 'undefined'
    ? (window.__cluster_firebase_config || null)
    : null;

const dataAppId = typeof window !== 'undefined' && window.__cluster_app_id
        ? window.__cluster_app_id
        : 'cluster-agency-pro-mobile-v6';

let auth = null;
let db = null;

try {
    if (!firebaseConfig?.apiKey || !firebaseConfig?.projectId || !firebaseConfig?.appId) {
        throw new Error('Falta configuracion de Firebase en window.__cluster_firebase_config.');
    }

    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);

    setPersistence(auth, browserLocalPersistence).catch((error) => {
        console.warn('No se pudo fijar la persistencia local de Firebase Auth:', error);
    });

    db = getFirestore(app);
} catch (error) {
    try {
        const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = initializeFirestore(app, {});
    } catch (fallbackError) {
        console.warn('No se pudo inicializar Firebase:', fallbackError || error);
    }
}

const appId = dataAppId;

export { auth, db, appId };
