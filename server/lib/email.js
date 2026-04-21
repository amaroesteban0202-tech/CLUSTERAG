import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

const hasSmtpConfig = () => Boolean(env.smtp.host && env.smtp.user && env.smtp.password);

const getTransporter = () => {
    if (!hasSmtpConfig()) return null;
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: env.smtp.host,
            port: env.smtp.port,
            secure: env.smtp.secure,
            auth: {
                user: env.smtp.user,
                pass: env.smtp.password
            }
        });
    }
    return transporter;
};

export const sendMagicLinkEmail = async ({ email, name, link, expiresAt }) => {
    const mailer = getTransporter();
    const subject = 'Acceso a Cluster Agency OS';
    const html = `
        <div style="font-family: Arial, sans-serif; color: #0f172a;">
            <h2>Hola${name ? ` ${name}` : ''}</h2>
            <p>Usa este enlace para iniciar sesion en Cluster Agency OS:</p>
            <p><a href="${link}">${link}</a></p>
            <p>Expira en ${expiresAt}.</p>
        </div>
    `;

    if (!mailer) {
        console.info(`[magic-link:${email}] ${link}`);
        return { mode: 'console' };
    }

    await mailer.sendMail({
        from: env.smtp.from,
        to: email,
        subject,
        html
    });

    return { mode: 'smtp' };
};

const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildManagementTaskEmail = ({
    variant,
    label,
    overdueHours,
    assigneeName,
    assignedByName,
    taskTitle,
    taskNotes,
    clientName,
    dueHuman,
    taskUrl
}) => {
    const safeTitle = escapeHtml(taskTitle);
    const safeName = escapeHtml(assigneeName || '');
    const safeAssignedBy = escapeHtml(assignedByName || '');
    const safeClient = clientName ? escapeHtml(clientName) : '';
    const safeNotes = taskNotes ? escapeHtml(taskNotes) : '';
    const safeDue = escapeHtml(dueHuman || '');
    const link = taskUrl
        ? `<p style="margin:16px 0;"><a href="${taskUrl}" style="background:#7c3aed;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700;">Abrir en Cluster OS</a></p>`
        : '';

    let subject = '';
    let heading = '';
    let lead = '';
    let accent = '#7c3aed';

    if (variant === 'upcoming') {
        subject = `[Cluster OS] Tarea proxima a vencer (${label}): ${taskTitle}`;
        heading = `Tu tarea esta por vencer en ${escapeHtml(label)}`;
        lead = `Hola${safeName ? ` ${safeName}` : ''}, tenes una tarea de gestion${safeAssignedBy ? ` asignada por <strong>${safeAssignedBy}</strong>` : ''} que vence en <strong>${escapeHtml(label)}</strong>.`;
        accent = '#f59e0b';
    } else if (variant === 'overdue') {
        subject = `[Cluster OS] Tarea VENCIDA: ${taskTitle}`;
        heading = 'Tu tarea acaba de vencer';
        lead = `Hola${safeName ? ` ${safeName}` : ''}, la siguiente tarea${safeAssignedBy ? ` asignada por <strong>${safeAssignedBy}</strong>` : ''} ya paso su fecha limite y sigue sin cerrarse.`;
        accent = '#dc2626';
    } else {
        subject = `[Cluster OS] Tarea vencida hace ${overdueHours || 0}h: ${taskTitle}`;
        heading = `Recordatorio: sigue vencida hace ${overdueHours || 0}h`;
        lead = `Hola${safeName ? ` ${safeName}` : ''}, esta tarea${safeAssignedBy ? ` asignada por <strong>${safeAssignedBy}</strong>` : ''} todavia no se cierra. Te enviaremos un aviso cada 24 h hasta que la marques como cerrada.`;
        accent = '#b91c1c';
    }

    const rows = [
        ['Tarea', `<strong>${safeTitle}</strong>`],
        ['Fecha limite', safeDue],
        ...(safeAssignedBy ? [['Asignada por', safeAssignedBy]] : []),
        ...(safeClient ? [['Cliente', safeClient]] : []),
        ...(safeNotes ? [['Notas', safeNotes.replace(/\n/g, '<br>')]] : [])
    ];

    const tableRows = rows.map(([k, v]) => (
        `<tr><td style="padding:6px 12px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">${k}</td>`
        + `<td style="padding:6px 12px;color:#0f172a;font-size:14px;">${v}</td></tr>`
    )).join('');

    const html = `
        <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;">
            <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
                <div style="background:${accent};color:#fff;padding:20px 24px;">
                    <p style="margin:0;font-size:12px;letter-spacing:.15em;text-transform:uppercase;opacity:.85;">Cluster OS - Sala de Gestion</p>
                    <h2 style="margin:8px 0 0;font-size:22px;">${heading}</h2>
                </div>
                <div style="padding:24px;">
                    <p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.5;">${lead}</p>
                    <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:12px;">${tableRows}</table>
                    ${link}
                    <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;">Este correo fue generado automaticamente. Si ya completaste la tarea, abrila en Cluster OS y movela a <em>Cerrado</em> para dejar de recibir recordatorios.</p>
                </div>
            </div>
        </div>
    `;

    return { subject, html };
};

export const sendManagementTaskReminderEmail = async (context = {}) => {
    const mailer = getTransporter();
    const { subject, html } = buildManagementTaskEmail(context);

    if (!mailer) {
        console.info(`[management-reminder:${context.to}] ${subject}`);
        return { mode: 'console' };
    }

    await mailer.sendMail({
        from: env.smtp.from,
        to: context.to,
        subject,
        html
    });

    return { mode: 'smtp' };
};
