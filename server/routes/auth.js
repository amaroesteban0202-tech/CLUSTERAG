import express from 'express';
import { env } from '../config/env.js';
import { db } from '../db/knex.js';
import { asyncHandler, createHttpError } from '../lib/http.js';
import { randomToken, sha256, signPayload, verifySignedPayload } from '../lib/crypto.js';
import { addMinutesToIso, isIsoExpired, nowIso } from '../lib/time.js';
import { normalizeEmail } from '../lib/text.js';
import { createSession, clearSession } from '../lib/sessions.js';
import { ensureAuthUserRecord } from '../lib/users.js';
import { sendMagicLinkEmail } from '../lib/email.js';
import { verifyFirebaseIdToken } from '../lib/firebase-admin.js';

const router = express.Router();

const resolveBaseUrl = (req) => env.appBaseUrl || `${req.protocol}://${req.get('host')}`;

const buildMagicLink = (req, continueUrl, token) => {
    const target = new URL(continueUrl || resolveBaseUrl(req));
    target.searchParams.set('email_link', 'pending');
    target.searchParams.set('mode', 'signIn');
    target.searchParams.set('oobCode', token);
    return target.toString();
};

const renderPopupResult = (res, { ok, error = '' }) => {
    const payload = JSON.stringify(ok ? { type: 'cluster-auth:success' } : { type: 'cluster-auth:error', error });
    res.type('html').send(`
        <!DOCTYPE html>
        <html>
        <body>
            <script>
                if (window.opener) {
                    window.opener.postMessage(${payload}, '*');
                }
                window.close();
            </script>
        </body>
        </html>
    `);
};

const isNativeRedirect = (value = '') => {
    try {
        const target = new URL(value);
        return target.protocol === 'clusteragency:';
    } catch {
        return false;
    }
};

const buildGoogleAuthUrl = (state) => {
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', env.google.clientId);
    url.searchParams.set('redirect_uri', env.google.callbackUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', state);
    url.searchParams.set('prompt', 'select_account');
    return url;
};

const buildNativeGoogleToken = ({ profilePayload, email }) => signPayload({
    sub: profilePayload.sub || email,
    email,
    name: profilePayload.name || '',
    provider: 'google.com',
    authUid: profilePayload.sub || email,
    exp: addMinutesToIso(5)
}, env.sessionSecret);

const buildPersistentAuthToken = ({ userRecord, provider = 'custom', expiresAt = addMinutesToIso(env.magicLinkTtlMinutes * 24 * 60) }) => signPayload({
    sub: userRecord.authUid || userRecord.id,
    email: userRecord.email || '',
    name: userRecord.name || '',
    provider,
    authUid: userRecord.authUid || userRecord.id,
    exp: expiresAt
}, env.sessionSecret);

router.get('/session', asyncHandler(async (req, res) => {
    res.json({
        user: req.auth?.user || null,
        profile: req.auth?.userRecord || null
    });
}));

router.post('/logout', asyncHandler(async (req, res) => {
    await clearSession({ req, res });
    res.json({ ok: true });
}));

router.post('/email/request', asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const continueUrl = req.body?.continueUrl || resolveBaseUrl(req);
    if (!email) {
        throw createHttpError(400, 'El correo es obligatorio.', 'auth/invalid-email');
    }

    const userRecord = await ensureAuthUserRecord({
        email,
        provider: 'password',
        verified: false
    });

    if (!userRecord || userRecord.isActive === false) {
        throw createHttpError(403, 'La cuenta esta inactiva.', 'auth/user-disabled');
    }

    const rawToken = randomToken(32);
    const tokenHash = sha256(rawToken);
    const stamp = nowIso();
    const expiresAt = addMinutesToIso(env.magicLinkTtlMinutes);

    await db('auth_magic_links').insert({
        id: randomToken(16),
        user_record_id: userRecord.id,
        email,
        token_hash: tokenHash,
        redirect_url: continueUrl,
        reason: req.body?.reason || 'login',
        requested_by: req.auth?.userRecord?.id || '',
        expires_at: expiresAt,
        consumed_at: null,
        created_at: stamp
    });

    const magicLink = buildMagicLink(req, continueUrl, rawToken);
    const delivery = await sendMagicLinkEmail({
        email,
        name: userRecord.name || '',
        link: magicLink,
        expiresAt
    });

    res.json({
        ok: true,
        sentAt: stamp,
        email,
        deliveryMode: delivery.mode,
        debugLink: env.isProduction ? undefined : magicLink
    });
}));

