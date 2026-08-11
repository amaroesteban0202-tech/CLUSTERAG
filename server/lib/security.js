import { env } from '../config/env.js';
import { createHttpError } from './http.js';
import { getRequestOrigin, isLocalOrigin } from './request-origin.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const normalizeOrigin = (value = '') => {
    try {
        return new URL(String(value)).origin;
    } catch {
        return '';
    }
};

const configuredOrigins = () => new Set([
    normalizeOrigin(env.appBaseUrl),
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
    'https://localhost'
].filter(Boolean));

export const isTrustedRequestOrigin = (req, origin = req.get?.('origin')) => {
    const normalizedOrigin = normalizeOrigin(origin);
    if (!normalizedOrigin) return false;
    if (configuredOrigins().has(normalizedOrigin)) return true;

    const requestOrigin = normalizeOrigin(getRequestOrigin(req));
    if (requestOrigin && normalizedOrigin === requestOrigin) return true;

    return !env.isProduction
        && isLocalOrigin(normalizedOrigin)
        && isLocalOrigin(requestOrigin);
};

export const requireTrustedOrigin = (req, _res, next) => {
    if (SAFE_METHODS.has(req.method)) {
        next();
        return;
    }

    const origin = String(req.get?.('origin') || '').trim();
    if (!origin || isTrustedRequestOrigin(req, origin)) {
        next();
        return;
    }

    next(createHttpError(403, 'El origen de la solicitud no esta autorizado.', 'security/origin-denied'));
};

export const applySecurityHeaders = (req, res, next) => {
    const csp = [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'self'",
        "form-action 'self'",
        "script-src 'self' https://8x8.vc",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' data: https://fonts.gstatic.com",
        "img-src 'self' data: blob: https:",
        "media-src 'self' data: blob: https:",
        "connect-src 'self' https: wss:",
        "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://*.8x8.vc https://meet.jit.si",
        "worker-src 'self' blob:",
        "manifest-src 'self'"
    ].join('; ');

    res.set({
        'Content-Security-Policy': csp,
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Cross-Origin-Resource-Policy': 'same-site',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=()'
    });
    if (env.isProduction && req.secure) {
        res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
};
