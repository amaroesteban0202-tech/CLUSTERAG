import { db } from '../db/knex.js';
import { createRecordId } from './crypto.js';
import { nowIso } from './time.js';
import { normalizeEmail } from './text.js';

const TASK_COLLECTIONS = new Set(['account_tasks', 'editing', 'management_tasks']);
const CLOSED_STATUS_BY_COLLECTION = {
    account_tasks: new Set(['publicado']),
    editing: new Set(['aprobado', 'publicado']),
    management_tasks: new Set(['cerrado'])
};

const stripUndefined = (value) => JSON.parse(JSON.stringify(value));

// Los adjuntos guardan el archivo como base64 en `data` (hasta 8MB c/u). Si se
// devuelven completos en cada listado, el polling (cada 2 min, por pestaña)
// vuelve a transferir esos MB una y otra vez sin que nadie los este viendo.
// El listado solo manda metadata; el detalle completo se pide bajo demanda
// via getRecord (GET /api/collections/:collectionName/:recordId).
const stripAttachmentData = (record) => {
    if (!Array.isArray(record?.attachments) || record.attachments.length === 0) return record;
    return {
        ...record,
        attachments: record.attachments.map(({ data, ...meta }) => ({
            ...meta,
            hasData: Boolean(data)
        }))
    };
};

const parsePayload = (row = {}) => {
    try {
        return JSON.parse(row.payload_json || '{}');
    } catch {
        return {};
    }
};

const buildRecord = (row = {}) => ({
    id: row.record_id,
    ...parsePayload(row)
});

const getClient = (trx) => trx || db;

const trackRecordChange = ({ collectionName, recordId, action, trx }) => getClient(trx)('record_changes').insert({
    collection_name: collectionName,
    record_id: recordId,
    action,
    changed_at: nowIso()
});

const getIndexes = (collectionName, payload = {}) => ({
    email_index: normalizeEmail(payload.email),
    role_index: payload.role ? String(payload.role) : null,
    is_active_index: typeof payload.isActive === 'boolean' ? payload.isActive : null,
    auth_uid_index: payload.authUid ? String(payload.authUid) : null,
    management_key_index: payload.managementKey ? String(payload.managementKey) : null,
    date_index: payload.date ? String(payload.date).slice(0, 20) : null,
    status_index: payload.status ? String(payload.status) : null
});

const compareValues = (left, right, direction = 'asc') => {
    const leftValue = left ?? '';
    const rightValue = right ?? '';
    if (leftValue === rightValue) return 0;
    const baseResult = leftValue > rightValue ? 1 : -1;
    return direction === 'desc' ? baseResult * -1 : baseResult;
};

const SORT_COLUMN_BY_FIELD = {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    date: 'date_index',
    status: 'status_index'
};

const applyTaskWindow = (query, { collectionName, dateFrom, dateTo, includeOpenBefore = false }) => {
    if (!TASK_COLLECTIONS.has(collectionName) || !dateFrom || !dateTo) return query;
    const closedStatuses = [...(CLOSED_STATUS_BY_COLLECTION[collectionName] || new Set())];
    return query.andWhere((builder) => {
        builder.whereBetween('date_index', [dateFrom, dateTo]);
        if (includeOpenBefore) {
            builder.orWhere((overdue) => {
                overdue.where('date_index', '<', dateFrom);
                if (closedStatuses.length > 0) overdue.whereNotIn('status_index', closedStatuses);
            });
        }
    });
};

export const getRecord = async ({ collectionName, recordId, trx }) => {
    const row = await getClient(trx)('app_records')
        .where({ collection_name: collectionName, record_id: recordId })
        .first();
    return row ? buildRecord(row) : null;
};

export const listRecords = async ({
    collectionName,
    sortBy = 'updatedAt',
    sortDirection = 'asc',
    limitCount,
    dateFrom,
    dateTo,
    includeOpenBefore = false,
    trx
}) => {
    const query = getClient(trx)('app_records').where({ collection_name: collectionName });
    applyTaskWindow(query, { collectionName, dateFrom, dateTo, includeOpenBefore });

    const stripHeavyFields = TASK_COLLECTIONS.has(collectionName)
        ? (record) => stripAttachmentData(record)
        : (record) => record;

    const sortColumn = SORT_COLUMN_BY_FIELD[sortBy];
    if (sortColumn) {
        query.orderBy(sortColumn, sortDirection === 'desc' ? 'desc' : 'asc');
        if (limitCount) query.limit(limitCount);
        return (await query).map(buildRecord).map(stripHeavyFields);
    }

    const rows = await query;
    let records = rows.map(buildRecord).map(stripHeavyFields);
    records = records.sort((left, right) => compareValues(left?.[sortBy], right?.[sortBy], sortDirection));
    if (limitCount) records = records.slice(0, limitCount);
    return records;
};

