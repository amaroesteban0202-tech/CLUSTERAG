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

export const summarizeRolePerformance = ({ people = [], tasks = [], collectionName, closedStatuses = new Set(), now = Date.now() }) => {
    const taskMap = new Map();
    const peopleList = Array.isArray(people) ? people : [];
    const taskList = Array.isArray(tasks) ? tasks : [];

    for (const task of taskList) {
        const key = task.contextId || task.assigneeUserId || task.userId || task.id;
        if (!key) continue;
        const bucket = taskMap.get(key) || [];
        bucket.push(task);
        taskMap.set(key, bucket);
    }

    const peopleSummary = peopleList.map((person) => {
        const perPersonTasks = taskMap.get(person.id) || taskMap.get(person.userId) || [];
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

    doc.fontSize(18).text(title, { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#475569').text(`Generado: ${generatedAt}`, { align: 'left' });
    doc.moveDown(1);

    doc.fontSize(12).fillColor('#0f172a').text('Resumen por persona');
    doc.moveDown(0.4);

    const tableTop = doc.y;
    const rowHeight = 20;
    const colWidths = [120, 70, 55, 55, 55, 85];
    const xStart = 40;
    const headers = ['Persona', 'Asignadas', 'Aprobadas', 'Pendientes', 'Vencidas', 'Última actividad'];

    doc.fontSize(9).fillColor('#334155');
    headers.forEach((header, index) => {
        const x = xStart + colWidths.slice(0, index).reduce((sum, width) => sum + width, 0);
        doc.text(header, x, tableTop, { width: colWidths[index], align: 'left' });
    });

    doc.moveTo(xStart, tableTop + 12).lineTo(xStart + colWidths.reduce((sum, width) => sum + width, 0), tableTop + 12).stroke('#cbd5e1');

    let currentY = tableTop + 18;
    people.forEach((person) => {
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
    doc.fontSize(10).fillColor('#475569').text(`Asignadas: ${totals.assigned} | Aprobadas: ${totals.approved} | Pendientes: ${totals.pending} | Vencidas: ${totals.overdue}`);

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
    return records.filter((record) => Boolean(record?.email || record?.name));
};

export const sendDailyRoleReports = async ({ to = 'arangojuanjoseweb@gmail.com' } = {}) => {
    const generatedAt = nowIso();
    const editors = await getCollectionPeople({ collectionName: 'editors' });
    const accounts = await getCollectionPeople({ collectionName: 'managers' });

    const editingTasks = await listRecords({ collectionName: 'editing' });
    const accountTasks = await listRecords({ collectionName: 'account_tasks' });

    const editorsSummary = summarizeRolePerformance({
        people: editors,
        tasks: editingTasks,
        collectionName: 'editing',
        closedStatuses: new Set(['aprobado', 'publicado']),
        now: Date.now()
    });

    const accountsSummary = summarizeRolePerformance({
        people: accounts,
        tasks: accountTasks,
        collectionName: 'account_tasks',
        closedStatuses: new Set(['publicado']),
        now: Date.now()
    });

    const editorPdf = await buildDailyRoleReportPdf({
        title: 'Resumen diario de Editores',
        people: editorsSummary.people,
        totals: editorsSummary.totals,
        generatedAt
    });

    const accountPdf = await buildDailyRoleReportPdf({
        title: 'Resumen diario de Accounts',
        people: accountsSummary.people,
        totals: accountsSummary.totals,
        generatedAt
    });

    await sendDailyReportEmail({
        to,
        subject: 'Resumen diario de Editores y Accounts',
        editorPdf,
        accountPdf,
        generatedAt
    });

    return {
        ok: true,
        to,
        generatedAt,
        editors: editorsSummary.totals,
        accounts: accountsSummary.totals
    };
};
