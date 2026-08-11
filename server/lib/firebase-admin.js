import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { env } from '../config/env.js';

let firebaseAdminApp = null;
const IDENTITY_TOOLKIT_LOOKUP_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup';

const createFirebaseVerificationError = (message, code = 'auth/invalid-id-token', cause) => {
    const error = new Error(message, cause ? { cause } : undefined);
    error.code = code;
    return error;
};

export const verifyFirebaseIdTokenWithIdentityToolkit = async (
    idToken = '',
    {
        apiKey = env.firebase.apiKey,
        fetchImpl = globalThis.fetch
    } = {}
) => {
    const normalizedToken = String(idToken || '').trim();
    const normalizedApiKey = String(apiKey || '').trim();
    if (!normalizedToken) {
        throw createFirebaseVerificationError('El token de Firebase esta vacio.');
    }
    if (!normalizedApiKey || typeof fetchImpl !== 'function') {
        throw createFirebaseVerificationError(
            'Firebase Identity Toolkit no esta configurado.',
            'auth/firebase-verification-unavailable'
        );
    }

    let response;
    try {
        response = await fetchImpl(`${IDENTITY_TOOLKIT_LOOKUP_URL}?key=${encodeURIComponent(normalizedApiKey)}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ idToken: normalizedToken })
        });
    } catch (error) {
        throw createFirebaseVerificationError(
            'No se pudo consultar Firebase Identity Toolkit.',
            'auth/firebase-verification-unavailable',
            error
        );
    }

    let payload = null;
    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    const firebaseUser = Array.isArray(payload?.users) ? payload.users[0] : null;
    if (!response.ok || !firebaseUser?.localId || !firebaseUser?.email) {
        const upstreamCode = String(payload?.error?.message || '').trim();
        throw createFirebaseVerificationError(
            upstreamCode ? `Firebase rechazo el token (${upstreamCode}).` : 'Firebase rechazo el token.'
        );
    }

    const provider = (Array.isArray(firebaseUser.providerUserInfo)
        ? firebaseUser.providerUserInfo.find((item) => item?.providerId)?.providerId
        : '') || 'password';

    return {
        uid: String(firebaseUser.localId),
        sub: String(firebaseUser.localId),
        email: String(firebaseUser.email),
        name: String(firebaseUser.displayName || ''),
        email_verified: firebaseUser.emailVerified === true,
        firebase: {
            sign_in_provider: provider
        }
    };
};

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
    let adminError = null;
    try {
        const { getAuth } = await import('firebase-admin/auth');
        const app = getFirebaseAdminApp();
        return await getAuth(app).verifyIdToken(normalizedToken);
    } catch (error) {
        adminError = error;
        // Se registra aqui y no solo al fallar el respaldo: cuando Identity
        // Toolkit valida bien, el login funciona y el fallo de Admin quedaba
        // invisible. Sin esto no hay forma de saber por que Admin no verifica.
        console.warn('[auth:firebase-admin-fallback]', {
            code: String(error?.code || ''),
            message: String(error?.message || '')
        });
    }

    try {
        return await verifyFirebaseIdTokenWithIdentityToolkit(normalizedToken);
    } catch (error) {
        error.adminCode = String(adminError?.code || '');
        throw error;
    }
};