export const createRecord = async ({ collectionName, payload, recordId = createRecordId(), trx }) => {
    const stamp = nowIso();
    const nextPayload = stripUndefined({
        ...payload,
        id: recordId,
        createdAt: payload?.createdAt || stamp,
        updatedAt: payload?.updatedAt || stamp
    });
    const row = {
        collection_name: collectionName,
        record_id: recordId,
        payload_json: JSON.stringify(nextPayload),
        created_at: nextPayload.createdAt,
        updated_at: nextPayload.updatedAt,
        ...getIndexes(collectionName, nextPayload)
    };

    await getClient(trx)('app_records')
        .insert(row)
        .onConflict(['collection_name', 'record_id'])
        .merge(row);
    await trackRecordChange({ collectionName, recordId, action: 'upsert', trx });

    return { id: recordId, ...nextPayload };
};

export const upsertRecord = async ({ collectionName, recordId = createRecordId(), payload, merge = true, trx }) => {
    const existing = await getRecord({ collectionName, recordId, trx });
    if (!existing) return createRecord({ collectionName, payload, recordId, trx });

    const stamp = nowIso();
    const nextPayload = stripUndefined(merge
        ? {
            ...existing,
            ...payload,
            id: recordId,
            createdAt: existing.createdAt || payload?.createdAt || stamp,
            updatedAt: payload?.updatedAt || stamp
        }
        : {
            ...payload,
            id: recordId,
            createdAt: payload?.createdAt || existing.createdAt || stamp,
            updatedAt: payload?.updatedAt || stamp
        });

    await getClient(trx)('app_records')
        .where({ collection_name: collectionName, record_id: recordId })
        .update({
            payload_json: JSON.stringify(nextPayload),
            created_at: nextPayload.createdAt,
            updated_at: nextPayload.updatedAt,
            ...getIndexes(collectionName, nextPayload)
        });
    await trackRecordChange({ collectionName, recordId, action: 'upsert', trx });

    return { id: recordId, ...nextPayload };
};

export const deleteRecord = async ({ collectionName, recordId, trx }) => {
    await getClient(trx)('app_records')
        .where({ collection_name: collectionName, record_id: recordId })
        .delete();
    await trackRecordChange({ collectionName, recordId, action: 'delete', trx });
};

export const getLatestRecordChangeId = async ({ trx } = {}) => {
    const row = await getClient(trx)('record_changes').max('id as id').first();
    return Number(row?.id || 0);
};

export const listRecordChanges = async ({ afterId = 0, collections = [], limitCount = 500, trx } = {}) => {
    const client = getClient(trx);
    const query = client('record_changes')
        .where('id', '>', Number(afterId) || 0)
        .orderBy('id', 'asc')
        .limit(limitCount);
    if (collections.length > 0) query.whereIn('collection_name', collections);

    const rows = await query;
    const latestByRecord = new Map();
    rows.forEach((row) => latestByRecord.set(`${row.collection_name}:${row.record_id}`, row));

    const recordsByKey = new Map();
    const idsByCollection = new Map();
    latestByRecord.forEach((row) => {
        if (row.action === 'delete') return;
        if (!idsByCollection.has(row.collection_name)) idsByCollection.set(row.collection_name, []);
        idsByCollection.get(row.collection_name).push(row.record_id);
    });
    for (const [collectionName, recordIds] of idsByCollection) {
        const recordRows = await client('app_records')
            .where({ collection_name: collectionName })
            .whereIn('record_id', recordIds);
        recordRows.forEach((row) => {
            const record = buildRecord(row);
            recordsByKey.set(`${collectionName}:${row.record_id}`, TASK_COLLECTIONS.has(collectionName)
                ? stripAttachmentData(record)
                : record);
        });
    }

    return {
        cursor: Number(rows.at(-1)?.id || afterId || 0),
        hasMore: rows.length === limitCount,
        changes: [...latestByRecord.values()].map((row) => ({
            collectionName: row.collection_name,
            recordId: row.record_id,
            action: row.action,
            record: recordsByKey.get(`${row.collection_name}:${row.record_id}`) || null
        }))
    };
};

export const findFirstRecordByEmail = async ({ collectionName, email, trx }) => {
    const row = await getClient(trx)('app_records')
        .where({ collection_name: collectionName, email_index: normalizeEmail(email) })
        .first();
    return row ? buildRecord(row) : null;
};

export const findFirstRecordByAuthUid = async ({ collectionName, authUid, trx }) => {
    const row = await getClient(trx)('app_records')
        .where({ collection_name: collectionName, auth_uid_index: String(authUid || '') })
        .first();
    return row ? buildRecord(row) : null;
};
