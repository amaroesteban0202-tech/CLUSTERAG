import {
  compareDateOnlyStrings,
  getDateOnlyDiffDays,
  getHondurasTodayStr,
  isDateBeforeDateString,
  normalizeDateOnlyString,
} from "./date.js";
import {
  getEditingHierarchyId,
  getRankingMonthPeriod,
  isAccountTaskDone,
  isCompletedStatus,
  isDateWithinPeriod,
} from "./task-helpers.js";
import {
  isEditingDelivered,
  isWorkflowCompleted,
  normalizeEditingWorkflowStatus,
} from "./kpi.js";
import { normalizeEmail, normalizeNameKey, nowIso } from "./text.js";
import { LEGACY_COLOR_MAP } from "../constants/app.constants.js";

export const DEFAULT_RANKING_SETTINGS = {
  version: 2,
  manager: {
    taskPoints: { p1: 12, p2: 8, p3: 4, p4: 2 },
    publishedBonus: 4,
    onTimeBonus: 8,
    earlyDeliveryBonus: 8,
    earlyDeliveryCutoffHour: 12,
    fastTurnaroundHours: 6,
    fastTurnaroundBonus: 8,
    overduePenalty: -12,
    workflowStepPoints: 2,
    batchDifferentClientCount: 4,
    batchEarlyCompletedCount: 2,
    batchEarlyBonus: 18,
    planningLeadDays: 1,
    planningTaskPoints: 3,
    planningMaxPoints: 24,
    creativityKeywordPoints: 4,
    creativityMaxPoints: 20,
    creativityKeywords:
      "idea,nuevo,nueva,propuesta,concepto,hook,creativo,creativa,innovacion",
  },
  editing: {
    hierarchyScores: { p1: 440, p2: 300, p3: 170, p4: 90 },
    priorityScores: {
      urgente: 150,
      alta: 100,
      normal: 60,
      baja: 15,
      recurrente: 35,
    },
    dateScores: { overdue: 190, today: 130, tomorrow: 75, soon: 30 },
    statusPenalties: { aprobado: -150, publicado: -260 },
    earlyDeliveryBonus: 50,
    earlyDeliveryCutoffHour: 12,
  },
};

export const toConfigNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

export const sanitizeNumberMap = (defaults = {}, values = {}) =>
  Object.keys(defaults).reduce(
    (acc, key) => ({
      ...acc,
      [key]: toConfigNumber(values?.[key], defaults[key]),
    }),
    {},
  );

