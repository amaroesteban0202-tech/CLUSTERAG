import { getMessaging } from 'firebase-admin/messaging';
import { env } from '../config/env.js';
import { getFirebaseAdminApp } from './firebase-admin.js';
import { deleteRecord, listRecords } from './records.js';
import { buildChatGroups } from './chat-groups.js';
import { normalizeEmail } from './text.js';

const PUSH_TOKEN_COLLECTION = 'push_tokens';
const CHAT_MUTE_COLLECTION = 'chat_mutes';
const INVALID_TOKEN_CODES = new Set([
    'messaging/invalid-registration-token',
    'messaging/registration-token-not-registered'
]);

const messagePreview = (message = {}) => {
    if (message.text) return String(message.text).slice(0, 180);
    if (message.sticker) return 'Envió un sticker';
    const attachmentCount = Array.isArray(message.attachments) ? message.attachments.length : 0;
    if (attachmentCount > 0) {
        return `Envió ${attachmentCount} archivo${attachmentCount === 1 ? '' : 's'}`;
    }
    return 'Nuevo mensaje';
};

export const isChatMuteActive = (mute, now = Date.now()) => {
    const mutedUntil = typeof mute === 'string' ? mute : mute?.mutedUntil;
    if (mutedUntil === 'forever') return true;
    const untilMs = Date.parse(String(mutedUntil || ''));
    return Number.isFinite(untilMs) && untilMs > now;
};

export const canReceiveClientChatPush = ({
    recipientId = '',
    authorId = '',
    memberIds = new Set(),
    mentionedIds = new Set(),
    outsideGroupCallRecipientIds = new Set(),
    isCall = false
} = {}) => {
    const id = String(recipientId || '');
    if (!id || id === String(authorId || '')) return false;
    const isMentioned = mentionedIds.has(id);
    if (isCall) {
        return isMentioned
            && (memberIds.has(id) || outsideGroupCallRecipientIds.has(id));
    }
    return memberIds.has(id);
};

export const buildClientChatPush = ({
    message = {},
    clientName = 'Cliente',
    mentioned = false
}) => {
    const isCall = Boolean(message.call?.roomId && !message.call?.ended);
    return {
        title: isCall
            ? `Llamada entrante · ${clientName}`
            : mentioned
                ? `${message.authorName || 'Alguien'} te mencionó · ${clientName}`
                : `Nuevo mensaje · ${clientName}`,
        body: isCall
            ? `${message.authorName || 'Alguien'} te está llamando`
            : `${message.authorName || 'Alguien'}: ${messagePreview(message)}`,
        data: {
            type: isCall ? 'call' : mentioned ? 'mention' : 'message',
            messageId: String(message.id || ''),
            clientId: String(message.clientId || ''),
            roomId: String(message.call?.roomId || ''),
            clientName: String(clientName || 'Cliente'),
            authorName: String(message.authorName || 'Alguien'),
            mentioned: mentioned ? '1' : '0'
        },
        channelId: isCall ? 'cluster-calls' : 'cluster-messages',
        isCall
    };
};

