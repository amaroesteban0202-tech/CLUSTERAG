// src/app/main.jsx
import React, { useState, useEffect, useRef, useId } from "react";
import { createRoot } from "react-dom/client";
import { App as CapacitorApp } from "@capacitor/app";
import {
  SquaresFour as LayoutDashboard,
  Users,
  CalendarBlank as CalendarIcon,
  Plus,
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
  X,
  CheckCircle as CheckCircle2,
  Circle,
  ArrowSquareOut as ExternalLink,
  Briefcase,
  UserCircle as UserCircle2,
  SpinnerGap as Loader2,
  Trash as Trash2,
  VideoCamera as Video,
  ArrowRight,
  UserPlus,
  MonitorPlay,
  MagnifyingGlass as Search,
  List as Menu,
  PenNib as PenTool,
  ListBullets as LayoutList,
  CalendarDots as CalendarDays,
  Warning as AlertTriangle,
  Smiley as Smile,
  SmileyMeh as Meh,
  SmileySad as Frown,
  InstagramLogo as Instagram,
  PencilSimple as Edit,
  Tray as Inbox,
  Moon,
  Sun,
  CursorClick as MousePointerClick,
  Fire as Flame,
  TreeStructure as ListTree,
  CaretDown as ChevronDown,
  CaretUp as ChevronUp,
  Sparkle as Sparkles,
  Trophy,
  Medal,
  ChartBar as BarChart3,
  ShieldCheck,
  SignIn as LogIn,
  SignOut as LogOut,
  ClipboardText as ClipboardList,
  Lock,
  Envelope as Mail,
  TextAlignLeft as AlignLeft,
  Calendar,
  CalendarX as CalendarOff,
  CalendarPlus,
  CalendarDots as CalendarRange,
  Check,
  CheckSquare,
  Clock,
  FileText,
  ChatText as MessageSquare,
  Pencil,
  Play,
  FloppyDisk as Save,
  PaperPlaneTilt as Send,
  Square,
  Timer,
  User,
  UserMinus as UserX,
  Lightning as Zap,
  PauseCircle,
  DotsThree as MoreHorizontal,
  DotsSixVertical as GripVertical
} from "@phosphor-icons/react";
import {
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  completeGoogleRedirectIfNeeded,
  signOut as firebaseSignOut
} from "firebase/auth";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  writeBatch,
  setDoc,
  getDocs,
  getDoc,
  loadAllTaskHistory
} from "firebase/firestore";
import { auth, db, appId } from "/src/app/config/firebase.js";
import {
  TAILWIND_SAFELIST,
  MONTH_NAMES,
  PERSON_COLORS,
  ACCOUNT_COLORS,
  EDITOR_COLORS,
  LEGACY_COLOR_MAP,
  ROLE_DEFINITIONS,
  SUPER_ADMIN_EMAILS,
  DEFAULT_MANAGEMENT_TEAM,
  DEFAULT_EDITORS_TEAM,
  EDITING_HIERARCHY_OPTIONS
} from "/src/app/constants/app.constants.js";
import {
  compareDateOnlyStrings,
  getDateOnlyDiffDays,
  getHondurasTodayStr,
  isDateBeforeDateString,
  normalizeDateOnlyString,
  resolveStoredTaskRoomDate
} from "/src/app/utils/date.js";
import {
  KPI_MIN_TASKS,
  buildManagerKpiStats,
  isEditingDelivered,
  isEditingActionable,
  isWorkflowCompleted,
  normalizeEditingWorkflowStatus,
  rankPendingEditingTasks
} from "/src/app/utils/kpi.js";
var IconsMap = {
  LayoutDashboard,
  Users,
  CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Circle,
  ExternalLink,
  Briefcase,
  UserCircle2,
  Loader2,
  Trash2,
  Video,
  ArrowRight,
  UserPlus,
  MonitorPlay,
  Search,
  Menu,
  PenTool,
  LayoutList,
  CalendarDays,
  AlertTriangle,
  Smile,
  Meh,
  Frown,
  Instagram,
  Edit,
  Inbox,
  Moon,
  Sun,
  MousePointerClick,
  Flame,
  ListTree,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Trophy,
  Medal,
  BarChart3,
  ShieldCheck,
  LogIn,
  LogOut,
  ClipboardList,
  Lock,
  Mail,
  AlignLeft,
  Calendar,
  CalendarOff,
  CalendarPlus,
  CalendarRange,
  Check,
  CheckSquare,
  Clock,
  FileText,
  MessageSquare,
  Pencil,
  Play,
  Save,
  Send,
  Square,
  Timer,
  User,
  UserX,
  Zap,
  PauseCircle,
  MoreHorizontal,
  GripVertical
};
var Icon = ({ name, size = 18, className = "", ...props }) => {
  const PhosphorIcon = IconsMap[name];
  const {
    "aria-hidden": ariaHidden = true,
    focusable = false,
    ...iconProps
  } = props;
  return PhosphorIcon ? /* @__PURE__ */ React.createElement(
    PhosphorIcon,
    {
      size,
      weight: "bold",
      className,
      "aria-hidden": ariaHidden,
      focusable,
      ...iconProps
    }
  ) : null;
};
var FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])'
].join(",");
var slugifyId = (value = "") => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
var useDialogA11y = (isOpen, onClose) => {
  const dialogRef = useRef(null);
  const previousActiveElementRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return void 0;
    previousActiveElementRef.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = dialog.querySelector(FOCUSABLE_SELECTOR);
      (focusable || dialog).focus?.();
    }, 30);
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll(FOCUSABLE_SELECTOR)
      ).filter(
        (element) => element.offsetParent !== null || element === document.activeElement
      );
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus?.();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      previousActiveElementRef.current?.focus?.();
    };
  }, [isOpen]);
  return dialogRef;
};
var AgencyLogo = ({ className }) => {
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `agency-logo relative overflow-hidden rounded-md bg-white ${className}`
    },
    /* @__PURE__ */ React.createElement(
      "img",
      {
        src: "/src/app/assets/cluster-symbol.webp",
        alt: "",
        "aria-hidden": "true",
        className: "absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
      }
    )
  );
};
var GOOGLE_PROVIDER = auth ? new GoogleAuthProvider() : null;
if (GOOGLE_PROVIDER)
  GOOGLE_PROVIDER.setCustomParameters({ prompt: "select_account" });
var NATIVE_GOOGLE_TOKEN_STORAGE_KEY = "cluster_native_google_token";
var VIEW_PERMISSIONS = {
  dashboard: "view_dashboard",
  clients: "view_clients",
  "client-detail": "view_clients",
  managers: "view_managers",
  "manager-detail": "view_managers",
  editors: "view_editors",
  "editor-detail": "view_editors",
  "account-room": "view_account_room",
  editions: "view_editions_room",
  "management-room": "view_management_room",
  "general-calendar": "view_general_calendar",
  calendar: "view_calendar",
  "control-center": "view_users",
  reports: "view_dashboard"
};
var normalizeEmail = (value = "") => String(value || "").trim().toLowerCase();
var normalizeNameKey = (value = "") => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
var normalizeTimeValue = (value = "") => {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "";
  const [, hours, minutes] = match;
  const normalizedHours = hours.padStart(2, "0");
  if (Number(normalizedHours) > 23 || Number(minutes) > 59) return "";
  return `${normalizedHours}:${minutes}`;
};
var nowIso = () => (/* @__PURE__ */ new Date()).toISOString();
var EMAIL_LINK_STORAGE_KEY = "cluster_email_link_for_sign_in";
var PENDING_TASK_STATUS_UPDATES_KEY = "cluster_pending_task_status_updates";
var RETRYABLE_FIRESTORE_ERROR_CODES = /* @__PURE__ */ new Set([
  "aborted",
  "cancelled",
  "data-loss",
  "deadline-exceeded",
  "failed-precondition",
  "internal",
  "resource-exhausted",
  "unavailable"
]);
var MANAGEMENT_DIRECTORY = DEFAULT_MANAGEMENT_TEAM.map((member) => ({
  ...member,
  directoryKey: normalizeNameKey(member.name)
}));
var readPendingTaskStatusUpdates = () => {
  if (typeof window === "undefined") return [];
  try {
    const rawValue = window.localStorage.getItem(
      PENDING_TASK_STATUS_UPDATES_KEY
    );
    if (!rawValue) return [];
    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) return [];
    return parsedValue.filter(
      (item) => item?.collectionName && item?.taskId && item?.status
    );
  } catch (error) {
    console.warn("No se pudo leer la cola local de cambios de estado:", error);
    return [];
  }
};
var writePendingTaskStatusUpdates = (items = []) => {
  if (typeof window === "undefined") return;
  if (!Array.isArray(items) || items.length === 0) {
    window.localStorage.removeItem(PENDING_TASK_STATUS_UPDATES_KEY);
    return;
  }
  window.localStorage.setItem(
    PENDING_TASK_STATUS_UPDATES_KEY,
    JSON.stringify(items)
  );
};
var queuePendingTaskStatusUpdate = ({
  collectionName,
  taskId,
  status,
  updatedAt = nowIso(),
  patch = {},
  mutationId = `${taskId}:${updatedAt}:${status}`
}) => {
  const nextItems = readPendingTaskStatusUpdates().filter(
    (item) => !(item.collectionName === collectionName && item.taskId === taskId)
  ).concat({
    collectionName,
    taskId,
    status,
    updatedAt,
    patch,
    mutationId,
    queuedAt: nowIso()
  });
  writePendingTaskStatusUpdates(nextItems);
  return mutationId;
};
var clearPendingTaskStatusUpdate = ({
  collectionName,
  taskId,
  mutationId = ""
}) => {
  const nextItems = readPendingTaskStatusUpdates().filter(
    (item) => !(item.collectionName === collectionName && item.taskId === taskId && (!mutationId || item.mutationId === mutationId))
  );
  writePendingTaskStatusUpdates(nextItems);
};
var getFirestoreErrorCode = (error) => String(error?.code || "").replace(/^firestore\//, "");
var shouldRetryTaskStatusUpdate = (error) => {
  if (typeof navigator !== "undefined" && navigator.onLine === false)
    return true;
  const code = getFirestoreErrorCode(error);
  return !code || RETRYABLE_FIRESTORE_ERROR_CODES.has(code);
};
var getManagementDirectoryKey = (value = "") => {
  const sourceName = typeof value === "string" ? value : value?.name || "";
  const normalized = normalizeNameKey(sourceName);
  if (!normalized) return "";
  const exactMatch = MANAGEMENT_DIRECTORY.find(
    (member) => normalized === member.directoryKey
  );
  if (exactMatch) return exactMatch.directoryKey;
  const aliasMatch = MANAGEMENT_DIRECTORY.find(
    (member) => normalized.startsWith(`${member.directoryKey} `)
  );
  return aliasMatch?.directoryKey || "";
};
var getManagementDirectoryMeta = (value = "") => {
  const key = getManagementDirectoryKey(value);
  return MANAGEMENT_DIRECTORY.find((member) => member.directoryKey === key) || null;
};
var getResolvedManagementEmail = (record = {}) => {
  const directEmail = normalizeEmail(record.email);
  if (directEmail) return directEmail;
  return normalizeEmail(getManagementDirectoryMeta(record)?.email);
};
var buildRecoveredManagerId = (name = "") => {
  const key = normalizeNameKey(name).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return key ? `recovered_manager_${key}` : "";
};
var findDirectoryMemberByName = (name = "") => {
  const key = normalizeNameKey(name);
  return MANAGEMENT_DIRECTORY.find((member) => member.directoryKey === key) || null;
};
var getUserRolePriority = (role = "") => {
  const priorities = {
    super_admin: 500,
    operations: 400,
    management: 350,
    manager: 300,
    editor: 250,
    viewer: 100
  };
  return priorities[role] || 200;
};
var getVerificationPriority = (record = {}) => {
  if (record.emailVerified === true || record.emailVerification?.status === "verified")
    return 5;
  if (record.emailVerification?.status === "sent") return 4;
  if (record.emailVerification?.status === "pending") return 3;
  if (record.emailVerification?.status === "error") return 2;
  if (normalizeEmail(record.email)) return 1;
  return 0;
};
var getUserRecordScore = (record = {}, referenceCount = 0) => referenceCount * 1e3 + (normalizeEmail(record.email) ? 220 : 0) + (record.authUid ? 180 : 0) + (record.isActive === false ? 0 : 20) + (record.seeded ? 5 : 10) + getVerificationPriority(record) * 25 + getUserRolePriority(record.role);
var buildDuplicateUserGroups = (users = []) => {
  const userById = new Map(users.map((item) => [item.id, item]));
  const adjacency = new Map(users.map((item) => [item.id, /* @__PURE__ */ new Set()]));
  const buckets = /* @__PURE__ */ new Map();
  const addToken = (token, userId) => {
    if (!token) return;
    if (!buckets.has(token)) buckets.set(token, []);
    buckets.get(token).push(userId);
  };
  users.forEach((item) => {
    const email = normalizeEmail(item.email);
    if (email) addToken(`email:${email}`, item.id);
    if (item.role === "management") {
      const managementKey = item.managementKey || getManagementDirectoryKey(item);
      if (managementKey) addToken(`management:${managementKey}`, item.id);
    }
  });
  buckets.forEach((ids) => {
    if (ids.length < 2) return;
    const [firstId, ...restIds] = ids;
    restIds.forEach((otherId) => {
      adjacency.get(firstId)?.add(otherId);
      adjacency.get(otherId)?.add(firstId);
    });
  });
  const visited = /* @__PURE__ */ new Set();
  const groups = [];
  users.forEach((item) => {
    if (visited.has(item.id)) return;
    const stack = [item.id];
    const component = [];
    while (stack.length > 0) {
      const currentId = stack.pop();
      if (!currentId || visited.has(currentId)) continue;
      visited.add(currentId);
      component.push(userById.get(currentId));
      adjacency.get(currentId)?.forEach((nextId) => {
        if (!visited.has(nextId)) stack.push(nextId);
      });
    }
    if (component.length > 1) groups.push(component.filter(Boolean));
  });
  return groups;
};
var chooseCanonicalUserRecord = (group = [], referenceCounts = /* @__PURE__ */ new Map()) => [...group].sort((left, right) => {
  const scoreDelta = getUserRecordScore(right, referenceCounts.get(right.id) || 0) - getUserRecordScore(left, referenceCounts.get(left.id) || 0);
  if (scoreDelta !== 0) return scoreDelta;
  const leftCreatedAt = String(left.createdAt || "");
  const rightCreatedAt = String(right.createdAt || "");
  const createdAtDelta = leftCreatedAt.localeCompare(rightCreatedAt);
  if (createdAtDelta !== 0) return createdAtDelta;
  return String(left.id || "").localeCompare(String(right.id || ""));
})[0] || null;
var getRoleMeta = (role) => ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS.viewer;
var getVerificationMeta = (record) => {
  const safeRecord = record || {};
  if (!normalizeEmail(safeRecord.email))
    return { label: "Sin correo", color: "slate", isVerified: false };
  if (safeRecord.emailVerified === true || safeRecord.emailVerification?.status === "verified")
    return { label: "Verificado", color: "emerald", isVerified: true };
  if (safeRecord.emailVerification?.status === "error")
    return { label: "Error de envio", color: "red", isVerified: false };
  if (safeRecord.emailVerification?.status === "sent")
    return { label: "Verificacion enviada", color: "amber", isVerified: false };
  if (safeRecord.emailVerification?.status === "pending")
    return { label: "Pendiente verificar", color: "amber", isVerified: false };
  return { label: "Con correo", color: "blue", isVerified: false };
};
var getLinkedProfileLabels = (record) => {
  const safeRecord = record || {};
  const labels = [];
  if (safeRecord.linkedManagerId) labels.push("Manager");
  if (safeRecord.linkedEditorId) labels.push("Editor");
  if (safeRecord.role === "management") labels.push("Gestion");
  return labels;
};
var getGoogleAuthErrorMessage = (error) => {
  const code = String(error?.code || "").trim();
  if (code === "auth/unauthorized-domain")
    return "Google bloqueado: agrega 127.0.0.1 en Firebase Authorized domains o entra por http://localhost:5000.";
  if (code === "auth/operation-not-allowed")
    return "Google Sign-In no esta habilitado en Firebase Authentication.";
  if (code === "auth/popup-blocked")
    return "El navegador bloqueo el popup de Google.";
  if (code === "auth/popup-closed-by-user")
    return "El popup de Google se cerro antes de completar el login.";
  if (code === "auth/cancelled-popup-request")
    return "Ya habia un popup de autenticacion abierto.";
  return `No se pudo iniciar sesion con Google${code ? ` (${code})` : ""}.`;
};
var getEmailLinkAuthErrorMessage = (error, phase = "send") => {
  const code = String(error?.code || "").trim();
  if (code === "auth/unauthorized-domain" || code === "auth/unauthorized-continue-uri" || code === "auth/invalid-continue-uri") {
    return "Firebase bloqueo el enlace: agrega este dominio en Authorized domains de Firebase Authentication.";
  }
  if (code === "auth/operation-not-allowed") {
    return "Email link no esta habilitado en Firebase Authentication.";
  }
  if (code === "auth/invalid-email") {
    return "El correo no es valido.";
  }
  if (code === "auth/missing-client-config") {
    return "Falta configurar el SDK web de Firebase para enviar accesos por correo.";
  }
  if (phase === "complete" && (code === "auth/invalid-action-code" || code === "auth/expired-action-code")) {
    return "El enlace ya no es valido o vencio.";
  }
  if (phase === "complete" && code === "auth/user-disabled") {
    return "La cuenta asociada esta deshabilitada.";
  }
  if (phase === "complete" && code === "auth/user-not-found") {
    return "No existe una cuenta de Firebase para ese correo.";
  }
  return phase === "complete" ? `No se pudo completar el acceso por correo${code ? ` (${code})` : ""}.` : `No se pudo enviar el correo de acceso${code ? ` (${code})` : ""}.`;
};
var buildEmailLinkActionUrl = () => {
  if (typeof window === "undefined") return "";
  const currentUrl = new URL(window.location.href);
  const target = new URL(window.location.origin + window.location.pathname);
  const firestoreTarget = currentUrl.searchParams.get("firestore");
  if (firestoreTarget) target.searchParams.set("firestore", firestoreTarget);
  target.searchParams.set("email_link", "pending");
  return target.toString();
};
var buildEmailLinkActionCodeSettings = () => ({
  url: buildEmailLinkActionUrl(),
  handleCodeInApp: true
});
var buildEmailLinkReturnUrl = (href = "") => {
  if (typeof window === "undefined") return null;
  const currentUrl = new URL(href || window.location.href);
  const continueUrl = currentUrl.searchParams.get("continueUrl");
  let nextUrl = new URL(window.location.origin + window.location.pathname);
  if (continueUrl) {
    try {
      nextUrl = new URL(continueUrl);
    } catch (error) {
      console.warn("No se pudo leer continueUrl del email link:", error);
    }
  } else {
    const firestoreTarget = currentUrl.searchParams.get("firestore");
    if (firestoreTarget) nextUrl.searchParams.set("firestore", firestoreTarget);
  }
  ["email_link", "mode", "oobCode", "apiKey", "lang", "continueUrl"].forEach(
    (param) => nextUrl.searchParams.delete(param)
  );
  return nextUrl;
};
var getAuthSource = (authUser = null) => {
  const providerIds = (authUser?.providerData || []).map((provider) => provider?.providerId).filter(Boolean);
  if (providerIds.includes("google.com")) return "google";
  if (providerIds.includes("password")) return "email_link";
  if (authUser?.isAnonymous) return "anonymous";
  return "auth";
};
var userHasPermission = (profile, permission) => {
  if (!permission) return true;
  if (!profile || profile.isActive === false) return false;
  const permissions = getRoleMeta(profile.role).permissions || [];
  return permissions.includes("*") || permissions.includes(permission);
};
var canAccessView = (profile, view) => userHasPermission(profile, VIEW_PERMISSIONS[view]);
var isCompletedStatus = (status) => ["publicado", "aprobado", "cerrado"].includes(status);
var getEditingHierarchyId = (task = {}) => {
  if (task.hierarchy) return task.hierarchy;
  if (task.priority === "urgente") return "p1";
  if (task.priority === "recurrente") return "p3";
  return "p2";
};
var getStatusTimestampPatch = (task = {}, newStatus = "", stamp = nowIso(), actorUserId = "", workflowType = "") => {
  const statusTimestamps = {
    ...task.statusTimestamps || {},
    [newStatus]: task.statusTimestamps?.[newStatus] || stamp
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
      "publicado"
    ].includes(nextEditingStatus);
    const isReturnedToEditing = ["revision_interna", "aprobado", "publicado"].includes(
      previousEditingStatus
    ) && ["editar", "en_edicion"].includes(nextEditingStatus);
    if (isEditorDelivery && !task.editorCompletedAt) {
      patch.editorCompletedAt = stamp;
      patch.editorCompletedByUserId = actorUserId || "";
      patch.editorOwnerAtCompletionId = task.contextId || task.assigneeUserId || "";
      patch.editorAssigneeUserAtCompletionId = task.assigneeUserId || "";
      patch.editorAssigneesAtCompletion = Array.isArray(task.assignees) ? task.assignees.filter(Boolean) : [];
      patch.editorDueDateAtCompletion = normalizeDateOnlyString(task.date);
    }
    if (isReturnedToEditing && task.editorCompletedAt) {
      patch.editorReworkCount = Number(task.editorReworkCount || 0) + 1;
      patch.lastEditorReworkAt = stamp;
    }
  }
  return patch;
};
var getRankingMonthPeriod = (referenceDate = getHondurasTodayStr()) => {
  const normalizedDate = normalizeDateOnlyString(referenceDate) || getHondurasTodayStr();
  const [yearValue, monthValue] = normalizedDate.split("-").map(Number);
  const year = Number.isFinite(yearValue) ? yearValue : (/* @__PURE__ */ new Date()).getFullYear();
  const month = Number.isFinite(monthValue) ? Math.max(1, Math.min(12, monthValue)) : 1;
  const monthText = String(month).padStart(2, "0");
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    year,
    month,
    start: `${year}-${monthText}-01`,
    end: `${year}-${monthText}-${String(lastDay).padStart(2, "0")}`,
    label: `${MONTH_NAMES[month - 1]} ${year}`
  };
};
var isDateWithinPeriod = (value = "", period = getRankingMonthPeriod()) => {
  const normalizedDate = normalizeDateOnlyString(value);
  if (!normalizedDate) return false;
  return compareDateOnlyStrings(normalizedDate, period.start) >= 0 && compareDateOnlyStrings(normalizedDate, period.end) <= 0;
};
var isAccountTaskDone = (task = {}) => ["aprobado_internamente", "publicado"].includes(task.status);
var getManagerLinkedUserMatches = (manager = {}, users = []) => {
  const managerUserId = String(manager.userId || "").trim();
  const managerAuthUid = managerUserId.startsWith("auth_") ? managerUserId.slice(5) : managerUserId;
  const managerEmail = normalizeEmail(manager.email);
  const explicitMatches = users.filter((user) => {
    const userId = String(user.id || "").trim();
    const userAuthUid = String(user.authUid || "").trim();
    return managerUserId && (userId === managerUserId || userAuthUid === managerUserId || userId === `auth_${managerAuthUid}` || userAuthUid && `auth_${userAuthUid}` === managerUserId);
  });
  if (explicitMatches.length > 0) return explicitMatches;
  const linkedMatches = users.filter(
    (user) => manager.id && user.linkedManagerId === manager.id
  );
  if (linkedMatches.length > 0) return linkedMatches;
  if (!managerEmail) return [];
  return users.filter((user) => normalizeEmail(user.email) === managerEmail);
};
var isManagerLinkedToInactiveUser = (manager = {}, users = []) => {
  const matches = getManagerLinkedUserMatches(manager, users);
  if (matches.length === 0) return false;
  return matches.some((user) => user.isActive === false);
};
var isTaskAssignedToProfile = (task, profile, contextIds = []) => {
  const profileId = profile?.id;
  if (!profileId) return false;
  if (task?.assigneeUserId && task.assigneeUserId === profileId) return true;
  return contextIds.filter(Boolean).includes(task?.contextId);
};
var TASK_ROOM_STATE_VERSION = 3;
var getTaskRoomDefaults = ({ preferMine = false } = {}) => ({
  currentDate: getHondurasTodayStr(),
  filterMode: "all",
  ownershipFilter: preferMine ? "mine" : "all",
  rangeStart: getHondurasTodayStr(),
  rangeEnd: getHondurasTodayStr()
});
var readTaskRoomState = (storageKey, options = {}) => {
  const defaults = getTaskRoomDefaults(options);
  if (typeof window === "undefined") return defaults;
  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) return defaults;
    const parsedValue = JSON.parse(rawValue);
    const parsedState = {
      currentDate: resolveStoredTaskRoomDate(
        parsedValue.currentDate,
        parsedValue.savedAt,
        defaults.currentDate
      ),
      filterMode: ["date", "overdue", "all", "range"].includes(
        parsedValue.filterMode
      ) ? parsedValue.filterMode : defaults.filterMode,
      ownershipFilter: ["all", "mine"].includes(parsedValue.ownershipFilter) ? parsedValue.ownershipFilter : defaults.ownershipFilter,
      rangeStart: normalizeDateOnlyString(parsedValue.rangeStart) || defaults.rangeStart,
      rangeEnd: normalizeDateOnlyString(parsedValue.rangeEnd) || defaults.rangeEnd
    };
    const savedVersion = Number(parsedValue.version || 0);
    const wasPersonalized = parsedValue.personalized === true;
    const looksLikeLegacyDefault = (!wasPersonalized || savedVersion < TASK_ROOM_STATE_VERSION) && parsedState.filterMode === "date" && parsedState.ownershipFilter === "all" && compareDateOnlyStrings(parsedState.currentDate, defaults.currentDate) === 0;
    if (looksLikeLegacyDefault) return defaults;
    return parsedState;
  } catch (error) {
    console.warn(`No se pudo leer el estado guardado de ${storageKey}:`, error);
    return defaults;
  }
};
var useTaskRoomState = (storageKey, options = {}) => {
  const preferMine = Boolean(options.preferMine);
  const [roomState, setRoomState] = useState(
    () => readTaskRoomState(storageKey, { preferMine })
  );
  useEffect(() => {
    const nextState = readTaskRoomState(storageKey, { preferMine });
    setRoomState((current) => {
      const hasChanges = nextState.currentDate !== current.currentDate || nextState.filterMode !== current.filterMode || nextState.ownershipFilter !== current.ownershipFilter || nextState.rangeStart !== current.rangeStart || nextState.rangeEnd !== current.rangeEnd;
      return hasChanges ? nextState : current;
    });
  }, [storageKey, preferMine]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        ...roomState,
        currentDate: normalizeDateOnlyString(roomState.currentDate) || getHondurasTodayStr(),
        savedAt: getHondurasTodayStr(),
        version: TASK_ROOM_STATE_VERSION,
        personalized: preferMine
      })
    );
  }, [storageKey, roomState, preferMine]);
  return {
    currentDate: roomState.currentDate,
    filterMode: roomState.filterMode,
    ownershipFilter: roomState.ownershipFilter,
    rangeStart: roomState.rangeStart,
    rangeEnd: roomState.rangeEnd,
    setCurrentDate: (value) => setRoomState((current) => ({
      ...current,
      currentDate: typeof value === "function" ? value(current.currentDate) : value
    })),
    setFilterMode: (value) => setRoomState((current) => ({
      ...current,
      filterMode: typeof value === "function" ? value(current.filterMode) : value
    })),
    setOwnershipFilter: (value) => setRoomState((current) => ({
      ...current,
      ownershipFilter: typeof value === "function" ? value(current.ownershipFilter) : value
    })),
    setRangeStart: (value) => setRoomState((current) => ({
      ...current,
      rangeStart: typeof value === "function" ? value(current.rangeStart) : value
    })),
    setRangeEnd: (value) => setRoomState((current) => ({
      ...current,
      rangeEnd: typeof value === "function" ? value(current.rangeEnd) : value
    }))
  };
};
var EDITING_STATUS_OPTIONS = [
  { id: "editar", label: "Por Editar" },
  { id: "en_edicion", label: "En Edicion" },
  { id: "revision_interna", label: "En Revision" },
  { id: "aprobado", label: "Aprobado" },
  { id: "publicado", label: "Publicado" }
];
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const darkDefaultVersion = "2026-07-charcoal-default";
    const appliedDefaultVersion = localStorage.getItem(
      "cluster_theme_default_version"
    );
    if (appliedDefaultVersion !== darkDefaultVersion) {
      localStorage.setItem("cluster_theme", "dark");
      localStorage.setItem("cluster_theme_default_version", darkDefaultVersion);
      return true;
    }
    return localStorage.getItem("cluster_theme") !== "light";
  });
  const [view, setView] = useState(
    () => localStorage.getItem("cluster_os_view") || "dashboard"
  );
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [isSendingLoginLink, setIsSendingLoginLink] = useState(false);
  const [hasSeededManagementDirectory, setHasSeededManagementDirectory] = useState(false);
  const [hasRecoveredManagerDirectory, setHasRecoveredManagerDirectory] = useState(false);
  const [hasBackfilledIdentityLinks, setHasBackfilledIdentityLinks] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const isReconcilingUsersRef = useRef(false);
  const isBackfillingIdentityLinksRef = useRef(false);
  const isFlushingPendingTaskStatusesRef = useRef(false);
  const lastReconciledDuplicateSignatureRef = useRef("");
  const lastIdentityLinkSyncSignatureRef = useRef("");
  const nativeGoogleTokensSeenRef = useRef(/* @__PURE__ */ new Set());
  const [clients, setClients] = useState([]);
  const [events, setEvents] = useState([]);
  const [managers, setManagers] = useState([]);
  const [editors, setEditors] = useState([]);
  const [editingTasks, setEditingTasks] = useState([]);
  const [accountTasks, setAccountTasks] = useState([]);
  const [managementTasks, setManagementTasks] = useState([]);
  const [taskHistoryLoaded, setTaskHistoryLoaded] = useState(false);
  const [isLoadingTaskHistory, setIsLoadingTaskHistory] = useState(false);
  const [appUsers, setAppUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  useEffect(() => {
    window.__cluster_active_view = view;
    window.dispatchEvent(new Event("cluster:viewchange"));
  }, [view]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedManager, setSelectedManager] = useState(null);
  const [selectedEditor, setSelectedEditor] = useState(null);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: null,
    data: null,
    isEdit: false
  });
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    type: null,
    id: null,
    title: ""
  });
  const [eventAction, setEventAction] = useState({
    isOpen: false,
    event: null,
    type: null
  });
  const [taskDetailConfig, setTaskDetailConfig] = useState({
    isOpen: false,
    task: null,
    type: null
  });
  const [dayDetailsModal, setDayDetailsModal] = useState({
    isOpen: false,
    date: null
  });
  const authEmail = normalizeEmail(user?.email);
  const authEmailMatches = authEmail ? appUsers.filter((item) => normalizeEmail(item.email) === authEmail) : [];
  const handleLoadTaskHistory = async () => {
    if (taskHistoryLoaded || isLoadingTaskHistory) return;
    setIsLoadingTaskHistory(true);
    try {
      await loadAllTaskHistory();
      setTaskHistoryLoaded(true);
      showToast("Historial de tareas cargado.", "success");
    } catch (error) {
      console.error("No se pudo cargar el historial de tareas:", error);
      showToast("No se pudo cargar el historial de tareas.", "error");
    } finally {
      setIsLoadingTaskHistory(false);
    }
  };
  const resolvedAuthProfile = authEmailMatches.length > 0 ? chooseCanonicalUserRecord(authEmailMatches) : null;
  const pendingManagementMember = authEmail ? MANAGEMENT_DIRECTORY.find(
    (item) => normalizeEmail(item.email) === authEmail
  ) : null;
  const pendingMatchedManager = authEmail ? managers.find((item) => normalizeEmail(item.email) === authEmail) : null;
  const pendingMatchedEditor = authEmail ? editors.find((item) => normalizeEmail(item.email) === authEmail) : null;
  const pendingPreAuthorizedEditor = authEmail && !pendingMatchedEditor ? DEFAULT_EDITORS_TEAM.find(
    (item) => normalizeEmail(item.email) === authEmail
  ) : null;
  const pendingRole = !authEmail ? "viewer" : pendingManagementMember ? pendingManagementMember.role || "management" : pendingMatchedManager ? "manager" : pendingMatchedEditor || pendingPreAuthorizedEditor ? "editor" : "viewer";
  const effectiveResolvedAuthProfile = resolvedAuthProfile ? {
    ...resolvedAuthProfile,
    role: getUserRolePriority(pendingRole) > getUserRolePriority(resolvedAuthProfile.role) ? pendingRole : resolvedAuthProfile.role,
    managementKey: resolvedAuthProfile.managementKey || pendingManagementMember?.directoryKey || "",
    linkedManagerId: resolvedAuthProfile.linkedManagerId || pendingMatchedManager?.id || "",
    linkedEditorId: resolvedAuthProfile.linkedEditorId || pendingMatchedEditor?.id || ""
  } : null;
  const pendingProfileRecordId = pendingManagementMember ? `management_${pendingManagementMember.directoryKey}` : pendingMatchedManager ? pendingMatchedManager.userId || pendingMatchedManager.id || "" : pendingMatchedEditor ? pendingMatchedEditor.userId || pendingMatchedEditor.id || "" : "";
  const currentUserProfile = !user ? null : authEmail ? effectiveResolvedAuthProfile || {
    id: pendingProfileRecordId || "pending-user",
    name: pendingManagementMember?.name || pendingMatchedManager?.name || pendingMatchedEditor?.name || user.displayName || authEmail.split("@")[0],
    email: authEmail,
    role: pendingRole,
    isActive: true,
    pending: true,
    managementKey: pendingManagementMember?.directoryKey || "",
    linkedManagerId: pendingMatchedManager?.id || "",
    linkedEditorId: pendingMatchedEditor?.id || ""
  } : {
    id: "anonymous",
    name: "Invitado",
    email: "",
    role: "viewer",
    isActive: true,
    isAnonymous: true
  };
  const currentRoleMeta = getRoleMeta(currentUserProfile?.role);
  const currentVerificationMeta = getVerificationMeta(currentUserProfile);
  const profileBlocked = Boolean(
    currentUserProfile && currentUserProfile.isActive === false
  );
  const appUserById = new Map(appUsers.map((item) => [item.id, item]));
  const managementMemberCandidates = [
    ...appUsers.filter((item) => item.isActive !== false),
    ...managers.map((item) => {
      const linkedUser = item.userId ? appUserById.get(item.userId) : null;
      return {
        ...linkedUser || {},
        id: linkedUser?.id || item.userId || item.id,
        name: linkedUser?.name || item.name || "",
        email: normalizeEmail(linkedUser?.email || item.email),
        role: linkedUser?.role && linkedUser.role !== "viewer" ? linkedUser.role : "manager",
        isActive: linkedUser?.isActive ?? item.isActive ?? true,
        linkedManagerId: item.id,
        managementKey: linkedUser?.managementKey || ""
      };
    }),
    ...editors.map((item) => {
      const linkedUser = item.userId ? appUserById.get(item.userId) : null;
      return {
        ...linkedUser || {},
        id: linkedUser?.id || item.userId || item.id,
        name: linkedUser?.name || item.name || "",
        email: normalizeEmail(linkedUser?.email || item.email),
        role: linkedUser?.role && linkedUser.role !== "viewer" ? linkedUser.role : "editor",
        isActive: linkedUser?.isActive ?? item.isActive ?? true,
        linkedEditorId: item.id,
        managementKey: linkedUser?.managementKey || ""
      };
    }),
    ...currentUserProfile && !currentUserProfile.isAnonymous ? [currentUserProfile] : []
  ].filter(
    (item) => item.isActive !== false && (item.id || item.name || normalizeEmail(item.email))
  );
  const managementUsers = Array.from(
    managementMemberCandidates.reduce((accumulator, item) => {
      const managementKey = item.managementKey || (["management", "super_admin", "operations"].includes(item.role) ? getManagementDirectoryKey(item) : "");
      const emailKey = normalizeEmail(item.email);
      const memberKey = managementKey ? `management:${managementKey}` : emailKey ? `email:${emailKey}` : item.linkedManagerId ? `manager:${item.linkedManagerId}` : item.linkedEditorId ? `editor:${item.linkedEditorId}` : `user:${item.id}`;
      const current = accumulator.get(memberKey);
      if (!current || getUserRecordScore(item) > getUserRecordScore(current)) {
        accumulator.set(memberKey, item);
      }
      return accumulator;
    }, /* @__PURE__ */ new Map()).values()
  ).map((item) => {
    const managementMeta = getManagementDirectoryMeta(item);
    return {
      ...item,
      email: getResolvedManagementEmail(item),
      managementKey: item.managementKey || managementMeta?.directoryKey || ""
    };
  }).sort(
    (a, b) => (a.name || "").localeCompare(b.name || "", "es", { sensitivity: "base" })
  );
  const defaultManagementAssigneeId = currentUserProfile?.id && !["anonymous", "pending-user"].includes(currentUserProfile.id) && managementUsers.some((item) => item.id === currentUserProfile.id) ? currentUserProfile.id : "";
  const privilegedUsers = appUsers.filter(
    (item) => item.isActive !== false && ["super_admin", "operations"].includes(item.role)
  );
  const dataCollection = (name) => collection(db, "artifacts", appId, "public", "data", name);
  const dataDoc = (name, id) => doc(db, "artifacts", appId, "public", "data", name, id);
  const sendUserEmailLink = async ({
    userId,
    email,
    userRecord = {},
    reason = "manual_resend"
  }) => {
    if (!auth) {
      const unavailableError = new Error(
        "Firebase Authentication no esta disponible."
      );
      unavailableError.friendlyMessage = "Firebase Authentication no esta disponible.";
      throw unavailableError;
    }
    const normalizedEmail = normalizeEmail(email || userRecord?.email);
    if (!userId || !normalizedEmail) {
      const invalidUserError = new Error(
        "El usuario necesita un correo valido."
      );
      invalidUserError.friendlyMessage = "El usuario necesita un correo valido.";
      throw invalidUserError;
    }
    const verificationState = userRecord?.emailVerification || {};
    const requestedAt = nowIso();
    try {
      auth.languageCode = "es";
      await sendSignInLinkToEmail(
        auth,
        normalizedEmail,
        buildEmailLinkActionCodeSettings()
      );
      await updateDoc(dataDoc("users", userId), {
        emailVerified: false,
        emailVerification: {
          ...verificationState,
          status: "sent",
          source: "email_link",
          requestedAt: verificationState.requestedAt || requestedAt,
          sentAt: requestedAt,
          resendRequestedAt: reason === "manual_resend" ? requestedAt : verificationState.resendRequestedAt || "",
          requestedBy: currentUserProfile?.id || "",
          lastSentReason: reason,
          lastRecipient: normalizedEmail,
          lastError: ""
        },
        updatedAt: requestedAt
      });
      return { sentAt: requestedAt, email: normalizedEmail };
    } catch (error) {
      const failedAt = nowIso();
      const friendlyMessage = getEmailLinkAuthErrorMessage(error, "send");
      error.friendlyMessage = friendlyMessage;
      await updateDoc(dataDoc("users", userId), {
        emailVerified: false,
        emailVerification: {
          ...verificationState,
          status: "error",
          source: "email_link",
          requestedAt: verificationState.requestedAt || requestedAt,
          requestedBy: currentUserProfile?.id || "",
          resendRequestedAt: reason === "manual_resend" ? requestedAt : verificationState.resendRequestedAt || "",
          failedAt,
          lastSentReason: reason,
          lastRecipient: normalizedEmail,
          lastError: friendlyMessage
        },
        updatedAt: failedAt
      });
      throw error;
    }
  };
  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("dark");
      localStorage.setItem("cluster_theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("cluster_theme", "light");
    }
  }, [isDark]);
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    const syncAuthState = (nextUser) => {
      if (!isMounted) return;
      setUser(nextUser);
      setLoading(false);
    };
    const waitForAuthState = async () => {
      if (typeof auth.authStateReady === "function") {
        await auth.authStateReady();
        return;
      }
      await new Promise((resolve) => {
        const stop = onAuthStateChanged(auth, () => {
          stop();
          resolve();
        });
      });
    };
    const initAuth = async () => {
      try {
        if (isSignInWithEmailLink(auth, window.location.href)) {
          const storedEmail = normalizeEmail(
            window.localStorage.getItem(EMAIL_LINK_STORAGE_KEY) || ""
          );
          const emailForLink = storedEmail || normalizeEmail(
            window.prompt(
              "Escribe tu correo para completar el acceso enviado por email."
            ) || ""
          );
          const cleanUrl = buildEmailLinkReturnUrl(window.location.href);
          if (!emailForLink) {
            if (cleanUrl)
              window.history.replaceState(
                {},
                document.title,
                cleanUrl.toString()
              );
            showToast(
              "Necesitas confirmar el correo para completar el acceso.",
              "error"
            );
            await waitForAuthState();
            if (!auth.currentUser) await signInAnonymously(auth);
            return;
          }
          await signInWithEmailLink(auth, emailForLink, window.location.href);
          window.localStorage.removeItem(EMAIL_LINK_STORAGE_KEY);
          if (cleanUrl)
            window.history.replaceState(
              {},
              document.title,
              cleanUrl.toString()
            );
          showToast("Acceso por correo completado.");
          return;
        }
        await waitForAuthState();
        if (!auth.currentUser && typeof completeGoogleRedirectIfNeeded === "function") {
          const completedGoogleRedirect = await completeGoogleRedirectIfNeeded(auth);
          if (completedGoogleRedirect) return;
        }
        if (auth.currentUser) return;
        if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
            return;
          } catch (tokenError) {
            console.error(
              "No se pudo iniciar sesion con token inicial:",
              tokenError
            );
          }
        }
        if (!auth.currentUser) await signInAnonymously(auth);
      } catch (error) {
        console.error("Error de Autenticaci\xF3n:", error);
        if (isSignInWithEmailLink(auth, window.location.href)) {
          const cleanUrl = buildEmailLinkReturnUrl(window.location.href);
          if (cleanUrl)
            window.history.replaceState(
              {},
              document.title,
              cleanUrl.toString()
            );
          showToast(getEmailLinkAuthErrorMessage(error, "complete"), "error");
        }
        if (!auth.currentUser) {
          try {
            await signInAnonymously(auth);
          } catch (anonymousError) {
            console.error("No se pudo iniciar sesion anonima:", anonymousError);
          }
        }
      } finally {
        syncAuthState(auth.currentUser);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, syncAuthState);
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!auth) return;
    const extractNativeGoogleToken = (url = "") => {
      if (!url || !String(url).startsWith("clusteragency://auth/google"))
        return "";
      try {
        const target = new URL(url);
        return target.searchParams.get("token") || "";
      } catch {
        return "";
      }
    };
    const consumeNativeGoogleToken = async (token = "") => {
      if (!token) return false;
      if (nativeGoogleTokensSeenRef.current.has(token)) return false;
      nativeGoogleTokensSeenRef.current.add(token);
      window.localStorage.removeItem(NATIVE_GOOGLE_TOKEN_STORAGE_KEY);
      try {
        setIsSigningIn(true);
        await signInWithCustomToken(auth, token);
        if (!auth.currentUser?.email) {
          throw new Error("Google no devolvio un usuario autenticado.");
        }
        setUser(auth.currentUser);
        setView("dashboard");
        localStorage.setItem("cluster_os_view", "dashboard");
        showToast("Sesion iniciada con Google");
        return true;
      } catch (error) {
        console.error(
          "No se pudo completar el retorno nativo de Google:",
          error
        );
        showToast("No se pudo completar el acceso con Google", "error");
        return false;
      } finally {
        setIsSigningIn(false);
      }
    };
    const consumeAppUrl = async (url = "") => {
      const token = extractNativeGoogleToken(url);
      if (!token) return false;
      if (nativeGoogleTokensSeenRef.current.has(token)) return false;
      window.localStorage.setItem(NATIVE_GOOGLE_TOKEN_STORAGE_KEY, token);
      return consumeNativeGoogleToken(token);
    };
    const consumeStoredToken = async () => {
      const storedToken = window.localStorage.getItem(NATIVE_GOOGLE_TOKEN_STORAGE_KEY) || "";
      if (!storedToken) return false;
      return consumeNativeGoogleToken(storedToken);
    };
    let appUrlHandle = null;
    let resumeHandle = null;
    CapacitorApp.addListener("appUrlOpen", ({ url }) => {
      consumeAppUrl(url).catch(() => {
      });
    }).then((handle) => {
      appUrlHandle = handle;
    }).catch((error) => {
      console.error("No se pudo registrar appUrlOpen:", error);
    });
    CapacitorApp.getLaunchUrl().then((result) => {
      consumeAppUrl(result?.url || "").catch(() => {
      });
    }).catch(() => {
    });
    consumeStoredToken().catch(() => {
    });
    CapacitorApp.addListener("resume", () => {
      consumeStoredToken().catch(() => {
      });
      CapacitorApp.getLaunchUrl().then((result) => {
        consumeAppUrl(result?.url || "").catch(() => {
        });
      }).catch(() => {
      });
      completeGoogleRedirectIfNeeded(auth).then((completed) => {
        if (completed) {
          setUser(auth.currentUser);
          setView("dashboard");
          localStorage.setItem("cluster_os_view", "dashboard");
          setIsSigningIn(false);
        }
      }).catch(() => {
        setIsSigningIn(false);
      });
    }).then((handle) => {
      resumeHandle = handle;
    }).catch(() => {
    });
    return () => {
      appUrlHandle?.remove?.();
      resumeHandle?.remove?.();
    };
  }, [auth]);
  useEffect(() => {
    if (!user || !db) return;
    const errHandler = (err) => console.error("Error de Firestore:", err);
    const unsubs = [
      onSnapshot(
        dataCollection("clients"),
        (snapshot) => {
          const list = snapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data()
          }));
          setClients(list);
          setSelectedClient(
            (current) => current ? list.find((item) => item.id === current.id) || null : null
          );
        },
        errHandler
      ),
      onSnapshot(
        dataCollection("events"),
        (snapshot) => setEvents(
          snapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data()
          }))
        ),
        errHandler
      ),
      onSnapshot(
        dataCollection("managers"),
        (snapshot) => {
          const list = snapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data()
          }));
          setManagers(list);
          setSelectedManager(
            (current) => current ? list.find((item) => item.id === current.id) || null : null
          );
        },
        errHandler
      ),
      onSnapshot(
        dataCollection("editors"),
        (snapshot) => {
          const list = snapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data()
          }));
          setEditors(list);
          setSelectedEditor(
            (current) => current ? list.find((item) => item.id === current.id) || null : null
          );
        },
        errHandler
      ),
      onSnapshot(
        dataCollection("editing"),
        (snapshot) => setEditingTasks(
          snapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data()
          }))
        ),
        errHandler
      ),
      onSnapshot(
        dataCollection("account_tasks"),
        (snapshot) => setAccountTasks(
          snapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data()
          }))
        ),
        errHandler
      ),
      onSnapshot(
        dataCollection("management_tasks"),
        (snapshot) => setManagementTasks(
          snapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data()
          }))
        ),
        errHandler
      ),
      onSnapshot(
        dataCollection("users"),
        (snapshot) => {
          setAppUsers(
            snapshot.docs.map((docItem) => ({
              id: docItem.id,
              ...docItem.data()
            }))
          );
          setUsersLoaded(true);
        },
        errHandler
      )
    ];
    return () => unsubs.forEach((unsubscribe) => unsubscribe());
  }, [user]);
  useEffect(() => {
    if (!user || !db || view !== "control-center") return;
    return onSnapshot(
      query(
        dataCollection("audit_logs"),
        orderBy("createdAt", "desc"),
        limit(120)
      ),
      (snapshot) => setAuditLogs(
        snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data()
        }))
      ),
      (err) => console.error("Error de Firestore:", err)
    );
  }, [user, view]);
  useEffect(() => {
    if (!db || !user || !usersLoaded || hasSeededManagementDirectory) return;
    const existingKeys = new Set(
      appUsers.map((item) => item.managementKey || getManagementDirectoryKey(item)).filter(Boolean)
    );
    const missingMembers = MANAGEMENT_DIRECTORY.filter(
      (member) => !existingKeys.has(member.directoryKey)
    );
    if (missingMembers.length === 0) {
      setHasSeededManagementDirectory(true);
      return;
    }
    Promise.all(
      missingMembers.map(
        (member) => setDoc(
          dataDoc("users", `management_${member.directoryKey}`),
          {
            name: member.name,
            email: normalizeEmail(member.email),
            role: member.role || "management",
            managementKey: member.directoryKey,
            isActive: true,
            createdAt: nowIso(),
            updatedAt: nowIso(),
            lastSeenAt: "",
            seeded: true,
            linkedManagerId: "",
            linkedEditorId: ""
          },
          { merge: true }
        )
      )
    ).finally(() => setHasSeededManagementDirectory(true));
  }, [db, user, usersLoaded, appUsers, hasSeededManagementDirectory]);
  useEffect(() => {
    if (!db || !user || !usersLoaded || hasRecoveredManagerDirectory) return;
    if (!userHasPermission(currentUserProfile, "manage_managers")) return;
    const existingManagerIds = new Set(
      managers.map((item) => item.id).filter(Boolean)
    );
    const existingManagerByName = new Map(
      managers.filter((item) => normalizeNameKey(item.name)).map((item) => [normalizeNameKey(item.name), item])
    );
    const referencedManagers = /* @__PURE__ */ new Map();
    const addReferencedManager = ({ id = "", name = "", email = "" }) => {
      const resolvedName = String(name || "").trim();
      const resolvedEmail = normalizeEmail(email);
      const resolvedId = String(id || "").trim() || buildRecoveredManagerId(resolvedName);
      if (!resolvedId || !resolvedName) return;
      const existingByName = existingManagerByName.get(
        normalizeNameKey(resolvedName)
      );
      if (existingByName) return;
      if (existingManagerIds.has(resolvedId)) return;
      const current = referencedManagers.get(resolvedId) || {};
      referencedManagers.set(resolvedId, {
        id: resolvedId,
        name: current.name || resolvedName,
        email: current.email || resolvedEmail
      });
    };
    clients.forEach((client) => {
      addReferencedManager({
        id: client.managerId,
        name: client.manager,
        email: client.managerEmail
      });
    });
    accountTasks.forEach((task) => {
      if (!task.contextId || existingManagerIds.has(task.contextId)) return;
      const assignedUser = task.assigneeUserId ? appUsers.find((item) => item.id === task.assigneeUserId) : null;
      if (!assignedUser) return;
      addReferencedManager({
        id: task.contextId,
        name: assignedUser.name,
        email: assignedUser.email
      });
    });
    appUsers.forEach((appUser) => {
      if (!appUser.linkedManagerId || existingManagerIds.has(appUser.linkedManagerId))
        return;
      addReferencedManager({
        id: appUser.linkedManagerId,
        name: appUser.name,
        email: appUser.email
      });
    });
    const missingManagers = Array.from(referencedManagers.values());
    if (missingManagers.length === 0) {
      if (managers.length > 0 || clients.length > 0 || accountTasks.length > 0) {
        setHasRecoveredManagerDirectory(true);
      }
      return;
    }
    let isCancelled = false;
    const batch = writeBatch(db);
    const stamp = nowIso();
    missingManagers.forEach((manager, index) => {
      const directoryMember = findDirectoryMemberByName(manager.name);
      const resolvedEmail = normalizeEmail(
        manager.email || directoryMember?.email
      );
      const linkedUser = (resolvedEmail ? appUsers.find(
        (item) => normalizeEmail(item.email) === resolvedEmail
      ) : null) || appUsers.find(
        (item) => normalizeNameKey(item.name) === normalizeNameKey(manager.name)
      );
      const color = ACCOUNT_COLORS[index % ACCOUNT_COLORS.length];
      batch.set(
        dataDoc("managers", manager.id),
        {
          name: manager.name,
          email: resolvedEmail,
          color,
          userId: linkedUser?.id || "",
          recovered: true,
          createdAt: stamp,
          updatedAt: stamp
        },
        { merge: true }
      );
      if (linkedUser?.id && linkedUser.linkedManagerId !== manager.id) {
        batch.update(dataDoc("users", linkedUser.id), {
          linkedManagerId: manager.id,
          updatedAt: stamp
        });
      }
      clients.filter(
        (client) => client.managerId === manager.id || !client.managerId && normalizeNameKey(client.manager) === normalizeNameKey(manager.name)
      ).forEach((client) => {
        batch.update(dataDoc("clients", client.id), {
          manager: manager.name,
          managerId: manager.id,
          managerUserId: linkedUser?.id || client.managerUserId || "",
          updatedAt: stamp
        });
      });
      if (linkedUser?.id) {
        accountTasks.filter(
          (task) => task.contextId === manager.id && task.assigneeUserId !== linkedUser.id
        ).forEach((task) => {
          batch.update(dataDoc("account_tasks", task.id), {
            assigneeUserId: linkedUser.id,
            updatedAt: stamp
          });
        });
      }
    });
    batch.commit().then(() => {
      if (!isCancelled)
        showToast(`Account Managers restaurados: ${missingManagers.length}`);
    }).catch((error) => {
      console.error(
        "No se pudo restaurar el directorio de Account Managers:",
        error
      );
    }).finally(() => {
      if (!isCancelled) setHasRecoveredManagerDirectory(true);
    });
    return () => {
      isCancelled = true;
    };
  }, [
    db,
    user,
    usersLoaded,
    hasRecoveredManagerDirectory,
    currentUserProfile?.id,
    currentUserProfile?.role,
    managers,
    clients,
    accountTasks,
    appUsers
  ]);
  useEffect(() => {
    if (!db || !user || !usersLoaded) return;
    const pendingManagementBackfill = appUsers.filter((item) => item.role === "management").map((item) => {
      const resolvedEmail = getResolvedManagementEmail(item);
      const managementKey = item.managementKey || getManagementDirectoryKey(item);
      const needsEmail = Boolean(resolvedEmail) && normalizeEmail(item.email) !== resolvedEmail;
      const needsKey = Boolean(managementKey) && item.managementKey !== managementKey;
      if (!needsEmail && !needsKey) return null;
      return { id: item.id, resolvedEmail, managementKey };
    }).filter(Boolean);
    if (pendingManagementBackfill.length === 0) return;
    Promise.all(
      pendingManagementBackfill.map(
        ({ id, resolvedEmail, managementKey }) => updateDoc(dataDoc("users", id), {
          ...resolvedEmail ? { email: resolvedEmail } : {},
          ...managementKey ? { managementKey } : {},
          updatedAt: nowIso()
        }).catch(() => {
        })
      )
    );
  }, [db, user, usersLoaded, appUsers]);
  useEffect(() => {
    if (!db || !user || !authEmail || !usersLoaded) return;
    const existingByUid = appUsers.find(
      (item) => item.authUid && item.authUid === user.uid
    );
    const existingByEmail = chooseCanonicalUserRecord(
      appUsers.filter((item) => normalizeEmail(item.email) === authEmail)
    );
    const matchByName = appUsers.find(
      (item) => !normalizeEmail(item.email) && normalizeNameKey(item.name) === normalizeNameKey(user.displayName || authEmail)
    );
    const existing = existingByUid || existingByEmail || matchByName;
    const targetId = existing?.id || `auth_${user.uid || normalizeNameKey(authEmail).replace(/[^a-z0-9]+/g, "_")}`;
    const isForcedSuperAdmin = SUPER_ADMIN_EMAILS.includes(authEmail);
    const existingRole = existing?.role || (privilegedUsers.length === 0 ? "super_admin" : "viewer");
    const matchedManager = managers.find((item) => normalizeEmail(item.email) === authEmail) || (existing?.linkedManagerId ? managers.find((item) => item.id === existing.linkedManagerId) : null);
    const matchedEditor = editors.find((item) => normalizeEmail(item.email) === authEmail) || (existing?.linkedEditorId ? editors.find((item) => item.id === existing.linkedEditorId) : null);
    const preAuthorizedEditor = !matchedEditor ? DEFAULT_EDITORS_TEAM.find(
      (item) => normalizeEmail(item.email) === authEmail
    ) : null;
    const roleByLink = existing?.managementKey ? "management" : matchedManager ? "manager" : matchedEditor || preAuthorizedEditor ? "editor" : "viewer";
    const bootstrapRole = isForcedSuperAdmin ? "super_admin" : privilegedUsers.length === 0 && !["super_admin", "operations"].includes(existingRole) ? "super_admin" : getUserRolePriority(roleByLink) > getUserRolePriority(existingRole) ? roleByLink : existingRole;
    const nextRole = bootstrapRole;
    const authSource = getAuthSource(user);
    const emailVerifiedByAuth = Boolean(user.emailVerified) || authSource === "google" || authSource === "email_link";
    const verificationState = existing?.emailVerification || {};
    const resolvedName = existing?.name || user.displayName || authEmail.split("@")[0];
    const nextManagementKey = nextRole === "management" ? existing?.managementKey || getManagementDirectoryKey(existing) || "" : existing?.managementKey || "";
    const nextVerification = emailVerifiedByAuth ? {
      ...verificationState,
      status: "verified",
      source: authSource,
      verifiedAt: verificationState.verifiedAt || nowIso(),
      lastError: ""
    } : Object.keys(verificationState).length > 0 ? verificationState : {
      status: "pending",
      requestedAt: nowIso()
    };
    const basePayload = {
      name: resolvedName,
      email: authEmail,
      isActive: true,
      authUid: user.uid || "",
      emailVerified: emailVerifiedByAuth,
      emailVerification: nextVerification,
      linkedManagerId: existing?.linkedManagerId || matchedManager?.id || "",
      linkedEditorId: existing?.linkedEditorId || matchedEditor?.id || "",
      managementKey: nextManagementKey
    };
    const verificationChanged = (verificationState.status || "") !== (nextVerification.status || "") || (verificationState.source || "") !== (nextVerification.source || "") || (verificationState.verifiedAt || "") !== (nextVerification.verifiedAt || "") || (verificationState.requestedAt || "") !== (nextVerification.requestedAt || "") || (verificationState.lastError || "") !== (nextVerification.lastError || "");
    const needsBootstrapSync = !existing || (existing.name || "") !== basePayload.name || normalizeEmail(existing.email) !== basePayload.email || existing.isActive !== true || (existing.authUid || "") !== basePayload.authUid || Boolean(existing.emailVerified) !== basePayload.emailVerified || verificationChanged || (existing.linkedManagerId || "") !== basePayload.linkedManagerId || (existing.linkedEditorId || "") !== basePayload.linkedEditorId || (existing.managementKey || "") !== basePayload.managementKey || (existing.role || "") !== nextRole;
    if (!needsBootstrapSync) return;
    const stamp = nowIso();
    if (existing) {
      updateDoc(dataDoc("users", existing.id), {
        ...basePayload,
        role: nextRole,
        updatedAt: stamp,
        lastSeenAt: stamp
      }).catch(() => {
      });
      return;
    }
    setDoc(
      dataDoc("users", targetId),
      {
        ...basePayload,
        role: nextRole,
        createdAt: stamp,
        updatedAt: stamp,
        lastSeenAt: stamp
      },
      { merge: true }
    ).catch(() => {
    });
  }, [
    db,
    user,
    authEmail,
    usersLoaded,
    appUsers,
    privilegedUsers.length,
    managers,
    editors
  ]);
  useEffect(() => {
    if (!currentUserProfile) return;
    if (profileBlocked || !canAccessView(currentUserProfile, view)) {
      setView("dashboard");
      localStorage.setItem("cluster_os_view", "dashboard");
    }
  }, [currentUserProfile, profileBlocked, view]);
  useEffect(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined")
      return;
    if (!currentUserProfile?.id || profileBlocked) return;
    const NOTIF_KEY = "cluster_browser_task_notifications_v1";
    const HOUR = 36e5;
    const readState = () => {
      try {
        return JSON.parse(localStorage.getItem(NOTIF_KEY) || "{}");
      } catch {
        return {};
      }
    };
    const writeState = (next) => {
      try {
        localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
      } catch {
      }
    };
    const tryRequestPermission = () => {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {
        });
      }
    };
    tryRequestPermission();
    const taskNotificationConfigs = [
      {
        collectionType: "accountTask",
        tasks: accountTasks,
        label: "Account",
        view: "account-room",
        defaultTime: "18:00",
        done: (task) => task.status === "publicado",
        assigned: (task) => isTaskAssignedToProfile(task, currentUserProfile, [
          currentUserProfile?.linkedManagerId
        ])
      },
      {
        collectionType: "editingTask",
        tasks: editingTasks,
        label: "Edicion",
        view: "editions",
        defaultTime: "18:00",
        done: isEditingDelivered,
        assigned: (task) => isTaskAssignedToProfile(task, currentUserProfile, [
          currentUserProfile?.linkedEditorId
        ])
      },
      {
        collectionType: "managementTask",
        tasks: managementTasks,
        label: "Gestion",
        view: "management-room",
        defaultTime: "",
        done: (task) => task.status === "cerrado",
        assigned: (task) => isTaskAssignedToProfile(task, currentUserProfile, [
          currentUserProfile?.id
        ])
      }
    ];
    const fireNotification = (task, config, stage, dueMs) => {
      if (Notification.permission !== "granted") return;
      const titleMap = {
        "8h": "\u23F0 Tarea proxima a vencer (8h)",
        overdue: "Tarea vencida",
        nag: "Tarea vencida hace mas de 24h"
      };
      const client = clients.find((c) => c.id === task.clientId);
      const notificationTitle = stage === "8h" ? `Tarea de ${config.label} proxima a vencer (8h)` : stage === "overdue" ? `Tarea de ${config.label} vencida` : `Tarea de ${config.label} vencida hace mas de 24h`;
      const body = [
        task.title,
        task.time ? `Hora limite: ${task.time}` : config.defaultTime ? `Hora limite: ${config.defaultTime}` : "",
        client ? `Cliente: ${client.name}` : ""
      ].filter(Boolean).join("\n");
      try {
        const notif = new Notification(
          notificationTitle || titleMap[stage] || `Tarea de ${config.label}`,
          {
            body,
            tag: `cluster-task-${config.collectionType}-${task.id}-${stage}`,
            requireInteraction: stage === "overdue" || stage === "nag"
          }
        );
        notif.onclick = () => {
          window.focus();
          setView(config.view);
          localStorage.setItem("cluster_os_view", config.view);
          notif.close();
        };
      } catch {
      }
      void dueMs;
    };
    const scan = () => {
      if (document.hidden && Notification.permission !== "granted") return;
      const state = readState();
      const now = Date.now();
      let mutated = false;
      for (const config of taskNotificationConfigs) {
        for (const task of config.tasks) {
          if (!task || config.done(task)) continue;
          if (task.notificationsEnabled === false) continue;
          if (!config.assigned(task)) continue;
          if (!task.date) continue;
          const dueTime = /^\d{2}:\d{2}$/.test(task.time || "") ? task.time : config.defaultTime;
          if (!dueTime) continue;
          const dueMs = Date.parse(`${task.date}T${dueTime}:00-06:00`);
          if (!Number.isFinite(dueMs)) continue;
          const diff = dueMs - now;
          const stateKey = `${config.collectionType}:${task.id}`;
          const seen = state[stateKey] || {};
          if (diff > 0 && diff <= 8 * HOUR && !seen["8h"]) {
            fireNotification(task, config, "8h", dueMs);
            seen["8h"] = now;
            mutated = true;
          }
          if (diff <= 0 && !seen.overdue) {
            fireNotification(task, config, "overdue", dueMs);
            seen.overdue = now;
            mutated = true;
          } else if (diff <= 0 && seen.overdue && now - (seen.nag || seen.overdue) >= 24 * HOUR) {
            fireNotification(task, config, "nag", dueMs);
            seen.nag = now;
            mutated = true;
          }
          state[stateKey] = seen;
        }
      }
      if (mutated) writeState(state);
    };
    scan();
    const interval = window.setInterval(scan, 6e4);
    const onFocus = () => scan();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [
    currentUserProfile?.id,
    currentUserProfile?.linkedManagerId,
    currentUserProfile?.linkedEditorId,
    profileBlocked,
    accountTasks,
    editingTasks,
    managementTasks,
    clients
  ]);
  useEffect(() => {
    if (!db || !currentUserProfile || profileBlocked || isFlushingPendingTaskStatusesRef.current)
      return;
    const flushPendingTaskStatusUpdates = async () => {
      const queuedItems = readPendingTaskStatusUpdates();
      if (queuedItems.length === 0) return;
      isFlushingPendingTaskStatusesRef.current = true;
      try {
        const latestByTask = /* @__PURE__ */ new Map();
        queuedItems.forEach((item) => {
          latestByTask.set(`${item.collectionName}:${item.taskId}`, item);
        });
        for (const item of latestByTask.values()) {
          const permissionByCollection = {
            account_tasks: "manage_account_tasks",
            editing: "manage_editing_tasks",
            management_tasks: "manage_management_tasks"
          };
          const requiredPermission = permissionByCollection[item.collectionName];
          if (!requiredPermission || !userHasPermission(currentUserProfile, requiredPermission))
            continue;
          try {
            await updateDoc(dataDoc(item.collectionName, item.taskId), {
              status: item.status,
              updatedAt: item.updatedAt || nowIso(),
              ...item.patch || {}
            });
            clearPendingTaskStatusUpdate({
              collectionName: item.collectionName,
              taskId: item.taskId
            });
          } catch (error) {
            console.error(
              "No se pudo sincronizar el cambio de estado pendiente:",
              error
            );
            if (!shouldRetryTaskStatusUpdate(error)) {
              clearPendingTaskStatusUpdate({
                collectionName: item.collectionName,
                taskId: item.taskId
              });
            }
          }
        }
      } finally {
        isFlushingPendingTaskStatusesRef.current = false;
      }
    };
    flushPendingTaskStatusUpdates().catch((error) => {
      isFlushingPendingTaskStatusesRef.current = false;
      console.error("No se pudo vaciar la cola local de estados:", error);
    });
    if (typeof window === "undefined") return;
    const handleOnline = () => {
      flushPendingTaskStatusUpdates().catch((error) => {
        isFlushingPendingTaskStatusesRef.current = false;
        console.error(
          "No se pudo resincronizar la cola local de estados:",
          error
        );
      });
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [db, currentUserProfile, profileBlocked]);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3e3);
  };
  useEffect(() => {
    if (!user || !db) return;
    if (["reports", "general-calendar", "calendar"].includes(view)) {
      handleLoadTaskHistory();
    }
  }, [view, user, db]);
  const closeModal = () => setModalConfig({ isOpen: false, type: null, data: null, isEdit: false });
  const closeDelete = () => setDeleteConfirm({ isOpen: false, type: null, id: null, title: "" });
  const auditAction = async ({
    action,
    entityType,
    entityId = "",
    description = "",
    status = "success",
    changes = null
  }) => {
    if (!db || !user) return;
    try {
      await addDoc(dataCollection("audit_logs"), {
        action,
        entityType,
        entityId,
        description,
        status,
        changes,
        createdAt: nowIso(),
        view,
        actor: {
          uid: user.uid || "",
          email: authEmail || "",
          name: currentUserProfile?.name || user.displayName || "Invitado",
          role: currentUserProfile?.role || "viewer"
        }
      });
    } catch (error) {
      console.error("No se pudo registrar auditoria:", error);
    }
  };
  const ensurePermission = async (permission, description) => {
    if (profileBlocked) {
      showToast("Tu usuario esta inactivo", "error");
      return false;
    }
    if (userHasPermission(currentUserProfile, permission)) return true;
    showToast("No tienes permisos para esta accion", "error");
    await auditAction({
      action: "permission_denied",
      entityType: "security",
      description,
      status: "denied",
      changes: { permission }
    });
    return false;
  };
  const runMutation = async ({
    permission,
    action,
    entityType,
    entityId = "",
    description,
    changes = null,
    successMessage,
    errorMessage = "No se pudo completar la accion",
    execute,
    afterSuccess
  }) => {
    if (!await ensurePermission(permission, description)) return null;
    try {
      const result = await execute();
      await auditAction({
        action,
        entityType,
        entityId: entityId || result?.id || "",
        description,
        changes
      });
      if (successMessage) showToast(successMessage);
      if (afterSuccess) afterSuccess(result);
      return result;
    } catch (error) {
      console.error(error);
      showToast(errorMessage, "error");
      await auditAction({
        action: `${action}_failed`,
        entityType,
        entityId,
        description,
        status: "error",
        changes: { ...changes || {}, error: error.message }
      });
      return null;
    }
  };
  const runQueuedTaskStatusMutation = async ({
    collectionName,
    task,
    newStatus,
    permission,
    entityType,
    description,
    changes,
    statusPatch = {},
    successMessage = "",
    errorMessage = "No se pudo actualizar el estado",
    afterSuccess
  }) => {
    if (!task?.id || !newStatus || !collectionName) return null;
    if (!await ensurePermission(permission, description)) return null;
    const stamp = nowIso();
    const patch = typeof statusPatch === "function" ? statusPatch(stamp) : statusPatch || {};
    const mutationId = queuePendingTaskStatusUpdate({
      collectionName,
      taskId: task.id,
      status: newStatus,
      updatedAt: stamp,
      patch
    });
    try {
      await updateDoc(dataDoc(collectionName, task.id), {
        status: newStatus,
        updatedAt: stamp,
        ...patch
      });
      clearPendingTaskStatusUpdate({
        collectionName,
        taskId: task.id,
        mutationId
      });
      await auditAction({
        action: "status_change",
        entityType,
        entityId: task.id,
        description,
        changes
      });
      if (successMessage) showToast(successMessage);
      if (afterSuccess) afterSuccess();
      return { id: task.id };
    } catch (error) {
      console.error(error);
      const shouldRetry = shouldRetryTaskStatusUpdate(error);
      if (!shouldRetry) {
        clearPendingTaskStatusUpdate({
          collectionName,
          taskId: task.id,
          mutationId
        });
      }
      showToast(
        shouldRetry ? "Cambio pendiente de sincronizar. Se reintentara al recargar." : errorMessage,
        "error"
      );
      await auditAction({
        action: shouldRetry ? "status_change_queued" : "status_change_failed",
        entityType,
        entityId: task.id,
        description,
        status: shouldRetry ? "queued" : "error",
        changes: {
          ...changes || {},
          error: error.message,
          collectionName,
          queued: shouldRetry
        }
      });
      return null;
    }
  };
  const getPreferredUserRole = (records = []) => [...records].sort(
    (left, right) => getUserRolePriority(right.role) - getUserRolePriority(left.role)
  )[0]?.role || "viewer";
  const mergeEmailVerificationPayload = (records = [], mergedEmail = "", mergedVerified = false) => {
    if (!mergedEmail) return {};
    const bestRecord = [...records].sort(
      (left, right) => getVerificationPriority(right) - getVerificationPriority(left)
    )[0] || {};
    const currentPayload = bestRecord.emailVerification || {};
    if (mergedVerified) {
      return {
        ...currentPayload,
        status: "verified",
        source: currentPayload.source || (bestRecord.authUid ? "google" : "merged"),
        verifiedAt: currentPayload.verifiedAt || bestRecord.updatedAt || nowIso()
      };
    }
    if (Object.keys(currentPayload).length > 0) return currentPayload;
    return {
      status: "pending",
      requestedAt: nowIso()
    };
  };
  const reconcileUserDirectory = async ({ silent = false } = {}) => {
    if (!db) return { changed: false, removedCount: 0, signature: "" };
    const [
      usersSnapshot,
      managersSnapshot,
      editorsSnapshot,
      clientsSnapshot,
      accountTasksSnapshot,
      editingTasksSnapshot,
      managementTasksSnapshot
    ] = await Promise.all([
      getDocs(dataCollection("users")),
      getDocs(dataCollection("managers")),
      getDocs(dataCollection("editors")),
      getDocs(dataCollection("clients")),
      getDocs(dataCollection("account_tasks")),
      getDocs(dataCollection("editing")),
      getDocs(dataCollection("management_tasks"))
    ]);
    const usersList = usersSnapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data()
    }));
    const managersList = managersSnapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data()
    }));
    const editorsList = editorsSnapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data()
    }));
    const clientsList = clientsSnapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data()
    }));
    const accountTasksList = accountTasksSnapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data()
    }));
    const editingTasksList = editingTasksSnapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data()
    }));
    const managementTasksList = managementTasksSnapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data()
    }));
    const duplicateGroups = buildDuplicateUserGroups(usersList);
    const signature = duplicateGroups.map(
      (group) => group.map((item) => item.id).sort().join(",")
    ).sort().join("|");
    if (duplicateGroups.length === 0) {
      return { changed: false, removedCount: 0, signature };
    }
    const referenceCounts = /* @__PURE__ */ new Map();
    const increaseReference = (userId) => {
      if (!userId) return;
      referenceCounts.set(userId, (referenceCounts.get(userId) || 0) + 1);
    };
    managersList.forEach((item) => increaseReference(item.userId));
    editorsList.forEach((item) => increaseReference(item.userId));
    clientsList.forEach((item) => increaseReference(item.managerUserId));
    accountTasksList.forEach((item) => increaseReference(item.assigneeUserId));
    editingTasksList.forEach((item) => increaseReference(item.assigneeUserId));
    managementTasksList.forEach((item) => {
      increaseReference(item.assigneeUserId);
      increaseReference(item.contextId);
    });
    let batch = writeBatch(db);
    let operations = 0;
    const commits = [];
    const commitLimit = 350;
    const stamp = nowIso();
    let removedCount = 0;
    const queueUpdate = (collectionName, id, payload) => {
      if (!id) return;
      if (operations >= commitLimit) {
        commits.push(batch.commit());
        batch = writeBatch(db);
        operations = 0;
      }
      batch.update(dataDoc(collectionName, id), payload);
      operations += 1;
    };
    const queueDelete = (collectionName, id) => {
      if (!id) return;
      if (operations >= commitLimit) {
        commits.push(batch.commit());
        batch = writeBatch(db);
        operations = 0;
      }
      batch.delete(dataDoc(collectionName, id));
      operations += 1;
    };
    duplicateGroups.forEach((group) => {
      const canonicalUser = chooseCanonicalUserRecord(group, referenceCounts);
      if (!canonicalUser) return;
      const duplicateUsers = group.filter(
        (item) => item.id !== canonicalUser.id
      );
      if (duplicateUsers.length === 0) return;
      const managementMeta = group.filter((item) => item.role === "management").map((item) => getManagementDirectoryMeta(item)).find(Boolean) || null;
      const mergedEmail = group.map((item) => normalizeEmail(item.email)).find(Boolean) || "";
      const mergedVerified = mergedEmail ? group.some(
        (item) => item.emailVerified === true || item.emailVerification?.status === "verified"
      ) : false;
      const mergedVerification = mergeEmailVerificationPayload(
        group,
        mergedEmail,
        mergedVerified
      );
      const canonicalPatch = {
        name: managementMeta?.name || canonicalUser.name || group[0]?.name || "",
        email: mergedEmail,
        role: managementMeta ? "management" : getPreferredUserRole(group),
        isActive: group.some((item) => item.isActive !== false),
        seeded: group.some((item) => item.seeded === true),
        authUid: canonicalUser.authUid || group.find((item) => item.authUid)?.authUid || "",
        emailVerified: mergedVerified,
        emailVerification: mergedVerification,
        linkedManagerId: canonicalUser.linkedManagerId || group.find((item) => item.linkedManagerId)?.linkedManagerId || "",
        linkedEditorId: canonicalUser.linkedEditorId || group.find((item) => item.linkedEditorId)?.linkedEditorId || "",
        managementKey: managementMeta?.directoryKey || canonicalUser.managementKey || "",
        updatedAt: stamp
      };
      queueUpdate("users", canonicalUser.id, canonicalPatch);
      duplicateUsers.forEach((duplicateUser) => {
        managersList.filter((item) => item.userId === duplicateUser.id).forEach(
          (item) => queueUpdate("managers", item.id, {
            userId: canonicalUser.id,
            updatedAt: stamp
          })
        );
        editorsList.filter((item) => item.userId === duplicateUser.id).forEach(
          (item) => queueUpdate("editors", item.id, {
            userId: canonicalUser.id,
            updatedAt: stamp
          })
        );
        clientsList.filter((item) => item.managerUserId === duplicateUser.id).forEach(
          (item) => queueUpdate("clients", item.id, {
            managerUserId: canonicalUser.id,
            updatedAt: stamp
          })
        );
        accountTasksList.filter((item) => item.assigneeUserId === duplicateUser.id).forEach(
          (item) => queueUpdate("account_tasks", item.id, {
            assigneeUserId: canonicalUser.id,
            updatedAt: stamp
          })
        );
        editingTasksList.filter((item) => item.assigneeUserId === duplicateUser.id).forEach(
          (item) => queueUpdate("editing", item.id, {
            assigneeUserId: canonicalUser.id,
            updatedAt: stamp
          })
        );
        managementTasksList.filter(
          (item) => item.assigneeUserId === duplicateUser.id || item.contextId === duplicateUser.id
        ).forEach((item) => {
          const taskPatch = { updatedAt: stamp };
          if (item.assigneeUserId === duplicateUser.id)
            taskPatch.assigneeUserId = canonicalUser.id;
          if (item.contextId === duplicateUser.id)
            taskPatch.contextId = canonicalUser.id;
          queueUpdate("management_tasks", item.id, taskPatch);
        });
        queueDelete("users", duplicateUser.id);
        removedCount += 1;
      });
    });
    if (operations > 0) commits.push(batch.commit());
    await Promise.all(commits);
    if (!silent && removedCount > 0) {
      showToast(
        `Directorio corregido: ${removedCount} usuarios duplicados consolidados.`
      );
    }
    return { changed: removedCount > 0, removedCount, signature };
  };
  const syncIdentityLinks = async ({
    email,
    userId = "",
    managerId = "",
    editorId = "",
    silent = true
  }) => {
    const normalizedEmail = normalizeEmail(email);
    if (!db || !normalizedEmail)
      return {
        changed: false,
        migratedAccountTasks: 0,
        migratedEditingTasks: 0,
        linkedClients: 0
      };
    const linkedUser = userId ? appUsers.find((item) => item.id === userId) : appUsers.find((item) => normalizeEmail(item.email) === normalizedEmail);
    const linkedManager = managerId ? managers.find((item) => item.id === managerId) : managers.find((item) => normalizeEmail(item.email) === normalizedEmail);
    const linkedEditor = editorId ? editors.find((item) => item.id === editorId) : editors.find((item) => normalizeEmail(item.email) === normalizedEmail);
    if (!linkedUser && !linkedManager && !linkedEditor) {
      return {
        changed: false,
        migratedAccountTasks: 0,
        migratedEditingTasks: 0,
        linkedClients: 0
      };
    }
    let batch = writeBatch(db);
    let operations = 0;
    const commits = [];
    const commitLimit = 400;
    const queueUpdate = (collectionName, id, payload) => {
      if (!id) return;
      if (operations >= commitLimit) {
        commits.push(batch.commit());
        batch = writeBatch(db);
        operations = 0;
      }
      batch.update(dataDoc(collectionName, id), payload);
      operations += 1;
    };
    let migratedAccountTasks = 0;
    let migratedEditingTasks = 0;
    let linkedClients = 0;
    let identityMutations = 0;
    const stamp = nowIso();
    if (linkedUser) {
      const userPatch = {};
      if (linkedManager && linkedUser.linkedManagerId !== linkedManager.id)
        userPatch.linkedManagerId = linkedManager.id;
      if (linkedEditor && linkedUser.linkedEditorId !== linkedEditor.id)
        userPatch.linkedEditorId = linkedEditor.id;
      if (Object.keys(userPatch).length > 0) {
        queueUpdate("users", linkedUser.id, { ...userPatch, updatedAt: stamp });
        identityMutations += 1;
      }
    }
    if (linkedManager && linkedUser && linkedManager.userId !== linkedUser.id) {
      queueUpdate("managers", linkedManager.id, {
        userId: linkedUser.id,
        updatedAt: stamp
      });
      identityMutations += 1;
    }
    if (linkedEditor && linkedUser && linkedEditor.userId !== linkedUser.id) {
      queueUpdate("editors", linkedEditor.id, {
        userId: linkedUser.id,
        updatedAt: stamp
      });
      identityMutations += 1;
    }
    if (linkedManager && linkedUser) {
      clients.filter(
        (client) => client.managerId === linkedManager.id && client.managerUserId !== linkedUser.id
      ).forEach((client) => {
        queueUpdate("clients", client.id, {
          managerUserId: linkedUser.id,
          updatedAt: stamp
        });
        linkedClients += 1;
      });
      accountTasks.filter(
        (task) => task.contextId === linkedManager.id && task.assigneeUserId !== linkedUser.id
      ).forEach((task) => {
        queueUpdate("account_tasks", task.id, {
          assigneeUserId: linkedUser.id,
          updatedAt: stamp
        });
        migratedAccountTasks += 1;
      });
    }
    if (linkedEditor && linkedUser) {
      editingTasks.filter(
        (task) => task.contextId === linkedEditor.id && task.assigneeUserId !== linkedUser.id
      ).forEach((task) => {
        queueUpdate("editing", task.id, {
          assigneeUserId: linkedUser.id,
          updatedAt: stamp
        });
        migratedEditingTasks += 1;
      });
    }
    if (operations > 0) commits.push(batch.commit());
    if (commits.length === 0) {
      return {
        changed: false,
        migratedAccountTasks,
        migratedEditingTasks,
        linkedClients
      };
    }
    await Promise.all(commits);
    if (!silent) {
      showToast(
        `Vinculacion completada: ${migratedAccountTasks} tareas de account y ${migratedEditingTasks} de edicion sincronizadas.`
      );
    }
    return {
      changed: identityMutations > 0 || linkedClients > 0 || migratedAccountTasks > 0 || migratedEditingTasks > 0,
      migratedAccountTasks,
      migratedEditingTasks,
      linkedClients
    };
  };
  const requestUserVerification = async (userRecord, successMessage = "Se envio el correo de acceso") => {
    const email = normalizeEmail(userRecord?.email);
    if (!email || !userRecord?.id) {
      showToast("El usuario necesita un correo valido", "error");
      return null;
    }
    if (userRecord?.isActive === false) {
      showToast(
        "Activa el usuario antes de enviar el correo de acceso.",
        "error"
      );
      return null;
    }
    if (userRecord.emailVerified === true || userRecord.emailVerification?.status === "verified") {
      showToast("Ese correo ya esta verificado");
      return null;
    }
    return runMutation({
      permission: "manage_users",
      action: "request_verification",
      entityType: "user",
      entityId: userRecord.id,
      description: `Envia acceso por correo para ${email}`,
      changes: { email, channel: "firebase_auth_email_link" },
      successMessage,
      errorMessage: "No se pudo enviar el correo de acceso",
      execute: () => sendUserEmailLink({
        userId: userRecord.id,
        email,
        userRecord,
        reason: "manual_resend"
      })
    });
  };
  const duplicateUserSignature = buildDuplicateUserGroups(appUsers).map(
    (group) => group.map((item) => item.id).sort().join(",")
  ).sort().join("|");
  useEffect(() => {
    if (!db || !user || !usersLoaded || !duplicateUserSignature) return;
    if (isReconcilingUsersRef.current || lastReconciledDuplicateSignatureRef.current === duplicateUserSignature)
      return;
    let isCancelled = false;
    isReconcilingUsersRef.current = true;
    reconcileUserDirectory().then((result) => {
      if (!isCancelled) {
        lastReconciledDuplicateSignatureRef.current = result?.signature || duplicateUserSignature;
      }
    }).catch((error) => {
      console.error(
        "No se pudo reconciliar el directorio de usuarios:",
        error
      );
    }).finally(() => {
      isReconcilingUsersRef.current = false;
    });
    return () => {
      isCancelled = true;
    };
  }, [db, user, usersLoaded, duplicateUserSignature]);
  useEffect(() => {
    if (!db || !usersLoaded || duplicateUserSignature || hasBackfilledIdentityLinks || !userHasPermission(currentUserProfile, "manage_users"))
      return;
    if (isBackfillingIdentityLinksRef.current) return;
    const candidates = appUsers.filter((item) => normalizeEmail(item.email));
    if (candidates.length === 0) {
      setHasBackfilledIdentityLinks(true);
      return;
    }
    let isCancelled = false;
    isBackfillingIdentityLinksRef.current = true;
    Promise.all(
      candidates.map(
        (item) => syncIdentityLinks({ email: item.email, userId: item.id, silent: true })
      )
    ).finally(() => {
      isBackfillingIdentityLinksRef.current = false;
      if (!isCancelled) setHasBackfilledIdentityLinks(true);
    });
    return () => {
      isCancelled = true;
    };
  }, [
    db,
    usersLoaded,
    duplicateUserSignature,
    hasBackfilledIdentityLinks,
    currentUserProfile?.id,
    appUsers.length,
    managers.length,
    editors.length,
    clients.length,
    accountTasks.length,
    editingTasks.length
  ]);
  useEffect(() => {
    if (!db || !usersLoaded || duplicateUserSignature || !currentUserProfile?.id || !authEmail)
      return;
    const syncSignature = [
      currentUserProfile.id,
      authEmail,
      managers.length,
      editors.length,
      clients.length,
      accountTasks.length,
      editingTasks.length
    ].join("|");
    if (lastIdentityLinkSyncSignatureRef.current === syncSignature) return;
    lastIdentityLinkSyncSignatureRef.current = syncSignature;
    syncIdentityLinks({
      email: authEmail,
      userId: currentUserProfile.id,
      silent: true
    }).catch(() => {
      lastIdentityLinkSyncSignatureRef.current = "";
    });
  }, [
    db,
    usersLoaded,
    duplicateUserSignature,
    currentUserProfile?.id,
    authEmail,
    managers.length,
    editors.length,
    clients.length,
    accountTasks.length,
    editingTasks.length
  ]);
  const handleNavigate = (newView) => {
    if (!canAccessView(currentUserProfile, newView) || profileBlocked) {
      ensurePermission(
        VIEW_PERMISSIONS[newView],
        `Intento de acceso a ${newView}`
      );
      return;
    }
    setView(newView);
    localStorage.setItem("cluster_os_view", newView);
    setIsMobileMenuOpen(false);
    auditAction({
      action: "navigate",
      entityType: "navigation",
      entityId: newView,
      description: `Abre la vista ${newView}`
    });
  };
  const handleEventClick = (event, type) => setEventAction({ isOpen: true, event, type });
  const triggerConfetti = () => {
    if (window.confetti)
      window.confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#9333ea", "#3b82f6", "#10b981", "#f59e0b"]
      });
  };
  const handleGoogleSignIn = async () => {
    if (!auth || !GOOGLE_PROVIDER) return;
    setIsSigningIn(true);
    try {
      const result = await signInWithPopup(auth, GOOGLE_PROVIDER);
      if (!result?.pendingRedirect) {
        showToast("Sesion iniciada con Google");
      }
    } catch (error) {
      console.error(error);
      showToast(getGoogleAuthErrorMessage(error), "error");
    } finally {
      setIsSigningIn(false);
    }
  };
  const handleEmailLinkSignIn = async (event) => {
    event?.preventDefault();
    if (!auth) return;
    const normalizedEmail = normalizeEmail(loginEmail);
    if (!normalizedEmail) {
      showToast("Escribe tu correo para enviarte el acceso", "error");
      return;
    }
    setIsSendingLoginLink(true);
    try {
      auth.languageCode = "es";
      window.localStorage.setItem(EMAIL_LINK_STORAGE_KEY, normalizedEmail);
      await sendSignInLinkToEmail(
        auth,
        normalizedEmail,
        buildEmailLinkActionCodeSettings()
      );
      showToast("Te enviamos un enlace de acceso al correo");
    } catch (error) {
      console.error(error);
      showToast(getEmailLinkAuthErrorMessage(error, "send"), "error");
    } finally {
      setIsSendingLoginLink(false);
    }
  };
  const handleLogout = async () => {
    if (!auth) return;
    try {
      await auditAction({
        action: "logout",
        entityType: "session",
        description: "Cierre de sesion"
      });
      await firebaseSignOut(auth);
      await signInAnonymously(auth);
      showToast("Sesion cerrada");
    } catch (error) {
      console.error(error);
      showToast("No se pudo cerrar la sesion", "error");
    }
  };
  const urgentEditions = editingTasks.filter(
    (task) => getEditingHierarchyId(task) === "p1" && task.status !== "aprobado" && task.status !== "publicado"
  ).length;
  const pendingAccounts = accountTasks.filter(
    (t) => t.status === "por_disenar"
  ).length;
  const pendingManagement = managementTasks.filter(
    (task) => task.status !== "cerrado"
  ).length;
  const totalActiveAccountTasks = accountTasks.filter(
    (t) => t.status !== "publicado"
  ).length;
  const totalActiveEditingTasks = editingTasks.filter(
    (t) => t.status !== "aprobado" && t.status !== "publicado"
  ).length;
  const totalActiveManagementTasks = managementTasks.filter(
    (t) => t.status !== "cerrado"
  ).length;
  const isAdminConfigVisible = ["super_admin", "operations"].includes(
    currentUserProfile?.role
  );
  const isFirstTimeWorkspace = clients.length === 0 && accountTasks.length === 0 && editingTasks.length === 0 && managementTasks.length === 0;
  const sidebarFooterText = currentUserProfile?.isActive === false ? "Cuenta inactiva" : !authEmail ? "Sin sesi\xF3n iniciada" : `${currentRoleMeta.label} \xB7 ${authEmail}`;
  let allActivities = [
    ...events.map((e) => ({
      ...e,
      collectionType: "event",
      _color: "emerald",
      _icon: "CalendarIcon",
      _label: "Producci\xF3n"
    })),
    ...accountTasks.map((t) => {
      const manager = managers.find((m) => m.id === t.contextId);
      let rawColor = manager?.color || "indigo";
      let mColor = LEGACY_COLOR_MAP[rawColor] || rawColor;
      return {
        ...t,
        collectionType: "accountTask",
        _color: mColor,
        _icon: "LayoutList",
        _label: "Account"
      };
    }),
    ...editingTasks.map((t) => ({
      ...t,
      collectionType: "editingTask",
      _color: "slate",
      _icon: "Video",
      _label: "Edici\xF3n"
    }))
  ];
  allActivities = [
    ...events.map((event) => ({
      ...event,
      collectionType: "event",
      _color: "emerald",
      _icon: "CalendarIcon",
      _label: "Produccion"
    })),
    ...accountTasks.map((task) => {
      const manager = managers.find((item) => item.id === task.contextId);
      const rawColor = manager?.color || "indigo";
      const mappedColor = LEGACY_COLOR_MAP[rawColor] || rawColor;
      return {
        ...task,
        collectionType: "accountTask",
        _color: mappedColor,
        _icon: "LayoutList",
        _label: "Account"
      };
    }),
    ...editingTasks.map((task) => ({
      ...task,
      collectionType: "editingTask",
      _color: "slate",
      _icon: "Video",
      _label: "Edicion"
    })),
    ...managementTasks.map((task) => ({
      ...task,
      collectionType: "managementTask",
      _color: "violet",
      _icon: "ShieldCheck",
      _label: "Gestion"
    }))
  ];
  const addClient = async (fd) => {
    const manager = managers.find((m) => m.id === fd.managerId);
    await runMutation({
      permission: "manage_clients",
      action: "create",
      entityType: "client",
      description: `Crea el cliente ${fd.name}`,
      changes: { name: fd.name, managerId: fd.managerId || "" },
      successMessage: "Cliente creado",
      execute: () => addDoc(dataCollection("clients"), {
        ...fd,
        manager: manager ? manager.name : "",
        managerId: fd.managerId || "",
        managerUserId: manager?.userId || "",
        status: "Activo",
        createdAt: getHondurasTodayStr(),
        updatedAt: nowIso()
      }),
      afterSuccess: closeModal
    });
  };
  const updateClient = async (id, data) => {
    const nextData = { ...data };
    if (Object.prototype.hasOwnProperty.call(nextData, "managerId")) {
      const manager = managers.find((item) => item.id === nextData.managerId);
      nextData.manager = manager ? manager.name : "";
      nextData.managerUserId = manager?.userId || "";
    }
    await runMutation({
      permission: "manage_clients",
      action: "update",
      entityType: "client",
      entityId: id,
      description: `Actualiza el cliente ${id}`,
      changes: nextData,
      successMessage: "Cliente actualizado",
      execute: () => updateDoc(dataDoc("clients", id), { ...nextData, updatedAt: nowIso() }),
      afterSuccess: closeModal
    });
  };
  const reassignClientManager = async (client, newManagerId) => {
    if (!newManagerId) return;
    const newManager = managers.find((m) => m.id === newManagerId);
    if (!newManager) return;
    await runMutation({
      permission: "manage_clients",
      action: "reassign",
      entityType: "client",
      entityId: client.id,
      description: `Reasigna ${client.name} a ${newManager.name}`,
      changes: { from: client.managerId || "", to: newManagerId },
      successMessage: `Cliente mudado a ${newManager.name}`,
      execute: async () => {
        await updateDoc(dataDoc("clients", client.id), {
          manager: newManager.name,
          managerId: newManager.id,
          updatedAt: nowIso()
        });
        const tasksToMove = accountTasks.filter(
          (task) => task.clientId === client.id && !isAccountTaskDone(task)
        );
        await Promise.all(
          tasksToMove.map(
            (task) => updateDoc(dataDoc("account_tasks", task.id), {
              contextId: newManager.id,
              assigneeUserId: newManager.userId || "",
              updatedAt: nowIso()
            })
          )
        );
      },
      errorMessage: "Error al reasignar"
    });
  };
  const addManager = async (fd) => {
    const color = ACCOUNT_COLORS[managers.length % ACCOUNT_COLORS.length];
    const normalizedEmail = normalizeEmail(fd.email);
    const result = await runMutation({
      permission: "manage_managers",
      action: "create",
      entityType: "manager",
      description: `Crea manager ${fd.name}`,
      changes: { name: fd.name, email: normalizedEmail },
      successMessage: "Manager agregado",
      execute: () => addDoc(dataCollection("managers"), {
        ...fd,
        email: normalizedEmail,
        color,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        userId: ""
      }),
      afterSuccess: closeModal
    });
    if (result?.id && normalizedEmail)
      await syncIdentityLinks({
        email: normalizedEmail,
        managerId: result.id,
        silent: true
      });
  };
  const updateManager = async (id, data) => {
    const normalizedEmail = normalizeEmail(data.email);
    const result = await runMutation({
      permission: "manage_managers",
      action: "update",
      entityType: "manager",
      entityId: id,
      description: `Actualiza manager ${id}`,
      changes: data,
      successMessage: "Actualizado",
      execute: () => updateDoc(dataDoc("managers", id), {
        ...data,
        email: normalizedEmail,
        updatedAt: nowIso()
      }),
      afterSuccess: closeModal
    });
    if (result !== null && normalizedEmail)
      await syncIdentityLinks({
        email: normalizedEmail,
        managerId: id,
        silent: true
      });
  };
  const addEditor = async (fd) => {
    const color = EDITOR_COLORS[editors.length % EDITOR_COLORS.length];
    const normalizedEmail = normalizeEmail(fd.email);
    const result = await runMutation({
      permission: "manage_editors",
      action: "create",
      entityType: "editor",
      description: `Crea editor ${fd.name}`,
      changes: { name: fd.name, email: normalizedEmail },
      successMessage: "Editor agregado",
      execute: () => addDoc(dataCollection("editors"), {
        ...fd,
        email: normalizedEmail,
        color,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        userId: ""
      }),
      afterSuccess: closeModal
    });
    if (result?.id && normalizedEmail)
      await syncIdentityLinks({
        email: normalizedEmail,
        editorId: result.id,
        silent: true
      });
  };
  const updateEditor = async (id, data) => {
    const normalizedEmail = normalizeEmail(data.email);
    const result = await runMutation({
      permission: "manage_editors",
      action: "update",
      entityType: "editor",
      entityId: id,
      description: `Actualiza editor ${id}`,
      changes: data,
      successMessage: "Actualizado",
      execute: () => updateDoc(dataDoc("editors", id), {
        ...data,
        email: normalizedEmail,
        updatedAt: nowIso()
      }),
      afterSuccess: closeModal
    });
    if (result !== null && normalizedEmail)
      await syncIdentityLinks({
        email: normalizedEmail,
        editorId: id,
        silent: true
      });
  };
  const addAccountTask = async (data) => {
    const manager = managers.find((item) => item.id === data.contextId);
    await runMutation({
      permission: "create_account_tasks",
      action: "create",
      entityType: "accountTask",
      description: `Crea tarea de account ${data.title}`,
      changes: data,
      successMessage: "Agendado",
      execute: () => addDoc(dataCollection("account_tasks"), {
        ...data,
        assigneeUserId: manager?.userId || "",
        notificationsEnabled: data.notificationsEnabled !== false,
        status: "por_disenar",
        createdAt: nowIso(),
        updatedAt: nowIso()
      }),
      afterSuccess: closeModal
    });
  };
  const updateAccountTask = async (id, data) => {
    const manager = managers.find((item) => item.id === data.contextId);
    const existingTask = accountTasks.find((item) => item.id === id);
    const historicalOwnerPatch = existingTask && isAccountTaskDone(existingTask) && (!existingTask.ownerAtCompletionId || !existingTask.dueDateAtCompletion) ? {
      ownerAtCompletionId: existingTask.ownerAtCompletionId || existingTask.contextId || "",
      dueDateAtCompletion: existingTask.dueDateAtCompletion || normalizeDateOnlyString(existingTask.date)
    } : {};
    await runMutation({
      permission: "manage_account_tasks",
      action: "update",
      entityType: "accountTask",
      entityId: id,
      description: `Actualiza tarea de account ${id}`,
      changes: data,
      successMessage: "Guardado",
      execute: () => updateDoc(dataDoc("account_tasks", id), {
        ...data,
        assigneeUserId: manager?.userId || "",
        ...historicalOwnerPatch,
        updatedAt: nowIso()
      }),
      afterSuccess: closeModal
    });
  };
  const changeAccountTaskStatus = async (task, newStatus) => {
    if (newStatus) {
      await runQueuedTaskStatusMutation({
        collectionName: "account_tasks",
        task,
        newStatus,
        permission: "manage_account_tasks",
        entityType: "accountTask",
        description: `Mueve task ${task.title} a ${newStatus}`,
        changes: { previousStatus: task.status, nextStatus: newStatus },
        statusPatch: (stamp) => getStatusTimestampPatch(
          task,
          newStatus,
          stamp,
          currentUserProfile?.id,
          "account"
        ),
        afterSuccess: () => {
          if (newStatus === "publicado") triggerConfetti();
        }
      });
    }
  };
  const addEditingTask = async (data) => {
    const editor = editors.find((item) => item.id === data.contextId);
    const stamp = nowIso();
    const initialStatus = data.status || "editar";
    const initialTask = { ...data, status: initialStatus };
    await runMutation({
      permission: "create_editing_tasks",
      action: "create",
      entityType: "editingTask",
      description: `Crea video ${data.title}`,
      changes: {
        ...data,
        hierarchy: data.hierarchy || getEditingHierarchyId(data)
      },
      successMessage: "Agendado",
      execute: () => addDoc(dataCollection("editing"), {
        ...data,
        hierarchy: data.hierarchy || getEditingHierarchyId(data),
        assigneeUserId: editor?.userId || "",
        notificationsEnabled: data.notificationsEnabled !== false,
        status: initialStatus,
        ...getStatusTimestampPatch(
          initialTask,
          initialStatus,
          stamp,
          currentUserProfile?.id,
          "editing"
        ),
        createdAt: stamp,
        updatedAt: stamp
      }),
      afterSuccess: closeModal
    });
  };
  const updateEditingTask = async (id, data) => {
    const editor = editors.find((item) => item.id === data.contextId);
    const existingTask = editingTasks.find((item) => item.id === id);
    const stamp = nowIso();
    const statusPatch = existingTask?.status && data.status && existingTask.status !== data.status ? getStatusTimestampPatch(
      existingTask,
      data.status,
      stamp,
      currentUserProfile?.id,
      "editing"
    ) : {};
    await runMutation({
      permission: "manage_editing_tasks",
      action: "update",
      entityType: "editingTask",
      entityId: id,
      description: `Actualiza video ${id}`,
      changes: data,
      successMessage: "Guardado",
      execute: () => updateDoc(dataDoc("editing", id), {
        ...data,
        hierarchy: data.hierarchy || getEditingHierarchyId(data),
        assigneeUserId: editor?.userId || "",
        ...statusPatch,
        updatedAt: stamp
      }),
      afterSuccess: closeModal
    });
  };
  const changeEditingTaskStatus = async (task, newStatus) => {
    if (newStatus) {
      await runQueuedTaskStatusMutation({
        collectionName: "editing",
        task,
        newStatus,
        permission: "manage_editing_tasks",
        entityType: "editingTask",
        description: `Mueve video ${task.title} a ${newStatus}`,
        changes: {
          previousStatus: task.status,
          nextStatus: newStatus,
          hierarchy: getEditingHierarchyId(task)
        },
        statusPatch: (stamp) => getStatusTimestampPatch(
          task,
          newStatus,
          stamp,
          currentUserProfile?.id,
          "editing"
        ),
        afterSuccess: () => {
          if (newStatus === "aprobado" || newStatus === "publicado")
            triggerConfetti();
        }
      });
    }
  };
  const addManagementTask = async (data) => {
    const member = managementUsers.find((item) => item.id === data.contextId);
    const normalizedDate = normalizeDateOnlyString(data.date);
    const normalizedTime = normalizeTimeValue(data.time);
    if (!normalizedDate || !normalizedTime) {
      showToast("La tarea de gestion requiere fecha y hora limite.", "error");
      return;
    }
    if (data.notificationsEnabled !== false && !normalizeEmail(member?.email)) {
      showToast(
        "El integrante asignado necesita un correo para recibir recordatorios automaticos.",
        "error"
      );
      return;
    }
    await runMutation({
      permission: "create_management_tasks",
      action: "create",
      entityType: "managementTask",
      description: `Crea tarea de gestion ${data.title}`,
      changes: data,
      successMessage: "Agendado",
      execute: () => addDoc(dataCollection("management_tasks"), {
        ...data,
        date: normalizedDate,
        time: normalizedTime,
        assigneeUserId: member?.id || "",
        status: "pendiente",
        createdAt: nowIso(),
        updatedAt: nowIso()
      }),
      afterSuccess: closeModal
    });
  };
  const updateManagementTask = async (id, data) => {
    const member = managementUsers.find((item) => item.id === data.contextId);
    const normalizedDate = normalizeDateOnlyString(data.date);
    const normalizedTime = normalizeTimeValue(data.time);
    if (!normalizedDate || !normalizedTime) {
      showToast("La tarea de gestion requiere fecha y hora limite.", "error");
      return;
    }
    if (data.notificationsEnabled !== false && !normalizeEmail(member?.email)) {
      showToast(
        "El integrante asignado necesita un correo para recibir recordatorios automaticos.",
        "error"
      );
      return;
    }
    const updatePermission = userHasPermission(
      currentUserProfile,
      "manage_management_tasks"
    ) ? "manage_management_tasks" : "create_management_tasks";
    await runMutation({
      permission: updatePermission,
      action: "update",
      entityType: "managementTask",
      entityId: id,
      description: `Actualiza tarea de gestion ${id}`,
      changes: data,
      successMessage: "Guardado",
      execute: () => updateDoc(dataDoc("management_tasks", id), {
        ...data,
        date: normalizedDate,
        time: normalizedTime,
        assigneeUserId: member?.id || "",
        updatedAt: nowIso()
      }),
      afterSuccess: closeModal
    });
  };
  const changeManagementTaskStatus = async (task, newStatus) => {
    if (newStatus) {
      await runQueuedTaskStatusMutation({
        collectionName: "management_tasks",
        task,
        newStatus,
        permission: "manage_management_tasks",
        entityType: "managementTask",
        description: `Mueve tarea de gestion ${task.title} a ${newStatus}`,
        changes: { previousStatus: task.status, nextStatus: newStatus },
        statusPatch: (stamp) => getStatusTimestampPatch(
          task,
          newStatus,
          stamp,
          currentUserProfile?.id,
          "management"
        )
      });
    }
  };
  const changeTaskPriority = async (task, type, priority) => {
    const colMap = {
      accountTask: "account_tasks",
      editingTask: "editing",
      managementTask: "management_tasks"
    };
    const col = colMap[type];
    if (!col) return;
    await updateDoc(dataDoc(col, task.id), { priority, updatedAt: nowIso() });
  };
  const changeTaskAssignee = async (task, type, contextId) => {
    const colMap = {
      accountTask: "account_tasks",
      editingTask: "editing",
      managementTask: "management_tasks"
    };
    const col = colMap[type];
    if (!col) return;
    const historicalOwnerPatch = type === "accountTask" && isAccountTaskDone(task) && (!task.ownerAtCompletionId || !task.dueDateAtCompletion) ? {
      ownerAtCompletionId: task.ownerAtCompletionId || task.contextId || "",
      dueDateAtCompletion: task.dueDateAtCompletion || normalizeDateOnlyString(task.date)
    } : {};
    await updateDoc(dataDoc(col, task.id), {
      contextId: contextId || null,
      ...historicalOwnerPatch,
      updatedAt: nowIso()
    });
  };
  const changeTaskAssignees = async (task, type, assigneeIds) => {
    const colMap = {
      accountTask: "account_tasks",
      editingTask: "editing",
      managementTask: "management_tasks"
    };
    const col = colMap[type];
    if (!col) return;
    await updateDoc(dataDoc(col, task.id), {
      assignees: assigneeIds,
      updatedAt: nowIso()
    });
  };
  const sendNotification = async (payload) => {
    try {
      await apiFetch("/api/notifications/send", {
        method: "POST",
        body: JSON.stringify({ ...payload, appUrl: window.location.origin })
      });
    } catch (e) {
      console.warn("[notify]", e.message);
    }
  };
  const addTaskComment = async (task, type, text, mentionedIds = []) => {
    const colMap = {
      accountTask: "account_tasks",
      editingTask: "editing",
      managementTask: "management_tasks"
    };
    const col = colMap[type];
    if (!col || !text) return;
    const senderName = currentUserProfile?.name || (authEmail ? authEmail.split("@")[0] : "Usuario");
    const newComment = {
      id: Math.random().toString(36).slice(2, 10),
      text,
      authorName: senderName,
      authorId: currentUserProfile?.id || "",
      createdAt: nowIso()
    };
    await updateDoc(dataDoc(col, task.id), {
      comments: [...task.comments || [], newComment],
      updatedAt: nowIso()
    });
    const allPeople = [
      ...managementUsers || [],
      ...managers || [],
      ...editors || []
    ];
    for (const uid of mentionedIds) {
      const person = allPeople.find((p) => p.id === uid);
      const email = person?.email || person?.authEmail;
      if (email && uid !== (currentUserProfile?.id || "")) {
        sendNotification({
          to: email,
          type: "mention",
          senderName,
          taskTitle: task.title,
          taskType: type,
          comment: text
        });
      }
    }
  };
  const addTaskTimeEntry = async (task, type, durationMs) => {
    const colMap = {
      accountTask: "account_tasks",
      editingTask: "editing",
      managementTask: "management_tasks"
    };
    const col = colMap[type];
    if (!col || !durationMs || durationMs < 1e3) return;
    const newEntry = {
      id: Math.random().toString(36).slice(2, 10),
      durationMs,
      authorName: currentUserProfile?.name || (authEmail ? authEmail.split("@")[0] : "Usuario"),
      authorId: currentUserProfile?.id || "",
      loggedAt: nowIso()
    };
    await updateDoc(dataDoc(col, task.id), {
      timeEntries: [...task.timeEntries || [], newEntry],
      updatedAt: nowIso()
    });
  };
  const updateTaskChecklist = async (task, type, checklist) => {
    const colMap = {
      accountTask: "account_tasks",
      editingTask: "editing",
      managementTask: "management_tasks"
    };
    const col = colMap[type];
    if (!col) return;
    await updateDoc(dataDoc(col, task.id), { checklist, updatedAt: nowIso() });
  };
  const addTaskAttachment = async (task, type, file) => {
    const colMap = {
      accountTask: "account_tasks",
      editingTask: "editing",
      managementTask: "management_tasks"
    };
    const col = colMap[type];
    if (!col || !file) return;
    const MAX_SIZE = 8 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert("El archivo es demasiado grande (m\xE1x. 8 MB)");
      return;
    }
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const newAttachment = {
      id: Math.random().toString(36).slice(2, 10),
      name: file.name,
      type: file.type,
      size: file.size,
      data: base64,
      uploadedBy: currentUserProfile?.name || (authEmail ? authEmail.split("@")[0] : "Usuario"),
      uploadedAt: nowIso()
    };
    const currentSnap = await getDoc(dataDoc(col, task.id));
    const currentAttachments = currentSnap.data()?.attachments || [];
    await updateDoc(dataDoc(col, task.id), {
      attachments: [...currentAttachments, newAttachment],
      updatedAt: nowIso()
    });
  };
  const removeTaskAttachment = async (task, type, attachmentId) => {
    const colMap = {
      accountTask: "account_tasks",
      editingTask: "editing",
      managementTask: "management_tasks"
    };
    const col = colMap[type];
    if (!col) return;
    const currentSnap = await getDoc(dataDoc(col, task.id));
    const currentAttachments = currentSnap.data()?.attachments || [];
    await updateDoc(dataDoc(col, task.id), {
      attachments: currentAttachments.filter((a) => a.id !== attachmentId),
      updatedAt: nowIso()
    });
  };
  const addEvent = async (data) => {
    await runMutation({
      permission: "create_calendar_events",
      action: "create",
      entityType: "event",
      description: `Crea evento ${data.title}`,
      changes: data,
      successMessage: "Agendado",
      execute: () => addDoc(dataCollection("events"), {
        ...data,
        createdAt: nowIso(),
        updatedAt: nowIso()
      }),
      afterSuccess: closeModal
    });
  };
  const updateEvent = async (id, data) => {
    await runMutation({
      permission: "manage_calendar",
      action: "update",
      entityType: "event",
      entityId: id,
      description: `Actualiza evento ${id}`,
      changes: data,
      successMessage: "Guardado",
      execute: () => updateDoc(dataDoc("events", id), { ...data, updatedAt: nowIso() }),
      afterSuccess: closeModal
    });
  };
  const addUserRecord = async (data) => {
    const email = normalizeEmail(data.email);
    const requestedRole = data.role || "viewer";
    const nextActive = data.isActive !== false;
    const managementKey = requestedRole === "management" ? getManagementDirectoryKey(data.name) : "";
    const existingManagementUser = managementKey ? chooseCanonicalUserRecord(
      appUsers.filter(
        (item) => item.role === "management" && (item.managementKey || getManagementDirectoryKey(item)) === managementKey
      )
    ) : null;
    if (!email) {
      showToast("El correo es obligatorio", "error");
      return;
    }
    if (existingManagementUser) {
      await updateUserRecord(existingManagementUser.id, {
        ...data,
        role: "management"
      });
      return;
    }
    if (appUsers.some((item) => normalizeEmail(item.email) === email)) {
      showToast("Ese correo ya existe", "error");
      return;
    }
    const requestedAt = nowIso();
    const pendingVerification = {
      status: "pending",
      source: "email_link",
      requestedAt,
      lastError: ""
    };
    const result = await runMutation({
      permission: "manage_users",
      action: "create",
      entityType: "user",
      description: `Crea usuario ${email}`,
      changes: {
        name: data.name,
        email,
        role: requestedRole,
        isActive: data.isActive
      },
      successMessage: null,
      execute: () => addDoc(dataCollection("users"), {
        name: data.name,
        email,
        role: requestedRole,
        isActive: nextActive,
        profession: data.profession || "",
        photo: data.photo || "",
        createdAt: requestedAt,
        updatedAt: requestedAt,
        lastSeenAt: "",
        emailVerified: false,
        emailVerification: pendingVerification,
        managementKey: requestedRole === "management" ? managementKey : "",
        linkedManagerId: "",
        linkedEditorId: ""
      }),
      afterSuccess: closeModal
    });
    if (!result?.id) return;
    if (nextActive) {
      try {
        await sendUserEmailLink({
          userId: result.id,
          email,
          userRecord: {
            name: data.name,
            email,
            role: requestedRole,
            isActive: nextActive,
            emailVerification: pendingVerification
          },
          reason: "user_created"
        });
        showToast("Usuario creado y correo de acceso enviado.");
      } catch (error) {
        console.error(error);
        showToast(
          "Usuario creado, pero no se pudo enviar el correo de acceso.",
          "error"
        );
      }
    } else {
      showToast("Usuario creado");
    }
    await syncIdentityLinks({ email, userId: result.id, silent: true });
  };
  const updateUserRecord = async (id, data) => {
    const email = normalizeEmail(data.email);
    if (!email) {
      showToast("El correo es obligatorio", "error");
      return;
    }
    if (appUsers.some(
      (item) => item.id !== id && normalizeEmail(item.email) === email
    )) {
      showToast("Ese correo ya esta en uso", "error");
      return;
    }
    const current = appUsers.find((item) => item.id === id);
    const nextRole = data.role || current?.role || "viewer";
    const nextManagementKey = nextRole === "management" ? getManagementDirectoryKey(data.name || current?.name || "") : "";
    const nextActive = data.isActive !== false;
    const emailChanged = email !== normalizeEmail(current?.email);
    if (privilegedUsers.length === 1 && privilegedUsers[0].id === id && (!["super_admin", "operations"].includes(nextRole) || !nextActive)) {
      showToast(
        "Debe existir al menos un usuario administrador activo",
        "error"
      );
      return;
    }
    const nextVerification = emailChanged ? {
      ...current?.emailVerification || {},
      status: "pending",
      source: "email_link",
      requestedAt: nowIso(),
      sentAt: "",
      failedAt: "",
      verifiedAt: "",
      lastRecipient: email,
      lastError: ""
    } : current?.emailVerification || {};
    const nextEmailVerified = emailChanged ? false : current?.emailVerified === true;
    const result = await runMutation({
      permission: "manage_users",
      action: "update",
      entityType: "user",
      entityId: id,
      description: `Actualiza usuario ${email}`,
      changes: {
        name: data.name,
        email,
        role: nextRole,
        isActive: nextActive,
        emailChanged
      },
      successMessage: emailChanged ? null : "Usuario actualizado",
      execute: () => updateDoc(dataDoc("users", id), {
        name: data.name,
        email,
        role: nextRole,
        managementKey: nextManagementKey,
        isActive: nextActive,
        profession: data.profession || "",
        photo: data.photo || "",
        emailVerified: nextEmailVerified,
        emailVerification: nextVerification,
        updatedAt: nowIso()
      }),
      afterSuccess: closeModal
    });
    if (result === null) return;
    await syncIdentityLinks({ email, userId: id, silent: true });
    if (!emailChanged) return;
    if (!nextActive) {
      showToast("Usuario actualizado");
      return;
    }
    try {
      await sendUserEmailLink({
        userId: id,
        email,
        userRecord: {
          ...current || {},
          name: data.name,
          email,
          role: nextRole,
          isActive: nextActive,
          emailVerification: nextVerification
        },
        reason: "email_changed"
      });
      showToast("Usuario actualizado y correo de acceso enviado.");
    } catch (error) {
      console.error(error);
      showToast(
        "Usuario actualizado, pero no se pudo enviar el correo de acceso.",
        "error"
      );
    }
  };
  const updateMyProfile = async (data) => {
    if (!currentUserProfile?.id) {
      showToast("No hay un perfil para editar", "error");
      return;
    }
    await runMutation({
      permission: null,
      action: "update",
      entityType: "user",
      entityId: currentUserProfile.id,
      description: "Actualiza su propio perfil",
      changes: { name: data.name, profession: data.profession },
      successMessage: "Perfil actualizado",
      execute: () => updateDoc(dataDoc("users", currentUserProfile.id), {
        name: data.name || currentUserProfile.name || "",
        profession: data.profession || "",
        photo: data.photo || "",
        updatedAt: nowIso()
      })
    });
  };
  const handleDelete = async () => {
    const { type, id } = deleteConfirm;
    const map = {
      client: {
        collection: "clients",
        permission: "manage_clients",
        entityType: "client",
        after: () => {
          setView("clients");
          setSelectedClient(null);
        }
      },
      manager: {
        collection: "managers",
        permission: "manage_managers",
        entityType: "manager",
        after: () => {
          setView("managers");
          setSelectedManager(null);
        }
      },
      editor: {
        collection: "editors",
        permission: "manage_editors",
        entityType: "editor",
        after: () => {
          setView("editors");
          setSelectedEditor(null);
        }
      },
      event: {
        collection: "events",
        permission: "manage_calendar",
        entityType: "event"
      },
      accountTask: {
        collection: "account_tasks",
        permission: "manage_account_tasks",
        entityType: "accountTask"
      },
      editingTask: {
        collection: "editing",
        permission: "manage_editing_tasks",
        entityType: "editingTask"
      },
      managementTask: {
        collection: "management_tasks",
        permission: "manage_management_tasks",
        entityType: "managementTask"
      }
    };
    const current = map[type];
    if (!current) {
      closeDelete();
      return;
    }
    await runMutation({
      permission: current.permission,
      action: "delete",
      entityType: current.entityType,
      entityId: id,
      description: `Elimina ${current.entityType} ${id}`,
      successMessage: "Eliminado",
      execute: () => deleteDoc(dataDoc(current.collection, id)),
      afterSuccess: () => {
        if (current.after) current.after();
        closeDelete();
      }
    });
  };
  const canEditActivity = (collectionType) => {
    if (collectionType === "accountTask")
      return userHasPermission(currentUserProfile, "manage_account_tasks");
    if (collectionType === "editingTask")
      return userHasPermission(currentUserProfile, "manage_editing_tasks");
    if (collectionType === "managementTask")
      return userHasPermission(currentUserProfile, "manage_management_tasks");
    if (collectionType === "event")
      return userHasPermission(currentUserProfile, "manage_calendar");
    return false;
  };
  if (loading) return /* @__PURE__ */ React.createElement(AppShellSkeleton, null);
  if (!authEmail) {
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      LoginScreen,
      {
        isDark,
        onToggleTheme: () => setIsDark(!isDark),
        onGoogleSignIn: handleGoogleSignIn,
        isSigningIn,
        email: loginEmail,
        onEmailChange: setLoginEmail,
        onEmailSubmit: handleEmailLinkSignIn,
        isSendingLoginLink
      }
    ), /* @__PURE__ */ React.createElement(
      "div",
      {
        "aria-live": "polite",
        "aria-atomic": "true",
        className: "fixed bottom-6 right-6 z-[110] pointer-events-none"
      },
      toast && /* @__PURE__ */ React.createElement(Toast, { message: toast.message, type: toast.type })
    ));
  }
  return /* @__PURE__ */ React.createElement("div", { className: "app-shell flex h-screen overflow-hidden flex-col md:flex-row transition-colors duration-300" }, /* @__PURE__ */ React.createElement("div", { className: "app-sidebar md:hidden border-b p-4 flex justify-between items-center z-30 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(AgencyLogo, { className: "w-8 h-8 text-sm" }), /* @__PURE__ */ React.createElement("span", { className: "brand-name text-lg font-bold text-slate-800 dark:text-white" }, "CLUSTER")), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setIsMobileMenuOpen(!isMobileMenuOpen),
      "aria-label": isMobileMenuOpen ? "Cerrar navegaci\xF3n" : "Abrir navegaci\xF3n",
      "aria-expanded": isMobileMenuOpen,
      className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
    },
    /* @__PURE__ */ React.createElement(Icon, { name: isMobileMenuOpen ? "X" : "Menu", size: 24 })
  )), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity md:hidden ${isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`,
      onClick: () => setIsMobileMenuOpen(false)
    }
  ), /* @__PURE__ */ React.createElement(
    "aside",
    {
      className: `app-sidebar fixed md:relative z-50 h-full border-r flex flex-col w-60 shrink-0 transition-transform duration-300 top-0 left-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`
    },
    /* @__PURE__ */ React.createElement("div", { className: "px-5 pt-6 pb-3 hidden md:block" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(AgencyLogo, { className: "w-9 h-9 text-lg" }), /* @__PURE__ */ React.createElement("div", { className: "leading-none" }, /* @__PURE__ */ React.createElement("h1", { className: "brand-name text-xl font-bold text-slate-800 dark:text-white" }, "CLUSTER"), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-widest mt-1" }, "Agency OS")))),
    /* @__PURE__ */ React.createElement(
      "nav",
      {
        className: "flex-1 px-4 space-y-1 pt-20 md:pt-4 overflow-y-auto custom-scroll",
        "aria-label": "Navegaci\xF3n principal"
      },
      /* @__PURE__ */ React.createElement("div", { className: "pt-1 pb-2 pl-4 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest" }, "Principal"),
      canAccessView(currentUserProfile, "dashboard") && /* @__PURE__ */ React.createElement(
        SidebarItem,
        {
          active: view === "dashboard",
          onClick: () => handleNavigate("dashboard"),
          icon: "LayoutDashboard",
          label: "Panel Central",
          color: "purple"
        }
      ),
      /* @__PURE__ */ React.createElement("div", { className: "pt-4 pb-2 pl-4 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2" }, "Clientes & equipo"),
      canAccessView(currentUserProfile, "clients") && /* @__PURE__ */ React.createElement(
        SidebarItem,
        {
          active: view === "clients" || view === "client-detail",
          onClick: () => handleNavigate("clients"),
          icon: "Briefcase",
          label: "Clientes",
          color: "blue"
        }
      ),
      (canAccessView(currentUserProfile, "managers") || canAccessView(currentUserProfile, "editors")) && /* @__PURE__ */ React.createElement(
        SidebarItem,
        {
          active: [
            "managers",
            "manager-detail",
            "editors",
            "editor-detail"
          ].includes(view),
          onClick: () => handleNavigate(
            canAccessView(currentUserProfile, "managers") ? "managers" : "editors"
          ),
          icon: "Users",
          label: "Equipo",
          color: "slate"
        }
      ),
      /* @__PURE__ */ React.createElement("div", { className: "pt-4 pb-2 pl-4 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2" }, "Salas de trabajo"),
      canAccessView(currentUserProfile, "account-room") && /* @__PURE__ */ React.createElement(
        SidebarItem,
        {
          active: view === "account-room",
          onClick: () => handleNavigate("account-room"),
          icon: "LayoutList",
          label: "Sala de Accounts",
          color: "indigo",
          badge: totalActiveAccountTasks > 0 ? totalActiveAccountTasks : null,
          badgeColor: pendingAccounts > 0 ? "bg-indigo-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
        }
      ),
      canAccessView(currentUserProfile, "management-room") && /* @__PURE__ */ React.createElement(
        SidebarItem,
        {
          active: view === "management-room",
          onClick: () => handleNavigate("management-room"),
          icon: "ShieldCheck",
          label: "Sala de Gesti\xF3n",
          color: "violet",
          badge: totalActiveManagementTasks > 0 ? totalActiveManagementTasks : null,
          badgeColor: pendingManagement > 0 ? "bg-violet-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
        }
      ),
      canAccessView(currentUserProfile, "editions") && /* @__PURE__ */ React.createElement(
        SidebarItem,
        {
          active: view === "editions",
          onClick: () => handleNavigate("editions"),
          icon: "Video",
          label: "Sala de Edici\xF3n",
          color: "amber",
          badge: totalActiveEditingTasks > 0 ? totalActiveEditingTasks : null,
          badgeColor: urgentEditions > 0 ? "bg-red-500 text-white animate-pulse" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
        }
      ),
      /* @__PURE__ */ React.createElement("div", { className: "pt-4 pb-2 pl-4 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2" }, "Calendario"),
      (canAccessView(currentUserProfile, "general-calendar") || canAccessView(currentUserProfile, "calendar")) && /* @__PURE__ */ React.createElement(
        SidebarItem,
        {
          active: ["general-calendar", "calendar"].includes(view),
          onClick: () => handleNavigate(
            canAccessView(currentUserProfile, "general-calendar") ? "general-calendar" : "calendar"
          ),
          icon: "CalendarDays",
          label: "Calendario",
          color: "slate"
        }
      ),
      canAccessView(currentUserProfile, "reports") && /* @__PURE__ */ React.createElement(
        SidebarItem,
        {
          active: view === "reports",
          onClick: () => handleNavigate("reports"),
          icon: "BarChart3",
          label: "Reportes",
          color: "emerald"
        }
      ),
      currentUserProfile && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "pt-4 pb-2 pl-4 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2" }, "Configuraci\xF3n"), /* @__PURE__ */ React.createElement(
        SidebarItem,
        {
          active: view === "settings",
          onClick: () => handleNavigate("settings"),
          icon: "User",
          label: "Mi Perfil",
          color: "purple"
        }
      ), isAdminConfigVisible && canAccessView(currentUserProfile, "control-center") && /* @__PURE__ */ React.createElement(
        SidebarItem,
        {
          active: view === "control-center",
          onClick: () => handleNavigate("control-center"),
          icon: "ClipboardList",
          label: "Usuarios y accesos",
          color: "purple"
        }
      ))
    ),
    /* @__PURE__ */ React.createElement("div", { className: "p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleNavigate("settings"),
        "aria-label": "Editar mi perfil",
        className: "w-full flex items-center gap-3 p-1 -m-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors text-left"
      },
      currentUserProfile?.photo ? /* @__PURE__ */ React.createElement(
        "img",
        {
          src: currentUserProfile.photo,
          alt: currentUserProfile?.name || "Perfil",
          className: "w-10 h-10 rounded-full object-cover border border-black/5 dark:border-white/10 shrink-0"
        }
      ) : /* @__PURE__ */ React.createElement(
        "div",
        {
          className: `w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${profileBlocked ? "bg-[#9f2f2d]" : "bg-[#555552]"}`
        },
        (currentUserProfile?.name || "IN").slice(0, 2).toUpperCase()
      ),
      /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-slate-700 dark:text-slate-200 truncate" }, currentUserProfile?.name || "Invitado"), currentUserProfile?.profession && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate" }, currentUserProfile.profession), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase truncate" }, sidebarFooterText)),
      /* @__PURE__ */ React.createElement(
        Icon,
        {
          name: "ChevronRight",
          size: 16,
          className: "text-slate-400 dark:text-slate-500 shrink-0"
        }
      )
    ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
      "span",
      {
        className: `text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${profileBlocked ? "bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400" : currentVerificationMeta.color === "emerald" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" : currentVerificationMeta.color === "amber" ? "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" : currentVerificationMeta.color === "blue" ? "bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"}`
      },
      profileBlocked ? "Bloqueado" : authEmail ? currentVerificationMeta.label : "Invitado"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setIsDark(!isDark),
        "aria-label": isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro",
        title: isDark ? "Modo claro" : "Modo oscuro",
        className: "ml-auto p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300"
      },
      /* @__PURE__ */ React.createElement(Icon, { name: isDark ? "Sun" : "Moon", size: 16 })
    ), authEmail ? /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleLogout,
        "aria-label": "Cerrar sesi\xF3n",
        title: "Cerrar sesi\xF3n",
        className: "p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300"
      },
      /* @__PURE__ */ React.createElement(Icon, { name: "LogOut", size: 16 })
    ) : /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleGoogleSignIn,
        disabled: isSigningIn,
        "aria-label": "Iniciar sesi\xF3n",
        title: "Iniciar sesi\xF3n",
        className: "p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 disabled:opacity-60"
      },
      /* @__PURE__ */ React.createElement(
        Icon,
        {
          name: isSigningIn ? "Loader2" : "LogIn",
          size: 16,
          className: isSigningIn ? "animate-spin" : ""
        }
      )
    )))
  ), /* @__PURE__ */ React.createElement("main", { className: "app-main flex-1 overflow-y-auto relative w-full h-full" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 md:p-8 max-w-[1360px] mx-auto min-h-full pb-mobile-nav md:pb-20" }, view === "dashboard" && (isFirstTimeWorkspace ? /* @__PURE__ */ React.createElement(
    FirstTimeView,
    {
      role: currentUserProfile?.role,
      onNavigate: handleNavigate
    }
  ) : /* @__PURE__ */ React.createElement(
    DashboardView,
    {
      clients,
      managers,
      users: appUsers,
      events,
      tasks: editingTasks,
      accountTasks,
      managementTasks,
      currentUserProfile,
      onSignIn: handleGoogleSignIn,
      onNavigate: handleNavigate,
      onOpenTask: (task, type) => setTaskDetailConfig({
        isOpen: true,
        task,
        type
      })
    }
  )), view === "clients" && /* @__PURE__ */ React.createElement(
    ClientsView,
    {
      clients,
      managers,
      legacyColorMap: LEGACY_COLOR_MAP,
      onReassignManager: reassignClientManager,
      onAdd: () => setModalConfig({ isOpen: true, type: "client" }),
      onSelect: (c) => {
        setSelectedClient(c);
        handleNavigate("client-detail");
      }
    }
  ), view === "client-detail" && selectedClient && /* @__PURE__ */ React.createElement(
    ClientDetail,
    {
      client: selectedClient,
      managers,
      legacyColorMap: LEGACY_COLOR_MAP,
      onReassignManager: reassignClientManager,
      onBack: () => handleNavigate("clients"),
      onUpdate: updateClient,
      onDelete: () => setDeleteConfirm({
        isOpen: true,
        type: "client",
        id: selectedClient.id,
        title: selectedClient.name
      }),
      onEdit: () => setModalConfig({
        isOpen: true,
        type: "client",
        data: selectedClient,
        isEdit: true
      })
    }
  ), view === "managers" && /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement(
    ViewTabs,
    {
      active: "managers",
      onChange: handleNavigate,
      items: [
        canAccessView(currentUserProfile, "managers") && {
          id: "managers",
          label: "Accounts"
        },
        canAccessView(currentUserProfile, "editors") && {
          id: "editors",
          label: "Editores"
        }
      ].filter(Boolean)
    }
  ), /* @__PURE__ */ React.createElement(
    TeamView,
    {
      title: "Account Managers",
      team: managers,
      iconColor: "indigo",
      onAdd: () => setModalConfig({ isOpen: true, type: "manager" }),
      onSelect: (m) => {
        setSelectedManager(m);
        handleNavigate("manager-detail");
      },
      onDelete: (m) => setDeleteConfirm({
        isOpen: true,
        type: "manager",
        id: m.id,
        title: m.name
      }),
      onEdit: (m) => setModalConfig({
        isOpen: true,
        type: "manager",
        data: m,
        isEdit: true
      })
    }
  )), view === "manager-detail" && selectedManager && /* @__PURE__ */ React.createElement(
    PersonCalendarDetail,
    {
      person: selectedManager,
      tasks: accountTasks,
      title: "Planificaci\xF3n de Cuentas",
      baseColor: LEGACY_COLOR_MAP[selectedManager.color] || selectedManager.color || "indigo",
      onBack: () => handleNavigate("managers"),
      onAddEvent: (dateStr) => setModalConfig({
        isOpen: true,
        type: "accountTask",
        data: { date: dateStr, contextId: selectedManager.id }
      }),
      onEventClick: (e) => handleEventClick(e, "accountTask")
    }
  ), view === "editors" && /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement(
    ViewTabs,
    {
      active: "editors",
      onChange: handleNavigate,
      items: [
        canAccessView(currentUserProfile, "managers") && {
          id: "managers",
          label: "Accounts"
        },
        canAccessView(currentUserProfile, "editors") && {
          id: "editors",
          label: "Editores"
        }
      ].filter(Boolean)
    }
  ), /* @__PURE__ */ React.createElement(
    TeamView,
    {
      title: "Editores",
      team: editors,
      iconColor: "rose",
      onAdd: () => setModalConfig({ isOpen: true, type: "editor" }),
      onSelect: (e) => {
        setSelectedEditor(e);
        handleNavigate("editor-detail");
      },
      onDelete: (e) => setDeleteConfirm({
        isOpen: true,
        type: "editor",
        id: e.id,
        title: e.name
      }),
      onEdit: (e) => setModalConfig({
        isOpen: true,
        type: "editor",
        data: e,
        isEdit: true
      })
    }
  )), view === "editor-detail" && selectedEditor && /* @__PURE__ */ React.createElement(
    PersonCalendarDetail,
    {
      person: selectedEditor,
      tasks: editingTasks,
      title: "Planificaci\xF3n de Edici\xF3n",
      baseColor: selectedEditor.color || "rose",
      onBack: () => handleNavigate("editors"),
      onAddEvent: (dateStr) => setModalConfig({
        isOpen: true,
        type: "editingTask",
        data: { date: dateStr, contextId: selectedEditor.id }
      }),
      onEventClick: (e) => handleEventClick(e, "editingTask")
    }
  ), view === "account-room" && /* @__PURE__ */ React.createElement(
    AccountRoomView,
    {
      tasks: accountTasks,
      managers,
      clients,
      currentUserProfile,
      onAdd: (dateStr) => setModalConfig({
        isOpen: true,
        type: "accountTask",
        data: { date: dateStr }
      }),
      onEdit: (task) => setModalConfig({
        isOpen: true,
        type: "accountTask",
        data: task,
        isEdit: true
      }),
      onChangeStatus: changeAccountTaskStatus,
      onDelete: (id) => setDeleteConfirm({
        isOpen: true,
        type: "accountTask",
        id,
        title: "Tarea"
      }),
      onTaskClick: (t) => setTaskDetailConfig({
        isOpen: true,
        task: t,
        type: "accountTask"
      }),
      onLoadHistory: handleLoadTaskHistory,
      historyLoaded: taskHistoryLoaded,
      historyLoading: isLoadingTaskHistory,
      legacyColorMap: LEGACY_COLOR_MAP
    }
  ), view === "editions" && /* @__PURE__ */ React.createElement(
    EditionsRoomView,
    {
      tasks: editingTasks,
      editors,
      clients,
      currentUserProfile,
      onAdd: (dateStr) => setModalConfig({
        isOpen: true,
        type: "editingTask",
        data: { date: dateStr }
      }),
      onEdit: (task) => setModalConfig({
        isOpen: true,
        type: "editingTask",
        data: task,
        isEdit: true
      }),
      onChangeStatus: changeEditingTaskStatus,
      onDelete: (id) => setDeleteConfirm({
        isOpen: true,
        type: "editingTask",
        id,
        title: "Tarea"
      }),
      onTaskClick: (t) => setTaskDetailConfig({
        isOpen: true,
        task: t,
        type: "editingTask"
      }),
      onLoadHistory: handleLoadTaskHistory,
      historyLoaded: taskHistoryLoaded,
      historyLoading: isLoadingTaskHistory
    }
  ), view === "management-room" && /* @__PURE__ */ React.createElement(
    ManagementRoomView,
    {
      tasks: managementTasks,
      members: managementUsers,
      clients,
      currentUserProfile,
      onAdd: (dateStr) => setModalConfig({
        isOpen: true,
        type: "managementTask",
        data: {
          date: dateStr,
          contextId: defaultManagementAssigneeId
        }
      }),
      onEdit: (task) => setModalConfig({
        isOpen: true,
        type: "managementTask",
        data: task,
        isEdit: true
      }),
      onChangeStatus: changeManagementTaskStatus,
      onDelete: (id) => setDeleteConfirm({
        isOpen: true,
        type: "managementTask",
        id,
        title: "Tarea de gestion"
      }),
      onTaskClick: (t) => setTaskDetailConfig({
        isOpen: true,
        task: t,
        type: "managementTask"
      }),
      onLoadHistory: handleLoadTaskHistory,
      historyLoaded: taskHistoryLoaded,
      historyLoading: isLoadingTaskHistory
    }
  ), view === "control-center" && /* @__PURE__ */ React.createElement(
    UsersAccessView,
    {
      users: appUsers,
      managers,
      editors,
      auditLogs,
      currentUserProfile,
      onAdd: () => setModalConfig({ isOpen: true, type: "user" }),
      onEdit: (userRecord) => setModalConfig({
        isOpen: true,
        type: "user",
        data: userRecord,
        isEdit: true
      }),
      onResendVerification: requestUserVerification
    }
  ), view === "settings" && /* @__PURE__ */ React.createElement(
    ProfileSettingsView,
    {
      profile: currentUserProfile,
      roleLabel: ROLE_DEFINITIONS[currentUserProfile?.role]?.label || currentUserProfile?.role || "",
      onSave: updateMyProfile
    }
  ), view === "general-calendar" && /* @__PURE__ */ React.createElement("div", { className: "h-full flex flex-col space-y-4 fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "eyebrow" }, "Operaci\xF3n"), /* @__PURE__ */ React.createElement("h2", { className: "editorial-title text-3xl text-[#2f3437] dark:text-[#f1efe9]" }, "Calendario")), /* @__PURE__ */ React.createElement(
    ViewTabs,
    {
      active: "general-calendar",
      onChange: handleNavigate,
      items: [
        canAccessView(currentUserProfile, "general-calendar") && {
          id: "general-calendar",
          label: "General"
        },
        canAccessView(currentUserProfile, "calendar") && {
          id: "calendar",
          label: "Producciones"
        }
      ].filter(Boolean)
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "surface flex-1 flex flex-col overflow-hidden" }, /* @__PURE__ */ React.createElement(
    GeneralCalendarGrid,
    {
      activities: allActivities,
      onDayClick: (dateStr) => setDayDetailsModal({ isOpen: true, date: dateStr }),
      onMoveActivity: async (activity, newDate) => {
        if (!canEditActivity(activity.collectionType)) return;
        const colMap = {
          accountTask: "account_tasks",
          editingTask: "editing",
          managementTask: "management_tasks",
          event: "events"
        };
        const colName = colMap[activity.collectionType];
        if (colName)
          await updateDoc(dataDoc(colName, activity.id), {
            date: newDate,
            updatedAt: nowIso()
          });
      }
    }
  ))), view === "calendar" && /* @__PURE__ */ React.createElement("div", { className: "h-full flex flex-col space-y-4 fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "eyebrow" }, "Operaci\xF3n"), /* @__PURE__ */ React.createElement("h2", { className: "editorial-title text-3xl text-[#2f3437] dark:text-[#f1efe9]" }, "Calendario")), /* @__PURE__ */ React.createElement(
    ViewTabs,
    {
      active: "calendar",
      onChange: handleNavigate,
      items: [
        canAccessView(currentUserProfile, "general-calendar") && {
          id: "general-calendar",
          label: "General"
        },
        canAccessView(currentUserProfile, "calendar") && {
          id: "calendar",
          label: "Producciones"
        }
      ].filter(Boolean)
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "surface flex-1 flex flex-col overflow-hidden" }, /* @__PURE__ */ React.createElement(
    CalendarGrid,
    {
      events: events.filter((e) => e.type === "production"),
      baseColor: "emerald",
      canAdd: userHasPermission(
        currentUserProfile,
        "create_calendar_events"
      ),
      onAdd: (dateStr) => setModalConfig({
        isOpen: true,
        type: "event",
        data: { date: dateStr, type: "production" }
      }),
      onEventClick: (e) => handleEventClick(e, "event")
    }
  ))), view === "reports" && /* @__PURE__ */ React.createElement(
    ReportsView,
    {
      accountTasks,
      editingTasks,
      managementTasks,
      clients,
      managers,
      editors,
      users: managementUsers
    }
  ))), /* @__PURE__ */ React.createElement(
    MobileBottomNav,
    {
      view,
      onNavigate: handleNavigate,
      currentUserProfile
    }
  ), /* @__PURE__ */ React.createElement(
    "div",
    {
      "aria-live": "polite",
      "aria-atomic": "true",
      className: "fixed bottom-6 right-6 z-[110] pointer-events-none"
    },
    toast && /* @__PURE__ */ React.createElement(Toast, { message: toast.message, type: toast.type })
  ), modalConfig.isOpen && ["accountTask", "editingTask", "managementTask"].includes(
    modalConfig.type
  ) && /* @__PURE__ */ React.createElement(
    CreateTaskModal,
    {
      config: modalConfig,
      onClose: closeModal,
      clients,
      managers,
      editors,
      managementUsers,
      actions: {
        addClient,
        updateClient,
        addManager,
        updateManager,
        addEditor,
        updateEditor,
        addEvent,
        updateEvent,
        addAccountTask,
        updateAccountTask,
        addEditingTask,
        updateEditingTask,
        addManagementTask,
        updateManagementTask,
        addUserRecord,
        updateUserRecord
      }
    }
  ), modalConfig.isOpen && !["accountTask", "editingTask", "managementTask"].includes(
    modalConfig.type
  ) && /* @__PURE__ */ React.createElement(
    Modal,
    {
      config: modalConfig,
      onClose: closeModal,
      clients,
      managers,
      editors,
      managementUsers,
      actions: {
        addClient,
        updateClient,
        addManager,
        updateManager,
        addEditor,
        updateEditor,
        addEvent,
        updateEvent,
        addAccountTask,
        updateAccountTask,
        addEditingTask,
        updateEditingTask,
        addManagementTask,
        updateManagementTask,
        addUserRecord,
        updateUserRecord
      }
    }
  ), deleteConfirm.isOpen && /* @__PURE__ */ React.createElement(
    DeleteConfirmModal,
    {
      config: deleteConfirm,
      onClose: closeDelete,
      onConfirm: handleDelete
    }
  ), /* @__PURE__ */ React.createElement(
    EventActionModal,
    {
      config: eventAction,
      canEdit: canEditActivity(eventAction.type),
      onClose: () => setEventAction({ isOpen: false, event: null, type: null }),
      onEdit: (event, type) => setModalConfig({ isOpen: true, type, data: event, isEdit: true }),
      onDelete: (event, type) => setDeleteConfirm({
        isOpen: true,
        type,
        id: event.id,
        title: event.title
      })
    }
  ), /* @__PURE__ */ React.createElement(
    DayDetailsModal,
    {
      config: dayDetailsModal,
      onClose: () => setDayDetailsModal({ isOpen: false, date: null }),
      activities: allActivities,
      clients,
      managers,
      editors,
      users: managementUsers,
      canEditActivity,
      onEdit: (act, type) => setModalConfig({ isOpen: true, type, data: act, isEdit: true }),
      onDelete: (act, type) => setDeleteConfirm({ isOpen: true, type, id: act.id, title: act.title })
    }
  ), /* @__PURE__ */ React.createElement(
    TaskDetailModal,
    {
      config: taskDetailConfig,
      onClose: () => setTaskDetailConfig({ isOpen: false, task: null, type: null }),
      clients,
      managers,
      editors,
      users: managementUsers,
      canEdit: (type) => canEditActivity(type),
      onEdit: (task, type) => {
        setTaskDetailConfig({ isOpen: false, task: null, type: null });
        setModalConfig({ isOpen: true, type, data: task, isEdit: true });
      },
      onChangeStatus: (task, type, newStatus) => {
        if (type === "accountTask") changeAccountTaskStatus(task, newStatus);
        else if (type === "editingTask")
          changeEditingTaskStatus(task, newStatus);
        else if (type === "managementTask")
          changeManagementTaskStatus(task, newStatus);
      },
      onAddComment: addTaskComment,
      onAddTimeEntry: addTaskTimeEntry,
      onUpdateChecklist: updateTaskChecklist,
      onChangePriority: changeTaskPriority,
      onChangeAssignee: changeTaskAssignee,
      onChangeAssignees: changeTaskAssignees,
      sendNotification,
      onAddAttachment: addTaskAttachment,
      onRemoveAttachment: removeTaskAttachment,
      onDelete: (task, type) => {
        setTaskDetailConfig({ isOpen: false, task: null, type: null });
        setDeleteConfirm({
          isOpen: true,
          type,
          id: task.id,
          title: task.title
        });
      },
      currentUserProfile,
      accountTasks,
      editingTasks,
      managementTasks
    }
  ));
}
var SidebarItem = ({
  active,
  onClick,
  icon,
  label,
  color,
  badge,
  badgeColor
}) => /* @__PURE__ */ React.createElement(
  "button",
  {
    onClick,
    "aria-current": active ? "page" : void 0,
    className: `relative w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group ${active ? "bg-[#f1f0ed] dark:bg-[#2a2a27] text-[#2f3437] dark:text-[#f1efe9]" : "text-[#787774] dark:text-[#aaa7a0] hover:bg-[#f7f6f3] dark:hover:bg-[#2a2a27] hover:text-[#2f3437] dark:hover:text-[#f1efe9]"}`
  },
  /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 19, className: "shrink-0 text-[inherit]" }),
  /* @__PURE__ */ React.createElement("span", { className: "font-medium text-sm flex-1 text-left text-[inherit] truncate" }, label),
  badge != null && /* @__PURE__ */ React.createElement(
    "span",
    {
      className: "text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#eae9e5] text-[#555552] dark:bg-[#333330] dark:text-[#d3d0c9]"
    },
    badge
  )
);
var ViewTabs = ({ items, active, onChange }) => /* @__PURE__ */ React.createElement(
  "div",
  {
    className: "inline-flex w-fit max-w-full overflow-x-auto rounded-md border border-[#e6e4df] bg-white p-1 dark:border-white/10 dark:bg-[#222220]",
    role: "tablist"
  },
  items.map((item) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: item.id,
      type: "button",
      role: "tab",
      "aria-selected": active === item.id,
      onClick: () => onChange(item.id),
      className: `min-h-[38px] min-w-0 whitespace-nowrap rounded px-3 py-1.5 text-sm font-medium transition-colors ${active === item.id ? "bg-[#111111] text-white dark:bg-[#f1efe9] dark:text-[#181817]" : "text-[#787774] hover:bg-[#f7f6f3] hover:text-[#2f3437] dark:text-[#aaa7a0] dark:hover:bg-[#2a2a27] dark:hover:text-[#f1efe9]"}`
    },
    item.label
  ))
);
var Button = ({
  children,
  onClick,
  type = "button",
  color = "purple",
  full,
  icon,
  ...props
}) => /* @__PURE__ */ React.createElement(
  "button",
  {
    type,
    onClick,
    className: `${full ? "w-full" : ""} primary-action min-h-[44px] whitespace-nowrap px-4 py-2.5 font-semibold flex items-center justify-center gap-2 transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#111111] dark:focus-visible:ring-[#f1efe9] dark:focus-visible:ring-offset-[#181817]`,
    ...props
  },
  icon && /* @__PURE__ */ React.createElement(Icon, { name: icon }),
  " ",
  children
);
var EmptyState = ({ icon, text }) => /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center p-6 text-center h-full" }, /* @__PURE__ */ React.createElement(
  Icon,
  {
    name: icon,
    size: 32,
    className: "text-slate-500 dark:text-slate-400 mb-3"
  }
), /* @__PURE__ */ React.createElement("p", { className: "text-sm font-medium text-[#787774] dark:text-[#aaa7a0]" }, text));
var AppShellSkeleton = () => /* @__PURE__ */ React.createElement("div", { className: "flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100" }, /* @__PURE__ */ React.createElement("div", { className: "hidden md:flex w-64 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6" }, /* @__PURE__ */ React.createElement("div", { className: "h-10 w-36 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" }), /* @__PURE__ */ React.createElement("div", { className: "mt-10 space-y-3" }, Array.from({ length: 8 }).map((_, index) => /* @__PURE__ */ React.createElement(
  "div",
  {
    key: index,
    className: "h-11 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
  }
)))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 p-4 md:p-8" }, /* @__PURE__ */ React.createElement("div", { className: "mb-6 h-10 w-64 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" }), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-4" }, Array.from({ length: 4 }).map((_, index) => /* @__PURE__ */ React.createElement(
  "div",
  {
    key: index,
    className: "h-28 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
  },
  /* @__PURE__ */ React.createElement("div", { className: "h-3 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" }),
  /* @__PURE__ */ React.createElement("div", { className: "mt-5 h-8 w-16 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" })
))), /* @__PURE__ */ React.createElement("div", { className: "mt-6 grid grid-cols-1 gap-4 md:grid-cols-3" }, Array.from({ length: 3 }).map((_, index) => /* @__PURE__ */ React.createElement(
  "div",
  {
    key: index,
    className: "h-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
  },
  /* @__PURE__ */ React.createElement("div", { className: "h-4 w-32 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" }),
  /* @__PURE__ */ React.createElement("div", { className: "mt-5 space-y-3" }, Array.from({ length: 4 }).map((__, itemIndex) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: itemIndex,
      className: "h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
    }
  )))
)))));
var Breadcrumb = ({ items }) => /* @__PURE__ */ React.createElement(
  "nav",
  {
    "aria-label": "Ruta de navegaci\xF3n",
    className: "flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-2"
  },
  items.map((item, index) => /* @__PURE__ */ React.createElement(React.Fragment, { key: `${item.label}-${index}` }, index > 0 && /* @__PURE__ */ React.createElement(
    "span",
    {
      "aria-hidden": "true",
      className: "text-slate-300 dark:text-slate-600"
    },
    "/"
  ), item.onClick ? /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: item.onClick,
      className: "min-h-0 min-w-0 rounded-md px-1 py-0.5 font-bold hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
    },
    item.label
  ) : /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-800 dark:text-slate-100" }, item.label)))
);
var FirstTimeView = ({ role, onNavigate }) => {
  const normalizedRole = [
    "editor",
    "manager",
    "management",
    "operations",
    "super_admin"
  ].includes(role) ? role : "viewer";
  const stepsByRole = {
    editor: [
      {
        icon: "Video",
        title: "Sala de Edici\xF3n",
        desc: "Revisa tus tareas asignadas y avanza cada pieza por estado.",
        view: "editions"
      },
      {
        icon: "CheckCircle2",
        title: "Estados claros",
        desc: "Mueve las tarjetas cuando una pieza pase a revisi\xF3n, aprobaci\xF3n o publicaci\xF3n.",
        view: "editions"
      },
      {
        icon: "Mail",
        title: "Recordatorios",
        desc: "Mant\xE9n tu correo activo para recibir avisos de vencimiento.",
        view: "general-calendar"
      }
    ],
    manager: [
      {
        icon: "Briefcase",
        title: "Clientes",
        desc: "Crea la cartera inicial y asigna cada cuenta a su responsable.",
        view: "clients"
      },
      {
        icon: "LayoutList",
        title: "Sala de Accounts",
        desc: "Planifica publicaciones y tareas por fecha, estado y responsable.",
        view: "account-room"
      },
      {
        icon: "CalendarDays",
        title: "Calendario",
        desc: "Consulta la carga del equipo desde una vista general.",
        view: "general-calendar"
      }
    ],
    management: [
      {
        icon: "ShieldCheck",
        title: "Sala de Gesti\xF3n",
        desc: "Centraliza seguimientos internos con fecha, hora y responsable.",
        view: "management-room"
      },
      {
        icon: "Briefcase",
        title: "Clientes",
        desc: "Asocia tareas de gesti\xF3n a clientes cuando aplique.",
        view: "clients"
      },
      {
        icon: "CalendarDays",
        title: "Calendario",
        desc: "Revisa vencimientos y movimiento del equipo.",
        view: "general-calendar"
      }
    ],
    operations: [
      {
        icon: "Users",
        title: "Equipo",
        desc: "Carga managers, editores y usuarios autorizados.",
        view: "control-center"
      },
      {
        icon: "Briefcase",
        title: "Clientes",
        desc: "Prepara la estructura base de cuentas antes de operar.",
        view: "clients"
      },
      {
        icon: "LayoutDashboard",
        title: "Panel Central",
        desc: "Monitorea volumen, atrasos y avance global.",
        view: "dashboard"
      }
    ],
    super_admin: [
      {
        icon: "Users",
        title: "Accesos",
        desc: "Configura roles activos y correos verificados.",
        view: "control-center"
      },
      {
        icon: "Briefcase",
        title: "Clientes",
        desc: "Crea la primera cartera y asigna responsables.",
        view: "clients"
      },
      {
        icon: "LayoutDashboard",
        title: "Panel Central",
        desc: "Revisa salud operativa cuando ya exista actividad.",
        view: "dashboard"
      }
    ],
    viewer: [
      {
        icon: "LayoutDashboard",
        title: "Panel Central",
        desc: "Aqu\xED ver\xE1s el resumen cuando el equipo empiece a cargar datos.",
        view: "dashboard"
      },
      {
        icon: "LayoutList",
        title: "Salas de trabajo",
        desc: "Consulta tareas por fecha y estado.",
        view: "account-room"
      },
      {
        icon: "CalendarDays",
        title: "Calendario",
        desc: "Abre el calendario para ubicar actividad por d\xEDa.",
        view: "general-calendar"
      }
    ]
  };
  const steps = stepsByRole[normalizedRole] || stepsByRole.viewer;
  return /* @__PURE__ */ React.createElement("div", { className: "min-h-full flex items-center" }, /* @__PURE__ */ React.createElement("section", { className: "w-full max-w-5xl mx-auto" }, /* @__PURE__ */ React.createElement("div", { className: "mb-8 max-w-2xl" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-3" }, "Inicio r\xE1pido"), /* @__PURE__ */ React.createElement("h2", { className: "text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight" }, "Prepara ClusterAG para operar"), /* @__PURE__ */ React.createElement("p", { className: "mt-3 text-sm md:text-base text-slate-600 dark:text-slate-300 leading-7" }, "Empieza por la estructura m\xEDnima de equipo, clientes y salas de trabajo.")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" }, steps.map((step) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: step.title,
      onClick: () => onNavigate(step.view),
      className: "group min-h-[180px] text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-lg transition-all"
    },
    /* @__PURE__ */ React.createElement("div", { className: "mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-300" }, /* @__PURE__ */ React.createElement(Icon, { name: step.icon, size: 20 })),
    /* @__PURE__ */ React.createElement("h3", { className: "text-base font-black text-slate-900 dark:text-white" }, step.title),
    /* @__PURE__ */ React.createElement("p", { className: "mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400" }, step.desc),
    /* @__PURE__ */ React.createElement("span", { className: "mt-4 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400" }, "Abrir ", /* @__PURE__ */ React.createElement(Icon, { name: "ArrowRight", size: 13 }))
  )))));
};
var MobileBottomNav = ({ view, onNavigate, currentUserProfile }) => {
  const items = [
    { view: "dashboard", icon: "LayoutDashboard", label: "Inicio" },
    { view: "account-room", icon: "LayoutList", label: "Accounts" },
    { view: "editions", icon: "Video", label: "Edici\xF3n" },
    { view: "management-room", icon: "ShieldCheck", label: "Gesti\xF3n" },
    { view: "clients", icon: "Briefcase", label: "Clientes" }
  ].filter((item) => canAccessView(currentUserProfile, item.view)).slice(0, 5);
  if (items.length === 0) return null;
  const isItemActive = (itemView) => view === itemView || itemView === "clients" && view === "client-detail";
  return /* @__PURE__ */ React.createElement(
    "nav",
    {
      "aria-label": "Navegaci\xF3n principal",
      className: "fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)]"
    },
    items.map((item) => {
      const active = isItemActive(item.view);
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: item.view,
          onClick: () => onNavigate(item.view),
          "aria-label": item.label,
          "aria-current": active ? "page" : void 0,
          className: `flex-1 min-w-0 min-h-[64px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-bold transition-colors ${active ? "text-[#111111] dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}`
        },
        /* @__PURE__ */ React.createElement(Icon, { name: item.icon, size: 20 }),
        /* @__PURE__ */ React.createElement("span", { className: "truncate max-w-full" }, item.label)
      );
    })
  );
};
var LoginVectorArtwork = () => /* @__PURE__ */ React.createElement(
  "svg",
  {
    viewBox: "0 0 620 540",
    className: "login-vector h-full w-full",
    role: "img",
    "aria-label": "Equipo conectado alrededor de un flujo de trabajo"
  },
  /* @__PURE__ */ React.createElement("g", { fill: "none", stroke: "currentColor" }, /* @__PURE__ */ React.createElement("circle", { cx: "310", cy: "252", r: "174", strokeWidth: "1", opacity: "0.18" }), /* @__PURE__ */ React.createElement(
    "circle",
    {
      cx: "310",
      cy: "252",
      r: "126",
      strokeWidth: "1.5",
      strokeDasharray: "6 12",
      className: "login-vector-orbit",
      opacity: "0.42"
    }
  ), /* @__PURE__ */ React.createElement(
    "path",
    {
      d: "M175 184 C236 112 382 112 444 184 M175 320 C240 390 382 390 444 320",
      strokeWidth: "1.5",
      opacity: "0.3"
    }
  ), /* @__PURE__ */ React.createElement("path", { d: "M205 252 H415 M310 142 V362", strokeWidth: "1", opacity: "0.2" })),
  /* @__PURE__ */ React.createElement("g", { className: "login-vector-node login-vector-node-one" }, /* @__PURE__ */ React.createElement("circle", { cx: "174", cy: "184", r: "42", fill: "#e1f3fe" }), /* @__PURE__ */ React.createElement("circle", { cx: "174", cy: "171", r: "12", fill: "#1f6c9f" }), /* @__PURE__ */ React.createElement("path", { d: "M149 207 C153 187 195 187 199 207", fill: "#1f6c9f" })),
  /* @__PURE__ */ React.createElement("g", { className: "login-vector-node login-vector-node-two" }, /* @__PURE__ */ React.createElement("circle", { cx: "446", cy: "184", r: "42", fill: "#edf3ec" }), /* @__PURE__ */ React.createElement("circle", { cx: "446", cy: "171", r: "12", fill: "#346538" }), /* @__PURE__ */ React.createElement("path", { d: "M421 207 C425 187 467 187 471 207", fill: "#346538" })),
  /* @__PURE__ */ React.createElement("g", { className: "login-vector-node login-vector-node-three" }, /* @__PURE__ */ React.createElement("circle", { cx: "174", cy: "320", r: "42", fill: "#fbf3db" }), /* @__PURE__ */ React.createElement("rect", { x: "151", y: "299", width: "46", height: "42", rx: "7", fill: "#956400" }), /* @__PURE__ */ React.createElement("path", { d: "M160 311 H188 M160 321 H183 M160 331 H176", stroke: "#fbf3db", strokeWidth: "3", strokeLinecap: "round" })),
  /* @__PURE__ */ React.createElement("g", { className: "login-vector-node login-vector-node-four" }, /* @__PURE__ */ React.createElement("circle", { cx: "446", cy: "320", r: "42", fill: "#fdebec" }), /* @__PURE__ */ React.createElement("rect", { x: "424", y: "300", width: "44", height: "40", rx: "8", fill: "#9f2f2d" }), /* @__PURE__ */ React.createElement("path", { d: "M435 320 L443 328 L458 311", fill: "none", stroke: "#fdebec", strokeWidth: "4", strokeLinecap: "round", strokeLinejoin: "round" })),
  /* @__PURE__ */ React.createElement("g", { className: "login-vector-core" }, /* @__PURE__ */ React.createElement("circle", { cx: "310", cy: "252", r: "76", fill: "#f1f0ed", className: "dark:fill-[#292d2a]" }), /* @__PURE__ */ React.createElement("circle", { cx: "310", cy: "252", r: "57", fill: "#161817", className: "dark:fill-[#e9e6df]" }), /* @__PURE__ */ React.createElement(
    "path",
    {
      d: "M278 257 L302 280 L344 226",
      fill: "none",
      stroke: "#e9e6df",
      className: "dark:stroke-[#161817]",
      strokeWidth: "8",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }
  )),
  /* @__PURE__ */ React.createElement("circle", { cx: "310", cy: "126", r: "6", fill: "#1f6c9f", className: "login-vector-pulse" }),
  /* @__PURE__ */ React.createElement("circle", { cx: "436", cy: "252", r: "6", fill: "#346538", className: "login-vector-pulse login-vector-delay" }),
  /* @__PURE__ */ React.createElement("circle", { cx: "310", cy: "378", r: "6", fill: "#956400", className: "login-vector-pulse login-vector-delay-two" })
);
var LoginScreen = ({
  onGoogleSignIn,
  isSigningIn,
  email,
  onEmailChange,
  onEmailSubmit,
  isSendingLoginLink,
  isDark,
  onToggleTheme
}) => /* @__PURE__ */ React.createElement("div", { className: "login-screen min-h-screen bg-[#f7f6f3] text-[#2f3437] dark:bg-[#161817] dark:text-[#e9e6df]" }, /* @__PURE__ */ React.createElement("header", { className: "absolute inset-x-0 top-0 z-20 flex min-h-[76px] items-center justify-between px-5 sm:px-8 lg:px-12" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(AgencyLogo, { className: "h-9 w-9" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "brand-name text-base font-bold leading-none text-[#2f3437] dark:text-[#e9e6df]" }, "CLUSTER"), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#787774] dark:text-[#a6a39c]" }, "Agency OS"))), /* @__PURE__ */ React.createElement(
  "button",
  {
    type: "button",
    onClick: onToggleTheme,
    "aria-label": isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro",
    className: "quiet-action h-10 min-h-0 w-10 min-w-0 p-0"
  },
  /* @__PURE__ */ React.createElement(Icon, { name: isDark ? "Sun" : "Moon", size: 17 })
)), /* @__PURE__ */ React.createElement("main", { className: "flex min-h-screen items-center justify-center px-4 pb-4 pt-24 sm:px-6 lg:px-10" }, /* @__PURE__ */ React.createElement("section", { className: "login-frame grid w-full max-w-[1120px] overflow-hidden rounded-2xl border border-[#dedcd6] bg-white dark:border-white/10 dark:bg-[#1f2220] lg:grid-cols-[1.08fr_0.92fr]", "aria-labelledby": "login-title" }, /* @__PURE__ */ React.createElement("div", { className: "login-art-panel order-2 relative min-h-[280px] overflow-hidden border-t border-[#dedcd6] bg-[#efeee9] dark:border-white/10 dark:bg-[#1a1d1b] lg:order-1 lg:min-h-[600px] lg:border-r lg:border-t-0" }, /* @__PURE__ */ React.createElement("div", { className: "pointer-events-none absolute inset-x-0 top-4 h-[72%] opacity-90 lg:h-[76%]" }, /* @__PURE__ */ React.createElement(LoginVectorArtwork, null)), /* @__PURE__ */ React.createElement("div", { className: "relative z-10 flex h-full min-h-[280px] flex-col justify-between p-6 sm:p-8 lg:min-h-[600px] lg:p-10" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-xs font-semibold text-[#555552] dark:text-[#c4c1ba]" }, /* @__PURE__ */ React.createElement("span", { className: "h-2 w-2 rounded-full bg-[#346538] login-vector-pulse" }), "Operaci\xF3n conectada"), /* @__PURE__ */ React.createElement("div", { className: "max-w-md" }, /* @__PURE__ */ React.createElement("p", { className: "eyebrow mb-3" }, "Todo el equipo, una sola vista"), /* @__PURE__ */ React.createElement("h2", { className: "editorial-title text-3xl text-[#2f3437] dark:text-[#e9e6df] sm:text-4xl lg:text-5xl" }, "El trabajo fluye cuando todo est\xE1 conectado."), /* @__PURE__ */ React.createElement("div", { className: "mt-5 hidden flex-wrap gap-2 sm:flex" }, ["Clientes", "Producci\xF3n", "Equipo"].map((label) => /* @__PURE__ */ React.createElement("span", { key: label, className: "rounded-full border border-[#d8d6d0] bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#555552] dark:border-white/10 dark:bg-[#232624]/80 dark:text-[#c4c1ba]" }, label)))))), /* @__PURE__ */ React.createElement("div", { className: "login-form-panel order-1 flex items-center p-6 sm:p-10 lg:order-2 lg:p-12" }, /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-[390px] mx-auto" }, /* @__PURE__ */ React.createElement("div", { className: "mb-8" }, /* @__PURE__ */ React.createElement("p", { className: "eyebrow mb-2" }, "Acceso seguro"), /* @__PURE__ */ React.createElement("h1", { id: "login-title", className: "editorial-title text-[40px] leading-tight text-[#2f3437] dark:text-[#e9e6df]" }, "Bienvenido de nuevo"), /* @__PURE__ */ React.createElement("p", { className: "mt-3 text-sm leading-6 text-[#787774] dark:text-[#a6a39c]" }, "Entra a tu espacio para gestionar clientes, tareas y producci\xF3n.")), /* @__PURE__ */ React.createElement(
  "button",
  {
    onClick: onGoogleSignIn,
    disabled: isSigningIn || isSendingLoginLink,
    className: "quiet-action w-full justify-center px-4 disabled:cursor-not-allowed disabled:opacity-60"
  },
  isSigningIn ? /* @__PURE__ */ React.createElement(Icon, { name: "Loader2", size: 17, className: "animate-spin" }) : /* @__PURE__ */ React.createElement("span", { className: "text-base font-bold text-blue-600", "aria-hidden": "true" }, "G"),
  "Continuar con Google"
), /* @__PURE__ */ React.createElement("div", { className: "my-6 flex items-center gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "h-px flex-1 bg-[#e6e4df] dark:bg-[#343431]" }), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-[#787774] dark:text-[#a6a39c]" }, "O usa tu correo"), /* @__PURE__ */ React.createElement("div", { className: "h-px flex-1 bg-[#e6e4df] dark:bg-[#343431]" })), /* @__PURE__ */ React.createElement("form", { onSubmit: onEmailSubmit, className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { htmlFor: "login-email", className: "mb-2 block text-sm font-medium text-[#2f3437] dark:text-[#e9e6df]" }, "Correo electr\xF3nico"), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(Icon, { name: "Mail", size: 17, className: "pointer-events-none absolute left-3.5 top-3.5 text-[#9a9893]" }), /* @__PURE__ */ React.createElement(
  "input",
  {
    id: "login-email",
    type: "email",
    value: email,
    onChange: (event) => onEmailChange(event.target.value),
    placeholder: "nombre@empresa.com",
    autoComplete: "email",
    className: "min-h-[46px] w-full rounded-md border border-[#d8d6d0] bg-white pl-11 pr-4 text-sm text-[#2f3437] outline-none transition placeholder:text-slate-400 focus:border-[#111111] focus:ring-2 focus:ring-black/10 dark:border-[#454541] dark:bg-[#1a1d1b] dark:text-[#e9e6df]"
  }
))), /* @__PURE__ */ React.createElement(
  "button",
  {
    type: "submit",
    disabled: isSigningIn || isSendingLoginLink,
    className: "primary-action w-full justify-center px-4 disabled:cursor-not-allowed disabled:opacity-60"
  },
  /* @__PURE__ */ React.createElement(Icon, { name: isSendingLoginLink ? "Loader2" : "Send", size: 17, className: isSendingLoginLink ? "animate-spin" : "" }),
  isSendingLoginLink ? "Enviando enlace" : "Enviar enlace de acceso"
)), /* @__PURE__ */ React.createElement("div", { className: "mt-6 flex items-center justify-center gap-2 text-xs text-[#787774] dark:text-[#a6a39c]" }, /* @__PURE__ */ React.createElement(Icon, { name: "ShieldCheck", size: 15 }), "Acceso exclusivo para cuentas autorizadas"))))));
var SearchBar = ({ searchTerm, setSearchTerm, placeholder }) => /* @__PURE__ */ React.createElement("div", { className: "relative w-full md:w-64 shrink-0" }, /* @__PURE__ */ React.createElement(
  Icon,
  {
    name: "Search",
    className: "absolute left-3 top-3 text-slate-500 dark:text-slate-400",
    size: 16
  }
), /* @__PURE__ */ React.createElement(
  "input",
  {
    type: "text",
    "aria-label": placeholder || "Buscar",
    placeholder,
    value: searchTerm,
    onChange: (e) => setSearchTerm(e.target.value),
    className: "min-h-[46px] w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-500 dark:placeholder:text-slate-500"
  }
));
var StatCard = ({
  title,
  value,
  icon,
  detail = "",
  onClick = null,
  actionLabel = ""
}) => {
  const CardElement = onClick ? "button" : "div";
  return /* @__PURE__ */ React.createElement(
    CardElement,
    {
      ...onClick ? {
        type: "button",
        onClick,
        "aria-label": actionLabel || `Abrir ${title}`
      } : {},
      className: `surface group flex min-h-[118px] w-full items-start justify-between p-5 text-left transition-colors ${onClick ? "hover:border-[#8f8c85] hover:bg-[#fbfbfa] dark:hover:border-[#5b605c] dark:hover:bg-[#242825]" : ""}`
    },
    /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-medium text-[#787774] dark:text-[#aaa7a0]" }, title), /* @__PURE__ */ React.createElement("p", { className: "mono-meta mt-2 text-3xl font-semibold leading-none text-[#2f3437] dark:text-[#f1efe9]" }, value), detail && /* @__PURE__ */ React.createElement("p", { className: "mt-2 text-xs text-[#9a9893] dark:text-[#8f8c85]" }, detail)),
    /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, onClick && /* @__PURE__ */ React.createElement(
      Icon,
      {
        name: "ArrowRight",
        size: 16,
        className: "text-[#9a9893] transition-transform group-hover:translate-x-0.5 dark:text-[#8f8c85]"
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "rounded-lg bg-[#f1f0ed] p-2.5 text-[#555552] dark:bg-[#2a2a27] dark:text-[#d3d0c9]" }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 20 })))
  );
};
var Input = ({ label, id, className = "", ...props }) => {
  const reactId = useId();
  const inputId = id || `input-${slugifyId(label || props.name || props.placeholder || reactId)}`;
  const ariaLabel = props["aria-label"] || (label ? void 0 : props.placeholder || props.name);
  return /* @__PURE__ */ React.createElement("div", null, label && /* @__PURE__ */ React.createElement(
    "label",
    {
      htmlFor: inputId,
      className: "block text-xs font-medium text-[#555552] dark:text-[#d3d0c9] mb-1.5"
    },
    label
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      id: inputId,
      "aria-label": ariaLabel,
      className: `w-full p-4 md:p-3 bg-white dark:bg-[#222220] border border-[#e6e4df] dark:border-white/10 rounded-md focus:border-[#111111] dark:focus:border-[#f1efe9] focus:ring-0 outline-none font-normal text-[#2f3437] dark:text-[#f1efe9] transition-colors placeholder:text-[#9a9893] ${className}`,
      ...props
    }
  ));
};
var PhotoUploader = ({
  name = "photo",
  defaultValue = "",
  label = "Foto de perfil"
}) => {
  const [photo, setPhoto] = useState(defaultValue || "");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    setBusy(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 240;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        try {
          setPhoto(canvas.toDataURL("image/jpeg", 0.82));
        } catch (err) {
          setPhoto(ev.target.result);
        }
        setBusy(false);
      };
      img.onerror = () => setBusy(false);
      img.src = ev.target.result;
    };
    reader.onerror = () => setBusy(false);
    reader.readAsDataURL(file);
  };
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1" }, label), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0" }, photo ? /* @__PURE__ */ React.createElement(
    "img",
    {
      src: photo,
      alt: "Foto de perfil",
      className: "w-full h-full object-cover"
    }
  ) : /* @__PURE__ */ React.createElement(
    Icon,
    {
      name: "User",
      size: 26,
      className: "text-slate-400 dark:text-slate-500"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-2" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => fileRef.current?.click(),
      className: "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
    },
    /* @__PURE__ */ React.createElement(
      Icon,
      {
        name: busy ? "Loader2" : "UserPlus",
        size: 15,
        className: busy ? "animate-spin" : ""
      }
    ),
    photo ? "Cambiar foto" : "Subir foto"
  ), photo && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setPhoto(""),
      className: "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
    },
    /* @__PURE__ */ React.createElement(Icon, { name: "Trash2", size: 15 }),
    " Quitar"
  ))), /* @__PURE__ */ React.createElement(
    "input",
    {
      ref: fileRef,
      type: "file",
      accept: "image/*",
      onChange: handleFile,
      className: "hidden"
    }
  ), /* @__PURE__ */ React.createElement("input", { type: "hidden", name, value: photo }));
};
var clampPercent = (value = 0) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
};
var DASHBOARD_PALETTE = {
  emerald: { solid: "#a9c6a6", strong: "#346538" },
  amber: { solid: "#eadcae", strong: "#956400" },
  red: { solid: "#e8b9ba", strong: "#9f2f2d" },
  purple: { solid: "#b8dbea", strong: "#1f6c9f" },
  violet: { solid: "#b8dbea", strong: "#1f6c9f" },
  indigo: { solid: "#b8dbea", strong: "#1f6c9f" },
  blue: { solid: "#b8dbea", strong: "#1f6c9f" },
  cyan: { solid: "#b8dbea", strong: "#1f6c9f" },
  orange: { solid: "#eadcae", strong: "#956400" },
  fuchsia: { solid: "#e8b9ba", strong: "#9f2f2d" },
  stone: { solid: "#bdbab2", strong: "#555552" },
  slate: { solid: "#bdbab2", strong: "#555552" }
};
var getDashboardPalette = (name = "slate") => DASHBOARD_PALETTE[name] || DASHBOARD_PALETTE.slate;
var PortfolioHealthChart = ({
  totalClients,
  activos,
  pausados,
  inactivos,
  onOpenClients
}) => {
  const segments = [
    {
      key: "activo",
      label: "Activos",
      value: activos,
      color: "#a9c6a6",
      strong: "#346538"
    },
    {
      key: "pausado",
      label: "Pausados",
      value: pausados,
      color: "#eadcae",
      strong: "#956400"
    },
    {
      key: "inactivo",
      label: "Inactivos",
      value: inactivos,
      color: "#bdbab2",
      strong: "#555552"
    }
  ];
  const healthScore = totalClients > 0 ? Math.round(activos / totalClients * 100) : 0;
  const healthLabel = totalClients === 0 ? "Sin datos" : healthScore >= 75 ? "Saludable" : healthScore >= 45 ? "Mixta" : "Baja";
  return /* @__PURE__ */ React.createElement("div", { className: "mt-6 grid grid-cols-1 gap-5" }, /* @__PURE__ */ React.createElement("div", { className: "grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)]" }, /* @__PURE__ */ React.createElement("div", { className: "surface-subtle rounded-lg border border-[#e6e4df] p-4 dark:border-white/10" }, /* @__PURE__ */ React.createElement("p", { className: "eyebrow" }, "Salud de cartera"), /* @__PURE__ */ React.createElement("p", { className: "mono-meta mt-3 text-4xl font-semibold leading-none text-[#2f3437] dark:text-[#f1efe9]" }, healthScore, "%"), /* @__PURE__ */ React.createElement("p", { className: "mt-2 text-xs text-[#787774] dark:text-[#aaa7a0]" }, healthLabel, " \xB7 ", activos, " de ", totalClients, " activos")), /* @__PURE__ */ React.createElement("div", { className: "flex min-w-0 flex-col justify-center" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "flex h-5 w-full overflow-hidden rounded-md bg-[#efeee9] dark:bg-[#343431]",
      "aria-label": `Distribucion de cartera: ${healthScore}% activa`
    },
    segments.map((segment) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: segment.key,
        style: {
          width: `${totalClients > 0 ? segment.value / totalClients * 100 : 0}%`,
          backgroundColor: segment.strong
        },
        title: `${segment.label}: ${segment.value}`
      }
    ))
  ), /* @__PURE__ */ React.createElement("div", { className: "mt-3 flex flex-wrap gap-x-5 gap-y-2" }, segments.map((segment) => /* @__PURE__ */ React.createElement("span", { key: segment.key, className: "flex items-center gap-2 text-xs text-[#787774] dark:text-[#aaa7a0]" }, /* @__PURE__ */ React.createElement("span", { className: "h-2 w-2 rounded-full", style: { backgroundColor: segment.strong } }), segment.label, " ", /* @__PURE__ */ React.createElement("strong", { className: "mono-meta text-[#2f3437] dark:text-[#f1efe9]" }, segment.value)))))), /* @__PURE__ */ React.createElement("div", { className: "grid min-w-0 gap-3 sm:grid-cols-3" }, segments.map((segment) => {
    const percent = totalClients > 0 ? Math.round(segment.value / totalClients * 100) : 0;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        key: segment.key,
        onClick: onOpenClients,
        "aria-label": `Ver clientes ${segment.label.toLowerCase()}`,
        className: "group min-w-0 rounded-2xl border border-slate-200 bg-white/80 p-3 text-left shadow-sm transition-colors hover:border-[#8f8c85] dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-[#5b605c]"
      },
      /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
        "span",
        {
          className: "h-2.5 w-2.5 rounded-full",
          style: { backgroundColor: segment.color }
        }
      ), /* @__PURE__ */ React.createElement("span", { className: "truncate text-sm font-bold text-slate-700 dark:text-slate-200" }, segment.label)), /* @__PURE__ */ React.createElement("div", { className: "shrink-0 text-right" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm font-black text-slate-900 dark:text-white" }, segment.value), /* @__PURE__ */ React.createElement("span", { className: "ml-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400" }, percent, "%"))),
      /* @__PURE__ */ React.createElement("div", { className: "mt-2 h-2.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800" }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "h-full rounded-full transition-all duration-700",
          style: {
            width: `${percent}%`,
            background: segment.strong
          }
        }
      ))
    );
  })));
};
var ProgressOverviewChart = ({
  completionPercent,
  completedTasks,
  totalTasks,
  groups,
  onNavigate
}) => {
  const safePercent = clampPercent(completionPercent);
  const pendingTasks = Math.max(totalTasks - completedTasks, 0);
  return /* @__PURE__ */ React.createElement("div", { className: "mt-6 grid grid-cols-1 gap-5" }, /* @__PURE__ */ React.createElement("div", { className: "surface-subtle rounded-lg border border-[#e6e4df] p-4 dark:border-white/10" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-end justify-between gap-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "eyebrow" }, "Avance consolidado"), /* @__PURE__ */ React.createElement("p", { className: "mono-meta mt-2 text-4xl font-semibold leading-none text-[#2f3437] dark:text-[#f1efe9]" }, Math.round(safePercent), "%")), /* @__PURE__ */ React.createElement("p", { className: "mono-meta text-sm text-[#787774] dark:text-[#aaa7a0]" }, completedTasks, " hechas \xB7 ", pendingTasks, " abiertas")), /* @__PURE__ */ React.createElement("div", { className: "mt-4 flex h-5 overflow-hidden rounded-md bg-[#dfddd7] dark:bg-[#343431]" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "bg-[#346538] transition-all duration-700",
      style: { width: `${safePercent}%` },
      title: `${completedTasks} completadas`
    }
  ), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "bg-transparent",
      style: { width: `${100 - safePercent}%` },
      title: `${pendingTasks} abiertas`
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 space-y-3" }, groups.map((group) => {
    const palette = getDashboardPalette(group.color);
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        key: group.key,
        onClick: () => onNavigate(group.view),
        "aria-label": `Abrir ${group.label}`,
        className: "group min-w-0 rounded-2xl border border-slate-200 bg-white/80 p-3 text-left shadow-sm transition-colors hover:border-[#8f8c85] dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-[#5b605c]"
      },
      /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
        "span",
        {
          className: "h-2.5 w-2.5 rounded-full",
          style: { backgroundColor: palette.solid }
        }
      ), /* @__PURE__ */ React.createElement("span", { className: "break-words text-sm font-bold leading-tight text-slate-800 dark:text-slate-100" }, group.label)), /* @__PURE__ */ React.createElement("p", { className: "mt-1 break-words pr-2 text-xs leading-relaxed font-medium text-slate-500 dark:text-slate-400" }, group.note)), /* @__PURE__ */ React.createElement("div", { className: "w-16 shrink-0 text-right" }, /* @__PURE__ */ React.createElement(
        "p",
        {
          className: "text-lg font-black",
          style: { color: palette.strong }
        },
        group.percent,
        "%"
      ), /* @__PURE__ */ React.createElement("p", { className: "break-words text-[10px] leading-tight font-semibold text-slate-500 dark:text-slate-400" }, group.completed, "/", group.total))),
      /* @__PURE__ */ React.createElement("div", { className: "mt-2.5 h-3 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800" }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "h-full rounded-full transition-all duration-700",
          style: {
            width: `${group.percent}%`,
            background: palette.strong
          }
        }
      ))
    );
  }), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 gap-2 pt-1" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-2.5 text-center dark:border-slate-800 dark:bg-slate-950/50" }, /* @__PURE__ */ React.createElement("p", { className: "break-words text-[9px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400" }, "Total"), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-lg font-black leading-none text-slate-900 dark:text-white" }, totalTasks)), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-2.5 text-center dark:border-slate-800 dark:bg-slate-950/50" }, /* @__PURE__ */ React.createElement("p", { className: "break-words text-[9px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400" }, "Hechas"), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-lg font-black leading-none text-slate-900 dark:text-white" }, completedTasks)), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-2.5 text-center dark:border-slate-800 dark:bg-slate-950/50" }, /* @__PURE__ */ React.createElement("p", { className: "break-words text-[9px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400" }, "Abiertas"), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-lg font-black leading-none text-slate-900 dark:text-white" }, pendingTasks)))));
};
var DashboardView = ({
  clients,
  managers,
  users = [],
  events,
  tasks,
  accountTasks,
  managementTasks = [],
  currentUserProfile,
  onSignIn,
  onNavigate,
  onOpenTask
}) => {
  const [rankingRefDate, setRankingRefDate] = React.useState(getHondurasTodayStr());
  const goToPrevMonth = () => {
    const p = getRankingMonthPeriod(rankingRefDate);
    const prev = new Date(Date.UTC(p.year, p.month - 2, 1));
    setRankingRefDate(`${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, "0")}-01`);
  };
  const goToNextMonth = () => {
    const p = getRankingMonthPeriod(rankingRefDate);
    const next = new Date(Date.UTC(p.year, p.month, 1));
    const todayPeriod = getRankingMonthPeriod(getHondurasTodayStr());
    if (p.year === todayPeriod.year && p.month === todayPeriod.month) return;
    setRankingRefDate(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-01`);
  };
  const todayStr = getHondurasTodayStr();
  const dashboardPeriod = getRankingMonthPeriod(todayStr);
  const isTaskInDashboardMonth = (task) => isDateWithinPeriod(task?.date, dashboardPeriod);
  const monthlyEditingTasks = tasks.filter(isTaskInDashboardMonth);
  const monthlyAccountTasks = accountTasks.filter(isTaskInDashboardMonth);
  const monthlyManagementTasks = managementTasks.filter(isTaskInDashboardMonth);
  const openMonthlyAccountTasks = monthlyAccountTasks.filter(
    (task) => task.status !== "publicado"
  ).length;
  const pendingMonthlyEditingTasks = monthlyEditingTasks.filter(
    (task) => !isCompletedStatus(task.status)
  ).length;
  const activos = clients.filter(
    (c) => (c.status || "Activo") === "Activo"
  ).length;
  const pausados = clients.filter((c) => c.status === "Pausado").length;
  const inactivos = clients.filter((c) => c.status === "Inactivo").length;
  const realTotalClients = clients.length;
  const totalClients = realTotalClients || 1;
  const completedEditingTasks = monthlyEditingTasks.filter(
    (task) => isCompletedStatus(task.status)
  ).length;
  const completedAccountTasks = monthlyAccountTasks.filter(
    (task) => task.status === "aprobado_internamente" || task.status === "publicado"
  ).length;
  const completedManagementTasks = monthlyManagementTasks.filter(
    (task) => task.status === "cerrado"
  ).length;
  const progressGroups = [
    {
      key: "editing",
      label: "Edicion",
      note: "Produccion audiovisual",
      total: monthlyEditingTasks.length,
      completed: completedEditingTasks,
      color: "amber",
      view: "editions"
    },
    {
      key: "account",
      label: "Accounts",
      note: "Seguimiento comercial",
      total: monthlyAccountTasks.length,
      completed: completedAccountTasks,
      color: "indigo",
      view: "account-room"
    },
    {
      key: "management",
      label: "Gestion",
      note: "Operacion interna",
      total: monthlyManagementTasks.length,
      completed: completedManagementTasks,
      color: "cyan",
      view: "management-room"
    }
  ].map((group) => ({
    ...group,
    percent: group.total > 0 ? Math.round(group.completed / group.total * 100) : 0
  }));
  const completedTasks = progressGroups.reduce(
    (sum, group) => sum + group.completed,
    0
  );
  const totalTasks = progressGroups.reduce(
    (sum, group) => sum + group.total,
    0
  );
  const compPercent = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
  const urgentTasks = [
    ...monthlyEditingTasks.filter(
      (t) => (t.priority === "urgente" || isDateBeforeDateString(t.date, todayStr)) && t.status !== "aprobado" && t.status !== "publicado"
    ).map((t) => ({
      ...t,
      _type: "Edici\xF3n",
      _taskType: "editingTask"
    })),
    ...monthlyAccountTasks.filter(
      (t) => isDateBeforeDateString(t.date, todayStr) && t.status !== "publicado"
    ).map((t) => ({
      ...t,
      _type: "Account",
      _taskType: "accountTask"
    })),
    ...monthlyManagementTasks.filter(
      (t) => (t.priority === "urgente" || isDateBeforeDateString(t.date, todayStr)) && t.status !== "cerrado"
    ).map((t) => ({
      ...t,
      _type: "Gestion",
      _taskType: "managementTask"
    }))
  ].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 6);
  const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  };
  const formattedDate = (/* @__PURE__ */ new Date()).toLocaleDateString("es-HN", dateOptions);
  const rankingPeriod = getRankingMonthPeriod(rankingRefDate);
  const isCurrentMonth = (() => {
    const tp = getRankingMonthPeriod(todayStr);
    return rankingPeriod.year === tp.year && rankingPeriod.month === tp.month;
  })();
  const managerStats = buildManagerKpiStats({
    managers: managers.filter((manager) => !isManagerLinkedToInactiveUser(manager, users)).map((manager) => ({
      ...manager,
      mappedColor: LEGACY_COLOR_MAP[manager.color] || manager.color || "slate"
    })),
    clients,
    accountTasks,
    rankingPeriod
  });
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-6 animate-in fade-in duration-500" }, /* @__PURE__ */ React.createElement("div", { className: "surface-subtle flex flex-col gap-5 rounded-xl border border-[#e6e4df] p-5 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between md:p-6" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "eyebrow" }, "Resumen mensual"), /* @__PURE__ */ React.createElement("h2", { className: "editorial-title mt-1 text-4xl text-[#2f3437] dark:text-[#f1efe9] md:text-5xl" }, "Panel central"), /* @__PURE__ */ React.createElement("p", { className: "page-description mt-2 capitalize" }, formattedDate)), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-start gap-3 sm:items-end" }, /* @__PURE__ */ React.createElement("span", { className: "quiet-action px-3 text-sm" }, /* @__PURE__ */ React.createElement(Icon, { name: "CalendarRange", size: 16 }), dashboardPeriod.label), /* @__PURE__ */ React.createElement("p", { className: "mono-meta text-xs text-[#787774] dark:text-[#aaa7a0]" }, completedTasks, " completadas \xB7 ", urgentTasks.length, " requieren atenci\xF3n"))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3" }, /* @__PURE__ */ React.createElement(
    StatCard,
    {
      title: "Clientes Activos",
      value: activos,
      icon: "Briefcase",
      detail: `${realTotalClients} clientes en cartera`,
      onClick: () => onNavigate("clients"),
      actionLabel: "Abrir clientes activos"
    }
  ), /* @__PURE__ */ React.createElement(
    StatCard,
    {
      title: "Account Managers",
      value: managers.length,
      icon: "Users",
      detail: "Equipo asignado",
      onClick: () => onNavigate("managers"),
      actionLabel: "Abrir equipo de Account Managers"
    }
  ), /* @__PURE__ */ React.createElement(
    StatCard,
    {
      title: "Accounts pendientes",
      value: openMonthlyAccountTasks,
      icon: "LayoutList",
      detail: `${monthlyAccountTasks.length} tareas del mes`,
      onClick: () => onNavigate("account-room"),
      actionLabel: "Abrir tareas pendientes de Accounts"
    }
  ), /* @__PURE__ */ React.createElement(
    StatCard,
    {
      title: "Edici\xF3n pendiente",
      value: pendingMonthlyEditingTasks,
      icon: "Video",
      detail: `${monthlyEditingTasks.length} tareas del mes`,
      onClick: () => onNavigate("editions"),
      actionLabel: "Abrir tareas pendientes de Edici\xF3n"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-4 xl:grid-cols-12" }, /* @__PURE__ */ React.createElement("div", { className: "xl:col-span-7" }, /* @__PURE__ */ React.createElement("div", { className: "h-full" }, /* @__PURE__ */ React.createElement("div", { className: "surface h-full p-6" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-base font-semibold text-[#2f3437] dark:text-[#f1efe9] mb-1" }, "Avance del mes"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400" }, "Edici\xF3n, Accounts y Gesti\xF3n \xB7 ", dashboardPeriod.label)), /* @__PURE__ */ React.createElement(
    ProgressOverviewChart,
    {
      completionPercent: compPercent,
      completedTasks,
      totalTasks,
      groups: progressGroups,
      onNavigate
    }
  )))), /* @__PURE__ */ React.createElement("div", { className: "surface flex min-h-[360px] flex-col p-6 xl:col-span-5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-base font-semibold text-[#2f3437] dark:text-[#f1efe9] mb-1" }, "Atenci\xF3n Requerida"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400" }, "Solo tareas de ", dashboardPeriod.label)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black tracking-[0.12em] uppercase text-slate-500 dark:text-slate-400" }, urgentTasks.length), /* @__PURE__ */ React.createElement("div", { className: "p-2.5 bg-[#fdebec] text-[#9f2f2d] rounded-lg" }, /* @__PURE__ */ React.createElement(Icon, { name: "Flame", size: 18 })))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto space-y-2 custom-scroll pr-2" }, urgentTasks.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "CheckCircle2", text: "No hay tareas urgentes." }) : urgentTasks.map((t) => /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      key: t.id,
      onClick: () => onOpenTask(t, t._taskType),
      "aria-label": `Abrir tarea ${t.title}`,
      className: "group flex min-w-0 w-full items-start gap-3 rounded-2xl border border-slate-100 p-3.5 text-left transition-colors hover:border-[#8f8c85] hover:bg-slate-50 dark:border-slate-800 dark:hover:border-[#5b605c] dark:hover:bg-slate-800/50"
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `mt-1 w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${isDateBeforeDateString(t.date, todayStr) ? "bg-red-500" : "bg-amber-500"}`
      }
    ),
    /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "break-words text-sm font-semibold leading-tight text-[#2f3437] dark:text-[#f1efe9]" }, t.title), /* @__PURE__ */ React.createElement("div", { className: "mt-1.5 flex flex-wrap items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-widest" }, t._type), /* @__PURE__ */ React.createElement(
      "span",
      {
        className: `text-[9px] font-bold break-words ${isDateBeforeDateString(t.date, todayStr) ? "text-red-500" : "text-slate-500"}`
      },
      "Vence: ",
      t.date
    ))),
    /* @__PURE__ */ React.createElement(
      Icon,
      {
        name: "ArrowRight",
        size: 16,
        className: "mt-1 shrink-0 text-[#9a9893] transition-transform group-hover:translate-x-0.5 dark:text-[#8f8c85]"
      }
    )
  ))))), /* @__PURE__ */ React.createElement("div", { className: "surface p-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-base font-semibold text-[#2f3437] dark:text-[#f1efe9]" }, "Distribuci\xF3n de cartera"), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400" }, "Estado actual de los clientes activos, pausados e inactivos")), /* @__PURE__ */ React.createElement("span", { className: "mono-meta text-xs text-[#787774] dark:text-[#aaa7a0]" }, realTotalClients, " clientes totales")), /* @__PURE__ */ React.createElement(
    PortfolioHealthChart,
    {
      totalClients: realTotalClients,
      activos,
      pausados,
      inactivos,
      onOpenClients: () => onNavigate("clients")
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "surface p-5 md:p-6 mt-6" }, /* @__PURE__ */ React.createElement("div", { className: "mb-6 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-semibold text-[#2f3437] dark:text-[#f1efe9] mb-1" }, "KPI mensual por Account"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400" }, "KPI: 50% cumplimiento ponderado, 30% puntualidad verificada y 20% carga completada del mes.")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: goToPrevMonth,
      className: "w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm",
      title: "Mes anterior"
    },
    /* @__PURE__ */ React.createElement(Icon, { name: "ChevronLeft", size: 16 })
  ), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-black text-slate-700 dark:text-slate-200 min-w-[110px] text-center" }, rankingPeriod.label), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: goToNextMonth,
      disabled: isCurrentMonth,
      className: `w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors shadow-sm ${isCurrentMonth ? "opacity-30 cursor-not-allowed text-slate-400" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`,
      title: "Mes siguiente"
    },
    /* @__PURE__ */ React.createElement(Icon, { name: "ChevronRight", size: 16 })
  ))), managerStats.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "Users", text: "No hay Accounts para evaluar a\xFAn." }) : /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full min-w-[820px] border-collapse" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { className: "border-b border-[#e6e4df] text-left dark:border-white/10" }, ["Pos.", "Account", "Tareas", "A tiempo", "Cumplimiento", "Carga", "Pendientes", "KPI"].map(
    (label) => /* @__PURE__ */ React.createElement("th", { key: label, className: "eyebrow px-3 py-3 first:pl-0 last:pr-0 last:text-right" }, label)
  ))), /* @__PURE__ */ React.createElement("tbody", null, (() => {
    let qualifiedRank = 0;
    return managerStats.map((ms) => {
      const hasEnoughTasks = ms.totalTasks >= KPI_MIN_TASKS;
      if (hasEnoughTasks) qualifiedRank += 1;
      return /* @__PURE__ */ React.createElement(
        "tr",
        {
          key: ms.id,
          className: `border-b border-[#efeee9] transition-colors last:border-0 hover:bg-[#fbfbfa] dark:border-white/5 dark:hover:bg-[#2a2a27] ${hasEnoughTasks ? "" : "text-[#9a9893]"}`
        },
        /* @__PURE__ */ React.createElement("td", { className: "mono-meta px-3 py-3.5 pl-0 text-sm" }, hasEnoughTasks ? String(qualifiedRank).padStart(2, "0") : "\u2014"),
        /* @__PURE__ */ React.createElement("td", { className: "px-3 py-3.5" }, /* @__PURE__ */ React.createElement("p", { className: "font-semibold text-[#2f3437] dark:text-[#f1efe9]" }, ms.name), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-[#787774] dark:text-[#aaa7a0]" }, ms.totalClients, " clientes", !hasEnoughTasks && ` \xB7 m\xEDnimo ${KPI_MIN_TASKS} tareas`)),
        /* @__PURE__ */ React.createElement("td", { className: "mono-meta px-3 py-3.5 text-sm" }, ms.completedTasks, "/", ms.totalTasks),
        /* @__PURE__ */ React.createElement("td", { className: "mono-meta px-3 py-3.5 text-sm" }, ms.onTimePercent === null ? "N/D" : `${ms.onTimePercent}%`),
        /* @__PURE__ */ React.createElement("td", { className: "mono-meta px-3 py-3.5 text-sm" }, ms.weightedCompletionPercent, "%"),
        /* @__PURE__ */ React.createElement("td", { className: "mono-meta px-3 py-3.5 text-sm" }, ms.loadPercent, "%"),
        /* @__PURE__ */ React.createElement("td", { className: "mono-meta px-3 py-3.5 text-sm" }, /* @__PURE__ */ React.createElement("span", { className: ms.overdueTasks > 0 ? "text-[#9f2f2d]" : "" }, ms.pendingTasks)),
        /* @__PURE__ */ React.createElement("td", { className: "mono-meta px-3 py-3.5 pr-0 text-right text-lg font-semibold text-[#2f3437] dark:text-[#f1efe9]" }, ms.score, "%")
      );
    });
  })())))));
};
var ProfileSettingsView = ({ profile, roleLabel, onSave }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries());
    onSave({
      name: fd.name || "",
      profession: fd.profession || "",
      photo: fd.photo || ""
    });
  };
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-6 fade-in max-w-2xl" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl md:text-3xl font-black text-slate-800 dark:text-white" }, "Configuraci\xF3n"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1" }, "Administra tu perfil personal.")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300" }, /* @__PURE__ */ React.createElement(Icon, { name: "User", size: 15 }), " Perfil")), /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6" }, !profile?.id ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "User", text: "Inicia sesi\xF3n para editar tu perfil." }) : /* @__PURE__ */ React.createElement("form", { onSubmit: handleSubmit, className: "space-y-5" }, /* @__PURE__ */ React.createElement(PhotoUploader, { defaultValue: profile.photo }), /* @__PURE__ */ React.createElement(
    Input,
    {
      name: "name",
      label: "Nombre",
      placeholder: "Tu nombre",
      defaultValue: profile.name,
      required: true
    }
  ), /* @__PURE__ */ React.createElement(
    Input,
    {
      name: "profession",
      label: "Profesi\xF3n / Cargo",
      placeholder: "ej. Director de agencia",
      defaultValue: profile.profession
    }
  ), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1" }, "Correo"), /* @__PURE__ */ React.createElement("div", { className: "w-full p-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icon, { name: "Mail", size: 15 }), /* @__PURE__ */ React.createElement("span", { className: "truncate" }, profile.email || "\u2014"), /* @__PURE__ */ React.createElement("span", { className: "ml-auto text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0" }, "No editable"))), roleLabel && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1" }, "Rol"), /* @__PURE__ */ React.createElement("div", { className: "w-full p-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icon, { name: "ShieldCheck", size: 15 }), roleLabel)), /* @__PURE__ */ React.createElement(Button, { type: "submit", full: true, color: "purple", icon: "Save" }, "Guardar cambios"))));
};
var TeamView = ({
  title,
  team,
  iconColor,
  onAdd,
  onSelect,
  onDelete,
  onEdit
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredTeam = team.filter(
    (p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-6 fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl md:text-3xl font-black text-slate-800 dark:text-white" }, title), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row w-full md:w-auto gap-3" }, /* @__PURE__ */ React.createElement(
    SearchBar,
    {
      searchTerm,
      setSearchTerm,
      placeholder: "Buscar miembro..."
    }
  ), /* @__PURE__ */ React.createElement(Button, { onClick: onAdd, icon: "UserPlus", color: iconColor }, "Agregar a ", title))), filteredTeam.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 h-64" }, /* @__PURE__ */ React.createElement(EmptyState, { icon: "Users", text: "No hay miembros en este equipo a\xFAn." })) : /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" }, filteredTeam.map((person) => {
    let mappedColorName = LEGACY_COLOR_MAP[person.color] || person.color || "slate";
    const style = PERSON_COLORS[mappedColorName] || PERSON_COLORS.slate;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: person.id,
        onClick: () => onSelect(person),
        className: "bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer group relative"
      },
      /* @__PURE__ */ React.createElement("div", { className: "absolute top-4 right-4 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: (e) => {
            e.stopPropagation();
            onEdit(person);
          },
          "aria-label": `Editar ${person.name || "miembro"}`,
          title: "Editar",
          className: "text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 p-3 md:p-2 bg-slate-50 dark:bg-slate-800 rounded-full hover:bg-blue-50 dark:hover:bg-slate-700"
        },
        /* @__PURE__ */ React.createElement(Icon, { name: "Edit", size: 16 })
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: (e) => {
            e.stopPropagation();
            onDelete(person);
          },
          "aria-label": `Eliminar ${person.name || "miembro"}`,
          title: "Eliminar",
          className: "text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-3 md:p-2 bg-slate-50 dark:bg-slate-800 rounded-full hover:bg-red-50 dark:hover:bg-slate-700"
        },
        /* @__PURE__ */ React.createElement(Icon, { name: "Trash2", size: 16 })
      )),
      /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4" }, person.photo ? /* @__PURE__ */ React.createElement(
        "img",
        {
          src: person.photo,
          alt: person.name,
          className: "h-14 w-14 rounded-xl object-cover shadow-sm border border-black/5 dark:border-white/5 shrink-0"
        }
      ) : /* @__PURE__ */ React.createElement(
        "div",
        {
          className: `h-14 w-14 ${style.bg} rounded-xl flex items-center justify-center text-2xl font-black ${style.text} shadow-sm border border-black/5 dark:border-white/5 shrink-0`
        },
        person.name ? person.name.charAt(0).toUpperCase() : "?"
      ), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-lg text-slate-800 dark:text-white pr-16 md:pr-12 truncate" }, person.name), person.profession && /* @__PURE__ */ React.createElement("p", { className: "text-xs font-semibold text-slate-600 dark:text-slate-300 truncate" }, person.profession), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400 truncate" }, person.email || "Miembro del equipo")))
    );
  })));
};
var PersonCalendarDetail = ({
  person,
  tasks,
  title,
  baseColor,
  onBack,
  onAddEvent,
  onEventClick
}) => {
  let mappedColorName = LEGACY_COLOR_MAP[baseColor] || baseColor;
  const style = PERSON_COLORS[mappedColorName] || PERSON_COLORS.slate;
  const parentLabel = title.includes("Cuentas") ? "Account Managers" : "Editores";
  return /* @__PURE__ */ React.createElement("div", { className: "h-full flex flex-col space-y-6 fade-in" }, /* @__PURE__ */ React.createElement(
    Breadcrumb,
    {
      items: [
        { label: parentLabel, onClick: onBack },
        { label: person.name || "Detalle" }
      ]
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row items-start md:items-center gap-4" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onBack,
      "aria-label": `Volver a ${parentLabel}`,
      className: "p-3 md:p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300"
    },
    /* @__PURE__ */ React.createElement(Icon, { name: "ChevronLeft" })
  ), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-sm border border-black/5 dark:border-white/5 ${style.bg} ${style.text}`
    },
    person.name ? person.name.charAt(0).toUpperCase() : "?"
  ), person.name), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-bold text-slate-500 dark:text-slate-400" }, title))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden" }, /* @__PURE__ */ React.createElement(
    CalendarGrid,
    {
      events: tasks.filter((t) => t.contextId === person.id),
      baseColor: mappedColorName,
      onAdd: onAddEvent,
      onEventClick
    }
  )));
};
var SHORT_MONTHS_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic"
];
var formatShortDate = (dateStr) => {
  if (!dateStr) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateStr));
  if (!m) return String(dateStr);
  const month = SHORT_MONTHS_ES[parseInt(m[2], 10) - 1] || "";
  return `${parseInt(m[3], 10)} ${month}`;
};
var PILL_TONES = {
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  yellow: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  slate: "bg-slate-500/10 text-slate-600 dark:text-slate-300"
};
var ACCENT_BORDER = {
  red: "border-l-red-500",
  orange: "border-l-orange-500",
  amber: "border-l-amber-500",
  emerald: "border-l-emerald-500",
  teal: "border-l-teal-500",
  blue: "border-l-blue-500",
  indigo: "border-l-indigo-500",
  violet: "border-l-violet-500",
  slate: "border-l-slate-300 dark:border-l-slate-600"
};
var AVATAR_FAMILY = {
  purple: "purple",
  indigo: "indigo",
  blue: "blue",
  cyan: "cyan",
  amber: "amber",
  orange: "orange",
  fuchsia: "fuchsia",
  violet: "violet",
  stone: "stone",
  emerald: "emerald",
  teal: "teal",
  slate: "slate",
  red: "red",
  pink: "pink",
  rose: "rose",
  sky: "sky",
  green: "green",
  yellow: "amber",
  c1: "purple",
  c2: "blue",
  c3: "emerald",
  c4: "amber",
  c5: "fuchsia",
  c6: "violet",
  c7: "cyan",
  c8: "orange",
  c9: "indigo",
  c10: "teal",
  c21: "red",
  c22: "blue",
  c23: "emerald",
  c24: "amber",
  c25: "purple",
  c26: "pink"
};
var getInitials = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};
var buildAssignee = (person, legacyColorMap = {}) => {
  if (!person) return null;
  let key = person.color;
  if (legacyColorMap && legacyColorMap[key]) key = legacyColorMap[key];
  const family = AVATAR_FAMILY[key] || "slate";
  return {
    name: person.name || "Sin asignar",
    initials: getInitials(person.name),
    className: `bg-${family}-600 text-white`,
    photo: person.photo || ""
  };
};
var PersonAvatar = ({ person, size = 24, legacyColorMap = {}, className = "" }) => {
  const dim = { width: size, height: size };
  if (!person) {
    return /* @__PURE__ */ React.createElement(
      "span",
      {
        style: dim,
        className: `rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0 ${className}`
      },
      /* @__PURE__ */ React.createElement(Icon, { name: "User", size: Math.round(size * 0.55) })
    );
  }
  const meta = buildAssignee(person, legacyColorMap);
  if (meta.photo) {
    return /* @__PURE__ */ React.createElement(
      "img",
      {
        src: meta.photo,
        alt: meta.name,
        style: dim,
        className: `rounded-full object-cover shrink-0 border border-black/5 dark:border-white/10 ${className}`
      }
    );
  }
  return /* @__PURE__ */ React.createElement(
    "span",
    {
      style: { ...dim, fontSize: Math.round(size * 0.4) },
      className: `rounded-full flex items-center justify-center font-bold shrink-0 ${meta.className} ${className}`
    },
    meta.initials
  );
};
var CLIENT_STATUSES = [
  {
    id: "Activo",
    label: "Activo",
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10"
  },
  {
    id: "Pausado",
    label: "Pausado",
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10"
  },
  {
    id: "Inactivo",
    label: "Inactivo",
    dot: "bg-slate-400",
    text: "text-slate-500 dark:text-slate-400",
    bg: "bg-slate-500/10"
  }
];
var getClientStatus = (client) => CLIENT_STATUSES.find((s) => s.id === (client?.status || "Activo")) || CLIENT_STATUSES[0];
var CardMenu = ({ items = [] }) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  useEffect(() => {
    if (!open) return void 0;
    const onDoc = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target))
        return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);
  if (!items.length) return null;
  const toggle = (e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const menuWidth = 190;
      let left = r.right - menuWidth;
      if (left < 8) left = 8;
      setCoords({ top: r.bottom + 6, left });
    }
    setOpen((o) => !o);
  };
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "button",
    {
      ref: btnRef,
      onClick: toggle,
      "aria-label": "M\xE1s acciones",
      "aria-haspopup": "true",
      "aria-expanded": open,
      className: "p-1 rounded-md text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    },
    /* @__PURE__ */ React.createElement(Icon, { name: "MoreHorizontal", size: 16 })
  ), open && /* @__PURE__ */ React.createElement(
    "div",
    {
      ref: menuRef,
      onClick: (e) => e.stopPropagation(),
      style: {
        position: "fixed",
        top: coords.top,
        left: coords.left,
        width: 190,
        zIndex: 9999
      },
      className: "py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl shadow-black/10 dark:shadow-black/50 fade-in"
    },
    items.map((it) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: it.key,
        disabled: it.disabled,
        onClick: (e) => {
          e.stopPropagation();
          setOpen(false);
          it.onClick?.();
        },
        className: `w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] font-semibold transition-colors disabled:opacity-40 ${it.danger ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`
      },
      /* @__PURE__ */ React.createElement(Icon, { name: it.icon, size: 15 }),
      " ",
      it.label
    ))
  ));
};
var KanbanCard = ({
  onClick,
  draggable,
  onDragStart,
  onDragEnd,
  accentTone,
  isOverdue,
  client,
  rank,
  badges = [],
  title,
  notes,
  due,
  assignee,
  menuItems = [],
  selected = false
}) => {
  const accent = isOverdue ? "border-l-red-500" : ACCENT_BORDER[accentTone] || "border-l-transparent";
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      role: "button",
      tabIndex: 0,
      "aria-label": `Abrir tarea ${title}`,
      onClick,
      onKeyDown: (event) => {
        if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onClick?.();
        }
      },
      draggable: draggable ? "true" : void 0,
      onDragStart,
      onDragEnd,
      className: `task-card group relative cursor-pointer rounded-xl border border-[#ddd9d1] border-l-[3px] bg-white p-4 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-px hover:border-[#aaa69d] focus-visible:outline-none dark:border-white/10 dark:bg-[#232724] dark:hover:border-white/20 ${selected ? "ring-2 ring-[#b78000]/70 dark:ring-[#e4aa19]/70" : ""} ${accent}`
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-2 mb-1.5 min-h-[20px]" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, client && /* @__PURE__ */ React.createElement("span", { className: "inline-flex max-w-full items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-slate-500 dark:text-slate-400" }, /* @__PURE__ */ React.createElement(Icon, { name: "Briefcase", size: 10, className: "shrink-0" }), /* @__PURE__ */ React.createElement("span", { className: "truncate" }, client))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-0.5 shrink-0" }, rank != null && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5" }, "#", rank), menuItems.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "opacity-70 group-hover:opacity-100 transition-opacity" }, /* @__PURE__ */ React.createElement(CardMenu, { items: menuItems })))),
    /* @__PURE__ */ React.createElement("p", { className: "mb-2.5 line-clamp-2 text-[15px] font-semibold leading-snug text-slate-800 dark:text-slate-100" }, title),
    badges.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "mb-2.5 flex flex-wrap gap-1.5" }, badges.map((b, i) => /* @__PURE__ */ React.createElement(
      "span",
      {
        key: i,
        className: `text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${b.className || PILL_TONES[b.tone] || PILL_TONES.slate}`
      },
      b.label
    ))),
    notes && /* @__PURE__ */ React.createElement("p", { className: "mb-2 line-clamp-1 text-[11.5px] leading-snug text-slate-400 dark:text-slate-500" }, notes),
    /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-white/5" }, due ? /* @__PURE__ */ React.createElement(
      "span",
      {
        className: `inline-flex items-center gap-1 text-[11px] font-semibold ${due.tone === "red" ? "text-red-500 dark:text-red-400" : due.tone === "amber" ? "text-amber-600 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"}`
      },
      /* @__PURE__ */ React.createElement(Icon, { name: "CalendarDays", size: 12, className: "shrink-0" }),
      due.label
    ) : /* @__PURE__ */ React.createElement("span", null), assignee ? assignee.photo ? /* @__PURE__ */ React.createElement(
      "img",
      {
        src: assignee.photo,
        alt: assignee.name,
        title: assignee.name,
        className: "w-6 h-6 rounded-full object-cover shrink-0 border border-black/5 dark:border-white/10"
      }
    ) : /* @__PURE__ */ React.createElement(
      "span",
      {
        title: assignee.name,
        className: `w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${assignee.className}`
      },
      assignee.initials
    ) : /* @__PURE__ */ React.createElement("span", { className: "w-6 h-6 rounded-full border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-300 dark:text-slate-600 shrink-0" }, /* @__PURE__ */ React.createElement(Icon, { name: "User", size: 11 })))
  );
};
var KanbanColumn = ({
  dotColor = "slate",
  title,
  subtitle,
  count,
  onAdd,
  onDragOver,
  onDragLeave,
  onDrop,
  isEmpty,
  children
}) => {
  const columnColor = getDashboardPalette(dotColor).strong;
  return /* @__PURE__ */ React.createElement(
    "section",
    {
      className: "task-room-column flex h-[calc(100dvh-15rem)] min-h-[32rem] w-[88vw] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-[#dedbd4] bg-[#efeee9] transition-colors dark:border-white/10 dark:bg-[#191d1a] sm:w-[24rem] lg:h-full lg:min-h-0 lg:w-auto lg:shrink",
      onDragOver,
      onDragLeave,
      onDrop,
      "aria-label": `${title}: ${count} tareas`
    },
    /* @__PURE__ */ React.createElement("header", { className: "flex shrink-0 items-start justify-between gap-3 border-b border-[#dfddd7] bg-[#f7f6f3]/80 px-4 py-3.5 dark:border-white/10 dark:bg-[#1f2320]/90" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex min-w-0 items-center gap-2.5" }, /* @__PURE__ */ React.createElement(
      "span",
      {
        className: "h-2.5 w-2.5 shrink-0 rounded-full",
        style: { backgroundColor: columnColor }
      }
    ), /* @__PURE__ */ React.createElement("span", { className: "truncate text-sm font-semibold text-[#2f3437] dark:text-[#f1efe9]" }, title), /* @__PURE__ */ React.createElement("span", { className: "mono-meta shrink-0 rounded-md bg-[#e6e4df] px-2 py-0.5 text-[11px] font-semibold text-[#787774] dark:bg-[#2a2a27] dark:text-[#aaa7a0]" }, count)), subtitle && /* @__PURE__ */ React.createElement("p", { className: "mt-1.5 pl-5 text-[11px] text-slate-500 dark:text-slate-400" }, subtitle)), onAdd && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: onAdd,
        "aria-label": `A\xF1adir tarea en ${title}`,
        title: "A\xF1adir tarea",
        className: "flex h-8 min-h-0 w-8 min-w-0 items-center justify-center rounded-md text-[#787774] hover:bg-[#e6e4df] hover:text-[#2f3437] dark:text-[#aaa7a0] dark:hover:bg-[#2a2a27] dark:hover:text-[#f1efe9]"
      },
      /* @__PURE__ */ React.createElement(Icon, { name: "Plus", size: 15 })
    )),
    /* @__PURE__ */ React.createElement("div", { className: "custom-scroll flex-1 space-y-3 overflow-y-auto overscroll-contain p-3" }, isEmpty && /* @__PURE__ */ React.createElement("div", { className: "flex h-full min-h-40 select-none flex-col items-center justify-center gap-2 text-slate-300 dark:text-slate-600" }, /* @__PURE__ */ React.createElement(Icon, { name: "Inbox", size: 24 }), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-semibold" }, "Sin tareas en esta etapa")), children)
  );
};
var KanbanStage = ({
  title,
  dotColor = "slate",
  tasks,
  renderTask,
  showHeader = true,
  collapsible = false,
  collapsedLimit = 3,
  onDragOver,
  onDragLeave,
  onDrop
}) => {
  const [expanded, setExpanded] = useState(false);
  const color = getDashboardPalette(dotColor).strong;
  const canCollapse = collapsible && tasks.length > collapsedLimit;
  const visibleTasks = canCollapse && !expanded ? tasks.slice(0, collapsedLimit) : tasks;
  return /* @__PURE__ */ React.createElement(
    "section",
    {
      className: "rounded-lg border border-transparent transition-colors [&.drag-over]:border-[#b78000] [&.drag-over]:bg-[#b78000]/5",
      onDragOver,
      onDragLeave,
      onDrop,
      "aria-label": `${title}: ${tasks.length} tareas`
    },
    showHeader && /* @__PURE__ */ React.createElement("div", { className: "mb-2 flex items-center justify-between rounded-lg border border-[#dfddd7] bg-[#f7f6f3] px-3 py-2.5 dark:border-white/10 dark:bg-[#202421]" }, /* @__PURE__ */ React.createElement("div", { className: "flex min-w-0 items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "h-2 w-2 shrink-0 rounded-full", style: { backgroundColor: color } }), /* @__PURE__ */ React.createElement("span", { className: "truncate text-[11px] font-semibold uppercase tracking-[0.07em] text-slate-600 dark:text-slate-300" }, title), /* @__PURE__ */ React.createElement("span", { className: "rounded bg-[#e9e7e1] px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-[#2c302c] dark:text-slate-400" }, tasks.length)), canCollapse && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setExpanded((value) => !value),
        className: "flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-black/5 dark:text-slate-400 dark:hover:bg-white/5",
        "aria-label": expanded ? `Contraer ${title}` : `Expandir ${title}`
      },
      /* @__PURE__ */ React.createElement(Icon, { name: expanded ? "ChevronUp" : "ChevronDown", size: 14 })
    )),
    /* @__PURE__ */ React.createElement("div", { className: "space-y-2.5" }, visibleTasks.map((task) => renderTask(task))),
    canCollapse && !expanded && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setExpanded(true),
        className: "mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#cbc7bf] px-3 py-2.5 text-xs font-semibold text-slate-500 hover:border-[#aaa69d] hover:text-slate-700 dark:border-white/15 dark:text-slate-400 dark:hover:border-white/25 dark:hover:text-slate-200"
      },
      "Ver ",
      tasks.length - collapsedLimit,
      " m\xE1s",
      /* @__PURE__ */ React.createElement(Icon, { name: "ChevronDown", size: 14 })
    )
  );
};
var TaskRoomInspector = ({
  task,
  client,
  assignee,
  status,
  onClose,
  onOpenFull
}) => {
  if (!task) return null;
  const checklist = Array.isArray(task.checklist) ? task.checklist : [];
  const completed = checklist.filter((item) => item.done).length;
  const progress = checklist.length ? Math.round(completed / checklist.length * 100) : 0;
  const activity = [
    ...Array.isArray(task.comments) ? task.comments.map((item) => ({
      id: item.id,
      author: item.authorName || "Equipo",
      text: item.text,
      date: item.createdAt
    })) : [],
    ...Array.isArray(task.timeEntries) ? task.timeEntries.map((item) => ({
      id: item.id,
      author: item.authorName || "Equipo",
      text: "Registr\xF3 tiempo en la tarea",
      date: item.loggedAt
    })) : []
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 3);
  const priority = task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : "Normal";
  const isOverdue = isDateBeforeDateString(task.date, getHondurasTodayStr()) && !isCompletedStatus(task.status);
  return /* @__PURE__ */ React.createElement("aside", { className: "task-room-inspector fixed inset-x-3 bottom-3 top-20 z-40 flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#d8d5ce] bg-[#f7f6f2] shadow-2xl dark:border-white/10 dark:bg-[#1c201d] 2xl:static 2xl:z-auto 2xl:shadow-none" }, /* @__PURE__ */ React.createElement("div", { className: "custom-scroll flex-1 overflow-y-auto p-5" }, /* @__PURE__ */ React.createElement("div", { className: "mb-6 flex items-start justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, client && /* @__PURE__ */ React.createElement("p", { className: "mb-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400" }, /* @__PURE__ */ React.createElement(Icon, { name: "Briefcase", size: 11 }), client), /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-semibold leading-snug text-slate-900 dark:text-[#f1efe9]" }, task.title)), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: onClose,
      className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-black/5 dark:text-slate-400 dark:hover:bg-white/5",
      "aria-label": "Cerrar inspector"
    },
    /* @__PURE__ */ React.createElement(Icon, { name: "X", size: 18 })
  )), /* @__PURE__ */ React.createElement("div", { className: "mb-6 grid grid-cols-2 gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "rounded-lg border border-[#dedbd4] bg-white px-3 py-2.5 dark:border-white/10 dark:bg-[#242824]" }, /* @__PURE__ */ React.createElement("p", { className: "text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400" }, "Estado"), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200" }, status?.title || "Sin estado")), /* @__PURE__ */ React.createElement("div", { className: `rounded-lg border px-3 py-2.5 ${priority.toLowerCase() === "urgente" ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300" : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"}` }, /* @__PURE__ */ React.createElement("p", { className: "text-[9px] font-semibold uppercase tracking-[0.08em] opacity-70" }, "Prioridad"), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-xs font-semibold" }, priority))), /* @__PURE__ */ React.createElement("div", { className: "mb-6 grid grid-cols-2 gap-4 border-b border-[#dedbd4] pb-6 dark:border-white/10" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "mb-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400" }, "Responsable"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, assignee ? /* @__PURE__ */ React.createElement(React.Fragment, null, assignee.photo ? /* @__PURE__ */ React.createElement("img", { src: assignee.photo, alt: "", className: "h-8 w-8 rounded-full object-cover" }) : /* @__PURE__ */ React.createElement("span", { className: `flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold ${assignee.className}` }, assignee.initials), /* @__PURE__ */ React.createElement("span", { className: "truncate text-xs font-semibold text-slate-700 dark:text-slate-200" }, assignee.name)) : /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-500" }, "Sin asignar"))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "mb-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400" }, "Vencimiento"), /* @__PURE__ */ React.createElement("p", { className: `inline-flex items-center gap-1.5 text-xs font-semibold ${isOverdue ? "text-red-500" : "text-slate-700 dark:text-slate-200"}` }, /* @__PURE__ */ React.createElement(Icon, { name: "CalendarDays", size: 14 }), formatShortDate(task.date), isOverdue ? " \xB7 atrasada" : ""))), /* @__PURE__ */ React.createElement("div", { className: "mb-6 border-b border-[#dedbd4] pb-6 dark:border-white/10" }, /* @__PURE__ */ React.createElement("div", { className: "mb-2.5 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("p", { className: "text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400" }, "Progreso"), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-semibold text-slate-500" }, progress, "%")), /* @__PURE__ */ React.createElement("div", { className: "mb-2 h-1.5 overflow-hidden rounded-full bg-[#dedbd4] dark:bg-white/10" }, /* @__PURE__ */ React.createElement("span", { className: "block h-full rounded-full bg-[#b78000] transition-[width]", style: { width: `${progress}%` } })), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400" }, checklist.length ? `${completed} de ${checklist.length} completadas` : "Sin checklist")), task.notes && /* @__PURE__ */ React.createElement("div", { className: "mb-6 border-b border-[#dedbd4] pb-6 dark:border-white/10" }, /* @__PURE__ */ React.createElement("p", { className: "mb-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400" }, "Descripci\xF3n"), /* @__PURE__ */ React.createElement("p", { className: "whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300" }, task.notes)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "mb-3 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400" }, "Actividad reciente"), activity.length ? /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, activity.map((item) => /* @__PURE__ */ React.createElement("div", { key: item.id, className: "flex gap-2.5" }, /* @__PURE__ */ React.createElement("span", { className: "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2f6f58] text-[9px] font-bold text-white" }, getInitials(item.author)), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-semibold text-slate-700 dark:text-slate-200" }, item.author), /* @__PURE__ */ React.createElement("p", { className: "mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400" }, item.text))))) : /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400" }, "Sin actividad registrada."))), /* @__PURE__ */ React.createElement("div", { className: "border-t border-[#dedbd4] p-4 dark:border-white/10" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: onOpenFull,
      className: "flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#171817] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#30322f] dark:bg-[#f1efe9] dark:text-[#181817] dark:hover:bg-white"
    },
    "Abrir tarea completa",
    /* @__PURE__ */ React.createElement(Icon, { name: "ExternalLink", size: 15 })
  )));
};
var TaskRoomWorkspace = ({
  groups,
  onAdd,
  canAdd = true,
  renderTask,
  onDragOver,
  onDragLeave,
  onDrop,
  inspector
}) => /* @__PURE__ */ React.createElement("div", { className: `task-room-workspace grid min-h-0 flex-1 gap-3 ${inspector ? "2xl:grid-cols-[minmax(0,1fr)_22rem]" : ""}` }, /* @__PURE__ */ React.createElement("div", { className: "task-room-board flex min-h-0 gap-3 overflow-x-auto pb-4 snap-x snap-mandatory kanban-mobile-scroll lg:grid lg:grid-cols-3 lg:overflow-hidden lg:pb-0" }, groups.map((group) => {
  const count = group.stages.reduce((total, stage) => total + stage.tasks.length, 0);
  return /* @__PURE__ */ React.createElement(
    KanbanColumn,
    {
      key: group.id,
      dotColor: group.color,
      title: group.title,
      subtitle: group.subtitle,
      count,
      onAdd: canAdd ? onAdd : void 0,
      isEmpty: count === 0
    },
    group.stages.map((stage) => /* @__PURE__ */ React.createElement(
      KanbanStage,
      {
        key: stage.id,
        title: stage.title,
        dotColor: stage.color,
        tasks: stage.tasks,
        renderTask: (task) => renderTask(task, stage),
        showHeader: group.stages.length > 1,
        collapsible: stage.collapsible,
        collapsedLimit: stage.collapsedLimit,
        onDragOver,
        onDragLeave,
        onDrop: (event) => onDrop(event, stage.id)
      }
    ))
  );
})), inspector);
var DateHeader = ({
  currentDate,
  setCurrentDate,
  filterMode,
  setFilterMode,
  ownershipFilter = "all",
  setOwnershipFilter,
  title,
  onAdd,
  btnColor,
  btnIcon,
  searchTerm,
  setSearchTerm,
  rangeStart,
  setRangeStart,
  rangeEnd,
  setRangeEnd,
  onLoadHistory,
  historyLoaded = false,
  historyLoading = false,
  taskCount = 0
}) => {
  const today = getHondurasTodayStr();
  const hasRangeSupport = Boolean(setRangeStart && setRangeEnd);
  const effectiveRangeStart = rangeStart || today;
  const effectiveRangeEnd = rangeEnd || today;
  const periodDate = /* @__PURE__ */ new Date(`${currentDate || today}T12:00:00`);
  const periodLabel = new Intl.DateTimeFormat("es-HN", {
    month: "long",
    year: "numeric"
  }).format(periodDate);
  const handleRangeStartChange = (e) => {
    const val = e.target.value;
    setRangeStart(val);
    if (compareDateOnlyStrings(val, effectiveRangeEnd) > 0) setRangeEnd(val);
  };
  const handleRangeEndChange = (e) => {
    const val = e.target.value;
    setRangeEnd(val);
    if (compareDateOnlyStrings(val, effectiveRangeStart) < 0)
      setRangeStart(val);
  };
  const segBase = "shrink-0 min-h-9 px-3 py-2 text-[12px] font-medium rounded-lg transition-colors flex items-center gap-1.5";
  const segActive = "bg-white text-[#252724] shadow-sm dark:bg-[#30342f] dark:text-[#f1efe9]";
  const segIdle = "text-slate-500 dark:text-slate-400 hover:bg-black/5 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-slate-200";
  return /* @__PURE__ */ React.createElement("header", { className: "task-room-header shrink-0 border-b border-[#dedbd4] pb-3 dark:border-white/10" }, /* @__PURE__ */ React.createElement("div", { className: "mb-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("h2", { className: "editorial-title truncate text-[clamp(1.75rem,3vw,2.5rem)] leading-none text-[#2f3437] dark:text-[#f1efe9]" }, title), /* @__PURE__ */ React.createElement("p", { className: "mt-2 text-sm text-slate-500 dark:text-slate-400" }, taskCount, " ", taskCount === 1 ? "tarea" : "tareas", " \xB7 ", periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1))), /* @__PURE__ */ React.createElement("div", { className: "flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center lg:w-auto" }, /* @__PURE__ */ React.createElement(
    SearchBar,
    {
      searchTerm,
      setSearchTerm,
      placeholder: "Buscar tarea..."
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "shrink-0" }, /* @__PURE__ */ React.createElement(
    Button,
    {
      onClick: () => onAdd(
        filterMode === "date" ? currentDate : filterMode === "range" ? effectiveRangeStart : today
      ),
      color: btnColor,
      icon: btnIcon,
      full: true
    },
    "Nueva Tarea"
  )))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex max-w-full overflow-x-auto rounded-lg bg-[#ebe9e3] p-1 kanban-mobile-scroll dark:bg-[#242824]" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setFilterMode("date"),
      className: `${segBase} ${filterMode === "date" ? segActive : segIdle}`
    },
    /* @__PURE__ */ React.createElement(Icon, { name: "CalendarDays", size: 14 }),
    "D\xEDa espec\xEDfico"
  ), hasRangeSupport && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setFilterMode("range"),
      className: `${segBase} ${filterMode === "range" ? segActive : segIdle}`
    },
    /* @__PURE__ */ React.createElement(Icon, { name: "CalendarRange", size: 14 }),
    "Rango"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setFilterMode("overdue"),
      className: `${segBase} ${filterMode === "overdue" ? "bg-[#fdebec] text-[#9f2f2d] dark:bg-red-500/15 dark:text-red-300" : segIdle}`
    },
    "Atrasadas ",
    /* @__PURE__ */ React.createElement(Icon, { name: "Flame", size: 14 })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setFilterMode("all"),
      className: `${segBase} ${filterMode === "all" ? segActive : segIdle}`
    },
    "Este mes"
  ), onLoadHistory && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: async () => {
        if (!historyLoaded) await onLoadHistory();
        setFilterMode("history");
      },
      disabled: historyLoading,
      className: `${segBase} ${filterMode === "history" ? segActive : segIdle}`
    },
    /* @__PURE__ */ React.createElement(Icon, { name: "Clock", size: 14 }),
    historyLoading ? "Cargando" : "Hist\xF3rico"
  )), setOwnershipFilter && /* @__PURE__ */ React.createElement("div", { className: "flex max-w-full overflow-x-auto rounded-lg bg-[#ebe9e3] p-1 kanban-mobile-scroll dark:bg-[#242824]" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setOwnershipFilter("all"),
      className: `${segBase} ${ownershipFilter === "all" ? segActive : segIdle}`
    },
    "Todo el equipo"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setOwnershipFilter("mine"),
      className: `${segBase} ${ownershipFilter === "mine" ? segActive : segIdle}`
    },
    /* @__PURE__ */ React.createElement(Icon, { name: "User", size: 14 }),
    "Asignadas a m\xED"
  )), filterMode === "date" && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      value: currentDate,
      onChange: (e) => setCurrentDate(e.target.value),
      className: "min-h-10 rounded-lg border border-[#d8d5ce] bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-600 outline-none focus:border-[#8e8a82] dark:border-white/10 dark:bg-[#242824] dark:text-slate-300"
    }
  ), currentDate === today && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-bold px-2 py-1 rounded-full shrink-0" }, "Hoy")), filterMode === "range" && hasRangeSupport && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      value: effectiveRangeStart,
      onChange: handleRangeStartChange,
      className: "min-h-10 rounded-lg border border-[#d8d5ce] bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-600 outline-none focus:border-[#8e8a82] dark:border-white/10 dark:bg-[#242824] dark:text-slate-300"
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-semibold text-slate-400" }, "\u2192"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      value: effectiveRangeEnd,
      min: effectiveRangeStart,
      onChange: handleRangeEndChange,
      className: "min-h-10 rounded-lg border border-[#d8d5ce] bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-600 outline-none focus:border-[#8e8a82] dark:border-white/10 dark:bg-[#242824] dark:text-slate-300"
    }
  ))));
};
var AccountRoomView = ({
  tasks,
  managers,
  clients,
  currentUserProfile,
  onAdd,
  onEdit,
  onChangeStatus,
  onDelete,
  onTaskClick,
  legacyColorMap,
  onLoadHistory,
  historyLoaded,
  historyLoading
}) => {
  const {
    currentDate,
    setCurrentDate,
    filterMode,
    setFilterMode,
    ownershipFilter,
    setOwnershipFilter,
    rangeStart,
    setRangeStart,
    rangeEnd,
    setRangeEnd
  } = useTaskRoomState("cluster_account_room_state", {
    preferMine: Boolean(currentUserProfile?.linkedManagerId)
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const todayStr = getHondurasTodayStr();
  const currentMonthPeriod = getRankingMonthPeriod(todayStr);
  const columns = [
    {
      id: "por_disenar",
      title: "Por Dise\xF1ar",
      color: "slate",
      icon: "PenTool"
    },
    {
      id: "aprobacion_interna",
      title: "Aprobaci\xF3n Interna",
      color: "blue",
      icon: "Search"
    },
    {
      id: "aprobado_internamente",
      title: "Aprobado Interno",
      color: "emerald",
      icon: "CheckCircle2"
    },
    { id: "publicado", title: "Publicado", color: "indigo", icon: "Sparkles" }
  ];
  const effectiveRangeStart = rangeStart || todayStr;
  const effectiveRangeEnd = rangeEnd || todayStr;
  const filteredTasks = tasks.filter((t) => {
    if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase()))
      return false;
    if (ownershipFilter === "mine" && !isTaskAssignedToProfile(t, currentUserProfile, [
      currentUserProfile?.linkedManagerId
    ]))
      return false;
    if (filterMode === "date")
      return compareDateOnlyStrings(t.date, currentDate) === 0;
    if (filterMode === "overdue")
      return isDateBeforeDateString(t.date, todayStr) && t.status !== "publicado";
    if (filterMode === "range")
      return compareDateOnlyStrings(t.date, effectiveRangeStart) >= 0 && compareDateOnlyStrings(t.date, effectiveRangeEnd) <= 0;
    if (filterMode === "history") return true;
    return isDateWithinPeriod(t.date, currentMonthPeriod);
  });
  const handleAddTask = (dateStr) => {
    const nextDate = normalizeDateOnlyString(dateStr) || todayStr;
    setCurrentDate(nextDate);
    setFilterMode("date");
    onAdd(nextDate);
  };
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
    try {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const clone = e.currentTarget.cloneNode(true);
      clone.id = "custom-drag-ghost-" + taskId;
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      clone.style.position = "absolute";
      clone.style.top = "-9999px";
      clone.style.left = "-9999px";
      clone.style.opacity = "1";
      clone.style.backgroundColor = document.documentElement.classList.contains(
        "dark"
      ) ? "#0f172a" : "#ffffff";
      clone.style.borderRadius = "0.75rem";
      clone.style.boxShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.4)";
      clone.style.transform = "rotate(3deg) scale(1.05)";
      clone.style.zIndex = "99999";
      clone.style.pointerEvents = "none";
      document.body.appendChild(clone);
      e.dataTransfer.setDragImage(clone, x, y);
    } catch (err) {
    }
    setTimeout(() => e.currentTarget.classList.add("drag-source-hidden"), 0);
  };
  const handleDragEnd = (e, taskId) => {
    e.currentTarget.classList.remove("drag-source-hidden");
    setDraggedTaskId(null);
    document.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
    const clone = document.getElementById("custom-drag-ghost-" + taskId);
    if (clone) clone.remove();
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };
  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("drag-over");
  };
  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    if (draggedTaskId) {
      const task = tasks.find((t) => t.id === draggedTaskId);
      if (task && task.status !== targetStatus)
        onChangeStatus(task, targetStatus);
    }
  };
  const defaultAddDate = filterMode === "date" ? currentDate : filterMode === "range" ? effectiveRangeStart : todayStr;
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;
  const selectedManager = selectedTask ? managers.find((manager) => manager.id === selectedTask.contextId) : null;
  const selectedClient = selectedTask ? clients.find((client) => client.id === selectedTask.clientId) : null;
  const accountGroups = [
    {
      id: "start",
      title: "Por iniciar",
      subtitle: "Tareas pendientes de comenzar",
      color: "slate",
      stages: [{ ...columns[0], tasks: filteredTasks.filter((task) => task.status === columns[0].id) }]
    },
    {
      id: "production",
      title: "En producci\xF3n",
      subtitle: "Validaci\xF3n y aprobaci\xF3n interna",
      color: "blue",
      stages: [{ ...columns[1], tasks: filteredTasks.filter((task) => task.status === columns[1].id) }]
    },
    {
      id: "ready",
      title: "Listas",
      subtitle: "Aprobadas y publicadas",
      color: "emerald",
      stages: columns.slice(2).map((column) => ({
        ...column,
        tasks: filteredTasks.filter((task) => task.status === column.id),
        collapsible: column.id === "publicado",
        collapsedLimit: 3
      }))
    }
  ];
  const renderAccountTask = (task, stage) => {
    const columnIndex = columns.findIndex((column) => column.id === stage.id);
    const previous = columns[columnIndex - 1];
    const next = columns[columnIndex + 1];
    const manager = managers.find((item) => item.id === task.contextId);
    const client = clients.find((item) => item.id === task.clientId);
    const isOverdue = isDateBeforeDateString(task.date, todayStr) && stage.id !== "publicado";
    const menuItems = [];
    if (next)
      menuItems.push({
        key: "next",
        label: next.id === "publicado" ? "Publicar" : `Avanzar a ${next.title}`,
        icon: next.id === "publicado" ? "CheckCircle2" : "ArrowRight",
        onClick: () => onChangeStatus(task, next.id)
      });
    if (previous)
      menuItems.push({
        key: "prev",
        label: `Volver a ${previous.title}`,
        icon: "ChevronLeft",
        onClick: () => onChangeStatus(task, previous.id)
      });
    menuItems.push(
      { key: "edit", label: "Editar", icon: "Edit", onClick: () => onEdit(task) },
      { key: "delete", label: "Eliminar", icon: "Trash2", danger: true, onClick: () => onDelete(task.id) }
    );
    return /* @__PURE__ */ React.createElement(
      KanbanCard,
      {
        key: task.id,
        onClick: () => setSelectedTaskId(task.id),
        selected: selectedTaskId === task.id,
        draggable: true,
        onDragStart: (event) => handleDragStart(event, task.id),
        onDragEnd: (event) => handleDragEnd(event, task.id),
        accentTone: stage.color,
        isOverdue,
        client: client?.name,
        title: task.title,
        badges: task.priority ? [{
          label: task.priority,
          tone: task.priority === "urgente" ? "red" : task.priority === "recurrente" ? "emerald" : "amber"
        }] : [],
        due: {
          label: formatShortDate(task.date) + (isOverdue ? " \xB7 atrasada" : ""),
          tone: isOverdue ? "red" : "slate"
        },
        assignee: buildAssignee(manager, legacyColorMap),
        menuItems
      }
    );
  };
  return /* @__PURE__ */ React.createElement("div", { className: "task-room min-h-0 flex flex-col gap-3 fade-in" }, /* @__PURE__ */ React.createElement(
    DateHeader,
    {
      currentDate,
      setCurrentDate,
      filterMode,
      setFilterMode,
      ownershipFilter,
      setOwnershipFilter,
      title: "Sala de Accounts",
      onAdd: handleAddTask,
      btnColor: "indigo",
      btnIcon: "Briefcase",
      searchTerm,
      setSearchTerm,
      rangeStart,
      setRangeStart,
      rangeEnd,
      setRangeEnd,
      onLoadHistory,
      historyLoaded,
      historyLoading,
      taskCount: filteredTasks.length
    }
  ), /* @__PURE__ */ React.createElement(
    TaskRoomWorkspace,
    {
      groups: accountGroups,
      onAdd: () => handleAddTask(defaultAddDate),
      renderTask: renderAccountTask,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
      inspector: selectedTask ? /* @__PURE__ */ React.createElement(
        TaskRoomInspector,
        {
          task: selectedTask,
          client: selectedClient?.name,
          assignee: buildAssignee(selectedManager, legacyColorMap),
          status: columns.find((column) => column.id === selectedTask.status),
          onClose: () => setSelectedTaskId(null),
          onOpenFull: () => onTaskClick(selectedTask)
        }
      ) : null
    }
  ));
};
var EditionsRoomView = ({
  tasks,
  editors,
  clients,
  currentUserProfile,
  onAdd,
  onEdit,
  onChangeStatus,
  onDelete,
  onTaskClick,
  onLoadHistory,
  historyLoaded,
  historyLoading
}) => {
  const {
    currentDate,
    setCurrentDate,
    filterMode,
    setFilterMode,
    ownershipFilter,
    setOwnershipFilter
  } = useTaskRoomState("cluster_editions_room_state", {
    preferMine: Boolean(currentUserProfile?.linkedEditorId)
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const todayStr = getHondurasTodayStr();
  const currentMonthPeriod = getRankingMonthPeriod(todayStr);
  const columns = [
    { id: "editar", title: "Por Editar", color: "slate", icon: "PenTool" },
    { id: "en_edicion", title: "En Edici\xF3n", color: "amber", icon: "Video" },
    {
      id: "revision_interna",
      title: "En Revisi\xF3n",
      color: "blue",
      icon: "Search"
    },
    {
      id: "aprobado",
      title: "Aprobado",
      color: "emerald",
      icon: "CheckCircle2"
    },
    { id: "publicado", title: "Publicado", color: "indigo", icon: "Sparkles" }
  ];
  const priorityStyles = {
    urgente: "bg-red-50 dark:bg-red-500/20 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400",
    normal: "bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400",
    recurrente: "bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
  };
  const hierarchyStyles = {
    p1: "bg-red-50 dark:bg-red-500/20 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400",
    p2: "bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400",
    p3: "bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
    p4: "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
  };
  const filteredTasks = tasks.filter((t) => {
    if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase()))
      return false;
    if (ownershipFilter === "mine" && !isTaskAssignedToProfile(t, currentUserProfile, [
      currentUserProfile?.linkedEditorId
    ]))
      return false;
    if (filterMode === "date")
      return compareDateOnlyStrings(t.date, currentDate) === 0;
    if (filterMode === "overdue")
      return isDateBeforeDateString(t.date, todayStr) && t.status !== "publicado";
    if (filterMode === "history") return true;
    return isDateWithinPeriod(t.date, currentMonthPeriod);
  });
  const canManageEditingTasks = userHasPermission(
    currentUserProfile,
    "manage_editing_tasks"
  );
  const handleAddTask = (dateStr) => {
    const nextDate = normalizeDateOnlyString(dateStr) || todayStr;
    setCurrentDate(nextDate);
    setFilterMode("date");
    onAdd(nextDate);
  };
  const rankedTasks = rankPendingEditingTasks(filteredTasks, todayStr);
  const displayTasks = [
    ...rankedTasks,
    ...filteredTasks.filter((task) => !isEditingActionable(task))
  ];
  const rankingMap = rankedTasks.reduce(
    (acc, task, index) => ({ ...acc, [task.id]: index + 1 }),
    {}
  );
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
    try {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const clone = e.currentTarget.cloneNode(true);
      clone.id = "custom-drag-ghost-edit-" + taskId;
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      clone.style.position = "absolute";
      clone.style.top = "-9999px";
      clone.style.left = "-9999px";
      clone.style.opacity = "1";
      clone.style.backgroundColor = document.documentElement.classList.contains(
        "dark"
      ) ? "#0f172a" : "#ffffff";
      clone.style.borderRadius = "0.75rem";
      clone.style.boxShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.4)";
      clone.style.transform = "rotate(3deg) scale(1.05)";
      clone.style.zIndex = "99999";
      clone.style.pointerEvents = "none";
      document.body.appendChild(clone);
      e.dataTransfer.setDragImage(clone, x, y);
    } catch (err) {
    }
    setTimeout(() => e.currentTarget.classList.add("drag-source-hidden"), 0);
  };
  const handleDragEnd = (e, taskId) => {
    e.currentTarget.classList.remove("drag-source-hidden");
    setDraggedTaskId(null);
    document.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
    const clone = document.getElementById("custom-drag-ghost-edit-" + taskId);
    if (clone) clone.remove();
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };
  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("drag-over");
  };
  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    if (draggedTaskId) {
      const task = tasks.find((t) => t.id === draggedTaskId);
      if (task && task.status !== targetStatus)
        onChangeStatus(task, targetStatus);
    }
  };
  const defaultAddDate = filterMode === "date" ? currentDate : todayStr;
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;
  const selectedEditor = selectedTask ? editors.find((editor) => editor.id === selectedTask.contextId) : null;
  const selectedClient = selectedTask ? clients.find((client) => client.id === selectedTask.clientId) : null;
  const editingGroups = [
    {
      id: "start",
      title: "Por iniciar",
      subtitle: "Tareas pendientes de comenzar",
      color: "slate",
      stages: [{
        ...columns[0],
        tasks: displayTasks.filter(
          (task) => normalizeEditingWorkflowStatus(task.status) === columns[0].id
        )
      }]
    },
    {
      id: "production",
      title: "En producci\xF3n",
      subtitle: "En edici\xF3n o en revisi\xF3n",
      color: "amber",
      stages: columns.slice(1, 3).map((column) => ({
        ...column,
        tasks: displayTasks.filter(
          (task) => normalizeEditingWorkflowStatus(task.status) === column.id
        )
      }))
    },
    {
      id: "ready",
      title: "Listas",
      subtitle: "Aprobadas y publicadas",
      color: "emerald",
      stages: columns.slice(3).map((column) => ({
        ...column,
        tasks: displayTasks.filter(
          (task) => normalizeEditingWorkflowStatus(task.status) === column.id
        ),
        collapsible: column.id === "publicado",
        collapsedLimit: 3
      }))
    }
  ];
  const renderEditingTask = (task, stage) => {
    const columnIndex = columns.findIndex((column) => column.id === stage.id);
    const previous = columns[columnIndex - 1];
    const next = columns[columnIndex + 1];
    const editor = editors.find((item) => item.id === task.contextId);
    const client = clients.find((item) => item.id === task.clientId);
    const isOverdue = isDateBeforeDateString(task.date, todayStr) && !isCompletedStatus(task.status);
    const hierarchyId = task.hierarchy || getEditingHierarchyId(task);
    const hierarchyTone = hierarchyId === "p1" ? "red" : hierarchyId === "p2" ? "amber" : hierarchyId === "p3" ? "emerald" : "slate";
    const priorityTone = task.priority === "urgente" ? "red" : task.priority === "recurrente" ? "emerald" : "amber";
    const menuItems = [];
    if (canManageEditingTasks) {
      if (next)
        menuItems.push({
          key: "next",
          label: next.id === "publicado" ? "Publicar" : `Avanzar a ${next.title}`,
          icon: next.id === "publicado" ? "CheckCircle2" : "ArrowRight",
          onClick: () => onChangeStatus(task, next.id)
        });
      if (previous)
        menuItems.push({
          key: "prev",
          label: `Volver a ${previous.title}`,
          icon: "ChevronLeft",
          onClick: () => onChangeStatus(task, previous.id)
        });
      menuItems.push(
        { key: "edit", label: "Editar", icon: "Edit", onClick: () => onEdit(task) },
        { key: "delete", label: "Eliminar", icon: "Trash2", danger: true, onClick: () => onDelete(task.id) }
      );
    }
    return /* @__PURE__ */ React.createElement(
      KanbanCard,
      {
        key: task.id,
        onClick: () => setSelectedTaskId(task.id),
        selected: selectedTaskId === task.id,
        draggable: true,
        onDragStart: (event) => handleDragStart(event, task.id),
        onDragEnd: (event) => handleDragEnd(event, task.id),
        accentTone: hierarchyTone,
        isOverdue,
        client: client?.name,
        rank: rankingMap[task.id],
        title: task.title,
        notes: task.notes,
        badges: [
          { label: hierarchyId.toUpperCase(), tone: hierarchyTone },
          { label: task.priority || "Normal", tone: priorityTone }
        ],
        due: {
          label: formatShortDate(task.date) + (isOverdue ? " \xB7 atrasada" : ""),
          tone: isOverdue ? "red" : "slate"
        },
        assignee: buildAssignee(editor),
        menuItems
      }
    );
  };
  return /* @__PURE__ */ React.createElement("div", { className: "task-room min-h-0 flex flex-col gap-3 fade-in" }, /* @__PURE__ */ React.createElement(
    DateHeader,
    {
      currentDate,
      setCurrentDate,
      filterMode,
      setFilterMode,
      ownershipFilter,
      setOwnershipFilter,
      title: "Sala de Edici\xF3n",
      onAdd: handleAddTask,
      btnColor: "amber",
      btnIcon: "Video",
      searchTerm,
      setSearchTerm,
      onLoadHistory,
      historyLoaded,
      historyLoading,
      taskCount: filteredTasks.length
    }
  ), /* @__PURE__ */ React.createElement(
    TaskRoomWorkspace,
    {
      groups: editingGroups,
      onAdd: () => handleAddTask(defaultAddDate),
      canAdd: canManageEditingTasks,
      renderTask: renderEditingTask,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
      inspector: selectedTask ? /* @__PURE__ */ React.createElement(
        TaskRoomInspector,
        {
          task: selectedTask,
          client: selectedClient?.name,
          assignee: buildAssignee(selectedEditor),
          status: columns.find(
            (column) => column.id === normalizeEditingWorkflowStatus(selectedTask.status)
          ),
          onClose: () => setSelectedTaskId(null),
          onOpenFull: () => onTaskClick(selectedTask)
        }
      ) : null
    }
  ));
};
var computeManagementDueBadge = (task) => {
  if (!task?.date || !task?.time || !/^\d{2}:\d{2}$/.test(task.time))
    return null;
  const iso = `${task.date}T${task.time}:00-06:00`;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  const diffMs = ms - Date.now();
  const absHours = Math.abs(diffMs) / 36e5;
  if (diffMs >= 0) {
    if (absHours >= 48)
      return { label: `Vence en ${Math.round(absHours / 24)}d`, tone: "slate" };
    if (absHours >= 1)
      return {
        label: `Vence en ${Math.round(absHours)}h`,
        tone: absHours <= 8 ? "amber" : "slate"
      };
    const mins = Math.max(1, Math.round(diffMs / 6e4));
    return { label: `Vence en ${mins}m`, tone: "red" };
  }
  if (absHours < 1)
    return {
      label: `Vencida hace ${Math.max(1, Math.round(-diffMs / 6e4))}m`,
      tone: "red"
    };
  if (absHours < 48)
    return { label: `Vencida hace ${Math.round(absHours)}h`, tone: "red" };
  return { label: `Vencida hace ${Math.round(absHours / 24)}d`, tone: "red" };
};
var MGMT_CATEGORY_COLORS = {
  seguimiento: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 border-sky-200 dark:border-sky-500/20",
  reunion: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border-purple-200 dark:border-purple-500/20",
  entrega: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 border-orange-200 dark:border-orange-500/20",
  revision: "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300 border-teal-200 dark:border-teal-500/20"
};
var getMgmtCategoryColor = (cat) => MGMT_CATEGORY_COLORS[(cat || "").toLowerCase()] || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
var ManagementRoomView = ({
  tasks,
  members,
  clients,
  currentUserProfile,
  onAdd,
  onEdit,
  onChangeStatus,
  onDelete,
  onTaskClick,
  onLoadHistory,
  historyLoaded,
  historyLoading
}) => {
  const {
    currentDate,
    setCurrentDate,
    filterMode,
    setFilterMode,
    ownershipFilter,
    setOwnershipFilter
  } = useTaskRoomState("cluster_management_room_state", {
    preferMine: currentUserProfile?.role === "management"
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [showTeam, setShowTeam] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const todayStr = getHondurasTodayStr();
  const currentMonthPeriod = getRankingMonthPeriod(todayStr);
  const columns = [
    { id: "pendiente", title: "Pendiente", color: "slate", icon: "Circle" },
    { id: "en_proceso", title: "En Proceso", color: "violet", icon: "Zap" },
    {
      id: "en_espera",
      title: "En Espera",
      color: "amber",
      icon: "PauseCircle"
    },
    { id: "cerrado", title: "Cerrado", color: "emerald", icon: "CheckCircle2" }
  ];
  const filteredTasks = tasks.filter((task) => {
    if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase()))
      return false;
    if (ownershipFilter === "mine" && !isTaskAssignedToProfile(task, currentUserProfile, [
      currentUserProfile?.id
    ]))
      return false;
    if (filterMode === "date")
      return compareDateOnlyStrings(task.date, currentDate) === 0;
    if (filterMode === "overdue")
      return isDateBeforeDateString(task.date, todayStr) && task.status !== "cerrado";
    if (filterMode === "history") return true;
    return isDateWithinPeriod(task.date, currentMonthPeriod);
  });
  const handleAddTask = (dateStr) => {
    const nextDate = normalizeDateOnlyString(dateStr) || todayStr;
    setCurrentDate(nextDate);
    setFilterMode("date");
    onAdd(nextDate);
  };
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragEnd = () => setDraggedTaskId(null);
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };
  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("drag-over");
  };
  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    if (draggedTaskId) {
      const task = tasks.find((t) => t.id === draggedTaskId);
      if (task && task.status !== targetStatus)
        onChangeStatus(task, targetStatus);
    }
  };
  const membersWithAlert = members.filter((m) => !normalizeEmail(m.email));
  const badgeToneMap = {
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
  };
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;
  const selectedMember = selectedTask ? members.find((member) => member.id === selectedTask.contextId) : null;
  const selectedClient = selectedTask ? clients.find((client) => client.id === selectedTask.clientId) : null;
  const buildManagementAssignee = (member) => member ? {
    name: member.name,
    initials: getInitials(member.name),
    className: `bg-${AVATAR_FAMILY[member.color] || "violet"}-600 text-white`,
    photo: member.photo || ""
  } : null;
  const managementGroups = [
    {
      id: "start",
      title: "Por iniciar",
      subtitle: "Tareas pendientes de comenzar",
      color: "slate",
      stages: [{ ...columns[0], tasks: filteredTasks.filter((task) => task.status === columns[0].id) }]
    },
    {
      id: "production",
      title: "En producci\xF3n",
      subtitle: "En proceso o en espera",
      color: "violet",
      stages: columns.slice(1, 3).map((column) => ({
        ...column,
        tasks: filteredTasks.filter((task) => task.status === column.id)
      }))
    },
    {
      id: "ready",
      title: "Listas",
      subtitle: "Trabajo finalizado",
      color: "emerald",
      stages: [{
        ...columns[3],
        tasks: filteredTasks.filter((task) => task.status === columns[3].id),
        collapsible: true,
        collapsedLimit: 3
      }]
    }
  ];
  const renderManagementTask = (task, stage) => {
    const columnIndex = columns.findIndex((column) => column.id === stage.id);
    const previous = columns[columnIndex - 1];
    const next = columns[columnIndex + 1];
    const member = members.find((item) => item.id === task.contextId);
    const client = clients.find((item) => item.id === task.clientId);
    const isOverdue = isDateBeforeDateString(task.date, todayStr) && stage.id !== "cerrado";
    const dueBadge = computeManagementDueBadge(task);
    const badges = [];
    if (task.category)
      badges.push({ label: task.category, className: getMgmtCategoryColor(task.category) });
    if (dueBadge && stage.id !== "cerrado")
      badges.push({ label: dueBadge.label, tone: dueBadge.tone });
    const menuItems = [];
    if (next)
      menuItems.push({
        key: "next",
        label: next.id === "cerrado" ? "Cerrar tarea" : `Avanzar a ${next.title}`,
        icon: next.id === "cerrado" ? "Check" : "ArrowRight",
        onClick: () => onChangeStatus(task, next.id)
      });
    if (previous)
      menuItems.push({
        key: "prev",
        label: `Volver a ${previous.title}`,
        icon: "ChevronLeft",
        onClick: () => onChangeStatus(task, previous.id)
      });
    menuItems.push(
      { key: "edit", label: "Editar", icon: "Edit", onClick: () => onEdit(task) },
      { key: "delete", label: "Eliminar", icon: "Trash2", danger: true, onClick: () => onDelete(task.id) }
    );
    return /* @__PURE__ */ React.createElement(
      KanbanCard,
      {
        key: task.id,
        onClick: () => setSelectedTaskId(task.id),
        selected: selectedTaskId === task.id,
        draggable: true,
        onDragStart: (event) => handleDragStart(event, task.id),
        onDragEnd: handleDragEnd,
        accentTone: stage.color,
        isOverdue,
        client: client?.name,
        title: task.title,
        notes: task.notes,
        badges,
        due: {
          label: formatShortDate(task.date) + (task.time ? ` \xB7 ${task.time}` : "") + (isOverdue ? " \xB7 vencida" : ""),
          tone: isOverdue ? "red" : "slate"
        },
        assignee: buildManagementAssignee(member),
        menuItems
      }
    );
  };
  return /* @__PURE__ */ React.createElement("div", { className: "task-room min-h-0 flex flex-col gap-3 fade-in" }, /* @__PURE__ */ React.createElement(
    DateHeader,
    {
      currentDate,
      setCurrentDate,
      filterMode,
      setFilterMode,
      ownershipFilter,
      setOwnershipFilter,
      title: "Sala de Gesti\xF3n",
      onAdd: handleAddTask,
      btnColor: "violet",
      btnIcon: "ShieldCheck",
      searchTerm,
      setSearchTerm,
      onLoadHistory,
      historyLoaded,
      historyLoading,
      taskCount: filteredTasks.length
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-2 lg:flex-row" }, /* @__PURE__ */ React.createElement("div", { className: "surface-subtle flex flex-1 flex-wrap rounded-xl border border-[#e2e0da] p-1.5 dark:border-white/10" }, columns.map((col) => {
    const filteredCount = filteredTasks.filter(
      (t) => t.status === col.id
    ).length;
    const totalCount = tasks.filter(
      (task) => task.status === col.id && (filterMode === "history" || isDateWithinPeriod(task.date, currentMonthPeriod))
    ).length;
    const isFiltered = filteredCount !== totalCount;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: col.id,
        className: "flex min-w-[130px] flex-1 items-center gap-2.5 rounded-lg px-3 py-2.5"
      },
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: `shrink-0 rounded-md bg-${col.color}-50 p-1.5 dark:bg-${col.color}-500/20`
        },
        /* @__PURE__ */ React.createElement(
          Icon,
          {
            name: col.icon,
            size: 16,
            className: `text-${col.color}-600 dark:text-${col.color}-400`
          }
        )
      ),
      /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-baseline gap-1.5" }, /* @__PURE__ */ React.createElement("p", { className: "mono-meta text-xl font-semibold leading-none text-slate-800 dark:text-white" }, filteredCount), isFiltered && /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-slate-500 dark:text-slate-400" }, "/ ", totalCount)), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400" }, col.title))
    );
  })), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowTeam((s) => !s),
      className: "surface flex shrink-0 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 lg:max-w-[260px]"
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex -space-x-2 shrink-0" }, members.slice(0, 4).map((m) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: m.id,
        className: `w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-black text-white ${membersWithAlert.find((a) => a.id === m.id) ? "bg-amber-500" : "bg-violet-500"}`
      },
      (m.name || "?").slice(0, 2).toUpperCase()
    )), members.length > 4 && /* @__PURE__ */ React.createElement("div", { className: "w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-black bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300" }, "+", members.length - 4)),
    /* @__PURE__ */ React.createElement("div", { className: "text-left" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-black text-slate-700 dark:text-slate-200" }, "Equipo"), membersWithAlert.length > 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-bold text-amber-500" }, membersWithAlert.length, " sin email \u2014 ver detalles") : /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-bold text-emerald-500" }, "Todos con email \u2713")),
    /* @__PURE__ */ React.createElement(
      Icon,
      {
        name: showTeam ? "ChevronUp" : "ChevronDown",
        size: 14,
        className: "text-slate-500 ml-1"
      }
    )
  )), showTeam && /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 fade-in" }, members.map((member) => {
    const openCount = tasks.filter(
      (task) => task.contextId === member.id && task.status !== "cerrado" && isDateWithinPeriod(task.date, currentMonthPeriod)
    ).length;
    const hasAlert = !normalizeEmail(member.email);
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: member.id,
        className: `flex items-center gap-3 p-3 rounded-xl border ${hasAlert ? "border-amber-200 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/5" : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"}`
      },
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: `w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0 ${hasAlert ? "bg-amber-500" : "bg-violet-500"}`
        },
        (member.name || "?").slice(0, 2).toUpperCase()
      ),
      /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-slate-800 dark:text-white text-sm truncate" }, member.name), /* @__PURE__ */ React.createElement(
        "p",
        {
          className: `text-[10px] truncate ${hasAlert ? "text-amber-500 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}`
        },
        hasAlert ? "Sin correo asignado" : member.email
      )),
      openCount > 0 && /* @__PURE__ */ React.createElement("span", { className: "shrink-0 text-[10px] font-black bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 px-2 py-1 rounded-full" }, openCount, " activas")
    );
  })), (filterMode !== "all" || ownershipFilter !== "all" || searchTerm) && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black uppercase tracking-widest text-slate-500" }, "Filtros activos:"), filterMode === "date" && /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1 text-[10px] font-bold bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-500/30" }, /* @__PURE__ */ React.createElement(Icon, { name: "Calendar", size: 9 }), "Fecha: ", currentDate), filterMode === "overdue" && /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1 text-[10px] font-bold bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-500/30" }, /* @__PURE__ */ React.createElement(Icon, { name: "Flame", size: 9 }), "Solo atrasadas"), filterMode === "history" && /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300" }, /* @__PURE__ */ React.createElement(Icon, { name: "Clock", size: 9 }), "Hist\xF3rico completo"), ownershipFilter === "mine" && /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1 text-[10px] font-bold bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-500/30" }, /* @__PURE__ */ React.createElement(Icon, { name: "User", size: 9 }), "Solo mis tareas"), searchTerm && /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700" }, /* @__PURE__ */ React.createElement(Icon, { name: "Search", size: 9 }), '"', searchTerm, '"'), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-500" }, "\u2014 mostrando ", filteredTasks.length, " de ", tasks.length, " tareas")), /* @__PURE__ */ React.createElement(
    TaskRoomWorkspace,
    {
      groups: managementGroups,
      onAdd: () => handleAddTask(filterMode === "date" ? currentDate : todayStr),
      renderTask: renderManagementTask,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
      inspector: selectedTask ? /* @__PURE__ */ React.createElement(
        TaskRoomInspector,
        {
          task: selectedTask,
          client: selectedClient?.name,
          assignee: buildManagementAssignee(selectedMember),
          status: columns.find((column) => column.id === selectedTask.status),
          onClose: () => setSelectedTaskId(null),
          onOpenFull: () => onTaskClick(selectedTask)
        }
      ) : null
    }
  ));
};
var UsersAccessView = ({
  users,
  managers,
  editors,
  auditLogs,
  currentUserProfile,
  onAdd,
  onEdit,
  onResendVerification
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredUsers = users.filter(
    (item) => `${item.name || ""} ${item.email || ""} ${item.role || ""}`.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const verifiedUsers = users.filter(
    (item) => getVerificationMeta(item).isVerified
  ).length;
  const pendingVerificationUsers = users.filter(
    (item) => normalizeEmail(item.email) && !getVerificationMeta(item).isVerified
  ).length;
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-6 fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl md:text-3xl font-black text-slate-800 dark:text-white" }, "Usuarios y Accesos"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1" }, "Permisos por rol, accesos por correo y bitacora de actividad.")), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row w-full md:w-auto gap-3" }, /* @__PURE__ */ React.createElement(
    SearchBar,
    {
      searchTerm,
      setSearchTerm,
      placeholder: "Buscar usuario..."
    }
  ), /* @__PURE__ */ React.createElement(Button, { onClick: onAdd, color: "purple", icon: "UserPlus" }, "Nuevo Usuario"))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" }, /* @__PURE__ */ React.createElement(
    StatCard,
    {
      title: "Usuarios Activos",
      value: users.filter((item) => item.isActive !== false).length,
      icon: "Users",
      color: "purple"
    }
  ), /* @__PURE__ */ React.createElement(
    StatCard,
    {
      title: "Correos Verificados",
      value: verifiedUsers,
      icon: "ShieldCheck",
      color: "emerald"
    }
  ), /* @__PURE__ */ React.createElement(
    StatCard,
    {
      title: "Pendientes Verificar",
      value: pendingVerificationUsers,
      icon: "Mail",
      color: "amber"
    }
  ), /* @__PURE__ */ React.createElement(
    StatCard,
    {
      title: "Admins",
      value: users.filter(
        (item) => item.isActive !== false && ["super_admin", "operations"].includes(item.role)
      ).length,
      icon: "ClipboardList",
      color: "indigo"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 xl:grid-cols-[1.05fr,1.3fr] gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-4" }, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-black text-slate-800 dark:text-white" }, "Directorio"), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-black uppercase tracking-wider text-slate-500" }, getRoleMeta(currentUserProfile?.role).label)), /* @__PURE__ */ React.createElement("div", { className: "space-y-3 max-h-[540px] overflow-y-auto custom-scroll pr-2" }, filteredUsers.length === 0 ? /* @__PURE__ */ React.createElement(
    EmptyState,
    {
      icon: "Users",
      text: "No hay usuarios para este filtro."
    }
  ) : filteredUsers.map((record) => {
    const verificationMeta = getVerificationMeta(record);
    const linkedManager = managers.find(
      (item) => item.id === record.linkedManagerId
    );
    const linkedEditor = editors.find(
      (item) => item.id === record.linkedEditorId
    );
    const linkedLabels = getLinkedProfileLabels(record);
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: record.id,
        className: "p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-start gap-4"
      },
      /* @__PURE__ */ React.createElement(
        "div",
        {
          className: `w-10 h-10 rounded-xl flex items-center justify-center text-white font-black ${record.isActive === false ? "bg-red-500" : "bg-slate-900 dark:bg-slate-700"}`
        },
        (record.name || "??").slice(0, 2).toUpperCase()
      ),
      /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2 items-center" }, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-slate-800 dark:text-white truncate" }, record.name), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300" }, getRoleMeta(record.role).label), /* @__PURE__ */ React.createElement(
        "span",
        {
          className: `text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${verificationMeta.color === "emerald" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" : verificationMeta.color === "amber" ? "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" : verificationMeta.color === "red" ? "bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400" : verificationMeta.color === "blue" ? "bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"}`
        },
        verificationMeta.label
      ), record.isActive === false && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400" }, "Inactivo")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400 truncate mt-2" }, record.email || "Correo pendiente"), record.emailVerification?.lastError && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-red-600 dark:text-red-400 mt-1 break-words" }, record.emailVerification.lastError), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400 mt-1" }, "Ultimo acceso: ", record.lastSeenAt || "Sin registro"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2 mt-3" }, linkedLabels.map((label) => /* @__PURE__ */ React.createElement(
        "span",
        {
          key: `${record.id}-${label}`,
          className: "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
        },
        label
      )), linkedManager && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" }, "AM: ", linkedManager.name), linkedEditor && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold px-2 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300" }, "ED: ", linkedEditor.name))),
      /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-2" }, normalizeEmail(record.email) && !verificationMeta.isVerified && /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => onResendVerification(record),
          className: "p-2 text-slate-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-lg transition-colors",
          title: "Reenviar acceso por correo"
        },
        /* @__PURE__ */ React.createElement(Icon, { name: "Mail", size: 18 })
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => onEdit(record),
          className: "p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors",
          title: "Editar usuario"
        },
        /* @__PURE__ */ React.createElement(Icon, { name: "Edit", size: 18 })
      ))
    );
  }))), /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-4" }, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-black text-slate-800 dark:text-white" }, "Bitacora de Acciones"), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-slate-500 dark:text-slate-400" }, auditLogs.length, " registros")), /* @__PURE__ */ React.createElement("div", { className: "space-y-3 max-h-[540px] overflow-y-auto custom-scroll pr-2" }, auditLogs.length === 0 ? /* @__PURE__ */ React.createElement(
    EmptyState,
    {
      icon: "ClipboardList",
      text: "Aun no hay actividad registrada."
    }
  ) : auditLogs.map((log) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: log.id,
      className: "p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-slate-800 dark:text-white truncate" }, log.description || `${log.action} \xB7 ${log.entityType}`), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2 mt-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300" }, log.action), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400" }, log.entityType), log.status === "error" && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400" }, "Error"), log.status === "denied" && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" }, "Denegado"))), /* @__PURE__ */ React.createElement("div", { className: "text-right" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-500 dark:text-slate-400" }, log.actor?.name || "Sistema"), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-500 dark:text-slate-400" }, log.createdAt || "")))
  ))))));
};
var ManagerPicker = ({
  managers = [],
  value = "",
  onChange,
  legacyColorMap = {},
  buttonClassName = "",
  align = "left",
  placeholder = "Sin asignar"
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 240 });
  const [q, setQ] = useState("");
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  useEffect(() => {
    if (!open) return void 0;
    const onDoc = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target))
        return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);
  const current = managers.find((m) => m.id === value) || null;
  const toggle = (e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const width = Math.max(240, r.width);
      let left = align === "right" ? r.right - width : r.left;
      if (left + width > window.innerWidth - 8)
        left = window.innerWidth - width - 8;
      if (left < 8) left = 8;
      setCoords({ top: r.bottom + 6, left, width });
      setQ("");
    }
    setOpen((o) => !o);
  };
  const pick = (e, id) => {
    e.stopPropagation();
    setOpen(false);
    if (id !== value) onChange?.(id);
  };
  const filtered = q ? managers.filter(
    (m) => (m.name || "").toLowerCase().includes(q.toLowerCase())
  ) : managers;
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "button",
    {
      ref: btnRef,
      type: "button",
      onClick: toggle,
      "aria-haspopup": "listbox",
      "aria-expanded": open,
      className: buttonClassName
    },
    /* @__PURE__ */ React.createElement(PersonAvatar, { person: current, size: 22, legacyColorMap }),
    /* @__PURE__ */ React.createElement("span", { className: "truncate" }, current ? current.name : placeholder),
    /* @__PURE__ */ React.createElement(Icon, { name: "ChevronDown", size: 14, className: "shrink-0 opacity-60" })
  ), open && /* @__PURE__ */ React.createElement(
    "div",
    {
      ref: menuRef,
      onClick: (e) => e.stopPropagation(),
      style: {
        position: "fixed",
        top: coords.top,
        left: coords.left,
        width: coords.width,
        zIndex: 9999
      },
      className: "rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl shadow-black/10 dark:shadow-black/50 overflow-hidden fade-in"
    },
    managers.length > 6 && /* @__PURE__ */ React.createElement("div", { className: "p-2 border-b border-slate-100 dark:border-slate-800" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        autoFocus: true,
        value: q,
        onChange: (e) => setQ(e.target.value),
        placeholder: "Buscar manager...",
        className: "w-full text-sm px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 outline-none text-slate-700 dark:text-slate-200"
      }
    )),
    /* @__PURE__ */ React.createElement("div", { className: "max-h-60 overflow-y-auto custom-scroll py-1" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: (e) => pick(e, ""),
        className: "w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
      },
      /* @__PURE__ */ React.createElement(PersonAvatar, { person: null, size: 22 }),
      " Sin asignar"
    ), filtered.map((m) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: m.id,
        type: "button",
        onClick: (e) => pick(e, m.id),
        className: `w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 ${m.id === value ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-200"}`
      },
      /* @__PURE__ */ React.createElement(
        PersonAvatar,
        {
          person: m,
          size: 22,
          legacyColorMap
        }
      ),
      /* @__PURE__ */ React.createElement("span", { className: "truncate flex-1" }, m.name),
      m.id === value && /* @__PURE__ */ React.createElement(Icon, { name: "Check", size: 15, className: "shrink-0" })
    )), filtered.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "px-3 py-3 text-xs text-slate-400 text-center" }, "Sin resultados"))
  ));
};
var ClientsView = ({
  clients,
  managers = [],
  legacyColorMap = {},
  onAdd,
  onSelect,
  onReassignManager
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const statusFilters = [
    { id: "all", label: "Todos" },
    { id: "Activo", label: "Activos" },
    { id: "Pausado", label: "Pausados" },
    { id: "Inactivo", label: "Inactivos" }
  ];
  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(term) || (c.niche || "").toLowerCase().includes(term);
    if (!matchesSearch) return false;
    if (statusFilter !== "all" && (c.status || "Activo") !== statusFilter)
      return false;
    return true;
  });
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-5 fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl md:text-3xl font-bold text-slate-800 dark:text-white" }, "Cartera de Clientes"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row w-full md:w-auto gap-3" }, /* @__PURE__ */ React.createElement(
    SearchBar,
    {
      searchTerm,
      setSearchTerm,
      placeholder: "Buscar cliente o rubro..."
    }
  ), /* @__PURE__ */ React.createElement(Button, { onClick: onAdd, color: "blue", icon: "Plus" }, "Nuevo Cliente"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 overflow-x-auto kanban-mobile-scroll" }, /* @__PURE__ */ React.createElement("div", { className: "flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0" }, statusFilters.map((f) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: f.id,
      onClick: () => setStatusFilter(f.id),
      className: `shrink-0 px-3 py-1.5 text-[13px] font-semibold rounded-lg transition-all ${statusFilter === f.id ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`
    },
    f.label
  ))), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-medium text-slate-400 dark:text-slate-500 shrink-0" }, filteredClients.length, " de ", clients.length)), filteredClients.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 h-64" }, /* @__PURE__ */ React.createElement(EmptyState, { icon: "Briefcase", text: "No hay clientes que coincidan." })) : /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" }, filteredClients.map((c) => {
    const status = getClientStatus(c);
    const manager = managers.find((m) => m.id === c.managerId) || null;
    const inactive = status.id === "Inactivo";
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: c.id,
        onClick: () => onSelect(c),
        className: `group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600/60 hover:-translate-y-0.5 transition-all cursor-pointer ${inactive ? "opacity-70 hover:opacity-100" : ""}`
      },
      /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-3 mb-4" }, c.photo ? /* @__PURE__ */ React.createElement(
        "img",
        {
          src: c.photo,
          alt: c.name,
          className: "h-14 w-14 rounded-2xl object-cover border border-black/5 dark:border-white/10 shrink-0"
        }
      ) : /* @__PURE__ */ React.createElement("div", { className: "h-14 w-14 bg-blue-50 dark:bg-blue-500/15 rounded-2xl flex items-center justify-center text-2xl font-bold text-blue-600 dark:text-blue-400 shrink-0" }, c.name ? c.name.charAt(0).toUpperCase() : "C"), /* @__PURE__ */ React.createElement(
        "span",
        {
          className: `inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full shrink-0 ${status.bg} ${status.text}`
        },
        /* @__PURE__ */ React.createElement("span", { className: `w-1.5 h-1.5 rounded-full ${status.dot}` }),
        status.label
      )),
      /* @__PURE__ */ React.createElement("h3", { className: "text-base font-bold text-slate-800 dark:text-white truncate" }, c.name),
      /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate mt-0.5" }, c.niche || "Sin rubro"),
      c.package && /* @__PURE__ */ React.createElement("span", { className: "inline-flex items-center gap-1 mt-3 text-[11px] font-semibold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg" }, /* @__PURE__ */ React.createElement(Icon, { name: "Sparkles", size: 11 }), " ", c.package),
      /* @__PURE__ */ React.createElement("div", { className: "pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between gap-2" }, onReassignManager ? /* @__PURE__ */ React.createElement(
        ManagerPicker,
        {
          managers,
          value: c.managerId || "",
          legacyColorMap,
          onChange: (id) => onReassignManager(c, id),
          buttonClassName: "flex items-center gap-2 min-w-0 max-w-full text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg px-1.5 py-1 -ml-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        }
      ) : /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 truncate min-w-0" }, /* @__PURE__ */ React.createElement(
        PersonAvatar,
        {
          person: manager,
          size: 22,
          legacyColorMap
        }
      ), /* @__PURE__ */ React.createElement("span", { className: "truncate" }, manager ? manager.name : c.manager || "Sin asignar")), c.instagram && /* @__PURE__ */ React.createElement(
        "span",
        {
          className: "text-slate-400 dark:text-slate-500 group-hover:text-pink-500 transition-colors shrink-0",
          title: "Instagram"
        },
        /* @__PURE__ */ React.createElement(Icon, { name: "Instagram", size: 16 })
      ))
    );
  })));
};
var ClientDetail = ({
  client,
  managers,
  legacyColorMap = {},
  onReassignManager,
  onBack,
  onUpdate,
  onDelete,
  onEdit
}) => /* @__PURE__ */ React.createElement("div", { className: "space-y-6 max-w-5xl mx-auto fade-in" }, /* @__PURE__ */ React.createElement(
  Breadcrumb,
  {
    items: [
      { label: "Clientes", onClick: onBack },
      { label: client.name || "Detalle" }
    ]
  }
), /* @__PURE__ */ React.createElement(
  "button",
  {
    onClick: onBack,
    className: "flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-sm uppercase p-2 -ml-2"
  },
  /* @__PURE__ */ React.createElement(Icon, { name: "ChevronLeft", size: 16 }),
  " Volver a clientes"
), /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "bg-slate-900 dark:bg-slate-950 p-6 md:p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative group border-b border-slate-800" }, /* @__PURE__ */ React.createElement(
  "button",
  {
    onClick: onEdit,
    "aria-label": "Editar cliente",
    className: "absolute top-4 right-4 text-slate-500 hover:text-white p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
  },
  /* @__PURE__ */ React.createElement(Icon, { name: "Edit", size: 18 })
), /* @__PURE__ */ React.createElement("div", { className: "flex items-start md:items-center gap-6" }, client.photo ? /* @__PURE__ */ React.createElement(
  "img",
  {
    src: client.photo,
    alt: client.name,
    className: "h-20 w-20 rounded-2xl object-cover shadow-inner shrink-0 border border-white/10"
  }
) : /* @__PURE__ */ React.createElement("div", { className: "h-20 w-20 bg-white/10 rounded-2xl flex items-center justify-center text-4xl font-black shadow-inner shrink-0" }, client.name ? client.name.charAt(0).toUpperCase() : "C"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl md:text-3xl font-black" }, client.name), /* @__PURE__ */ React.createElement("div", { className: "mt-2" }, /* @__PURE__ */ React.createElement(
  ManagerPicker,
  {
    managers,
    value: client.managerId || "",
    legacyColorMap,
    onChange: (id) => onReassignManager(client, id),
    placeholder: "Asignar Account Manager...",
    buttonClassName: "flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-white font-bold text-xs transition-all max-w-full"
  }
)))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-start md:items-end gap-1.5 shrink-0 mt-4 md:mt-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold uppercase tracking-widest text-white/50" }, "Estado"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1 bg-white/10 p-1 rounded-xl" }, CLIENT_STATUSES.map((s) => {
  const active = (client.status || "Activo") === s.id;
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      key: s.id,
      onClick: () => onUpdate(client.id, { status: s.id }),
      "aria-label": `Marcar cliente como ${s.label}`,
      "aria-pressed": active,
      className: `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${active ? "bg-white text-slate-800 shadow-sm" : "text-white/70 hover:text-white hover:bg-white/10"}`
    },
    /* @__PURE__ */ React.createElement("span", { className: `w-2 h-2 rounded-full ${s.dot}` }),
    s.label
  );
})))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "p-6 md:p-8 space-y-8" }, /* @__PURE__ */ React.createElement("div", { className: "bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800" }, /* @__PURE__ */ React.createElement("h3", { className: "text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icon, { name: "Instagram", size: 14 }), " Redes"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row gap-2" }, /* @__PURE__ */ React.createElement(
  "input",
  {
    defaultValue: client.instagram,
    onBlur: (e) => onUpdate(client.id, { instagram: e.target.value }),
    placeholder: "Link Instagram...",
    className: "flex-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-sm px-4 py-3 border outline-none text-slate-800 dark:text-slate-200"
  }
), /* @__PURE__ */ React.createElement(
  "a",
  {
    href: client.instagram || "#",
    target: "_blank",
    className: "bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 px-4 py-3 rounded-xl font-bold text-sm hover:bg-pink-100 dark:hover:bg-pink-500/20 flex items-center justify-center gap-2"
  },
  "Ver ",
  /* @__PURE__ */ React.createElement(Icon, { name: "ExternalLink", size: 14 })
))), /* @__PURE__ */ React.createElement(
  "button",
  {
    onClick: onDelete,
    className: "text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 text-xs font-bold flex items-center gap-2 p-2 -ml-2"
  },
  /* @__PURE__ */ React.createElement(Icon, { name: "Trash2", size: 14 }),
  " ELIMINAR CLIENTE"
)))));
var CalendarGrid = ({
  events,
  onAdd,
  onEventClick,
  baseColor = "emerald",
  canAdd = true
}) => {
  const [date, setDate] = useState(/* @__PURE__ */ new Date());
  const userNavigatedRef = useRef(false);
  const dataDates = events.map((event) => normalizeDateOnlyString(event.date)).filter(Boolean).sort();
  const stateMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const hasStateMonthData = dataDates.some((item) => item.startsWith(stateMonth));
  const fallbackDate = dataDates.length > 0 ? dataDates[dataDates.length - 1] : "";
  const displayDate = !userNavigatedRef.current && !hasStateMonthData && fallbackDate ? new Date(Number(fallbackDate.slice(0, 4)), Number(fallbackDate.slice(5, 7)) - 1, 1) : date;
  const daysInMonth = new Date(
    displayDate.getFullYear(),
    displayDate.getMonth() + 1,
    0
  ).getDate();
  const startDay = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1).getDay();
  let mappedColorName = LEGACY_COLOR_MAP[baseColor] || baseColor;
  const style = PERSON_COLORS[mappedColorName] || PERSON_COLORS.slate;
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `font-bold uppercase text-xs tracking-widest text-slate-500 dark:text-slate-400`
    },
    "Vista Mensual"
  ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4 bg-slate-50 dark:bg-slate-800 rounded-lg p-1" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        userNavigatedRef.current = true;
        setDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1));
      },
      "aria-label": "Mes anterior",
      className: "p-3 md:p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-300 shadow-sm"
    },
    /* @__PURE__ */ React.createElement(Icon, { name: "ChevronLeft", size: 16 })
  ), /* @__PURE__ */ React.createElement("span", { className: "font-black text-slate-700 dark:text-slate-200 w-32 text-center text-sm uppercase" }, MONTH_NAMES[displayDate.getMonth()], " ", displayDate.getFullYear()), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        userNavigatedRef.current = true;
        setDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1));
      },
      "aria-label": "Mes siguiente",
      className: "p-3 md:p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-300 shadow-sm"
    },
    /* @__PURE__ */ React.createElement(Icon, { name: "ChevronRight", size: 16 })
  ))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-x-auto overflow-y-auto bg-slate-50 dark:bg-slate-950 custom-scroll" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-7 auto-rows-fr min-w-[800px] h-full" }, ["D", "L", "M", "M", "J", "V", "S"].map((d) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: d,
      className: "py-2 text-center text-[10px] font-black text-slate-500 dark:text-slate-400 border-r border-b border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10"
    },
    d
  )), Array(startDay).fill(null).map((_, i) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: `empty-${i}`,
      className: "border-r border-b border-slate-200/50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
    }
  )), Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
    const dStr = `${displayDate.getFullYear()}-${String(displayDate.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayEvents = events.filter((e) => e.date === dStr);
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: d,
        onClick: () => {
          if (canAdd) onAdd(dStr);
        },
        className: `border-r border-b border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 min-h-[120px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group relative ${canAdd ? "cursor-pointer" : "cursor-default"}`
      },
      /* @__PURE__ */ React.createElement(
        "span",
        {
          className: `text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-purple-500 dark:group-hover:text-purple-400`
        },
        d
      ),
      /* @__PURE__ */ React.createElement("div", { className: "mt-2 space-y-1.5" }, dayEvents.map((e) => {
        const isCompleted = e.status === "publicado" || e.status === "aprobado";
        const itemBg = isCompleted ? "bg-emerald-500" : style.bg;
        const itemText = isCompleted ? "text-white" : style.text;
        const itemBorder = isCompleted ? "border-emerald-600" : "border-black/10 dark:border-white/5";
        return /* @__PURE__ */ React.createElement(
          "div",
          {
            key: e.id,
            onClick: (ev) => {
              ev.stopPropagation();
              onEventClick(e);
            },
            className: `text-[10px] sm:text-xs font-bold p-2 rounded-lg border shadow-sm relative group/evt cursor-pointer ${itemBg} ${itemText} ${itemBorder} hover:brightness-110 active:scale-95 transition-all flex items-center justify-between`
          },
          /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1.5 truncate" }, isCompleted && /* @__PURE__ */ React.createElement(Icon, { name: "CheckCircle2", size: 14 }), e.title)
        );
      })),
      canAdd && /* @__PURE__ */ React.createElement(
        Icon,
        {
          name: "Plus",
          className: `absolute bottom-2 right-2 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity`,
          size: 16
        }
      )
    );
  }))));
};
var GeneralCalendarGrid = ({ activities, onDayClick, onMoveActivity }) => {
  const [viewMode, setViewMode] = useState("month");
  const [date, setDate] = useState(/* @__PURE__ */ new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => (/* @__PURE__ */ new Date()).getFullYear());
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);
  const SHORT_MONTHS = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic"
  ];
  const DAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];
  const toDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const todayStr = toDateStr(/* @__PURE__ */ new Date());
  const dataDates = activities.map((activity) => normalizeDateOnlyString(activity.date)).filter(Boolean).sort();
  const stateMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const hasStateMonthData = dataDates.some((item) => item.startsWith(stateMonth));
  const fallbackDate = dataDates.length > 0 ? dataDates[dataDates.length - 1] : "";
  const displayDate = !hasStateMonthData && fallbackDate ? new Date(Number(fallbackDate.slice(0, 4)), Number(fallbackDate.slice(5, 7)) - 1, 1) : date;
  const getWeekDates = () => {
    const d = new Date(displayDate);
    d.setDate(d.getDate() - d.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const w = new Date(d);
      w.setDate(d.getDate() + i);
      return w;
    });
  };
  const navPrev = () => viewMode === "week" ? setDate((d) => {
    const n = new Date(displayDate);
    n.setDate(n.getDate() - 7);
    return n;
  }) : setDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1));
  const navNext = () => viewMode === "week" ? setDate((d) => {
    const n = new Date(displayDate);
    n.setDate(n.getDate() + 7);
    return n;
  }) : setDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1));
  const getDateLabel = () => {
    if (viewMode === "week") {
      const wk = getWeekDates();
      const s = wk[0], e = wk[6];
      if (s.getMonth() === e.getMonth())
        return `${s.getDate()} \u2013 ${e.getDate()} ${MONTH_NAMES[s.getMonth()]} ${s.getFullYear()}`;
      return `${s.getDate()} ${SHORT_MONTHS[s.getMonth()]} \u2013 ${e.getDate()} ${SHORT_MONTHS[e.getMonth()]} ${e.getFullYear()}`;
    }
    return `${MONTH_NAMES[displayDate.getMonth()]} ${displayDate.getFullYear()}`;
  };
  const handleDragStart = (e, act) => {
    setDraggedId(act.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", act.id);
  };
  const handleDrop = (e, targetDateStr) => {
    e.preventDefault();
    setDragOverDate(null);
    if (!onMoveActivity || !draggedId) return;
    const act = activities.find((a) => a.id === draggedId);
    if (act && act.date !== targetDateStr) onMoveActivity(act, targetDateStr);
    setDraggedId(null);
  };
  const renderDayCell = (dateObj) => {
    const dStr = toDateStr(dateObj);
    const dayActivities = activities.filter((a) => a.date === dStr);
    const isToday = dStr === todayStr;
    const isDragOver = dragOverDate === dStr;
    const maxVisible = viewMode === "week" ? 8 : 4;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: dStr,
        onDragOver: (e) => {
          e.preventDefault();
          setDragOverDate(dStr);
        },
        onDragLeave: () => setDragOverDate((s) => s === dStr ? null : s),
        onDrop: (e) => handleDrop(e, dStr),
        onClick: () => !draggedId && onDayClick(dStr),
        className: `border-r border-b border-slate-200/60 dark:border-slate-800 p-2 transition-colors cursor-pointer group relative ${viewMode === "week" ? "min-h-[200px]" : "min-h-[120px]"} ${isToday ? "ring-2 ring-inset ring-blue-400 dark:ring-blue-500" : ""} ${isDragOver ? "!bg-blue-50 dark:!bg-blue-500/10 ring-2 ring-inset ring-blue-400" : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50"}`
      },
      /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start mb-2" }, /* @__PURE__ */ React.createElement(
        "span",
        {
          className: `text-xs font-bold flex items-center justify-center ${isToday ? "bg-blue-500 text-white w-5 h-5 rounded-full" : "text-slate-500 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400"}`
        },
        dateObj.getDate()
      ), dayActivities.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full" }, dayActivities.length)),
      /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, dayActivities.slice(0, maxVisible).map((act, idx) => /* @__PURE__ */ React.createElement(
        "div",
        {
          key: `${act.id}-${idx}`,
          draggable: Boolean(onMoveActivity),
          onDragStart: (e) => {
            e.stopPropagation();
            handleDragStart(e, act);
          },
          onDragEnd: () => {
            setDraggedId(null);
            setDragOverDate(null);
          },
          className: `text-[10px] font-bold px-1.5 py-0.5 rounded truncate select-none bg-${act._color}-100 dark:bg-${act._color}-500/20 text-${act._color}-800 dark:text-${act._color}-400 border border-${act._color}-200 dark:border-${act._color}-500/30 ${onMoveActivity ? "cursor-grab active:cursor-grabbing" : ""} ${draggedId === act.id ? "opacity-30" : ""}`
        },
        act.title
      )), dayActivities.length > maxVisible && /* @__PURE__ */ React.createElement("div", { className: "text-[10px] font-bold text-slate-500 text-center mt-1" }, "+", dayActivities.length - maxVisible, " m\xE1s")),
      !draggedId && /* @__PURE__ */ React.createElement(
        Icon,
        {
          name: "ExternalLink",
          className: "absolute bottom-2 right-2 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity",
          size: 14
        }
      ),
      isDragOver && /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none" }, /* @__PURE__ */ React.createElement(
        Icon,
        {
          name: "CalendarPlus",
          className: "text-blue-400 dark:text-blue-500 opacity-60",
          size: 24
        }
      ))
    );
  };
  const weekDates = getWeekDates();
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-wrap gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setViewMode("week"),
      className: `shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === "week" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}`
    },
    "Semana"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setViewMode("month"),
      className: `shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === "month" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}`
    },
    "Mes"
  )), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setDate(/* @__PURE__ */ new Date()),
      className: "px-3 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all"
    },
    "Hoy"
  )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-1 relative" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: navPrev,
      "aria-label": viewMode === "week" ? "Semana anterior" : "Mes anterior",
      className: "p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-300 transition-colors"
    },
    /* @__PURE__ */ React.createElement(Icon, { name: "ChevronLeft", size: 16 })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        setPickerYear(date.getFullYear());
        setShowPicker((s) => !s);
      },
      className: "font-black text-slate-700 dark:text-slate-200 min-w-[180px] text-center text-sm uppercase hover:text-blue-500 dark:hover:text-blue-400 transition-colors px-2"
    },
    getDateLabel()
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: navNext,
      "aria-label": viewMode === "week" ? "Semana siguiente" : "Mes siguiente",
      className: "p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-300 transition-colors"
    },
    /* @__PURE__ */ React.createElement(Icon, { name: "ChevronRight", size: 16 })
  ), showPicker && /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "absolute top-full right-0 mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 w-64",
      onClick: (e) => e.stopPropagation()
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-3" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setPickerYear((y) => y - 1),
        "aria-label": "A\xF1o anterior",
        className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
      },
      /* @__PURE__ */ React.createElement(Icon, { name: "ChevronLeft", size: 14 })
    ), /* @__PURE__ */ React.createElement("span", { className: "font-black text-slate-800 dark:text-white text-sm" }, pickerYear), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setPickerYear((y) => y + 1),
        "aria-label": "A\xF1o siguiente",
        className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
      },
      /* @__PURE__ */ React.createElement(Icon, { name: "ChevronRight", size: 14 })
    )),
    /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 gap-1.5" }, SHORT_MONTHS.map((m, i) => {
      const isSel = pickerYear === date.getFullYear() && i === date.getMonth();
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: m,
          onClick: () => {
            setDate(new Date(pickerYear, i, 1));
            setViewMode("month");
            setShowPicker(false);
          },
          className: `py-2 rounded-xl text-xs font-bold transition-all ${isSel ? "bg-blue-500 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"}`
        },
        m
      );
    }))
  ))), showPicker && /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "fixed inset-0 z-40",
      onClick: () => setShowPicker(false)
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-x-auto overflow-y-auto bg-slate-50 dark:bg-slate-950 custom-scroll" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "grid grid-cols-7 min-w-[800px] h-full",
      style: { gridAutoRows: viewMode === "month" ? "1fr" : "auto" }
    },
    DAY_LABELS.map((d, i) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: `hdr-${i}`,
        className: "py-2 text-center text-[10px] font-black text-slate-500 dark:text-slate-400 border-r border-b border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10"
      },
      viewMode === "week" ? `${d} ${weekDates[i]?.getDate()}` : d
    )),
    viewMode === "month" && (() => {
      const startDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      ).getDay();
      const daysInMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
      ).getDate();
      return [
        ...Array(startDay).fill(null).map((_, i) => /* @__PURE__ */ React.createElement(
          "div",
          {
            key: `empty-${i}`,
            className: "border-r border-b border-slate-200/50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
          }
        )),
        ...Array.from(
          { length: daysInMonth },
          (_, i) => renderDayCell(
            new Date(date.getFullYear(), date.getMonth(), i + 1)
          )
        )
      ];
    })(),
    viewMode === "week" && weekDates.map((d) => renderDayCell(d))
  )));
};
var EventActionModal = ({
  config,
  canEdit = true,
  onClose,
  onEdit,
  onDelete
}) => {
  const dialogRef = useDialogA11y(config.isOpen, onClose);
  const dialogTitleId = useId();
  if (!config.isOpen || !config.event) return null;
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200",
      onClick: onClose
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: dialogRef,
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": dialogTitleId,
        tabIndex: -1,
        className: "bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 outline-none",
        onClick: (event) => event.stopPropagation()
      },
      /* @__PURE__ */ React.createElement("div", { className: "p-6 text-center border-b border-slate-100 dark:border-slate-800" }, /* @__PURE__ */ React.createElement("div", { className: "mx-auto w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 mb-4" }, /* @__PURE__ */ React.createElement(Icon, { name: "MousePointerClick", size: 24 })), /* @__PURE__ */ React.createElement(
        "h3",
        {
          id: dialogTitleId,
          className: "text-lg font-black text-slate-800 dark:text-white truncate"
        },
        config.event.title || "Elemento"
      ), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1" }, "\xBFQu\xE9 deseas hacer?")),
      /* @__PURE__ */ React.createElement("div", { className: "p-4 space-y-3" }, canEdit ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => {
            onClose();
            onEdit(config.event, config.type);
          },
          className: "w-full flex items-center justify-center gap-3 py-4 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
        },
        /* @__PURE__ */ React.createElement(Icon, { name: "Edit", size: 20 }),
        " Editar elemento"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => {
            onClose();
            onDelete(config.event, config.type);
          },
          className: "w-full flex items-center justify-center gap-3 py-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-2xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
        },
        /* @__PURE__ */ React.createElement(Icon, { name: "Trash2", size: 20 }),
        " Eliminar"
      )) : /* @__PURE__ */ React.createElement("div", { className: "rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 text-left" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-sm" }, /* @__PURE__ */ React.createElement(Icon, { name: "Lock", size: 16 }), " Acceso de solo lectura"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-amber-700/80 dark:text-amber-300/80 mt-2" }, "No tienes permisos para editar o eliminar este elemento.")), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onClose,
          className: "w-full py-4 text-slate-500 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors mt-2"
        },
        canEdit ? "Cancelar" : "Cerrar"
      ))
    )
  );
};
var TASK_STATUS_DEFS = {
  accountTask: [
    { id: "por_disenar", label: "Por Dise\xF1ar", color: "slate" },
    { id: "aprobacion_interna", label: "Aprob. Interna", color: "blue" },
    { id: "aprobado_internamente", label: "Aprobado", color: "emerald" },
    { id: "publicado", label: "Publicado", color: "indigo" }
  ],
  editingTask: [
    { id: "editar", label: "Por Editar", color: "slate" },
    { id: "en_edicion", label: "En Edici\xF3n", color: "amber" },
    { id: "revision_interna", label: "Revisi\xF3n", color: "blue" },
    { id: "aprobado", label: "Aprobado", color: "emerald" },
    { id: "publicado", label: "Publicado", color: "indigo" }
  ],
  managementTask: [
    { id: "pendiente", label: "Pendiente", color: "slate" },
    { id: "en_proceso", label: "En Proceso", color: "violet" },
    { id: "en_espera", label: "En Espera", color: "amber" },
    { id: "cerrado", label: "Cerrado", color: "emerald" }
  ]
};
var formatDuration = (ms) => {
  if (!ms || ms <= 0) return "0s";
  const totalSecs = Math.floor(ms / 1e3);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor(totalSecs % 3600 / 60);
  const secs = totalSecs % 60;
  if (hrs > 0) return `${hrs}h ${mins > 0 ? `${mins}m` : ""}`.trim();
  if (mins > 0) return `${mins}m ${secs > 0 ? `${secs}s` : ""}`.trim();
  return `${secs}s`;
};
var relativeTime = (iso) => {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 6e4);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
};
var STATUS_COLOR_CLASSES = {
  slate: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600",
  blue: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-500/40",
  emerald: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40",
  indigo: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/40",
  amber: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/40",
  violet: "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-500/40"
};
var TaskDetailModal = ({
  config,
  onClose,
  clients,
  managers,
  editors,
  users,
  canEdit,
  onEdit,
  onChangeStatus,
  onAddComment,
  onAddTimeEntry,
  onUpdateChecklist,
  onChangePriority,
  onChangeAssignee,
  onChangeAssignees,
  sendNotification,
  onAddAttachment,
  onRemoveAttachment,
  onDelete,
  currentUserProfile,
  accountTasks = [],
  editingTasks = [],
  managementTasks = []
}) => {
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [savingTime, setSavingTime] = useState(false);
  const [newCheckItem, setNewCheckItem] = useState("");
  const [addingCheck, setAddingCheck] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(-1);
  const [mentionedIds, setMentionedIds] = useState([]);
  const dialogRef = useDialogA11y(config.isOpen, onClose);
  const dialogTitleId = useId();
  const [fullAttachments, setFullAttachments] = useState(null);
  useEffect(() => {
    if (!statusOpen && !priorityOpen && !assigneeOpen) return;
    const handler = (e) => {
      if (!e.target.closest("[data-dropdown]")) {
        setStatusOpen(false);
        setPriorityOpen(false);
        setAssigneeOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [statusOpen, priorityOpen, assigneeOpen]);
  const timerStartRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const commentInputRef = useRef(null);
  useEffect(() => {
    if (timerRunning) {
      timerStartRef.current = Date.now() - timerElapsed;
      timerIntervalRef.current = setInterval(() => {
        setTimerElapsed(Date.now() - timerStartRef.current);
      }, 1e3);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [timerRunning]);
  const attachmentColMap = {
    accountTask: "account_tasks",
    editingTask: "editing",
    managementTask: "management_tasks"
  };
  const liveTaskForAttachments = config.task ? ({ accountTask: accountTasks, editingTask: editingTasks, managementTask: managementTasks }[config.type] || []).find((t) => t.id === config.task.id) || config.task : null;
  const attachmentsSignature = Array.isArray(
    liveTaskForAttachments?.attachments
  ) ? liveTaskForAttachments.attachments.map((att) => `${att.id}:${att.hasData ? 1 : 0}:${att.data ? 1 : 0}`).join(",") : "";
  useEffect(() => {
    if (!config.isOpen || !config.task) {
      setFullAttachments(null);
      return;
    }
    const col = attachmentColMap[config.type];
    const taskId = config.task.id;
    const pendingAttachments = Array.isArray(
      liveTaskForAttachments?.attachments
    ) ? liveTaskForAttachments.attachments : [];
    const needsFetch = pendingAttachments.some(
      (att) => att.hasData && !att.data
    );
    if (!col || !taskId || !needsFetch) return;
    let cancelled = false;
    getDoc(doc(db, "artifacts", appId, "public", "data", col, taskId)).then((snap) => {
      if (!cancelled) setFullAttachments(snap.data()?.attachments || null);
    }).catch(() => {
    });
    return () => {
      cancelled = true;
    };
  }, [config.isOpen, config.task?.id, config.type, attachmentsSignature]);
  if (!config.isOpen || !config.task) return null;
  const { type } = config;
  const liveArrays = {
    accountTask: accountTasks,
    editingTask: editingTasks,
    managementTask: managementTasks
  };
  const task = (liveArrays[type] || []).find((t) => t.id === config.task.id) || config.task;
  const client = clients.find((c) => c.id === task.clientId);
  const assignee = type === "accountTask" ? managers.find((m) => m.id === task.contextId) : type === "managementTask" ? users.find((u) => u.id === task.contextId) : editors.find((e) => e.id === task.contextId);
  const currentAssigneeIds = Array.isArray(task.assignees) ? task.assignees : task.contextId ? [task.contextId] : [];
  const tagColor = type === "accountTask" ? "indigo" : type === "managementTask" ? "violet" : "amber";
  const typeLabel = type === "accountTask" ? "Account" : type === "managementTask" ? "Gesti\xF3n" : "Edici\xF3n";
  const iconName = type === "accountTask" ? "LayoutList" : type === "managementTask" ? "ShieldCheck" : "Video";
  const statuses = TASK_STATUS_DEFS[type] || [];
  const currentStatus = statuses.find((s) => s.id === task.status) || statuses[0];
  const canAct = canEdit(type);
  const comments = Array.isArray(task.comments) ? [...task.comments].reverse() : [];
  const timeEntries = Array.isArray(task.timeEntries) ? task.timeEntries : [];
  const totalLoggedMs = timeEntries.reduce(
    (acc, e) => acc + (e.durationMs || 0),
    0
  );
  const activityFeed = [
    ...comments.map((c) => ({ ...c, _kind: "comment" })),
    ...timeEntries.map((e) => ({ ...e, _kind: "time", createdAt: e.loggedAt }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const handleStopTimer = async () => {
    setTimerRunning(false);
    const elapsed = timerElapsed;
    setTimerElapsed(0);
    if (elapsed >= 1e3) {
      setSavingTime(true);
      try {
        await onAddTimeEntry(task, type, elapsed);
      } finally {
        setSavingTime(false);
      }
    }
  };
  const handleSubmitComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAddComment(task, type, commentText.trim(), mentionedIds);
      setCommentText("");
      setMentionedIds([]);
    } finally {
      setSubmitting(false);
    }
  };
  const handleCommentChange = (e) => {
    const val = e.target.value;
    setCommentText(val);
    const pos = e.target.selectionStart;
    const before = val.slice(0, pos);
    const atMatch = before.match(/@([\wÀ-ž]*)$/);
    if (atMatch) {
      setMentionOpen(true);
      setMentionQuery(atMatch[1]);
      setMentionStart(before.lastIndexOf("@"));
    } else {
      setMentionOpen(false);
      setMentionQuery("");
      setMentionStart(-1);
    }
  };
  const insertMention = (person) => {
    const before = commentText.slice(0, mentionStart);
    const after = commentText.slice(mentionStart + 1 + mentionQuery.length);
    setCommentText(before + "@" + person.name + " " + after);
    setMentionedIds(
      (prev) => prev.includes(person.id) ? prev : [...prev, person.id]
    );
    setMentionOpen(false);
    setMentionQuery("");
    setMentionStart(-1);
    setTimeout(
      () => commentInputRef.current && commentInputRef.current.focus(),
      0
    );
  };
  const FieldRow = ({ icon, label, children }) => /* @__PURE__ */ React.createElement("div", { className: "flex items-center min-h-[32px] hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg px-2 -mx-2 transition-colors" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 w-40 shrink-0" }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 13, className: "text-slate-500 shrink-0" }), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-500 dark:text-slate-400 font-medium" }, label)), /* @__PURE__ */ React.createElement("div", { className: "flex-1 text-sm" }, children));
  const priorityColors = {
    urgente: "text-red-500",
    alta: "text-orange-500",
    normal: "text-slate-500",
    baja: "text-slate-300"
  };
  const PRIORITIES = [
    {
      id: "urgente",
      label: "Urgente",
      color: "text-red-500",
      iconColor: "#ef4444"
    },
    {
      id: "alta",
      label: "Alta",
      color: "text-orange-400",
      iconColor: "#fb923c"
    },
    {
      id: "normal",
      label: "Normal",
      color: "text-blue-400",
      iconColor: "#60a5fa"
    },
    {
      id: "baja",
      label: "Baja",
      color: "text-slate-500",
      iconColor: "#94a3b8"
    }
  ];
  const currentPriority = PRIORITIES.find((p) => p.id === task.priority);
  const peoplePool = type === "accountTask" ? managers : type === "editingTask" ? editors : users;
  const allMentionables = [
    ...users || [],
    ...managers || [],
    ...editors || []
  ].filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);
  const mentionSuggestions = mentionOpen ? allMentionables.filter(
    (p) => p.name && p.name.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 6) : [];
  const FlagIcon = ({ color, filled, size = 13 }) => /* @__PURE__ */ React.createElement(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: filled ? color : "none",
      stroke: color || "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    },
    /* @__PURE__ */ React.createElement("path", { d: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" }),
    /* @__PURE__ */ React.createElement("line", { x1: "4", y1: "22", x2: "4", y2: "15" })
  );
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "fixed inset-0 z-[80] bg-slate-950/70 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto",
      onClick: onClose
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: dialogRef,
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": dialogTitleId,
        tabIndex: -1,
        className: "bg-white dark:bg-slate-950 rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden outline-none",
        style: { maxHeight: "92vh" },
        onClick: function(e) {
          e.stopPropagation();
        }
      },
      /* @__PURE__ */ React.createElement("div", { className: "min-h-[56px] border-b border-slate-200 dark:border-slate-800 flex items-center px-4 md:px-5 gap-2 shrink-0 bg-white/95 dark:bg-slate-950/95" }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: `flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wide bg-${tagColor}-100 dark:bg-${tagColor}-500/20 text-${tagColor}-700 dark:text-${tagColor}-400`
        },
        /* @__PURE__ */ React.createElement(Icon, { name: iconName, size: 11 }),
        typeLabel
      ), /* @__PURE__ */ React.createElement(
        Icon,
        {
          name: "ChevronRight",
          size: 12,
          className: "text-slate-300 dark:text-slate-600"
        }
      ), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-500 font-mono" }, task.id?.slice(0, 8)), /* @__PURE__ */ React.createElement("div", { className: "flex-1" }), canAct && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => onEdit(task, type),
          "aria-label": `Editar ${task.title || "tarea"}`,
          title: "Editar",
          className: "min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
        },
        /* @__PURE__ */ React.createElement(Icon, { name: "Pencil", size: 11 }),
        " ",
        /* @__PURE__ */ React.createElement("span", { className: "hidden sm:inline" }, "Editar")
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => onDelete(task, type),
          "aria-label": `Eliminar ${task.title || "tarea"}`,
          title: "Eliminar",
          className: "min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
        },
        /* @__PURE__ */ React.createElement(Icon, { name: "Trash2", size: 11 }),
        " ",
        /* @__PURE__ */ React.createElement("span", { className: "hidden sm:inline" }, "Eliminar")
      )), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onClose,
          "aria-label": "Cerrar modal",
          className: "ml-1 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
        },
        /* @__PURE__ */ React.createElement(Icon, { name: "X", size: 16 })
      )),
      /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0 overflow-y-auto custom-scroll bg-white dark:bg-slate-950" }, /* @__PURE__ */ React.createElement("div", { className: "max-w-3xl mx-auto px-5 md:px-8 pt-6 md:pt-7 pb-10" }, /* @__PURE__ */ React.createElement(
        "h1",
        {
          id: dialogTitleId,
          className: "text-xl md:text-[24px] font-black text-slate-900 dark:text-white leading-snug mb-4 pr-4 break-words"
        },
        task.title
      ), /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "flex flex-wrap items-center gap-3 mb-6",
          "data-dropdown": true
        },
        /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => canAct && setStatusOpen((o) => !o),
            className: `min-h-[34px] flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border shadow-sm ${STATUS_COLOR_CLASSES[currentStatus?.color || "slate"]} ${canAct ? "cursor-pointer hover:opacity-90" : "cursor-default"} transition-opacity`
          },
          currentStatus?.label || task.status,
          canAct && /* @__PURE__ */ React.createElement(Icon, { name: "ChevronDown", size: 10 })
        ), statusOpen && canAct && /* @__PURE__ */ React.createElement(
          "div",
          {
            className: "absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1 min-w-[180px]",
            "data-dropdown": true
          },
          statuses.map((s) => /* @__PURE__ */ React.createElement(
            "button",
            {
              key: s.id,
              onClick: () => {
                onChangeStatus(task, type, s.id);
                setStatusOpen(false);
              },
              className: `w-full flex items-center gap-2.5 px-4 py-2 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left ${task.status === s.id ? "text-purple-600 dark:text-purple-400" : "text-slate-700 dark:text-slate-200"}`
            },
            /* @__PURE__ */ React.createElement(
              "span",
              {
                className: `w-2 h-2 rounded-full bg-${s.color}-500 shrink-0`
              }
            ),
            s.label,
            task.status === s.id && /* @__PURE__ */ React.createElement(
              Icon,
              {
                name: "Check",
                size: 12,
                className: "ml-auto text-purple-500"
              }
            )
          ))
        )),
        task.createdAt && /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1" }, /* @__PURE__ */ React.createElement(Icon, { name: "Clock", size: 11 }), "Creado el", " ", new Date(task.createdAt).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short"
        }), " ", "a las", " ", new Date(task.createdAt).toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit"
        }))
      ), /* @__PURE__ */ React.createElement("div", { className: "mb-7" }, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 mb-2" }, "Descripci\xF3n"), task.notes ? /* @__PURE__ */ React.createElement("div", { className: "rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 px-4 py-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed" }, task.notes)) : /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: canAct ? () => onEdit(task, type) : void 0,
          className: `w-full min-h-[54px] flex items-center gap-2 text-left px-4 py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 text-sm text-slate-500 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-600 hover:text-slate-700 dark:hover:text-slate-200 transition-colors ${canAct ? "cursor-pointer" : ""}`
        },
        /* @__PURE__ */ React.createElement(Icon, { name: "Plus", size: 14, className: "shrink-0" }),
        canAct ? "Agregar descripci\xF3n" : "Sin descripci\xF3n"
      )), (() => {
        const checklist = Array.isArray(task.checklist) ? task.checklist : [];
        const done = checklist.filter((i) => i.done).length;
        const pct = checklist.length > 0 ? Math.round(done / checklist.length * 100) : 0;
        const toggleItem = (id) => onUpdateChecklist(
          task,
          type,
          checklist.map(
            (i) => i.id === id ? { ...i, done: !i.done } : i
          )
        );
        const deleteItem = (id) => onUpdateChecklist(
          task,
          type,
          checklist.filter((i) => i.id !== id)
        );
        const addItem = () => {
          if (!newCheckItem.trim()) return;
          onUpdateChecklist(task, type, [
            ...checklist,
            {
              id: Math.random().toString(36).slice(2, 10),
              text: newCheckItem.trim(),
              done: false
            }
          ]);
          setNewCheckItem("");
          setAddingCheck(false);
        };
        return /* @__PURE__ */ React.createElement("div", { className: "mb-7" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-3" }, /* @__PURE__ */ React.createElement(
          Icon,
          {
            name: "CheckSquare",
            size: 13,
            className: "text-slate-500"
          }
        ), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400" }, "Lista de control"), checklist.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-500 ml-1" }, done, "/", checklist.length), checklist.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "ml-auto text-xs font-bold text-slate-500" }, pct, "%")), checklist.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 overflow-hidden" }, /* @__PURE__ */ React.createElement(
          "div",
          {
            className: "h-full bg-emerald-500 rounded-full transition-all duration-500",
            style: { width: `${pct}%` }
          }
        )), /* @__PURE__ */ React.createElement("div", { className: "space-y-0.5" }, checklist.map((item) => /* @__PURE__ */ React.createElement(
          "div",
          {
            key: item.id,
            className: "flex items-center gap-3 group py-2 px-3 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/70 transition-colors"
          },
          /* @__PURE__ */ React.createElement(
            "button",
            {
              onClick: () => toggleItem(item.id),
              className: `w-[18px] h-[18px] rounded-[4px] border-2 shrink-0 flex items-center justify-center transition-all ${item.done ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-slate-600 hover:border-emerald-400"}`
            },
            item.done && /* @__PURE__ */ React.createElement(
              Icon,
              {
                name: "Check",
                size: 11,
                className: "text-white"
              }
            )
          ),
          /* @__PURE__ */ React.createElement(
            "span",
            {
              className: `flex-1 text-sm ${item.done ? "line-through text-slate-500" : "text-slate-700 dark:text-slate-200"}`
            },
            item.text
          ),
          /* @__PURE__ */ React.createElement(
            "button",
            {
              onClick: () => deleteItem(item.id),
              className: "opacity-0 group-hover:opacity-100 p-1 rounded text-slate-500 hover:text-red-400 transition-all"
            },
            /* @__PURE__ */ React.createElement(Icon, { name: "X", size: 12 })
          )
        ))), addingCheck ? /* @__PURE__ */ React.createElement("div", { className: "flex gap-3 items-center mt-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/40" }, /* @__PURE__ */ React.createElement("div", { className: "w-[18px] h-[18px] rounded-[4px] border-2 border-slate-300 dark:border-slate-600 shrink-0" }), /* @__PURE__ */ React.createElement(
          "input",
          {
            autoFocus: true,
            value: newCheckItem,
            onChange: (e) => setNewCheckItem(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter") addItem();
              if (e.key === "Escape") {
                setAddingCheck(false);
                setNewCheckItem("");
              }
            },
            placeholder: "Nombre del elemento... (Enter para guardar)",
            className: "flex-1 text-sm bg-transparent outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400"
          }
        ), /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => {
              setAddingCheck(false);
              setNewCheckItem("");
            },
            className: "text-slate-500 hover:text-slate-600 transition-colors"
          },
          /* @__PURE__ */ React.createElement(Icon, { name: "X", size: 13 })
        )) : /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => canAct && setAddingCheck(true),
            className: `flex items-center gap-2 mt-3 min-h-[42px] rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors px-4 py-2 w-full ${!canAct ? "opacity-40 cursor-default" : ""}`
          },
          /* @__PURE__ */ React.createElement(Icon, { name: "Plus", size: 13 }),
          " Agregar elemento"
        ));
      })(), (() => {
        const attachments = Array.isArray(fullAttachments) ? fullAttachments : Array.isArray(task.attachments) ? task.attachments : [];
        const handleFileChange = async (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          setUploadingFile(true);
          try {
            await onAddAttachment(task, type, file);
          } finally {
            setUploadingFile(false);
            e.target.value = "";
          }
        };
        const formatFileSize = (bytes) => {
          if (bytes < 1024) return bytes + " B";
          if (bytes < 1024 * 1024)
            return (bytes / 1024).toFixed(1) + " KB";
          return (bytes / (1024 * 1024)).toFixed(1) + " MB";
        };
        const downloadFile = (att) => {
          if (!att.data) return;
          const a = document.createElement("a");
          a.href = att.data;
          a.download = att.name;
          a.click();
        };
        const isImage = (att) => att.type && att.type.startsWith("image/");
        const isLoadingData = (att) => att.hasData && !att.data;
        return /* @__PURE__ */ React.createElement("div", { className: "mb-7" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-3" }, /* @__PURE__ */ React.createElement(Icon, { name: "Inbox", size: 13, className: "text-slate-500" }), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400" }, "Adjuntos"), attachments.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-500 ml-1" }, attachments.length), canAct && attachments.length > 0 && /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => fileInputRef.current && fileInputRef.current.click(),
            disabled: uploadingFile,
            className: "ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          },
          uploadingFile ? /* @__PURE__ */ React.createElement(
            Icon,
            {
              name: "Loader2",
              size: 11,
              className: "animate-spin"
            }
          ) : /* @__PURE__ */ React.createElement(Icon, { name: "Plus", size: 11 }),
          uploadingFile ? "Subiendo..." : "Adjuntar"
        )), /* @__PURE__ */ React.createElement(
          "input",
          {
            ref: fileInputRef,
            type: "file",
            className: "hidden",
            onChange: handleFileChange,
            accept: "image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.mp4,.mov"
          }
        ), attachments.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, attachments.map((att) => /* @__PURE__ */ React.createElement(
          "div",
          {
            key: att.id,
            className: "flex items-center gap-3 group p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/50 transition-colors"
          },
          isImage(att) && att.data ? /* @__PURE__ */ React.createElement(
            "img",
            {
              src: att.data,
              alt: att.name,
              className: "w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
            }
          ) : /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0" }, /* @__PURE__ */ React.createElement(
            Icon,
            {
              name: isLoadingData(att) ? "Loader2" : "FileText",
              size: 16,
              className: isLoadingData(att) ? "text-slate-500 animate-spin" : "text-slate-500"
            }
          )),
          /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-semibold text-slate-700 dark:text-slate-200 truncate" }, att.name), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500" }, formatFileSize(att.size), " \xB7 ", att.uploadedBy, " \xB7", " ", relativeTime(att.uploadedAt))),
          /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" }, /* @__PURE__ */ React.createElement(
            "button",
            {
              onClick: () => downloadFile(att),
              title: isLoadingData(att) ? "Cargando adjunto..." : "Descargar",
              disabled: isLoadingData(att),
              className: "p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            },
            /* @__PURE__ */ React.createElement(Icon, { name: "ArrowRight", size: 13 })
          ), canAct && /* @__PURE__ */ React.createElement(
            "button",
            {
              onClick: () => onRemoveAttachment(task, type, att.id),
              title: "Eliminar",
              className: "p-1.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            },
            /* @__PURE__ */ React.createElement(Icon, { name: "X", size: 13 })
          ))
        ))), attachments.length === 0 && /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => canAct && fileInputRef.current && fileInputRef.current.click(),
            className: `w-full min-h-[58px] flex items-center gap-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:border-blue-300 dark:hover:border-blue-600 transition-colors px-4 py-3 ${!canAct ? "opacity-40 cursor-default" : ""}`
          },
          /* @__PURE__ */ React.createElement(Icon, { name: "Plus", size: 13 }),
          " Adjuntar archivo"
        ));
      })(), /* @__PURE__ */ React.createElement("div", { className: "border-t border-slate-100 dark:border-slate-800 pt-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-5" }, /* @__PURE__ */ React.createElement(
        Icon,
        {
          name: "MessageSquare",
          size: 13,
          className: "text-slate-500"
        }
      ), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400" }, "Actividad"), totalLoggedMs > 0 && /* @__PURE__ */ React.createElement("span", { className: "ml-auto text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1" }, /* @__PURE__ */ React.createElement(Icon, { name: "Clock", size: 11 }), formatDuration(totalLoggedMs))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-3 mb-6" }, /* @__PURE__ */ React.createElement("div", { className: "w-8 h-8 rounded-full bg-[#555552] flex items-center justify-center text-white font-black text-[10px] shrink-0" }, (currentUserProfile?.name || "U").slice(0, 2).toUpperCase()), /* @__PURE__ */ React.createElement("div", { className: "flex-1 relative" }, /* @__PURE__ */ React.createElement(
        "textarea",
        {
          ref: commentInputRef,
          value: commentText,
          onChange: handleCommentChange,
          onKeyDown: (e) => {
            if (mentionOpen && e.key === "Escape") {
              setMentionOpen(false);
              e.preventDefault();
              return;
            }
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
              handleSubmitComment();
          },
          placeholder: "Escribe un comentario... usa @ para mencionar (Ctrl+Enter para enviar)",
          rows: commentText ? 3 : 1,
          className: "w-full min-h-[46px] px-4 py-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500/70 resize-none text-slate-700 dark:text-slate-200 placeholder-slate-400 transition-all"
        }
      ), mentionOpen && mentionSuggestions.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "absolute left-0 bottom-full mb-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1 w-52" }, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 pt-1.5 pb-1" }, "Mencionar"), mentionSuggestions.map((p) => /* @__PURE__ */ React.createElement(
        "button",
        {
          key: p.id,
          onMouseDown: (e) => {
            e.preventDefault();
            insertMention(p);
          },
          className: "w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        },
        /* @__PURE__ */ React.createElement("div", { className: "w-6 h-6 rounded-full bg-[#555552] flex items-center justify-center text-white font-black text-[9px] shrink-0" }, p.name.slice(0, 2).toUpperCase()),
        /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold text-slate-700 dark:text-slate-200 flex-1 text-left" }, p.name)
      ))), commentText.trim() && /* @__PURE__ */ React.createElement("div", { className: "flex justify-end mt-2" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: handleSubmitComment,
          disabled: submitting,
          className: "flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg disabled:opacity-60 transition-colors"
        },
        submitting ? /* @__PURE__ */ React.createElement(
          Icon,
          {
            name: "Loader2",
            size: 12,
            className: "animate-spin"
          }
        ) : /* @__PURE__ */ React.createElement(Icon, { name: "Send", size: 12 }),
        submitting ? "Enviando..." : "Comentar"
      )))), /* @__PURE__ */ React.createElement("div", { className: "space-y-5" }, activityFeed.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 px-4 py-5 text-center" }, /* @__PURE__ */ React.createElement(
        Icon,
        {
          name: "MessageSquare",
          size: 18,
          className: "mx-auto mb-2 text-slate-400"
        }
      ), /* @__PURE__ */ React.createElement("p", { className: "text-sm font-semibold text-slate-500 dark:text-slate-400" }, "Sin actividad a\xFAn")), activityFeed.map(
        (item) => item._kind === "time" ? /* @__PURE__ */ React.createElement("div", { key: item.id, className: "flex gap-3 items-center" }, /* @__PURE__ */ React.createElement("div", { className: "w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center shrink-0" }, /* @__PURE__ */ React.createElement(
          Icon,
          {
            name: "Clock",
            size: 12,
            className: "text-emerald-600 dark:text-emerald-400"
          }
        )), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-700 dark:text-slate-200" }, item.authorName), " ", "registr\xF3", " ", /* @__PURE__ */ React.createElement("span", { className: "font-bold text-emerald-600 dark:text-emerald-400" }, formatDuration(item.durationMs)), /* @__PURE__ */ React.createElement("span", { className: "text-slate-500 text-xs ml-2" }, relativeTime(item.loggedAt)))) : /* @__PURE__ */ React.createElement("div", { key: item.id, className: "flex gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-7 h-7 rounded-full bg-[#555552] flex items-center justify-center text-white font-black text-[9px] shrink-0 mt-0.5" }, (item.authorName || "U").slice(0, 2).toUpperCase()), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-baseline gap-2 mb-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm font-bold text-slate-700 dark:text-slate-200" }, item.authorName || "Usuario"), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-500" }, relativeTime(item.createdAt))), /* @__PURE__ */ React.createElement("div", { className: "bg-slate-50 dark:bg-slate-800 rounded-xl rounded-tl-none px-4 py-3 border border-slate-200 dark:border-slate-700" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-700 dark:text-slate-200 leading-relaxed break-words" }, item.text.split(/(@\S+)/g).map(
          (part, i) => part.startsWith("@") ? /* @__PURE__ */ React.createElement(
            "span",
            {
              key: i,
              className: "text-purple-600 dark:text-purple-400 font-bold"
            },
            part
          ) : part
        )))))
      ))))), /* @__PURE__ */ React.createElement("div", { className: "w-full lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 overflow-y-auto custom-scroll bg-slate-50/80 dark:bg-slate-950/70 max-h-72 lg:max-h-none" }, /* @__PURE__ */ React.createElement("div", { className: "p-5 space-y-5" }, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400" }, "Detalles"), /* @__PURE__ */ React.createElement("div", { "data-dropdown": true, className: "relative" }, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mb-2" }, "Asignados"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 flex-wrap min-h-[28px] py-0.5 -mx-1 px-1" }, currentAssigneeIds.length > 0 ? currentAssigneeIds.map((uid) => {
        const person = peoplePool.find((p) => p.id === uid);
        if (!person) return null;
        return /* @__PURE__ */ React.createElement(
          "div",
          {
            key: uid,
            className: "min-h-[34px] flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full pl-1 pr-2 py-1 group"
          },
          /* @__PURE__ */ React.createElement("div", { className: "w-5 h-5 rounded-full bg-[#555552] flex items-center justify-center text-white font-black text-[8px] shrink-0" }, person.name.slice(0, 2).toUpperCase()),
          /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-none" }, person.name.split(" ")[0]),
          canAct && /* @__PURE__ */ React.createElement(
            "button",
            {
              onClick: () => onChangeAssignees(
                task,
                type,
                currentAssigneeIds.filter((id) => id !== uid)
              ),
              className: "ml-0.5 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            },
            /* @__PURE__ */ React.createElement(Icon, { name: "X", size: 9 })
          )
        );
      }) : /* @__PURE__ */ React.createElement("span", { className: "text-sm text-slate-500 italic" }, "Sin asignar"), canAct && /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setAssigneeOpen((o) => !o),
          className: "w-8 h-8 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-500 hover:border-purple-400 hover:text-purple-500 transition-colors shrink-0"
        },
        /* @__PURE__ */ React.createElement(Icon, { name: "Plus", size: 12 })
      )), assigneeOpen && canAct && /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1 w-52 max-h-60 overflow-y-auto",
          "data-dropdown": true
        },
        /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 pt-2 pb-1 sticky top-0 bg-white dark:bg-slate-800" }, "Asignar a"),
        peoplePool.map((p) => {
          const isChecked = currentAssigneeIds.includes(p.id);
          return /* @__PURE__ */ React.createElement(
            "button",
            {
              key: p.id,
              onClick: () => {
                const newIds = isChecked ? currentAssigneeIds.filter((id) => id !== p.id) : [...currentAssigneeIds, p.id];
                onChangeAssignees(task, type, newIds);
                if (!isChecked && sendNotification) {
                  const email = p.email || p.authEmail;
                  if (email)
                    sendNotification({
                      to: email,
                      type: "assigned",
                      senderName: currentUserProfile?.name || "Alguien",
                      taskTitle: task.title,
                      taskType: type
                    });
                }
              },
              className: "w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            },
            /* @__PURE__ */ React.createElement(
              "div",
              {
                className: `w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isChecked ? "bg-purple-500 border-purple-500" : "border-slate-300 dark:border-slate-600"}`
              },
              isChecked && /* @__PURE__ */ React.createElement(
                Icon,
                {
                  name: "Check",
                  size: 9,
                  className: "text-white"
                }
              )
            ),
            /* @__PURE__ */ React.createElement("div", { className: "w-6 h-6 rounded-full bg-[#555552] flex items-center justify-center text-white font-black text-[9px] shrink-0" }, p.name.slice(0, 2).toUpperCase()),
            /* @__PURE__ */ React.createElement(
              "span",
              {
                className: `text-sm font-semibold flex-1 ${isChecked ? "text-purple-600 dark:text-purple-400" : "text-slate-700 dark:text-slate-200"}`
              },
              p.name
            )
          );
        }),
        currentAssigneeIds.length > 0 && /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => {
              onChangeAssignees(task, type, []);
              setAssigneeOpen(false);
            },
            className: "w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-t border-slate-100 dark:border-slate-700 mt-1"
          },
          /* @__PURE__ */ React.createElement(Icon, { name: "UserX", size: 13 }),
          " Quitar todos"
        )
      )), /* @__PURE__ */ React.createElement("div", { "data-dropdown": true, className: "relative" }, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mb-2" }, "Prioridad"), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => canAct && setPriorityOpen((o) => !o),
          className: `min-h-[38px] flex items-center gap-2 w-full rounded-xl py-1.5 ${canAct ? "hover:bg-white dark:hover:bg-slate-900 cursor-pointer" : "cursor-default"} transition-colors -mx-1 px-2`
        },
        /* @__PURE__ */ React.createElement(
          FlagIcon,
          {
            color: currentPriority?.iconColor || "#94a3b8",
            filled: !!currentPriority
          }
        ),
        /* @__PURE__ */ React.createElement(
          "span",
          {
            className: `text-sm font-semibold ${currentPriority?.color || "text-slate-500 italic"}`
          },
          currentPriority?.label || "Sin prioridad"
        )
      ), priorityOpen && canAct && /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1 w-44",
          "data-dropdown": true
        },
        /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 pt-2 pb-1" }, "Prioridad"),
        PRIORITIES.map((p) => /* @__PURE__ */ React.createElement(
          "button",
          {
            key: p.id,
            onClick: () => {
              onChangePriority(task, type, p.id);
              setPriorityOpen(false);
            },
            className: `w-full flex items-center gap-3 px-4 py-2 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left ${p.color}`
          },
          /* @__PURE__ */ React.createElement(FlagIcon, { color: p.iconColor, filled: true, size: 14 }),
          p.label,
          task.priority === p.id && /* @__PURE__ */ React.createElement(
            Icon,
            {
              name: "Check",
              size: 12,
              className: "ml-auto text-slate-500"
            }
          )
        )),
        task.priority && /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => {
              onChangePriority(task, type, null);
              setPriorityOpen(false);
            },
            className: "w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-t border-slate-100 dark:border-slate-700 mt-1"
          },
          /* @__PURE__ */ React.createElement(Icon, { name: "X", size: 12 }),
          " Quitar prioridad"
        )
      )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mb-2" }, "Fecha l\xEDmite"), /* @__PURE__ */ React.createElement("div", { className: "min-h-[38px] flex items-center gap-2 py-1 -mx-1 px-2 rounded-xl" }, /* @__PURE__ */ React.createElement(
        Icon,
        {
          name: "CalendarDays",
          size: 13,
          className: "text-slate-500 shrink-0"
        }
      ), /* @__PURE__ */ React.createElement(
        "span",
        {
          className: `text-sm font-semibold ${task.date ? "text-slate-700 dark:text-slate-200" : "text-slate-500 italic"}`
        },
        task.date || "Sin fecha"
      ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mb-2" }, "Cliente"), /* @__PURE__ */ React.createElement("div", { className: "min-h-[38px] flex items-center gap-2 py-1 -mx-1 px-2 rounded-xl" }, client ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "w-5 h-5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-[9px] shrink-0" }, client.name?.charAt(0).toUpperCase()), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold text-slate-700 dark:text-slate-200" }, client.name)) : /* @__PURE__ */ React.createElement("span", { className: "text-sm text-slate-500 italic" }, "Interno"))), type === "editingTask" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mb-2" }, "Jerarqu\xEDa"), /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded text-[10px] font-black uppercase border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800" }, getEditingHierarchyId(task).toUpperCase())), type === "managementTask" && task.category && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mb-2" }, "Categor\xEDa"), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold text-slate-700 dark:text-slate-200" }, task.category)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mb-2" }, "Tiempo registrado"), /* @__PURE__ */ React.createElement("div", { className: "min-h-[38px] flex items-center gap-2" }, timerRunning ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" }), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-black text-red-500 dark:text-red-400 tabular-nums" }, formatDuration(timerElapsed)), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: handleStopTimer,
          disabled: savingTime,
          className: "ml-auto flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-60"
        },
        savingTime ? /* @__PURE__ */ React.createElement(
          Icon,
          {
            name: "Loader2",
            size: 10,
            className: "animate-spin"
          }
        ) : /* @__PURE__ */ React.createElement(Icon, { name: "Square", size: 10 }),
        savingTime ? "..." : "Detener"
      )) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Icon, { name: "Timer", size: 13, className: "text-slate-500" }), /* @__PURE__ */ React.createElement(
        "span",
        {
          className: `text-sm ${totalLoggedMs > 0 ? "font-black text-emerald-600 dark:text-emerald-400" : "text-slate-500 italic"}`
        },
        totalLoggedMs > 0 ? formatDuration(totalLoggedMs) : "Sin tiempo"
      ), canAct && /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => {
            setTimerElapsed(0);
            setTimerRunning(true);
          },
          className: "ml-auto flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
        },
        /* @__PURE__ */ React.createElement(Icon, { name: "Play", size: 10 }),
        " Iniciar"
      ))), timeEntries.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "mt-2 space-y-1" }, [...timeEntries].reverse().slice(0, 3).map((e) => /* @__PURE__ */ React.createElement(
        "div",
        {
          key: e.id,
          className: "flex items-center text-xs gap-2 text-slate-500"
        },
        /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" }),
        /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-600 dark:text-slate-300" }, formatDuration(e.durationMs)),
        /* @__PURE__ */ React.createElement("span", { className: "truncate" }, e.authorName),
        /* @__PURE__ */ React.createElement("span", { className: "ml-auto shrink-0" }, relativeTime(e.loggedAt))
      )))), task.createdAt && /* @__PURE__ */ React.createElement("div", { className: "border-t border-slate-200 dark:border-slate-800 pt-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mb-2" }, "Creado"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400" }, new Date(task.createdAt).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }), /* @__PURE__ */ React.createElement("br", null), new Date(task.createdAt).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit"
      }))))))
    )
  );
};
var DayDetailsModal = ({
  config,
  onClose,
  activities,
  clients,
  managers,
  editors,
  users,
  canEditActivity,
  onEdit,
  onDelete
}) => {
  const dialogRef = useDialogA11y(config.isOpen, onClose);
  const dialogTitleId = useId();
  if (!config.isOpen) return null;
  const dayActivities = activities.filter((a) => a.date === config.date);
  const modalTitles = {
    client: "Cliente",
    manager: "Account Manager",
    editor: "Editor",
    event: "Produccion",
    accountTask: "Tarea de Account",
    editingTask: "Tarea de Edicion",
    managementTask: "Tarea de Gestion",
    user: "Usuario"
  };
  let displayDate = "";
  if (config.date) {
    const [y, m, d] = config.date.split("-");
    displayDate = new Date(y, m - 1, d).toLocaleDateString("es-HN", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
  }
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200",
      onClick: onClose
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: dialogRef,
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": dialogTitleId,
        tabIndex: -1,
        className: "bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 outline-none",
        onClick: (e) => e.stopPropagation()
      },
      /* @__PURE__ */ React.createElement("div", { className: "px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950 shrink-0" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(
        "h3",
        {
          id: dialogTitleId,
          className: "font-black text-lg text-slate-800 dark:text-white capitalize"
        },
        displayDate
      ), /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-500 dark:text-slate-400" }, "Detalle de Actividades")), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onClose,
          "aria-label": "Cerrar modal",
          className: "p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400"
        },
        /* @__PURE__ */ React.createElement(Icon, { name: "X", size: 20 })
      )),
      /* @__PURE__ */ React.createElement("div", { className: "p-6 overflow-y-auto custom-scroll space-y-3" }, dayActivities.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "Inbox", text: "No hay actividades este d\xEDa" }) : dayActivities.map((act) => {
        const client = clients?.find((c) => c.id === act.clientId);
        let personName = "Sin asignar";
        if (act.collectionType === "accountTask") {
          const manager = managers?.find((m) => m.id === act.contextId);
          if (manager) personName = manager.name;
        } else if (act.collectionType === "editingTask") {
          const editor = editors?.find((e) => e.id === act.contextId);
          if (editor) personName = editor.name;
        } else if (act.collectionType === "managementTask") {
          const managementUser = users?.find(
            (u) => u.id === act.contextId
          );
          if (managementUser) personName = managementUser.name;
        }
        return /* @__PURE__ */ React.createElement(
          "div",
          {
            key: `${act.collectionType}-${act.id}`,
            className: `p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-sm flex items-center gap-4`
          },
          /* @__PURE__ */ React.createElement(
            "div",
            {
              className: `p-3 rounded-xl bg-${act._color}-50 dark:bg-${act._color}-500/20 text-${act._color}-600 dark:text-${act._color}-400 shrink-0`
            },
            /* @__PURE__ */ React.createElement(Icon, { name: act._icon, size: 20 })
          ),
          /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-sm text-slate-800 dark:text-white truncate" }, act.title), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-1.5 mt-1.5" }, /* @__PURE__ */ React.createElement(
            "span",
            {
              className: `text-[9px] font-black uppercase tracking-wider text-${act._color}-600 dark:text-${act._color}-400`
            },
            act._label
          ), client && /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1 text-[9px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800" }, /* @__PURE__ */ React.createElement(Icon, { name: "Briefcase", size: 8 }), " ", client.name), (act.collectionType === "accountTask" || act.collectionType === "editingTask" || act.collectionType === "managementTask") && /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1 text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700" }, /* @__PURE__ */ React.createElement(Icon, { name: "UserCircle2", size: 8 }), " ", personName), act.status && /* @__PURE__ */ React.createElement(
            "span",
            {
              className: `text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border ${act.status === "publicado" || act.status === "aprobado" ? "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"}`
            },
            act.status.replace(/_/g, " ")
          ))),
          canEditActivity(act.collectionType) && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 opacity-100 md:opacity-60 md:hover:opacity-100 transition-opacity" }, /* @__PURE__ */ React.createElement(
            "button",
            {
              onClick: () => {
                onClose();
                onEdit(act, act.collectionType);
              },
              className: "p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors",
              title: "Editar"
            },
            /* @__PURE__ */ React.createElement(Icon, { name: "Edit", size: 18 })
          ), /* @__PURE__ */ React.createElement(
            "button",
            {
              onClick: () => {
                onClose();
                onDelete(act, act.collectionType);
              },
              className: "p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors",
              title: "Eliminar"
            },
            /* @__PURE__ */ React.createElement(Icon, { name: "Trash2", size: 18 })
          ))
        );
      }))
    )
  );
};
var CreateTaskModal = ({
  config,
  onClose,
  clients,
  managers,
  editors,
  managementUsers,
  actions
}) => {
  const { type, data } = config;
  const isTaskDialogOpen = config.isOpen && ["accountTask", "editingTask", "managementTask"].includes(type);
  const dialogRef = useDialogA11y(isTaskDialogOpen, onClose);
  const dialogTitleId = useId();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [showDesc, setShowDesc] = useState(false);
  const [assigneeId, setAssigneeId] = useState("");
  const [clientId, setClientId] = useState("");
  const [date, setDate] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("editar");
  const [hierarchy, setHierarchy] = useState("p2");
  const [time, setTime] = useState("");
  const [category, setCategory] = useState("seguimiento");
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [confirmNoDate, setConfirmNoDate] = useState(false);
  useEffect(() => {
    if (config.isOpen) {
      if (config.isEdit && data) {
        setTitle(data.title || "");
        setNotes(data.notes || "");
        setShowDesc(!!data.notes);
        setAssigneeId(data.contextId || "");
        setClientId(data.clientId || "");
        setDate(data.date || "");
        setPriority(data.priority || "");
        setTime(data.time || "");
        setHierarchy(data.hierarchy || data.editingHierarchy || "p2");
        setCategory(data.category || "seguimiento");
        setStatus(
          type === "editingTask" ? normalizeEditingWorkflowStatus(data.status || "editar") : data.status || "editar"
        );
      } else {
        setTitle("");
        setNotes("");
        setShowDesc(false);
        setAssigneeId(data?.contextId || "");
        setClientId(data?.clientId || "");
        setDate(data?.date || "");
        setPriority("");
        setTime("");
        setHierarchy("p2");
        setCategory("seguimiento");
        setStatus("editar");
      }
      setAssigneeOpen(false);
      setClientOpen(false);
      setPriorityOpen(false);
      setDatePickerOpen(false);
    }
  }, [config.isOpen, config.type, config.isEdit]);
  useEffect(() => {
    if (!assigneeOpen && !clientOpen && !priorityOpen) return;
    const h = (e) => {
      if (!e.target.closest("[data-ctdrop]")) {
        setAssigneeOpen(false);
        setClientOpen(false);
        setPriorityOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [assigneeOpen, clientOpen, priorityOpen]);
  if (!isTaskDialogOpen) return null;
  const peoplePool = type === "accountTask" ? managers : type === "editingTask" ? editors : managementUsers;
  const assignee = peoplePool.find((p) => p.id === assigneeId);
  const client = clients.find((c) => c.id === clientId);
  const tagColor = type === "accountTask" ? "indigo" : type === "managementTask" ? "violet" : "amber";
  const typeLabel = type === "accountTask" ? "Account" : type === "managementTask" ? "Gesti\xF3n" : "Edici\xF3n";
  const iconName = type === "accountTask" ? "LayoutList" : type === "managementTask" ? "ShieldCheck" : "Video";
  const TASK_PRIORITIES = [
    {
      id: "urgente",
      label: "Urgente",
      iconColor: "#ef4444",
      color: "text-red-500"
    },
    {
      id: "alta",
      label: "Alta",
      iconColor: "#fb923c",
      color: "text-orange-400"
    },
    {
      id: "normal",
      label: "Normal",
      iconColor: "#60a5fa",
      color: "text-blue-400"
    },
    {
      id: "baja",
      label: "Baja",
      iconColor: "#94a3b8",
      color: "text-slate-500"
    }
  ];
  const curPriority = TASK_PRIORITIES.find((p) => p.id === priority);
  const FlagIcon = ({ color, filled, size = 12 }) => /* @__PURE__ */ React.createElement(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: filled ? color : "none",
      stroke: color || "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    },
    /* @__PURE__ */ React.createElement("path", { d: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" }),
    /* @__PURE__ */ React.createElement("line", { x1: "4", y1: "22", x2: "4", y2: "15" })
  );
  const Chip = ({ icon, label, active, color, onClick, children }) => /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick,
      className: `flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors
                ${active ? "border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"} ${color || ""}`
    },
    icon && /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 11 }),
    children || label
  );
  const doSubmit = () => {
    if (config.isEdit && data?.id) {
      if (type === "accountTask")
        actions.updateAccountTask(data.id, {
          date,
          title: title.trim(),
          time,
          contextId: assigneeId,
          clientId,
          notes,
          priority
        });
      if (type === "editingTask")
        actions.updateEditingTask(data.id, {
          date,
          title: title.trim(),
          priority: priority || "normal",
          hierarchy,
          status,
          notes,
          contextId: assigneeId,
          clientId
        });
      if (type === "managementTask")
        actions.updateManagementTask(data.id, {
          date,
          title: title.trim(),
          time,
          contextId: assigneeId,
          clientId,
          category,
          notes,
          priority,
          notificationsEnabled: data.notificationsEnabled || false
        });
    } else {
      if (type === "accountTask")
        actions.addAccountTask({
          date,
          title: title.trim(),
          time,
          contextId: assigneeId,
          clientId,
          notes,
          priority
        });
      if (type === "editingTask")
        actions.addEditingTask({
          date,
          title: title.trim(),
          priority: priority || "normal",
          hierarchy,
          status,
          notes,
          contextId: assigneeId,
          clientId
        });
      if (type === "managementTask")
        actions.addManagementTask({
          date,
          title: title.trim(),
          time,
          contextId: assigneeId,
          clientId,
          category,
          notes,
          priority,
          notificationsEnabled: false
        });
    }
    onClose();
  };
  const handleSubmit = () => {
    if (!title.trim()) return;
    if (!date && !config.isEdit) {
      setConfirmNoDate(true);
      return;
    }
    doSubmit();
  };
  let displayDate = "";
  if (date) {
    try {
      const [y, m, d] = date.split("-");
      displayDate = new Date(y, m - 1, d).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short"
      });
    } catch (e) {
    }
  } else if (data?.date) {
    try {
      const [y, m, d] = data.date.split("-");
      displayDate = new Date(y, m - 1, d).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short"
      });
    } catch (e) {
    }
  }
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-[90] flex items-start justify-center pt-12 pb-8 px-4",
      onClick: onClose
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: dialogRef,
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": dialogTitleId,
        tabIndex: -1,
        className: "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-visible outline-none",
        onClick: (e) => e.stopPropagation()
      },
      /* @__PURE__ */ React.createElement("h2", { id: dialogTitleId, className: "sr-only" }, config.isEdit ? `Editar ${typeLabel}` : `Nueva ${typeLabel}`),
      /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 px-6 pt-5 pb-2" }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: `flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wide bg-${tagColor}-100 dark:bg-${tagColor}-500/20 text-${tagColor}-700 dark:text-${tagColor}-400`
        },
        /* @__PURE__ */ React.createElement(Icon, { name: iconName, size: 11 }),
        " ",
        config.isEdit ? `Editar ${typeLabel}` : `Nueva ${typeLabel}`
      ), displayDate && /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-500 flex items-center gap-1" }, /* @__PURE__ */ React.createElement(Icon, { name: "CalendarDays", size: 11 }), displayDate), /* @__PURE__ */ React.createElement("div", { className: "flex-1" }), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onClose,
          "aria-label": "Cerrar modal",
          className: "p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        },
        /* @__PURE__ */ React.createElement(Icon, { name: "X", size: 15 })
      )),
      /* @__PURE__ */ React.createElement("div", { className: "px-6 py-3" }, /* @__PURE__ */ React.createElement(
        "input",
        {
          autoFocus: true,
          value: title,
          onChange: (e) => setTitle(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter" && title.trim()) handleSubmit();
          },
          placeholder: "Escribe el nombre de la tarea...",
          className: "w-full text-xl font-bold text-slate-900 dark:text-white bg-transparent outline-none placeholder-slate-300 dark:placeholder-slate-600"
        }
      )),
      /* @__PURE__ */ React.createElement("div", { className: "px-6 pb-4" }, showDesc ? /* @__PURE__ */ React.createElement(
        "textarea",
        {
          autoFocus: true,
          value: notes,
          onChange: (e) => setNotes(e.target.value),
          placeholder: "Agregar descripci\xF3n...",
          rows: 4,
          className: "w-full text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 outline-none resize-none placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
        }
      ) : /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setShowDesc(true),
          className: "flex items-center gap-2 text-sm text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-1"
        },
        /* @__PURE__ */ React.createElement(Icon, { name: "AlignLeft", size: 14 }),
        " Agregar descripci\xF3n"
      )),
      /* @__PURE__ */ React.createElement("div", { className: "border-t border-slate-100 dark:border-slate-800" }),
      /* @__PURE__ */ React.createElement("div", { className: "px-6 py-4 flex flex-wrap gap-2.5" }, /* @__PURE__ */ React.createElement("div", { className: "relative", "data-ctdrop": true }, /* @__PURE__ */ React.createElement(
        Chip,
        {
          icon: assignee ? null : "UserCircle2",
          active: !!assignee,
          onClick: () => setAssigneeOpen((o) => !o)
        },
        assignee ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "w-4 h-4 rounded-full bg-[#555552] flex items-center justify-center text-white font-black text-[8px]" }, assignee.name.slice(0, 2).toUpperCase()), assignee.name) : "Persona asignada"
      ), assigneeOpen && /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1 w-52 max-h-60 overflow-y-auto",
          "data-ctdrop": true
        },
        /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 pt-2 pb-1 sticky top-0 bg-white dark:bg-slate-800" }, "Asignar a"),
        peoplePool.map((p) => /* @__PURE__ */ React.createElement(
          "button",
          {
            key: p.id,
            onClick: () => {
              setAssigneeId(assigneeId === p.id ? "" : p.id);
              setAssigneeOpen(false);
            },
            className: "w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          },
          /* @__PURE__ */ React.createElement("div", { className: "w-6 h-6 rounded-full bg-[#555552] flex items-center justify-center text-white font-black text-[9px] shrink-0" }, p.name.slice(0, 2).toUpperCase()),
          /* @__PURE__ */ React.createElement(
            "span",
            {
              className: `text-sm font-semibold flex-1 ${assigneeId === p.id ? "text-purple-600 dark:text-purple-400" : "text-slate-700 dark:text-slate-200"}`
            },
            p.name
          ),
          assigneeId === p.id && /* @__PURE__ */ React.createElement(
            Icon,
            {
              name: "Check",
              size: 12,
              className: "text-purple-500"
            }
          )
        ))
      )), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(
        Chip,
        {
          icon: "CalendarDays",
          active: !!date,
          onClick: () => setDatePickerOpen((o) => !o)
        },
        date || "Fecha l\xEDmite"
      ), datePickerOpen && /* @__PURE__ */ React.createElement("div", { className: "absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 p-3" }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "date",
          value: date,
          onChange: (e) => {
            setDate(e.target.value);
            setDatePickerOpen(false);
          },
          className: "text-sm bg-transparent outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
        }
      ))), /* @__PURE__ */ React.createElement("div", { className: "relative", "data-ctdrop": true }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setPriorityOpen((o) => !o),
          className: `flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors
                            ${curPriority ? "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`
        },
        /* @__PURE__ */ React.createElement(
          FlagIcon,
          {
            color: curPriority?.iconColor || "#94a3b8",
            filled: !!curPriority
          }
        ),
        /* @__PURE__ */ React.createElement(
          "span",
          {
            className: curPriority?.color || "text-slate-600 dark:text-slate-300"
          },
          curPriority?.label || "Prioridad"
        )
      ), priorityOpen && /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1 w-44",
          "data-ctdrop": true
        },
        TASK_PRIORITIES.map((p) => /* @__PURE__ */ React.createElement(
          "button",
          {
            key: p.id,
            onClick: () => {
              setPriority(priority === p.id ? "" : p.id);
              setPriorityOpen(false);
            },
            className: `w-full flex items-center gap-2.5 px-4 py-2 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left ${p.color}`
          },
          /* @__PURE__ */ React.createElement(FlagIcon, { color: p.iconColor, filled: true, size: 13 }),
          p.label,
          priority === p.id && /* @__PURE__ */ React.createElement(
            Icon,
            {
              name: "Check",
              size: 12,
              className: "ml-auto text-slate-500"
            }
          )
        ))
      )), /* @__PURE__ */ React.createElement("div", { className: "relative", "data-ctdrop": true }, /* @__PURE__ */ React.createElement(
        Chip,
        {
          icon: "Briefcase",
          active: !!client,
          onClick: () => {
            setClientOpen((o) => !o);
            setClientSearch("");
          }
        },
        client ? client.name : "Cliente"
      ), clientOpen && /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 w-64 overflow-hidden",
          "data-ctdrop": true
        },
        /* @__PURE__ */ React.createElement("div", { className: "px-3 pt-2.5 pb-1.5 border-b border-slate-100 dark:border-slate-700" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-2.5 py-1.5" }, /* @__PURE__ */ React.createElement(
          Icon,
          {
            name: "Search",
            size: 12,
            className: "text-slate-500 shrink-0"
          }
        ), /* @__PURE__ */ React.createElement(
          "input",
          {
            autoFocus: true,
            value: clientSearch,
            onChange: (e) => setClientSearch(e.target.value),
            placeholder: "Buscar cliente...",
            className: "flex-1 text-sm bg-transparent outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 min-w-0"
          }
        ), clientSearch && /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => setClientSearch(""),
            className: "text-slate-500 hover:text-slate-600"
          },
          /* @__PURE__ */ React.createElement(Icon, { name: "X", size: 11 })
        ))),
        /* @__PURE__ */ React.createElement("div", { className: "overflow-y-auto", style: { maxHeight: "280px" } }, !clientSearch && /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => {
              setClientId("");
              setClientOpen(false);
              setClientSearch("");
            },
            className: "w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left border-b border-slate-100 dark:border-slate-700"
          },
          /* @__PURE__ */ React.createElement(Icon, { name: "X", size: 13 }),
          " Sin cliente (interno)"
        ), clients.filter(
          (c) => !clientSearch || c.name.toLowerCase().includes(clientSearch.toLowerCase())
        ).slice(0, 8).map((c) => /* @__PURE__ */ React.createElement(
          "button",
          {
            key: c.id,
            onClick: () => {
              setClientId(c.id);
              setClientOpen(false);
              setClientSearch("");
            },
            className: `w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${clientId === c.id ? "bg-purple-50 dark:bg-purple-500/10" : ""}`
          },
          /* @__PURE__ */ React.createElement("div", { className: "w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-[10px] shrink-0" }, c.name.charAt(0).toUpperCase()),
          /* @__PURE__ */ React.createElement(
            "span",
            {
              className: `text-sm font-semibold flex-1 text-left truncate ${clientId === c.id ? "text-purple-600 dark:text-purple-400" : "text-slate-700 dark:text-slate-200"}`
            },
            c.name
          ),
          clientId === c.id && /* @__PURE__ */ React.createElement(
            Icon,
            {
              name: "Check",
              size: 12,
              className: "text-purple-500 shrink-0"
            }
          )
        )), clientSearch && clients.filter(
          (c) => c.name.toLowerCase().includes(clientSearch.toLowerCase())
        ).length === 0 && /* @__PURE__ */ React.createElement("p", { className: "px-4 py-3 text-sm text-slate-500 text-center" }, "Sin resultados"))
      )), type === "editingTask" && /* @__PURE__ */ React.createElement(
        "select",
        {
          value: hierarchy,
          onChange: (e) => setHierarchy(e.target.value),
          className: "px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 outline-none cursor-pointer"
        },
        (EDITING_HIERARCHY_OPTIONS || [
          { id: "p1", label: "P1" },
          { id: "p2", label: "P2" },
          { id: "p3", label: "P3" },
          { id: "reel", label: "Reel" },
          { id: "story", label: "Story" }
        ]).map((o) => /* @__PURE__ */ React.createElement("option", { key: o.id, value: o.id }, o.label || o.id))
      ), type === "managementTask" && /* @__PURE__ */ React.createElement(
        "select",
        {
          value: category,
          onChange: (e) => setCategory(e.target.value),
          className: "px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 outline-none cursor-pointer"
        },
        ["seguimiento", "reunion", "revision", "entrega", "otro"].map(
          (c) => /* @__PURE__ */ React.createElement("option", { key: c, value: c }, c.charAt(0).toUpperCase() + c.slice(1))
        )
      ), (type === "accountTask" || type === "managementTask") && /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "time",
          value: time,
          onChange: (e) => setTime(e.target.value),
          title: "Hora",
          className: "px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 outline-none cursor-pointer w-[110px]"
        }
      ))),
      /* @__PURE__ */ React.createElement("div", { className: "border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onClose,
          className: "text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors px-4 py-2"
        },
        "Cancelar"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: handleSubmit,
          disabled: !title.trim(),
          className: `flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-${tagColor}-600 hover:bg-${tagColor}-700 shadow-sm`
        },
        /* @__PURE__ */ React.createElement(Icon, { name: config.isEdit ? "Save" : "Plus", size: 14 }),
        config.isEdit ? "Guardar cambios" : `Crear ${typeLabel}`
      ))
    ),
    confirmNoDate && /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "fixed inset-0 z-[100] flex items-center justify-center p-4",
        onClick: () => setConfirmNoDate(false)
      },
      /* @__PURE__ */ React.createElement(
        "div",
        {
          role: "alertdialog",
          "aria-modal": "true",
          "aria-labelledby": "confirm-no-date-title",
          className: "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-6 flex flex-col gap-4",
          onClick: (e) => e.stopPropagation()
        },
        /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0" }, /* @__PURE__ */ React.createElement(Icon, { name: "CalendarOff", size: 18, className: "text-amber-500" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(
          "p",
          {
            id: "confirm-no-date-title",
            className: "font-black text-slate-800 dark:text-white text-base"
          },
          "\xBFSin fecha l\xEDmite?"
        ), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1" }, "Esta tarea no tendr\xE1 una fecha de vencimiento asignada. Podr\xE1s agregarla despu\xE9s."))),
        /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 justify-end" }, /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => setConfirmNoDate(false),
            className: "px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          },
          "Cancelar"
        ), /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => {
              setConfirmNoDate(false);
              doSubmit();
            },
            className: "px-5 py-2 text-sm font-black text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors"
          },
          "S\xED, crear sin fecha"
        ))
      )
    )
  );
};
var Modal = ({
  config,
  onClose,
  clients,
  managers,
  editors,
  managementUsers,
  actions
}) => {
  const { type, data, isEdit } = config;
  const dialogRef = useDialogA11y(config.isOpen, onClose);
  const dialogTitleId = useId();
  if (!config.isOpen) return null;
  const eventTitleMatch = type === "event" && data?.title ? data.title.match(/^(\d{2}:\d{2})\s*-\s*(.*)$/) : null;
  const eventDefaultTime = eventTitleMatch ? eventTitleMatch[1] : "";
  const eventDefaultTitle = type === "event" ? eventTitleMatch ? eventTitleMatch[2] : data?.title || "" : "";
  const normalizeEventTitle = (title = "") => title.replace(/^\d{2}:\d{2}\s*-\s*/, "").trim();
  const buildEventTitle = (title = "", time = "") => {
    const cleanTitle = normalizeEventTitle(title);
    if (time && cleanTitle) return `${time} - ${cleanTitle}`;
    return cleanTitle;
  };
  const onSubmit = (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    if (isEdit) {
      if (type === "client")
        actions.updateClient(data.id, {
          name: fd.name || "",
          niche: fd.niche || "",
          package: fd.package || "",
          instagram: fd.instagram || "",
          managerId: fd.managerId || "",
          photo: fd.photo || ""
        });
      if (type === "manager")
        actions.updateManager(data.id, {
          name: fd.name || "",
          email: fd.email || "",
          profession: fd.profession || "",
          photo: fd.photo || ""
        });
      if (type === "editor")
        actions.updateEditor(data.id, {
          name: fd.name || "",
          email: fd.email || "",
          profession: fd.profession || "",
          photo: fd.photo || ""
        });
      if (type === "event")
        actions.updateEvent(data.id, {
          title: buildEventTitle(fd.title, fd.time)
        });
      if (type === "accountTask")
        actions.updateAccountTask(data.id, {
          title: fd.title || "",
          time: fd.time || data.time || "",
          contextId: fd.manager || data.contextId || "",
          clientId: fd.clientId || "",
          notes: fd.notes || ""
        });
      if (type === "editingTask")
        actions.updateEditingTask(data.id, {
          title: fd.title || "",
          priority: fd.priority || "normal",
          hierarchy: fd.hierarchy || "p2",
          status: fd.status || data.status || "editar",
          notes: fd.notes || "",
          contextId: fd.editor || data.contextId || "",
          clientId: fd.clientId || ""
        });
      if (type === "managementTask")
        actions.updateManagementTask(data.id, {
          date: fd.date || data.date || "",
          title: fd.title || "",
          time: fd.time || data.time || "",
          contextId: fd.member || data.contextId || "",
          clientId: fd.clientId || "",
          category: fd.category || "seguimiento",
          notes: fd.notes || "",
          notificationsEnabled: fd.notificationsEnabled === "on"
        });
      if (type === "user")
        actions.updateUserRecord(data.id, {
          name: fd.name || "",
          email: fd.email || "",
          role: fd.role || "viewer",
          isActive: fd.isActive === "true",
          profession: fd.profession || "",
          photo: fd.photo || ""
        });
    } else {
      if (type === "client")
        actions.addClient({
          name: fd.name || "",
          niche: fd.niche || "",
          package: fd.package || "",
          instagram: fd.instagram || "",
          managerId: fd.managerId || "",
          photo: fd.photo || ""
        });
      if (type === "manager")
        actions.addManager({
          name: fd.name || "",
          email: fd.email || "",
          profession: fd.profession || "",
          photo: fd.photo || "",
          assignedAccounts: []
        });
      if (type === "editor")
        actions.addEditor({
          name: fd.name || "",
          email: fd.email || "",
          profession: fd.profession || "",
          photo: fd.photo || ""
        });
      if (type === "event")
        actions.addEvent({
          date: data.date,
          title: buildEventTitle(fd.title, fd.time),
          type: data.type
        });
      if (type === "accountTask")
        actions.addAccountTask({
          date: data.date,
          title: fd.title || "",
          time: fd.time || "",
          contextId: fd.manager || data.contextId || "",
          clientId: fd.clientId || "",
          notes: fd.notes || ""
        });
      if (type === "editingTask")
        actions.addEditingTask({
          date: data.date,
          title: fd.title || "",
          priority: fd.priority || "normal",
          hierarchy: fd.hierarchy || "p2",
          status: fd.status || "editar",
          notes: fd.notes || "",
          contextId: fd.editor || data.contextId || "",
          clientId: fd.clientId || ""
        });
      if (type === "managementTask")
        actions.addManagementTask({
          date: fd.date || data.date || "",
          title: fd.title || "",
          time: fd.time || "",
          contextId: fd.member || data.contextId || "",
          clientId: fd.clientId || "",
          category: fd.category || "seguimiento",
          notes: fd.notes || "",
          notificationsEnabled: fd.notificationsEnabled === "on"
        });
      if (type === "user")
        actions.addUserRecord({
          name: fd.name || "",
          email: fd.email || "",
          role: fd.role || "viewer",
          isActive: fd.isActive === "true",
          profession: fd.profession || "",
          photo: fd.photo || ""
        });
    }
  };
  const titles = {
    client: "Cliente",
    manager: "Account Manager",
    editor: "Editor",
    event: "Produccion",
    accountTask: "Tarea de Account",
    editingTask: "Tarea de Edicion",
    managementTask: "Tarea de Gestion",
    user: "Usuario"
  };
  const selectClassName = "w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none";
  const textareaClassName = "w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-500 dark:placeholder:text-slate-500 h-24 text-sm";
  const submitColor = ["editingTask", "editor"].includes(type) ? "rose" : type === "accountTask" ? "indigo" : type === "managementTask" ? "violet" : type === "manager" || type === "client" ? "blue" : "purple";
  let displayDate = "";
  if (data?.date && typeof data.date === "string") {
    const [y, m, d] = data.date.split("-");
    displayDate = new Date(y, m - 1, d).toLocaleDateString("es-HN", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
  }
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[90] flex items-center justify-center p-4 animate-in fade-in duration-200",
      onClick: onClose
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: dialogRef,
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": dialogTitleId,
        tabIndex: -1,
        className: "bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 outline-none",
        onClick: (event) => event.stopPropagation()
      },
      /* @__PURE__ */ React.createElement("div", { className: "px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950 shrink-0" }, /* @__PURE__ */ React.createElement(
        "h3",
        {
          id: dialogTitleId,
          className: "font-bold text-lg text-slate-800 dark:text-white"
        },
        isEdit ? "Editar " : "Nuevo ",
        titles[type]
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onClose,
          "aria-label": "Cerrar modal",
          className: "p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400"
        },
        /* @__PURE__ */ React.createElement(Icon, { name: "X", size: 20 })
      )),
      /* @__PURE__ */ React.createElement("div", { className: "p-6 overflow-y-auto custom-scroll" }, /* @__PURE__ */ React.createElement("form", { onSubmit, className: "space-y-4" }, ["event", "accountTask", "editingTask", "managementTask"].includes(
        type
      ) && !isEdit && /* @__PURE__ */ React.createElement("div", { className: "text-center p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 mb-2" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase" }, "Para el d\xEDa"), /* @__PURE__ */ React.createElement("p", { className: "text-lg font-black text-slate-800 dark:text-white capitalize" }, displayDate)), type === "client" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
        PhotoUploader,
        {
          defaultValue: data?.photo,
          label: "Logo / Foto del cliente"
        }
      ), /* @__PURE__ */ React.createElement(
        Input,
        {
          name: "name",
          placeholder: "Nombre",
          defaultValue: data?.name,
          required: true
        }
      ), /* @__PURE__ */ React.createElement(
        Input,
        {
          name: "niche",
          placeholder: "Rubro",
          defaultValue: data?.niche,
          required: true
        }
      ), /* @__PURE__ */ React.createElement(
        Input,
        {
          name: "package",
          placeholder: "Paquete",
          defaultValue: data?.package,
          required: true
        }
      ), /* @__PURE__ */ React.createElement(
        Input,
        {
          name: "instagram",
          placeholder: "Link Instagram",
          defaultValue: data?.instagram
        }
      ), /* @__PURE__ */ React.createElement(
        "select",
        {
          name: "managerId",
          defaultValue: data?.managerId,
          className: "w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
        },
        /* @__PURE__ */ React.createElement("option", { value: "" }, "Asignar Manager (Opcional)"),
        managers.map((m) => /* @__PURE__ */ React.createElement("option", { key: m.id, value: m.id }, m.name))
      )), type === "manager" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(PhotoUploader, { defaultValue: data?.photo }), /* @__PURE__ */ React.createElement(
        Input,
        {
          name: "name",
          placeholder: "Nombre Completo",
          defaultValue: data?.name,
          required: true
        }
      ), /* @__PURE__ */ React.createElement(
        Input,
        {
          name: "profession",
          placeholder: "Profesi\xF3n / Cargo (ej. Account Manager)",
          defaultValue: data?.profession
        }
      ), /* @__PURE__ */ React.createElement(
        Input,
        {
          name: "email",
          type: "email",
          placeholder: "Correo",
          defaultValue: data?.email,
          required: true
        }
      )), type === "editor" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(PhotoUploader, { defaultValue: data?.photo }), /* @__PURE__ */ React.createElement(
        Input,
        {
          name: "name",
          placeholder: "Nombre del Editor",
          defaultValue: data?.name,
          required: true
        }
      ), /* @__PURE__ */ React.createElement(
        Input,
        {
          name: "profession",
          placeholder: "Profesi\xF3n / Cargo (ej. Editor de video)",
          defaultValue: data?.profession
        }
      ), /* @__PURE__ */ React.createElement(
        Input,
        {
          name: "email",
          type: "email",
          placeholder: "Correo",
          defaultValue: data?.email,
          required: true
        }
      )), type === "event" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
        Input,
        {
          name: "title",
          placeholder: "Nombre Producci\xF3n",
          defaultValue: eventDefaultTitle,
          required: true,
          autoFocus: true
        }
      ), /* @__PURE__ */ React.createElement(
        Input,
        {
          name: "time",
          type: "time",
          label: "Hora (Opcional)",
          defaultValue: eventDefaultTime
        }
      )), type === "accountTask" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
        Input,
        {
          name: "title",
          placeholder: "\xBFQu\xE9 hay que hacer/publicar?",
          defaultValue: data?.title,
          required: true,
          autoFocus: true
        }
      ), /* @__PURE__ */ React.createElement(
        "select",
        {
          name: "clientId",
          defaultValue: data?.clientId || "",
          className: "w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
        },
        /* @__PURE__ */ React.createElement("option", { value: "" }, "Sin cliente (Tarea interna)"),
        clients.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, c.name))
      ), /* @__PURE__ */ React.createElement(
        Input,
        {
          name: "time",
          type: "time",
          label: "Hora (Opcional)",
          defaultValue: data?.time || ""
        }
      ), /* @__PURE__ */ React.createElement(
        "select",
        {
          name: "manager",
          required: true,
          defaultValue: data?.contextId || "",
          className: "w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
        },
        /* @__PURE__ */ React.createElement("option", { value: "" }, "Selecciona Manager..."),
        managers.map((m) => /* @__PURE__ */ React.createElement("option", { key: m.id, value: m.id }, m.name))
      ), /* @__PURE__ */ React.createElement(
        "textarea",
        {
          name: "notes",
          placeholder: "Notas, copies, ideas...",
          defaultValue: data?.notes,
          className: "w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-500 dark:placeholder:text-slate-500 h-24 text-sm"
        }
      )), type === "editingTask" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
        Input,
        {
          name: "title",
          placeholder: "T\xEDtulo del Video/Dise\xF1o",
          defaultValue: data?.title,
          required: true,
          autoFocus: true
        }
      ), /* @__PURE__ */ React.createElement(
        "select",
        {
          name: "clientId",
          defaultValue: data?.clientId || "",
          className: "w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
        },
        /* @__PURE__ */ React.createElement("option", { value: "" }, "Sin cliente (Tarea interna)"),
        clients.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, c.name))
      ), /* @__PURE__ */ React.createElement(
        "select",
        {
          name: "priority",
          required: true,
          defaultValue: data?.priority || "normal",
          className: "w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-700 dark:text-slate-200"
        },
        /* @__PURE__ */ React.createElement(
          "option",
          {
            value: "normal",
            className: "text-amber-600 dark:text-amber-400"
          },
          "Prioridad normal"
        ),
        /* @__PURE__ */ React.createElement(
          "option",
          {
            value: "urgente",
            className: "text-red-600 dark:text-red-400"
          },
          "Urgente"
        ),
        /* @__PURE__ */ React.createElement(
          "option",
          {
            value: "recurrente",
            className: "text-emerald-600 dark:text-emerald-400"
          },
          "Recurrente"
        )
      ), /* @__PURE__ */ React.createElement(
        "select",
        {
          name: "hierarchy",
          required: true,
          defaultValue: data?.hierarchy || getEditingHierarchyId(data || {}),
          className: "w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-700 dark:text-slate-200"
        },
        EDITING_HIERARCHY_OPTIONS.map((option) => /* @__PURE__ */ React.createElement("option", { key: option.id, value: option.id }, option.label))
      ), /* @__PURE__ */ React.createElement(
        "select",
        {
          name: "status",
          required: true,
          defaultValue: normalizeEditingWorkflowStatus(
            data?.status || "editar"
          ),
          className: "w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-700 dark:text-slate-200"
        },
        EDITING_STATUS_OPTIONS.map((option) => /* @__PURE__ */ React.createElement("option", { key: option.id, value: option.id }, option.label))
      ), /* @__PURE__ */ React.createElement(
        "select",
        {
          name: "editor",
          required: true,
          defaultValue: data?.contextId || "",
          className: "w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
        },
        /* @__PURE__ */ React.createElement("option", { value: "" }, "Selecciona Editor..."),
        editors.map((e) => /* @__PURE__ */ React.createElement("option", { key: e.id, value: e.id }, e.name))
      ), /* @__PURE__ */ React.createElement(
        "textarea",
        {
          name: "notes",
          placeholder: "Notas, links a drive...",
          defaultValue: data?.notes,
          className: "w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-500 dark:placeholder:text-slate-500 h-24 text-sm"
        }
      )), type === "managementTask" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
        Input,
        {
          name: "title",
          placeholder: "Titulo de la gestion",
          defaultValue: data?.title,
          required: true,
          autoFocus: true
        }
      ), /* @__PURE__ */ React.createElement(
        Input,
        {
          name: "date",
          type: "date",
          label: "Fecha limite *",
          defaultValue: data?.date || getHondurasTodayStr(),
          required: true
        }
      ), /* @__PURE__ */ React.createElement(
        "select",
        {
          name: "clientId",
          defaultValue: data?.clientId || "",
          className: `${selectClassName} font-bold`
        },
        /* @__PURE__ */ React.createElement("option", { value: "" }, "Sin cliente asociado"),
        clients.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, c.name))
      ), /* @__PURE__ */ React.createElement(
        Input,
        {
          name: "time",
          type: "time",
          label: "Hora limite *",
          defaultValue: data?.time || "",
          required: true
        }
      ), /* @__PURE__ */ React.createElement(
        "select",
        {
          name: "member",
          required: true,
          defaultValue: data?.contextId || "",
          className: selectClassName
        },
        /* @__PURE__ */ React.createElement("option", { value: "" }, managementUsers.length > 0 ? "Selecciona integrante..." : "Cargando integrantes..."),
        managementUsers.map((member) => /* @__PURE__ */ React.createElement("option", { key: member.id, value: member.id }, member.name, member.email ? ` (${member.email})` : ""))
      ), /* @__PURE__ */ React.createElement(
        "select",
        {
          name: "category",
          defaultValue: data?.category || "seguimiento",
          className: `${selectClassName} font-bold`
        },
        /* @__PURE__ */ React.createElement("option", { value: "seguimiento" }, "Seguimiento"),
        /* @__PURE__ */ React.createElement("option", { value: "coordinacion" }, "Coordinacion"),
        /* @__PURE__ */ React.createElement("option", { value: "aprobacion" }, "Aprobacion"),
        /* @__PURE__ */ React.createElement("option", { value: "soporte" }, "Soporte")
      ), /* @__PURE__ */ React.createElement(
        "textarea",
        {
          name: "notes",
          placeholder: "Detalle de la gestion, acuerdos o proximos pasos...",
          defaultValue: data?.notes,
          className: textareaClassName
        }
      ), /* @__PURE__ */ React.createElement("label", { className: "flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 cursor-pointer" }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "checkbox",
          name: "notificationsEnabled",
          defaultChecked: data?.notificationsEnabled !== false,
          className: "w-4 h-4 accent-violet-600"
        }
      ), /* @__PURE__ */ React.createElement("div", { className: "flex-1" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-slate-700 dark:text-slate-200" }, "Recordar por correo"), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500 dark:text-slate-400" }, "Envia avisos al asignado 8 horas antes, al vencer y cada 24 horas si sigue abierta."))), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500 dark:text-slate-400 -mt-2" }, "El integrante asignado debe tener correo para que esta automatizacion funcione.")), type === "user" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(PhotoUploader, { defaultValue: data?.photo }), /* @__PURE__ */ React.createElement(
        Input,
        {
          name: "name",
          placeholder: "Nombre completo",
          defaultValue: data?.name,
          required: true,
          autoFocus: true
        }
      ), /* @__PURE__ */ React.createElement(
        Input,
        {
          name: "profession",
          placeholder: "Profesi\xF3n / Cargo",
          defaultValue: data?.profession
        }
      ), /* @__PURE__ */ React.createElement(
        Input,
        {
          name: "email",
          type: "email",
          placeholder: "Correo autorizado",
          defaultValue: data?.email,
          required: true
        }
      ), /* @__PURE__ */ React.createElement(
        "select",
        {
          name: "role",
          defaultValue: data?.role || "viewer",
          className: `${selectClassName} font-bold`
        },
        Object.entries(ROLE_DEFINITIONS).map(
          ([roleId, roleMeta]) => /* @__PURE__ */ React.createElement("option", { key: roleId, value: roleId }, roleMeta.label)
        )
      ), /* @__PURE__ */ React.createElement(
        "select",
        {
          name: "isActive",
          defaultValue: data?.isActive === false ? "false" : "true",
          className: `${selectClassName} font-bold`
        },
        /* @__PURE__ */ React.createElement("option", { value: "true" }, "Activo"),
        /* @__PURE__ */ React.createElement("option", { value: "false" }, "Inactivo")
      )), /* @__PURE__ */ React.createElement(Button, { type: "submit", full: true, color: submitColor }, isEdit ? "Guardar Cambios" : "Crear")))
    )
  );
};
var DeleteConfirmModal = ({ config, onClose, onConfirm }) => {
  const dialogRef = useDialogA11y(config.isOpen, onClose);
  const dialogTitleId = useId();
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4",
      onClick: onClose
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: dialogRef,
        role: "alertdialog",
        "aria-modal": "true",
        "aria-labelledby": dialogTitleId,
        tabIndex: -1,
        className: "bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 outline-none",
        onClick: (event) => event.stopPropagation()
      },
      /* @__PURE__ */ React.createElement("div", { className: "w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400" }, /* @__PURE__ */ React.createElement(Icon, { name: "AlertTriangle", size: 32 })),
      /* @__PURE__ */ React.createElement(
        "h3",
        {
          id: dialogTitleId,
          className: "text-lg font-black text-slate-800 dark:text-white mb-2"
        },
        "\xBFEliminar ",
        config.title,
        "?"
      ),
      /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400 mb-8" }, "Esta acci\xF3n es permanente y no se puede deshacer."),
      /* @__PURE__ */ React.createElement("div", { className: "flex gap-3" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onClose,
          className: "flex-1 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        },
        "Cancelar"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onConfirm,
          className: "flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 shadow-lg shadow-red-500/30 transition-colors"
        },
        "Confirmar"
      ))
    )
  );
};
var Toast = ({ message, type }) => /* @__PURE__ */ React.createElement(
  "div",
  {
    role: type === "error" ? "alert" : "status",
    className: `pointer-events-auto px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 fade-in ${type === "error" ? "bg-red-600 text-white" : "bg-slate-800 dark:bg-white text-white dark:text-slate-900"}`
  },
  /* @__PURE__ */ React.createElement(
    Icon,
    {
      name: type === "success" ? "CheckCircle2" : "AlertTriangle",
      size: 20,
      className: type === "success" ? "text-green-400" : ""
    }
  ),
  /* @__PURE__ */ React.createElement("span", { className: "font-bold text-sm" }, message)
);
var ReportStatCard = ({ label, value, color, icon, sub }) => /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-black uppercase tracking-widest text-slate-500" }, label), /* @__PURE__ */ React.createElement(
  "div",
  {
    className: `w-8 h-8 rounded-xl bg-${color}-50 dark:bg-${color}-500/20 flex items-center justify-center`
  },
  /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 16, className: `text-${color}-500` })
)), /* @__PURE__ */ React.createElement(
  "p",
  {
    className: `text-3xl font-black text-${color}-600 dark:text-${color}-400`
  },
  value
), sub && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500" }, sub));
var ReportsView = ({
  accountTasks,
  editingTasks,
  managementTasks,
  clients,
  managers,
  editors,
  users = []
}) => {
  const todayStr = getHondurasTodayStr();
  const now = /* @__PURE__ */ new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate, setToDate] = useState(todayStr);
  const [activeTab, setActiveTab] = useState("content");
  const hasAutoExpandedRangeRef = useRef(false);
  const inRange = (dateStr) => {
    if (!dateStr) return false;
    return compareDateOnlyStrings(dateStr, fromDate) >= 0 && compareDateOnlyStrings(dateStr, toDate) <= 0;
  };
  const filteredAccountTasks = accountTasks.filter((t) => inRange(t.date));
  const filteredEditingTasks = editingTasks.filter((t) => inRange(t.date));
  const filteredManagementTasks = managementTasks.filter(
    (t) => inRange(t.date)
  );
  useEffect(() => {
    if (hasAutoExpandedRangeRef.current) return;
    const allTaskDates = [...accountTasks, ...editingTasks, ...managementTasks].map((task) => normalizeDateOnlyString(task.date)).filter(Boolean).sort();
    if (allTaskDates.length === 0) return;
    const hasCurrentRangeData = allTaskDates.some(inRange);
    if (hasCurrentRangeData) {
      hasAutoExpandedRangeRef.current = true;
      return;
    }
    setFromDate(allTaskDates[0]);
    setToDate(todayStr);
    hasAutoExpandedRangeRef.current = true;
  }, [accountTasks, editingTasks, managementTasks]);
  const managerById = new Map(managers.map((item) => [item.id, item]));
  const editorById = new Map(editors.map((item) => [item.id, item]));
  const userById = new Map(users.map((item) => [item.id, item]));
  const userByManagerId = new Map(
    users.filter((item) => item.linkedManagerId).map((item) => [item.linkedManagerId, item])
  );
  const userByEditorId = new Map(
    users.filter((item) => item.linkedEditorId).map((item) => [item.linkedEditorId, item])
  );
  const performancePeopleByKey = /* @__PURE__ */ new Map();
  const roleLabelByKey = {
    super_admin: "Admin",
    operations: "Operaciones",
    management: "Gestion",
    manager: "Manager",
    editor: "Editor",
    viewer: "Viewer"
  };
  const addPerformancePerson = (key, data = {}) => {
    if (!key) return null;
    const current = performancePeopleByKey.get(key) || {
      id: key,
      name: "",
      email: "",
      roles: []
    };
    const roles = [...current.roles];
    if (data.roleLabel && !roles.includes(data.roleLabel))
      roles.push(data.roleLabel);
    const nextPerson = {
      id: key,
      name: current.name || data.name || data.email || "Usuario sin nombre",
      email: current.email || data.email || "",
      roles,
      managerId: current.managerId || data.managerId || "",
      editorId: current.editorId || data.editorId || ""
    };
    performancePeopleByKey.set(key, nextPerson);
    return nextPerson;
  };
  users.forEach(
    (item) => addPerformancePerson(item.id, {
      name: item.name,
      email: item.email,
      roleLabel: roleLabelByKey[item.role] || item.role || "Usuario",
      managerId: item.linkedManagerId || "",
      editorId: item.linkedEditorId || ""
    })
  );
  managers.forEach((item) => {
    const linkedUser = userByManagerId.get(item.id) || (item.userId ? userById.get(item.userId) : null);
    addPerformancePerson(linkedUser?.id || item.userId || item.id, {
      name: item.name || linkedUser?.name,
      email: item.email || linkedUser?.email,
      roleLabel: "Manager",
      managerId: item.id
    });
  });
  editors.forEach((item) => {
    const linkedUser = userByEditorId.get(item.id) || (item.userId ? userById.get(item.userId) : null);
    addPerformancePerson(linkedUser?.id || item.userId || item.id, {
      name: item.name || linkedUser?.name,
      email: item.email || linkedUser?.email,
      roleLabel: "Editor",
      editorId: item.id
    });
  });
  const resolveManagerPerformanceKey = (managerId = "", directUserId = "") => {
    const manager = managerById.get(managerId) || (directUserId ? managers.find((item) => item.userId === directUserId) : null);
    const linkedUser = manager ? userByManagerId.get(manager.id) || (manager.userId ? userById.get(manager.userId) : null) : null;
    const directUser = directUserId ? userById.get(directUserId) : null;
    const key = directUser?.id || directUserId || linkedUser?.id || manager?.userId || manager?.id || managerId;
    addPerformancePerson(key, {
      name: manager?.name || directUser?.name || linkedUser?.name,
      email: manager?.email || directUser?.email || linkedUser?.email,
      roleLabel: "Manager",
      managerId: manager?.id || managerId
    });
    return key;
  };
  const resolveEditorPerformanceKey = (editorId = "", directUserId = "") => {
    const editor = editorById.get(editorId) || (directUserId ? editors.find((item) => item.userId === directUserId) : null);
    const linkedUser = editor ? userByEditorId.get(editor.id) || (editor.userId ? userById.get(editor.userId) : null) : null;
    const directUser = directUserId ? userById.get(directUserId) : null;
    const key = directUser?.id || directUserId || linkedUser?.id || editor?.userId || editor?.id || editorId;
    addPerformancePerson(key, {
      name: editor?.name || directUser?.name || linkedUser?.name,
      email: editor?.email || directUser?.email || linkedUser?.email,
      roleLabel: "Editor",
      editorId: editor?.id || editorId
    });
    return key;
  };
  const resolveManagementPerformanceKey = (userId = "") => {
    const record = userById.get(userId);
    const key = record?.id || userId;
    addPerformancePerson(key, {
      name: record?.name,
      email: record?.email,
      roleLabel: roleLabelByKey[record?.role] || "Gestion",
      managerId: record?.linkedManagerId || "",
      editorId: record?.linkedEditorId || ""
    });
    return key;
  };
  const getTaskAssigneeKeys = (task, type) => {
    const storedAssignees = type === "editing" && isEditingDelivered(task) && Array.isArray(task.editorAssigneesAtCompletion) ? task.editorAssigneesAtCompletion : task.assignees;
    const explicitAssignees = Array.isArray(storedAssignees) ? storedAssignees.filter(Boolean) : [];
    const keys = /* @__PURE__ */ new Set();
    if (type === "account")
      explicitAssignees.forEach(
        (id) => keys.add(resolveManagerPerformanceKey(id, ""))
      );
    if (type === "editing")
      explicitAssignees.forEach(
        (id) => keys.add(resolveEditorPerformanceKey(id, ""))
      );
    if (type === "management")
      explicitAssignees.forEach(
        (id) => keys.add(resolveManagementPerformanceKey(id))
      );
    if (keys.size === 0 && type === "account")
      keys.add(
        resolveManagerPerformanceKey(task.contextId, task.assigneeUserId)
      );
    if (keys.size === 0 && type === "editing")
      keys.add(
        resolveEditorPerformanceKey(
          task.editorOwnerAtCompletionId || task.contextId,
          task.editorAssigneeUserAtCompletionId || task.assigneeUserId
        )
      );
    if (keys.size === 0 && type === "management")
      keys.add(
        resolveManagementPerformanceKey(task.assigneeUserId || task.contextId)
      );
    return [...keys].filter(Boolean);
  };
  const dailyPerformanceByKey = /* @__PURE__ */ new Map();
  const addDailyPerformanceTask = (task, type) => {
    const date = normalizeDateOnlyString(
      type === "editing" && isEditingDelivered(task) ? task.editorDueDateAtCompletion || task.date : task.date
    );
    if (!date) return;
    const areaKey = type === "account" ? "account" : type === "editing" ? "editing" : "management";
    const isDone = type === "account" ? task.status === "publicado" : type === "editing" ? isEditingDelivered(task) : task.status === "cerrado";
    getTaskAssigneeKeys(task, type).forEach((personKey) => {
      const person = performancePeopleByKey.get(personKey) || addPerformancePerson(personKey, {});
      const rowKey = `${date}:${person.id}`;
      const current = dailyPerformanceByKey.get(rowKey) || {
        date,
        userId: person.id,
        name: person.name,
        email: person.email,
        roles: person.roles,
        total: 0,
        done: 0,
        pending: 0,
        areas: { account: 0, editing: 0, management: 0 }
      };
      current.name = person.name || current.name;
      current.email = person.email || current.email;
      current.roles = person.roles;
      current.total += 1;
      current.done += isDone ? 1 : 0;
      current.pending += isDone ? 0 : 1;
      current.areas[areaKey] += 1;
      dailyPerformanceByKey.set(rowKey, current);
    });
  };
  filteredAccountTasks.forEach(
    (task) => addDailyPerformanceTask(task, "account")
  );
  filteredEditingTasks.forEach(
    (task) => addDailyPerformanceTask(task, "editing")
  );
  filteredManagementTasks.forEach(
    (task) => addDailyPerformanceTask(task, "management")
  );
  const dailyPerformanceStats = [...dailyPerformanceByKey.values()].sort(
    (left, right) => compareDateOnlyStrings(right.date, left.date) || right.total - left.total || left.name.localeCompare(right.name)
  );
  const dailyPerformanceTotals = dailyPerformanceStats.reduce(
    (acc, row) => ({
      total: acc.total + row.total,
      done: acc.done + row.done,
      pending: acc.pending + row.pending
    }),
    { total: 0, done: 0, pending: 0 }
  );
  const dailyUserCount = new Set(dailyPerformanceStats.map((row) => row.userId)).size;
  const dailyDateCount = new Set(dailyPerformanceStats.map((row) => row.date)).size;
  const accountPublished = filteredAccountTasks.filter(
    (t) => t.status === "publicado"
  ).length;
  const editingPublished = filteredEditingTasks.filter(
    (t) => t.status === "publicado"
  ).length;
  const totalContentPieces = filteredAccountTasks.length + filteredEditingTasks.length;
  const totalPublished = accountPublished + editingPublished;
  const managerStats = managers.map((m) => {
    const mTasks = filteredAccountTasks.filter((t) => t.contextId === m.id);
    return {
      ...m,
      total: mTasks.length,
      published: mTasks.filter((t) => t.status === "publicado").length,
      approved: mTasks.filter((t) => t.status === "aprobado_internamente").length,
      inProgress: mTasks.filter(
        (t) => !["publicado", "aprobado_internamente"].includes(t.status)
      ).length
    };
  }).filter((m) => m.total > 0).sort((a, b) => b.total - a.total);
  const editorStats = editors.map((e) => {
    const eTasks = filteredEditingTasks.filter((t) => t.contextId === e.id);
    return {
      ...e,
      total: eTasks.length,
      published: eTasks.filter((t) => t.status === "publicado").length,
      approved: eTasks.filter((t) => t.status === "aprobado").length,
      inProgress: eTasks.filter(
        (t) => !["publicado", "aprobado"].includes(t.status)
      ).length
    };
  }).filter((e) => e.total > 0).sort((a, b) => b.total - a.total);
  const tabs = [
    { id: "content", label: "Piezas de Contenido" },
    { id: "daily", label: "Diario por Usuario" },
    { id: "managers", label: "Por Manager" },
    { id: "editors", label: "Por Editor" },
    { id: "management", label: "Gesti\xF3n" }
  ];
  const rowStyle = (i) => i % 2 !== 0 ? "bg-slate-50/50 dark:bg-slate-950/30" : "";
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-6 fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between flex-wrap gap-4" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-black text-slate-800 dark:text-white" }, "Reportes"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 flex-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-black text-slate-500 uppercase" }, "Desde"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      value: fromDate,
      onChange: (e) => setFromDate(e.target.value),
      className: "text-sm font-bold text-slate-700 dark:text-slate-200 bg-transparent outline-none"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-black text-slate-500 uppercase" }, "Hasta"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      value: toDate,
      onChange: (e) => setToDate(e.target.value),
      className: "text-sm font-bold text-slate-700 dark:text-slate-200 bg-transparent outline-none"
    }
  )))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4" }, /* @__PURE__ */ React.createElement(
    ReportStatCard,
    {
      label: "Total Piezas",
      value: totalContentPieces,
      color: "purple",
      icon: "BarChart3",
      sub: "accounts + edici\xF3n"
    }
  ), /* @__PURE__ */ React.createElement(
    ReportStatCard,
    {
      label: "Publicadas",
      value: totalPublished,
      color: "emerald",
      icon: "CheckCircle2",
      sub: `${Math.round(totalContentPieces > 0 ? totalPublished / totalContentPieces * 100 : 0)}% del total`
    }
  ), /* @__PURE__ */ React.createElement(
    ReportStatCard,
    {
      label: "Sala Accounts",
      value: filteredAccountTasks.length,
      color: "indigo",
      icon: "LayoutList",
      sub: `${accountPublished} publicadas`
    }
  ), /* @__PURE__ */ React.createElement(
    ReportStatCard,
    {
      label: "Sala Edici\xF3n",
      value: filteredEditingTasks.length,
      color: "amber",
      icon: "Video",
      sub: `${editingPublished} publicadas`
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1 border-b border-slate-200 dark:border-slate-800" }, tabs.map((tab) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: tab.id,
      onClick: () => setActiveTab(tab.id),
      className: `px-4 py-2.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? "border-purple-500 text-purple-600 dark:text-purple-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`
    },
    tab.label
  ))), activeTab === "content" && /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6" }, /* @__PURE__ */ React.createElement("h3", { className: "font-black text-slate-800 dark:text-white mb-5 flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icon, { name: "LayoutList", size: 18, className: "text-indigo-500" }), " ", "Sala de Accounts"), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, [
    { label: "Por Dise\xF1ar", status: "por_disenar", color: "slate" },
    {
      label: "Aprobaci\xF3n Interna",
      status: "aprobacion_interna",
      color: "blue"
    },
    {
      label: "Aprobado Internamente",
      status: "aprobado_internamente",
      color: "emerald"
    },
    { label: "Publicado", status: "publicado", color: "indigo" }
  ].map((row) => {
    const count = filteredAccountTasks.filter(
      (t) => t.status === row.status
    ).length;
    const pct = filteredAccountTasks.length > 0 ? Math.round(count / filteredAccountTasks.length * 100) : 0;
    return /* @__PURE__ */ React.createElement("div", { key: row.status }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-1" }, /* @__PURE__ */ React.createElement(
      "span",
      {
        className: `w-2 h-2 rounded-full bg-${row.color}-500 shrink-0`
      }
    ), /* @__PURE__ */ React.createElement("span", { className: "text-sm text-slate-600 dark:text-slate-300 flex-1" }, row.label), /* @__PURE__ */ React.createElement("span", { className: "font-black text-slate-800 dark:text-white" }, count), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-500 w-8 text-right" }, pct, "%")), /* @__PURE__ */ React.createElement("div", { className: "h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `h-full bg-${row.color}-500 rounded-full transition-all duration-500`,
        style: { width: `${pct}%` }
      }
    )));
  }), /* @__PURE__ */ React.createElement("div", { className: "pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm font-bold text-slate-500" }, "Total"), /* @__PURE__ */ React.createElement("span", { className: "font-black text-slate-800 dark:text-white" }, filteredAccountTasks.length)))), /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6" }, /* @__PURE__ */ React.createElement("h3", { className: "font-black text-slate-800 dark:text-white mb-5 flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icon, { name: "Video", size: 18, className: "text-amber-500" }), " Sala de Edici\xF3n"), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, [
    { label: "Por Editar", status: "editar", color: "slate" },
    { label: "En Edici\xF3n", status: "en_edicion", color: "amber" },
    {
      label: "Revisi\xF3n Interna",
      status: "revision_interna",
      color: "blue"
    },
    { label: "Aprobado", status: "aprobado", color: "emerald" },
    { label: "Publicado", status: "publicado", color: "indigo" }
  ].map((row) => {
    const count = filteredEditingTasks.filter(
      (t) => t.status === row.status
    ).length;
    const pct = filteredEditingTasks.length > 0 ? Math.round(count / filteredEditingTasks.length * 100) : 0;
    return /* @__PURE__ */ React.createElement("div", { key: row.status }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-1" }, /* @__PURE__ */ React.createElement(
      "span",
      {
        className: `w-2 h-2 rounded-full bg-${row.color}-500 shrink-0`
      }
    ), /* @__PURE__ */ React.createElement("span", { className: "text-sm text-slate-600 dark:text-slate-300 flex-1" }, row.label), /* @__PURE__ */ React.createElement("span", { className: "font-black text-slate-800 dark:text-white" }, count), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-500 w-8 text-right" }, pct, "%")), /* @__PURE__ */ React.createElement("div", { className: "h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `h-full bg-${row.color}-500 rounded-full transition-all duration-500`,
        style: { width: `${pct}%` }
      }
    )));
  }), /* @__PURE__ */ React.createElement("div", { className: "pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm font-bold text-slate-500" }, "Total"), /* @__PURE__ */ React.createElement("span", { className: "font-black text-slate-800 dark:text-white" }, filteredEditingTasks.length))))), activeTab === "daily" && /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4" }, /* @__PURE__ */ React.createElement(
    ReportStatCard,
    {
      label: "Usuarios Activos",
      value: dailyUserCount,
      color: "violet",
      icon: "Users",
      sub: `${dailyDateCount} dias con actividad`
    }
  ), /* @__PURE__ */ React.createElement(
    ReportStatCard,
    {
      label: "Tareas del Rango",
      value: dailyPerformanceTotals.total,
      color: "indigo",
      icon: "LayoutList",
      sub: "accounts + edicion + gestion"
    }
  ), /* @__PURE__ */ React.createElement(
    ReportStatCard,
    {
      label: "Finalizadas",
      value: dailyPerformanceTotals.done,
      color: "emerald",
      icon: "CheckCircle2",
      sub: `${Math.round(dailyPerformanceTotals.total > 0 ? dailyPerformanceTotals.done / dailyPerformanceTotals.total * 100 : 0)}% completado`
    }
  ), /* @__PURE__ */ React.createElement(
    ReportStatCard,
    {
      label: "Pendientes",
      value: dailyPerformanceTotals.pending,
      color: "amber",
      icon: "Clock",
      sub: "abiertas en el rango"
    }
  )), /* @__PURE__ */ React.createElement("p", { className: "rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300" }, "En Edicion, la tarea cuenta como finalizada para el editor al pasar a Revision Interna. La espera de aprobacion del cliente no reduce su desempeno."), /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" }, dailyPerformanceStats.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "p-16 text-center text-slate-500 font-bold" }, "Sin desempeno diario en este rango de fechas") : /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full min-w-[800px]" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { className: "border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950" }, /* @__PURE__ */ React.createElement("th", { className: "text-left p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Fecha"), /* @__PURE__ */ React.createElement("th", { className: "text-left p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Usuario"), /* @__PURE__ */ React.createElement("th", { className: "text-left p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Rol"), /* @__PURE__ */ React.createElement("th", { className: "text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Areas"), /* @__PURE__ */ React.createElement("th", { className: "text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Total"), /* @__PURE__ */ React.createElement("th", { className: "text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Finalizadas"), /* @__PURE__ */ React.createElement("th", { className: "text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Pendientes"), /* @__PURE__ */ React.createElement("th", { className: "text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Desempeno"))), /* @__PURE__ */ React.createElement("tbody", null, dailyPerformanceStats.map((row, i) => {
    const pct = row.total > 0 ? Math.round(row.done / row.total * 100) : 0;
    const performanceColor = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
    return /* @__PURE__ */ React.createElement(
      "tr",
      {
        key: `${row.date}-${row.userId}`,
        className: `border-b border-slate-50 dark:border-slate-800/50 ${rowStyle(i)}`
      },
      /* @__PURE__ */ React.createElement("td", { className: "p-4 font-mono text-sm font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap" }, row.date),
      /* @__PURE__ */ React.createElement("td", { className: "p-4" }, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-slate-800 dark:text-white" }, row.name), row.email && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400" }, row.email)),
      /* @__PURE__ */ React.createElement("td", { className: "p-4 text-sm text-slate-500 dark:text-slate-400" }, row.roles?.length ? row.roles.join(" / ") : "Usuario"),
      /* @__PURE__ */ React.createElement("td", { className: "p-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-1.5 flex-wrap" }, row.areas.account > 0 && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-black" }, "Account ", row.areas.account), row.areas.editing > 0 && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-black" }, "Edicion ", row.areas.editing), row.areas.management > 0 && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[11px] font-black" }, "Gestion ", row.areas.management))),
      /* @__PURE__ */ React.createElement("td", { className: "p-4 text-center font-black text-slate-800 dark:text-white" }, row.total),
      /* @__PURE__ */ React.createElement("td", { className: "p-4 text-center font-bold text-emerald-600 dark:text-emerald-400" }, row.done),
      /* @__PURE__ */ React.createElement("td", { className: "p-4 text-center text-slate-500 dark:text-slate-400" }, row.pending),
      /* @__PURE__ */ React.createElement("td", { className: "p-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden" }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: `h-full rounded-full ${performanceColor}`,
          style: { width: `${pct}%` }
        }
      )), /* @__PURE__ */ React.createElement("span", { className: "w-10 text-right text-sm font-black text-slate-800 dark:text-white" }, pct, "%")))
    );
  })))))), activeTab === "managers" && /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" }, managerStats.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "p-16 text-center text-slate-500 font-bold" }, "Sin datos en este rango de fechas") : /* @__PURE__ */ React.createElement("table", { className: "w-full" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { className: "border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950" }, /* @__PURE__ */ React.createElement("th", { className: "text-left p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Manager"), /* @__PURE__ */ React.createElement("th", { className: "text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Total"), /* @__PURE__ */ React.createElement("th", { className: "text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "En Proceso"), /* @__PURE__ */ React.createElement("th", { className: "text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Aprobadas"), /* @__PURE__ */ React.createElement("th", { className: "text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Publicadas"))), /* @__PURE__ */ React.createElement("tbody", null, managerStats.map((m, i) => /* @__PURE__ */ React.createElement(
    "tr",
    {
      key: m.id,
      className: `border-b border-slate-50 dark:border-slate-800/50 ${rowStyle(i)}`
    },
    /* @__PURE__ */ React.createElement("td", { className: "p-4 font-bold text-slate-800 dark:text-white" }, m.name),
    /* @__PURE__ */ React.createElement("td", { className: "p-4 text-center font-black text-slate-800 dark:text-white" }, m.total),
    /* @__PURE__ */ React.createElement("td", { className: "p-4 text-center text-slate-500 dark:text-slate-400" }, m.inProgress),
    /* @__PURE__ */ React.createElement("td", { className: "p-4 text-center font-bold text-emerald-600 dark:text-emerald-400" }, m.approved),
    /* @__PURE__ */ React.createElement("td", { className: "p-4 text-center font-bold text-indigo-600 dark:text-indigo-400" }, m.published)
  ))))), activeTab === "editors" && /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" }, editorStats.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "p-16 text-center text-slate-500 font-bold" }, "Sin datos en este rango de fechas") : /* @__PURE__ */ React.createElement("table", { className: "w-full" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { className: "border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950" }, /* @__PURE__ */ React.createElement("th", { className: "text-left p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Editor"), /* @__PURE__ */ React.createElement("th", { className: "text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Total"), /* @__PURE__ */ React.createElement("th", { className: "text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "En Proceso"), /* @__PURE__ */ React.createElement("th", { className: "text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Aprobadas"), /* @__PURE__ */ React.createElement("th", { className: "text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Publicadas"))), /* @__PURE__ */ React.createElement("tbody", null, editorStats.map((e, i) => /* @__PURE__ */ React.createElement(
    "tr",
    {
      key: e.id,
      className: `border-b border-slate-50 dark:border-slate-800/50 ${rowStyle(i)}`
    },
    /* @__PURE__ */ React.createElement("td", { className: "p-4 font-bold text-slate-800 dark:text-white" }, e.name),
    /* @__PURE__ */ React.createElement("td", { className: "p-4 text-center font-black text-slate-800 dark:text-white" }, e.total),
    /* @__PURE__ */ React.createElement("td", { className: "p-4 text-center text-slate-500 dark:text-slate-400" }, e.inProgress),
    /* @__PURE__ */ React.createElement("td", { className: "p-4 text-center font-bold text-emerald-600 dark:text-emerald-400" }, e.approved),
    /* @__PURE__ */ React.createElement("td", { className: "p-4 text-center font-bold text-indigo-600 dark:text-indigo-400" }, e.published)
  ))))), activeTab === "management" && /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6" }, /* @__PURE__ */ React.createElement("h3", { className: "font-black text-slate-800 dark:text-white mb-5 flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icon, { name: "ShieldCheck", size: 18, className: "text-violet-500" }), " ", "Sala de Gesti\xF3n"), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, [
    { label: "Pendiente", status: "pendiente", color: "slate" },
    { label: "En Proceso", status: "en_proceso", color: "violet" },
    { label: "En Espera", status: "en_espera", color: "amber" },
    { label: "Cerrado", status: "cerrado", color: "emerald" }
  ].map((row) => {
    const count = filteredManagementTasks.filter(
      (t) => t.status === row.status
    ).length;
    const pct = filteredManagementTasks.length > 0 ? Math.round(count / filteredManagementTasks.length * 100) : 0;
    return /* @__PURE__ */ React.createElement("div", { key: row.status }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-1" }, /* @__PURE__ */ React.createElement(
      "span",
      {
        className: `w-2 h-2 rounded-full bg-${row.color}-500 shrink-0`
      }
    ), /* @__PURE__ */ React.createElement("span", { className: "text-sm text-slate-600 dark:text-slate-300 flex-1" }, row.label), /* @__PURE__ */ React.createElement("span", { className: "font-black text-slate-800 dark:text-white" }, count), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-500 w-8 text-right" }, pct, "%")), /* @__PURE__ */ React.createElement("div", { className: "h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `h-full bg-${row.color}-500 rounded-full transition-all duration-500`,
        style: { width: `${pct}%` }
      }
    )));
  }), /* @__PURE__ */ React.createElement("div", { className: "pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm font-bold text-slate-500" }, "Total"), /* @__PURE__ */ React.createElement("span", { className: "font-black text-slate-800 dark:text-white" }, filteredManagementTasks.length)))), /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4" }, /* @__PURE__ */ React.createElement("h3", { className: "font-black text-slate-800 dark:text-white flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icon, { name: "Flame", size: 18, className: "text-orange-500" }), " ", "Resumen"), /* @__PURE__ */ React.createElement(
    ReportStatCard,
    {
      label: "Tareas Abiertas",
      value: filteredManagementTasks.filter((t) => t.status !== "cerrado").length,
      color: "violet",
      icon: "Circle"
    }
  ), /* @__PURE__ */ React.createElement(
    ReportStatCard,
    {
      label: "Tareas Cerradas",
      value: filteredManagementTasks.filter((t) => t.status === "cerrado").length,
      color: "emerald",
      icon: "CheckCircle2"
    }
  ))));
};
var root = createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ React.createElement(App, null));
