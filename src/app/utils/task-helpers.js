import { MONTH_NAMES } from "../constants/app.constants.js";
import {
  compareDateOnlyStrings,
  getHondurasTodayStr,
  normalizeDateOnlyString,
} from "./date.js";

export const isCompletedStatus = (status) =>
  ["publicado", "aprobado", "cerrado"].includes(status);

export const getEditingHierarchyId = (task = {}) => {
  if (task.hierarchy) return task.hierarchy;
  if (task.priority === "urgente") return "p1";
  if (task.priority === "recurrente") return "p3";
  return "p2";
};

export const getRankingMonthPeriod = (referenceDate = getHondurasTodayStr()) => {
  const normalizedDate =
    normalizeDateOnlyString(referenceDate) || getHondurasTodayStr();
  const [yearValue, monthValue] = normalizedDate.split("-").map(Number);
  const year = Number.isFinite(yearValue)
    ? yearValue
    : new Date().getFullYear();
  const month = Number.isFinite(monthValue)
    ? Math.max(1, Math.min(12, monthValue))
    : 1;
  const monthText = String(month).padStart(2, "0");
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return {
    year,
    month,
    start: `${year}-${monthText}-01`,
    end: `${year}-${monthText}-${String(lastDay).padStart(2, "0")}`,
    label: `${MONTH_NAMES[month - 1]} ${year}`,
  };
};

export const isDateWithinPeriod = (value = "", period = getRankingMonthPeriod()) => {
  const normalizedDate = normalizeDateOnlyString(value);
  if (!normalizedDate) return false;
  return (
    compareDateOnlyStrings(normalizedDate, period.start) >= 0 &&
    compareDateOnlyStrings(normalizedDate, period.end) <= 0
  );
};

export const isAccountTaskDone = (task = {}) =>
  ["aprobado_internamente", "publicado"].includes(task.status);

export const isTaskAssignedToProfile = (task, profile, contextIds = []) => {
  const profileId = profile?.id;
  if (!profileId) return false;
  if (task?.assigneeUserId && task.assigneeUserId === profileId) return true;
  const profileContextIds = contextIds.filter(Boolean);
  if (profileContextIds.includes(task?.contextId)) return true;
  const taskAssignees = Array.isArray(task?.assignees)
    ? task.assignees.filter(Boolean)
    : [];
  return taskAssignees.some(
    (assigneeId) =>
      assigneeId === profileId || profileContextIds.includes(assigneeId),
  );
};
