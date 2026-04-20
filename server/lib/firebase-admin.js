import admin from 'firebase-admin';
import { env } from '../config/env.js';

let firebaseAdminApp = null;

export const getFirebaseAdminApp = () => {
    if (firebaseAdminApp) return firebaseAdminApp;
    if (admin.apps.length > 0) {
        firebaseAdminApp = admin.app();
        return firebaseAdminApp;
    }

    const options = {};
    if (env.firebase.projectId) {
        options.projectId = env.firebase.projectId;
    }

    firebaseAdminApp = admin.initializeApp(options);
    return firebaseAdminApp;
};

export const verifyFirebaseIdToken = async (idToken = '') => {
    const normalizedToken = String(idToken || '').trim();
    if (!normalizedToken) return null;
    const app = getFirebaseAdminApp();
    return app.auth().verifyIdToken(normalizedToken);
};