export const sanitizeRankingSettings = (settings = {}) => {
  const source = settings || {};
  const manager = source.manager || {};
  const editing = source.editing || {};
  return {
    version: DEFAULT_RANKING_SETTINGS.version,
    manager: {
      taskPoints: sanitizeNumberMap(
        DEFAULT_RANKING_SETTINGS.manager.taskPoints,
        manager.taskPoints,
      ),
      publishedBonus: toConfigNumber(
        manager.publishedBonus,
        DEFAULT_RANKING_SETTINGS.manager.publishedBonus,
      ),
      onTimeBonus: toConfigNumber(
        manager.onTimeBonus,
        DEFAULT_RANKING_SETTINGS.manager.onTimeBonus,
      ),
      earlyDeliveryBonus: toConfigNumber(
        manager.earlyDeliveryBonus,
        DEFAULT_RANKING_SETTINGS.manager.earlyDeliveryBonus,
      ),
      earlyDeliveryCutoffHour: toConfigNumber(
        manager.earlyDeliveryCutoffHour,
        DEFAULT_RANKING_SETTINGS.manager.earlyDeliveryCutoffHour,
      ),
      fastTurnaroundHours: Math.max(
        0,
        toConfigNumber(
          manager.fastTurnaroundHours,
          DEFAULT_RANKING_SETTINGS.manager.fastTurnaroundHours,
        ),
      ),
      fastTurnaroundBonus: toConfigNumber(
        manager.fastTurnaroundBonus,
        DEFAULT_RANKING_SETTINGS.manager.fastTurnaroundBonus,
      ),
      overduePenalty: -Math.abs(
        toConfigNumber(
          manager.overduePenalty,
          DEFAULT_RANKING_SETTINGS.manager.overduePenalty,
        ),
      ),
      workflowStepPoints: toConfigNumber(
        manager.workflowStepPoints,
        DEFAULT_RANKING_SETTINGS.manager.workflowStepPoints,
      ),
      batchDifferentClientCount: Math.max(
        1,
        toConfigNumber(
          manager.batchDifferentClientCount,
          DEFAULT_RANKING_SETTINGS.manager.batchDifferentClientCount,
        ),
      ),
      batchEarlyCompletedCount: Math.max(
        1,
        toConfigNumber(
          manager.batchEarlyCompletedCount,
          DEFAULT_RANKING_SETTINGS.manager.batchEarlyCompletedCount,
        ),
      ),
      batchEarlyBonus: toConfigNumber(
        manager.batchEarlyBonus,
        DEFAULT_RANKING_SETTINGS.manager.batchEarlyBonus,
      ),
      planningLeadDays: Math.max(
        0,
        toConfigNumber(
          manager.planningLeadDays,
          DEFAULT_RANKING_SETTINGS.manager.planningLeadDays,
        ),
      ),
      planningTaskPoints: toConfigNumber(
        manager.planningTaskPoints,
        DEFAULT_RANKING_SETTINGS.manager.planningTaskPoints,
      ),
      planningMaxPoints: Math.max(
        0,
        toConfigNumber(
          manager.planningMaxPoints,
          DEFAULT_RANKING_SETTINGS.manager.planningMaxPoints,
        ),
      ),
      creativityKeywordPoints: toConfigNumber(
        manager.creativityKeywordPoints,
        DEFAULT_RANKING_SETTINGS.manager.creativityKeywordPoints,
      ),
      creativityMaxPoints: Math.max(
        0,
        toConfigNumber(
          manager.creativityMaxPoints,
          DEFAULT_RANKING_SETTINGS.manager.creativityMaxPoints,
        ),
      ),
      creativityKeywords: String(
        manager.creativityKeywords ||
          DEFAULT_RANKING_SETTINGS.manager.creativityKeywords,
      ),
    },
    editing: {
      hierarchyScores: sanitizeNumberMap(
        DEFAULT_RANKING_SETTINGS.editing.hierarchyScores,
        editing.hierarchyScores,
      ),
      priorityScores: sanitizeNumberMap(
        DEFAULT_RANKING_SETTINGS.editing.priorityScores,
        editing.priorityScores,
      ),
      dateScores: sanitizeNumberMap(
        DEFAULT_RANKING_SETTINGS.editing.dateScores,
        editing.dateScores,
      ),
      statusPenalties: sanitizeNumberMap(
        DEFAULT_RANKING_SETTINGS.editing.statusPenalties,
        editing.statusPenalties,
      ),
      earlyDeliveryBonus: toConfigNumber(
        editing.earlyDeliveryBonus,
        DEFAULT_RANKING_SETTINGS.editing.earlyDeliveryBonus,
      ),
      earlyDeliveryCutoffHour: toConfigNumber(
        editing.earlyDeliveryCutoffHour,
        DEFAULT_RANKING_SETTINGS.editing.earlyDeliveryCutoffHour,
      ),
    },
  };
};

export const getAccountTaskHierarchyId = (task = {}) => {
  if (task.hierarchy) return task.hierarchy;
  if (task.priority === "urgente") return "p1";
  if (task.priority === "recurrente") return "p3";
  return "p2";
};

export const getStatusTimestampPatch = (
  task = {},
  newStatus = "",
  stamp = nowIso(),
  actorUserId = "",
  workflowType = "",
) => {
  const statusTimestamps = {
    ...(task.statusTimestamps || {}),
    [newStatus]: task.statusTimestamps?.[newStatus] || stamp,
  };
  const patch = { lastStatusChangedAt: stamp, statusTimestamps };
  if (newStatus === "publicado" && !task.publishedAt) patch.publishedAt = stamp;
  if (newStatus === "aprobado" && !task.approvedAt) patch.approvedAt = stamp;
  if (newStatus === "aprobado_internamente" && !task.internallyApprovedAt)
    patch.internallyApprovedAt = stamp;
  if (newStatus === "cerrado" && !task.closedAt) patch.closedAt = stamp;
  if (isWorkflowCompleted(newStatus) && !task.completedAt) {
    patch.completedAt = stamp;
    patch.completedByUserId = actorUserId || "";
    patch.ownerAtCompletionId = task.contextId || task.assigneeUserId || "";
    patch.dueDateAtCompletion = normalizeDateOnlyString(task.date);
  }
  if (workflowType === "editing") {
    const previousEditingStatus = normalizeEditingWorkflowStatus(task.status);
    const nextEditingStatus = normalizeEditingWorkflowStatus(newStatus);
    const isEditorDelivery = [
      "revision_interna",
      "aprobado",
      "publicado",
    ].includes(nextEditingStatus);
    const isReturnedToEditing =
      ["revision_interna", "aprobado", "publicado"].includes(
        previousEditingStatus,
      ) && ["editar", "en_edicion"].includes(nextEditingStatus);

    if (isEditorDelivery && !task.editorCompletedAt) {
      patch.editorCompletedAt = stamp;
      patch.editorCompletedByUserId = actorUserId || "";
      patch.editorOwnerAtCompletionId =
        task.contextId || task.assigneeUserId || "";
      patch.editorAssigneeUserAtCompletionId = task.assigneeUserId || "";
      patch.editorAssigneesAtCompletion = Array.isArray(task.assignees)
        ? task.assignees.filter(Boolean)
        : [];
      patch.editorDueDateAtCompletion = normalizeDateOnlyString(task.date);
    }
    if (isReturnedToEditing && task.editorCompletedAt) {
      patch.editorReworkCount = Number(task.editorReworkCount || 0) + 1;
      patch.lastEditorReworkAt = stamp;
    }
  }
  return patch;
};