export const sendClientChatPush = async ({ message, clientName = 'Cliente' }) => {
    if (!message?.id || !message?.clientId) return { sent: 0, skipped: true };

    const [tokens, chatMutes, clients, messages, membershipRecords, users, managers, editors] = await Promise.all([
        listRecords({
            collectionName: PUSH_TOKEN_COLLECTION,
            sortBy: 'updatedAt',
            sortDirection: 'desc'
        }),
        listRecords({
            collectionName: CHAT_MUTE_COLLECTION,
            sortBy: 'updatedAt',
            sortDirection: 'desc'
        }),
        listRecords({ collectionName: 'clients' }),
        listRecords({ collectionName: 'client_chats' }),
        listRecords({ collectionName: 'chat_group_memberships' }),
        listRecords({ collectionName: 'users' }),
        listRecords({ collectionName: 'managers' }),
        listRecords({ collectionName: 'editors' })
    ]);
    const chatGroups = buildChatGroups({
        clients,
        messages,
        membershipRecords,
        users,
        managers,
        editors
    });
    const group = chatGroups.groups.find((item) => String(item.clientId) === String(message.clientId));
    const memberIds = new Set((group?.memberIds || []).map(String));
    const authorId = String(message.authorId || '');
    const mentionedIds = new Set((message.mentionedIds || []).map(String));
    const isCall = Boolean(message.call?.roomId && !message.call?.ended);
    const outsideGroupCallRecipientIds = new Set(chatGroups.people
        .filter((person) => person.canReceiveCallsOutsideGroups)
        .map((person) => String(person.id)));
    const activeMuteKeys = new Set(chatMutes
        .filter((mute) => isChatMuteActive(mute))
        .map((mute) => `${String(mute.userId || '')}__${String(mute.clientId || '')}`));
    const recipients = tokens.filter((entry) => {
        if (!entry?.token || !canReceiveClientChatPush({
            recipientId: entry.userId,
            authorId,
            memberIds,
            mentionedIds,
            outsideGroupCallRecipientIds,
            isCall
        })) return false;
        if (!isCall && activeMuteKeys.has(
            `${String(entry.userId || '')}__${String(message.clientId || '')}`
        )) return false;
        return true;
    });
    if (recipients.length === 0) return { sent: 0, skipped: true };

    try {
        const messaging = getMessaging(getFirebaseAdminApp());
        const groups = isCall
            ? [{ recipients, mentioned: false }]
            : [
                {
                    recipients: recipients.filter((entry) =>
                        mentionedIds.has(String(entry.userId || ''))),
                    mentioned: true
                },
                {
                    recipients: recipients.filter((entry) =>
                        !mentionedIds.has(String(entry.userId || ''))),
                    mentioned: false
                }
            ].filter((group) => group.recipients.length > 0);
        let sent = 0;
        let failed = 0;

        for (const group of groups) {
            const push = buildClientChatPush({
                message,
                clientName,
                mentioned: group.mentioned
            });
            const deliveryGroups = [
                {
                    isWeb: true,
                    recipients: group.recipients.filter((entry) =>
                        String(entry.platform || '').toLowerCase() === 'web')
                },
                {
                    isWeb: false,
                    recipients: group.recipients.filter((entry) =>
                        String(entry.platform || '').toLowerCase() !== 'web')
                }
            ].filter((delivery) => delivery.recipients.length > 0);

            for (const delivery of deliveryGroups) {
                const response = await messaging.sendEachForMulticast(delivery.isWeb
                    ? {
                        tokens: delivery.recipients.map((entry) => entry.token),
                        data: {
                            ...push.data,
                            title: String(clientName || push.title),
                            body: push.body,
                            link: String(env.appBaseUrl || '')
                        },
                        webpush: { headers: { Urgency: 'high' } }
                    }
                    : {
                        tokens: delivery.recipients.map((entry) => entry.token),
                        notification: { title: push.title, body: push.body },
                        data: push.data,
                        android: {
                            priority: 'high',
                            notification: {
                                channelId: push.channelId,
                                sound: 'default',
                                ...(push.isCall ? { priority: 'max', visibility: 'public' } : {})
                            }
                        },
                        apns: {
                            headers: { 'apns-priority': '10' },
                            payload: {
                                aps: {
                                    sound: 'default',
                                    category: push.isCall ? 'CLUSTER_CALL' : 'CLUSTER_MESSAGE'
                                }
                            }
                        }
                    });
                sent += response.successCount;
                failed += response.failureCount;
                await Promise.all(response.responses.map(async (result, index) => {
                    if (result.success || !INVALID_TOKEN_CODES.has(result.error?.code)) return;
                    await deleteRecord({
                        collectionName: PUSH_TOKEN_COLLECTION,
                        recordId: delivery.recipients[index].id
                    });
                }));
            }
        }
        return { sent, failed };
    } catch (error) {
        console.warn('[push]', error?.message || error);
        return { sent: 0, failed: recipients.length };
    }
};

export const buildTaskReminderPush = ({
    variant = 'upcoming',
    taskTitle = '(sin titulo)',
    taskTypeLabel = 'tarea',
    overdueHours = 0,
    recipientRole = 'assignee',
    clientName = '',
    taskId = '',
    collectionName = '',
    label = ''
} = {}) => {
    const isAssigner = recipientRole === 'assigner';
    const typeLabel = String(taskTypeLabel || 'tarea');
    const hours = Number(overdueHours) || 0;
    const stageLabel = String(label || '8 horas');
    let title = '';
    let body = '';

    if (variant === 'upcoming') {
        title = isAssigner
            ? `Tarea que asignaste proxima a vencer (${stageLabel})`
            : `Tarea proxima a vencer (${stageLabel})`;
        body = `${typeLabel}: ${taskTitle}`;
    } else if (variant === 'overdue') {
        title = isAssigner
            ? 'Tarea que asignaste vencida'
            : 'Tarea vencida';
        body = `${typeLabel}: ${taskTitle}`;
    } else {
        title = isAssigner
            ? `Tarea que asignaste vencida hace ${hours}h`
            : `Tarea vencida hace ${hours}h`;
        body = `${typeLabel}: ${taskTitle}`;
    }

    if (clientName) body = `${body} · ${clientName}`;

    return {
        title,
        body,
        data: {
            type: 'task-reminder',
            variant: String(variant || ''),
            taskId: String(taskId || ''),
            collectionName: String(collectionName || ''),
            clientName: String(clientName || ''),
            recipientRole: String(recipientRole || 'assignee'),
            overdueHours: String(hours)
        },
        channelId: 'cluster-messages'
    };
};

