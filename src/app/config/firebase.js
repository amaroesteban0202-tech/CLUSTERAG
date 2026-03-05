import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (error) {
    console.warn('Firebase no conectado', error);
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'cluster-agency-pro-mobile-v6';

export { auth, db, appId };
