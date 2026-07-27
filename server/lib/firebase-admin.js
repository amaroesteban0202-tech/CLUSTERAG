import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { env } from '../config/env.js';

let firebaseAdminApp = null;

export const getFirebaseAdminApp = () => {
    if (firebaseAdminApp) return firebaseAdminApp;
    if (getApps().length > 0) {
        firebaseAdminApp = getApp();
        return firebaseAdminApp;
    }

    const options = {};
    if (env.firebase.projectId) {
        options.projectId = env.firebase.projectId;
    }
    if (env.firebase.clientEmail && env.firebase.privateKey) {
        options.credential = cert({
            projectId: env.firebase.projectId,
            clientEmail: env.firebase.clientEmail,
            privateKey: env.firebase.privateKey
        });
    }

    firebaseAdminApp = initializeApp(options);
    return firebaseAdminApp;
};

export const verifyFirebaseIdToken = async (idToken = '') => {
    const normalizedToken = String(idToken || '').trim();
    if (!normalizedToken) return null;
    const { getAuth } = await import('firebase-admin/auth');
    const app = getFirebaseAdminApp();
    return getAuth(app).verifyIdToken(normalizedToken);
};
