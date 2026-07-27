import assert from 'node:assert/strict';
import test from 'node:test';
import { buildClientChatPush } from './push-notifications.js';

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

