const crypto = require('node:crypto');
const admin = require('firebase-admin');
const logger = require('firebase-functions/logger');
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { Resend } = require('resend');

admin.initializeApp();

const db = admin.firestore();
const RESEND_API_KEY = defineSecret('RESEND_API_KEY');
const RESEND_FROM_EMAIL = defineSecret('RESEND_FROM_EMAIL');
const APP_BASE_URL = defineSecret('APP_BASE_URL');

const USER_DOCUMENT = 'artifacts/{appId}/public/data/users/{userId}';
const TOKEN_LIFETIME_MS = 1000 * 60 * 60 * 24 * 7;

const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();
const hashToken = (value) => crypto.createHash('sha256').update(value).digest('hex');
const userDocRef = (appId, userId) => db.doc(`artifacts/${appId}/public/data/users/${userId}`);
const tokenDocRef = (appId, tokenHash) => db.doc(`artifacts/${appId}/private/system/email_verification_tokens/${tokenHash}`);

const buildAppUrl = (status, extraParams = {}) => {
    const target = new URL(APP_BASE_URL.value());
    target.searchParams.set('email_verification', status);
    Object.entries(extraParams).forEach(([key, value]) => {
        if (value) target.searchParams.set(key, value);
    });
    return target.toString();
};

const buildVerificationUrl = (appId, rawToken) => {
    const target = new URL('/api/verify-email', APP_BASE_URL.value());
    target.searchParams.set('appId', appId);
    target.searchParams.set('token', rawToken);
    return target.toString();
};

const renderVerificationEmail = ({ recipientName, verificationUrl }) => {
    const safeName = recipientName || 'equipo';
    return {
        subject: 'Verifica tu correo en Cluster Agency',
        html: `
            <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:32px;">
                <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:20px; padding:32px; border:1px solid #e2e8f0;">
                    <p style="margin:0 0 12px; font-size:12px; letter-spacing:0.12em; text-transform:uppercase; color:#64748b; font-weight:700;">Cluster Agency OS</p>
                    <h1 style="margin:0 0 16px; font-size:28px; line-height:1.2; color:#0f172a;">Verifica tu correo</h1>
                    <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:#334155;">Hola ${safeName}, te invitamos a confirmar tu correo para habilitar tu acceso en Cluster Agency OS.</p>
                    <p style="margin:0 0 24px; font-size:15px; line-height:1.7; color:#334155;">Haz clic en el siguiente boton para completar la verificacion. El enlace vence en 7 dias.</p>
                    <a href="${verificationUrl}" style="display:inline-block; padding:14px 22px; border-radius:14px; background:#7c3aed; color:#ffffff; text-decoration:none; font-weight:700;">Verificar correo</a>
                    <p style="margin:24px 0 0; font-size:13px; line-height:1.7; color:#64748b;">Si el boton no abre, copia este enlace en tu navegador:</p>
                    <p style="margin:8px 0 0; font-size:13px; line-height:1.7; color:#1d4ed8; word-break:break-all;">${verificationUrl}</p>
                </div>
            </div>
        `,
        text: `Hola ${safeName}. Verifica tu correo en Cluster Agency OS usando este enlace: ${verificationUrl}`
    };
};

const markVerificationError = async (appId, userId, error) => {
    const failedAt = new Date();
    await userDocRef(appId, userId).set({
        emailVerified: false,
        emailVerification: {
            status: 'error',
            lastError: error.message || 'No se pudo enviar el correo',
            failedAt
        },
        updatedAt: failedAt
    }, { merge: true });
};

