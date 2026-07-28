import assert from 'node:assert/strict';
import test from 'node:test';

import {
    getCallRoomAlias,
    getConsumedCallLinkUrl,
    resolveCallLink
} from '../../src/app/lib/call-links.js';

const activeMessage = {
    id: 'message-1',
    clientId: 'client-1',
    call: { roomId: 'cluster-cauchos-h9eniw' }
};

test('resolveCallLink accepts the query-based email invitation', () => {
    assert.deepEqual(
        resolveCallLink(
            'https://clusterag.vercel.app/?callRoom=room-1&callClient=client-1&callMessage=message-1'
        ),
        {
            roomId: 'room-1',
            clientId: 'client-1',
            messageId: 'message-1',
            fromPath: false
        }
    );
});

test('resolveCallLink maps legacy and branded JaaS paths to a chat call', () => {
    const legacy = resolveCallLink(
        'https://clusterag.vercel.app/vpaas-magic-cookie-app/cluster-cauchos-h9eniw',
        [activeMessage]
    );
    const branded = resolveCallLink(
        'https://clusterag.vercel.app/cluster-cauchos-h9eniw',
        [activeMessage]
    );

    assert.deepEqual(legacy, {
        roomId: 'cluster-cauchos-h9eniw',
        clientId: 'client-1',
        messageId: 'message-1',
        fromPath: true
    });
    assert.deepEqual(branded, legacy);
});

test('resolveCallLink does not reopen a room that was ended', () => {
    assert.equal(
        resolveCallLink(
            'https://clusterag.vercel.app/cluster-cauchos-h9eniw',
            [
                activeMessage,
                {
                    id: 'ended-message',
                    clientId: 'client-1',
                    call: { roomId: 'cluster-cauchos-h9eniw', ended: true }
                }
            ]
        ),
        null
    );
});

test('call link helpers sanitize aliases and clean consumed URLs', () => {
    assert.equal(getCallRoomAlias('app-id/room with spaces'), 'room-with-spaces');
    assert.equal(
        getConsumedCallLinkUrl(
            'https://clusterag.vercel.app/cluster-cauchos-h9eniw?callRoom=room&callClient=client',
            true
        ),
        'https://clusterag.vercel.app/'
    );
});
