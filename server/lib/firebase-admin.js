import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
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

    firebaseAdminApp = initializeApp(options);
    return firebaseAdminApp;
};

export const verifyFirebaseIdToken = async (idToken = '') => {
    const normalizedToken = String(idToken || '').trim();
    if (!normalizedToken) return null;
    const app = getFirebaseAdminApp();
    return getAuth(app).verifyIdToken(normalizedToken);
};
