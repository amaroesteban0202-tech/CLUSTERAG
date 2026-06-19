import {
  compareDateOnlyStrings,
  getHondurasTodayStr,
  isDateBeforeDateString,
  normalizeDateOnlyString,
} from "./date.js";

export const KPI_MIN_TASKS = 5;
export const KPI_MIN_TIMED_TASKS = 5;

const ACCOUNT_HIERARCHY_WEIGHTS = { p1: 4, p2: 3, p3: 2, p4: 1 };
const getAccountTaskWeight = (task = {}) => {
  const hierarchy =
    task.hierarchy ||
    (task.priority === "urgente"
      ? "p1"
      : task.priority === "recurrente"
        ? "p3"
        : "p2");
  return ACCOUNT_HIERARCHY_WEIGHTS[hierarchy] || ACCOUNT_HIERARCHY_WEIGHTS.p2;
};

export const isWorkflowCompleted = (status = "") =>
  ["aprobado_internamente", "aprobado", "publicado", "cerrado"].includes(
    status,
  );

export const normalizeEditingWorkflowStatus = (status = "") =>
  status === "correccion" ? "en_edicion" : status;

export const isEditingDelivered = (task = {}) =>
  Boolean(task.editorCompletedAt) ||
  ["revision_interna", "aprobado", "publicado"].includes(
    normalizeEditingWorkflowStatus(task.status),
  );

export const isEditingActionable = (task = {}) =>
  ["editar", "en_edicion"].includes(
    normalizeEditingWorkflowStatus(task.status),
  );

const getHondurasDateFromIso = (value = "") => {
  if (!value) return "";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Tegucigalpa",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(parsedDate);
  const getPart = (type) =>
    parts.find((part) => part.type === type)?.value || "";
  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
};

export const getMeasuredCompletionIso = (task = {}) => {
  const candidates = [
    task.completedAt,
    task.statusTimestamps?.aprobado_internamente,
    task.statusTimestamps?.aprobado,
    task.statusTimestamps?.publicado,
    task.statusTimestamps?.cerrado,
    task.internallyApprovedAt,
    task.approvedAt,
    task.publishedAt,
    task.closedAt,
  ].filter((value) => Number.isFinite(Date.parse(value)));

  return candidates.sort((left, right) => Date.parse(left) - Date.parse(right))[0] || "";
};

