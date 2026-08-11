(() => {
    const isNativeShell = ['capacitor:', 'ionic:'].includes(window.location.protocol)
        || Boolean(window.Capacitor?.isNativePlatform?.());

    window.__cluster_app_id = 'cluster-agency-pro-mobile-v7';
    window.__cluster_api_base_url = isNativeShell
        ? 'https://clusterag.vercel.app'
        : '';
    window.__cluster_firebase_config = {
        apiKey: 'AIzaSyBAnY2ihWlow17H-TjUKgueWpw2MqYpzUc',
        authDomain: 'cluster-41f73.firebaseapp.com',
        projectId: 'cluster-41f73',
        storageBucket: 'cluster-41f73.firebasestorage.app',
        messagingSenderId: '210834819744',
        appId: '1:210834819744:web:e10ca79a3f9a5eb866d7c5',
        measurementId: 'G-N16QDLDC7P'
    };
    window.__cluster_firebase_web_push_vapid_key =
        'BHbOd2_amFAMRFu_C45iJ2_zWZWFVAd-nKlNyavVUUdYWXxnmGOGRECjhddsFvD51RPw63eLO25nnZj7aOHhH1I';
})();
