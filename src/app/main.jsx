import React, { useState, useEffect, useRef, useId, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";
import confetti from "canvas-confetti";
import { App as CapacitorApp } from "@capacitor/app";
import {
  signInAnonymously,
  onAuthStateChanged,
  GoogleAuthProvider,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  completeGoogleRedirectIfNeeded,
  signOut as firebaseSignOut,
} from "./lib/firebase-auth-compat.js";
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
} from "./lib/data-store.js";
import { auth, db, appId } from "./config/firebase.js";
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
} from "./constants/app.constants.js";
import {
  getHondurasTodayStr,
  normalizeDateOnlyString,
} from "./utils/date.js";
import {
  isEditingDelivered,
} from "./utils/kpi.js";
import { apiFetch } from "./lib/backend-api.js";
import {
  getCallRoomAlias,
  getConsumedCallLinkUrl,
  resolveCallLink,
} from "./lib/call-links.js";
import { createPortal } from "react-dom";
import { Icon } from "./components/icons.jsx";
import {
  ViewTabs,
  Button,
  EmptyState,
  AppShellSkeleton,
  Breadcrumb,
  SearchBar,
  StatCard,
  Input,
  PhotoUploader,
  CheckItem,
} from "./components/ui.jsx";
import {
  AgencyLogo,
  SidebarItem,
  SidebarNavGroup,
  FirstTimeView,
  MobileBottomNav,
  LoginScreen,
} from "./components/shell.jsx";
import {
  formatShortDate,
  buildAssignee,
  PersonAvatar,
  getClientStatus,
  KanbanCard,
  KanbanColumn,
  KanbanStage,
  TaskRoomInspector,
  TaskRoomWorkspace,
  DateHeader,
} from "./components/kanban.jsx";
import {
  AccountRoomView,
  EditionsRoomView,
  ManagementRoomView,
} from "./components/rooms.jsx";
import {
  DashboardView,
  ProfileSettingsView,
  buildPersonalTaskList,
  buildCompanyTaskList,
  buildPersonalKpiSnapshot,
  getDashboardPalette,
} from "./components/dashboard.jsx";
import {
  TeamView,
  PersonCalendarDetail,
  UsersAccessView,
  ManagerPicker,
  ClientsView,
  ClientDetail,
  RankingRulesPanel,
} from "./components/people.jsx";
import { ClientChatView } from "./components/chat.jsx";
import { CalendarGrid, GeneralCalendarGrid } from "./components/calendar.jsx";
import {
  EventActionModal,
  TaskDetailModal,
  DayDetailsModal,
  CreateTaskModal,
  Modal,
  DeleteConfirmModal,
  Toast,
  TASK_STATUS_DEFS,
  STATUS_COLOR_CLASSES,
} from "./components/modals.jsx";
import {
  UnifiedModuleKanbanView,
  PodcastView,
  ProductionView,
  ReportsView,
  PerformanceView,
} from "./components/reports.jsx";
import { useDialogA11y } from "./hooks/useDialogA11y.js";
import { useTaskRoomState } from "./hooks/useTaskRoomState.js";
import { useSystemNotifications } from "./hooks/useSystemNotifications.js";
import {
  useIncomingCallAudioUnlock,
  useIncomingCallDetection,
  useIncomingCallRingtone,
} from "./hooks/useIncomingCallAlerts.js";
import { AUTOMATIC_DATA_REPAIR_ENABLED } from "./constants/data-repair.js";
import {
  normalizeEmail,
  normalizeNameKey,
  normalizeTimeValue,
  nowIso,
} from "./utils/text.js";
import {
  VIEW_PERMISSIONS,
  getRoleMeta,
  userHasPermission,
  canAccessView,
} from "./utils/permissions.js";
import {
  getEditingHierarchyId,
  isAccountTaskDone,
  isTaskAssignedToProfile,
} from "./utils/task-helpers.js";
import { EDITING_STATUS_OPTIONS } from "./constants/editing.js";
import {
  SHORT_MONTHS_ES,
  PILL_TONES,
  ACCENT_BORDER,
  AVATAR_FAMILY,
  CLIENT_STATUSES,
  MGMT_CATEGORY_COLORS,
  DASHBOARD_PALETTE,
} from "./constants/ui-tones.js";
import {
  THEME_PALETTES,
  THEME_PALETTE_IDS,
  THEME_PALETTE_ALIASES,
  normalizeThemePalette,
} from "./constants/theme.js";
import {
  readPendingTaskStatusUpdates,
  queuePendingTaskStatusUpdate,
  clearPendingTaskStatusUpdate,
  shouldRetryTaskStatusUpdate,
} from "./utils/pending-task-status.js";
import {
  MANAGEMENT_DIRECTORY,
  getManagementDirectoryKey,
  getManagementDirectoryMeta,
  getResolvedManagementEmail,
  buildRecoveredManagerId,
  findDirectoryMemberByName,
  getUserRecordScore,
  buildOrganizationTaskAssignees,
  findCurrentUserTaskAssignee,
  buildDuplicateUserGroups,
  chooseCanonicalUserRecord,
  getVerificationMeta,
} from "./utils/directory-users.js";
import {
  EMAIL_LINK_STORAGE_KEY,
  getGoogleAuthErrorMessage,
  getEmailLinkAuthErrorMessage,
  buildEmailLinkActionCodeSettings,
  buildEmailLinkReturnUrl,
  getAuthSource,
} from "./utils/auth-helpers.js";
import { getStatusTimestampPatch, DEFAULT_RANKING_SETTINGS, sanitizeRankingSettings } from "./utils/ranking.js";
import {
  isNativeApp,
  scheduleNativeNotification,
  chatMessagePreview,
} from "./lib/native-notifications.js";
import {
  EMBEDDED_UPLOAD_MAX_BYTES,
  CHAT_MUTE_FOREVER,
  CHAT_MUTE_DURATION_MS,
  isChatMuteActive,
  formatChatMuteUntil,
} from "./constants/chat.js";



void TAILWIND_SAFELIST;

