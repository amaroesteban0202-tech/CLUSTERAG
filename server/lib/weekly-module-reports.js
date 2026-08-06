import PDFDocument from 'pdfkit';
import { listRecords } from './records.js';
import { sendWeeklyModuleReportEmail } from './email.js';
import { nowIso } from './time.js';

const HONDURAS_TIMEZONE = 'America/Tegucigalpa';
const HONDURAS_OFFSET = '-06:00';
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const getLastActivityLabel = (record = {}) => {
    const raw = record?.updatedAt || record?.createdAt || record?.lastSeenAt || '';
    if (!raw) return 'Sin actividad';
    try {
        return new Date(raw).toLocaleString('es-HN', {
            timeZone: HONDURAS_TIMEZONE,
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return String(raw);
    }
};

const getHondurasDateParts = (value = Date.now()) => {
    const date = value instanceof Date ? value : new Date(value);
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: HONDURAS_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short'
    }).formatToParts(date);
    const getPart = (type) => parts.find((part) => part.type === type)?.value || '';
    return {
        year: getPart('year'),
        month: getPart('month'),
        day: getPart('day'),
        weekday: getPart('weekday')
    };
};

const getReportDayKey = (now = Date.now()) => {
    const { year, month, day } = getHondurasDateParts(now);
    return `${year}-${month}-${day}`;
};

