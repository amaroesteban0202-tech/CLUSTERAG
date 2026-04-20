import { db } from '../db/knex.js';
import { createRecordId } from './crypto.js';
import { nowIso } from './time.js';
import { normalizeEmail } from './text.js';

const stripUndefined = (value) => JSON.parse(JSON.stringify(value));

const safeParseJson = (value) => {
    try {
        return JSON.parse(value);
    } catch (error) {
        return {};
    }
};

const compareValues = (left, right, direction = 'asc') => {
    const leftValue = left ?? '';
    const rightValue = right ?? '';
    if (leftValue === rightValue) return 0;
    const baseResult = leftValue > rightValue ? 1 : -1;
    return direction === 'desc' ? baseResult * -1 : baseResult;
};

const buildIndexes = (payload) => {
    const normalizedEmail = normalizeEmail(payload?.email);
    return {
        email_index: normalizedEmail || null,
        role_index: typeof payload?.role === 'string' ? payload.role : null,
        is_active_index: typeof payload?.isActive === 'boolean' ? payload.isActive : null,
        auth_uid_index: typeof payload?.authUid === 'string' ? payload.authUid : null,
        management_key_index: typeof payload?.managementKey === 'string' ? payload.managementKey : null
    };
};

const parseRow = (row) => {
    if (!row) return null;
    return {
        id: row.record_id,
        ...safeParseJson(row.payload_json)
    };
};

const toRow = (collectionName, recordId, payload) => {
    const cleanPayload = stripUndefined(payload);
    return {
        collection_name: collectionName,
        record_id: recordId,
        payload_json: JSON.stringify(cleanPayload),
        created_at: cleanPayload.createdAt || nowIso(),
        updated_at: cleanPayload.updatedAt || nowIso(),
        ...buildIndexes(cleanPayload)
    };
};

export const getRecord = async ({ collectionName, recordId, trx = db }) => {
    const row = await trx('app_records')
        .where({ collection_name: collectionName, record_id: recordId })
        .first();

    return parseRow(row);
};

export const listRecords = async ({ collectionName, sortBy = 'updatedAt', sortDirection = 'asc', limitCount, trx = db }) => {
    let query = trx('app_records').where({ collection_name: collectionName });
    const canSortInSql = sortBy === 'createdAt' || sortBy === 'updatedAt';

    if (canSortInSql) {
        query = query.orderBy(sortBy === 'createdAt' ? 'created_at' : 'updated_at', sortDirection);
    }

    if (limitCount && canSortInSql) {
        query = query.limit(limitCount);
    }

    const rows = await query;
    let records = rows.map(parseRow);

    if (!canSortInSql) {
        records = records.sort((left, right) => compareValues(left?.[sortBy], right?.[sortBy], sortDirection));
        if (limitCount) records = records.slice(0, limitCount);
    }

    return records;
};

export const createRecord = async ({ collectionName, payload, recordId = createRecordId(), trx = db }) => {
    const stamp = nowIso();
    const nextPayload = {
        ...payload,
        createdAt: payload?.createdAt || stamp,
        updatedAt: payload?.updatedAt || stamp
    };

    await trx('app_records').insert(toRow(collectionName, recordId, nextPayload));
    return { id: recordId, ...nextPayload };
};

export const upsertRecord = async ({ collectionName, recordId = createRecordId(), payload, merge = true, trx = db }) => {
    const existing = await getRecord({ collectionName, recordId, trx });
    if (!existing) {
        return createRecord({ collectionName, payload, recordId, trx });
    }

    const stamp = nowIso();
    const nextPayload = merge
        ? {
            ...existing,
            ...payload,
            createdAt: existing.createdAt || payload?.createdAt || stamp,
            updatedAt: payload?.updatedAt || stamp
        }
        : {
            ...payload,
            createdAt: payload?.createdAt || existing.createdAt || stamp,
            updatedAt: payload?.updatedAt || stamp
        };

    await trx('app_records')
        .where({ collection_name: collectionName, record_id: recordId })
        .update(toRow(collectionName, recordId, nextPayload));

    return { id: recordId, ...nextPayload };
};

export const deleteRecord = async ({ collectionName, recordId, trx = db }) => {
    await trx('app_records')
        .where({ collection_name: collectionName, record_id: recordId })
        .delete();
};

export const findFirstRecordByEmail = async ({ collectionName, email, trx = db }) => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return null;

    const row = await trx('app_records')
        .where({
            collection_name: collectionName,
            email_index: normalizedEmail
        })
        .first();

    return parseRow(row);
};

export const findFirstRecordByAuthUid = async ({ collectionName, authUid, trx = db }) => {
    if (!authUid) return null;

    const row = await trx('app_records')
        .where({
            collection_name: collectionName,
            auth_uid_index: authUid
        })
        .first();

    return parseRow(row);
};
