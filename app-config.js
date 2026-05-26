(() => {
    const localHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]']);
    const isLocalWeb = ['http:', 'https:'].includes(window.location.protocol)
        && localHosts.has(window.location.hostname);

    window.__cluster_app_id = 'cluster-agency-pro-mobile-v6';
    window.__cluster_api_base_url = isLocalWeb ? '' : 'https://clusterag.vercel.app';
    window.__cluster_firebase_config = {
        apiKey: 'AIzaSyBAnY2ihWlow17H-TjUKgueWpw2MqYpzUc',
        authDomain: 'cluster-41f73.firebaseapp.com',
        projectId: 'cluster-41f73',
        storageBucket: 'cluster-41f73.firebasestorage.app',
        messagingSenderId: '210834819744',
        appId: '1:210834819744:web:e10ca79a3f9a5eb866d7c5',
        measurementId: 'G-N16QDLDC7P'
    };
})();
