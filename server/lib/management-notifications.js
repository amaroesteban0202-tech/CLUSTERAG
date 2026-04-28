import { db } from '../db/knex.js';
import { env } from '../config/env.js';
import { listRecords, upsertRecord, getRecord } from './records.js';
import { nowIso } from './time.js';
import { sendManagementTaskReminderEmail } from './email.js';

// Honduras no aplica DST, siempre UTC-6.
const HONDURAS_OFFSET = '-06:00';
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const TIME_RE = /^\d{2}:\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const TASK_CONFIGS = [
    {
        collectionName: 'management_tasks',
        reportKey: 'management',
        taskTypeLabel: 'tarea de gestion',
        roomLabel: 'Cluster OS - Sala de Gestion',
        doneLabel: 'Cerrado',
        contextCollection: 'users',
        defaultTime: '',
        isClosed: (task) => task.status === 'cerrado'
    },
    {
        collectionName: 'account_tasks',
        reportKey: 'account',
        taskTypeLabel: 'tarea de account',
        roomLabel: 'Cluster OS - Sala de Account',
        doneLabel: 'Publicado',
        contextCollection: 'managers',
        defaultTime: '18:00',
        isClosed: (task) => task.status === 'publicado'
    },
    {
        collectionName: 'editing',
        reportKey: 'editing',
        taskTypeLabel: 'tarea de edicion',
        roomLabel: 'Cluster OS - Sala de Edicion',
        doneLabel: 'Aprobado o Publicado',
        contextCollection: 'editors',
        defaultTime: '18:00',
        isClosed: (task) => task.status === 'aprobado' || task.status === 'publicado'
    }
];

export const computeDueAt = (task = {}, config = TASK_CONFIGS[0]) => {
    const date = typeof task.date === 'string' ? task.date.trim() : '';
    const time = typeof task.time === 'string' && task.time.trim() ? task.time.trim() : config.defaultTime;
    if (!DATE_RE.test(date) || !TIME_RE.test(time)) return null;
    const iso = `${date}T${time}:00${HONDURAS_OFFSET}`;
    const ms = Date.parse(iso);
    return Number.isFinite(ms) ? { iso, ms } : null;
};

const normalizeAssignee = (record = null) => (
    record?.email ? { id: record.id, name: record.name || '', email: record.email } : null
);

const resolveAssignee = async (task, config) => {
    const directUserId = task.assigneeUserId || '';
    if (directUserId) {
        const fromUsers = await getRecord({ collectionName: 'users', recordId: directUserId });
        const assignee = normalizeAssignee(fromUsers);
        if (assignee) return assignee;
    }

    const contextId = task.contextId || '';
    if (!contextId) return null;

    const fromContext = await getRecord({ collectionName: config.contextCollection, recordId: contextId });
    const contextAssignee = normalizeAssignee(fromContext);
    if (contextAssignee) return contextAssignee;

    const linkedUserId = fromContext?.userId || '';
    if (linkedUserId) {
        const fromLinkedUser = await getRecord({ collectionName: 'users', recordId: linkedUserId });
        const linkedAssignee = normalizeAssignee(fromLinkedUser);
        if (linkedAssignee) return linkedAssignee;
    }

    // Compatibilidad para datos antiguos con contextId apuntando a otra coleccion.
    for (const collectionName of ['users', 'managers', 'editors']) {
        if (collectionName === config.contextCollection) continue;
        const fallbackRecord = await getRecord({ collectionName, recordId: contextId });
        const fallbackAssignee = normalizeAssignee(fallbackRecord);
        if (fallbackAssignee) return fallbackAssignee;
    }

    return null;
};

const resolveClientName = async (task) => {
    if (!task.clientId) return '';
    const client = await getRecord({ collectionName: 'clients', recordId: task.clientId });
    return client?.name || '';
};

const buildTaskUrl = (task) => {
    const base = (env.appBaseUrl || '').replace(/\/+$/, '');
    return base ? `${base}/?task=${encodeURIComponent(task.id || '')}` : '';
};

