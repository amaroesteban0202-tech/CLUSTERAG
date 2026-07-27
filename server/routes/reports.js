import express from 'express';
import { db } from '../db/knex.js';
import { asyncHandler, createHttpError } from '../lib/http.js';
import { hasPermission } from '../lib/permissions.js';
import { requireAuthenticatedUser } from '../lib/sessions.js';

const router = express.Router();

const parseUserPayload = (value) => {
    try {
        return typeof value === 'string' ? JSON.parse(value) : (value || {});
    } catch {
        return {};
    }
};

router.get('/rendimiento-editores', asyncHandler(async (req, res) => {
    const actor = requireAuthenticatedUser(req);
    if (!hasPermission(actor, 'view_audit_logs')) {
        throw createHttpError(403, 'No tienes permisos para ver este reporte.', 'auth/insufficient-permission');
    }

    const rows = await db('auth_sessions as s')
        .join('app_records as u', 'u.record_id', 's.user_record_id')
        .where('u.collection_name', 'users')
        .select('s.user_record_id', 'u.payload_json')
        .max({ last_seen_at: 's.last_seen_at' })
        .groupBy('s.user_record_id', 'u.payload_json');

    const data = rows.map((row) => {
        const user = parseUserPayload(row.payload_json);
        return {
            user_id: row.user_record_id,
            email: user.email || '',
            nombre: user.name || '',
            ultimo_login: row.last_seen_at || null
        };
    });

    res.json({ success: true, data });
}));

export default router;
