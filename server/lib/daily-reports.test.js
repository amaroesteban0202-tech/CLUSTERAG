import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeRolePerformance } from './daily-reports.js';

test('summarizeRolePerformance calculates the requested metrics per person', () => {
    const people = [
        { id: 'editor-1', name: 'Ana', email: 'ana@example.com', userId: 'user-1' },
        { id: 'editor-2', name: 'Luis', email: 'luis@example.com', userId: 'user-2' }
    ];

    const tasks = [
        {
            id: 't1',
            contextId: 'editor-1',
            status: 'aprobado',
            date: '2026-07-24',
            time: '18:00',
            updatedAt: '2026-07-24T10:00:00Z'
        },
        {
            id: 't2',
            contextId: 'editor-1',
            status: 'pendiente',
            date: '2026-07-22',
            time: '18:00',
            updatedAt: '2026-07-22T09:30:00Z'
        },
        {
            id: 't3',
            contextId: 'editor-2',
            status: 'pendiente',
            date: '2026-07-20',
            time: '18:00',
            updatedAt: '2026-07-20T08:00:00Z'
        }
    ];

    const result = summarizeRolePerformance({
        people,
        tasks,
        collectionName: 'editing',
        closedStatuses: new Set(['aprobado', 'publicado']),
        now: Date.parse('2026-07-24T18:00:00-06:00')
    });

    assert.equal(result.people[0].name, 'Ana');
    assert.equal(result.people[0].assigned, 2);
    assert.equal(result.people[0].approved, 1);
    assert.equal(result.people[0].pending, 1);
    assert.equal(result.people[0].overdue, 1);
    assert.equal(result.people[1].assigned, 1);
    assert.equal(result.people[1].pending, 1);
    assert.equal(result.people[1].overdue, 1);
    assert.equal(result.totals.assigned, 3);
    assert.equal(result.totals.pending, 2);
});
