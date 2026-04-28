import { apiFetch, buildApiUrl, getApiOrigin } from './backend-api.js';
import {
    getApp as getFirebaseClientApp,
    getApps as getFirebaseClientApps,
    initializeApp as initializeFirebaseClientApp
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
    getAuth as getFirebaseClientAuth,
    sendSignInLinkToEmail as sendFirebaseSignInLinkToEmail,
    signInWithEmailLink as signInWithFirebaseEmailLink,
    signOut as signOutFirebaseClient
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

const listeners = new Set();
let authSingleton = null;
const EMAIL_LINK_STORAGE_KEY = 'cluster_email_link_for_sign_in';
const NATIVE_GOOGLE_STATE_STORAGE_KEY = 'cluster_native_google_state';

let firebaseEmailAuth = null;

const getFirebaseClientConfig = () => {
    if (typeof window === 'undefined') return null;
    const config = window.__cluster_firebase_config;
    if (!config || typeof config !== 'object') return null;
    if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) return null;
    return config;
};

const createAuthError = (message, code) => {
    const error = new Error(message);
    error.code = code;
    return error;
};

const getFirebaseEmailAuth = () => {
    if (firebaseEmailAuth) return firebaseEmailAuth;
    const config = getFirebaseClientConfig();
    if (!config) {
        throw createAuthError('Falta configurar Firebase Authentication en el cliente.', 'auth/missing-client-config');
    }

    const app = getFirebaseClientApps().length > 0
        ? getFirebaseClientApp()
        : initializeFirebaseClientApp(config);
    firebaseEmailAuth = getFirebaseClientAuth(app);
    return firebaseEmailAuth;
};

const exchangeFirebaseSession = async ({ idToken, email = '' }) => {
    if (!idToken) return null;
    const payload = await apiFetch('/api/auth/firebase/session', {
        method: 'POST',
        body: JSON.stringify({ idToken, email })
    });
    return payload;
};

const normalizeUser = (user = null) => {
    if (!user) return null;
    return {
        uid: user.uid || '',
        email: user.email || '',
        displayName: user.displayName || '',
        emailVerified: user.emailVerified === true,
        isAnonymous: user.isAnonymous === true,
        providerData: Array.isArray(user.providerData) ? user.providerData : []
    };
};

class BackendAuth {
    constructor(app) {
        this.app = app;
        this.currentUser = null;
        this.languageCode = 'es';
        this.readyPromise = this.refreshSession().catch(() => {
            this.currentUser = null;
            this.notify();
        });
    }

    async authStateReady() {
        return this.readyPromise;
    }

    notify() {
        listeners.forEach((listener) => listener(this.currentUser));
    }

    setCurrentUser(user) {
        this.currentUser = normalizeUser(user);
        this.notify();
    }

    async refreshSession() {
        let payload = null;
        try {
            payload = await apiFetch('/api/auth/session');
        } catch (error) {
            if (error.status !== 401 && error.status !== 403) throw error;
        }

        if (!payload?.user) {
            try {
                const firebaseAuth = getFirebaseEmailAuth();
                if (firebaseAuth.currentUser) {
                    const idToken = await firebaseAuth.currentUser.getIdToken();
                    payload = await exchangeFirebaseSession({
                        idToken,
                        email: firebaseAuth.currentUser.email || ''
                    });
                }
            } catch (error) {
                void error;
            }
        }

        this.currentUser = normalizeUser(payload?.user || null);
        this.notify();
        return this.currentUser;
    }
}

export class GoogleAuthProvider {
    constructor() {
        this.providerId = 'google.com';
        this.customParameters = {};
    }

    setCustomParameters(params = {}) {
        this.customParameters = { ...params };
    }
}

export const getAuth = (app) => {
    if (!authSingleton) authSingleton = new BackendAuth(app);
    return authSingleton;
};

export const browserLocalPersistence = { type: 'LOCAL' };

export const setPersistence = async () => {};

export const onAuthStateChanged = (auth, callback) => {
    listeners.add(callback);
    callback(auth.currentUser);
    return () => listeners.delete(callback);
};

export const signInAnonymously = async (auth) => {
    auth.setCurrentUser({
        uid: 'anonymous',
        email: '',
        displayName: 'Invitado',
        emailVerified: false,
        isAnonymous: true,
        providerData: []
    });
    return { user: auth.currentUser };
};

export const isSignInWithEmailLink = (_auth, href = '') => {
    const target = new URL(href || window.location.href);
    return target.searchParams.get('mode') === 'signIn' && Boolean(target.searchParams.get('oobCode'));
};

