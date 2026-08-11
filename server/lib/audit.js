import { createRecord } from './records.js';
import { nowIso } from './time.js';

const NOISY_COLLECTIONS = new Set([
    'audit_logs',
    'chat_reads',
    'chat_mutes',
    'chat_hidden',
    'chat_reactions',
    'chat_pins'
]);

export const writeAuditLog = async ({
    actor,
    action,
    collectionName,
    recordId,
    trx
}) => {
    if (!actor?.id || NOISY_COLLECTIONS.has(collectionName)) return;
    await createRecord({
        collectionName: 'audit_logs',
        payload: {
            action,
            entityType: collectionName,
            entityId: String(recordId || ''),
            status: 'success',
            createdAt: nowIso(),
            source: 'server',
            actor: {
                uid: String(actor.id),
                email: actor.email || '',
                name: actor.name || '',
                role: actor.role || 'viewer'
            }
        },
        trx
    });
};
