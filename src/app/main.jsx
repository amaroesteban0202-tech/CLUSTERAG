import React, { useState, useEffect, useRef, useId, useMemo } from "react";
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
  DotsSixVertical as GripVertical,
  Paperclip,
  Microphone,
  Image as ImageIcon,
  Stop,
  FilePlus,
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
  signOut as firebaseSignOut,
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
  loadAllTaskHistory,
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
  EDITING_HIERARCHY_OPTIONS,
} from "/src/app/constants/app.constants.js";
import {
  compareDateOnlyStrings,
  getDateOnlyDiffDays,
  getHondurasTodayStr,
  isDateBeforeDateString,
  normalizeDateOnlyString,
  resolveStoredTaskRoomDate,
} from "/src/app/utils/date.js";
import {
  KPI_MIN_TASKS,
  buildManagerKpiStats,
  isEditingDelivered,
  isEditingActionable,
  isWorkflowCompleted,
  normalizeEditingWorkflowStatus,
  rankPendingEditingTasks,
} from "/src/app/utils/kpi.js";
import { apiFetch } from "./lib/backend-api.js";

void TAILWIND_SAFELIST;

const IconsMap = {
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
  GripVertical,
  Paperclip,
  Microphone,
  Image: ImageIcon,
  Stop,
  FilePlus,
};

const Icon = ({ name, size = 18, className = "", ...props }) => {
  const PhosphorIcon = IconsMap[name];
  const {
    "aria-hidden": ariaHidden = true,
    focusable = false,
    ...iconProps
  } = props;
  return PhosphorIcon ? (
    <PhosphorIcon
      size={size}
      weight="bold"
      className={className}
      aria-hidden={ariaHidden}
      focusable={focusable}
      {...iconProps}
    />
  ) : null;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const slugifyId = (value = "") =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const useDialogA11y = (isOpen, onClose) => {
  const dialogRef = useRef(null);
  const previousActiveElementRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return undefined;
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
        dialog.querySelectorAll(FOCUSABLE_SELECTOR),
      ).filter(
        (element) =>
          element.offsetParent !== null || element === document.activeElement,
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

const AgencyLogo = ({ className }) => {
  return (
    <div
      className={`agency-logo relative overflow-hidden rounded-md bg-white ${className}`}
    >
      <img
        src="/src/app/assets/cluster-symbol.webp"
        alt=""
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
      />
    </div>
  );
};

const GOOGLE_PROVIDER = auth ? new GoogleAuthProvider() : null;
if (GOOGLE_PROVIDER)
  GOOGLE_PROVIDER.setCustomParameters({ prompt: "select_account" });
const NATIVE_GOOGLE_TOKEN_STORAGE_KEY = "cluster_native_google_token";

const VIEW_PERMISSIONS = {
  dashboard: "view_dashboard",
  clients: "view_clients",
  "client-detail": "view_clients",
  chat: "view_client_chat",
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
  reports: "view_dashboard",
  performance: "view_dashboard",
};

const normalizeEmail = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase();
const normalizeNameKey = (value = "") =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
const normalizeTimeValue = (value = "") => {
  const match = String(value || "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "";
  const [, hours, minutes] = match;
  const normalizedHours = hours.padStart(2, "0");
  if (Number(normalizedHours) > 23 || Number(minutes) > 59) return "";
  return `${normalizedHours}:${minutes}`;
};
const nowIso = () => new Date().toISOString();
const EMAIL_LINK_STORAGE_KEY = "cluster_email_link_for_sign_in";
const PENDING_TASK_STATUS_UPDATES_KEY = "cluster_pending_task_status_updates";
const RETRYABLE_FIRESTORE_ERROR_CODES = new Set([
  "aborted",
  "cancelled",
  "data-loss",
  "deadline-exceeded",
  "failed-precondition",
  "internal",
  "resource-exhausted",
  "unavailable",
]);
const MANAGEMENT_DIRECTORY = DEFAULT_MANAGEMENT_TEAM.map((member) => ({
  ...member,
  directoryKey: normalizeNameKey(member.name),
}));
const readPendingTaskStatusUpdates = () => {
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
const writePendingTaskStatusUpdates = (items = []) => {
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
const queuePendingTaskStatusUpdate = ({
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
const clearPendingTaskStatusUpdate = ({
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
const getFirestoreErrorCode = (error) =>
  String(error?.code || "").replace(/^firestore\//, "");
const shouldRetryTaskStatusUpdate = (error) => {
  if (typeof navigator !== "undefined" && navigator.onLine === false)
    return true;
  const code = getFirestoreErrorCode(error);
  return !code || RETRYABLE_FIRESTORE_ERROR_CODES.has(code);
};
const getManagementDirectoryKey = (value = "") => {
  const sourceName = typeof value === "string" ? value : value?.name || "";
  const normalized = normalizeNameKey(sourceName);
  if (!normalized) return "";
  const exactMatch = MANAGEMENT_DIRECTORY.find(
    (member) => normalized === member.directoryKey,
  );
  if (exactMatch) return exactMatch.directoryKey;
  const aliasMatch = MANAGEMENT_DIRECTORY.find((member) =>
    normalized.startsWith(`${member.directoryKey} `),
  );
  return aliasMatch?.directoryKey || "";
};
const getManagementDirectoryMeta = (value = "") => {
  const key = getManagementDirectoryKey(value);
  return (
    MANAGEMENT_DIRECTORY.find((member) => member.directoryKey === key) || null
  );
};
const getResolvedManagementEmail = (record = {}) => {
  const directEmail = normalizeEmail(record.email);
  if (directEmail) return directEmail;
  return normalizeEmail(getManagementDirectoryMeta(record)?.email);
};
const buildRecoveredManagerId = (name = "") => {
  const key = normalizeNameKey(name)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return key ? `recovered_manager_${key}` : "";
};
const findDirectoryMemberByName = (name = "") => {
  const key = normalizeNameKey(name);
  return (
    MANAGEMENT_DIRECTORY.find((member) => member.directoryKey === key) || null
  );
};
const getUserRolePriority = (role = "") => {
  const priorities = {
    super_admin: 500,
    operations: 400,
    management: 350,
    manager: 300,
    editor: 250,
    viewer: 100,
  };
  return priorities[role] || 200;
};
const getVerificationPriority = (record = {}) => {
  if (
    record.emailVerified === true ||
    record.emailVerification?.status === "verified"
  )
    return 5;
  if (record.emailVerification?.status === "sent") return 4;
  if (record.emailVerification?.status === "pending") return 3;
  if (record.emailVerification?.status === "error") return 2;
  if (normalizeEmail(record.email)) return 1;
  return 0;
};
const getUserRecordScore = (record = {}, referenceCount = 0) =>
  referenceCount * 1000 +
  (normalizeEmail(record.email) ? 220 : 0) +
  (record.authUid ? 180 : 0) +
  (record.isActive === false ? 0 : 20) +
  (record.seeded ? 5 : 10) +
  getVerificationPriority(record) * 25 +
  getUserRolePriority(record.role);
const buildDuplicateUserGroups = (users = []) => {
  const userById = new Map(users.map((item) => [item.id, item]));
  const adjacency = new Map(users.map((item) => [item.id, new Set()]));
  const buckets = new Map();

  const addToken = (token, userId) => {
    if (!token) return;
    if (!buckets.has(token)) buckets.set(token, []);
    buckets.get(token).push(userId);
  };

  users.forEach((item) => {
    const email = normalizeEmail(item.email);
    if (email) addToken(`email:${email}`, item.id);
    if (item.role === "management") {
      const managementKey =
        item.managementKey || getManagementDirectoryKey(item);
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

  const visited = new Set();
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
const chooseCanonicalUserRecord = (group = [], referenceCounts = new Map()) =>
  [...group].sort((left, right) => {
    const scoreDelta =
      getUserRecordScore(right, referenceCounts.get(right.id) || 0) -
      getUserRecordScore(left, referenceCounts.get(left.id) || 0);
    if (scoreDelta !== 0) return scoreDelta;
    const leftCreatedAt = String(left.createdAt || "");
    const rightCreatedAt = String(right.createdAt || "");
    const createdAtDelta = leftCreatedAt.localeCompare(rightCreatedAt);
    if (createdAtDelta !== 0) return createdAtDelta;
    return String(left.id || "").localeCompare(String(right.id || ""));
  })[0] || null;
const getRoleMeta = (role) => ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS.viewer;
const getVerificationMeta = (record) => {
  const safeRecord = record || {};
  if (!normalizeEmail(safeRecord.email))
    return { label: "Sin correo", color: "slate", isVerified: false };
  if (
    safeRecord.emailVerified === true ||
    safeRecord.emailVerification?.status === "verified"
  )
    return { label: "Verificado", color: "emerald", isVerified: true };
  if (safeRecord.emailVerification?.status === "error")
    return { label: "Error de envio", color: "red", isVerified: false };
  if (safeRecord.emailVerification?.status === "sent")
    return { label: "Verificacion enviada", color: "amber", isVerified: false };
  if (safeRecord.emailVerification?.status === "pending")
    return { label: "Pendiente verificar", color: "amber", isVerified: false };
  return { label: "Con correo", color: "blue", isVerified: false };
};
const getLinkedProfileLabels = (record) => {
  const safeRecord = record || {};
  const labels = [];
  if (safeRecord.linkedManagerId) labels.push("Manager");
  if (safeRecord.linkedEditorId) labels.push("Editor");
  if (safeRecord.role === "management") labels.push("Gestion");
  return labels;
};
const getGoogleAuthErrorMessage = (error) => {
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
const getEmailLinkAuthErrorMessage = (error, phase = "send") => {
  const code = String(error?.code || "").trim();
  if (
    code === "auth/unauthorized-domain" ||
    code === "auth/unauthorized-continue-uri" ||
    code === "auth/invalid-continue-uri"
  ) {
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
  if (
    phase === "complete" &&
    (code === "auth/invalid-action-code" || code === "auth/expired-action-code")
  ) {
    return "El enlace ya no es valido o vencio.";
  }
  if (phase === "complete" && code === "auth/user-disabled") {
    return "La cuenta asociada esta deshabilitada.";
  }
  if (phase === "complete" && code === "auth/user-not-found") {
    return "No existe una cuenta de Firebase para ese correo.";
  }
  return phase === "complete"
    ? `No se pudo completar el acceso por correo${code ? ` (${code})` : ""}.`
    : `No se pudo enviar el correo de acceso${code ? ` (${code})` : ""}.`;
};
const buildEmailLinkActionUrl = () => {
  if (typeof window === "undefined") return "";
  const currentUrl = new URL(window.location.href);
  const target = new URL(window.location.origin + window.location.pathname);
  const firestoreTarget = currentUrl.searchParams.get("firestore");
  if (firestoreTarget) target.searchParams.set("firestore", firestoreTarget);
  target.searchParams.set("email_link", "pending");
  return target.toString();
};
const buildEmailLinkActionCodeSettings = () => ({
  url: buildEmailLinkActionUrl(),
  handleCodeInApp: true,
});
const buildEmailLinkReturnUrl = (href = "") => {
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
    (param) => nextUrl.searchParams.delete(param),
  );
  return nextUrl;
};
const getAuthSource = (authUser = null) => {
  const providerIds = (authUser?.providerData || [])
    .map((provider) => provider?.providerId)
    .filter(Boolean);
  if (providerIds.includes("google.com")) return "google";
  if (providerIds.includes("password")) return "email_link";
  if (authUser?.isAnonymous) return "anonymous";
  return "auth";
};
const userHasPermission = (profile, permission) => {
  if (!permission) return true;
  if (!profile || profile.isActive === false) return false;
  const permissions = getRoleMeta(profile.role).permissions || [];
  return permissions.includes("*") || permissions.includes(permission);
};
const canAccessView = (profile, view) =>
  userHasPermission(profile, VIEW_PERMISSIONS[view]);
const isCompletedStatus = (status) =>
  ["publicado", "aprobado", "cerrado"].includes(status);
const getEditingHierarchyId = (task = {}) => {
  if (task.hierarchy) return task.hierarchy;
  if (task.priority === "urgente") return "p1";
  if (task.priority === "recurrente") return "p3";
  return "p2";
};

const DEFAULT_RANKING_SETTINGS = {
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

const toConfigNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const sanitizeNumberMap = (defaults = {}, values = {}) =>
  Object.keys(defaults).reduce(
    (acc, key) => ({
      ...acc,
      [key]: toConfigNumber(values?.[key], defaults[key]),
    }),
    {},
  );

const sanitizeRankingSettings = (settings = {}) => {
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

const getAccountTaskHierarchyId = (task = {}) => {
  if (task.hierarchy) return task.hierarchy;
  if (task.priority === "urgente") return "p1";
  if (task.priority === "recurrente") return "p3";
  return "p2";
};

const getStatusTimestampPatch = (
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

const getTaskCompletionIso = (task = {}) => {
  const status = task.status || "";
  if (task.statusTimestamps?.[status]) return task.statusTimestamps[status];
  if (status === "publicado") return task.publishedAt || task.updatedAt || "";
  if (status === "aprobado") return task.approvedAt || task.updatedAt || "";
  if (status === "aprobado_internamente")
    return task.internallyApprovedAt || task.updatedAt || "";
  if (status === "cerrado") return task.closedAt || task.updatedAt || "";
  return "";
};

const getHondurasDatePartsFromIso = (value = "") => {
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

const getHondurasDateFromIso = (value = "") =>
  getHondurasDatePartsFromIso(value)?.date || "";

const getHoursBetween = (startValue = "", endValue = "") => {
  const startMs = Date.parse(startValue);
  const endMs = Date.parse(endValue);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs)
    return null;
  return (endMs - startMs) / 3600000;
};

const isCompletionOnTime = (task = {}, completionIso = "") => {
  const dueDate = normalizeDateOnlyString(task.date);
  const completionDate = getHondurasDateFromIso(completionIso);
  if (!dueDate || !completionDate) return false;
  return compareDateOnlyStrings(completionDate, dueDate) <= 0;
};

const isCompletionEarly = (task = {}, completionIso = "", cutoffHour = 12) => {
  const dueDate = normalizeDateOnlyString(task.date);
  const completionParts = getHondurasDatePartsFromIso(completionIso);
  if (!dueDate || !completionParts) return false;
  const dateDelta = compareDateOnlyStrings(completionParts.date, dueDate);
  return (
    dateDelta < 0 || (dateDelta === 0 && completionParts.hour <= cutoffHour)
  );
};

const isTaskPlannedAhead = (task = {}, leadDays = 1) => {
  const dueDate = normalizeDateOnlyString(task.date);
  const createdDate = getHondurasDateFromIso(task.createdAt);
  if (!dueDate || !createdDate) return false;
  return getDateOnlyDiffDays(dueDate, createdDate) >= leadDays;
};

const getRankingMonthPeriod = (referenceDate = getHondurasTodayStr()) => {
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

const isDateWithinPeriod = (value = "", period = getRankingMonthPeriod()) => {
  const normalizedDate = normalizeDateOnlyString(value);
  if (!normalizedDate) return false;
  return (
    compareDateOnlyStrings(normalizedDate, period.start) >= 0 &&
    compareDateOnlyStrings(normalizedDate, period.end) <= 0
  );
};

const toKpiPercent = (value = 0, maxValue = 0) => {
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

const getRankingKeywords = (value = "") =>
  String(value || "")
    .split(",")
    .map((item) => normalizeNameKey(item))
    .filter(Boolean);

const hasCreativitySignal = (task = {}, keywords = []) => {
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

const isAccountTaskDone = (task = {}) =>
  ["aprobado_internamente", "publicado"].includes(task.status);

const getManagerLinkedUserMatches = (manager = {}, users = []) => {
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

const isManagerLinkedToInactiveUser = (manager = {}, users = []) => {
  const matches = getManagerLinkedUserMatches(manager, users);
  if (matches.length === 0) return false;
  return matches.some((user) => user.isActive === false);
};

const buildManagerRankingStats = ({
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
const isTaskAssignedToProfile = (task, profile, contextIds = []) => {
  const profileId = profile?.id;
  if (!profileId) return false;
  if (task?.assigneeUserId && task.assigneeUserId === profileId) return true;
  return contextIds.filter(Boolean).includes(task?.contextId);
};
const TASK_ROOM_STATE_VERSION = 3;
const getTaskRoomDefaults = ({ preferMine = false } = {}) => ({
  currentDate: getHondurasTodayStr(),
  filterMode: "all",
  ownershipFilter: preferMine ? "mine" : "all",
  rangeStart: getHondurasTodayStr(),
  rangeEnd: getHondurasTodayStr(),
});
const readTaskRoomState = (storageKey, options = {}) => {
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
        defaults.currentDate,
      ),
      filterMode: ["date", "overdue", "all", "range"].includes(
        parsedValue.filterMode,
      )
        ? parsedValue.filterMode
        : defaults.filterMode,
      ownershipFilter: ["all", "mine"].includes(parsedValue.ownershipFilter)
        ? parsedValue.ownershipFilter
        : defaults.ownershipFilter,
      rangeStart:
        normalizeDateOnlyString(parsedValue.rangeStart) || defaults.rangeStart,
      rangeEnd:
        normalizeDateOnlyString(parsedValue.rangeEnd) || defaults.rangeEnd,
    };
    const savedVersion = Number(parsedValue.version || 0);
    const wasPersonalized = parsedValue.personalized === true;
    const looksLikeLegacyDefault =
      (!wasPersonalized || savedVersion < TASK_ROOM_STATE_VERSION) &&
      parsedState.filterMode === "date" &&
      parsedState.ownershipFilter === "all" &&
      compareDateOnlyStrings(parsedState.currentDate, defaults.currentDate) ===
        0;
    if (looksLikeLegacyDefault) return defaults;
    return parsedState;
  } catch (error) {
    console.warn(`No se pudo leer el estado guardado de ${storageKey}:`, error);
    return defaults;
  }
};
const useTaskRoomState = (storageKey, options = {}) => {
  const preferMine = Boolean(options.preferMine);
  const [roomState, setRoomState] = useState(() =>
    readTaskRoomState(storageKey, { preferMine }),
  );

  useEffect(() => {
    const nextState = readTaskRoomState(storageKey, { preferMine });
    setRoomState((current) => {
      const hasChanges =
        nextState.currentDate !== current.currentDate ||
        nextState.filterMode !== current.filterMode ||
        nextState.ownershipFilter !== current.ownershipFilter ||
        nextState.rangeStart !== current.rangeStart ||
        nextState.rangeEnd !== current.rangeEnd;
      return hasChanges ? nextState : current;
    });
  }, [storageKey, preferMine]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        ...roomState,
        currentDate:
          normalizeDateOnlyString(roomState.currentDate) ||
          getHondurasTodayStr(),
        savedAt: getHondurasTodayStr(),
        version: TASK_ROOM_STATE_VERSION,
        personalized: preferMine,
      }),
    );
  }, [storageKey, roomState, preferMine]);

  return {
    currentDate: roomState.currentDate,
    filterMode: roomState.filterMode,
    ownershipFilter: roomState.ownershipFilter,
    rangeStart: roomState.rangeStart,
    rangeEnd: roomState.rangeEnd,
    setCurrentDate: (value) =>
      setRoomState((current) => ({
        ...current,
        currentDate:
          typeof value === "function" ? value(current.currentDate) : value,
      })),
    setFilterMode: (value) =>
      setRoomState((current) => ({
        ...current,
        filterMode:
          typeof value === "function" ? value(current.filterMode) : value,
      })),
    setOwnershipFilter: (value) =>
      setRoomState((current) => ({
        ...current,
        ownershipFilter:
          typeof value === "function" ? value(current.ownershipFilter) : value,
      })),
    setRangeStart: (value) =>
      setRoomState((current) => ({
        ...current,
        rangeStart:
          typeof value === "function" ? value(current.rangeStart) : value,
      })),
    setRangeEnd: (value) =>
      setRoomState((current) => ({
        ...current,
        rangeEnd: typeof value === "function" ? value(current.rangeEnd) : value,
      })),
  };
};
const EDITING_STATUS_OPTIONS = [
  { id: "editar", label: "Por Editar" },
  { id: "en_edicion", label: "En Edicion" },
  { id: "revision_interna", label: "En Revision" },
  { id: "aprobado", label: "Aprobado" },
  { id: "publicado", label: "Publicado" },
];

// --- APP PRINCIPAL ---
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isDark, setIsDark] = useState(() => {
    const darkDefaultVersion = "2026-07-charcoal-default";
    const appliedDefaultVersion = localStorage.getItem(
      "cluster_theme_default_version",
    );
    if (appliedDefaultVersion !== darkDefaultVersion) {
      localStorage.setItem("cluster_theme", "dark");
      localStorage.setItem("cluster_theme_default_version", darkDefaultVersion);
      return true;
    }
    return localStorage.getItem("cluster_theme") !== "light";
  });
  const [view, setView] = useState(
    () => localStorage.getItem("cluster_os_view") || "dashboard",
  );
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [isSendingLoginLink, setIsSendingLoginLink] = useState(false);
  const [hasSeededManagementDirectory, setHasSeededManagementDirectory] =
    useState(false);
  const [hasRecoveredManagerDirectory, setHasRecoveredManagerDirectory] =
    useState(false);
  const [hasBackfilledIdentityLinks, setHasBackfilledIdentityLinks] =
    useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const isReconcilingUsersRef = useRef(false);
  const isBackfillingIdentityLinksRef = useRef(false);
  const isFlushingPendingTaskStatusesRef = useRef(false);
  const lastReconciledDuplicateSignatureRef = useRef("");
  const lastIdentityLinkSyncSignatureRef = useRef("");
  const nativeGoogleTokensSeenRef = useRef(new Set());

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
  const [clientChats, setClientChats] = useState([]);
  const [chatReads, setChatReads] = useState([]);
  const [chatDirectory, setChatDirectory] = useState([]);

  useEffect(() => {
    window.__cluster_active_view = view;
    window.dispatchEvent(new Event("cluster:viewchange"));
  }, [view]);

  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedManager, setSelectedManager] = useState(null);
  const [selectedEditor, setSelectedEditor] = useState(null);
  const [selectedChatClient, setSelectedChatClient] = useState(null);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: null,
    data: null,
    isEdit: false,
  });
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    type: null,
    id: null,
    title: "",
  });
  const [eventAction, setEventAction] = useState({
    isOpen: false,
    event: null,
    type: null,
  });
  const [taskDetailConfig, setTaskDetailConfig] = useState({
    isOpen: false,
    task: null,
    type: null,
  });
  const [dayDetailsModal, setDayDetailsModal] = useState({
    isOpen: false,
    date: null,
  });

  const authEmail = normalizeEmail(user?.email);
  const authEmailMatches = authEmail
    ? appUsers.filter((item) => normalizeEmail(item.email) === authEmail)
    : [];

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
  const resolvedAuthProfile =
    authEmailMatches.length > 0
      ? chooseCanonicalUserRecord(authEmailMatches)
      : null;
  const pendingManagementMember = authEmail
    ? MANAGEMENT_DIRECTORY.find(
        (item) => normalizeEmail(item.email) === authEmail,
      )
    : null;
  const pendingMatchedManager = authEmail
    ? managers.find((item) => normalizeEmail(item.email) === authEmail)
    : null;
  const pendingMatchedEditor = authEmail
    ? editors.find((item) => normalizeEmail(item.email) === authEmail)
    : null;
  const pendingPreAuthorizedEditor =
    authEmail && !pendingMatchedEditor
      ? DEFAULT_EDITORS_TEAM.find(
          (item) => normalizeEmail(item.email) === authEmail,
        )
      : null;
  const pendingRole = !authEmail
    ? "viewer"
    : pendingManagementMember
      ? pendingManagementMember.role || "management"
      : pendingMatchedManager
        ? "manager"
        : pendingMatchedEditor || pendingPreAuthorizedEditor
          ? "editor"
          : "viewer";
  const effectiveResolvedAuthProfile = resolvedAuthProfile
    ? {
        ...resolvedAuthProfile,
        role:
          getUserRolePriority(pendingRole) >
          getUserRolePriority(resolvedAuthProfile.role)
            ? pendingRole
            : resolvedAuthProfile.role,
        managementKey:
          resolvedAuthProfile.managementKey ||
          pendingManagementMember?.directoryKey ||
          "",
        linkedManagerId:
          resolvedAuthProfile.linkedManagerId ||
          pendingMatchedManager?.id ||
          "",
        linkedEditorId:
          resolvedAuthProfile.linkedEditorId || pendingMatchedEditor?.id || "",
      }
    : null;
  const pendingProfileRecordId = pendingManagementMember
    ? `management_${pendingManagementMember.directoryKey}`
    : pendingMatchedManager
      ? pendingMatchedManager.userId || pendingMatchedManager.id || ""
      : pendingMatchedEditor
        ? pendingMatchedEditor.userId || pendingMatchedEditor.id || ""
        : "";
  const currentUserProfile = !user
    ? null
    : authEmail
      ? effectiveResolvedAuthProfile || {
          id: pendingProfileRecordId || "pending-user",
          name:
            pendingManagementMember?.name ||
            pendingMatchedManager?.name ||
            pendingMatchedEditor?.name ||
            user.displayName ||
            authEmail.split("@")[0],
          email: authEmail,
          role: pendingRole,
          isActive: true,
          pending: true,
          managementKey: pendingManagementMember?.directoryKey || "",
          linkedManagerId: pendingMatchedManager?.id || "",
          linkedEditorId: pendingMatchedEditor?.id || "",
        }
      : {
          id: "anonymous",
          name: "Invitado",
          email: "",
          role: "viewer",
          isActive: true,
          isAnonymous: true,
        };
  const currentRoleMeta = getRoleMeta(currentUserProfile?.role);
  const currentVerificationMeta = getVerificationMeta(currentUserProfile);
  const profileBlocked = Boolean(
    currentUserProfile && currentUserProfile.isActive === false,
  );

  // Estado de lectura del chat por cliente para el usuario actual.
  const chatReadMap = useMemo(() => {
    const uid = String(currentUserProfile?.id || authEmail || "");
    const map = {};
    if (!uid) return map;
    chatReads.forEach((entry) => {
      if (String(entry.userId || "") === uid && entry.clientId) {
        map[entry.clientId] = entry.lastReadAt || "";
      }
    });
    return map;
  }, [chatReads, currentUserProfile, authEmail]);

  // No leídos por cliente + total (excluye los mensajes propios y el hilo que
  // está abierto en este momento, que se considera leído al instante).
  const chatUnread = useMemo(() => {
    const myId = String(currentUserProfile?.id || "");
    const openClientId =
      view === "chat" ? String(selectedChatClient?.id || "") : "";
    const byClient = {};
    let total = 0;
    clientChats.forEach((message) => {
      if (!message.clientId || !message.createdAt) return;
      if (myId && String(message.authorId || "") === myId) return;
      if (openClientId && String(message.clientId) === openClientId) return;
      const lastRead = chatReadMap[message.clientId] || "";
      if (message.createdAt > lastRead) {
        byClient[message.clientId] = (byClient[message.clientId] || 0) + 1;
        total += 1;
      }
    });
    return { byClient, total };
  }, [clientChats, chatReadMap, currentUserProfile, view, selectedChatClient]);

  const appUserById = new Map(appUsers.map((item) => [item.id, item]));
  const managementMemberCandidates = [
    ...appUsers.filter((item) => item.isActive !== false),
    ...managers.map((item) => {
      const linkedUser = item.userId ? appUserById.get(item.userId) : null;
      return {
        ...(linkedUser || {}),
        id: linkedUser?.id || item.userId || item.id,
        name: linkedUser?.name || item.name || "",
        email: normalizeEmail(linkedUser?.email || item.email),
        role:
          linkedUser?.role && linkedUser.role !== "viewer"
            ? linkedUser.role
            : "manager",
        isActive: linkedUser?.isActive ?? item.isActive ?? true,
        linkedManagerId: item.id,
        managementKey: linkedUser?.managementKey || "",
      };
    }),
    ...editors.map((item) => {
      const linkedUser = item.userId ? appUserById.get(item.userId) : null;
      return {
        ...(linkedUser || {}),
        id: linkedUser?.id || item.userId || item.id,
        name: linkedUser?.name || item.name || "",
        email: normalizeEmail(linkedUser?.email || item.email),
        role:
          linkedUser?.role && linkedUser.role !== "viewer"
            ? linkedUser.role
            : "editor",
        isActive: linkedUser?.isActive ?? item.isActive ?? true,
        linkedEditorId: item.id,
        managementKey: linkedUser?.managementKey || "",
      };
    }),
    ...(currentUserProfile && !currentUserProfile.isAnonymous
      ? [currentUserProfile]
      : []),
  ].filter(
    (item) =>
      item.isActive !== false &&
      (item.id || item.name || normalizeEmail(item.email)),
  );
  const managementUsers = Array.from(
    managementMemberCandidates
      .reduce((accumulator, item) => {
        const managementKey =
          item.managementKey ||
          (["management", "super_admin", "operations"].includes(item.role)
            ? getManagementDirectoryKey(item)
            : "");
        const emailKey = normalizeEmail(item.email);
        const memberKey = managementKey
          ? `management:${managementKey}`
          : emailKey
            ? `email:${emailKey}`
            : item.linkedManagerId
              ? `manager:${item.linkedManagerId}`
              : item.linkedEditorId
                ? `editor:${item.linkedEditorId}`
                : `user:${item.id}`;
        const current = accumulator.get(memberKey);
        if (
          !current ||
          getUserRecordScore(item) > getUserRecordScore(current)
        ) {
          accumulator.set(memberKey, item);
        }
        return accumulator;
      }, new Map())
      .values(),
  )
    .map((item) => {
      const managementMeta = getManagementDirectoryMeta(item);
      return {
        ...item,
        email: getResolvedManagementEmail(item),
        managementKey: item.managementKey || managementMeta?.directoryKey || "",
      };
    })
    .sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", "es", { sensitivity: "base" }),
    );
  const defaultManagementAssigneeId =
    currentUserProfile?.id &&
    !["anonymous", "pending-user"].includes(currentUserProfile.id) &&
    managementUsers.some((item) => item.id === currentUserProfile.id)
      ? currentUserProfile.id
      : "";
  const privilegedUsers = appUsers.filter(
    (item) =>
      item.isActive !== false &&
      ["super_admin", "operations"].includes(item.role),
  );
  const dataCollection = (name) =>
    collection(db, "artifacts", appId, "public", "data", name);
  const dataDoc = (name, id) =>
    doc(db, "artifacts", appId, "public", "data", name, id);
  const sendUserEmailLink = async ({
    userId,
    email,
    userRecord = {},
    reason = "manual_resend",
  }) => {
    if (!auth) {
      const unavailableError = new Error(
        "Firebase Authentication no esta disponible.",
      );
      unavailableError.friendlyMessage =
        "Firebase Authentication no esta disponible.";
      throw unavailableError;
    }

    const normalizedEmail = normalizeEmail(email || userRecord?.email);
    if (!userId || !normalizedEmail) {
      const invalidUserError = new Error(
        "El usuario necesita un correo valido.",
      );
      invalidUserError.friendlyMessage =
        "El usuario necesita un correo valido.";
      throw invalidUserError;
    }

    const verificationState = userRecord?.emailVerification || {};
    const requestedAt = nowIso();

    try {
      auth.languageCode = "es";
      await sendSignInLinkToEmail(
        auth,
        normalizedEmail,
        buildEmailLinkActionCodeSettings(),
      );
      await updateDoc(dataDoc("users", userId), {
        emailVerified: false,
        emailVerification: {
          ...verificationState,
          status: "sent",
          source: "email_link",
          requestedAt: verificationState.requestedAt || requestedAt,
          sentAt: requestedAt,
          resendRequestedAt:
            reason === "manual_resend"
              ? requestedAt
              : verificationState.resendRequestedAt || "",
          requestedBy: currentUserProfile?.id || "",
          lastSentReason: reason,
          lastRecipient: normalizedEmail,
          lastError: "",
        },
        updatedAt: requestedAt,
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
          resendRequestedAt:
            reason === "manual_resend"
              ? requestedAt
              : verificationState.resendRequestedAt || "",
          failedAt,
          lastSentReason: reason,
          lastRecipient: normalizedEmail,
          lastError: friendlyMessage,
        },
        updatedAt: failedAt,
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
            window.localStorage.getItem(EMAIL_LINK_STORAGE_KEY) || "",
          );
          const emailForLink =
            storedEmail ||
            normalizeEmail(
              window.prompt(
                "Escribe tu correo para completar el acceso enviado por email.",
              ) || "",
            );
          const cleanUrl = buildEmailLinkReturnUrl(window.location.href);

          if (!emailForLink) {
            if (cleanUrl)
              window.history.replaceState(
                {},
                document.title,
                cleanUrl.toString(),
              );
            showToast(
              "Necesitas confirmar el correo para completar el acceso.",
              "error",
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
              cleanUrl.toString(),
            );
          showToast("Acceso por correo completado.");
          return;
        }

        await waitForAuthState();
        if (
          !auth.currentUser &&
          typeof completeGoogleRedirectIfNeeded === "function"
        ) {
          const completedGoogleRedirect =
            await completeGoogleRedirectIfNeeded(auth);
          if (completedGoogleRedirect) return;
        }
        if (auth.currentUser) return;

        if (
          typeof __initial_auth_token !== "undefined" &&
          __initial_auth_token
        ) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
            return;
          } catch (tokenError) {
            console.error(
              "No se pudo iniciar sesion con token inicial:",
              tokenError,
            );
          }
        }

        if (!auth.currentUser) await signInAnonymously(auth);
      } catch (error) {
        console.error("Error de Autenticación:", error);
        if (isSignInWithEmailLink(auth, window.location.href)) {
          const cleanUrl = buildEmailLinkReturnUrl(window.location.href);
          if (cleanUrl)
            window.history.replaceState(
              {},
              document.title,
              cleanUrl.toString(),
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
          error,
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
      const storedToken =
        window.localStorage.getItem(NATIVE_GOOGLE_TOKEN_STORAGE_KEY) || "";
      if (!storedToken) return false;
      return consumeNativeGoogleToken(storedToken);
    };

    let appUrlHandle = null;
    let resumeHandle = null;

    CapacitorApp.addListener("appUrlOpen", ({ url }) => {
      consumeAppUrl(url).catch(() => {});
    })
      .then((handle) => {
        appUrlHandle = handle;
      })
      .catch((error) => {
        console.error("No se pudo registrar appUrlOpen:", error);
      });

    CapacitorApp.getLaunchUrl()
      .then((result) => {
        consumeAppUrl(result?.url || "").catch(() => {});
      })
      .catch(() => {});

    consumeStoredToken().catch(() => {});

    CapacitorApp.addListener("resume", () => {
      consumeStoredToken().catch(() => {});
      CapacitorApp.getLaunchUrl()
        .then((result) => {
          consumeAppUrl(result?.url || "").catch(() => {});
        })
        .catch(() => {});
      completeGoogleRedirectIfNeeded(auth)
        .then((completed) => {
          if (completed) {
            setUser(auth.currentUser);
            setView("dashboard");
            localStorage.setItem("cluster_os_view", "dashboard");
            setIsSigningIn(false);
          }
        })
        .catch(() => {
          setIsSigningIn(false);
        });
    })
      .then((handle) => {
        resumeHandle = handle;
      })
      .catch(() => {});

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
            ...docItem.data(),
          }));
          setClients(list);
          setSelectedClient((current) =>
            current
              ? list.find((item) => item.id === current.id) || null
              : null,
          );
        },
        errHandler,
      ),
      onSnapshot(
        dataCollection("events"),
        (snapshot) =>
          setEvents(
            snapshot.docs.map((docItem) => ({
              id: docItem.id,
              ...docItem.data(),
            })),
          ),
        errHandler,
      ),
      onSnapshot(
        dataCollection("managers"),
        (snapshot) => {
          const list = snapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          }));
          setManagers(list);
          setSelectedManager((current) =>
            current
              ? list.find((item) => item.id === current.id) || null
              : null,
          );
        },
        errHandler,
      ),
      onSnapshot(
        dataCollection("editors"),
        (snapshot) => {
          const list = snapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          }));
          setEditors(list);
          setSelectedEditor((current) =>
            current
              ? list.find((item) => item.id === current.id) || null
              : null,
          );
        },
        errHandler,
      ),
      onSnapshot(
        dataCollection("editing"),
        (snapshot) =>
          setEditingTasks(
            snapshot.docs.map((docItem) => ({
              id: docItem.id,
              ...docItem.data(),
            })),
          ),
        errHandler,
      ),
      onSnapshot(
        dataCollection("account_tasks"),
        (snapshot) =>
          setAccountTasks(
            snapshot.docs.map((docItem) => ({
              id: docItem.id,
              ...docItem.data(),
            })),
          ),
        errHandler,
      ),
      onSnapshot(
        dataCollection("management_tasks"),
        (snapshot) =>
          setManagementTasks(
            snapshot.docs.map((docItem) => ({
              id: docItem.id,
              ...docItem.data(),
            })),
          ),
        errHandler,
      ),
      onSnapshot(
        dataCollection("users"),
        (snapshot) => {
          setAppUsers(
            snapshot.docs.map((docItem) => ({
              id: docItem.id,
              ...docItem.data(),
            })),
          );
          setUsersLoaded(true);
        },
        errHandler,
      ),
      onSnapshot(
        query(
          dataCollection("client_chats"),
          orderBy("createdAt", "desc"),
          limit(500),
        ),
        (snapshot) =>
          setClientChats(
            snapshot.docs.map((docItem) => ({
              id: docItem.id,
              ...docItem.data(),
            })),
          ),
        errHandler,
      ),
      onSnapshot(
        dataCollection("chat_reads"),
        (snapshot) =>
          setChatReads(
            snapshot.docs.map((docItem) => ({
              id: docItem.id,
              ...docItem.data(),
            })),
          ),
        errHandler,
      ),
    ];

    return () => unsubs.forEach((unsubscribe) => unsubscribe());
  }, [user]);

  useEffect(() => {
    if (!user || !db || view !== "control-center") return;
    return onSnapshot(
      query(
        dataCollection("audit_logs"),
        orderBy("createdAt", "desc"),
        limit(120),
      ),
      (snapshot) =>
        setAuditLogs(
          snapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          })),
        ),
      (err) => console.error("Error de Firestore:", err),
    );
  }, [user, view]);

  useEffect(() => {
    if (!db || !user || !usersLoaded || hasSeededManagementDirectory) return;
    const existingKeys = new Set(
      appUsers
        .map((item) => item.managementKey || getManagementDirectoryKey(item))
        .filter(Boolean),
    );
    const missingMembers = MANAGEMENT_DIRECTORY.filter(
      (member) => !existingKeys.has(member.directoryKey),
    );
    if (missingMembers.length === 0) {
      setHasSeededManagementDirectory(true);
      return;
    }
    Promise.all(
      missingMembers.map((member) =>
        setDoc(
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
            linkedEditorId: "",
          },
          { merge: true },
        ),
      ),
    ).finally(() => setHasSeededManagementDirectory(true));
  }, [db, user, usersLoaded, appUsers, hasSeededManagementDirectory]);

  useEffect(() => {
    if (!db || !user || !usersLoaded || hasRecoveredManagerDirectory) return;
    if (!userHasPermission(currentUserProfile, "manage_managers")) return;

    const existingManagerIds = new Set(
      managers.map((item) => item.id).filter(Boolean),
    );
    const existingManagerByName = new Map(
      managers
        .filter((item) => normalizeNameKey(item.name))
        .map((item) => [normalizeNameKey(item.name), item]),
    );
    const referencedManagers = new Map();

    const addReferencedManager = ({ id = "", name = "", email = "" }) => {
      const resolvedName = String(name || "").trim();
      const resolvedEmail = normalizeEmail(email);
      const resolvedId =
        String(id || "").trim() || buildRecoveredManagerId(resolvedName);
      if (!resolvedId || !resolvedName) return;

      const existingByName = existingManagerByName.get(
        normalizeNameKey(resolvedName),
      );
      if (existingByName) return;
      if (existingManagerIds.has(resolvedId)) return;

      const current = referencedManagers.get(resolvedId) || {};
      referencedManagers.set(resolvedId, {
        id: resolvedId,
        name: current.name || resolvedName,
        email: current.email || resolvedEmail,
      });
    };

    clients.forEach((client) => {
      addReferencedManager({
        id: client.managerId,
        name: client.manager,
        email: client.managerEmail,
      });
    });

    accountTasks.forEach((task) => {
      if (!task.contextId || existingManagerIds.has(task.contextId)) return;
      const assignedUser = task.assigneeUserId
        ? appUsers.find((item) => item.id === task.assigneeUserId)
        : null;
      if (!assignedUser) return;
      addReferencedManager({
        id: task.contextId,
        name: assignedUser.name,
        email: assignedUser.email,
      });
    });

    appUsers.forEach((appUser) => {
      if (
        !appUser.linkedManagerId ||
        existingManagerIds.has(appUser.linkedManagerId)
      )
        return;
      addReferencedManager({
        id: appUser.linkedManagerId,
        name: appUser.name,
        email: appUser.email,
      });
    });

    const missingManagers = Array.from(referencedManagers.values());
    if (missingManagers.length === 0) {
      if (
        managers.length > 0 ||
        clients.length > 0 ||
        accountTasks.length > 0
      ) {
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
        manager.email || directoryMember?.email,
      );
      const linkedUser =
        (resolvedEmail
          ? appUsers.find(
              (item) => normalizeEmail(item.email) === resolvedEmail,
            )
          : null) ||
        appUsers.find(
          (item) =>
            normalizeNameKey(item.name) === normalizeNameKey(manager.name),
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
          updatedAt: stamp,
        },
        { merge: true },
      );

      if (linkedUser?.id && linkedUser.linkedManagerId !== manager.id) {
        batch.update(dataDoc("users", linkedUser.id), {
          linkedManagerId: manager.id,
          updatedAt: stamp,
        });
      }

      clients
        .filter(
          (client) =>
            client.managerId === manager.id ||
            (!client.managerId &&
              normalizeNameKey(client.manager) ===
                normalizeNameKey(manager.name)),
        )
        .forEach((client) => {
          batch.update(dataDoc("clients", client.id), {
            manager: manager.name,
            managerId: manager.id,
            managerUserId: linkedUser?.id || client.managerUserId || "",
            updatedAt: stamp,
          });
        });

      if (linkedUser?.id) {
        accountTasks
          .filter(
            (task) =>
              task.contextId === manager.id &&
              task.assigneeUserId !== linkedUser.id,
          )
          .forEach((task) => {
            batch.update(dataDoc("account_tasks", task.id), {
              assigneeUserId: linkedUser.id,
              updatedAt: stamp,
            });
          });
      }
    });

    batch
      .commit()
      .then(() => {
        if (!isCancelled)
          showToast(`Account Managers restaurados: ${missingManagers.length}`);
      })
      .catch((error) => {
        console.error(
          "No se pudo restaurar el directorio de Account Managers:",
          error,
        );
      })
      .finally(() => {
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
    appUsers,
  ]);

  useEffect(() => {
    if (!db || !user || !usersLoaded) return;
    const pendingManagementBackfill = appUsers
      .filter((item) => item.role === "management")
      .map((item) => {
        const resolvedEmail = getResolvedManagementEmail(item);
        const managementKey =
          item.managementKey || getManagementDirectoryKey(item);
        const needsEmail =
          Boolean(resolvedEmail) &&
          normalizeEmail(item.email) !== resolvedEmail;
        const needsKey =
          Boolean(managementKey) && item.managementKey !== managementKey;
        if (!needsEmail && !needsKey) return null;
        return { id: item.id, resolvedEmail, managementKey };
      })
      .filter(Boolean);
    if (pendingManagementBackfill.length === 0) return;

    Promise.all(
      pendingManagementBackfill.map(({ id, resolvedEmail, managementKey }) =>
        updateDoc(dataDoc("users", id), {
          ...(resolvedEmail ? { email: resolvedEmail } : {}),
          ...(managementKey ? { managementKey } : {}),
          updatedAt: nowIso(),
        }).catch(() => {}),
      ),
    );
  }, [db, user, usersLoaded, appUsers]);

  useEffect(() => {
    if (!db || !user || !authEmail || !usersLoaded) return;
    const existingByUid = appUsers.find(
      (item) => item.authUid && item.authUid === user.uid,
    );
    const existingByEmail = chooseCanonicalUserRecord(
      appUsers.filter((item) => normalizeEmail(item.email) === authEmail),
    );
    const matchByName = appUsers.find(
      (item) =>
        !normalizeEmail(item.email) &&
        normalizeNameKey(item.name) ===
          normalizeNameKey(user.displayName || authEmail),
    );
    const existing = existingByUid || existingByEmail || matchByName;
    const targetId =
      existing?.id ||
      `auth_${user.uid || normalizeNameKey(authEmail).replace(/[^a-z0-9]+/g, "_")}`;
    const isForcedSuperAdmin = SUPER_ADMIN_EMAILS.includes(authEmail);
    const existingRole =
      existing?.role ||
      (privilegedUsers.length === 0 ? "super_admin" : "viewer");
    const matchedManager =
      managers.find((item) => normalizeEmail(item.email) === authEmail) ||
      (existing?.linkedManagerId
        ? managers.find((item) => item.id === existing.linkedManagerId)
        : null);
    const matchedEditor =
      editors.find((item) => normalizeEmail(item.email) === authEmail) ||
      (existing?.linkedEditorId
        ? editors.find((item) => item.id === existing.linkedEditorId)
        : null);
    // Verificar si el correo esta en la lista de editores pre-autorizados
    const preAuthorizedEditor = !matchedEditor
      ? DEFAULT_EDITORS_TEAM.find(
          (item) => normalizeEmail(item.email) === authEmail,
        )
      : null;
    const roleByLink = existing?.managementKey
      ? "management"
      : matchedManager
        ? "manager"
        : matchedEditor || preAuthorizedEditor
          ? "editor"
          : "viewer";
    const bootstrapRole = isForcedSuperAdmin
      ? "super_admin"
      : privilegedUsers.length === 0 &&
          !["super_admin", "operations"].includes(existingRole)
        ? "super_admin"
        : getUserRolePriority(roleByLink) > getUserRolePriority(existingRole)
          ? roleByLink
          : existingRole;
    const nextRole = bootstrapRole;
    const authSource = getAuthSource(user);
    const emailVerifiedByAuth =
      Boolean(user.emailVerified) ||
      authSource === "google" ||
      authSource === "email_link";
    const verificationState = existing?.emailVerification || {};
    const resolvedName =
      existing?.name || user.displayName || authEmail.split("@")[0];
    const nextManagementKey =
      nextRole === "management"
        ? existing?.managementKey || getManagementDirectoryKey(existing) || ""
        : existing?.managementKey || "";
    const nextVerification = emailVerifiedByAuth
      ? {
          ...verificationState,
          status: "verified",
          source: authSource,
          verifiedAt: verificationState.verifiedAt || nowIso(),
          lastError: "",
        }
      : Object.keys(verificationState).length > 0
        ? verificationState
        : {
            status: "pending",
            requestedAt: nowIso(),
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
      managementKey: nextManagementKey,
    };
    const verificationChanged =
      (verificationState.status || "") !== (nextVerification.status || "") ||
      (verificationState.source || "") !== (nextVerification.source || "") ||
      (verificationState.verifiedAt || "") !==
        (nextVerification.verifiedAt || "") ||
      (verificationState.requestedAt || "") !==
        (nextVerification.requestedAt || "") ||
      (verificationState.lastError || "") !==
        (nextVerification.lastError || "");
    const needsBootstrapSync =
      !existing ||
      (existing.name || "") !== basePayload.name ||
      normalizeEmail(existing.email) !== basePayload.email ||
      existing.isActive !== true ||
      (existing.authUid || "") !== basePayload.authUid ||
      Boolean(existing.emailVerified) !== basePayload.emailVerified ||
      verificationChanged ||
      (existing.linkedManagerId || "") !== basePayload.linkedManagerId ||
      (existing.linkedEditorId || "") !== basePayload.linkedEditorId ||
      (existing.managementKey || "") !== basePayload.managementKey ||
      (existing.role || "") !== nextRole;
    if (!needsBootstrapSync) return;
    const stamp = nowIso();
    if (existing) {
      updateDoc(dataDoc("users", existing.id), {
        ...basePayload,
        role: nextRole,
        updatedAt: stamp,
        lastSeenAt: stamp,
      }).catch(() => {});
      return;
    }
    setDoc(
      dataDoc("users", targetId),
      {
        ...basePayload,
        role: nextRole,
        createdAt: stamp,
        updatedAt: stamp,
        lastSeenAt: stamp,
      },
      { merge: true },
    ).catch(() => {});
  }, [
    db,
    user,
    authEmail,
    usersLoaded,
    appUsers,
    privilegedUsers.length,
    managers,
    editors,
  ]);

  useEffect(() => {
    if (!currentUserProfile) return;
    if (profileBlocked || !canAccessView(currentUserProfile, view)) {
      setView("dashboard");
      localStorage.setItem("cluster_os_view", "dashboard");
    }
  }, [currentUserProfile, profileBlocked, view]);

  // Notificaciones locales para tareas asignadas al usuario.
  useEffect(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined")
      return;
    if (!currentUserProfile?.id || profileBlocked) return;

    const NOTIF_KEY = "cluster_browser_task_notifications_v1";
    const HOUR = 3600000;

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
        void 0;
      }
    };

    const tryRequestPermission = () => {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
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
        assigned: (task) =>
          isTaskAssignedToProfile(task, currentUserProfile, [
            currentUserProfile?.linkedManagerId,
          ]),
      },
      {
        collectionType: "editingTask",
        tasks: editingTasks,
        label: "Edicion",
        view: "editions",
        defaultTime: "18:00",
        done: isEditingDelivered,
        assigned: (task) =>
          isTaskAssignedToProfile(task, currentUserProfile, [
            currentUserProfile?.linkedEditorId,
          ]),
      },
      {
        collectionType: "managementTask",
        tasks: managementTasks,
        label: "Gestion",
        view: "management-room",
        defaultTime: "",
        done: (task) => task.status === "cerrado",
        assigned: (task) =>
          isTaskAssignedToProfile(task, currentUserProfile, [
            currentUserProfile?.id,
          ]),
      },
    ];

    const fireNotification = (task, config, stage, dueMs) => {
      if (Notification.permission !== "granted") return;
      const titleMap = {
        "8h": "⏰ Tarea proxima a vencer (8h)",
        overdue: "Tarea vencida",
        nag: "Tarea vencida hace mas de 24h",
      };
      const client = clients.find((c) => c.id === task.clientId);
      const notificationTitle =
        stage === "8h"
          ? `Tarea de ${config.label} proxima a vencer (8h)`
          : stage === "overdue"
            ? `Tarea de ${config.label} vencida`
            : `Tarea de ${config.label} vencida hace mas de 24h`;
      const body = [
        task.title,
        task.time
          ? `Hora limite: ${task.time}`
          : config.defaultTime
            ? `Hora limite: ${config.defaultTime}`
            : "",
        client ? `Cliente: ${client.name}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      try {
        const notif = new Notification(
          notificationTitle || titleMap[stage] || `Tarea de ${config.label}`,
          {
            body,
            tag: `cluster-task-${config.collectionType}-${task.id}-${stage}`,
            requireInteraction: stage === "overdue" || stage === "nag",
          },
        );
        notif.onclick = () => {
          window.focus();
          setView(config.view);
          localStorage.setItem("cluster_os_view", config.view);
          notif.close();
        };
      } catch {
        void 0;
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
          const dueTime = /^\d{2}:\d{2}$/.test(task.time || "")
            ? task.time
            : config.defaultTime;
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
          } else if (
            diff <= 0 &&
            seen.overdue &&
            now - (seen.nag || seen.overdue) >= 24 * HOUR
          ) {
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
    const interval = window.setInterval(scan, 60000);
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
    clients,
  ]);

  useEffect(() => {
    if (
      !db ||
      !currentUserProfile ||
      profileBlocked ||
      isFlushingPendingTaskStatusesRef.current
    )
      return;

    const flushPendingTaskStatusUpdates = async () => {
      const queuedItems = readPendingTaskStatusUpdates();
      if (queuedItems.length === 0) return;

      isFlushingPendingTaskStatusesRef.current = true;
      try {
        const latestByTask = new Map();
        queuedItems.forEach((item) => {
          latestByTask.set(`${item.collectionName}:${item.taskId}`, item);
        });

        for (const item of latestByTask.values()) {
          const permissionByCollection = {
            account_tasks: "manage_account_tasks",
            editing: "manage_editing_tasks",
            management_tasks: "manage_management_tasks",
          };
          const requiredPermission =
            permissionByCollection[item.collectionName];
          if (
            !requiredPermission ||
            !userHasPermission(currentUserProfile, requiredPermission)
          )
            continue;

          try {
            await updateDoc(dataDoc(item.collectionName, item.taskId), {
              status: item.status,
              updatedAt: item.updatedAt || nowIso(),
              ...(item.patch || {}),
            });
            clearPendingTaskStatusUpdate({
              collectionName: item.collectionName,
              taskId: item.taskId,
            });
          } catch (error) {
            console.error(
              "No se pudo sincronizar el cambio de estado pendiente:",
              error,
            );
            if (!shouldRetryTaskStatusUpdate(error)) {
              clearPendingTaskStatusUpdate({
                collectionName: item.collectionName,
                taskId: item.taskId,
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
          error,
        );
      });
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [db, currentUserProfile, profileBlocked]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!user || !db) return;
    if (["reports", "general-calendar", "calendar"].includes(view)) {
      handleLoadTaskHistory();
    }
  }, [view, user, db]);

  const closeModal = () =>
    setModalConfig({ isOpen: false, type: null, data: null, isEdit: false });
  const closeDelete = () =>
    setDeleteConfirm({ isOpen: false, type: null, id: null, title: "" });

  const auditAction = async ({
    action,
    entityType,
    entityId = "",
    description = "",
    status = "success",
    changes = null,
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
          role: currentUserProfile?.role || "viewer",
        },
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
      changes: { permission },
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
    afterSuccess,
  }) => {
    if (!(await ensurePermission(permission, description))) return null;
    try {
      const result = await execute();
      await auditAction({
        action,
        entityType,
        entityId: entityId || result?.id || "",
        description,
        changes,
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
        changes: { ...(changes || {}), error: error.message },
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
    afterSuccess,
  }) => {
    if (!task?.id || !newStatus || !collectionName) return null;
    if (!(await ensurePermission(permission, description))) return null;

    const stamp = nowIso();
    const patch =
      typeof statusPatch === "function"
        ? statusPatch(stamp)
        : statusPatch || {};
    const mutationId = queuePendingTaskStatusUpdate({
      collectionName,
      taskId: task.id,
      status: newStatus,
      updatedAt: stamp,
      patch,
    });

    try {
      await updateDoc(dataDoc(collectionName, task.id), {
        status: newStatus,
        updatedAt: stamp,
        ...patch,
      });
      clearPendingTaskStatusUpdate({
        collectionName,
        taskId: task.id,
        mutationId,
      });
      await auditAction({
        action: "status_change",
        entityType,
        entityId: task.id,
        description,
        changes,
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
          mutationId,
        });
      }
      showToast(
        shouldRetry
          ? "Cambio pendiente de sincronizar. Se reintentara al recargar."
          : errorMessage,
        "error",
      );
      await auditAction({
        action: shouldRetry ? "status_change_queued" : "status_change_failed",
        entityType,
        entityId: task.id,
        description,
        status: shouldRetry ? "queued" : "error",
        changes: {
          ...(changes || {}),
          error: error.message,
          collectionName,
          queued: shouldRetry,
        },
      });
      return null;
    }
  };

  const getPreferredUserRole = (records = []) =>
    [...records].sort(
      (left, right) =>
        getUserRolePriority(right.role) - getUserRolePriority(left.role),
    )[0]?.role || "viewer";

  const mergeEmailVerificationPayload = (
    records = [],
    mergedEmail = "",
    mergedVerified = false,
  ) => {
    if (!mergedEmail) return {};
    const bestRecord =
      [...records].sort(
        (left, right) =>
          getVerificationPriority(right) - getVerificationPriority(left),
      )[0] || {};
    const currentPayload = bestRecord.emailVerification || {};
    if (mergedVerified) {
      return {
        ...currentPayload,
        status: "verified",
        source:
          currentPayload.source || (bestRecord.authUid ? "google" : "merged"),
        verifiedAt:
          currentPayload.verifiedAt || bestRecord.updatedAt || nowIso(),
      };
    }
    if (Object.keys(currentPayload).length > 0) return currentPayload;
    return {
      status: "pending",
      requestedAt: nowIso(),
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
      managementTasksSnapshot,
    ] = await Promise.all([
      getDocs(dataCollection("users")),
      getDocs(dataCollection("managers")),
      getDocs(dataCollection("editors")),
      getDocs(dataCollection("clients")),
      getDocs(dataCollection("account_tasks")),
      getDocs(dataCollection("editing")),
      getDocs(dataCollection("management_tasks")),
    ]);

    const usersList = usersSnapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }));
    const managersList = managersSnapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }));
    const editorsList = editorsSnapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }));
    const clientsList = clientsSnapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }));
    const accountTasksList = accountTasksSnapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }));
    const editingTasksList = editingTasksSnapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }));
    const managementTasksList = managementTasksSnapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }));

    const duplicateGroups = buildDuplicateUserGroups(usersList);
    const signature = duplicateGroups
      .map((group) =>
        group
          .map((item) => item.id)
          .sort()
          .join(","),
      )
      .sort()
      .join("|");

    if (duplicateGroups.length === 0) {
      return { changed: false, removedCount: 0, signature };
    }

    const referenceCounts = new Map();
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
        (item) => item.id !== canonicalUser.id,
      );
      if (duplicateUsers.length === 0) return;

      const managementMeta =
        group
          .filter((item) => item.role === "management")
          .map((item) => getManagementDirectoryMeta(item))
          .find(Boolean) || null;
      const mergedEmail =
        group.map((item) => normalizeEmail(item.email)).find(Boolean) || "";
      const mergedVerified = mergedEmail
        ? group.some(
            (item) =>
              item.emailVerified === true ||
              item.emailVerification?.status === "verified",
          )
        : false;
      const mergedVerification = mergeEmailVerificationPayload(
        group,
        mergedEmail,
        mergedVerified,
      );
      const canonicalPatch = {
        name:
          managementMeta?.name || canonicalUser.name || group[0]?.name || "",
        email: mergedEmail,
        role: managementMeta ? "management" : getPreferredUserRole(group),
        isActive: group.some((item) => item.isActive !== false),
        seeded: group.some((item) => item.seeded === true),
        authUid:
          canonicalUser.authUid ||
          group.find((item) => item.authUid)?.authUid ||
          "",
        emailVerified: mergedVerified,
        emailVerification: mergedVerification,
        linkedManagerId:
          canonicalUser.linkedManagerId ||
          group.find((item) => item.linkedManagerId)?.linkedManagerId ||
          "",
        linkedEditorId:
          canonicalUser.linkedEditorId ||
          group.find((item) => item.linkedEditorId)?.linkedEditorId ||
          "",
        managementKey:
          managementMeta?.directoryKey || canonicalUser.managementKey || "",
        updatedAt: stamp,
      };

      queueUpdate("users", canonicalUser.id, canonicalPatch);

      duplicateUsers.forEach((duplicateUser) => {
        managersList
          .filter((item) => item.userId === duplicateUser.id)
          .forEach((item) =>
            queueUpdate("managers", item.id, {
              userId: canonicalUser.id,
              updatedAt: stamp,
            }),
          );

        editorsList
          .filter((item) => item.userId === duplicateUser.id)
          .forEach((item) =>
            queueUpdate("editors", item.id, {
              userId: canonicalUser.id,
              updatedAt: stamp,
            }),
          );

        clientsList
          .filter((item) => item.managerUserId === duplicateUser.id)
          .forEach((item) =>
            queueUpdate("clients", item.id, {
              managerUserId: canonicalUser.id,
              updatedAt: stamp,
            }),
          );

        accountTasksList
          .filter((item) => item.assigneeUserId === duplicateUser.id)
          .forEach((item) =>
            queueUpdate("account_tasks", item.id, {
              assigneeUserId: canonicalUser.id,
              updatedAt: stamp,
            }),
          );

        editingTasksList
          .filter((item) => item.assigneeUserId === duplicateUser.id)
          .forEach((item) =>
            queueUpdate("editing", item.id, {
              assigneeUserId: canonicalUser.id,
              updatedAt: stamp,
            }),
          );

        managementTasksList
          .filter(
            (item) =>
              item.assigneeUserId === duplicateUser.id ||
              item.contextId === duplicateUser.id,
          )
          .forEach((item) => {
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
        `Directorio corregido: ${removedCount} usuarios duplicados consolidados.`,
      );
    }

    return { changed: removedCount > 0, removedCount, signature };
  };

  const syncIdentityLinks = async ({
    email,
    userId = "",
    managerId = "",
    editorId = "",
    silent = true,
  }) => {
    const normalizedEmail = normalizeEmail(email);
    if (!db || !normalizedEmail)
      return {
        changed: false,
        migratedAccountTasks: 0,
        migratedEditingTasks: 0,
        linkedClients: 0,
      };

    const linkedUser = userId
      ? appUsers.find((item) => item.id === userId)
      : appUsers.find((item) => normalizeEmail(item.email) === normalizedEmail);
    const linkedManager = managerId
      ? managers.find((item) => item.id === managerId)
      : managers.find((item) => normalizeEmail(item.email) === normalizedEmail);
    const linkedEditor = editorId
      ? editors.find((item) => item.id === editorId)
      : editors.find((item) => normalizeEmail(item.email) === normalizedEmail);

    if (!linkedUser && !linkedManager && !linkedEditor) {
      return {
        changed: false,
        migratedAccountTasks: 0,
        migratedEditingTasks: 0,
        linkedClients: 0,
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
        updatedAt: stamp,
      });
      identityMutations += 1;
    }

    if (linkedEditor && linkedUser && linkedEditor.userId !== linkedUser.id) {
      queueUpdate("editors", linkedEditor.id, {
        userId: linkedUser.id,
        updatedAt: stamp,
      });
      identityMutations += 1;
    }

    if (linkedManager && linkedUser) {
      clients
        .filter(
          (client) =>
            client.managerId === linkedManager.id &&
            client.managerUserId !== linkedUser.id,
        )
        .forEach((client) => {
          queueUpdate("clients", client.id, {
            managerUserId: linkedUser.id,
            updatedAt: stamp,
          });
          linkedClients += 1;
        });

      accountTasks
        .filter(
          (task) =>
            task.contextId === linkedManager.id &&
            task.assigneeUserId !== linkedUser.id,
        )
        .forEach((task) => {
          queueUpdate("account_tasks", task.id, {
            assigneeUserId: linkedUser.id,
            updatedAt: stamp,
          });
          migratedAccountTasks += 1;
        });
    }

    if (linkedEditor && linkedUser) {
      editingTasks
        .filter(
          (task) =>
            task.contextId === linkedEditor.id &&
            task.assigneeUserId !== linkedUser.id,
        )
        .forEach((task) => {
          queueUpdate("editing", task.id, {
            assigneeUserId: linkedUser.id,
            updatedAt: stamp,
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
        linkedClients,
      };
    }

    await Promise.all(commits);

    if (!silent) {
      showToast(
        `Vinculacion completada: ${migratedAccountTasks} tareas de account y ${migratedEditingTasks} de edicion sincronizadas.`,
      );
    }

    return {
      changed:
        identityMutations > 0 ||
        linkedClients > 0 ||
        migratedAccountTasks > 0 ||
        migratedEditingTasks > 0,
      migratedAccountTasks,
      migratedEditingTasks,
      linkedClients,
    };
  };

  const requestUserVerification = async (
    userRecord,
    successMessage = "Se envio el correo de acceso",
  ) => {
    const email = normalizeEmail(userRecord?.email);
    if (!email || !userRecord?.id) {
      showToast("El usuario necesita un correo valido", "error");
      return null;
    }
    if (userRecord?.isActive === false) {
      showToast(
        "Activa el usuario antes de enviar el correo de acceso.",
        "error",
      );
      return null;
    }
    if (
      userRecord.emailVerified === true ||
      userRecord.emailVerification?.status === "verified"
    ) {
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
      execute: () =>
        sendUserEmailLink({
          userId: userRecord.id,
          email,
          userRecord,
          reason: "manual_resend",
        }),
    });
  };

  const duplicateUserSignature = buildDuplicateUserGroups(appUsers)
    .map((group) =>
      group
        .map((item) => item.id)
        .sort()
        .join(","),
    )
    .sort()
    .join("|");

  useEffect(() => {
    if (!db || !user || !usersLoaded || !duplicateUserSignature) return;
    if (
      isReconcilingUsersRef.current ||
      lastReconciledDuplicateSignatureRef.current === duplicateUserSignature
    )
      return;

    let isCancelled = false;
    isReconcilingUsersRef.current = true;

    reconcileUserDirectory()
      .then((result) => {
        if (!isCancelled) {
          lastReconciledDuplicateSignatureRef.current =
            result?.signature || duplicateUserSignature;
        }
      })
      .catch((error) => {
        console.error(
          "No se pudo reconciliar el directorio de usuarios:",
          error,
        );
      })
      .finally(() => {
        isReconcilingUsersRef.current = false;
      });

    return () => {
      isCancelled = true;
    };
  }, [db, user, usersLoaded, duplicateUserSignature]);

  useEffect(() => {
    if (
      !db ||
      !usersLoaded ||
      duplicateUserSignature ||
      hasBackfilledIdentityLinks ||
      !userHasPermission(currentUserProfile, "manage_users")
    )
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
      candidates.map((item) =>
        syncIdentityLinks({ email: item.email, userId: item.id, silent: true }),
      ),
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
    editingTasks.length,
  ]);

  useEffect(() => {
    if (
      !db ||
      !usersLoaded ||
      duplicateUserSignature ||
      !currentUserProfile?.id ||
      !authEmail
    )
      return;
    const syncSignature = [
      currentUserProfile.id,
      authEmail,
      managers.length,
      editors.length,
      clients.length,
      accountTasks.length,
      editingTasks.length,
    ].join("|");
    if (lastIdentityLinkSyncSignatureRef.current === syncSignature) return;
    lastIdentityLinkSyncSignatureRef.current = syncSignature;
    syncIdentityLinks({
      email: authEmail,
      userId: currentUserProfile.id,
      silent: true,
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
    editingTasks.length,
  ]);

  const handleNavigate = (newView) => {
    if (!canAccessView(currentUserProfile, newView) || profileBlocked) {
      ensurePermission(
        VIEW_PERMISSIONS[newView],
        `Intento de acceso a ${newView}`,
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
      description: `Abre la vista ${newView}`,
    });
  };

  const handleEventClick = (event, type) =>
    setEventAction({ isOpen: true, event, type });
  const triggerConfetti = () => {
    if (window.confetti)
      window.confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#9333ea", "#3b82f6", "#10b981", "#f59e0b"],
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
        buildEmailLinkActionCodeSettings(),
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
        description: "Cierre de sesion",
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
    (task) =>
      getEditingHierarchyId(task) === "p1" &&
      task.status !== "aprobado" &&
      task.status !== "publicado",
  ).length;
  const pendingAccounts = accountTasks.filter(
    (t) => t.status === "por_disenar",
  ).length;
  const pendingManagement = managementTasks.filter(
    (task) => task.status !== "cerrado",
  ).length;
  const totalActiveAccountTasks = accountTasks.filter(
    (t) => t.status !== "publicado",
  ).length;
  const totalActiveEditingTasks = editingTasks.filter(
    (t) => t.status !== "aprobado" && t.status !== "publicado",
  ).length;
  const totalActiveManagementTasks = managementTasks.filter(
    (t) => t.status !== "cerrado",
  ).length;
  const isAdminConfigVisible = ["super_admin", "operations"].includes(
    currentUserProfile?.role,
  );
  const isFirstTimeWorkspace =
    clients.length === 0 &&
    accountTasks.length === 0 &&
    editingTasks.length === 0 &&
    managementTasks.length === 0;
  const sidebarFooterText =
    currentUserProfile?.isActive === false
      ? "Cuenta inactiva"
      : !authEmail
        ? "Sin sesión iniciada"
        : `${currentRoleMeta.label} · ${authEmail}`;

  let allActivities = [
    ...events.map((e) => ({
      ...e,
      collectionType: "event",
      _color: "emerald",
      _icon: "CalendarIcon",
      _label: "Producción",
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
        _label: "Account",
      };
    }),
    ...editingTasks.map((t) => ({
      ...t,
      collectionType: "editingTask",
      _color: "slate",
      _icon: "Video",
      _label: "Edición",
    })),
  ];
  allActivities = [
    ...events.map((event) => ({
      ...event,
      collectionType: "event",
      _color: "emerald",
      _icon: "CalendarIcon",
      _label: "Produccion",
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
        _label: "Account",
      };
    }),
    ...editingTasks.map((task) => ({
      ...task,
      collectionType: "editingTask",
      _color: "slate",
      _icon: "Video",
      _label: "Edicion",
    })),
    ...managementTasks.map((task) => ({
      ...task,
      collectionType: "managementTask",
      _color: "violet",
      _icon: "ShieldCheck",
      _label: "Gestion",
    })),
  ];

  // Acciones Base de Datos
  const addClient = async (fd) => {
    const manager = managers.find((m) => m.id === fd.managerId);
    await runMutation({
      permission: "manage_clients",
      action: "create",
      entityType: "client",
      description: `Crea el cliente ${fd.name}`,
      changes: { name: fd.name, managerId: fd.managerId || "" },
      successMessage: "Cliente creado",
      execute: () =>
        addDoc(dataCollection("clients"), {
          ...fd,
          manager: manager ? manager.name : "",
          managerId: fd.managerId || "",
          managerUserId: manager?.userId || "",
          status: "Activo",
          createdAt: getHondurasTodayStr(),
          updatedAt: nowIso(),
        }),
      afterSuccess: closeModal,
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
      execute: () =>
        updateDoc(dataDoc("clients", id), { ...nextData, updatedAt: nowIso() }),
      afterSuccess: closeModal,
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
          updatedAt: nowIso(),
        });
        const tasksToMove = accountTasks.filter(
          (task) => task.clientId === client.id && !isAccountTaskDone(task),
        );
        await Promise.all(
          tasksToMove.map((task) =>
            updateDoc(dataDoc("account_tasks", task.id), {
              contextId: newManager.id,
              assigneeUserId: newManager.userId || "",
              updatedAt: nowIso(),
            }),
          ),
        );
      },
      errorMessage: "Error al reasignar",
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
      execute: () =>
        addDoc(dataCollection("managers"), {
          ...fd,
          email: normalizedEmail,
          color,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          userId: "",
        }),
      afterSuccess: closeModal,
    });
    if (result?.id && normalizedEmail)
      await syncIdentityLinks({
        email: normalizedEmail,
        managerId: result.id,
        silent: true,
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
      execute: () =>
        updateDoc(dataDoc("managers", id), {
          ...data,
          email: normalizedEmail,
          updatedAt: nowIso(),
        }),
      afterSuccess: closeModal,
    });
    if (result !== null && normalizedEmail)
      await syncIdentityLinks({
        email: normalizedEmail,
        managerId: id,
        silent: true,
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
      execute: () =>
        addDoc(dataCollection("editors"), {
          ...fd,
          email: normalizedEmail,
          color,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          userId: "",
        }),
      afterSuccess: closeModal,
    });
    if (result?.id && normalizedEmail)
      await syncIdentityLinks({
        email: normalizedEmail,
        editorId: result.id,
        silent: true,
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
      execute: () =>
        updateDoc(dataDoc("editors", id), {
          ...data,
          email: normalizedEmail,
          updatedAt: nowIso(),
        }),
      afterSuccess: closeModal,
    });
    if (result !== null && normalizedEmail)
      await syncIdentityLinks({
        email: normalizedEmail,
        editorId: id,
        silent: true,
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
      execute: () =>
        addDoc(dataCollection("account_tasks"), {
          ...data,
          assigneeUserId: manager?.userId || "",
          notificationsEnabled: data.notificationsEnabled !== false,
          status: "por_disenar",
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }),
      afterSuccess: closeModal,
    });
  };
  const updateAccountTask = async (id, data) => {
    const manager = managers.find((item) => item.id === data.contextId);
    const existingTask = accountTasks.find((item) => item.id === id);
    const historicalOwnerPatch =
      existingTask &&
      isAccountTaskDone(existingTask) &&
      (!existingTask.ownerAtCompletionId || !existingTask.dueDateAtCompletion)
        ? {
            ownerAtCompletionId:
              existingTask.ownerAtCompletionId || existingTask.contextId || "",
            dueDateAtCompletion:
              existingTask.dueDateAtCompletion ||
              normalizeDateOnlyString(existingTask.date),
          }
        : {};
    await runMutation({
      permission: "manage_account_tasks",
      action: "update",
      entityType: "accountTask",
      entityId: id,
      description: `Actualiza tarea de account ${id}`,
      changes: data,
      successMessage: "Guardado",
      execute: () =>
        updateDoc(dataDoc("account_tasks", id), {
          ...data,
          assigneeUserId: manager?.userId || "",
          ...historicalOwnerPatch,
          updatedAt: nowIso(),
        }),
      afterSuccess: closeModal,
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
        statusPatch: (stamp) =>
          getStatusTimestampPatch(
            task,
            newStatus,
            stamp,
            currentUserProfile?.id,
            "account",
          ),
        afterSuccess: () => {
          if (newStatus === "publicado") triggerConfetti();
        },
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
        hierarchy: data.hierarchy || getEditingHierarchyId(data),
      },
      successMessage: "Agendado",
      execute: () =>
        addDoc(dataCollection("editing"), {
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
            "editing",
          ),
          createdAt: stamp,
          updatedAt: stamp,
        }),
      afterSuccess: closeModal,
    });
  };
  const updateEditingTask = async (id, data) => {
    const editor = editors.find((item) => item.id === data.contextId);
    const existingTask = editingTasks.find((item) => item.id === id);
    const stamp = nowIso();
    const statusPatch =
      existingTask?.status &&
      data.status &&
      existingTask.status !== data.status
        ? getStatusTimestampPatch(
            existingTask,
            data.status,
            stamp,
            currentUserProfile?.id,
            "editing",
          )
        : {};
    await runMutation({
      permission: "manage_editing_tasks",
      action: "update",
      entityType: "editingTask",
      entityId: id,
      description: `Actualiza video ${id}`,
      changes: data,
      successMessage: "Guardado",
      execute: () =>
        updateDoc(dataDoc("editing", id), {
          ...data,
          hierarchy: data.hierarchy || getEditingHierarchyId(data),
          assigneeUserId: editor?.userId || "",
          ...statusPatch,
          updatedAt: stamp,
        }),
      afterSuccess: closeModal,
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
          hierarchy: getEditingHierarchyId(task),
        },
        statusPatch: (stamp) =>
          getStatusTimestampPatch(
            task,
            newStatus,
            stamp,
            currentUserProfile?.id,
            "editing",
          ),
        afterSuccess: () => {
          if (newStatus === "aprobado" || newStatus === "publicado")
            triggerConfetti();
        },
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
        "error",
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
      execute: () =>
        addDoc(dataCollection("management_tasks"), {
          ...data,
          date: normalizedDate,
          time: normalizedTime,
          assigneeUserId: member?.id || "",
          status: "pendiente",
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }),
      afterSuccess: closeModal,
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
        "error",
      );
      return;
    }
    const updatePermission = userHasPermission(
      currentUserProfile,
      "manage_management_tasks",
    )
      ? "manage_management_tasks"
      : "create_management_tasks";
    await runMutation({
      permission: updatePermission,
      action: "update",
      entityType: "managementTask",
      entityId: id,
      description: `Actualiza tarea de gestion ${id}`,
      changes: data,
      successMessage: "Guardado",
      execute: () =>
        updateDoc(dataDoc("management_tasks", id), {
          ...data,
          date: normalizedDate,
          time: normalizedTime,
          assigneeUserId: member?.id || "",
          updatedAt: nowIso(),
        }),
      afterSuccess: closeModal,
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
        statusPatch: (stamp) =>
          getStatusTimestampPatch(
            task,
            newStatus,
            stamp,
            currentUserProfile?.id,
            "management",
          ),
      });
    }
  };

  const changeTaskPriority = async (task, type, priority) => {
    const colMap = {
      accountTask: "account_tasks",
      editingTask: "editing",
      managementTask: "management_tasks",
    };
    const col = colMap[type];
    if (!col) return;
    await updateDoc(dataDoc(col, task.id), { priority, updatedAt: nowIso() });
  };

  const changeTaskAssignee = async (task, type, contextId) => {
    const colMap = {
      accountTask: "account_tasks",
      editingTask: "editing",
      managementTask: "management_tasks",
    };
    const col = colMap[type];
    if (!col) return;
    const historicalOwnerPatch =
      type === "accountTask" &&
      isAccountTaskDone(task) &&
      (!task.ownerAtCompletionId || !task.dueDateAtCompletion)
        ? {
            ownerAtCompletionId: task.ownerAtCompletionId || task.contextId || "",
            dueDateAtCompletion:
              task.dueDateAtCompletion || normalizeDateOnlyString(task.date),
          }
        : {};
    await updateDoc(dataDoc(col, task.id), {
      contextId: contextId || null,
      ...historicalOwnerPatch,
      updatedAt: nowIso(),
    });
  };

  const changeTaskAssignees = async (task, type, assigneeIds) => {
    const colMap = {
      accountTask: "account_tasks",
      editingTask: "editing",
      managementTask: "management_tasks",
    };
    const col = colMap[type];
    if (!col) return;
    await updateDoc(dataDoc(col, task.id), {
      assignees: assigneeIds,
      updatedAt: nowIso(),
    });
  };

  const sendNotification = async (payload) => {
    try {
      await apiFetch("/api/notifications/send", {
        method: "POST",
        body: JSON.stringify({ ...payload, appUrl: window.location.origin }),
      });
    } catch (e) {
      console.warn("[notify]", e.message);
    }
  };

  const addTaskComment = async (task, type, text, mentionedIds = []) => {
    const colMap = {
      accountTask: "account_tasks",
      editingTask: "editing",
      managementTask: "management_tasks",
    };
    const col = colMap[type];
    if (!col || !text) return;
    const senderName =
      currentUserProfile?.name ||
      (authEmail ? authEmail.split("@")[0] : "Usuario");
    const newComment = {
      id: Math.random().toString(36).slice(2, 10),
      text,
      authorName: senderName,
      authorId: currentUserProfile?.id || "",
      createdAt: nowIso(),
    };
    await updateDoc(dataDoc(col, task.id), {
      comments: [...(task.comments || []), newComment],
      updatedAt: nowIso(),
    });
    // Notificaciones de mención
    const allPeople = [
      ...(managementUsers || []),
      ...(managers || []),
      ...(editors || []),
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
          comment: text,
        });
      }
    }
  };

  // Publica un mensaje en el chat interno de un cliente (opcionalmente ligado a
  // una tarea) y notifica por email a los mencionados con @.
  const addClientChatMessage = async ({
    clientId,
    text,
    mentionedIds = [],
    taskRef = null,
    attachments = [],
  }) => {
    const trimmed = (text || "").trim();
    const safeAttachments = Array.isArray(attachments) ? attachments : [];
    if (!clientId || (!trimmed && safeAttachments.length === 0)) return;
    const senderName =
      currentUserProfile?.name ||
      (authEmail ? authEmail.split("@")[0] : "Usuario");
    await addDoc(dataCollection("client_chats"), {
      clientId,
      text: trimmed,
      authorName: senderName,
      authorId: currentUserProfile?.id || "",
      authorEmail: authEmail || "",
      mentionedIds,
      attachments: safeAttachments,
      taskRef: taskRef
        ? {
            taskId: taskRef.taskId || "",
            taskType: taskRef.taskType || "",
            taskTitle: taskRef.taskTitle || "",
          }
        : null,
      createdAt: nowIso(),
    });
    const client = clients.find((item) => item.id === clientId);
    const clientName = client?.name || "Cliente";
    for (const uid of mentionedIds) {
      const person = chatMentionables.find((p) => p.id === uid);
      const email = person?.email;
      if (email && uid !== (currentUserProfile?.id || "")) {
        sendNotification({
          to: email,
          type: "chat_mention",
          senderName,
          clientName,
          comment: trimmed,
        });
      }
    }
  };

  // Marca como leído el hilo de un cliente para el usuario actual.
  const markClientChatRead = (clientId) => {
    if (!clientId) return;
    const uid = currentUserProfile?.id || authEmail;
    if (!uid) return;
    setDoc(
      dataDoc("chat_reads", `${uid}__${clientId}`),
      { userId: String(uid), clientId, lastReadAt: nowIso() },
      { merge: true },
    ).catch((error) => console.warn("[chat:read]", error.message));
  };

  // Abre el chat de un cliente y lo marca como leído.
  const openClientChat = (client) => {
    setSelectedChatClient(client || null);
    if (client?.id) markClientChatRead(client.id);
  };

  const deleteClientChatMessage = (message) => {
    if (!message?.id) return;
    deleteDoc(dataDoc("client_chats", message.id)).catch((error) =>
      console.warn("[chat:delete]", error.message),
    );
  };

  // Los listados llegan sin el base64 de los adjuntos; se pide el mensaje
  // completo bajo demanda para previsualizar/descargar archivos.
  const fetchClientChatMessage = async (messageId) => {
    if (!messageId) return null;
    try {
      const snap = await getDoc(dataDoc("client_chats", messageId));
      return snap.data();
    } catch (error) {
      console.warn("[chat:fetch]", error.message);
      return null;
    }
  };

  // Abre la tarea referenciada por un mensaje del chat (o su sala si ya no está
  // cargada en memoria).
  const openTaskFromChat = (taskRef) => {
    if (!taskRef?.taskId) return;
    const listByType = {
      accountTask: accountTasks,
      editingTask: editingTasks,
      managementTask: managementTasks,
    };
    const task = (listByType[taskRef.taskType] || []).find(
      (item) => item.id === taskRef.taskId,
    );
    if (task) {
      setTaskDetailConfig({ isOpen: true, task, type: taskRef.taskType });
      return;
    }
    const viewByType = {
      accountTask: "account-room",
      editingTask: "editions",
      managementTask: "management-room",
    };
    handleNavigate(viewByType[taskRef.taskType] || "account-room");
  };

  // Personas mencionables en el chat: TODOS los usuarios de la plataforma. El
  // chat es para comunicarse con todo el equipo, no solo con los asignados al
  // cliente. Se usa el directorio del servidor (accesible a cualquier rol,
  // incluidos editores/viewers); si aún no cargó, se arma un fallback local con
  // lo que haya en memoria (usuarios + managers + editores).
  const chatMentionables = (() => {
    if (chatDirectory.length > 0) return chatDirectory;
    const seenEmail = new Set();
    const seenId = new Set();
    const result = [];
    const add = (person) => {
      const email = normalizeEmail(person?.email);
      const id = person?.id ? String(person.id) : "";
      const name = person?.name || email || "";
      if (!name && !email) return;
      if (email) {
        if (seenEmail.has(email)) return;
        seenEmail.add(email);
      } else if (id) {
        if (seenId.has(id)) return;
        seenId.add(id);
      } else {
        return;
      }
      result.push({ id: id || email, name, email });
    };
    appUsers.filter((item) => item.isActive !== false).forEach(add);
    managers.forEach(add);
    editors.forEach(add);
    return result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  })();

  // Carga el directorio de personas para @menciones (accesible a todos los roles).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    apiFetch("/api/directory")
      .then((payload) => {
        if (!cancelled && Array.isArray(payload?.people)) {
          setChatDirectory(payload.people);
        }
      })
      .catch((error) => console.warn("[chat:directory]", error.message));
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Mientras el chat de un cliente está abierto, mantenerlo marcado como leído.
  useEffect(() => {
    if (view !== "chat" || !selectedChatClient?.id) return;
    markClientChatRead(selectedChatClient.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedChatClient?.id, clientChats]);

  // Notificación del navegador cuando te mencionan en el chat.
  useEffect(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined")
      return;
    const myId = String(currentUserProfile?.id || "");
    if (!myId) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    if (Notification.permission !== "granted") return;

    const STORAGE_KEY = "cluster_chat_notifications_v1";
    let notified = [];
    try {
      notified = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      notified = [];
    }
    const notifiedSet = new Set(notified);
    let changed = false;

    clientChats.forEach((message) => {
      if (!message.id || notifiedSet.has(message.id)) return;
      if (String(message.authorId || "") === myId) return;
      const mentionsMe =
        Array.isArray(message.mentionedIds) &&
        message.mentionedIds.includes(myId);
      if (!mentionsMe) return;
      // Solo mensajes recientes (evita ráfaga la primera vez que se cargan).
      const age = Date.now() - new Date(message.createdAt || 0).getTime();
      if (age >= 0 && age < 15 * 60 * 1000) {
        const client = clients.find((item) => item.id === message.clientId);
        try {
          const notif = new Notification(
            `💬 Chat · ${client?.name || "Cliente"}`,
            {
              body: `${message.authorName || "Alguien"}: ${message.text}`,
              tag: `chat-${message.id}`,
            },
          );
          notif.onclick = () => {
            window.focus();
            if (client) openClientChat(client);
            handleNavigate("chat");
            notif.close();
          };
        } catch {
          /* noop */
        }
      }
      notifiedSet.add(message.id);
      changed = true;
    });

    if (changed) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify([...notifiedSet].slice(-500)),
        );
      } catch {
        /* noop */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientChats, currentUserProfile]);

  const addTaskTimeEntry = async (task, type, durationMs) => {
    const colMap = {
      accountTask: "account_tasks",
      editingTask: "editing",
      managementTask: "management_tasks",
    };
    const col = colMap[type];
    if (!col || !durationMs || durationMs < 1000) return;
    const newEntry = {
      id: Math.random().toString(36).slice(2, 10),
      durationMs,
      authorName:
        currentUserProfile?.name ||
        (authEmail ? authEmail.split("@")[0] : "Usuario"),
      authorId: currentUserProfile?.id || "",
      loggedAt: nowIso(),
    };
    await updateDoc(dataDoc(col, task.id), {
      timeEntries: [...(task.timeEntries || []), newEntry],
      updatedAt: nowIso(),
    });
  };

  const updateTaskChecklist = async (task, type, checklist) => {
    const colMap = {
      accountTask: "account_tasks",
      editingTask: "editing",
      managementTask: "management_tasks",
    };
    const col = colMap[type];
    if (!col) return;
    await updateDoc(dataDoc(col, task.id), { checklist, updatedAt: nowIso() });
  };

  const addTaskAttachment = async (task, type, file) => {
    const colMap = {
      accountTask: "account_tasks",
      editingTask: "editing",
      managementTask: "management_tasks",
    };
    const col = colMap[type];
    if (!col || !file) return;
    const MAX_SIZE = 8 * 1024 * 1024; // 8 MB
    if (file.size > MAX_SIZE) {
      alert("El archivo es demasiado grande (máx. 8 MB)");
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
      uploadedBy:
        currentUserProfile?.name ||
        (authEmail ? authEmail.split("@")[0] : "Usuario"),
      uploadedAt: nowIso(),
    };
    // El listado con polling llega sin el base64 de los adjuntos existentes
    // (ver stripAttachmentData en el backend), asi que se relee el registro
    // completo antes de escribir para no perder los archivos ya guardados.
    const currentSnap = await getDoc(dataDoc(col, task.id));
    const currentAttachments = currentSnap.data()?.attachments || [];
    await updateDoc(dataDoc(col, task.id), {
      attachments: [...currentAttachments, newAttachment],
      updatedAt: nowIso(),
    });
  };

  const removeTaskAttachment = async (task, type, attachmentId) => {
    const colMap = {
      accountTask: "account_tasks",
      editingTask: "editing",
      managementTask: "management_tasks",
    };
    const col = colMap[type];
    if (!col) return;
    const currentSnap = await getDoc(dataDoc(col, task.id));
    const currentAttachments = currentSnap.data()?.attachments || [];
    await updateDoc(dataDoc(col, task.id), {
      attachments: currentAttachments.filter((a) => a.id !== attachmentId),
      updatedAt: nowIso(),
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
      execute: () =>
        addDoc(dataCollection("events"), {
          ...data,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }),
      afterSuccess: closeModal,
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
      execute: () =>
        updateDoc(dataDoc("events", id), { ...data, updatedAt: nowIso() }),
      afterSuccess: closeModal,
    });
  };

  const addUserRecord = async (data) => {
    const email = normalizeEmail(data.email);
    const requestedRole = data.role || "viewer";
    const nextActive = data.isActive !== false;
    const managementKey =
      requestedRole === "management"
        ? getManagementDirectoryKey(data.name)
        : "";
    const existingManagementUser = managementKey
      ? chooseCanonicalUserRecord(
          appUsers.filter(
            (item) =>
              item.role === "management" &&
              (item.managementKey || getManagementDirectoryKey(item)) ===
                managementKey,
          ),
        )
      : null;
    if (!email) {
      showToast("El correo es obligatorio", "error");
      return;
    }
    if (existingManagementUser) {
      await updateUserRecord(existingManagementUser.id, {
        ...data,
        role: "management",
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
      lastError: "",
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
        isActive: data.isActive,
      },
      successMessage: null,
      execute: () =>
        addDoc(dataCollection("users"), {
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
          linkedEditorId: "",
        }),
      afterSuccess: closeModal,
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
            emailVerification: pendingVerification,
          },
          reason: "user_created",
        });
        showToast("Usuario creado y correo de acceso enviado.");
      } catch (error) {
        console.error(error);
        showToast(
          "Usuario creado, pero no se pudo enviar el correo de acceso.",
          "error",
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
    if (
      appUsers.some(
        (item) => item.id !== id && normalizeEmail(item.email) === email,
      )
    ) {
      showToast("Ese correo ya esta en uso", "error");
      return;
    }
    const current = appUsers.find((item) => item.id === id);
    const nextRole = data.role || current?.role || "viewer";
    const nextManagementKey =
      nextRole === "management"
        ? getManagementDirectoryKey(data.name || current?.name || "")
        : "";
    const nextActive = data.isActive !== false;
    const emailChanged = email !== normalizeEmail(current?.email);
    if (
      privilegedUsers.length === 1 &&
      privilegedUsers[0].id === id &&
      (!["super_admin", "operations"].includes(nextRole) || !nextActive)
    ) {
      showToast(
        "Debe existir al menos un usuario administrador activo",
        "error",
      );
      return;
    }
    const nextVerification = emailChanged
      ? {
          ...(current?.emailVerification || {}),
          status: "pending",
          source: "email_link",
          requestedAt: nowIso(),
          sentAt: "",
          failedAt: "",
          verifiedAt: "",
          lastRecipient: email,
          lastError: "",
        }
      : current?.emailVerification || {};
    const nextEmailVerified = emailChanged
      ? false
      : current?.emailVerified === true;
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
        emailChanged,
      },
      successMessage: emailChanged ? null : "Usuario actualizado",
      execute: () =>
        updateDoc(dataDoc("users", id), {
          name: data.name,
          email,
          role: nextRole,
          managementKey: nextManagementKey,
          isActive: nextActive,
          profession: data.profession || "",
          photo: data.photo || "",
          emailVerified: nextEmailVerified,
          emailVerification: nextVerification,
          updatedAt: nowIso(),
        }),
      afterSuccess: closeModal,
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
          ...(current || {}),
          name: data.name,
          email,
          role: nextRole,
          isActive: nextActive,
          emailVerification: nextVerification,
        },
        reason: "email_changed",
      });
      showToast("Usuario actualizado y correo de acceso enviado.");
    } catch (error) {
      console.error(error);
      showToast(
        "Usuario actualizado, pero no se pudo enviar el correo de acceso.",
        "error",
      );
    }
  };

  // Edición del perfil propio: cualquier usuario activo puede cambiar su
  // nombre, profesión y foto (el backend limita los campos permitidos).
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
      execute: () =>
        updateDoc(dataDoc("users", currentUserProfile.id), {
          name: data.name || currentUserProfile.name || "",
          profession: data.profession || "",
          photo: data.photo || "",
          updatedAt: nowIso(),
        }),
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
        },
      },
      manager: {
        collection: "managers",
        permission: "manage_managers",
        entityType: "manager",
        after: () => {
          setView("managers");
          setSelectedManager(null);
        },
      },
      editor: {
        collection: "editors",
        permission: "manage_editors",
        entityType: "editor",
        after: () => {
          setView("editors");
          setSelectedEditor(null);
        },
      },
      event: {
        collection: "events",
        permission: "manage_calendar",
        entityType: "event",
      },
      accountTask: {
        collection: "account_tasks",
        permission: "manage_account_tasks",
        entityType: "accountTask",
      },
      editingTask: {
        collection: "editing",
        permission: "manage_editing_tasks",
        entityType: "editingTask",
      },
      managementTask: {
        collection: "management_tasks",
        permission: "manage_management_tasks",
        entityType: "managementTask",
      },
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
      },
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

  if (loading) return <AppShellSkeleton />;

  if (!authEmail) {
    return (
      <>
        <LoginScreen
          isDark={isDark}
          onToggleTheme={() => setIsDark(!isDark)}
          onGoogleSignIn={handleGoogleSignIn}
          isSigningIn={isSigningIn}
          email={loginEmail}
          onEmailChange={setLoginEmail}
          onEmailSubmit={handleEmailLinkSignIn}
          isSendingLoginLink={isSendingLoginLink}
        />
        <div
          aria-live="polite"
          aria-atomic="true"
          className="fixed bottom-6 right-6 z-[110] pointer-events-none"
        >
          {toast && <Toast message={toast.message} type={toast.type} />}
        </div>
      </>
    );
  }

  return (
    <div className="app-shell flex h-screen overflow-hidden flex-col md:flex-row transition-colors duration-300">
      {/* Header Móvil */}
      <div className="app-sidebar md:hidden border-b p-4 flex justify-between items-center z-30 shrink-0">
        <div className="flex items-center gap-2">
          <AgencyLogo className="w-8 h-8 text-sm" />
          <span className="brand-name text-lg font-bold text-slate-800 dark:text-white">
            CLUSTER
          </span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={
            isMobileMenuOpen ? "Cerrar navegación" : "Abrir navegación"
          }
          aria-expanded={isMobileMenuOpen}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
        >
          <Icon name={isMobileMenuOpen ? "X" : "Menu"} size={24} />
        </button>
      </div>

      <div
        className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity md:hidden ${isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`app-sidebar fixed md:relative z-50 h-full border-r flex flex-col w-60 shrink-0 transition-transform duration-300 top-0 left-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="px-5 pt-6 pb-3 hidden md:block">
          <div className="flex items-center gap-3">
            <AgencyLogo className="w-9 h-9 text-lg" />
            <div className="leading-none">
              <h1 className="brand-name text-xl font-bold text-slate-800 dark:text-white">
                CLUSTER
              </h1>
              <p className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-widest mt-1">
                Agency OS
              </p>
            </div>
          </div>
        </div>

        <nav
          className="flex-1 px-4 space-y-1 pt-20 md:pt-4 overflow-y-auto custom-scroll"
          aria-label="Navegación principal"
        >
          <div className="pt-1 pb-2 pl-4 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Principal
          </div>
          {canAccessView(currentUserProfile, "dashboard") && (
            <SidebarItem
              active={view === "dashboard"}
              onClick={() => handleNavigate("dashboard")}
              icon="LayoutDashboard"
              label="Panel Central"
              color="purple"
            />
          )}

          <div className="pt-4 pb-2 pl-4 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">
            Clientes & equipo
          </div>
          {canAccessView(currentUserProfile, "clients") && (
            <SidebarItem
              active={view === "clients" || view === "client-detail"}
              onClick={() => handleNavigate("clients")}
              icon="Briefcase"
              label="Clientes"
              color="blue"
            />
          )}
          {(canAccessView(currentUserProfile, "managers") ||
            canAccessView(currentUserProfile, "editors")) && (
            <SidebarItem
              active={[
                "managers",
                "manager-detail",
                "editors",
                "editor-detail",
              ].includes(view)}
              onClick={() =>
                handleNavigate(
                  canAccessView(currentUserProfile, "managers")
                    ? "managers"
                    : "editors",
                )
              }
              icon="Users"
              label="Equipo"
              color="slate"
            />
          )}
          {canAccessView(currentUserProfile, "chat") && (
            <SidebarItem
              active={view === "chat"}
              onClick={() => handleNavigate("chat")}
              icon="MessageSquare"
              label="Chat"
              color="blue"
              badge={chatUnread.total > 0 ? chatUnread.total : null}
            />
          )}

          <div className="pt-4 pb-2 pl-4 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">
            Salas de trabajo
          </div>
          {canAccessView(currentUserProfile, "account-room") && (
            <SidebarItem
              active={view === "account-room"}
              onClick={() => handleNavigate("account-room")}
              icon="LayoutList"
              label="Sala de Accounts"
              color="indigo"
              badge={
                totalActiveAccountTasks > 0 ? totalActiveAccountTasks : null
              }
              badgeColor={
                pendingAccounts > 0
                  ? "bg-indigo-500 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }
            />
          )}
          {canAccessView(currentUserProfile, "management-room") && (
            <SidebarItem
              active={view === "management-room"}
              onClick={() => handleNavigate("management-room")}
              icon="ShieldCheck"
              label="Sala de Gestión"
              color="violet"
              badge={
                totalActiveManagementTasks > 0
                  ? totalActiveManagementTasks
                  : null
              }
              badgeColor={
                pendingManagement > 0
                  ? "bg-violet-500 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }
            />
          )}
          {canAccessView(currentUserProfile, "editions") && (
            <SidebarItem
              active={view === "editions"}
              onClick={() => handleNavigate("editions")}
              icon="Video"
              label="Sala de Edición"
              color="amber"
              badge={
                totalActiveEditingTasks > 0 ? totalActiveEditingTasks : null
              }
              badgeColor={
                urgentEditions > 0
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }
            />
          )}

          <div className="pt-4 pb-2 pl-4 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">
            Calendario
          </div>
          {(canAccessView(currentUserProfile, "general-calendar") ||
            canAccessView(currentUserProfile, "calendar")) && (
            <SidebarItem
              active={["general-calendar", "calendar"].includes(view)}
              onClick={() =>
                handleNavigate(
                  canAccessView(currentUserProfile, "general-calendar")
                    ? "general-calendar"
                    : "calendar",
                )
              }
              icon="CalendarDays"
              label="Calendario"
              color="slate"
            />
          )}
          {canAccessView(currentUserProfile, "reports") && (
            <SidebarItem
              active={view === "reports"}
              onClick={() => handleNavigate("reports")}
              icon="BarChart3"
              label="Reportes"
              color="emerald"
            />
          )}
          {canAccessView(currentUserProfile, "performance") && (
            <SidebarItem
              active={view === "performance"}
              onClick={() => handleNavigate("performance")}
              icon="BarChart3"
              label="Rendimiento"
              color="emerald"
            />
          )}

          {currentUserProfile && (
            <>
              <div className="pt-4 pb-2 pl-4 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">
                Configuración
              </div>
              <SidebarItem
                active={view === "settings"}
                onClick={() => handleNavigate("settings")}
                icon="User"
                label="Mi Perfil"
                color="purple"
              />
              {isAdminConfigVisible &&
                canAccessView(currentUserProfile, "control-center") && (
                  <SidebarItem
                    active={view === "control-center"}
                    onClick={() => handleNavigate("control-center")}
                    icon="ClipboardList"
                    label="Usuarios y accesos"
                    color="purple"
                  />
                )}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
          <button
            type="button"
            onClick={() => handleNavigate("settings")}
            aria-label="Editar mi perfil"
            className="w-full flex items-center gap-3 p-1 -m-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors text-left"
          >
            {currentUserProfile?.photo ? (
              <img
                src={currentUserProfile.photo}
                alt={currentUserProfile?.name || "Perfil"}
                className="w-10 h-10 rounded-full object-cover border border-black/5 dark:border-white/10 shrink-0"
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${profileBlocked ? "bg-[#9f2f2d]" : "bg-[#555552]"}`}
              >
                {(currentUserProfile?.name || "IN").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                {currentUserProfile?.name || "Invitado"}
              </p>
              {currentUserProfile?.profession && (
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                  {currentUserProfile.profession}
                </p>
              )}
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase truncate">
                {sidebarFooterText}
              </p>
            </div>
            <Icon
              name="ChevronRight"
              size={16}
              className="text-slate-400 dark:text-slate-500 shrink-0"
            />
          </button>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${
                profileBlocked
                  ? "bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                  : currentVerificationMeta.color === "emerald"
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : currentVerificationMeta.color === "amber"
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                      : currentVerificationMeta.color === "blue"
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {profileBlocked
                ? "Bloqueado"
                : authEmail
                  ? currentVerificationMeta.label
                  : "Invitado"}
            </span>
            <button
              onClick={() => setIsDark(!isDark)}
              aria-label={
                isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
              }
              title={isDark ? "Modo claro" : "Modo oscuro"}
              className="ml-auto p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300"
            >
              <Icon name={isDark ? "Sun" : "Moon"} size={16} />
            </button>
            {authEmail ? (
              <button
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300"
              >
                <Icon name="LogOut" size={16} />
              </button>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                aria-label="Iniciar sesión"
                title="Iniciar sesión"
                className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 disabled:opacity-60"
              >
                <Icon
                  name={isSigningIn ? "Loader2" : "LogIn"}
                  size={16}
                  className={isSigningIn ? "animate-spin" : ""}
                />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Vistas Principales */}
      <main
        className={`app-main flex-1 relative w-full h-full ${view === "chat" ? "overflow-hidden" : "overflow-y-auto"}`}
      >
        <div
          className={
            view === "chat"
              ? "h-full"
              : "p-4 md:p-8 max-w-[1360px] mx-auto min-h-full pb-mobile-nav md:pb-20"
          }
        >
          {view === "dashboard" &&
            (isFirstTimeWorkspace ? (
              <FirstTimeView
                role={currentUserProfile?.role}
                onNavigate={handleNavigate}
              />
            ) : (
              <DashboardView
                clients={clients}
                managers={managers}
                users={appUsers}
                events={events}
                tasks={editingTasks}
                accountTasks={accountTasks}
                managementTasks={managementTasks}
                currentUserProfile={currentUserProfile}
                onSignIn={handleGoogleSignIn}
                onNavigate={handleNavigate}
                onOpenTask={(task, type) =>
                  setTaskDetailConfig({
                    isOpen: true,
                    task,
                    type,
                  })
                }
              />
            ))}
          {view === "clients" && (
            <ClientsView
              clients={clients}
              managers={managers}
              legacyColorMap={LEGACY_COLOR_MAP}
              onReassignManager={reassignClientManager}
              onAdd={() => setModalConfig({ isOpen: true, type: "client" })}
              onSelect={(c) => {
                setSelectedClient(c);
                handleNavigate("client-detail");
              }}
            />
          )}
          {view === "client-detail" && selectedClient && (
            <ClientDetail
              client={selectedClient}
              managers={managers}
              legacyColorMap={LEGACY_COLOR_MAP}
              onReassignManager={reassignClientManager}
              onBack={() => handleNavigate("clients")}
              onUpdate={updateClient}
              onDelete={() =>
                setDeleteConfirm({
                  isOpen: true,
                  type: "client",
                  id: selectedClient.id,
                  title: selectedClient.name,
                })
              }
              onEdit={() =>
                setModalConfig({
                  isOpen: true,
                  type: "client",
                  data: selectedClient,
                  isEdit: true,
                })
              }
              chatUnread={chatUnread.byClient?.[selectedClient.id] || 0}
              onOpenChat={() => {
                openClientChat(selectedClient);
                handleNavigate("chat");
              }}
            />
          )}
          {view === "chat" && (
            <ClientChatView
              clients={clients}
              clientChats={clientChats}
              chatUnread={chatUnread}
              activeClient={selectedChatClient}
              onSelectClient={openClientChat}
              onSendMessage={addClientChatMessage}
              onOpenTask={openTaskFromChat}
              onDeleteMessage={deleteClientChatMessage}
              currentUserProfile={currentUserProfile}
              canModerate={userHasPermission(
                currentUserProfile,
                "moderate_client_chat",
              )}
              mentionables={chatMentionables}
              accountTasks={accountTasks}
              editingTasks={editingTasks}
              managementTasks={managementTasks}
              fetchFullMessage={fetchClientChatMessage}
            />
          )}
          {view === "managers" && (
            <div className="space-y-4">
              <ViewTabs
                active="managers"
                onChange={handleNavigate}
                items={[
                  canAccessView(currentUserProfile, "managers") && {
                    id: "managers",
                    label: "Accounts",
                  },
                  canAccessView(currentUserProfile, "editors") && {
                    id: "editors",
                    label: "Editores",
                  },
                ].filter(Boolean)}
              />
              <TeamView
                title="Account Managers"
                team={managers}
                iconColor="indigo"
                onAdd={() => setModalConfig({ isOpen: true, type: "manager" })}
                onSelect={(m) => {
                  setSelectedManager(m);
                  handleNavigate("manager-detail");
                }}
                onDelete={(m) =>
                  setDeleteConfirm({
                    isOpen: true,
                    type: "manager",
                    id: m.id,
                    title: m.name,
                  })
                }
                onEdit={(m) =>
                  setModalConfig({
                    isOpen: true,
                    type: "manager",
                    data: m,
                    isEdit: true,
                  })
                }
              />
            </div>
          )}
          {view === "manager-detail" && selectedManager && (
            <PersonCalendarDetail
              person={selectedManager}
              tasks={accountTasks}
              title="Planificación de Cuentas"
              baseColor={
                LEGACY_COLOR_MAP[selectedManager.color] ||
                selectedManager.color ||
                "indigo"
              }
              onBack={() => handleNavigate("managers")}
              onAddEvent={(dateStr) =>
                setModalConfig({
                  isOpen: true,
                  type: "accountTask",
                  data: { date: dateStr, contextId: selectedManager.id },
                })
              }
              onEventClick={(e) => handleEventClick(e, "accountTask")}
            />
          )}
          {view === "editors" && (
            <div className="space-y-4">
              <ViewTabs
                active="editors"
                onChange={handleNavigate}
                items={[
                  canAccessView(currentUserProfile, "managers") && {
                    id: "managers",
                    label: "Accounts",
                  },
                  canAccessView(currentUserProfile, "editors") && {
                    id: "editors",
                    label: "Editores",
                  },
                ].filter(Boolean)}
              />
              <TeamView
                title="Editores"
                team={editors}
                iconColor="rose"
                onAdd={() => setModalConfig({ isOpen: true, type: "editor" })}
                onSelect={(e) => {
                  setSelectedEditor(e);
                  handleNavigate("editor-detail");
                }}
                onDelete={(e) =>
                  setDeleteConfirm({
                    isOpen: true,
                    type: "editor",
                    id: e.id,
                    title: e.name,
                  })
                }
                onEdit={(e) =>
                  setModalConfig({
                    isOpen: true,
                    type: "editor",
                    data: e,
                    isEdit: true,
                  })
                }
              />
            </div>
          )}
          {view === "editor-detail" && selectedEditor && (
            <PersonCalendarDetail
              person={selectedEditor}
              tasks={editingTasks}
              title="Planificación de Edición"
              baseColor={selectedEditor.color || "rose"}
              onBack={() => handleNavigate("editors")}
              onAddEvent={(dateStr) =>
                setModalConfig({
                  isOpen: true,
                  type: "editingTask",
                  data: { date: dateStr, contextId: selectedEditor.id },
                })
              }
              onEventClick={(e) => handleEventClick(e, "editingTask")}
            />
          )}
          {view === "account-room" && (
            <AccountRoomView
              tasks={accountTasks}
              managers={managers}
              clients={clients}
              currentUserProfile={currentUserProfile}
              onAdd={(dateStr) =>
                setModalConfig({
                  isOpen: true,
                  type: "accountTask",
                  data: { date: dateStr },
                })
              }
              onEdit={(task) =>
                setModalConfig({
                  isOpen: true,
                  type: "accountTask",
                  data: task,
                  isEdit: true,
                })
              }
              onChangeStatus={changeAccountTaskStatus}
              onDelete={(id) =>
                setDeleteConfirm({
                  isOpen: true,
                  type: "accountTask",
                  id,
                  title: "Tarea",
                })
              }
              onTaskClick={(t) =>
                setTaskDetailConfig({
                  isOpen: true,
                  task: t,
                  type: "accountTask",
                })
              }
              onLoadHistory={handleLoadTaskHistory}
              historyLoaded={taskHistoryLoaded}
              historyLoading={isLoadingTaskHistory}
              legacyColorMap={LEGACY_COLOR_MAP}
            />
          )}
          {view === "editions" && (
            <EditionsRoomView
              tasks={editingTasks}
              editors={editors}
              clients={clients}
              currentUserProfile={currentUserProfile}
              onAdd={(dateStr) =>
                setModalConfig({
                  isOpen: true,
                  type: "editingTask",
                  data: { date: dateStr },
                })
              }
              onEdit={(task) =>
                setModalConfig({
                  isOpen: true,
                  type: "editingTask",
                  data: task,
                  isEdit: true,
                })
              }
              onChangeStatus={changeEditingTaskStatus}
              onDelete={(id) =>
                setDeleteConfirm({
                  isOpen: true,
                  type: "editingTask",
                  id,
                  title: "Tarea",
                })
              }
              onTaskClick={(t) =>
                setTaskDetailConfig({
                  isOpen: true,
                  task: t,
                  type: "editingTask",
                })
              }
              onLoadHistory={handleLoadTaskHistory}
              historyLoaded={taskHistoryLoaded}
              historyLoading={isLoadingTaskHistory}
            />
          )}
          {view === "management-room" && (
            <ManagementRoomView
              tasks={managementTasks}
              members={managementUsers}
              clients={clients}
              currentUserProfile={currentUserProfile}
              onAdd={(dateStr) =>
                setModalConfig({
                  isOpen: true,
                  type: "managementTask",
                  data: {
                    date: dateStr,
                    contextId: defaultManagementAssigneeId,
                  },
                })
              }
              onEdit={(task) =>
                setModalConfig({
                  isOpen: true,
                  type: "managementTask",
                  data: task,
                  isEdit: true,
                })
              }
              onChangeStatus={changeManagementTaskStatus}
              onDelete={(id) =>
                setDeleteConfirm({
                  isOpen: true,
                  type: "managementTask",
                  id,
                  title: "Tarea de gestion",
                })
              }
              onTaskClick={(t) =>
                setTaskDetailConfig({
                  isOpen: true,
                  task: t,
                  type: "managementTask",
                })
              }
              onLoadHistory={handleLoadTaskHistory}
              historyLoaded={taskHistoryLoaded}
              historyLoading={isLoadingTaskHistory}
            />
          )}
          {view === "control-center" && (
            <UsersAccessView
              users={appUsers}
              managers={managers}
              editors={editors}
              auditLogs={auditLogs}
              currentUserProfile={currentUserProfile}
              onAdd={() => setModalConfig({ isOpen: true, type: "user" })}
              onEdit={(userRecord) =>
                setModalConfig({
                  isOpen: true,
                  type: "user",
                  data: userRecord,
                  isEdit: true,
                })
              }
              onResendVerification={requestUserVerification}
            />
          )}
          {view === "settings" && (
            <ProfileSettingsView
              profile={currentUserProfile}
              roleLabel={
                ROLE_DEFINITIONS[currentUserProfile?.role]?.label ||
                currentUserProfile?.role ||
                ""
              }
              onSave={updateMyProfile}
            />
          )}
          {view === "general-calendar" && (
            <div className="h-full flex flex-col space-y-4 fade-in">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow">Operación</p>
                  <h2 className="editorial-title text-3xl text-[#2f3437] dark:text-[#f1efe9]">
                    Calendario
                  </h2>
                </div>
                <ViewTabs
                  active="general-calendar"
                  onChange={handleNavigate}
                  items={[
                    canAccessView(currentUserProfile, "general-calendar") && {
                      id: "general-calendar",
                      label: "General",
                    },
                    canAccessView(currentUserProfile, "calendar") && {
                      id: "calendar",
                      label: "Producciones",
                    },
                  ].filter(Boolean)}
                />
              </div>
              <div className="surface flex-1 flex flex-col overflow-hidden">
                <GeneralCalendarGrid
                  activities={allActivities}
                  onDayClick={(dateStr) =>
                    setDayDetailsModal({ isOpen: true, date: dateStr })
                  }
                  onMoveActivity={async (activity, newDate) => {
                    if (!canEditActivity(activity.collectionType)) return;
                    const colMap = {
                      accountTask: "account_tasks",
                      editingTask: "editing",
                      managementTask: "management_tasks",
                      event: "events",
                    };
                    const colName = colMap[activity.collectionType];
                    if (colName)
                      await updateDoc(dataDoc(colName, activity.id), {
                        date: newDate,
                        updatedAt: nowIso(),
                      });
                  }}
                />
              </div>
            </div>
          )}
          {view === "calendar" && (
            <div className="h-full flex flex-col space-y-4 fade-in">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow">Operación</p>
                  <h2 className="editorial-title text-3xl text-[#2f3437] dark:text-[#f1efe9]">
                    Calendario
                  </h2>
                </div>
                <ViewTabs
                  active="calendar"
                  onChange={handleNavigate}
                  items={[
                    canAccessView(currentUserProfile, "general-calendar") && {
                      id: "general-calendar",
                      label: "General",
                    },
                    canAccessView(currentUserProfile, "calendar") && {
                      id: "calendar",
                      label: "Producciones",
                    },
                  ].filter(Boolean)}
                />
              </div>
              <div className="surface flex-1 flex flex-col overflow-hidden">
                <CalendarGrid
                  events={events.filter((e) => e.type === "production")}
                  baseColor="emerald"
                  canAdd={userHasPermission(
                    currentUserProfile,
                    "create_calendar_events",
                  )}
                  onAdd={(dateStr) =>
                    setModalConfig({
                      isOpen: true,
                      type: "event",
                      data: { date: dateStr, type: "production" },
                    })
                  }
                  onEventClick={(e) => handleEventClick(e, "event")}
                />
              </div>
            </div>
          )}
          {view === "performance" && (
            <PerformanceView
              editingTasks={editingTasks}
              editors={editors}
              users={appUsers}
            />
          )}
          {view === "reports" && (
            <ReportsView
              accountTasks={accountTasks}
              editingTasks={editingTasks}
              managementTasks={managementTasks}
              clients={clients}
              managers={managers}
              editors={editors}
              users={managementUsers}
            />
          )}
        </div>
      </main>

      <MobileBottomNav
        view={view}
        onNavigate={handleNavigate}
        currentUserProfile={currentUserProfile}
      />

      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-6 right-6 z-[110] pointer-events-none"
      >
        {toast && <Toast message={toast.message} type={toast.type} />}
      </div>
      {modalConfig.isOpen &&
        ["accountTask", "editingTask", "managementTask"].includes(
          modalConfig.type,
        ) && (
          <CreateTaskModal
            config={modalConfig}
            onClose={closeModal}
            clients={clients}
            managers={managers}
            editors={editors}
            managementUsers={managementUsers}
            actions={{
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
              updateUserRecord,
            }}
          />
        )}
      {modalConfig.isOpen &&
        !["accountTask", "editingTask", "managementTask"].includes(
          modalConfig.type,
        ) && (
          <Modal
            config={modalConfig}
            onClose={closeModal}
            clients={clients}
            managers={managers}
            editors={editors}
            managementUsers={managementUsers}
            actions={{
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
              updateUserRecord,
            }}
          />
        )}
      {deleteConfirm.isOpen && (
        <DeleteConfirmModal
          config={deleteConfirm}
          onClose={closeDelete}
          onConfirm={handleDelete}
        />
      )}
      <EventActionModal
        config={eventAction}
        canEdit={canEditActivity(eventAction.type)}
        onClose={() =>
          setEventAction({ isOpen: false, event: null, type: null })
        }
        onEdit={(event, type) =>
          setModalConfig({ isOpen: true, type, data: event, isEdit: true })
        }
        onDelete={(event, type) =>
          setDeleteConfirm({
            isOpen: true,
            type,
            id: event.id,
            title: event.title,
          })
        }
      />
      <DayDetailsModal
        config={dayDetailsModal}
        onClose={() => setDayDetailsModal({ isOpen: false, date: null })}
        activities={allActivities}
        clients={clients}
        managers={managers}
        editors={editors}
        users={managementUsers}
        canEditActivity={canEditActivity}
        onEdit={(act, type) =>
          setModalConfig({ isOpen: true, type, data: act, isEdit: true })
        }
        onDelete={(act, type) =>
          setDeleteConfirm({ isOpen: true, type, id: act.id, title: act.title })
        }
      />
      <TaskDetailModal
        config={taskDetailConfig}
        onClose={() =>
          setTaskDetailConfig({ isOpen: false, task: null, type: null })
        }
        clients={clients}
        managers={managers}
        editors={editors}
        users={managementUsers}
        canEdit={(type) => canEditActivity(type)}
        onEdit={(task, type) => {
          setTaskDetailConfig({ isOpen: false, task: null, type: null });
          setModalConfig({ isOpen: true, type, data: task, isEdit: true });
        }}
        onChangeStatus={(task, type, newStatus) => {
          if (type === "accountTask") changeAccountTaskStatus(task, newStatus);
          else if (type === "editingTask")
            changeEditingTaskStatus(task, newStatus);
          else if (type === "managementTask")
            changeManagementTaskStatus(task, newStatus);
        }}
        onAddComment={addTaskComment}
        onAddTimeEntry={addTaskTimeEntry}
        onUpdateChecklist={updateTaskChecklist}
        onChangePriority={changeTaskPriority}
        clientChats={clientChats}
        onSendClientChatMessage={addClientChatMessage}
        onOpenClientChat={(clientId) => {
          const client = clients.find((item) => item.id === clientId);
          openClientChat(client || null);
          handleNavigate("chat");
        }}
        onChangeAssignee={changeTaskAssignee}
        onChangeAssignees={changeTaskAssignees}
        sendNotification={sendNotification}
        onAddAttachment={addTaskAttachment}
        onRemoveAttachment={removeTaskAttachment}
        onDelete={(task, type) => {
          setTaskDetailConfig({ isOpen: false, task: null, type: null });
          setDeleteConfirm({
            isOpen: true,
            type,
            id: task.id,
            title: task.title,
          });
        }}
        currentUserProfile={currentUserProfile}
        accountTasks={accountTasks}
        editingTasks={editingTasks}
        managementTasks={managementTasks}
      />
    </div>
  );
}

// --- SUBCOMPONENTES ---
const SidebarItem = ({
  active,
  onClick,
  icon,
  label,
  color,
  badge,
  badgeColor,
}) => (
  <button
    onClick={onClick}
    aria-current={active ? "page" : undefined}
    className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group ${active ? "bg-[#f1f0ed] dark:bg-[#2a2a27] text-[#2f3437] dark:text-[#f1efe9]" : "text-[#787774] dark:text-[#aaa7a0] hover:bg-[#f7f6f3] dark:hover:bg-[#2a2a27] hover:text-[#2f3437] dark:hover:text-[#f1efe9]"}`}
  >
    <Icon name={icon} size={19} className="shrink-0 text-[inherit]" />
    <span className="font-medium text-sm flex-1 text-left text-[inherit] truncate">
      {label}
    </span>
    {badge != null && (
      <span
        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#eae9e5] text-[#555552] dark:bg-[#333330] dark:text-[#d3d0c9]"
      >
        {badge}
      </span>
    )}
  </button>
);

const ViewTabs = ({ items, active, onChange }) => (
  <div
    className="inline-flex w-fit max-w-full overflow-x-auto rounded-md border border-[#e6e4df] bg-white p-1 dark:border-white/10 dark:bg-[#222220]"
    role="tablist"
  >
    {items.map((item) => (
      <button
        key={item.id}
        type="button"
        role="tab"
        aria-selected={active === item.id}
        onClick={() => onChange(item.id)}
        className={`min-h-[38px] min-w-0 whitespace-nowrap rounded px-3 py-1.5 text-sm font-medium transition-colors ${
          active === item.id
            ? "bg-[#111111] text-white dark:bg-[#f1efe9] dark:text-[#181817]"
            : "text-[#787774] hover:bg-[#f7f6f3] hover:text-[#2f3437] dark:text-[#aaa7a0] dark:hover:bg-[#2a2a27] dark:hover:text-[#f1efe9]"
        }`}
      >
        {item.label}
      </button>
    ))}
  </div>
);

const Button = ({
  children,
  onClick,
  type = "button",
  color = "purple",
  full,
  icon,
  ...props
}) => (
  <button
    type={type}
    onClick={onClick}
    className={`${full ? "w-full" : ""} primary-action min-h-[44px] whitespace-nowrap px-4 py-2.5 font-semibold flex items-center justify-center gap-2 transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#111111] dark:focus-visible:ring-[#f1efe9] dark:focus-visible:ring-offset-[#181817]`}
    {...props}
  >
    {icon && <Icon name={icon} />} {children}
  </button>
);

const EmptyState = ({ icon, text }) => (
  <div className="flex flex-col items-center justify-center p-6 text-center h-full">
    <Icon
      name={icon}
      size={32}
      className="text-slate-500 dark:text-slate-400 mb-3"
    />
    <p className="text-sm font-medium text-[#787774] dark:text-[#aaa7a0]">
      {text}
    </p>
  </div>
);

const AppShellSkeleton = () => (
  <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
    <div className="hidden md:flex w-64 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <div className="h-10 w-36 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      <div className="mt-10 space-y-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
          />
        ))}
      </div>
    </div>
    <div className="flex-1 p-4 md:p-8">
      <div className="mb-6 h-10 w-64 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
          >
            <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="mt-5 h-8 w-16 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
          >
            <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 4 }).map((__, itemIndex) => (
                <div
                  key={itemIndex}
                  className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Breadcrumb = ({ items }) => (
  <nav
    aria-label="Ruta de navegación"
    className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-2"
  >
    {items.map((item, index) => (
      <React.Fragment key={`${item.label}-${index}`}>
        {index > 0 && (
          <span
            aria-hidden="true"
            className="text-slate-300 dark:text-slate-600"
          >
            /
          </span>
        )}
        {item.onClick ? (
          <button
            onClick={item.onClick}
            className="min-h-0 min-w-0 rounded-md px-1 py-0.5 font-bold hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            {item.label}
          </button>
        ) : (
          <span className="font-bold text-slate-800 dark:text-slate-100">
            {item.label}
          </span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

const FirstTimeView = ({ role, onNavigate }) => {
  const normalizedRole = [
    "editor",
    "manager",
    "management",
    "operations",
    "super_admin",
  ].includes(role)
    ? role
    : "viewer";
  const stepsByRole = {
    editor: [
      {
        icon: "Video",
        title: "Sala de Edición",
        desc: "Revisa tus tareas asignadas y avanza cada pieza por estado.",
        view: "editions",
      },
      {
        icon: "CheckCircle2",
        title: "Estados claros",
        desc: "Mueve las tarjetas cuando una pieza pase a revisión, aprobación o publicación.",
        view: "editions",
      },
      {
        icon: "Mail",
        title: "Recordatorios",
        desc: "Mantén tu correo activo para recibir avisos de vencimiento.",
        view: "general-calendar",
      },
    ],
    manager: [
      {
        icon: "Briefcase",
        title: "Clientes",
        desc: "Crea la cartera inicial y asigna cada cuenta a su responsable.",
        view: "clients",
      },
      {
        icon: "LayoutList",
        title: "Sala de Accounts",
        desc: "Planifica publicaciones y tareas por fecha, estado y responsable.",
        view: "account-room",
      },
      {
        icon: "CalendarDays",
        title: "Calendario",
        desc: "Consulta la carga del equipo desde una vista general.",
        view: "general-calendar",
      },
    ],
    management: [
      {
        icon: "ShieldCheck",
        title: "Sala de Gestión",
        desc: "Centraliza seguimientos internos con fecha, hora y responsable.",
        view: "management-room",
      },
      {
        icon: "Briefcase",
        title: "Clientes",
        desc: "Asocia tareas de gestión a clientes cuando aplique.",
        view: "clients",
      },
      {
        icon: "CalendarDays",
        title: "Calendario",
        desc: "Revisa vencimientos y movimiento del equipo.",
        view: "general-calendar",
      },
    ],
    operations: [
      {
        icon: "Users",
        title: "Equipo",
        desc: "Carga managers, editores y usuarios autorizados.",
        view: "control-center",
      },
      {
        icon: "Briefcase",
        title: "Clientes",
        desc: "Prepara la estructura base de cuentas antes de operar.",
        view: "clients",
      },
      {
        icon: "LayoutDashboard",
        title: "Panel Central",
        desc: "Monitorea volumen, atrasos y avance global.",
        view: "dashboard",
      },
    ],
    super_admin: [
      {
        icon: "Users",
        title: "Accesos",
        desc: "Configura roles activos y correos verificados.",
        view: "control-center",
      },
      {
        icon: "Briefcase",
        title: "Clientes",
        desc: "Crea la primera cartera y asigna responsables.",
        view: "clients",
      },
      {
        icon: "LayoutDashboard",
        title: "Panel Central",
        desc: "Revisa salud operativa cuando ya exista actividad.",
        view: "dashboard",
      },
    ],
    viewer: [
      {
        icon: "LayoutDashboard",
        title: "Panel Central",
        desc: "Aquí verás el resumen cuando el equipo empiece a cargar datos.",
        view: "dashboard",
      },
      {
        icon: "LayoutList",
        title: "Salas de trabajo",
        desc: "Consulta tareas por fecha y estado.",
        view: "account-room",
      },
      {
        icon: "CalendarDays",
        title: "Calendario",
        desc: "Abre el calendario para ubicar actividad por día.",
        view: "general-calendar",
      },
    ],
  };
  const steps = stepsByRole[normalizedRole] || stepsByRole.viewer;

  return (
    <div className="min-h-full flex items-center">
      <section className="w-full max-w-5xl mx-auto">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-3">
            Inicio rápido
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight">
            Prepara ClusterAG para operar
          </h2>
          <p className="mt-3 text-sm md:text-base text-slate-600 dark:text-slate-300 leading-7">
            Empieza por la estructura mínima de equipo, clientes y salas de
            trabajo.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step) => (
            <button
              key={step.title}
              onClick={() => onNavigate(step.view)}
              className="group min-h-[180px] text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-lg transition-all"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-300">
                <Icon name={step.icon} size={20} />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {step.desc}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Abrir <Icon name="ArrowRight" size={13} />
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

const MobileBottomNav = ({ view, onNavigate, currentUserProfile }) => {
  const items = [
    { view: "dashboard", icon: "LayoutDashboard", label: "Inicio" },
    { view: "performance", icon: "BarChart3", label: "Rendimiento" },
    { view: "account-room", icon: "LayoutList", label: "Accounts" },
    { view: "editions", icon: "Video", label: "Edición" },
    { view: "management-room", icon: "ShieldCheck", label: "Gestión" },
    { view: "clients", icon: "Briefcase", label: "Clientes" },
  ]
    .filter((item) => canAccessView(currentUserProfile, item.view))
    .slice(0, 6);

  if (items.length === 0) return null;

  const isItemActive = (itemView) =>
    view === itemView || (itemView === "clients" && view === "client-detail");

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)]"
    >
      {items.map((item) => {
        const active = isItemActive(item.view);
        return (
          <button
            key={item.view}
            onClick={() => onNavigate(item.view)}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={`flex-1 min-w-0 min-h-[64px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-bold transition-colors ${
              active
                ? "text-[#111111] dark:text-white"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Icon name={item.icon} size={20} />
            <span className="truncate max-w-full">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

const LoginVectorArtwork = () => (
  <svg
    viewBox="0 0 620 540"
    className="login-vector h-full w-full"
    role="img"
    aria-label="Equipo conectado alrededor de un flujo de trabajo"
  >
    <g fill="none" stroke="currentColor">
      <circle cx="310" cy="252" r="174" strokeWidth="1" opacity="0.18" />
      <circle
        cx="310"
        cy="252"
        r="126"
        strokeWidth="1.5"
        strokeDasharray="6 12"
        className="login-vector-orbit"
        opacity="0.42"
      />
      <path
        d="M175 184 C236 112 382 112 444 184 M175 320 C240 390 382 390 444 320"
        strokeWidth="1.5"
        opacity="0.3"
      />
      <path d="M205 252 H415 M310 142 V362" strokeWidth="1" opacity="0.2" />
    </g>

    <g className="login-vector-node login-vector-node-one">
      <circle cx="174" cy="184" r="42" fill="#e1f3fe" />
      <circle cx="174" cy="171" r="12" fill="#1f6c9f" />
      <path d="M149 207 C153 187 195 187 199 207" fill="#1f6c9f" />
    </g>
    <g className="login-vector-node login-vector-node-two">
      <circle cx="446" cy="184" r="42" fill="#edf3ec" />
      <circle cx="446" cy="171" r="12" fill="#346538" />
      <path d="M421 207 C425 187 467 187 471 207" fill="#346538" />
    </g>
    <g className="login-vector-node login-vector-node-three">
      <circle cx="174" cy="320" r="42" fill="#fbf3db" />
      <rect x="151" y="299" width="46" height="42" rx="7" fill="#956400" />
      <path d="M160 311 H188 M160 321 H183 M160 331 H176" stroke="#fbf3db" strokeWidth="3" strokeLinecap="round" />
    </g>
    <g className="login-vector-node login-vector-node-four">
      <circle cx="446" cy="320" r="42" fill="#fdebec" />
      <rect x="424" y="300" width="44" height="40" rx="8" fill="#9f2f2d" />
      <path d="M435 320 L443 328 L458 311" fill="none" stroke="#fdebec" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </g>

    <g className="login-vector-core">
      <circle cx="310" cy="252" r="76" fill="#f1f0ed" className="dark:fill-[#292d2a]" />
      <circle cx="310" cy="252" r="57" fill="#161817" className="dark:fill-[#e9e6df]" />
      <path
        d="M278 257 L302 280 L344 226"
        fill="none"
        stroke="#e9e6df"
        className="dark:stroke-[#161817]"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>

    <circle cx="310" cy="126" r="6" fill="#1f6c9f" className="login-vector-pulse" />
    <circle cx="436" cy="252" r="6" fill="#346538" className="login-vector-pulse login-vector-delay" />
    <circle cx="310" cy="378" r="6" fill="#956400" className="login-vector-pulse login-vector-delay-two" />
  </svg>
);

const LoginScreen = ({
  onGoogleSignIn,
  isSigningIn,
  email,
  onEmailChange,
  onEmailSubmit,
  isSendingLoginLink,
  isDark,
  onToggleTheme,
}) => (
  <div className="login-screen min-h-screen bg-[#f7f6f3] text-[#2f3437] dark:bg-[#161817] dark:text-[#e9e6df]">
    <header className="absolute inset-x-0 top-0 z-20 flex min-h-[76px] items-center justify-between px-5 sm:px-8 lg:px-12">
      <div className="flex items-center gap-3">
        <AgencyLogo className="h-9 w-9" />
        <div>
          <p className="brand-name text-base font-bold leading-none text-[#2f3437] dark:text-[#e9e6df]">
            CLUSTER
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#787774] dark:text-[#a6a39c]">
            Agency OS
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggleTheme}
        aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        className="quiet-action h-10 min-h-0 w-10 min-w-0 p-0"
      >
        <Icon name={isDark ? "Sun" : "Moon"} size={17} />
      </button>
    </header>

    <main className="flex min-h-screen items-center justify-center px-4 pb-4 pt-24 sm:px-6 lg:px-10">
      <section className="login-frame grid w-full max-w-[1120px] overflow-hidden rounded-2xl border border-[#dedcd6] bg-white dark:border-white/10 dark:bg-[#1f2220] lg:grid-cols-[1.08fr_0.92fr]" aria-labelledby="login-title">
        <div className="login-art-panel order-2 relative min-h-[280px] overflow-hidden border-t border-[#dedcd6] bg-[#efeee9] dark:border-white/10 dark:bg-[#1a1d1b] lg:order-1 lg:min-h-[600px] lg:border-r lg:border-t-0">
          <div className="pointer-events-none absolute inset-x-0 top-4 h-[72%] opacity-90 lg:h-[76%]">
            <LoginVectorArtwork />
          </div>
          <div className="relative z-10 flex h-full min-h-[280px] flex-col justify-between p-6 sm:p-8 lg:min-h-[600px] lg:p-10">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#555552] dark:text-[#c4c1ba]">
              <span className="h-2 w-2 rounded-full bg-[#346538] login-vector-pulse" />
              Operación conectada
            </div>
            <div className="max-w-md">
              <p className="eyebrow mb-3">Todo el equipo, una sola vista</p>
              <h2 className="editorial-title text-3xl text-[#2f3437] dark:text-[#e9e6df] sm:text-4xl lg:text-5xl">
                El trabajo fluye cuando todo está conectado.
              </h2>
              <div className="mt-5 hidden flex-wrap gap-2 sm:flex">
                {["Clientes", "Producción", "Equipo"].map((label) => (
                  <span key={label} className="rounded-full border border-[#d8d6d0] bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#555552] dark:border-white/10 dark:bg-[#232624]/80 dark:text-[#c4c1ba]">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="login-form-panel order-1 flex items-center p-6 sm:p-10 lg:order-2 lg:p-12">
          <div className="w-full max-w-[390px] mx-auto">
            <div className="mb-8">
              <p className="eyebrow mb-2">Acceso seguro</p>
              <h1 id="login-title" className="editorial-title text-[40px] leading-tight text-[#2f3437] dark:text-[#e9e6df]">
                Bienvenido de nuevo
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#787774] dark:text-[#a6a39c]">
                Entra a tu espacio para gestionar clientes, tareas y producción.
              </p>
            </div>

            <button
              onClick={onGoogleSignIn}
              disabled={isSigningIn || isSendingLoginLink}
              className="quiet-action w-full justify-center px-4 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSigningIn ? (
                <Icon name="Loader2" size={17} className="animate-spin" />
              ) : (
                <span className="text-base font-bold text-blue-600" aria-hidden="true">G</span>
              )}
              Continuar con Google
            </button>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#e6e4df] dark:bg-[#343431]" />
              <span className="text-xs text-[#787774] dark:text-[#a6a39c]">O usa tu correo</span>
              <div className="h-px flex-1 bg-[#e6e4df] dark:bg-[#343431]" />
            </div>

            <form onSubmit={onEmailSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-[#2f3437] dark:text-[#e9e6df]">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Icon name="Mail" size={17} className="pointer-events-none absolute left-3.5 top-3.5 text-[#9a9893]" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(event) => onEmailChange(event.target.value)}
                    placeholder="nombre@empresa.com"
                    autoComplete="email"
                    className="min-h-[46px] w-full rounded-md border border-[#d8d6d0] bg-white pl-11 pr-4 text-sm text-[#2f3437] outline-none transition placeholder:text-slate-400 focus:border-[#111111] focus:ring-2 focus:ring-black/10 dark:border-[#454541] dark:bg-[#1a1d1b] dark:text-[#e9e6df]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSigningIn || isSendingLoginLink}
                className="primary-action w-full justify-center px-4 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Icon name={isSendingLoginLink ? "Loader2" : "Send"} size={17} className={isSendingLoginLink ? "animate-spin" : ""} />
                {isSendingLoginLink ? "Enviando enlace" : "Enviar enlace de acceso"}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#787774] dark:text-[#a6a39c]">
              <Icon name="ShieldCheck" size={15} />
              Acceso exclusivo para cuentas autorizadas
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
);

const SearchBar = ({ searchTerm, setSearchTerm, placeholder }) => (
  <div className="relative w-full md:w-64 shrink-0">
    <Icon
      name="Search"
      className="absolute left-3 top-3 text-slate-500 dark:text-slate-400"
      size={16}
    />
    <input
      type="text"
      aria-label={placeholder || "Buscar"}
      placeholder={placeholder}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="min-h-[46px] w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-500 dark:placeholder:text-slate-500"
    />
  </div>
);

const StatCard = ({
  title,
  value,
  icon,
  detail = "",
  onClick = null,
  actionLabel = "",
}) => {
  const CardElement = onClick ? "button" : "div";
  return (
  <CardElement
    {...(onClick
      ? {
          type: "button",
          onClick,
          "aria-label": actionLabel || `Abrir ${title}`,
        }
      : {})}
    className={`surface group flex min-h-[118px] w-full items-start justify-between p-5 text-left transition-colors ${
      onClick
        ? "hover:border-[#8f8c85] hover:bg-[#fbfbfa] dark:hover:border-[#5b605c] dark:hover:bg-[#242825]"
        : ""
    }`}
  >
    <div className="min-w-0">
      <p className="text-xs font-medium text-[#787774] dark:text-[#aaa7a0]">
        {title}
      </p>
      <p className="mono-meta mt-2 text-3xl font-semibold leading-none text-[#2f3437] dark:text-[#f1efe9]">
        {value}
      </p>
      {detail && (
        <p className="mt-2 text-xs text-[#9a9893] dark:text-[#8f8c85]">
          {detail}
        </p>
      )}
    </div>
    <div className="flex items-center gap-2">
      {onClick && (
        <Icon
          name="ArrowRight"
          size={16}
          className="text-[#9a9893] transition-transform group-hover:translate-x-0.5 dark:text-[#8f8c85]"
        />
      )}
      <div className="rounded-lg bg-[#f1f0ed] p-2.5 text-[#555552] dark:bg-[#2a2a27] dark:text-[#d3d0c9]">
        <Icon name={icon} size={20} />
      </div>
    </div>
  </CardElement>
  );
};

const Input = ({ label, id, className = "", ...props }) => {
  const reactId = useId();
  const inputId =
    id ||
    `input-${slugifyId(label || props.name || props.placeholder || reactId)}`;
  const ariaLabel =
    props["aria-label"] ||
    (label ? undefined : props.placeholder || props.name);
  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-[#555552] dark:text-[#d3d0c9] mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-label={ariaLabel}
        className={`w-full p-4 md:p-3 bg-white dark:bg-[#222220] border border-[#e6e4df] dark:border-white/10 rounded-md focus:border-[#111111] dark:focus:border-[#f1efe9] focus:ring-0 outline-none font-normal text-[#2f3437] dark:text-[#f1efe9] transition-colors placeholder:text-[#9a9893] ${className}`}
        {...props}
      />
    </div>
  );
};

// Subida de foto de perfil: comprime a un JPEG pequeño (data URL) en el
// navegador y lo expone como <input hidden name="photo"> para el FormData.
const PhotoUploader = ({
  name = "photo",
  defaultValue = "",
  label = "Foto de perfil",
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

  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">
        {label}
      </label>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
          {photo ? (
            <img
              src={photo}
              alt="Foto de perfil"
              className="w-full h-full object-cover"
            />
          ) : (
            <Icon
              name="User"
              size={26}
              className="text-slate-400 dark:text-slate-500"
            />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Icon
              name={busy ? "Loader2" : "UserPlus"}
              size={15}
              className={busy ? "animate-spin" : ""}
            />
            {photo ? "Cambiar foto" : "Subir foto"}
          </button>
          {photo && (
            <button
              type="button"
              onClick={() => setPhoto("")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <Icon name="Trash2" size={15} /> Quitar
            </button>
          )}
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
      <input type="hidden" name={name} value={photo} />
    </div>
  );
};

const CheckItem = ({ label, checked, onToggle }) => (
  <button
    onClick={onToggle}
    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${checked ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 text-green-800 dark:text-green-400" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-600"}`}
  >
    <span className="font-bold text-sm">{label}</span>
    {checked ? (
      <Icon name="CheckCircle2" size={20} className="text-green-500" />
    ) : (
      <Icon name="Circle" size={20} />
    )}
  </button>
);

const clampPercent = (value = 0) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
};

const DASHBOARD_PALETTE = {
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
  slate: { solid: "#bdbab2", strong: "#555552" },
};

const getDashboardPalette = (name = "slate") =>
  DASHBOARD_PALETTE[name] || DASHBOARD_PALETTE.slate;

const PortfolioHealthChart = ({
  totalClients,
  activos,
  pausados,
  inactivos,
  onOpenClients,
}) => {
  const segments = [
    {
      key: "activo",
      label: "Activos",
      value: activos,
      color: "#a9c6a6",
      strong: "#346538",
    },
    {
      key: "pausado",
      label: "Pausados",
      value: pausados,
      color: "#eadcae",
      strong: "#956400",
    },
    {
      key: "inactivo",
      label: "Inactivos",
      value: inactivos,
      color: "#bdbab2",
      strong: "#555552",
    },
  ];
  const healthScore =
    totalClients > 0 ? Math.round((activos / totalClients) * 100) : 0;
  const healthLabel =
    totalClients === 0
      ? "Sin datos"
      : healthScore >= 75
        ? "Saludable"
        : healthScore >= 45
          ? "Mixta"
          : "Baja";

  return (
    <div className="mt-6 grid grid-cols-1 gap-5">
      <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
        <div className="surface-subtle rounded-lg border border-[#e6e4df] p-4 dark:border-white/10">
          <p className="eyebrow">Salud de cartera</p>
          <p className="mono-meta mt-3 text-4xl font-semibold leading-none text-[#2f3437] dark:text-[#f1efe9]">
            {healthScore}%
          </p>
          <p className="mt-2 text-xs text-[#787774] dark:text-[#aaa7a0]">
            {healthLabel} · {activos} de {totalClients} activos
          </p>
        </div>
        <div className="flex min-w-0 flex-col justify-center">
          <div
            className="flex h-5 w-full overflow-hidden rounded-md bg-[#efeee9] dark:bg-[#343431]"
            aria-label={`Distribucion de cartera: ${healthScore}% activa`}
          >
            {segments.map((segment) => (
              <div
                key={segment.key}
                style={{
                  width: `${totalClients > 0 ? (segment.value / totalClients) * 100 : 0}%`,
                  backgroundColor: segment.strong,
                }}
                title={`${segment.label}: ${segment.value}`}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {segments.map((segment) => (
              <span key={segment.key} className="flex items-center gap-2 text-xs text-[#787774] dark:text-[#aaa7a0]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: segment.strong }} />
                {segment.label} <strong className="mono-meta text-[#2f3437] dark:text-[#f1efe9]">{segment.value}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-3 sm:grid-cols-3">
        {segments.map((segment) => {
          const percent =
            totalClients > 0
              ? Math.round((segment.value / totalClients) * 100)
              : 0;
          return (
            <button
              type="button"
              key={segment.key}
              onClick={onOpenClients}
              aria-label={`Ver clientes ${segment.label.toLowerCase()}`}
              className="group min-w-0 rounded-2xl border border-slate-200 bg-white/80 p-3 text-left shadow-sm transition-colors hover:border-[#8f8c85] dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-[#5b605c]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="truncate text-sm font-bold text-slate-700 dark:text-slate-200">
                    {segment.label}
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {segment.value}
                  </span>
                  <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    {percent}%
                  </span>
                </div>
              </div>
              <div className="mt-2 h-2.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${percent}%`,
                    background: segment.strong,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ProgressOverviewChart = ({
  completionPercent,
  completedTasks,
  totalTasks,
  groups,
  onNavigate,
}) => {
  const safePercent = clampPercent(completionPercent);
  const pendingTasks = Math.max(totalTasks - completedTasks, 0);

  return (
    <div className="mt-6 grid grid-cols-1 gap-5">
      <div className="surface-subtle rounded-lg border border-[#e6e4df] p-4 dark:border-white/10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Avance consolidado</p>
            <p className="mono-meta mt-2 text-4xl font-semibold leading-none text-[#2f3437] dark:text-[#f1efe9]">
              {Math.round(safePercent)}%
            </p>
          </div>
          <p className="mono-meta text-sm text-[#787774] dark:text-[#aaa7a0]">
            {completedTasks} hechas · {pendingTasks} abiertas
          </p>
        </div>
        <div className="mt-4 flex h-5 overflow-hidden rounded-md bg-[#dfddd7] dark:bg-[#343431]">
          <div
            className="bg-[#346538] transition-all duration-700"
            style={{ width: `${safePercent}%` }}
            title={`${completedTasks} completadas`}
          />
          <div
            className="bg-transparent"
            style={{ width: `${100 - safePercent}%` }}
            title={`${pendingTasks} abiertas`}
          />
        </div>
      </div>

      <div className="min-w-0 space-y-3">
        {groups.map((group) => {
          const palette = getDashboardPalette(group.color);
          return (
            <button
              type="button"
              key={group.key}
              onClick={() => onNavigate(group.view)}
              aria-label={`Abrir ${group.label}`}
              className="group min-w-0 rounded-2xl border border-slate-200 bg-white/80 p-3 text-left shadow-sm transition-colors hover:border-[#8f8c85] dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-[#5b605c]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: palette.solid }}
                    />
                    <span className="break-words text-sm font-bold leading-tight text-slate-800 dark:text-slate-100">
                      {group.label}
                    </span>
                  </div>
                  <p className="mt-1 break-words pr-2 text-xs leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                    {group.note}
                  </p>
                </div>
                <div className="w-16 shrink-0 text-right">
                  <p
                    className="text-lg font-black"
                    style={{ color: palette.strong }}
                  >
                    {group.percent}%
                  </p>
                  <p className="break-words text-[10px] leading-tight font-semibold text-slate-500 dark:text-slate-400">
                    {group.completed}/{group.total}
                  </p>
                </div>
              </div>
              <div className="mt-2.5 h-3 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${group.percent}%`,
                    background: palette.strong,
                  }}
                />
              </div>
            </button>
          );
        })}

        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-2.5 text-center dark:border-slate-800 dark:bg-slate-950/50">
            <p className="break-words text-[9px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              Total
            </p>
            <p className="mt-1 text-lg font-black leading-none text-slate-900 dark:text-white">
              {totalTasks}
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-2.5 text-center dark:border-slate-800 dark:bg-slate-950/50">
            <p className="break-words text-[9px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              Hechas
            </p>
            <p className="mt-1 text-lg font-black leading-none text-slate-900 dark:text-white">
              {completedTasks}
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-2.5 text-center dark:border-slate-800 dark:bg-slate-950/50">
            <p className="break-words text-[9px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              Abiertas
            </p>
            <p className="mt-1 text-lg font-black leading-none text-slate-900 dark:text-white">
              {pendingTasks}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- DASHBOARD PRINCIPAL CON RANKING ---
const DashboardView = ({
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
  onOpenTask,
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
  const isTaskInDashboardMonth = (task) =>
    isDateWithinPeriod(task?.date, dashboardPeriod);
  const monthlyEditingTasks = tasks.filter(isTaskInDashboardMonth);
  const monthlyAccountTasks = accountTasks.filter(isTaskInDashboardMonth);
  const monthlyManagementTasks = managementTasks.filter(isTaskInDashboardMonth);
  const openMonthlyAccountTasks = monthlyAccountTasks.filter(
    (task) => task.status !== "publicado",
  ).length;
  const pendingMonthlyEditingTasks = monthlyEditingTasks.filter(
    (task) => !isCompletedStatus(task.status),
  ).length;

  const activos = clients.filter(
    (c) => (c.status || "Activo") === "Activo",
  ).length;
  const pausados = clients.filter((c) => c.status === "Pausado").length;
  const inactivos = clients.filter((c) => c.status === "Inactivo").length;
  const realTotalClients = clients.length;
  const totalClients = realTotalClients || 1;

  const completedEditingTasks = monthlyEditingTasks.filter((task) =>
    isCompletedStatus(task.status),
  ).length;
  const completedAccountTasks = monthlyAccountTasks.filter(
    (task) =>
      task.status === "aprobado_internamente" || task.status === "publicado",
  ).length;
  const completedManagementTasks = monthlyManagementTasks.filter(
    (task) => task.status === "cerrado",
  ).length;

  const progressGroups = [
    {
      key: "editing",
      label: "Edicion",
      note: "Produccion audiovisual",
      total: monthlyEditingTasks.length,
      completed: completedEditingTasks,
      color: "amber",
      view: "editions",
    },
    {
      key: "account",
      label: "Accounts",
      note: "Seguimiento comercial",
      total: monthlyAccountTasks.length,
      completed: completedAccountTasks,
      color: "indigo",
      view: "account-room",
    },
    {
      key: "management",
      label: "Gestion",
      note: "Operacion interna",
      total: monthlyManagementTasks.length,
      completed: completedManagementTasks,
      color: "cyan",
      view: "management-room",
    },
  ].map((group) => ({
    ...group,
    percent:
      group.total > 0 ? Math.round((group.completed / group.total) * 100) : 0,
  }));

  const completedTasks = progressGroups.reduce(
    (sum, group) => sum + group.completed,
    0,
  );
  const totalTasks = progressGroups.reduce(
    (sum, group) => sum + group.total,
    0,
  );
  const compPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Las alertas del panel respetan el mismo corte mensual que los contadores.
  const urgentTasks = [
    ...monthlyEditingTasks
      .filter(
        (t) =>
          (t.priority === "urgente" ||
            isDateBeforeDateString(t.date, todayStr)) &&
          t.status !== "aprobado" &&
          t.status !== "publicado",
      )
      .map((t) => ({
        ...t,
        _type: "Edición",
        _taskType: "editingTask",
      })),
    ...monthlyAccountTasks
      .filter(
        (t) =>
          isDateBeforeDateString(t.date, todayStr) && t.status !== "publicado",
      )
      .map((t) => ({
        ...t,
        _type: "Account",
        _taskType: "accountTask",
      })),
    ...monthlyManagementTasks
      .filter(
        (t) =>
          (t.priority === "urgente" ||
            isDateBeforeDateString(t.date, todayStr)) &&
          t.status !== "cerrado",
      )
      .map((t) => ({
        ...t,
        _type: "Gestion",
        _taskType: "managementTask",
      })),
  ]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 6);

  const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const formattedDate = new Date().toLocaleDateString("es-HN", dateOptions);

  const rankingPeriod = getRankingMonthPeriod(rankingRefDate);
  const isCurrentMonth = (() => { const tp = getRankingMonthPeriod(todayStr); return rankingPeriod.year === tp.year && rankingPeriod.month === tp.month; })();
  const managerStats = buildManagerKpiStats({
    managers: managers
      .filter((manager) => !isManagerLinkedToInactiveUser(manager, users))
      .map((manager) => ({
        ...manager,
        mappedColor: LEGACY_COLOR_MAP[manager.color] || manager.color || "slate",
      })),
    clients,
    accountTasks,
    rankingPeriod,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="surface-subtle flex flex-col gap-5 rounded-xl border border-[#e6e4df] p-5 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between md:p-6">
        <div>
          <p className="eyebrow">Resumen mensual</p>
          <h2 className="editorial-title mt-1 text-4xl text-[#2f3437] dark:text-[#f1efe9] md:text-5xl">
            Panel central
          </h2>
          <p className="page-description mt-2 capitalize">{formattedDate}</p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <span className="quiet-action px-3 text-sm">
            <Icon name="CalendarRange" size={16} />
            {dashboardPeriod.label}
          </span>
          <p className="mono-meta text-xs text-[#787774] dark:text-[#aaa7a0]">
            {completedTasks} completadas · {urgentTasks.length} requieren atención
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Clientes Activos"
          value={activos}
          icon="Briefcase"
          detail={`${realTotalClients} clientes en cartera`}
          onClick={() => onNavigate("clients")}
          actionLabel="Abrir clientes activos"
        />
        <StatCard
          title="Account Managers"
          value={managers.length}
          icon="Users"
          detail="Equipo asignado"
          onClick={() => onNavigate("managers")}
          actionLabel="Abrir equipo de Account Managers"
        />
        <StatCard
          title="Accounts pendientes"
          value={openMonthlyAccountTasks}
          icon="LayoutList"
          detail={`${monthlyAccountTasks.length} tareas del mes`}
          onClick={() => onNavigate("account-room")}
          actionLabel="Abrir tareas pendientes de Accounts"
        />
        <StatCard
          title="Edición pendiente"
          value={pendingMonthlyEditingTasks}
          icon="Video"
          detail={`${monthlyEditingTasks.length} tareas del mes`}
          onClick={() => onNavigate("editions")}
          actionLabel="Abrir tareas pendientes de Edición"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <div className="h-full">
            <div className="surface h-full p-6">
              <div>
                <h3 className="text-base font-semibold text-[#2f3437] dark:text-[#f1efe9] mb-1">
                  Avance del mes
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Edición, Accounts y Gestión · {dashboardPeriod.label}
                </p>
              </div>
              <ProgressOverviewChart
                completionPercent={compPercent}
                completedTasks={completedTasks}
                totalTasks={totalTasks}
                groups={progressGroups}
                onNavigate={onNavigate}
              />
            </div>
          </div>
        </div>

        {/* Tareas Urgentes */}
        <div className="surface flex min-h-[360px] flex-col p-6 xl:col-span-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-[#2f3437] dark:text-[#f1efe9] mb-1">
                Atención Requerida
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Solo tareas de {dashboardPeriod.label}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black tracking-[0.12em] uppercase text-slate-500 dark:text-slate-400">
                {urgentTasks.length}
              </span>
              <div className="p-2.5 bg-[#fdebec] text-[#9f2f2d] rounded-lg">
                <Icon name="Flame" size={18} />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 custom-scroll pr-2">
            {urgentTasks.length === 0 ? (
              <EmptyState icon="CheckCircle2" text="No hay tareas urgentes." />
            ) : (
              urgentTasks.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => onOpenTask(t, t._taskType)}
                  aria-label={`Abrir tarea ${t.title}`}
                  className="group flex min-w-0 w-full items-start gap-3 rounded-2xl border border-slate-100 p-3.5 text-left transition-colors hover:border-[#8f8c85] hover:bg-slate-50 dark:border-slate-800 dark:hover:border-[#5b605c] dark:hover:bg-slate-800/50"
                >
                  <div
                    className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${isDateBeforeDateString(t.date, todayStr) ? "bg-red-500" : "bg-amber-500"}`}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <p className="break-words text-sm font-semibold leading-tight text-[#2f3437] dark:text-[#f1efe9]">
                      {t.title}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        {t._type}
                      </span>
                      <span
                        className={`text-[9px] font-bold break-words ${isDateBeforeDateString(t.date, todayStr) ? "text-red-500" : "text-slate-500"}`}
                      >
                        Vence: {t.date}
                      </span>
                    </div>
                  </div>
                  <Icon
                    name="ArrowRight"
                    size={16}
                    className="mt-1 shrink-0 text-[#9a9893] transition-transform group-hover:translate-x-0.5 dark:text-[#8f8c85]"
                  />
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="surface p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#2f3437] dark:text-[#f1efe9]">
              Distribución de cartera
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Estado actual de los clientes activos, pausados e inactivos
            </p>
          </div>
          <span className="mono-meta text-xs text-[#787774] dark:text-[#aaa7a0]">
            {realTotalClients} clientes totales
          </span>
        </div>
        <PortfolioHealthChart
          totalClients={realTotalClients}
          activos={activos}
          pausados={pausados}
          inactivos={inactivos}
          onOpenClients={() => onNavigate("clients")}
        />
      </div>

      {/* Ranking Account Managers */}
      <div className="surface p-5 md:p-6 mt-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#2f3437] dark:text-[#f1efe9] mb-1">
              KPI mensual por Account
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              KPI: 50% cumplimiento ponderado, 30% puntualidad verificada y
              20% carga completada del mes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              title="Mes anterior"
            >
              <Icon name="ChevronLeft" size={16} />
            </button>
            <span className="text-sm font-black text-slate-700 dark:text-slate-200 min-w-[110px] text-center">
              {rankingPeriod.label}
            </span>
            <button
              onClick={goToNextMonth}
              disabled={isCurrentMonth}
              className={`w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors shadow-sm ${isCurrentMonth ? "opacity-30 cursor-not-allowed text-slate-400" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
              title="Mes siguiente"
            >
              <Icon name="ChevronRight" size={16} />
            </button>
          </div>
        </div>

        {managerStats.length === 0 ? (
          <EmptyState icon="Users" text="No hay Accounts para evaluar aún." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr className="border-b border-[#e6e4df] text-left dark:border-white/10">
                  {["Pos.", "Account", "Tareas", "A tiempo", "Cumplimiento", "Carga", "Pendientes", "KPI"].map(
                    (label) => (
                      <th key={label} className="eyebrow px-3 py-3 first:pl-0 last:pr-0 last:text-right">
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let qualifiedRank = 0;
                  return managerStats.map((ms) => {
                    const hasEnoughTasks = ms.totalTasks >= KPI_MIN_TASKS;
                    if (hasEnoughTasks) qualifiedRank += 1;
                    return (
                      <tr
                        key={ms.id}
                        className={`border-b border-[#efeee9] transition-colors last:border-0 hover:bg-[#fbfbfa] dark:border-white/5 dark:hover:bg-[#2a2a27] ${
                          hasEnoughTasks ? "" : "text-[#9a9893]"
                        }`}
                      >
                        <td className="mono-meta px-3 py-3.5 pl-0 text-sm">
                          {hasEnoughTasks ? String(qualifiedRank).padStart(2, "0") : "—"}
                        </td>
                        <td className="px-3 py-3.5">
                          <p className="font-semibold text-[#2f3437] dark:text-[#f1efe9]">{ms.name}</p>
                          <p className="text-xs text-[#787774] dark:text-[#aaa7a0]">
                            {ms.totalClients} clientes
                            {!hasEnoughTasks && ` · mínimo ${KPI_MIN_TASKS} tareas`}
                          </p>
                        </td>
                        <td className="mono-meta px-3 py-3.5 text-sm">{ms.completedTasks}/{ms.totalTasks}</td>
                        <td className="mono-meta px-3 py-3.5 text-sm">
                          {ms.onTimePercent === null ? "N/D" : `${ms.onTimePercent}%`}
                        </td>
                        <td className="mono-meta px-3 py-3.5 text-sm">{ms.weightedCompletionPercent}%</td>
                        <td className="mono-meta px-3 py-3.5 text-sm">{ms.loadPercent}%</td>
                        <td className="mono-meta px-3 py-3.5 text-sm">
                          <span className={ms.overdueTasks > 0 ? "text-[#9f2f2d]" : ""}>
                            {ms.pendingTasks}
                          </span>
                        </td>
                        <td className="mono-meta px-3 py-3.5 pr-0 text-right text-lg font-semibold text-[#2f3437] dark:text-[#f1efe9]">
                          {ms.score}%
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Vista "Configuración" con la sección de Perfil (editar perfil propio).
const ProfileSettingsView = ({ profile, roleLabel, onSave }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries());
    onSave({
      name: fd.name || "",
      profession: fd.profession || "",
      photo: fd.photo || "",
    });
  };
  return (
    <div className="space-y-6 fade-in max-w-2xl">
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">
          Configuración
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Administra tu perfil personal.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300">
          <Icon name="User" size={15} /> Perfil
        </span>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        {!profile?.id ? (
          <EmptyState icon="User" text="Inicia sesión para editar tu perfil." />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <PhotoUploader defaultValue={profile.photo} />
            <Input
              name="name"
              label="Nombre"
              placeholder="Tu nombre"
              defaultValue={profile.name}
              required
            />
            <Input
              name="profession"
              label="Profesión / Cargo"
              placeholder="ej. Director de agencia"
              defaultValue={profile.profession}
            />
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">
                Correo
              </label>
              <div className="w-full p-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
                <Icon name="Mail" size={15} />
                <span className="truncate">{profile.email || "—"}</span>
                <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                  No editable
                </span>
              </div>
            </div>
            {roleLabel && (
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">
                  Rol
                </label>
                <div className="w-full p-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
                  <Icon name="ShieldCheck" size={15} />
                  {roleLabel}
                </div>
              </div>
            )}
            <Button type="submit" full color="purple" icon="Save">
              Guardar cambios
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

const TeamView = ({
  title,
  team,
  iconColor,
  onAdd,
  onSelect,
  onDelete,
  onEdit,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredTeam = team.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">
          {title}
        </h2>
        <div className="flex flex-col md:flex-row w-full md:w-auto gap-3">
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            placeholder="Buscar miembro..."
          />
          <Button onClick={onAdd} icon="UserPlus" color={iconColor}>
            Agregar a {title}
          </Button>
        </div>
      </div>
      {filteredTeam.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 h-64">
          <EmptyState icon="Users" text="No hay miembros en este equipo aún." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeam.map((person) => {
            let mappedColorName =
              LEGACY_COLOR_MAP[person.color] || person.color || "slate";
            const style = PERSON_COLORS[mappedColorName] || PERSON_COLORS.slate;
            return (
              <div
                key={person.id}
                onClick={() => onSelect(person)}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer group relative"
              >
                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(person);
                    }}
                    aria-label={`Editar ${person.name || "miembro"}`}
                    title="Editar"
                    className="text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 p-3 md:p-2 bg-slate-50 dark:bg-slate-800 rounded-full hover:bg-blue-50 dark:hover:bg-slate-700"
                  >
                    <Icon name="Edit" size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(person);
                    }}
                    aria-label={`Eliminar ${person.name || "miembro"}`}
                    title="Eliminar"
                    className="text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-3 md:p-2 bg-slate-50 dark:bg-slate-800 rounded-full hover:bg-red-50 dark:hover:bg-slate-700"
                  >
                    <Icon name="Trash2" size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  {person.photo ? (
                    <img
                      src={person.photo}
                      alt={person.name}
                      className="h-14 w-14 rounded-xl object-cover shadow-sm border border-black/5 dark:border-white/5 shrink-0"
                    />
                  ) : (
                    <div
                      className={`h-14 w-14 ${style.bg} rounded-xl flex items-center justify-center text-2xl font-black ${style.text} shadow-sm border border-black/5 dark:border-white/5 shrink-0`}
                    >
                      {person.name ? person.name.charAt(0).toUpperCase() : "?"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white pr-16 md:pr-12 truncate">
                      {person.name}
                    </h3>
                    {person.profession && (
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                        {person.profession}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {person.email || "Miembro del equipo"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const PersonCalendarDetail = ({
  person,
  tasks,
  title,
  baseColor,
  onBack,
  onAddEvent,
  onEventClick,
}) => {
  let mappedColorName = LEGACY_COLOR_MAP[baseColor] || baseColor;
  const style = PERSON_COLORS[mappedColorName] || PERSON_COLORS.slate;
  const parentLabel = title.includes("Cuentas")
    ? "Account Managers"
    : "Editores";
  return (
    <div className="h-full flex flex-col space-y-6 fade-in">
      <Breadcrumb
        items={[
          { label: parentLabel, onClick: onBack },
          { label: person.name || "Detalle" },
        ]}
      />
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <button
          onClick={onBack}
          aria-label={`Volver a ${parentLabel}`}
          className="p-3 md:p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300"
        >
          <Icon name="ChevronLeft" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-sm border border-black/5 dark:border-white/5 ${style.bg} ${style.text}`}
            >
              {person.name ? person.name.charAt(0).toUpperCase() : "?"}
            </div>
            {person.name}
          </h2>
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
            {title}
          </span>
        </div>
      </div>
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
        <CalendarGrid
          events={tasks.filter((t) => t.contextId === person.id)}
          baseColor={mappedColorName}
          onAdd={onAddEvent}
          onEventClick={onEventClick}
        />
      </div>
    </div>
  );
};

// ===========================================================================
// Sistema de tablero (rediseño salas) — estilo ClickUp/Linear, denso y limpio.
// Componentes compartidos por Sala de Accounts, Edición y Gestión.
// ===========================================================================

const SHORT_MONTHS_ES = [
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
  "dic",
];

const formatShortDate = (dateStr) => {
  if (!dateStr) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateStr));
  if (!m) return String(dateStr);
  const month = SHORT_MONTHS_ES[parseInt(m[2], 10) - 1] || "";
  return `${parseInt(m[3], 10)} ${month}`;
};

// Pastillas suaves para prioridad / jerarquía / categoría / vencimiento.
const PILL_TONES = {
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
  slate: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
};

// Acento lateral (border-left) por tono.
const ACCENT_BORDER = {
  red: "border-l-red-500",
  orange: "border-l-orange-500",
  amber: "border-l-amber-500",
  emerald: "border-l-emerald-500",
  teal: "border-l-teal-500",
  blue: "border-l-blue-500",
  indigo: "border-l-indigo-500",
  violet: "border-l-violet-500",
  slate: "border-l-slate-300 dark:border-l-slate-600",
};

// Mapa color almacenado de persona -> familia tailwind sólida para avatar.
const AVATAR_FAMILY = {
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
  c26: "pink",
};

const getInitials = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const buildAssignee = (person, legacyColorMap = {}) => {
  if (!person) return null;
  let key = person.color;
  if (legacyColorMap && legacyColorMap[key]) key = legacyColorMap[key];
  const family = AVATAR_FAMILY[key] || "slate";
  return {
    name: person.name || "Sin asignar",
    initials: getInitials(person.name),
    className: `bg-${family}-600 text-white`,
    photo: person.photo || "",
  };
};

// Avatar de persona reutilizable: muestra la foto si existe, o las iniciales.
const PersonAvatar = ({ person, size = 24, legacyColorMap = {}, className = "" }) => {
  const dim = { width: size, height: size };
  if (!person) {
    return (
      <span
        style={dim}
        className={`rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0 ${className}`}
      >
        <Icon name="User" size={Math.round(size * 0.55)} />
      </span>
    );
  }
  const meta = buildAssignee(person, legacyColorMap);
  if (meta.photo) {
    return (
      <img
        src={meta.photo}
        alt={meta.name}
        style={dim}
        className={`rounded-full object-cover shrink-0 border border-black/5 dark:border-white/10 ${className}`}
      />
    );
  }
  return (
    <span
      style={{ ...dim, fontSize: Math.round(size * 0.4) }}
      className={`rounded-full flex items-center justify-center font-bold shrink-0 ${meta.className} ${className}`}
    >
      {meta.initials}
    </span>
  );
};

// Estados operativos del cliente (reemplazan el "mood" subjetivo).
const CLIENT_STATUSES = [
  {
    id: "Activo",
    label: "Activo",
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    id: "Pausado",
    label: "Pausado",
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    id: "Inactivo",
    label: "Inactivo",
    dot: "bg-slate-400",
    text: "text-slate-500 dark:text-slate-400",
    bg: "bg-slate-500/10",
  },
];
const getClientStatus = (client) =>
  CLIENT_STATUSES.find((s) => s.id === (client?.status || "Activo")) ||
  CLIENT_STATUSES[0];

// Menú "⋯" con acciones de tarjeta (avanzar, volver, editar, eliminar).
const CardMenu = ({ items = [] }) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (
        menuRef.current?.contains(e.target) ||
        btnRef.current?.contains(e.target)
      )
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

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        aria-label="Más acciones"
        aria-haspopup="true"
        aria-expanded={open}
        className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Icon name="MoreHorizontal" size={16} />
      </button>
      {open && (
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            width: 190,
            zIndex: 9999,
          }}
          className="py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl shadow-black/10 dark:shadow-black/50 fade-in"
        >
          {items.map((it) => (
            <button
              key={it.key}
              disabled={it.disabled}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                it.onClick?.();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] font-semibold transition-colors disabled:opacity-40 ${
                it.danger
                  ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon name={it.icon} size={15} /> {it.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

// Tarjeta compartida: compacta, navegable y consistente en todas las salas.
const KanbanCard = ({
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
  selected = false,
  statusControl = null,
}) => {
  const accent = isOverdue
    ? "border-l-red-500"
    : ACCENT_BORDER[accentTone] || "border-l-transparent";
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Abrir tarea ${title}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (
          event.target === event.currentTarget &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          onClick?.();
        }
      }}
      draggable={draggable ? "true" : undefined}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`task-card group relative cursor-pointer rounded-xl border border-[#ddd9d1] border-l-[3px] bg-white p-4 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-px hover:border-[#aaa69d] focus-visible:outline-none dark:border-white/10 dark:bg-[#232724] dark:hover:border-white/20 ${selected ? "ring-2 ring-[#b78000]/70 dark:ring-[#e4aa19]/70" : ""} ${accent}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5 min-h-[20px]">
        <div className="min-w-0 flex-1">
          {client && (
            <span className="inline-flex max-w-full items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-slate-500 dark:text-slate-400">
              <Icon name="Briefcase" size={10} className="shrink-0" />
              <span className="truncate">{client}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {rank != null && (
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5">
              #{rank}
            </span>
          )}
          {menuItems.length > 0 && (
            <span className="opacity-70 group-hover:opacity-100 transition-opacity">
              <CardMenu items={menuItems} />
            </span>
          )}
        </div>
      </div>

      <p className="mb-2.5 line-clamp-2 text-[15px] font-semibold leading-snug text-slate-800 dark:text-slate-100">
        {title}
      </p>

      {badges.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {badges.map((b, i) => (
            <span
              key={i}
              className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                b.className || PILL_TONES[b.tone] || PILL_TONES.slate
              }`}
            >
              {b.label}
            </span>
          ))}
        </div>
      )}

      {statusControl && (
        <label
          className="mb-2.5 block"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
        >
          <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
            Estado
          </span>
          <span className="relative block">
            <select
              value={statusControl.value}
              onChange={(event) => statusControl.onChange(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              onDragStart={(event) => event.stopPropagation()}
              aria-label={`Cambiar estado de ${title}`}
              className="min-h-11 w-full appearance-none rounded-lg border border-[#d8d5ce] bg-[#f7f6f2] px-3 py-2 pr-10 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-white/10 dark:bg-[#1b1f1c] dark:text-slate-200 lg:min-h-9 lg:py-1.5 lg:text-xs"
            >
              {statusControl.options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label || option.title}
                </option>
              ))}
            </select>
            <Icon
              name="ChevronDown"
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
          </span>
        </label>
      )}

      {notes && (
        <p className="mb-2 line-clamp-1 text-[11.5px] leading-snug text-slate-400 dark:text-slate-500">
          {notes}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-white/5">
        {due ? (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
              due.tone === "red"
                ? "text-red-500 dark:text-red-400"
                : due.tone === "amber"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-slate-400 dark:text-slate-500"
            }`}
          >
            <Icon name="CalendarDays" size={12} className="shrink-0" />
            {due.label}
          </span>
        ) : (
          <span />
        )}
        {assignee ? (
          assignee.photo ? (
            <img
              src={assignee.photo}
              alt={assignee.name}
              title={assignee.name}
              className="w-6 h-6 rounded-full object-cover shrink-0 border border-black/5 dark:border-white/10"
            />
          ) : (
            <span
              title={assignee.name}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${assignee.className}`}
            >
              {assignee.initials}
            </span>
          )
        ) : (
          <span className="w-6 h-6 rounded-full border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-300 dark:text-slate-600 shrink-0">
            <Icon name="User" size={11} />
          </span>
        )}
      </div>
    </div>
  );
};

// Columna de tablero compartida (cabecera discreta + cuerpo + añadir).
const KanbanColumn = ({
  dotColor = "slate",
  title,
  subtitle,
  count,
  onAdd,
  onDragOver,
  onDragLeave,
  onDrop,
  isEmpty,
  children,
}) => {
  const columnColor = getDashboardPalette(dotColor).strong;
  return (
    <section
      className="task-room-column flex h-[calc(100dvh-15rem)] min-h-[32rem] w-[88vw] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-[#dedbd4] bg-[#efeee9] transition-colors dark:border-white/10 dark:bg-[#191d1a] sm:w-[24rem] lg:h-full lg:min-h-0 lg:w-auto lg:shrink"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      aria-label={`${title}: ${count} tareas`}
    >
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[#dfddd7] bg-[#f7f6f3]/80 px-4 py-3.5 dark:border-white/10 dark:bg-[#1f2320]/90">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: columnColor }}
            />
            <span className="truncate text-sm font-semibold text-[#2f3437] dark:text-[#f1efe9]">
              {title}
            </span>
            <span className="mono-meta shrink-0 rounded-md bg-[#e6e4df] px-2 py-0.5 text-[11px] font-semibold text-[#787774] dark:bg-[#2a2a27] dark:text-[#aaa7a0]">
              {count}
            </span>
          </div>
          {subtitle && (
            <p className="mt-1.5 pl-5 text-[11px] text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            aria-label={`Añadir tarea en ${title}`}
            title="Añadir tarea"
            className="flex h-8 min-h-0 w-8 min-w-0 items-center justify-center rounded-md text-[#787774] hover:bg-[#e6e4df] hover:text-[#2f3437] dark:text-[#aaa7a0] dark:hover:bg-[#2a2a27] dark:hover:text-[#f1efe9]"
          >
            <Icon name="Plus" size={15} />
          </button>
        )}
      </header>
      <div className="custom-scroll flex-1 space-y-3 overflow-y-auto overscroll-contain p-3">
        {isEmpty && (
          <div className="flex h-full min-h-40 select-none flex-col items-center justify-center gap-2 text-slate-300 dark:text-slate-600">
            <Icon name="Inbox" size={24} />
            <span className="text-[11px] font-semibold">Sin tareas en esta etapa</span>
          </div>
        )}
        {children}
      </div>
    </section>
  );
};

const KanbanStage = ({
  title,
  dotColor = "slate",
  tasks,
  renderTask,
  showHeader = true,
  collapsible = false,
  collapsedLimit = 3,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const [expanded, setExpanded] = useState(false);
  const color = getDashboardPalette(dotColor).strong;
  const canCollapse = collapsible && tasks.length > collapsedLimit;
  const visibleTasks = canCollapse && !expanded ? tasks.slice(0, collapsedLimit) : tasks;

  return (
    <section
      className="rounded-lg border border-transparent transition-colors [&.drag-over]:border-[#b78000] [&.drag-over]:bg-[#b78000]/5"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      aria-label={`${title}: ${tasks.length} tareas`}
    >
      {showHeader && (
        <div className="mb-2 flex items-center justify-between rounded-lg border border-[#dfddd7] bg-[#f7f6f3] px-3 py-2.5 dark:border-white/10 dark:bg-[#202421]">
          <div className="flex min-w-0 items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <span className="truncate text-[11px] font-semibold uppercase tracking-[0.07em] text-slate-600 dark:text-slate-300">
              {title}
            </span>
            <span className="rounded bg-[#e9e7e1] px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-[#2c302c] dark:text-slate-400">
              {tasks.length}
            </span>
          </div>
          {canCollapse && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-black/5 dark:text-slate-400 dark:hover:bg-white/5"
              aria-label={expanded ? `Contraer ${title}` : `Expandir ${title}`}
            >
              <Icon name={expanded ? "ChevronUp" : "ChevronDown"} size={14} />
            </button>
          )}
        </div>
      )}
      <div className="space-y-2.5">
        {visibleTasks.map((task) => renderTask(task))}
      </div>
      {canCollapse && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#cbc7bf] px-3 py-2.5 text-xs font-semibold text-slate-500 hover:border-[#aaa69d] hover:text-slate-700 dark:border-white/15 dark:text-slate-400 dark:hover:border-white/25 dark:hover:text-slate-200"
        >
          Ver {tasks.length - collapsedLimit} más
          <Icon name="ChevronDown" size={14} />
        </button>
      )}
    </section>
  );
};

const TaskRoomInspector = ({
  task,
  client,
  assignee,
  status,
  onClose,
  onOpenFull,
}) => {
  if (!task) return null;
  const checklist = Array.isArray(task.checklist) ? task.checklist : [];
  const completed = checklist.filter((item) => item.done).length;
  const progress = checklist.length ? Math.round((completed / checklist.length) * 100) : 0;
  const activity = [
    ...(Array.isArray(task.comments)
      ? task.comments.map((item) => ({
          id: item.id,
          author: item.authorName || "Equipo",
          text: item.text,
          date: item.createdAt,
        }))
      : []),
    ...(Array.isArray(task.timeEntries)
      ? task.timeEntries.map((item) => ({
          id: item.id,
          author: item.authorName || "Equipo",
          text: "Registró tiempo en la tarea",
          date: item.loggedAt,
        }))
      : []),
  ]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 3);
  const priority = task.priority
    ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1)
    : "Normal";
  const isOverdue = isDateBeforeDateString(task.date, getHondurasTodayStr()) &&
    !isCompletedStatus(task.status);

  return (
    <aside className="task-room-inspector fixed inset-x-3 bottom-3 top-20 z-40 flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#d8d5ce] bg-[#f7f6f2] shadow-2xl dark:border-white/10 dark:bg-[#1c201d] 2xl:static 2xl:z-auto 2xl:shadow-none">
      <div className="custom-scroll flex-1 overflow-y-auto p-5">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {client && (
              <p className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                <Icon name="Briefcase" size={11} />
                {client}
              </p>
            )}
            <h3 className="text-lg font-semibold leading-snug text-slate-900 dark:text-[#f1efe9]">
              {task.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-black/5 dark:text-slate-400 dark:hover:bg-white/5"
            aria-label="Cerrar inspector"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-[#dedbd4] bg-white px-3 py-2.5 dark:border-white/10 dark:bg-[#242824]">
            <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">Estado</p>
            <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">{status?.title || "Sin estado"}</p>
          </div>
          <div className={`rounded-lg border px-3 py-2.5 ${priority.toLowerCase() === "urgente" ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300" : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"}`}>
            <p className="text-[9px] font-semibold uppercase tracking-[0.08em] opacity-70">Prioridad</p>
            <p className="mt-1 text-xs font-semibold">{priority}</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 border-b border-[#dedbd4] pb-6 dark:border-white/10">
          <div>
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">Responsable</p>
            <div className="flex items-center gap-2">
              {assignee ? (
                <>
                  {assignee.photo ? (
                    <img src={assignee.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold ${assignee.className}`}>
                      {assignee.initials}
                    </span>
                  )}
                  <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{assignee.name}</span>
                </>
              ) : (
                <span className="text-xs text-slate-500">Sin asignar</span>
              )}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">Vencimiento</p>
            <p className={`inline-flex items-center gap-1.5 text-xs font-semibold ${isOverdue ? "text-red-500" : "text-slate-700 dark:text-slate-200"}`}>
              <Icon name="CalendarDays" size={14} />
              {formatShortDate(task.date)}{isOverdue ? " · atrasada" : ""}
            </p>
          </div>
        </div>

        <div className="mb-6 border-b border-[#dedbd4] pb-6 dark:border-white/10">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">Progreso</p>
            <span className="text-xs font-semibold text-slate-500">{progress}%</span>
          </div>
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-[#dedbd4] dark:bg-white/10">
            <span className="block h-full rounded-full bg-[#b78000] transition-[width]" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {checklist.length ? `${completed} de ${checklist.length} completadas` : "Sin checklist"}
          </p>
        </div>

        {task.notes && (
          <div className="mb-6 border-b border-[#dedbd4] pb-6 dark:border-white/10">
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">Descripción</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">{task.notes}</p>
          </div>
        )}

        <div>
          <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">Actividad reciente</p>
          {activity.length ? (
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="flex gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2f6f58] text-[9px] font-bold text-white">
                    {getInitials(item.author)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{item.author}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">Sin actividad registrada.</p>
          )}
        </div>
      </div>
      <div className="border-t border-[#dedbd4] p-4 dark:border-white/10">
        <button
          type="button"
          onClick={onOpenFull}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#171817] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#30322f] dark:bg-[#f1efe9] dark:text-[#181817] dark:hover:bg-white"
        >
          Abrir tarea completa
          <Icon name="ExternalLink" size={15} />
        </button>
      </div>
    </aside>
  );
};

const TaskRoomWorkspace = ({
  groups,
  onAdd,
  canAdd = true,
  renderTask,
  onDragOver,
  onDragLeave,
  onDrop,
  inspector,
}) => (
  <div className={`task-room-workspace grid min-h-0 flex-1 gap-3 ${inspector ? "2xl:grid-cols-[minmax(0,1fr)_22rem]" : ""}`}>
    <div className="task-room-board flex min-h-0 gap-3 overflow-x-auto pb-4 snap-x snap-mandatory kanban-mobile-scroll lg:grid lg:grid-cols-3 lg:overflow-hidden lg:pb-0">
      {groups.map((group) => {
        const count = group.stages.reduce((total, stage) => total + stage.tasks.length, 0);
        return (
          <KanbanColumn
            key={group.id}
            dotColor={group.color}
            title={group.title}
            subtitle={group.subtitle}
            count={count}
            onAdd={canAdd ? onAdd : undefined}
            isEmpty={count === 0}
          >
            {group.stages.map((stage) => (
              <KanbanStage
                key={stage.id}
                title={stage.title}
                dotColor={stage.color}
                tasks={stage.tasks}
                renderTask={(task) => renderTask(task, stage)}
                showHeader={group.stages.length > 1}
                collapsible={stage.collapsible}
                collapsedLimit={stage.collapsedLimit}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={(event) => onDrop(event, stage.id)}
              />
            ))}
          </KanbanColumn>
        );
      })}
    </div>
    {inspector}
  </div>
);

const DateHeader = ({
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
  taskCount = 0,
}) => {
  const today = getHondurasTodayStr();
  const hasRangeSupport = Boolean(setRangeStart && setRangeEnd);
  const effectiveRangeStart = rangeStart || today;
  const effectiveRangeEnd = rangeEnd || today;
  const periodDate = new Date(`${currentDate || today}T12:00:00`);
  const periodLabel = new Intl.DateTimeFormat("es-HN", {
    month: "long",
    year: "numeric",
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

  const segBase =
    "shrink-0 min-h-9 px-3 py-2 text-[12px] font-medium rounded-lg transition-colors flex items-center gap-1.5";
  const segActive =
    "bg-white text-[#252724] shadow-sm dark:bg-[#30342f] dark:text-[#f1efe9]";
  const segIdle =
    "text-slate-500 dark:text-slate-400 hover:bg-black/5 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-slate-200";

  return (
    <header className="task-room-header shrink-0 border-b border-[#dedbd4] pb-3 dark:border-white/10">
      <div className="mb-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h2 className="editorial-title truncate text-[clamp(1.75rem,3vw,2.5rem)] leading-none text-[#2f3437] dark:text-[#f1efe9]">
            {title}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {taskCount} {taskCount === 1 ? "tarea" : "tareas"} · {periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1)}
          </p>
        </div>
        <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center lg:w-auto">
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            placeholder="Buscar tarea..."
          />
          <div className="shrink-0">
            <Button
              onClick={() =>
                onAdd(
                  filterMode === "date"
                    ? currentDate
                    : filterMode === "range"
                      ? effectiveRangeStart
                      : today,
                )
              }
              color={btnColor}
              icon={btnIcon}
              full
            >
              Nueva Tarea
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
          <div className="flex max-w-full overflow-x-auto rounded-lg bg-[#ebe9e3] p-1 kanban-mobile-scroll dark:bg-[#242824]">
            <button
              onClick={() => setFilterMode("date")}
              className={`${segBase} ${filterMode === "date" ? segActive : segIdle}`}
            >
              <Icon name="CalendarDays" size={14} />
              Día específico
            </button>
            {hasRangeSupport && (
              <button
                onClick={() => setFilterMode("range")}
                className={`${segBase} ${filterMode === "range" ? segActive : segIdle}`}
              >
                <Icon name="CalendarRange" size={14} />
                Rango
              </button>
            )}
            <button
              onClick={() => setFilterMode("overdue")}
              className={`${segBase} ${filterMode === "overdue" ? "bg-[#fdebec] text-[#9f2f2d] dark:bg-red-500/15 dark:text-red-300" : segIdle}`}
            >
              Atrasadas <Icon name="Flame" size={14} />
            </button>
            <button
              onClick={() => setFilterMode("all")}
              className={`${segBase} ${filterMode === "all" ? segActive : segIdle}`}
            >
              Este mes
            </button>
            {onLoadHistory && (
              <button
                onClick={async () => {
                  if (!historyLoaded) await onLoadHistory();
                  setFilterMode("history");
                }}
                disabled={historyLoading}
                className={`${segBase} ${filterMode === "history" ? segActive : segIdle}`}
              >
                <Icon name="Clock" size={14} />
                {historyLoading ? "Cargando" : "Histórico"}
              </button>
            )}
          </div>
          {setOwnershipFilter && (
            <div className="flex max-w-full overflow-x-auto rounded-lg bg-[#ebe9e3] p-1 kanban-mobile-scroll dark:bg-[#242824]">
              <button
                onClick={() => setOwnershipFilter("all")}
                className={`${segBase} ${ownershipFilter === "all" ? segActive : segIdle}`}
              >
                Todo el equipo
              </button>
              <button
                onClick={() => setOwnershipFilter("mine")}
                className={`${segBase} ${ownershipFilter === "mine" ? segActive : segIdle}`}
              >
                <Icon name="User" size={14} />
                Asignadas a mí
              </button>
            </div>
          )}
          {filterMode === "date" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="min-h-10 rounded-lg border border-[#d8d5ce] bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-600 outline-none focus:border-[#8e8a82] dark:border-white/10 dark:bg-[#242824] dark:text-slate-300"
              />
              {currentDate === today && (
                <span className="text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-bold px-2 py-1 rounded-full shrink-0">
                  Hoy
                </span>
              )}
            </div>
          )}
          {filterMode === "range" && hasRangeSupport && (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={effectiveRangeStart}
                onChange={handleRangeStartChange}
                className="min-h-10 rounded-lg border border-[#d8d5ce] bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-600 outline-none focus:border-[#8e8a82] dark:border-white/10 dark:bg-[#242824] dark:text-slate-300"
              />
              <span className="text-xs font-semibold text-slate-400">→</span>
              <input
                type="date"
                value={effectiveRangeEnd}
                min={effectiveRangeStart}
                onChange={handleRangeEndChange}
                className="min-h-10 rounded-lg border border-[#d8d5ce] bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-600 outline-none focus:border-[#8e8a82] dark:border-white/10 dark:bg-[#242824] dark:text-slate-300"
              />
            </div>
          )}
      </div>
    </header>
  );
};

const AccountRoomView = ({
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
  historyLoading,
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
    setRangeEnd,
  } = useTaskRoomState("cluster_account_room_state", {
    preferMine: Boolean(currentUserProfile?.linkedManagerId),
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const todayStr = getHondurasTodayStr();
  const currentMonthPeriod = getRankingMonthPeriod(todayStr);

  const columns = [
    {
      id: "por_disenar",
      title: "Por Diseñar",
      color: "slate",
      icon: "PenTool",
    },
    {
      id: "aprobacion_interna",
      title: "Aprobación Interna",
      color: "blue",
      icon: "Search",
    },
    {
      id: "aprobado_internamente",
      title: "Aprobado Interno",
      color: "emerald",
      icon: "CheckCircle2",
    },
    { id: "publicado", title: "Publicado", color: "indigo", icon: "Sparkles" },
  ];

  const effectiveRangeStart = rangeStart || todayStr;
  const effectiveRangeEnd = rangeEnd || todayStr;
  const filteredTasks = tasks.filter((t) => {
    if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase()))
      return false;
    if (
      ownershipFilter === "mine" &&
      !isTaskAssignedToProfile(t, currentUserProfile, [
        currentUserProfile?.linkedManagerId,
      ])
    )
      return false;
    if (filterMode === "date")
      return compareDateOnlyStrings(t.date, currentDate) === 0;
    if (filterMode === "overdue")
      return (
        isDateBeforeDateString(t.date, todayStr) && t.status !== "publicado"
      );
    if (filterMode === "range")
      return (
        compareDateOnlyStrings(t.date, effectiveRangeStart) >= 0 &&
        compareDateOnlyStrings(t.date, effectiveRangeEnd) <= 0
      );
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
        "dark",
      )
        ? "#0f172a"
        : "#ffffff";
      clone.style.borderRadius = "0.75rem";
      clone.style.boxShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.4)";
      clone.style.transform = "rotate(3deg) scale(1.05)";
      clone.style.zIndex = "99999";
      clone.style.pointerEvents = "none";
      document.body.appendChild(clone);
      e.dataTransfer.setDragImage(clone, x, y);
    } catch (err) {}
    setTimeout(() => e.currentTarget.classList.add("drag-source-hidden"), 0);
  };

  const handleDragEnd = (e, taskId) => {
    e.currentTarget.classList.remove("drag-source-hidden");
    setDraggedTaskId(null);
    document
      .querySelectorAll(".drag-over")
      .forEach((el) => el.classList.remove("drag-over"));
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

  const defaultAddDate =
    filterMode === "date"
      ? currentDate
      : filterMode === "range"
        ? effectiveRangeStart
        : todayStr;
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;
  const selectedManager = selectedTask
    ? managers.find((manager) => manager.id === selectedTask.contextId)
    : null;
  const selectedClient = selectedTask
    ? clients.find((client) => client.id === selectedTask.clientId)
    : null;
  const accountGroups = [
    {
      id: "start",
      title: "Por iniciar",
      subtitle: "Tareas pendientes de comenzar",
      color: "slate",
      stages: [{ ...columns[0], tasks: filteredTasks.filter((task) => task.status === columns[0].id) }],
    },
    {
      id: "production",
      title: "En producción",
      subtitle: "Validación y aprobación interna",
      color: "blue",
      stages: [{ ...columns[1], tasks: filteredTasks.filter((task) => task.status === columns[1].id) }],
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
        collapsedLimit: 3,
      })),
    },
  ];

  const renderAccountTask = (task, stage) => {
    const columnIndex = columns.findIndex((column) => column.id === stage.id);
    const previous = columns[columnIndex - 1];
    const next = columns[columnIndex + 1];
    const manager = managers.find((item) => item.id === task.contextId);
    const client = clients.find((item) => item.id === task.clientId);
    const isOverdue =
      isDateBeforeDateString(task.date, todayStr) && stage.id !== "publicado";
    const menuItems = [];
    if (next)
      menuItems.push({
        key: "next",
        label: next.id === "publicado" ? "Publicar" : `Avanzar a ${next.title}`,
        icon: next.id === "publicado" ? "CheckCircle2" : "ArrowRight",
        onClick: () => onChangeStatus(task, next.id),
      });
    if (previous)
      menuItems.push({
        key: "prev",
        label: `Volver a ${previous.title}`,
        icon: "ChevronLeft",
        onClick: () => onChangeStatus(task, previous.id),
      });
    menuItems.push(
      { key: "edit", label: "Editar", icon: "Edit", onClick: () => onEdit(task) },
      { key: "delete", label: "Eliminar", icon: "Trash2", danger: true, onClick: () => onDelete(task.id) },
    );

    return (
      <KanbanCard
        key={task.id}
        onClick={() => setSelectedTaskId(task.id)}
        selected={selectedTaskId === task.id}
        draggable
        onDragStart={(event) => handleDragStart(event, task.id)}
        onDragEnd={(event) => handleDragEnd(event, task.id)}
        accentTone={stage.color}
        isOverdue={isOverdue}
        client={client?.name}
        title={task.title}
        badges={
          task.priority
            ? [{
                label: task.priority,
                tone: task.priority === "urgente" ? "red" : task.priority === "recurrente" ? "emerald" : "amber",
              }]
            : []
        }
        due={{
          label: formatShortDate(task.date) + (isOverdue ? " · atrasada" : ""),
          tone: isOverdue ? "red" : "slate",
        }}
        assignee={buildAssignee(manager, legacyColorMap)}
        menuItems={menuItems}
        statusControl={{
          value: task.status,
          options: columns,
          onChange: (status) => {
            if (status !== task.status) onChangeStatus(task, status);
          },
        }}
      />
    );
  };

  return (
    <div className="task-room min-h-0 flex flex-col gap-3 fade-in">
      <DateHeader
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        ownershipFilter={ownershipFilter}
        setOwnershipFilter={setOwnershipFilter}
        title="Sala de Accounts"
        onAdd={handleAddTask}
        btnColor="indigo"
        btnIcon="Briefcase"
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        rangeStart={rangeStart}
        setRangeStart={setRangeStart}
        rangeEnd={rangeEnd}
        setRangeEnd={setRangeEnd}
        onLoadHistory={onLoadHistory}
        historyLoaded={historyLoaded}
        historyLoading={historyLoading}
        taskCount={filteredTasks.length}
      />
      <TaskRoomWorkspace
        groups={accountGroups}
        onAdd={() => handleAddTask(defaultAddDate)}
        renderTask={renderAccountTask}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        inspector={
          selectedTask ? (
            <TaskRoomInspector
              task={selectedTask}
              client={selectedClient?.name}
              assignee={buildAssignee(selectedManager, legacyColorMap)}
              status={columns.find((column) => column.id === selectedTask.status)}
              onClose={() => setSelectedTaskId(null)}
              onOpenFull={() => onTaskClick(selectedTask)}
            />
          ) : null
        }
      />
    </div>
  );
};

const EditionsRoomView = ({
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
  historyLoading,
}) => {
  const {
    currentDate,
    setCurrentDate,
    filterMode,
    setFilterMode,
    ownershipFilter,
    setOwnershipFilter,
  } = useTaskRoomState("cluster_editions_room_state", {
    preferMine: Boolean(currentUserProfile?.linkedEditorId),
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const todayStr = getHondurasTodayStr();
  const currentMonthPeriod = getRankingMonthPeriod(todayStr);

  const columns = [
    { id: "editar", title: "Por Editar", color: "slate", icon: "PenTool" },
    { id: "en_edicion", title: "En Edición", color: "amber", icon: "Video" },
    {
      id: "revision_interna",
      title: "En Revisión",
      color: "blue",
      icon: "Search",
    },
    {
      id: "aprobado",
      title: "Aprobado",
      color: "emerald",
      icon: "CheckCircle2",
    },
    { id: "publicado", title: "Publicado", color: "indigo", icon: "Sparkles" },
  ];

  const priorityStyles = {
    urgente:
      "bg-red-50 dark:bg-red-500/20 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400",
    normal:
      "bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400",
    recurrente:
      "bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
  };
  const hierarchyStyles = {
    p1: "bg-red-50 dark:bg-red-500/20 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400",
    p2: "bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400",
    p3: "bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
    p4: "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300",
  };

  const filteredTasks = tasks.filter((t) => {
    if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase()))
      return false;
    if (
      ownershipFilter === "mine" &&
      !isTaskAssignedToProfile(t, currentUserProfile, [
        currentUserProfile?.linkedEditorId,
      ])
    )
      return false;
    if (filterMode === "date")
      return compareDateOnlyStrings(t.date, currentDate) === 0;
    if (filterMode === "overdue")
      return (
        isDateBeforeDateString(t.date, todayStr) && t.status !== "publicado"
      );
    if (filterMode === "history") return true;
    return isDateWithinPeriod(t.date, currentMonthPeriod);
  });
  const canManageEditingTasks = userHasPermission(
    currentUserProfile,
    "manage_editing_tasks",
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
    ...filteredTasks.filter((task) => !isEditingActionable(task)),
  ];
  const rankingMap = rankedTasks.reduce(
    (acc, task, index) => ({ ...acc, [task.id]: index + 1 }),
    {},
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
        "dark",
      )
        ? "#0f172a"
        : "#ffffff";
      clone.style.borderRadius = "0.75rem";
      clone.style.boxShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.4)";
      clone.style.transform = "rotate(3deg) scale(1.05)";
      clone.style.zIndex = "99999";
      clone.style.pointerEvents = "none";
      document.body.appendChild(clone);
      e.dataTransfer.setDragImage(clone, x, y);
    } catch (err) {}
    setTimeout(() => e.currentTarget.classList.add("drag-source-hidden"), 0);
  };

  const handleDragEnd = (e, taskId) => {
    e.currentTarget.classList.remove("drag-source-hidden");
    setDraggedTaskId(null);
    document
      .querySelectorAll(".drag-over")
      .forEach((el) => el.classList.remove("drag-over"));
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
  const selectedEditor = selectedTask
    ? editors.find((editor) => editor.id === selectedTask.contextId)
    : null;
  const selectedClient = selectedTask
    ? clients.find((client) => client.id === selectedTask.clientId)
    : null;
  const editingGroups = [
    {
      id: "start",
      title: "Por iniciar",
      subtitle: "Tareas pendientes de comenzar",
      color: "slate",
      stages: [{
        ...columns[0],
        tasks: displayTasks.filter(
          (task) => normalizeEditingWorkflowStatus(task.status) === columns[0].id,
        ),
      }],
    },
    {
      id: "production",
      title: "En producción",
      subtitle: "En edición o en revisión",
      color: "amber",
      stages: columns.slice(1, 3).map((column) => ({
        ...column,
        tasks: displayTasks.filter(
          (task) => normalizeEditingWorkflowStatus(task.status) === column.id,
        ),
      })),
    },
    {
      id: "ready",
      title: "Listas",
      subtitle: "Aprobadas y publicadas",
      color: "emerald",
      stages: columns.slice(3).map((column) => ({
        ...column,
        tasks: displayTasks.filter(
          (task) => normalizeEditingWorkflowStatus(task.status) === column.id,
        ),
        collapsible: column.id === "publicado",
        collapsedLimit: 3,
      })),
    },
  ];

  const renderEditingTask = (task, stage) => {
    const columnIndex = columns.findIndex((column) => column.id === stage.id);
    const previous = columns[columnIndex - 1];
    const next = columns[columnIndex + 1];
    const editor = editors.find((item) => item.id === task.contextId);
    const client = clients.find((item) => item.id === task.clientId);
    const isOverdue =
      isDateBeforeDateString(task.date, todayStr) && !isCompletedStatus(task.status);
    const hierarchyId = task.hierarchy || getEditingHierarchyId(task);
    const hierarchyTone =
      hierarchyId === "p1"
        ? "red"
        : hierarchyId === "p2"
          ? "amber"
          : hierarchyId === "p3"
            ? "emerald"
            : "slate";
    const priorityTone =
      task.priority === "urgente"
        ? "red"
        : task.priority === "recurrente"
          ? "emerald"
          : "amber";
    const menuItems = [];
    if (canManageEditingTasks) {
      if (next)
        menuItems.push({
          key: "next",
          label: next.id === "publicado" ? "Publicar" : `Avanzar a ${next.title}`,
          icon: next.id === "publicado" ? "CheckCircle2" : "ArrowRight",
          onClick: () => onChangeStatus(task, next.id),
        });
      if (previous)
        menuItems.push({
          key: "prev",
          label: `Volver a ${previous.title}`,
          icon: "ChevronLeft",
          onClick: () => onChangeStatus(task, previous.id),
        });
      menuItems.push(
        { key: "edit", label: "Editar", icon: "Edit", onClick: () => onEdit(task) },
        { key: "delete", label: "Eliminar", icon: "Trash2", danger: true, onClick: () => onDelete(task.id) },
      );
    }

    return (
      <KanbanCard
        key={task.id}
        onClick={() => setSelectedTaskId(task.id)}
        selected={selectedTaskId === task.id}
        draggable
        onDragStart={(event) => handleDragStart(event, task.id)}
        onDragEnd={(event) => handleDragEnd(event, task.id)}
        accentTone={hierarchyTone}
        isOverdue={isOverdue}
        client={client?.name}
        rank={rankingMap[task.id]}
        title={task.title}
        notes={task.notes}
        badges={[
          { label: hierarchyId.toUpperCase(), tone: hierarchyTone },
          { label: task.priority || "Normal", tone: priorityTone },
        ]}
        due={{
          label: formatShortDate(task.date) + (isOverdue ? " · atrasada" : ""),
          tone: isOverdue ? "red" : "slate",
        }}
        assignee={buildAssignee(editor)}
        menuItems={menuItems}
        statusControl={
          canManageEditingTasks
            ? {
                value: normalizeEditingWorkflowStatus(task.status),
                options: columns,
                onChange: (status) => {
                  if (status !== normalizeEditingWorkflowStatus(task.status))
                    onChangeStatus(task, status);
                },
              }
            : null
        }
      />
    );
  };

  return (
    <div className="task-room min-h-0 flex flex-col gap-3 fade-in">
      <DateHeader
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        ownershipFilter={ownershipFilter}
        setOwnershipFilter={setOwnershipFilter}
        title="Sala de Edición"
        onAdd={handleAddTask}
        btnColor="amber"
        btnIcon="Video"
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onLoadHistory={onLoadHistory}
        historyLoaded={historyLoaded}
        historyLoading={historyLoading}
        taskCount={filteredTasks.length}
      />
      <TaskRoomWorkspace
        groups={editingGroups}
        onAdd={() => handleAddTask(defaultAddDate)}
        canAdd={canManageEditingTasks}
        renderTask={renderEditingTask}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        inspector={
          selectedTask ? (
            <TaskRoomInspector
              task={selectedTask}
              client={selectedClient?.name}
              assignee={buildAssignee(selectedEditor)}
              status={columns.find(
                (column) => column.id === normalizeEditingWorkflowStatus(selectedTask.status),
              )}
              onClose={() => setSelectedTaskId(null)}
              onOpenFull={() => onTaskClick(selectedTask)}
            />
          ) : null
        }
      />
    </div>
  );
};

const computeManagementDueBadge = (task) => {
  if (!task?.date || !task?.time || !/^\d{2}:\d{2}$/.test(task.time))
    return null;
  const iso = `${task.date}T${task.time}:00-06:00`;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  const diffMs = ms - Date.now();
  const absHours = Math.abs(diffMs) / 3600000;
  if (diffMs >= 0) {
    if (absHours >= 48)
      return { label: `Vence en ${Math.round(absHours / 24)}d`, tone: "slate" };
    if (absHours >= 1)
      return {
        label: `Vence en ${Math.round(absHours)}h`,
        tone: absHours <= 8 ? "amber" : "slate",
      };
    const mins = Math.max(1, Math.round(diffMs / 60000));
    return { label: `Vence en ${mins}m`, tone: "red" };
  }
  if (absHours < 1)
    return {
      label: `Vencida hace ${Math.max(1, Math.round(-diffMs / 60000))}m`,
      tone: "red",
    };
  if (absHours < 48)
    return { label: `Vencida hace ${Math.round(absHours)}h`, tone: "red" };
  return { label: `Vencida hace ${Math.round(absHours / 24)}d`, tone: "red" };
};

const MGMT_CATEGORY_COLORS = {
  seguimiento:
    "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 border-sky-200 dark:border-sky-500/20",
  reunion:
    "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border-purple-200 dark:border-purple-500/20",
  entrega:
    "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 border-orange-200 dark:border-orange-500/20",
  revision:
    "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300 border-teal-200 dark:border-teal-500/20",
};
const getMgmtCategoryColor = (cat) =>
  MGMT_CATEGORY_COLORS[(cat || "").toLowerCase()] ||
  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";

const ManagementRoomView = ({
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
  historyLoading,
}) => {
  const {
    currentDate,
    setCurrentDate,
    filterMode,
    setFilterMode,
    ownershipFilter,
    setOwnershipFilter,
  } = useTaskRoomState("cluster_management_room_state", {
    preferMine: currentUserProfile?.role === "management",
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
      icon: "PauseCircle",
    },
    { id: "cerrado", title: "Cerrado", color: "emerald", icon: "CheckCircle2" },
  ];

  const filteredTasks = tasks.filter((task) => {
    if (
      searchTerm &&
      !task.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    if (
      ownershipFilter === "mine" &&
      !isTaskAssignedToProfile(task, currentUserProfile, [
        currentUserProfile?.id,
      ])
    )
      return false;
    if (filterMode === "date")
      return compareDateOnlyStrings(task.date, currentDate) === 0;
    if (filterMode === "overdue")
      return (
        isDateBeforeDateString(task.date, todayStr) && task.status !== "cerrado"
      );
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
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  };
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;
  const selectedMember = selectedTask
    ? members.find((member) => member.id === selectedTask.contextId)
    : null;
  const selectedClient = selectedTask
    ? clients.find((client) => client.id === selectedTask.clientId)
    : null;
  const buildManagementAssignee = (member) =>
    member
      ? {
          name: member.name,
          initials: getInitials(member.name),
          className: `bg-${AVATAR_FAMILY[member.color] || "violet"}-600 text-white`,
          photo: member.photo || "",
        }
      : null;
  const managementGroups = [
    {
      id: "start",
      title: "Por iniciar",
      subtitle: "Tareas pendientes de comenzar",
      color: "slate",
      stages: [{ ...columns[0], tasks: filteredTasks.filter((task) => task.status === columns[0].id) }],
    },
    {
      id: "production",
      title: "En producción",
      subtitle: "En proceso o en espera",
      color: "violet",
      stages: columns.slice(1, 3).map((column) => ({
        ...column,
        tasks: filteredTasks.filter((task) => task.status === column.id),
      })),
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
        collapsedLimit: 3,
      }],
    },
  ];

  const renderManagementTask = (task, stage) => {
    const columnIndex = columns.findIndex((column) => column.id === stage.id);
    const previous = columns[columnIndex - 1];
    const next = columns[columnIndex + 1];
    const member = members.find((item) => item.id === task.contextId);
    const client = clients.find((item) => item.id === task.clientId);
    const isOverdue =
      isDateBeforeDateString(task.date, todayStr) && stage.id !== "cerrado";
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
        onClick: () => onChangeStatus(task, next.id),
      });
    if (previous)
      menuItems.push({
        key: "prev",
        label: `Volver a ${previous.title}`,
        icon: "ChevronLeft",
        onClick: () => onChangeStatus(task, previous.id),
      });
    menuItems.push(
      { key: "edit", label: "Editar", icon: "Edit", onClick: () => onEdit(task) },
      { key: "delete", label: "Eliminar", icon: "Trash2", danger: true, onClick: () => onDelete(task.id) },
    );

    return (
      <KanbanCard
        key={task.id}
        onClick={() => setSelectedTaskId(task.id)}
        selected={selectedTaskId === task.id}
        draggable
        onDragStart={(event) => handleDragStart(event, task.id)}
        onDragEnd={handleDragEnd}
        accentTone={stage.color}
        isOverdue={isOverdue}
        client={client?.name}
        title={task.title}
        notes={task.notes}
        badges={badges}
        due={{
          label:
            formatShortDate(task.date) +
            (task.time ? ` · ${task.time}` : "") +
            (isOverdue ? " · vencida" : ""),
          tone: isOverdue ? "red" : "slate",
        }}
        assignee={buildManagementAssignee(member)}
        menuItems={menuItems}
        statusControl={{
          value: task.status,
          options: columns,
          onChange: (status) => {
            if (status !== task.status) onChangeStatus(task, status);
          },
        }}
      />
    );
  };

  return (
    <div className="task-room min-h-0 flex flex-col gap-3 fade-in">
      {/* Header */}
      <DateHeader
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        ownershipFilter={ownershipFilter}
        setOwnershipFilter={setOwnershipFilter}
        title="Sala de Gestión"
        onAdd={handleAddTask}
        btnColor="violet"
        btnIcon="ShieldCheck"
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onLoadHistory={onLoadHistory}
        historyLoaded={historyLoaded}
        historyLoading={historyLoading}
        taskCount={filteredTasks.length}
      />

      <div className="flex flex-col gap-2 lg:flex-row">
        <div className="surface-subtle flex flex-1 flex-wrap rounded-xl border border-[#e2e0da] p-1.5 dark:border-white/10">
          {columns.map((col) => {
            const filteredCount = filteredTasks.filter(
              (t) => t.status === col.id,
            ).length;
            const totalCount = tasks.filter(
              (task) =>
                task.status === col.id &&
                (filterMode === "history" ||
                  isDateWithinPeriod(task.date, currentMonthPeriod)),
            ).length;
            const isFiltered = filteredCount !== totalCount;
            return (
              <div
                key={col.id}
                className="flex min-w-[130px] flex-1 items-center gap-2.5 rounded-lg px-3 py-2.5"
              >
                <div
                  className={`shrink-0 rounded-md bg-${col.color}-50 p-1.5 dark:bg-${col.color}-500/20`}
                >
                  <Icon
                    name={col.icon}
                    size={16}
                    className={`text-${col.color}-600 dark:text-${col.color}-400`}
                  />
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <p className="mono-meta text-xl font-semibold leading-none text-slate-800 dark:text-white">
                      {filteredCount}
                    </p>
                    {isFiltered && (
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        / {totalCount}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                    {col.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setShowTeam((s) => !s)}
          className="surface flex shrink-0 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 lg:max-w-[260px]"
        >
          <div className="flex -space-x-2 shrink-0">
            {members.slice(0, 4).map((m) => (
              <div
                key={m.id}
                className={`w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-black text-white ${membersWithAlert.find((a) => a.id === m.id) ? "bg-amber-500" : "bg-violet-500"}`}
              >
                {(m.name || "?").slice(0, 2).toUpperCase()}
              </div>
            ))}
            {members.length > 4 && (
              <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-black bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                +{members.length - 4}
              </div>
            )}
          </div>
          <div className="text-left">
            <p className="text-xs font-black text-slate-700 dark:text-slate-200">
              Equipo
            </p>
            {membersWithAlert.length > 0 ? (
              <p className="text-[10px] font-bold text-amber-500">
                {membersWithAlert.length} sin email — ver detalles
              </p>
            ) : (
              <p className="text-[10px] font-bold text-emerald-500">
                Todos con email ✓
              </p>
            )}
          </div>
          <Icon
            name={showTeam ? "ChevronUp" : "ChevronDown"}
            size={14}
            className="text-slate-500 ml-1"
          />
        </button>
      </div>

      {/* Team expanded panel */}
      {showTeam && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 fade-in">
          {members.map((member) => {
            const openCount = tasks.filter(
              (task) =>
                task.contextId === member.id &&
                task.status !== "cerrado" &&
                isDateWithinPeriod(task.date, currentMonthPeriod),
            ).length;
            const hasAlert = !normalizeEmail(member.email);
            return (
              <div
                key={member.id}
                className={`flex items-center gap-3 p-3 rounded-xl border ${hasAlert ? "border-amber-200 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/5" : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"}`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0 ${hasAlert ? "bg-amber-500" : "bg-violet-500"}`}
                >
                  {(member.name || "?").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 dark:text-white text-sm truncate">
                    {member.name}
                  </p>
                  <p
                    className={`text-[10px] truncate ${hasAlert ? "text-amber-500 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}`}
                  >
                    {hasAlert ? "Sin correo asignado" : member.email}
                  </p>
                </div>
                {openCount > 0 && (
                  <span className="shrink-0 text-[10px] font-black bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 px-2 py-1 rounded-full">
                    {openCount} activas
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Indicador de filtros activos */}
      {(filterMode !== "all" || ownershipFilter !== "all" || searchTerm) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Filtros activos:
          </span>
          {filterMode === "date" && (
            <span className="flex items-center gap-1 text-[10px] font-bold bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-500/30">
              <Icon name="Calendar" size={9} />
              Fecha: {currentDate}
            </span>
          )}
          {filterMode === "overdue" && (
            <span className="flex items-center gap-1 text-[10px] font-bold bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-500/30">
              <Icon name="Flame" size={9} />
              Solo atrasadas
            </span>
          )}
          {filterMode === "history" && (
            <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Icon name="Clock" size={9} />
              Histórico completo
            </span>
          )}
          {ownershipFilter === "mine" && (
            <span className="flex items-center gap-1 text-[10px] font-bold bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-500/30">
              <Icon name="User" size={9} />
              Solo mis tareas
            </span>
          )}
          {searchTerm && (
            <span className="flex items-center gap-1 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              <Icon name="Search" size={9} />"{searchTerm}"
            </span>
          )}
          <span className="text-[10px] text-slate-500">
            — mostrando {filteredTasks.length} de {tasks.length} tareas
          </span>
        </div>
      )}

      <TaskRoomWorkspace
        groups={managementGroups}
        onAdd={() => handleAddTask(filterMode === "date" ? currentDate : todayStr)}
        renderTask={renderManagementTask}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        inspector={
          selectedTask ? (
            <TaskRoomInspector
              task={selectedTask}
              client={selectedClient?.name}
              assignee={buildManagementAssignee(selectedMember)}
              status={columns.find((column) => column.id === selectedTask.status)}
              onClose={() => setSelectedTaskId(null)}
              onOpenFull={() => onTaskClick(selectedTask)}
            />
          ) : null
        }
      />
    </div>
  );
};

const RankingNumberField = ({ label, value, onChange, min, max, step = 1 }) => (
  <label className="block min-w-0">
    <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mb-1">
      {label}
    </span>
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(event) => onChange(toConfigNumber(event.target.value, 0))}
      className="w-full min-h-[42px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
    />
  </label>
);

const RankingRulesPanel = ({ rankingSettings, currentUserProfile, onSave }) => {
  const [draft, setDraft] = useState(() =>
    sanitizeRankingSettings(rankingSettings),
  );
  const [saving, setSaving] = useState(false);
  const canEdit = userHasPermission(
    currentUserProfile,
    "manage_ranking_settings",
  );

  useEffect(() => {
    setDraft(sanitizeRankingSettings(rankingSettings));
  }, [rankingSettings]);

  if (!canEdit) return null;

  const updateManagerValue = (key, value) =>
    setDraft((current) => ({
      ...current,
      manager: { ...current.manager, [key]: value },
    }));
  const updateManagerMapValue = (group, key, value) =>
    setDraft((current) => ({
      ...current,
      manager: {
        ...current.manager,
        [group]: { ...current.manager[group], [key]: value },
      },
    }));
  const updateEditingValue = (key, value) =>
    setDraft((current) => ({
      ...current,
      editing: { ...current.editing, [key]: value },
    }));
  const updateEditingMapValue = (group, key, value) =>
    setDraft((current) => ({
      ...current,
      editing: {
        ...current.editing,
        [group]: { ...current.editing[group], [key]: value },
      },
    }));

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(sanitizeRankingSettings(draft));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Icon name="Trophy" size={18} className="text-yellow-500" /> Reglas
            de ranking
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pesos activos para productividad, tiempos, planificacion e ideas.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() =>
              setDraft(sanitizeRankingSettings(DEFAULT_RANKING_SETTINGS))
            }
            className="min-h-[42px] rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="min-h-[42px] rounded-xl bg-purple-600 px-4 text-sm font-black text-white hover:bg-purple-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Icon
              name={saving ? "Loader2" : "Save"}
              size={15}
              className={saving ? "animate-spin" : ""}
            />
            Guardar reglas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-950/40">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
            Entregas
          </p>
          <div className="grid grid-cols-2 gap-3">
            {Object.keys(draft.manager.taskPoints).map((key) => (
              <RankingNumberField
                key={key}
                label={key.toUpperCase()}
                value={draft.manager.taskPoints[key]}
                onChange={(value) =>
                  updateManagerMapValue("taskPoints", key, value)
                }
              />
            ))}
            <RankingNumberField
              label="Publicado"
              value={draft.manager.publishedBonus}
              onChange={(value) => updateManagerValue("publishedBonus", value)}
            />
            <RankingNumberField
              label="Cumplimiento"
              value={draft.manager.workflowStepPoints}
              onChange={(value) =>
                updateManagerValue("workflowStepPoints", value)
              }
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-950/40">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
            Tiempos
          </p>
          <div className="grid grid-cols-2 gap-3">
            <RankingNumberField
              label="A tiempo"
              value={draft.manager.onTimeBonus}
              onChange={(value) => updateManagerValue("onTimeBonus", value)}
            />
            <RankingNumberField
              label="Temprano"
              value={draft.manager.earlyDeliveryBonus}
              onChange={(value) =>
                updateManagerValue("earlyDeliveryBonus", value)
              }
            />
            <RankingNumberField
              label="Hora temprana"
              value={draft.manager.earlyDeliveryCutoffHour}
              min={0}
              max={23}
              onChange={(value) =>
                updateManagerValue("earlyDeliveryCutoffHour", value)
              }
            />
            <RankingNumberField
              label="Atraso"
              value={draft.manager.overduePenalty}
              onChange={(value) => updateManagerValue("overduePenalty", value)}
            />
            <RankingNumberField
              label="Horas rapidas"
              value={draft.manager.fastTurnaroundHours}
              min={0}
              onChange={(value) =>
                updateManagerValue("fastTurnaroundHours", value)
              }
            />
            <RankingNumberField
              label="Rapidez"
              value={draft.manager.fastTurnaroundBonus}
              onChange={(value) =>
                updateManagerValue("fastTurnaroundBonus", value)
              }
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-950/40">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
            Lote temprano
          </p>
          <div className="grid grid-cols-2 gap-3">
            <RankingNumberField
              label="Cuentas"
              value={draft.manager.batchDifferentClientCount}
              min={1}
              onChange={(value) =>
                updateManagerValue("batchDifferentClientCount", value)
              }
            />
            <RankingNumberField
              label="Entregas"
              value={draft.manager.batchEarlyCompletedCount}
              min={1}
              onChange={(value) =>
                updateManagerValue("batchEarlyCompletedCount", value)
              }
            />
            <RankingNumberField
              label="Bonus lote"
              value={draft.manager.batchEarlyBonus}
              onChange={(value) => updateManagerValue("batchEarlyBonus", value)}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-950/40">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
            Planificacion
          </p>
          <div className="grid grid-cols-2 gap-3">
            <RankingNumberField
              label="Dias antes"
              value={draft.manager.planningLeadDays}
              min={0}
              onChange={(value) =>
                updateManagerValue("planningLeadDays", value)
              }
            />
            <RankingNumberField
              label="Puntos"
              value={draft.manager.planningTaskPoints}
              onChange={(value) =>
                updateManagerValue("planningTaskPoints", value)
              }
            />
            <RankingNumberField
              label="Max"
              value={draft.manager.planningMaxPoints}
              min={0}
              onChange={(value) =>
                updateManagerValue("planningMaxPoints", value)
              }
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-950/40">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
            Ideas
          </p>
          <div className="grid grid-cols-2 gap-3">
            <RankingNumberField
              label="Puntos"
              value={draft.manager.creativityKeywordPoints}
              onChange={(value) =>
                updateManagerValue("creativityKeywordPoints", value)
              }
            />
            <RankingNumberField
              label="Max"
              value={draft.manager.creativityMaxPoints}
              min={0}
              onChange={(value) =>
                updateManagerValue("creativityMaxPoints", value)
              }
            />
          </div>
          <label className="mt-3 block">
            <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mb-1">
              Palabras clave
            </span>
            <textarea
              value={draft.manager.creativityKeywords}
              onChange={(event) =>
                updateManagerValue("creativityKeywords", event.target.value)
              }
              className="w-full min-h-[86px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/60 dark:bg-slate-950/40">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
            Sala de Edicion
          </p>
          <div className="grid grid-cols-2 gap-3">
            {Object.keys(draft.editing.hierarchyScores).map((key) => (
              <RankingNumberField
                key={`h-${key}`}
                label={key.toUpperCase()}
                value={draft.editing.hierarchyScores[key]}
                onChange={(value) =>
                  updateEditingMapValue("hierarchyScores", key, value)
                }
              />
            ))}
            {Object.keys(draft.editing.priorityScores).map((key) => (
              <RankingNumberField
                key={`p-${key}`}
                label={key}
                value={draft.editing.priorityScores[key]}
                onChange={(value) =>
                  updateEditingMapValue("priorityScores", key, value)
                }
              />
            ))}
            <RankingNumberField
              label="Edicion temprano"
              value={draft.editing.earlyDeliveryBonus}
              onChange={(value) =>
                updateEditingValue("earlyDeliveryBonus", value)
              }
            />
            <RankingNumberField
              label="Hora temprana"
              value={draft.editing.earlyDeliveryCutoffHour}
              min={0}
              max={23}
              onChange={(value) =>
                updateEditingValue("earlyDeliveryCutoffHour", value)
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const UsersAccessView = ({
  users,
  managers,
  editors,
  auditLogs,
  currentUserProfile,
  onAdd,
  onEdit,
  onResendVerification,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredUsers = users.filter((item) =>
    `${item.name || ""} ${item.email || ""} ${item.role || ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );
  const verifiedUsers = users.filter(
    (item) => getVerificationMeta(item).isVerified,
  ).length;
  const pendingVerificationUsers = users.filter(
    (item) =>
      normalizeEmail(item.email) && !getVerificationMeta(item).isVerified,
  ).length;

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">
            Usuarios y Accesos
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Permisos por rol, accesos por correo y bitacora de actividad.
          </p>
        </div>
        <div className="flex flex-col md:flex-row w-full md:w-auto gap-3">
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            placeholder="Buscar usuario..."
          />
          <Button onClick={onAdd} color="purple" icon="UserPlus">
            Nuevo Usuario
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Usuarios Activos"
          value={users.filter((item) => item.isActive !== false).length}
          icon="Users"
          color="purple"
        />
        <StatCard
          title="Correos Verificados"
          value={verifiedUsers}
          icon="ShieldCheck"
          color="emerald"
        />
        <StatCard
          title="Pendientes Verificar"
          value={pendingVerificationUsers}
          icon="Mail"
          color="amber"
        />
        <StatCard
          title="Admins"
          value={
            users.filter(
              (item) =>
                item.isActive !== false &&
                ["super_admin", "operations"].includes(item.role),
            ).length
          }
          icon="ClipboardList"
          color="indigo"
        />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1.05fr,1.3fr] gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-slate-800 dark:text-white">
              Directorio
            </h3>
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              {getRoleMeta(currentUserProfile?.role).label}
            </span>
          </div>
          <div className="space-y-3 max-h-[540px] overflow-y-auto custom-scroll pr-2">
            {filteredUsers.length === 0 ? (
              <EmptyState
                icon="Users"
                text="No hay usuarios para este filtro."
              />
            ) : (
              filteredUsers.map((record) => {
                const verificationMeta = getVerificationMeta(record);
                const linkedManager = managers.find(
                  (item) => item.id === record.linkedManagerId,
                );
                const linkedEditor = editors.find(
                  (item) => item.id === record.linkedEditorId,
                );
                const linkedLabels = getLinkedProfileLabels(record);

                return (
                  <div
                    key={record.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-start gap-4"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black ${record.isActive === false ? "bg-red-500" : "bg-slate-900 dark:bg-slate-700"}`}
                    >
                      {(record.name || "??").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 items-center">
                        <p className="font-bold text-slate-800 dark:text-white truncate">
                          {record.name}
                        </p>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300">
                          {getRoleMeta(record.role).label}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${
                            verificationMeta.color === "emerald"
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                              : verificationMeta.color === "amber"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                                : verificationMeta.color === "red"
                                  ? "bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                                  : verificationMeta.color === "blue"
                                    ? "bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {verificationMeta.label}
                        </span>
                        {record.isActive === false && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-2">
                        {record.email || "Correo pendiente"}
                      </p>
                      {record.emailVerification?.lastError && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1 break-words">
                          {record.emailVerification.lastError}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Ultimo acceso: {record.lastSeenAt || "Sin registro"}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {linkedLabels.map((label) => (
                          <span
                            key={`${record.id}-${label}`}
                            className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
                          >
                            {label}
                          </span>
                        ))}
                        {linkedManager && (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                            AM: {linkedManager.name}
                          </span>
                        )}
                        {linkedEditor && (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                            ED: {linkedEditor.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {normalizeEmail(record.email) &&
                        !verificationMeta.isVerified && (
                          <button
                            onClick={() => onResendVerification(record)}
                            className="p-2 text-slate-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Reenviar acceso por correo"
                          >
                            <Icon name="Mail" size={18} />
                          </button>
                        )}
                      <button
                        onClick={() => onEdit(record)}
                        className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Editar usuario"
                      >
                        <Icon name="Edit" size={18} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-slate-800 dark:text-white">
              Bitacora de Acciones
            </h3>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {auditLogs.length} registros
            </span>
          </div>
          <div className="space-y-3 max-h-[540px] overflow-y-auto custom-scroll pr-2">
            {auditLogs.length === 0 ? (
              <EmptyState
                icon="ClipboardList"
                text="Aun no hay actividad registrada."
              />
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                        {log.description || `${log.action} · ${log.entityType}`}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300">
                          {log.action}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                          {log.entityType}
                        </span>
                        {log.status === "error" && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                            Error
                          </span>
                        )}
                        {log.status === "denied" && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                            Denegado
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {log.actor?.name || "Sistema"}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {log.createdAt || ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Selector de Account Manager con avatares (foto o iniciales).
const ManagerPicker = ({
  managers = [],
  value = "",
  onChange,
  legacyColorMap = {},
  buttonClassName = "",
  align = "left",
  placeholder = "Sin asignar",
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 240 });
  const [q, setQ] = useState("");
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (
        menuRef.current?.contains(e.target) ||
        btnRef.current?.contains(e.target)
      )
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

  const filtered = q
    ? managers.filter((m) =>
        (m.name || "").toLowerCase().includes(q.toLowerCase()),
      )
    : managers;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={buttonClassName}
      >
        <PersonAvatar person={current} size={22} legacyColorMap={legacyColorMap} />
        <span className="truncate">{current ? current.name : placeholder}</span>
        <Icon name="ChevronDown" size={14} className="shrink-0 opacity-60" />
      </button>
      {open && (
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            width: coords.width,
            zIndex: 9999,
          }}
          className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl shadow-black/10 dark:shadow-black/50 overflow-hidden fade-in"
        >
          {managers.length > 6 && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-800">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar manager..."
                className="w-full text-sm px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 outline-none text-slate-700 dark:text-slate-200"
              />
            </div>
          )}
          <div className="max-h-60 overflow-y-auto custom-scroll py-1">
            <button
              type="button"
              onClick={(e) => pick(e, "")}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <PersonAvatar person={null} size={22} /> Sin asignar
            </button>
            {filtered.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={(e) => pick(e, m.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 ${m.id === value ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-200"}`}
              >
                <PersonAvatar
                  person={m}
                  size={22}
                  legacyColorMap={legacyColorMap}
                />
                <span className="truncate flex-1">{m.name}</span>
                {m.id === value && (
                  <Icon name="Check" size={15} className="shrink-0" />
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-xs text-slate-400 text-center">
                Sin resultados
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const ClientsView = ({
  clients,
  managers = [],
  legacyColorMap = {},
  onAdd,
  onSelect,
  onReassignManager,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const statusFilters = [
    { id: "all", label: "Todos" },
    { id: "Activo", label: "Activos" },
    { id: "Pausado", label: "Pausados" },
    { id: "Inactivo", label: "Inactivos" },
  ];
  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(term) ||
      (c.niche || "").toLowerCase().includes(term);
    if (!matchesSearch) return false;
    if (statusFilter !== "all" && (c.status || "Activo") !== statusFilter)
      return false;
    return true;
  });

  return (
    <div className="space-y-5 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
          Cartera de Clientes
        </h2>
        <div className="flex flex-col md:flex-row w-full md:w-auto gap-3">
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            placeholder="Buscar cliente o rubro..."
          />
          <Button onClick={onAdd} color="blue" icon="Plus">
            Nuevo Cliente
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto kanban-mobile-scroll">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
          {statusFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`shrink-0 px-3 py-1.5 text-[13px] font-semibold rounded-lg transition-all ${statusFilter === f.id ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500 shrink-0">
          {filteredClients.length} de {clients.length}
        </span>
      </div>

      {filteredClients.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 h-64">
          <EmptyState icon="Briefcase" text="No hay clientes que coincidan." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((c) => {
            const status = getClientStatus(c);
            const manager = managers.find((m) => m.id === c.managerId) || null;
            const inactive = status.id === "Inactivo";
            return (
              <div
                key={c.id}
                onClick={() => onSelect(c)}
                className={`group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600/60 hover:-translate-y-0.5 transition-all cursor-pointer ${inactive ? "opacity-70 hover:opacity-100" : ""}`}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  {c.photo ? (
                    <img
                      src={c.photo}
                      alt={c.name}
                      className="h-14 w-14 rounded-2xl object-cover border border-black/5 dark:border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="h-14 w-14 bg-blue-50 dark:bg-blue-500/15 rounded-2xl flex items-center justify-center text-2xl font-bold text-blue-600 dark:text-blue-400 shrink-0">
                      {c.name ? c.name.charAt(0).toUpperCase() : "C"}
                    </div>
                  )}
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full shrink-0 ${status.bg} ${status.text}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white truncate">
                  {c.name}
                </h3>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate mt-0.5">
                  {c.niche || "Sin rubro"}
                </p>
                {c.package && (
                  <span className="inline-flex items-center gap-1 mt-3 text-[11px] font-semibold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                    <Icon name="Sparkles" size={11} /> {c.package}
                  </span>
                )}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between gap-2">
                  {onReassignManager ? (
                    <ManagerPicker
                      managers={managers}
                      value={c.managerId || ""}
                      legacyColorMap={legacyColorMap}
                      onChange={(id) => onReassignManager(c, id)}
                      buttonClassName="flex items-center gap-2 min-w-0 max-w-full text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg px-1.5 py-1 -ml-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    />
                  ) : (
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 truncate min-w-0">
                      <PersonAvatar
                        person={manager}
                        size={22}
                        legacyColorMap={legacyColorMap}
                      />
                      <span className="truncate">
                        {manager ? manager.name : c.manager || "Sin asignar"}
                      </span>
                    </span>
                  )}
                  {c.instagram && (
                    <span
                      className="text-slate-400 dark:text-slate-500 group-hover:text-pink-500 transition-colors shrink-0"
                      title="Instagram"
                    >
                      <Icon name="Instagram" size={16} />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ClientDetail = ({
  client,
  managers,
  legacyColorMap = {},
  onReassignManager,
  onBack,
  onUpdate,
  onDelete,
  onEdit,
  onOpenChat,
  chatUnread = 0,
}) => (
  <div className="space-y-6 max-w-5xl mx-auto fade-in">
    <Breadcrumb
      items={[
        { label: "Clientes", onClick: onBack },
        { label: client.name || "Detalle" },
      ]}
    />
    <button
      onClick={onBack}
      className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-sm uppercase p-2 -ml-2"
    >
      <Icon name="ChevronLeft" size={16} /> Volver a clientes
    </button>
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
      <div className="bg-slate-900 dark:bg-slate-950 p-6 md:p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative group border-b border-slate-800">
        <button
          onClick={onEdit}
          aria-label="Editar cliente"
          className="absolute top-4 right-4 text-slate-500 hover:text-white p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
        >
          <Icon name="Edit" size={18} />
        </button>

        <div className="flex items-start md:items-center gap-6">
          {client.photo ? (
            <img
              src={client.photo}
              alt={client.name}
              className="h-20 w-20 rounded-2xl object-cover shadow-inner shrink-0 border border-white/10"
            />
          ) : (
            <div className="h-20 w-20 bg-white/10 rounded-2xl flex items-center justify-center text-4xl font-black shadow-inner shrink-0">
              {client.name ? client.name.charAt(0).toUpperCase() : "C"}
            </div>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-black">{client.name}</h1>

            <div className="mt-2">
              <ManagerPicker
                managers={managers}
                value={client.managerId || ""}
                legacyColorMap={legacyColorMap}
                onChange={(id) => onReassignManager(client, id)}
                placeholder="Asignar Account Manager..."
                buttonClassName="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-white font-bold text-xs transition-all max-w-full"
              />
            </div>
            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-700"
              >
                <Icon name="MessageSquare" size={14} /> Abrir chat interno
                {chatUnread > 0 && (
                  <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[10px] font-black">
                    {chatUnread}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0 mt-4 md:mt-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
            Estado
          </span>
          <div className="flex gap-1 bg-white/10 p-1 rounded-xl">
            {CLIENT_STATUSES.map((s) => {
              const active = (client.status || "Activo") === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onUpdate(client.id, { status: s.id })}
                  aria-label={`Marcar cliente como ${s.label}`}
                  aria-pressed={active}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${active ? "bg-white text-slate-800 shadow-sm" : "text-white/70 hover:text-white hover:bg-white/10"}`}
                >
                  <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div>
        <div className="p-6 md:p-8 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Icon name="Instagram" size={14} /> Redes
            </h3>
            <div className="flex flex-col md:flex-row gap-2">
              <input
                defaultValue={client.instagram}
                onBlur={(e) =>
                  onUpdate(client.id, { instagram: e.target.value })
                }
                placeholder="Link Instagram..."
                className="flex-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-sm px-4 py-3 border outline-none text-slate-800 dark:text-slate-200"
              />
              <a
                href={client.instagram || "#"}
                target="_blank"
                className="bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 px-4 py-3 rounded-xl font-bold text-sm hover:bg-pink-100 dark:hover:bg-pink-500/20 flex items-center justify-center gap-2"
              >
                Ver <Icon name="ExternalLink" size={14} />
              </a>
            </div>
          </div>
          <button
            onClick={onDelete}
            className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 text-xs font-bold flex items-center gap-2 p-2 -ml-2"
          >
            <Icon name="Trash2" size={14} /> ELIMINAR CLIENTE
          </button>
        </div>
      </div>
    </div>
  </div>
);

const CHAT_TASK_CHIP_STYLES = {
  accountTask:
    "text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30",
  editingTask:
    "text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30",
  managementTask:
    "text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/30",
};
const CHAT_TASK_LABELS = {
  accountTask: "Account",
  editingTask: "Edición",
  managementTask: "Gestión",
};

const renderChatText = (text = "") =>
  String(text)
    .split(/(@[^\s@]+)/g)
    .map((part, index) =>
      part.startsWith("@") ? (
        <span
          key={index}
          className="font-semibold text-blue-600 dark:text-blue-400"
        >
          {part}
        </span>
      ) : (
        <React.Fragment key={index}>{part}</React.Fragment>
      ),
    );

const CHAT_MAX_FILE = 8 * 1024 * 1024; // 8 MB por archivo
const chatFileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
const formatChatBytes = (bytes = 0) => {
  if (!bytes) return "";
  const kb = bytes / 1024;
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`;
};
const isChatImage = (type = "") => String(type).startsWith("image/");
const isChatVideo = (type = "") => String(type).startsWith("video/");
const isChatAudio = (type = "") => String(type).startsWith("audio/");
const chatShortTime = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString("es", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

// Chat interno por cliente (estilo Slack): lista de clientes + hilo + composer
// con @menciones, enlace opcional a una tarea y adjuntos (imágenes/video/PDF).
const ClientChatView = ({
  clients = [],
  clientChats = [],
  chatUnread = { byClient: {}, total: 0 },
  activeClient,
  onSelectClient,
  onSendMessage,
  onOpenTask,
  onDeleteMessage,
  currentUserProfile,
  canModerate = false,
  mentionables = [],
  accountTasks = [],
  editingTasks = [],
  managementTasks = [],
  fetchFullMessage,
}) => {
  const [search, setSearch] = useState("");
  const [text, setText] = useState("");
  const [mentionedIds, setMentionedIds] = useState([]);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(-1);
  const [taskRef, setTaskRef] = useState(null);
  const [taskPickerOpen, setTaskPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [fullMap, setFullMap] = useState({});
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const textareaRef = useRef(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const discardRef = useRef(false);

  const myId = String(currentUserProfile?.id || "");

  const lastMsgByClient = {};
  clientChats.forEach((message) => {
    if (!message.clientId) return;
    const prev = lastMsgByClient[message.clientId];
    if (!prev || (message.createdAt || "") > (prev.createdAt || "")) {
      lastMsgByClient[message.clientId] = message;
    }
  });

  const previewText = (message) => {
    if (!message) return "Sin mensajes";
    if (message.text) return message.text;
    const count = Array.isArray(message.attachments)
      ? message.attachments.length
      : 0;
    return count > 0 ? `📎 ${count} archivo${count === 1 ? "" : "s"}` : "…";
  };

  const term = search.trim().toLowerCase();
  const sortedClients = [...clients]
    .filter((client) => !term || (client.name || "").toLowerCase().includes(term))
    .sort((a, b) => {
      const aTime = lastMsgByClient[a.id]?.createdAt || "";
      const bTime = lastMsgByClient[b.id]?.createdAt || "";
      if (aTime !== bTime) return aTime > bTime ? -1 : 1;
      return (a.name || "").localeCompare(b.name || "");
    });

  const messages = activeClient
    ? clientChats
        .filter((message) => message.clientId === activeClient.id)
        .sort((a, b) => ((a.createdAt || "") > (b.createdAt || "") ? 1 : -1))
    : [];

  const clientTasks = activeClient
    ? [
        ...accountTasks
          .filter((task) => task.clientId === activeClient.id)
          .map((task) => ({ id: task.id, title: task.title, type: "accountTask" })),
        ...editingTasks
          .filter((task) => task.clientId === activeClient.id)
          .map((task) => ({ id: task.id, title: task.title, type: "editingTask" })),
        ...managementTasks
          .filter((task) => task.clientId === activeClient.id)
          .map((task) => ({ id: task.id, title: task.title, type: "managementTask" })),
      ]
    : [];

  const mentionSuggestions = mentionOpen
    ? mentionables
        .filter((person) => {
          const q = mentionQuery.toLowerCase();
          if (!q) return true;
          return (
            (person.name || "").toLowerCase().includes(q) ||
            (person.email || "").toLowerCase().includes(q)
          );
        })
        .slice(0, 30)
    : [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeClient?.id, messages.length]);

  // Trae el base64 de los adjuntos (los listados llegan solo con metadata).
  useEffect(() => {
    if (!activeClient || typeof fetchFullMessage !== "function") return;
    let cancelled = false;
    const need = messages.filter((message) => {
      const atts = message.attachments || [];
      if (atts.length === 0 || fullMap[message.id]) return false;
      if (atts.some((a) => a.data)) return false;
      return atts.some((a) => a.hasData);
    });
    if (need.length === 0) return;
    (async () => {
      const results = await Promise.all(
        need.map(async (message) => [
          message.id,
          (await fetchFullMessage(message.id))?.attachments || [],
        ]),
      );
      if (cancelled) return;
      setFullMap((prev) => {
        const next = { ...prev };
        results.forEach(([id, atts]) => {
          next[id] = atts;
        });
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClient?.id, messages.length]);

  const handleTextChange = (event) => {
    const value = event.target.value;
    setText(value);
    const caret = event.target.selectionStart ?? value.length;
    const before = value.slice(0, caret);
    const atMatch = before.match(/@([^\s@]*)$/);
    if (atMatch) {
      setMentionOpen(true);
      setMentionQuery(atMatch[1]);
      setMentionStart(before.lastIndexOf("@"));
      // Evita que se superpongan los desplegables.
      setTaskPickerOpen(false);
      setAttachMenuOpen(false);
    } else {
      setMentionOpen(false);
      setMentionQuery("");
      setMentionStart(-1);
    }
  };

  const insertMention = (person) => {
    const before = text.slice(0, mentionStart);
    const after = text.slice(mentionStart + 1 + mentionQuery.length);
    setText(`${before}@${person.name} ${after}`);
    setMentionedIds((prev) =>
      prev.includes(person.id) ? prev : [...prev, person.id],
    );
    setMentionOpen(false);
    setMentionQuery("");
    setMentionStart(-1);
    setTimeout(() => textareaRef.current && textareaRef.current.focus(), 0);
  };

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        if (file.size > CHAT_MAX_FILE) {
          alert(`"${file.name}" supera el máximo de 8 MB.`);
          continue;
        }
        const data = await chatFileToBase64(file);
        setPending((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).slice(2, 10),
            name: file.name,
            type: file.type,
            size: file.size,
            data,
          },
        ]);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openFilePicker = (accept) => {
    setAttachMenuOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept || "";
      fileInputRef.current.click();
    }
  };

  const startRecording = async () => {
    if (recording) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      alert("Tu navegador no permite grabar audio.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      discardRef.current = false;
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (discardRef.current) {
          discardRef.current = false;
          return;
        }
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        if (blob.size === 0) return;
        if (blob.size > CHAT_MAX_FILE) {
          alert("La nota de voz supera el máximo de 8 MB.");
          return;
        }
        const data = await chatFileToBase64(blob);
        setPending((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).slice(2, 10),
            name: `nota-de-voz-${Date.now()}.webm`,
            type: blob.type || "audio/webm",
            size: blob.size,
            data,
          },
        ]);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(
        () => setRecordSeconds((seconds) => seconds + 1),
        1000,
      );
    } catch {
      alert("No se pudo acceder al micrófono.");
    }
  };

  const stopRecording = (discard = false) => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    discardRef.current = discard;
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    setRecording(false);
    setRecordSeconds(0);
  };

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if ((!trimmed && pending.length === 0) || submitting || !activeClient) return;
    setSubmitting(true);
    try {
      await onSendMessage({
        clientId: activeClient.id,
        text: trimmed,
        mentionedIds,
        taskRef,
        attachments: pending,
      });
      setText("");
      setMentionedIds([]);
      setTaskRef(null);
      setPending([]);
      setMentionOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const renderAttachment = (att) => {
    const key = att.id || att.name;
    if (att.data && isChatImage(att.type)) {
      return (
        <a
          key={key}
          href={att.data}
          target="_blank"
          rel="noreferrer"
          className="block"
        >
          <img
            src={att.data}
            alt={att.name}
            className="max-h-56 max-w-[260px] rounded-lg border border-slate-200 object-cover dark:border-white/10"
          />
        </a>
      );
    }
    if (att.data && isChatVideo(att.type)) {
      return (
        <video
          key={key}
          src={att.data}
          controls
          className="max-h-60 max-w-[300px] rounded-lg border border-slate-200 dark:border-white/10"
        />
      );
    }
    if (att.data && isChatAudio(att.type)) {
      return (
        <audio key={key} src={att.data} controls className="max-w-[280px]" />
      );
    }
    return (
      <a
        key={key}
        href={att.data || undefined}
        download={att.name}
        target="_blank"
        rel="noreferrer"
        className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-slate-800 ${att.data ? "hover:bg-slate-50 dark:hover:bg-slate-700" : "opacity-60"}`}
      >
        <Icon name="Paperclip" size={14} className="shrink-0 text-slate-500" />
        <span className="max-w-[180px] truncate font-semibold text-slate-700 dark:text-slate-200">
          {att.name}
        </span>
        <span className="text-slate-400">
          {att.data ? formatChatBytes(att.size) : "cargando…"}
        </span>
      </a>
    );
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-white dark:bg-[#1a1d21] fade-in">
      {/* Lista de clientes (canales) */}
      <aside
        className={`${activeClient ? "hidden md:flex" : "flex"} min-h-0 w-full flex-col border-r border-slate-200 dark:border-white/10 md:w-72 lg:w-80 shrink-0`}
      >
        <div className="p-3 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Icon
              name="MessageSquare"
              size={18}
              className="text-slate-500 dark:text-slate-400"
            />
            <h2 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide">
              Chat interno
            </h2>
          </div>
          <div className="relative">
            <Icon
              name="Search"
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar cliente..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-blue-500/60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scroll pb-mobile-nav md:pb-0">
          {sortedClients.length === 0 && (
            <p className="p-4 text-center text-sm text-slate-400">
              No hay clientes.
            </p>
          )}
          {sortedClients.map((client) => {
            const unread = chatUnread.byClient?.[client.id] || 0;
            const last = lastMsgByClient[client.id];
            const isActive = activeClient?.id === client.id;
            return (
              <button
                key={client.id}
                onClick={() => onSelectClient(client)}
                className={`flex w-full items-center gap-3 border-b border-slate-50 px-3 py-2.5 text-left transition-colors dark:border-white/5 ${isActive ? "bg-blue-50 dark:bg-blue-500/10" : "hover:bg-slate-50 dark:hover:bg-white/5"}`}
              >
                {client.photo ? (
                  <img
                    src={client.photo}
                    alt={client.name}
                    className="h-9 w-9 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#555552] text-xs font-black text-white">
                    {(client.name || "C").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm ${unread > 0 ? "font-black" : "font-bold"} ${isActive ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-200"}`}
                  >
                    {client.name || "Cliente"}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {last
                      ? `${last.authorName ? `${last.authorName}: ` : ""}${previewText(last)}`
                      : "Sin mensajes"}
                  </p>
                </div>
                {unread > 0 && (
                  <span className="ml-1 shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black text-white">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Hilo del cliente */}
      <section
        className={`${activeClient ? "flex" : "hidden md:flex"} min-h-0 min-w-0 flex-1 flex-col`}
      >
        {!activeClient ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <Icon name="MessageSquare" size={40} className="mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Elige un cliente para ver la conversación
            </p>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/10">
              <button
                onClick={() => onSelectClient(null)}
                aria-label="Volver a la lista"
                className="md:hidden text-slate-500 hover:text-slate-700"
              >
                <Icon name="ChevronLeft" size={20} />
              </button>
              {activeClient.photo ? (
                <img
                  src={activeClient.photo}
                  alt={activeClient.name}
                  className="h-9 w-9 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#555552] text-xs font-black text-white">
                  {(activeClient.name || "C").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-700 dark:text-slate-200">
                  {activeClient.name || "Cliente"}
                </p>
                <p className="text-xs text-slate-400">
                  {messages.length} mensaje{messages.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 min-h-0 overflow-y-auto py-3 custom-scroll bg-white dark:bg-[#1a1d21]"
            >
              {messages.length === 0 && (
                <div className="mt-8 text-center">
                  <Icon
                    name="MessageSquare"
                    size={22}
                    className="mx-auto mb-2 text-slate-300"
                  />
                  <p className="text-sm text-slate-400">
                    Sé el primero en escribir sobre este cliente.
                  </p>
                </div>
              )}
              {messages.map((message, index) => {
                const mine = myId && String(message.authorId || "") === myId;
                const prev = messages[index - 1];
                const grouped =
                  prev &&
                  String(prev.authorId || "") === String(message.authorId || "") &&
                  (prev.authorName || "") === (message.authorName || "") &&
                  message.createdAt &&
                  prev.createdAt &&
                  new Date(message.createdAt) - new Date(prev.createdAt) <
                    5 * 60 * 1000;
                const atts = fullMap[message.id] || message.attachments || [];
                return (
                  <div
                    key={message.id}
                    className={`group flex gap-3 px-4 ${grouped ? "mt-0.5 py-0.5" : "mt-3 py-0.5"} hover:bg-slate-50 dark:hover:bg-white/5`}
                  >
                    <div className="w-9 shrink-0">
                      {grouped ? (
                        <span className="hidden pt-1 text-right text-[10px] text-slate-400 group-hover:block">
                          {chatShortTime(message.createdAt)}
                        </span>
                      ) : (
                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-[#555552] text-[11px] font-black text-white">
                          {(message.authorName || "U").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {!grouped && (
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                            {message.authorName || "Usuario"}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {relativeTime(message.createdAt)}
                          </span>
                        </div>
                      )}
                      {message.text && (
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                          {renderChatText(message.text)}
                        </p>
                      )}
                      {atts.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {atts.map((att) => renderAttachment(att))}
                        </div>
                      )}
                      {message.taskRef?.taskId && (
                        <button
                          onClick={() => onOpenTask(message.taskRef)}
                          className={`mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold ${CHAT_TASK_CHIP_STYLES[message.taskRef.taskType] || CHAT_TASK_CHIP_STYLES.accountTask}`}
                        >
                          <Icon name="ClipboardList" size={11} className="shrink-0" />
                          <span className="truncate">
                            {message.taskRef.taskTitle || "Tarea"}
                          </span>
                          <span className="opacity-70">
                            · {CHAT_TASK_LABELS[message.taskRef.taskType] || ""}
                          </span>
                        </button>
                      )}
                    </div>
                    {(mine || canModerate) && (
                      <button
                        onClick={() => onDeleteMessage(message)}
                        aria-label="Eliminar mensaje"
                        className="self-start text-slate-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                      >
                        <Icon name="Trash2" size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Composer estilo Slack */}
            <div className="shrink-0 border-t border-slate-200 p-3 pb-mobile-nav md:pb-3 dark:border-white/10">
              {(taskRef || pending.length > 0) && (
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {taskRef && (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold ${CHAT_TASK_CHIP_STYLES[taskRef.taskType] || CHAT_TASK_CHIP_STYLES.accountTask}`}
                    >
                      <Icon name="ClipboardList" size={11} />
                      <span className="max-w-[220px] truncate">
                        {taskRef.taskTitle}
                      </span>
                      <button
                        onClick={() => setTaskRef(null)}
                        aria-label="Quitar tarea"
                        className="opacity-70 hover:opacity-100"
                      >
                        <Icon name="X" size={11} />
                      </button>
                    </span>
                  )}
                  {pending.map((att) => (
                    <div key={att.id} className="relative">
                      {isChatImage(att.type) ? (
                        <img
                          src={att.data}
                          alt={att.name}
                          className="h-16 w-16 rounded-lg border border-slate-200 object-cover dark:border-white/10"
                        />
                      ) : (
                        <div className="flex h-16 w-36 items-center gap-1.5 rounded-lg border border-slate-200 px-2 dark:border-white/10">
                          <Icon
                            name="Paperclip"
                            size={14}
                            className="shrink-0 text-slate-500"
                          />
                          <span className="truncate text-[11px] text-slate-600 dark:text-slate-300">
                            {att.name}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() =>
                          setPending((prev) =>
                            prev.filter((item) => item.id !== att.id),
                          )
                        }
                        aria-label="Quitar archivo"
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-white"
                      >
                        <Icon name="X" size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="relative rounded-xl border border-slate-300 bg-white focus-within:border-blue-500 dark:border-white/15 dark:bg-[#222529]">
                {mentionOpen && mentionSuggestions.length > 0 && (
                  <div className="absolute bottom-full left-0 z-40 mb-1 max-h-72 w-72 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl custom-scroll dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-center justify-between px-3 pb-1 pt-1.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Mencionar
                      </p>
                      <button
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setMentionOpen(false);
                        }}
                        aria-label="Cerrar"
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <Icon name="X" size={13} />
                      </button>
                    </div>
                    {mentionSuggestions.map((person) => (
                      <button
                        key={person.id}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          insertMention(person);
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#555552] text-[9px] font-black text-white">
                          {(person.name || person.email || "?")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {person.name || person.email}
                          </p>
                          {person.email && (
                            <p className="truncate text-[11px] text-slate-400">
                              {person.email}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {taskPickerOpen && (
                  <div className="absolute bottom-full left-0 z-30 mb-1 max-h-64 w-72 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl custom-scroll dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-center justify-between px-3 pb-1 pt-1.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Enlazar tarea del cliente
                      </p>
                      <button
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setTaskPickerOpen(false);
                        }}
                        aria-label="Cerrar"
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <Icon name="X" size={13} />
                      </button>
                    </div>
                    {clientTasks.length === 0 && (
                      <p className="px-3 py-2 text-xs text-slate-400">
                        Este cliente no tiene tareas.
                      </p>
                    )}
                    {clientTasks.map((task) => (
                      <button
                        key={`${task.type}-${task.id}`}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setTaskRef({
                            taskId: task.id,
                            taskType: task.type,
                            taskTitle: task.title || "Tarea",
                          });
                          setTaskPickerOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black ${CHAT_TASK_CHIP_STYLES[task.type]}`}
                        >
                          {CHAT_TASK_LABELS[task.type]}
                        </span>
                        <span className="flex-1 truncate text-sm text-slate-700 dark:text-slate-200">
                          {task.title || "(sin título)"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={handleTextChange}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Escape" &&
                      (mentionOpen || taskPickerOpen || attachMenuOpen)
                    ) {
                      setMentionOpen(false);
                      setTaskPickerOpen(false);
                      setAttachMenuOpen(false);
                      event.preventDefault();
                      return;
                    }
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder={`Mensaje para ${activeClient.name || "el cliente"}`}
                  rows={text ? 2 : 1}
                  className="w-full resize-none bg-transparent px-3.5 pt-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
                />
                <div className="relative flex items-center gap-1 px-2 pb-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(event) => handleFiles(event.target.files)}
                  />
                  {recording ? (
                    <div className="flex flex-1 items-center gap-2">
                      <span className="flex h-8 items-center gap-2 rounded-md bg-red-50 px-3 text-xs font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                        Grabando…{" "}
                        {String(Math.floor(recordSeconds / 60)).padStart(2, "0")}:
                        {String(recordSeconds % 60).padStart(2, "0")}
                      </span>
                      <button
                        onClick={() => stopRecording(true)}
                        className="flex h-8 items-center rounded-md px-3 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => stopRecording(false)}
                        aria-label="Detener y adjuntar audio"
                        className="ml-auto flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700"
                      >
                        <Icon name="Stop" size={14} /> Listo
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Adjuntar archivo (elegir tipo) */}
                      <div className="relative">
                        <button
                          onClick={() => {
                            setAttachMenuOpen((open) => !open);
                            setMentionOpen(false);
                            setTaskPickerOpen(false);
                          }}
                          aria-label="Adjuntar archivo"
                          disabled={uploading}
                          className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-50 ${attachMenuOpen ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"}`}
                        >
                          <Icon
                            name={uploading ? "Loader2" : "Paperclip"}
                            size={18}
                            className={uploading ? "animate-spin" : ""}
                          />
                        </button>
                        {attachMenuOpen && (
                          <div className="absolute bottom-full left-0 z-30 mb-1 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                            <button
                              onMouseDown={(event) => {
                                event.preventDefault();
                                openFilePicker("image/*");
                              }}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                              <Icon name="Image" size={16} className="text-slate-500" />
                              Imagen
                            </button>
                            <button
                              onMouseDown={(event) => {
                                event.preventDefault();
                                openFilePicker("video/*");
                              }}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                              <Icon name="Video" size={16} className="text-slate-500" />
                              Video
                            </button>
                            <button
                              onMouseDown={(event) => {
                                event.preventDefault();
                                openFilePicker(
                                  "application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip",
                                );
                              }}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                              <Icon name="FileText" size={16} className="text-slate-500" />
                              Documento / PDF
                            </button>
                            <button
                              onMouseDown={(event) => {
                                event.preventDefault();
                                openFilePicker("");
                              }}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                              <Icon name="FilePlus" size={16} className="text-slate-500" />
                              Cualquier archivo
                            </button>
                          </div>
                        )}
                      </div>
                      {/* Nota de voz */}
                      <button
                        onClick={startRecording}
                        aria-label="Grabar nota de voz"
                        className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
                      >
                        <Icon name="Microphone" size={18} />
                      </button>
                      {/* Enlazar tarea */}
                      <button
                        onClick={() => {
                          setTaskPickerOpen((open) => !open);
                          setMentionOpen(false);
                          setAttachMenuOpen(false);
                        }}
                        aria-label="Enlazar tarea"
                        className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${taskRef || taskPickerOpen ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"}`}
                      >
                        <Icon name="ClipboardList" size={17} />
                      </button>
                      <span className="ml-auto text-[10px] text-slate-400 hidden sm:block">
                        Enter para enviar · Shift+Enter salto de línea
                      </span>
                      <button
                        onClick={handleSubmit}
                        disabled={
                          submitting || (!text.trim() && pending.length === 0)
                        }
                        aria-label="Enviar mensaje"
                        className="ml-2 flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
                      >
                        <Icon
                          name={submitting ? "Loader2" : "Send"}
                          size={16}
                          className={submitting ? "animate-spin" : ""}
                        />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

const CalendarGrid = ({
  events,
  onAdd,
  onEventClick,
  baseColor = "emerald",
  canAdd = true,
}) => {
  const [date, setDate] = useState(new Date());
  const userNavigatedRef = useRef(false);
  const dataDates = events
    .map((event) => normalizeDateOnlyString(event.date))
    .filter(Boolean)
    .sort();
  const stateMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const hasStateMonthData = dataDates.some((item) => item.startsWith(stateMonth));
  const fallbackDate = dataDates.length > 0 ? dataDates[dataDates.length - 1] : "";
  const displayDate =
    !userNavigatedRef.current && !hasStateMonthData && fallbackDate
      ? new Date(Number(fallbackDate.slice(0, 4)), Number(fallbackDate.slice(5, 7)) - 1, 1)
      : date;
  const daysInMonth = new Date(
    displayDate.getFullYear(),
    displayDate.getMonth() + 1,
    0,
  ).getDate();
  const startDay = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1).getDay();

  let mappedColorName = LEGACY_COLOR_MAP[baseColor] || baseColor;
  const style = PERSON_COLORS[mappedColorName] || PERSON_COLORS.slate;

  return (
    <>
      <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div
          className={`font-bold uppercase text-xs tracking-widest text-slate-500 dark:text-slate-400`}
        >
          Vista Mensual
        </div>
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => {
              userNavigatedRef.current = true;
              setDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1));
            }}
            aria-label="Mes anterior"
            className="p-3 md:p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-300 shadow-sm"
          >
            <Icon name="ChevronLeft" size={16} />
          </button>
          <span className="font-black text-slate-700 dark:text-slate-200 w-32 text-center text-sm uppercase">
            {MONTH_NAMES[displayDate.getMonth()]} {displayDate.getFullYear()}
          </span>
          <button
            onClick={() => {
              userNavigatedRef.current = true;
              setDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1));
            }}
            aria-label="Mes siguiente"
            className="p-3 md:p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-300 shadow-sm"
          >
            <Icon name="ChevronRight" size={16} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-auto bg-slate-50 dark:bg-slate-950 custom-scroll">
        <div className="grid grid-cols-7 auto-rows-fr min-w-[800px] h-full">
          {["D", "L", "M", "M", "J", "V", "S"].map((d) => (
            <div
              key={d}
              className="py-2 text-center text-[10px] font-black text-slate-500 dark:text-slate-400 border-r border-b border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10"
            >
              {d}
            </div>
          ))}
          {Array(startDay)
            .fill(null)
            .map((_, i) => (
              <div
                key={`empty-${i}`}
                className="border-r border-b border-slate-200/50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
              />
            ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
            const dStr = `${displayDate.getFullYear()}-${String(displayDate.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const dayEvents = events.filter((e) => e.date === dStr);

            return (
              <div
                key={d}
                onClick={() => {
                  if (canAdd) onAdd(dStr);
                }}
                className={`border-r border-b border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 min-h-[120px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group relative ${canAdd ? "cursor-pointer" : "cursor-default"}`}
              >
                <span
                  className={`text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-purple-500 dark:group-hover:text-purple-400`}
                >
                  {d}
                </span>
                <div className="mt-2 space-y-1.5">
                  {dayEvents.map((e) => {
                    const isCompleted =
                      e.status === "publicado" || e.status === "aprobado";
                    const itemBg = isCompleted ? "bg-emerald-500" : style.bg;
                    const itemText = isCompleted ? "text-white" : style.text;
                    const itemBorder = isCompleted
                      ? "border-emerald-600"
                      : "border-black/10 dark:border-white/5";

                    return (
                      <div
                        key={e.id}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          onEventClick(e);
                        }}
                        className={`text-[10px] sm:text-xs font-bold p-2 rounded-lg border shadow-sm relative group/evt cursor-pointer ${itemBg} ${itemText} ${itemBorder} hover:brightness-110 active:scale-95 transition-all flex items-center justify-between`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          {isCompleted && (
                            <Icon name="CheckCircle2" size={14} />
                          )}
                          {e.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {canAdd && (
                  <Icon
                    name="Plus"
                    className={`absolute bottom-2 right-2 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity`}
                    size={16}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

const GeneralCalendarGrid = ({ activities, onDayClick, onMoveActivity }) => {
  const [viewMode, setViewMode] = useState("month");
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
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
    "Dic",
  ];
  const DAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];
  const toDateStr = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const todayStr = toDateStr(new Date());
  const dataDates = activities
    .map((activity) => normalizeDateOnlyString(activity.date))
    .filter(Boolean)
    .sort();
  const stateMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const hasStateMonthData = dataDates.some((item) => item.startsWith(stateMonth));
  const fallbackDate = dataDates.length > 0 ? dataDates[dataDates.length - 1] : "";
  const displayDate =
    !hasStateMonthData && fallbackDate
      ? new Date(Number(fallbackDate.slice(0, 4)), Number(fallbackDate.slice(5, 7)) - 1, 1)
      : date;

  const getWeekDates = () => {
    const d = new Date(displayDate);
    d.setDate(d.getDate() - d.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const w = new Date(d);
      w.setDate(d.getDate() + i);
      return w;
    });
  };

  const navPrev = () =>
    viewMode === "week"
      ? setDate((d) => {
          const n = new Date(displayDate);
          n.setDate(n.getDate() - 7);
          return n;
        })
      : setDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1));

  const navNext = () =>
    viewMode === "week"
      ? setDate((d) => {
          const n = new Date(displayDate);
          n.setDate(n.getDate() + 7);
          return n;
        })
      : setDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1));

  const getDateLabel = () => {
    if (viewMode === "week") {
      const wk = getWeekDates();
      const s = wk[0],
        e = wk[6];
      if (s.getMonth() === e.getMonth())
        return `${s.getDate()} – ${e.getDate()} ${MONTH_NAMES[s.getMonth()]} ${s.getFullYear()}`;
      return `${s.getDate()} ${SHORT_MONTHS[s.getMonth()]} – ${e.getDate()} ${SHORT_MONTHS[e.getMonth()]} ${e.getFullYear()}`;
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
    return (
      <div
        key={dStr}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverDate(dStr);
        }}
        onDragLeave={() => setDragOverDate((s) => (s === dStr ? null : s))}
        onDrop={(e) => handleDrop(e, dStr)}
        onClick={() => !draggedId && onDayClick(dStr)}
        className={`border-r border-b border-slate-200/60 dark:border-slate-800 p-2 transition-colors cursor-pointer group relative ${viewMode === "week" ? "min-h-[200px]" : "min-h-[120px]"} ${isToday ? "ring-2 ring-inset ring-blue-400 dark:ring-blue-500" : ""} ${isDragOver ? "!bg-blue-50 dark:!bg-blue-500/10 ring-2 ring-inset ring-blue-400" : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
      >
        <div className="flex justify-between items-start mb-2">
          <span
            className={`text-xs font-bold flex items-center justify-center ${isToday ? "bg-blue-500 text-white w-5 h-5 rounded-full" : "text-slate-500 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400"}`}
          >
            {dateObj.getDate()}
          </span>
          {dayActivities.length > 0 && (
            <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
              {dayActivities.length}
            </span>
          )}
        </div>
        <div className="space-y-1">
          {dayActivities.slice(0, maxVisible).map((act, idx) => (
            <div
              key={`${act.id}-${idx}`}
              draggable={Boolean(onMoveActivity)}
              onDragStart={(e) => {
                e.stopPropagation();
                handleDragStart(e, act);
              }}
              onDragEnd={() => {
                setDraggedId(null);
                setDragOverDate(null);
              }}
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded truncate select-none bg-${act._color}-100 dark:bg-${act._color}-500/20 text-${act._color}-800 dark:text-${act._color}-400 border border-${act._color}-200 dark:border-${act._color}-500/30 ${onMoveActivity ? "cursor-grab active:cursor-grabbing" : ""} ${draggedId === act.id ? "opacity-30" : ""}`}
            >
              {act.title}
            </div>
          ))}
          {dayActivities.length > maxVisible && (
            <div className="text-[10px] font-bold text-slate-500 text-center mt-1">
              +{dayActivities.length - maxVisible} más
            </div>
          )}
        </div>
        {!draggedId && (
          <Icon
            name="ExternalLink"
            className="absolute bottom-2 right-2 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
            size={14}
          />
        )}
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Icon
              name="CalendarPlus"
              className="text-blue-400 dark:text-blue-500 opacity-60"
              size={24}
            />
          </div>
        )}
      </div>
    );
  };

  const weekDates = getWeekDates();

  return (
    <>
      <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("week")}
              className={`shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === "week" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === "month" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}`}
            >
              Mes
            </button>
          </div>
          <button
            onClick={() => setDate(new Date())}
            className="px-3 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all"
          >
            Hoy
          </button>
        </div>
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-1 relative">
          <button
            onClick={navPrev}
            aria-label={
              viewMode === "week" ? "Semana anterior" : "Mes anterior"
            }
            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-300 transition-colors"
          >
            <Icon name="ChevronLeft" size={16} />
          </button>
          <button
            onClick={() => {
              setPickerYear(date.getFullYear());
              setShowPicker((s) => !s);
            }}
            className="font-black text-slate-700 dark:text-slate-200 min-w-[180px] text-center text-sm uppercase hover:text-blue-500 dark:hover:text-blue-400 transition-colors px-2"
          >
            {getDateLabel()}
          </button>
          <button
            onClick={navNext}
            aria-label={
              viewMode === "week" ? "Semana siguiente" : "Mes siguiente"
            }
            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-300 transition-colors"
          >
            <Icon name="ChevronRight" size={16} />
          </button>
          {showPicker && (
            <div
              className="absolute top-full right-0 mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 w-64"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setPickerYear((y) => y - 1)}
                  aria-label="Año anterior"
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                >
                  <Icon name="ChevronLeft" size={14} />
                </button>
                <span className="font-black text-slate-800 dark:text-white text-sm">
                  {pickerYear}
                </span>
                <button
                  onClick={() => setPickerYear((y) => y + 1)}
                  aria-label="Año siguiente"
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                >
                  <Icon name="ChevronRight" size={14} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {SHORT_MONTHS.map((m, i) => {
                  const isSel =
                    pickerYear === date.getFullYear() && i === date.getMonth();
                  return (
                    <button
                      key={m}
                      onClick={() => {
                        setDate(new Date(pickerYear, i, 1));
                        setViewMode("month");
                        setShowPicker(false);
                      }}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${isSel ? "bg-blue-500 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      {showPicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowPicker(false)}
        />
      )}
      <div className="flex-1 overflow-x-auto overflow-y-auto bg-slate-50 dark:bg-slate-950 custom-scroll">
        <div
          className="grid grid-cols-7 min-w-[800px] h-full"
          style={{ gridAutoRows: viewMode === "month" ? "1fr" : "auto" }}
        >
          {DAY_LABELS.map((d, i) => (
            <div
              key={`hdr-${i}`}
              className="py-2 text-center text-[10px] font-black text-slate-500 dark:text-slate-400 border-r border-b border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10"
            >
              {viewMode === "week" ? `${d} ${weekDates[i]?.getDate()}` : d}
            </div>
          ))}
          {viewMode === "month" &&
            (() => {
              const startDay = new Date(
                date.getFullYear(),
                date.getMonth(),
                1,
              ).getDay();
              const daysInMonth = new Date(
                date.getFullYear(),
                date.getMonth() + 1,
                0,
              ).getDate();
              return [
                ...Array(startDay)
                  .fill(null)
                  .map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="border-r border-b border-slate-200/50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
                    />
                  )),
                ...Array.from({ length: daysInMonth }, (_, i) =>
                  renderDayCell(
                    new Date(date.getFullYear(), date.getMonth(), i + 1),
                  ),
                ),
              ];
            })()}
          {viewMode === "week" && weekDates.map((d) => renderDayCell(d))}
        </div>
      </div>
    </>
  );
};

const EventActionModal = ({
  config,
  canEdit = true,
  onClose,
  onEdit,
  onDelete,
}) => {
  const dialogRef = useDialogA11y(config.isOpen, onClose);
  const dialogTitleId = useId();
  if (!config.isOpen || !config.event) return null;
  return (
    <div
      className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        tabIndex={-1}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-6 text-center border-b border-slate-100 dark:border-slate-800">
          <div className="mx-auto w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 mb-4">
            <Icon name="MousePointerClick" size={24} />
          </div>
          <h3
            id={dialogTitleId}
            className="text-lg font-black text-slate-800 dark:text-white truncate"
          >
            {config.event.title || "Elemento"}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            ¿Qué deseas hacer?
          </p>
        </div>
        <div className="p-4 space-y-3">
          {canEdit ? (
            <>
              <button
                onClick={() => {
                  onClose();
                  onEdit(config.event, config.type);
                }}
                className="w-full flex items-center justify-center gap-3 py-4 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
              >
                <Icon name="Edit" size={20} /> Editar elemento
              </button>
              <button
                onClick={() => {
                  onClose();
                  onDelete(config.event, config.type);
                }}
                className="w-full flex items-center justify-center gap-3 py-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-2xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
              >
                <Icon name="Trash2" size={20} /> Eliminar
              </button>
            </>
          ) : (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 text-left">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-sm">
                <Icon name="Lock" size={16} /> Acceso de solo lectura
              </div>
              <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-2">
                No tienes permisos para editar o eliminar este elemento.
              </p>
            </div>
          )}
          <button
            onClick={onClose}
            className="w-full py-4 text-slate-500 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors mt-2"
          >
            {canEdit ? "Cancelar" : "Cerrar"}
          </button>
        </div>
      </div>
    </div>
  );
};

const TASK_STATUS_DEFS = {
  accountTask: [
    { id: "por_disenar", label: "Por Diseñar", color: "slate" },
    { id: "aprobacion_interna", label: "Aprob. Interna", color: "blue" },
    { id: "aprobado_internamente", label: "Aprobado", color: "emerald" },
    { id: "publicado", label: "Publicado", color: "indigo" },
  ],
  editingTask: [
    { id: "editar", label: "Por Editar", color: "slate" },
    { id: "en_edicion", label: "En Edición", color: "amber" },
    { id: "revision_interna", label: "Revisión", color: "blue" },
    { id: "aprobado", label: "Aprobado", color: "emerald" },
    { id: "publicado", label: "Publicado", color: "indigo" },
  ],
  managementTask: [
    { id: "pendiente", label: "Pendiente", color: "slate" },
    { id: "en_proceso", label: "En Proceso", color: "violet" },
    { id: "en_espera", label: "En Espera", color: "amber" },
    { id: "cerrado", label: "Cerrado", color: "emerald" },
  ],
};

const formatDuration = (ms) => {
  if (!ms || ms <= 0) return "0s";
  const totalSecs = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (hrs > 0) return `${hrs}h ${mins > 0 ? `${mins}m` : ""}`.trim();
  if (mins > 0) return `${mins}m ${secs > 0 ? `${secs}s` : ""}`.trim();
  return `${secs}s`;
};

const formatClockDuration = (ms = 0) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
};

const relativeTime = (iso) => {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
};

const STATUS_COLOR_CLASSES = {
  slate:
    "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600",
  blue: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-500/40",
  emerald:
    "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40",
  indigo:
    "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/40",
  amber:
    "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/40",
  violet:
    "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-500/40",
};

const TaskDetailModal = ({
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
  managementTasks = [],
  clientChats = [],
  onSendClientChatMessage,
  onOpenClientChat,
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
  const [actionsOpen, setActionsOpen] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(-1);
  const [mentionedIds, setMentionedIds] = useState([]);
  const dialogRef = useDialogA11y(config.isOpen, onClose);
  const dialogTitleId = useId();
  const [fullAttachments, setFullAttachments] = useState(null);
  const [clientChatText, setClientChatText] = useState("");
  const [sendingClientChat, setSendingClientChat] = useState(false);

  // Cerrar dropdowns al click fuera
  useEffect(() => {
    if (!statusOpen && !priorityOpen && !assigneeOpen && !actionsOpen) return;
    const handler = (e) => {
      if (!e.target.closest("[data-dropdown]")) {
        setStatusOpen(false);
        setPriorityOpen(false);
        setAssigneeOpen(false);
        setActionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [statusOpen, priorityOpen, assigneeOpen, actionsOpen]);
  const timerStartRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const commentInputRef = useRef(null);

  useEffect(() => {
    if (timerRunning) {
      timerStartRef.current = Date.now() - timerElapsed;
      timerIntervalRef.current = setInterval(() => {
        setTimerElapsed(Date.now() - timerStartRef.current);
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [timerRunning]);

  const attachmentColMap = {
    accountTask: "account_tasks",
    editingTask: "editing",
    managementTask: "management_tasks",
  };
  const liveTaskForAttachments = config.task
    ? ({ accountTask: accountTasks, editingTask: editingTasks, managementTask: managementTasks }[
        config.type
      ] || []
      ).find((t) => t.id === config.task.id) || config.task
    : null;
  const attachmentsSignature = Array.isArray(
    liveTaskForAttachments?.attachments,
  )
    ? liveTaskForAttachments.attachments
        .map((att) => `${att.id}:${att.hasData ? 1 : 0}:${att.data ? 1 : 0}`)
        .join(",")
    : "";

  // Los adjuntos llegan sin el archivo (base64) desde el listado con polling,
  // para no re-descargar MBs de datos cada 2 min. Al abrir una tarea con
  // adjuntos pendientes de cargar (o al subir uno nuevo), se pide el registro
  // completo una sola vez.
  useEffect(() => {
    if (!config.isOpen || !config.task) {
      setFullAttachments(null);
      return;
    }
    const col = attachmentColMap[config.type];
    const taskId = config.task.id;
    const pendingAttachments = Array.isArray(
      liveTaskForAttachments?.attachments,
    )
      ? liveTaskForAttachments.attachments
      : [];
    const needsFetch = pendingAttachments.some(
      (att) => att.hasData && !att.data,
    );
    if (!col || !taskId || !needsFetch) return;
    let cancelled = false;
    getDoc(doc(db, "artifacts", appId, "public", "data", col, taskId))
      .then((snap) => {
        if (!cancelled) setFullAttachments(snap.data()?.attachments || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [config.isOpen, config.task?.id, config.type, attachmentsSignature]);

  if (!config.isOpen || !config.task) return null;
  const { type } = config;

  const liveArrays = {
    accountTask: accountTasks,
    editingTask: editingTasks,
    managementTask: managementTasks,
  };
  const task =
    (liveArrays[type] || []).find((t) => t.id === config.task.id) ||
    config.task;

  const client = clients.find((c) => c.id === task.clientId);
  // Mensajes del chat del cliente que referencian esta tarea.
  const taskChatMessages = clientChats
    .filter((message) => message.taskRef?.taskId === task.id)
    .sort((a, b) => ((a.createdAt || "") > (b.createdAt || "") ? 1 : -1));
  const handleSendClientChat = async () => {
    const trimmed = clientChatText.trim();
    if (
      !trimmed ||
      sendingClientChat ||
      !task.clientId ||
      !onSendClientChatMessage
    )
      return;
    setSendingClientChat(true);
    try {
      await onSendClientChatMessage({
        clientId: task.clientId,
        text: trimmed,
        mentionedIds: [],
        taskRef: { taskId: task.id, taskType: type, taskTitle: task.title || "" },
      });
      setClientChatText("");
    } finally {
      setSendingClientChat(false);
    }
  };
  const assignee =
    type === "accountTask"
      ? managers.find((m) => m.id === task.contextId)
      : type === "managementTask"
        ? users.find((u) => u.id === task.contextId)
        : editors.find((e) => e.id === task.contextId);
  // Multi-assignees: use task.assignees if present, else fall back to contextId
  const currentAssigneeIds = Array.isArray(task.assignees)
    ? task.assignees
    : task.contextId
      ? [task.contextId]
      : [];

  const tagColor =
    type === "accountTask"
      ? "indigo"
      : type === "managementTask"
        ? "violet"
        : "amber";
  const typeLabel =
    type === "accountTask"
      ? "Account"
      : type === "managementTask"
        ? "Gestión"
        : "Edición";
  const iconName =
    type === "accountTask"
      ? "LayoutList"
      : type === "managementTask"
        ? "ShieldCheck"
        : "Video";
  const statuses = TASK_STATUS_DEFS[type] || [];
  const currentStatus =
    statuses.find((s) => s.id === task.status) || statuses[0];
  const canAct = canEdit(type);
  const comments = Array.isArray(task.comments)
    ? [...task.comments].reverse()
    : [];
  const timeEntries = Array.isArray(task.timeEntries) ? task.timeEntries : [];
  const totalLoggedMs = timeEntries.reduce(
    (acc, e) => acc + (e.durationMs || 0),
    0,
  );

  // Activity feed: merge comments + time entries sorted newest first
  const activityFeed = [
    ...comments.map((c) => ({ ...c, _kind: "comment" })),
    ...timeEntries.map((e) => ({ ...e, _kind: "time", createdAt: e.loggedAt })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleStopTimer = async () => {
    setTimerRunning(false);
    const elapsed = timerElapsed;
    setTimerElapsed(0);
    if (elapsed >= 1000) {
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
    setMentionedIds((prev) =>
      prev.includes(person.id) ? prev : [...prev, person.id],
    );
    setMentionOpen(false);
    setMentionQuery("");
    setMentionStart(-1);
    setTimeout(
      () => commentInputRef.current && commentInputRef.current.focus(),
      0,
    );
  };

  const scrollToTaskSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const FieldRow = ({ icon, label, children }) => (
    <div className="flex items-center min-h-[32px] hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg px-2 -mx-2 transition-colors">
      <div className="flex items-center gap-2 w-40 shrink-0">
        <Icon name={icon} size={13} className="text-slate-500 shrink-0" />
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {label}
        </span>
      </div>
      <div className="flex-1 text-sm">{children}</div>
    </div>
  );

  const priorityColors = {
    urgente: "text-red-500",
    alta: "text-orange-500",
    normal: "text-slate-500",
    baja: "text-slate-300",
  };

  const PRIORITIES = [
    {
      id: "urgente",
      label: "Urgente",
      color: "text-red-500",
      iconColor: "#ef4444",
    },
    {
      id: "alta",
      label: "Alta",
      color: "text-orange-400",
      iconColor: "#fb923c",
    },
    {
      id: "normal",
      label: "Normal",
      color: "text-blue-400",
      iconColor: "#60a5fa",
    },
    {
      id: "baja",
      label: "Baja",
      color: "text-slate-500",
      iconColor: "#94a3b8",
    },
  ];
  const currentPriority = PRIORITIES.find((p) => p.id === task.priority);
  const peoplePool =
    type === "accountTask"
      ? managers
      : type === "editingTask"
        ? editors
        : users;
  const allMentionables = [
    ...(users || []),
    ...(managers || []),
    ...(editors || []),
  ].filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);
  const mentionSuggestions = mentionOpen
    ? allMentionables
        .filter(
          (p) =>
            p.name && p.name.toLowerCase().includes(mentionQuery.toLowerCase()),
        )
        .slice(0, 6)
    : [];

  const FlagIcon = ({ color, filled, size = 13 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : "none"}
      stroke={color || "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );

  return (
    <div
      className="task-detail-overlay fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-[#080b09]/75 p-3 backdrop-blur-sm md:p-6"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        tabIndex={-1}
        className="task-detail-shell flex h-[92dvh] max-h-[860px] w-full max-w-[1320px] flex-col overflow-hidden rounded-2xl border border-[#d8d5ce] bg-[#f7f6f2] shadow-2xl outline-none dark:border-white/10 dark:bg-[#171a18]"
        onClick={function (e) {
          e.stopPropagation();
        }}
      >
        {/* Barra superior */}
        <div className="flex min-h-[68px] shrink-0 items-center gap-2 border-b border-[#dedbd4] bg-[#f7f6f2] px-4 dark:border-white/10 dark:bg-[#171a18] md:px-5">
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wide bg-${tagColor}-100 dark:bg-${tagColor}-500/20 text-${tagColor}-700 dark:text-${tagColor}-400`}
          >
            <Icon name={iconName} size={11} />
            {typeLabel}
          </div>
          <Icon
            name="ChevronRight"
            size={12}
            className="text-slate-300 dark:text-slate-600"
          />
          <span className="text-xs text-slate-500 font-mono">
            {task.id?.slice(0, 8)}
          </span>
          <div className="hidden items-center gap-2 text-xs text-slate-500 lg:flex dark:text-slate-400">
            <Icon name="ChevronRight" size={12} />
            <span>Sala de {typeLabel}</span>
            <Icon name="ChevronRight" size={12} />
            <span>{currentStatus?.label || task.status}</span>
          </div>
          <div className="flex-1" />
          {canAct && (
            <div className="flex items-center gap-2" data-dropdown>
              <button
                onClick={() => onEdit(task, type)}
                aria-label={`Editar ${task.title || "tarea"}`}
                title="Editar"
                className="flex min-h-11 items-center gap-2 rounded-lg border border-[#d8d5ce] bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-[#aaa69d] hover:bg-[#efede7] dark:border-white/10 dark:bg-[#202420] dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-[#282d29]"
              >
                <Icon name="Pencil" size={14} />{" "}
                <span className="hidden sm:inline">Editar</span>
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActionsOpen((value) => !value)}
                  aria-label="Más acciones"
                  aria-expanded={actionsOpen}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[#d8d5ce] bg-white text-slate-500 transition-colors hover:border-[#aaa69d] hover:text-slate-800 dark:border-white/10 dark:bg-[#202420] dark:text-slate-400 dark:hover:border-white/20 dark:hover:text-slate-100"
                >
                  <Icon name="MoreHorizontal" size={18} />
                </button>
                {actionsOpen && (
                  <div className="absolute right-0 top-full z-30 mt-2 w-48 rounded-xl border border-[#d8d5ce] bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#242824]">
                    <button
                      type="button"
                      onClick={() => {
                        setActionsOpen(false);
                        onDelete(task, type);
                      }}
                      className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <Icon name="Trash2" size={15} />
                      Eliminar tarea
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="ml-1 flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-transparent text-slate-500 transition-colors hover:border-[#d8d5ce] hover:bg-white hover:text-slate-800 dark:text-slate-400 dark:hover:border-white/10 dark:hover:bg-[#202420] dark:hover:text-slate-100"
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="task-detail-body custom-scroll min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:grid-rows-1 lg:overflow-hidden">
          {/* LEFT — Contenido principal */}
          <div className="min-w-0 overflow-visible bg-[#f7f6f2] dark:bg-[#171a18] lg:custom-scroll lg:overflow-y-auto">
            <div className="mx-auto max-w-4xl px-5 pb-10 pt-6 md:px-8 md:pt-7">
              {/* Title */}
              <h1
                id={dialogTitleId}
                className="editorial-title mb-4 break-words pr-4 text-3xl leading-tight text-slate-900 dark:text-[#f1efe9] md:text-[38px]"
              >
                {task.title}
              </h1>

              {/* Estado pill prominente bajo el título */}
              <div
                className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2"
                data-dropdown
              >
                <div className="relative">
                  <button
                    onClick={() => canAct && setStatusOpen((o) => !o)}
                    className={`flex min-h-10 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${STATUS_COLOR_CLASSES[currentStatus?.color || "slate"]} ${canAct ? "cursor-pointer hover:opacity-90" : "cursor-default"} transition-opacity`}
                  >
                    {currentStatus?.label || task.status}
                    {canAct && <Icon name="ChevronDown" size={10} />}
                  </button>
                  {statusOpen && canAct && (
                    <div
                      className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1 min-w-[180px]"
                      data-dropdown
                    >
                      {statuses.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            onChangeStatus(task, type, s.id);
                            setStatusOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left ${task.status === s.id ? "text-purple-600 dark:text-purple-400" : "text-slate-700 dark:text-slate-200"}`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full bg-${s.color}-500 shrink-0`}
                          />
                          {s.label}
                          {task.status === s.id && (
                            <Icon
                              name="Check"
                              size={12}
                              className="ml-auto text-purple-500"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {client && (
                  <span className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="text-xs text-slate-400">Cliente</span>
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-[10px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                      {client.name?.charAt(0).toUpperCase()}
                    </span>
                    <strong className="font-semibold">{client.name}</strong>
                  </span>
                )}
                <span className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Icon name="CalendarDays" size={14} className="text-slate-400" />
                  <span className="text-xs text-slate-400">Fecha límite</span>
                  <strong className="font-semibold">{task.date || "Sin fecha"}</strong>
                </span>
                {assignee && (
                  <span className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#555552] text-[9px] font-bold text-white">
                      {assignee.name?.slice(0, 2).toUpperCase()}
                    </span>
                    <strong className="font-semibold">{assignee.name}</strong>
                  </span>
                )}
                {task.createdAt && (
                  <span className="hidden items-center gap-1 text-xs text-slate-500 dark:text-slate-400 xl:flex">
                    <Icon name="Clock" size={11} />
                    Creado el{" "}
                    {new Date(task.createdAt).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    a las{" "}
                    {new Date(task.createdAt).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>

              <nav
                aria-label="Secciones de la tarea"
                className="sticky top-0 z-10 mb-5 flex gap-1 border-b border-[#dedbd4] bg-[#f7f6f2]/95 backdrop-blur-sm dark:border-white/10 dark:bg-[#171a18]/95"
              >
                {[
                  { id: "task-summary", label: "Resumen" },
                  { id: "task-activity", label: "Actividad" },
                  {
                    id: "task-files",
                    label: `Archivos (${Array.isArray(task.attachments) ? task.attachments.length : 0})`,
                  },
                ].map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToTaskSection(item.id)}
                    className={`relative min-h-11 px-3 text-sm font-semibold transition-colors ${index === 0 ? "text-slate-900 after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-blue-500 dark:text-[#f1efe9]" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* Descripción */}
              <section
                id="task-summary"
                className="mb-4 scroll-mt-16 rounded-xl border border-[#dedbd4] bg-white p-5 dark:border-white/10 dark:bg-[#202420]"
              >
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 mb-2">
                  Descripción
                </p>
                {task.notes ? (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 px-4 py-3">
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {task.notes}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={canAct ? () => onEdit(task, type) : undefined}
                    className={`w-full min-h-[54px] flex items-center gap-2 text-left px-4 py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 text-sm text-slate-500 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-600 hover:text-slate-700 dark:hover:text-slate-200 transition-colors ${canAct ? "cursor-pointer" : ""}`}
                  >
                    <Icon name="Plus" size={14} className="shrink-0" />
                    <span>
                      <strong className="block font-semibold text-slate-700 dark:text-slate-200">
                        {canAct ? "Agregar descripción" : "Sin descripción"}
                      </strong>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        Añade contexto, enlaces o instrucciones para el equipo.
                      </span>
                    </span>
                  </button>
                )}
              </section>

              {/* Checklist */}
              {(() => {
                const checklist = Array.isArray(task.checklist)
                  ? task.checklist
                  : [];
                const done = checklist.filter((i) => i.done).length;
                const pct =
                  checklist.length > 0
                    ? Math.round((done / checklist.length) * 100)
                    : 0;
                const toggleItem = (id) =>
                  onUpdateChecklist(
                    task,
                    type,
                    checklist.map((i) =>
                      i.id === id ? { ...i, done: !i.done } : i,
                    ),
                  );
                const deleteItem = (id) =>
                  onUpdateChecklist(
                    task,
                    type,
                    checklist.filter((i) => i.id !== id),
                  );
                const addItem = () => {
                  if (!newCheckItem.trim()) return;
                  onUpdateChecklist(task, type, [
                    ...checklist,
                    {
                      id: Math.random().toString(36).slice(2, 10),
                      text: newCheckItem.trim(),
                      done: false,
                    },
                  ]);
                  setNewCheckItem("");
                  setAddingCheck(false);
                };
                return (
                  <section className="mb-4 rounded-xl border border-[#dedbd4] bg-white p-5 dark:border-white/10 dark:bg-[#202420]">
                    <div className="mb-4 flex items-center gap-2">
                      <Icon
                        name="CheckSquare"
                        size={13}
                        className="text-slate-500"
                      />
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        Lista de control
                      </p>
                      {checklist.length > 0 && (
                        <span className="ml-1 text-xs text-slate-500">
                          {done} de {checklist.length} completados
                        </span>
                      )}
                      {checklist.length > 0 && (
                        <span className="ml-auto text-xs font-bold text-slate-500">
                          {pct}%
                        </span>
                      )}
                    </div>
                    {checklist.length > 0 && (
                      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[#dedbd4] dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-[#b78000] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      {checklist.map((item) => (
                        <div
                          key={item.id}
                          className="group flex min-h-11 items-center gap-3 rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-[#dedbd4] hover:bg-[#f7f6f2] dark:hover:border-white/10 dark:hover:bg-[#282d29]"
                        >
                          <button
                            onClick={() => toggleItem(item.id)}
                            aria-label={item.done ? `Marcar ${item.text} como pendiente` : `Completar ${item.text}`}
                            className={`flex h-6 min-h-0 w-6 min-w-0 shrink-0 items-center justify-center rounded-md border-2 transition-all ${item.done ? "border-emerald-500 bg-emerald-500" : "border-slate-300 hover:border-emerald-400 dark:border-slate-600"}`}
                          >
                            {item.done && (
                              <Icon
                                name="Check"
                                size={11}
                                className="text-white"
                              />
                            )}
                          </button>
                          <span
                            className={`flex-1 text-sm ${item.done ? "line-through text-slate-500" : "text-slate-700 dark:text-slate-200"}`}
                          >
                            {item.text}
                          </span>
                          <button
                            onClick={() => deleteItem(item.id)}
                            aria-label={`Eliminar ${item.text}`}
                            className="flex h-9 min-h-0 w-9 min-w-0 items-center justify-center rounded-lg text-slate-500 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 focus:opacity-100 group-hover:opacity-100 dark:hover:bg-red-500/10"
                          >
                            <Icon name="X" size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {addingCheck ? (
                      <div className="flex gap-3 items-center mt-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                        <div className="w-[18px] h-[18px] rounded-[4px] border-2 border-slate-300 dark:border-slate-600 shrink-0" />
                        <input
                          autoFocus
                          value={newCheckItem}
                          onChange={(e) => setNewCheckItem(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") addItem();
                            if (e.key === "Escape") {
                              setAddingCheck(false);
                              setNewCheckItem("");
                            }
                          }}
                          placeholder="Nombre del elemento... (Enter para guardar)"
                          className="flex-1 text-sm bg-transparent outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400"
                        />
                        <button
                          onClick={() => {
                            setAddingCheck(false);
                            setNewCheckItem("");
                          }}
                          className="text-slate-500 hover:text-slate-600 transition-colors"
                        >
                          <Icon name="X" size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => canAct && setAddingCheck(true)}
                        className={`mt-3 flex min-h-11 w-full items-center gap-2 rounded-lg border border-dashed border-[#cbc7bf] bg-[#f7f6f2] px-4 py-2 text-sm text-slate-500 transition-colors hover:border-[#aaa69d] hover:text-slate-700 dark:border-white/15 dark:bg-[#1b1f1c] dark:hover:border-white/25 dark:hover:text-slate-200 ${!canAct ? "cursor-default opacity-40" : ""}`}
                      >
                        <Icon name="Plus" size={13} /> Agregar elemento
                      </button>
                    )}
                  </section>
                );
              })()}

              {/* Adjuntos */}
              {(() => {
                const attachments = Array.isArray(fullAttachments)
                  ? fullAttachments
                  : Array.isArray(task.attachments)
                    ? task.attachments
                    : [];
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
                const isImage = (att) =>
                  att.type && att.type.startsWith("image/");
                const isLoadingData = (att) => att.hasData && !att.data;
                return (
                  <section
                    id="task-files"
                    className="mb-4 scroll-mt-16 rounded-xl border border-[#dedbd4] bg-white p-5 dark:border-white/10 dark:bg-[#202420]"
                  >
                    <div className="mb-4 flex items-center gap-2">
                      <Icon name="Inbox" size={13} className="text-slate-500" />
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        Archivos
                      </p>
                      {attachments.length > 0 && (
                        <span className="text-xs text-slate-500 ml-1">
                          {attachments.length}
                        </span>
                      )}
                      {canAct && attachments.length > 0 && (
                        <button
                          onClick={() =>
                            fileInputRef.current && fileInputRef.current.click()
                          }
                          disabled={uploadingFile}
                          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                        >
                          {uploadingFile ? (
                            <Icon
                              name="Loader2"
                              size={11}
                              className="animate-spin"
                            />
                          ) : (
                            <Icon name="Plus" size={11} />
                          )}
                          {uploadingFile ? "Subiendo..." : "Adjuntar"}
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.mp4,.mov"
                    />
                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        {attachments.map((att) => (
                          <div
                            key={att.id}
                            className="group flex items-center gap-3 rounded-lg border border-[#dedbd4] bg-[#f7f6f2] p-3 transition-colors hover:border-[#aaa69d] dark:border-white/10 dark:bg-[#282d29] dark:hover:border-white/20"
                          >
                            {isImage(att) && att.data ? (
                              <img
                                src={att.data}
                                alt={att.name}
                                className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                <Icon
                                  name={isLoadingData(att) ? "Loader2" : "FileText"}
                                  size={16}
                                  className={
                                    isLoadingData(att)
                                      ? "text-slate-500 animate-spin"
                                      : "text-slate-500"
                                  }
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                                {att.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatFileSize(att.size)} · {att.uploadedBy} ·{" "}
                                {relativeTime(att.uploadedAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button
                                onClick={() => downloadFile(att)}
                                title={
                                  isLoadingData(att)
                                    ? "Cargando adjunto..."
                                    : "Descargar"
                                }
                                disabled={isLoadingData(att)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                              >
                                <Icon name="ArrowRight" size={13} />
                              </button>
                              {canAct && (
                                <button
                                  onClick={() =>
                                    onRemoveAttachment(task, type, att.id)
                                  }
                                  title="Eliminar"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                >
                                  <Icon name="X" size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {attachments.length === 0 && (
                      <button
                        onClick={() =>
                          canAct &&
                          fileInputRef.current &&
                          fileInputRef.current.click()
                        }
                        className={`flex min-h-[76px] w-full items-center justify-center gap-3 rounded-lg border border-dashed border-[#cbc7bf] bg-[#f7f6f2] px-4 py-3 text-sm text-slate-500 transition-colors hover:border-blue-400 hover:text-slate-700 dark:border-white/15 dark:bg-[#1b1f1c] dark:hover:border-blue-500/60 dark:hover:text-slate-200 ${!canAct ? "cursor-default opacity-40" : ""}`}
                      >
                        <Icon name="Paperclip" size={16} />
                        <span className="text-left">
                          <strong className="block font-semibold text-slate-700 dark:text-slate-200">
                            Selecciona un archivo
                          </strong>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            Imágenes, documentos, hojas de cálculo o video
                          </span>
                        </span>
                      </button>
                    )}
                  </section>
                );
              })()}

              {/* Chat del cliente — referencia esta tarea */}
              <section className="rounded-xl border border-blue-200 bg-blue-50/40 p-5 dark:border-blue-500/20 dark:bg-blue-500/5">
                <div className="mb-4 flex items-center gap-2">
                  <Icon
                    name="MessageSquare"
                    size={13}
                    className="text-blue-600 dark:text-blue-400"
                  />
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
                    Chat del cliente
                  </p>
                  {client?.name && (
                    <span className="truncate text-xs font-semibold text-slate-500">
                      · {client.name}
                    </span>
                  )}
                  {task.clientId && onOpenClientChat && (
                    <button
                      onClick={() => onOpenClientChat(task.clientId)}
                      className="ml-auto shrink-0 text-[11px] font-bold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Abrir chat completo
                    </button>
                  )}
                </div>

                {!task.clientId ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Esta tarea no tiene cliente asignado, así que no tiene chat.
                  </p>
                ) : (
                  <>
                    {taskChatMessages.length > 0 && (
                      <div className="mb-4 space-y-3">
                        {taskChatMessages.slice(-4).map((message) => (
                          <div key={message.id} className="flex gap-2.5">
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#555552] text-[9px] font-black text-white">
                              {(message.authorName || "U")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                  {message.authorName || "Usuario"}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {relativeTime(message.createdAt)}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-200">
                                {renderChatText(message.text)}
                              </p>
                            </div>
                          </div>
                        ))}
                        {taskChatMessages.length > 4 && onOpenClientChat && (
                          <button
                            onClick={() => onOpenClientChat(task.clientId)}
                            className="text-[11px] font-bold text-blue-600 hover:underline dark:text-blue-400"
                          >
                            Ver los {taskChatMessages.length} mensajes en el chat
                          </button>
                        )}
                      </div>
                    )}
                    <div className="flex items-end gap-2">
                      <textarea
                        value={clientChatText}
                        onChange={(e) => setClientChatText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            handleSendClientChat();
                          }
                        }}
                        placeholder="Comenta esta tarea en el chat del cliente…"
                        rows={1}
                        className="min-h-[42px] flex-1 resize-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500/60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                      <button
                        onClick={handleSendClientChat}
                        disabled={sendingClientChat || !clientChatText.trim()}
                        className="flex h-[42px] shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Icon
                          name={sendingClientChat ? "Loader2" : "Send"}
                          size={13}
                          className={sendingClientChat ? "animate-spin" : ""}
                        />
                        Enviar
                      </button>
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      Se publicará en el chat de {client?.name || "el cliente"} con
                      esta tarea enlazada.
                    </p>
                  </>
                )}
              </section>

              {/* Actividad — en el contenido principal, estilo Jira */}
              <section
                id="task-activity"
                className="scroll-mt-16 rounded-xl border border-[#dedbd4] bg-white p-5 dark:border-white/10 dark:bg-[#202420]"
              >
                <div className="flex items-center gap-2 mb-5">
                  <Icon
                    name="MessageSquare"
                    size={13}
                    className="text-slate-500"
                  />
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Actividad
                  </p>
                  {totalLoggedMs > 0 && (
                    <span className="ml-auto text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Icon name="Clock" size={11} />
                      {formatDuration(totalLoggedMs)}
                    </span>
                  )}
                </div>

                {/* Comment input */}
                <div className="mb-6 flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#555552] text-[10px] font-black text-white">
                    {(currentUserProfile?.name || "U")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 relative">
                    <textarea
                      ref={commentInputRef}
                      value={commentText}
                      onChange={handleCommentChange}
                      onKeyDown={(e) => {
                        if (mentionOpen && e.key === "Escape") {
                          setMentionOpen(false);
                          e.preventDefault();
                          return;
                        }
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                          handleSubmitComment();
                      }}
                      placeholder="Escribe una actualización o menciona con @"
                      rows={commentText ? 3 : 1}
                      className="min-h-[48px] w-full resize-none rounded-lg border border-[#d8d5ce] bg-[#f7f6f2] px-4 py-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/25 dark:border-white/10 dark:bg-[#1b1f1c] dark:text-slate-200"
                    />
                    {/* @mention dropdown */}
                    {mentionOpen && mentionSuggestions.length > 0 && (
                      <div className="absolute left-0 bottom-full mb-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1 w-52">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 pt-1.5 pb-1">
                          Mencionar
                        </p>
                        {mentionSuggestions.map((p) => (
                          <button
                            key={p.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              insertMention(p);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            <div className="w-6 h-6 rounded-full bg-[#555552] flex items-center justify-center text-white font-black text-[9px] shrink-0">
                              {p.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex-1 text-left">
                              {p.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {commentText.trim() && (
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleSubmitComment}
                          disabled={submitting}
                          className="flex min-h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                        >
                          {submitting ? (
                            <Icon
                              name="Loader2"
                              size={12}
                              className="animate-spin"
                            />
                          ) : (
                            <Icon name="Send" size={12} />
                          )}
                          {submitting ? "Enviando..." : "Comentar"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Feed */}
                <div className="space-y-4 border-l border-[#dedbd4] pl-4 dark:border-white/10">
                  {activityFeed.length === 0 && (
                    <div className="rounded-lg border border-dashed border-[#cbc7bf] bg-[#f7f6f2] px-4 py-5 text-center dark:border-white/15 dark:bg-[#1b1f1c]">
                      <Icon
                        name="MessageSquare"
                        size={18}
                        className="mx-auto mb-2 text-slate-400"
                      />
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        Sin actividad aún
                      </p>
                    </div>
                  )}
                  {activityFeed.map((item) =>
                    item._kind === "time" ? (
                      <div key={item.id} className="flex gap-3 items-center">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <Icon
                            name="Clock"
                            size={12}
                            className="text-emerald-600 dark:text-emerald-400"
                          />
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {item.authorName}
                          </span>{" "}
                          registró{" "}
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatDuration(item.durationMs)}
                          </span>
                          <span className="text-slate-500 text-xs ml-2">
                            {relativeTime(item.loggedAt)}
                          </span>
                        </p>
                      </div>
                    ) : (
                      <div key={item.id} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#555552] flex items-center justify-center text-white font-black text-[9px] shrink-0 mt-0.5">
                          {(item.authorName || "U").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1.5">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                              {item.authorName || "Usuario"}
                            </span>
                            <span className="text-xs text-slate-500">
                              {relativeTime(item.createdAt)}
                            </span>
                          </div>
                          <div className="rounded-lg rounded-tl-none border border-[#dedbd4] bg-[#f7f6f2] px-4 py-3 dark:border-white/10 dark:bg-[#282d29]">
                            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed break-words">
                              {item.text.split(/(@\S+)/g).map((part, i) =>
                                part.startsWith("@") ? (
                                  <span
                                    key={i}
                                    className="text-purple-600 dark:text-purple-400 font-bold"
                                  >
                                    {part}
                                  </span>
                                ) : (
                                  part
                                ),
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* RIGHT — Panel de detalles estilo Jira */}
          <aside className="w-full overflow-visible border-t border-[#dedbd4] bg-[#efeee9] dark:border-white/10 dark:bg-[#12161a] lg:custom-scroll lg:max-h-none lg:overflow-y-auto lg:border-l lg:border-t-0">
            <div className="space-y-3 p-5">
              <p className="mb-4 text-sm font-semibold text-slate-800 dark:text-[#f1efe9]">
                Detalles
              </p>

              {/* Asignados */}
              <div data-dropdown className="relative rounded-xl border border-[#d8d5ce] bg-white p-4 dark:border-white/10 dark:bg-[#202420]">
                <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                  <Icon name="Users" size={14} />
                  Responsable
                </p>
                {/* Avatars row */}
                <div className="flex min-h-10 flex-wrap items-center gap-2">
                  {currentAssigneeIds.length > 0 ? (
                    currentAssigneeIds.map((uid) => {
                      const person = peoplePool.find((p) => p.id === uid);
                      if (!person) return null;
                      return (
                        <div
                          key={uid}
                          className="group flex min-h-10 items-center gap-2 rounded-lg bg-[#f7f6f2] py-1 pl-1.5 pr-2 dark:bg-[#282d29]"
                        >
                          <div className="w-5 h-5 rounded-full bg-[#555552] flex items-center justify-center text-white font-black text-[8px] shrink-0">
                            {person.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-none">
                            {person.name.split(" ")[0]}
                          </span>
                          {canAct && (
                            <button
                              onClick={() =>
                                onChangeAssignees(
                                  task,
                                  type,
                                  currentAssigneeIds.filter((id) => id !== uid),
                                )
                              }
                              className="ml-0.5 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Icon name="X" size={9} />
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-sm text-slate-500 italic">
                      Sin asignar
                    </span>
                  )}
                  {canAct && (
                    <button
                      onClick={() => setAssigneeOpen((o) => !o)}
                      aria-label="Cambiar responsable"
                      className="flex h-10 min-h-0 w-10 min-w-0 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-500 transition-colors hover:border-blue-400 hover:text-blue-500 dark:border-slate-600"
                    >
                      <Icon name="Plus" size={12} />
                    </button>
                  )}
                </div>
                {assigneeOpen && canAct && (
                  <div
                    className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1 w-52 max-h-60 overflow-y-auto"
                    data-dropdown
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 pt-2 pb-1 sticky top-0 bg-white dark:bg-slate-800">
                      Asignar a
                    </p>
                    {peoplePool.map((p) => {
                      const isChecked = currentAssigneeIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            const newIds = isChecked
                              ? currentAssigneeIds.filter((id) => id !== p.id)
                              : [...currentAssigneeIds, p.id];
                            onChangeAssignees(task, type, newIds);
                            // Notificar al nuevo asignado
                            if (!isChecked && sendNotification) {
                              const email = p.email || p.authEmail;
                              if (email)
                                sendNotification({
                                  to: email,
                                  type: "assigned",
                                  senderName:
                                    currentUserProfile?.name || "Alguien",
                                  taskTitle: task.title,
                                  taskType: type,
                                });
                            }
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isChecked ? "bg-purple-500 border-purple-500" : "border-slate-300 dark:border-slate-600"}`}
                          >
                            {isChecked && (
                              <Icon
                                name="Check"
                                size={9}
                                className="text-white"
                              />
                            )}
                          </div>
                          <div className="w-6 h-6 rounded-full bg-[#555552] flex items-center justify-center text-white font-black text-[9px] shrink-0">
                            {p.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span
                            className={`text-sm font-semibold flex-1 ${isChecked ? "text-purple-600 dark:text-purple-400" : "text-slate-700 dark:text-slate-200"}`}
                          >
                            {p.name}
                          </span>
                        </button>
                      );
                    })}
                    {currentAssigneeIds.length > 0 && (
                      <button
                        onClick={() => {
                          onChangeAssignees(task, type, []);
                          setAssigneeOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-t border-slate-100 dark:border-slate-700 mt-1"
                      >
                        <Icon name="UserX" size={13} /> Quitar todos
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Prioridad */}
              <div data-dropdown className="relative rounded-xl border border-[#d8d5ce] bg-white p-4 dark:border-white/10 dark:bg-[#202420]">
                <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                  <Icon name="Flag" size={14} />
                  Prioridad
                </p>
                <button
                  onClick={() => canAct && setPriorityOpen((o) => !o)}
                  className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-2 py-1.5 ${canAct ? "cursor-pointer hover:bg-[#f7f6f2] dark:hover:bg-[#282d29]" : "cursor-default"} transition-colors`}
                >
                  <FlagIcon
                    color={currentPriority?.iconColor || "#94a3b8"}
                    filled={!!currentPriority}
                  />
                  <span
                    className={`text-sm font-semibold ${currentPriority?.color || "text-slate-500 italic"}`}
                  >
                    {currentPriority?.label || "Sin prioridad"}
                  </span>
                </button>
                {priorityOpen && canAct && (
                  <div
                    className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1 w-44"
                    data-dropdown
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 pt-2 pb-1">
                      Prioridad
                    </p>
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onChangePriority(task, type, p.id);
                          setPriorityOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left ${p.color}`}
                      >
                        <FlagIcon color={p.iconColor} filled size={14} />
                        {p.label}
                        {task.priority === p.id && (
                          <Icon
                            name="Check"
                            size={12}
                            className="ml-auto text-slate-500"
                          />
                        )}
                      </button>
                    ))}
                    {task.priority && (
                      <button
                        onClick={() => {
                          onChangePriority(task, type, null);
                          setPriorityOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-t border-slate-100 dark:border-slate-700 mt-1"
                      >
                        <Icon name="X" size={12} /> Quitar prioridad
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Fecha límite */}
              <div className="rounded-xl border border-[#d8d5ce] bg-white p-4 dark:border-white/10 dark:bg-[#202420]">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mb-2">
                  Fecha límite
                </p>
                <div className="min-h-[38px] flex items-center gap-2 py-1 -mx-1 px-2 rounded-xl">
                  <Icon
                    name="CalendarDays"
                    size={13}
                    className="text-slate-500 shrink-0"
                  />
                  <span
                    className={`text-sm font-semibold ${task.date ? "text-slate-700 dark:text-slate-200" : "text-slate-500 italic"}`}
                  >
                    {task.date || "Sin fecha"}
                  </span>
                </div>
              </div>

              {/* Cliente */}
              <div className="rounded-xl border border-[#d8d5ce] bg-white p-4 dark:border-white/10 dark:bg-[#202420]">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mb-2">
                  Cliente
                </p>
                <div className="min-h-[38px] flex items-center gap-2 py-1 -mx-1 px-2 rounded-xl">
                  {client ? (
                    <>
                      <div className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-[9px] shrink-0">
                        {client.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {client.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-slate-500 italic">
                      Interno
                    </span>
                  )}
                </div>
              </div>

              {/* Jerarquía / Categoría */}
              {type === "editingTask" && (
                <div className="rounded-xl border border-[#d8d5ce] bg-white p-4 dark:border-white/10 dark:bg-[#202420]">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mb-2">
                    Jerarquía
                  </p>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800">
                    {getEditingHierarchyId(task).toUpperCase()}
                  </span>
                </div>
              )}
              {type === "managementTask" && task.category && (
                <div className="rounded-xl border border-[#d8d5ce] bg-white p-4 dark:border-white/10 dark:bg-[#202420]">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mb-2">
                    Categoría
                  </p>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {task.category}
                  </span>
                </div>
              )}

              {/* Tiempo */}
              <div className="rounded-xl border border-[#d8d5ce] bg-white p-5 text-center dark:border-white/10 dark:bg-[#202420]">
                <p className="mb-3 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                  <Icon name="Timer" size={14} />
                  Tiempo registrado
                </p>
                <div className="flex min-h-[74px] flex-col items-center justify-center gap-3">
                  {timerRunning ? (
                    <>
                      <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-red-500">
                        <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-500" />
                        En curso
                      </span>
                      <span className="text-2xl font-semibold tabular-nums text-red-500 dark:text-red-400">
                        {formatClockDuration(timerElapsed)}
                      </span>
                      <button
                        onClick={handleStopTimer}
                        disabled={savingTime}
                        className="flex min-h-10 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                      >
                        {savingTime ? (
                          <Icon
                            name="Loader2"
                            size={10}
                            className="animate-spin"
                          />
                        ) : (
                          <Icon name="Square" size={10} />
                        )}
                        {savingTime ? "..." : "Detener"}
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        className={`text-2xl font-semibold tabular-nums ${totalLoggedMs > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-200"}`}
                      >
                        {formatClockDuration(totalLoggedMs)}
                      </span>
                      {canAct && (
                        <button
                          onClick={() => {
                            setTimerElapsed(0);
                            setTimerRunning(true);
                          }}
                          className="flex min-h-11 items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-6 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                        >
                          <Icon name="Play" size={10} /> Iniciar
                        </button>
                      )}
                    </>
                  )}
                </div>
                {timeEntries.length === 0 && !timerRunning && (
                  <p className="mt-1 text-xs text-slate-500">Sin registros todavía</p>
                )}
                {timeEntries.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {[...timeEntries]
                      .reverse()
                      .slice(0, 3)
                      .map((e) => (
                        <div
                          key={e.id}
                          className="flex items-center text-xs gap-2 text-slate-500"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <span className="font-bold text-slate-600 dark:text-slate-300">
                            {formatDuration(e.durationMs)}
                          </span>
                          <span className="truncate">{e.authorName}</span>
                          <span className="ml-auto shrink-0">
                            {relativeTime(e.loggedAt)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Fecha creación */}
              {task.createdAt && (
                <div className="border-t border-[#d8d5ce] px-1 pt-4 dark:border-white/10">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mb-2">
                    Creado
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(task.createdAt).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    <br />
                    {new Date(task.createdAt).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
              <p className="flex items-center justify-center gap-2 pt-2 text-xs text-slate-500 dark:text-slate-400">
                <kbd className="rounded border border-[#cbc7bf] bg-white px-2 py-1 font-mono text-[10px] dark:border-white/15 dark:bg-[#202420]">
                  Esc
                </kbd>
                para cerrar
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const DayDetailsModal = ({
  config,
  onClose,
  activities,
  clients,
  managers,
  editors,
  users,
  canEditActivity,
  onEdit,
  onDelete,
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
    user: "Usuario",
  };

  let displayDate = "";
  if (config.date) {
    const [y, m, d] = config.date.split("-");
    displayDate = new Date(y, m - 1, d).toLocaleDateString("es-HN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        tabIndex={-1}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950 shrink-0">
          <div>
            <h3
              id={dialogTitleId}
              className="font-black text-lg text-slate-800 dark:text-white capitalize"
            >
              {displayDate}
            </h3>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Detalle de Actividades
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400"
          >
            <Icon name="X" size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scroll space-y-3">
          {dayActivities.length === 0 ? (
            <EmptyState icon="Inbox" text="No hay actividades este día" />
          ) : (
            dayActivities.map((act) => {
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
                  (u) => u.id === act.contextId,
                );
                if (managementUser) personName = managementUser.name;
              }

              return (
                <div
                  key={`${act.collectionType}-${act.id}`}
                  className={`p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-sm flex items-center gap-4`}
                >
                  <div
                    className={`p-3 rounded-xl bg-${act._color}-50 dark:bg-${act._color}-500/20 text-${act._color}-600 dark:text-${act._color}-400 shrink-0`}
                  >
                    <Icon name={act._icon} size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 dark:text-white truncate">
                      {act.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider text-${act._color}-600 dark:text-${act._color}-400`}
                      >
                        {act._label}
                      </span>

                      {client && (
                        <span className="flex items-center gap-1 text-[9px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800">
                          <Icon name="Briefcase" size={8} /> {client.name}
                        </span>
                      )}

                      {(act.collectionType === "accountTask" ||
                        act.collectionType === "editingTask" ||
                        act.collectionType === "managementTask") && (
                        <span className="flex items-center gap-1 text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          <Icon name="UserCircle2" size={8} /> {personName}
                        </span>
                      )}

                      {act.status && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                            act.status === "publicado" ||
                            act.status === "aprobado"
                              ? "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                              : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                          }`}
                        >
                          {act.status.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  </div>
                  {canEditActivity(act.collectionType) && (
                    <div className="flex items-center gap-1 opacity-100 md:opacity-60 md:hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          onClose();
                          onEdit(act, act.collectionType);
                        }}
                        className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Icon name="Edit" size={18} />
                      </button>
                      <button
                        onClick={() => {
                          onClose();
                          onDelete(act, act.collectionType);
                        }}
                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Icon name="Trash2" size={18} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const CreateTaskModal = ({
  config,
  onClose,
  clients,
  managers,
  editors,
  managementUsers,
  actions,
}) => {
  const { type, data } = config;
  const isTaskDialogOpen =
    config.isOpen &&
    ["accountTask", "editingTask", "managementTask"].includes(type);
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

  // Reset / pre-fill when modal opens
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
          type === "editingTask"
            ? normalizeEditingWorkflowStatus(data.status || "editar")
            : data.status || "editar",
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

  // Close dropdowns on outside click
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

  const peoplePool =
    type === "accountTask"
      ? managers
      : type === "editingTask"
        ? editors
        : managementUsers;
  const assignee = peoplePool.find((p) => p.id === assigneeId);
  const client = clients.find((c) => c.id === clientId);
  const tagColor =
    type === "accountTask"
      ? "indigo"
      : type === "managementTask"
        ? "violet"
        : "amber";
  const typeLabel =
    type === "accountTask"
      ? "Account"
      : type === "managementTask"
        ? "Gestión"
        : "Edición";
  const iconName =
    type === "accountTask"
      ? "LayoutList"
      : type === "managementTask"
        ? "ShieldCheck"
        : "Video";

  const TASK_PRIORITIES = [
    {
      id: "urgente",
      label: "Urgente",
      iconColor: "#ef4444",
      color: "text-red-500",
    },
    {
      id: "alta",
      label: "Alta",
      iconColor: "#fb923c",
      color: "text-orange-400",
    },
    {
      id: "normal",
      label: "Normal",
      iconColor: "#60a5fa",
      color: "text-blue-400",
    },
    {
      id: "baja",
      label: "Baja",
      iconColor: "#94a3b8",
      color: "text-slate-500",
    },
  ];
  const curPriority = TASK_PRIORITIES.find((p) => p.id === priority);

  const FlagIcon = ({ color, filled, size = 12 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : "none"}
      stroke={color || "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );

  const Chip = ({ icon, label, active, color, onClick, children }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors
                ${
                  active
                    ? "border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                } ${color || ""}`}
    >
      {icon && <Icon name={icon} size={11} />}
      {children || label}
    </button>
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
          priority,
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
          clientId,
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
          notificationsEnabled: data.notificationsEnabled || false,
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
          priority,
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
          clientId,
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
          notificationsEnabled: false,
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
        month: "short",
      });
    } catch (e) {}
  } else if (data?.date) {
    try {
      const [y, m, d] = data.date.split("-");
      displayDate = new Date(y, m - 1, d).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      });
    } catch (e) {}
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-[90] flex items-start justify-center pt-12 pb-8 px-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        tabIndex={-1}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-visible outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={dialogTitleId} className="sr-only">
          {config.isEdit ? `Editar ${typeLabel}` : `Nueva ${typeLabel}`}
        </h2>

        {/* Header */}
        <div className="flex items-center gap-2 px-6 pt-5 pb-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wide bg-${tagColor}-100 dark:bg-${tagColor}-500/20 text-${tagColor}-700 dark:text-${tagColor}-400`}
          >
            <Icon name={iconName} size={11} />{" "}
            {config.isEdit ? `Editar ${typeLabel}` : `Nueva ${typeLabel}`}
          </div>
          {displayDate && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Icon name="CalendarDays" size={11} />
              {displayDate}
            </span>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Icon name="X" size={15} />
          </button>
        </div>

        {/* Title input */}
        <div className="px-6 py-3">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && title.trim()) handleSubmit();
            }}
            placeholder="Escribe el nombre de la tarea..."
            className="w-full text-xl font-bold text-slate-900 dark:text-white bg-transparent outline-none placeholder-slate-300 dark:placeholder-slate-600"
          />
        </div>

        {/* Description */}
        <div className="px-6 pb-4">
          {showDesc ? (
            <textarea
              autoFocus
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agregar descripción..."
              rows={4}
              className="w-full text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 outline-none resize-none placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all"
            />
          ) : (
            <button
              onClick={() => setShowDesc(true)}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-1"
            >
              <Icon name="AlignLeft" size={14} /> Agregar descripción
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 dark:border-slate-800" />

        {/* Chips */}
        <div className="px-6 py-4 flex flex-wrap gap-2.5">
          {/* Persona asignada */}
          <div className="relative" data-ctdrop>
            <Chip
              icon={assignee ? null : "UserCircle2"}
              active={!!assignee}
              onClick={() => setAssigneeOpen((o) => !o)}
            >
              {assignee ? (
                <>
                  <div className="w-4 h-4 rounded-full bg-[#555552] flex items-center justify-center text-white font-black text-[8px]">
                    {assignee.name.slice(0, 2).toUpperCase()}
                  </div>
                  {assignee.name}
                </>
              ) : (
                "Persona asignada"
              )}
            </Chip>
            {assigneeOpen && (
              <div
                className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1 w-52 max-h-60 overflow-y-auto"
                data-ctdrop
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 pt-2 pb-1 sticky top-0 bg-white dark:bg-slate-800">
                  Asignar a
                </p>
                {peoplePool.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setAssigneeId(assigneeId === p.id ? "" : p.id);
                      setAssigneeOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#555552] flex items-center justify-center text-white font-black text-[9px] shrink-0">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span
                      className={`text-sm font-semibold flex-1 ${assigneeId === p.id ? "text-purple-600 dark:text-purple-400" : "text-slate-700 dark:text-slate-200"}`}
                    >
                      {p.name}
                    </span>
                    {assigneeId === p.id && (
                      <Icon
                        name="Check"
                        size={12}
                        className="text-purple-500"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fecha límite */}
          <div className="relative">
            <Chip
              icon="CalendarDays"
              active={!!date}
              onClick={() => setDatePickerOpen((o) => !o)}
            >
              {date || "Fecha límite"}
            </Chip>
            {datePickerOpen && (
              <div className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 p-3">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setDatePickerOpen(false);
                  }}
                  className="text-sm bg-transparent outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Prioridad */}
          <div className="relative" data-ctdrop>
            <button
              onClick={() => setPriorityOpen((o) => !o)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors
                            ${curPriority ? "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
            >
              <FlagIcon
                color={curPriority?.iconColor || "#94a3b8"}
                filled={!!curPriority}
              />
              <span
                className={
                  curPriority?.color || "text-slate-600 dark:text-slate-300"
                }
              >
                {curPriority?.label || "Prioridad"}
              </span>
            </button>
            {priorityOpen && (
              <div
                className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1 w-44"
                data-ctdrop
              >
                {TASK_PRIORITIES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPriority(priority === p.id ? "" : p.id);
                      setPriorityOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left ${p.color}`}
                  >
                    <FlagIcon color={p.iconColor} filled size={13} />
                    {p.label}
                    {priority === p.id && (
                      <Icon
                        name="Check"
                        size={12}
                        className="ml-auto text-slate-500"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cliente */}
          <div className="relative" data-ctdrop>
            <Chip
              icon="Briefcase"
              active={!!client}
              onClick={() => {
                setClientOpen((o) => !o);
                setClientSearch("");
              }}
            >
              {client ? client.name : "Cliente"}
            </Chip>
            {clientOpen && (
              <div
                className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 w-64 overflow-hidden"
                data-ctdrop
              >
                {/* Search */}
                <div className="px-3 pt-2.5 pb-1.5 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-2.5 py-1.5">
                    <Icon
                      name="Search"
                      size={12}
                      className="text-slate-500 shrink-0"
                    />
                    <input
                      autoFocus
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Buscar cliente..."
                      className="flex-1 text-sm bg-transparent outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 min-w-0"
                    />
                    {clientSearch && (
                      <button
                        onClick={() => setClientSearch("")}
                        className="text-slate-500 hover:text-slate-600"
                      >
                        <Icon name="X" size={11} />
                      </button>
                    )}
                  </div>
                </div>
                {/* List */}
                <div className="overflow-y-auto" style={{ maxHeight: "280px" }}>
                  {!clientSearch && (
                    <button
                      onClick={() => {
                        setClientId("");
                        setClientOpen(false);
                        setClientSearch("");
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left border-b border-slate-100 dark:border-slate-700"
                    >
                      <Icon name="X" size={13} /> Sin cliente (interno)
                    </button>
                  )}
                  {clients
                    .filter(
                      (c) =>
                        !clientSearch ||
                        c.name
                          .toLowerCase()
                          .includes(clientSearch.toLowerCase()),
                    )
                    .slice(0, 8)
                    .map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setClientId(c.id);
                          setClientOpen(false);
                          setClientSearch("");
                        }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${clientId === c.id ? "bg-purple-50 dark:bg-purple-500/10" : ""}`}
                      >
                        <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-[10px] shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span
                          className={`text-sm font-semibold flex-1 text-left truncate ${clientId === c.id ? "text-purple-600 dark:text-purple-400" : "text-slate-700 dark:text-slate-200"}`}
                        >
                          {c.name}
                        </span>
                        {clientId === c.id && (
                          <Icon
                            name="Check"
                            size={12}
                            className="text-purple-500 shrink-0"
                          />
                        )}
                      </button>
                    ))}
                  {clientSearch &&
                    clients.filter((c) =>
                      c.name.toLowerCase().includes(clientSearch.toLowerCase()),
                    ).length === 0 && (
                      <p className="px-4 py-3 text-sm text-slate-500 text-center">
                        Sin resultados
                      </p>
                    )}
                </div>
              </div>
            )}
          </div>

          {/* Jerarquía — solo editingTask */}
          {type === "editingTask" && (
            <select
              value={hierarchy}
              onChange={(e) => setHierarchy(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 outline-none cursor-pointer"
            >
              {(
                EDITING_HIERARCHY_OPTIONS || [
                  { id: "p1", label: "P1" },
                  { id: "p2", label: "P2" },
                  { id: "p3", label: "P3" },
                  { id: "reel", label: "Reel" },
                  { id: "story", label: "Story" },
                ]
              ).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label || o.id}
                </option>
              ))}
            </select>
          )}

          {/* Categoría — solo managementTask */}
          {type === "managementTask" && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 outline-none cursor-pointer"
            >
              {["seguimiento", "reunion", "revision", "entrega", "otro"].map(
                (c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ),
              )}
            </select>
          )}

          {/* Hora — account & management */}
          {(type === "accountTask" || type === "managementTask") && (
            <div className="relative">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                title="Hora"
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 outline-none cursor-pointer w-[110px]"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors px-4 py-2"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-${tagColor}-600 hover:bg-${tagColor}-700 shadow-sm`}
          >
            <Icon name={config.isEdit ? "Save" : "Plus"} size={14} />
            {config.isEdit ? "Guardar cambios" : `Crear ${typeLabel}`}
          </button>
        </div>
      </div>

      {/* Popup confirmación sin fecha */}
      {confirmNoDate && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setConfirmNoDate(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-no-date-title"
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                <Icon name="CalendarOff" size={18} className="text-amber-500" />
              </div>
              <div>
                <p
                  id="confirm-no-date-title"
                  className="font-black text-slate-800 dark:text-white text-base"
                >
                  ¿Sin fecha límite?
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Esta tarea no tendrá una fecha de vencimiento asignada. Podrás
                  agregarla después.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmNoDate(false)}
                className="px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setConfirmNoDate(false);
                  doSubmit();
                }}
                className="px-5 py-2 text-sm font-black text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors"
              >
                Sí, crear sin fecha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Modal = ({
  config,
  onClose,
  clients,
  managers,
  editors,
  managementUsers,
  actions,
}) => {
  const { type, data, isEdit } = config;
  const dialogRef = useDialogA11y(config.isOpen, onClose);
  const dialogTitleId = useId();
  if (!config.isOpen) return null;

  const eventTitleMatch =
    type === "event" && data?.title
      ? data.title.match(/^(\d{2}:\d{2})\s*-\s*(.*)$/)
      : null;
  const eventDefaultTime = eventTitleMatch ? eventTitleMatch[1] : "";
  const eventDefaultTitle =
    type === "event"
      ? eventTitleMatch
        ? eventTitleMatch[2]
        : data?.title || ""
      : "";
  const normalizeEventTitle = (title = "") =>
    title.replace(/^\d{2}:\d{2}\s*-\s*/, "").trim();
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
          photo: fd.photo || "",
        });
      if (type === "manager")
        actions.updateManager(data.id, {
          name: fd.name || "",
          email: fd.email || "",
          profession: fd.profession || "",
          photo: fd.photo || "",
        });
      if (type === "editor")
        actions.updateEditor(data.id, {
          name: fd.name || "",
          email: fd.email || "",
          profession: fd.profession || "",
          photo: fd.photo || "",
        });
      if (type === "event")
        actions.updateEvent(data.id, {
          title: buildEventTitle(fd.title, fd.time),
        });
      if (type === "accountTask")
        actions.updateAccountTask(data.id, {
          title: fd.title || "",
          time: fd.time || data.time || "",
          contextId: fd.manager || data.contextId || "",
          clientId: fd.clientId || "",
          notes: fd.notes || "",
        });
      if (type === "editingTask")
        actions.updateEditingTask(data.id, {
          title: fd.title || "",
          priority: fd.priority || "normal",
          hierarchy: fd.hierarchy || "p2",
          status: fd.status || data.status || "editar",
          notes: fd.notes || "",
          contextId: fd.editor || data.contextId || "",
          clientId: fd.clientId || "",
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
          notificationsEnabled: fd.notificationsEnabled === "on",
        });
      if (type === "user")
        actions.updateUserRecord(data.id, {
          name: fd.name || "",
          email: fd.email || "",
          role: fd.role || "viewer",
          isActive: fd.isActive === "true",
          profession: fd.profession || "",
          photo: fd.photo || "",
        });
    } else {
      if (type === "client")
        actions.addClient({
          name: fd.name || "",
          niche: fd.niche || "",
          package: fd.package || "",
          instagram: fd.instagram || "",
          managerId: fd.managerId || "",
          photo: fd.photo || "",
        });
      if (type === "manager")
        actions.addManager({
          name: fd.name || "",
          email: fd.email || "",
          profession: fd.profession || "",
          photo: fd.photo || "",
          assignedAccounts: [],
        });
      if (type === "editor")
        actions.addEditor({
          name: fd.name || "",
          email: fd.email || "",
          profession: fd.profession || "",
          photo: fd.photo || "",
        });
      if (type === "event")
        actions.addEvent({
          date: data.date,
          title: buildEventTitle(fd.title, fd.time),
          type: data.type,
        });
      if (type === "accountTask")
        actions.addAccountTask({
          date: data.date,
          title: fd.title || "",
          time: fd.time || "",
          contextId: fd.manager || data.contextId || "",
          clientId: fd.clientId || "",
          notes: fd.notes || "",
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
          clientId: fd.clientId || "",
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
          notificationsEnabled: fd.notificationsEnabled === "on",
        });
      if (type === "user")
        actions.addUserRecord({
          name: fd.name || "",
          email: fd.email || "",
          role: fd.role || "viewer",
          isActive: fd.isActive === "true",
          profession: fd.profession || "",
          photo: fd.photo || "",
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
    user: "Usuario",
  };
  const selectClassName =
    "w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none";
  const textareaClassName =
    "w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-500 dark:placeholder:text-slate-500 h-24 text-sm";
  const submitColor = ["editingTask", "editor"].includes(type)
    ? "rose"
    : type === "accountTask"
      ? "indigo"
      : type === "managementTask"
        ? "violet"
        : type === "manager" || type === "client"
          ? "blue"
          : "purple";

  let displayDate = "";
  if (data?.date && typeof data.date === "string") {
    const [y, m, d] = data.date.split("-");
    displayDate = new Date(y, m - 1, d).toLocaleDateString("es-HN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[90] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        tabIndex={-1}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950 shrink-0">
          <h3
            id={dialogTitleId}
            className="font-bold text-lg text-slate-800 dark:text-white"
          >
            {isEdit ? "Editar " : "Nuevo "}
            {titles[type]}
          </h3>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400"
          >
            <Icon name="X" size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scroll">
          <form onSubmit={onSubmit} className="space-y-4">
            {["event", "accountTask", "editingTask", "managementTask"].includes(
              type,
            ) &&
              !isEdit && (
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 mb-2">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Para el día
                  </p>
                  <p className="text-lg font-black text-slate-800 dark:text-white capitalize">
                    {displayDate}
                  </p>
                </div>
              )}

            {type === "client" && (
              <>
                <PhotoUploader
                  defaultValue={data?.photo}
                  label="Logo / Foto del cliente"
                />
                <Input
                  name="name"
                  placeholder="Nombre"
                  defaultValue={data?.name}
                  required
                />
                <Input
                  name="niche"
                  placeholder="Rubro"
                  defaultValue={data?.niche}
                  required
                />
                <Input
                  name="package"
                  placeholder="Paquete"
                  defaultValue={data?.package}
                  required
                />
                <Input
                  name="instagram"
                  placeholder="Link Instagram"
                  defaultValue={data?.instagram}
                />
                <select
                  name="managerId"
                  defaultValue={data?.managerId}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">Asignar Manager (Opcional)</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </>
            )}

            {type === "manager" && (
              <>
                <PhotoUploader defaultValue={data?.photo} />
                <Input
                  name="name"
                  placeholder="Nombre Completo"
                  defaultValue={data?.name}
                  required
                />
                <Input
                  name="profession"
                  placeholder="Profesión / Cargo (ej. Account Manager)"
                  defaultValue={data?.profession}
                />
                <Input
                  name="email"
                  type="email"
                  placeholder="Correo"
                  defaultValue={data?.email}
                  required
                />
              </>
            )}

            {type === "editor" && (
              <>
                <PhotoUploader defaultValue={data?.photo} />
                <Input
                  name="name"
                  placeholder="Nombre del Editor"
                  defaultValue={data?.name}
                  required
                />
                <Input
                  name="profession"
                  placeholder="Profesión / Cargo (ej. Editor de video)"
                  defaultValue={data?.profession}
                />
                <Input
                  name="email"
                  type="email"
                  placeholder="Correo"
                  defaultValue={data?.email}
                  required
                />
              </>
            )}

            {type === "event" && (
              <>
                <Input
                  name="title"
                  placeholder="Nombre Producción"
                  defaultValue={eventDefaultTitle}
                  required
                  autoFocus
                />
                <Input
                  name="time"
                  type="time"
                  label="Hora (Opcional)"
                  defaultValue={eventDefaultTime}
                />
              </>
            )}

            {type === "accountTask" && (
              <>
                <Input
                  name="title"
                  placeholder="¿Qué hay que hacer/publicar?"
                  defaultValue={data?.title}
                  required
                  autoFocus
                />

                <select
                  name="clientId"
                  defaultValue={data?.clientId || ""}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">Sin cliente (Tarea interna)</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <Input
                  name="time"
                  type="time"
                  label="Hora (Opcional)"
                  defaultValue={data?.time || ""}
                />

                <select
                  name="manager"
                  required
                  defaultValue={data?.contextId || ""}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">Selecciona Manager...</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>

                <textarea
                  name="notes"
                  placeholder="Notas, copies, ideas..."
                  defaultValue={data?.notes}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-500 dark:placeholder:text-slate-500 h-24 text-sm"
                ></textarea>
              </>
            )}

            {type === "editingTask" && (
              <>
                <Input
                  name="title"
                  placeholder="Título del Video/Diseño"
                  defaultValue={data?.title}
                  required
                  autoFocus
                />

                <select
                  name="clientId"
                  defaultValue={data?.clientId || ""}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">Sin cliente (Tarea interna)</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  name="priority"
                  required
                  defaultValue={data?.priority || "normal"}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-700 dark:text-slate-200"
                >
                  <option
                    value="normal"
                    className="text-amber-600 dark:text-amber-400"
                  >
                    Prioridad normal
                  </option>
                  <option
                    value="urgente"
                    className="text-red-600 dark:text-red-400"
                  >
                    Urgente
                  </option>
                  <option
                    value="recurrente"
                    className="text-emerald-600 dark:text-emerald-400"
                  >
                    Recurrente
                  </option>
                </select>

                <select
                  name="hierarchy"
                  required
                  defaultValue={
                    data?.hierarchy || getEditingHierarchyId(data || {})
                  }
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-700 dark:text-slate-200"
                >
                  {EDITING_HIERARCHY_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  name="status"
                  required
                  defaultValue={normalizeEditingWorkflowStatus(
                    data?.status || "editar",
                  )}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-700 dark:text-slate-200"
                >
                  {EDITING_STATUS_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  name="editor"
                  required
                  defaultValue={data?.contextId || ""}
                  className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">Selecciona Editor...</option>
                  {editors.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>

                <textarea
                  name="notes"
                  placeholder="Notas, links a drive..."
                  defaultValue={data?.notes}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-500 dark:placeholder:text-slate-500 h-24 text-sm"
                ></textarea>
              </>
            )}

            {type === "managementTask" && (
              <>
                <Input
                  name="title"
                  placeholder="Titulo de la gestion"
                  defaultValue={data?.title}
                  required
                  autoFocus
                />

                <Input
                  name="date"
                  type="date"
                  label="Fecha limite *"
                  defaultValue={data?.date || getHondurasTodayStr()}
                  required
                />

                <select
                  name="clientId"
                  defaultValue={data?.clientId || ""}
                  className={`${selectClassName} font-bold`}
                >
                  <option value="">Sin cliente asociado</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <Input
                  name="time"
                  type="time"
                  label="Hora limite *"
                  defaultValue={data?.time || ""}
                  required
                />

                <select
                  name="member"
                  required
                  defaultValue={data?.contextId || ""}
                  className={selectClassName}
                >
                  <option value="">
                    {managementUsers.length > 0
                      ? "Selecciona integrante..."
                      : "Cargando integrantes..."}
                  </option>
                  {managementUsers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                      {member.email ? ` (${member.email})` : ""}
                    </option>
                  ))}
                </select>

                <select
                  name="category"
                  defaultValue={data?.category || "seguimiento"}
                  className={`${selectClassName} font-bold`}
                >
                  <option value="seguimiento">Seguimiento</option>
                  <option value="coordinacion">Coordinacion</option>
                  <option value="aprobacion">Aprobacion</option>
                  <option value="soporte">Soporte</option>
                </select>

                <textarea
                  name="notes"
                  placeholder="Detalle de la gestion, acuerdos o proximos pasos..."
                  defaultValue={data?.notes}
                  className={textareaClassName}
                ></textarea>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 cursor-pointer">
                  <input
                    type="checkbox"
                    name="notificationsEnabled"
                    defaultChecked={data?.notificationsEnabled !== false}
                    className="w-4 h-4 accent-violet-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      Recordar por correo
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Envia avisos al asignado 8 horas antes, al vencer y cada
                      24 horas si sigue abierta.
                    </p>
                  </div>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-2">
                  El integrante asignado debe tener correo para que esta
                  automatizacion funcione.
                </p>
              </>
            )}

            {type === "user" && (
              <>
                <PhotoUploader defaultValue={data?.photo} />
                <Input
                  name="name"
                  placeholder="Nombre completo"
                  defaultValue={data?.name}
                  required
                  autoFocus
                />
                <Input
                  name="profession"
                  placeholder="Profesión / Cargo"
                  defaultValue={data?.profession}
                />
                <Input
                  name="email"
                  type="email"
                  placeholder="Correo autorizado"
                  defaultValue={data?.email}
                  required
                />

                <select
                  name="role"
                  defaultValue={data?.role || "viewer"}
                  className={`${selectClassName} font-bold`}
                >
                  {Object.entries(ROLE_DEFINITIONS).map(
                    ([roleId, roleMeta]) => (
                      <option key={roleId} value={roleId}>
                        {roleMeta.label}
                      </option>
                    ),
                  )}
                </select>

                <select
                  name="isActive"
                  defaultValue={data?.isActive === false ? "false" : "true"}
                  className={`${selectClassName} font-bold`}
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </>
            )}

            <Button type="submit" full color={submitColor}>
              {isEdit ? "Guardar Cambios" : "Crear"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

const DeleteConfirmModal = ({ config, onClose, onConfirm }) => {
  const dialogRef = useDialogA11y(config.isOpen, onClose);
  const dialogTitleId = useId();
  return (
    <div
      className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        tabIndex={-1}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
          <Icon name="AlertTriangle" size={32} />
        </div>
        <h3
          id={dialogTitleId}
          className="text-lg font-black text-slate-800 dark:text-white mb-2"
        >
          ¿Eliminar {config.title}?
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          Esta acción es permanente y no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 shadow-lg shadow-red-500/30 transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

const Toast = ({ message, type }) => (
  <div
    role={type === "error" ? "alert" : "status"}
    className={`pointer-events-auto px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 fade-in ${type === "error" ? "bg-red-600 text-white" : "bg-slate-800 dark:bg-white text-white dark:text-slate-900"}`}
  >
    <Icon
      name={type === "success" ? "CheckCircle2" : "AlertTriangle"}
      size={20}
      className={type === "success" ? "text-green-400" : ""}
    />
    <span className="font-bold text-sm">{message}</span>
  </div>
);

const ReportStatCard = ({ label, value, color, icon, sub }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <span className="text-xs font-black uppercase tracking-widest text-slate-500">
        {label}
      </span>
      <div
        className={`w-8 h-8 rounded-xl bg-${color}-50 dark:bg-${color}-500/20 flex items-center justify-center`}
      >
        <Icon name={icon} size={16} className={`text-${color}-500`} />
      </div>
    </div>
    <p
      className={`text-3xl font-black text-${color}-600 dark:text-${color}-400`}
    >
      {value}
    </p>
    {sub && <p className="text-xs text-slate-500">{sub}</p>}
  </div>
);

const ReportsView = ({
  accountTasks,
  editingTasks,
  managementTasks,
  clients,
  managers,
  editors,
  users = [],
}) => {
  const todayStr = getHondurasTodayStr();
  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate, setToDate] = useState(todayStr);
  const [activeTab, setActiveTab] = useState("content");
  const hasAutoExpandedRangeRef = useRef(false);

  const inRange = (dateStr) => {
    if (!dateStr) return false;
    return (
      compareDateOnlyStrings(dateStr, fromDate) >= 0 &&
      compareDateOnlyStrings(dateStr, toDate) <= 0
    );
  };

  const filteredAccountTasks = accountTasks.filter((t) => inRange(t.date));
  const filteredEditingTasks = editingTasks.filter((t) => inRange(t.date));
  const filteredManagementTasks = managementTasks.filter((t) =>
    inRange(t.date),
  );

  useEffect(() => {
    if (hasAutoExpandedRangeRef.current) return;
    const allTaskDates = [...accountTasks, ...editingTasks, ...managementTasks]
      .map((task) => normalizeDateOnlyString(task.date))
      .filter(Boolean)
      .sort();
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
    users
      .filter((item) => item.linkedManagerId)
      .map((item) => [item.linkedManagerId, item]),
  );
  const userByEditorId = new Map(
    users
      .filter((item) => item.linkedEditorId)
      .map((item) => [item.linkedEditorId, item]),
  );
  const performancePeopleByKey = new Map();
  const roleLabelByKey = {
    super_admin: "Admin",
    operations: "Operaciones",
    management: "Gestion",
    manager: "Manager",
    editor: "Editor",
    viewer: "Viewer",
  };
  const addPerformancePerson = (key, data = {}) => {
    if (!key) return null;
    const current = performancePeopleByKey.get(key) || {
      id: key,
      name: "",
      email: "",
      roles: [],
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
      editorId: current.editorId || data.editorId || "",
    };
    performancePeopleByKey.set(key, nextPerson);
    return nextPerson;
  };
  users.forEach((item) =>
    addPerformancePerson(item.id, {
      name: item.name,
      email: item.email,
      roleLabel: roleLabelByKey[item.role] || item.role || "Usuario",
      managerId: item.linkedManagerId || "",
      editorId: item.linkedEditorId || "",
    }),
  );
  managers.forEach((item) => {
    const linkedUser =
      userByManagerId.get(item.id) ||
      (item.userId ? userById.get(item.userId) : null);
    addPerformancePerson(linkedUser?.id || item.userId || item.id, {
      name: item.name || linkedUser?.name,
      email: item.email || linkedUser?.email,
      roleLabel: "Manager",
      managerId: item.id,
    });
  });
  editors.forEach((item) => {
    const linkedUser =
      userByEditorId.get(item.id) ||
      (item.userId ? userById.get(item.userId) : null);
    addPerformancePerson(linkedUser?.id || item.userId || item.id, {
      name: item.name || linkedUser?.name,
      email: item.email || linkedUser?.email,
      roleLabel: "Editor",
      editorId: item.id,
    });
  });
  const resolveManagerPerformanceKey = (managerId = "", directUserId = "") => {
    const manager =
      managerById.get(managerId) ||
      (directUserId
        ? managers.find((item) => item.userId === directUserId)
        : null);
    const linkedUser = manager
      ? userByManagerId.get(manager.id) ||
        (manager.userId ? userById.get(manager.userId) : null)
      : null;
    const directUser = directUserId ? userById.get(directUserId) : null;
    const key =
      directUser?.id ||
      directUserId ||
      linkedUser?.id ||
      manager?.userId ||
      manager?.id ||
      managerId;
    addPerformancePerson(key, {
      name: manager?.name || directUser?.name || linkedUser?.name,
      email: manager?.email || directUser?.email || linkedUser?.email,
      roleLabel: "Manager",
      managerId: manager?.id || managerId,
    });
    return key;
  };
  const resolveEditorPerformanceKey = (editorId = "", directUserId = "") => {
    const editor =
      editorById.get(editorId) ||
      (directUserId
        ? editors.find((item) => item.userId === directUserId)
        : null);
    const linkedUser = editor
      ? userByEditorId.get(editor.id) ||
        (editor.userId ? userById.get(editor.userId) : null)
      : null;
    const directUser = directUserId ? userById.get(directUserId) : null;
    const key =
      directUser?.id ||
      directUserId ||
      linkedUser?.id ||
      editor?.userId ||
      editor?.id ||
      editorId;
    addPerformancePerson(key, {
      name: editor?.name || directUser?.name || linkedUser?.name,
      email: editor?.email || directUser?.email || linkedUser?.email,
      roleLabel: "Editor",
      editorId: editor?.id || editorId,
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
      editorId: record?.linkedEditorId || "",
    });
    return key;
  };
  const getTaskAssigneeKeys = (task, type) => {
    const storedAssignees =
      type === "editing" &&
      isEditingDelivered(task) &&
      Array.isArray(task.editorAssigneesAtCompletion)
        ? task.editorAssigneesAtCompletion
        : task.assignees;
    const explicitAssignees = Array.isArray(storedAssignees)
      ? storedAssignees.filter(Boolean)
      : [];
    const keys = new Set();
    if (type === "account")
      explicitAssignees.forEach((id) =>
        keys.add(resolveManagerPerformanceKey(id, "")),
      );
    if (type === "editing")
      explicitAssignees.forEach((id) =>
        keys.add(resolveEditorPerformanceKey(id, "")),
      );
    if (type === "management")
      explicitAssignees.forEach((id) =>
        keys.add(resolveManagementPerformanceKey(id)),
      );
    if (keys.size === 0 && type === "account")
      keys.add(
        resolveManagerPerformanceKey(task.contextId, task.assigneeUserId),
      );
    if (keys.size === 0 && type === "editing")
      keys.add(
        resolveEditorPerformanceKey(
          task.editorOwnerAtCompletionId || task.contextId,
          task.editorAssigneeUserAtCompletionId || task.assigneeUserId,
        ),
      );
    if (keys.size === 0 && type === "management")
      keys.add(
        resolveManagementPerformanceKey(task.assigneeUserId || task.contextId),
      );
    return [...keys].filter(Boolean);
  };
  const dailyPerformanceByKey = new Map();
  const addDailyPerformanceTask = (task, type) => {
    const date = normalizeDateOnlyString(
      type === "editing" && isEditingDelivered(task)
        ? task.editorDueDateAtCompletion || task.date
        : task.date,
    );
    if (!date) return;
    const areaKey =
      type === "account"
        ? "account"
        : type === "editing"
          ? "editing"
          : "management";
    const isDone =
      type === "account"
        ? task.status === "publicado"
        : type === "editing"
          ? isEditingDelivered(task)
          : task.status === "cerrado";
    getTaskAssigneeKeys(task, type).forEach((personKey) => {
      const person =
        performancePeopleByKey.get(personKey) ||
        addPerformancePerson(personKey, {});
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
        areas: { account: 0, editing: 0, management: 0 },
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
  filteredAccountTasks.forEach((task) =>
    addDailyPerformanceTask(task, "account"),
  );
  filteredEditingTasks.forEach((task) =>
    addDailyPerformanceTask(task, "editing"),
  );
  filteredManagementTasks.forEach((task) =>
    addDailyPerformanceTask(task, "management"),
  );
  const dailyPerformanceStats = [...dailyPerformanceByKey.values()].sort(
    (left, right) =>
      compareDateOnlyStrings(right.date, left.date) ||
      right.total - left.total ||
      left.name.localeCompare(right.name),
  );
  const dailyPerformanceTotals = dailyPerformanceStats.reduce(
    (acc, row) => ({
      total: acc.total + row.total,
      done: acc.done + row.done,
      pending: acc.pending + row.pending,
    }),
    { total: 0, done: 0, pending: 0 },
  );
  const dailyUserCount = new Set(dailyPerformanceStats.map((row) => row.userId))
    .size;
  const dailyDateCount = new Set(dailyPerformanceStats.map((row) => row.date))
    .size;

  const accountPublished = filteredAccountTasks.filter(
    (t) => t.status === "publicado",
  ).length;
  const editingPublished = filteredEditingTasks.filter(
    (t) => t.status === "publicado",
  ).length;
  const totalContentPieces =
    filteredAccountTasks.length + filteredEditingTasks.length;
  const totalPublished = accountPublished + editingPublished;

  const managerStats = managers
    .map((m) => {
      const mTasks = filteredAccountTasks.filter((t) => t.contextId === m.id);
      return {
        ...m,
        total: mTasks.length,
        published: mTasks.filter((t) => t.status === "publicado").length,
        approved: mTasks.filter((t) => t.status === "aprobado_internamente")
          .length,
        inProgress: mTasks.filter(
          (t) => !["publicado", "aprobado_internamente"].includes(t.status),
        ).length,
      };
    })
    .filter((m) => m.total > 0)
    .sort((a, b) => b.total - a.total);

  const editorStats = editors
    .map((e) => {
      const eTasks = filteredEditingTasks.filter((t) => t.contextId === e.id);
      return {
        ...e,
        total: eTasks.length,
        published: eTasks.filter((t) => t.status === "publicado").length,
        approved: eTasks.filter((t) => t.status === "aprobado").length,
        inProgress: eTasks.filter(
          (t) => !["publicado", "aprobado"].includes(t.status),
        ).length,
      };
    })
    .filter((e) => e.total > 0)
    .sort((a, b) => b.total - a.total);

  const tabs = [
    { id: "content", label: "Piezas de Contenido" },
    { id: "daily", label: "Diario por Usuario" },
    { id: "managers", label: "Por Manager" },
    { id: "editors", label: "Por Editor" },
    { id: "management", label: "Gestión" },
  ];

  const rowStyle = (i) =>
    i % 2 !== 0 ? "bg-slate-50/50 dark:bg-slate-950/30" : "";

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">
          Reportes
        </h2>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5">
            <span className="text-xs font-black text-slate-500 uppercase">
              Desde
            </span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-transparent outline-none"
            />
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5">
            <span className="text-xs font-black text-slate-500 uppercase">
              Hasta
            </span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-transparent outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ReportStatCard
          label="Total Piezas"
          value={totalContentPieces}
          color="purple"
          icon="BarChart3"
          sub="accounts + edición"
        />
        <ReportStatCard
          label="Publicadas"
          value={totalPublished}
          color="emerald"
          icon="CheckCircle2"
          sub={`${Math.round(totalContentPieces > 0 ? (totalPublished / totalContentPieces) * 100 : 0)}% del total`}
        />
        <ReportStatCard
          label="Sala Accounts"
          value={filteredAccountTasks.length}
          color="indigo"
          icon="LayoutList"
          sub={`${accountPublished} publicadas`}
        />
        <ReportStatCard
          label="Sala Edición"
          value={filteredEditingTasks.length}
          color="amber"
          icon="Video"
          sub={`${editingPublished} publicadas`}
        />
      </div>

      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? "border-purple-500 text-purple-600 dark:text-purple-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "content" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-black text-slate-800 dark:text-white mb-5 flex items-center gap-2">
              <Icon name="LayoutList" size={18} className="text-indigo-500" />{" "}
              Sala de Accounts
            </h3>
            <div className="space-y-3">
              {[
                { label: "Por Diseñar", status: "por_disenar", color: "slate" },
                {
                  label: "Aprobación Interna",
                  status: "aprobacion_interna",
                  color: "blue",
                },
                {
                  label: "Aprobado Internamente",
                  status: "aprobado_internamente",
                  color: "emerald",
                },
                { label: "Publicado", status: "publicado", color: "indigo" },
              ].map((row) => {
                const count = filteredAccountTasks.filter(
                  (t) => t.status === row.status,
                ).length;
                const pct =
                  filteredAccountTasks.length > 0
                    ? Math.round((count / filteredAccountTasks.length) * 100)
                    : 0;
                return (
                  <div key={row.status}>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full bg-${row.color}-500 shrink-0`}
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-300 flex-1">
                        {row.label}
                      </span>
                      <span className="font-black text-slate-800 dark:text-white">
                        {count}
                      </span>
                      <span className="text-xs text-slate-500 w-8 text-right">
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-${row.color}-500 rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <span className="text-sm font-bold text-slate-500">Total</span>
                <span className="font-black text-slate-800 dark:text-white">
                  {filteredAccountTasks.length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-black text-slate-800 dark:text-white mb-5 flex items-center gap-2">
              <Icon name="Video" size={18} className="text-amber-500" /> Sala de
              Edición
            </h3>
            <div className="space-y-3">
              {[
                { label: "Por Editar", status: "editar", color: "slate" },
                { label: "En Edición", status: "en_edicion", color: "amber" },
                {
                  label: "Revisión Interna",
                  status: "revision_interna",
                  color: "blue",
                },
                { label: "Aprobado", status: "aprobado", color: "emerald" },
                { label: "Publicado", status: "publicado", color: "indigo" },
              ].map((row) => {
                const count = filteredEditingTasks.filter(
                  (t) => t.status === row.status,
                ).length;
                const pct =
                  filteredEditingTasks.length > 0
                    ? Math.round((count / filteredEditingTasks.length) * 100)
                    : 0;
                return (
                  <div key={row.status}>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full bg-${row.color}-500 shrink-0`}
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-300 flex-1">
                        {row.label}
                      </span>
                      <span className="font-black text-slate-800 dark:text-white">
                        {count}
                      </span>
                      <span className="text-xs text-slate-500 w-8 text-right">
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-${row.color}-500 rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <span className="text-sm font-bold text-slate-500">Total</span>
                <span className="font-black text-slate-800 dark:text-white">
                  {filteredEditingTasks.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "daily" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ReportStatCard
              label="Usuarios Activos"
              value={dailyUserCount}
              color="violet"
              icon="Users"
              sub={`${dailyDateCount} dias con actividad`}
            />
            <ReportStatCard
              label="Tareas del Rango"
              value={dailyPerformanceTotals.total}
              color="indigo"
              icon="LayoutList"
              sub="accounts + edicion + gestion"
            />
            <ReportStatCard
              label="Finalizadas"
              value={dailyPerformanceTotals.done}
              color="emerald"
              icon="CheckCircle2"
              sub={`${Math.round(dailyPerformanceTotals.total > 0 ? (dailyPerformanceTotals.done / dailyPerformanceTotals.total) * 100 : 0)}% completado`}
            />
            <ReportStatCard
              label="Pendientes"
              value={dailyPerformanceTotals.pending}
              color="amber"
              icon="Clock"
              sub="abiertas en el rango"
            />
          </div>

          <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
            En Edicion, la tarea cuenta como finalizada para el editor al pasar
            a Revision Interna. La espera de aprobacion del cliente no reduce
            su desempeno.
          </p>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {dailyPerformanceStats.length === 0 ? (
              <div className="p-16 text-center text-slate-500 font-bold">
                Sin desempeno diario en este rango de fechas
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                      <th className="text-left p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                        Fecha
                      </th>
                      <th className="text-left p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                        Usuario
                      </th>
                      <th className="text-left p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                        Rol
                      </th>
                      <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                        Areas
                      </th>
                      <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                        Total
                      </th>
                      <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                        Finalizadas
                      </th>
                      <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                        Pendientes
                      </th>
                      <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                        Desempeno
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyPerformanceStats.map((row, i) => {
                      const pct =
                        row.total > 0
                          ? Math.round((row.done / row.total) * 100)
                          : 0;
                      const performanceColor =
                        pct >= 80
                          ? "bg-emerald-500"
                          : pct >= 50
                            ? "bg-amber-500"
                            : "bg-red-500";
                      return (
                        <tr
                          key={`${row.date}-${row.userId}`}
                          className={`border-b border-slate-50 dark:border-slate-800/50 ${rowStyle(i)}`}
                        >
                          <td className="p-4 font-mono text-sm font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                            {row.date}
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-slate-800 dark:text-white">
                              {row.name}
                            </p>
                            {row.email && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {row.email}
                              </p>
                            )}
                          </td>
                          <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                            {row.roles?.length
                              ? row.roles.join(" / ")
                              : "Usuario"}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {row.areas.account > 0 && (
                                <span className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-black">
                                  Account {row.areas.account}
                                </span>
                              )}
                              {row.areas.editing > 0 && (
                                <span className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-black">
                                  Edicion {row.areas.editing}
                                </span>
                              )}
                              {row.areas.management > 0 && (
                                <span className="px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[11px] font-black">
                                  Gestion {row.areas.management}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center font-black text-slate-800 dark:text-white">
                            {row.total}
                          </td>
                          <td className="p-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                            {row.done}
                          </td>
                          <td className="p-4 text-center text-slate-500 dark:text-slate-400">
                            {row.pending}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${performanceColor}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="w-10 text-right text-sm font-black text-slate-800 dark:text-white">
                                {pct}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "managers" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {managerStats.length === 0 ? (
            <div className="p-16 text-center text-slate-500 font-bold">
              Sin datos en este rango de fechas
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <th className="text-left p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                    Manager
                  </th>
                  <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                    Total
                  </th>
                  <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                    En Proceso
                  </th>
                  <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                    Aprobadas
                  </th>
                  <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                    Publicadas
                  </th>
                </tr>
              </thead>
              <tbody>
                {managerStats.map((m, i) => (
                  <tr
                    key={m.id}
                    className={`border-b border-slate-50 dark:border-slate-800/50 ${rowStyle(i)}`}
                  >
                    <td className="p-4 font-bold text-slate-800 dark:text-white">
                      {m.name}
                    </td>
                    <td className="p-4 text-center font-black text-slate-800 dark:text-white">
                      {m.total}
                    </td>
                    <td className="p-4 text-center text-slate-500 dark:text-slate-400">
                      {m.inProgress}
                    </td>
                    <td className="p-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {m.approved}
                    </td>
                    <td className="p-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                      {m.published}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "editors" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {editorStats.length === 0 ? (
            <div className="p-16 text-center text-slate-500 font-bold">
              Sin datos en este rango de fechas
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <th className="text-left p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                    Editor
                  </th>
                  <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                    Total
                  </th>
                  <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                    En Proceso
                  </th>
                  <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                    Aprobadas
                  </th>
                  <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">
                    Publicadas
                  </th>
                </tr>
              </thead>
              <tbody>
                {editorStats.map((e, i) => (
                  <tr
                    key={e.id}
                    className={`border-b border-slate-50 dark:border-slate-800/50 ${rowStyle(i)}`}
                  >
                    <td className="p-4 font-bold text-slate-800 dark:text-white">
                      {e.name}
                    </td>
                    <td className="p-4 text-center font-black text-slate-800 dark:text-white">
                      {e.total}
                    </td>
                    <td className="p-4 text-center text-slate-500 dark:text-slate-400">
                      {e.inProgress}
                    </td>
                    <td className="p-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {e.approved}
                    </td>
                    <td className="p-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                      {e.published}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "management" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-black text-slate-800 dark:text-white mb-5 flex items-center gap-2">
              <Icon name="ShieldCheck" size={18} className="text-violet-500" />{" "}
              Sala de Gestión
            </h3>
            <div className="space-y-3">
              {[
                { label: "Pendiente", status: "pendiente", color: "slate" },
                { label: "En Proceso", status: "en_proceso", color: "violet" },
                { label: "En Espera", status: "en_espera", color: "amber" },
                { label: "Cerrado", status: "cerrado", color: "emerald" },
              ].map((row) => {
                const count = filteredManagementTasks.filter(
                  (t) => t.status === row.status,
                ).length;
                const pct =
                  filteredManagementTasks.length > 0
                    ? Math.round((count / filteredManagementTasks.length) * 100)
                    : 0;
                return (
                  <div key={row.status}>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full bg-${row.color}-500 shrink-0`}
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-300 flex-1">
                        {row.label}
                      </span>
                      <span className="font-black text-slate-800 dark:text-white">
                        {count}
                      </span>
                      <span className="text-xs text-slate-500 w-8 text-right">
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-${row.color}-500 rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <span className="text-sm font-bold text-slate-500">Total</span>
                <span className="font-black text-slate-800 dark:text-white">
                  {filteredManagementTasks.length}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4">
            <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Icon name="Flame" size={18} className="text-orange-500" />{" "}
              Resumen
            </h3>
            <ReportStatCard
              label="Tareas Abiertas"
              value={
                filteredManagementTasks.filter((t) => t.status !== "cerrado")
                  .length
              }
              color="violet"
              icon="Circle"
            />
            <ReportStatCard
              label="Tareas Cerradas"
              value={
                filteredManagementTasks.filter((t) => t.status === "cerrado")
                  .length
              }
              color="emerald"
              icon="CheckCircle2"
            />
          </div>
        </div>
      )}
    </div>
  );
};

const PerformanceView = ({ editingTasks = [], editors = [], users = [] }) => {
  const todayStr = getHondurasTodayStr();
  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate, setToDate] = useState(todayStr);
  const [selectedEditorId, setSelectedEditorId] = useState("");

  const inRange = (dateStr) => {
    if (!dateStr) return false;
    return (
      compareDateOnlyStrings(dateStr, fromDate) >= 0 &&
      compareDateOnlyStrings(dateStr, toDate) <= 0
    );
  };

  const filteredEditingTasks = editingTasks.filter((task) => {
    if (!inRange(task.date)) return false;
    if (selectedEditorId && task.contextId !== selectedEditorId) return false;
    return true;
  });
  const userById = new Map(users.map((item) => [item.id, item]));
  const userByEditorId = new Map(
    users
      .filter((item) => item.linkedEditorId)
      .map((item) => [item.linkedEditorId, item]),
  );
  const getEditorLoginRecency = (editor) => {
    const editorUser =
      userByEditorId.get(editor.id) ||
      (editor.userId ? userById.get(editor.userId) : null);
    const lastSeenAt = editorUser?.lastSeenAt || "";
    const daysSinceLogin = lastSeenAt
      ? Math.max(0, getDateOnlyDiffDays(todayStr, lastSeenAt))
      : null;
    const loginScore = daysSinceLogin === null
      ? 0
      : Math.max(0, 100 - Math.min(daysSinceLogin, 30) * 2);
    return {
      lastSeenAt,
      daysSinceLogin,
      loginScore,
    };
  };
  const editorStats = editors
    .map((editor) => {
      const editorTasks = filteredEditingTasks.filter(
        (task) => task.contextId === editor.id,
      );
      const delivered = editorTasks.filter(isEditingDelivered).length;
      const approved = editorTasks.filter(
        (task) => normalizeEditingWorkflowStatus(task.status) === "aprobado",
      ).length;
      const published = editorTasks.filter(
        (task) => task.status === "publicado",
      ).length;
      const inRevision = editorTasks.filter(
        (task) => normalizeEditingWorkflowStatus(task.status) === "revision_interna",
      ).length;
      const inProgress = editorTasks.filter(isEditingActionable).length;
      const performance = editorTasks.length
        ? Math.round((delivered / editorTasks.length) * 100)
        : 0;
      const loginRecency = getEditorLoginRecency(editor);
      const weightedPerformance = editorTasks.length
        ? Math.round(
            performance * 0.75 + loginRecency.loginScore * 0.25,
          )
        : 0;
      return {
        ...editor,
        total: editorTasks.length,
        delivered,
        approved,
        published,
        inRevision,
        inProgress,
        performance,
        weightedPerformance,
        lastSeenAt: loginRecency.lastSeenAt,
        daysSinceLogin: loginRecency.daysSinceLogin,
      };
    })
    .filter((editor) => editor.total > 0)
    .sort(
      (left, right) =>
        right.weightedPerformance - left.weightedPerformance ||
        right.performance - left.performance ||
        right.total - left.total ||
        String(left.name || "").localeCompare(String(right.name || "")),
    );

  const totalTasks = filteredEditingTasks.length;
  const deliveredTasks = filteredEditingTasks.filter(isEditingDelivered).length;
  const publishedTasks = filteredEditingTasks.filter(
    (task) => task.status === "publicado",
  ).length;
  const averagePerformance = editorStats.length
    ? Math.round(
        editorStats.reduce((sum, editor) => sum + editor.performance, 0) /
          editorStats.length,
      )
    : 0;
  const editorsWithLogin = editorStats.filter(
    (editor) => editor.daysSinceLogin !== null,
  );
  const averageLoginScore = editorsWithLogin.length
    ? Math.round(
        editorsWithLogin.reduce((sum, editor) => sum + editor.loginScore, 0) /
          editorsWithLogin.length,
      )
    : 0;
  const averageDaysSinceLogin = editorsWithLogin.length
    ? Math.round(
        editorsWithLogin.reduce(
          (sum, editor) => sum + editor.daysSinceLogin,
          0,
        ) / editorsWithLogin.length,
      )
    : null;

  const rowStyle = (i) =>
    i % 2 !== 0 ? "bg-slate-50/50 dark:bg-slate-950/30" : "";

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="eyebrow">Rendimiento</p>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">
            Rendimiento de Editores
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Un resumen de la capacidad de entrega y el avance de edición dentro del rango de fechas seleccionado.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <select
              value={selectedEditorId}
              onChange={(e) => setSelectedEditorId(e.target.value)}
              className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none"
            >
              <option value="">Todos los editores</option>
              {editors.map((editor) => (
                <option key={editor.id} value={editor.id}>
                  {editor.name}
                </option>
              ))}
            </select>
            {selectedEditorId && (
              <button
                type="button"
                onClick={() => setSelectedEditorId("")}
                className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5">
            <span className="text-xs font-black text-slate-500 uppercase">Desde</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-transparent outline-none"
            />
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5">
            <span className="text-xs font-black text-slate-500 uppercase">Hasta</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-transparent outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ReportStatCard
          label="Tareas de Edición"
          value={totalTasks}
          color="amber"
          icon="Video"
          sub="en el rango"
        />
        <ReportStatCard
          label="Entregadas"
          value={deliveredTasks}
          color="emerald"
          icon="CheckCircle2"
          sub="revisión interna o final"
        />
        <ReportStatCard
          label="Publicadas"
          value={publishedTasks}
          color="indigo"
          icon="Sparkles"
          sub="finalizadas en el rango"
        />
        <ReportStatCard
          label="Rendimiento combinado"
          value={`${averagePerformance}%`}
          color="purple"
          icon="BarChart3"
          sub={`Incluye frecuencia de login (${averageLoginScore}% promedio)`}
        />
      </div>

      <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        Se considera entregada cuando la tarea alcanza Revisión Interna o cualquier estado posterior. Esto mide la capacidad de los editores para avanzar las piezas dentro del flujo.
      </p>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {editorStats.length === 0 ? (
          <div className="p-16 text-center text-slate-500 font-bold">
            Sin datos de rendimiento para este rango de fechas
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <th className="text-left p-4 text-xs font-black uppercase tracking-widest text-slate-500">Editor</th>
                  <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">Total</th>
                  <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">En Progreso</th>
                  <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">En Revisión</th>
                  <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">Aprobadas</th>
                  <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">Publicadas</th>
                  <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">Último login</th>
                  <th className="text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500">Rendimiento</th>
                </tr>
              </thead>
              <tbody>
                {editorStats.map((editor, index) => (
                  <tr
                    key={editor.id}
                    className={`border-b border-slate-50 dark:border-slate-800/50 ${rowStyle(index)}`}
                  >
                    <td className="p-4 font-bold text-slate-800 dark:text-white">{editor.name}</td>
                    <td className="p-4 text-center font-black text-slate-800 dark:text-white">{editor.total}</td>
                    <td className="p-4 text-center text-slate-500 dark:text-slate-400">{editor.inProgress}</td>
                    <td className="p-4 text-center text-slate-500 dark:text-slate-400">{editor.inRevision}</td>
                    <td className="p-4 text-center font-bold text-emerald-600 dark:text-emerald-400">{editor.approved}</td>
                    <td className="p-4 text-center font-bold text-indigo-600 dark:text-indigo-400">{editor.published}</td>
                    <td className="p-4 text-center text-slate-500 dark:text-slate-400">
                      {editor.lastSeenAt ? (
                        <span className="block text-sm font-bold text-slate-800 dark:text-white">
                          {normalizeDateOnlyString(editor.lastSeenAt)}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">Sin registro</span>
                      )}
                      {editor.daysSinceLogin !== null && (
                        <span className="block text-xs text-slate-500 dark:text-slate-400">
                          {editor.daysSinceLogin} días
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              editor.weightedPerformance >= 80
                                ? "bg-emerald-500"
                                : editor.weightedPerformance >= 50
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${editor.weightedPerformance}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-sm font-black text-slate-800 dark:text-white">
                          {editor.weightedPerformance}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);
