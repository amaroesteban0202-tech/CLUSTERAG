// src/app/main.jsx
import React, { useState, useEffect, useRef, useId } from "react";
import { createRoot } from "react-dom/client";
import { App as CapacitorApp } from "@capacitor/app";
import {
  LayoutDashboard,
  Users,
  Calendar as CalendarIcon,
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
  PauseCircle
} from "lucide-react";
import { signInAnonymously, onAuthStateChanged, signInWithCustomToken, GoogleAuthProvider, isSignInWithEmailLink, sendSignInLinkToEmail, signInWithEmailLink, signInWithPopup, completeGoogleRedirectIfNeeded, signOut as firebaseSignOut } from "firebase/auth";
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit, writeBatch, setDoc, getDocs } from "firebase/firestore";
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
import { compareDateOnlyStrings, getDateOnlyDiffDays, getHondurasTodayStr, isDateBeforeDateString, normalizeDateOnlyString, resolveStoredTaskRoomDate } from "/src/app/utils/date.js";
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
  PauseCircle
};
var Icon = ({ name, size = 18, className = "", ...props }) => {
  const LucideIcon = IconsMap[name];
  const { "aria-hidden": ariaHidden = true, focusable = false, ...iconProps } = props;
  return LucideIcon ? /* @__PURE__ */ React.createElement(LucideIcon, { size, className, "aria-hidden": ariaHidden, focusable, ...iconProps }) : null;
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
      const focusable = Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR)).filter((element) => element.offsetParent !== null || element === document.activeElement);
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
  return /* @__PURE__ */ React.createElement("div", { className: `bg-purple-600 flex items-center justify-center text-white font-black rounded-lg ${className}` }, "C");
};
var GOOGLE_PROVIDER = auth ? new GoogleAuthProvider() : null;
if (GOOGLE_PROVIDER) GOOGLE_PROVIDER.setCustomParameters({ prompt: "select_account" });
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
var RETRYABLE_FIRESTORE_ERROR_CODES = /* @__PURE__ */ new Set(["aborted", "cancelled", "data-loss", "deadline-exceeded", "failed-precondition", "internal", "resource-exhausted", "unavailable"]);
var MANAGEMENT_DIRECTORY = DEFAULT_MANAGEMENT_TEAM.map((member) => ({
  ...member,
  directoryKey: normalizeNameKey(member.name)
}));
var readPendingTaskStatusUpdates = () => {
  if (typeof window === "undefined") return [];
  try {
    const rawValue = window.localStorage.getItem(PENDING_TASK_STATUS_UPDATES_KEY);
    if (!rawValue) return [];
    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) return [];
    return parsedValue.filter((item) => item?.collectionName && item?.taskId && item?.status);
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
  window.localStorage.setItem(PENDING_TASK_STATUS_UPDATES_KEY, JSON.stringify(items));
};
var queuePendingTaskStatusUpdate = ({ collectionName, taskId, status, updatedAt = nowIso(), mutationId = `${taskId}:${updatedAt}:${status}` }) => {
  const nextItems = readPendingTaskStatusUpdates().filter((item) => !(item.collectionName === collectionName && item.taskId === taskId)).concat({ collectionName, taskId, status, updatedAt, mutationId, queuedAt: nowIso() });
  writePendingTaskStatusUpdates(nextItems);
  return mutationId;
};
var clearPendingTaskStatusUpdate = ({ collectionName, taskId, mutationId = "" }) => {
  const nextItems = readPendingTaskStatusUpdates().filter((item) => !(item.collectionName === collectionName && item.taskId === taskId && (!mutationId || item.mutationId === mutationId)));
  writePendingTaskStatusUpdates(nextItems);
};
var getFirestoreErrorCode = (error) => String(error?.code || "").replace(/^firestore\//, "");
var shouldRetryTaskStatusUpdate = (error) => {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const code = getFirestoreErrorCode(error);
  return !code || RETRYABLE_FIRESTORE_ERROR_CODES.has(code);
};
var getManagementDirectoryKey = (value = "") => {
  const sourceName = typeof value === "string" ? value : value?.name || "";
  const normalized = normalizeNameKey(sourceName);
  if (!normalized) return "";
  const exactMatch = MANAGEMENT_DIRECTORY.find((member) => normalized === member.directoryKey);
  if (exactMatch) return exactMatch.directoryKey;
  const aliasMatch = MANAGEMENT_DIRECTORY.find((member) => normalized.startsWith(`${member.directoryKey} `));
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
  if (record.emailVerified === true || record.emailVerification?.status === "verified") return 5;
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
  if (!normalizeEmail(safeRecord.email)) return { label: "Sin correo", color: "slate", isVerified: false };
  if (safeRecord.emailVerified === true || safeRecord.emailVerification?.status === "verified") return { label: "Verificado", color: "emerald", isVerified: true };
  if (safeRecord.emailVerification?.status === "error") return { label: "Error de envio", color: "red", isVerified: false };
  if (safeRecord.emailVerification?.status === "sent") return { label: "Verificacion enviada", color: "amber", isVerified: false };
  if (safeRecord.emailVerification?.status === "pending") return { label: "Pendiente verificar", color: "amber", isVerified: false };
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
  if (code === "auth/unauthorized-domain") return "Google bloqueado: agrega 127.0.0.1 en Firebase Authorized domains o entra por http://localhost:5000.";
  if (code === "auth/operation-not-allowed") return "Google Sign-In no esta habilitado en Firebase Authentication.";
  if (code === "auth/popup-blocked") return "El navegador bloqueo el popup de Google.";
  if (code === "auth/popup-closed-by-user") return "El popup de Google se cerro antes de completar el login.";
  if (code === "auth/cancelled-popup-request") return "Ya habia un popup de autenticacion abierto.";
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
  ["email_link", "mode", "oobCode", "apiKey", "lang", "continueUrl"].forEach((param) => nextUrl.searchParams.delete(param));
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
var isTaskAssignedToProfile = (task, profile, contextIds = []) => {
  const profileId = profile?.id;
  if (!profileId) return false;
  if (task?.assigneeUserId && task.assigneeUserId === profileId) return true;
  return contextIds.filter(Boolean).includes(task?.contextId);
};
var TASK_ROOM_STATE_VERSION = 2;
var getTaskRoomDefaults = ({ preferMine = false } = {}) => ({
  currentDate: getHondurasTodayStr(),
  filterMode: preferMine ? "all" : "date",
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
      currentDate: resolveStoredTaskRoomDate(parsedValue.currentDate, parsedValue.savedAt, defaults.currentDate),
      filterMode: ["date", "overdue", "all", "range"].includes(parsedValue.filterMode) ? parsedValue.filterMode : defaults.filterMode,
      ownershipFilter: ["all", "mine"].includes(parsedValue.ownershipFilter) ? parsedValue.ownershipFilter : defaults.ownershipFilter,
      rangeStart: normalizeDateOnlyString(parsedValue.rangeStart) || defaults.rangeStart,
      rangeEnd: normalizeDateOnlyString(parsedValue.rangeEnd) || defaults.rangeEnd
    };
    const savedVersion = Number(parsedValue.version || 0);
    const wasPersonalized = parsedValue.personalized === true;
    const looksLikeLegacyDefault = (!wasPersonalized || savedVersion < TASK_ROOM_STATE_VERSION) && parsedState.filterMode === "date" && parsedState.ownershipFilter === "all" && compareDateOnlyStrings(parsedState.currentDate, defaults.currentDate) === 0;
    if (options.preferMine && looksLikeLegacyDefault) return defaults;
    return parsedState;
  } catch (error) {
    console.warn(`No se pudo leer el estado guardado de ${storageKey}:`, error);
    return defaults;
  }
};
var useTaskRoomState = (storageKey, options = {}) => {
  const preferMine = Boolean(options.preferMine);
  const [roomState, setRoomState] = useState(() => readTaskRoomState(storageKey, { preferMine }));
  useEffect(() => {
    const nextState = readTaskRoomState(storageKey, { preferMine });
    setRoomState((current) => {
      const hasChanges = nextState.currentDate !== current.currentDate || nextState.filterMode !== current.filterMode || nextState.ownershipFilter !== current.ownershipFilter || nextState.rangeStart !== current.rangeStart || nextState.rangeEnd !== current.rangeEnd;
      return hasChanges ? nextState : current;
    });
  }, [storageKey, preferMine]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify({
      ...roomState,
      currentDate: normalizeDateOnlyString(roomState.currentDate) || getHondurasTodayStr(),
      savedAt: getHondurasTodayStr(),
      version: TASK_ROOM_STATE_VERSION,
      personalized: preferMine
    }));
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
  { id: "correccion", label: "En Correccion" },
  { id: "aprobado", label: "Aprobado" },
  { id: "publicado", label: "Publicado" }
];
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem("cluster_theme") === "dark");
  const [view, setView] = useState(() => localStorage.getItem("cluster_os_view") || "dashboard");
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
  const [appUsers, setAppUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedManager, setSelectedManager] = useState(null);
  const [selectedEditor, setSelectedEditor] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, data: null, isEdit: false });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: null, id: null, title: "" });
  const [eventAction, setEventAction] = useState({ isOpen: false, event: null, type: null });
  const [taskDetailConfig, setTaskDetailConfig] = useState({ isOpen: false, task: null, type: null });
  const [dayDetailsModal, setDayDetailsModal] = useState({ isOpen: false, date: null });
  const authEmail = normalizeEmail(user?.email);
  const authEmailMatches = authEmail ? appUsers.filter((item) => normalizeEmail(item.email) === authEmail) : [];
  const resolvedAuthProfile = authEmailMatches.length > 0 ? chooseCanonicalUserRecord(authEmailMatches) : null;
  const pendingManagementMember = authEmail ? MANAGEMENT_DIRECTORY.find((item) => normalizeEmail(item.email) === authEmail) : null;
  const pendingMatchedManager = authEmail ? managers.find((item) => normalizeEmail(item.email) === authEmail) : null;
  const pendingMatchedEditor = authEmail ? editors.find((item) => normalizeEmail(item.email) === authEmail) : null;
  const pendingPreAuthorizedEditor = authEmail && !pendingMatchedEditor ? DEFAULT_EDITORS_TEAM.find((item) => normalizeEmail(item.email) === authEmail) : null;
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
  const profileBlocked = Boolean(currentUserProfile && currentUserProfile.isActive === false);
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
  ].filter((item) => item.isActive !== false && (item.id || item.name || normalizeEmail(item.email)));
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
  }).sort((a, b) => (a.name || "").localeCompare(b.name || "", "es", { sensitivity: "base" }));
  const defaultManagementAssigneeId = currentUserProfile?.id && !["anonymous", "pending-user"].includes(currentUserProfile.id) && managementUsers.some((item) => item.id === currentUserProfile.id) ? currentUserProfile.id : "";
  const privilegedUsers = appUsers.filter((item) => item.isActive !== false && ["super_admin", "operations"].includes(item.role));
  const dataCollection = (name) => collection(db, "artifacts", appId, "public", "data", name);
  const dataDoc = (name, id) => doc(db, "artifacts", appId, "public", "data", name, id);
  const sendUserEmailLink = async ({ userId, email, userRecord = {}, reason = "manual_resend" }) => {
    if (!auth) {
      const unavailableError = new Error("Firebase Authentication no esta disponible.");
      unavailableError.friendlyMessage = "Firebase Authentication no esta disponible.";
      throw unavailableError;
    }
    const normalizedEmail = normalizeEmail(email || userRecord?.email);
    if (!userId || !normalizedEmail) {
      const invalidUserError = new Error("El usuario necesita un correo valido.");
      invalidUserError.friendlyMessage = "El usuario necesita un correo valido.";
      throw invalidUserError;
    }
    const verificationState = userRecord?.emailVerification || {};
    const requestedAt = nowIso();
    try {
      auth.languageCode = "es";
      await sendSignInLinkToEmail(auth, normalizedEmail, buildEmailLinkActionCodeSettings());
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
          const storedEmail = normalizeEmail(window.localStorage.getItem(EMAIL_LINK_STORAGE_KEY) || "");
          const emailForLink = storedEmail || normalizeEmail(window.prompt("Escribe tu correo para completar el acceso enviado por email.") || "");
          const cleanUrl = buildEmailLinkReturnUrl(window.location.href);
          if (!emailForLink) {
            if (cleanUrl) window.history.replaceState({}, document.title, cleanUrl.toString());
            showToast("Necesitas confirmar el correo para completar el acceso.", "error");
            await waitForAuthState();
            if (!auth.currentUser) await signInAnonymously(auth);
            return;
          }
          await signInWithEmailLink(auth, emailForLink, window.location.href);
          window.localStorage.removeItem(EMAIL_LINK_STORAGE_KEY);
          if (cleanUrl) window.history.replaceState({}, document.title, cleanUrl.toString());
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
            console.error("No se pudo iniciar sesion con token inicial:", tokenError);
          }
        }
        if (!auth.currentUser) await signInAnonymously(auth);
      } catch (error) {
        console.error("Error de Autenticaci\xF3n:", error);
        if (isSignInWithEmailLink(auth, window.location.href)) {
          const cleanUrl = buildEmailLinkReturnUrl(window.location.href);
          if (cleanUrl) window.history.replaceState({}, document.title, cleanUrl.toString());
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
      if (!url || !String(url).startsWith("clusteragency://auth/google")) return "";
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
        console.error("No se pudo completar el retorno nativo de Google:", error);
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
      onSnapshot(dataCollection("clients"), (snapshot) => {
        const list = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
        setClients(list);
        setSelectedClient((current) => current ? list.find((item) => item.id === current.id) || null : null);
      }, errHandler),
      onSnapshot(dataCollection("events"), (snapshot) => setEvents(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))), errHandler),
      onSnapshot(dataCollection("managers"), (snapshot) => {
        const list = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
        setManagers(list);
        setSelectedManager((current) => current ? list.find((item) => item.id === current.id) || null : null);
      }, errHandler),
      onSnapshot(dataCollection("editors"), (snapshot) => {
        const list = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
        setEditors(list);
        setSelectedEditor((current) => current ? list.find((item) => item.id === current.id) || null : null);
      }, errHandler),
      onSnapshot(dataCollection("editing"), (snapshot) => setEditingTasks(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))), errHandler),
      onSnapshot(dataCollection("account_tasks"), (snapshot) => setAccountTasks(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))), errHandler),
      onSnapshot(dataCollection("management_tasks"), (snapshot) => setManagementTasks(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))), errHandler),
      onSnapshot(dataCollection("users"), (snapshot) => {
        setAppUsers(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() })));
        setUsersLoaded(true);
      }, errHandler),
      onSnapshot(query(dataCollection("audit_logs"), orderBy("createdAt", "desc"), limit(120)), (snapshot) => setAuditLogs(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))), errHandler)
    ];
    return () => unsubs.forEach((unsubscribe) => unsubscribe());
  }, [user]);
  useEffect(() => {
    if (!db || !user || !usersLoaded || hasSeededManagementDirectory) return;
    const existingKeys = new Set(
      appUsers.map((item) => item.managementKey || getManagementDirectoryKey(item)).filter(Boolean)
    );
    const missingMembers = MANAGEMENT_DIRECTORY.filter((member) => !existingKeys.has(member.directoryKey));
    if (missingMembers.length === 0) {
      setHasSeededManagementDirectory(true);
      return;
    }
    Promise.all(
      missingMembers.map((member) => setDoc(dataDoc("users", `management_${member.directoryKey}`), {
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
      }, { merge: true }))
    ).finally(() => setHasSeededManagementDirectory(true));
  }, [db, user, usersLoaded, appUsers, hasSeededManagementDirectory]);
  useEffect(() => {
    if (!db || !user || !usersLoaded || hasRecoveredManagerDirectory) return;
    if (!userHasPermission(currentUserProfile, "manage_managers")) return;
    const existingManagerIds = new Set(managers.map((item) => item.id).filter(Boolean));
    const existingManagerByName = new Map(
      managers.filter((item) => normalizeNameKey(item.name)).map((item) => [normalizeNameKey(item.name), item])
    );
    const referencedManagers = /* @__PURE__ */ new Map();
    const addReferencedManager = ({ id = "", name = "", email = "" }) => {
      const resolvedName = String(name || "").trim();
      const resolvedEmail = normalizeEmail(email);
      const resolvedId = String(id || "").trim() || buildRecoveredManagerId(resolvedName);
      if (!resolvedId || !resolvedName) return;
      const existingByName = existingManagerByName.get(normalizeNameKey(resolvedName));
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
      if (!appUser.linkedManagerId || existingManagerIds.has(appUser.linkedManagerId)) return;
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
      const resolvedEmail = normalizeEmail(manager.email || directoryMember?.email);
      const linkedUser = (resolvedEmail ? appUsers.find((item) => normalizeEmail(item.email) === resolvedEmail) : null) || appUsers.find((item) => normalizeNameKey(item.name) === normalizeNameKey(manager.name));
      const color = ACCOUNT_COLORS[index % ACCOUNT_COLORS.length];
      batch.set(dataDoc("managers", manager.id), {
        name: manager.name,
        email: resolvedEmail,
        color,
        userId: linkedUser?.id || "",
        recovered: true,
        createdAt: stamp,
        updatedAt: stamp
      }, { merge: true });
      if (linkedUser?.id && linkedUser.linkedManagerId !== manager.id) {
        batch.update(dataDoc("users", linkedUser.id), {
          linkedManagerId: manager.id,
          updatedAt: stamp
        });
      }
      clients.filter((client) => client.managerId === manager.id || !client.managerId && normalizeNameKey(client.manager) === normalizeNameKey(manager.name)).forEach((client) => {
        batch.update(dataDoc("clients", client.id), {
          manager: manager.name,
          managerId: manager.id,
          managerUserId: linkedUser?.id || client.managerUserId || "",
          updatedAt: stamp
        });
      });
      if (linkedUser?.id) {
        accountTasks.filter((task) => task.contextId === manager.id && task.assigneeUserId !== linkedUser.id).forEach((task) => {
          batch.update(dataDoc("account_tasks", task.id), {
            assigneeUserId: linkedUser.id,
            updatedAt: stamp
          });
        });
      }
    });
    batch.commit().then(() => {
      if (!isCancelled) showToast(`Account Managers restaurados: ${missingManagers.length}`);
    }).catch((error) => {
      console.error("No se pudo restaurar el directorio de Account Managers:", error);
    }).finally(() => {
      if (!isCancelled) setHasRecoveredManagerDirectory(true);
    });
    return () => {
      isCancelled = true;
    };
  }, [db, user, usersLoaded, hasRecoveredManagerDirectory, currentUserProfile?.id, currentUserProfile?.role, managers, clients, accountTasks, appUsers]);
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
      pendingManagementBackfill.map(({ id, resolvedEmail, managementKey }) => updateDoc(dataDoc("users", id), {
        ...resolvedEmail ? { email: resolvedEmail } : {},
        ...managementKey ? { managementKey } : {},
        updatedAt: nowIso()
      }).catch(() => {
      }))
    );
  }, [db, user, usersLoaded, appUsers]);
  useEffect(() => {
    if (!db || !user || !authEmail || !usersLoaded) return;
    const existingByUid = appUsers.find((item) => item.authUid && item.authUid === user.uid);
    const existingByEmail = chooseCanonicalUserRecord(appUsers.filter((item) => normalizeEmail(item.email) === authEmail));
    const matchByName = appUsers.find((item) => !normalizeEmail(item.email) && normalizeNameKey(item.name) === normalizeNameKey(user.displayName || authEmail));
    const existing = existingByUid || existingByEmail || matchByName;
    const targetId = existing?.id || `auth_${user.uid || normalizeNameKey(authEmail).replace(/[^a-z0-9]+/g, "_")}`;
    const isForcedSuperAdmin = SUPER_ADMIN_EMAILS.includes(authEmail);
    const existingRole = existing?.role || (privilegedUsers.length === 0 ? "super_admin" : "viewer");
    const matchedManager = managers.find((item) => normalizeEmail(item.email) === authEmail) || (existing?.linkedManagerId ? managers.find((item) => item.id === existing.linkedManagerId) : null);
    const matchedEditor = editors.find((item) => normalizeEmail(item.email) === authEmail) || (existing?.linkedEditorId ? editors.find((item) => item.id === existing.linkedEditorId) : null);
    const preAuthorizedEditor = !matchedEditor ? DEFAULT_EDITORS_TEAM.find((item) => normalizeEmail(item.email) === authEmail) : null;
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
      updateDoc(dataDoc("users", existing.id), { ...basePayload, role: nextRole, updatedAt: stamp, lastSeenAt: stamp }).catch(() => {
      });
      return;
    }
    setDoc(dataDoc("users", targetId), { ...basePayload, role: nextRole, createdAt: stamp, updatedAt: stamp, lastSeenAt: stamp }, { merge: true }).catch(() => {
    });
  }, [db, user, authEmail, usersLoaded, appUsers, privilegedUsers.length, managers, editors]);
  useEffect(() => {
    if (!currentUserProfile) return;
    if (profileBlocked || !canAccessView(currentUserProfile, view)) {
      setView("dashboard");
      localStorage.setItem("cluster_os_view", "dashboard");
    }
  }, [currentUserProfile, profileBlocked, view]);
  useEffect(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined") return;
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
        assigned: (task) => isTaskAssignedToProfile(task, currentUserProfile, [currentUserProfile?.linkedManagerId])
      },
      {
        collectionType: "editingTask",
        tasks: editingTasks,
        label: "Edicion",
        view: "editions",
        defaultTime: "18:00",
        done: (task) => task.status === "aprobado" || task.status === "publicado",
        assigned: (task) => isTaskAssignedToProfile(task, currentUserProfile, [currentUserProfile?.linkedEditorId])
      },
      {
        collectionType: "managementTask",
        tasks: managementTasks,
        label: "Gestion",
        view: "management-room",
        defaultTime: "",
        done: (task) => task.status === "cerrado",
        assigned: (task) => isTaskAssignedToProfile(task, currentUserProfile, [currentUserProfile?.id])
      }
    ];
    const fireNotification = (task, config, stage, dueMs) => {
      if (Notification.permission !== "granted") return;
      const titleMap = {
        "8h": "\u23F0 Tarea proxima a vencer (8h)",
        "overdue": "\u{1F534} Tarea vencida",
        "nag": "\u{1F534} Tarea vencida hace mas de 24h"
      };
      const client = clients.find((c) => c.id === task.clientId);
      const notificationTitle = stage === "8h" ? `Tarea de ${config.label} proxima a vencer (8h)` : stage === "overdue" ? `Tarea de ${config.label} vencida` : `Tarea de ${config.label} vencida hace mas de 24h`;
      const body = [
        task.title,
        task.time ? `Hora limite: ${task.time}` : config.defaultTime ? `Hora limite: ${config.defaultTime}` : "",
        client ? `Cliente: ${client.name}` : ""
      ].filter(Boolean).join("\n");
      try {
        const notif = new Notification(notificationTitle || titleMap[stage] || `Tarea de ${config.label}`, {
          body,
          tag: `cluster-task-${config.collectionType}-${task.id}-${stage}`,
          requireInteraction: stage === "overdue" || stage === "nag"
        });
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
  }, [currentUserProfile?.id, currentUserProfile?.linkedManagerId, currentUserProfile?.linkedEditorId, profileBlocked, accountTasks, editingTasks, managementTasks, clients]);
  useEffect(() => {
    if (!db || !currentUserProfile || profileBlocked || isFlushingPendingTaskStatusesRef.current) return;
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
          if (!requiredPermission || !userHasPermission(currentUserProfile, requiredPermission)) continue;
          try {
            await updateDoc(dataDoc(item.collectionName, item.taskId), {
              status: item.status,
              updatedAt: item.updatedAt || nowIso()
            });
            clearPendingTaskStatusUpdate({ collectionName: item.collectionName, taskId: item.taskId });
          } catch (error) {
            console.error("No se pudo sincronizar el cambio de estado pendiente:", error);
            if (!shouldRetryTaskStatusUpdate(error)) {
              clearPendingTaskStatusUpdate({ collectionName: item.collectionName, taskId: item.taskId });
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
        console.error("No se pudo resincronizar la cola local de estados:", error);
      });
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [db, currentUserProfile, profileBlocked]);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3e3);
  };
  const closeModal = () => setModalConfig({ isOpen: false, type: null, data: null, isEdit: false });
  const closeDelete = () => setDeleteConfirm({ isOpen: false, type: null, id: null, title: "" });
  const auditAction = async ({ action, entityType, entityId = "", description = "", status = "success", changes = null }) => {
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
    await auditAction({ action: "permission_denied", entityType: "security", description, status: "denied", changes: { permission } });
    return false;
  };
  const runMutation = async ({ permission, action, entityType, entityId = "", description, changes = null, successMessage, errorMessage = "No se pudo completar la accion", execute, afterSuccess }) => {
    if (!await ensurePermission(permission, description)) return null;
    try {
      const result = await execute();
      await auditAction({ action, entityType, entityId: entityId || result?.id || "", description, changes });
      if (successMessage) showToast(successMessage);
      if (afterSuccess) afterSuccess(result);
      return result;
    } catch (error) {
      console.error(error);
      showToast(errorMessage, "error");
      await auditAction({ action: `${action}_failed`, entityType, entityId, description, status: "error", changes: { ...changes || {}, error: error.message } });
      return null;
    }
  };
  const runQueuedTaskStatusMutation = async ({ collectionName, task, newStatus, permission, entityType, description, changes, successMessage = "", errorMessage = "No se pudo actualizar el estado", afterSuccess }) => {
    if (!task?.id || !newStatus || !collectionName) return null;
    if (!await ensurePermission(permission, description)) return null;
    const stamp = nowIso();
    const mutationId = queuePendingTaskStatusUpdate({ collectionName, taskId: task.id, status: newStatus, updatedAt: stamp });
    try {
      await updateDoc(dataDoc(collectionName, task.id), { status: newStatus, updatedAt: stamp });
      clearPendingTaskStatusUpdate({ collectionName, taskId: task.id, mutationId });
      await auditAction({ action: "status_change", entityType, entityId: task.id, description, changes });
      if (successMessage) showToast(successMessage);
      if (afterSuccess) afterSuccess();
      return { id: task.id };
    } catch (error) {
      console.error(error);
      const shouldRetry = shouldRetryTaskStatusUpdate(error);
      if (!shouldRetry) {
        clearPendingTaskStatusUpdate({ collectionName, taskId: task.id, mutationId });
      }
      showToast(shouldRetry ? "Cambio pendiente de sincronizar. Se reintentara al recargar." : errorMessage, "error");
      await auditAction({
        action: shouldRetry ? "status_change_queued" : "status_change_failed",
        entityType,
        entityId: task.id,
        description,
        status: shouldRetry ? "queued" : "error",
        changes: { ...changes || {}, error: error.message, collectionName, queued: shouldRetry }
      });
      return null;
    }
  };
  const getPreferredUserRole = (records = []) => [...records].sort((left, right) => getUserRolePriority(right.role) - getUserRolePriority(left.role))[0]?.role || "viewer";
  const mergeEmailVerificationPayload = (records = [], mergedEmail = "", mergedVerified = false) => {
    if (!mergedEmail) return {};
    const bestRecord = [...records].sort((left, right) => getVerificationPriority(right) - getVerificationPriority(left))[0] || {};
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
    const usersList = usersSnapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
    const managersList = managersSnapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
    const editorsList = editorsSnapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
    const clientsList = clientsSnapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
    const accountTasksList = accountTasksSnapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
    const editingTasksList = editingTasksSnapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
    const managementTasksList = managementTasksSnapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
    const duplicateGroups = buildDuplicateUserGroups(usersList);
    const signature = duplicateGroups.map((group) => group.map((item) => item.id).sort().join(",")).sort().join("|");
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
      const duplicateUsers = group.filter((item) => item.id !== canonicalUser.id);
      if (duplicateUsers.length === 0) return;
      const managementMeta = group.filter((item) => item.role === "management").map((item) => getManagementDirectoryMeta(item)).find(Boolean) || null;
      const mergedEmail = group.map((item) => normalizeEmail(item.email)).find(Boolean) || "";
      const mergedVerified = mergedEmail ? group.some((item) => item.emailVerified === true || item.emailVerification?.status === "verified") : false;
      const mergedVerification = mergeEmailVerificationPayload(group, mergedEmail, mergedVerified);
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
        managersList.filter((item) => item.userId === duplicateUser.id).forEach((item) => queueUpdate("managers", item.id, { userId: canonicalUser.id, updatedAt: stamp }));
        editorsList.filter((item) => item.userId === duplicateUser.id).forEach((item) => queueUpdate("editors", item.id, { userId: canonicalUser.id, updatedAt: stamp }));
        clientsList.filter((item) => item.managerUserId === duplicateUser.id).forEach((item) => queueUpdate("clients", item.id, { managerUserId: canonicalUser.id, updatedAt: stamp }));
        accountTasksList.filter((item) => item.assigneeUserId === duplicateUser.id).forEach((item) => queueUpdate("account_tasks", item.id, { assigneeUserId: canonicalUser.id, updatedAt: stamp }));
        editingTasksList.filter((item) => item.assigneeUserId === duplicateUser.id).forEach((item) => queueUpdate("editing", item.id, { assigneeUserId: canonicalUser.id, updatedAt: stamp }));
        managementTasksList.filter((item) => item.assigneeUserId === duplicateUser.id || item.contextId === duplicateUser.id).forEach((item) => {
          const taskPatch = { updatedAt: stamp };
          if (item.assigneeUserId === duplicateUser.id) taskPatch.assigneeUserId = canonicalUser.id;
          if (item.contextId === duplicateUser.id) taskPatch.contextId = canonicalUser.id;
          queueUpdate("management_tasks", item.id, taskPatch);
        });
        queueDelete("users", duplicateUser.id);
        removedCount += 1;
      });
    });
    if (operations > 0) commits.push(batch.commit());
    await Promise.all(commits);
    if (!silent && removedCount > 0) {
      showToast(`Directorio corregido: ${removedCount} usuarios duplicados consolidados.`);
    }
    return { changed: removedCount > 0, removedCount, signature };
  };
  const syncIdentityLinks = async ({ email, userId = "", managerId = "", editorId = "", silent = true }) => {
    const normalizedEmail = normalizeEmail(email);
    if (!db || !normalizedEmail) return { changed: false, migratedAccountTasks: 0, migratedEditingTasks: 0, linkedClients: 0 };
    const linkedUser = userId ? appUsers.find((item) => item.id === userId) : appUsers.find((item) => normalizeEmail(item.email) === normalizedEmail);
    const linkedManager = managerId ? managers.find((item) => item.id === managerId) : managers.find((item) => normalizeEmail(item.email) === normalizedEmail);
    const linkedEditor = editorId ? editors.find((item) => item.id === editorId) : editors.find((item) => normalizeEmail(item.email) === normalizedEmail);
    if (!linkedUser && !linkedManager && !linkedEditor) {
      return { changed: false, migratedAccountTasks: 0, migratedEditingTasks: 0, linkedClients: 0 };
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
      if (linkedManager && linkedUser.linkedManagerId !== linkedManager.id) userPatch.linkedManagerId = linkedManager.id;
      if (linkedEditor && linkedUser.linkedEditorId !== linkedEditor.id) userPatch.linkedEditorId = linkedEditor.id;
      if (Object.keys(userPatch).length > 0) {
        queueUpdate("users", linkedUser.id, { ...userPatch, updatedAt: stamp });
        identityMutations += 1;
      }
    }
    if (linkedManager && linkedUser && linkedManager.userId !== linkedUser.id) {
      queueUpdate("managers", linkedManager.id, { userId: linkedUser.id, updatedAt: stamp });
      identityMutations += 1;
    }
    if (linkedEditor && linkedUser && linkedEditor.userId !== linkedUser.id) {
      queueUpdate("editors", linkedEditor.id, { userId: linkedUser.id, updatedAt: stamp });
      identityMutations += 1;
    }
    if (linkedManager && linkedUser) {
      clients.filter((client) => client.managerId === linkedManager.id && client.managerUserId !== linkedUser.id).forEach((client) => {
        queueUpdate("clients", client.id, { managerUserId: linkedUser.id, updatedAt: stamp });
        linkedClients += 1;
      });
      accountTasks.filter((task) => task.contextId === linkedManager.id && task.assigneeUserId !== linkedUser.id).forEach((task) => {
        queueUpdate("account_tasks", task.id, { assigneeUserId: linkedUser.id, updatedAt: stamp });
        migratedAccountTasks += 1;
      });
    }
    if (linkedEditor && linkedUser) {
      editingTasks.filter((task) => task.contextId === linkedEditor.id && task.assigneeUserId !== linkedUser.id).forEach((task) => {
        queueUpdate("editing", task.id, { assigneeUserId: linkedUser.id, updatedAt: stamp });
        migratedEditingTasks += 1;
      });
    }
    if (operations > 0) commits.push(batch.commit());
    if (commits.length === 0) {
      return { changed: false, migratedAccountTasks, migratedEditingTasks, linkedClients };
    }
    await Promise.all(commits);
    if (!silent) {
      showToast(`Vinculacion completada: ${migratedAccountTasks} tareas de account y ${migratedEditingTasks} de edicion sincronizadas.`);
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
      showToast("Activa el usuario antes de enviar el correo de acceso.", "error");
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
  const duplicateUserSignature = buildDuplicateUserGroups(appUsers).map((group) => group.map((item) => item.id).sort().join(",")).sort().join("|");
  useEffect(() => {
    if (!db || !user || !usersLoaded || !duplicateUserSignature) return;
    if (isReconcilingUsersRef.current || lastReconciledDuplicateSignatureRef.current === duplicateUserSignature) return;
    let isCancelled = false;
    isReconcilingUsersRef.current = true;
    reconcileUserDirectory().then((result) => {
      if (!isCancelled) {
        lastReconciledDuplicateSignatureRef.current = result?.signature || duplicateUserSignature;
      }
    }).catch((error) => {
      console.error("No se pudo reconciliar el directorio de usuarios:", error);
    }).finally(() => {
      isReconcilingUsersRef.current = false;
    });
    return () => {
      isCancelled = true;
    };
  }, [db, user, usersLoaded, duplicateUserSignature]);
  useEffect(() => {
    if (!db || !usersLoaded || duplicateUserSignature || hasBackfilledIdentityLinks || !userHasPermission(currentUserProfile, "manage_users")) return;
    if (isBackfillingIdentityLinksRef.current) return;
    const candidates = appUsers.filter((item) => normalizeEmail(item.email));
    if (candidates.length === 0) {
      setHasBackfilledIdentityLinks(true);
      return;
    }
    let isCancelled = false;
    isBackfillingIdentityLinksRef.current = true;
    Promise.all(candidates.map((item) => syncIdentityLinks({ email: item.email, userId: item.id, silent: true }))).finally(() => {
      isBackfillingIdentityLinksRef.current = false;
      if (!isCancelled) setHasBackfilledIdentityLinks(true);
    });
    return () => {
      isCancelled = true;
    };
  }, [db, usersLoaded, duplicateUserSignature, hasBackfilledIdentityLinks, currentUserProfile?.id, appUsers.length, managers.length, editors.length, clients.length, accountTasks.length, editingTasks.length]);
  useEffect(() => {
    if (!db || !usersLoaded || duplicateUserSignature || !currentUserProfile?.id || !authEmail) return;
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
    syncIdentityLinks({ email: authEmail, userId: currentUserProfile.id, silent: true }).catch(() => {
      lastIdentityLinkSyncSignatureRef.current = "";
    });
  }, [db, usersLoaded, duplicateUserSignature, currentUserProfile?.id, authEmail, managers.length, editors.length, clients.length, accountTasks.length, editingTasks.length]);
  const handleNavigate = (newView) => {
    if (!canAccessView(currentUserProfile, newView) || profileBlocked) {
      ensurePermission(VIEW_PERMISSIONS[newView], `Intento de acceso a ${newView}`);
      return;
    }
    setView(newView);
    localStorage.setItem("cluster_os_view", newView);
    setIsMobileMenuOpen(false);
    auditAction({ action: "navigate", entityType: "navigation", entityId: newView, description: `Abre la vista ${newView}` });
  };
  const handleEventClick = (event, type) => setEventAction({ isOpen: true, event, type });
  const triggerConfetti = () => {
    if (window.confetti) window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ["#9333ea", "#3b82f6", "#10b981", "#f59e0b"] });
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
      await sendSignInLinkToEmail(auth, normalizedEmail, buildEmailLinkActionCodeSettings());
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
      await auditAction({ action: "logout", entityType: "session", description: "Cierre de sesion" });
      await firebaseSignOut(auth);
      await signInAnonymously(auth);
      showToast("Sesion cerrada");
    } catch (error) {
      console.error(error);
      showToast("No se pudo cerrar la sesion", "error");
    }
  };
  const urgentEditions = editingTasks.filter((task) => getEditingHierarchyId(task) === "p1" && task.status !== "aprobado" && task.status !== "publicado").length;
  const pendingAccounts = accountTasks.filter((t) => t.status === "por_disenar").length;
  const pendingManagement = managementTasks.filter((task) => task.status !== "cerrado").length;
  const totalActiveAccountTasks = accountTasks.filter((t) => t.status !== "publicado").length;
  const totalActiveEditingTasks = editingTasks.filter((t) => t.status !== "aprobado" && t.status !== "publicado").length;
  const totalActiveManagementTasks = managementTasks.filter((t) => t.status !== "cerrado").length;
  const isAdminConfigVisible = ["super_admin", "operations"].includes(currentUserProfile?.role);
  const isFirstTimeWorkspace = clients.length === 0 && accountTasks.length === 0 && editingTasks.length === 0 && managementTasks.length === 0;
  const sidebarFooterText = currentUserProfile?.isActive === false ? "Cuenta inactiva" : !authEmail ? "Sin sesi\xF3n iniciada" : `${currentRoleMeta.label} \xB7 ${authEmail}`;
  let allActivities = [
    ...events.map((e) => ({ ...e, collectionType: "event", _color: "emerald", _icon: "CalendarIcon", _label: "Producci\xF3n" })),
    ...accountTasks.map((t) => {
      const manager = managers.find((m) => m.id === t.contextId);
      let rawColor = manager?.color || "indigo";
      let mColor = LEGACY_COLOR_MAP[rawColor] || rawColor;
      return { ...t, collectionType: "accountTask", _color: mColor, _icon: "LayoutList", _label: "Account" };
    }),
    ...editingTasks.map((t) => ({ ...t, collectionType: "editingTask", _color: "slate", _icon: "Video", _label: "Edici\xF3n" }))
  ];
  allActivities = [
    ...events.map((event) => ({ ...event, collectionType: "event", _color: "emerald", _icon: "CalendarIcon", _label: "Produccion" })),
    ...accountTasks.map((task) => {
      const manager = managers.find((item) => item.id === task.contextId);
      const rawColor = manager?.color || "indigo";
      const mappedColor = LEGACY_COLOR_MAP[rawColor] || rawColor;
      return { ...task, collectionType: "accountTask", _color: mappedColor, _icon: "LayoutList", _label: "Account" };
    }),
    ...editingTasks.map((task) => ({ ...task, collectionType: "editingTask", _color: "slate", _icon: "Video", _label: "Edicion" })),
    ...managementTasks.map((task) => ({ ...task, collectionType: "managementTask", _color: "violet", _icon: "ShieldCheck", _label: "Gestion" }))
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
      execute: () => addDoc(dataCollection("clients"), { ...fd, manager: manager ? manager.name : "", managerId: fd.managerId || "", managerUserId: manager?.userId || "", status: "Activo", mood: "Contento", createdAt: getHondurasTodayStr(), updatedAt: nowIso(), workflow: { week1: false, week2: false, week3: false, week4: false } }),
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
        await updateDoc(dataDoc("clients", client.id), { manager: newManager.name, managerId: newManager.id, updatedAt: nowIso() });
        const tasksToMove = accountTasks.filter((task) => task.clientId === client.id);
        await Promise.all(tasksToMove.map((task) => updateDoc(dataDoc("account_tasks", task.id), { contextId: newManager.id, assigneeUserId: newManager.userId || "", updatedAt: nowIso() })));
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
      execute: () => addDoc(dataCollection("managers"), { ...fd, email: normalizedEmail, color, createdAt: nowIso(), updatedAt: nowIso(), userId: "" }),
      afterSuccess: closeModal
    });
    if (result?.id && normalizedEmail) await syncIdentityLinks({ email: normalizedEmail, managerId: result.id, silent: true });
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
      execute: () => updateDoc(dataDoc("managers", id), { ...data, email: normalizedEmail, updatedAt: nowIso() }),
      afterSuccess: closeModal
    });
    if (result !== null && normalizedEmail) await syncIdentityLinks({ email: normalizedEmail, managerId: id, silent: true });
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
      execute: () => addDoc(dataCollection("editors"), { ...fd, email: normalizedEmail, color, createdAt: nowIso(), updatedAt: nowIso(), userId: "" }),
      afterSuccess: closeModal
    });
    if (result?.id && normalizedEmail) await syncIdentityLinks({ email: normalizedEmail, editorId: result.id, silent: true });
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
      execute: () => updateDoc(dataDoc("editors", id), { ...data, email: normalizedEmail, updatedAt: nowIso() }),
      afterSuccess: closeModal
    });
    if (result !== null && normalizedEmail) await syncIdentityLinks({ email: normalizedEmail, editorId: id, silent: true });
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
      execute: () => addDoc(dataCollection("account_tasks"), { ...data, assigneeUserId: manager?.userId || "", notificationsEnabled: data.notificationsEnabled !== false, status: "por_disenar", createdAt: nowIso(), updatedAt: nowIso() }),
      afterSuccess: closeModal
    });
  };
  const updateAccountTask = async (id, data) => {
    const manager = managers.find((item) => item.id === data.contextId);
    await runMutation({
      permission: "manage_account_tasks",
      action: "update",
      entityType: "accountTask",
      entityId: id,
      description: `Actualiza tarea de account ${id}`,
      changes: data,
      successMessage: "Guardado",
      execute: () => updateDoc(dataDoc("account_tasks", id), { ...data, assigneeUserId: manager?.userId || "", updatedAt: nowIso() }),
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
        afterSuccess: () => {
          if (newStatus === "publicado") triggerConfetti();
        }
      });
    }
  };
  const addEditingTask = async (data) => {
    const editor = editors.find((item) => item.id === data.contextId);
    await runMutation({
      permission: "create_editing_tasks",
      action: "create",
      entityType: "editingTask",
      description: `Crea video ${data.title}`,
      changes: { ...data, hierarchy: data.hierarchy || getEditingHierarchyId(data) },
      successMessage: "Agendado",
      execute: () => addDoc(dataCollection("editing"), { ...data, hierarchy: data.hierarchy || getEditingHierarchyId(data), assigneeUserId: editor?.userId || "", notificationsEnabled: data.notificationsEnabled !== false, status: data.status || "editar", createdAt: nowIso(), updatedAt: nowIso() }),
      afterSuccess: closeModal
    });
  };
  const updateEditingTask = async (id, data) => {
    const editor = editors.find((item) => item.id === data.contextId);
    await runMutation({
      permission: "manage_editing_tasks",
      action: "update",
      entityType: "editingTask",
      entityId: id,
      description: `Actualiza video ${id}`,
      changes: data,
      successMessage: "Guardado",
      execute: () => updateDoc(dataDoc("editing", id), { ...data, hierarchy: data.hierarchy || getEditingHierarchyId(data), assigneeUserId: editor?.userId || "", updatedAt: nowIso() }),
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
        changes: { previousStatus: task.status, nextStatus: newStatus, hierarchy: getEditingHierarchyId(task) },
        afterSuccess: () => {
          if (newStatus === "aprobado" || newStatus === "publicado") triggerConfetti();
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
      showToast("El integrante asignado necesita un correo para recibir recordatorios automaticos.", "error");
      return;
    }
    await runMutation({
      permission: "create_management_tasks",
      action: "create",
      entityType: "managementTask",
      description: `Crea tarea de gestion ${data.title}`,
      changes: data,
      successMessage: "Agendado",
      execute: () => addDoc(dataCollection("management_tasks"), { ...data, date: normalizedDate, time: normalizedTime, assigneeUserId: member?.id || "", status: "pendiente", createdAt: nowIso(), updatedAt: nowIso() }),
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
      showToast("El integrante asignado necesita un correo para recibir recordatorios automaticos.", "error");
      return;
    }
    const updatePermission = userHasPermission(currentUserProfile, "manage_management_tasks") ? "manage_management_tasks" : "create_management_tasks";
    await runMutation({
      permission: updatePermission,
      action: "update",
      entityType: "managementTask",
      entityId: id,
      description: `Actualiza tarea de gestion ${id}`,
      changes: data,
      successMessage: "Guardado",
      execute: () => updateDoc(dataDoc("management_tasks", id), { ...data, date: normalizedDate, time: normalizedTime, assigneeUserId: member?.id || "", updatedAt: nowIso() }),
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
        changes: { previousStatus: task.status, nextStatus: newStatus }
      });
    }
  };
  const changeTaskPriority = async (task, type, priority) => {
    const colMap = { accountTask: "account_tasks", editingTask: "editing", managementTask: "management_tasks" };
    const col = colMap[type];
    if (!col) return;
    await updateDoc(dataDoc(col, task.id), { priority, updatedAt: nowIso() });
  };
  const changeTaskAssignee = async (task, type, contextId) => {
    const colMap = { accountTask: "account_tasks", editingTask: "editing", managementTask: "management_tasks" };
    const col = colMap[type];
    if (!col) return;
    await updateDoc(dataDoc(col, task.id), { contextId: contextId || null, updatedAt: nowIso() });
  };
  const changeTaskAssignees = async (task, type, assigneeIds) => {
    const colMap = { accountTask: "account_tasks", editingTask: "editing", managementTask: "management_tasks" };
    const col = colMap[type];
    if (!col) return;
    await updateDoc(dataDoc(col, task.id), { assignees: assigneeIds, updatedAt: nowIso() });
  };
  const sendNotification = async (payload) => {
    try {
      await apiFetch("/api/notifications/send", { method: "POST", body: JSON.stringify({ ...payload, appUrl: window.location.origin }) });
    } catch (e) {
      console.warn("[notify]", e.message);
    }
  };
  const addTaskComment = async (task, type, text, mentionedIds = []) => {
    const colMap = { accountTask: "account_tasks", editingTask: "editing", managementTask: "management_tasks" };
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
    await updateDoc(dataDoc(col, task.id), { comments: [...task.comments || [], newComment], updatedAt: nowIso() });
    const allPeople = [...managementUsers || [], ...managers || [], ...editors || []];
    for (const uid of mentionedIds) {
      const person = allPeople.find((p) => p.id === uid);
      const email = person?.email || person?.authEmail;
      if (email && uid !== (currentUserProfile?.id || "")) {
        sendNotification({ to: email, type: "mention", senderName, taskTitle: task.title, taskType: type, comment: text });
      }
    }
  };
  const addTaskTimeEntry = async (task, type, durationMs) => {
    const colMap = { accountTask: "account_tasks", editingTask: "editing", managementTask: "management_tasks" };
    const col = colMap[type];
    if (!col || !durationMs || durationMs < 1e3) return;
    const newEntry = {
      id: Math.random().toString(36).slice(2, 10),
      durationMs,
      authorName: currentUserProfile?.name || (authEmail ? authEmail.split("@")[0] : "Usuario"),
      authorId: currentUserProfile?.id || "",
      loggedAt: nowIso()
    };
    await updateDoc(dataDoc(col, task.id), { timeEntries: [...task.timeEntries || [], newEntry], updatedAt: nowIso() });
  };
  const updateTaskChecklist = async (task, type, checklist) => {
    const colMap = { accountTask: "account_tasks", editingTask: "editing", managementTask: "management_tasks" };
    const col = colMap[type];
    if (!col) return;
    await updateDoc(dataDoc(col, task.id), { checklist, updatedAt: nowIso() });
  };
  const addTaskAttachment = async (task, type, file) => {
    const colMap = { accountTask: "account_tasks", editingTask: "editing", managementTask: "management_tasks" };
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
    await updateDoc(dataDoc(col, task.id), { attachments: [...task.attachments || [], newAttachment], updatedAt: nowIso() });
  };
  const removeTaskAttachment = async (task, type, attachmentId) => {
    const colMap = { accountTask: "account_tasks", editingTask: "editing", managementTask: "management_tasks" };
    const col = colMap[type];
    if (!col) return;
    await updateDoc(dataDoc(col, task.id), { attachments: (task.attachments || []).filter((a) => a.id !== attachmentId), updatedAt: nowIso() });
  };
  const addEvent = async (data) => {
    await runMutation({
      permission: "manage_calendar",
      action: "create",
      entityType: "event",
      description: `Crea evento ${data.title}`,
      changes: data,
      successMessage: "Agendado",
      execute: () => addDoc(dataCollection("events"), { ...data, createdAt: nowIso(), updatedAt: nowIso() }),
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
    const existingManagementUser = managementKey ? chooseCanonicalUserRecord(appUsers.filter((item) => item.role === "management" && (item.managementKey || getManagementDirectoryKey(item)) === managementKey)) : null;
    if (!email) {
      showToast("El correo es obligatorio", "error");
      return;
    }
    if (existingManagementUser) {
      await updateUserRecord(existingManagementUser.id, { ...data, role: "management" });
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
      changes: { name: data.name, email, role: requestedRole, isActive: data.isActive },
      successMessage: null,
      execute: () => addDoc(dataCollection("users"), {
        name: data.name,
        email,
        role: requestedRole,
        isActive: nextActive,
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
        showToast("Usuario creado, pero no se pudo enviar el correo de acceso.", "error");
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
    if (appUsers.some((item) => item.id !== id && normalizeEmail(item.email) === email)) {
      showToast("Ese correo ya esta en uso", "error");
      return;
    }
    const current = appUsers.find((item) => item.id === id);
    const nextRole = data.role || current?.role || "viewer";
    const nextManagementKey = nextRole === "management" ? getManagementDirectoryKey(data.name || current?.name || "") : "";
    const nextActive = data.isActive !== false;
    const emailChanged = email !== normalizeEmail(current?.email);
    if (privilegedUsers.length === 1 && privilegedUsers[0].id === id && (!["super_admin", "operations"].includes(nextRole) || !nextActive)) {
      showToast("Debe existir al menos un usuario administrador activo", "error");
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
      changes: { name: data.name, email, role: nextRole, isActive: nextActive, emailChanged },
      successMessage: emailChanged ? null : "Usuario actualizado",
      execute: () => updateDoc(dataDoc("users", id), {
        name: data.name,
        email,
        role: nextRole,
        managementKey: nextManagementKey,
        isActive: nextActive,
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
      showToast("Usuario actualizado, pero no se pudo enviar el correo de acceso.", "error");
    }
  };
  const handleDelete = async () => {
    const { type, id } = deleteConfirm;
    const map = {
      client: { collection: "clients", permission: "manage_clients", entityType: "client", after: () => {
        setView("clients");
        setSelectedClient(null);
      } },
      manager: { collection: "managers", permission: "manage_managers", entityType: "manager", after: () => {
        setView("managers");
        setSelectedManager(null);
      } },
      editor: { collection: "editors", permission: "manage_editors", entityType: "editor", after: () => {
        setView("editors");
        setSelectedEditor(null);
      } },
      event: { collection: "events", permission: "manage_calendar", entityType: "event" },
      accountTask: { collection: "account_tasks", permission: "manage_account_tasks", entityType: "accountTask" },
      editingTask: { collection: "editing", permission: "manage_editing_tasks", entityType: "editingTask" },
      managementTask: { collection: "management_tasks", permission: "manage_management_tasks", entityType: "managementTask" }
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
    if (collectionType === "accountTask") return userHasPermission(currentUserProfile, "manage_account_tasks");
    if (collectionType === "editingTask") return userHasPermission(currentUserProfile, "manage_editing_tasks");
    if (collectionType === "managementTask") return userHasPermission(currentUserProfile, "manage_management_tasks");
    if (collectionType === "event") return userHasPermission(currentUserProfile, "manage_calendar");
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
    ), /* @__PURE__ */ React.createElement("div", { "aria-live": "polite", "aria-atomic": "true", className: "fixed bottom-6 right-6 z-[110] pointer-events-none" }, toast && /* @__PURE__ */ React.createElement(Toast, { message: toast.message, type: toast.type })));
  }
  return /* @__PURE__ */ React.createElement("div", { className: "flex h-screen text-slate-900 dark:text-slate-100 overflow-hidden flex-col md:flex-row font-sans transition-colors duration-300" }, /* @__PURE__ */ React.createElement("div", { className: "md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center z-30 shadow-sm shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(AgencyLogo, { className: "w-8 h-8 text-sm" }), /* @__PURE__ */ React.createElement("span", { className: "font-black text-slate-800 dark:text-white text-lg" }, "CLUSTER")), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setIsMobileMenuOpen(!isMobileMenuOpen),
      "aria-label": isMobileMenuOpen ? "Cerrar navegaci\xF3n" : "Abrir navegaci\xF3n",
      "aria-expanded": isMobileMenuOpen,
      className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
    },
    /* @__PURE__ */ React.createElement(Icon, { name: isMobileMenuOpen ? "X" : "Menu", size: 24 })
  )), /* @__PURE__ */ React.createElement("div", { className: `fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity md:hidden ${isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`, onClick: () => setIsMobileMenuOpen(false) }), /* @__PURE__ */ React.createElement("aside", { className: `fixed md:relative z-50 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col w-64 shrink-0 transition-transform duration-300 top-0 left-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}` }, /* @__PURE__ */ React.createElement("div", { className: "p-8 hidden md:block" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 mb-1" }, /* @__PURE__ */ React.createElement(AgencyLogo, { className: "w-8 h-8 text-lg" }), /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-black text-slate-800 dark:text-white" }, "CLUSTER")), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] uppercase font-bold text-slate-500 pl-11" }, "Agency OS")), /* @__PURE__ */ React.createElement("nav", { className: "flex-1 px-4 space-y-1 pt-20 md:pt-4 overflow-y-auto custom-scroll", "aria-label": "Navegaci\xF3n principal" }, /* @__PURE__ */ React.createElement("div", { className: "pt-1 pb-2 pl-4 text-xs font-bold text-slate-500 uppercase tracking-wider" }, "Principal"), canAccessView(currentUserProfile, "dashboard") && /* @__PURE__ */ React.createElement(SidebarItem, { active: view === "dashboard", onClick: () => handleNavigate("dashboard"), icon: "LayoutDashboard", label: "Panel Central", color: "purple" }), /* @__PURE__ */ React.createElement("div", { className: "pt-4 pb-2 pl-4 text-xs font-bold text-slate-500 uppercase tracking-wider mt-2" }, "Clientes & equipo"), canAccessView(currentUserProfile, "clients") && /* @__PURE__ */ React.createElement(SidebarItem, { active: view === "clients" || view === "client-detail", onClick: () => handleNavigate("clients"), icon: "Briefcase", label: "Clientes", color: "blue" }), canAccessView(currentUserProfile, "managers") && /* @__PURE__ */ React.createElement(SidebarItem, { active: view === "managers" || view === "manager-detail", onClick: () => handleNavigate("managers"), icon: "Users", label: "Account Managers", color: "indigo" }), canAccessView(currentUserProfile, "editors") && /* @__PURE__ */ React.createElement(SidebarItem, { active: view === "editors" || view === "editor-detail", onClick: () => handleNavigate("editors"), icon: "PenTool", label: "Editores", color: "rose" }), /* @__PURE__ */ React.createElement("div", { className: "pt-4 pb-2 pl-4 text-xs font-bold text-slate-500 uppercase tracking-wider mt-2" }, "Salas de trabajo"), canAccessView(currentUserProfile, "account-room") && /* @__PURE__ */ React.createElement(SidebarItem, { active: view === "account-room", onClick: () => handleNavigate("account-room"), icon: "LayoutList", label: "Sala de Accounts", color: "indigo", badge: totalActiveAccountTasks > 0 ? totalActiveAccountTasks : null, badgeColor: pendingAccounts > 0 ? "bg-indigo-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300" }), canAccessView(currentUserProfile, "management-room") && /* @__PURE__ */ React.createElement(SidebarItem, { active: view === "management-room", onClick: () => handleNavigate("management-room"), icon: "ShieldCheck", label: "Sala de Gesti\xF3n", color: "violet", badge: totalActiveManagementTasks > 0 ? totalActiveManagementTasks : null, badgeColor: pendingManagement > 0 ? "bg-violet-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300" }), canAccessView(currentUserProfile, "editions") && /* @__PURE__ */ React.createElement(SidebarItem, { active: view === "editions", onClick: () => handleNavigate("editions"), icon: "Video", label: "Sala de Edici\xF3n", color: "amber", badge: totalActiveEditingTasks > 0 ? totalActiveEditingTasks : null, badgeColor: urgentEditions > 0 ? "bg-red-500 text-white animate-pulse" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300" }), /* @__PURE__ */ React.createElement("div", { className: "pt-4 pb-2 pl-4 text-xs font-bold text-slate-500 uppercase tracking-wider mt-2" }, "Calendario"), canAccessView(currentUserProfile, "general-calendar") && /* @__PURE__ */ React.createElement(SidebarItem, { active: view === "general-calendar", onClick: () => handleNavigate("general-calendar"), icon: "CalendarDays", label: "Calendario General", color: "blue" }), canAccessView(currentUserProfile, "calendar") && /* @__PURE__ */ React.createElement(SidebarItem, { active: view === "calendar", onClick: () => handleNavigate("calendar"), icon: "CalendarIcon", label: "Agenda Producci\xF3n", color: "emerald" }), canAccessView(currentUserProfile, "reports") && /* @__PURE__ */ React.createElement(SidebarItem, { active: view === "reports", onClick: () => handleNavigate("reports"), icon: "BarChart3", label: "Reportes", color: "emerald" }), isAdminConfigVisible && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "pt-4 pb-2 pl-4 text-xs font-bold text-slate-500 uppercase tracking-wider mt-2" }, "Configuraci\xF3n"), canAccessView(currentUserProfile, "control-center") && /* @__PURE__ */ React.createElement(SidebarItem, { active: view === "control-center", onClick: () => handleNavigate("control-center"), icon: "ClipboardList", label: "Usuarios y accesos", color: "purple" }))), /* @__PURE__ */ React.createElement("div", { className: "p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: `w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${profileBlocked ? "bg-red-500" : authEmail ? "bg-gradient-to-tr from-purple-500 to-indigo-500" : "bg-slate-500"}` }, (currentUserProfile?.name || "IN").slice(0, 2).toUpperCase()), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-slate-700 dark:text-slate-200 truncate" }, currentUserProfile?.name || "Invitado"), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase truncate" }, sidebarFooterText))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: `text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${profileBlocked ? "bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400" : currentVerificationMeta.color === "emerald" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" : currentVerificationMeta.color === "amber" ? "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" : currentVerificationMeta.color === "blue" ? "bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"}` }, profileBlocked ? "Bloqueado" : authEmail ? currentVerificationMeta.label : "Invitado"), /* @__PURE__ */ React.createElement("button", { onClick: () => setIsDark(!isDark), "aria-label": isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro", title: isDark ? "Modo claro" : "Modo oscuro", className: "ml-auto p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300" }, /* @__PURE__ */ React.createElement(Icon, { name: isDark ? "Sun" : "Moon", size: 16 })), authEmail ? /* @__PURE__ */ React.createElement("button", { onClick: handleLogout, "aria-label": "Cerrar sesi\xF3n", title: "Cerrar sesi\xF3n", className: "p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300" }, /* @__PURE__ */ React.createElement(Icon, { name: "LogOut", size: 16 })) : /* @__PURE__ */ React.createElement("button", { onClick: handleGoogleSignIn, disabled: isSigningIn, "aria-label": "Iniciar sesi\xF3n", title: "Iniciar sesi\xF3n", className: "p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 disabled:opacity-60" }, /* @__PURE__ */ React.createElement(Icon, { name: isSigningIn ? "Loader2" : "LogIn", size: 16, className: isSigningIn ? "animate-spin" : "" }))))), /* @__PURE__ */ React.createElement("main", { className: "flex-1 overflow-y-auto relative w-full h-full" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 md:p-8 max-w-[1600px] mx-auto min-h-full pb-mobile-nav md:pb-20" }, view === "dashboard" && (isFirstTimeWorkspace ? /* @__PURE__ */ React.createElement(FirstTimeView, { role: currentUserProfile?.role, onNavigate: handleNavigate }) : /* @__PURE__ */ React.createElement(DashboardView, { clients, managers, events, tasks: editingTasks, accountTasks, managementTasks, currentUserProfile, onSignIn: handleGoogleSignIn })), view === "clients" && /* @__PURE__ */ React.createElement(ClientsView, { clients, onAdd: () => setModalConfig({ isOpen: true, type: "client" }), onSelect: (c) => {
    setSelectedClient(c);
    handleNavigate("client-detail");
  } }), view === "client-detail" && selectedClient && /* @__PURE__ */ React.createElement(ClientDetail, { client: selectedClient, managers, onReassignManager: reassignClientManager, onBack: () => handleNavigate("clients"), onUpdate: updateClient, onDelete: () => setDeleteConfirm({ isOpen: true, type: "client", id: selectedClient.id, title: selectedClient.name }), onEdit: () => setModalConfig({ isOpen: true, type: "client", data: selectedClient, isEdit: true }) }), view === "managers" && /* @__PURE__ */ React.createElement(TeamView, { title: "Account Managers", team: managers, iconColor: "indigo", onAdd: () => setModalConfig({ isOpen: true, type: "manager" }), onSelect: (m) => {
    setSelectedManager(m);
    handleNavigate("manager-detail");
  }, onDelete: (m) => setDeleteConfirm({ isOpen: true, type: "manager", id: m.id, title: m.name }), onEdit: (m) => setModalConfig({ isOpen: true, type: "manager", data: m, isEdit: true }) }), view === "manager-detail" && selectedManager && /* @__PURE__ */ React.createElement(PersonCalendarDetail, { person: selectedManager, tasks: accountTasks, title: "Planificaci\xF3n de Cuentas", baseColor: LEGACY_COLOR_MAP[selectedManager.color] || selectedManager.color || "indigo", onBack: () => handleNavigate("managers"), onAddEvent: (dateStr) => setModalConfig({ isOpen: true, type: "accountTask", data: { date: dateStr, contextId: selectedManager.id } }), onEventClick: (e) => handleEventClick(e, "accountTask") }), view === "editors" && /* @__PURE__ */ React.createElement(TeamView, { title: "Editores", team: editors, iconColor: "rose", onAdd: () => setModalConfig({ isOpen: true, type: "editor" }), onSelect: (e) => {
    setSelectedEditor(e);
    handleNavigate("editor-detail");
  }, onDelete: (e) => setDeleteConfirm({ isOpen: true, type: "editor", id: e.id, title: e.name }), onEdit: (e) => setModalConfig({ isOpen: true, type: "editor", data: e, isEdit: true }) }), view === "editor-detail" && selectedEditor && /* @__PURE__ */ React.createElement(PersonCalendarDetail, { person: selectedEditor, tasks: editingTasks, title: "Planificaci\xF3n de Edici\xF3n", baseColor: selectedEditor.color || "rose", onBack: () => handleNavigate("editors"), onAddEvent: (dateStr) => setModalConfig({ isOpen: true, type: "editingTask", data: { date: dateStr, contextId: selectedEditor.id } }), onEventClick: (e) => handleEventClick(e, "editingTask") }), view === "account-room" && /* @__PURE__ */ React.createElement(AccountRoomView, { tasks: accountTasks, managers, clients, currentUserProfile, onAdd: (dateStr) => setModalConfig({ isOpen: true, type: "accountTask", data: { date: dateStr } }), onEdit: (task) => setModalConfig({ isOpen: true, type: "accountTask", data: task, isEdit: true }), onChangeStatus: changeAccountTaskStatus, onDelete: (id) => setDeleteConfirm({ isOpen: true, type: "accountTask", id, title: "Tarea" }), onTaskClick: (t) => setTaskDetailConfig({ isOpen: true, task: t, type: "accountTask" }), legacyColorMap: LEGACY_COLOR_MAP }), view === "editions" && /* @__PURE__ */ React.createElement(EditionsRoomView, { tasks: editingTasks, editors, clients, currentUserProfile, onAdd: (dateStr) => setModalConfig({ isOpen: true, type: "editingTask", data: { date: dateStr } }), onEdit: (task) => setModalConfig({ isOpen: true, type: "editingTask", data: task, isEdit: true }), onChangeStatus: changeEditingTaskStatus, onDelete: (id) => setDeleteConfirm({ isOpen: true, type: "editingTask", id, title: "Tarea" }), onTaskClick: (t) => setTaskDetailConfig({ isOpen: true, task: t, type: "editingTask" }) }), view === "management-room" && /* @__PURE__ */ React.createElement(ManagementRoomView, { tasks: managementTasks, members: managementUsers, clients, currentUserProfile, onAdd: (dateStr) => setModalConfig({ isOpen: true, type: "managementTask", data: { date: dateStr, contextId: defaultManagementAssigneeId } }), onEdit: (task) => setModalConfig({ isOpen: true, type: "managementTask", data: task, isEdit: true }), onChangeStatus: changeManagementTaskStatus, onDelete: (id) => setDeleteConfirm({ isOpen: true, type: "managementTask", id, title: "Tarea de gestion" }), onTaskClick: (t) => setTaskDetailConfig({ isOpen: true, task: t, type: "managementTask" }) }), view === "control-center" && /* @__PURE__ */ React.createElement(UsersAccessView, { users: appUsers, managers, editors, auditLogs, currentUserProfile, onAdd: () => setModalConfig({ isOpen: true, type: "user" }), onEdit: (userRecord) => setModalConfig({ isOpen: true, type: "user", data: userRecord, isEdit: true }), onResendVerification: requestUserVerification }), view === "general-calendar" && /* @__PURE__ */ React.createElement("div", { className: "h-full flex flex-col space-y-6 fade-in" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-black text-slate-800 dark:text-white" }, "Calendario General"), /* @__PURE__ */ React.createElement("div", { className: "flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden" }, /* @__PURE__ */ React.createElement(
    GeneralCalendarGrid,
    {
      activities: allActivities,
      onDayClick: (dateStr) => setDayDetailsModal({ isOpen: true, date: dateStr }),
      onMoveActivity: async (activity, newDate) => {
        if (!canEditActivity(activity.collectionType)) return;
        const colMap = { accountTask: "account_tasks", editingTask: "editing", managementTask: "management_tasks", event: "events" };
        const colName = colMap[activity.collectionType];
        if (colName) await updateDoc(dataDoc(colName, activity.id), { date: newDate, updatedAt: nowIso() });
      }
    }
  ))), view === "calendar" && /* @__PURE__ */ React.createElement("div", { className: "h-full flex flex-col space-y-6 fade-in" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-black text-slate-800 dark:text-white" }, "Agenda de Producciones"), /* @__PURE__ */ React.createElement("div", { className: "flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden" }, /* @__PURE__ */ React.createElement(CalendarGrid, { events: events.filter((e) => e.type === "production"), baseColor: "emerald", onAdd: (dateStr) => setModalConfig({ isOpen: true, type: "event", data: { date: dateStr, type: "production" } }), onEventClick: (e) => handleEventClick(e, "event") }))), view === "reports" && /* @__PURE__ */ React.createElement(ReportsView, { accountTasks, editingTasks, managementTasks, clients, managers, editors, users: managementUsers }))), /* @__PURE__ */ React.createElement(MobileBottomNav, { view, onNavigate: handleNavigate, currentUserProfile }), /* @__PURE__ */ React.createElement("div", { "aria-live": "polite", "aria-atomic": "true", className: "fixed bottom-6 right-6 z-[110] pointer-events-none" }, toast && /* @__PURE__ */ React.createElement(Toast, { message: toast.message, type: toast.type })), modalConfig.isOpen && ["accountTask", "editingTask", "managementTask"].includes(modalConfig.type) && /* @__PURE__ */ React.createElement(CreateTaskModal, { config: modalConfig, onClose: closeModal, clients, managers, editors, managementUsers, actions: { addClient, updateClient, addManager, updateManager, addEditor, updateEditor, addEvent, updateEvent, addAccountTask, updateAccountTask, addEditingTask, updateEditingTask, addManagementTask, updateManagementTask, addUserRecord, updateUserRecord } }), modalConfig.isOpen && !["accountTask", "editingTask", "managementTask"].includes(modalConfig.type) && /* @__PURE__ */ React.createElement(Modal, { config: modalConfig, onClose: closeModal, clients, managers, editors, managementUsers, actions: { addClient, updateClient, addManager, updateManager, addEditor, updateEditor, addEvent, updateEvent, addAccountTask, updateAccountTask, addEditingTask, updateEditingTask, addManagementTask, updateManagementTask, addUserRecord, updateUserRecord } }), deleteConfirm.isOpen && /* @__PURE__ */ React.createElement(DeleteConfirmModal, { config: deleteConfirm, onClose: closeDelete, onConfirm: handleDelete }), /* @__PURE__ */ React.createElement(EventActionModal, { config: eventAction, canEdit: canEditActivity(eventAction.type), onClose: () => setEventAction({ isOpen: false, event: null, type: null }), onEdit: (event, type) => setModalConfig({ isOpen: true, type, data: event, isEdit: true }), onDelete: (event, type) => setDeleteConfirm({ isOpen: true, type, id: event.id, title: event.title }) }), /* @__PURE__ */ React.createElement(DayDetailsModal, { config: dayDetailsModal, onClose: () => setDayDetailsModal({ isOpen: false, date: null }), activities: allActivities, clients, managers, editors, users: managementUsers, canEditActivity, onEdit: (act, type) => setModalConfig({ isOpen: true, type, data: act, isEdit: true }), onDelete: (act, type) => setDeleteConfirm({ isOpen: true, type, id: act.id, title: act.title }) }), /* @__PURE__ */ React.createElement(TaskDetailModal, { config: taskDetailConfig, onClose: () => setTaskDetailConfig({ isOpen: false, task: null, type: null }), clients, managers, editors, users: managementUsers, canEdit: (type) => canEditActivity(type), onEdit: (task, type) => {
    setTaskDetailConfig({ isOpen: false, task: null, type: null });
    setModalConfig({ isOpen: true, type, data: task, isEdit: true });
  }, onChangeStatus: (task, type, newStatus) => {
    if (type === "accountTask") changeAccountTaskStatus(task, newStatus);
    else if (type === "editingTask") changeEditingTaskStatus(task, newStatus);
    else if (type === "managementTask") changeManagementTaskStatus(task, newStatus);
  }, onAddComment: addTaskComment, onAddTimeEntry: addTaskTimeEntry, onUpdateChecklist: updateTaskChecklist, onChangePriority: changeTaskPriority, onChangeAssignee: changeTaskAssignee, onChangeAssignees: changeTaskAssignees, sendNotification, onAddAttachment: addTaskAttachment, onRemoveAttachment: removeTaskAttachment, onDelete: (task, type) => {
    setTaskDetailConfig({ isOpen: false, task: null, type: null });
    setDeleteConfirm({ isOpen: true, type, id: task.id, title: task.title });
  }, currentUserProfile, accountTasks, editingTasks, managementTasks }));
}
var SidebarItem = ({ active, onClick, icon, label, color, badge, badgeColor }) => /* @__PURE__ */ React.createElement("button", { onClick, "aria-current": active ? "page" : void 0, className: `w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 group ${active ? `bg-${color}-50 dark:bg-${color}-500/20 text-${color}-700 dark:text-${color}-300 shadow-sm border-${color}-100 dark:border-${color}-500/30` : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 border-transparent"}` }, /* @__PURE__ */ React.createElement("div", { className: `transition-transform duration-200 ${active ? "scale-110" : "group-hover:scale-110"} text-[inherit]` }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 20 })), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-sm flex-1 text-left text-[inherit]" }, label), badge && /* @__PURE__ */ React.createElement("span", { className: `text-[10px] font-black px-2 py-0.5 rounded-full ${badgeColor}` }, badge), active && !badge && /* @__PURE__ */ React.createElement(Icon, { name: "ChevronRight", size: 14, className: `ml-auto text-${color}-400 dark:text-${color}-500` }));
var Button = ({ children, onClick, type = "button", color = "purple", full, icon, ...props }) => /* @__PURE__ */ React.createElement("button", { type, onClick, className: `${full ? "w-full" : ""} min-h-[46px] whitespace-nowrap bg-${color}-600 hover:bg-${color}-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-${color}-500/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-${color}-500 dark:focus-visible:ring-offset-slate-950`, ...props }, icon && /* @__PURE__ */ React.createElement(Icon, { name: icon }), " ", children);
var EmptyState = ({ icon, text }) => /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center p-6 text-center h-full opacity-60" }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 32, className: "text-slate-500 dark:text-slate-400 mb-3" }), /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-slate-500 dark:text-slate-400" }, text));
var AppShellSkeleton = () => /* @__PURE__ */ React.createElement("div", { className: "flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100" }, /* @__PURE__ */ React.createElement("div", { className: "hidden md:flex w-64 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6" }, /* @__PURE__ */ React.createElement("div", { className: "h-10 w-36 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" }), /* @__PURE__ */ React.createElement("div", { className: "mt-10 space-y-3" }, Array.from({ length: 8 }).map((_, index) => /* @__PURE__ */ React.createElement("div", { key: index, className: "h-11 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" })))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 p-4 md:p-8" }, /* @__PURE__ */ React.createElement("div", { className: "mb-6 h-10 w-64 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" }), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-4" }, Array.from({ length: 4 }).map((_, index) => /* @__PURE__ */ React.createElement("div", { key: index, className: "h-28 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5" }, /* @__PURE__ */ React.createElement("div", { className: "h-3 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" }), /* @__PURE__ */ React.createElement("div", { className: "mt-5 h-8 w-16 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" })))), /* @__PURE__ */ React.createElement("div", { className: "mt-6 grid grid-cols-1 gap-4 md:grid-cols-3" }, Array.from({ length: 3 }).map((_, index) => /* @__PURE__ */ React.createElement("div", { key: index, className: "h-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4" }, /* @__PURE__ */ React.createElement("div", { className: "h-4 w-32 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" }), /* @__PURE__ */ React.createElement("div", { className: "mt-5 space-y-3" }, Array.from({ length: 4 }).map((__, itemIndex) => /* @__PURE__ */ React.createElement("div", { key: itemIndex, className: "h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" }))))))));
var Breadcrumb = ({ items }) => /* @__PURE__ */ React.createElement("nav", { "aria-label": "Ruta de navegaci\xF3n", className: "flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-2" }, items.map((item, index) => /* @__PURE__ */ React.createElement(React.Fragment, { key: `${item.label}-${index}` }, index > 0 && /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true", className: "text-slate-300 dark:text-slate-600" }, "/"), item.onClick ? /* @__PURE__ */ React.createElement("button", { onClick: item.onClick, className: "min-h-0 min-w-0 rounded-md px-1 py-0.5 font-bold hover:text-purple-600 dark:hover:text-purple-400 transition-colors" }, item.label) : /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-800 dark:text-slate-100" }, item.label))));
var FirstTimeView = ({ role, onNavigate }) => {
  const normalizedRole = ["editor", "manager", "management", "operations", "super_admin"].includes(role) ? role : "viewer";
  const stepsByRole = {
    editor: [
      { icon: "Video", title: "Sala de Edici\xF3n", desc: "Revisa tus tareas asignadas y avanza cada pieza por estado.", view: "editions" },
      { icon: "CheckCircle2", title: "Estados claros", desc: "Mueve las tarjetas cuando una pieza pase a revisi\xF3n, aprobaci\xF3n o publicaci\xF3n.", view: "editions" },
      { icon: "Mail", title: "Recordatorios", desc: "Mant\xE9n tu correo activo para recibir avisos de vencimiento.", view: "general-calendar" }
    ],
    manager: [
      { icon: "Briefcase", title: "Clientes", desc: "Crea la cartera inicial y asigna cada cuenta a su responsable.", view: "clients" },
      { icon: "LayoutList", title: "Sala de Accounts", desc: "Planifica publicaciones y tareas por fecha, estado y responsable.", view: "account-room" },
      { icon: "CalendarDays", title: "Calendario", desc: "Consulta la carga del equipo desde una vista general.", view: "general-calendar" }
    ],
    management: [
      { icon: "ShieldCheck", title: "Sala de Gesti\xF3n", desc: "Centraliza seguimientos internos con fecha, hora y responsable.", view: "management-room" },
      { icon: "Briefcase", title: "Clientes", desc: "Asocia tareas de gesti\xF3n a clientes cuando aplique.", view: "clients" },
      { icon: "CalendarDays", title: "Calendario", desc: "Revisa vencimientos y movimiento del equipo.", view: "general-calendar" }
    ],
    operations: [
      { icon: "Users", title: "Equipo", desc: "Carga managers, editores y usuarios autorizados.", view: "control-center" },
      { icon: "Briefcase", title: "Clientes", desc: "Prepara la estructura base de cuentas antes de operar.", view: "clients" },
      { icon: "LayoutDashboard", title: "Panel Central", desc: "Monitorea volumen, atrasos y avance global.", view: "dashboard" }
    ],
    super_admin: [
      { icon: "Users", title: "Accesos", desc: "Configura roles activos y correos verificados.", view: "control-center" },
      { icon: "Briefcase", title: "Clientes", desc: "Crea la primera cartera y asigna responsables.", view: "clients" },
      { icon: "LayoutDashboard", title: "Panel Central", desc: "Revisa salud operativa cuando ya exista actividad.", view: "dashboard" }
    ],
    viewer: [
      { icon: "LayoutDashboard", title: "Panel Central", desc: "Aqu\xED ver\xE1s el resumen cuando el equipo empiece a cargar datos.", view: "dashboard" },
      { icon: "LayoutList", title: "Salas de trabajo", desc: "Consulta tareas por fecha y estado.", view: "account-room" },
      { icon: "CalendarDays", title: "Calendario", desc: "Abre el calendario para ubicar actividad por d\xEDa.", view: "general-calendar" }
    ]
  };
  const steps = stepsByRole[normalizedRole] || stepsByRole.viewer;
  return /* @__PURE__ */ React.createElement("div", { className: "min-h-full flex items-center" }, /* @__PURE__ */ React.createElement("section", { className: "w-full max-w-5xl mx-auto" }, /* @__PURE__ */ React.createElement("div", { className: "mb-8 max-w-2xl" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-3" }, "Inicio r\xE1pido"), /* @__PURE__ */ React.createElement("h2", { className: "text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight" }, "Prepara ClusterAG para operar"), /* @__PURE__ */ React.createElement("p", { className: "mt-3 text-sm md:text-base text-slate-600 dark:text-slate-300 leading-7" }, "Empieza por la estructura m\xEDnima de equipo, clientes y salas de trabajo.")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" }, steps.map((step) => /* @__PURE__ */ React.createElement("button", { key: step.title, onClick: () => onNavigate(step.view), className: "group min-h-[180px] text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-lg transition-all" }, /* @__PURE__ */ React.createElement("div", { className: "mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-300" }, /* @__PURE__ */ React.createElement(Icon, { name: step.icon, size: 20 })), /* @__PURE__ */ React.createElement("h3", { className: "text-base font-black text-slate-900 dark:text-white" }, step.title), /* @__PURE__ */ React.createElement("p", { className: "mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400" }, step.desc), /* @__PURE__ */ React.createElement("span", { className: "mt-4 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400" }, "Abrir ", /* @__PURE__ */ React.createElement(Icon, { name: "ArrowRight", size: 13 })))))));
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
  return /* @__PURE__ */ React.createElement("nav", { "aria-label": "Navegaci\xF3n principal", className: "fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)]" }, items.map((item) => {
    const active = isItemActive(item.view);
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: item.view,
        onClick: () => onNavigate(item.view),
        "aria-label": item.label,
        "aria-current": active ? "page" : void 0,
        className: `flex-1 min-w-0 min-h-[64px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-bold transition-colors ${active ? "text-purple-600 dark:text-purple-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"}`
      },
      /* @__PURE__ */ React.createElement(Icon, { name: item.icon, size: 20 }),
      /* @__PURE__ */ React.createElement("span", { className: "truncate max-w-full" }, item.label)
    );
  }));
};
var LoginScreen = ({ isDark, onToggleTheme, onGoogleSignIn, isSigningIn, email, onEmailChange, onEmailSubmit, isSendingLoginLink }) => /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-slate-950 text-white flex flex-col font-sans" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between px-5 py-4 border-b border-white/10" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(AgencyLogo, { className: "w-9 h-9 text-lg" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "font-black text-lg leading-none" }, "CLUSTER"), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] uppercase tracking-wider font-bold text-slate-500 mt-1" }, "Agency OS"))), /* @__PURE__ */ React.createElement("button", { onClick: onToggleTheme, "aria-label": isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro", title: isDark ? "Modo claro" : "Modo oscuro", className: "p-2 rounded-full bg-white/10 text-slate-200 border border-white/10" }, /* @__PURE__ */ React.createElement(Icon, { name: isDark ? "Sun" : "Moon", size: 18 }))), /* @__PURE__ */ React.createElement("main", { className: "flex-1 grid place-items-center px-5 py-8" }, /* @__PURE__ */ React.createElement("section", { className: "w-full max-w-md" }, /* @__PURE__ */ React.createElement("div", { className: "mb-8" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-black uppercase tracking-wider text-purple-300 mb-3" }, "Acceso privado"), /* @__PURE__ */ React.createElement("h2", { className: "text-3xl font-black leading-tight" }, "Inicia sesion para entrar al panel"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-500 mt-3 leading-6" }, "Usa tu cuenta autorizada de Cluster para gestionar clientes, tareas y calendario.")), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement(
  "button",
  {
    onClick: onGoogleSignIn,
    disabled: isSigningIn || isSendingLoginLink,
    className: "w-full min-h-[52px] rounded-xl bg-white text-slate-900 font-black flex items-center justify-center gap-3 disabled:opacity-60"
  },
  /* @__PURE__ */ React.createElement(Icon, { name: isSigningIn ? "Loader2" : "LogIn", size: 18, className: isSigningIn ? "animate-spin" : "" }),
  "Entrar con Google"
), /* @__PURE__ */ React.createElement("form", { onSubmit: onEmailSubmit, className: "space-y-3" }, /* @__PURE__ */ React.createElement(
  "input",
  {
    id: "login-email",
    type: "email",
    value: email,
    onChange: (event) => onEmailChange(event.target.value),
    placeholder: "correo@cluster.com",
    "aria-label": "Correo autorizado",
    autoComplete: "email",
    className: "w-full min-h-[52px] rounded-xl bg-white/10 border border-white/10 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-400 placeholder:text-slate-500"
  }
), /* @__PURE__ */ React.createElement(
  "button",
  {
    type: "submit",
    disabled: isSigningIn || isSendingLoginLink,
    className: "w-full min-h-[52px] rounded-xl bg-purple-600 hover:bg-purple-700 font-black flex items-center justify-center gap-3 disabled:opacity-60"
  },
  /* @__PURE__ */ React.createElement(Icon, { name: isSendingLoginLink ? "Loader2" : "Mail", size: 18, className: isSendingLoginLink ? "animate-spin" : "" }),
  "Enviarme enlace"
))))));
var SearchBar = ({ searchTerm, setSearchTerm, placeholder }) => /* @__PURE__ */ React.createElement("div", { className: "relative w-full md:w-64 shrink-0" }, /* @__PURE__ */ React.createElement(Icon, { name: "Search", className: "absolute left-3 top-3 text-slate-500 dark:text-slate-400", size: 16 }), /* @__PURE__ */ React.createElement("input", { type: "text", "aria-label": placeholder || "Buscar", placeholder, value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "min-h-[46px] w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-500 dark:placeholder:text-slate-500" }));
var StatCard = ({ title, value, icon, color }) => /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1" }, title), /* @__PURE__ */ React.createElement("p", { className: "text-3xl font-black text-slate-800 dark:text-white" }, value)), /* @__PURE__ */ React.createElement("div", { className: `p-3 rounded-xl bg-${color}-50 dark:bg-${color}-500/20 text-${color}-600 dark:text-${color}-400` }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 24 })));
var Input = ({ label, id, className = "", ...props }) => {
  const reactId = useId();
  const inputId = id || `input-${slugifyId(label || props.name || props.placeholder || reactId)}`;
  const ariaLabel = props["aria-label"] || (label ? void 0 : props.placeholder || props.name);
  return /* @__PURE__ */ React.createElement("div", null, label && /* @__PURE__ */ React.createElement("label", { htmlFor: inputId, className: "block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1" }, label), /* @__PURE__ */ React.createElement(
    "input",
    {
      id: inputId,
      "aria-label": ariaLabel,
      className: `w-full p-4 md:p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all placeholder:text-slate-500 dark:placeholder:text-slate-500 ${className}`,
      ...props
    }
  ));
};
var CheckItem = ({ label, checked, onToggle }) => /* @__PURE__ */ React.createElement("button", { onClick: onToggle, className: `w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${checked ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 text-green-800 dark:text-green-400" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-600"}` }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-sm" }, label), checked ? /* @__PURE__ */ React.createElement(Icon, { name: "CheckCircle2", size: 20, className: "text-green-500" }) : /* @__PURE__ */ React.createElement(Icon, { name: "Circle", size: 20 }));
var clampPercent = (value = 0) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
};
var DASHBOARD_PALETTE = {
  emerald: { solid: "#22c55e", strong: "#15803d" },
  amber: { solid: "#f59e0b", strong: "#b45309" },
  red: { solid: "#ef4444", strong: "#b91c1c" },
  purple: { solid: "#9333ea", strong: "#6b21a8" },
  violet: { solid: "#8b5cf6", strong: "#6d28d9" },
  indigo: { solid: "#6366f1", strong: "#4338ca" },
  blue: { solid: "#3b82f6", strong: "#1d4ed8" },
  cyan: { solid: "#06b6d4", strong: "#0e7490" },
  orange: { solid: "#f97316", strong: "#c2410c" },
  fuchsia: { solid: "#d946ef", strong: "#a21caf" },
  stone: { solid: "#78716c", strong: "#44403c" },
  slate: { solid: "#64748b", strong: "#334155" }
};
var getDashboardPalette = (name = "slate") => DASHBOARD_PALETTE[name] || DASHBOARD_PALETTE.slate;
var polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
};
var describeArc = (centerX, centerY, radius, startAngle, endAngle) => {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");
};
var buildRingSegments = (segments, startAngle = -90, totalAngle = 360, gapAngle = 6) => {
  const activeSegments = segments.filter((segment) => segment.value > 0);
  if (activeSegments.length === 0) return [];
  const normalizedGap = activeSegments.length === 1 ? 0 : gapAngle;
  const gapCount = Math.max(activeSegments.length - 1, 0);
  const availableAngle = Math.max(totalAngle - normalizedGap * gapCount, 0);
  const totalValue = activeSegments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  let cursor = startAngle;
  return activeSegments.map((segment, index) => {
    const sweepAngle = Math.min(segment.value / totalValue * availableAngle, 359.999);
    const segmentStart = cursor;
    const segmentEnd = cursor + sweepAngle;
    cursor = segmentEnd + (index < activeSegments.length - 1 ? normalizedGap : 0);
    return { ...segment, startAngle: segmentStart, endAngle: segmentEnd };
  });
};
var CompactMetricBar = ({ label, value, color = "slate", meta, helper }) => {
  const palette = getDashboardPalette(color);
  const safeValue = clampPercent(value);
  return /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "mb-1.5 flex items-start justify-between gap-3" }, /* @__PURE__ */ React.createElement("span", { className: "min-w-0 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400" }, label), /* @__PURE__ */ React.createElement("span", { className: "shrink-0 text-[11px] font-bold", style: { color: palette.strong } }, meta || `${Math.round(safeValue)}%`)), /* @__PURE__ */ React.createElement("div", { className: "h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800" }, /* @__PURE__ */ React.createElement("div", { className: "h-full rounded-full transition-all duration-700", style: { width: `${safeValue}%`, background: `linear-gradient(90deg, ${palette.solid}, ${palette.strong})` } })), helper ? /* @__PURE__ */ React.createElement("p", { className: "mt-1.5 break-words text-[10px] leading-relaxed font-medium text-slate-500 dark:text-slate-400" }, helper) : null);
};
var PortfolioHealthChart = ({ totalClients, contentos, neutrales, enRiesgo }) => {
  const segments = [
    { key: "healthy", label: "Sanos", value: contentos, color: "#22c55e", strong: "#15803d" },
    { key: "neutral", label: "Neutral", value: neutrales, color: "#f59e0b", strong: "#b45309" },
    { key: "risk", label: "Riesgo", value: enRiesgo, color: "#ef4444", strong: "#b91c1c" }
  ];
  const ringSegments = buildRingSegments(segments);
  const healthScore = totalClients > 0 ? Math.round((contentos * 1 + neutrales * 0.55 + enRiesgo * 0.15) / totalClients * 100) : 0;
  const attentionCount = neutrales + enRiesgo;
  const dominantSegment = [...segments].sort((left, right) => right.value - left.value)[0];
  const healthLabel = totalClients === 0 ? "Sin datos" : healthScore >= 75 ? "Estable" : healthScore >= 45 ? "Mixta" : "Fragil";
  return /* @__PURE__ */ React.createElement("div", { className: "mt-5 grid grid-cols-1 gap-5" }, /* @__PURE__ */ React.createElement("div", { className: "relative mx-auto h-44 w-44" }, /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 220 220", className: "h-full w-full" }, /* @__PURE__ */ React.createElement("circle", { cx: "110", cy: "110", r: "70", fill: "none", stroke: "rgba(148,163,184,0.16)", strokeWidth: "20" }), ringSegments.map((segment) => /* @__PURE__ */ React.createElement("path", { key: segment.key, d: describeArc(110, 110, 70, segment.startAngle, segment.endAngle), fill: "none", stroke: segment.color, strokeWidth: "20", strokeLinecap: "round" })), /* @__PURE__ */ React.createElement("circle", { cx: "110", cy: "110", r: "86", fill: "none", stroke: "rgba(148,163,184,0.08)", strokeWidth: "1.5", strokeDasharray: "4 8" })), /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "h-24 w-24 rounded-full border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col items-center justify-center text-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400" }, "Indice"), /* @__PURE__ */ React.createElement("span", { className: "mt-1 text-3xl font-black leading-none text-slate-900 dark:text-white" }, healthScore), /* @__PURE__ */ React.createElement("span", { className: "mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400" }, healthLabel)))), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/50" }, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400" }, "Pulso actual"), /* @__PURE__ */ React.createElement("p", { className: "mt-1 break-words text-lg font-black leading-tight text-slate-900 dark:text-white" }, dominantSegment?.label || "Sin datos"), /* @__PURE__ */ React.createElement("p", { className: "break-words text-xs leading-relaxed font-medium text-slate-500 dark:text-slate-400" }, totalClients > 0 ? Math.round((dominantSegment?.value || 0) / totalClients * 100) : 0, "% de la cartera")), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/50" }, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400" }, "En foco"), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-lg font-black text-slate-900 dark:text-white" }, attentionCount), /* @__PURE__ */ React.createElement("p", { className: "break-words text-xs leading-relaxed font-medium text-slate-500 dark:text-slate-400" }, totalClients > 0 ? Math.round(attentionCount / totalClients * 100) : 0, "% con seguimiento cercano"))), segments.map((segment) => {
    const percent = totalClients > 0 ? Math.round(segment.value / totalClients * 100) : 0;
    return /* @__PURE__ */ React.createElement("div", { key: segment.key, className: "min-w-0 rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/40" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "h-2.5 w-2.5 rounded-full", style: { backgroundColor: segment.color } }), /* @__PURE__ */ React.createElement("span", { className: "truncate text-sm font-bold text-slate-700 dark:text-slate-200" }, segment.label)), /* @__PURE__ */ React.createElement("div", { className: "shrink-0 text-right" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm font-black text-slate-900 dark:text-white" }, segment.value), /* @__PURE__ */ React.createElement("span", { className: "ml-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400" }, percent, "%"))), /* @__PURE__ */ React.createElement("div", { className: "mt-2 h-2.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800" }, /* @__PURE__ */ React.createElement("div", { className: "h-full rounded-full transition-all duration-700", style: { width: `${percent}%`, background: `linear-gradient(90deg, ${segment.color}, ${segment.strong})` } })));
  })));
};
var ProgressOverviewChart = ({ completionPercent, completedTasks, totalTasks, groups }) => {
  const safePercent = clampPercent(completionPercent);
  const pendingTasks = Math.max(totalTasks - completedTasks, 0);
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - safePercent / 100);
  return /* @__PURE__ */ React.createElement("div", { className: "mt-5 grid grid-cols-1 gap-5" }, /* @__PURE__ */ React.createElement("div", { className: "relative mx-auto h-44 w-44" }, /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 220 220", className: "h-full w-full -rotate-90" }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "dashboard-progress-gradient", x1: "0%", y1: "0%", x2: "100%", y2: "100%" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#8b5cf6" }), /* @__PURE__ */ React.createElement("stop", { offset: "55%", stopColor: "#3b82f6" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#06b6d4" }))), /* @__PURE__ */ React.createElement("circle", { cx: "110", cy: "110", r: radius, fill: "none", stroke: "rgba(148,163,184,0.18)", strokeWidth: "18" }), /* @__PURE__ */ React.createElement("circle", { cx: "110", cy: "110", r: radius, fill: "none", stroke: "url(#dashboard-progress-gradient)", strokeWidth: "18", strokeLinecap: "round", strokeDasharray: `${circumference} ${circumference}`, strokeDashoffset: strokeOffset }), /* @__PURE__ */ React.createElement("circle", { cx: "110", cy: "110", r: "86", fill: "none", stroke: "rgba(148,163,184,0.08)", strokeWidth: "1.5", strokeDasharray: "4 8" })), /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "h-24 w-24 rounded-full border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col items-center justify-center text-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400" }, "Avance"), /* @__PURE__ */ React.createElement("span", { className: "mt-1 text-3xl font-black leading-none text-slate-900 dark:text-white" }, Math.round(safePercent), "%"), /* @__PURE__ */ React.createElement("span", { className: "mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400" }, completedTasks, "/", totalTasks)))), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 space-y-3" }, groups.map((group) => {
    const palette = getDashboardPalette(group.color);
    return /* @__PURE__ */ React.createElement("div", { key: group.key, className: "min-w-0 rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/40" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "h-2.5 w-2.5 rounded-full", style: { backgroundColor: palette.solid } }), /* @__PURE__ */ React.createElement("span", { className: "break-words text-sm font-bold leading-tight text-slate-800 dark:text-slate-100" }, group.label)), /* @__PURE__ */ React.createElement("p", { className: "mt-1 break-words pr-2 text-xs leading-relaxed font-medium text-slate-500 dark:text-slate-400" }, group.note)), /* @__PURE__ */ React.createElement("div", { className: "w-16 shrink-0 text-right" }, /* @__PURE__ */ React.createElement("p", { className: "text-lg font-black", style: { color: palette.strong } }, group.percent, "%"), /* @__PURE__ */ React.createElement("p", { className: "break-words text-[10px] leading-tight font-semibold text-slate-500 dark:text-slate-400" }, group.completed, "/", group.total))), /* @__PURE__ */ React.createElement("div", { className: "mt-2.5 h-3 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800" }, /* @__PURE__ */ React.createElement("div", { className: "h-full rounded-full transition-all duration-700", style: { width: `${group.percent}%`, background: `linear-gradient(90deg, ${palette.solid}, ${palette.strong})` } })));
  }), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 gap-2 pt-1" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-2.5 text-center dark:border-slate-800 dark:bg-slate-950/50" }, /* @__PURE__ */ React.createElement("p", { className: "break-words text-[9px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400" }, "Total"), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-lg font-black leading-none text-slate-900 dark:text-white" }, totalTasks)), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-2.5 text-center dark:border-slate-800 dark:bg-slate-950/50" }, /* @__PURE__ */ React.createElement("p", { className: "break-words text-[9px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400" }, "Hechas"), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-lg font-black leading-none text-slate-900 dark:text-white" }, completedTasks)), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-2.5 text-center dark:border-slate-800 dark:bg-slate-950/50" }, /* @__PURE__ */ React.createElement("p", { className: "break-words text-[9px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400" }, "Abiertas"), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-lg font-black leading-none text-slate-900 dark:text-white" }, pendingTasks)))));
};
var DashboardView = ({ clients, managers, events, tasks, accountTasks, managementTasks = [], currentUserProfile, onSignIn }) => {
  const contentos = clients.filter((c) => c.mood === "Contento").length;
  const neutrales = clients.filter((c) => c.mood === "Neutral").length;
  const enRiesgo = clients.filter((c) => c.mood === "En Riesgo").length;
  const realTotalClients = clients.length;
  const totalClients = realTotalClients || 1;
  const completedEditingTasks = tasks.filter((task) => isCompletedStatus(task.status)).length;
  const completedAccountTasks = accountTasks.filter((task) => task.status === "aprobado_internamente" || task.status === "publicado").length;
  const completedManagementTasks = managementTasks.filter((task) => task.status === "cerrado").length;
  const progressGroups = [
    { key: "editing", label: "Edicion", note: "Produccion audiovisual", total: tasks.length, completed: completedEditingTasks, color: "amber" },
    { key: "account", label: "Accounts", note: "Seguimiento comercial", total: accountTasks.length, completed: completedAccountTasks, color: "indigo" },
    { key: "management", label: "Gestion", note: "Operacion interna", total: managementTasks.length, completed: completedManagementTasks, color: "cyan" }
  ].map((group) => ({
    ...group,
    percent: group.total > 0 ? Math.round(group.completed / group.total * 100) : 0
  }));
  const completedTasks = progressGroups.reduce((sum, group) => sum + group.completed, 0);
  const totalTasks = progressGroups.reduce((sum, group) => sum + group.total, 0);
  const compPercent = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
  const todayStr = getHondurasTodayStr();
  const urgentTasks = [
    ...tasks.filter((t) => (t.priority === "urgente" || isDateBeforeDateString(t.date, todayStr)) && t.status !== "aprobado" && t.status !== "publicado").map((t) => ({ ...t, _type: "Edici\xF3n" })),
    ...accountTasks.filter((t) => isDateBeforeDateString(t.date, todayStr) && t.status !== "publicado").map((t) => ({ ...t, _type: "Account" }))
  ].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 6);
  const dateOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  const formattedDate = (/* @__PURE__ */ new Date()).toLocaleDateString("es-HN", dateOptions);
  const managerStats = managers.map((m) => {
    const mTasks = accountTasks.filter((t) => t.contextId === m.id);
    const mCompletedTasksArr = mTasks.filter((t) => t.status === "aprobado_internamente" || t.status === "publicado");
    const mCompletedTasks = mCompletedTasksArr.length;
    let taskScore = 0;
    mCompletedTasksArr.forEach((t) => {
      const h = t.hierarchy || (t.priority === "urgente" ? "p1" : t.priority === "recurrente" ? "p3" : "p2");
      if (h === "p1") taskScore += 10;
      else if (h === "p2") taskScore += 5;
      else taskScore += 2;
    });
    const mClients = clients.filter((c) => c.managerId === m.id);
    let workflowTotal = mClients.length * 4;
    let workflowCompleted = 0;
    mClients.forEach((c) => {
      if (c.workflow?.week1) workflowCompleted++;
      if (c.workflow?.week2) workflowCompleted++;
      if (c.workflow?.week3) workflowCompleted++;
      if (c.workflow?.week4) workflowCompleted++;
    });
    const clientScore = workflowCompleted * 3;
    const finalScore = taskScore + clientScore;
    let mappedColorName = LEGACY_COLOR_MAP[m.color] || m.color || "slate";
    return {
      ...m,
      mappedColor: mappedColorName,
      totalTasks: mTasks.length,
      completedTasks: mCompletedTasks,
      totalClients: mClients.length,
      workflowTotal,
      workflowCompleted,
      taskScore,
      clientScore,
      score: finalScore
    };
  }).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const maxTaskScore = Math.max(...managerStats.map((s) => s.taskScore), 1);
  const maxClientScore = Math.max(...managerStats.map((s) => s.clientScore), 1);
  const maxOverallScore = Math.max(...managerStats.map((s) => s.score), 1);
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-6 animate-in fade-in duration-500" }, /* @__PURE__ */ React.createElement("div", { className: "bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 rounded-3xl p-8 md:p-10 text-white shadow-xl relative overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" }), /* @__PURE__ */ React.createElement("div", { className: "absolute bottom-0 right-1/4 w-40 h-40 bg-purple-400 opacity-20 rounded-full blur-2xl translate-y-1/3" }), /* @__PURE__ */ React.createElement("div", { className: "relative z-10" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-2" }, /* @__PURE__ */ React.createElement("span", { className: "px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10" }, "Resumen Operativo")), /* @__PURE__ */ React.createElement("h2", { className: "text-3xl md:text-4xl font-black mb-2 tracking-tight" }, "\xA1Hola, Equipo Cluster! \u{1F44B}"), /* @__PURE__ */ React.createElement("p", { className: "text-purple-100 font-medium text-sm md:text-base max-w-xl leading-relaxed" }, "Hoy es ", /* @__PURE__ */ React.createElement("span", { className: "capitalize" }, formattedDate), ". Tienes ", /* @__PURE__ */ React.createElement("strong", { className: "text-white" }, urgentTasks.length), " tareas que requieren atenci\xF3n prioritaria. Mant\xE9n el ritmo, ya han completado ", completedTasks, " asignaciones en total.")), /* @__PURE__ */ React.createElement(Icon, { name: "Sparkles", size: 140, className: "absolute -right-8 -top-8 text-white opacity-10 rotate-12" })), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6" }, /* @__PURE__ */ React.createElement(StatCard, { title: "Clientes Activos", value: clients.length, icon: "Briefcase", color: "blue" }), /* @__PURE__ */ React.createElement(StatCard, { title: "Account Managers", value: managers.length, icon: "Users", color: "indigo" }), /* @__PURE__ */ React.createElement(StatCard, { title: "Tareas Accounts", value: accountTasks.filter((t) => t.status !== "publicado").length, icon: "LayoutList", color: "indigo" }), /* @__PURE__ */ React.createElement(StatCard, { title: "Pendientes Edici\xF3n", value: tasks.filter((t) => t.status !== "aprobado" && t.status !== "publicado").length, icon: "Video", color: "amber" })), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 xl:grid-cols-3 gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "xl:col-span-2 space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 h-full" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm self-start" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-black text-slate-800 dark:text-white mb-1" }, "Salud de la Cartera"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400" }, "Distribuci\xF3n seg\xFAn satisfacci\xF3n actual")), /* @__PURE__ */ React.createElement(PortfolioHealthChart, { totalClients: realTotalClients, contentos, neutrales, enRiesgo }), /* @__PURE__ */ React.createElement("div", { className: "hidden" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-1 h-6 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner" }, /* @__PURE__ */ React.createElement("div", { style: { width: `${contentos / totalClients * 100}%` }, className: "bg-green-500 transition-all cursor-help", title: `Contentos: ${contentos}` }), /* @__PURE__ */ React.createElement("div", { style: { width: `${neutrales / totalClients * 100}%` }, className: "bg-amber-400 transition-all cursor-help", title: `Neutrales: ${neutrales}` }), /* @__PURE__ */ React.createElement("div", { style: { width: `${enRiesgo / totalClients * 100}%` }, className: "bg-red-500 animate-pulse transition-all cursor-help", title: `En Riesgo: ${enRiesgo}` })), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between mt-4 text-[10px] font-bold uppercase tracking-wider" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm" }), " ", /* @__PURE__ */ React.createElement("span", { className: "text-slate-600 dark:text-slate-300" }, "Sanos (", contentos, ")")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm" }), " ", /* @__PURE__ */ React.createElement("span", { className: "text-slate-600 dark:text-slate-300" }, "Neutral (", neutrales, ")")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm" }), " ", /* @__PURE__ */ React.createElement("span", { className: "text-slate-600 dark:text-slate-300" }, "Riesgo (", enRiesgo, ")"))))), /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm self-start" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-black text-slate-800 dark:text-white mb-1" }, "Progreso Global"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400" }, "Volumen completado vs general")), /* @__PURE__ */ React.createElement(ProgressOverviewChart, { completionPercent: compPercent, completedTasks, totalTasks, groups: progressGroups }), /* @__PURE__ */ React.createElement("div", { className: "hidden" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-6 overflow-hidden shadow-inner p-1" }, /* @__PURE__ */ React.createElement("div", { style: { width: `${compPercent}%` }, className: "bg-purple-600 h-full rounded-full flex items-center justify-end px-2 transition-all duration-1000 ease-out relative overflow-hidden" })), /* @__PURE__ */ React.createElement("span", { className: "text-3xl font-black text-purple-600 dark:text-purple-400 w-16 text-right" }, compPercent, "%"))))), /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[300px]" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-black text-slate-800 dark:text-white mb-1" }, "Atenci\xF3n Requerida"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400" }, "Urgentes y atrasadas")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black tracking-[0.12em] uppercase text-slate-500 dark:text-slate-400" }, urgentTasks.length), /* @__PURE__ */ React.createElement("div", { className: "p-2.5 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl" }, /* @__PURE__ */ React.createElement(Icon, { name: "Flame", size: 18, className: "animate-pulse" })))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto space-y-2 custom-scroll pr-2" }, urgentTasks.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "Smile", text: "\xA1Todo al d\xEDa! No hay urgencias." }) : urgentTasks.map((t) => /* @__PURE__ */ React.createElement("div", { key: t.id, className: "p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-3 group cursor-pointer min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: `mt-1 w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${isDateBeforeDateString(t.date, todayStr) ? "bg-red-500" : "bg-amber-500"}` }), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "break-words text-sm font-bold leading-tight text-slate-800 dark:text-slate-100 group-hover:text-purple-600 transition-colors" }, t.title), /* @__PURE__ */ React.createElement("div", { className: "mt-1.5 flex flex-wrap items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-[0.14em]" }, t._type), /* @__PURE__ */ React.createElement("span", { className: `text-[9px] font-bold break-words ${isDateBeforeDateString(t.date, todayStr) ? "text-red-500" : "text-slate-500"}` }, "Vence: ", t.date)))))))), /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mt-6" }, /* @__PURE__ */ React.createElement("div", { className: "mb-6 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-black text-slate-800 dark:text-white mb-1 flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icon, { name: "Trophy", size: 20, className: "text-yellow-500" }), " Ranking de Productividad por Account"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400" }, "Rendimiento basado en tareas resueltas y avance en workflows."))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" }, managerStats.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "col-span-full" }, /* @__PURE__ */ React.createElement(EmptyState, { icon: "Users", text: "No hay Accounts para evaluar a\xFAn." })) : managerStats.map((ms, index) => {
    const isTop = index === 0;
    const isSecond = index === 1;
    const isThird = index === 2;
    const palette = getDashboardPalette(ms.mappedColor);
    let medalColor = "text-slate-500";
    let medalBg = "bg-slate-100 dark:bg-slate-800";
    if (isTop) {
      medalColor = "text-yellow-500";
      medalBg = "bg-yellow-50 dark:bg-yellow-500/10 ring-2 ring-yellow-400/50";
    } else if (isSecond) {
      medalColor = "text-slate-500";
      medalBg = "bg-slate-50 dark:bg-slate-500/10 ring-2 ring-slate-300/50";
    } else if (isThird) {
      medalColor = "text-amber-600";
      medalBg = "bg-amber-50 dark:bg-amber-600/10 ring-2 ring-amber-600/50";
    }
    return /* @__PURE__ */ React.createElement("div", { key: ms.id, className: "p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col gap-4 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm relative overflow-hidden min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "absolute inset-x-0 top-0 h-1.5", style: { background: `linear-gradient(90deg, ${palette.solid}, ${palette.strong})` } }), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start gap-3 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex min-w-0 flex-1 items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: `w-8 h-8 shrink-0 flex items-center justify-center font-black rounded-full shadow-sm text-sm ${medalBg} ${medalColor}` }, "#", index + 1), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("h4", { className: "min-w-0 font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "truncate" }, ms.name), isTop && /* @__PURE__ */ React.createElement(Icon, { name: "Sparkles", size: 14, className: "text-yellow-500" })), /* @__PURE__ */ React.createElement("p", { className: "break-words text-[10px] leading-relaxed text-slate-500 font-medium" }, ms.completedTasks, "/", ms.totalTasks, " Tareas | ", ms.totalClients, " Clientes"))), /* @__PURE__ */ React.createElement("div", { className: "text-right shrink-0" }, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400" }, "Score"), /* @__PURE__ */ React.createElement("span", { className: "text-2xl font-black", style: { color: palette.strong } }, ms.score, " pts"))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-3 dark:border-slate-800/80 dark:bg-slate-900/40" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400" }, "Tareas"), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-base font-black text-slate-900 dark:text-white" }, ms.completedTasks, "/", ms.totalTasks), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-medium text-slate-500 dark:text-slate-400" }, "resueltas")), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400" }, "Workflow"), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-base font-black text-slate-900 dark:text-white" }, ms.workflowCompleted, "/", ms.workflowTotal), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-medium text-slate-500 dark:text-slate-400" }, "hitos activos"))), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement(
      CompactMetricBar,
      {
        label: "Ejecucion",
        value: ms.taskScore / maxTaskScore * 100,
        color: ms.mappedColor,
        meta: `${ms.taskScore} pts`,
        helper: ms.totalTasks > 0 ? `${ms.completedTasks} de ${ms.totalTasks} tareas cerradas` : "Sin tareas asignadas"
      }
    ), /* @__PURE__ */ React.createElement(
      CompactMetricBar,
      {
        label: "Workflow",
        value: ms.clientScore / maxClientScore * 100,
        color: ms.mappedColor,
        meta: `${ms.clientScore} pts`,
        helper: ms.workflowTotal > 0 ? `${ms.workflowCompleted} de ${ms.workflowTotal} hitos completados` : "Sin workflow activo"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "hidden" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        style: { width: `${ms.score / maxOverallScore * 100}%` },
        className: `h-full rounded-full transition-all duration-1000 ease-out bg-${ms.mappedColor}-500 ${ms.score > 0 ? "min-w-[0.5rem]" : ""}`
      }
    )));
  }))));
};
var TeamView = ({ title, team, iconColor, onAdd, onSelect, onDelete, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredTeam = team.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-6 fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl md:text-3xl font-black text-slate-800 dark:text-white" }, title), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row w-full md:w-auto gap-3" }, /* @__PURE__ */ React.createElement(SearchBar, { searchTerm, setSearchTerm, placeholder: "Buscar miembro..." }), /* @__PURE__ */ React.createElement(Button, { onClick: onAdd, icon: "UserPlus", color: iconColor }, "Agregar a ", title))), filteredTeam.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 h-64" }, /* @__PURE__ */ React.createElement(EmptyState, { icon: "Users", text: "No hay miembros en este equipo a\xFAn." })) : /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" }, filteredTeam.map((person) => {
    let mappedColorName = LEGACY_COLOR_MAP[person.color] || person.color || "slate";
    const style = PERSON_COLORS[mappedColorName] || PERSON_COLORS.slate;
    return /* @__PURE__ */ React.createElement("div", { key: person.id, onClick: () => onSelect(person), className: "bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer group relative" }, /* @__PURE__ */ React.createElement("div", { className: "absolute top-4 right-4 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" }, /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
      e.stopPropagation();
      onEdit(person);
    }, "aria-label": `Editar ${person.name || "miembro"}`, title: "Editar", className: "text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 p-3 md:p-2 bg-slate-50 dark:bg-slate-800 rounded-full hover:bg-blue-50 dark:hover:bg-slate-700" }, /* @__PURE__ */ React.createElement(Icon, { name: "Edit", size: 16 })), /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
      e.stopPropagation();
      onDelete(person);
    }, "aria-label": `Eliminar ${person.name || "miembro"}`, title: "Eliminar", className: "text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-3 md:p-2 bg-slate-50 dark:bg-slate-800 rounded-full hover:bg-red-50 dark:hover:bg-slate-700" }, /* @__PURE__ */ React.createElement(Icon, { name: "Trash2", size: 16 }))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ React.createElement("div", { className: `h-14 w-14 ${style.bg} rounded-xl flex items-center justify-center text-2xl font-black ${style.text} shadow-sm border border-black/5 dark:border-white/5` }, person.name ? person.name.charAt(0).toUpperCase() : "?"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-lg text-slate-800 dark:text-white pr-16 md:pr-12 truncate" }, person.name), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400 truncate" }, person.email || "Miembro del equipo"))));
  })));
};
var PersonCalendarDetail = ({ person, tasks, title, baseColor, onBack, onAddEvent, onEventClick }) => {
  let mappedColorName = LEGACY_COLOR_MAP[baseColor] || baseColor;
  const style = PERSON_COLORS[mappedColorName] || PERSON_COLORS.slate;
  const parentLabel = title.includes("Cuentas") ? "Account Managers" : "Editores";
  return /* @__PURE__ */ React.createElement("div", { className: "h-full flex flex-col space-y-6 fade-in" }, /* @__PURE__ */ React.createElement(Breadcrumb, { items: [{ label: parentLabel, onClick: onBack }, { label: person.name || "Detalle" }] }), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row items-start md:items-center gap-4" }, /* @__PURE__ */ React.createElement("button", { onClick: onBack, "aria-label": `Volver a ${parentLabel}`, className: "p-3 md:p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300" }, /* @__PURE__ */ React.createElement(Icon, { name: "ChevronLeft" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: `w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-sm border border-black/5 dark:border-white/5 ${style.bg} ${style.text}` }, person.name ? person.name.charAt(0).toUpperCase() : "?"), person.name), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-bold text-slate-500 dark:text-slate-400" }, title))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden" }, /* @__PURE__ */ React.createElement(CalendarGrid, { events: tasks.filter((t) => t.contextId === person.id), baseColor: mappedColorName, onAdd: onAddEvent, onEventClick })));
};
var DateHeader = ({ currentDate, setCurrentDate, filterMode, setFilterMode, ownershipFilter = "all", setOwnershipFilter, title, onAdd, btnColor, btnIcon, searchTerm, setSearchTerm, rangeStart, setRangeStart, rangeEnd, setRangeEnd }) => {
  const today = getHondurasTodayStr();
  const hasRangeSupport = Boolean(setRangeStart && setRangeEnd);
  const effectiveRangeStart = rangeStart || today;
  const effectiveRangeEnd = rangeEnd || today;
  const handleRangeStartChange = (e) => {
    const val = e.target.value;
    setRangeStart(val);
    if (compareDateOnlyStrings(val, effectiveRangeEnd) > 0) setRangeEnd(val);
  };
  const handleRangeEndChange = (e) => {
    const val = e.target.value;
    setRangeEnd(val);
    if (compareDateOnlyStrings(val, effectiveRangeStart) < 0) setRangeStart(val);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col 2xl:flex-row justify-between items-start 2xl:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col lg:flex-row lg:flex-wrap items-start lg:items-center gap-4 w-full min-w-0 2xl:w-auto" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 shrink-0" }, /* @__PURE__ */ React.createElement(Icon, { name: "LayoutList", className: `text-${btnColor}-500 dark:text-${btnColor}-400 hidden md:block`, size: 28 }), /* @__PURE__ */ React.createElement("h2", { className: "text-xl font-black text-slate-800 dark:text-white" }, title)), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col lg:flex-row lg:flex-wrap gap-3 w-full min-w-0 lg:w-auto" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-0.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 px-1" }, "Fecha"), /* @__PURE__ */ React.createElement("div", { className: "flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto max-w-full overflow-x-auto custom-scroll" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setFilterMode("date"), className: `shrink-0 px-4 py-2 text-sm font-bold rounded-lg transition-all ${filterMode === "date" ? `bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm` : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}` }, "D\xEDa espec\xEDfico"), hasRangeSupport && /* @__PURE__ */ React.createElement("button", { onClick: () => setFilterMode("range"), className: `shrink-0 px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-1.5 ${filterMode === "range" ? `bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm` : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}` }, /* @__PURE__ */ React.createElement(Icon, { name: "CalendarRange", size: 14 }), "Rango"), /* @__PURE__ */ React.createElement("button", { onClick: () => setFilterMode("overdue"), className: `shrink-0 px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${filterMode === "overdue" ? `bg-red-500 text-white shadow-sm` : "text-slate-500 dark:text-slate-400 hover:text-red-500"}` }, "Atrasadas ", /* @__PURE__ */ React.createElement(Icon, { name: "Flame", size: 14 })), /* @__PURE__ */ React.createElement("button", { onClick: () => setFilterMode("all"), className: `shrink-0 px-4 py-2 text-sm font-bold rounded-lg transition-all ${filterMode === "all" ? `bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm` : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}` }, "Todas las fechas"))), setOwnershipFilter && /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-0.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 px-1" }, "Asignaci\xF3n"), /* @__PURE__ */ React.createElement("div", { className: "flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto max-w-full overflow-x-auto custom-scroll" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setOwnershipFilter("all"), className: `shrink-0 px-4 py-2 text-sm font-bold rounded-lg transition-all ${ownershipFilter === "all" ? `bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm` : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}` }, "Todo el equipo"), /* @__PURE__ */ React.createElement("button", { onClick: () => setOwnershipFilter("mine"), className: `shrink-0 px-4 py-2 text-sm font-bold rounded-lg transition-all ${ownershipFilter === "mine" ? `bg-${btnColor}-500 text-white shadow-sm` : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}` }, "Asignadas a m\xED")))), filterMode === "date" && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 w-full sm:w-auto" }, /* @__PURE__ */ React.createElement("input", { type: "date", value: currentDate, onChange: (e) => setCurrentDate(e.target.value), className: "min-h-[46px] w-full sm:w-auto text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none" }), currentDate === today && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-bold px-2 py-1 rounded-full shrink-0" }, "Hoy")), filterMode === "range" && hasRangeSupport && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 w-full sm:w-auto flex-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0" }, "Desde"), /* @__PURE__ */ React.createElement("input", { type: "date", value: effectiveRangeStart, onChange: handleRangeStartChange, className: "min-h-[46px] w-full sm:w-auto text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none" })), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0" }, "Hasta"), /* @__PURE__ */ React.createElement("input", { type: "date", value: effectiveRangeEnd, min: effectiveRangeStart, onChange: handleRangeEndChange, className: "min-h-[46px] w-full sm:w-auto text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none" })))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row sm:flex-wrap w-full 2xl:w-auto gap-3 items-stretch sm:items-center" }, /* @__PURE__ */ React.createElement(SearchBar, { searchTerm, setSearchTerm, placeholder: "Buscar tarea..." }), /* @__PURE__ */ React.createElement("div", { className: "w-full sm:w-auto shrink-0" }, /* @__PURE__ */ React.createElement(Button, { onClick: () => onAdd(filterMode === "date" ? currentDate : filterMode === "range" ? effectiveRangeStart : today), color: btnColor, icon: btnIcon, full: true }, "Nueva Tarea"))));
};
var AccountRoomView = ({ tasks, managers, clients, currentUserProfile, onAdd, onEdit, onChangeStatus, onDelete, onTaskClick, legacyColorMap }) => {
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
  } = useTaskRoomState("cluster_account_room_state", { preferMine: Boolean(currentUserProfile?.linkedManagerId) });
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const todayStr = getHondurasTodayStr();
  const columns = [
    { id: "por_disenar", title: "Por Dise\xF1ar", color: "slate", icon: "PenTool" },
    { id: "aprobacion_interna", title: "Aprobaci\xF3n Interna", color: "blue", icon: "Search" },
    { id: "aprobado_internamente", title: "Aprobado Interno", color: "emerald", icon: "CheckCircle2" },
    { id: "publicado", title: "Publicado", color: "indigo", icon: "Sparkles" }
  ];
  const effectiveRangeStart = rangeStart || todayStr;
  const effectiveRangeEnd = rangeEnd || todayStr;
  const filteredTasks = tasks.filter((t) => {
    if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (ownershipFilter === "mine" && !isTaskAssignedToProfile(t, currentUserProfile, [currentUserProfile?.linkedManagerId])) return false;
    if (filterMode === "date") return compareDateOnlyStrings(t.date, currentDate) === 0;
    if (filterMode === "overdue") return isDateBeforeDateString(t.date, todayStr) && t.status !== "publicado";
    if (filterMode === "range") return compareDateOnlyStrings(t.date, effectiveRangeStart) >= 0 && compareDateOnlyStrings(t.date, effectiveRangeEnd) <= 0;
    return true;
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
      clone.style.backgroundColor = document.documentElement.classList.contains("dark") ? "#0f172a" : "#ffffff";
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
      if (task && task.status !== targetStatus) onChangeStatus(task, targetStatus);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "h-full flex flex-col space-y-6 fade-in" }, /* @__PURE__ */ React.createElement(DateHeader, { currentDate, setCurrentDate, filterMode, setFilterMode, ownershipFilter, setOwnershipFilter, title: "Sala de Accounts", onAdd: handleAddTask, btnColor: "indigo", btnIcon: "Plus", searchTerm, setSearchTerm, rangeStart, setRangeStart, rangeEnd, setRangeEnd }), false, /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex md:grid md:grid-cols-4 gap-4 overflow-x-auto md:overflow-hidden pb-4 md:pb-0 snap-x snap-mandatory kanban-mobile-scroll -mx-4 px-4 md:mx-0 md:px-0 min-h-0" }, columns.map((col, colIndex) => {
    const colTasks = filteredTasks.filter((t) => t.status === col.id);
    const prevStatus = colIndex > 0 ? columns[colIndex - 1].id : null;
    const nextStatus = colIndex < columns.length - 1 ? columns[colIndex + 1].id : null;
    const prevLabel = colIndex > 0 ? columns[colIndex - 1].title : "";
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: col.id,
        className: "flex flex-col shrink-0 w-[85vw] sm:w-72 md:w-auto md:shrink bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 h-full overflow-hidden transition-all duration-300 snap-start",
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onDrop: (e) => handleDrop(e, col.id)
      },
      /* @__PURE__ */ React.createElement("div", { className: `p-3 font-black text-[11px] uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-${col.color}-50 dark:bg-${col.color}-500/10 text-${col.color}-700 dark:text-${col.color}-400` }, /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icon, { name: col.icon, size: 13 }), col.title), " ", /* @__PURE__ */ React.createElement("span", { className: "bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400 shadow-sm" }, colTasks.length)),
      /* @__PURE__ */ React.createElement("div", { className: "p-3 flex-1 overflow-y-auto space-y-3 custom-scroll" }, colTasks.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "Inbox", text: "Vac\xEDo" }) : colTasks.map((t) => {
        const manager = managers.find((m) => m.id === t.contextId);
        const client = clients.find((c) => c.id === t.clientId);
        let mappedColorName = legacyColorMap[manager?.color] || manager?.color;
        const mStyles = PERSON_COLORS[mappedColorName] || PERSON_COLORS.slate;
        const isOverdue = isDateBeforeDateString(t.date, todayStr) && col.id !== "publicado";
        return /* @__PURE__ */ React.createElement(
          "div",
          {
            key: t.id,
            onClick: () => onTaskClick(t),
            draggable: "true",
            onDragStart: (e) => handleDragStart(e, t.id),
            onDragEnd: (e) => handleDragEnd(e, t.id),
            className: `bg-white dark:bg-slate-900 p-4 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all group cursor-grab active:cursor-grabbing border-y border-r border-slate-200 dark:border-slate-700 relative overflow-hidden ${isOverdue ? "border-l-red-500 dark:bg-red-950/20" : "border-l-indigo-500"}`
          },
          /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start mb-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1.5 items-start" }, client && /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-black uppercase bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800 flex items-center gap-1 max-w-[140px] truncate" }, /* @__PURE__ */ React.createElement(Icon, { name: "Briefcase", size: 10 }), " ", client.name), /* @__PURE__ */ React.createElement("span", { className: `text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-black/5 dark:border-white/5 ${mStyles.bg} ${mStyles.text}` }, manager ? manager.name : "Sin asignar")), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" }, /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
            e.stopPropagation();
            onEdit(t);
          }, "aria-label": `Editar ${t.title || "tarea"}`, title: "Editar", className: "text-slate-500 hover:text-blue-500 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" }, /* @__PURE__ */ React.createElement(Icon, { name: "Edit", size: 16 })), /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
            e.stopPropagation();
            onDelete(t.id);
          }, "aria-label": `Eliminar ${t.title || "tarea"}`, title: "Eliminar", className: "text-slate-500 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" }, /* @__PURE__ */ React.createElement(Icon, { name: "Trash2", size: 16 })))),
          /* @__PURE__ */ React.createElement("p", { className: "font-bold text-slate-700 dark:text-slate-200 text-sm mb-3 pr-2 leading-tight" }, t.title),
          isOverdue && /* @__PURE__ */ React.createElement("div", { className: "absolute bottom-11 right-2 flex items-center gap-1 text-[9px] font-black text-red-500 bg-red-50 dark:bg-red-900/50 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800" }, "Atrasado ", /* @__PURE__ */ React.createElement(Icon, { name: "Flame", size: 10, className: "animate-pulse" })),
          /* @__PURE__ */ React.createElement("div", { className: "flex gap-1.5 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800" }, prevStatus && /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
            e.stopPropagation();
            onChangeStatus(t, prevStatus);
          }, "aria-label": `Volver a ${prevLabel}`, className: `flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors` }, /* @__PURE__ */ React.createElement(Icon, { name: "ChevronLeft", size: 12 }), " Volver a ", prevLabel), nextStatus && /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
            e.stopPropagation();
            onChangeStatus(t, nextStatus);
          }, className: `flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold bg-${col.color}-50 dark:bg-${col.color}-500/20 text-${col.color}-700 dark:text-${col.color}-400 hover:bg-${col.color}-100 dark:hover:bg-${col.color}-500/30 transition-colors` }, nextStatus === "publicado" ? "Publicar" : "Avanzar", " ", /* @__PURE__ */ React.createElement(Icon, { name: nextStatus === "publicado" ? "CheckCircle2" : "ChevronRight", size: 12 })))
        );
      }))
    );
  })));
};
var EditionsRoomView = ({ tasks, editors, clients, currentUserProfile, onAdd, onEdit, onChangeStatus, onDelete, onTaskClick }) => {
  const {
    currentDate,
    setCurrentDate,
    filterMode,
    setFilterMode,
    ownershipFilter,
    setOwnershipFilter
  } = useTaskRoomState("cluster_editions_room_state", { preferMine: Boolean(currentUserProfile?.linkedEditorId) });
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const todayStr = getHondurasTodayStr();
  const columns = [
    { id: "editar", title: "Por Editar", color: "slate", icon: "PenTool" },
    { id: "en_edicion", title: "En Edici\xF3n", color: "amber", icon: "Video" },
    { id: "revision_interna", title: "En Revisi\xF3n", color: "blue", icon: "Search" },
    { id: "aprobado", title: "Aprobado", color: "emerald", icon: "CheckCircle2" },
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
    if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (ownershipFilter === "mine" && !isTaskAssignedToProfile(t, currentUserProfile, [currentUserProfile?.linkedEditorId])) return false;
    if (filterMode === "date") return compareDateOnlyStrings(t.date, currentDate) === 0;
    if (filterMode === "overdue") return isDateBeforeDateString(t.date, todayStr) && t.status !== "publicado";
    return true;
  });
  const canManageEditingTasks = userHasPermission(currentUserProfile, "manage_editing_tasks");
  const handleAddTask = (dateStr) => {
    const nextDate = normalizeDateOnlyString(dateStr) || todayStr;
    setCurrentDate(nextDate);
    setFilterMode("date");
    onAdd(nextDate);
  };
  const rankedTasks2 = filteredTasks.map((task) => {
    const hierarchy = getEditingHierarchyId(task);
    const delta = task.date ? getDateOnlyDiffDays(task.date, todayStr) : 99;
    const hierarchyScore = hierarchy === "p1" ? 400 : hierarchy === "p2" ? 280 : hierarchy === "p3" ? 170 : 90;
    const priorityBonus = task.priority === "urgente" ? 130 : task.priority === "recurrente" ? 30 : 70;
    const dateBonus = delta < 0 ? 180 : delta === 0 ? 120 : delta === 1 ? 70 : delta <= 3 ? 30 : 0;
    const statusPenalty = task.status === "publicado" ? -250 : task.status === "aprobado" ? -150 : 0;
    return { ...task, hierarchy, rankScore: hierarchyScore + priorityBonus + dateBonus + statusPenalty };
  }).sort((a, b) => b.rankScore - a.rankScore || (a.date || "").localeCompare(b.date || "") || a.title.localeCompare(b.title));
  const rankingMap = rankedTasks2.reduce((acc, task, index) => ({ ...acc, [task.id]: index + 1 }), {});
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
      clone.style.backgroundColor = document.documentElement.classList.contains("dark") ? "#0f172a" : "#ffffff";
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
      if (task && task.status !== targetStatus) onChangeStatus(task, targetStatus);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "h-full flex flex-col space-y-6 fade-in" }, /* @__PURE__ */ React.createElement(DateHeader, { currentDate, setCurrentDate, filterMode, setFilterMode, ownershipFilter, setOwnershipFilter, title: "Sala de Edici\xF3n", onAdd: handleAddTask, btnColor: "amber", btnIcon: "Video", searchTerm, setSearchTerm }), /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex md:grid md:grid-cols-5 gap-4 overflow-x-auto md:overflow-hidden pb-4 md:pb-0 snap-x snap-mandatory kanban-mobile-scroll -mx-4 px-4 md:mx-0 md:px-0 min-h-0" }, columns.map((col, colIndex) => {
    const colTasks = filteredTasks.filter((t) => t.status === col.id);
    const prevStatus = colIndex > 0 ? columns[colIndex - 1].id : null;
    const nextStatus = colIndex < columns.length - 1 ? columns[colIndex + 1].id : null;
    const prevLabel = colIndex > 0 ? columns[colIndex - 1].title : "";
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: col.id,
        className: "flex flex-col shrink-0 w-[85vw] sm:w-72 md:w-auto md:shrink bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 h-full overflow-hidden transition-all duration-300 snap-start",
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onDrop: (e) => handleDrop(e, col.id)
      },
      /* @__PURE__ */ React.createElement("div", { className: `p-3 font-black text-[11px] uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-${col.color}-50 dark:bg-${col.color}-500/10 text-${col.color}-700 dark:text-${col.color}-400` }, /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icon, { name: col.icon, size: 13 }), col.title), " ", /* @__PURE__ */ React.createElement("span", { className: "bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400 shadow-sm" }, colTasks.length)),
      /* @__PURE__ */ React.createElement("div", { className: "p-3 flex-1 overflow-y-auto space-y-3 custom-scroll" }, colTasks.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "Inbox", text: "Vac\xEDo" }) : colTasks.map((t) => {
        const editor = editors.find((e) => e.id === t.contextId);
        const client = clients.find((c) => c.id === t.clientId);
        const pStyle = priorityStyles[t.priority] || priorityStyles.normal;
        const hStyle = hierarchyStyles[t.hierarchy] || hierarchyStyles[getEditingHierarchyId(t)] || hierarchyStyles.p2;
        const eStyles = PERSON_COLORS[editor?.color] || PERSON_COLORS.slate;
        const isOverdue = isDateBeforeDateString(t.date, todayStr) && col.id !== "publicado";
        const hierarchyId = t.hierarchy || getEditingHierarchyId(t);
        const borderLeftColor = isOverdue ? "border-l-red-600" : hierarchyId === "p1" ? "border-l-red-500" : hierarchyId === "p2" ? "border-l-amber-500" : hierarchyId === "p3" ? "border-l-emerald-500" : "border-l-slate-400";
        return /* @__PURE__ */ React.createElement(
          "div",
          {
            key: t.id,
            onClick: () => onTaskClick(t),
            draggable: "true",
            onDragStart: (e) => handleDragStart(e, t.id),
            onDragEnd: (e) => handleDragEnd(e, t.id),
            className: `bg-white dark:bg-slate-900 p-4 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all group cursor-grab active:cursor-grabbing border-y border-r border-slate-200 dark:border-slate-700 relative overflow-hidden ${borderLeftColor} ${isOverdue ? "dark:bg-red-950/10" : ""}`
          },
          /* @__PURE__ */ React.createElement("div", { className: "absolute top-3 right-3 text-[10px] font-black px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300" }, "#", rankingMap[t.id]),
          /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start mb-2 pr-12" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-start gap-1.5" }, client && /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-black uppercase bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800 flex items-center gap-1 max-w-[140px] truncate" }, /* @__PURE__ */ React.createElement(Icon, { name: "Briefcase", size: 10 }), " ", client.name), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("span", { className: `text-[9px] font-black px-2 py-0.5 rounded uppercase border ${hStyle}` }, hierarchyId.toUpperCase()), /* @__PURE__ */ React.createElement("span", { className: `text-[9px] font-bold px-2 py-0.5 rounded uppercase border ${pStyle}` }, t.priority || "Normal"), /* @__PURE__ */ React.createElement("span", { className: `text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-black/5 dark:border-white/5 ${eStyles.bg} ${eStyles.text}` }, editor ? editor.name : "Sin asignar"))), canManageEditingTasks && /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" }, /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
            e.stopPropagation();
            onEdit(t);
          }, "aria-label": `Editar ${t.title || "tarea"}`, title: "Editar", className: "text-slate-500 hover:text-blue-500 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" }, /* @__PURE__ */ React.createElement(Icon, { name: "Edit", size: 16 })), /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
            e.stopPropagation();
            onDelete(t.id);
          }, "aria-label": `Eliminar ${t.title || "tarea"}`, title: "Eliminar", className: "text-slate-500 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" }, /* @__PURE__ */ React.createElement(Icon, { name: "Trash2", size: 16 })))),
          /* @__PURE__ */ React.createElement("p", { className: "font-bold text-slate-800 dark:text-slate-100 text-sm mb-1 leading-tight" }, t.title),
          t.notes && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400 mb-3 truncate max-w-[80%]" }, t.notes),
          isOverdue && /* @__PURE__ */ React.createElement("div", { className: "absolute bottom-12 right-2 flex items-center gap-1 text-[9px] font-black text-red-500 bg-red-50 dark:bg-red-900/50 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800" }, "Atrasado ", /* @__PURE__ */ React.createElement(Icon, { name: "Flame", size: 10, className: "animate-pulse" })),
          canManageEditingTasks && /* @__PURE__ */ React.createElement("div", { className: "flex gap-1.5 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800" }, prevStatus && /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
            e.stopPropagation();
            onChangeStatus(t, prevStatus);
          }, "aria-label": `Volver a ${prevLabel}`, className: `flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors` }, /* @__PURE__ */ React.createElement(Icon, { name: "ChevronLeft", size: 12 }), " Volver a ", prevLabel), nextStatus && /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
            e.stopPropagation();
            onChangeStatus(t, nextStatus);
          }, className: `flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold bg-${col.color}-50 dark:bg-${col.color}-500/20 text-${col.color}-700 dark:text-${col.color}-400 hover:bg-${col.color}-100 dark:hover:bg-${col.color}-500/30 transition-colors` }, nextStatus === "publicado" ? "Publicar" : "Avanzar", " ", /* @__PURE__ */ React.createElement(Icon, { name: nextStatus === "publicado" ? "CheckCircle2" : "ChevronRight", size: 12 })))
        );
      }))
    );
  })));
};
var computeManagementDueBadge = (task) => {
  if (!task?.date || !task?.time || !/^\d{2}:\d{2}$/.test(task.time)) return null;
  const iso = `${task.date}T${task.time}:00-06:00`;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  const diffMs = ms - Date.now();
  const absHours = Math.abs(diffMs) / 36e5;
  if (diffMs >= 0) {
    if (absHours >= 48) return { label: `Vence en ${Math.round(absHours / 24)}d`, tone: "slate" };
    if (absHours >= 1) return { label: `Vence en ${Math.round(absHours)}h`, tone: absHours <= 8 ? "amber" : "slate" };
    const mins = Math.max(1, Math.round(diffMs / 6e4));
    return { label: `Vence en ${mins}m`, tone: "red" };
  }
  if (absHours < 1) return { label: `Vencida hace ${Math.max(1, Math.round(-diffMs / 6e4))}m`, tone: "red" };
  if (absHours < 48) return { label: `Vencida hace ${Math.round(absHours)}h`, tone: "red" };
  return { label: `Vencida hace ${Math.round(absHours / 24)}d`, tone: "red" };
};
var MGMT_CATEGORY_COLORS = {
  seguimiento: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 border-sky-200 dark:border-sky-500/20",
  reunion: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border-purple-200 dark:border-purple-500/20",
  entrega: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 border-orange-200 dark:border-orange-500/20",
  revision: "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300 border-teal-200 dark:border-teal-500/20"
};
var getMgmtCategoryColor = (cat) => MGMT_CATEGORY_COLORS[(cat || "").toLowerCase()] || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
var ManagementRoomView = ({ tasks, members, clients, currentUserProfile, onAdd, onEdit, onChangeStatus, onDelete, onTaskClick }) => {
  const { currentDate, setCurrentDate, filterMode, setFilterMode, ownershipFilter, setOwnershipFilter } = useTaskRoomState("cluster_management_room_state", { preferMine: currentUserProfile?.role === "management" });
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [showTeam, setShowTeam] = useState(false);
  const todayStr = getHondurasTodayStr();
  const columns = [
    { id: "pendiente", title: "Pendiente", color: "slate", icon: "Circle" },
    { id: "en_proceso", title: "En Proceso", color: "violet", icon: "Zap" },
    { id: "en_espera", title: "En Espera", color: "amber", icon: "PauseCircle" },
    { id: "cerrado", title: "Cerrado", color: "emerald", icon: "CheckCircle2" }
  ];
  const filteredTasks = tasks.filter((task) => {
    if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (ownershipFilter === "mine" && !isTaskAssignedToProfile(task, currentUserProfile, [currentUserProfile?.id])) return false;
    if (filterMode === "date") return compareDateOnlyStrings(task.date, currentDate) === 0;
    if (filterMode === "overdue") return isDateBeforeDateString(task.date, todayStr) && task.status !== "cerrado";
    return true;
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
      if (task && task.status !== targetStatus) onChangeStatus(task, targetStatus);
    }
  };
  const membersWithAlert = members.filter((m) => !normalizeEmail(m.email));
  const badgeToneMap = {
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
  };
  return /* @__PURE__ */ React.createElement("div", { className: "h-full flex flex-col gap-4 fade-in" }, /* @__PURE__ */ React.createElement(DateHeader, { currentDate, setCurrentDate, filterMode, setFilterMode, ownershipFilter, setOwnershipFilter, title: "Sala de Gestion", onAdd: handleAddTask, btnColor: "violet", btnIcon: "ShieldCheck", searchTerm, setSearchTerm }), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col lg:flex-row gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 flex-1" }, columns.map((col) => {
    const filteredCount = filteredTasks.filter((t) => t.status === col.id).length;
    const totalCount = tasks.filter((t) => t.status === col.id).length;
    const isFiltered = filteredCount !== totalCount;
    return /* @__PURE__ */ React.createElement("div", { key: col.id, className: "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: `p-2 rounded-lg bg-${col.color}-50 dark:bg-${col.color}-500/20 shrink-0` }, /* @__PURE__ */ React.createElement(Icon, { name: col.icon, size: 16, className: `text-${col.color}-600 dark:text-${col.color}-400` })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-baseline gap-1.5" }, /* @__PURE__ */ React.createElement("p", { className: "text-2xl font-black text-slate-800 dark:text-white leading-none" }, filteredCount), isFiltered && /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-slate-500 dark:text-slate-400" }, "/ ", totalCount)), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5" }, col.title)));
  })), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowTeam((s) => !s),
      className: "flex items-center gap-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shrink-0 self-stretch"
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex -space-x-2 shrink-0" }, members.slice(0, 4).map((m) => /* @__PURE__ */ React.createElement("div", { key: m.id, className: `w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-black text-white ${membersWithAlert.find((a) => a.id === m.id) ? "bg-amber-500" : "bg-violet-500"}` }, (m.name || "?").slice(0, 2).toUpperCase())), members.length > 4 && /* @__PURE__ */ React.createElement("div", { className: "w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-black bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300" }, "+", members.length - 4)),
    /* @__PURE__ */ React.createElement("div", { className: "text-left" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-black text-slate-700 dark:text-slate-200" }, "Equipo"), membersWithAlert.length > 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-bold text-amber-500" }, membersWithAlert.length, " sin email \u2014 ver detalles") : /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-bold text-emerald-500" }, "Todos con email \u2713")),
    /* @__PURE__ */ React.createElement(Icon, { name: showTeam ? "ChevronUp" : "ChevronDown", size: 14, className: "text-slate-500 ml-1" })
  )), showTeam && /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 fade-in" }, members.map((member) => {
    const openCount = tasks.filter((t) => t.contextId === member.id && t.status !== "cerrado").length;
    const hasAlert = !normalizeEmail(member.email);
    return /* @__PURE__ */ React.createElement("div", { key: member.id, className: `flex items-center gap-3 p-3 rounded-xl border ${hasAlert ? "border-amber-200 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/5" : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"}` }, /* @__PURE__ */ React.createElement("div", { className: `w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0 ${hasAlert ? "bg-amber-500" : "bg-violet-500"}` }, (member.name || "?").slice(0, 2).toUpperCase()), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-slate-800 dark:text-white text-sm truncate" }, member.name), /* @__PURE__ */ React.createElement("p", { className: `text-[10px] truncate ${hasAlert ? "text-amber-500 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}` }, hasAlert ? "Sin correo asignado" : member.email)), openCount > 0 && /* @__PURE__ */ React.createElement("span", { className: "shrink-0 text-[10px] font-black bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 px-2 py-1 rounded-full" }, openCount, " activas"));
  })), (filterMode !== "all" || ownershipFilter !== "all" || searchTerm) && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black uppercase tracking-widest text-slate-500" }, "Filtros activos:"), filterMode === "date" && /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1 text-[10px] font-bold bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-500/30" }, /* @__PURE__ */ React.createElement(Icon, { name: "Calendar", size: 9 }), "Fecha: ", currentDate), filterMode === "overdue" && /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1 text-[10px] font-bold bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-500/30" }, /* @__PURE__ */ React.createElement(Icon, { name: "Flame", size: 9 }), "Solo atrasadas"), ownershipFilter === "mine" && /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1 text-[10px] font-bold bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-500/30" }, /* @__PURE__ */ React.createElement(Icon, { name: "User", size: 9 }), "Solo mis tareas"), searchTerm && /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700" }, /* @__PURE__ */ React.createElement(Icon, { name: "Search", size: 9 }), '"', searchTerm, '"'), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-500" }, "\u2014 mostrando ", filteredTasks.length, " de ", tasks.length, " tareas")), /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex md:grid md:grid-cols-4 gap-4 overflow-x-auto md:overflow-hidden pb-4 md:pb-0 snap-x snap-mandatory kanban-mobile-scroll -mx-4 px-4 md:mx-0 md:px-0 min-h-0" }, columns.map((col, colIndex) => {
    const colTasks = filteredTasks.filter((task) => task.status === col.id);
    const prevStatus = colIndex > 0 ? columns[colIndex - 1].id : null;
    const nextStatus = colIndex < columns.length - 1 ? columns[colIndex + 1].id : null;
    const prevLabel = colIndex > 0 ? columns[colIndex - 1].title : "";
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: col.id,
        className: "flex flex-col shrink-0 w-[85vw] sm:w-72 md:w-auto md:shrink bg-slate-100/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 h-full overflow-hidden snap-start",
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onDrop: (e) => handleDrop(e, col.id)
      },
      /* @__PURE__ */ React.createElement("div", { className: `h-1 w-full bg-${col.color}-500 dark:bg-${col.color}-400 shrink-0` }),
      /* @__PURE__ */ React.createElement("div", { className: "px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icon, { name: col.icon, size: 13, className: `text-${col.color}-500 dark:text-${col.color}-400` }), /* @__PURE__ */ React.createElement("span", { className: `font-black text-[11px] uppercase tracking-widest text-${col.color}-700 dark:text-${col.color}-400` }, col.title)), /* @__PURE__ */ React.createElement("span", { className: `text-xs font-black px-2 py-0.5 rounded-full bg-${col.color}-100 dark:bg-${col.color}-500/20 text-${col.color}-700 dark:text-${col.color}-300` }, colTasks.length)),
      /* @__PURE__ */ React.createElement("div", { className: "p-3 flex-1 overflow-y-auto space-y-3 custom-scroll" }, colTasks.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "Inbox", text: "Vac\xEDo" }) : colTasks.map((task) => {
        const member = members.find((m) => m.id === task.contextId);
        const client = clients.find((c) => c.id === task.clientId);
        const isOverdue = isDateBeforeDateString(task.date, todayStr) && col.id !== "cerrado";
        const badge = computeManagementDueBadge(task);
        return /* @__PURE__ */ React.createElement(
          "div",
          {
            key: task.id,
            draggable: "true",
            onDragStart: (e) => handleDragStart(e, task.id),
            onDragEnd: handleDragEnd,
            onClick: () => onTaskClick(task),
            className: `bg-white dark:bg-slate-900 rounded-xl shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group overflow-hidden border border-slate-200 dark:border-slate-700 ${isOverdue ? "ring-1 ring-red-400/60 dark:ring-red-500/40" : ""}`
          },
          /* @__PURE__ */ React.createElement("div", { className: `h-0.5 w-full ${isOverdue ? "bg-red-500" : `bg-${col.color}-400 dark:bg-${col.color}-500`}` }),
          /* @__PURE__ */ React.createElement("div", { className: "p-4 space-y-2.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2 min-h-[20px]" }, task.category ? /* @__PURE__ */ React.createElement("span", { className: `text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${getMgmtCategoryColor(task.category)}` }, task.category) : /* @__PURE__ */ React.createElement("span", null), badge && col.id !== "cerrado" && /* @__PURE__ */ React.createElement("span", { className: `flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${badgeToneMap[badge.tone] || badgeToneMap.slate}` }, /* @__PURE__ */ React.createElement(Icon, { name: badge.tone === "red" ? "AlertTriangle" : "Clock", size: 9 }), badge.label)), /* @__PURE__ */ React.createElement("p", { className: "font-black text-slate-800 dark:text-white text-sm leading-snug" }, task.title), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1.5" }, member && /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1 text-[10px] font-bold bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded border border-violet-100 dark:border-violet-500/20 max-w-[130px] truncate" }, /* @__PURE__ */ React.createElement(Icon, { name: "UserCircle2", size: 9 }), member.name), client && /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1 text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800 max-w-[130px] truncate" }, /* @__PURE__ */ React.createElement(Icon, { name: "Briefcase", size: 9 }), client.name)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement(Icon, { name: "CalendarDays", size: 10, className: isOverdue ? "text-red-400" : "text-slate-500 dark:text-slate-400" }), /* @__PURE__ */ React.createElement("span", { className: `text-[10px] font-bold ${isOverdue ? "text-red-500 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}` }, task.date, task.time ? ` \xB7 ${task.time}` : ""), isOverdue && /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-black text-red-500 dark:text-red-400 uppercase tracking-wider" }, "Vencida")), task.notes && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2" }, task.notes)),
          /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-1 px-3 py-2.5 border-t border-slate-100 dark:border-slate-800" }, prevStatus ? /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
            e.stopPropagation();
            onChangeStatus(task, prevStatus);
          }, "aria-label": `Volver a ${prevLabel}`, className: "flex items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" }, /* @__PURE__ */ React.createElement(Icon, { name: "ChevronLeft", size: 11 }), " Volver a ", prevLabel) : /* @__PURE__ */ React.createElement("span", null), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-0.5" }, /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
            e.stopPropagation();
            onEdit(task);
          }, "aria-label": `Editar ${task.title || "tarea"}`, title: "Editar", className: "p-1.5 rounded-lg text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors opacity-60 group-hover:opacity-100" }, /* @__PURE__ */ React.createElement(Icon, { name: "Edit", size: 13 })), /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
            e.stopPropagation();
            onDelete(task.id);
          }, "aria-label": `Eliminar ${task.title || "tarea"}`, title: "Eliminar", className: "p-1.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-60 group-hover:opacity-100" }, /* @__PURE__ */ React.createElement(Icon, { name: "Trash2", size: 13 })), nextStatus && /* @__PURE__ */ React.createElement("button", { onClick: (e) => {
            e.stopPropagation();
            onChangeStatus(task, nextStatus);
          }, className: `flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-${col.color}-500 hover:bg-${col.color}-600 text-white transition-colors ml-1` }, nextStatus === "cerrado" ? "Cerrar" : "Avanzar", " ", /* @__PURE__ */ React.createElement(Icon, { name: nextStatus === "cerrado" ? "Check" : "ChevronRight", size: 11 }))))
        );
      }))
    );
  })));
};
var UsersAccessView = ({ users, managers, editors, auditLogs, currentUserProfile, onAdd, onEdit, onResendVerification }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredUsers = users.filter((item) => `${item.name || ""} ${item.email || ""} ${item.role || ""}`.toLowerCase().includes(searchTerm.toLowerCase()));
  const verifiedUsers = users.filter((item) => getVerificationMeta(item).isVerified).length;
  const pendingVerificationUsers = users.filter((item) => normalizeEmail(item.email) && !getVerificationMeta(item).isVerified).length;
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-6 fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl md:text-3xl font-black text-slate-800 dark:text-white" }, "Usuarios y Accesos"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1" }, "Permisos por rol, accesos por correo y bitacora de actividad.")), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row w-full md:w-auto gap-3" }, /* @__PURE__ */ React.createElement(SearchBar, { searchTerm, setSearchTerm, placeholder: "Buscar usuario..." }), /* @__PURE__ */ React.createElement(Button, { onClick: onAdd, color: "purple", icon: "UserPlus" }, "Nuevo Usuario"))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" }, /* @__PURE__ */ React.createElement(StatCard, { title: "Usuarios Activos", value: users.filter((item) => item.isActive !== false).length, icon: "Users", color: "purple" }), /* @__PURE__ */ React.createElement(StatCard, { title: "Correos Verificados", value: verifiedUsers, icon: "ShieldCheck", color: "emerald" }), /* @__PURE__ */ React.createElement(StatCard, { title: "Pendientes Verificar", value: pendingVerificationUsers, icon: "Mail", color: "amber" }), /* @__PURE__ */ React.createElement(StatCard, { title: "Admins", value: users.filter((item) => item.isActive !== false && ["super_admin", "operations"].includes(item.role)).length, icon: "ClipboardList", color: "indigo" })), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 xl:grid-cols-[1.05fr,1.3fr] gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-4" }, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-black text-slate-800 dark:text-white" }, "Directorio"), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-black uppercase tracking-wider text-slate-500" }, getRoleMeta(currentUserProfile?.role).label)), /* @__PURE__ */ React.createElement("div", { className: "space-y-3 max-h-[540px] overflow-y-auto custom-scroll pr-2" }, filteredUsers.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "Users", text: "No hay usuarios para este filtro." }) : filteredUsers.map((record) => {
    const verificationMeta = getVerificationMeta(record);
    const linkedManager = managers.find((item) => item.id === record.linkedManagerId);
    const linkedEditor = editors.find((item) => item.id === record.linkedEditorId);
    const linkedLabels = getLinkedProfileLabels(record);
    return /* @__PURE__ */ React.createElement("div", { key: record.id, className: "p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-start gap-4" }, /* @__PURE__ */ React.createElement("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center text-white font-black ${record.isActive === false ? "bg-red-500" : "bg-slate-900 dark:bg-slate-700"}` }, (record.name || "??").slice(0, 2).toUpperCase()), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2 items-center" }, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-slate-800 dark:text-white truncate" }, record.name), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300" }, getRoleMeta(record.role).label), /* @__PURE__ */ React.createElement("span", { className: `text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${verificationMeta.color === "emerald" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" : verificationMeta.color === "amber" ? "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" : verificationMeta.color === "red" ? "bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400" : verificationMeta.color === "blue" ? "bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"}` }, verificationMeta.label), record.isActive === false && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400" }, "Inactivo")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400 truncate mt-2" }, record.email || "Correo pendiente"), record.emailVerification?.lastError && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-red-600 dark:text-red-400 mt-1 break-words" }, record.emailVerification.lastError), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400 mt-1" }, "Ultimo acceso: ", record.lastSeenAt || "Sin registro"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2 mt-3" }, linkedLabels.map((label) => /* @__PURE__ */ React.createElement("span", { key: `${record.id}-${label}`, className: "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300" }, label)), linkedManager && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" }, "AM: ", linkedManager.name), linkedEditor && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold px-2 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300" }, "ED: ", linkedEditor.name))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-2" }, normalizeEmail(record.email) && !verificationMeta.isVerified && /* @__PURE__ */ React.createElement("button", { onClick: () => onResendVerification(record), className: "p-2 text-slate-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-lg transition-colors", title: "Reenviar acceso por correo" }, /* @__PURE__ */ React.createElement(Icon, { name: "Mail", size: 18 })), /* @__PURE__ */ React.createElement("button", { onClick: () => onEdit(record), className: "p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors", title: "Editar usuario" }, /* @__PURE__ */ React.createElement(Icon, { name: "Edit", size: 18 }))));
  }))), /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-4" }, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-black text-slate-800 dark:text-white" }, "Bitacora de Acciones"), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-slate-500 dark:text-slate-400" }, auditLogs.length, " registros")), /* @__PURE__ */ React.createElement("div", { className: "space-y-3 max-h-[540px] overflow-y-auto custom-scroll pr-2" }, auditLogs.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "ClipboardList", text: "Aun no hay actividad registrada." }) : auditLogs.map((log) => /* @__PURE__ */ React.createElement("div", { key: log.id, className: "p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-slate-800 dark:text-white truncate" }, log.description || `${log.action} \xB7 ${log.entityType}`), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2 mt-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300" }, log.action), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400" }, log.entityType), log.status === "error" && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400" }, "Error"), log.status === "denied" && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" }, "Denegado"))), /* @__PURE__ */ React.createElement("div", { className: "text-right" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-500 dark:text-slate-400" }, log.actor?.name || "Sistema"), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-500 dark:text-slate-400" }, log.createdAt || "")))))))));
};
var ClientsView = ({ clients, onAdd, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredClients = clients.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.niche?.toLowerCase().includes(searchTerm.toLowerCase()));
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-6 fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl md:text-3xl font-black text-slate-800 dark:text-white" }, "Cartera de Clientes"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row w-full md:w-auto gap-3" }, /* @__PURE__ */ React.createElement(SearchBar, { searchTerm, setSearchTerm, placeholder: "Buscar cliente o rubro..." }), /* @__PURE__ */ React.createElement(Button, { onClick: onAdd, color: "blue", icon: "Plus" }, "Nuevo Cliente"))), filteredClients.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 h-64" }, /* @__PURE__ */ React.createElement(EmptyState, { icon: "Briefcase", text: "No hay clientes que coincidan." })) : /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" }, filteredClients.map((c) => /* @__PURE__ */ React.createElement("div", { key: c.id, onClick: () => onSelect(c), className: "bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer relative" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "h-14 w-14 bg-blue-50 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center text-2xl font-black text-blue-600 dark:text-blue-400" }, c.name ? c.name.charAt(0).toUpperCase() : "C"), /* @__PURE__ */ React.createElement("div", { className: `w-3 h-3 rounded-full shadow-sm border border-white dark:border-slate-900 ${c.mood === "En Riesgo" ? "bg-red-500 animate-pulse" : c.mood === "Neutral" ? "bg-amber-400" : "bg-green-500"}` })), /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-bold text-slate-800 dark:text-white pr-4 truncate" }, c.name), /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate" }, c.niche || "Sin rubro"), /* @__PURE__ */ React.createElement("div", { className: "pt-4 border-t border-slate-50 dark:border-slate-800 mt-4 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 truncate" }, /* @__PURE__ */ React.createElement(Icon, { name: "UserCircle2", size: 16, className: "text-blue-400 dark:text-blue-500 shrink-0" }), " ", c.manager || "Sin asignar")))));
};
var ClientDetail = ({ client, managers, onReassignManager, onBack, onUpdate, onDelete, onEdit }) => /* @__PURE__ */ React.createElement("div", { className: "space-y-6 max-w-5xl mx-auto fade-in" }, /* @__PURE__ */ React.createElement(Breadcrumb, { items: [{ label: "Clientes", onClick: onBack }, { label: client.name || "Detalle" }] }), /* @__PURE__ */ React.createElement("button", { onClick: onBack, className: "flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-sm uppercase p-2 -ml-2" }, /* @__PURE__ */ React.createElement(Icon, { name: "ChevronLeft", size: 16 }), " Volver a clientes"), /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "bg-slate-900 dark:bg-slate-950 p-6 md:p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative group border-b border-slate-800" }, /* @__PURE__ */ React.createElement("button", { onClick: onEdit, "aria-label": "Editar cliente", className: "absolute top-4 right-4 text-slate-500 hover:text-white p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" }, /* @__PURE__ */ React.createElement(Icon, { name: "Edit", size: 18 })), /* @__PURE__ */ React.createElement("div", { className: "flex items-start md:items-center gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "h-20 w-20 bg-white/10 rounded-2xl flex items-center justify-center text-4xl font-black shadow-inner shrink-0" }, client.name ? client.name.charAt(0).toUpperCase() : "C"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl md:text-3xl font-black" }, client.name), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mt-2 bg-white/5 px-3 py-1.5 rounded-lg inline-flex border border-white/10 relative transition-all hover:bg-white/10" }, /* @__PURE__ */ React.createElement(Icon, { name: "UserCircle2", size: 14, className: "text-blue-300" }), /* @__PURE__ */ React.createElement(
  "select",
  {
    value: client.managerId || "",
    onChange: (e) => onReassignManager(client, e.target.value),
    className: "bg-transparent text-white font-bold text-xs outline-none cursor-pointer appearance-none pr-6 z-10 w-full"
  },
  /* @__PURE__ */ React.createElement("option", { value: "", className: "text-slate-800" }, "Asignar Account Manager..."),
  managers.map((m) => /* @__PURE__ */ React.createElement("option", { key: m.id, value: m.id, className: "text-slate-800" }, m.name))
), /* @__PURE__ */ React.createElement(Icon, { name: "ChevronDown", size: 12, className: "text-blue-300 absolute right-3 pointer-events-none" })))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 bg-white/10 p-1 rounded-xl shrink-0 mt-4 md:mt-0" }, ["Contento", "Neutral", "En Riesgo"].map((m) => /* @__PURE__ */ React.createElement("button", { key: m, onClick: () => onUpdate(client.id, { mood: m }), "aria-label": `Marcar cliente como ${m}`, "aria-pressed": client.mood === m, className: `p-2 rounded-lg ${client.mood === m ? "bg-white/20" : "opacity-50 hover:opacity-100"}` }, /* @__PURE__ */ React.createElement(Icon, { name: m === "Contento" ? "Smile" : m === "Neutral" ? "Meh" : "Frown", className: m === "Contento" ? "text-green-400" : m === "Neutral" ? "text-yellow-400" : "text-red-400" }))))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800" }, /* @__PURE__ */ React.createElement("div", { className: "lg:col-span-2 p-6 md:p-8 space-y-8" }, /* @__PURE__ */ React.createElement("div", { className: "bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800" }, /* @__PURE__ */ React.createElement("h3", { className: "text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icon, { name: "Instagram", size: 14 }), " Redes"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row gap-2" }, /* @__PURE__ */ React.createElement("input", { defaultValue: client.instagram, onBlur: (e) => onUpdate(client.id, { instagram: e.target.value }), placeholder: "Link Instagram...", className: "flex-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-sm px-4 py-3 border outline-none text-slate-800 dark:text-slate-200" }), /* @__PURE__ */ React.createElement("a", { href: client.instagram || "#", target: "_blank", className: "bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 px-4 py-3 rounded-xl font-bold text-sm hover:bg-pink-100 dark:hover:bg-pink-500/20 flex items-center justify-center gap-2" }, "Ver ", /* @__PURE__ */ React.createElement(Icon, { name: "ExternalLink", size: 14 })))), /* @__PURE__ */ React.createElement("button", { onClick: onDelete, className: "text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 text-xs font-bold flex items-center gap-2 p-2 -ml-2" }, /* @__PURE__ */ React.createElement(Icon, { name: "Trash2", size: 14 }), " ELIMINAR CLIENTE")), /* @__PURE__ */ React.createElement("div", { className: "p-6 md:p-8 bg-slate-50/50 dark:bg-slate-900/50" }, /* @__PURE__ */ React.createElement("h3", { className: "text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icon, { name: "CheckCircle2", size: 14 }), " Workflow"), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, ["week1", "week2", "week3", "week4"].map((w, i) => /* @__PURE__ */ React.createElement(CheckItem, { key: w, label: ["Estrategia", "Producci\xF3n", "Aprobaci\xF3n", "Reporte"][i], checked: client.workflow?.[w] || false, onToggle: () => onUpdate(client.id, { [`workflow.${w}`]: !client.workflow?.[w] }) })))))));
var CalendarGrid = ({ events, onAdd, onEventClick, baseColor = "emerald" }) => {
  const [date, setDate] = useState(/* @__PURE__ */ new Date());
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const startDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  let mappedColorName = LEGACY_COLOR_MAP[baseColor] || baseColor;
  const style = PERSON_COLORS[mappedColorName] || PERSON_COLORS.slate;
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900" }, /* @__PURE__ */ React.createElement("div", { className: `font-bold uppercase text-xs tracking-widest text-slate-500 dark:text-slate-400` }, "Vista Mensual"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4 bg-slate-50 dark:bg-slate-800 rounded-lg p-1" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1)), "aria-label": "Mes anterior", className: "p-3 md:p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-300 shadow-sm" }, /* @__PURE__ */ React.createElement(Icon, { name: "ChevronLeft", size: 16 })), /* @__PURE__ */ React.createElement("span", { className: "font-black text-slate-700 dark:text-slate-200 w-32 text-center text-sm uppercase" }, MONTH_NAMES[date.getMonth()], " ", date.getFullYear()), /* @__PURE__ */ React.createElement("button", { onClick: () => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1)), "aria-label": "Mes siguiente", className: "p-3 md:p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-300 shadow-sm" }, /* @__PURE__ */ React.createElement(Icon, { name: "ChevronRight", size: 16 })))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-x-auto overflow-y-auto bg-slate-50 dark:bg-slate-950 custom-scroll" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-7 auto-rows-fr min-w-[800px] h-full" }, ["D", "L", "M", "M", "J", "V", "S"].map((d) => /* @__PURE__ */ React.createElement("div", { key: d, className: "py-2 text-center text-[10px] font-black text-slate-500 dark:text-slate-400 border-r border-b border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10" }, d)), Array(startDay).fill(null).map((_, i) => /* @__PURE__ */ React.createElement("div", { key: `empty-${i}`, className: "border-r border-b border-slate-200/50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30" })), Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
    const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayEvents = events.filter((e) => e.date === dStr);
    return /* @__PURE__ */ React.createElement("div", { key: d, onClick: () => onAdd(dStr), className: "border-r border-b border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 min-h-[120px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group relative" }, /* @__PURE__ */ React.createElement("span", { className: `text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-purple-500 dark:group-hover:text-purple-400` }, d), /* @__PURE__ */ React.createElement("div", { className: "mt-2 space-y-1.5" }, dayEvents.map((e) => {
      const isCompleted = e.status === "publicado" || e.status === "aprobado";
      const itemBg = isCompleted ? "bg-emerald-500" : style.bg;
      const itemText = isCompleted ? "text-white" : style.text;
      const itemBorder = isCompleted ? "border-emerald-600" : "border-black/10 dark:border-white/5";
      return /* @__PURE__ */ React.createElement("div", { key: e.id, onClick: (ev) => {
        ev.stopPropagation();
        onEventClick(e);
      }, className: `text-[10px] sm:text-xs font-bold p-2 rounded-lg border shadow-sm relative group/evt cursor-pointer ${itemBg} ${itemText} ${itemBorder} hover:brightness-110 active:scale-95 transition-all flex items-center justify-between` }, /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1.5 truncate" }, isCompleted && /* @__PURE__ */ React.createElement(Icon, { name: "CheckCircle2", size: 14 }), e.title));
    })), /* @__PURE__ */ React.createElement(Icon, { name: "Plus", className: `absolute bottom-2 right-2 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity`, size: 16 }));
  }))));
};
var GeneralCalendarGrid = ({ activities, onDayClick, onMoveActivity }) => {
  const [viewMode, setViewMode] = useState("month");
  const [date, setDate] = useState(/* @__PURE__ */ new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => (/* @__PURE__ */ new Date()).getFullYear());
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);
  const SHORT_MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const DAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];
  const toDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const todayStr = toDateStr(/* @__PURE__ */ new Date());
  const getWeekDates = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const w = new Date(d);
      w.setDate(d.getDate() + i);
      return w;
    });
  };
  const navPrev = () => viewMode === "week" ? setDate((d) => {
    const n = new Date(d);
    n.setDate(n.getDate() - 7);
    return n;
  }) : setDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const navNext = () => viewMode === "week" ? setDate((d) => {
    const n = new Date(d);
    n.setDate(n.getDate() + 7);
    return n;
  }) : setDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const getDateLabel = () => {
    if (viewMode === "week") {
      const wk = getWeekDates();
      const s = wk[0], e = wk[6];
      if (s.getMonth() === e.getMonth()) return `${s.getDate()} \u2013 ${e.getDate()} ${MONTH_NAMES[s.getMonth()]} ${s.getFullYear()}`;
      return `${s.getDate()} ${SHORT_MONTHS[s.getMonth()]} \u2013 ${e.getDate()} ${SHORT_MONTHS[e.getMonth()]} ${e.getFullYear()}`;
    }
    return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
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
      /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start mb-2" }, /* @__PURE__ */ React.createElement("span", { className: `text-xs font-bold flex items-center justify-center ${isToday ? "bg-blue-500 text-white w-5 h-5 rounded-full" : "text-slate-500 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400"}` }, dateObj.getDate()), dayActivities.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full" }, dayActivities.length)),
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
      !draggedId && /* @__PURE__ */ React.createElement(Icon, { name: "ExternalLink", className: "absolute bottom-2 right-2 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity", size: 14 }),
      isDragOver && /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none" }, /* @__PURE__ */ React.createElement(Icon, { name: "CalendarPlus", className: "text-blue-400 dark:text-blue-500 opacity-60", size: 24 }))
    );
  };
  const weekDates = getWeekDates();
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-wrap gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setViewMode("week"), className: `shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === "week" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}` }, "Semana"), /* @__PURE__ */ React.createElement("button", { onClick: () => setViewMode("month"), className: `shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === "month" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700"}` }, "Mes")), /* @__PURE__ */ React.createElement("button", { onClick: () => setDate(/* @__PURE__ */ new Date()), className: "px-3 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all" }, "Hoy")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-1 relative" }, /* @__PURE__ */ React.createElement("button", { onClick: navPrev, "aria-label": viewMode === "week" ? "Semana anterior" : "Mes anterior", className: "p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-300 transition-colors" }, /* @__PURE__ */ React.createElement(Icon, { name: "ChevronLeft", size: 16 })), /* @__PURE__ */ React.createElement("button", { onClick: () => {
    setPickerYear(date.getFullYear());
    setShowPicker((s) => !s);
  }, className: "font-black text-slate-700 dark:text-slate-200 min-w-[180px] text-center text-sm uppercase hover:text-blue-500 dark:hover:text-blue-400 transition-colors px-2" }, getDateLabel()), /* @__PURE__ */ React.createElement("button", { onClick: navNext, "aria-label": viewMode === "week" ? "Semana siguiente" : "Mes siguiente", className: "p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-300 transition-colors" }, /* @__PURE__ */ React.createElement(Icon, { name: "ChevronRight", size: 16 })), showPicker && /* @__PURE__ */ React.createElement("div", { className: "absolute top-full right-0 mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 w-64", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-3" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setPickerYear((y) => y - 1), "aria-label": "A\xF1o anterior", className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors" }, /* @__PURE__ */ React.createElement(Icon, { name: "ChevronLeft", size: 14 })), /* @__PURE__ */ React.createElement("span", { className: "font-black text-slate-800 dark:text-white text-sm" }, pickerYear), /* @__PURE__ */ React.createElement("button", { onClick: () => setPickerYear((y) => y + 1), "aria-label": "A\xF1o siguiente", className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors" }, /* @__PURE__ */ React.createElement(Icon, { name: "ChevronRight", size: 14 }))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 gap-1.5" }, SHORT_MONTHS.map((m, i) => {
    const isSel = pickerYear === date.getFullYear() && i === date.getMonth();
    return /* @__PURE__ */ React.createElement("button", { key: m, onClick: () => {
      setDate(new Date(pickerYear, i, 1));
      setViewMode("month");
      setShowPicker(false);
    }, className: `py-2 rounded-xl text-xs font-bold transition-all ${isSel ? "bg-blue-500 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"}` }, m);
  }))))), showPicker && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-40", onClick: () => setShowPicker(false) }), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-x-auto overflow-y-auto bg-slate-50 dark:bg-slate-950 custom-scroll" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-7 min-w-[800px] h-full", style: { gridAutoRows: viewMode === "month" ? "1fr" : "auto" } }, DAY_LABELS.map((d, i) => /* @__PURE__ */ React.createElement("div", { key: `hdr-${i}`, className: "py-2 text-center text-[10px] font-black text-slate-500 dark:text-slate-400 border-r border-b border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10" }, viewMode === "week" ? `${d} ${weekDates[i]?.getDate()}` : d)), viewMode === "month" && (() => {
    const startDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return [
      ...Array(startDay).fill(null).map((_, i) => /* @__PURE__ */ React.createElement("div", { key: `empty-${i}`, className: "border-r border-b border-slate-200/50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30" })),
      ...Array.from({ length: daysInMonth }, (_, i) => renderDayCell(new Date(date.getFullYear(), date.getMonth(), i + 1)))
    ];
  })(), viewMode === "week" && weekDates.map((d) => renderDayCell(d)))));
};
var EventActionModal = ({ config, canEdit = true, onClose, onEdit, onDelete }) => {
  const dialogRef = useDialogA11y(config.isOpen, onClose);
  const dialogTitleId = useId();
  if (!config.isOpen || !config.event) return null;
  return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { ref: dialogRef, role: "dialog", "aria-modal": "true", "aria-labelledby": dialogTitleId, tabIndex: -1, className: "bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 outline-none", onClick: (event) => event.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "p-6 text-center border-b border-slate-100 dark:border-slate-800" }, /* @__PURE__ */ React.createElement("div", { className: "mx-auto w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 mb-4" }, /* @__PURE__ */ React.createElement(Icon, { name: "MousePointerClick", size: 24 })), /* @__PURE__ */ React.createElement("h3", { id: dialogTitleId, className: "text-lg font-black text-slate-800 dark:text-white truncate" }, config.event.title || "Elemento"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1" }, "\xBFQu\xE9 deseas hacer?")), /* @__PURE__ */ React.createElement("div", { className: "p-4 space-y-3" }, canEdit ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { onClick: () => {
    onClose();
    onEdit(config.event, config.type);
  }, className: "w-full flex items-center justify-center gap-3 py-4 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors" }, /* @__PURE__ */ React.createElement(Icon, { name: "Edit", size: 20 }), " Editar elemento"), /* @__PURE__ */ React.createElement("button", { onClick: () => {
    onClose();
    onDelete(config.event, config.type);
  }, className: "w-full flex items-center justify-center gap-3 py-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-2xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors" }, /* @__PURE__ */ React.createElement(Icon, { name: "Trash2", size: 20 }), " Eliminar")) : /* @__PURE__ */ React.createElement("div", { className: "rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 text-left" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-sm" }, /* @__PURE__ */ React.createElement(Icon, { name: "Lock", size: 16 }), " Acceso de solo lectura"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-amber-700/80 dark:text-amber-300/80 mt-2" }, "No tienes permisos para editar o eliminar este elemento.")), /* @__PURE__ */ React.createElement("button", { onClick: onClose, className: "w-full py-4 text-slate-500 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors mt-2" }, canEdit ? "Cancelar" : "Cerrar"))));
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
var TaskDetailModal = ({ config, onClose, clients, managers, editors, users, canEdit, onEdit, onChangeStatus, onAddComment, onAddTimeEntry, onUpdateChecklist, onChangePriority, onChangeAssignee, onChangeAssignees, sendNotification, onAddAttachment, onRemoveAttachment, onDelete, currentUserProfile, accountTasks = [], editingTasks = [], managementTasks = [] }) => {
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
  if (!config.isOpen || !config.task) return null;
  const { type } = config;
  const liveArrays = { accountTask: accountTasks, editingTask: editingTasks, managementTask: managementTasks };
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
  const totalLoggedMs = timeEntries.reduce((acc, e) => acc + (e.durationMs || 0), 0);
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
    setMentionedIds((prev) => prev.includes(person.id) ? prev : [...prev, person.id]);
    setMentionOpen(false);
    setMentionQuery("");
    setMentionStart(-1);
    setTimeout(() => commentInputRef.current && commentInputRef.current.focus(), 0);
  };
  const FieldRow = ({ icon, label, children }) => /* @__PURE__ */ React.createElement("div", { className: "flex items-center min-h-[32px] hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg px-2 -mx-2 transition-colors" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 w-40 shrink-0" }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 13, className: "text-slate-500 shrink-0" }), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-500 dark:text-slate-400 font-medium" }, label)), /* @__PURE__ */ React.createElement("div", { className: "flex-1 text-sm" }, children));
  const priorityColors = { urgente: "text-red-500", alta: "text-orange-500", normal: "text-slate-500", baja: "text-slate-300" };
  const PRIORITIES = [
    { id: "urgente", label: "Urgente", color: "text-red-500", iconColor: "#ef4444" },
    { id: "alta", label: "Alta", color: "text-orange-400", iconColor: "#fb923c" },
    { id: "normal", label: "Normal", color: "text-blue-400", iconColor: "#60a5fa" },
    { id: "baja", label: "Baja", color: "text-slate-500", iconColor: "#94a3b8" }
  ];
  const currentPriority = PRIORITIES.find((p) => p.id === task.priority);
  const peoplePool = type === "accountTask" ? managers : type === "editingTask" ? editors : users;
  const allMentionables = [...users || [], ...managers || [], ...editors || []].filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);
  const mentionSuggestions = mentionOpen ? allMentionables.filter((p) => p.name && p.name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 6) : [];
  const FlagIcon = ({ color, filled, size = 13 }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: filled ? color : "none", stroke: color || "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" }), /* @__PURE__ */ React.createElement("line", { x1: "4", y1: "22", x2: "4", y2: "15" }));
  return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-[80] bg-black/60 dark:bg-black/75 flex items-start justify-center pt-8 pb-6 px-4 overflow-y-auto", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { ref: dialogRef, role: "dialog", "aria-modal": "true", "aria-labelledby": dialogTitleId, tabIndex: -1, className: "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden outline-none", style: { maxHeight: "90vh" }, onClick: function(e) {
    e.stopPropagation();
  } }, /* @__PURE__ */ React.createElement("div", { className: "h-11 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-2 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: `flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wide bg-${tagColor}-100 dark:bg-${tagColor}-500/20 text-${tagColor}-700 dark:text-${tagColor}-400` }, /* @__PURE__ */ React.createElement(Icon, { name: iconName, size: 11 }), typeLabel), /* @__PURE__ */ React.createElement(Icon, { name: "ChevronRight", size: 12, className: "text-slate-300 dark:text-slate-600" }), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-500 font-mono" }, task.id?.slice(0, 8)), /* @__PURE__ */ React.createElement("div", { className: "flex-1" }), canAct && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { onClick: () => onEdit(task, type), className: "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" }, /* @__PURE__ */ React.createElement(Icon, { name: "Pencil", size: 11 }), " Editar"), /* @__PURE__ */ React.createElement("button", { onClick: () => onDelete(task, type), className: "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" }, /* @__PURE__ */ React.createElement(Icon, { name: "Trash2", size: 11 }), " Eliminar")), /* @__PURE__ */ React.createElement("button", { onClick: onClose, "aria-label": "Cerrar modal", className: "ml-2 p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" }, /* @__PURE__ */ React.createElement(Icon, { name: "X", size: 16 }))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto custom-scroll bg-white dark:bg-slate-900" }, /* @__PURE__ */ React.createElement("div", { className: "max-w-3xl mx-auto px-8 pt-7 pb-12" }, /* @__PURE__ */ React.createElement("h1", { id: dialogTitleId, className: "text-[22px] font-black text-slate-900 dark:text-white leading-snug mb-5 pr-4" }, task.title), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 mb-7", "data-dropdown": true }, /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => canAct && setStatusOpen((o) => !o),
      className: `flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${STATUS_COLOR_CLASSES[currentStatus?.color || "slate"]} ${canAct ? "cursor-pointer hover:opacity-80" : "cursor-default"} transition-opacity`
    },
    currentStatus?.label || task.status,
    canAct && /* @__PURE__ */ React.createElement(Icon, { name: "ChevronDown", size: 10 })
  ), statusOpen && canAct && /* @__PURE__ */ React.createElement("div", { className: "absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1 min-w-[180px]", "data-dropdown": true }, statuses.map((s) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: s.id,
      onClick: () => {
        onChangeStatus(task, type, s.id);
        setStatusOpen(false);
      },
      className: `w-full flex items-center gap-2.5 px-4 py-2 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left ${task.status === s.id ? "text-purple-600 dark:text-purple-400" : "text-slate-700 dark:text-slate-200"}`
    },
    /* @__PURE__ */ React.createElement("span", { className: `w-2 h-2 rounded-full bg-${s.color}-500 shrink-0` }),
    s.label,
    task.status === s.id && /* @__PURE__ */ React.createElement(Icon, { name: "Check", size: 12, className: "ml-auto text-purple-500" })
  )))), task.createdAt && /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-500 flex items-center gap-1" }, /* @__PURE__ */ React.createElement(Icon, { name: "Clock", size: 11 }), "Creado el ", new Date(task.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" }), " a las ", new Date(task.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }))), /* @__PURE__ */ React.createElement("div", { className: "mb-8" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold uppercase tracking-widest text-slate-500 mb-2" }, "Descripci\xF3n"), task.notes ? /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed" }, task.notes) : /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: canAct ? () => onEdit(task, type) : void 0,
      className: `w-full text-left px-4 py-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-sm text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-500 transition-colors ${canAct ? "cursor-pointer" : ""}`
    },
    canAct ? "+ Agregar descripci\xF3n" : "Sin descripci\xF3n..."
  )), (() => {
    const checklist = Array.isArray(task.checklist) ? task.checklist : [];
    const done = checklist.filter((i) => i.done).length;
    const pct = checklist.length > 0 ? Math.round(done / checklist.length * 100) : 0;
    const toggleItem = (id) => onUpdateChecklist(task, type, checklist.map((i) => i.id === id ? { ...i, done: !i.done } : i));
    const deleteItem = (id) => onUpdateChecklist(task, type, checklist.filter((i) => i.id !== id));
    const addItem = () => {
      if (!newCheckItem.trim()) return;
      onUpdateChecklist(task, type, [...checklist, { id: Math.random().toString(36).slice(2, 10), text: newCheckItem.trim(), done: false }]);
      setNewCheckItem("");
      setAddingCheck(false);
    };
    return /* @__PURE__ */ React.createElement("div", { className: "mb-8" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-3" }, /* @__PURE__ */ React.createElement(Icon, { name: "CheckSquare", size: 13, className: "text-slate-500" }), /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold uppercase tracking-widest text-slate-500" }, "Lista de control"), checklist.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-500 ml-1" }, done, "/", checklist.length), checklist.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "ml-auto text-xs font-bold text-slate-500" }, pct, "%")), checklist.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "h-full bg-emerald-500 rounded-full transition-all duration-500", style: { width: `${pct}%` } })), /* @__PURE__ */ React.createElement("div", { className: "space-y-0.5" }, checklist.map((item) => /* @__PURE__ */ React.createElement("div", { key: item.id, className: "flex items-center gap-3 group py-1.5 px-3 -mx-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => toggleItem(item.id),
        className: `w-[18px] h-[18px] rounded-[4px] border-2 shrink-0 flex items-center justify-center transition-all ${item.done ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-slate-600 hover:border-emerald-400"}`
      },
      item.done && /* @__PURE__ */ React.createElement(Icon, { name: "Check", size: 11, className: "text-white" })
    ), /* @__PURE__ */ React.createElement("span", { className: `flex-1 text-sm ${item.done ? "line-through text-slate-500" : "text-slate-700 dark:text-slate-200"}` }, item.text), /* @__PURE__ */ React.createElement("button", { onClick: () => deleteItem(item.id), className: "opacity-0 group-hover:opacity-100 p-1 rounded text-slate-500 hover:text-red-400 transition-all" }, /* @__PURE__ */ React.createElement(Icon, { name: "X", size: 12 }))))), addingCheck ? /* @__PURE__ */ React.createElement("div", { className: "flex gap-3 items-center mt-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/40" }, /* @__PURE__ */ React.createElement("div", { className: "w-[18px] h-[18px] rounded-[4px] border-2 border-slate-300 dark:border-slate-600 shrink-0" }), /* @__PURE__ */ React.createElement(
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
    ), /* @__PURE__ */ React.createElement("button", { onClick: () => {
      setAddingCheck(false);
      setNewCheckItem("");
    }, className: "text-slate-500 hover:text-slate-600 transition-colors" }, /* @__PURE__ */ React.createElement(Icon, { name: "X", size: 13 }))) : /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => canAct && setAddingCheck(true),
        className: `flex items-center gap-2 mt-2 text-sm text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors px-3 py-1 -mx-3 ${!canAct ? "opacity-40 cursor-default" : ""}`
      },
      /* @__PURE__ */ React.createElement(Icon, { name: "Plus", size: 13 }),
      " Agregar elemento"
    ));
  })(), (() => {
    const attachments = Array.isArray(task.attachments) ? task.attachments : [];
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
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };
    const downloadFile = (att) => {
      const a = document.createElement("a");
      a.href = att.data;
      a.download = att.name;
      a.click();
    };
    const isImage = (att) => att.type && att.type.startsWith("image/");
    return /* @__PURE__ */ React.createElement("div", { className: "mb-8" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-3" }, /* @__PURE__ */ React.createElement(Icon, { name: "Inbox", size: 13, className: "text-slate-500" }), /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold uppercase tracking-widest text-slate-500" }, "Adjuntos"), attachments.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-500 ml-1" }, attachments.length), canAct && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => fileInputRef.current && fileInputRef.current.click(),
        disabled: uploadingFile,
        className: "ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
      },
      uploadingFile ? /* @__PURE__ */ React.createElement(Icon, { name: "Loader2", size: 11, className: "animate-spin" }) : /* @__PURE__ */ React.createElement(Icon, { name: "Plus", size: 11 }),
      uploadingFile ? "Subiendo..." : "Adjuntar"
    )), /* @__PURE__ */ React.createElement("input", { ref: fileInputRef, type: "file", className: "hidden", onChange: handleFileChange, accept: "image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.mp4,.mov" }), attachments.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, attachments.map((att) => /* @__PURE__ */ React.createElement("div", { key: att.id, className: "flex items-center gap-3 group p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/50 transition-colors" }, isImage(att) ? /* @__PURE__ */ React.createElement("img", { src: att.data, alt: att.name, className: "w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700" }) : /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0" }, /* @__PURE__ */ React.createElement(Icon, { name: "FileText", size: 16, className: "text-slate-500" })), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-semibold text-slate-700 dark:text-slate-200 truncate" }, att.name), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500" }, formatFileSize(att.size), " \xB7 ", att.uploadedBy, " \xB7 ", relativeTime(att.uploadedAt))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => downloadFile(att),
        title: "Descargar",
        className: "p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
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
    ))))), attachments.length === 0 && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => canAct && fileInputRef.current && fileInputRef.current.click(),
        className: `flex items-center gap-2 text-sm text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors px-3 py-1 -mx-3 ${!canAct ? "opacity-40 cursor-default" : ""}`
      },
      /* @__PURE__ */ React.createElement(Icon, { name: "Plus", size: 13 }),
      " Adjuntar archivo"
    ));
  })(), /* @__PURE__ */ React.createElement("div", { className: "border-t border-slate-100 dark:border-slate-800 pt-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-5" }, /* @__PURE__ */ React.createElement(Icon, { name: "MessageSquare", size: 13, className: "text-slate-500" }), /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold uppercase tracking-widest text-slate-500" }, "Actividad"), totalLoggedMs > 0 && /* @__PURE__ */ React.createElement("span", { className: "ml-auto text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1" }, /* @__PURE__ */ React.createElement(Icon, { name: "Clock", size: 11 }), formatDuration(totalLoggedMs))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-3 mb-6" }, /* @__PURE__ */ React.createElement("div", { className: "w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-black text-[10px] shrink-0" }, (currentUserProfile?.name || "U").slice(0, 2).toUpperCase()), /* @__PURE__ */ React.createElement("div", { className: "flex-1 relative" }, /* @__PURE__ */ React.createElement(
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
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmitComment();
      },
      placeholder: "Escribe un comentario... usa @ para mencionar (Ctrl+Enter para enviar)",
      rows: commentText ? 3 : 1,
      className: "w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 resize-none text-slate-700 dark:text-slate-200 placeholder-slate-400 transition-all"
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
    /* @__PURE__ */ React.createElement("div", { className: "w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-black text-[9px] shrink-0" }, p.name.slice(0, 2).toUpperCase()),
    /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold text-slate-700 dark:text-slate-200 flex-1 text-left" }, p.name)
  ))), commentText.trim() && /* @__PURE__ */ React.createElement("div", { className: "flex justify-end mt-2" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleSubmitComment,
      disabled: submitting,
      className: "flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg disabled:opacity-60 transition-colors"
    },
    submitting ? /* @__PURE__ */ React.createElement(Icon, { name: "Loader2", size: 12, className: "animate-spin" }) : /* @__PURE__ */ React.createElement(Icon, { name: "Send", size: 12 }),
    submitting ? "Enviando..." : "Comentar"
  )))), /* @__PURE__ */ React.createElement("div", { className: "space-y-5" }, activityFeed.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-500 text-center py-4" }, "Sin actividad a\xFAn"), activityFeed.map((item) => item._kind === "time" ? /* @__PURE__ */ React.createElement("div", { key: item.id, className: "flex gap-3 items-center" }, /* @__PURE__ */ React.createElement("div", { className: "w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center shrink-0" }, /* @__PURE__ */ React.createElement(Icon, { name: "Clock", size: 12, className: "text-emerald-600 dark:text-emerald-400" })), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-700 dark:text-slate-200" }, item.authorName), " ", "registr\xF3", " ", /* @__PURE__ */ React.createElement("span", { className: "font-bold text-emerald-600 dark:text-emerald-400" }, formatDuration(item.durationMs)), /* @__PURE__ */ React.createElement("span", { className: "text-slate-500 text-xs ml-2" }, relativeTime(item.loggedAt)))) : /* @__PURE__ */ React.createElement("div", { key: item.id, className: "flex gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-black text-[9px] shrink-0 mt-0.5" }, (item.authorName || "U").slice(0, 2).toUpperCase()), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-baseline gap-2 mb-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm font-bold text-slate-700 dark:text-slate-200" }, item.authorName || "Usuario"), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-500" }, relativeTime(item.createdAt))), /* @__PURE__ */ React.createElement("div", { className: "bg-slate-50 dark:bg-slate-800 rounded-xl rounded-tl-none px-4 py-3 border border-slate-200 dark:border-slate-700" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-700 dark:text-slate-200 leading-relaxed break-words" }, item.text.split(/(@\S+)/g).map((part, i) => part.startsWith("@") ? /* @__PURE__ */ React.createElement("span", { key: i, className: "text-purple-600 dark:text-purple-400 font-bold" }, part) : part)))))))))), /* @__PURE__ */ React.createElement("div", { className: "w-64 shrink-0 border-l border-slate-200 dark:border-slate-800 overflow-y-auto custom-scroll bg-slate-50 dark:bg-slate-900/50" }, /* @__PURE__ */ React.createElement("div", { className: "p-5 space-y-5" }, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-black uppercase tracking-widest text-slate-500" }, "Detalles"), /* @__PURE__ */ React.createElement("div", { "data-dropdown": true, className: "relative" }, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1" }, "Asignados"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 flex-wrap min-h-[28px] py-0.5 -mx-1 px-1" }, currentAssigneeIds.length > 0 ? currentAssigneeIds.map((uid) => {
    const person = peoplePool.find((p) => p.id === uid);
    if (!person) return null;
    return /* @__PURE__ */ React.createElement("div", { key: uid, className: "flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-full pl-0.5 pr-2 py-0.5 group" }, /* @__PURE__ */ React.createElement("div", { className: "w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-black text-[8px] shrink-0" }, person.name.slice(0, 2).toUpperCase()), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-none" }, person.name.split(" ")[0]), canAct && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => onChangeAssignees(task, type, currentAssigneeIds.filter((id) => id !== uid)),
        className: "ml-0.5 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
      },
      /* @__PURE__ */ React.createElement(Icon, { name: "X", size: 9 })
    ));
  }) : /* @__PURE__ */ React.createElement("span", { className: "text-sm text-slate-500 italic" }, "Sin asignar"), canAct && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setAssigneeOpen((o) => !o),
      className: "w-6 h-6 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-500 hover:border-purple-400 hover:text-purple-500 transition-colors shrink-0"
    },
    /* @__PURE__ */ React.createElement(Icon, { name: "Plus", size: 10 })
  )), assigneeOpen && canAct && /* @__PURE__ */ React.createElement("div", { className: "absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1 w-52", "data-dropdown": true }, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 pt-2 pb-1" }, "Asignar a"), peoplePool.map((p) => {
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
            if (email) sendNotification({ to: email, type: "assigned", senderName: currentUserProfile?.name || "Alguien", taskTitle: task.title, taskType: type });
          }
        },
        className: "w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      },
      /* @__PURE__ */ React.createElement("div", { className: `w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isChecked ? "bg-purple-500 border-purple-500" : "border-slate-300 dark:border-slate-600"}` }, isChecked && /* @__PURE__ */ React.createElement(Icon, { name: "Check", size: 9, className: "text-white" })),
      /* @__PURE__ */ React.createElement("div", { className: "w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-black text-[9px] shrink-0" }, p.name.slice(0, 2).toUpperCase()),
      /* @__PURE__ */ React.createElement("span", { className: `text-sm font-semibold flex-1 ${isChecked ? "text-purple-600 dark:text-purple-400" : "text-slate-700 dark:text-slate-200"}` }, p.name)
    );
  }), currentAssigneeIds.length > 0 && /* @__PURE__ */ React.createElement(
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
  ))), /* @__PURE__ */ React.createElement("div", { "data-dropdown": true, className: "relative" }, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1" }, "Prioridad"), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => canAct && setPriorityOpen((o) => !o),
      className: `flex items-center gap-2 w-full rounded-lg py-1 ${canAct ? "hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" : "cursor-default"} transition-colors -mx-1 px-1`
    },
    /* @__PURE__ */ React.createElement(FlagIcon, { color: currentPriority?.iconColor || "#94a3b8", filled: !!currentPriority }),
    /* @__PURE__ */ React.createElement("span", { className: `text-sm font-semibold ${currentPriority?.color || "text-slate-500 italic"}` }, currentPriority?.label || "Sin prioridad")
  ), priorityOpen && canAct && /* @__PURE__ */ React.createElement("div", { className: "absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1 w-44", "data-dropdown": true }, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 pt-2 pb-1" }, "Prioridad"), PRIORITIES.map((p) => /* @__PURE__ */ React.createElement(
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
    task.priority === p.id && /* @__PURE__ */ React.createElement(Icon, { name: "Check", size: 12, className: "ml-auto text-slate-500" })
  )), task.priority && /* @__PURE__ */ React.createElement(
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
  ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1" }, "Fecha l\xEDmite"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 py-1 -mx-1 px-1" }, /* @__PURE__ */ React.createElement(Icon, { name: "CalendarDays", size: 13, className: "text-slate-500 shrink-0" }), /* @__PURE__ */ React.createElement("span", { className: `text-sm font-semibold ${task.date ? "text-slate-700 dark:text-slate-200" : "text-slate-500 italic"}` }, task.date || "Sin fecha"))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1" }, "Cliente"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 py-1 -mx-1 px-1" }, client ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "w-5 h-5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-[9px] shrink-0" }, client.name?.charAt(0).toUpperCase()), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold text-slate-700 dark:text-slate-200" }, client.name)) : /* @__PURE__ */ React.createElement("span", { className: "text-sm text-slate-500 italic" }, "Interno"))), type === "editingTask" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1" }, "Jerarqu\xEDa"), /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded text-[10px] font-black uppercase border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800" }, getEditingHierarchyId(task).toUpperCase())), type === "managementTask" && task.category && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1" }, "Categor\xEDa"), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-semibold text-slate-700 dark:text-slate-200" }, task.category)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1" }, "Tiempo registrado"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, timerRunning ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" }), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-black text-red-500 dark:text-red-400 tabular-nums" }, formatDuration(timerElapsed)), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleStopTimer,
      disabled: savingTime,
      className: "ml-auto flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-60"
    },
    savingTime ? /* @__PURE__ */ React.createElement(Icon, { name: "Loader2", size: 10, className: "animate-spin" }) : /* @__PURE__ */ React.createElement(Icon, { name: "Square", size: 10 }),
    savingTime ? "..." : "Detener"
  )) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Icon, { name: "Timer", size: 13, className: "text-slate-500" }), /* @__PURE__ */ React.createElement("span", { className: `text-sm ${totalLoggedMs > 0 ? "font-black text-emerald-600 dark:text-emerald-400" : "text-slate-500 italic"}` }, totalLoggedMs > 0 ? formatDuration(totalLoggedMs) : "Sin tiempo"), canAct && /* @__PURE__ */ React.createElement(
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
  ))), timeEntries.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "mt-2 space-y-1" }, [...timeEntries].reverse().slice(0, 3).map((e) => /* @__PURE__ */ React.createElement("div", { key: e.id, className: "flex items-center text-xs gap-2 text-slate-500" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" }), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-600 dark:text-slate-300" }, formatDuration(e.durationMs)), /* @__PURE__ */ React.createElement("span", { className: "truncate" }, e.authorName), /* @__PURE__ */ React.createElement("span", { className: "ml-auto shrink-0" }, relativeTime(e.loggedAt)))))), task.createdAt && /* @__PURE__ */ React.createElement("div", { className: "border-t border-slate-200 dark:border-slate-800 pt-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1" }, "Creado"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400" }, new Date(task.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }), /* @__PURE__ */ React.createElement("br", null), new Date(task.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }))))))));
};
var DayDetailsModal = ({ config, onClose, activities, clients, managers, editors, users, canEditActivity, onEdit, onDelete }) => {
  const dialogRef = useDialogA11y(config.isOpen, onClose);
  const dialogTitleId = useId();
  if (!config.isOpen) return null;
  const dayActivities = activities.filter((a) => a.date === config.date);
  const modalTitles = { client: "Cliente", manager: "Account Manager", editor: "Editor", event: "Produccion", accountTask: "Tarea de Account", editingTask: "Tarea de Edicion", managementTask: "Tarea de Gestion", user: "Usuario" };
  let displayDate = "";
  if (config.date) {
    const [y, m, d] = config.date.split("-");
    displayDate = new Date(y, m - 1, d).toLocaleDateString("es-HN", { weekday: "long", day: "numeric", month: "long" });
  }
  return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { ref: dialogRef, role: "dialog", "aria-modal": "true", "aria-labelledby": dialogTitleId, tabIndex: -1, className: "bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 outline-none", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950 shrink-0" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { id: dialogTitleId, className: "font-black text-lg text-slate-800 dark:text-white capitalize" }, displayDate), /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-500 dark:text-slate-400" }, "Detalle de Actividades")), /* @__PURE__ */ React.createElement("button", { onClick: onClose, "aria-label": "Cerrar modal", className: "p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400" }, /* @__PURE__ */ React.createElement(Icon, { name: "X", size: 20 }))), /* @__PURE__ */ React.createElement("div", { className: "p-6 overflow-y-auto custom-scroll space-y-3" }, dayActivities.length === 0 ? /* @__PURE__ */ React.createElement(EmptyState, { icon: "Inbox", text: "No hay actividades este d\xEDa" }) : dayActivities.map((act) => {
    const client = clients?.find((c) => c.id === act.clientId);
    let personName = "Sin asignar";
    if (act.collectionType === "accountTask") {
      const manager = managers?.find((m) => m.id === act.contextId);
      if (manager) personName = manager.name;
    } else if (act.collectionType === "editingTask") {
      const editor = editors?.find((e) => e.id === act.contextId);
      if (editor) personName = editor.name;
    } else if (act.collectionType === "managementTask") {
      const managementUser = users?.find((u) => u.id === act.contextId);
      if (managementUser) personName = managementUser.name;
    }
    return /* @__PURE__ */ React.createElement("div", { key: `${act.collectionType}-${act.id}`, className: `p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-sm flex items-center gap-4` }, /* @__PURE__ */ React.createElement("div", { className: `p-3 rounded-xl bg-${act._color}-50 dark:bg-${act._color}-500/20 text-${act._color}-600 dark:text-${act._color}-400 shrink-0` }, /* @__PURE__ */ React.createElement(Icon, { name: act._icon, size: 20 })), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-sm text-slate-800 dark:text-white truncate" }, act.title), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-1.5 mt-1.5" }, /* @__PURE__ */ React.createElement("span", { className: `text-[9px] font-black uppercase tracking-wider text-${act._color}-600 dark:text-${act._color}-400` }, act._label), client && /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1 text-[9px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800" }, /* @__PURE__ */ React.createElement(Icon, { name: "Briefcase", size: 8 }), " ", client.name), (act.collectionType === "accountTask" || act.collectionType === "editingTask" || act.collectionType === "managementTask") && /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1 text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700" }, /* @__PURE__ */ React.createElement(Icon, { name: "UserCircle2", size: 8 }), " ", personName), act.status && /* @__PURE__ */ React.createElement("span", { className: `text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border ${act.status === "publicado" || act.status === "aprobado" ? "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"}` }, act.status.replace(/_/g, " ")))), canEditActivity(act.collectionType) && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 opacity-100 md:opacity-60 md:hover:opacity-100 transition-opacity" }, /* @__PURE__ */ React.createElement("button", { onClick: () => {
      onClose();
      onEdit(act, act.collectionType);
    }, className: "p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors", title: "Editar" }, /* @__PURE__ */ React.createElement(Icon, { name: "Edit", size: 18 })), /* @__PURE__ */ React.createElement("button", { onClick: () => {
      onClose();
      onDelete(act, act.collectionType);
    }, className: "p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors", title: "Eliminar" }, /* @__PURE__ */ React.createElement(Icon, { name: "Trash2", size: 18 }))));
  }))));
};
var CreateTaskModal = ({ config, onClose, clients, managers, editors, managementUsers, actions }) => {
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
        setStatus(data.status || "editar");
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
    { id: "urgente", label: "Urgente", iconColor: "#ef4444", color: "text-red-500" },
    { id: "alta", label: "Alta", iconColor: "#fb923c", color: "text-orange-400" },
    { id: "normal", label: "Normal", iconColor: "#60a5fa", color: "text-blue-400" },
    { id: "baja", label: "Baja", iconColor: "#94a3b8", color: "text-slate-500" }
  ];
  const curPriority = TASK_PRIORITIES.find((p) => p.id === priority);
  const FlagIcon = ({ color, filled, size = 12 }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: filled ? color : "none", stroke: color || "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" }), /* @__PURE__ */ React.createElement("line", { x1: "4", y1: "22", x2: "4", y2: "15" }));
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
      if (type === "accountTask") actions.updateAccountTask(data.id, { date, title: title.trim(), time, contextId: assigneeId, clientId, notes, priority });
      if (type === "editingTask") actions.updateEditingTask(data.id, { date, title: title.trim(), priority: priority || "normal", hierarchy, status, notes, contextId: assigneeId, clientId });
      if (type === "managementTask") actions.updateManagementTask(data.id, { date, title: title.trim(), time, contextId: assigneeId, clientId, category, notes, priority, notificationsEnabled: data.notificationsEnabled || false });
    } else {
      if (type === "accountTask") actions.addAccountTask({ date, title: title.trim(), time, contextId: assigneeId, clientId, notes, priority });
      if (type === "editingTask") actions.addEditingTask({ date, title: title.trim(), priority: priority || "normal", hierarchy, status, notes, contextId: assigneeId, clientId });
      if (type === "managementTask") actions.addManagementTask({ date, title: title.trim(), time, contextId: assigneeId, clientId, category, notes, priority, notificationsEnabled: false });
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
      displayDate = new Date(y, m - 1, d).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
    } catch (e) {
    }
  } else if (data?.date) {
    try {
      const [y, m, d] = data.date.split("-");
      displayDate = new Date(y, m - 1, d).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
    } catch (e) {
    }
  }
  return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-[90] flex items-start justify-center pt-12 pb-8 px-4", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { ref: dialogRef, role: "dialog", "aria-modal": "true", "aria-labelledby": dialogTitleId, tabIndex: -1, className: "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-visible outline-none", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("h2", { id: dialogTitleId, className: "sr-only" }, config.isEdit ? `Editar ${typeLabel}` : `Nueva ${typeLabel}`), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 px-6 pt-5 pb-2" }, /* @__PURE__ */ React.createElement("div", { className: `flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wide bg-${tagColor}-100 dark:bg-${tagColor}-500/20 text-${tagColor}-700 dark:text-${tagColor}-400` }, /* @__PURE__ */ React.createElement(Icon, { name: iconName, size: 11 }), " ", config.isEdit ? `Editar ${typeLabel}` : `Nueva ${typeLabel}`), displayDate && /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-500 flex items-center gap-1" }, /* @__PURE__ */ React.createElement(Icon, { name: "CalendarDays", size: 11 }), displayDate), /* @__PURE__ */ React.createElement("div", { className: "flex-1" }), /* @__PURE__ */ React.createElement("button", { onClick: onClose, "aria-label": "Cerrar modal", className: "p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" }, /* @__PURE__ */ React.createElement(Icon, { name: "X", size: 15 }))), /* @__PURE__ */ React.createElement("div", { className: "px-6 py-3" }, /* @__PURE__ */ React.createElement(
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
  )), /* @__PURE__ */ React.createElement("div", { className: "px-6 pb-4" }, showDesc ? /* @__PURE__ */ React.createElement(
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
  )), /* @__PURE__ */ React.createElement("div", { className: "border-t border-slate-100 dark:border-slate-800" }), /* @__PURE__ */ React.createElement("div", { className: "px-6 py-4 flex flex-wrap gap-2.5" }, /* @__PURE__ */ React.createElement("div", { className: "relative", "data-ctdrop": true }, /* @__PURE__ */ React.createElement(
    Chip,
    {
      icon: assignee ? null : "UserCircle2",
      active: !!assignee,
      onClick: () => setAssigneeOpen((o) => !o)
    },
    assignee ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "w-4 h-4 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-black text-[8px]" }, assignee.name.slice(0, 2).toUpperCase()), assignee.name) : "Persona asignada"
  ), assigneeOpen && /* @__PURE__ */ React.createElement("div", { className: "absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1 w-52", "data-ctdrop": true }, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 pt-2 pb-1" }, "Asignar a"), peoplePool.map((p) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: p.id,
      onClick: () => {
        setAssigneeId(assigneeId === p.id ? "" : p.id);
        setAssigneeOpen(false);
      },
      className: "w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
    },
    /* @__PURE__ */ React.createElement("div", { className: "w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-black text-[9px] shrink-0" }, p.name.slice(0, 2).toUpperCase()),
    /* @__PURE__ */ React.createElement("span", { className: `text-sm font-semibold flex-1 ${assigneeId === p.id ? "text-purple-600 dark:text-purple-400" : "text-slate-700 dark:text-slate-200"}` }, p.name),
    assigneeId === p.id && /* @__PURE__ */ React.createElement(Icon, { name: "Check", size: 12, className: "text-purple-500" })
  )))), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(Chip, { icon: "CalendarDays", active: !!date, onClick: () => setDatePickerOpen((o) => !o) }, date || "Fecha l\xEDmite"), datePickerOpen && /* @__PURE__ */ React.createElement("div", { className: "absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 p-3" }, /* @__PURE__ */ React.createElement(
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
    /* @__PURE__ */ React.createElement(FlagIcon, { color: curPriority?.iconColor || "#94a3b8", filled: !!curPriority }),
    /* @__PURE__ */ React.createElement("span", { className: curPriority?.color || "text-slate-600 dark:text-slate-300" }, curPriority?.label || "Prioridad")
  ), priorityOpen && /* @__PURE__ */ React.createElement("div", { className: "absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1 w-44", "data-ctdrop": true }, TASK_PRIORITIES.map((p) => /* @__PURE__ */ React.createElement(
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
    priority === p.id && /* @__PURE__ */ React.createElement(Icon, { name: "Check", size: 12, className: "ml-auto text-slate-500" })
  )))), /* @__PURE__ */ React.createElement("div", { className: "relative", "data-ctdrop": true }, /* @__PURE__ */ React.createElement(Chip, { icon: "Briefcase", active: !!client, onClick: () => {
    setClientOpen((o) => !o);
    setClientSearch("");
  } }, client ? client.name : "Cliente"), clientOpen && /* @__PURE__ */ React.createElement("div", { className: "absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 w-64 overflow-hidden", "data-ctdrop": true }, /* @__PURE__ */ React.createElement("div", { className: "px-3 pt-2.5 pb-1.5 border-b border-slate-100 dark:border-slate-700" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-2.5 py-1.5" }, /* @__PURE__ */ React.createElement(Icon, { name: "Search", size: 12, className: "text-slate-500 shrink-0" }), /* @__PURE__ */ React.createElement(
    "input",
    {
      autoFocus: true,
      value: clientSearch,
      onChange: (e) => setClientSearch(e.target.value),
      placeholder: "Buscar cliente...",
      className: "flex-1 text-sm bg-transparent outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 min-w-0"
    }
  ), clientSearch && /* @__PURE__ */ React.createElement("button", { onClick: () => setClientSearch(""), className: "text-slate-500 hover:text-slate-600" }, /* @__PURE__ */ React.createElement(Icon, { name: "X", size: 11 })))), /* @__PURE__ */ React.createElement("div", { className: "overflow-y-auto", style: { maxHeight: "280px" } }, !clientSearch && /* @__PURE__ */ React.createElement(
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
  ), clients.filter((c) => !clientSearch || c.name.toLowerCase().includes(clientSearch.toLowerCase())).slice(0, 8).map((c) => /* @__PURE__ */ React.createElement(
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
    /* @__PURE__ */ React.createElement("span", { className: `text-sm font-semibold flex-1 text-left truncate ${clientId === c.id ? "text-purple-600 dark:text-purple-400" : "text-slate-700 dark:text-slate-200"}` }, c.name),
    clientId === c.id && /* @__PURE__ */ React.createElement(Icon, { name: "Check", size: 12, className: "text-purple-500 shrink-0" })
  )), clientSearch && clients.filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 && /* @__PURE__ */ React.createElement("p", { className: "px-4 py-3 text-sm text-slate-500 text-center" }, "Sin resultados")))), type === "editingTask" && /* @__PURE__ */ React.createElement(
    "select",
    {
      value: hierarchy,
      onChange: (e) => setHierarchy(e.target.value),
      className: "px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 outline-none cursor-pointer"
    },
    (EDITING_HIERARCHY_OPTIONS || [{ id: "p1", label: "P1" }, { id: "p2", label: "P2" }, { id: "p3", label: "P3" }, { id: "reel", label: "Reel" }, { id: "story", label: "Story" }]).map((o) => /* @__PURE__ */ React.createElement("option", { key: o.id, value: o.id }, o.label || o.id))
  ), type === "managementTask" && /* @__PURE__ */ React.createElement(
    "select",
    {
      value: category,
      onChange: (e) => setCategory(e.target.value),
      className: "px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 outline-none cursor-pointer"
    },
    ["seguimiento", "reunion", "revision", "entrega", "otro"].map((c) => /* @__PURE__ */ React.createElement("option", { key: c, value: c }, c.charAt(0).toUpperCase() + c.slice(1)))
  ), (type === "accountTask" || type === "managementTask") && /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "time",
      value: time,
      onChange: (e) => setTime(e.target.value),
      title: "Hora",
      className: "px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 outline-none cursor-pointer w-[110px]"
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl" }, /* @__PURE__ */ React.createElement("button", { onClick: onClose, className: "text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors px-4 py-2" }, "Cancelar"), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleSubmit,
      disabled: !title.trim(),
      className: `flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-${tagColor}-600 hover:bg-${tagColor}-700 shadow-sm`
    },
    /* @__PURE__ */ React.createElement(Icon, { name: config.isEdit ? "Save" : "Plus", size: 14 }),
    config.isEdit ? "Guardar cambios" : `Crear ${typeLabel}`
  ))), confirmNoDate && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-4", onClick: () => setConfirmNoDate(false) }, /* @__PURE__ */ React.createElement("div", { role: "alertdialog", "aria-modal": "true", "aria-labelledby": "confirm-no-date-title", className: "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-6 flex flex-col gap-4", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0" }, /* @__PURE__ */ React.createElement(Icon, { name: "CalendarOff", size: 18, className: "text-amber-500" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { id: "confirm-no-date-title", className: "font-black text-slate-800 dark:text-white text-base" }, "\xBFSin fecha l\xEDmite?"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1" }, "Esta tarea no tendr\xE1 una fecha de vencimiento asignada. Podr\xE1s agregarla despu\xE9s."))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 justify-end" }, /* @__PURE__ */ React.createElement(
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
  )))));
};
var Modal = ({ config, onClose, clients, managers, editors, managementUsers, actions }) => {
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
      if (type === "client") actions.updateClient(data.id, { name: fd.name || "", niche: fd.niche || "", package: fd.package || "", instagram: fd.instagram || "", managerId: fd.managerId || "" });
      if (type === "manager") actions.updateManager(data.id, { name: fd.name || "", email: fd.email || "" });
      if (type === "editor") actions.updateEditor(data.id, { name: fd.name || "", email: fd.email || "" });
      if (type === "event") actions.updateEvent(data.id, { title: buildEventTitle(fd.title, fd.time) });
      if (type === "accountTask") actions.updateAccountTask(data.id, { title: fd.title || "", time: fd.time || data.time || "", contextId: fd.manager || data.contextId || "", clientId: fd.clientId || "", notes: fd.notes || "" });
      if (type === "editingTask") actions.updateEditingTask(data.id, { title: fd.title || "", priority: fd.priority || "normal", hierarchy: fd.hierarchy || "p2", status: fd.status || data.status || "editar", notes: fd.notes || "", contextId: fd.editor || data.contextId || "", clientId: fd.clientId || "" });
      if (type === "managementTask") actions.updateManagementTask(data.id, { date: fd.date || data.date || "", title: fd.title || "", time: fd.time || data.time || "", contextId: fd.member || data.contextId || "", clientId: fd.clientId || "", category: fd.category || "seguimiento", notes: fd.notes || "", notificationsEnabled: fd.notificationsEnabled === "on" });
      if (type === "user") actions.updateUserRecord(data.id, { name: fd.name || "", email: fd.email || "", role: fd.role || "viewer", isActive: fd.isActive === "true" });
    } else {
      if (type === "client") actions.addClient({ name: fd.name || "", niche: fd.niche || "", package: fd.package || "", instagram: fd.instagram || "", managerId: fd.managerId || "" });
      if (type === "manager") actions.addManager({ name: fd.name || "", email: fd.email || "", assignedAccounts: [] });
      if (type === "editor") actions.addEditor({ name: fd.name || "", email: fd.email || "" });
      if (type === "event") actions.addEvent({ date: data.date, title: buildEventTitle(fd.title, fd.time), type: data.type });
      if (type === "accountTask") actions.addAccountTask({ date: data.date, title: fd.title || "", time: fd.time || "", contextId: fd.manager || data.contextId || "", clientId: fd.clientId || "", notes: fd.notes || "" });
      if (type === "editingTask") actions.addEditingTask({ date: data.date, title: fd.title || "", priority: fd.priority || "normal", hierarchy: fd.hierarchy || "p2", status: fd.status || "editar", notes: fd.notes || "", contextId: fd.editor || data.contextId || "", clientId: fd.clientId || "" });
      if (type === "managementTask") actions.addManagementTask({ date: fd.date || data.date || "", title: fd.title || "", time: fd.time || "", contextId: fd.member || data.contextId || "", clientId: fd.clientId || "", category: fd.category || "seguimiento", notes: fd.notes || "", notificationsEnabled: fd.notificationsEnabled === "on" });
      if (type === "user") actions.addUserRecord({ name: fd.name || "", email: fd.email || "", role: fd.role || "viewer", isActive: fd.isActive === "true" });
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
    displayDate = new Date(y, m - 1, d).toLocaleDateString("es-HN", { weekday: "long", day: "numeric", month: "long" });
  }
  return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[90] flex items-center justify-center p-4 animate-in fade-in duration-200", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { ref: dialogRef, role: "dialog", "aria-modal": "true", "aria-labelledby": dialogTitleId, tabIndex: -1, className: "bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 outline-none", onClick: (event) => event.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950 shrink-0" }, /* @__PURE__ */ React.createElement("h3", { id: dialogTitleId, className: "font-bold text-lg text-slate-800 dark:text-white" }, isEdit ? "Editar " : "Nuevo ", titles[type]), /* @__PURE__ */ React.createElement("button", { onClick: onClose, "aria-label": "Cerrar modal", className: "p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400" }, /* @__PURE__ */ React.createElement(Icon, { name: "X", size: 20 }))), /* @__PURE__ */ React.createElement("div", { className: "p-6 overflow-y-auto custom-scroll" }, /* @__PURE__ */ React.createElement("form", { onSubmit, className: "space-y-4" }, ["event", "accountTask", "editingTask", "managementTask"].includes(type) && !isEdit && /* @__PURE__ */ React.createElement("div", { className: "text-center p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 mb-2" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase" }, "Para el d\xEDa"), /* @__PURE__ */ React.createElement("p", { className: "text-lg font-black text-slate-800 dark:text-white capitalize" }, displayDate)), type === "client" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Input, { name: "name", placeholder: "Nombre", defaultValue: data?.name, required: true }), /* @__PURE__ */ React.createElement(Input, { name: "niche", placeholder: "Rubro", defaultValue: data?.niche, required: true }), /* @__PURE__ */ React.createElement(Input, { name: "package", placeholder: "Paquete", defaultValue: data?.package, required: true }), /* @__PURE__ */ React.createElement(Input, { name: "instagram", placeholder: "Link Instagram", defaultValue: data?.instagram }), /* @__PURE__ */ React.createElement("select", { name: "managerId", defaultValue: data?.managerId, className: "w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none" }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Asignar Manager (Opcional)"), managers.map((m) => /* @__PURE__ */ React.createElement("option", { key: m.id, value: m.id }, m.name)))), type === "manager" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Input, { name: "name", placeholder: "Nombre Completo", defaultValue: data?.name, required: true }), /* @__PURE__ */ React.createElement(Input, { name: "email", type: "email", placeholder: "Correo", defaultValue: data?.email, required: true })), type === "editor" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Input, { name: "name", placeholder: "Nombre del Editor", defaultValue: data?.name, required: true }), /* @__PURE__ */ React.createElement(Input, { name: "email", type: "email", placeholder: "Correo", defaultValue: data?.email, required: true })), type === "event" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Input, { name: "title", placeholder: "Nombre Producci\xF3n", defaultValue: eventDefaultTitle, required: true, autoFocus: true }), /* @__PURE__ */ React.createElement(Input, { name: "time", type: "time", label: "Hora (Opcional)", defaultValue: eventDefaultTime })), type === "accountTask" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Input, { name: "title", placeholder: "\xBFQu\xE9 hay que hacer/publicar?", defaultValue: data?.title, required: true, autoFocus: true }), /* @__PURE__ */ React.createElement("select", { name: "clientId", defaultValue: data?.clientId || "", className: "w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none" }, /* @__PURE__ */ React.createElement("option", { value: "" }, "\u{1F4BC} Sin cliente (Tarea interna)"), clients.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, c.name))), /* @__PURE__ */ React.createElement(Input, { name: "time", type: "time", label: "Hora (Opcional)", defaultValue: data?.time || "" }), /* @__PURE__ */ React.createElement("select", { name: "manager", required: true, defaultValue: data?.contextId || "", className: "w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none" }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Selecciona Manager..."), managers.map((m) => /* @__PURE__ */ React.createElement("option", { key: m.id, value: m.id }, m.name))), /* @__PURE__ */ React.createElement("textarea", { name: "notes", placeholder: "Notas, copies, ideas...", defaultValue: data?.notes, className: "w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-500 dark:placeholder:text-slate-500 h-24 text-sm" })), type === "editingTask" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Input, { name: "title", placeholder: "T\xEDtulo del Video/Dise\xF1o", defaultValue: data?.title, required: true, autoFocus: true }), /* @__PURE__ */ React.createElement("select", { name: "clientId", defaultValue: data?.clientId || "", className: "w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none" }, /* @__PURE__ */ React.createElement("option", { value: "" }, "\u{1F4BC} Sin cliente (Tarea interna)"), clients.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, c.name))), /* @__PURE__ */ React.createElement("select", { name: "priority", required: true, defaultValue: data?.priority || "normal", className: "w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-700 dark:text-slate-200" }, /* @__PURE__ */ React.createElement("option", { value: "normal", className: "text-amber-600 dark:text-amber-400" }, "\u{1F7E1} Prioridad Normal"), /* @__PURE__ */ React.createElement("option", { value: "urgente", className: "text-red-600 dark:text-red-400" }, "\u{1F534} URGENTE"), /* @__PURE__ */ React.createElement("option", { value: "recurrente", className: "text-emerald-600 dark:text-emerald-400" }, "\u{1F7E2} Recurrente")), /* @__PURE__ */ React.createElement("select", { name: "hierarchy", required: true, defaultValue: data?.hierarchy || getEditingHierarchyId(data || {}), className: "w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-700 dark:text-slate-200" }, EDITING_HIERARCHY_OPTIONS.map((option) => /* @__PURE__ */ React.createElement("option", { key: option.id, value: option.id }, option.label))), /* @__PURE__ */ React.createElement("select", { name: "status", required: true, defaultValue: data?.status || "editar", className: "w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-700 dark:text-slate-200" }, EDITING_STATUS_OPTIONS.map((option) => /* @__PURE__ */ React.createElement("option", { key: option.id, value: option.id }, option.label))), /* @__PURE__ */ React.createElement("select", { name: "editor", required: true, defaultValue: data?.contextId || "", className: "w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none" }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Selecciona Editor..."), editors.map((e) => /* @__PURE__ */ React.createElement("option", { key: e.id, value: e.id }, e.name))), /* @__PURE__ */ React.createElement("textarea", { name: "notes", placeholder: "Notas, links a drive...", defaultValue: data?.notes, className: "w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-500 dark:placeholder:text-slate-500 h-24 text-sm" })), type === "managementTask" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Input, { name: "title", placeholder: "Titulo de la gestion", defaultValue: data?.title, required: true, autoFocus: true }), /* @__PURE__ */ React.createElement(Input, { name: "date", type: "date", label: "Fecha limite *", defaultValue: data?.date || getHondurasTodayStr(), required: true }), /* @__PURE__ */ React.createElement("select", { name: "clientId", defaultValue: data?.clientId || "", className: `${selectClassName} font-bold` }, /* @__PURE__ */ React.createElement("option", { value: "" }, "Sin cliente asociado"), clients.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, c.name))), /* @__PURE__ */ React.createElement(Input, { name: "time", type: "time", label: "Hora limite *", defaultValue: data?.time || "", required: true }), /* @__PURE__ */ React.createElement("select", { name: "member", required: true, defaultValue: data?.contextId || "", className: selectClassName }, /* @__PURE__ */ React.createElement("option", { value: "" }, managementUsers.length > 0 ? "Selecciona integrante..." : "Cargando integrantes..."), managementUsers.map((member) => /* @__PURE__ */ React.createElement("option", { key: member.id, value: member.id }, member.name, member.email ? ` (${member.email})` : ""))), /* @__PURE__ */ React.createElement("select", { name: "category", defaultValue: data?.category || "seguimiento", className: `${selectClassName} font-bold` }, /* @__PURE__ */ React.createElement("option", { value: "seguimiento" }, "Seguimiento"), /* @__PURE__ */ React.createElement("option", { value: "coordinacion" }, "Coordinacion"), /* @__PURE__ */ React.createElement("option", { value: "aprobacion" }, "Aprobacion"), /* @__PURE__ */ React.createElement("option", { value: "soporte" }, "Soporte")), /* @__PURE__ */ React.createElement("textarea", { name: "notes", placeholder: "Detalle de la gestion, acuerdos o proximos pasos...", defaultValue: data?.notes, className: textareaClassName }), /* @__PURE__ */ React.createElement("label", { className: "flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 cursor-pointer" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      name: "notificationsEnabled",
      defaultChecked: data?.notificationsEnabled !== false,
      className: "w-4 h-4 accent-violet-600"
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "flex-1" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-slate-700 dark:text-slate-200" }, "Recordar por correo"), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500 dark:text-slate-400" }, "Envia avisos al asignado 8 horas antes, al vencer y cada 24 horas si sigue abierta."))), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500 dark:text-slate-400 -mt-2" }, "El integrante asignado debe tener correo para que esta automatizacion funcione.")), type === "user" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Input, { name: "name", placeholder: "Nombre completo", defaultValue: data?.name, required: true, autoFocus: true }), /* @__PURE__ */ React.createElement(Input, { name: "email", type: "email", placeholder: "Correo autorizado", defaultValue: data?.email, required: true }), /* @__PURE__ */ React.createElement("select", { name: "role", defaultValue: data?.role || "viewer", className: `${selectClassName} font-bold` }, Object.entries(ROLE_DEFINITIONS).map(([roleId, roleMeta]) => /* @__PURE__ */ React.createElement("option", { key: roleId, value: roleId }, roleMeta.label))), /* @__PURE__ */ React.createElement("select", { name: "isActive", defaultValue: data?.isActive === false ? "false" : "true", className: `${selectClassName} font-bold` }, /* @__PURE__ */ React.createElement("option", { value: "true" }, "Activo"), /* @__PURE__ */ React.createElement("option", { value: "false" }, "Inactivo"))), /* @__PURE__ */ React.createElement(Button, { type: "submit", full: true, color: submitColor }, isEdit ? "Guardar Cambios" : "Crear")))));
};
var DeleteConfirmModal = ({ config, onClose, onConfirm }) => {
  const dialogRef = useDialogA11y(config.isOpen, onClose);
  const dialogTitleId = useId();
  return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { ref: dialogRef, role: "alertdialog", "aria-modal": "true", "aria-labelledby": dialogTitleId, tabIndex: -1, className: "bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 outline-none", onClick: (event) => event.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400" }, /* @__PURE__ */ React.createElement(Icon, { name: "AlertTriangle", size: 32 })), /* @__PURE__ */ React.createElement("h3", { id: dialogTitleId, className: "text-lg font-black text-slate-800 dark:text-white mb-2" }, "\xBFEliminar ", config.title, "?"), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400 mb-8" }, "Esta acci\xF3n es permanente y no se puede deshacer."), /* @__PURE__ */ React.createElement("div", { className: "flex gap-3" }, /* @__PURE__ */ React.createElement("button", { onClick: onClose, className: "flex-1 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" }, "Cancelar"), /* @__PURE__ */ React.createElement("button", { onClick: onConfirm, className: "flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 shadow-lg shadow-red-500/30 transition-colors" }, "Confirmar"))));
};
var Toast = ({ message, type }) => /* @__PURE__ */ React.createElement("div", { role: type === "error" ? "alert" : "status", className: `pointer-events-auto px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 fade-in ${type === "error" ? "bg-red-600 text-white" : "bg-slate-800 dark:bg-white text-white dark:text-slate-900"}` }, /* @__PURE__ */ React.createElement(Icon, { name: type === "success" ? "CheckCircle2" : "AlertTriangle", size: 20, className: type === "success" ? "text-green-400" : "" }), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-sm" }, message));
var ReportStatCard = ({ label, value, color, icon, sub }) => /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-black uppercase tracking-widest text-slate-500" }, label), /* @__PURE__ */ React.createElement("div", { className: `w-8 h-8 rounded-xl bg-${color}-50 dark:bg-${color}-500/20 flex items-center justify-center` }, /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 16, className: `text-${color}-500` }))), /* @__PURE__ */ React.createElement("p", { className: `text-3xl font-black text-${color}-600 dark:text-${color}-400` }, value), sub && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500" }, sub));
var ReportsView = ({ accountTasks, editingTasks, managementTasks, clients, managers, editors, users = [] }) => {
  const todayStr = getHondurasTodayStr();
  const now = /* @__PURE__ */ new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate, setToDate] = useState(todayStr);
  const [activeTab, setActiveTab] = useState("content");
  const inRange = (dateStr) => {
    if (!dateStr) return false;
    return compareDateOnlyStrings(dateStr, fromDate) >= 0 && compareDateOnlyStrings(dateStr, toDate) <= 0;
  };
  const filteredAccountTasks = accountTasks.filter((t) => inRange(t.date));
  const filteredEditingTasks = editingTasks.filter((t) => inRange(t.date));
  const filteredManagementTasks = managementTasks.filter((t) => inRange(t.date));
  const managerById = new Map(managers.map((item) => [item.id, item]));
  const editorById = new Map(editors.map((item) => [item.id, item]));
  const userById = new Map(users.map((item) => [item.id, item]));
  const userByManagerId = new Map(users.filter((item) => item.linkedManagerId).map((item) => [item.linkedManagerId, item]));
  const userByEditorId = new Map(users.filter((item) => item.linkedEditorId).map((item) => [item.linkedEditorId, item]));
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
    const current = performancePeopleByKey.get(key) || { id: key, name: "", email: "", roles: [] };
    const roles = [...current.roles];
    if (data.roleLabel && !roles.includes(data.roleLabel)) roles.push(data.roleLabel);
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
  users.forEach((item) => addPerformancePerson(item.id, {
    name: item.name,
    email: item.email,
    roleLabel: roleLabelByKey[item.role] || item.role || "Usuario",
    managerId: item.linkedManagerId || "",
    editorId: item.linkedEditorId || ""
  }));
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
    const explicitAssignees = Array.isArray(task.assignees) ? task.assignees.filter(Boolean) : [];
    const keys = /* @__PURE__ */ new Set();
    if (type === "account") explicitAssignees.forEach((id) => keys.add(resolveManagerPerformanceKey(id, "")));
    if (type === "editing") explicitAssignees.forEach((id) => keys.add(resolveEditorPerformanceKey(id, "")));
    if (type === "management") explicitAssignees.forEach((id) => keys.add(resolveManagementPerformanceKey(id)));
    if (keys.size === 0 && type === "account") keys.add(resolveManagerPerformanceKey(task.contextId, task.assigneeUserId));
    if (keys.size === 0 && type === "editing") keys.add(resolveEditorPerformanceKey(task.contextId, task.assigneeUserId));
    if (keys.size === 0 && type === "management") keys.add(resolveManagementPerformanceKey(task.assigneeUserId || task.contextId));
    return [...keys].filter(Boolean);
  };
  const dailyPerformanceByKey = /* @__PURE__ */ new Map();
  const addDailyPerformanceTask = (task, type) => {
    const date = normalizeDateOnlyString(task.date);
    if (!date) return;
    const areaKey = type === "account" ? "account" : type === "editing" ? "editing" : "management";
    const isDone = type === "account" ? task.status === "publicado" : type === "editing" ? ["aprobado", "publicado"].includes(task.status) : task.status === "cerrado";
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
  filteredAccountTasks.forEach((task) => addDailyPerformanceTask(task, "account"));
  filteredEditingTasks.forEach((task) => addDailyPerformanceTask(task, "editing"));
  filteredManagementTasks.forEach((task) => addDailyPerformanceTask(task, "management"));
  const dailyPerformanceStats = [...dailyPerformanceByKey.values()].sort((left, right) => compareDateOnlyStrings(right.date, left.date) || right.total - left.total || left.name.localeCompare(right.name));
  const dailyPerformanceTotals = dailyPerformanceStats.reduce((acc, row) => ({
    total: acc.total + row.total,
    done: acc.done + row.done,
    pending: acc.pending + row.pending
  }), { total: 0, done: 0, pending: 0 });
  const dailyUserCount = new Set(dailyPerformanceStats.map((row) => row.userId)).size;
  const dailyDateCount = new Set(dailyPerformanceStats.map((row) => row.date)).size;
  const accountPublished = filteredAccountTasks.filter((t) => t.status === "publicado").length;
  const editingPublished = filteredEditingTasks.filter((t) => t.status === "publicado").length;
  const totalContentPieces = filteredAccountTasks.length + filteredEditingTasks.length;
  const totalPublished = accountPublished + editingPublished;
  const managerStats = managers.map((m) => {
    const mTasks = filteredAccountTasks.filter((t) => t.contextId === m.id);
    return {
      ...m,
      total: mTasks.length,
      published: mTasks.filter((t) => t.status === "publicado").length,
      approved: mTasks.filter((t) => t.status === "aprobado_internamente").length,
      inProgress: mTasks.filter((t) => !["publicado", "aprobado_internamente"].includes(t.status)).length
    };
  }).filter((m) => m.total > 0).sort((a, b) => b.total - a.total);
  const editorStats = editors.map((e) => {
    const eTasks = filteredEditingTasks.filter((t) => t.contextId === e.id);
    return {
      ...e,
      total: eTasks.length,
      published: eTasks.filter((t) => t.status === "publicado").length,
      approved: eTasks.filter((t) => t.status === "aprobado").length,
      inProgress: eTasks.filter((t) => !["publicado", "aprobado"].includes(t.status)).length
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
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-6 fade-in" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between flex-wrap gap-4" }, /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-black text-slate-800 dark:text-white" }, "Reportes"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 flex-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-black text-slate-500 uppercase" }, "Desde"), /* @__PURE__ */ React.createElement("input", { type: "date", value: fromDate, onChange: (e) => setFromDate(e.target.value), className: "text-sm font-bold text-slate-700 dark:text-slate-200 bg-transparent outline-none" })), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-black text-slate-500 uppercase" }, "Hasta"), /* @__PURE__ */ React.createElement("input", { type: "date", value: toDate, onChange: (e) => setToDate(e.target.value), className: "text-sm font-bold text-slate-700 dark:text-slate-200 bg-transparent outline-none" })))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4" }, /* @__PURE__ */ React.createElement(ReportStatCard, { label: "Total Piezas", value: totalContentPieces, color: "purple", icon: "BarChart3", sub: "accounts + edici\xF3n" }), /* @__PURE__ */ React.createElement(ReportStatCard, { label: "Publicadas", value: totalPublished, color: "emerald", icon: "CheckCircle2", sub: `${Math.round(totalContentPieces > 0 ? totalPublished / totalContentPieces * 100 : 0)}% del total` }), /* @__PURE__ */ React.createElement(ReportStatCard, { label: "Sala Accounts", value: filteredAccountTasks.length, color: "indigo", icon: "LayoutList", sub: `${accountPublished} publicadas` }), /* @__PURE__ */ React.createElement(ReportStatCard, { label: "Sala Edici\xF3n", value: filteredEditingTasks.length, color: "amber", icon: "Video", sub: `${editingPublished} publicadas` })), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1 border-b border-slate-200 dark:border-slate-800" }, tabs.map((tab) => /* @__PURE__ */ React.createElement("button", { key: tab.id, onClick: () => setActiveTab(tab.id), className: `px-4 py-2.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? "border-purple-500 text-purple-600 dark:text-purple-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}` }, tab.label))), activeTab === "content" && /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6" }, /* @__PURE__ */ React.createElement("h3", { className: "font-black text-slate-800 dark:text-white mb-5 flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icon, { name: "LayoutList", size: 18, className: "text-indigo-500" }), " Sala de Accounts"), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, [
    { label: "Por Dise\xF1ar", status: "por_disenar", color: "slate" },
    { label: "Aprobaci\xF3n Interna", status: "aprobacion_interna", color: "blue" },
    { label: "Aprobado Internamente", status: "aprobado_internamente", color: "emerald" },
    { label: "Publicado", status: "publicado", color: "indigo" }
  ].map((row) => {
    const count = filteredAccountTasks.filter((t) => t.status === row.status).length;
    const pct = filteredAccountTasks.length > 0 ? Math.round(count / filteredAccountTasks.length * 100) : 0;
    return /* @__PURE__ */ React.createElement("div", { key: row.status }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-1" }, /* @__PURE__ */ React.createElement("span", { className: `w-2 h-2 rounded-full bg-${row.color}-500 shrink-0` }), /* @__PURE__ */ React.createElement("span", { className: "text-sm text-slate-600 dark:text-slate-300 flex-1" }, row.label), /* @__PURE__ */ React.createElement("span", { className: "font-black text-slate-800 dark:text-white" }, count), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-500 w-8 text-right" }, pct, "%")), /* @__PURE__ */ React.createElement("div", { className: "h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: `h-full bg-${row.color}-500 rounded-full transition-all duration-500`, style: { width: `${pct}%` } })));
  }), /* @__PURE__ */ React.createElement("div", { className: "pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm font-bold text-slate-500" }, "Total"), /* @__PURE__ */ React.createElement("span", { className: "font-black text-slate-800 dark:text-white" }, filteredAccountTasks.length)))), /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6" }, /* @__PURE__ */ React.createElement("h3", { className: "font-black text-slate-800 dark:text-white mb-5 flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icon, { name: "Video", size: 18, className: "text-amber-500" }), " Sala de Edici\xF3n"), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, [
    { label: "Por Editar", status: "editar", color: "slate" },
    { label: "En Edici\xF3n", status: "en_edicion", color: "amber" },
    { label: "Revisi\xF3n Interna", status: "revision_interna", color: "blue" },
    { label: "Aprobado", status: "aprobado", color: "emerald" },
    { label: "Publicado", status: "publicado", color: "indigo" }
  ].map((row) => {
    const count = filteredEditingTasks.filter((t) => t.status === row.status).length;
    const pct = filteredEditingTasks.length > 0 ? Math.round(count / filteredEditingTasks.length * 100) : 0;
    return /* @__PURE__ */ React.createElement("div", { key: row.status }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-1" }, /* @__PURE__ */ React.createElement("span", { className: `w-2 h-2 rounded-full bg-${row.color}-500 shrink-0` }), /* @__PURE__ */ React.createElement("span", { className: "text-sm text-slate-600 dark:text-slate-300 flex-1" }, row.label), /* @__PURE__ */ React.createElement("span", { className: "font-black text-slate-800 dark:text-white" }, count), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-500 w-8 text-right" }, pct, "%")), /* @__PURE__ */ React.createElement("div", { className: "h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: `h-full bg-${row.color}-500 rounded-full transition-all duration-500`, style: { width: `${pct}%` } })));
  }), /* @__PURE__ */ React.createElement("div", { className: "pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm font-bold text-slate-500" }, "Total"), /* @__PURE__ */ React.createElement("span", { className: "font-black text-slate-800 dark:text-white" }, filteredEditingTasks.length))))), activeTab === "daily" && /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4" }, /* @__PURE__ */ React.createElement(ReportStatCard, { label: "Usuarios Activos", value: dailyUserCount, color: "violet", icon: "Users", sub: `${dailyDateCount} dias con actividad` }), /* @__PURE__ */ React.createElement(ReportStatCard, { label: "Tareas del Rango", value: dailyPerformanceTotals.total, color: "indigo", icon: "LayoutList", sub: "accounts + edicion + gestion" }), /* @__PURE__ */ React.createElement(ReportStatCard, { label: "Finalizadas", value: dailyPerformanceTotals.done, color: "emerald", icon: "CheckCircle2", sub: `${Math.round(dailyPerformanceTotals.total > 0 ? dailyPerformanceTotals.done / dailyPerformanceTotals.total * 100 : 0)}% completado` }), /* @__PURE__ */ React.createElement(ReportStatCard, { label: "Pendientes", value: dailyPerformanceTotals.pending, color: "amber", icon: "Clock", sub: "abiertas en el rango" })), /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" }, dailyPerformanceStats.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "p-16 text-center text-slate-500 font-bold" }, "Sin desempeno diario en este rango de fechas") : /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full min-w-[800px]" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { className: "border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950" }, /* @__PURE__ */ React.createElement("th", { className: "text-left p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Fecha"), /* @__PURE__ */ React.createElement("th", { className: "text-left p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Usuario"), /* @__PURE__ */ React.createElement("th", { className: "text-left p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Rol"), /* @__PURE__ */ React.createElement("th", { className: "text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Areas"), /* @__PURE__ */ React.createElement("th", { className: "text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Total"), /* @__PURE__ */ React.createElement("th", { className: "text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Finalizadas"), /* @__PURE__ */ React.createElement("th", { className: "text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Pendientes"), /* @__PURE__ */ React.createElement("th", { className: "text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Desempeno"))), /* @__PURE__ */ React.createElement("tbody", null, dailyPerformanceStats.map((row, i) => {
    const pct = row.total > 0 ? Math.round(row.done / row.total * 100) : 0;
    const performanceColor = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
    return /* @__PURE__ */ React.createElement("tr", { key: `${row.date}-${row.userId}`, className: `border-b border-slate-50 dark:border-slate-800/50 ${rowStyle(i)}` }, /* @__PURE__ */ React.createElement("td", { className: "p-4 font-mono text-sm font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap" }, row.date), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-slate-800 dark:text-white" }, row.name), row.email && /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 dark:text-slate-400" }, row.email)), /* @__PURE__ */ React.createElement("td", { className: "p-4 text-sm text-slate-500 dark:text-slate-400" }, row.roles?.length ? row.roles.join(" / ") : "Usuario"), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-1.5 flex-wrap" }, row.areas.account > 0 && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-black" }, "Account ", row.areas.account), row.areas.editing > 0 && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-black" }, "Edicion ", row.areas.editing), row.areas.management > 0 && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[11px] font-black" }, "Gestion ", row.areas.management))), /* @__PURE__ */ React.createElement("td", { className: "p-4 text-center font-black text-slate-800 dark:text-white" }, row.total), /* @__PURE__ */ React.createElement("td", { className: "p-4 text-center font-bold text-emerald-600 dark:text-emerald-400" }, row.done), /* @__PURE__ */ React.createElement("td", { className: "p-4 text-center text-slate-500 dark:text-slate-400" }, row.pending), /* @__PURE__ */ React.createElement("td", { className: "p-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: `h-full rounded-full ${performanceColor}`, style: { width: `${pct}%` } })), /* @__PURE__ */ React.createElement("span", { className: "w-10 text-right text-sm font-black text-slate-800 dark:text-white" }, pct, "%"))));
  })))))), activeTab === "managers" && /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" }, managerStats.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "p-16 text-center text-slate-500 font-bold" }, "Sin datos en este rango de fechas") : /* @__PURE__ */ React.createElement("table", { className: "w-full" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { className: "border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950" }, /* @__PURE__ */ React.createElement("th", { className: "text-left p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Manager"), /* @__PURE__ */ React.createElement("th", { className: "text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Total"), /* @__PURE__ */ React.createElement("th", { className: "text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "En Proceso"), /* @__PURE__ */ React.createElement("th", { className: "text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Aprobadas"), /* @__PURE__ */ React.createElement("th", { className: "text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Publicadas"))), /* @__PURE__ */ React.createElement("tbody", null, managerStats.map((m, i) => /* @__PURE__ */ React.createElement("tr", { key: m.id, className: `border-b border-slate-50 dark:border-slate-800/50 ${rowStyle(i)}` }, /* @__PURE__ */ React.createElement("td", { className: "p-4 font-bold text-slate-800 dark:text-white" }, m.name), /* @__PURE__ */ React.createElement("td", { className: "p-4 text-center font-black text-slate-800 dark:text-white" }, m.total), /* @__PURE__ */ React.createElement("td", { className: "p-4 text-center text-slate-500 dark:text-slate-400" }, m.inProgress), /* @__PURE__ */ React.createElement("td", { className: "p-4 text-center font-bold text-emerald-600 dark:text-emerald-400" }, m.approved), /* @__PURE__ */ React.createElement("td", { className: "p-4 text-center font-bold text-indigo-600 dark:text-indigo-400" }, m.published)))))), activeTab === "editors" && /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" }, editorStats.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "p-16 text-center text-slate-500 font-bold" }, "Sin datos en este rango de fechas") : /* @__PURE__ */ React.createElement("table", { className: "w-full" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { className: "border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950" }, /* @__PURE__ */ React.createElement("th", { className: "text-left p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Editor"), /* @__PURE__ */ React.createElement("th", { className: "text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Total"), /* @__PURE__ */ React.createElement("th", { className: "text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "En Proceso"), /* @__PURE__ */ React.createElement("th", { className: "text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Aprobadas"), /* @__PURE__ */ React.createElement("th", { className: "text-center p-4 text-xs font-black uppercase tracking-widest text-slate-500" }, "Publicadas"))), /* @__PURE__ */ React.createElement("tbody", null, editorStats.map((e, i) => /* @__PURE__ */ React.createElement("tr", { key: e.id, className: `border-b border-slate-50 dark:border-slate-800/50 ${rowStyle(i)}` }, /* @__PURE__ */ React.createElement("td", { className: "p-4 font-bold text-slate-800 dark:text-white" }, e.name), /* @__PURE__ */ React.createElement("td", { className: "p-4 text-center font-black text-slate-800 dark:text-white" }, e.total), /* @__PURE__ */ React.createElement("td", { className: "p-4 text-center text-slate-500 dark:text-slate-400" }, e.inProgress), /* @__PURE__ */ React.createElement("td", { className: "p-4 text-center font-bold text-emerald-600 dark:text-emerald-400" }, e.approved), /* @__PURE__ */ React.createElement("td", { className: "p-4 text-center font-bold text-indigo-600 dark:text-indigo-400" }, e.published)))))), activeTab === "management" && /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6" }, /* @__PURE__ */ React.createElement("h3", { className: "font-black text-slate-800 dark:text-white mb-5 flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icon, { name: "ShieldCheck", size: 18, className: "text-violet-500" }), " Sala de Gesti\xF3n"), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, [
    { label: "Pendiente", status: "pendiente", color: "slate" },
    { label: "En Proceso", status: "en_proceso", color: "violet" },
    { label: "En Espera", status: "en_espera", color: "amber" },
    { label: "Cerrado", status: "cerrado", color: "emerald" }
  ].map((row) => {
    const count = filteredManagementTasks.filter((t) => t.status === row.status).length;
    const pct = filteredManagementTasks.length > 0 ? Math.round(count / filteredManagementTasks.length * 100) : 0;
    return /* @__PURE__ */ React.createElement("div", { key: row.status }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-1" }, /* @__PURE__ */ React.createElement("span", { className: `w-2 h-2 rounded-full bg-${row.color}-500 shrink-0` }), /* @__PURE__ */ React.createElement("span", { className: "text-sm text-slate-600 dark:text-slate-300 flex-1" }, row.label), /* @__PURE__ */ React.createElement("span", { className: "font-black text-slate-800 dark:text-white" }, count), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-500 w-8 text-right" }, pct, "%")), /* @__PURE__ */ React.createElement("div", { className: "h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: `h-full bg-${row.color}-500 rounded-full transition-all duration-500`, style: { width: `${pct}%` } })));
  }), /* @__PURE__ */ React.createElement("div", { className: "pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm font-bold text-slate-500" }, "Total"), /* @__PURE__ */ React.createElement("span", { className: "font-black text-slate-800 dark:text-white" }, filteredManagementTasks.length)))), /* @__PURE__ */ React.createElement("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4" }, /* @__PURE__ */ React.createElement("h3", { className: "font-black text-slate-800 dark:text-white flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Icon, { name: "Flame", size: 18, className: "text-orange-500" }), " Resumen"), /* @__PURE__ */ React.createElement(ReportStatCard, { label: "Tareas Abiertas", value: filteredManagementTasks.filter((t) => t.status !== "cerrado").length, color: "violet", icon: "Circle" }), /* @__PURE__ */ React.createElement(ReportStatCard, { label: "Tareas Cerradas", value: filteredManagementTasks.filter((t) => t.status === "cerrado").length, color: "emerald", icon: "CheckCircle2" }))));
};
var root = createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ React.createElement(App, null));
