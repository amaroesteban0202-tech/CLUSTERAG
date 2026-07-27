import express from 'express';
import { env } from '../config/env.js';
import { sha256 } from '../lib/crypto.js';
import { asyncHandler, createHttpError } from '../lib/http.js';
import { deleteRecord, upsertRecord } from '../lib/records.js';
import { requireAuthenticatedUser } from '../lib/sessions.js';
import { nowIso } from '../lib/time.js';

const router = express.Router();
const PUSH_TOKEN_COLLECTION = 'push_tokens';

const tokenRecordId = (token) => `push_${sha256(token).slice(0, 40)}`;

router.get('/config', (req, res) => {
    requireAuthenticatedUser(req);
    res.json({ vapidKey: env.firebase.webPushVapidKey });
});

router.post('/register', asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const token = String(req.body?.token || '').trim();
    if (!token || token.length > 4096) {
        throw createHttpError(400, 'Token de notificación inválido.', 'push/invalid-token');
    }

    const record = await upsertRecord({
        collectionName: PUSH_TOKEN_COLLECTION,
        recordId: tokenRecordId(token),
        payload: {
            token,
            userId: String(user.id || ''),
            platform: String(req.body?.platform || 'native').slice(0, 32),
            updatedAt: nowIso()
        },
        merge: false
    });
    res.json({ ok: true, id: record.id });
}));

router.delete('/register', asyncHandler(async (req, res) => {
    requireAuthenticatedUser(req);
    const token = String(req.body?.token || '').trim();
    if (token) {
        await deleteRecord({
            collectionName: PUSH_TOKEN_COLLECTION,
            recordId: tokenRecordId(token)
        });
    }
    res.json({ ok: true });
}));

export default router;
