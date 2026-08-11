import PDFDocument from 'pdfkit';
import { listRecords } from './records.js';
import { sendDailyReportEmail } from './email.js';
import { nowIso } from './time.js';

const HONDURAS_TIMEZONE = 'America/Tegucigalpa';
const HONDURAS_OFFSET = '-06:00';
const DAY_MS = 24 * 60 * 60 * 1000;
const REPORT_CUTOFF_HOUR = 6;

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

const normalizeRoleName = (role) => {
    if (!role) return 'Sin rol';
    return String(role).replace(/_/g, ' ');
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

/**
 * Ventana de reporte: [6:00 AM, 6:00 AM siguiente) en hora Honduras.
 * Al enviarse el 7 ago a las 6:00 AM, cubre 6 ago 06:00 → 7 ago 06:00.
 */
export const getDailyReportWindow = (now = Date.now()) => {
    const { year, month, day } = getHondurasDateParts(now);
    const todayKey = `${year}-${month}-${day}`;
    const todayCutoffMs = Date.parse(`${todayKey}T${String(REPORT_CUTOFF_HOUR).padStart(2, '0')}:00:00${HONDURAS_OFFSET}`);
    const endMs = now < todayCutoffMs ? todayCutoffMs - DAY_MS : todayCutoffMs;
    const startMs = endMs - DAY_MS;
    return {
        startMs,
        endMs,
        labelDayKey: getReportDayKey(startMs),
        periodLabel: `${formatWindowInstant(startMs)} – ${formatWindowInstant(endMs)} (Honduras)`
    };
};

const isCreatedInReportWindow = (createdAt, window) => {
    if (!createdAt || typeof createdAt !== 'string') return false;
    const createdMs = Date.parse(createdAt);
    if (!Number.isFinite(createdMs)) return false;
    return createdMs >= window.startMs && createdMs < window.endMs;
};

export const shouldSendDailyRoleReport = (date = new Date()) => {
    const weekday = getHondurasDateParts(date).weekday;
    return weekday !== 'Sun';
};

export const summarizeRolePerformance = ({ people = [], tasks = [], collectionName, closedStatuses = new Set(), now = Date.now() }) => {
    const taskMap = new Map();
    const peopleList = Array.isArray(people) ? people : [];
    const taskList = Array.isArray(tasks) ? tasks : [];
    const window = getDailyReportWindow(now);

    for (const task of taskList) {
        if (!isCreatedInReportWindow(task?.createdAt || '', window)) continue;

        const ownerKeys = getTaskOwnerKeys(task);
        if (ownerKeys.length === 0) continue;
        for (const ownerKey of ownerKeys) {
            const bucket = taskMap.get(ownerKey) || [];
            bucket.push(task);
            taskMap.set(ownerKey, bucket);
        }
    }

    const peopleSummary = peopleList.map((person) => {
        const perPersonTaskMap = new Map();
        [person.id, person.userId].filter(Boolean).forEach((ownerKey) => {
            const ownerTasks = taskMap.get(ownerKey) || [];
            ownerTasks.forEach((task) => {
                const dedupeKey = task.id || `${task.contextId || ''}-${task.createdAt || ''}-${task.title || ''}`;
                if (!perPersonTaskMap.has(dedupeKey)) perPersonTaskMap.set(dedupeKey, task);
            });
        });
        const perPersonTasks = [...perPersonTaskMap.values()];
        const created = perPersonTasks.length;
        const approved = perPersonTasks.filter((task) => closedStatuses.has(String(task.status || '').toLowerCase())).length;
        const inProgress = created - approved;

        const lastActivity = perPersonTasks.reduce((latest, task) => {
            const candidate = task?.updatedAt || task?.createdAt || '';
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
            role: normalizeRoleName(person.role || ''),
            collectionName,
            created,
            approved,
            inProgress,
            lastActivity,
            lastActivityLabel: getLastActivityLabel({ updatedAt: lastActivity })
        };
    });

    const totals = peopleSummary.reduce((acc, person) => ({
        created: acc.created + person.created,
        approved: acc.approved + person.approved,
        inProgress: acc.inProgress + person.inProgress
    }), { created: 0, approved: 0, inProgress: 0 });

    return { collectionName, people: peopleSummary, totals, window };
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
        doc.fontSize(10).fillColor('#64748b').text('Tareas creadas en el periodo y su estado actual', { align: 'left' });
        doc.moveDown(1);
        doc.fontSize(12).fillColor('#0f172a').text('Resumen por persona');
        doc.moveDown(0.4);
    };

    const rowHeight = 20;
    const colWidths = [150, 70, 70, 80, 110];
    const xStart = 40;
    const headers = ['Persona', 'Creadas', 'Aprobadas', 'En proceso', 'Última actividad'];

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
            String(person.created),
            String(person.approved),
            String(person.inProgress),
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
    doc.fontSize(10).fillColor('#475569').text(`Personas: ${people.length} | Creadas: ${totals.created} | Aprobadas: ${totals.approved} | En proceso: ${totals.inProgress}`);

    doc.end();
    await new Promise((resolve, reject) => {
        doc.once('end', resolve);
        doc.once('error', reject);
    });

    return Buffer.concat(chunks);
};

export const buildDailyRoleReportPdf = async ({
    title,
    people = [],
    totals = {},
    generatedAt = nowIso(),
    periodLabel = ''
}) => {
    return buildPdfBuffer({ title, people, totals, generatedAt, periodLabel });
};

const getCollectionPeople = async ({ collectionName }) => {
    const records = await listRecords({ collectionName });
    return records;
};

export const sendDailyRoleReports = async ({ to = '' } = {}) => {
    const recipient = String(to || '').trim();
    if (!recipient) throw new Error('Falta el destinatario del reporte diario.');
    const now = Date.now();
    if (!shouldSendDailyRoleReport(new Date(now))) {
        return {
            ok: true,
            skipped: true,
            reason: 'domingo',
            generatedAt: nowIso(),
            to: recipient
        };
    }

    const generatedAt = nowIso();
    const editors = await getCollectionPeople({ collectionName: 'editors' });
    const communityManagers = await getCollectionPeople({ collectionName: 'managers' });

    const editingTasks = await listRecords({ collectionName: 'editing' });
    const accountTasks = await listRecords({ collectionName: 'account_tasks' });

    const editorsSummary = summarizeRolePerformance({
        people: editors,
        tasks: editingTasks,
        collectionName: 'editing',
        closedStatuses: new Set(['aprobado', 'publicado']),
        now
    });

    const communityManagersSummary = summarizeRolePerformance({
        people: communityManagers,
        tasks: accountTasks,
        collectionName: 'account_tasks',
        closedStatuses: new Set(['aprobado_internamente', 'publicado']),
        now
    });

    const periodLabel = editorsSummary.window?.periodLabel || getDailyReportWindow(now).periodLabel;

    const editorPdf = await buildDailyRoleReportPdf({
        title: 'Resumen diario de Editores',
        people: editorsSummary.people,
        totals: editorsSummary.totals,
        generatedAt,
        periodLabel
    });

    const communityManagerPdf = await buildDailyRoleReportPdf({
        title: 'Resumen diario de Community Managers',
        people: communityManagersSummary.people,
        totals: communityManagersSummary.totals,
        generatedAt,
        periodLabel
    });

    await sendDailyReportEmail({
        to: recipient,
        subject: 'Resumen diario de Editores y Community Managers',
        editorPdf,
        accountPdf: communityManagerPdf,
        generatedAt,
        periodLabel
    });

    return {
        ok: true,
        to: recipient,
        generatedAt,
        periodLabel,
        editors: editorsSummary.totals,
        communityManagers: communityManagersSummary.totals
    };
};
