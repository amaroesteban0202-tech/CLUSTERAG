import express from 'express';
import { env } from '../config/env.js';
import { db } from '../db/knex.js';
import { asyncHandler, createHttpError } from '../lib/http.js';
import { randomToken, signPayload, verifySignedPayload } from '../lib/crypto.js';
import { addMinutesToIso, isIsoExpired, nowIso } from '../lib/time.js';
import { normalizeEmail } from '../lib/text.js';
import { createSession, clearSession } from '../lib/sessions.js';
import { ensureAuthUserRecord } from '../lib/users.js';
import { verifyFirebaseIdToken } from '../lib/firebase-admin.js';
import { getLocalGoogleCallbackUrl, getRequestOrigin, isLocalOrigin } from '../lib/request-origin.js';

const router = express.Router();

const renderPopupResult = (req, res, { ok, error = '' }) => {
    const payload = JSON.stringify(ok ? { type: 'cluster-auth:success' } : { type: 'cluster-auth:error', error })
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
    const targetOrigin = JSON.stringify(new URL(resolveAppRedirectBaseUrl(req), getRequestOrigin(req)).origin);
    const nonce = randomToken(18);
    res.set({
        'Cache-Control': 'no-store',
        'Content-Security-Policy': `default-src 'none'; base-uri 'none'; frame-ancestors 'none'; script-src 'nonce-${nonce}'`
    });
    res.type('html').send(`
        <!DOCTYPE html>
        <html>
        <body>
            <script nonce="${nonce}">
                if (window.opener) {
                    window.opener.postMessage(${payload}, ${targetOrigin});
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

const resolveGoogleCallbackUrl = (req) => getLocalGoogleCallbackUrl(req) || env.google.callbackUrl;

const resolveAppRedirectBaseUrl = (req) => {
    const origin = getRequestOrigin(req);
    return isLocalOrigin(origin) ? origin : (env.appBaseUrl || origin || '/');
};

export const resolveSafeWebRedirect = (req, value = '') => {
    const requested = String(value || '').trim();
    if (!requested) return '/';
    if (requested.startsWith('/') && !requested.startsWith('//')) return requested;

    try {
        const allowedOrigin = new URL(resolveAppRedirectBaseUrl(req)).origin;
        const target = new URL(requested);
        if (target.origin === allowedOrigin) {
            return `${target.pathname}${target.search}${target.hash}`;
        }
    } catch {
        // Un destino invalido o externo siempre vuelve a la raiz de la app.
    }
    return '/';
};

const buildGoogleAuthUrl = (req, state) => {
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', env.google.clientId);
    url.searchParams.set('redirect_uri', resolveGoogleCallbackUrl(req));
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', state);
    url.searchParams.set('prompt', 'select_account');
    return url;
};

const buildNativeGoogleToken = ({ profilePayload, email, state }) => signPayload({
    typ: 'native_google',
    state,
    sub: profilePayload.sub || email,
    email,
    name: profilePayload.name || '',
    provider: 'google.com',
    authUid: profilePayload.sub || email,
    exp: addMinutesToIso(5)
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

router.post('/token/exchange', asyncHandler(async (req, res) => {
    const token = String(req.body?.token || '').trim();
    const payload = verifySignedPayload(token, env.sessionSecret);
    if (
        !payload
        || payload.typ !== 'native_google'
        || isIsoExpired(payload?.exp)
    ) {
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
    if (!userRecord || userRecord.isActive === false) {
        throw createHttpError(403, 'La cuenta esta inactiva.', 'auth/user-disabled');
    }
    const consumed = payload.state
        ? await db('auth_oauth_states')
            .where({ state: payload.state, result_token: token })
            .where('expires_at', '>=', nowIso())
            .delete()
        : 0;
    if (consumed !== 1) {
        throw createHttpError(400, 'El token inicial ya fue utilizado.', 'auth/invalid-custom-token');
    }

    await createSession({ req, res, userRecord, provider: payload.provider || 'custom' });
    res.json({
        ok: true,
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
        console.warn('[auth:firebase-token]', {
            code: String(error?.code || ''),
            adminCode: String(error?.adminCode || '')
        });
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
            renderPopupResult(req, res, { ok: false, error: 'Google Sign-In no esta configurado.' });
            return;
        }
        throw createHttpError(503, 'Google Sign-In no esta configurado.', 'auth/operation-not-allowed');
    }

    const state = randomToken(24);
    await db('auth_oauth_states').insert({
        state,
        popup: req.query.popup === '1',
        redirect_after: resolveSafeWebRedirect(req, req.query.redirect),
        expires_at: addMinutesToIso(10),
        created_at: nowIso()
    });

    res.redirect(buildGoogleAuthUrl(req, state).toString());
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
        authUrl: buildGoogleAuthUrl(req, state).toString()
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

    const token = String(stateRow.result_token || '');
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
            renderPopupResult(req, res, { ok: false, error: 'El estado de Google expiro.' });
            return;
        }
        if (req.accepts('html')) {
            res.redirect(resolveAppRedirectBaseUrl(req));
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
            redirect_uri: resolveGoogleCallbackUrl(req),
            grant_type: 'authorization_code',
            code
        })
    });

    const tokenPayload = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenPayload.access_token) {
        if (stateRow.popup) {
            renderPopupResult(req, res, { ok: false, error: 'No se pudo completar el acceso con Google.' });
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
            renderPopupResult(req, res, { ok: false, error: 'Google no devolvio un correo valido.' });
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
            renderPopupResult(req, res, { ok: false, error: 'La cuenta esta inactiva.' });
            return;
        }
        throw createHttpError(403, 'La cuenta esta inactiva.', 'auth/user-disabled');
    }

    if (isNativeRedirect(stateRow.redirect_after)) {
        const token = buildNativeGoogleToken({ profilePayload, email, state });
        await db('auth_oauth_states')
            .where({ state })
            .update({
                result_token: token,
                expires_at: addMinutesToIso(5)
            });
        res.redirect(stateRow.redirect_after);
        return;
    }

    await createSession({ req, res, userRecord, provider: 'google.com' });

    if (stateRow.popup) {
        renderPopupResult(req, res, { ok: true });
        return;
    }

    res.redirect(resolveSafeWebRedirect(req, stateRow.redirect_after));
}));

export default router;
