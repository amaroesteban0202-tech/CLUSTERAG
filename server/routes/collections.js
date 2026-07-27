import express from 'express';
import { db } from '../db/knex.js';
import { asyncHandler, createHttpError } from '../lib/http.js';
import { getCollectionPermission, hasPermission } from '../lib/permissions.js';
import {
    createRecord,
    deleteRecord,
    getRecord,
    getLatestRecordChangeId,
    listRecordChanges,
    listRecords,
    upsertRecord
} from '../lib/records.js';
import { prepareManagementTaskPayload } from '../lib/management-tasks.js';
import { requireAuthenticatedUser } from '../lib/sessions.js';
import { normalizeEmail } from '../lib/text.js';
import { sendClientChatPush } from '../lib/push-notifications.js';

const router = express.Router();

const getCollectionName = (req) => String(req.params.collectionName || '').trim();

// Estas colecciones forman parte del estado base de la app para todos los roles,
// pero nunca deben exponerse sin una sesion activa.
const AUTHENTICATED_READ_COLLECTIONS = new Set([
    'clients',
    'events',
    'managers',
    'editors',
    'account_tasks',
    'editing',
    'management_tasks'
]);

const ensureCollectionPermission = (req, action) => {
    const userRecord = requireAuthenticatedUser(req);
    const collectionName = getCollectionName(req);
    const permission = getCollectionPermission(collectionName, action);
    if (!permission) {
        throw createHttpError(404, 'La coleccion no existe.', 'collection/not-found');
    }
    if (!hasPermission(userRecord, permission)) {
        throw createHttpError(403, 'No tienes permisos para esta accion.', 'auth/insufficient-permission');
    }
    return { userRecord, collectionName };
};

// Campos que un usuario puede editar de su propio perfil (sin ser admin).
const PROFILE_SELF_FIELDS = new Set(['name', 'profession', 'photo', 'updatedAt']);

const canUpdateOwnUser = (userRecord, existing = null) => {
    if (!existing) return false;
    const userId = String(userRecord?.id || '');
    if (userId && String(existing.id || '') === userId) return true;
    const userEmail = normalizeEmail(userRecord?.email);
    return Boolean(userEmail && existing.email && normalizeEmail(existing.email) === userEmail);
};

const pickSelfProfileFields = (payload = {}) => {
    const next = {};
    for (const key of Object.keys(payload || {})) {
        if (PROFILE_SELF_FIELDS.has(key)) next[key] = payload[key];
    }
    return next;
};

const canUpdateOwnManagementTask = (userRecord, existing = null) => {
    if (!existing || !hasPermission(userRecord, 'create_management_tasks')) return false;
    const userId = String(userRecord?.id || '');
    const userEmail = normalizeEmail(userRecord?.email);
    if (!userId) return false;
    if ([existing.assignedByUserId, existing.assigneeUserId, existing.contextId]
        .filter(Boolean)
        .some((value) => String(value) === userId)) {
        return true;
    }
    return Boolean(userEmail && normalizeEmail(existing.assignedByEmail) === userEmail);
};

// El autor de un mensaje de chat puede editar/borrar el suyo aunque no tenga
// el permiso de moderacion.
const canUpdateOwnChatMessage = (userRecord, existing = null) => {
    if (!existing || !hasPermission(userRecord, 'send_client_chat')) return false;
    const userId = String(userRecord?.id || '');
    if (userId && String(existing.authorId || '') === userId) return true;
    const userEmail = normalizeEmail(userRecord?.email);
    return Boolean(userEmail && existing.authorEmail && normalizeEmail(existing.authorEmail) === userEmail);
};

const ensureCollectionUpdatePermission = async (req, recordId) => {
    const userRecord = requireAuthenticatedUser(req);
    const collectionName = getCollectionName(req);
    const permission = getCollectionPermission(collectionName, 'update');
    if (!permission) {
        throw createHttpError(404, 'La coleccion no existe.', 'collection/not-found');
    }

    const existing = await getRecord({ collectionName, recordId });
    if (!existing) {
        // setDoc con id específico = upsert (semántica de Firestore): si el
        // documento no existe, permitir crearlo cuando se tiene permiso de
        // creación (p. ej. chat_reads / chat_hidden por usuario).
        const createPermission = getCollectionPermission(collectionName, 'create');
        if (createPermission && hasPermission(userRecord, createPermission)) {
            return { userRecord, collectionName, existing: null, selfEdit: false };
        }
        throw createHttpError(404, 'El documento no existe.', 'document/not-found');
    }

    if (hasPermission(userRecord, permission)
        || (collectionName === 'management_tasks' && canUpdateOwnManagementTask(userRecord, existing))
        || (collectionName === 'client_chats' && canUpdateOwnChatMessage(userRecord, existing))) {
        return { userRecord, collectionName, existing, selfEdit: false };
    }

    // Cualquier usuario activo puede editar su propio perfil (campos limitados).
    if (collectionName === 'users' && canUpdateOwnUser(userRecord, existing)) {
        return { userRecord, collectionName, existing, selfEdit: true };
    }

    throw createHttpError(403, 'No tienes permisos para esta accion.', 'auth/insufficient-permission');
};

