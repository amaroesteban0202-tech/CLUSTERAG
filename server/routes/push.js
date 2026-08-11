import express from 'express';
import { sha256 } from '../lib/crypto.js';
import { asyncHandler, createHttpError } from '../lib/http.js';
import { deleteRecord, getRecord, upsertRecord } from '../lib/records.js';
import { requireAuthenticatedUser } from '../lib/sessions.js';
import { nowIso } from '../lib/time.js';

const router = express.Router();
const PUSH_TOKEN_COLLECTION = 'push_tokens';

const tokenRecordId = (token) => `push_${sha256(token).slice(0, 40)}`;

router.post('/register', asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const token = String(req.body?.token || '').trim();
    const platform = String(req.body?.platform || 'native').trim().toLowerCase();
    if (!token || token.length > 4096 || !['android', 'ios', 'web', 'native'].includes(platform)) {
        throw createHttpError(400, 'Token de notificación inválido.', 'push/invalid-token');
    }

    const recordId = tokenRecordId(token);
    const existing = await getRecord({ collectionName: PUSH_TOKEN_COLLECTION, recordId });
    if (existing && String(existing.userId || '') !== String(user.id || '')) {
        throw createHttpError(409, 'El token ya esta registrado por otra sesion.', 'push/token-conflict');
    }
    const record = await upsertRecord({
        collectionName: PUSH_TOKEN_COLLECTION,
        recordId,
        payload: {
            token,
            userId: String(user.id || ''),
            platform,
            updatedAt: nowIso()
        },
        merge: false
    });
    res.json({ ok: true, id: record.id });
}));

router.delete('/register', asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const token = String(req.body?.token || '').trim();
    if (token) {
        const recordId = tokenRecordId(token);
        const existing = await getRecord({
            collectionName: PUSH_TOKEN_COLLECTION,
            recordId
        });
        if (existing && String(existing.userId || '') !== String(user.id || '')) {
            throw createHttpError(403, 'El token pertenece a otro usuario.', 'auth/resource-owner-required');
        }
        await deleteRecord({
            collectionName: PUSH_TOKEN_COLLECTION,
            recordId
        });
    }
    res.json({ ok: true });
}));

export default router;
