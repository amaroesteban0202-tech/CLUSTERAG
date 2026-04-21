import { db } from '../db/knex.js';
import { env } from '../config/env.js';
import { normalizeEmail } from './text.js';

const COLLECTIONS_TO_HYDRATE = [
    'users',
    'clients',
    'managers',
    'editors',
    'editing',
    'account_tasks',
    'management_tasks',
    'events'
];

let hydrationPromise = null;

const getLegacyBaseUrl = () => (
    `https://firestore.googleapis.com/v1/projects/${env.legacyFirestore.projectId}/databases/(default)/documents/artifacts/${env.legacyFirestore.appId}/public/data`
);

const getCollectionCounts = async () => {
    const rows = await db('app_records')
        .select('collection_name')
        .count({ count: '*' })
        .whereIn('collection_name', COLLECTIONS_TO_HYDRATE)
        .groupBy('collection_name');

    return rows.reduce((accumulator, row) => ({
        ...accumulator,
        [row.collection_name]: Number(row.count || 0)
    }), {});
};

const shouldHydrateLegacyData = (counts = {}) => {
    const users = Number(counts.users || 0);
    const clients = Number(counts.clients || 0);
    const managers = Number(counts.managers || 0);
    const editors = Number(counts.editors || 0);
    const accountTasks = Number(counts.account_tasks || 0);
    const editingTasks = Number(counts.editing || 0);
    const events = Number(counts.events || 0);

    return users <= 5 &&
        clients === 0 &&
        managers === 0 &&
        editors === 0 &&
        accountTasks === 0 &&
        editingTasks === 0 &&
        events === 0;
};

const getDocumentId = (documentName = '') => String(documentName || '').split('/').pop();

const buildIndexes = (payload = {}) => ({
    email_index: normalizeEmail(payload.email) || null,
    role_index: typeof payload.role === 'string' ? payload.role : null,
    is_active_index: typeof payload.isActive === 'boolean' ? payload.isActive : null,
    auth_uid_index: typeof payload.authUid === 'string' ? payload.authUid : null,
    management_key_index: typeof payload.managementKey === 'string' ? payload.managementKey : null
});

const toRow = (collectionName, recordId, payload = {}) => ({
    collection_name: collectionName,
    record_id: recordId,
    payload_json: JSON.stringify(payload),
    created_at: payload.createdAt || payload.updatedAt || new Date().toISOString(),
    updated_at: payload.updatedAt || payload.createdAt || new Date().toISOString(),
    ...buildIndexes(payload)
});

const fromFirestoreValue = (value = {}) => {
    if (Object.prototype.hasOwnProperty.call(value, 'nullValue')) return null;
    if (Object.prototype.hasOwnProperty.call(value, 'stringValue')) return value.stringValue;
    if (Object.prototype.hasOwnProperty.call(value, 'booleanValue')) return value.booleanValue === true;
    if (Object.prototype.hasOwnProperty.call(value, 'integerValue')) return Number(value.integerValue);
    if (Object.prototype.hasOwnProperty.call(value, 'doubleValue')) return Number(value.doubleValue);
    if (Object.prototype.hasOwnProperty.call(value, 'timestampValue')) return value.timestampValue;
    if (Object.prototype.hasOwnProperty.call(value, 'bytesValue')) return value.bytesValue;
    if (Object.prototype.hasOwnProperty.call(value, 'referenceValue')) return value.referenceValue;
    if (Object.prototype.hasOwnProperty.call(value, 'geoPointValue')) return value.geoPointValue;
    if (Object.prototype.hasOwnProperty.call(value, 'arrayValue')) {
        const items = Array.isArray(value.arrayValue?.values) ? value.arrayValue.values : [];
        return items.map((item) => fromFirestoreValue(item));
    }
    if (Object.prototype.hasOwnProperty.call(value, 'mapValue')) {
        const fields = value.mapValue?.fields || {};
        return Object.fromEntries(
            Object.entries(fields).map(([key, nestedValue]) => [key, fromFirestoreValue(nestedValue)])
        );
    }
    return null;
};

const fromFirestoreDocument = (document = {}) => {
    const fields = document.fields || {};
    return {
        id: getDocumentId(document.name),
        ...Object.fromEntries(
            Object.entries(fields).map(([key, value]) => [key, fromFirestoreValue(value)])
        )
    };
};

const fetchCollectionDocuments = async (collectionName) => {
    const documents = [];
    let pageToken = '';
    let page = 0;

    do {
        const url = new URL(`${getLegacyBaseUrl()}/${collectionName}`);
        url.searchParams.set('pageSize', '200');
        if (pageToken) url.searchParams.set('pageToken', pageToken);

        const response = await fetch(url);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(`Firestore legacy devolvio ${response.status} al leer ${collectionName}: ${JSON.stringify(payload)}`);
        }

        if (Array.isArray(payload.documents)) {
            documents.push(...payload.documents.map(fromFirestoreDocument));
        }

        pageToken = payload.nextPageToken || '';
        page += 1;
    } while (pageToken && page < 1000);

    return documents;
};

export const hydrateLegacyFirestoreData = async ({ force = false } = {}) => {
    if (!env.legacyFirestore.enabled) {
        return { skipped: true, reason: 'disabled' };
    }

    if (hydrationPromise) return hydrationPromise;

    hydrationPromise = (async () => {
        const counts = await getCollectionCounts();
        if (!force && !shouldHydrateLegacyData(counts)) {
            return { skipped: true, reason: 'already-populated', counts };
        }

        const importedCounts = {};
        for (const collectionName of COLLECTIONS_TO_HYDRATE) {
            const records = await fetchCollectionDocuments(collectionName);
            importedCounts[collectionName] = records.length;

            const rows = records
                .filter((record) => record?.id)
                .map(({ id, ...payload }) => toRow(collectionName, id, payload));
            if (rows.length === 0) continue;

            await db('app_records')
                .insert(rows)
                .onConflict(['collection_name', 'record_id'])
                .merge();
        }

        return {
            skipped: false,
            sourceAppId: env.legacyFirestore.appId,
            importedCounts
        };
    })();

    try {
        return await hydrationPromise;
    } finally {
        hydrationPromise = null;
    }
};
