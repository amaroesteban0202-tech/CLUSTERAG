import { db } from '../db/knex.js';
import { env } from '../config/env.js';
import { listRecords, upsertRecord } from './records.js';
import { nowIso } from './time.js';
import { normalizeEmail } from './text.js';
import { sendManagementTaskReminderEmail } from './email.js';
import { sendTaskReminderPush } from './push-notifications.js';

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

const normalizePerson = (record = null) => (
    record?.email ? { id: record.id, name: record.name || '', email: normalizeEmail(record.email) } : null
);

const findPersonById = (recordId, recordsByCollection) => {
    const id = String(recordId || '');
    if (!id) return null;
    for (const collectionName of ['users', 'managers', 'editors']) {
        const person = normalizePerson(recordsByCollection[collectionName].get(id));
        if (person) return person;
    }
    return null;
};

const findPersonByEmail = (email, recordsByCollection) => {
    const normalized = normalizeEmail(email);
    if (!normalized) return null;
    for (const collectionName of ['users', 'managers', 'editors']) {
        for (const record of recordsByCollection[collectionName].values()) {
            if (normalizeEmail(record.email) === normalized) {
                return normalizePerson(record);
            }
        }
    }
    return null;
};

export const resolveAssignee = (task, config, recordsByCollection) => {
    const directUserId = task.assigneeUserId || '';
    if (directUserId) {
        const fromUsers = recordsByCollection.users.get(String(directUserId));
        const assignee = normalizePerson(fromUsers);
        if (assignee) return assignee;
    }

    const contextId = task.contextId || '';
    if (!contextId) return null;

    const fromContext = recordsByCollection[config.contextCollection].get(String(contextId));
    const contextAssignee = normalizePerson(fromContext);
    if (contextAssignee) return contextAssignee;

    const linkedUserId = fromContext?.userId || '';
    if (linkedUserId) {
        const fromLinkedUser = recordsByCollection.users.get(String(linkedUserId));
        const linkedAssignee = normalizePerson(fromLinkedUser);
        if (linkedAssignee) return linkedAssignee;
    }

    for (const collectionName of ['users', 'managers', 'editors']) {
        if (collectionName === config.contextCollection) continue;
        const fallbackRecord = recordsByCollection[collectionName].get(String(contextId));
        const fallbackAssignee = normalizePerson(fallbackRecord);
        if (fallbackAssignee) return fallbackAssignee;
    }

    return null;
};

export const resolveAssigner = (task, recordsByCollection) => {
    const byId = findPersonById(task.assignedByUserId, recordsByCollection);
    if (byId) return byId;

    const byEmail = findPersonByEmail(task.assignedByEmail, recordsByCollection);
    if (byEmail) return byEmail;

    const email = normalizeEmail(task.assignedByEmail);
    if (!email) return null;
    return {
        id: String(task.assignedByUserId || ''),
        name: String(task.assignedByName || '').trim(),
        email
    };
};

export const buildReminderRecipients = ({ assignee = null, assigner = null } = {}) => {
    const recipients = [];
    const seen = new Set();
    const push = (person, role) => {
        const email = normalizeEmail(person?.email);
        if (!email || seen.has(email)) return;
        seen.add(email);
        recipients.push({
            email,
            name: person.name || '',
            role
        });
    };
    push(assignee, 'assignee');
    push(assigner, 'assigner');
    return recipients;
};

const resolveClientName = (task, clientsById) => {
    if (!task.clientId) return '';
    const client = clientsById.get(String(task.clientId));
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

const REMINDER_STAGES = [
    { key: 'reminder8hSentAt', hours: 8, label: '8 horas' }
];

const sendReminderToRecipients = async ({
    recipients,
    baseContext,
    extras,
    taskId = '',
    collectionName = ''
}) => {
    for (const recipient of recipients) {
        await sendManagementTaskReminderEmail({
            ...baseContext,
            ...extras,
            to: recipient.email,
            recipientRole: recipient.role,
            recipientName: recipient.name
        });
    }
    await sendTaskReminderPush({
        recipients,
        variant: extras.variant,
        label: extras.label,
        overdueHours: extras.overdueHours,
        taskTitle: baseContext.taskTitle,
        taskTypeLabel: baseContext.taskTypeLabel,
        clientName: baseContext.clientName,
        taskId,
        collectionName
    });
};

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

    const directoryCollections = ['users', 'managers', 'editors', 'clients'];
    const [directoryLists, taskLists] = await Promise.all([
        Promise.all(directoryCollections.map((collectionName) => listRecords({ collectionName }))),
        Promise.all(TASK_CONFIGS.map((config) => listRecords({ collectionName: config.collectionName })))
    ]);
    const recordsByCollection = Object.fromEntries(directoryCollections.map((collectionName, index) => [
        collectionName,
        new Map(directoryLists[index].map((record) => [String(record.id), record]))
    ]));

    for (const [configIndex, config] of TASK_CONFIGS.entries()) {
        const tasks = taskLists[configIndex];
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
            let assigner = null;
            try {
                assignee = resolveAssignee(task, config, recordsByCollection);
                assigner = resolveAssigner(task, recordsByCollection);
            } catch (error) {
                report.errors.push({ collectionName: config.collectionName, taskId: task.id, step: 'resolveRecipients', message: error.message });
                continue;
            }

            const recipients = buildReminderRecipients({ assignee, assigner });
            if (recipients.length === 0) {
                report.skippedNoEmail += 1;
                continue;
            }

            const clientName = resolveClientName(task, recordsByCollection.clients);
            const taskUrl = buildTaskUrl(task);
            const dueHuman = formatHonduras(due.ms);
            const msUntilDue = due.ms - now;

            const baseContext = {
                assigneeName: assignee?.name || '',
                assignedByName: assigner?.name || task.assignedByName || '',
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
                            await sendReminderToRecipients({
                                recipients,
                                baseContext,
                                extras: { variant: 'upcoming', label: stage.label },
                                taskId: task.id,
                                collectionName: config.collectionName
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
                        await sendReminderToRecipients({
                            recipients,
                            baseContext,
                            extras: {
                                variant: 'overdue',
                                overdueHours: Math.floor(overdueMs / HOUR_MS)
                            },
                            taskId: task.id,
                            collectionName: config.collectionName
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
                            await sendReminderToRecipients({
                                recipients,
                                baseContext,
                                extras: {
                                    variant: 'overdue-nag',
                                    overdueHours: Math.floor(overdueMs / HOUR_MS)
                                },
                                taskId: task.id,
                                collectionName: config.collectionName
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

export const _internals = { db };
