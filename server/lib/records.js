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

    const sortColumn = SORT_COLUMN_BY_FIELD[sortBy];
    if (sortColumn) {
        query.orderBy(sortColumn, sortDirection === 'desc' ? 'desc' : 'asc');
        if (limitCount) query.limit(limitCount);
        return (await query).map(buildRecord);
    }

    const rows = await query;
    let records = rows.map(buildRecord);
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

    return { id: recordId, ...nextPayload };
};

export const deleteRecord = async ({ collectionName, recordId, trx }) => {
    await getClient(trx)('app_records')
        .where({ collection_name: collectionName, record_id: recordId })
        .delete();
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
