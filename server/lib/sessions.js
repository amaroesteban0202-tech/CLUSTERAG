import { db } from '../db/knex.js';
import { env } from '../config/env.js';
import { createHttpError } from './http.js';
import { signPayload, verifySignedPayload } from './crypto.js';
import { addHoursToIso, isIsoExpired, nowIso } from './time.js';
import { getRecord, upsertRecord } from './records.js';

const buildCookieOptions = (expiresAt = addHoursToIso(env.sessionTtlHours)) => ({
    httpOnly: true,
    sameSite: env.isProduction ? 'none' : 'lax',
    secure: env.isProduction,
    path: '/',
    expires: new Date(expiresAt)
});

export const buildAuthUser = ({ userRecord, provider = 'password' }) => ({
    uid: userRecord.authUid || userRecord.id,
    email: userRecord.email || '',
    displayName: userRecord.name || '',
    emailVerified: userRecord.emailVerified === true,
    isAnonymous: false,
    providerData: provider ? [{ providerId: provider }] : []
});

const buildClearCookieOptions = () => ({
    httpOnly: true,
    sameSite: env.isProduction ? 'none' : 'lax',
    secure: env.isProduction,
    path: '/'
});

const buildSessionToken = ({ userRecord, provider = 'password', issuedAt = nowIso(), expiresAt = addHoursToIso(env.sessionTtlHours) }) => signPayload({
    sub: userRecord.id,
    provider,
    iat: issuedAt,
    exp: expiresAt
}, env.sessionSecret);

const buildSessionContext = ({ sessionToken = '', provider = 'password', expiresAt = '', userRecord }) => ({
    sessionId: sessionToken,
    session: {
        provider,
        expires_at: expiresAt,
        stateless: true
    },
    userRecord,
    user: buildAuthUser({ userRecord, provider })
});

export const createSession = async ({ req, res, userRecord, provider = 'password' }) => {
    const stamp = nowIso();
    const expiresAt = addHoursToIso(env.sessionTtlHours);
    const sessionToken = buildSessionToken({
        userRecord,
        provider,
        issuedAt: stamp,
        expiresAt
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

    res.cookie(env.sessionCookieName, sessionToken, buildCookieOptions(expiresAt));
    return sessionToken;
};

export const clearSession = async ({ req, res }) => {
    const sessionId = req.cookies?.[env.sessionCookieName];
    if (sessionId && !verifySignedPayload(sessionId, env.sessionSecret)) {
        await db('auth_sessions').where({ session_id: sessionId }).delete();
    }
    res.clearCookie(env.sessionCookieName, buildClearCookieOptions());
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

    const signedSession = verifySignedPayload(sessionId, env.sessionSecret);
    if (signedSession && !isIsoExpired(signedSession.exp)) {
        const userRecord = await getRecord({ collectionName: 'users', recordId: signedSession.sub });
        if (!userRecord) {
            res.clearCookie(env.sessionCookieName, buildClearCookieOptions());
            next();
            return;
        }

        req.auth = buildSessionContext({
            sessionToken: sessionId,
            provider: signedSession.provider || 'password',
            expiresAt: signedSession.exp,
            userRecord
        });
        next();
        return;
    }

    const session = await db('auth_sessions').where({ session_id: sessionId }).first();
    if (!session || isIsoExpired(session.expires_at)) {
        await db('auth_sessions').where({ session_id: sessionId }).delete();
        res.clearCookie(env.sessionCookieName, buildClearCookieOptions());
        next();
        return;
    }

    const userRecord = await getRecord({ collectionName: 'users', recordId: session.user_record_id });
    if (!userRecord) {
        await db('auth_sessions').where({ session_id: sessionId }).delete();
        res.clearCookie(env.sessionCookieName, buildClearCookieOptions());
        next();
        return;
    }

    const refreshedSessionToken = buildSessionToken({
        userRecord,
        provider: session.provider,
        issuedAt: nowIso(),
        expiresAt: session.expires_at
    });
    res.cookie(env.sessionCookieName, refreshedSessionToken, buildCookieOptions(session.expires_at));

    req.auth = buildSessionContext({
        sessionToken: refreshedSessionToken,
        provider: session.provider,
        expiresAt: session.expires_at,
        userRecord
    });

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