const issueVerificationEmail = async ({ appId, userId, userRecord, reason }) => {
    const email = normalizeEmail(userRecord?.email);
    if (!email) {
        logger.info('Saltando envio de verificacion: usuario sin correo', { appId, userId, reason });
        return;
    }
    if (userRecord?.isActive === false) {
        logger.info('Saltando envio de verificacion: usuario inactivo', { appId, userId, email, reason });
        return;
    }
    if (userRecord?.emailVerified === true || userRecord?.emailVerification?.status === 'verified') {
        logger.info('Saltando envio de verificacion: usuario ya verificado', { appId, userId, email, reason });
        return;
    }

    try {
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_MS);
        const verificationUrl = buildVerificationUrl(appId, rawToken);
        const emailContent = renderVerificationEmail({
            recipientName: userRecord?.name,
            verificationUrl
        });

        logger.info('Generando token de verificacion', { appId, userId, email, reason });
        const tokenCreatedAt = new Date();
        await tokenDocRef(appId, tokenHash).set({
            userId,
            email,
            reason: reason || 'pending_verification',
            createdAt: tokenCreatedAt,
            expiresAt,
            usedAt: null
        });

        const resend = new Resend(RESEND_API_KEY.value());
        logger.info('Enviando correo de verificacion con Resend', { appId, userId, email, reason });
        const sendResult = await resend.emails.send({
            from: RESEND_FROM_EMAIL.value(),
            to: email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text
        });
        if (sendResult?.error) {
            throw new Error(sendResult.error.message || 'Resend rechazo el correo');
        }
        const resendEmailId = sendResult?.data?.id || '';

        const sentAt = new Date();
        await userDocRef(appId, userId).set({
            emailVerified: false,
            emailVerification: {
                status: 'sent',
                sentAt,
                expiresAt,
                lastTokenHash: tokenHash,
                lastSentReason: reason || 'pending_verification',
                lastRecipient: email,
                lastEmailId: resendEmailId
            },
            updatedAt: sentAt
        }, { merge: true });
        logger.info('Correo de verificacion enviado', { appId, userId, email, reason, tokenHash, resendEmailId });
    } catch (error) {
        logger.error('Error enviando correo de verificacion', { appId, userId, email, error: error.message });
        await markVerificationError(appId, userId, error);
        throw error;
    }
};

exports.sendVerificationEmailOnUserCreate = onDocumentCreated(
    {
        document: USER_DOCUMENT,
        secrets: [RESEND_API_KEY, RESEND_FROM_EMAIL, APP_BASE_URL]
    },
    async (event) => {
        const snapshot = event.data;
        const userRecord = snapshot?.data();
        if (!userRecord) {
            logger.info('Create trigger sin userRecord', { params: event.params });
            return;
        }

        logger.info('Create trigger recibido', {
            appId: event.params.appId,
            userId: event.params.userId,
            email: normalizeEmail(userRecord.email),
            status: userRecord.emailVerification?.status || '',
            emailVerified: userRecord.emailVerified === true
        });

        if (!normalizeEmail(userRecord.email)) {
            logger.info('Create trigger omitido: sin correo', { appId: event.params.appId, userId: event.params.userId });
            return;
        }
        if (userRecord.isActive === false) {
            logger.info('Create trigger omitido: usuario inactivo', { appId: event.params.appId, userId: event.params.userId });
            return;
        }
        if (userRecord.emailVerified === true || userRecord.emailVerification?.status === 'verified') {
            logger.info('Create trigger omitido: usuario ya verificado', { appId: event.params.appId, userId: event.params.userId });
            return;
        }
        if (userRecord.emailVerification?.status !== 'pending') {
            logger.info('Create trigger omitido: status distinto de pending', {
                appId: event.params.appId,
                userId: event.params.userId,
                status: userRecord.emailVerification?.status || ''
            });
            return;
        }

        await issueVerificationEmail({
            appId: event.params.appId,
            userId: event.params.userId,
            userRecord,
            reason: 'user_created'
        });
    }
);

