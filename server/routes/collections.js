import express from 'express';
import { db } from '../db/knex.js';
import { asyncHandler, createHttpError } from '../lib/http.js';
import { getCollectionPermission, hasPermission } from '../lib/permissions.js';
import {
    createRecord,
    deleteRecord,
    getRecord,
    listRecords,
    upsertRecord
} from '../lib/records.js';
import { prepareManagementTaskPayload } from '../lib/management-tasks.js';
import { requireAuthenticatedUser } from '../lib/sessions.js';
import { normalizeEmail } from '../lib/text.js';

const router = express.Router();

const getCollectionName = (req) => String(req.params.collectionName || '').trim();

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

router.get('/:collectionName', asyncHandler(async (req, res) => {
    const { collectionName } = ensureCollectionPermission(req, 'read');
    const records = await listRecords({
        collectionName,
        sortBy: String(req.query.orderBy || 'updatedAt'),
        sortDirection: String(req.query.orderDir || 'asc'),
        limitCount: req.query.limit ? Number(req.query.limit) : undefined
    });

    res.json({ records });
}));

router.get('/:collectionName/:recordId', asyncHandler(async (req, res) => {
    const { collectionName } = ensureCollectionPermission(req, 'read');
    const record = await getRecord({ collectionName, recordId: req.params.recordId });
    if (!record) {
        throw createHttpError(404, 'El documento no existe.', 'document/not-found');
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
    res.status(201).json({ record });
}));

router.put('/:collectionName/:recordId', asyncHandler(async (req, res) => {
    const { collectionName, userRecord } = ensureCollectionPermission(req, 'update');
    const existing = await getRecord({ collectionName, recordId: req.params.recordId });
    const record = await upsertRecord({
        collectionName,
        recordId: req.params.recordId,
        payload: prepareCollectionPayload({
            collectionName,
            payload: req.body?.data || {},
            existing,
            actor: userRecord,
            isCreate: false
        }),
        merge: req.body?.merge !== false
    });
    res.json({ record });
}));

router.patch('/:collectionName/:recordId', asyncHandler(async (req, res) => {
    const { collectionName, userRecord } = ensureCollectionPermission(req, 'update');
    const existing = await getRecord({ collectionName, recordId: req.params.recordId });
    if (!existing) {
        throw createHttpError(404, 'El documento no existe.', 'document/not-found');
    }
    const record = await upsertRecord({
        collectionName,
        recordId: req.params.recordId,
        payload: prepareCollectionPayload({
            collectionName,
            payload: req.body?.data || {},
            existing,
            actor: userRecord,
            isCreate: false
        }),
        merge: true
    });
    res.json({ record });
}));

router.delete('/:collectionName/:recordId', asyncHandler(async (req, res) => {
    const { collectionName } = ensureCollectionPermission(req, 'delete');
    await deleteRecord({
        collectionName,
        recordId: req.params.recordId
    });
    res.json({ ok: true });
}));

export default router;
