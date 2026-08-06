import test from 'node:test';
import assert from 'node:assert/strict';
import {
    summarizeRolePerformance,
    shouldSendDailyRoleReport,
    getDailyReportWindow
} from './daily-reports.js';

test('getDailyReportWindow at 6am covers previous 24h ending at cutoff', () => {
    const window = getDailyReportWindow(Date.parse('2026-08-07T06:00:00-06:00'));
    assert.equal(window.startMs, Date.parse('2026-08-06T06:00:00-06:00'));
    assert.equal(window.endMs, Date.parse('2026-08-07T06:00:00-06:00'));
    assert.equal(window.labelDayKey, '2026-08-06');
});

test('getDailyReportWindow before 6am uses the prior completed cutoff', () => {
    const window = getDailyReportWindow(Date.parse('2026-08-07T05:59:00-06:00'));
    assert.equal(window.startMs, Date.parse('2026-08-05T06:00:00-06:00'));
    assert.equal(window.endMs, Date.parse('2026-08-06T06:00:00-06:00'));
});

test('summarizeRolePerformance includes early-morning creations before 6am cutoff', () => {
    const people = [
        { id: 'editor-1', name: 'Ana', email: 'ana@example.com', userId: 'user-1' },
        { id: 'editor-2', name: 'Luis', email: 'luis@example.com', userId: 'user-2' }
    ];

    const tasks = [
        {
            id: 't1',
            contextId: 'editor-1',
            status: 'aprobado',
            date: '2026-08-06',
            createdAt: '2026-08-06T10:00:00-06:00',
            updatedAt: '2026-08-06T10:00:00-06:00'
        },
        {
            id: 't-madrugada',
            contextId: 'editor-1',
            status: 'pendiente',
            date: '2026-08-07',
            createdAt: '2026-08-07T02:00:00-06:00',
            updatedAt: '2026-08-07T02:00:00-06:00'
        },
        {
            id: 't-before-window',
            contextId: 'editor-2',
            status: 'pendiente',
            date: '2026-08-06',
            createdAt: '2026-08-06T05:59:00-06:00',
            updatedAt: '2026-08-06T05:59:00-06:00'
        },
        {
            id: 't-at-end-excluded',
            contextId: 'editor-2',
            status: 'aprobado',
            date: '2026-08-07',
            createdAt: '2026-08-07T06:00:00-06:00',
            updatedAt: '2026-08-07T06:00:00-06:00'
        }
    ];

    const result = summarizeRolePerformance({
        people,
        tasks,
        collectionName: 'editing',
        closedStatuses: new Set(['aprobado', 'publicado']),
        now: Date.parse('2026-08-07T06:00:00-06:00')
    });

    assert.equal(result.people[0].created, 2);
    assert.equal(result.people[0].approved, 1);
    assert.equal(result.people[0].inProgress, 1);
    assert.equal(result.people[1].created, 0);
    assert.equal(result.totals.created, 2);
    assert.equal(result.window.labelDayKey, '2026-08-06');
});

test('summarizeRolePerformance ignores due date when createdAt is outside the window', () => {
    const people = [
        { id: 'editor-1', name: 'Ana', email: 'ana@example.com' }
    ];

    const tasks = [
        {
            id: 'due-in-period-created-before',
            contextId: 'editor-1',
            status: 'pendiente',
            date: '2026-08-06',
            createdAt: '2026-08-05T15:00:00-06:00'
        },
        {
            id: 'due-before-created-in-period',
            contextId: 'editor-1',
            status: 'aprobado',
            date: '2026-08-05',
            createdAt: '2026-08-06T09:00:00-06:00'
        }
    ];

    const result = summarizeRolePerformance({
        people,
        tasks,
        collectionName: 'editing',
        closedStatuses: new Set(['aprobado', 'publicado']),
        now: Date.parse('2026-08-07T06:00:00-06:00')
    });

    assert.equal(result.people[0].created, 1);
    assert.equal(result.people[0].approved, 1);
    assert.equal(result.people[0].inProgress, 0);
    assert.equal(result.totals.created, 1);
});

test('shouldSendDailyRoleReport skips Sundays', () => {
    assert.equal(shouldSendDailyRoleReport(new Date('2026-08-09T06:00:00-06:00')), false);
    assert.equal(shouldSendDailyRoleReport(new Date('2026-08-07T06:00:00-06:00')), true);
});

test('summarizeRolePerformance merges person.id and person.userId tasks without duplicates', () => {
    const people = [
        { id: 'manager-1', userId: 'user-1', name: 'Maria' }
    ];

    const tasks = [
        {
            id: 'a1',
            contextId: 'manager-1',
            date: '2026-08-06',
            createdAt: '2026-08-06T10:00:00-06:00',
            status: 'publicado'
        },
        {
            id: 'a2',
            assigneeUserId: 'user-1',
            date: '2026-08-06',
            createdAt: '2026-08-06T11:00:00-06:00',
            status: 'aprobado_internamente'
        },
        {
            id: 'a2',
            contextId: 'manager-1',
            assigneeUserId: 'user-1',
            date: '2026-08-06',
            createdAt: '2026-08-06T11:00:00-06:00',
            status: 'aprobado_internamente'
        }
    ];

    const result = summarizeRolePerformance({
        people,
        tasks,
        collectionName: 'account_tasks',
        closedStatuses: new Set(['aprobado_internamente', 'publicado']),
        now: Date.parse('2026-08-07T06:00:00-06:00')
    });

    assert.equal(result.people[0].created, 2);
    assert.equal(result.people[0].approved, 2);
    assert.equal(result.people[0].inProgress, 0);
});

test('summarizeRolePerformance keeps people without tasks with zero values', () => {
    const people = [
        { id: 'editor-1', name: 'Ana' },
        { id: 'editor-2', name: 'Andres' }
    ];

    const tasks = [
        {
            id: 't1',
            contextId: 'editor-1',
            status: 'publicado',
            date: '2026-08-06',
            createdAt: '2026-08-06T12:00:00-06:00'
        }
    ];

    const result = summarizeRolePerformance({
        people,
        tasks,
        collectionName: 'editing',
        closedStatuses: new Set(['aprobado', 'publicado']),
        now: Date.parse('2026-08-07T06:00:00-06:00')
    });

    const andres = result.people.find((person) => person.id === 'editor-2');
    assert.ok(andres);
    assert.equal(andres.created, 0);
    assert.equal(andres.approved, 0);
    assert.equal(andres.inProgress, 0);
});

test('summarizeRolePerformance excludes tasks without createdAt', () => {
    const people = [
        { id: 'editor-1', name: 'Ana' }
    ];

    const tasks = [
        {
            id: 't1',
            contextId: 'editor-1',
            status: 'aprobado',
            date: '2026-08-06'
        }
    ];

    const result = summarizeRolePerformance({
        people,
        tasks,
        collectionName: 'editing',
        closedStatuses: new Set(['aprobado', 'publicado']),
        now: Date.parse('2026-08-07T06:00:00-06:00')
    });

    assert.equal(result.people[0].created, 0);
    assert.equal(result.totals.created, 0);
});