export const sendSignInLinkToEmail = async (auth, email, actionCodeSettings = {}) => {
    const firebaseAuth = getFirebaseEmailAuth();
    firebaseAuth.languageCode = auth.languageCode || 'es';
    const normalizedEmail = String(email || '').trim();
    if (typeof window !== 'undefined' && normalizedEmail) {
        window.localStorage.setItem(EMAIL_LINK_STORAGE_KEY, normalizedEmail);
    }
    await sendFirebaseSignInLinkToEmail(firebaseAuth, normalizedEmail, actionCodeSettings);
    return {
        ok: true,
        email: normalizedEmail,
        deliveryMode: 'firebase_auth'
    };
};

export const signInWithEmailLink = async (auth, email, href = '') => {
    const firebaseAuth = getFirebaseEmailAuth();
    const result = await signInWithFirebaseEmailLink(firebaseAuth, email, href || window.location.href);
    const idToken = await result.user.getIdToken();
    const payload = await exchangeFirebaseSession({
        idToken,
        email: result.user.email || email || ''
    });
    auth.setCurrentUser(payload?.user || null);
    return { user: auth.currentUser };
};

export const signInWithPopup = async (auth, provider) => {
    if (!provider || provider.providerId !== 'google.com') {
        const error = new Error('Proveedor no soportado.');
        error.code = 'auth/operation-not-allowed';
        throw error;
    }

    const isNativeShell = typeof window !== 'undefined'
        && (
            window.location.protocol === 'capacitor:' ||
            window.location.protocol === 'ionic:' ||
            (window.location.hostname === 'localhost' && window.location.protocol === 'https:')
        );

    if (isNativeShell) {
        const payload = await apiFetch('/api/auth/google/native/start');
        if (payload?.state) {
            window.localStorage.setItem(NATIVE_GOOGLE_STATE_STORAGE_KEY, payload.state);
        }
        window.location.href = payload?.authUrl || buildApiUrl('/api/auth/google/start?redirect=clusteragency%3A%2F%2Fauth%2Fgoogle');
        return { user: null, pendingRedirect: true };
    }

    const popup = window.open(buildApiUrl('/api/auth/google/start?popup=1'), 'cluster-google-auth', 'width=520,height=680');
    if (!popup) {
        const error = new Error('El navegador bloqueo el popup.');
        error.code = 'auth/popup-blocked';
        throw error;
    }

    const apiOrigin = getApiOrigin();

    await new Promise((resolve, reject) => {
        const timeout = window.setTimeout(() => {
            cleanup();
            const error = new Error('Tiempo agotado para el login con Google.');
            error.code = 'auth/popup-closed-by-user';
            reject(error);
        }, 120000);

        const interval = window.setInterval(() => {
            if (!popup || popup.closed) {
                cleanup();
                const error = new Error('El popup fue cerrado.');
                error.code = 'auth/popup-closed-by-user';
                reject(error);
            }
        }, 400);

        const handleMessage = (event) => {
            if (event.origin !== apiOrigin && event.origin !== window.location.origin) return;
            if (event.data?.type === 'cluster-auth:success') {
                cleanup();
                resolve();
                return;
            }
            if (event.data?.type === 'cluster-auth:error') {
                cleanup();
                const error = new Error(event.data.error || 'No se pudo iniciar sesion con Google.');
                error.code = 'auth/operation-not-allowed';
                reject(error);
            }
        };

        const cleanup = () => {
            window.clearTimeout(timeout);
            window.clearInterval(interval);
            window.removeEventListener('message', handleMessage);
            try {
                popup.close();
            } catch (error) {
                void error;
            }
        };

        window.addEventListener('message', handleMessage);
    });

    await auth.refreshSession();
    return { user: auth.currentUser };
};

export const completeGoogleRedirectIfNeeded = async (auth) => {
    const pendingState = typeof window !== 'undefined'
        ? window.localStorage.getItem(NATIVE_GOOGLE_STATE_STORAGE_KEY) || ''
        : '';

    if (pendingState) {
        try {
            const payload = await apiFetch(`/api/auth/google/native/result?state=${encodeURIComponent(pendingState)}`);
            if (payload?.token) {
                await signInWithCustomToken(auth, payload.token);
                window.localStorage.removeItem(NATIVE_GOOGLE_STATE_STORAGE_KEY);
                return Boolean(auth.currentUser?.email);
            }
            if (payload?.pending) return false;
        } catch (error) {
            if (error.status !== 404) throw error;
        }
    }

    await auth.refreshSession();
    return Boolean(auth.currentUser?.email);
};

export const signInWithCustomToken = async (auth, token) => {
    const payload = await apiFetch('/api/auth/token/exchange', {
        method: 'POST',
        body: JSON.stringify({ token })
    });
    auth.setCurrentUser(payload?.user || null);
    return { user: auth.currentUser };
};

export const signOut = async (auth) => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    try {
        const firebaseAuth = getFirebaseEmailAuth();
        if (firebaseAuth.currentUser) {
            await signOutFirebaseClient(firebaseAuth);
        }
    } catch (error) {
        void error;
    }
    auth.setCurrentUser(null);
};
