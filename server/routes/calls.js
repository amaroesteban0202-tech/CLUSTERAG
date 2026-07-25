import { Router } from 'express';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { asyncHandler, createHttpError } from '../lib/http.js';
import { hasPermission } from '../lib/permissions.js';
import { requireAuthenticatedUser } from '../lib/sessions.js';

const router = Router();

const b64url = (input) => Buffer.from(input).toString('base64url');

// Firma un JWT RS256 para Jitsi as a Service (8x8). La sala se autoriza como "*"
// (cualquier sala del app) y el rol de moderador se otorga a quien inicia.
router.post('/jaas-token', asyncHandler(async (req, res) => {
    const userRecord = requireAuthenticatedUser(req);
    if (!hasPermission(userRecord, 'view_client_chat')) {
        throw createHttpError(403, 'No tienes permisos para llamadas.', 'auth/insufficient-permission');
    }

    const { appId, kid, privateKey } = env.jaas;
    if (!appId || !kid || !privateKey) {
        throw createHttpError(503, 'Las llamadas no están configuradas (JaaS).', 'jaas/not-configured');
    }

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT', kid };
    const payload = {
        aud: 'jitsi',
        iss: 'chat',
        sub: appId,
        iat: now - 10,
        nbf: now - 10,
        exp: now + 3 * 60 * 60,
        room: '*',
        context: {
            user: {
                id: String(userRecord.id || ''),
                name: String(req.body?.name || userRecord.name || 'Usuario'),
                email: String(req.body?.email || userRecord.email || ''),
                avatar: '',
                moderator: req.body?.moderator === true,
                'hidden-from-recorder': false
            },
            features: {
                livestreaming: false,
                recording: false,
                transcription: false,
                'outbound-call': false,
                'sip-outbound-call': false,
                'file-upload': true,
                'list-visitors': false,
                flip: false
            }
        }
    };

    const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
    let signature;
    try {
        const signer = crypto.createSign('RSA-SHA256');
        signer.update(signingInput);
        signer.end();
        signature = signer.sign(privateKey).toString('base64url');
    } catch (error) {
        console.error('[jaas] fallo al firmar el token:', error?.message || error);
        throw createHttpError(500, 'No se pudo firmar el token de la llamada.', 'jaas/sign-failed');
    }

    res.json({ jwt: `${signingInput}.${signature}`, appId });
}));

export default router;
