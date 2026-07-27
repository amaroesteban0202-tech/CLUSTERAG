import { getMessaging } from 'firebase-admin/messaging';
import { getFirebaseAdminApp } from './firebase-admin.js';
import { deleteRecord, listRecords } from './records.js';

const PUSH_TOKEN_COLLECTION = 'push_tokens';
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

export const buildClientChatPush = ({ message = {}, clientName = 'Cliente' }) => {
    const isCall = Boolean(message.call?.roomId && !message.call?.ended);
    return {
        title: isCall
            ? `Llamada entrante · ${clientName}`
            : `Nuevo mensaje · ${clientName}`,
        body: isCall
            ? `${message.authorName || 'Alguien'} te está llamando`
            : `${message.authorName || 'Alguien'}: ${messagePreview(message)}`,
        data: {
            type: isCall ? 'call' : 'message',
            messageId: String(message.id || ''),
            clientId: String(message.clientId || ''),
            roomId: String(message.call?.roomId || '')
        },
        channelId: isCall ? 'cluster-calls' : 'cluster-messages',
        isCall
    };
};

export const sendClientChatPush = async ({ message, clientName = 'Cliente' }) => {
    if (!message?.id || !message?.clientId) return { sent: 0, skipped: true };

    const tokens = await listRecords({
        collectionName: PUSH_TOKEN_COLLECTION,
        sortBy: 'updatedAt',
        sortDirection: 'desc'
    });
    const authorId = String(message.authorId || '');
    const mentionedIds = new Set((message.mentionedIds || []).map(String));
    const isCall = Boolean(message.call?.roomId && !message.call?.ended);
    const recipients = tokens.filter((entry) => {
        if (!entry?.token || String(entry.userId || '') === authorId) return false;
        return !isCall || mentionedIds.has(String(entry.userId || ''));
    });
    if (recipients.length === 0) return { sent: 0, skipped: true };

    const push = buildClientChatPush({ message, clientName });
    try {
        const messaging = getMessaging(getFirebaseAdminApp());
        const response = await messaging.sendEachForMulticast({
            tokens: recipients.map((entry) => entry.token),
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

        await Promise.all(response.responses.map(async (result, index) => {
            if (result.success || !INVALID_TOKEN_CODES.has(result.error?.code)) return;
            await deleteRecord({
                collectionName: PUSH_TOKEN_COLLECTION,
                recordId: recipients[index].id
            });
        }));
        return { sent: response.successCount, failed: response.failureCount };
    } catch (error) {
        console.warn('[push]', error?.message || error);
        return { sent: 0, failed: recipients.length };
    }
};

