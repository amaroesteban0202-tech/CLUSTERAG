import { createHttpError } from './http.js';

const buckets = new Map();
const MAX_BUCKETS = 10_000;

const pruneExpiredBuckets = (now) => {
    if (buckets.size < MAX_BUCKETS) return;
    for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key);
    }
    while (buckets.size >= MAX_BUCKETS) {
        const oldestKey = buckets.keys().next().value;
        if (!oldestKey) break;
        buckets.delete(oldestKey);
    }
};

export const rateLimit = ({
    windowMs = 60_000,
    max = 60,
    keyPrefix = 'request'
} = {}) => (req, res, next) => {
    const now = Date.now();
    pruneExpiredBuckets(now);
    const identity = req.auth?.userRecord?.id || req.ip || req.socket?.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${identity}`;
    const current = buckets.get(key);
    const bucket = !current || current.resetAt <= now
        ? { count: 0, resetAt: now + windowMs }
        : current;
    bucket.count += 1;
    buckets.set(key, bucket);

    res.set('RateLimit-Limit', String(max));
    res.set('RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
    res.set('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
        res.set('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
        next(createHttpError(429, 'Demasiadas solicitudes. Intenta nuevamente mas tarde.', 'request/rate-limited'));
        return;
    }
    next();
};