router.post('/email/complete', asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const token = String(req.body?.token || '').trim();

    if (!email) {
        throw createHttpError(400, 'El correo es obligatorio.', 'auth/invalid-email');
    }

    if (!token) {
        throw createHttpError(400, 'El token del enlace es obligatorio.', 'auth/invalid-action-code');
    }

    const linkRow = await db('auth_magic_links')
        .where({
            email,
            token_hash: sha256(token)
        })
        .orderBy('created_at', 'desc')
        .first();

    if (!linkRow || linkRow.consumed_at) {
        throw createHttpError(400, 'El enlace no es valido.', 'auth/invalid-action-code');
    }

    if (isIsoExpired(linkRow.expires_at)) {
        throw createHttpError(400, 'El enlace ya vencio.', 'auth/expired-action-code');
    }

    const userRecord = await ensureAuthUserRecord({
        email,
        provider: 'password',
        authUid: linkRow.user_record_id,
        verified: true
    });

    if (!userRecord || userRecord.isActive === false) {
        throw createHttpError(403, 'La cuenta esta inactiva.', 'auth/user-disabled');
    }

    await db('auth_magic_links')
        .where({ id: linkRow.id })
        .update({ consumed_at: nowIso() });

    await createSession({ req, res, userRecord, provider: 'password' });
    res.json({
        ok: true,
        authToken: buildPersistentAuthToken({ userRecord, provider: 'password' }),
        user: {
            uid: userRecord.authUid || userRecord.id,
            email: userRecord.email || '',
            displayName: userRecord.name || '',
            emailVerified: true,
            isAnonymous: false,
            providerData: [{ providerId: 'password' }]
        },
        profile: userRecord
    });
}));

router.post('/token/exchange', asyncHandler(async (req, res) => {
    const token = String(req.body?.token || '').trim();
    const payload = verifySignedPayload(token, env.sessionSecret);
    if (!payload || isIsoExpired(payload?.exp)) {
        throw createHttpError(400, 'El token inicial no es valido.', 'auth/invalid-custom-token');
    }

    const email = normalizeEmail(payload.email);
    if (!email) {
        throw createHttpError(400, 'El token inicial no incluye un correo.', 'auth/invalid-custom-token');
    }

    const userRecord = await ensureAuthUserRecord({
        email,
        name: payload.name || '',
        provider: payload.provider || 'custom',
        authUid: payload.authUid || payload.sub || email,
        verified: true
    });

    await createSession({ req, res, userRecord, provider: payload.provider || 'custom' });
    res.json({
        ok: true,
        authToken: buildPersistentAuthToken({ userRecord, provider: payload.provider || 'custom' }),
        user: {
            uid: userRecord.authUid || userRecord.id,
            email: userRecord.email || '',
            displayName: userRecord.name || '',
            emailVerified: true,
            isAnonymous: false,
            providerData: [{ providerId: payload.provider || 'custom' }]
        },
        profile: userRecord
    });
}));

router.post('/firebase/session', asyncHandler(async (req, res) => {
    const idToken = String(req.body?.idToken || '').trim();
    if (!idToken) {
        throw createHttpError(400, 'El token de Firebase es obligatorio.', 'auth/missing-id-token');
    }

    let decodedToken = null;
    try {
        decodedToken = await verifyFirebaseIdToken(idToken);
    } catch (error) {
        throw createHttpError(401, 'El token de Firebase no es valido.', 'auth/invalid-id-token');
    }

    const email = normalizeEmail(decodedToken?.email || req.body?.email);
    if (!email) {
        throw createHttpError(400, 'Firebase no devolvio un correo valido.', 'auth/invalid-email');
    }

    const provider = decodedToken?.firebase?.sign_in_provider || 'firebase';
    const userRecord = await ensureAuthUserRecord({
        email,
        name: decodedToken?.name || '',
        provider,
        authUid: decodedToken?.uid || email,
        verified: decodedToken?.email_verified !== false
    });

    if (!userRecord || userRecord.isActive === false) {
        throw createHttpError(403, 'La cuenta esta inactiva.', 'auth/user-disabled');
    }

    await createSession({ req, res, userRecord, provider });
    res.json({
        ok: true,
        authToken: buildPersistentAuthToken({ userRecord, provider }),
        user: {
            uid: userRecord.authUid || userRecord.id,
            email: userRecord.email || '',
            displayName: userRecord.name || '',
            emailVerified: userRecord.emailVerified === true,
            isAnonymous: false,
            providerData: [{ providerId: provider }]
        },
        profile: userRecord
    });
}));

router.get('/google/start', asyncHandler(async (req, res) => {
    if (!env.google.clientId || !env.google.clientSecret || !env.google.callbackUrl) {
        if (req.query.popup === '1') {
            renderPopupResult(res, { ok: false, error: 'Google Sign-In no esta configurado.' });
            return;
        }
        throw createHttpError(503, 'Google Sign-In no esta configurado.', 'auth/operation-not-allowed');
    }

    const state = randomToken(24);
    await db('auth_oauth_states').insert({
        state,
        popup: req.query.popup === '1',
        redirect_after: req.query.redirect || '/',
        expires_at: addMinutesToIso(10),
        created_at: nowIso()
    });

    res.redirect(buildGoogleAuthUrl(state).toString());
}));

