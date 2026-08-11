import { Router } from 'express';
import { env } from '../config/env.js';
import { escapeHtml, sendEmail } from '../lib/email.js';
import { asyncHandler, createHttpError } from '../lib/http.js';
import { findFirstRecordByEmail, getRecord } from '../lib/records.js';
import { getCollectionPermission, hasPermission } from '../lib/permissions.js';
import { getRequestOrigin } from '../lib/request-origin.js';
import { requireAuthenticatedUser } from '../lib/sessions.js';
import { normalizeEmail } from '../lib/text.js';

const router = Router();

const NOTIFICATION_TYPES = new Set(['assigned', 'mention', 'chat_mention', 'call_invite']);
const RECIPIENT_COLLECTIONS = ['users', 'managers', 'editors'];
const TASK_COLLECTION_BY_TYPE = {
    accountTask: 'account_tasks',
    editingTask: 'editing',
    managementTask: 'management_tasks'
};

const findRecipient = async (email) => {
    const matches = await Promise.all(RECIPIENT_COLLECTIONS.map((collectionName) => (
        findFirstRecordByEmail({ collectionName, email })
    )));
    return matches.find(Boolean) || null;
};

const cleanJoinParam = (value = '') => String(value || '').trim().slice(0, 240);

export const buildCallJoinUrl = (appUrl, { roomId, clientId, messageId } = {}) => {
    const safeRoomId = cleanJoinParam(roomId);
    const safeClientId = cleanJoinParam(clientId);
    const safeMessageId = cleanJoinParam(messageId);
    if (!safeRoomId || !safeClientId) return '';

    try {
        const target = new URL(appUrl);
        if (!['http:', 'https:'].includes(target.protocol)) return '';
        target.searchParams.set('callRoom', safeRoomId);
        target.searchParams.set('callClient', safeClientId);
        if (safeMessageId) target.searchParams.set('callMessage', safeMessageId);
        return target.toString();
    } catch {
        return '';
    }
};