export const getTaskCompletionIso = (task = {}) => {
  const status = task.status || "";
  if (task.statusTimestamps?.[status]) return task.statusTimestamps[status];
  if (status === "publicado") return task.publishedAt || task.updatedAt || "";
  if (status === "aprobado") return task.approvedAt || task.updatedAt || "";
  if (status === "aprobado_internamente")
    return task.internallyApprovedAt || task.updatedAt || "";
  if (status === "cerrado") return task.closedAt || task.updatedAt || "";
  return "";
};

export const getHondurasDatePartsFromIso = (value = "") => {
  if (!value) return null;
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Tegucigalpa",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    }).formatToParts(parsedDate);
    const getPart = (type) =>
      parts.find((part) => part.type === type)?.value || "";
    const year = getPart("year");
    const month = getPart("month");
    const day = getPart("day");
    const hour = Number(getPart("hour"));
    if (!year || !month || !day || !Number.isFinite(hour)) return null;
    return { date: `${year}-${month}-${day}`, hour };
  } catch (error) {
    return null;
  }
};

export const getHondurasDateFromIso = (value = "") =>
  getHondurasDatePartsFromIso(value)?.date || "";

export const getHoursBetween = (startValue = "", endValue = "") => {
  const startMs = Date.parse(startValue);
  const endMs = Date.parse(endValue);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs)
    return null;
  return (endMs - startMs) / 3600000;
};

export const isCompletionOnTime = (task = {}, completionIso = "") => {
  const dueDate = normalizeDateOnlyString(task.date);
  const completionDate = getHondurasDateFromIso(completionIso);
  if (!dueDate || !completionDate) return false;
  return compareDateOnlyStrings(completionDate, dueDate) <= 0;
};

export const isCompletionEarly = (task = {}, completionIso = "", cutoffHour = 12) => {
  const dueDate = normalizeDateOnlyString(task.date);
  const completionParts = getHondurasDatePartsFromIso(completionIso);
  if (!dueDate || !completionParts) return false;
  const dateDelta = compareDateOnlyStrings(completionParts.date, dueDate);
  return (
    dateDelta < 0 || (dateDelta === 0 && completionParts.hour <= cutoffHour)
  );
};

export const isTaskPlannedAhead = (task = {}, leadDays = 1) => {
  const dueDate = normalizeDateOnlyString(task.date);
  const createdDate = getHondurasDateFromIso(task.createdAt);
  if (!dueDate || !createdDate) return false;
  return getDateOnlyDiffDays(dueDate, createdDate) >= leadDays;
};


export const toKpiPercent = (value = 0, maxValue = 0) => {
  const numericValue = Number(value);
  const numericMax = Number(maxValue);
  if (
    !Number.isFinite(numericValue) ||
    !Number.isFinite(numericMax) ||
    numericMax <= 0
  )
    return 0;
  return Math.max(
    0,
    Math.min(100, Math.round((numericValue / numericMax) * 100)),
  );
};

export const getRankingKeywords = (value = "") =>
  String(value || "")
    .split(",")
    .map((item) => normalizeNameKey(item))
    .filter(Boolean);

