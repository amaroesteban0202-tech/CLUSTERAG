import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { migrateDatabase } from './db/migrate.js';
import { ensureBootstrapData } from './lib/bootstrap.js';
import { attachSession } from './lib/sessions.js';
import authRoutes from './routes/auth.js';
import collectionRoutes from './routes/collections.js';
import cronRoutes from './routes/cron.js';
import notificationRoutes from './routes/notifications.js';
import directoryRoutes from './routes/directory.js';
import callsRoutes from './routes/calls.js';
import pushRoutes from './routes/push.js';
import { getRequestOrigin, isLocalOrigin } from './lib/request-origin.js';
import reportsRouter from './routes/reports.js';
import chatGroupRoutes from './routes/chat-groups.js';
import { applySecurityHeaders, isTrustedRequestOrigin, requireTrustedOrigin } from './lib/security.js';
import { rateLimit } from './lib/rate-limit.js';

export const createApp = async () => {
    await migrateDatabase();
    if (
        env.isProduction
        && (
            env.sessionSecret === 'change-me-before-production'
            || env.sessionSecret.length < 32
        )
    ) {
        throw new Error('SESSION_SECRET debe ser aleatorio y tener al menos 32 caracteres en produccion.');
    }
    if (
        env.isProduction
        && (env.cronSecret.length < 32 || env.cronSecret.startsWith('change-me'))
    ) {
        throw new Error('CRON_SECRET debe ser aleatorio y tener al menos 32 caracteres en produccion.');
    }
    if (env.runBootstrapOnStart) {
        try {
            await ensureBootstrapData();
        } catch (error) {
            console.error('Bootstrap no disponible durante el arranque:', error?.message || error);
        }
    }

    const app = express();
    app.disable('x-powered-by');
    app.set('trust proxy', 1);
    app.use(applySecurityHeaders);

    const allowedCorsOrigins = new Set([
        env.appBaseUrl,
        'capacitor://localhost',
        'http://localhost',
        'https://localhost'
    ].filter(Boolean));

    app.use((req, res, next) => {
        const origin = req.get('origin');
        if (origin && (allowedCorsOrigins.has(origin) || isTrustedRequestOrigin(req, origin))) {
            res.set('Access-Control-Allow-Origin', origin);
            res.set('Access-Control-Allow-Credentials', 'true');
            res.set('Vary', 'Origin');
        }
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        if (req.method === 'OPTIONS') {
            res.status(204).end();
            return;
        }
        next();
    });

    app.use(requireTrustedOrigin);
    // Limita por IP antes de leer/parsear cuerpos potencialmente costosos.
    app.use('/api', rateLimit({ windowMs: 60_000, max: 600, keyPrefix: 'api-global' }));
    // Los adjuntos embebidos se limitan a 3 MB (aprox. 4 MB en base64).
    app.use(express.json({ limit: '6mb' }));
    app.use(cookieParser());
    app.use(attachSession);

    app.get('/api/health', (_req, res) => {
        res.json({ ok: true, appId: env.appId });
    });

    app.get('/app-config.js', (req, res) => {
        const requestOrigin = getRequestOrigin(req);
        const apiBaseUrl = isLocalOrigin(requestOrigin) ? '' : (env.appBaseUrl || '');
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
            `window.__cluster_api_base_url = ${JSON.stringify(apiBaseUrl)};`,
            `window.__cluster_app_id = ${JSON.stringify(env.appId)};`,
            `window.__cluster_firebase_config = ${JSON.stringify(firebaseConfig)};`,
            `window.__cluster_firebase_web_push_vapid_key = ${JSON.stringify(
                /^[A-Za-z0-9_-]{80,120}$/.test(env.firebase.webPushVapidKey)
                    ? env.firebase.webPushVapidKey
                    : ''
            )};`
        ].join('\n'));
    });

    app.use('/api/auth', rateLimit({ windowMs: 15 * 60_000, max: 60, keyPrefix: 'auth' }), authRoutes);
    app.use('/api/collections', rateLimit({ windowMs: 60_000, max: 300, keyPrefix: 'collections' }), collectionRoutes);
    app.use('/api/cron', cronRoutes);
    app.use('/api/notifications', rateLimit({ windowMs: 10 * 60_000, max: 30, keyPrefix: 'notifications' }), notificationRoutes);
    app.use('/api/directory', directoryRoutes);
    app.use('/api/calls', rateLimit({ windowMs: 10 * 60_000, max: 30, keyPrefix: 'calls' }), callsRoutes);
    app.use('/api/chat-groups', chatGroupRoutes);
    app.use('/api/push', rateLimit({ windowMs: 10 * 60_000, max: 30, keyPrefix: 'push' }), pushRoutes);
    app.use('/api/reports', reportsRouter);

    const publicDir = path.join(env.rootDir, 'public');
    app.use(express.static(publicDir, {
        extensions: ['html']
    }));

    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/')) {
            next();
            return;
        }
        res.sendFile(path.join(publicDir, 'index.html'));
    });

    app.use((error, _req, res, _next) => {
        const status = Number(error?.status || 500);
        const isServerError = status >= 500;
        const payload = {
            error: {
                message: isServerError ? 'Error interno del servidor.' : (error?.message || 'Solicitud invalida.'),
                code: isServerError ? 'internal/error' : (error?.code || 'request/error')
            }
        };
        if (isServerError) {
            console.error(error);
        }
        res.status(status).json(payload);
    });

    return app;
};
