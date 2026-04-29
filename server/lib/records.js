import { createRecordId } from './crypto.js';
import { nowIso } from './time.js';
import { normalizeEmail } from './text.js';

const DEFAULT_APP_ID = 'cluster-agency-pro-mobile-v6';
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1';

let resolvedAppIdPromise = null;

const stripUndefined = (value) => JSON.parse(JSON.stringify(value));

const compareValues = (left, right, direction = 'asc') => {
    const leftValue = left ?? '';
    const rightValue = right ?? '';
    if (leftValue === rightValue) return 0;
    const baseResult = leftValue > rightValue ? 1 : -1;
    return direction === 'desc' ? baseResult * -1 : baseResult;
};

const getConfiguredAppIds = () => {
    const appIds = [process.env.APP_ID || '', DEFAULT_APP_ID].filter(Boolean);
    return [...new Set(appIds)];
};

const buildCollectionPath = (appId, collectionName) => `artifacts/${appId}/public/data/${collectionName}`;

const buildDocumentUrl = (path) => `${FIRESTORE_BASE}/projects/cluster-41f73/databases/(default)/documents/${path}`;

const decodeFirestoreValue = (value = {}) => {
    if ('nullValue' in value) return null;
    if ('stringValue' in value) return value.stringValue;
    if ('booleanValue' in value) return value.booleanValue;
    if ('integerValue' in value) return Number(value.integerValue);
    if ('doubleValue' in value) return Number(value.doubleValue);
    if ('timestampValue' in value) return value.timestampValue;
    if ('mapValue' in value) return decodeFirestoreFields(value.mapValue.fields || {});
    if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeFirestoreValue);
    return null;
};

const decodeFirestoreFields = (fields = {}) => Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, decodeFirestoreValue(value)])
);

const encodeFirestoreValue = (value) => {
    if (value === null) return { nullValue: null };
    if (Array.isArray(value)) {
        return { arrayValue: { values: value.map((item) => encodeFirestoreValue(item)) } };
    }
    if (typeof value === 'boolean') return { booleanValue: value };
    if (typeof value === 'number') {
        return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
    }
    if (typeof value === 'object') return { mapValue: { fields: encodeFirestoreFields(value) } };
    return { stringValue: String(value ?? '') };
};

const encodeFirestoreFields = (payload = {}) => Object.fromEntries(
    Object.entries(stripUndefined(payload)).map(([key, value]) => [key, encodeFirestoreValue(value)])
);

const parseDocument = (document = null) => {
    if (!document?.name) return null;
    return {
        id: String(document.name).split('/').pop(),
        ...decodeFirestoreFields(document.fields || {})
    };
};

