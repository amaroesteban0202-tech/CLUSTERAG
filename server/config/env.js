import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    DEFAULT_EDITORS_TEAM,
    DEFAULT_MANAGEMENT_TEAM,
    DEFAULT_SUPER_ADMIN_EMAILS
} from './bootstrap.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const parseNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const parseBoolean = (value, fallback = false) => {
    if (typeof value === 'boolean') return value;
    if (typeof value !== 'string') return fallback;
    if (['1', 'true', 'yes', 'on'].includes(value.toLowerCase())) return true;
    if (['0', 'false', 'no', 'off'].includes(value.toLowerCase())) return false;
    return fallback;
};

const parseCsv = (value, fallback = []) => {
    if (!value || typeof value !== 'string') return fallback;
    const items = value.split(',').map((item) => item.trim()).filter(Boolean);
    return items.length > 0 ? items : fallback;
};

const parseJson = (value, fallback) => {
    if (!value || typeof value !== 'string') return fallback;
    try {
        return JSON.parse(value);
    } catch (error) {
        console.warn('No se pudo parsear una variable JSON de entorno:', error.message);
        return fallback;
    }
};

const defaultFirebaseProjectId = process.env.FIREBASE_PROJECT_ID || 'cluster-41f73';

export const env = {
    rootDir,
    isProduction: process.env.NODE_ENV === 'production',
    port: parseNumber(process.env.PORT, 3000),
    appBaseUrl: process.env.APP_BASE_URL || '',
    appId: process.env.APP_ID || 'cluster-agency-pro-mobile-v7',
    databaseClient: process.env.DATABASE_CLIENT === 'mysql2' ? 'mysql2' : 'sqlite3',
    sqliteFilename: path.resolve(rootDir, process.env.SQLITE_FILENAME || '.tmp/clusterag.sqlite'),
    mysql: {
        host: process.env.MYSQL_HOST || '127.0.0.1',
        port: parseNumber(process.env.MYSQL_PORT, 3306),
        database: process.env.MYSQL_DATABASE || 'clusterag',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || ''
    },
    sessionCookieName: process.env.SESSION_COOKIE_NAME || 'cluster_session',
    sessionSecret: process.env.SESSION_SECRET || 'change-me-before-production',
    sessionTtlHours: parseNumber(process.env.SESSION_TTL_HOURS, 720),
    magicLinkTtlMinutes: parseNumber(process.env.MAGIC_LINK_TTL_MINUTES, 30),
    seedSuperAdminEmails: parseCsv(process.env.SEED_SUPER_ADMIN_EMAILS, DEFAULT_SUPER_ADMIN_EMAILS),
    seedManagementTeam: parseJson(process.env.SEED_MANAGEMENT_TEAM_JSON, DEFAULT_MANAGEMENT_TEAM),
    seedEditorsTeam: parseJson(process.env.SEED_EDITOR_TEAM_JSON, DEFAULT_EDITORS_TEAM),
    smtp: {
        host: process.env.SMTP_HOST || '',
        port: parseNumber(process.env.SMTP_PORT, 587),
        secure: parseBoolean(process.env.SMTP_SECURE, false),
        user: process.env.SMTP_USER || '',
        password: process.env.SMTP_PASSWORD || '',
        from: process.env.SMTP_FROM || 'Cluster Agency <no-reply@example.com>'
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackUrl: process.env.GOOGLE_CALLBACK_URL || ''
    },
    firebase: {
        apiKey: process.env.FIREBASE_API_KEY || '',
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || `${defaultFirebaseProjectId}.firebaseapp.com`,
        projectId: defaultFirebaseProjectId,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${defaultFirebaseProjectId}.appspot.com`,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.FIREBASE_APP_ID || '',
        measurementId: process.env.FIREBASE_MEASUREMENT_ID || ''
    }
};
