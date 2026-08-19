import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareManagementTaskPayload } from './management-tasks.js';

test('assignedBy is set on create', () => {
    const payload = prepareManagementTaskPayload({
        payload: {
            title: 'Seguimiento',
            date: '2026-08-13',
            time: '18:00',
            contextId: 'user-2'
        },
        actor: { id: 'user-1', name: 'Luis', email: 'luis@example.com' },
        isCreate: true
    });
    assert.equal(payload.assignedByUserId, 'user-1');
    assert.equal(payload.assignedByName, 'Luis');
    assert.equal(payload.assignedByEmail, 'luis@example.com');
});

test('status update does not rewrite assignedBy', () => {
    const payload = prepareManagementTaskPayload({
        payload: { status: 'cerrado' },
        existing: {
            title: 'Seguimiento',
            date: '2026-08-13',
            time: '18:00',
            contextId: 'user-2',
            status: 'abierto',
            assignedByUserId: 'user-1',
            assignedByName: 'Luis',
            assignedByEmail: 'luis@example.com'
        },
        actor: { id: 'user-2', name: 'Ana', email: 'ana@example.com' },
        isCreate: false
    });
    assert.equal(payload.assignedByUserId, 'user-1');
    assert.equal(payload.assignedByName, 'Luis');
    assert.equal(payload.assignedByEmail, 'luis@example.com');
});

test('missing assignedBy is not filled by status actor', () => {
    const payload = prepareManagementTaskPayload({
        payload: { status: 'en_progreso' },
        existing: {
            title: 'Seguimiento',
            date: '2026-08-13',
            time: '18:00',
            contextId: 'user-2',
            status: 'abierto'
        },
        actor: { id: 'user-2', name: 'Ana', email: 'ana@example.com' },
        isCreate: false
    });
    assert.equal(payload.assignedByUserId, '');
    assert.equal(payload.assignedByName, '');
    assert.equal(payload.assignedByEmail, '');
});

test('reassignment updates assignedBy to current actor', () => {
    const payload = prepareManagementTaskPayload({
        payload: { contextId: 'user-3' },
        existing: {
            title: 'Seguimiento',
            date: '2026-08-13',
            time: '18:00',
            contextId: 'user-2',
            assignedByUserId: 'user-1',
            assignedByName: 'Luis',
            assignedByEmail: 'luis@example.com'
        },
        actor: { id: 'user-9', name: 'Ops', email: 'ops@example.com' },
        isCreate: false
    });
    assert.equal(payload.assignedByUserId, 'user-9');
    assert.equal(payload.assignedByName, 'Ops');
    assert.equal(payload.assignedByEmail, 'ops@example.com');
    assert.equal(payload.reminder8hSentAt, null);
    assert.equal(payload.overdueSentAt, null);
});