export const buildManagerKpiStats = ({
  managers = [],
  clients = [],
  accountTasks = [],
  rankingPeriod,
  today = getHondurasTodayStr(),
}) => {
  const inactiveClientIds = new Set(
    clients.filter((client) => client.isActive === false).map((client) => client.id),
  );

  const stats = managers.map((manager) => {
      const tasks = accountTasks.filter((task) => {
        const isCompleted = isWorkflowCompleted(task.status);
        const ownerId =
          isCompleted && task.ownerAtCompletionId
            ? task.ownerAtCompletionId
            : task.contextId;
        const taskDate = normalizeDateOnlyString(
          isCompleted && task.dueDateAtCompletion
            ? task.dueDateAtCompletion
            : task.date,
        );
        const isInPeriod =
          taskDate &&
          compareDateOnlyStrings(taskDate, rankingPeriod.start) >= 0 &&
          compareDateOnlyStrings(taskDate, rankingPeriod.end) <= 0;
        const isUnreachablePending =
          inactiveClientIds.has(task.clientId) && !isWorkflowCompleted(task.status);
        return ownerId === manager.id && isInPeriod && !isUnreachablePending;
      });
      const completedTasks = tasks.filter((task) =>
        ["aprobado_internamente", "publicado"].includes(task.status),
      );
      const measuredCompletions = completedTasks
        .map((task) => ({ task, completedAt: getMeasuredCompletionIso(task) }))
        .filter((item) => item.completedAt);
      const onTimeCount = measuredCompletions.filter(({ task, completedAt }) => {
        const dueDate = normalizeDateOnlyString(
          task.dueDateAtCompletion || task.date,
        );
        const completedDate = getHondurasDateFromIso(completedAt);
        return (
          dueDate &&
          completedDate &&
          compareDateOnlyStrings(completedDate, dueDate) <= 0
        );
      }).length;
      const completionPercent = tasks.length
        ? Math.round((completedTasks.length / tasks.length) * 100)
        : 0;
      const onTimePercent = measuredCompletions.length
        ? Math.round((onTimeCount / measuredCompletions.length) * 100)
        : null;
      const weightedTotal = tasks.reduce(
        (sum, task) => sum + getAccountTaskWeight(task),
        0,
      );
      const weightedCompleted = completedTasks.reduce(
        (sum, task) => sum + getAccountTaskWeight(task),
        0,
      );
      const weightedCompletionPercent = weightedTotal
        ? Math.round((weightedCompleted / weightedTotal) * 100)
        : 0;

      return {
        ...manager,
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        totalClients: new Set(tasks.map((task) => task.clientId).filter(Boolean)).size,
        pendingTasks: tasks.length - completedTasks.length,
        overdueTasks: tasks.filter(
          (task) =>
            !isWorkflowCompleted(task.status) &&
            isDateBeforeDateString(task.date, today),
        ).length,
        measuredCompletionCount: measuredCompletions.length,
        onTimeCount,
        weightedTotal,
        weightedCompleted,
        weightedCompletionPercent,
        completionPercent,
        onTimePercent,
      };
    });
  const qualifiedStats = stats.filter(
    (item) => item.totalTasks >= KPI_MIN_TASKS,
  );
  const loadReference = Math.max(
    1,
    ...(qualifiedStats.length > 0 ? qualifiedStats : stats).map(
      (item) => item.weightedCompleted,
    ),
  );

  return stats
    .map((item) => {
      const loadPercent = Math.min(
        100,
        Math.round((item.weightedCompleted / loadReference) * 100),
      );
      const components = [
        { value: item.weightedCompletionPercent, weight: 50 },
        { value: loadPercent, weight: 20 },
      ];
      if (
        item.onTimePercent !== null &&
        item.measuredCompletionCount >= KPI_MIN_TIMED_TASKS
      ) {
        components.push({ value: item.onTimePercent, weight: 30 });
      }
      const activeWeight = components.reduce(
        (sum, component) => sum + component.weight,
        0,
      );
      const score = activeWeight
        ? Math.round(
            components.reduce(
              (sum, component) => sum + component.value * component.weight,
              0,
            ) / activeWeight,
          )
        : 0;

      return { ...item, loadPercent, score };
    })
    .sort(
      (left, right) =>
        Number(right.totalTasks >= KPI_MIN_TASKS) -
          Number(left.totalTasks >= KPI_MIN_TASKS) ||
        right.score - left.score ||
        right.weightedCompleted - left.weightedCompleted ||
        (right.onTimePercent ?? -1) - (left.onTimePercent ?? -1) ||
        String(left.name || "").localeCompare(String(right.name || "")),
    );
};

const EDITING_DUE_BUCKET = { overdue: 0, today: 1, tomorrow: 2, later: 3 };
const EDITING_HIERARCHY_ORDER = { p1: 0, p2: 1, p3: 2, p4: 3 };
const EDITING_PRIORITY_ORDER = {
  urgente: 0,
  alta: 1,
  normal: 2,
  recurrente: 3,
  baja: 4,
};

const getDueBucket = (date = "", today = getHondurasTodayStr()) => {
  const normalizedDate = normalizeDateOnlyString(date);
  if (!normalizedDate) return EDITING_DUE_BUCKET.later;
  const delta = compareDateOnlyStrings(normalizedDate, today);
  if (delta < 0) return EDITING_DUE_BUCKET.overdue;
  if (delta === 0) return EDITING_DUE_BUCKET.today;

  const tomorrow = new Date(`${today}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return normalizedDate === tomorrow.toISOString().slice(0, 10)
    ? EDITING_DUE_BUCKET.tomorrow
    : EDITING_DUE_BUCKET.later;
};

export const rankPendingEditingTasks = (
  tasks = [],
  today = getHondurasTodayStr(),
) =>
  tasks
    .filter(isEditingActionable)
    .sort((left, right) => {
      const leftHierarchy =
        left.hierarchy ||
        (left.priority === "urgente"
          ? "p1"
          : left.priority === "recurrente"
            ? "p3"
            : "p2");
      const rightHierarchy =
        right.hierarchy ||
        (right.priority === "urgente"
          ? "p1"
          : right.priority === "recurrente"
            ? "p3"
            : "p2");

      return (
        getDueBucket(left.date, today) - getDueBucket(right.date, today) ||
        (EDITING_HIERARCHY_ORDER[leftHierarchy] ?? 9) -
          (EDITING_HIERARCHY_ORDER[rightHierarchy] ?? 9) ||
        (EDITING_PRIORITY_ORDER[left.priority] ?? 9) -
          (EDITING_PRIORITY_ORDER[right.priority] ?? 9) ||
        String(left.date || "9999-12-31").localeCompare(
          String(right.date || "9999-12-31"),
        ) ||
        String(left.title || "").localeCompare(String(right.title || ""))
      );
    });