const formatWindowInstant = (ms) => {
    try {
        return new Date(ms).toLocaleString('es-HN', {
            timeZone: HONDURAS_TIMEZONE,
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return String(ms);
    }
};

const addDaysToDayKey = (dayKey, days) => {
    const baseMs = Date.parse(`${dayKey}T12:00:00${HONDURAS_OFFSET}`);
    if (!Number.isFinite(baseMs)) return '';
    return getReportDayKey(baseMs + days * DAY_MS);
};

/**
 * Ventana semanal: [lunes 6:00 AM, sábado 12:00 mediodía) Honduras.
 * Al enviarse el sábado a las 12:00, cubre lun 06:00 → sáb 12:00 de esa semana.
 */
export const getWeeklyModuleReportWindow = (now = Date.now()) => {
    const parts = getHondurasDateParts(now);
    const todayKey = `${parts.year}-${parts.month}-${parts.day}`;
    const weekday = WEEKDAY_INDEX[parts.weekday] ?? 0;
    const daysUntilSaturday = (6 - weekday + 7) % 7;
    const thisSaturdayKey = addDaysToDayKey(todayKey, daysUntilSaturday);
    const thisSaturdayNoonMs = Date.parse(`${thisSaturdayKey}T12:00:00${HONDURAS_OFFSET}`);

    let endMs = thisSaturdayNoonMs;
    if (now < thisSaturdayNoonMs) {
        endMs = thisSaturdayNoonMs - 7 * DAY_MS;
    }

    // Sábado 12:00 − (5 días + 6 h) = lunes 06:00 de la misma semana.
    const startMs = endMs - (5 * DAY_MS + 6 * HOUR_MS);

    return {
        startMs,
        endMs,
        periodLabel: `${formatWindowInstant(startMs)} – ${formatWindowInstant(endMs)} (Honduras)`
    };
};

export const shouldSendWeeklyModuleReport = (date = new Date()) => {
    const weekday = getHondurasDateParts(date).weekday;
    return weekday === 'Sat';
};

const normalizeEditingWorkflowStatus = (status = '') => (
    status === 'correccion' ? 'en_edicion' : status
);

export const getModuleLaneByStatus = (taskType, statusValue = '') => {
    const normalizedStatus = String(statusValue || '').trim().toLowerCase();
    if (taskType === 'accountTask') {
        if (normalizedStatus === 'por_disenar' || normalizedStatus === 'pendiente') return 'start';
        if (['aprobacion_interna', 'en_proceso', 'en_espera'].includes(normalizedStatus)) return 'production';
        return 'ready';
    }
    if (taskType === 'editingTask') {
        const normalizedEditing = normalizeEditingWorkflowStatus(normalizedStatus);
        if (normalizedEditing === 'editar') return 'start';
        if (['en_edicion', 'revision_interna'].includes(normalizedEditing)) return 'production';
        return 'ready';
    }
    if (['programado', 'pendiente'].includes(normalizedStatus)) return 'start';
    if ([
        'grabando',
        'en_produccion',
        'editando',
        'post_produccion',
        'revision',
        'en_proceso',
        'en_espera'
    ].includes(normalizedStatus)) {
        return 'production';
    }
    return 'ready';
};

export const isReadyStatus = (taskType, statusValue = '') => (
    getModuleLaneByStatus(taskType, statusValue) === 'ready'
);

export const isModuleItem = (item = {}, moduleKey = 'podcast') => {
    const title = item.title || item.name || '';
    const notes = item.notes || item.note || item.description || '';
    const haystack = `${title} ${notes}`.toLowerCase();
    const itemType = String(item.type || '').toLowerCase();
    const isPodcast = itemType === 'podcast' || /podcast|episodio|episode|audio/i.test(haystack);
    const isProduction = itemType === 'production'
        || /producción|production|grabación|shoot|post|montaje/i.test(haystack);
    if (moduleKey === 'podcast') return isPodcast;
    if (moduleKey === 'production') return isProduction;
    return false;
};

export const getTaskCompletionIso = (task = {}) => {
    const status = String(task.status || '');
    if (task.statusTimestamps?.[status]) return task.statusTimestamps[status];
    if (status === 'publicado') return task.publishedAt || task.updatedAt || '';
    if (status === 'aprobado') return task.approvedAt || task.updatedAt || '';
    if (status === 'aprobado_internamente') return task.internallyApprovedAt || task.updatedAt || '';
    if (status === 'cerrado') return task.closedAt || task.updatedAt || '';
    return '';
};

const getTaskOwnerKeys = (task = {}) => {
    const keys = new Set();
    if (Array.isArray(task.assignees)) {
        for (const assigneeId of task.assignees) {
            if (assigneeId) keys.add(assigneeId);
        }
    }
    [task.contextId, task.ownerAtCompletionId, task.assigneeUserId, task.userId]
        .filter(Boolean)
        .forEach((value) => keys.add(value));
    return [...keys];
};

const isTimestampInWindow = (value, window) => {
    if (!value || typeof value !== 'string') return false;
    const ms = Date.parse(value);
    if (!Number.isFinite(ms)) return false;
    return ms >= window.startMs && ms < window.endMs;
};

const normalizeItemsWithType = (events = [], accountTasks = [], editingTasks = []) => [
    ...events.map((item) => ({ ...item, _taskType: 'event' })),
    ...accountTasks.map((item) => ({ ...item, _taskType: 'accountTask' })),
    ...editingTasks.map((item) => ({ ...item, _taskType: 'editingTask' }))
];

export const mergeRosterPeople = (editors = [], managers = []) => {
    const seen = new Set();
    const rows = [];
    [...managers, ...editors].forEach((person) => {
        const personId = String(person?.id || '').trim();
        if (!personId || seen.has(personId)) return;
        seen.add(personId);
        rows.push(person);
    });
    return rows;
};

export const summarizeModuleWeek = ({
    people = [],
    items = [],
    moduleKey,
    now = Date.now()
}) => {
    const window = getWeeklyModuleReportWindow(now);
    const taskMap = new Map();
    const peopleList = Array.isArray(people) ? people : [];
    const itemList = Array.isArray(items) ? items : [];

    for (const item of itemList) {
        if (!isModuleItem(item, moduleKey)) continue;
        if (!isReadyStatus(item._taskType, item.status)) continue;
        if (!isTimestampInWindow(item.createdAt || '', window)) continue;
        const completionIso = getTaskCompletionIso(item);
        if (!isTimestampInWindow(completionIso, window)) continue;

        const ownerKeys = getTaskOwnerKeys(item);
        if (ownerKeys.length === 0) continue;
        for (const ownerKey of ownerKeys) {
            const bucket = taskMap.get(ownerKey) || [];
            bucket.push(item);
            taskMap.set(ownerKey, bucket);
        }
    }

    const peopleSummary = peopleList.map((person) => {
        const perPersonTaskMap = new Map();
        [person.id, person.userId].filter(Boolean).forEach((ownerKey) => {
            const ownerTasks = taskMap.get(ownerKey) || [];
            ownerTasks.forEach((task) => {
                const dedupeKey = task.id || `${task._taskType}-${task.createdAt || ''}-${task.title || task.name || ''}`;
                if (!perPersonTaskMap.has(dedupeKey)) perPersonTaskMap.set(dedupeKey, task);
            });
        });
        const perPersonTasks = [...perPersonTaskMap.values()];
        const finalized = perPersonTasks.length;

        const lastActivity = perPersonTasks.reduce((latest, task) => {
            const candidate = getTaskCompletionIso(task) || task?.updatedAt || task?.createdAt || '';
            if (!candidate) return latest;
            const candidateMs = Date.parse(candidate);
            if (!Number.isFinite(candidateMs)) return latest;
            if (!latest || candidateMs > latest) return candidateMs;
            return latest;
        }, null);

        return {
            id: person.id,
            name: person.name || person.email || 'Sin nombre',
            email: person.email || '',
            finalized,
            lastActivity,
            lastActivityLabel: getLastActivityLabel({ updatedAt: lastActivity })
        };
    });

    const totals = peopleSummary.reduce((acc, person) => ({
        finalized: acc.finalized + person.finalized
    }), { finalized: 0 });

    return { moduleKey, people: peopleSummary, totals, window };
};

const buildPdfBuffer = async ({ title, people, totals, generatedAt, periodLabel }) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    const drawHeader = () => {
        doc.fontSize(18).fillColor('#0f172a').text(title, { align: 'left' });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#475569').text(`Generado: ${generatedAt}`, { align: 'left' });
        doc.moveDown(0.3);
        doc.fontSize(10).fillColor('#64748b').text(`Periodo: ${periodLabel}`, { align: 'left' });
        doc.moveDown(0.2);
        doc.fontSize(10).fillColor('#64748b').text(
            'Tareas creadas y finalizadas (columna listo) en el periodo',
            { align: 'left' }
        );
        doc.moveDown(1);
        doc.fontSize(12).fillColor('#0f172a').text('Resumen por persona');
        doc.moveDown(0.4);
    };

    const rowHeight = 20;
    const colWidths = [220, 90, 160];
    const xStart = 40;
    const headers = ['Persona', 'Finalizadas', 'Última actividad'];

    const drawTableHeader = (topY) => {
        doc.fontSize(9).fillColor('#334155');
        headers.forEach((header, index) => {
            const x = xStart + colWidths.slice(0, index).reduce((sum, width) => sum + width, 0);
            doc.text(header, x, topY, { width: colWidths[index], align: 'left' });
        });
        doc.moveTo(xStart, topY + 12)
            .lineTo(xStart + colWidths.reduce((sum, width) => sum + width, 0), topY + 12)
            .stroke('#cbd5e1');
        return topY + 18;
    };

    drawHeader();
    let currentY = drawTableHeader(doc.y);
    const pageBottom = () => doc.page.height - doc.page.margins.bottom;

    people.forEach((person) => {
        if (currentY + rowHeight > pageBottom() - 30) {
            doc.addPage();
            drawHeader();
            currentY = drawTableHeader(doc.y);
        }

        const values = [
            person.name,
            String(person.finalized),
            person.lastActivityLabel
        ];

        values.forEach((value, index) => {
            const x = xStart + colWidths.slice(0, index).reduce((sum, width) => sum + width, 0);
            doc.text(value, x, currentY, { width: colWidths[index], align: 'left' });
        });
        currentY += rowHeight;
    });

    doc.moveDown(1.5);
    doc.fontSize(11).fillColor('#0f172a').text('Totales');
    doc.fontSize(10).fillColor('#475569').text(
        `Personas: ${people.length} | Finalizadas: ${totals.finalized}`
    );

    doc.end();
    await new Promise((resolve, reject) => {
        doc.once('end', resolve);
        doc.once('error', reject);
    });

    return Buffer.concat(chunks);
};

export const buildWeeklyModuleReportPdf = async ({
    title,
    people = [],
    totals = {},
    generatedAt = nowIso(),
    periodLabel = ''
}) => buildPdfBuffer({ title, people, totals, generatedAt, periodLabel });

export const sendWeeklyModuleReports = async ({ to = 'info@cluster.marketing' } = {}) => {
    const now = Date.now();
    if (!shouldSendWeeklyModuleReport(new Date(now))) {
        return {
            ok: true,
            skipped: true,
            reason: 'no-sabado',
            generatedAt: nowIso(),
            to
        };
    }

    const generatedAt = nowIso();
    const editors = await listRecords({ collectionName: 'editors' });
    const managers = await listRecords({ collectionName: 'managers' });
    const people = mergeRosterPeople(editors, managers);

    const [events, accountTasks, editingTasks] = await Promise.all([
        listRecords({ collectionName: 'events' }),
        listRecords({ collectionName: 'account_tasks' }),
        listRecords({ collectionName: 'editing' })
    ]);

    const items = normalizeItemsWithType(events, accountTasks, editingTasks);

    const podcastSummary = summarizeModuleWeek({
        people,
        items,
        moduleKey: 'podcast',
        now
    });

    const productionSummary = summarizeModuleWeek({
        people,
        items,
        moduleKey: 'production',
        now
    });

    const periodLabel = podcastSummary.window?.periodLabel
        || getWeeklyModuleReportWindow(now).periodLabel;

    const podcastPdf = await buildWeeklyModuleReportPdf({
        title: 'Resumen semanal de Podcast',
        people: podcastSummary.people,
        totals: podcastSummary.totals,
        generatedAt,
        periodLabel
    });

    const productionPdf = await buildWeeklyModuleReportPdf({
        title: 'Resumen semanal de Producción',
        people: productionSummary.people,
        totals: productionSummary.totals,
        generatedAt,
        periodLabel
    });

    await sendWeeklyModuleReportEmail({
        to,
        subject: 'Resumen semanal de Podcast y Producción',
        podcastPdf,
        productionPdf,
        generatedAt,
        periodLabel
    });

    return {
        ok: true,
        to,
        generatedAt,
        periodLabel,
        podcast: podcastSummary.totals,
        production: productionSummary.totals
    };
};