router.get('/google/native/start', asyncHandler(async (req, res) => {
    if (!env.google.clientId || !env.google.clientSecret || !env.google.callbackUrl) {
        throw createHttpError(503, 'Google Sign-In no esta configurado.', 'auth/operation-not-allowed');
    }

    const state = randomToken(24);
    const redirectAfter = 'clusteragency://auth/google';
    await db('auth_oauth_states').insert({
        state,
        popup: false,
        redirect_after: redirectAfter,
        expires_at: addMinutesToIso(10),
        created_at: nowIso()
    });

    res.json({
        state,
        authUrl: buildGoogleAuthUrl(state).toString()
    });
}));

router.get('/google/native/result', asyncHandler(async (req, res) => {
    const state = String(req.query.state || '').trim();
    const stateRow = state
        ? await db('auth_oauth_states').where({ state }).first()
        : null;

    if (!stateRow || isIsoExpired(stateRow.expires_at)) {
        throw createHttpError(404, 'El retorno de Google no esta listo.', 'auth/pending-redirect');
    }

    const redirectAfter = String(stateRow.redirect_after || '');
    if (!isNativeRedirect(redirectAfter)) {
        throw createHttpError(404, 'El retorno de Google no esta listo.', 'auth/pending-redirect');
    }

    const target = new URL(redirectAfter);
    const token = target.searchParams.get('token') || '';
    if (!token) {
        res.json({ ok: false, pending: true });
        return;
    }

    res.json({ ok: true, token });
}));

router.get('/google/callback', asyncHandler(async (req, res) => {
    const state = String(req.query.state || '');
    const code = String(req.query.code || '');
    const stateRow = state
        ? await db('auth_oauth_states').where({ state }).first()
        : null;

    if (!stateRow || isIsoExpired(stateRow.expires_at)) {
        if (stateRow?.popup) {
            renderPopupResult(res, { ok: false, error: 'El estado de Google expiro.' });
            return;
        }
        if (req.accepts('html')) {
            res.redirect(env.appBaseUrl || '/');
            return;
        }
        throw createHttpError(400, 'El estado de Google no es valido.', 'auth/invalid-state');
    }

    if (!isNativeRedirect(stateRow.redirect_after)) {
        await db('auth_oauth_states').where({ state }).delete();
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            client_id: env.google.clientId,
            client_secret: env.google.clientSecret,
            redirect_uri: env.google.callbackUrl,
            grant_type: 'authorization_code',
            code
        })
    });

    const tokenPayload = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenPayload.access_token) {
        if (stateRow.popup) {
            renderPopupResult(res, { ok: false, error: 'No se pudo completar el acceso con Google.' });
            return;
        }
        throw createHttpError(400, 'No se pudo completar el acceso con Google.', 'auth/popup-closed-by-user');
    }

    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: {
            authorization: `Bearer ${tokenPayload.access_token}`
        }
    });
    const profilePayload = await profileResponse.json();

    const email = normalizeEmail(profilePayload.email);
    if (!email) {
        if (stateRow.popup) {
            renderPopupResult(res, { ok: false, error: 'Google no devolvio un correo valido.' });
            return;
        }
        throw createHttpError(400, 'Google no devolvio un correo valido.', 'auth/invalid-email');
    }

    const userRecord = await ensureAuthUserRecord({
        email,
        name: profilePayload.name || '',
        provider: 'google.com',
        authUid: profilePayload.sub || email,
        verified: profilePayload.email_verified !== false
    });

    if (!userRecord || userRecord.isActive === false) {
        if (stateRow.popup) {
            renderPopupResult(res, { ok: false, error: 'La cuenta esta inactiva.' });
            return;
        }
        throw createHttpError(403, 'La cuenta esta inactiva.', 'auth/user-disabled');
    }

    if (isNativeRedirect(stateRow.redirect_after)) {
        const token = buildNativeGoogleToken({ profilePayload, email });
        const target = new URL(stateRow.redirect_after);
        target.searchParams.set('token', token);
        await db('auth_oauth_states')
            .where({ state })
            .update({
                redirect_after: target.toString(),
                expires_at: addMinutesToIso(5)
            });
        res.redirect(target.toString());
        return;
    }

    await createSession({ req, res, userRecord, provider: 'google.com' });

    if (stateRow.popup) {
        renderPopupResult(res, { ok: true });
        return;
    }

    res.redirect(stateRow.redirect_after || '/');
}));

export default router;
