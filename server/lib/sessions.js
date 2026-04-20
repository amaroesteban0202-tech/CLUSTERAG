import { db } from '../db/knex.js';
import { env } from '../config/env.js';
import { createHttpError } from './http.js';
import { randomToken } from './crypto.js';
import { addHoursToIso, isIsoExpired, nowIso } from './time.js';
import { getRecord, upsertRecord } from './records.js';

const buildCookieOptions = () => ({
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/',
    expires: new Date(addHoursToIso(env.sessionTtlHours))
});

export const buildAuthUser = ({ userRecord, provider = 'password' }) => ({
    uid: userRecord.authUid || userRecord.id,
    email: userRecord.email || '',
    displayName: userRecord.name || '',
    emailVerified: userRecord.emailVerified === true,
    isAnonymous: false,
    providerData: provider ? [{ providerId: provider }] : []
});

export const createSession = async ({ req, res, userRecord, provider = 'password' }) => {
    const sessionId = randomToken(32);
    const stamp = nowIso();
    const expiresAt = addHoursToIso(env.sessionTtlHours);

    await db('auth_sessions').insert({
        session_id: sessionId,
        user_record_id: userRecord.id,
        provider,
        expires_at: expiresAt,
        last_seen_at: stamp,
        created_at: stamp,
        ip_address: req.ip,
        user_agent: req.get('user-agent') || ''
    });

    await upsertRecord({
        collectionName: 'users',
        recordId: userRecord.id,
        payload: {
            lastSeenAt: stamp,
            updatedAt: stamp
        },
        merge: true
    });

    res.cookie(env.sessionCookieName, sessionId, buildCookieOptions());
    return sessionId;
};

export const clearSession = async ({ req, res }) => {
    const sessionId = req.cookies?.[env.sessionCookieName];
    if (sessionId) {
        await db('auth_sessions').where({ session_id: sessionId }).delete();
    }
    res.clearCookie(env.sessionCookieName, buildCookieOptions());
};

export const attachSession = async (req, res, next) => {
    const sessionId = req.cookies?.[env.sessionCookieName];
    req.auth = {
        sessionId: '',
        session: null,
        userRecord: null,
        user: null
    };

    if (!sessionId) {
        next();
        return;
    }

    const session = await db('auth_sessions').where({ session_id: sessionId }).first();
    if (!session || isIsoExpired(session.expires_at)) {
        await db('auth_sessions').where({ session_id: sessionId }).delete();
        res.clearCookie(env.sessionCookieName, buildCookieOptions());
        next();
        return;
    }

    const userRecord = await getRecord({ collectionName: 'users', recordId: session.user_record_id });
    if (!userRecord) {
        await db('auth_sessions').where({ session_id: sessionId }).delete();
        res.clearCookie(env.sessionCookieName, buildCookieOptions());
        next();
        return;
    }

    req.auth = {
        sessionId,
        session,
        userRecord,
        user: buildAuthUser({ userRecord, provider: session.provider })
    };

    await db('auth_sessions')
        .where({ session_id: sessionId })
        .update({ last_seen_at: nowIso() });

    next();
};

export const requireAuthenticatedUser = (req) => {
    if (!req.auth?.userRecord) {
        throw createHttpError(401, 'Se requiere una sesion activa.', 'auth/session-required');
    }
    return req.auth.userRecord;
};
