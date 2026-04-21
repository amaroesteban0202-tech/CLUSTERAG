import express from 'express';
import { env } from '../config/env.js';
import { asyncHandler, createHttpError } from '../lib/http.js';
import { processManagementTaskReminders } from '../lib/management-notifications.js';

const router = express.Router();

const authorize = (req) => {
    const secret = process.env.CRON_SECRET || '';
    // Vercel Cron automaticamente envia Authorization: Bearer ${CRON_SECRET}
    // cuando la variable CRON_SECRET existe en el proyecto.
    if (!secret) {
        // Sin secret configurado: solo permitir en desarrollo.
        if (env.isProduction) {
            throw createHttpError(401, 'CRON_SECRET no configurado.', 'cron/unauthorized');
        }
        return;
    }
    const header = String(req.headers.authorization || '');
    const expected = `Bearer ${secret}`;
    if (header !== expected) {
        throw createHttpError(401, 'No autorizado.', 'cron/unauthorized');
    }
};

router.get('/management-task-reminders', asyncHandler(async (req, res) => {
    authorize(req);
    const report = await processManagementTaskReminders();
    res.json({ ok: true, report });
}));

// Permitir POST tambien (por si se invoca manualmente con curl)
router.post('/management-task-reminders', asyncHandler(async (req, res) => {
    authorize(req);
    const report = await processManagementTaskReminders();
    res.json({ ok: true, report });
}));

export default router;