const ensureCollectionReadPermission = (req) => {
    const collectionName = getCollectionName(req);
    const permission = getCollectionPermission(collectionName, 'read');
    if (!permission) {
        throw createHttpError(404, 'La coleccion no existe.', 'collection/not-found');
    }
    if (AUTHENTICATED_READ_COLLECTIONS.has(collectionName)) {
        return { userRecord: requireAuthenticatedUser(req), collectionName };
    }
    // Espejo de canUpdateOwnUser: sin view_users, cualquier usuario activo
    // puede leer (solo) su propio registro para resolver su perfil/rol real.
    if (collectionName === 'users') {
        const userRecord = requireAuthenticatedUser(req);
        if (hasPermission(userRecord, permission)) {
            return { userRecord, collectionName };
        }
        return { userRecord, collectionName, selfOnly: true };
    }
    return ensureCollectionPermission(req, 'read');
};

const prepareCollectionPayload = ({ collectionName, payload, existing = null, actor = null, isCreate = false }) => {
    if (collectionName === 'management_tasks') {
        return prepareManagementTaskPayload({
            payload,
            existing,
            actor,
            isCreate
        });
    }
    if (collectionName === 'users') {
        const nextPayload = payload || {};
        const targetEmail = normalizeEmail(nextPayload.email || existing?.email);
        if (targetEmail === 'maycolljaramillo01@gmail.com') {
            return { ...nextPayload, role: 'super_admin', isActive: true };
        }
        if (targetEmail === 'estebanantonio02@gmail.com') {
            return { ...nextPayload, role: 'operations', isActive: nextPayload.isActive !== false };
        }
    }
    return payload || {};
};

router.post('/_batch', asyncHandler(async (req, res) => {
    const operations = Array.isArray(req.body?.ops) ? req.body.ops : [];
    if (operations.length === 0) {
        res.json({ ok: true, operations: 0 });
        return;
    }

    const actor = requireAuthenticatedUser(req);

    await db.transaction(async (trx) => {
        for (const operation of operations) {
            const collectionName = String(operation?.collectionName || '').trim();
            const action = String(operation?.action || '').trim();
            const permissionAction = action === 'set'
                ? 'update'
                : action === 'create'
                    ? 'create'
                    : action;
            const permission = getCollectionPermission(collectionName, permissionAction);
            if (!permission || !hasPermission(req.auth?.userRecord, permission)) {
                throw createHttpError(403, 'No tienes permisos para ejecutar el lote.', 'auth/insufficient-permission');
            }

            if (action === 'update' || action === 'set') {
                const existing = collectionName === 'management_tasks'
                    ? await getRecord({ collectionName, recordId: operation.recordId, trx })
                    : null;
                await upsertRecord({
                    collectionName,
                    recordId: operation.recordId,
                    payload: prepareCollectionPayload({
                        collectionName,
                        payload: operation.data || {},
                        existing,
                        actor,
                        isCreate: false
                    }),
                    merge: operation.merge !== false,
                    trx
                });
                continue;
            }

            if (action === 'delete') {
                await deleteRecord({
                    collectionName,
                    recordId: operation.recordId,
                    trx
                });
                continue;
            }

            if (action === 'create') {
                await createRecord({
                    collectionName,
                    recordId: operation.recordId,
                    payload: prepareCollectionPayload({
                        collectionName,
                        payload: operation.data || {},
                        actor,
                        isCreate: true
                    }),
                    trx
                });
                continue;
            }

            throw createHttpError(400, `Operacion de lote no soportada: ${action}`, 'batch/unsupported-action');
        }
    });

    res.json({ ok: true, operations: operations.length });
}));

