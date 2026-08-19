import { nowIso } from "./text.js";

export const PENDING_TASK_STATUS_UPDATES_KEY = "cluster_pending_task_status_updates";
export const RETRYABLE_FIRESTORE_ERROR_CODES = new Set([
  "aborted",
  "cancelled",
  "data-loss",
  "deadline-exceeded",
  "failed-precondition",
  "internal",
  "resource-exhausted",
  "unavailable",
]);

export const readPendingTaskStatusUpdates = () => {
  if (typeof window === "undefined") return [];
  try {
    const rawValue = window.localStorage.getItem(
      PENDING_TASK_STATUS_UPDATES_KEY,
    );
    if (!rawValue) return [];
    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) return [];
    return parsedValue.filter(
      (item) => item?.collectionName && item?.taskId && item?.status,
    );
  } catch (error) {
    console.warn("No se pudo leer la cola local de cambios de estado:", error);
    return [];
  }
};
export const writePendingTaskStatusUpdates = (items = []) => {
  if (typeof window === "undefined") return;
  if (!Array.isArray(items) || items.length === 0) {
    window.localStorage.removeItem(PENDING_TASK_STATUS_UPDATES_KEY);
    return;
  }
  window.localStorage.setItem(
    PENDING_TASK_STATUS_UPDATES_KEY,
    JSON.stringify(items),
  );
};
export const queuePendingTaskStatusUpdate = ({
  collectionName,
  taskId,
  status,
  updatedAt = nowIso(),
  patch = {},
  mutationId = `${taskId}:${updatedAt}:${status}`,
}) => {
  const nextItems = readPendingTaskStatusUpdates()
    .filter(
      (item) =>
        !(item.collectionName === collectionName && item.taskId === taskId),
    )
    .concat({
      collectionName,
      taskId,
      status,
      updatedAt,
      patch,
      mutationId,
      queuedAt: nowIso(),
    });
  writePendingTaskStatusUpdates(nextItems);
  return mutationId;
};
export const clearPendingTaskStatusUpdate = ({
  collectionName,
  taskId,
  mutationId = "",
}) => {
  const nextItems = readPendingTaskStatusUpdates().filter(
    (item) =>
      !(
        item.collectionName === collectionName &&
        item.taskId === taskId &&
        (!mutationId || item.mutationId === mutationId)
      ),
  );
  writePendingTaskStatusUpdates(nextItems);
};
export const getFirestoreErrorCode = (error) =>
  String(error?.code || "").replace(/^firestore\//, "");
export const shouldRetryTaskStatusUpdate = (error) => {
  if (typeof navigator !== "undefined" && navigator.onLine === false)
    return true;
  const code = getFirestoreErrorCode(error);
  return !code || RETRYABLE_FIRESTORE_ERROR_CODES.has(code);
};
