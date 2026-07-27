/* global firebase */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

const config = JSON.parse(new URL(self.location.href).searchParams.get('config') || '{}');

if (config.projectId && config.messagingSenderId && config.appId) {
    firebase.initializeApp(config);
    firebase.messaging();
}