exports.sendVerificationEmailOnUserUpdate = onDocumentUpdated(
    {
        document: USER_DOCUMENT,
        secrets: [RESEND_API_KEY, RESEND_FROM_EMAIL, APP_BASE_URL]
    },
    async (event) => {
        const before = event.data?.before?.data() || {};
        const after = event.data?.after?.data() || {};

        logger.info('Update trigger recibido', {
            appId: event.params.appId,
            userId: event.params.userId,
            beforeEmail: normalizeEmail(before.email),
            afterEmail: normalizeEmail(after.email),
            beforeStatus: before.emailVerification?.status || '',
            afterStatus: after.emailVerification?.status || '',
            beforeResendRequestedAt: before.emailVerification?.resendRequestedAt || '',
            afterResendRequestedAt: after.emailVerification?.resendRequestedAt || '',
            afterEmailVerified: after.emailVerified === true
        });

        if (!normalizeEmail(after.email)) {
            logger.info('Update trigger omitido: after sin correo', { appId: event.params.appId, userId: event.params.userId });
            return;
        }
        if (after.isActive === false) {
            logger.info('Update trigger omitido: usuario inactivo', { appId: event.params.appId, userId: event.params.userId });
            return;
        }
        if (after.emailVerified === true || after.emailVerification?.status === 'verified') {
            logger.info('Update trigger omitido: usuario ya verificado', { appId: event.params.appId, userId: event.params.userId });
            return;
        }

        const emailChanged = normalizeEmail(before.email) !== normalizeEmail(after.email);
        const resendChanged = Boolean(after.emailVerification?.resendRequestedAt) && after.emailVerification?.resendRequestedAt !== before.emailVerification?.resendRequestedAt;
        const becamePending = before.emailVerification?.status !== 'pending' && after.emailVerification?.status === 'pending';

        logger.info('Update trigger evaluacion', {
            appId: event.params.appId,
            userId: event.params.userId,
            emailChanged,
            resendChanged,
            becamePending
        });

        if (!emailChanged && !resendChanged && !becamePending) {
            logger.info('Update trigger omitido: no hubo cambios relevantes', { appId: event.params.appId, userId: event.params.userId });
            return;
        }

        await issueVerificationEmail({
            appId: event.params.appId,
            userId: event.params.userId,
            userRecord: after,
            reason: resendChanged ? 'manual_resend' : emailChanged ? 'email_changed' : 'pending_update'
        });
    }
);

exports.verifyUserEmail = onRequest(
    {
        secrets: [APP_BASE_URL]
    },
    async (req, res) => {
        if (req.method !== 'GET') {
            res.status(405).send('Method Not Allowed');
            return;
        }

        const appId = String(req.query.appId || '').trim();
        const rawToken = String(req.query.token || '').trim();
        if (!appId || !rawToken) {
            res.redirect(302, buildAppUrl('invalid'));
            return;
        }

        const tokenHash = hashToken(rawToken);
        const tokenRef = tokenDocRef(appId, tokenHash);
        const tokenSnap = await tokenRef.get();

        if (!tokenSnap.exists) {
            res.redirect(302, buildAppUrl('invalid'));
            return;
        }

        const tokenData = tokenSnap.data() || {};
        const expiresAtMillis = tokenData.expiresAt?.toMillis ? tokenData.expiresAt.toMillis() : 0;
        if (tokenData.usedAt) {
            res.redirect(302, buildAppUrl('success', { verified_email: tokenData.email || '' }));
            return;
        }
        if (!expiresAtMillis || expiresAtMillis < Date.now()) {
            res.redirect(302, buildAppUrl('expired'));
            return;
        }

        const userRef = userDocRef(appId, tokenData.userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists) {
            res.redirect(302, buildAppUrl('invalid'));
            return;
        }

        const userData = userSnap.data() || {};
        if (normalizeEmail(userData.email) !== normalizeEmail(tokenData.email)) {
            res.redirect(302, buildAppUrl('mismatch'));
            return;
        }

        const batch = db.batch();
        const verifiedAt = new Date();
        batch.set(userRef, {
            emailVerified: true,
            emailVerification: {
                status: 'verified',
                verifiedAt,
                verifiedEmail: normalizeEmail(tokenData.email),
                lastTokenHash: tokenHash
            },
            updatedAt: verifiedAt
        }, { merge: true });
        batch.set(tokenRef, {
            usedAt: verifiedAt
        }, { merge: true });
        await batch.commit();

        res.redirect(302, buildAppUrl('success', { verified_email: normalizeEmail(tokenData.email) }));
    }
);