const GOOGLE_PROVIDER = auth ? new GoogleAuthProvider() : null;
if (GOOGLE_PROVIDER)
  GOOGLE_PROVIDER.setCustomParameters({ prompt: "select_account" });

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("cluster_theme") !== "light",
  );
  const [themePalette, setThemePalette] = useState(() =>
    normalizeThemePalette(localStorage.getItem("cluster_palette")),
  );
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
  // Un fallo de la API (504 por arranque en frio, red caida) no es "no hay
  // datos". Sin esta bandera la app se dibujaba vacia y sin avisar de nada.
  const [dataLoadFailed, setDataLoadFailed] = useState(false);
  const isReconcilingUsersRef = useRef(false);
  const isBackfillingIdentityLinksRef = useRef(false);
  const isFlushingPendingTaskStatusesRef = useRef(false);
  const lastReconciledDuplicateSignatureRef = useRef("");
  const lastIdentityLinkSyncSignatureRef = useRef("");
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
  const [chatMutes, setChatMutes] = useState([]);
  const [chatMutesLoaded, setChatMutesLoaded] = useState(false);
  const [chatHidden, setChatHidden] = useState([]);
  const [chatReactions, setChatReactions] = useState([]);
  const [chatPins, setChatPins] = useState([]);
  const [chatStickers, setChatStickers] = useState([]);
  const [chatDirectory, setChatDirectory] = useState([]);
  const [chatGroupsByClient, setChatGroupsByClient] = useState({});
  const [chatGroupsLoaded, setChatGroupsLoaded] = useState(false);
  const [chatGroupIdentityId, setChatGroupIdentityId] = useState("");
  const [rankingSettings, setRankingSettings] = useState(DEFAULT_RANKING_SETTINGS);
  const [incomingCall, setIncomingCall] = useState(null);
  const [incomingCallToJoin, setIncomingCallToJoin] = useState(null);
  const [nativePushReady, setNativePushReady] = useState(false);
  const [nativeNotificationAction, setNativeNotificationAction] =
    useState(null);
  const [browserNotificationPermission, setBrowserNotificationPermission] =
    useState(() => {
      if (isNativeApp()) return "native";
      return typeof Notification === "undefined"
        ? "unsupported"
        : Notification.permission;
    });
  const [onboardingDismissed, setOnboardingDismissed] = useState(() =>
    typeof window !== "undefined" &&
    window.sessionStorage.getItem("cluster_onboarding_dismissed") === "1",
  );
  const handledIncomingCallIdsRef = useRef(new Set());
  const webPushShownMessageIdsRef = useRef(new Set());
  const handledCallDeepLinkRef = useRef("");

  useEffect(() => {
    window.__cluster_active_view = view;
    window.dispatchEvent(new Event("cluster:viewchange"));
  }, [view]);

  useIncomingCallAudioUnlock();

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
  const pendingRole = "viewer";
  const effectiveResolvedAuthProfile = resolvedAuthProfile
    ? {
        ...resolvedAuthProfile,
        role: resolvedAuthProfile.role || "viewer",
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
  const canManageChatMembers = ["manager", "super_admin"].includes(
    currentUserProfile?.role,
  );
  const canLeaveChatGroup = currentUserProfile?.role === "super_admin";
  const profileBlocked = Boolean(
    currentUserProfile && currentUserProfile.isActive === false,
  );

  useEffect(() => {
    if (
      !currentUserProfile?.id ||
      currentUserProfile.pending ||
      currentUserProfile.isAnonymous
    )
      return;
    if (
      THEME_PALETTE_IDS.has(currentUserProfile.themePalette) ||
      THEME_PALETTE_ALIASES[currentUserProfile.themePalette]
    ) {
      setThemePalette(normalizeThemePalette(currentUserProfile.themePalette));
    }
    if (["light", "dark"].includes(currentUserProfile.themeMode)) {
      setIsDark(currentUserProfile.themeMode === "dark");
    }
  }, [
    currentUserProfile?.id,
    currentUserProfile?.themePalette,
    currentUserProfile?.themeMode,
  ]);

  useSystemNotifications({
    profileId: currentUserProfile?.id,
    profileBlocked,
    browserNotificationPermission,
    setBrowserNotificationPermission,
    setNativePushReady,
    setNativeNotificationAction,
    webPushShownMessageIdsRef,
  });

  useIncomingCallDetection({
    clientChats,
    currentUserId: currentUserProfile?.id,
    handledIncomingCallIdsRef,
    setIncomingCall,
  });

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

  // Silencio por conversación, sincronizado por usuario y cliente.
  const chatMuteMap = useMemo(() => {
    const uid = String(currentUserProfile?.id || authEmail || "");
    const map = {};
    if (!uid) return map;
    chatMutes.forEach((entry) => {
      if (String(entry.userId || "") === uid && entry.clientId) {
        map[String(entry.clientId)] = entry.mutedUntil || "";
      }
    });
    return map;
  }, [chatMutes, currentUserProfile, authEmail]);

  // Mensajes que el usuario actual ocultó ("eliminar para mí").
  const chatHiddenIds = useMemo(() => {
    const uid = String(currentUserProfile?.id || authEmail || "");
    const set = new Set();
    if (!uid) return set;
    chatHidden.forEach((entry) => {
      if (String(entry.userId || "") === uid && entry.messageId) {
        set.add(String(entry.messageId));
      }
    });
    return set;
  }, [chatHidden, currentUserProfile, authEmail]);

  const currentChatGroupClientIds = useMemo(() => {
    const memberId = String(
      chatGroupIdentityId || currentUserProfile?.id || authEmail || "",
    );
    const result = new Set();
    if (!memberId) return result;
    Object.values(chatGroupsByClient).forEach((group) => {
      if ((group?.memberIds || []).map(String).includes(memberId)) {
        result.add(String(group.clientId));
      }
    });
    return result;
  }, [
    chatGroupsByClient,
    chatGroupIdentityId,
    currentUserProfile?.id,
    authEmail,
  ]);

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
      if (
        chatGroupsLoaded &&
        !currentChatGroupClientIds.has(String(message.clientId))
      )
        return;
      if (myId && String(message.authorId || "") === myId) return;
      if (message.deleted || chatHiddenIds.has(String(message.id))) return;
      if (openClientId && String(message.clientId) === openClientId) return;
      const lastRead = chatReadMap[message.clientId] || "";
      if (message.createdAt > lastRead) {
        byClient[message.clientId] = (byClient[message.clientId] || 0) + 1;
        total += 1;
      }
    });
    return { byClient, total };
  }, [
    clientChats,
    chatReadMap,
    chatHiddenIds,
    currentUserProfile,
    view,
    selectedChatClient,
    chatGroupsLoaded,
    currentChatGroupClientIds,
  ]);

  const appUserById = new Map(appUsers.map((item) => [item.id, item]));
  const managementMemberCandidates = [
    ...appUsers.filter((item) => item.isActive !== false),
    // `users` se entrega acotado al perfil propio para roles sin view_users.
    // El directorio del chat contiene los ids reales y el perfil publico minimo
    // del equipo, de modo que esas personas tambien puedan recibir tareas.
    ...chatDirectory,
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
  const accountTaskAssignees = buildOrganizationTaskAssignees(
    managers,
    managementUsers,
    "linkedManagerId",
  );
  const editingTaskAssignees = buildOrganizationTaskAssignees(
    editors,
    managementUsers,
    "linkedEditorId",
  );
  const currentManagementAssignee = findCurrentUserTaskAssignee(
    currentUserProfile,
    managementUsers,
  );
  const currentAccountAssignee = findCurrentUserTaskAssignee(
    currentUserProfile,
    accountTaskAssignees,
  );
  const currentEditingAssignee = findCurrentUserTaskAssignee(
    currentUserProfile,
    editingTaskAssignees,
  );
  // `anonymous` y `pending-user` son ids de marcador del perfil sin resolver:
  // si llegan al formulario se guardan como responsable inexistente.
  const resolveDefaultAssigneeId = (assignee) =>
    assignee?.id && !["anonymous", "pending-user"].includes(assignee.id)
      ? assignee.id
      : "";
  const defaultManagementAssigneeId = resolveDefaultAssigneeId(
    currentManagementAssignee,
  );
  const defaultAccountAssigneeId = resolveDefaultAssigneeId(
    currentAccountAssignee,
  );
  const defaultEditingAssigneeId = resolveDefaultAssigneeId(
    currentEditingAssignee,
  );
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
    html.classList.toggle("dark", isDark);
    html.dataset.palette = themePalette;
    localStorage.setItem("cluster_theme", isDark ? "dark" : "light");
    localStorage.setItem("cluster_palette", themePalette);
  }, [isDark, themePalette]);

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

    const completeNativeGoogleRedirect = async () => {
      const wasSignedIn = Boolean(auth.currentUser?.email);
      try {
        setIsSigningIn(true);
        const completed = await completeGoogleRedirectIfNeeded(auth);
        if (completed && !wasSignedIn) {
          setUser(auth.currentUser);
          setView("dashboard");
          localStorage.setItem("cluster_os_view", "dashboard");
          showToast("Sesion iniciada con Google");
        }
        return completed;
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

    let appUrlHandle = null;
    let resumeHandle = null;

    CapacitorApp.addListener("appUrlOpen", ({ url }) => {
      if (String(url || "").startsWith("clusteragency://auth/google")) {
        completeNativeGoogleRedirect().catch(() => {});
      }
    })
      .then((handle) => {
        appUrlHandle = handle;
      })
      .catch((error) => {
        console.error("No se pudo registrar appUrlOpen:", error);
      });

    CapacitorApp.getLaunchUrl()
      .then((result) => {
        if (String(result?.url || "").startsWith("clusteragency://auth/google")) {
          completeNativeGoogleRedirect().catch(() => {});
        }
      })
      .catch(() => {});

    CapacitorApp.addListener("resume", () => {
      // Al volver el foco (en web, "resume" se dispara al cambiar de pestaña),
      // NO redirigir a Inicio si el usuario ya estaba autenticado. Solo tratamos
      // esto como un inicio de sesión nuevo cuando antes no había sesión.
      completeNativeGoogleRedirect().catch(() => {});
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
    const errHandler = (err) => {
      console.error("Error de Firestore:", err);
      setDataLoadFailed(true);
    };

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
          setDataLoadFailed(false);
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
      onSnapshot(
        dataCollection("chat_mutes"),
        (snapshot) => {
          setChatMutes(
            snapshot.docs.map((docItem) => ({
              id: docItem.id,
              ...docItem.data(),
            })),
          );
          setChatMutesLoaded(true);
        },
        errHandler,
      ),
      onSnapshot(
        dataCollection("chat_hidden"),
        (snapshot) =>
          setChatHidden(
            snapshot.docs.map((docItem) => ({
              id: docItem.id,
              ...docItem.data(),
            })),
          ),
        errHandler,
      ),
      onSnapshot(
        dataCollection("chat_reactions"),
        (snapshot) =>
          setChatReactions(
            snapshot.docs.map((docItem) => ({
              id: docItem.id,
              ...docItem.data(),
            })),
          ),
        errHandler,
      ),
      onSnapshot(
        dataCollection("chat_pins"),
        (snapshot) =>
          setChatPins(
            snapshot.docs.map((docItem) => ({
              id: docItem.id,
              ...docItem.data(),
            })),
          ),
        errHandler,
      ),
      onSnapshot(
        dataCollection("chat_stickers"),
        (snapshot) =>
          setChatStickers(
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
    if (!user || !db) return;
    return onSnapshot(
      dataCollection("ranking_settings"),
      (snapshot) => {
        const record =
          snapshot.docs.find((docItem) => docItem.id === "default") ||
          snapshot.docs[0];
        if (!record) {
          setRankingSettings(DEFAULT_RANKING_SETTINGS);
          return;
        }
        setRankingSettings(sanitizeRankingSettings(record.data() || {}));
      },
      (err) => console.error("Error de ranking_settings:", err),
    );
  }, [user]);

  useEffect(() => {
    if (!AUTOMATIC_DATA_REPAIR_ENABLED) return;
    if (
      !db ||
      !user ||
      !authEmail ||
      currentUserProfile?.isAnonymous ||
      profileBlocked ||
      !usersLoaded ||
      hasSeededManagementDirectory
    )
      return;
    // Sin manage_users la lista de usuarios llega acotada al propio registro:
    // "faltarian" todos los demas y cada intento seria un 403 inutil.
    if (!userHasPermission(currentUserProfile, "manage_users")) return;
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
  }, [
    db,
    user,
    authEmail,
    currentUserProfile?.isAnonymous,
    currentUserProfile?.role,
    profileBlocked,
    usersLoaded,
    appUsers,
    hasSeededManagementDirectory,
  ]);

  useEffect(() => {
    if (!AUTOMATIC_DATA_REPAIR_ENABLED) return;
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
    if (!AUTOMATIC_DATA_REPAIR_ENABLED) return;
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
    if (!AUTOMATIC_DATA_REPAIR_ENABLED) return;
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
    // El backend ya sincroniza el perfil en cada login (ensureAuthUserRecord) y
    // descarta rol/authUid/verificacion/vinculos si quien escribe no administra
    // usuarios. Reintentarlos en cada snapshot dejaba este efecto escribiendo en
    // bucle (cientos de miles de writes al dia por persona).
    if (existing && !userHasPermission(existing, "manage_users")) return;
    const targetId =
      existing?.id ||
      `auth_${user.uid || normalizeNameKey(authEmail).replace(/[^a-z0-9]+/g, "_")}`;
    const isForcedSuperAdmin = SUPER_ADMIN_EMAILS.includes(authEmail);
    const existingRole = existing?.role || "viewer";
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
    managers,
    editors,
  ]);

  useEffect(() => {
    // No redirigir mientras el perfil aún se resuelve: al volver de otra pestaña
    // o app, la sesión se revalida y el perfil cae un instante a estado
    // "pending" (rol menor), lo que antes mandaba a Inicio cualquier panel.
    if (!currentUserProfile || !usersLoaded || currentUserProfile.pending) return;
    if (profileBlocked || !canAccessView(currentUserProfile, view)) {
      setView("dashboard");
      localStorage.setItem("cluster_os_view", "dashboard");
    }
  }, [currentUserProfile, profileBlocked, view, usersLoaded]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined")
      return;
    if (!currentUserProfile?.id || profileBlocked) return;

    const NOTIF_KEY = "cluster_browser_task_notifications_v1";
    const HOUR = 3600000;
    const profileId = String(currentUserProfile.id || "");
    const profileEmail = normalizeEmail(currentUserProfile.email);

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

    const isTaskAssigner = (task) => {
      if (profileId && String(task.assignedByUserId || "") === profileId)
        return true;
      return Boolean(
        profileEmail && normalizeEmail(task.assignedByEmail) === profileEmail,
      );
    };

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

    const fireNotification = (task, config, stage, dueMs, role) => {
      if (Notification.permission !== "granted") return;
      const isAssigner = role === "assigner";
      const titleMap = {
        "8h": isAssigner
          ? "Tarea que asignaste proxima a vencer (8h)"
          : "Tarea proxima a vencer (8h)",
        overdue: isAssigner ? "Tarea que asignaste vencida" : "Tarea vencida",
        nag: isAssigner
          ? "Tarea que asignaste vencida hace mas de 24h"
          : "Tarea vencida hace mas de 24h",
      };
      const client = clients.find((c) => c.id === task.clientId);
      const notificationTitle =
        stage === "8h"
          ? isAssigner
            ? `Tarea de ${config.label} que asignaste proxima a vencer (8h)`
            : `Tarea de ${config.label} proxima a vencer (8h)`
          : stage === "overdue"
            ? isAssigner
              ? `Tarea de ${config.label} que asignaste vencida`
              : `Tarea de ${config.label} vencida`
            : isAssigner
              ? `Tarea de ${config.label} que asignaste vencida hace mas de 24h`
              : `Tarea de ${config.label} vencida hace mas de 24h`;
      const body = [
        task.title,
        task.time
          ? `Hora limite: ${task.time}`
          : config.defaultTime
            ? `Hora limite: ${config.defaultTime}`
            : "",
        client ? `Cliente: ${client.name}` : "",
        isAssigner && task.assigneeName
          ? `Asignada a: ${task.assigneeName}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
      try {
        const notif = new Notification(
          notificationTitle || titleMap[stage] || `Tarea de ${config.label}`,
          {
            body,
            tag: `cluster-task-${config.collectionType}-${task.id}-${stage}-${role}`,
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
          const asAssignee = config.assigned(task);
          const asAssigner = isTaskAssigner(task);
          if (!asAssignee && !asAssigner) continue;
          if (!task.date) continue;
          const dueTime = /^\d{2}:\d{2}$/.test(task.time || "")
            ? task.time
            : config.defaultTime;
          if (!dueTime) continue;
          const dueMs = Date.parse(`${task.date}T${dueTime}:00-06:00`);
          if (!Number.isFinite(dueMs)) continue;
          const diff = dueMs - now;
          const role = asAssignee ? "assignee" : "assigner";
          const stateKey = `${config.collectionType}:${task.id}:${role}`;
          const seen = state[stateKey] || {};

          if (diff > 0 && diff <= 8 * HOUR && !seen["8h"]) {
            fireNotification(task, config, "8h", dueMs, role);
            seen["8h"] = now;
            mutated = true;
          }
          if (diff <= 0 && !seen.overdue) {
            fireNotification(task, config, "overdue", dueMs, role);
            seen.overdue = now;
            mutated = true;
          } else if (
            diff <= 0 &&
            seen.overdue &&
            now - (seen.nag || seen.overdue) >= 24 * HOUR
          ) {
            fireNotification(task, config, "nag", dueMs, role);
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
    currentUserProfile?.email,
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

  const ensurePermission = async (permission, description) => {
    if (profileBlocked) {
      showToast("Tu usuario esta inactivo", "error");
      return false;
    }
    if (userHasPermission(currentUserProfile, permission)) return true;
    showToast("No tienes permisos para esta accion", "error");
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
      if (successMessage) showToast(successMessage);
      if (afterSuccess) afterSuccess(result);
      return result;
    } catch (error) {
      console.error(error);
      showToast(error?.message || errorMessage, "error");
      return null;
    }
  };

  const saveRankingSettings = async (nextSettings) => {
    const sanitized = sanitizeRankingSettings(nextSettings);
    const result = await runMutation({
      permission: "manage_ranking_settings",
      action: "update_ranking_settings",
      entityType: "ranking_settings",
      entityId: "default",
      description: "Actualizar reglas de ranking",
      successMessage: "Reglas de ranking guardadas.",
      errorMessage: "No se pudieron guardar las reglas de ranking",
      execute: () =>
        setDoc(dataDoc("ranking_settings", "default"), {
          ...sanitized,
          updatedAt: nowIso(),
        }),
      afterSuccess: () => setRankingSettings(sanitized),
    });
    return result;
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
    if (!AUTOMATIC_DATA_REPAIR_ENABLED)
      return { changed: false, removedCount: 0, signature: "" };
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
    if (!AUTOMATIC_DATA_REPAIR_ENABLED)
      return {
        changed: false,
        migratedAccountTasks: 0,
        migratedEditingTasks: 0,
        linkedClients: 0,
      };
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
    if (!AUTOMATIC_DATA_REPAIR_ENABLED) return;
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
    if (!AUTOMATIC_DATA_REPAIR_ENABLED) return;
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
    if (!AUTOMATIC_DATA_REPAIR_ENABLED) return;
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
  };

  const handleEventClick = (event, type) =>
    setEventAction({ isOpen: true, event, type });
  const openTaskDetail = useCallback((task, fallbackType = "editingTask") => {
    const resolvedType = task?._taskType || fallbackType;
    if (!["accountTask", "editingTask", "managementTask"].includes(resolvedType))
      return;
    setTaskDetailConfig({ isOpen: true, task, type: resolvedType });
  }, []);
  const handleAccountTaskClick = useCallback(
    (task) => openTaskDetail(task, "accountTask"),
    [openTaskDetail],
  );
  const handleEditingTaskClick = useCallback(
    (task) => openTaskDetail(task, "editingTask"),
    [openTaskDetail],
  );
  const handleManagementTaskClick = useCallback(
    (task) => openTaskDetail(task, "managementTask"),
    [openTaskDetail],
  );
  const triggerConfetti = () => {
    if (confetti) {
      const theme = getComputedStyle(document.documentElement);
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: [
          "--primary",
          "--status-blue-text",
          "--status-green-text",
          "--status-yellow-text",
        ].map((token) => theme.getPropertyValue(token).trim()),
      });
    }
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
  // "Espacio recien creado" solo si la API contesto. Si no cargo, esta pantalla
  // decia "Prepara ClusterAG para operar" a un equipo con datos de meses.
  const isFirstTimeWorkspace =
    !onboardingDismissed &&
    usersLoaded &&
    clients.length === 0 &&
    accountTasks.length === 0 &&
    editingTasks.length === 0 &&
    managementTasks.length === 0;
  const dismissOnboarding = () => {
    setOnboardingDismissed(true);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("cluster_onboarding_dismissed", "1");
    }
  };
  const sidebarFooterText =
    currentUserProfile?.isActive === false
      ? "Cuenta inactiva"
      : !authEmail
        ? "Sin sesión iniciada"
        : // Mientras el perfil no se resuelve el rol es un marcador de posicion,
          // no un hecho: mostrarlo hacia que un fallo de red pareciera una
          // degradacion de permisos.
          !usersLoaded
          ? dataLoadFailed
            ? "Sin conexión con el servidor"
            : "Cargando perfil…"
          : currentRoleMeta.label;

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
    const assignee = accountTaskAssignees.find(
      (item) => item.id === data.contextId && item.isActive !== false,
    );
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
          assigneeUserId: assignee?.assigneeUserId || "",
          notificationsEnabled: data.notificationsEnabled !== false,
          status: "por_disenar",
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }),
      afterSuccess: closeModal,
    });
  };
  const updateAccountTask = async (id, data) => {
    const assignee = accountTaskAssignees.find(
      (item) => item.id === data.contextId && item.isActive !== false,
    );
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
          assigneeUserId: assignee?.assigneeUserId || "",
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
    const assignee = editingTaskAssignees.find(
      (item) => item.id === data.contextId && item.isActive !== false,
    );
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
          assigneeUserId: assignee?.assigneeUserId || "",
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
    const assignee = editingTaskAssignees.find(
      (item) => item.id === data.contextId && item.isActive !== false,
    );
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
          assigneeUserId: assignee?.assigneeUserId || "",
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
      return null;
    }
    if (data.notificationsEnabled !== false && !normalizeEmail(member?.email)) {
      showToast(
        "El integrante asignado necesita un correo para recibir recordatorios automaticos.",
        "error",
      );
      return null;
    }
    return await runMutation({
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
      return null;
    }
    if (data.notificationsEnabled !== false && !normalizeEmail(member?.email)) {
      showToast(
        "El integrante asignado necesita un correo para recibir recordatorios automaticos.",
        "error",
      );
      return null;
    }
    const updatePermission = userHasPermission(
      currentUserProfile,
      "manage_management_tasks",
    )
      ? "manage_management_tasks"
      : "create_management_tasks";
    return await runMutation({
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
    const assigneePool =
      type === "accountTask"
        ? accountTaskAssignees
        : type === "editingTask"
          ? editingTaskAssignees
          : managementUsers;
    const assignee = assigneePool.find(
      (item) => item.id === contextId && item.isActive !== false,
    );
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
      assigneeUserId: assignee?.assigneeUserId || assignee?.id || "",
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
      mentionedIds,
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
          taskId: task.id,
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
    replyTo = null,
    forwarded = false,
    call = null,
    sticker = null,
  }) => {
    const trimmed = (text || "").trim();
    const safeAttachments = Array.isArray(attachments) ? attachments : [];
    const safeSticker = sticker ? String(sticker) : null;
    if (
      !clientId ||
      (!trimmed && safeAttachments.length === 0 && !call && !safeSticker)
    )
      return;
    const senderName =
      currentUserProfile?.name ||
      (authEmail ? authEmail.split("@")[0] : "Usuario");
    const createdMessage = await addDoc(dataCollection("client_chats"), {
      clientId,
      text: trimmed,
      authorName: senderName,
      authorId: currentUserProfile?.id || "",
      authorEmail: authEmail || "",
      mentionedIds,
      attachments: safeAttachments,
      forwarded: Boolean(forwarded),
      replyTo: replyTo
        ? {
            id: replyTo.id || "",
            authorName: replyTo.authorName || "",
            text: (replyTo.text || "").slice(0, 140),
            sticker: replyTo.sticker ? String(replyTo.sticker) : null,
          }
        : null,
      taskRef: taskRef
        ? {
            taskId: taskRef.taskId || "",
            taskType: taskRef.taskType || "",
            taskTitle: taskRef.taskTitle || "",
          }
        : null,
      call: call
        ? { roomId: call.roomId || "", provider: call.provider || "jitsi" }
        : null,
      sticker: safeSticker,
      createdAt: nowIso(),
    });
    const client = clients.find((item) => item.id === clientId);
    const clientName = client?.name || "Cliente";
    for (const uid of mentionedIds) {
      const person = chatMentionables.find((p) => p.id === uid);
      const email = person?.email;
      if (email && uid !== (currentUserProfile?.id || "")) {
        sendNotification(
          call
            ? {
                to: email,
                type: "call_invite",
                senderName,
                clientName,
                roomId: call.roomId,
                clientId,
                messageId: createdMessage.id,
              }
            : {
                to: email,
                type: "chat_mention",
                senderName,
                clientName,
                comment: trimmed,
                clientId,
                messageId: createdMessage.id,
              },
        );
      }
    }
    return createdMessage;
  };

  // Finaliza una llamada (solo el host): marca el mensaje de llamada como
  // terminado para que la tarjeta deje de ser "unible".
  const endClientCall = async (messageId, callObj) => {
    if (!messageId) return;
    const base =
      callObj ||
      clientChats.find((item) => item.id === messageId)?.call ||
      {};
    try {
      await updateDoc(dataDoc("client_chats", messageId), {
        call: { ...base, ended: true, endedAt: nowIso() },
        updatedAt: nowIso(),
      });
    } catch (error) {
      console.warn("[chat:end-call]", error.message);
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

  const setClientChatMute = async (clientId, durationKey) => {
    if (!clientId) return;
    const uid = currentUserProfile?.id || authEmail;
    if (!uid) return;
    const recordId = `${uid}__${clientId}`;
    try {
      if (!durationKey) {
        await deleteDoc(dataDoc("chat_mutes", recordId));
        showToast("Notificaciones activadas para este grupo.", "success");
        return;
      }
      const mutedUntil =
        durationKey === CHAT_MUTE_FOREVER
          ? CHAT_MUTE_FOREVER
          : new Date(
              Date.now() + (CHAT_MUTE_DURATION_MS[durationKey] || 0),
            ).toISOString();
      await setDoc(
        dataDoc("chat_mutes", recordId),
        {
          userId: String(uid),
          clientId: String(clientId),
          mutedUntil,
          updatedAt: nowIso(),
        },
        { merge: true },
      );
      const label =
        durationKey === "8h"
          ? "8 horas"
          : durationKey === "1w"
            ? "1 semana"
            : "siempre";
      showToast(`Grupo silenciado por ${label}.`, "success");
    } catch (error) {
      console.warn("[chat:mute]", error.message);
      showToast("No se pudo cambiar el silencio del grupo.", "error");
    }
  };

  // Abre el chat de un cliente y lo marca como leído.
  const openClientChat = (client) => {
    setSelectedChatClient(client || null);
    if (client?.id) markClientChatRead(client.id);
  };

  const handleIncomingCall = (shouldAnswer) => {
    if (!incomingCall?.id) return;
    const call = incomingCall;
    handledIncomingCallIdsRef.current.add(String(call.id));
    setIncomingCall(null);
    if (!shouldAnswer) return;

    const client =
      clients.find((item) => String(item.id) === String(call.clientId)) || {
        id: call.clientId,
        name: "Cliente",
      };
    setIncomingCallToJoin({
      roomId: call.call.roomId,
      messageId: call.id,
      clientId: call.clientId,
    });
    openClientChat(client);
    handleNavigate("chat");
  }

  useIncomingCallRingtone({
    incomingCall,
    clients,
    nativePushReady,
    handledIncomingCallIdsRef,
    setIncomingCall,
    onAnswer: handleIncomingCall,
  });

  useEffect(() => {
    if (!nativeNotificationAction?.clientId) return;
    const client =
      clients.find(
        (item) =>
          String(item.id) === String(nativeNotificationAction.clientId),
      ) || {
        id: nativeNotificationAction.clientId,
        name: "Cliente",
      };
    if (
      nativeNotificationAction.type === "call" &&
      nativeNotificationAction.roomId
    ) {
      setIncomingCallToJoin({
        roomId: nativeNotificationAction.roomId,
        messageId: nativeNotificationAction.messageId || null,
        clientId: nativeNotificationAction.clientId,
      });
    }
    openClientChat(client);
    handleNavigate("chat");
    setNativeNotificationAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nativeNotificationAction, clients]);

  // Los enlaces enviados por correo vuelven a ClusterAG y abren directamente
  // el cliente y la sala JaaS correcta. Los parámetros se conservan durante el
  // acceso por correo y se eliminan después de consumir la invitación.
  useEffect(() => {
    if (!authEmail || profileBlocked || clients.length === 0) return;

    const callTarget = resolveCallLink(window.location.href, clientChats);
    if (!callTarget) return;
    const { roomId, clientId, messageId, fromPath } = callTarget;

    const signature = `${roomId}:${clientId}:${messageId}`;
    if (handledCallDeepLinkRef.current === signature) return;

    const client = clients.find(
      (item) => String(item.id) === String(clientId),
    );
    if (!client) return;

    handledCallDeepLinkRef.current = signature;
    setIncomingCallToJoin({ roomId, messageId: messageId || null, clientId });
    openClientChat(client);
    handleNavigate("chat");

    window.history.replaceState(
      {},
      document.title,
      getConsumedCallLinkUrl(window.location.href, fromPath),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authEmail, profileBlocked, clients, clientChats]);

  // "Eliminar para todos": borrado suave (deja registro de quién y cuándo lo
  // borró). Solo el autor puede hacerlo (validado también en el backend).
  const deleteChatForEveryone = async (message) => {
    if (!message?.id) return;
    const myId = String(currentUserProfile?.id || "");
    const myEmail = normalizeEmail(authEmail);
    const isAuthor =
      (myId && String(message.authorId || "") === myId) ||
      (myEmail && normalizeEmail(message.authorEmail) === myEmail);
    if (!isAuthor) return;
    try {
      await updateDoc(dataDoc("client_chats", message.id), {
        deleted: true,
        deletedAt: nowIso(),
        deletedById: myId,
        deletedByName:
          currentUserProfile?.name ||
          (authEmail ? authEmail.split("@")[0] : "Usuario"),
        updatedAt: nowIso(),
      });
    } catch (error) {
      console.warn("[chat:delete-all]", error.message);
    }
  };

  // "Eliminar para mí": oculta el mensaje solo para el usuario actual.
  const hideChatForMe = async (message) => {
    if (!message?.id) return;
    const uid = currentUserProfile?.id || authEmail;
    if (!uid) return;
    try {
      await setDoc(
        dataDoc("chat_hidden", `${uid}__${message.id}`),
        {
          userId: String(uid),
          messageId: String(message.id),
          clientId: message.clientId || "",
          hiddenAt: nowIso(),
        },
        { merge: true },
      );
    } catch (error) {
      console.warn("[chat:hide]", error.message);
    }
  };

  // Reaccionar (1 emoji por usuario y mensaje). Volver a tocar el mismo lo quita.
  const toggleChatReaction = async (message, emoji) => {
    if (!message?.id || !emoji) return;
    const uid = currentUserProfile?.id || authEmail;
    if (!uid) return;
    const recordId = `${message.id}__${uid}`;
    const existing = chatReactions.find((item) => item.id === recordId);
    try {
      if (existing && existing.emoji === emoji) {
        await deleteDoc(dataDoc("chat_reactions", recordId));
      } else {
        await setDoc(
          dataDoc("chat_reactions", recordId),
          {
            messageId: String(message.id),
            userId: String(uid),
            userName:
              currentUserProfile?.name ||
              (authEmail ? authEmail.split("@")[0] : "Usuario"),
            clientId: message.clientId || "",
            emoji,
          },
          { merge: false },
        );
      }
    } catch (error) {
      console.warn("[chat:react]", error.message);
    }
  };

  // Fijar / desfijar un mensaje en el hilo (visible para todos).
  const toggleChatPin = async (message) => {
    if (!message?.id || !message.clientId) return;
    const recordId = `${message.clientId}__${message.id}`;
    const existing = chatPins.find((item) => item.id === recordId);
    try {
      if (existing) {
        await deleteDoc(dataDoc("chat_pins", recordId));
      } else {
        await setDoc(
          dataDoc("chat_pins", recordId),
          {
            clientId: message.clientId,
            messageId: String(message.id),
            pinnedByName:
              currentUserProfile?.name ||
              (authEmail ? authEmail.split("@")[0] : "Usuario"),
            pinnedAt: nowIso(),
          },
          { merge: true },
        );
      }
    } catch (error) {
      console.warn("[chat:pin]", error.message);
    }
  };

  // Reenviar un mensaje a otro cliente (copia texto y adjuntos).
  const forwardChatMessage = async (message, targetClientId) => {
    if (!message?.id || !targetClientId) return;
    let attachments = Array.isArray(message.attachments) ? message.attachments : [];
    if (attachments.some((a) => a && a.hasData && !a.data)) {
      const full = await fetchClientChatMessage(message.id);
      if (full?.attachments) attachments = full.attachments;
    }
    await addClientChatMessage({
      clientId: targetClientId,
      text: message.text || "",
      attachments,
      sticker: message.sticker || null,
      forwarded: true,
    });
  };

  // Biblioteca de stickers compartida (webp/gif/png). Se guarda el base64 en la
  // colección chat_stickers y el mensaje solo referencia su id.
  const addChatSticker = async ({ name, type, data }) => {
    if (!data) return null;
    return addDoc(dataCollection("chat_stickers"), {
      name: name || "sticker",
      type: type || "image/webp",
      data,
      authorId: currentUserProfile?.id || "",
      authorName: currentUserProfile?.name || "",
      authorEmail: authEmail || "",
      createdAt: nowIso(),
    });
  };

  const deleteChatSticker = async (stickerId) => {
    if (!stickerId) return;
    try {
      await deleteDoc(dataDoc("chat_stickers", stickerId));
    } catch (error) {
      console.warn("[chat:sticker-del]", error.message);
    }
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
      openTaskDetail(task, taskRef.taskType);
      return;
    }
    const viewByType = {
      accountTask: "account-room",
      editingTask: "editions",
      managementTask: "management-room",
    };
    handleNavigate(viewByType[taskRef.taskType] || "account-room");
  };

  // Directorio completo de personas. ClientChatView lo cruza con la membresía
  // del grupo activo para que menciones y llamadas nunca muestren a todo el
  // equipo indiscriminadamente.
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

  // El servidor deriva la membresía inicial del historial y del manager del
  // cliente. Una vez administrada, devuelve la lista explícita guardada.
  useEffect(() => {
    if (!user || !authEmail || currentUserProfile?.isAnonymous || profileBlocked) {
      setChatDirectory([]);
      setChatGroupsByClient({});
      setChatGroupsLoaded(false);
      setChatGroupIdentityId("");
      return;
    }
    let cancelled = false;
    const loadGroups = () => apiFetch("/api/chat-groups")
      .then((payload) => {
        if (cancelled) return;
        if (Array.isArray(payload?.people)) setChatDirectory(payload.people);
        const nextGroups = {};
        (Array.isArray(payload?.groups) ? payload.groups : []).forEach(
          (group) => {
            if (group?.clientId) nextGroups[String(group.clientId)] = group;
          },
        );
        setChatGroupsByClient(nextGroups);
        setChatGroupIdentityId(String(payload?.currentUserId || ""));
        setChatGroupsLoaded(true);
      })
      .catch((error) => {
        if (!cancelled) console.warn("[chat:groups]", error.message);
      });
    loadGroups();
    const intervalId =
      view === "chat" ? window.setInterval(loadGroups, 15_000) : null;
    window.addEventListener("focus", loadGroups);
    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
      window.removeEventListener("focus", loadGroups);
    };
  }, [
    user,
    authEmail,
    currentUserProfile?.isAnonymous,
    profileBlocked,
    clientChats.length,
    view,
  ]);

  const updateChatGroupMembers = async (clientId, memberIds) => {
    if (!clientId || !canManageChatMembers) return null;
    try {
      const payload = await apiFetch(
        `/api/chat-groups/${encodeURIComponent(clientId)}/members`,
        {
          method: "PUT",
          body: JSON.stringify({ memberIds }),
        },
      );
      if (payload?.group) {
        setChatGroupsByClient((current) => ({
          ...current,
          [String(clientId)]: payload.group,
        }));
      }
      showToast("Integrantes del grupo actualizados.", "success");
      return payload?.group || null;
    } catch (error) {
      console.warn("[chat:group-members]", error.message);
      showToast(error.message || "No se pudo actualizar el grupo.", "error");
      throw error;
    }
  };

  // Mientras el chat de un cliente está abierto, mantenerlo marcado como leído.
  useEffect(() => {
    if (view !== "chat" || !selectedChatClient?.id) return;
    markClientChatRead(selectedChatClient.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedChatClient?.id, clientChats]);

  // Notifica todos los mensajes entrantes. En navegador usa la notificación
  // del sistema; en la app nativa usa una alerta local si push no está listo.
  useEffect(() => {
    const myId = String(currentUserProfile?.id || "");
    if (!myId || !chatMutesLoaded) return;
    const native = isNativeApp();
    if (
      !native &&
      (typeof Notification === "undefined" ||
        browserNotificationPermission !== "granted")
    )
      return;

    const STORAGE_KEY = "cluster_chat_notifications_v2";
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
      if (!native && webPushShownMessageIdsRef.current.has(String(message.id))) {
        webPushShownMessageIdsRef.current.delete(String(message.id));
        notifiedSet.add(message.id);
        changed = true;
        return;
      }
      if (isChatMuteActive(chatMuteMap[String(message.clientId || "")])) {
        notifiedSet.add(message.id);
        changed = true;
        return;
      }
      if (message.deleted || message.call?.roomId) {
        notifiedSet.add(message.id);
        changed = true;
        return;
      }
      // Solo mensajes recientes (evita ráfaga la primera vez que se cargan).
      const age = Date.now() - new Date(message.createdAt || 0).getTime();
      if (age >= 0 && age < 15 * 60 * 1000) {
        const client = clients.find((item) => item.id === message.clientId);
        const mentioned = (message.mentionedIds || [])
          .map(String)
          .includes(myId);
        const title = mentioned
          ? `${message.authorName || "Alguien"} te mencionó · ${
              client?.name || "Cliente"
            }`
          : `Nuevo mensaje · ${client?.name || "Cliente"}`;
        const body = `${message.authorName || "Alguien"}: ${chatMessagePreview(message)}`;
        if (native) {
          if (!nativePushReady) {
            void scheduleNativeNotification({
              title,
              body,
              data: {
                type: "message",
                messageId: String(message.id),
                clientId: String(message.clientId || ""),
              },
            });
          }
        } else {
          try {
            const notification = new Notification(title, {
              body,
              tag: `cluster-message-${message.id}`,
            });
            notification.onclick = () => {
              window.focus();
              if (client) openClientChat(client);
              handleNavigate("chat");
              notification.close();
            };
          } catch {
            /* El contador de no leídos permanece disponible. */
          }
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
  }, [
    clientChats,
    currentUserProfile,
    clients,
    nativePushReady,
    browserNotificationPermission,
    chatMuteMap,
    chatMutesLoaded,
  ]);

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
    if (file.size > EMBEDDED_UPLOAD_MAX_BYTES) {
      alert("El archivo es demasiado grande (máx. 3 MB)");
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
    const currentSize = currentAttachments.reduce(
      (total, attachment) => total + Number(attachment?.size || 0),
      0,
    );
    if (currentSize + file.size > EMBEDDED_UPLOAD_MAX_BYTES) {
      alert("Los adjuntos de la tarea no pueden superar 3 MB en total.");
      return;
    }
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
  const changeModuleEventStatus = async (eventItem, newStatus) => {
    if (!eventItem?.id || !newStatus) return;
    await updateEvent(eventItem.id, { status: newStatus });
  };
  const handleAddPodcastTask = useCallback(
    (dateStr) => {
      const nextDate = normalizeDateOnlyString(dateStr) || getHondurasTodayStr();
      setModalConfig({
        isOpen: true,
        type: "editingTask",
        data: {
          date: nextDate,
          contextId: defaultEditingAssigneeId,
        },
      });
    },
    [defaultEditingAssigneeId],
  );
  const handleAddProductionTask = useCallback((dateStr) => {
    const nextDate = normalizeDateOnlyString(dateStr) || getHondurasTodayStr();
    setModalConfig({
      isOpen: true,
      type: "event",
      data: { date: nextDate, type: "production" },
    });
  }, []);
  const canCreatePodcastTasks = userHasPermission(
    currentUserProfile,
    "create_editing_tasks",
  );
  const canCreateProductionTasks = userHasPermission(
    currentUserProfile,
    "create_calendar_events",
  );

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
      changes: {
        name: data.name,
        profession: data.profession,
        themePalette: data.themePalette,
        themeMode: data.themeMode,
      },
      successMessage: "Perfil actualizado",
      execute: () =>
        updateDoc(dataDoc("users", currentUserProfile.id), {
          name: data.name || currentUserProfile.name || "",
          profession: data.profession || "",
          photo: data.photo || "",
          themePalette: normalizeThemePalette(data.themePalette),
          themeMode: data.themeMode === "light" ? "light" : "dark",
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
    <div className="app-shell flex min-h-0 overflow-hidden flex-col md:flex-row transition-colors duration-300">
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
          className="touch-target p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
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
          className="flex-1 px-4 pt-20 md:pt-4 overflow-y-auto custom-scroll"
          aria-label="Navegación principal"
        >
          <SidebarNavGroup label="Principal">
            {canAccessView(currentUserProfile, "dashboard") && (
              <SidebarItem
                active={view === "dashboard"}
                onClick={() => handleNavigate("dashboard")}
                icon="LayoutDashboard"
                label="Panel Central"
                color="purple"
              />
            )}
          </SidebarNavGroup>

          <SidebarNavGroup label="Clientes & equipo">
            {canAccessView(currentUserProfile, "clients") && (
              <SidebarItem
                active={view === "clients" || view === "client-detail"}
                onClick={() => handleNavigate("clients")}
                icon="Briefcase"
                label="Clientes"
                color="blue"
              />
            )}
            {canAccessView(currentUserProfile, "managers") && (
              <SidebarItem
                active={["managers", "manager-detail"].includes(view)}
                onClick={() => handleNavigate("managers")}
                icon="Users"
                label="Account Managers"
                color="blue"
              />
            )}
            {canAccessView(currentUserProfile, "editors") && (
              <SidebarItem
                active={["editors", "editor-detail"].includes(view)}
                onClick={() => handleNavigate("editors")}
                icon="Video"
                label="Editores"
                color="amber"
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
                badgeTone={chatUnread.total > 0 ? "accent" : "muted"}
              />
            )}
          </SidebarNavGroup>

          <SidebarNavGroup label="Salas de trabajo">
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
                badgeTone={pendingAccounts > 0 ? "urgent" : "muted"}
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
                badgeTone={pendingManagement > 0 ? "urgent" : "muted"}
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
                badgeTone={urgentEditions > 0 ? "urgent" : "muted"}
              />
            )}
          </SidebarNavGroup>

          <SidebarNavGroup label="Calendario">
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
                label="Calendario general"
                color="slate"
              />
            )}
          </SidebarNavGroup>

          <SidebarNavGroup label="Módulos">
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
            {canAccessView(currentUserProfile, "podcast") && (
              <SidebarItem
                active={view === "podcast"}
                onClick={() => handleNavigate("podcast")}
                icon="Microphone"
                label="Podcast"
                color="rose"
              />
            )}
            {canAccessView(currentUserProfile, "production") && (
              <SidebarItem
                active={view === "production"}
                onClick={() => handleNavigate("production")}
                icon="MonitorPlay"
                label="Producción"
                color="cyan"
              />
            )}
          </SidebarNavGroup>

          {currentUserProfile && (
            <SidebarNavGroup label="Configuración">
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
            </SidebarNavGroup>
          )}
        </nav>

        <div className="space-y-2.5 border-t border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => handleNavigate("settings")}
            aria-label="Editar mi perfil"
            title={authEmail || "Editar mi perfil"}
            className="grid w-full grid-cols-[2.5rem_minmax(0,1fr)_1rem] items-center gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:hover:bg-slate-800/60"
          >
            {currentUserProfile?.photo ? (
              <img
                src={currentUserProfile.photo}
                alt={currentUserProfile?.name || "Perfil"}
                className="h-10 w-10 rounded-xl border border-black/5 object-cover dark:border-white/10"
              />
            ) : (
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white ${profileBlocked ? "bg-[var(--status-red-text)]" : "bg-[var(--text-muted)]"}`}
              >
                {(currentUserProfile?.name || "IN").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-bold text-slate-700 dark:text-slate-200">
                {currentUserProfile?.name || "Invitado"}
              </p>
              {currentUserProfile?.profession && (
                <p className="mt-0.5 truncate text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  {currentUserProfile.profession}
                </p>
              )}
              <p className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {sidebarFooterText}
              </p>
            </div>
            <Icon
              name="ChevronRight"
              size={16}
              className="text-slate-400 dark:text-slate-500"
            />
          </button>
          <div className="grid grid-cols-[minmax(0,1fr)_2.75rem_2.75rem] items-center gap-2">
            <span
              className={`inline-flex h-10 min-w-0 items-center justify-center truncate whitespace-nowrap rounded-xl px-2 text-[9px] font-black uppercase tracking-wide ${
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
              className="touch-target inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Icon name={isDark ? "Sun" : "Moon"} size={16} />
            </button>
            {authEmail ? (
              <button
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="touch-target inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <Icon name="LogOut" size={16} />
              </button>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                aria-label="Iniciar sesión"
                title="Iniciar sesión"
                className="touch-target inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
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
        className={`app-main min-h-0 flex-1 relative w-full ${view === "chat" ? "overflow-hidden" : "overflow-y-auto"}`}
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
                roleLabel={
                  ROLE_DEFINITIONS[currentUserProfile?.role]?.label || ""
                }
                onNavigate={handleNavigate}
                onDismiss={dismissOnboarding}
              />
            ) : (
              <DashboardView
                clients={clients}
                managers={managers}
                editors={editors}
                users={appUsers}
                events={events}
                tasks={editingTasks}
                accountTasks={accountTasks}
                managementTasks={managementTasks}
                currentUserProfile={currentUserProfile}
                onSignIn={handleGoogleSignIn}
                onNavigate={handleNavigate}
                onOpenTask={openTaskDetail}
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
              onOpenChat={
                !chatGroupsLoaded ||
                canManageChatMembers ||
                currentChatGroupClientIds.has(String(selectedClient.id))
                  ? () => {
                      openClientChat(selectedClient);
                      handleNavigate("chat");
                    }
                  : null
              }
            />
          )}
          {view === "chat" && (
            <ClientChatView
              clients={clients}
              clientChats={clientChats}
              chatUnread={chatUnread}
              chatMuteMap={chatMuteMap}
              activeClient={selectedChatClient}
              onSelectClient={openClientChat}
              onSetMute={setClientChatMute}
              onSendMessage={addClientChatMessage}
              onOpenTask={openTaskFromChat}
              onDeleteForEveryone={deleteChatForEveryone}
              onDeleteForMe={hideChatForMe}
              hiddenIds={chatHiddenIds}
              reactions={chatReactions}
              pins={chatPins}
              stickers={chatStickers}
              onAddSticker={addChatSticker}
              onDeleteSticker={deleteChatSticker}
              onReact={toggleChatReaction}
              onPin={toggleChatPin}
              onForward={forwardChatMessage}
              onEndCall={endClientCall}
              currentUserId={currentUserProfile?.id || authEmail || ""}
              currentUserProfile={currentUserProfile}
              canModerate={userHasPermission(
                currentUserProfile,
                "moderate_client_chat",
              )}
              mentionables={chatMentionables}
              groupsByClient={chatGroupsByClient}
              groupsLoaded={chatGroupsLoaded}
              currentGroupMemberId={
                chatGroupIdentityId || currentUserProfile?.id || ""
              }
              canManageMembers={canManageChatMembers}
              canLeaveGroup={canLeaveChatGroup}
              onUpdateMembers={updateChatGroupMembers}
              accountTasks={accountTasks}
              editingTasks={editingTasks}
              managementTasks={managementTasks}
              fetchFullMessage={fetchClientChatMessage}
              incomingCallToJoin={incomingCallToJoin}
              onIncomingCallJoined={() => setIncomingCallToJoin(null)}
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
              managers={accountTaskAssignees}
              clients={clients}
              currentUserProfile={currentUserProfile}
              onAdd={(dateStr) =>
                setModalConfig({
                  isOpen: true,
                  type: "accountTask",
                  data: {
                    date: dateStr,
                    contextId: defaultAccountAssigneeId,
                  },
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
              onTaskClick={handleAccountTaskClick}
              onLoadHistory={handleLoadTaskHistory}
              historyLoaded={taskHistoryLoaded}
              historyLoading={isLoadingTaskHistory}
              legacyColorMap={LEGACY_COLOR_MAP}
            />
          )}
          {view === "editions" && (
            <EditionsRoomView
              tasks={editingTasks}
              editors={editingTaskAssignees}
              clients={clients}
              currentUserProfile={currentUserProfile}
              onAdd={(dateStr) =>
                setModalConfig({
                  isOpen: true,
                  type: "editingTask",
                  data: {
                    date: dateStr,
                    contextId: defaultEditingAssigneeId,
                  },
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
              onTaskClick={handleEditingTaskClick}
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
              onTaskClick={handleManagementTaskClick}
              onLoadHistory={handleLoadTaskHistory}
              historyLoaded={taskHistoryLoaded}
              historyLoading={isLoadingTaskHistory}
            />
          )}
          {view === "control-center" && (
            <div className="space-y-6">
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
              <RankingRulesPanel
                rankingSettings={rankingSettings}
                currentUserProfile={currentUserProfile}
                onSave={saveRankingSettings}
              />
            </div>
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
              tasks={editingTasks}
              accountTasks={accountTasks}
              managementTasks={managementTasks}
              themePalette={themePalette}
              isDark={isDark}
              onPaletteChange={(paletteId) =>
                setThemePalette(normalizeThemePalette(paletteId))
              }
              onModeChange={(mode) => setIsDark(mode === "dark")}
            />
          )}
          {view === "general-calendar" && (
            <div className="h-full flex flex-col space-y-4 fade-in">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow">Operación</p>
                  <h2 className="editorial-title text-3xl text-[var(--text)] dark:text-[var(--text)]">
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
                  <h2 className="editorial-title text-3xl text-[var(--text)] dark:text-[var(--text)]">
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
              accountTasks={accountTasks}
              editingTasks={editingTasks}
              editors={editors}
              managers={managers}
              users={appUsers}
              clients={clients}
              rankingSettings={rankingSettings}
            />
          )}
          {view === "podcast" && (
            <PodcastView
              events={events}
              accountTasks={accountTasks}
              editingTasks={editingTasks}
              managers={accountTaskAssignees}
              editors={editingTaskAssignees}
              currentUserProfile={currentUserProfile}
              onAddTask={handleAddPodcastTask}
              canCreateTask={canCreatePodcastTasks}
              onTaskClick={openTaskDetail}
              onEventClick={(item) => handleEventClick(item, "event")}
              onChangeAccountStatus={changeAccountTaskStatus}
              onChangeEditingStatus={changeEditingTaskStatus}
              onChangeEventStatus={changeModuleEventStatus}
            />
          )}
          {view === "production" && (
            <ProductionView
              events={events}
              accountTasks={accountTasks}
              editingTasks={editingTasks}
              managers={accountTaskAssignees}
              editors={editingTaskAssignees}
              currentUserProfile={currentUserProfile}
              onAddTask={handleAddProductionTask}
              canCreateTask={canCreateProductionTasks}
              onTaskClick={openTaskDetail}
              onEventClick={(item) => handleEventClick(item, "event")}
              onChangeAccountStatus={changeAccountTaskStatus}
              onChangeEditingStatus={changeEditingTaskStatus}
              onChangeEventStatus={changeModuleEventStatus}
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

      {view !== "chat" && (
        <MobileBottomNav
          view={view}
          onNavigate={handleNavigate}
          currentUserProfile={currentUserProfile}
          canAccessView={canAccessView}
        />
      )}

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
            managers={accountTaskAssignees}
            editors={editingTaskAssignees}
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
        managers={accountTaskAssignees}
        editors={editingTaskAssignees}
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
        managers={accountTaskAssignees}
        editors={editingTaskAssignees}
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
      {incomingCall &&
        createPortal(
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="incoming-call-title"
          >
            <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-slate-900 p-6 text-center shadow-2xl">
              <div className="mx-auto mb-4 flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/25">
                <Icon name="Phone" size={34} />
              </div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.22em] text-emerald-400">
                Llamada entrante
              </p>
              <h2
                id="incoming-call-title"
                className="text-xl font-black text-white"
              >
                {incomingCall.authorName || "Alguien"} te está llamando
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                {clients.find(
                  (item) =>
                    String(item.id) === String(incomingCall.clientId),
                )?.name || "Conversación de cliente"}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleIncomingCall(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700"
                >
                  <Icon name="X" size={18} />
                  Rechazar
                </button>
                <button
                  type="button"
                  onClick={() => handleIncomingCall(true)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
                >
                  <Icon name="Phone" size={18} />
                  Contestar
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}




const root = createRoot(document.getElementById("root"));
root.render(<App />);
