import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildReminderRecipients,
    resolveAssigner,
    resolveAssignee
} from './management-notifications.js';
import { buildManagementTaskEmail } from './email.js';

const mapRecords = (entries) => new Map(entries.map((record) => [String(record.id), record]));

test('buildReminderRecipients includes assignee and assigner', () => {
    const recipients = buildReminderRecipients({
        assignee: { id: 'u1', name: 'Ana', email: 'ana@example.com' },
        assigner: { id: 'u2', name: 'Luis', email: 'luis@example.com' }
    });
    assert.deepEqual(recipients, [
        { email: 'ana@example.com', name: 'Ana', role: 'assignee' },
        { email: 'luis@example.com', name: 'Luis', role: 'assigner' }
    ]);
});

test('buildReminderRecipients skips duplicate emails', () => {
    const recipients = buildReminderRecipients({
        assignee: { id: 'u1', name: 'Ana', email: 'Ana@Example.com' },
        assigner: { id: 'u1', name: 'Ana', email: 'ana@example.com' }
    });
    assert.deepEqual(recipients, [
        { email: 'ana@example.com', name: 'Ana', role: 'assignee' }
    ]);
});

test('buildReminderRecipients keeps assigner when assignee has no email', () => {
    const recipients = buildReminderRecipients({
        assignee: null,
        assigner: { id: 'u2', name: 'Luis', email: 'luis@example.com' }
    });
    assert.deepEqual(recipients, [
        { email: 'luis@example.com', name: 'Luis', role: 'assigner' }
    ]);
});

test('resolveAssigner uses assignedByUserId then assignedByEmail', () => {
    const recordsByCollection = {
        users: mapRecords([
            { id: 'user-1', name: 'Luis', email: 'luis@example.com' }
        ]),
        managers: mapRecords([]),
        editors: mapRecords([])
    };
    assert.deepEqual(
        resolveAssigner({ assignedByUserId: 'user-1' }, recordsByCollection),
        { id: 'user-1', name: 'Luis', email: 'luis@example.com' }
    );
    assert.deepEqual(
        resolveAssigner({
            assignedByEmail: 'luis@example.com',
            assignedByName: 'Luis'
        }, recordsByCollection),
        { id: 'user-1', name: 'Luis', email: 'luis@example.com' }
    );
    assert.deepEqual(
        resolveAssigner({
            assignedByEmail: 'ghost@example.com',
            assignedByName: 'Ghost'
        }, recordsByCollection),
        { id: '', name: 'Ghost', email: 'ghost@example.com' }
    );
});

test('resolveAssignee still prefers assigneeUserId', () => {
    const config = { contextCollection: 'managers' };
    const recordsByCollection = {
        users: mapRecords([
            { id: 'user-9', name: 'Ana', email: 'ana@example.com' }
        ]),
        managers: mapRecords([
            { id: 'mgr-1', name: 'Other', email: 'other@example.com' }
        ]),
        editors: mapRecords([])
    };
    assert.deepEqual(
        resolveAssignee({
            assigneeUserId: 'user-9',
            contextId: 'mgr-1'
        }, config, recordsByCollection),
        { id: 'user-9', name: 'Ana', email: 'ana@example.com' }
    );
});

test('buildManagementTaskEmail uses assigner copy', () => {
    const email = buildManagementTaskEmail({
        variant: 'overdue',
        recipientRole: 'assigner',
        recipientName: 'Luis',
        assigneeName: 'Ana',
        assignedByName: 'Luis',
        taskTitle: 'Entrega semanal',
        taskTypeLabel: 'tarea de account',
        roomLabel: 'Cluster OS - Sala de Account',
        doneLabel: 'Publicado',
        dueHuman: 'viernes'
    });
    assert.match(email.subject, /Tarea que asignaste VENCIDA/);
    assert.match(email.html, /que asignaste/);
    assert.match(email.html, /Ana/);
});
