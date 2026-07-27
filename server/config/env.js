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

// Normaliza una private key PEM guardada como variable de entorno. Tolera:
// comillas envolventes, \n literales, base64 del PEM completo, o el PEM en una
// sola línea (reconstruye los saltos). Así el firmado funciona sin importar
// cómo lo guarde Vercel/el shell.
const normalizePem = (raw = '') => {
    let key = String(raw || '').trim();
    if (!key) return '';
    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
        key = key.slice(1, -1);
    }
    key = key.replace(/\\r/g, '').replace(/\\n/g, '\n').trim();
    // Si no trae la cabecera PEM (los guiones nunca existen en base64), asumimos
    // que es base64 del PEM completo y lo decodificamos.
    if (!key.includes('-----BEGIN')) {
        try {
            const decoded = Buffer.from(key.replace(/\s+/g, ''), 'base64').toString('utf8');
            if (decoded.includes('-----BEGIN')) key = decoded.trim();
        } catch {
            /* no era base64 */
        }
    }
    if (key.includes('-----BEGIN') && !key.includes('\n')) {
        const match = key.match(/-----BEGIN ([A-Z0-9 ]+?)-----(.*?)-----END \1-----/);
        if (match) {
            const label = match[1].trim();
            const body = match[2].replace(/\s+/g, '');
            const wrapped = (body.match(/.{1,64}/g) || [body]).join('\n');
            key = `-----BEGIN ${label}-----\n${wrapped}\n-----END ${label}-----`;
        }
    }
    return key;
};

const defaultFirebaseProjectId = process.env.FIREBASE_PROJECT_ID || 'cluster-41f73';
const databaseUrl = process.env.DATABASE_URL
    || process.env.POSTGRES_URL
    || process.env.POSTGRES_PRISMA_URL
    || process.env.POSTGRES_URL_NON_POOLING
    || process.env.DATABASE_URL_UNPOOLED
    || '';
const databaseClient = ['pg', 'mysql2'].includes(process.env.DATABASE_CLIENT)
    ? process.env.DATABASE_CLIENT
    : databaseUrl
        ? 'pg'
        : 'sqlite3';
const isVercelRuntime = ['1', 'true'].includes(String(process.env.VERCEL || '').toLowerCase());
const defaultSqliteFilename = isVercelRuntime ? '/tmp/clusterag.sqlite' : '.tmp/clusterag.sqlite';
const resolveSqliteFilename = (value = defaultSqliteFilename) => {
    const resolved = path.isAbsolute(value) ? value : path.resolve(rootDir, value);
    // En Vercel solo /tmp es escribible; cualquier otra ruta provoca ENOENT al hacer mkdir.
    if (isVercelRuntime && !resolved.startsWith('/tmp/')) {
        return '/tmp/clusterag.sqlite';
    }
    return resolved;
};

export const env = {
    rootDir,
    isProduction: process.env.NODE_ENV === 'production',
    port: parseNumber(process.env.PORT, 3000),
    appBaseUrl: process.env.APP_BASE_URL || '',
    appId: process.env.APP_ID || 'cluster-agency-pro-mobile-v7',
    databaseClient,
    databaseUrl,
    sqliteFilename: resolveSqliteFilename(process.env.SQLITE_FILENAME || defaultSqliteFilename),
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
        measurementId: process.env.FIREBASE_MEASUREMENT_ID || '',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
        privateKey: normalizePem(process.env.FIREBASE_PRIVATE_KEY)
    },
    // Jitsi as a Service (8x8). La private key va SOLO en variables de entorno.
    jaas: {
        appId: process.env.JAAS_APP_ID || '',
        kid: process.env.JAAS_KID || '',
        privateKey: normalizePem(process.env.JAAS_PRIVATE_KEY)
    }
};
