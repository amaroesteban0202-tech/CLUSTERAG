import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const backendConfig = {
    apiBaseUrl: typeof window !== 'undefined' ? (window.__cluster_api_base_url || '') : '',
    appId: typeof window !== 'undefined' && window.__cluster_app_id
        ? window.__cluster_app_id
        : 'cluster-agency-pro-mobile-v7'
};

let auth = null;
let db = null;

try {
    const app = initializeApp(backendConfig);
    auth = getAuth(app);
    db = initializeFirestore(app, {
        apiBaseUrl: backendConfig.apiBaseUrl
    });
} catch (error) {
    console.warn('Backend local no conectado', error);
}

const appId = backendConfig.appId;

export { auth, db, appId };
