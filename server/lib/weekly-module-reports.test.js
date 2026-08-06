import test from 'node:test';
import assert from 'node:assert/strict';
import {
    getWeeklyModuleReportWindow,
    shouldSendWeeklyModuleReport,
    isModuleItem,
    isReadyStatus,
    summarizeModuleWeek,
    mergeRosterPeople
} from './weekly-module-reports.js';

test('getWeeklyModuleReportWindow at Saturday noon covers Mon 6am to Sat noon', () => {
    const window = getWeeklyModuleReportWindow(Date.parse('2026-08-08T12:00:00-06:00'));
    assert.equal(window.startMs, Date.parse('2026-08-03T06:00:00-06:00'));
    assert.equal(window.endMs, Date.parse('2026-08-08T12:00:00-06:00'));
});

test('getWeeklyModuleReportWindow before Saturday noon uses previous week', () => {
    const window = getWeeklyModuleReportWindow(Date.parse('2026-08-07T10:00:00-06:00'));
    assert.equal(window.startMs, Date.parse('2026-07-27T06:00:00-06:00'));
    assert.equal(window.endMs, Date.parse('2026-08-01T12:00:00-06:00'));
});

test('shouldSendWeeklyModuleReport only on Saturdays', () => {
    assert.equal(shouldSendWeeklyModuleReport(new Date('2026-08-08T12:00:00-06:00')), true);
    assert.equal(shouldSendWeeklyModuleReport(new Date('2026-08-07T12:00:00-06:00')), false);
});

test('isModuleItem classifies by type and keywords', () => {
    assert.equal(isModuleItem({ type: 'podcast', title: 'Clip' }, 'podcast'), true);
    assert.equal(isModuleItem({ title: 'Episodio 12', notes: '' }, 'podcast'), true);
    assert.equal(isModuleItem({ type: 'production', title: 'Shoot' }, 'production'), true);
    assert.equal(isModuleItem({ title: 'Grabación cliente', notes: '' }, 'production'), true);
    assert.equal(isModuleItem({ title: 'Post de Instagram', notes: '' }, 'podcast'), false);
    assert.equal(isModuleItem({ title: 'Episodio 12' }, 'production'), false);
});

test('isReadyStatus matches Kanban ready lane', () => {
    assert.equal(isReadyStatus('editingTask', 'aprobado'), true);
    assert.equal(isReadyStatus('editingTask', 'en_edicion'), false);
    assert.equal(isReadyStatus('accountTask', 'aprobado_internamente'), true);
    assert.equal(isReadyStatus('accountTask', 'por_disenar'), false);
    assert.equal(isReadyStatus('event', 'publicado'), true);
    assert.equal(isReadyStatus('event', 'en_produccion'), false);
});

test('summarizeModuleWeek counts created and finalized in window only', () => {
    const people = [
        { id: 'p1', name: 'Ana' },
        { id: 'p2', name: 'Luis' }
    ];

    const items = [
        {
            id: 'ok',
            _taskType: 'editingTask',
            type: 'podcast',
            title: 'Episodio OK',
            contextId: 'p1',
            status: 'aprobado',
            createdAt: '2026-08-04T10:00:00-06:00',
            approvedAt: '2026-08-07T15:00:00-06:00'
        },
        {
            id: 'created-before',
            _taskType: 'editingTask',
            type: 'podcast',
            title: 'Episodio viejo',
            contextId: 'p1',
            status: 'aprobado',
            createdAt: '2026-08-02T10:00:00-06:00',
            approvedAt: '2026-08-07T15:00:00-06:00'
        },
        {
            id: 'finalized-after',
            _taskType: 'editingTask',
            type: 'podcast',
            title: 'Episodio tarde',
            contextId: 'p1',
            status: 'aprobado',
            createdAt: '2026-08-04T10:00:00-06:00',
            approvedAt: '2026-08-08T13:00:00-06:00'
        },
        {
            id: 'not-ready',
            _taskType: 'editingTask',
            type: 'podcast',
            title: 'Episodio en curso',
            contextId: 'p1',
            status: 'en_edicion',
            createdAt: '2026-08-04T10:00:00-06:00',
            updatedAt: '2026-08-07T15:00:00-06:00'
        },
        {
            id: 'production-item',
            _taskType: 'event',
            type: 'production',
            title: 'Shoot',
            contextId: 'p1',
            status: 'publicado',
            createdAt: '2026-08-05T09:00:00-06:00',
            publishedAt: '2026-08-06T11:00:00-06:00'
        }
    ];

    const podcast = summarizeModuleWeek({
        people,
        items,
        moduleKey: 'podcast',
        now: Date.parse('2026-08-08T12:00:00-06:00')
    });

    assert.equal(podcast.people[0].finalized, 1);
    assert.equal(podcast.people[1].finalized, 0);
    assert.equal(podcast.totals.finalized, 1);

    const production = summarizeModuleWeek({
        people,
        items,
        moduleKey: 'production',
        now: Date.parse('2026-08-08T12:00:00-06:00')
    });

    assert.equal(production.people[0].finalized, 1);
    assert.equal(production.totals.finalized, 1);
});

test('summarizeModuleWeek merges person.id and person.userId without duplicates', () => {
    const people = [
        { id: 'm1', userId: 'u1', name: 'Maria' }
    ];

    const items = [
        {
            id: 'a1',
            _taskType: 'event',
            type: 'production',
            title: 'Grabación A',
            contextId: 'm1',
            status: 'publicado',
            createdAt: '2026-08-04T10:00:00-06:00',
            publishedAt: '2026-08-05T10:00:00-06:00'
        },
        {
            id: 'a1',
            _taskType: 'event',
            type: 'production',
            title: 'Grabación A',
            assigneeUserId: 'u1',
            status: 'publicado',
            createdAt: '2026-08-04T10:00:00-06:00',
            publishedAt: '2026-08-05T10:00:00-06:00'
        }
    ];

    const result = summarizeModuleWeek({
        people,
        items,
        moduleKey: 'production',
        now: Date.parse('2026-08-08T12:00:00-06:00')
    });

    assert.equal(result.people[0].finalized, 1);
    assert.equal(result.totals.finalized, 1);
});

test('mergeRosterPeople dedupes editors and managers by id', () => {
    const merged = mergeRosterPeople(
        [{ id: 'e1', name: 'Editor' }, { id: 'shared', name: 'Both Editor' }],
        [{ id: 'm1', name: 'Manager' }, { id: 'shared', name: 'Both Manager' }]
    );
    assert.equal(merged.length, 3);
    assert.equal(merged.find((person) => person.id === 'shared')?.name, 'Both Manager');
});