router.get('/_sync', asyncHandler(async (req, res) => {
    const userRecord = requireAuthenticatedUser(req);
    const requestedCollections = String(req.query.collections || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    const collections = requestedCollections.filter((collectionName) => {
        const permission = getCollectionPermission(collectionName, 'read');
        return permission && (
            AUTHENTICATED_READ_COLLECTIONS.has(collectionName)
            || hasPermission(userRecord, permission)
            // Espejo de ensureCollectionReadPermission: sin view_users, igual se
            // sincroniza el propio registro (filtrado abajo).
            || collectionName === 'users'
        );
    });

    if (req.query.latest === '1') {
        res.json({ cursor: await getLatestRecordChangeId() });
        return;
    }

    if (collections.length === 0) {
        res.json({ cursor: Number(req.query.cursor) || 0, hasMore: false, changes: [] });
        return;
    }

    const result = await listRecordChanges({
        afterId: Number(req.query.cursor) || 0,
        collections,
        limitCount: 500
    });
    const canReadUsers = hasPermission(userRecord, getCollectionPermission('users', 'read'));
    res.json({
        ...result,
        changes: canReadUsers
            ? result.changes
            : result.changes.filter((change) => (
                change.collectionName !== 'users'
                || String(change.recordId) === String(userRecord.id || '')
                || canUpdateOwnUser(userRecord, change.record)
            ))
    });
}));

router.get('/:collectionName', asyncHandler(async (req, res) => {
    const { collectionName, userRecord, selfOnly } = ensureCollectionReadPermission(req);
    const records = await listRecords({
        collectionName,
        sortBy: String(req.query.orderBy || 'updatedAt'),
        sortDirection: String(req.query.orderDir || 'asc'),
        limitCount: req.query.limit ? Number(req.query.limit) : undefined,
        dateFrom: req.query.dateFrom ? String(req.query.dateFrom) : undefined,
        dateTo: req.query.dateTo ? String(req.query.dateTo) : undefined,
        includeOpenBefore: req.query.includeOpenBefore === '1'
    });

    res.json({
        records: selfOnly
            ? records.filter((record) => canUpdateOwnUser(userRecord, record))
            : records
    });
}));

router.get('/:collectionName/:recordId', asyncHandler(async (req, res) => {
    const { collectionName, userRecord, selfOnly } = ensureCollectionReadPermission(req);
    const record = await getRecord({ collectionName, recordId: req.params.recordId });
    if (!record) {
        throw createHttpError(404, 'El documento no existe.', 'document/not-found');
    }
    if (selfOnly && !canUpdateOwnUser(userRecord, record)) {
        throw createHttpError(403, 'No tienes permisos para esta accion.', 'auth/insufficient-permission');
    }
    res.json({ record });
}));

router.post('/:collectionName', asyncHandler(async (req, res) => {
    const { collectionName, userRecord } = ensureCollectionPermission(req, 'create');
    const record = await createRecord({
        collectionName,
        recordId: req.body?.id,
        payload: prepareCollectionPayload({
            collectionName,
            payload: req.body?.data || {},
            actor: userRecord,
            isCreate: true
        })
    });
    if (collectionName === 'client_chats') {
        const client = await getRecord({
            collectionName: 'clients',
            recordId: record.clientId
        });
        await sendClientChatPush({
            message: record,
            clientName: client?.name || 'Cliente'
        });
    }
    res.status(201).json({ record });
}));

router.put('/:collectionName/:recordId', asyncHandler(async (req, res) => {
    const { collectionName, userRecord, existing, selfEdit } = await ensureCollectionUpdatePermission(req, req.params.recordId);
    const rawPayload = req.body?.data || {};
    const record = await upsertRecord({
        collectionName,
        recordId: req.params.recordId,
        payload: prepareCollectionPayload({
            collectionName,
            payload: selfEdit ? pickSelfProfileFields(rawPayload) : rawPayload,
            existing,
            actor: userRecord,
            isCreate: false
        }),
        merge: selfEdit ? true : (req.body?.merge !== false)
    });
    res.json({ record });
}));

router.patch('/:collectionName/:recordId', asyncHandler(async (req, res) => {
    const { collectionName, userRecord, existing, selfEdit } = await ensureCollectionUpdatePermission(req, req.params.recordId);
    const rawPayload = req.body?.data || {};
    const record = await upsertRecord({
        collectionName,
        recordId: req.params.recordId,
        payload: prepareCollectionPayload({
            collectionName,
            payload: selfEdit ? pickSelfProfileFields(rawPayload) : rawPayload,
            existing,
            actor: userRecord,
            isCreate: false
        }),
        merge: true
    });
    res.json({ record });
}));

router.delete('/:collectionName/:recordId', asyncHandler(async (req, res) => {
    const userRecord = requireAuthenticatedUser(req);
    const collectionName = getCollectionName(req);
    const permission = getCollectionPermission(collectionName, 'delete');
    if (!permission) {
        throw createHttpError(404, 'La coleccion no existe.', 'collection/not-found');
    }
    if (!hasPermission(userRecord, permission)) {
        // El autor puede borrar su propio mensaje de chat o su propio sticker
        // subido sin ser moderador.
        const selfDeletable = collectionName === 'client_chats' || collectionName === 'chat_stickers';
        const existing = selfDeletable
            ? await getRecord({ collectionName, recordId: req.params.recordId })
            : null;
        if (!(selfDeletable && canUpdateOwnChatMessage(userRecord, existing))) {
            throw createHttpError(403, 'No tienes permisos para esta accion.', 'auth/insufficient-permission');
        }
    }
    await deleteRecord({
        collectionName,
        recordId: req.params.recordId
    });
    res.json({ ok: true });
}));

export default router;
