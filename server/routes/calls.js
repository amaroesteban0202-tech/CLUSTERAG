import { Router } from 'express';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { asyncHandler, createHttpError } from '../lib/http.js';
import { hasPermission } from '../lib/permissions.js';
import { requireAuthenticatedUser } from '../lib/sessions.js';
import { getRecord, listRecords } from '../lib/records.js';
import { buildChatGroups, canManageChatGroups } from '../lib/chat-groups.js';

const router = Router();

const b64url = (input) => Buffer.from(input).toString('base64url');

router.post('/jaas-token', asyncHandler(async (req, res) => {
    const userRecord = requireAuthenticatedUser(req);
    if (!hasPermission(userRecord, 'view_client_chat')) {
        throw createHttpError(403, 'No tienes permisos para llamadas.', 'auth/insufficient-permission');
    }
    const messageId = String(req.body?.messageId || '').trim();
    const clientId = String(req.body?.clientId || '').trim();
    const roomId = String(req.body?.roomId || '').trim();
    if (!messageId || !clientId || !/^[A-Za-z0-9_-]{3,120}$/.test(roomId)) {
        throw createHttpError(400, 'La llamada no incluye una sala valida.', 'jaas/invalid-room');
    }

    const message = await getRecord({ collectionName: 'client_chats', recordId: messageId });
    if (
        !message
        || String(message.clientId || '') !== clientId
        || String(message.call?.roomId || '') !== roomId
        || message.call?.ended === true
    ) {
        throw createHttpError(403, 'La llamada ya no esta disponible.', 'jaas/call-unavailable');
    }

    if (!canManageChatGroups(userRecord)) {
        const [clients, messages, memberships, users, managers, editors] = await Promise.all([
            listRecords({ collectionName: 'clients' }),
            listRecords({ collectionName: 'client_chats' }),
            listRecords({ collectionName: 'chat_group_memberships' }),
            listRecords({ collectionName: 'users' }),
            listRecords({ collectionName: 'managers' }),
            listRecords({ collectionName: 'editors' })
        ]);
        const context = buildChatGroups({
            clients,
            messages,
            membershipRecords: memberships,
            users,
            managers,
            editors
        });
        const actorId = context.resolvePersonId(userRecord);
        const group = context.groups.find((item) => String(item.clientId) === clientId);
        if (!group?.memberIds?.map(String).includes(String(actorId))) {
            throw createHttpError(403, 'No perteneces a esta llamada.', 'chat-groups/membership-required');
        }
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
        exp: now + 15 * 60,
        room: roomId,
        context: {
            user: {
                id: String(userRecord.id || ''),
                name: String(userRecord.name || 'Usuario'),
                email: String(userRecord.email || ''),
                avatar: '',
                moderator: String(message.authorId || '') === String(userRecord.id || ''),
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
