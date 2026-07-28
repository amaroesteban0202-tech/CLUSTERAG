import PDFDocument from 'pdfkit';
import { listRecords } from './records.js';
import { sendDailyReportEmail } from './email.js';
import { nowIso } from './time.js';

const HONDURAS_TIMEZONE = 'America/Tegucigalpa';

const getDateLabel = (dateValue) => {
    if (!dateValue) return 'Sin fecha';
    try {
        return new Date(dateValue).toLocaleDateString('es-HN', {
            timeZone: HONDURAS_TIMEZONE,
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return String(dateValue);
    }
};

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

const normalizeTaskDayKey = (value = '') => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    const directMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (directMatch) return directMatch[1];
    const parsed = Date.parse(trimmed);
    if (!Number.isFinite(parsed)) return '';
    return getReportDayKey(parsed);
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

export const shouldSendDailyRoleReport = (date = new Date()) => {
    const weekday = getHondurasDateParts(date).weekday;
    return weekday !== 'Sun';
};

export const summarizeRolePerformance = ({ people = [], tasks = [], collectionName, closedStatuses = new Set(), now = Date.now() }) => {
    const taskMap = new Map();
    const peopleList = Array.isArray(people) ? people : [];
    const taskList = Array.isArray(tasks) ? tasks : [];

    const reportDayKey = getReportDayKey(now);

    for (const task of taskList) {
        const taskDate = normalizeTaskDayKey(task?.date);
        if (taskDate !== reportDayKey) continue;

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
                const dedupeKey = task.id || `${task.contextId || ''}-${task.date || ''}-${task.title || ''}`;
                if (!perPersonTaskMap.has(dedupeKey)) perPersonTaskMap.set(dedupeKey, task);
            });
        });
        const perPersonTasks = [...perPersonTaskMap.values()];
        const assigned = perPersonTasks.length;
        const approved = perPersonTasks.filter((task) => closedStatuses.has(String(task.status || '').toLowerCase())).length;
        const pending = assigned - approved;
        const overdue = perPersonTasks.filter((task) => {
            const dateValue = task?.date;
            if (!dateValue) return false;
            const normalizedStatus = String(task.status || '').toLowerCase();
            if (closedStatuses.has(normalizedStatus)) return false;
            const dueMs = Date.parse(`${dateValue}T18:00:00-06:00`);
            if (!Number.isFinite(dueMs)) return false;
            return dueMs < now;
        }).length;

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
            assigned,
            approved,
            pending,
            overdue,
            lastActivity,
            lastActivityLabel: getLastActivityLabel({ updatedAt: lastActivity })
        };
    });

    const totals = peopleSummary.reduce((acc, person) => ({
        assigned: acc.assigned + person.assigned,
        approved: acc.approved + person.approved,
        pending: acc.pending + person.pending,
        overdue: acc.overdue + person.overdue
    }), { assigned: 0, approved: 0, pending: 0, overdue: 0 });

    return { collectionName, people: peopleSummary, totals };
};

const buildPdfBuffer = async ({ title, people, totals, generatedAt }) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    const drawHeader = () => {
        doc.fontSize(18).fillColor('#0f172a').text(title, { align: 'left' });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#475569').text(`Generado: ${generatedAt}`, { align: 'left' });
        doc.moveDown(1);
        doc.fontSize(12).fillColor('#0f172a').text('Resumen por persona');
        doc.moveDown(0.4);
    };

    const rowHeight = 20;
    const colWidths = [140, 64, 64, 64, 64, 95];
    const xStart = 40;
    const headers = ['Persona', 'Asignadas', 'Aprobadas', 'Pendientes', 'Vencidas', 'Última actividad'];

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
            String(person.assigned),
            String(person.approved),
            String(person.pending),
            String(person.overdue),
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
    doc.fontSize(10).fillColor('#475569').text(`Personas: ${people.length} | Asignadas: ${totals.assigned} | Aprobadas: ${totals.approved} | Pendientes: ${totals.pending} | Vencidas: ${totals.overdue}`);

    doc.end();
    await new Promise((resolve, reject) => {
        doc.once('end', resolve);
        doc.once('error', reject);
    });

    return Buffer.concat(chunks);
};

export const buildDailyRoleReportPdf = async ({ title, people = [], totals = {}, generatedAt = nowIso() }) => {
    return buildPdfBuffer({ title, people, totals, generatedAt });
};

const getCollectionPeople = async ({ collectionName }) => {
    const records = await listRecords({ collectionName });
    return records;
};

export const sendDailyRoleReports = async ({ to = 'arangojuanjoseweb@gmail.com' } = {}) => {
    const now = Date.now();
    if (!shouldSendDailyRoleReport(new Date(now))) {
        return {
            ok: true,
            skipped: true,
            reason: 'domingo',
            generatedAt: nowIso(),
            to
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

    const editorPdf = await buildDailyRoleReportPdf({
        title: 'Resumen diario de Editores',
        people: editorsSummary.people,
        totals: editorsSummary.totals,
        generatedAt
    });

    const communityManagerPdf = await buildDailyRoleReportPdf({
        title: 'Resumen diario de Community Managers',
        people: communityManagersSummary.people,
        totals: communityManagersSummary.totals,
        generatedAt
    });

    await sendDailyReportEmail({
        to,
        subject: 'Resumen diario de Editores y Community Managers',
        editorPdf,
        accountPdf: communityManagerPdf,
        generatedAt
    });

    return {
        ok: true,
        to,
        generatedAt,
        editors: editorsSummary.totals,
        communityManagers: communityManagersSummary.totals
    };
};