const formatHonduras = (ms) => {
    try {
        return new Date(ms).toLocaleString('es-HN', {
            timeZone: 'America/Tegucigalpa',
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return new Date(ms).toISOString();
    }
};

const updateTaskFlags = async (task, patch) => {
    await upsertRecord({
        collectionName: task.collectionName || 'management_tasks',
        recordId: task.id,
        payload: { ...patch, updatedAt: nowIso() },
        merge: true
    });
};

// Umbrales (en horas antes de vencer)
const REMINDER_STAGES = [
    { key: 'reminder8hSentAt', hours: 8, label: '8 horas' }
];

export const processManagementTaskReminders = async () => {
    const report = {
        checked: 0,
        byCollection: {},
        skippedNoDue: 0,
        skippedClosed: 0,
        skippedNoEmail: 0,
        skippedDisabled: 0,
        remindersSent: 0,
        overdueSent: 0,
        nagsSent: 0,
        errors: []
    };

    const now = Date.now();

    for (const config of TASK_CONFIGS) {
        const tasks = await listRecords({ collectionName: config.collectionName });
        report.byCollection[config.collectionName] = { checked: tasks.length, remindersSent: 0, overdueSent: 0, nagsSent: 0 };

        for (const task of tasks) {
            report.checked += 1;

            if (config.isClosed(task)) {
                report.skippedClosed += 1;
                continue;
            }
            if (task.notificationsEnabled === false) {
                report.skippedDisabled += 1;
                continue;
            }

            const due = computeDueAt(task, config);
            if (!due) {
                report.skippedNoDue += 1;
                continue;
            }

            let assignee = null;
            try {
                assignee = await resolveAssignee(task, config);
            } catch (error) {
                report.errors.push({ collectionName: config.collectionName, taskId: task.id, step: 'resolveAssignee', message: error.message });
                continue;
            }

            if (!assignee?.email) {
                report.skippedNoEmail += 1;
                continue;
            }

            const clientName = await resolveClientName(task);
            const taskUrl = buildTaskUrl(task);
            const dueHuman = formatHonduras(due.ms);
            const msUntilDue = due.ms - now;

            const baseContext = {
                to: assignee.email,
                assigneeName: assignee.name,
                assignedByName: task.assignedByName || '',
                taskTypeLabel: config.taskTypeLabel,
                roomLabel: config.roomLabel,
                doneLabel: config.doneLabel,
                taskTitle: task.title || '(sin titulo)',
                taskNotes: task.notes || '',
                clientName,
                dueHuman,
                taskUrl
            };

            try {
                if (msUntilDue > 0) {
                    for (const stage of REMINDER_STAGES) {
                        const hoursLeft = msUntilDue / HOUR_MS;
                        if (hoursLeft <= stage.hours && !task[stage.key]) {
                            await sendManagementTaskReminderEmail({
                                ...baseContext,
                                variant: 'upcoming',
                                label: stage.label
                            });
                            await updateTaskFlags({ ...task, collectionName: config.collectionName }, { [stage.key]: nowIso() });
                            task[stage.key] = nowIso();
                            report.remindersSent += 1;
                            report.byCollection[config.collectionName].remindersSent += 1;
                        }
                    }
                } else {
                    const overdueMs = -msUntilDue;
                    if (!task.overdueSentAt) {
                        await sendManagementTaskReminderEmail({
                            ...baseContext,
                            variant: 'overdue',
                            overdueHours: Math.floor(overdueMs / HOUR_MS)
                        });
                        const stamp = nowIso();
                        await updateTaskFlags({ ...task, collectionName: config.collectionName }, { overdueSentAt: stamp, lastOverdueNagAt: stamp });
                        report.overdueSent += 1;
                        report.byCollection[config.collectionName].overdueSent += 1;
                    } else {
                        const lastNag = task.lastOverdueNagAt
                            ? Date.parse(task.lastOverdueNagAt)
                            : Date.parse(task.overdueSentAt);
                        if (Number.isFinite(lastNag) && (now - lastNag) >= DAY_MS) {
                            await sendManagementTaskReminderEmail({
                                ...baseContext,
                                variant: 'overdue-nag',
                                overdueHours: Math.floor(overdueMs / HOUR_MS)
                            });
                            await updateTaskFlags({ ...task, collectionName: config.collectionName }, { lastOverdueNagAt: nowIso() });
                            report.nagsSent += 1;
                            report.byCollection[config.collectionName].nagsSent += 1;
                        }
                    }
                }
            } catch (error) {
                report.errors.push({ collectionName: config.collectionName, taskId: task.id, step: 'sendEmail', message: error.message });
            }
        }
    }

    return report;
};

// util para debug manual
export const _internals = { db };
