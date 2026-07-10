import assert from 'node:assert/strict';
import { _pollingInternals } from '../src/app/lib/firebase-firestore-compat.js';

const { isPollingAllowed, mergeEntryChanges } = _pollingInternals;

assert.equal(isPollingAllowed({ visibilityState: 'visible', lastActivity: 0, now: 100, idleAfter: 200 }), true);
assert.equal(isPollingAllowed({ visibilityState: 'hidden', lastActivity: 0, now: 100, idleAfter: 200 }), false);
assert.equal(isPollingAllowed({ visibilityState: 'visible', lastActivity: 0, now: 200, idleAfter: 200 }), false);

const auditRef = {
    __kind: 'query',
    baseRef: { __kind: 'collection', segments: ['audit_logs'] },
    constraints: [
        { type: 'orderBy', field: 'createdAt', direction: 'desc' },
        { type: 'limit', count: 2 }
    ]
};
const auditEntry = {
    ref: auditRef,
    records: [
        { id: 'a', createdAt: '2026-01-01' },
        { id: 'b', createdAt: '2026-01-02' }
    ]
};
assert.deepEqual(
    mergeEntryChanges(auditEntry, [{
        collectionName: 'audit_logs',
        recordId: 'c',
        action: 'upsert',
        record: { id: 'c', createdAt: '2026-01-03' }
    }]).map((record) => record.id),
    ['c', 'b']
);

const taskEntry = {
    ref: { __kind: 'collection', segments: ['account_tasks'] },
    records: [{ id: 'old', date: '2020-01-01', status: 'por_disenar' }]
};
assert.deepEqual(
    mergeEntryChanges(taskEntry, [{
        collectionName: 'account_tasks',
        recordId: 'old',
        action: 'upsert',
        record: { id: 'old', date: '2020-01-01', status: 'publicado' }
    }]),
    []
);

console.log('Polling adaptativo: OK');