export const sendTaskReminderPush = async ({
    recipients = [],
    variant,
    taskTitle,
    taskTypeLabel,
    overdueHours,
    clientName,
    taskId,
    collectionName,
    label
} = {}) => {
    if (!Array.isArray(recipients) || recipients.length === 0) {
        return { sent: 0, failed: 0, skipped: true };
    }

    try {
        const [tokens, users] = await Promise.all([
            listRecords({
                collectionName: PUSH_TOKEN_COLLECTION,
                sortBy: 'updatedAt',
                sortDirection: 'desc'
            }),
            listRecords({ collectionName: 'users' })
        ]);

        const userIdByEmail = new Map();
        for (const user of users) {
            const email = normalizeEmail(user?.email);
            if (!email || !user?.id) continue;
            if (!userIdByEmail.has(email)) userIdByEmail.set(email, String(user.id));
        }

        const recipientUserIdsByRole = new Map();
        for (const recipient of recipients) {
            const email = normalizeEmail(recipient?.email);
            const userId = email ? userIdByEmail.get(email) : null;
            if (!userId) continue;
            const role = recipient.role === 'assigner' ? 'assigner' : 'assignee';
            if (!recipientUserIdsByRole.has(role)) recipientUserIdsByRole.set(role, new Set());
            recipientUserIdsByRole.get(role).add(userId);
        }

        if (recipientUserIdsByRole.size === 0) {
            return { sent: 0, failed: 0, skipped: true };
        }

        const messaging = getMessaging(getFirebaseAdminApp());
        let sent = 0;
        let failed = 0;

        for (const [role, userIds] of recipientUserIdsByRole.entries()) {
            const roleTokens = tokens.filter((entry) => (
                entry?.token && userIds.has(String(entry.userId || ''))
            ));
            if (roleTokens.length === 0) continue;

            const push = buildTaskReminderPush({
                variant,
                taskTitle,
                taskTypeLabel,
                overdueHours,
                recipientRole: role,
                clientName,
                taskId,
                collectionName,
                label
            });
            const deliveryGroups = [
                {
                    isWeb: true,
                    recipients: roleTokens.filter((entry) =>
                        String(entry.platform || '').toLowerCase() === 'web')
                },
                {
                    isWeb: false,
                    recipients: roleTokens.filter((entry) =>
                        String(entry.platform || '').toLowerCase() !== 'web')
                }
            ].filter((delivery) => delivery.recipients.length > 0);

            for (const delivery of deliveryGroups) {
                const response = await messaging.sendEachForMulticast(delivery.isWeb
                    ? {
                        tokens: delivery.recipients.map((entry) => entry.token),
                        data: {
                            ...push.data,
                            title: push.title,
                            body: push.body,
                            link: String(env.appBaseUrl || '')
                        },
                        webpush: { headers: { Urgency: 'high' } }
                    }
                    : {
                        tokens: delivery.recipients.map((entry) => entry.token),
                        notification: { title: push.title, body: push.body },
                        data: push.data,
                        android: {
                            priority: 'high',
                            notification: {
                                channelId: push.channelId,
                                sound: 'default'
                            }
                        },
                        apns: {
                            headers: { 'apns-priority': '10' },
                            payload: {
                                aps: {
                                    sound: 'default',
                                    category: 'CLUSTER_MESSAGE'
                                }
                            }
                        }
                    });
                sent += response.successCount;
                failed += response.failureCount;
                await Promise.all(response.responses.map(async (result, index) => {
                    if (result.success || !INVALID_TOKEN_CODES.has(result.error?.code)) return;
                    await deleteRecord({
                        collectionName: PUSH_TOKEN_COLLECTION,
                        recordId: delivery.recipients[index].id
                    });
                }));
            }
        }

        if (sent === 0 && failed === 0) return { sent: 0, failed: 0, skipped: true };
        return { sent, failed, skipped: false };
    } catch (error) {
        console.warn('[push:task-reminder]', error?.message || error);
        return { sent: 0, failed: recipients.length, skipped: false };
    }
};
