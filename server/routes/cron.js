import express from 'express';
import { env } from '../config/env.js';
import { asyncHandler, createHttpError } from '../lib/http.js';
import { processManagementTaskReminders } from '../lib/management-notifications.js';
import { sendDailyRoleReports } from '../lib/daily-reports.js';
import { sendWeeklyModuleReports } from '../lib/weekly-module-reports.js';
import { safeEqual } from '../lib/crypto.js';
import { withCronLock } from '../lib/cron-lock.js';

const router = express.Router();

const authorize = (req) => {
    const secret = env.cronSecret;
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
    if (!safeEqual(header, expected)) {
        throw createHttpError(401, 'No autorizado.', 'cron/unauthorized');
    }
};

const dailyReportRecipient = () => {
    const recipient = String(env.dailyReportEmail || '').trim();
    if (!recipient) {
        throw createHttpError(503, 'DAILY_REPORT_EMAIL no configurado.', 'cron/missing-recipient');
    }
    return recipient;
};

const jobHandler = (lockName, run) => asyncHandler(async (req, res) => {
    authorize(req);
    const report = await withCronLock(lockName, run);
    res.json({ ok: true, report });
});

const managementTaskReminders = jobHandler(
    'management-task-reminders',
    processManagementTaskReminders
);
const dailyRoleReports = jobHandler('daily-role-reports', () => sendDailyRoleReports({
    to: dailyReportRecipient()
}));
const weeklyModuleReports = jobHandler('weekly-module-reports', () => sendWeeklyModuleReports({
    to: dailyReportRecipient()
}));

router.route('/management-task-reminders').get(managementTaskReminders).post(managementTaskReminders);
router.route('/daily-role-reports').get(dailyRoleReports).post(dailyRoleReports);
router.route('/weekly-module-reports').get(weeklyModuleReports).post(weeklyModuleReports);

export default router;