const apiFetch = async (url, options = {}) => {
    const response = await fetch(url, {
        headers: {
            'content-type': 'application/json',
            ...(options.headers || {})
        },
        ...options
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
        const error = new Error(payload?.error?.message || `Firestore request failed with status ${response.status}`);
        error.status = response.status;
        error.code = payload?.error?.status || '';
        throw error;
    }
    return payload;
};

const queryDocuments = async ({ appId, collectionName, pageSize = 500, pageToken = '' }) => {
    const params = new URLSearchParams({ pageSize: String(pageSize) });
    if (pageToken) params.set('pageToken', pageToken);
    return apiFetch(`${buildDocumentUrl(buildCollectionPath(appId, collectionName))}?${params.toString()}`, {
        headers: {}
    });
};

const listCollectionDocuments = async ({ appId, collectionName }) => {
    const documents = [];
    let pageToken = '';
    do {
        const payload = await queryDocuments({ appId, collectionName, pageToken });
        documents.push(...(payload.documents || []));
        pageToken = payload.nextPageToken || '';
    } while (pageToken);
    return documents;
};

const probeCollectionHasDocuments = async (appId, collectionName = 'users') => {
    try {
        const payload = await queryDocuments({ appId, collectionName, pageSize: 1 });
        return Array.isArray(payload.documents) && payload.documents.length > 0;
    } catch {
        return false;
    }
};

const scoreAppIdData = async (appId) => {
    const collections = ['clients', 'managers', 'account_tasks', 'editing', 'users'];
    const checks = await Promise.all(
        collections.map((collectionName) => probeCollectionHasDocuments(appId, collectionName))
    );
    return checks.reduce((score, hasDocuments, index) => {
        if (!hasDocuments) return score;
        return score + (collections[index] === 'users' ? 1 : 10);
    }, 0);
};

const resolveActiveAppId = async () => {
    if (!resolvedAppIdPromise) {
        resolvedAppIdPromise = (async () => {
            const candidates = getConfiguredAppIds();
            let bestCandidate = candidates[0] || DEFAULT_APP_ID;
            let bestScore = -1;

            for (const appId of candidates) {
                const score = await scoreAppIdData(appId);
                if (score > bestScore) {
                    bestCandidate = appId;
                    bestScore = score;
                }
            }

            return bestCandidate;
        })();
    }
    return resolvedAppIdPromise;
};

const getDocumentByPath = async (path) => {
    try {
        const payload = await apiFetch(buildDocumentUrl(path), { headers: {} });
        return parseDocument(payload);
    } catch (error) {
        if (error.status === 404) return null;
        throw error;
    }
};

const findFirstByField = async ({ collectionName, fieldName, value }) => {
    if (!value) return null;
    const records = await listRecords({ collectionName });
    return records.find((record) => {
        if (fieldName === 'email') return normalizeEmail(record.email) === normalizeEmail(value);
        return String(record?.[fieldName] || '') === String(value);
    }) || null;
};

export const getRecord = async ({ collectionName, recordId }) => {
    const appId = await resolveActiveAppId();
    return getDocumentByPath(`${buildCollectionPath(appId, collectionName)}/${recordId}`);
};

export const listRecords = async ({ collectionName, sortBy = 'updatedAt', sortDirection = 'asc', limitCount }) => {
    const appId = await resolveActiveAppId();
    const documents = await listCollectionDocuments({ appId, collectionName });
    let records = documents.map(parseDocument).filter(Boolean);
    records = records.sort((left, right) => compareValues(left?.[sortBy], right?.[sortBy], sortDirection));
    if (limitCount) records = records.slice(0, limitCount);
    return records;
};

export const createRecord = async ({ collectionName, payload, recordId = createRecordId() }) => {
    const appId = await resolveActiveAppId();
    const stamp = nowIso();
    const nextPayload = {
        ...payload,
        createdAt: payload?.createdAt || stamp,
        updatedAt: payload?.updatedAt || stamp
    };
    const url = `${buildDocumentUrl(buildCollectionPath(appId, collectionName))}?documentId=${encodeURIComponent(recordId)}`;
    await apiFetch(url, {
        method: 'POST',
        body: JSON.stringify({ fields: encodeFirestoreFields(nextPayload) })
    });
    return { id: recordId, ...nextPayload };
};

export const upsertRecord = async ({ collectionName, recordId = createRecordId(), payload, merge = true }) => {
    const appId = await resolveActiveAppId();
    const existing = await getRecord({ collectionName, recordId });
    if (!existing) return createRecord({ collectionName, payload, recordId });

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

    const updateMask = Object.keys(encodeFirestoreFields(nextPayload))
        .map((fieldName) => `updateMask.fieldPaths=${encodeURIComponent(fieldName)}`)
        .join('&');
    await apiFetch(`${buildDocumentUrl(`${buildCollectionPath(appId, collectionName)}/${recordId}`)}?${updateMask}`, {
        method: 'PATCH',
        body: JSON.stringify({ fields: encodeFirestoreFields(nextPayload) })
    });
    return { id: recordId, ...nextPayload };
};

export const deleteRecord = async ({ collectionName, recordId }) => {
    const appId = await resolveActiveAppId();
    await apiFetch(buildDocumentUrl(`${buildCollectionPath(appId, collectionName)}/${recordId}`), {
        method: 'DELETE',
        headers: {}
    }).catch((error) => {
        if (error.status === 404) return null;
        throw error;
    });
};

export const findFirstRecordByEmail = async ({ collectionName, email }) => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return null;
    return findFirstByField({ collectionName, fieldName: 'email', value: normalizedEmail });
};

export const findFirstRecordByAuthUid = async ({ collectionName, authUid }) => {
    if (!authUid) return null;
    return findFirstByField({ collectionName, fieldName: 'authUid', value: authUid });
};
