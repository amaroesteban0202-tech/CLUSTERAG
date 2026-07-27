import assert from 'node:assert/strict';
import test from 'node:test';
import { buildClientChatPush, isChatMuteActive } from './push-notifications.js';

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
