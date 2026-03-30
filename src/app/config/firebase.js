import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyBAnY2ihWlow17H-TjUKgueWpw2MqYpzUc',
    authDomain: 'cluster-41f73.firebaseapp.com',
    projectId: 'cluster-41f73',
    storageBucket: 'cluster-41f73.firebasestorage.app',
    messagingSenderId: '210834819744',
    appId: '1:210834819744:web:e10ca79a3f9a5eb866d7c5',
    measurementId: 'G-N16QDLDC7P'
};

let auth = null;
let db = null;
let emulatorConnected = false;
const FIRESTORE_EMULATOR_PORT = 8787;

const shouldUseFirestoreEmulator = () => {
    if (typeof window === 'undefined') return false;

    const url = new URL(window.location.href);
    const explicitTarget = url.searchParams.get('firestore');
    if (explicitTarget === 'emulator') return true;
    if (explicitTarget === 'prod') return false;

    return window.localStorage.getItem('cluster_firestore_target') === 'emulator';
};

try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    if (db && shouldUseFirestoreEmulator() && !emulatorConnected) {
        connectFirestoreEmulator(db, '127.0.0.1', FIRESTORE_EMULATOR_PORT);
        emulatorConnected = true;
        console.info(`Firestore emulador local conectado en 127.0.0.1:${FIRESTORE_EMULATOR_PORT}`);
    }
} catch (error) {
    console.warn('Firebase no conectado', error);
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'cluster-agency-pro-mobile-v6';

export { auth, db, appId };
