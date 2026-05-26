const LOCAL_HOSTNAMES = new Set([
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    '[::1]'
]);

export const getRequestOrigin = (req) => {
    const explicitOrigin = String(req.get?.('origin') || '').trim();
    if (explicitOrigin) return explicitOrigin.replace(/\/+$/, '');

    const host = String(req.get?.('host') || '').trim();
    if (!host) return '';

    const forwardedProto = String(req.get?.('x-forwarded-proto') || '')
        .split(',')[0]
        .trim();
    const protocol = forwardedProto || req.protocol || 'http';
    return `${protocol}://${host}`.replace(/\/+$/, '');
};

export const isLocalOrigin = (origin = '') => {
    try {
        const { hostname } = new URL(origin);
        return LOCAL_HOSTNAMES.has(hostname);
    } catch {
        return false;
    }
};

export const getLocalGoogleCallbackUrl = (req) => {
    const origin = getRequestOrigin(req);
    return isLocalOrigin(origin) ? `${origin}/api/auth/google/callback` : '';
};