export const buildEmail = ({ type, senderName, taskTitle, taskType, comment, appUrl, clientName, callUrl }) => {
    const isChat = type === 'chat_mention';
    const isCall = type === 'call_invite';
    const accent = isCall ? '#16a34a'
        : isChat ? '#0ea5e9'
            : taskType === 'accountTask' ? '#4f46e5'
                : taskType === 'editingTask' ? '#d97706'
                    : '#7c3aed';
    const typeLabel = isCall ? 'Llamada'
        : isChat ? 'Chat'
            : taskType === 'accountTask' ? 'Account'
                : taskType === 'editingTask' ? 'Edición'
                    : 'Gestión';

    const linkHref = isCall ? callUrl : appUrl;
    const linkLabel = isCall ? 'Unirse a la llamada'
        : isChat ? 'Abrir chat en Cluster OS'
            : 'Abrir tarea en Cluster OS';
    const link = linkHref
        ? `<p style="margin:20px 0 0;"><a href="${escapeHtml(linkHref)}" style="background:${accent};color:#fff;padding:11px 22px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">${linkLabel}</a></p>`
        : '';

    let subject = '';
    let heading = '';
    let body = '';

    if (type === 'assigned') {
        subject = `📋 Te asignaron a: ${taskTitle}`;
        heading = 'Te asignaron a una tarea';
        body = `<strong>${escapeHtml(senderName)}</strong> te asignó a la tarea <strong>"${escapeHtml(taskTitle)}"</strong> en el módulo de <strong>${typeLabel}</strong>.`;
    } else if (type === 'mention') {
        subject = `💬 ${senderName} te mencionó en: ${taskTitle}`;
        heading = 'Te mencionaron en un comentario';
        body = `<strong>${escapeHtml(senderName)}</strong> te mencionó en la tarea <strong>"${escapeHtml(taskTitle)}"</strong>:<br/><br/>
            <blockquote style="margin:12px 0;padding:12px 16px;background:#f8fafc;border-left:3px solid ${accent};border-radius:0 8px 8px 0;color:#475569;font-style:italic;">
                "${escapeHtml(comment)}"
            </blockquote>`;
    } else if (type === 'chat_mention') {
        subject = `💬 ${senderName} te mencionó en el chat de ${clientName}`;
        heading = 'Te mencionaron en el chat';
        body = `<strong>${escapeHtml(senderName)}</strong> te mencionó en el chat interno de <strong>"${escapeHtml(clientName)}"</strong>:<br/><br/>
            <blockquote style="margin:12px 0;padding:12px 16px;background:#f8fafc;border-left:3px solid ${accent};border-radius:0 8px 8px 0;color:#475569;font-style:italic;">
                "${escapeHtml(comment)}"
            </blockquote>`;
    } else {
        subject = `📞 ${senderName} te invitó a una llamada de ${clientName}`;
        heading = 'Te invitaron a una llamada';
        body = `<strong>${escapeHtml(senderName)}</strong> te invitó a una videollamada del cliente <strong>"${escapeHtml(clientName)}"</strong>. Haz clic para unirte.`;
    }

    const html = `
        <div style="font-family:Arial,sans-serif;background:#f1f5f9;padding:24px;">
            <div style="max-width:540px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
                <div style="background:${accent};padding:20px 24px;">
                    <p style="margin:0;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.75);">Cluster OS · ${escapeHtml(typeLabel)}</p>
                    <h2 style="margin:6px 0 0;font-size:20px;color:#fff;">${escapeHtml(heading)}</h2>
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
router.post('/send', asyncHandler(async (req, res) => {
    const actor = requireAuthenticatedUser(req);
    const to = normalizeEmail(req.body?.to);
    const type = String(req.body?.type || '');
    if (!to || !NOTIFICATION_TYPES.has(type)) {
        throw createHttpError(400, 'Destinatario o tipo de notificacion invalido.', 'notifications/invalid-request');
    }

    const recipient = await findRecipient(to);
    if (!recipient || recipient.isActive === false) {
        throw createHttpError(400, 'El destinatario no pertenece al equipo activo.', 'notifications/invalid-recipient');
    }

    if (type === 'chat_mention' || type === 'call_invite') {
        if (!hasPermission(actor, 'send_client_chat')) {
            throw createHttpError(403, 'No tienes permisos para notificar desde el chat.', 'auth/insufficient-permission');
        }
        const messageId = String(req.body?.messageId || '').trim();
        const message = messageId
            ? await getRecord({ collectionName: 'client_chats', recordId: messageId })
            : null;
        const isAuthoredByActor = String(message?.authorId || '') === String(actor.id || '');
        const includesRecipient = (message?.mentionedIds || []).map(String).includes(String(recipient.id));
        const hasMatchingClient = String(message?.clientId || '') === String(req.body?.clientId || '');
        const hasMatchingCall = type !== 'call_invite'
            || String(message?.call?.roomId || '') === String(req.body?.roomId || '');
        if (!message || !isAuthoredByActor || !includesRecipient || !hasMatchingClient || !hasMatchingCall) {
            throw createHttpError(403, 'La notificacion no corresponde a un mensaje valido.', 'notifications/resource-mismatch');
        }
    } else {
        const collectionName = TASK_COLLECTION_BY_TYPE[String(req.body?.taskType || '')];
        const taskId = String(req.body?.taskId || '').trim();
        const readPermission = collectionName ? getCollectionPermission(collectionName, 'read') : null;
        const task = collectionName && taskId
            ? await getRecord({ collectionName, recordId: taskId })
            : null;
        if (!task || !readPermission || !hasPermission(actor, readPermission)) {
            throw createHttpError(403, 'La notificacion no corresponde a una tarea accesible.', 'notifications/resource-mismatch');
        }
        if (type === 'assigned') {
            const assigneeIds = [
                ...(Array.isArray(task.assignees) ? task.assignees : []),
                task.contextId,
                task.assigneeUserId
            ].filter(Boolean).map(String);
            if (!assigneeIds.includes(String(recipient.id))) {
                throw createHttpError(403, 'El destinatario no esta asignado a esta tarea.', 'notifications/resource-mismatch');
            }
        }
        if (type === 'mention') {
            const comments = Array.isArray(task.comments) ? task.comments : [];
            const comment = comments.at(-1);
            const isAuthoredByActor = String(comment?.authorId || '') === String(actor.id || '');
            const includesRecipient = (comment?.mentionedIds || []).map(String).includes(String(recipient.id));
            if (!isAuthoredByActor || !includesRecipient) {
                throw createHttpError(403, 'La mencion no corresponde al comentario guardado.', 'notifications/resource-mismatch');
            }
        }
    }

    const appUrl = env.appBaseUrl || getRequestOrigin(req);
    const { subject, html } = buildEmail({
        type,
        senderName: actor.name || actor.email || 'Usuario',
        taskTitle: req.body?.taskTitle,
        taskType: req.body?.taskType,
        comment: req.body?.comment,
        appUrl,
        clientName: req.body?.clientName,
        callUrl: buildCallJoinUrl(appUrl, {
            roomId: req.body?.roomId,
            clientId: req.body?.clientId,
            messageId: req.body?.messageId
        })
    });
    const result = await sendEmail({ to, subject, html, logLabel: 'notification' });
    res.json({ ok: true, mode: result.mode });
}));

export default router;
