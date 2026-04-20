import { apiFetch } from './backend-api.js';

const registry = new Map();
const DEFAULT_POLL_MS = 4000;

const createDocSnapshot = (record) => ({
    id: record.id,
    data: () => ({ ...record })
});

const createQuerySnapshot = (records = []) => ({
    docs: records.map(createDocSnapshot),
    size: records.length
});

const getCollectionName = (ref) => {
    if (ref?.__kind === 'query') return getCollectionName(ref.baseRef);
    const segments = Array.isArray(ref?.segments) ? ref.segments : [];
    if (segments.length === 0) return '';
    return segments[ref.__kind === 'doc' ? segments.length - 2 : segments.length - 1] || '';
};

const getRecordId = (ref) => {
    const segments = Array.isArray(ref?.segments) ? ref.segments : [];
    return ref?.__kind === 'doc' ? segments[segments.length - 1] || '' : '';
};

const buildQueryOptions = (ref) => {
    const options = {
        orderBy: 'updatedAt',
        orderDir: 'asc',
        limit: null
    };

    if (ref?.__kind !== 'query') return options;

    ref.constraints.forEach((constraint) => {
        if (constraint?.type === 'orderBy') {
            options.orderBy = constraint.field;
            options.orderDir = constraint.direction || 'asc';
        }
        if (constraint?.type === 'limit') {
            options.limit = constraint.count;
        }
    });

    return options;
};

const buildRegistryKey = (ref) => {
    const collectionName = getCollectionName(ref);
    const options = buildQueryOptions(ref);
    return JSON.stringify({ collectionName, ...options });
};

const fetchRecords = async (ref) => {
    const collectionName = getCollectionName(ref);
    const options = buildQueryOptions(ref);
    const params = new URLSearchParams();
    if (options.orderBy) params.set('orderBy', options.orderBy);
    if (options.orderDir) params.set('orderDir', options.orderDir);
    if (options.limit) params.set('limit', String(options.limit));
    const payload = await apiFetch(`/api/collections/${collectionName}?${params.toString()}`);
    return Array.isArray(payload?.records) ? payload.records : [];
};

const notifyListeners = (entry) => {
    const snapshot = createQuerySnapshot(entry.records);
    entry.listeners.forEach((listener) => {
        try {
            listener.onNext(snapshot);
        } catch (error) {
            console.error('Error en listener local de coleccion:', error);
        }
    });
};

const startPolling = (key, ref) => {
    const entry = registry.get(key);
    if (!entry || entry.intervalId) return;

    const run = async () => {
        try {
            const records = await fetchRecords(ref);
            const signature = JSON.stringify(records);
            if (signature !== entry.signature) {
                entry.records = records;
                entry.signature = signature;
                notifyListeners(entry);
            }
        } catch (error) {
            if (error.status === 401 || error.status === 403) {
                if (entry.signature !== '[]') {
                    entry.records = [];
                    entry.signature = '[]';
                    notifyListeners(entry);
                }
                return;
            }
            entry.listeners.forEach((listener) => listener.onError?.(error));
        }
    };

    run();
    entry.intervalId = window.setInterval(run, Number(window.__cluster_poll_ms || DEFAULT_POLL_MS));
};

const stopPollingIfUnused = (key) => {
    const entry = registry.get(key);
    if (!entry || entry.listeners.size > 0) return;
    if (entry.intervalId) window.clearInterval(entry.intervalId);
    registry.delete(key);
};

const refreshCollection = async (collectionName) => {
    const keys = [...registry.keys()].filter((key) => key.includes(`"collectionName":"${collectionName}"`));
    await Promise.all(keys.map(async (key) => {
        const entry = registry.get(key);
        if (!entry) return;
        try {
            const records = await fetchRecords(entry.ref);
            entry.records = records;
            entry.signature = JSON.stringify(records);
            notifyListeners(entry);
        } catch (error) {
            entry.listeners.forEach((listener) => listener.onError?.(error));
        }
    }));
};

