import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildClientChatPush,
    buildTaskReminderPush,
    canReceiveClientChatPush,
    isChatMuteActive
} from './push-notifications.js';

test('buildClientChatPush creates a message notification', () => {
    const push = buildClientChatPush({
        clientName: 'ACOSTA CARPENTRY',
        message: {
            id: 'message-1',
            clientId: 'client-1',
            authorName: 'Daniela',
            text: 'Revisemos el contenido'
        }
    });

    assert.equal(push.title, 'Nuevo mensaje · ACOSTA CARPENTRY');
    assert.equal(push.body, 'Daniela: Revisemos el contenido');
    assert.equal(push.data.type, 'message');
    assert.equal(push.channelId, 'cluster-messages');
});

test('buildClientChatPush creates a high-priority call notification', () => {
    const push = buildClientChatPush({
        clientName: 'WILL AND CO. PAINTING',
        message: {
            id: 'call-1',
            clientId: 'client-2',
            authorName: 'Isabel',
            call: { roomId: 'cluster-call-room' }
        }
    });

    assert.equal(push.title, 'Llamada entrante · WILL AND CO. PAINTING');
    assert.equal(push.body, 'Isabel te está llamando');
    assert.equal(push.data.type, 'call');
    assert.equal(push.data.roomId, 'cluster-call-room');
    assert.equal(push.channelId, 'cluster-calls');
    assert.equal(push.isCall, true);
});

test('buildClientChatPush highlights a direct mention', () => {
    const push = buildClientChatPush({
        clientName: 'ACOSTA CARPENTRY',
        mentioned: true,
        message: {
            id: 'message-2',
            clientId: 'client-1',
            authorName: 'Daniela',
            text: '@Mayco revisemos el contenido'
        }
    });

    assert.equal(push.title, 'Daniela te mencionó · ACOSTA CARPENTRY');
    assert.equal(push.data.type, 'mention');
});

test('isChatMuteActive supports timed and permanent chat mutes', () => {
    const now = Date.parse('2026-07-27T12:00:00.000Z');

    assert.equal(isChatMuteActive({ mutedUntil: 'forever' }, now), true);
    assert.equal(
        isChatMuteActive({ mutedUntil: '2026-07-27T13:00:00.000Z' }, now),
        true
    );
    assert.equal(
        isChatMuteActive({ mutedUntil: '2026-07-27T11:00:00.000Z' }, now),
        false
    );
});

test('una llamada puede llegar a supervisores aunque no pertenezcan al grupo', () => {
    const base = {
        authorId: 'author-user',
        memberIds: new Set(['member-user']),
        mentionedIds: new Set(['admin-user']),
        outsideGroupCallRecipientIds: new Set(['admin-user']),
        isCall: true
    };

    assert.equal(canReceiveClientChatPush({
        ...base,
        recipientId: 'admin-user'
    }), true);
    assert.equal(canReceiveClientChatPush({
        ...base,
        recipientId: 'other-user'
    }), false);
    assert.equal(canReceiveClientChatPush({
        ...base,
        recipientId: 'admin-user',
        mentionedIds: new Set()
    }), false);
});

test('buildTaskReminderPush overdue assignee', () => {
    const push = buildTaskReminderPush({
        variant: 'overdue',
        taskTitle: 'Entrega semanal',
        taskTypeLabel: 'tarea de account',
        recipientRole: 'assignee',
        clientName: 'ACOSTA',
        taskId: 'task-1',
        collectionName: 'account_tasks'
    });

    assert.equal(push.title, 'Tarea vencida');
    assert.equal(push.body, 'tarea de account: Entrega semanal · ACOSTA');
    assert.equal(push.data.type, 'task-reminder');
    assert.equal(push.data.variant, 'overdue');
    assert.equal(push.data.taskId, 'task-1');
    assert.equal(push.data.collectionName, 'account_tasks');
    assert.equal(push.data.recipientRole, 'assignee');
    assert.equal(push.channelId, 'cluster-messages');
});

test('buildTaskReminderPush overdue assigner', () => {
    const push = buildTaskReminderPush({
        variant: 'overdue',
        taskTitle: 'Entrega semanal',
        taskTypeLabel: 'tarea de account',
        recipientRole: 'assigner',
        taskId: 'task-2',
        collectionName: 'account_tasks'
    });

    assert.equal(push.title, 'Tarea que asignaste vencida');
    assert.equal(push.body, 'tarea de account: Entrega semanal');
    assert.equal(push.data.recipientRole, 'assigner');
});

test('buildTaskReminderPush upcoming', () => {
    const push = buildTaskReminderPush({
        variant: 'upcoming',
        label: '8 horas',
        taskTitle: 'Revisar brief',
        taskTypeLabel: 'tarea de gestion',
        recipientRole: 'assignee',
        taskId: 'task-3',
        collectionName: 'management_tasks'
    });

    assert.equal(push.title, 'Tarea proxima a vencer (8 horas)');
    assert.equal(push.body, 'tarea de gestion: Revisar brief');
    assert.equal(push.data.variant, 'upcoming');
});

test('buildTaskReminderPush nag', () => {
    const push = buildTaskReminderPush({
        variant: 'overdue-nag',
        overdueHours: 26,
        taskTitle: 'Corte final',
        taskTypeLabel: 'tarea de edicion',
        recipientRole: 'assignee',
        clientName: 'WILL AND CO.',
        taskId: 'task-4',
        collectionName: 'editing'
    });

    assert.equal(push.title, 'Tarea vencida hace 26h');
    assert.equal(push.body, 'tarea de edicion: Corte final · WILL AND CO.');
    assert.equal(push.data.variant, 'overdue-nag');
    assert.equal(push.data.overdueHours, '26');
});
