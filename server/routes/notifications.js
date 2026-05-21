import { Router } from 'express';
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const router = Router();

const getTransporter = () => {
    if (!env.smtp?.host || !env.smtp?.user || !env.smtp?.password) return null;
    return nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port || 587,
        secure: env.smtp.secure || false,
        auth: { user: env.smtp.user, pass: env.smtp.password }
    });
};

const escHtml = (s = '') => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const buildEmail = ({ type, senderName, taskTitle, taskType, comment, appUrl }) => {
    const accent = taskType === 'accountTask' ? '#4f46e5'
                 : taskType === 'editingTask' ? '#d97706'
                 : '#7c3aed';
    const typeLabel = taskType === 'accountTask' ? 'Account'
                    : taskType === 'editingTask' ? 'Edición'
                    : 'Gestión';

    const link = appUrl
        ? `<p style="margin:20px 0 0;"><a href="${escHtml(appUrl)}" style="background:${accent};color:#fff;padding:11px 22px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">Abrir tarea en Cluster OS</a></p>`
        : '';

    let subject, heading, body;

    if (type === 'assigned') {
        subject = `📋 Te asignaron a: ${taskTitle}`;
        heading = 'Te asignaron a una tarea';
        body = `<strong>${escHtml(senderName)}</strong> te asignó a la tarea <strong>"${escHtml(taskTitle)}"</strong> en el módulo de <strong>${typeLabel}</strong>.`;
    } else if (type === 'mention') {
        subject = `💬 ${senderName} te mencionó en: ${taskTitle}`;
        heading = 'Te mencionaron en un comentario';
        body = `<strong>${escHtml(senderName)}</strong> te mencionó en la tarea <strong>"${escHtml(taskTitle)}"</strong>:<br/><br/>
            <blockquote style="margin:12px 0;padding:12px 16px;background:#f8fafc;border-left:3px solid ${accent};border-radius:0 8px 8px 0;color:#475569;font-style:italic;">
                "${escHtml(comment)}"
            </blockquote>`;
    }

    const html = `
        <div style="font-family:Arial,sans-serif;background:#f1f5f9;padding:24px;">
            <div style="max-width:540px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
                <div style="background:${accent};padding:20px 24px;">
                    <p style="margin:0;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.75);">Cluster OS · ${escHtml(typeLabel)}</p>
                    <h2 style="margin:6px 0 0;font-size:20px;color:#fff;">${escHtml(heading)}</h2>
                </div>
                <div style="padding:24px;">
                    <p style="margin:0;color:#334155;font-size:14px;line-height:1.6;">${body}</p>
                    ${link}
                    <p style="margin:20px 0 0;color:#94a3b8;font-size:12px;">Notificación automática de Cluster OS. No respondas este correo.</p>
                </div>
            </div>
        </div>`;

    return { subject, html };
};

// POST /api/notifications/send
router.post('/send', async (req, res) => {
    try {
        const { to, type, senderName, taskTitle, taskType, comment, appUrl } = req.body;
        if (!to || !type) return res.status(400).json({ error: { message: 'Missing to or type' } });

        const { subject, html } = buildEmail({ type, senderName, taskTitle, taskType, comment, appUrl });
        const mailer = getTransporter();

        if (!mailer) {
            console.info(`[notify:${type}] → ${to} | ${subject}`);
            return res.json({ ok: true, mode: 'console' });
        }

        await mailer.sendMail({ from: env.smtp.from || env.smtp.user, to, subject, html });
        res.json({ ok: true, mode: 'smtp' });
    } catch (err) {
        console.error('[notifications]', err);
        res.status(500).json({ error: { message: err.message } });
    }
});

export default router;
