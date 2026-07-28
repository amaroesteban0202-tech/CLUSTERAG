import assert from 'node:assert/strict';
import test from 'node:test';

import { buildCallJoinUrl, buildEmail } from './notifications.js';

test('buildCallJoinUrl opens an in-app call with encoded identifiers', () => {
    const result = buildCallJoinUrl('https://clusterag.vercel.app/', {
        roomId: 'Cluster Cliente 123',
        clientId: 'client/42',
        messageId: 'message?7'
    });
    const url = new URL(result);

    assert.equal(url.origin, 'https://clusterag.vercel.app');
    assert.equal(url.searchParams.get('callRoom'), 'Cluster Cliente 123');
    assert.equal(url.searchParams.get('callClient'), 'client/42');
    assert.equal(url.searchParams.get('callMessage'), 'message?7');
});

test('buildCallJoinUrl rejects incomplete and non-web destinations', () => {
    assert.equal(buildCallJoinUrl('https://clusterag.vercel.app', {
        roomId: 'room-only'
    }), '');
    assert.equal(buildCallJoinUrl('javascript:alert(1)', {
        roomId: 'room',
        clientId: 'client'
    }), '');
});

test('call invitation email uses the ClusterAG deep link', () => {
    const callUrl = buildCallJoinUrl('https://clusterag.vercel.app', {
        roomId: 'room-1',
        clientId: 'client-1',
        messageId: 'message-1'
    });
    const { html } = buildEmail({
        type: 'call_invite',
        senderName: 'Maycoll',
        clientName: 'Cauchos',
        appUrl: 'https://clusterag.vercel.app',
        callUrl
    });

    assert.match(html, /Unirse a la llamada/);
    assert.match(html, /https:\/\/clusterag\.vercel\.app\/\?callRoom=room-1&amp;callClient=client-1&amp;callMessage=message-1/);
    assert.doesNotMatch(html, /meet\.jit\.si/);
});
