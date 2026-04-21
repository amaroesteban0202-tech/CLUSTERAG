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

export const computeDueAt = (task = {}) => {
    const date = typeof task.date === 'string' ? task.date.trim() : '';
    const time = typeof task.time === 'string' ? task.time.trim() : '';
    if (!DATE_RE.test(date) || !TIME_RE.test(time)) return null;
    const iso = `${date}T${time}:00${HONDURAS_OFFSET}`;
    const ms = Date.parse(iso);
    return Number.isFinite(ms) ? { iso, ms } : null;
};

const resolveAssignee = async (task) => {
    const memberId = task.contextId || task.assigneeUserId || '';
    if (!memberId) return null;

    // Las tareas de gestion referencian usuarios de la coleccion "users"
    // (management_*) o pueden venir de "managers". Intentamos ambos.
    const fromUsers = await getRecord({ collectionName: 'users', recordId: memberId });
    if (fromUsers?.email) return { id: fromUsers.id, name: fromUsers.name || '', email: fromUsers.email };

    const fromManagers = await getRecord({ collectionName: 'managers', recordId: memberId });
    if (fromManagers?.email) return { id: fromManagers.id, name: fromManagers.name || '', email: fromManagers.email };

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
        collectionName: 'management_tasks',
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
        skippedNoDue: 0,
        skippedClosed: 0,
        skippedNoEmail: 0,
        skippedDisabled: 0,
        remindersSent: 0,
        overdueSent: 0,
        nagsSent: 0,
        errors: []
    };

    const tasks = await listRecords({ collectionName: 'management_tasks' });
    const now = Date.now();

    for (const task of tasks) {
        report.checked += 1;

        if (task.status === 'cerrado') {
            report.skippedClosed += 1;
            continue;
        }
        if (task.notificationsEnabled === false) {
            report.skippedDisabled += 1;
            continue;
        }

        const due = computeDueAt(task);
        if (!due) {
            report.skippedNoDue += 1;
            continue;
        }

        let assignee = null;
        try {
            assignee = await resolveAssignee(task);
        } catch (error) {
            report.errors.push({ taskId: task.id, step: 'resolveAssignee', message: error.message });
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
            taskTitle: task.title || '(sin titulo)',
            taskNotes: task.notes || '',
            clientName,
            dueHuman,
            taskUrl
        };

        try {
            if (msUntilDue > 0) {
                // Recordatorios pre-vencimiento
                for (const stage of REMINDER_STAGES) {
                    const hoursLeft = msUntilDue / HOUR_MS;
                    if (hoursLeft <= stage.hours && !task[stage.key]) {
                        await sendManagementTaskReminderEmail({
                            ...baseContext,
                            variant: 'upcoming',
                            label: stage.label
                        });
                        await updateTaskFlags(task, { [stage.key]: nowIso() });
                        task[stage.key] = nowIso();
                        report.remindersSent += 1;
                    }
                }
            } else {
                // Vencida
                const overdueMs = -msUntilDue;
                if (!task.overdueSentAt) {
                    await sendManagementTaskReminderEmail({
                        ...baseContext,
                        variant: 'overdue',
                        overdueHours: Math.floor(overdueMs / HOUR_MS)
                    });
                    const stamp = nowIso();
                    await updateTaskFlags(task, { overdueSentAt: stamp, lastOverdueNagAt: stamp });
                    report.overdueSent += 1;
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
                        await updateTaskFlags(task, { lastOverdueNagAt: nowIso() });
                        report.nagsSent += 1;
                    }
                }
            }
        } catch (error) {
            report.errors.push({ taskId: task.id, step: 'sendEmail', message: error.message });
        }
    }

    return report;
};

// util para debug manual
export const _internals = { db };