export const hasCreativitySignal = (task = {}, keywords = []) => {
  if (keywords.length === 0) return false;
  const commentText = Array.isArray(task.comments)
    ? task.comments.map((item) => item.text || "").join(" ")
    : "";
  const checklistText = Array.isArray(task.checklist)
    ? task.checklist.map((item) => item.text || "").join(" ")
    : "";
  const searchableText = normalizeNameKey(
    [task.title, task.notes, commentText, checklistText]
      .filter(Boolean)
      .join(" "),
  );
  if (!searchableText) return false;
  return keywords.some((keyword) => searchableText.includes(keyword));
};


export const getManagerLinkedUserMatches = (manager = {}, users = []) => {
  const managerUserId = String(manager.userId || "").trim();
  const managerAuthUid = managerUserId.startsWith("auth_")
    ? managerUserId.slice(5)
    : managerUserId;
  const managerEmail = normalizeEmail(manager.email);

  const explicitMatches = users.filter((user) => {
    const userId = String(user.id || "").trim();
    const userAuthUid = String(user.authUid || "").trim();
    return (
      managerUserId &&
      (userId === managerUserId ||
        userAuthUid === managerUserId ||
        userId === `auth_${managerAuthUid}` ||
        (userAuthUid && `auth_${userAuthUid}` === managerUserId))
    );
  });
  if (explicitMatches.length > 0) return explicitMatches;

  const linkedMatches = users.filter(
    (user) => manager.id && user.linkedManagerId === manager.id,
  );
  if (linkedMatches.length > 0) return linkedMatches;

  if (!managerEmail) return [];
  return users.filter((user) => normalizeEmail(user.email) === managerEmail);
};

export const isManagerLinkedToInactiveUser = (manager = {}, users = []) => {
  const matches = getManagerLinkedUserMatches(manager, users);
  if (matches.length === 0) return false;
  return matches.some((user) => user.isActive === false);
};