export const initializeFirestore = (app, options = {}) => ({ app, options });

export const connectFirestoreEmulator = () => {};

export const persistentLocalCache = (config = {}) => config;

export const persistentMultipleTabManager = () => ({});

export const collection = (_db, ...segments) => ({ __kind: 'collection', segments });

export const doc = (_db, ...segments) => ({ __kind: 'doc', segments });

export const query = (baseRef, ...constraints) => ({ __kind: 'query', baseRef, constraints });

export const orderBy = (field, direction = 'asc') => ({ type: 'orderBy', field, direction });

export const limit = (count) => ({ type: 'limit', count });

export const onSnapshot = (ref, onNext, onError) => {
    const key = buildRegistryKey(ref);
    if (!registry.has(key)) {
        registry.set(key, {
            ref,
            listeners: new Set(),
            records: [],
            signature: '',
            intervalId: null
        });
    }

    const entry = registry.get(key);
    const listener = { onNext, onError };
    entry.listeners.add(listener);
    startPolling(key, ref);

    if (entry.signature) {
        onNext(createQuerySnapshot(entry.records));
    }

    return () => {
        entry.listeners.delete(listener);
        stopPollingIfUnused(key);
    };
};

export const addDoc = async (collectionRef, data) => {
    const collectionName = getCollectionName(collectionRef);
    const payload = await apiFetch(`/api/collections/${collectionName}`, {
        method: 'POST',
        body: JSON.stringify({ data })
    });
    await refreshCollection(collectionName);
    return {
        id: payload.record.id,
        ...payload.record
    };
};

export const updateDoc = async (docRef, data) => {
    const collectionName = getCollectionName(docRef);
    const recordId = getRecordId(docRef);
    const payload = await apiFetch(`/api/collections/${collectionName}/${recordId}`, {
        method: 'PATCH',
        body: JSON.stringify({ data })
    });
    await refreshCollection(collectionName);
    return payload.record;
};

export const deleteDoc = async (docRef) => {
    const collectionName = getCollectionName(docRef);
    const recordId = getRecordId(docRef);
    await apiFetch(`/api/collections/${collectionName}/${recordId}`, {
        method: 'DELETE'
    });
    await refreshCollection(collectionName);
};

export const setDoc = async (docRef, data, options = {}) => {
    const collectionName = getCollectionName(docRef);
    const recordId = getRecordId(docRef);
    const payload = await apiFetch(`/api/collections/${collectionName}/${recordId}`, {
        method: 'PUT',
        body: JSON.stringify({
            data,
            merge: options.merge !== false
        })
    });
    await refreshCollection(collectionName);
    return payload.record;
};

export const getDocs = async (ref) => {
    const records = await fetchRecords(ref);
    return createQuerySnapshot(records);
};

export const writeBatch = () => {
    const ops = [];
    return {
        update(docRef, data) {
            ops.push({
                action: 'update',
                collectionName: getCollectionName(docRef),
                recordId: getRecordId(docRef),
                data
            });
            return this;
        },
        set(docRef, data, options = {}) {
            ops.push({
                action: 'set',
                collectionName: getCollectionName(docRef),
                recordId: getRecordId(docRef),
                data,
                merge: options.merge !== false
            });
            return this;
        },
        delete(docRef) {
            ops.push({
                action: 'delete',
                collectionName: getCollectionName(docRef),
                recordId: getRecordId(docRef)
            });
            return this;
        },
        async commit() {
            if (ops.length === 0) return;
            await apiFetch('/api/collections/_batch', {
                method: 'POST',
                body: JSON.stringify({ ops })
            });
            const collectionNames = [...new Set(ops.map((item) => item.collectionName))];
            await Promise.all(collectionNames.map((collectionName) => refreshCollection(collectionName)));
        }
    };
};
