import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { migrateDatabase } from './db/migrate.js';
import { ensureBootstrapData } from './lib/bootstrap.js';
import { attachSession } from './lib/sessions.js';
import authRoutes from './routes/auth.js';
import collectionRoutes from './routes/collections.js';

export const createApp = async () => {
    await migrateDatabase();
    await ensureBootstrapData();

    const app = express();
    app.disable('x-powered-by');

    app.use(express.json({ limit: '2mb' }));
    app.use(cookieParser());
    app.use(attachSession);

    app.get('/api/health', (_req, res) => {
        res.json({ ok: true, appId: env.appId });
    });

    app.get('/app-config.js', (_req, res) => {
        const firebaseConfig = env.firebase.apiKey && env.firebase.appId
            ? {
                apiKey: env.firebase.apiKey,
                authDomain: env.firebase.authDomain,
                projectId: env.firebase.projectId,
                storageBucket: env.firebase.storageBucket,
                messagingSenderId: env.firebase.messagingSenderId,
                appId: env.firebase.appId,
                ...(env.firebase.measurementId ? { measurementId: env.firebase.measurementId } : {})
            }
            : null;

        res.type('application/javascript');
        res.set('Cache-Control', 'no-store');
        res.send([
            `window.__cluster_api_base_url = ${JSON.stringify(env.appBaseUrl || '')};`,
            `window.__cluster_app_id = ${JSON.stringify(env.appId)};`,
            `window.__cluster_firebase_config = ${JSON.stringify(firebaseConfig)};`
        ].join('\n'));
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/collections', collectionRoutes);

    const blockedStaticPrefixes = [
        '/server/',
        '/functions/',
        '/scripts/',
        '/node_modules/',
        '/package.json',
        '/package-lock.json',
        '/firebase.json',
        '/firestore.rules',
        '/firestore.indexes.json',
        '/.git',
        '/.env'
    ];

    app.use((req, res, next) => {
        if (blockedStaticPrefixes.some((prefix) => req.path === prefix || req.path.startsWith(prefix))) {
            res.status(404).end();
            return;
        }
        next();
    });

    app.use(express.static(env.rootDir, {
        extensions: ['html']
    }));

    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/')) {
            next();
            return;
        }
        res.sendFile(path.join(env.rootDir, 'index.html'));
    });

    app.use((error, _req, res, _next) => {
        const status = Number(error?.status || 500);
        const payload = {
            error: {
                message: error?.message || 'Unexpected server error.',
                code: error?.code || 'internal/error'
            }
        };
        if (status >= 500) {
            console.error(error);
        }
        res.status(status).json(payload);
    });

    return app;
};