export const buildManagerRankingStats = ({
  managers = [],
  users = [],
  clients = [],
  accountTasks = [],
  rankingSettings = DEFAULT_RANKING_SETTINGS,
  rankingPeriod = getRankingMonthPeriod(),
}) => {
  const rules = sanitizeRankingSettings(rankingSettings).manager;
  const todayStr = getHondurasTodayStr();
  const creativityKeywords = getRankingKeywords(rules.creativityKeywords);
  const rankingManagers = managers.filter(
    (manager) => !isManagerLinkedToInactiveUser(manager, users),
  );

  return rankingManagers
    .map((manager) => {
      const mTasks = accountTasks.filter(
        (task) =>
          task.contextId === manager.id &&
          isDateWithinPeriod(task.date, rankingPeriod),
      );
      const completedTasksArr = mTasks.filter(isAccountTaskDone);
      let taskScore = 0;
      let taskScoreMax = 0;
      let completionScore = 0;
      let completionScoreMax = 0;
      let efficiencyScore = 0;
      let efficiencyScoreMax = 0;
      let onTimeCount = 0;
      let earlyCount = 0;
      let fastTurnaroundCount = 0;
      let overdueCount = 0;

      mTasks.forEach((task) => {
        const hierarchy = getAccountTaskHierarchyId(task);
        taskScoreMax += Math.max(
          0,
          rules.taskPoints[hierarchy] ?? rules.taskPoints.p2,
        );
        taskScoreMax += Math.max(0, rules.publishedBonus);
        completionScoreMax += Math.max(0, rules.workflowStepPoints);
        efficiencyScoreMax +=
          Math.max(0, rules.onTimeBonus) +
          Math.max(0, rules.earlyDeliveryBonus) +
          Math.max(0, rules.fastTurnaroundBonus);
      });

      completedTasksArr.forEach((task) => {
        const hierarchy = getAccountTaskHierarchyId(task);
        taskScore += rules.taskPoints[hierarchy] ?? rules.taskPoints.p2;
        if (task.status === "publicado") taskScore += rules.publishedBonus;
        completionScore += rules.workflowStepPoints;

        const completionIso = getTaskCompletionIso(task);
        const onTime = isCompletionOnTime(task, completionIso);
        if (onTime) {
          efficiencyScore += rules.onTimeBonus;
          onTimeCount++;
        } else if (normalizeDateOnlyString(task.date) && completionIso) {
          efficiencyScore += rules.overduePenalty;
          overdueCount++;
        }

        if (
          isCompletionEarly(task, completionIso, rules.earlyDeliveryCutoffHour)
        ) {
          efficiencyScore += rules.earlyDeliveryBonus;
          earlyCount++;
        }

        const turnaroundHours = getHoursBetween(task.createdAt, completionIso);
        if (
          rules.fastTurnaroundHours > 0 &&
          turnaroundHours !== null &&
          turnaroundHours <= rules.fastTurnaroundHours
        ) {
          efficiencyScore += rules.fastTurnaroundBonus;
          fastTurnaroundCount++;
        }
      });

      mTasks
        .filter(
          (task) =>
            !isAccountTaskDone(task) &&
            isDateBeforeDateString(task.date, todayStr),
        )
        .forEach(() => {
          efficiencyScore += rules.overduePenalty;
          overdueCount++;
        });

      const tasksByDate = mTasks.reduce((acc, task) => {
        const date = normalizeDateOnlyString(task.date);
        if (!date) return acc;
        if (!acc.has(date)) acc.set(date, []);
        acc.get(date).push(task);
        return acc;
      }, new Map());
      let batchBonusCount = 0;
      tasksByDate.forEach((items) => {
        const differentClients = new Set(
          items.map((task) => task.clientId).filter(Boolean),
        ).size;
        if (differentClients < rules.batchDifferentClientCount) return;
        if (items.length >= rules.batchEarlyCompletedCount) {
          efficiencyScoreMax += Math.max(0, rules.batchEarlyBonus);
        }
        const earlyCompleted = items.filter(
          (task) =>
            isAccountTaskDone(task) &&
            isCompletionEarly(
              task,
              getTaskCompletionIso(task),
              rules.earlyDeliveryCutoffHour,
            ),
        ).length;
        if (earlyCompleted >= rules.batchEarlyCompletedCount) {
          efficiencyScore += rules.batchEarlyBonus;
          batchBonusCount++;
        }
      });

      const monthlyClientCount = new Set(
        mTasks.map((task) => task.clientId).filter(Boolean),
      ).size;
      const workflowTotal = mTasks.length;
      const workflowCompleted = completedTasksArr.length;

      const plannedTasks = mTasks.filter((task) =>
        isTaskPlannedAhead(task, rules.planningLeadDays),
      ).length;
      const planningScore = Math.min(
        plannedTasks * rules.planningTaskPoints,
        rules.planningMaxPoints,
      );
      const planningScoreMax = Math.min(
        mTasks.length * Math.max(0, rules.planningTaskPoints),
        Math.max(0, rules.planningMaxPoints),
      );
      const creativitySignals = mTasks.filter((task) =>
        hasCreativitySignal(task, creativityKeywords),
      ).length;
      const creativityScore = Math.min(
        creativitySignals * rules.creativityKeywordPoints,
        rules.creativityMaxPoints,
      );
      const creativityScoreMax = Math.min(
        mTasks.length * Math.max(0, rules.creativityKeywordPoints),
        Math.max(0, rules.creativityMaxPoints),
      );
      const rawScore = Math.round(
        taskScore +
          completionScore +
          efficiencyScore +
          planningScore +
          creativityScore,
      );
      const maxScore = Math.round(
        taskScoreMax +
          completionScoreMax +
          efficiencyScoreMax +
          planningScoreMax +
          creativityScoreMax,
      );
      const finalScore = toKpiPercent(rawScore, maxScore);
      const mappedColorName =
        LEGACY_COLOR_MAP[manager.color] || manager.color || "slate";

      return {
        ...manager,
        mappedColor: mappedColorName,
        totalTasks: mTasks.length,
        completedTasks: completedTasksArr.length,
        totalClients: monthlyClientCount,
        workflowTotal,
        workflowCompleted,
        taskScore,
        taskScoreMax,
        completionScore,
        completionScoreMax,
        efficiencyScore,
        efficiencyScoreMax,
        planningScore,
        planningScoreMax,
        creativityScore,
        creativityScoreMax,
        rawScore,
        maxScore,
        score: finalScore,
        taskPercent: toKpiPercent(taskScore, taskScoreMax),
        completionPercent: toKpiPercent(completionScore, completionScoreMax),
        efficiencyPercent: toKpiPercent(efficiencyScore, efficiencyScoreMax),
        planningCreativityPercent: toKpiPercent(
          planningScore + creativityScore,
          planningScoreMax + creativityScoreMax,
        ),
        onTimeCount,
        earlyCount,
        fastTurnaroundCount,
        overdueCount,
        batchBonusCount,
        plannedTasks,
        creativitySignals,
        rankingPeriod,
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.rawScore - a.rawScore ||
        b.efficiencyScore - a.efficiencyScore ||
        a.name.localeCompare(b.name),
    );
};
