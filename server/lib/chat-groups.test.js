import test from 'node:test';
import assert from 'node:assert/strict';
import { buildChatGroups, getChatGroupChangeError } from './chat-groups.js';

const people = [
    { id: 'manager-user', name: 'Manager Uno', email: 'manager@example.com', role: 'manager' },
    { id: 'author-user', name: 'Autora', email: 'author@example.com', role: 'editor' },
    { id: 'mentioned-user', name: 'Mencionado', email: 'mentioned@example.com', role: 'viewer' },
    { id: 'irrelevant-user', name: 'No relevante', email: 'other@example.com', role: 'viewer' }
];

test('deriva integrantes del manager asignado, autores y menciones del historial', () => {
    const result = buildChatGroups({
        clients: [{ id: 'client-1', managerId: 'manager-record' }],
        users: people,
        managers: [{
            id: 'manager-record',
            name: 'Manager Uno',
            email: 'manager@example.com',
            userId: 'manager-user'
        }],
        messages: [{
            id: 'message-1',
            clientId: 'client-1',
            authorId: 'author-user',
            mentionedIds: ['mentioned-user']
        }]
    });

    const group = result.groups[0];
    assert.equal(group.source, 'history');
    assert.deepEqual(new Set(group.memberIds), new Set([
        'manager-user',
        'author-user',
        'mentioned-user'
    ]));
    assert.equal(group.memberIds.includes('irrelevant-user'), false);
});

test('una lista administrada reemplaza la inferencia del historial', () => {
    const result = buildChatGroups({
        clients: [{ id: 'client-1' }],
        users: people,
        messages: [{
            clientId: 'client-1',
            authorId: 'author-user',
            mentionedIds: ['mentioned-user']
        }],
        membershipRecords: [{
            id: 'client-1',
            clientId: 'client-1',
            memberIds: ['manager-user'],
            updatedAt: '2026-08-01T12:00:00.000Z'
        }]
    });

    assert.deepEqual(result.groups[0], {
        clientId: 'client-1',
        memberIds: ['manager-user'],
        source: 'managed',
        updatedAt: '2026-08-01T12:00:00.000Z'
    });
});

test('un manager puede quitar a otros pero no salir por si mismo', () => {
    assert.equal(getChatGroupChangeError({
        actorRole: 'manager',
        actorId: 'manager-user',
        currentMemberIds: ['manager-user', 'author-user'],
        nextMemberIds: ['manager-user']
    }), '');
    assert.equal(getChatGroupChangeError({
        actorRole: 'manager',
        actorId: 'manager-user',
        currentMemberIds: ['manager-user', 'author-user'],
        nextMemberIds: ['author-user']
    }), 'manager-cannot-leave');
});

test('solo el superadmin puede salir por si mismo', () => {
    assert.equal(getChatGroupChangeError({
        actorRole: 'super_admin',
        actorId: 'admin-user',
        currentMemberIds: ['admin-user', 'author-user'],
        nextMemberIds: ['author-user']
    }), '');
    assert.equal(getChatGroupChangeError({
        actorRole: 'operations',
        actorId: 'ops-user',
        currentMemberIds: ['ops-user'],
        nextMemberIds: []
    }), 'forbidden');
});
