import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { App as CapacitorApp } from '@capacitor/app';
import {
    LayoutDashboard, Users, Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, X,
    CheckCircle2, Circle, ExternalLink, Briefcase, UserCircle2, Loader2, Trash2,
    Video, ArrowRight, UserPlus, MonitorPlay, Search, Menu, PenTool, LayoutList, CalendarDays,
    AlertTriangle, Smile, Meh, Frown, Instagram, Edit, Inbox, Moon, Sun, MousePointerClick, Flame, ListTree, ChevronDown, Sparkles, Trophy, Medal, BarChart3,
    ShieldCheck, LogIn, LogOut, ClipboardList, Lock, Mail
} from 'lucide-react';
import { signInAnonymously, onAuthStateChanged, signInWithCustomToken, GoogleAuthProvider, isSignInWithEmailLink, sendSignInLinkToEmail, signInWithEmailLink, signInWithPopup, completeGoogleRedirectIfNeeded, signOut as firebaseSignOut } from 'firebase/auth';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit, writeBatch, setDoc, getDocs } from 'firebase/firestore';
import { auth, db, appId } from '/src/app/config/firebase.js';
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
} from '/src/app/constants/app.constants.js';
import { compareDateOnlyStrings, getDateOnlyDiffDays, getHondurasTodayStr, isDateBeforeDateString, normalizeDateOnlyString, resolveStoredTaskRoomDate } from '/src/app/utils/date.js';

void TAILWIND_SAFELIST;

const IconsMap = {
    LayoutDashboard, Users, CalendarIcon, Plus, ChevronLeft, ChevronRight, X, 
    CheckCircle2, Circle, ExternalLink, Briefcase, UserCircle2, Loader2, Trash2, 
    Video, ArrowRight, UserPlus, MonitorPlay, Search, Menu, PenTool, LayoutList, CalendarDays,
    AlertTriangle, Smile, Meh, Frown, Instagram, Edit, Inbox, Moon, Sun, MousePointerClick, Flame, ListTree, ChevronDown, Sparkles, Trophy, Medal, BarChart3,
    ShieldCheck, LogIn, LogOut, ClipboardList, Lock, Mail
};

const Icon = ({ name, size = 18, className = "" }) => {
    const LucideIcon = IconsMap[name];
    return LucideIcon ? <LucideIcon size={size} className={className} /> : null;
};

const AgencyLogo = ({ className }) => {
    return <div className={`bg-purple-600 flex items-center justify-center text-white font-black rounded-lg ${className}`}>C</div>;
};

const GOOGLE_PROVIDER = auth ? new GoogleAuthProvider() : null;
if (GOOGLE_PROVIDER) GOOGLE_PROVIDER.setCustomParameters({ prompt: 'select_account' });
const NATIVE_GOOGLE_TOKEN_STORAGE_KEY = 'cluster_native_google_token';

const VIEW_PERMISSIONS = {
    dashboard: 'view_dashboard',
    clients: 'view_clients',
    'client-detail': 'view_clients',
    managers: 'view_managers',
    'manager-detail': 'view_managers',
    editors: 'view_editors',
    'editor-detail': 'view_editors',
    'account-room': 'view_account_room',
    editions: 'view_editions_room',
    'management-room': 'view_management_room',
    'general-calendar': 'view_general_calendar',
    calendar: 'view_calendar',
    'control-center': 'view_users'
};

const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();
const normalizeNameKey = (value = '') => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const normalizeTimeValue = (value = '') => {
    const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return '';
    const [, hours, minutes] = match;
    const normalizedHours = hours.padStart(2, '0');
    if (Number(normalizedHours) > 23 || Number(minutes) > 59) return '';
    return `${normalizedHours}:${minutes}`;
};
const nowIso = () => new Date().toISOString();
const EMAIL_LINK_STORAGE_KEY = 'cluster_email_link_for_sign_in';
const PENDING_TASK_STATUS_UPDATES_KEY = 'cluster_pending_task_status_updates';
const RETRYABLE_FIRESTORE_ERROR_CODES = new Set(['aborted', 'cancelled', 'data-loss', 'deadline-exceeded', 'failed-precondition', 'internal', 'resource-exhausted', 'unavailable']);
const MANAGEMENT_DIRECTORY = DEFAULT_MANAGEMENT_TEAM.map((member) => ({
    ...member,
    directoryKey: normalizeNameKey(member.name)
}));
const readPendingTaskStatusUpdates = () => {
    if (typeof window === 'undefined') return [];
    try {
        const rawValue = window.localStorage.getItem(PENDING_TASK_STATUS_UPDATES_KEY);
        if (!rawValue) return [];
        const parsedValue = JSON.parse(rawValue);
        if (!Array.isArray(parsedValue)) return [];
        return parsedValue.filter((item) => item?.collectionName && item?.taskId && item?.status);
    } catch (error) {
        console.warn('No se pudo leer la cola local de cambios de estado:', error);
        return [];
    }
};
const writePendingTaskStatusUpdates = (items = []) => {
    if (typeof window === 'undefined') return;
    if (!Array.isArray(items) || items.length === 0) {
        window.localStorage.removeItem(PENDING_TASK_STATUS_UPDATES_KEY);
        return;
    }
    window.localStorage.setItem(PENDING_TASK_STATUS_UPDATES_KEY, JSON.stringify(items));
};
const queuePendingTaskStatusUpdate = ({ collectionName, taskId, status, updatedAt = nowIso(), mutationId = `${taskId}:${updatedAt}:${status}` }) => {
    const nextItems = readPendingTaskStatusUpdates()
        .filter((item) => !(item.collectionName === collectionName && item.taskId === taskId))
        .concat({ collectionName, taskId, status, updatedAt, mutationId, queuedAt: nowIso() });
    writePendingTaskStatusUpdates(nextItems);
    return mutationId;
};
const clearPendingTaskStatusUpdate = ({ collectionName, taskId, mutationId = '' }) => {
    const nextItems = readPendingTaskStatusUpdates()
        .filter((item) => !(item.collectionName === collectionName && item.taskId === taskId && (!mutationId || item.mutationId === mutationId)));
    writePendingTaskStatusUpdates(nextItems);
};
const getFirestoreErrorCode = (error) => String(error?.code || '').replace(/^firestore\//, '');
const shouldRetryTaskStatusUpdate = (error) => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
    const code = getFirestoreErrorCode(error);
    return !code || RETRYABLE_FIRESTORE_ERROR_CODES.has(code);
};
const getManagementDirectoryKey = (value = '') => {
    const sourceName = typeof value === 'string' ? value : value?.name || '';
    const normalized = normalizeNameKey(sourceName);
    if (!normalized) return '';
    const exactMatch = MANAGEMENT_DIRECTORY.find((member) => normalized === member.directoryKey);
    if (exactMatch) return exactMatch.directoryKey;
    const aliasMatch = MANAGEMENT_DIRECTORY.find((member) => normalized.startsWith(`${member.directoryKey} `));
    return aliasMatch?.directoryKey || '';
};
const getManagementDirectoryMeta = (value = '') => {
    const key = getManagementDirectoryKey(value);
    return MANAGEMENT_DIRECTORY.find((member) => member.directoryKey === key) || null;
};
const getResolvedManagementEmail = (record = {}) => {
    const directEmail = normalizeEmail(record.email);
    if (directEmail) return directEmail;
    return normalizeEmail(getManagementDirectoryMeta(record)?.email);
};
const buildRecoveredManagerId = (name = '') => {
    const key = normalizeNameKey(name).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return key ? `recovered_manager_${key}` : '';
};
const findDirectoryMemberByName = (name = '') => {
    const key = normalizeNameKey(name);
    return MANAGEMENT_DIRECTORY.find((member) => member.directoryKey === key) || null;
};
const getUserRolePriority = (role = '') => {
    const priorities = {
        super_admin: 500,
        operations: 400,
        management: 350,
        editor: 300,
        viewer: 100
    };
    return priorities[role] || 200;
};
const getVerificationPriority = (record = {}) => {
    if (record.emailVerified === true || record.emailVerification?.status === 'verified') return 5;
    if (record.emailVerification?.status === 'sent') return 4;
    if (record.emailVerification?.status === 'pending') return 3;
    if (record.emailVerification?.status === 'error') return 2;
    if (normalizeEmail(record.email)) return 1;
    return 0;
};
const getUserRecordScore = (record = {}, referenceCount = 0) => (
    referenceCount * 1000 +
    (normalizeEmail(record.email) ? 220 : 0) +
    (record.authUid ? 180 : 0) +
    (record.isActive === false ? 0 : 20) +
    (record.seeded ? 5 : 10) +
    getVerificationPriority(record) * 25 +
    getUserRolePriority(record.role)
);
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
        if (item.role === 'management') {
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
const chooseCanonicalUserRecord = (group = [], referenceCounts = new Map()) => (
    [...group]
        .sort((left, right) => {
            const scoreDelta = getUserRecordScore(right, referenceCounts.get(right.id) || 0) - getUserRecordScore(left, referenceCounts.get(left.id) || 0);
            if (scoreDelta !== 0) return scoreDelta;
            const leftCreatedAt = String(left.createdAt || '');
            const rightCreatedAt = String(right.createdAt || '');
            const createdAtDelta = leftCreatedAt.localeCompare(rightCreatedAt);
            if (createdAtDelta !== 0) return createdAtDelta;
            return String(left.id || '').localeCompare(String(right.id || ''));
        })[0] || null
);
const getRoleMeta = (role) => ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS.viewer;
const getVerificationMeta = (record) => {
    const safeRecord = record || {};
    if (!normalizeEmail(safeRecord.email)) return { label: 'Sin correo', color: 'slate', isVerified: false };
    if (safeRecord.emailVerified === true || safeRecord.emailVerification?.status === 'verified') return { label: 'Verificado', color: 'emerald', isVerified: true };
    if (safeRecord.emailVerification?.status === 'error') return { label: 'Error de envio', color: 'red', isVerified: false };
    if (safeRecord.emailVerification?.status === 'sent') return { label: 'Verificacion enviada', color: 'amber', isVerified: false };
    if (safeRecord.emailVerification?.status === 'pending') return { label: 'Pendiente verificar', color: 'amber', isVerified: false };
    return { label: 'Con correo', color: 'blue', isVerified: false };
};
const getLinkedProfileLabels = (record) => {
    const safeRecord = record || {};
    const labels = [];
    if (safeRecord.linkedManagerId) labels.push('Manager');
    if (safeRecord.linkedEditorId) labels.push('Editor');
    if (safeRecord.role === 'management') labels.push('Gestion');
    return labels;
};
const getGoogleAuthErrorMessage = (error) => {
    const code = String(error?.code || '').trim();
    if (code === 'auth/unauthorized-domain') return 'Google bloqueado: agrega 127.0.0.1 en Firebase Authorized domains o entra por http://localhost:5000.';
    if (code === 'auth/operation-not-allowed') return 'Google Sign-In no esta habilitado en Firebase Authentication.';
    if (code === 'auth/popup-blocked') return 'El navegador bloqueo el popup de Google.';
    if (code === 'auth/popup-closed-by-user') return 'El popup de Google se cerro antes de completar el login.';
    if (code === 'auth/cancelled-popup-request') return 'Ya habia un popup de autenticacion abierto.';
    return `No se pudo iniciar sesion con Google${code ? ` (${code})` : ''}.`;
};
const getEmailLinkAuthErrorMessage = (error, phase = 'send') => {
    const code = String(error?.code || '').trim();
    if (code === 'auth/unauthorized-domain' || code === 'auth/unauthorized-continue-uri' || code === 'auth/invalid-continue-uri') {
        return 'Firebase bloqueo el enlace: agrega este dominio en Authorized domains de Firebase Authentication.';
    }
    if (code === 'auth/operation-not-allowed') {
        return 'Email link no esta habilitado en Firebase Authentication.';
    }
    if (code === 'auth/invalid-email') {
        return 'El correo no es valido.';
    }
    if (code === 'auth/missing-client-config') {
        return 'Falta configurar el SDK web de Firebase para enviar accesos por correo.';
    }
    if (phase === 'complete' && (code === 'auth/invalid-action-code' || code === 'auth/expired-action-code')) {
        return 'El enlace ya no es valido o vencio.';
    }
    if (phase === 'complete' && code === 'auth/user-disabled') {
        return 'La cuenta asociada esta deshabilitada.';
    }
    if (phase === 'complete' && code === 'auth/user-not-found') {
        return 'No existe una cuenta de Firebase para ese correo.';
    }
    return phase === 'complete'
        ? `No se pudo completar el acceso por correo${code ? ` (${code})` : ''}.`
        : `No se pudo enviar el correo de acceso${code ? ` (${code})` : ''}.`;
};
const buildEmailLinkActionUrl = () => {
    if (typeof window === 'undefined') return '';
    const currentUrl = new URL(window.location.href);
    const target = new URL(window.location.origin + window.location.pathname);
    const firestoreTarget = currentUrl.searchParams.get('firestore');
    if (firestoreTarget) target.searchParams.set('firestore', firestoreTarget);
    target.searchParams.set('email_link', 'pending');
    return target.toString();
};
const buildEmailLinkActionCodeSettings = () => ({
    url: buildEmailLinkActionUrl(),
    handleCodeInApp: true
});
const buildEmailLinkReturnUrl = (href = '') => {
    if (typeof window === 'undefined') return null;
    const currentUrl = new URL(href || window.location.href);
    const continueUrl = currentUrl.searchParams.get('continueUrl');
    let nextUrl = new URL(window.location.origin + window.location.pathname);

    if (continueUrl) {
        try {
            nextUrl = new URL(continueUrl);
        } catch (error) {
            console.warn('No se pudo leer continueUrl del email link:', error);
        }
    } else {
        const firestoreTarget = currentUrl.searchParams.get('firestore');
        if (firestoreTarget) nextUrl.searchParams.set('firestore', firestoreTarget);
    }

    ['email_link', 'mode', 'oobCode', 'apiKey', 'lang', 'continueUrl'].forEach((param) => nextUrl.searchParams.delete(param));
    return nextUrl;
};
const getAuthSource = (authUser = null) => {
    const providerIds = (authUser?.providerData || []).map((provider) => provider?.providerId).filter(Boolean);
    if (providerIds.includes('google.com')) return 'google';
    if (providerIds.includes('password')) return 'email_link';
    if (authUser?.isAnonymous) return 'anonymous';
    return 'auth';
};
const userHasPermission = (profile, permission) => {
    if (!permission) return true;
    if (!profile || profile.isActive === false) return false;
    const permissions = getRoleMeta(profile.role).permissions || [];
    return permissions.includes('*') || permissions.includes(permission);
};
const canAccessView = (profile, view) => userHasPermission(profile, VIEW_PERMISSIONS[view]);
const isCompletedStatus = (status) => ['publicado', 'aprobado', 'cerrado'].includes(status);
const getEditingHierarchyId = (task = {}) => {
    if (task.hierarchy) return task.hierarchy;
    if (task.priority === 'urgente') return 'p1';
    if (task.priority === 'recurrente') return 'p3';
    return 'p2';
};
const isTaskAssignedToProfile = (task, profile, contextIds = []) => {
    const profileId = profile?.id;
    if (!profileId) return false;
    if (task?.assigneeUserId && task.assigneeUserId === profileId) return true;
    return contextIds.filter(Boolean).includes(task?.contextId);
};
const TASK_ROOM_STATE_VERSION = 2;
const getTaskRoomDefaults = ({ preferMine = false } = {}) => ({
    currentDate: getHondurasTodayStr(),
    filterMode: preferMine ? 'all' : 'date',
    ownershipFilter: preferMine ? 'mine' : 'all'
});
const readTaskRoomState = (storageKey, options = {}) => {
    const defaults = getTaskRoomDefaults(options);
    if (typeof window === 'undefined') return defaults;
    try {
        const rawValue = window.localStorage.getItem(storageKey);
        if (!rawValue) return defaults;
        const parsedValue = JSON.parse(rawValue);
        const parsedState = {
            currentDate: resolveStoredTaskRoomDate(parsedValue.currentDate, parsedValue.savedAt, defaults.currentDate),
            filterMode: ['date', 'overdue', 'all'].includes(parsedValue.filterMode) ? parsedValue.filterMode : defaults.filterMode,
            ownershipFilter: ['all', 'mine'].includes(parsedValue.ownershipFilter) ? parsedValue.ownershipFilter : defaults.ownershipFilter
        };
        const savedVersion = Number(parsedValue.version || 0);
        const wasPersonalized = parsedValue.personalized === true;
        const looksLikeLegacyDefault = (!wasPersonalized || savedVersion < TASK_ROOM_STATE_VERSION) &&
            parsedState.filterMode === 'date' &&
            parsedState.ownershipFilter === 'all' &&
            compareDateOnlyStrings(parsedState.currentDate, defaults.currentDate) === 0;
        if (options.preferMine && looksLikeLegacyDefault) return defaults;
        return parsedState;
    } catch (error) {
        console.warn(`No se pudo leer el estado guardado de ${storageKey}:`, error);
        return defaults;
    }
};
const useTaskRoomState = (storageKey, options = {}) => {
    const preferMine = Boolean(options.preferMine);
    const [roomState, setRoomState] = useState(() => readTaskRoomState(storageKey, { preferMine }));

    useEffect(() => {
        const nextState = readTaskRoomState(storageKey, { preferMine });
        setRoomState((current) => {
            const hasChanges =
                nextState.currentDate !== current.currentDate ||
                nextState.filterMode !== current.filterMode ||
                nextState.ownershipFilter !== current.ownershipFilter;
            return hasChanges ? nextState : current;
        });
    }, [storageKey, preferMine]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
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
        setCurrentDate: (value) => setRoomState((current) => ({
            ...current,
            currentDate: typeof value === 'function' ? value(current.currentDate) : value
        })),
        setFilterMode: (value) => setRoomState((current) => ({
            ...current,
            filterMode: typeof value === 'function' ? value(current.filterMode) : value
        })),
        setOwnershipFilter: (value) => setRoomState((current) => ({
            ...current,
            ownershipFilter: typeof value === 'function' ? value(current.ownershipFilter) : value
        }))
    };
};
const EDITING_STATUS_OPTIONS = [
    { id: 'editar', label: 'Por Editar' },
    { id: 'correccion', label: 'En Correccion' },
    { id: 'aprobado', label: 'Aprobado' },
    { id: 'publicado', label: 'Publicado' }
];

// --- APP PRINCIPAL ---
function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null); 
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [isDark, setIsDark] = useState(() => localStorage.getItem('cluster_theme') === 'dark');
    const [view, setView] = useState(() => localStorage.getItem('cluster_os_view') || 'dashboard');
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [isSendingLoginLink, setIsSendingLoginLink] = useState(false);
    const [hasSeededManagementDirectory, setHasSeededManagementDirectory] = useState(false);
    const [hasRecoveredManagerDirectory, setHasRecoveredManagerDirectory] = useState(false);
    const [hasBackfilledIdentityLinks, setHasBackfilledIdentityLinks] = useState(false);
    const [usersLoaded, setUsersLoaded] = useState(false);
    const isReconcilingUsersRef = useRef(false);
    const isBackfillingIdentityLinksRef = useRef(false);
    const isFlushingPendingTaskStatusesRef = useRef(false);
    const lastReconciledDuplicateSignatureRef = useRef('');
    const lastIdentityLinkSyncSignatureRef = useRef('');
    const nativeGoogleTokensSeenRef = useRef(new Set());

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
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: null, id: null, title: '' });
    const [eventAction, setEventAction] = useState({ isOpen: false, event: null, type: null });
    const [taskDetailConfig, setTaskDetailConfig] = useState({ isOpen: false, task: null, type: null });
    const [dayDetailsModal, setDayDetailsModal] = useState({ isOpen: false, date: null }); 

    const authEmail = normalizeEmail(user?.email);
    const authEmailMatches = authEmail ? appUsers.filter((item) => normalizeEmail(item.email) === authEmail) : [];
    const resolvedAuthProfile = authEmailMatches.length > 0 ? chooseCanonicalUserRecord(authEmailMatches) : null;
    const pendingManagementMember = authEmail ? MANAGEMENT_DIRECTORY.find((item) => normalizeEmail(item.email) === authEmail) : null;
    const pendingMatchedManager = authEmail ? managers.find((item) => normalizeEmail(item.email) === authEmail) : null;
    const pendingMatchedEditor = authEmail ? editors.find((item) => normalizeEmail(item.email) === authEmail) : null;
    const pendingPreAuthorizedEditor = authEmail && !pendingMatchedEditor
        ? DEFAULT_EDITORS_TEAM.find((item) => normalizeEmail(item.email) === authEmail)
        : null;
    const pendingRole = !authEmail
        ? 'viewer'
        : pendingManagementMember
          ? (pendingManagementMember.role || 'management')
          : pendingMatchedManager
            ? 'manager'
            : (pendingMatchedEditor || pendingPreAuthorizedEditor)
              ? 'editor'
              : 'viewer';
    const effectiveResolvedAuthProfile = resolvedAuthProfile
        ? {
            ...resolvedAuthProfile,
            role: getUserRolePriority(pendingRole) > getUserRolePriority(resolvedAuthProfile.role) ? pendingRole : resolvedAuthProfile.role,
            managementKey: resolvedAuthProfile.managementKey || pendingManagementMember?.directoryKey || '',
            linkedManagerId: resolvedAuthProfile.linkedManagerId || pendingMatchedManager?.id || '',
            linkedEditorId: resolvedAuthProfile.linkedEditorId || pendingMatchedEditor?.id || ''
        }
        : null;
    const currentUserProfile = !user
        ? null
        : authEmail
          ? effectiveResolvedAuthProfile || {
                id: 'pending-user',
                name: user.displayName || authEmail.split('@')[0],
                email: authEmail,
                role: pendingRole,
                isActive: true,
                pending: true,
                managementKey: pendingManagementMember?.directoryKey || '',
                linkedManagerId: pendingMatchedManager?.id || '',
                linkedEditorId: pendingMatchedEditor?.id || ''
            }
          : {
                id: 'anonymous',
                name: 'Invitado',
                email: '',
                role: 'viewer',
                isActive: true,
                isAnonymous: true
            };
    const currentRoleMeta = getRoleMeta(currentUserProfile?.role);
    const currentVerificationMeta = getVerificationMeta(currentUserProfile);
    const profileBlocked = Boolean(currentUserProfile && currentUserProfile.isActive === false);
    const managementUsers = Array.from(
        appUsers
            .filter((item) => item.role === 'management')
            .reduce((accumulator, item) => {
                const managementKey = item.managementKey || getManagementDirectoryKey(item) || `management:${item.id}`;
                const current = accumulator.get(managementKey);
                if (!current || getUserRecordScore(item) > getUserRecordScore(current)) {
                    accumulator.set(managementKey, item);
                }
                return accumulator;
            }, new Map())
            .values()
    )
        .map((item) => {
            const managementMeta = getManagementDirectoryMeta(item);
            return {
                ...item,
                email: getResolvedManagementEmail(item),
                managementKey: item.managementKey || managementMeta?.directoryKey || ''
            };
        })
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' }));
    const privilegedUsers = appUsers.filter((item) => item.isActive !== false && ['super_admin', 'operations'].includes(item.role));
    const dataCollection = (name) => collection(db, 'artifacts', appId, 'public', 'data', name);
    const dataDoc = (name, id) => doc(db, 'artifacts', appId, 'public', 'data', name, id);
    const sendUserEmailLink = async ({ userId, email, userRecord = {}, reason = 'manual_resend' }) => {
        if (!auth) {
            const unavailableError = new Error('Firebase Authentication no esta disponible.');
            unavailableError.friendlyMessage = 'Firebase Authentication no esta disponible.';
            throw unavailableError;
        }

        const normalizedEmail = normalizeEmail(email || userRecord?.email);
        if (!userId || !normalizedEmail) {
            const invalidUserError = new Error('El usuario necesita un correo valido.');
            invalidUserError.friendlyMessage = 'El usuario necesita un correo valido.';
            throw invalidUserError;
        }

        const verificationState = userRecord?.emailVerification || {};
        const requestedAt = nowIso();

        try {
            auth.languageCode = 'es';
            await sendSignInLinkToEmail(auth, normalizedEmail, buildEmailLinkActionCodeSettings());
            await updateDoc(dataDoc('users', userId), {
                emailVerified: false,
                emailVerification: {
                    ...verificationState,
                    status: 'sent',
                    source: 'email_link',
                    requestedAt: verificationState.requestedAt || requestedAt,
                    sentAt: requestedAt,
                    resendRequestedAt: reason === 'manual_resend' ? requestedAt : (verificationState.resendRequestedAt || ''),
                    requestedBy: currentUserProfile?.id || '',
                    lastSentReason: reason,
                    lastRecipient: normalizedEmail,
                    lastError: ''
                },
                updatedAt: requestedAt
            });
            return { sentAt: requestedAt, email: normalizedEmail };
        } catch (error) {
            const failedAt = nowIso();
            const friendlyMessage = getEmailLinkAuthErrorMessage(error, 'send');
            error.friendlyMessage = friendlyMessage;

            await updateDoc(dataDoc('users', userId), {
                emailVerified: false,
                emailVerification: {
                    ...verificationState,
                    status: 'error',
                    source: 'email_link',
                    requestedAt: verificationState.requestedAt || requestedAt,
                    requestedBy: currentUserProfile?.id || '',
                    resendRequestedAt: reason === 'manual_resend' ? requestedAt : (verificationState.resendRequestedAt || ''),
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
            html.classList.add('dark');
            localStorage.setItem('cluster_theme', 'dark');
        } else {
            html.classList.remove('dark');
            localStorage.setItem('cluster_theme', 'light');
        }
    }, [isDark]);

    useEffect(() => {
        if(!auth) { setLoading(false); return; }
        let isMounted = true;
        const syncAuthState = (nextUser) => {
            if (!isMounted) return;
            setUser(nextUser);
            setLoading(false);
        };
        const waitForAuthState = async () => {
            if (typeof auth.authStateReady === 'function') {
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
                    const storedEmail = normalizeEmail(window.localStorage.getItem(EMAIL_LINK_STORAGE_KEY) || '');
                    const emailForLink = storedEmail || normalizeEmail(window.prompt('Escribe tu correo para completar el acceso enviado por email.') || '');
                    const cleanUrl = buildEmailLinkReturnUrl(window.location.href);

                    if (!emailForLink) {
                        if (cleanUrl) window.history.replaceState({}, document.title, cleanUrl.toString());
                        showToast('Necesitas confirmar el correo para completar el acceso.', 'error');
                        await waitForAuthState();
                        if (!auth.currentUser) await signInAnonymously(auth);
                        return;
                    }

                    await signInWithEmailLink(auth, emailForLink, window.location.href);
                    window.localStorage.removeItem(EMAIL_LINK_STORAGE_KEY);
                    if (cleanUrl) window.history.replaceState({}, document.title, cleanUrl.toString());
                    showToast('Acceso por correo completado.');
                    return;
                }

                await waitForAuthState();
                if (!auth.currentUser && typeof completeGoogleRedirectIfNeeded === 'function') {
                    const completedGoogleRedirect = await completeGoogleRedirectIfNeeded(auth);
                    if (completedGoogleRedirect) return;
                }
                if (auth.currentUser) return;

                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    try {
                        await signInWithCustomToken(auth, __initial_auth_token);
                        return;
                    } catch (tokenError) {
                        console.error('No se pudo iniciar sesion con token inicial:', tokenError);
                    }
                }

                if (!auth.currentUser) await signInAnonymously(auth);
            } catch (error) {
                console.error("Error de Autenticación:", error);
                if (isSignInWithEmailLink(auth, window.location.href)) {
                    const cleanUrl = buildEmailLinkReturnUrl(window.location.href);
                    if (cleanUrl) window.history.replaceState({}, document.title, cleanUrl.toString());
                    showToast(getEmailLinkAuthErrorMessage(error, 'complete'), 'error');
                }
                if (!auth.currentUser) {
                    try {
                        await signInAnonymously(auth);
                    } catch (anonymousError) {
                        console.error('No se pudo iniciar sesion anonima:', anonymousError);
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

        const extractNativeGoogleToken = (url = '') => {
            if (!url || !String(url).startsWith('clusteragency://auth/google')) return '';
            try {
                const target = new URL(url);
                return target.searchParams.get('token') || '';
            } catch {
                return '';
            }
        };

        const consumeNativeGoogleToken = async (token = '') => {
            if (!token) return false;
            if (nativeGoogleTokensSeenRef.current.has(token)) return false;
            nativeGoogleTokensSeenRef.current.add(token);
            window.localStorage.removeItem(NATIVE_GOOGLE_TOKEN_STORAGE_KEY);
            try {
                setIsSigningIn(true);
                await signInWithCustomToken(auth, token);
                if (!auth.currentUser?.email) {
                    throw new Error('Google no devolvio un usuario autenticado.');
                }
                setUser(auth.currentUser);
                setView('dashboard');
                localStorage.setItem('cluster_os_view', 'dashboard');
                showToast('Sesion iniciada con Google');
                return true;
            } catch (error) {
                console.error('No se pudo completar el retorno nativo de Google:', error);
                showToast('No se pudo completar el acceso con Google', 'error');
                return false;
            } finally {
                setIsSigningIn(false);
            }
        };

        const consumeAppUrl = async (url = '') => {
            const token = extractNativeGoogleToken(url);
            if (!token) return false;
            if (nativeGoogleTokensSeenRef.current.has(token)) return false;
            window.localStorage.setItem(NATIVE_GOOGLE_TOKEN_STORAGE_KEY, token);
            return consumeNativeGoogleToken(token);
        };

        const consumeStoredToken = async () => {
            const storedToken = window.localStorage.getItem(NATIVE_GOOGLE_TOKEN_STORAGE_KEY) || '';
            if (!storedToken) return false;
            return consumeNativeGoogleToken(storedToken);
        };

        let appUrlHandle = null;
        let resumeHandle = null;

        CapacitorApp.addListener('appUrlOpen', ({ url }) => {
            consumeAppUrl(url).catch(() => {});
        }).then((handle) => {
            appUrlHandle = handle;
        }).catch((error) => {
            console.error('No se pudo registrar appUrlOpen:', error);
        });

        CapacitorApp.getLaunchUrl().then((result) => {
            consumeAppUrl(result?.url || '').catch(() => {});
        }).catch(() => {});

        consumeStoredToken().catch(() => {});

        CapacitorApp.addListener('resume', () => {
            consumeStoredToken().catch(() => {});
            CapacitorApp.getLaunchUrl().then((result) => {
                consumeAppUrl(result?.url || '').catch(() => {});
            }).catch(() => {});
            completeGoogleRedirectIfNeeded(auth)
                .then((completed) => {
                    if (completed) {
                        setUser(auth.currentUser);
                        setView('dashboard');
                        localStorage.setItem('cluster_os_view', 'dashboard');
                        setIsSigningIn(false);
                    }
                })
                .catch(() => {
                    setIsSigningIn(false);
                });
        }).then((handle) => {
            resumeHandle = handle;
        }).catch(() => {});

        return () => {
            appUrlHandle?.remove?.();
            resumeHandle?.remove?.();
        };
    }, [auth]);

    useEffect(() => {
        if (!user || !db) return;
        const errHandler = (err) => console.error('Error de Firestore:', err);

        const unsubs = [
            onSnapshot(dataCollection('clients'), (snapshot) => {
                const list = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
                setClients(list);
                setSelectedClient((current) => (current ? list.find((item) => item.id === current.id) || null : null));
            }, errHandler),
            onSnapshot(dataCollection('events'), (snapshot) => setEvents(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))), errHandler),
            onSnapshot(dataCollection('managers'), (snapshot) => {
                const list = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
                setManagers(list);
                setSelectedManager((current) => (current ? list.find((item) => item.id === current.id) || null : null));
            }, errHandler),
            onSnapshot(dataCollection('editors'), (snapshot) => {
                const list = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
                setEditors(list);
                setSelectedEditor((current) => (current ? list.find((item) => item.id === current.id) || null : null));
            }, errHandler),
            onSnapshot(dataCollection('editing'), (snapshot) => setEditingTasks(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))), errHandler),
            onSnapshot(dataCollection('account_tasks'), (snapshot) => setAccountTasks(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))), errHandler),
            onSnapshot(dataCollection('management_tasks'), (snapshot) => setManagementTasks(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))), errHandler),
            onSnapshot(dataCollection('users'), (snapshot) => {
                setAppUsers(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() })));
                setUsersLoaded(true);
            }, errHandler),
            onSnapshot(query(dataCollection('audit_logs'), orderBy('createdAt', 'desc'), limit(120)), (snapshot) => setAuditLogs(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))), errHandler)
        ];

        return () => unsubs.forEach((unsubscribe) => unsubscribe());
    }, [user]);

    useEffect(() => {
        if (!db || !user || !usersLoaded || hasSeededManagementDirectory) return;
        const existingKeys = new Set(
            appUsers
                .filter((item) => item.role === 'management')
                .map((item) => item.managementKey || getManagementDirectoryKey(item))
                .filter(Boolean)
        );
        const missingMembers = MANAGEMENT_DIRECTORY.filter((member) => !existingKeys.has(member.directoryKey));
        if (missingMembers.length === 0) {
            setHasSeededManagementDirectory(true);
            return;
        }
        Promise.all(
            missingMembers.map((member) => setDoc(dataDoc('users', `management_${member.directoryKey}`), {
                name: member.name,
                email: normalizeEmail(member.email),
                role: member.role || 'management',
                managementKey: member.directoryKey,
                isActive: true,
                createdAt: nowIso(),
                updatedAt: nowIso(),
                lastSeenAt: '',
                seeded: true,
                linkedManagerId: '',
                linkedEditorId: ''
            }, { merge: true }))
        ).finally(() => setHasSeededManagementDirectory(true));
    }, [db, user, usersLoaded, appUsers, hasSeededManagementDirectory]);

    useEffect(() => {
        if (!db || !user || !usersLoaded || hasRecoveredManagerDirectory) return;
        if (!userHasPermission(currentUserProfile, 'manage_managers')) return;

        const existingManagerIds = new Set(managers.map((item) => item.id).filter(Boolean));
        const existingManagerByName = new Map(
            managers
                .filter((item) => normalizeNameKey(item.name))
                .map((item) => [normalizeNameKey(item.name), item])
        );
        const referencedManagers = new Map();

        const addReferencedManager = ({ id = '', name = '', email = '' }) => {
            const resolvedName = String(name || '').trim();
            const resolvedEmail = normalizeEmail(email);
            const resolvedId = String(id || '').trim() || buildRecoveredManagerId(resolvedName);
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
            const linkedUser = (resolvedEmail
                ? appUsers.find((item) => normalizeEmail(item.email) === resolvedEmail)
                : null) || appUsers.find((item) => normalizeNameKey(item.name) === normalizeNameKey(manager.name));
            const color = ACCOUNT_COLORS[index % ACCOUNT_COLORS.length];

            batch.set(dataDoc('managers', manager.id), {
                name: manager.name,
                email: resolvedEmail,
                color,
                userId: linkedUser?.id || '',
                recovered: true,
                createdAt: stamp,
                updatedAt: stamp
            }, { merge: true });

            if (linkedUser?.id && linkedUser.linkedManagerId !== manager.id) {
                batch.update(dataDoc('users', linkedUser.id), {
                    linkedManagerId: manager.id,
                    updatedAt: stamp
                });
            }

            clients
                .filter((client) => client.managerId === manager.id || (!client.managerId && normalizeNameKey(client.manager) === normalizeNameKey(manager.name)))
                .forEach((client) => {
                    batch.update(dataDoc('clients', client.id), {
                        manager: manager.name,
                        managerId: manager.id,
                        managerUserId: linkedUser?.id || client.managerUserId || '',
                        updatedAt: stamp
                    });
                });

            if (linkedUser?.id) {
                accountTasks
                    .filter((task) => task.contextId === manager.id && task.assigneeUserId !== linkedUser.id)
                    .forEach((task) => {
                        batch.update(dataDoc('account_tasks', task.id), {
                            assigneeUserId: linkedUser.id,
                            updatedAt: stamp
                        });
                    });
            }
        });

        batch.commit()
            .then(() => {
                if (!isCancelled) showToast(`Account Managers restaurados: ${missingManagers.length}`);
            })
            .catch((error) => {
                console.error('No se pudo restaurar el directorio de Account Managers:', error);
            })
            .finally(() => {
                if (!isCancelled) setHasRecoveredManagerDirectory(true);
            });

        return () => {
            isCancelled = true;
        };
    }, [db, user, usersLoaded, hasRecoveredManagerDirectory, currentUserProfile?.id, currentUserProfile?.role, managers, clients, accountTasks, appUsers]);

    useEffect(() => {
        if (!db || !user || !usersLoaded) return;
        const pendingManagementBackfill = appUsers
            .filter((item) => item.role === 'management')
            .map((item) => {
                const resolvedEmail = getResolvedManagementEmail(item);
                const managementKey = item.managementKey || getManagementDirectoryKey(item);
                const needsEmail = Boolean(resolvedEmail) && normalizeEmail(item.email) !== resolvedEmail;
                const needsKey = Boolean(managementKey) && item.managementKey !== managementKey;
                if (!needsEmail && !needsKey) return null;
                return { id: item.id, resolvedEmail, managementKey };
            })
            .filter(Boolean);
        if (pendingManagementBackfill.length === 0) return;

        Promise.all(
            pendingManagementBackfill.map(({ id, resolvedEmail, managementKey }) => updateDoc(dataDoc('users', id), {
                ...(resolvedEmail ? { email: resolvedEmail } : {}),
                ...(managementKey ? { managementKey } : {}),
                updatedAt: nowIso()
            }).catch(() => {}))
        );
    }, [db, user, usersLoaded, appUsers]);

    useEffect(() => {
        if (!db || !user || !authEmail || !usersLoaded) return;
        const existingByUid = appUsers.find((item) => item.authUid && item.authUid === user.uid);
        const existingByEmail = chooseCanonicalUserRecord(appUsers.filter((item) => normalizeEmail(item.email) === authEmail));
        const matchByName = appUsers.find((item) => !normalizeEmail(item.email) && normalizeNameKey(item.name) === normalizeNameKey(user.displayName || authEmail));
        const existing = existingByUid || existingByEmail || matchByName;
        const targetId = existing?.id || `auth_${user.uid || normalizeNameKey(authEmail).replace(/[^a-z0-9]+/g, '_')}`;
        const isForcedSuperAdmin = SUPER_ADMIN_EMAILS.includes(authEmail);
        const existingRole = existing?.role || (privilegedUsers.length === 0 ? 'super_admin' : 'viewer');
        const matchedManager = managers.find((item) => normalizeEmail(item.email) === authEmail) || (existing?.linkedManagerId ? managers.find((item) => item.id === existing.linkedManagerId) : null);
        const matchedEditor = editors.find((item) => normalizeEmail(item.email) === authEmail) || (existing?.linkedEditorId ? editors.find((item) => item.id === existing.linkedEditorId) : null);
        // Verificar si el correo esta en la lista de editores pre-autorizados
        const preAuthorizedEditor = !matchedEditor ? DEFAULT_EDITORS_TEAM.find((item) => normalizeEmail(item.email) === authEmail) : null;
        const roleByLink = existing?.managementKey
            ? 'management'
            : (matchedManager ? 'manager' : (matchedEditor || preAuthorizedEditor ? 'editor' : 'viewer'));
        const bootstrapRole = isForcedSuperAdmin
            ? 'super_admin'
            : (privilegedUsers.length === 0 && !['super_admin', 'operations'].includes(existingRole)
                ? 'super_admin'
                : (getUserRolePriority(roleByLink) > getUserRolePriority(existingRole) ? roleByLink : existingRole));
        const nextRole = bootstrapRole;
        const authSource = getAuthSource(user);
        const emailVerifiedByAuth = Boolean(user.emailVerified) || authSource === 'google' || authSource === 'email_link';
        const verificationState = existing?.emailVerification || {};
        const resolvedName = existing?.name || user.displayName || authEmail.split('@')[0];
        const nextManagementKey = nextRole === 'management' ? (existing?.managementKey || getManagementDirectoryKey(existing) || '') : (existing?.managementKey || '');
        const nextVerification = emailVerifiedByAuth
            ? {
                ...verificationState,
                status: 'verified',
                source: authSource,
                verifiedAt: verificationState.verifiedAt || nowIso(),
                lastError: ''
            }
            : (Object.keys(verificationState).length > 0 ? verificationState : {
                status: 'pending',
                requestedAt: nowIso()
            });
        const basePayload = {
            name: resolvedName,
            email: authEmail,
            isActive: true,
            authUid: user.uid || '',
            emailVerified: emailVerifiedByAuth,
            emailVerification: nextVerification,
            linkedManagerId: existing?.linkedManagerId || matchedManager?.id || '',
            linkedEditorId: existing?.linkedEditorId || matchedEditor?.id || '',
            managementKey: nextManagementKey
        };
        const verificationChanged =
            (verificationState.status || '') !== (nextVerification.status || '') ||
            (verificationState.source || '') !== (nextVerification.source || '') ||
            (verificationState.verifiedAt || '') !== (nextVerification.verifiedAt || '') ||
            (verificationState.requestedAt || '') !== (nextVerification.requestedAt || '') ||
            (verificationState.lastError || '') !== (nextVerification.lastError || '');
        const needsBootstrapSync = !existing ||
            (existing.name || '') !== basePayload.name ||
            normalizeEmail(existing.email) !== basePayload.email ||
            existing.isActive !== true ||
            (existing.authUid || '') !== basePayload.authUid ||
            Boolean(existing.emailVerified) !== basePayload.emailVerified ||
            verificationChanged ||
            (existing.linkedManagerId || '') !== basePayload.linkedManagerId ||
            (existing.linkedEditorId || '') !== basePayload.linkedEditorId ||
            (existing.managementKey || '') !== basePayload.managementKey ||
            (existing.role || '') !== nextRole;
        if (!needsBootstrapSync) return;
        const stamp = nowIso();
        if (existing) {
            updateDoc(dataDoc('users', existing.id), { ...basePayload, role: nextRole, updatedAt: stamp, lastSeenAt: stamp }).catch(() => {});
            return;
        }
        setDoc(dataDoc('users', targetId), { ...basePayload, role: nextRole, createdAt: stamp, updatedAt: stamp, lastSeenAt: stamp }, { merge: true }).catch(() => {});
    }, [db, user, authEmail, usersLoaded, appUsers, privilegedUsers.length, managers, editors]);

    useEffect(() => {
        if (!currentUserProfile) return;
        if (profileBlocked || !canAccessView(currentUserProfile, view)) {
            setView('dashboard');
            localStorage.setItem('cluster_os_view', 'dashboard');
        }
    }, [currentUserProfile, profileBlocked, view]);

    // Notificaciones locales para tareas asignadas al usuario.
    useEffect(() => {
        if (typeof window === 'undefined' || typeof Notification === 'undefined') return;
        if (!currentUserProfile?.id || profileBlocked) return;

        const NOTIF_KEY = 'cluster_browser_task_notifications_v1';
        const HOUR = 3600000;

        const readState = () => {
            try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}'); } catch { return {}; }
        };
        const writeState = (next) => {
            try { localStorage.setItem(NOTIF_KEY, JSON.stringify(next)); } catch { void 0; }
        };

        const tryRequestPermission = () => {
            if (Notification.permission === 'default') {
                Notification.requestPermission().catch(() => {});
            }
        };
        tryRequestPermission();

        const taskNotificationConfigs = [
            {
                collectionType: 'accountTask',
                tasks: accountTasks,
                label: 'Account',
                view: 'account-room',
                defaultTime: '18:00',
                done: (task) => task.status === 'publicado',
                assigned: (task) => isTaskAssignedToProfile(task, currentUserProfile, [currentUserProfile?.linkedManagerId])
            },
            {
                collectionType: 'editingTask',
                tasks: editingTasks,
                label: 'Edicion',
                view: 'editions',
                defaultTime: '18:00',
                done: (task) => task.status === 'aprobado' || task.status === 'publicado',
                assigned: (task) => isTaskAssignedToProfile(task, currentUserProfile, [currentUserProfile?.linkedEditorId])
            },
            {
                collectionType: 'managementTask',
                tasks: managementTasks,
                label: 'Gestion',
                view: 'management-room',
                defaultTime: '',
                done: (task) => task.status === 'cerrado',
                assigned: (task) => isTaskAssignedToProfile(task, currentUserProfile, [currentUserProfile?.id])
            }
        ];

        const fireNotification = (task, config, stage, dueMs) => {
            if (Notification.permission !== 'granted') return;
            const titleMap = {
                '8h': '⏰ Tarea proxima a vencer (8h)',
                'overdue': '🔴 Tarea vencida',
                'nag': '🔴 Tarea vencida hace mas de 24h'
            };
            const client = clients.find((c) => c.id === task.clientId);
            const notificationTitle = stage === '8h'
                ? `Tarea de ${config.label} proxima a vencer (8h)`
                : stage === 'overdue'
                  ? `Tarea de ${config.label} vencida`
                  : `Tarea de ${config.label} vencida hace mas de 24h`;
            const body = [
                task.title,
                task.time ? `Hora limite: ${task.time}` : (config.defaultTime ? `Hora limite: ${config.defaultTime}` : ''),
                client ? `Cliente: ${client.name}` : ''
            ].filter(Boolean).join('\n');
            try {
                const notif = new Notification(notificationTitle || titleMap[stage] || `Tarea de ${config.label}`, {
                    body,
                    tag: `cluster-task-${config.collectionType}-${task.id}-${stage}`,
                    requireInteraction: stage === 'overdue' || stage === 'nag'
                });
                notif.onclick = () => {
                    window.focus();
                    setView(config.view);
                    localStorage.setItem('cluster_os_view', config.view);
                    notif.close();
                };
            } catch { void 0; }
            void dueMs;
        };

        const scan = () => {
            if (document.hidden && Notification.permission !== 'granted') return;
            const state = readState();
            const now = Date.now();
            let mutated = false;

            for (const config of taskNotificationConfigs) {
                for (const task of config.tasks) {
                    if (!task || config.done(task)) continue;
                    if (task.notificationsEnabled === false) continue;
                    if (!config.assigned(task)) continue;
                    if (!task.date) continue;
                    const dueTime = /^\d{2}:\d{2}$/.test(task.time || '') ? task.time : config.defaultTime;
                    if (!dueTime) continue;
                    const dueMs = Date.parse(`${task.date}T${dueTime}:00-06:00`);
                    if (!Number.isFinite(dueMs)) continue;
                    const diff = dueMs - now;
                    const stateKey = `${config.collectionType}:${task.id}`;
                    const seen = state[stateKey] || {};

                    if (diff > 0 && diff <= 8 * HOUR && !seen['8h']) {
                        fireNotification(task, config, '8h', dueMs); seen['8h'] = now; mutated = true;
                    }
                    if (diff <= 0 && !seen.overdue) {
                        fireNotification(task, config, 'overdue', dueMs); seen.overdue = now; mutated = true;
                    } else if (diff <= 0 && seen.overdue && now - (seen.nag || seen.overdue) >= 24 * HOUR) {
                        fireNotification(task, config, 'nag', dueMs); seen.nag = now; mutated = true;
                    }

                    state[stateKey] = seen;
                }
            }

            if (mutated) writeState(state);
        };

        scan();
        const interval = window.setInterval(scan, 60000);
        const onFocus = () => scan();
        window.addEventListener('focus', onFocus);
        return () => {
            window.clearInterval(interval);
            window.removeEventListener('focus', onFocus);
        };
    }, [currentUserProfile?.id, currentUserProfile?.linkedManagerId, currentUserProfile?.linkedEditorId, profileBlocked, accountTasks, editingTasks, managementTasks, clients]);

    useEffect(() => {
        if (!db || !currentUserProfile || profileBlocked || isFlushingPendingTaskStatusesRef.current) return;

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
                        account_tasks: 'manage_account_tasks',
                        editing: 'manage_editing_tasks',
                        management_tasks: 'manage_management_tasks'
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
                        console.error('No se pudo sincronizar el cambio de estado pendiente:', error);
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
            console.error('No se pudo vaciar la cola local de estados:', error);
        });

        if (typeof window === 'undefined') return;
        const handleOnline = () => {
            flushPendingTaskStatusUpdates().catch((error) => {
                isFlushingPendingTaskStatusesRef.current = false;
                console.error('No se pudo resincronizar la cola local de estados:', error);
            });
        };
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [db, currentUserProfile, profileBlocked]);

    const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };
    const closeModal = () => setModalConfig({ isOpen: false, type: null, data: null, isEdit: false });
    const closeDelete = () => setDeleteConfirm({ isOpen: false, type: null, id: null, title: '' });

    const auditAction = async ({ action, entityType, entityId = '', description = '', status = 'success', changes = null }) => {
        if (!db || !user) return;
        try {
            await addDoc(dataCollection('audit_logs'), {
                action,
                entityType,
                entityId,
                description,
                status,
                changes,
                createdAt: nowIso(),
                view,
                actor: {
                    uid: user.uid || '',
                    email: authEmail || '',
                    name: currentUserProfile?.name || user.displayName || 'Invitado',
                    role: currentUserProfile?.role || 'viewer'
                }
            });
        } catch (error) {
            console.error('No se pudo registrar auditoria:', error);
        }
    };

    const ensurePermission = async (permission, description) => {
        if (profileBlocked) {
            showToast('Tu usuario esta inactivo', 'error');
            return false;
        }
        if (userHasPermission(currentUserProfile, permission)) return true;
        showToast('No tienes permisos para esta accion', 'error');
        await auditAction({ action: 'permission_denied', entityType: 'security', description, status: 'denied', changes: { permission } });
        return false;
    };

    const runMutation = async ({ permission, action, entityType, entityId = '', description, changes = null, successMessage, errorMessage = 'No se pudo completar la accion', execute, afterSuccess }) => {
        if (!(await ensurePermission(permission, description))) return null;
        try {
            const result = await execute();
            await auditAction({ action, entityType, entityId: entityId || result?.id || '', description, changes });
            if (successMessage) showToast(successMessage);
            if (afterSuccess) afterSuccess(result);
            return result;
        } catch (error) {
            console.error(error);
            showToast(errorMessage, 'error');
            await auditAction({ action: `${action}_failed`, entityType, entityId, description, status: 'error', changes: { ...(changes || {}), error: error.message } });
            return null;
        }
    };
    const runQueuedTaskStatusMutation = async ({ collectionName, task, newStatus, permission, entityType, description, changes, successMessage = '', errorMessage = 'No se pudo actualizar el estado', afterSuccess }) => {
        if (!task?.id || !newStatus || !collectionName) return null;
        if (!(await ensurePermission(permission, description))) return null;

        const stamp = nowIso();
        const mutationId = queuePendingTaskStatusUpdate({ collectionName, taskId: task.id, status: newStatus, updatedAt: stamp });

        try {
            await updateDoc(dataDoc(collectionName, task.id), { status: newStatus, updatedAt: stamp });
            clearPendingTaskStatusUpdate({ collectionName, taskId: task.id, mutationId });
            await auditAction({ action: 'status_change', entityType, entityId: task.id, description, changes });
            if (successMessage) showToast(successMessage);
            if (afterSuccess) afterSuccess();
            return { id: task.id };
        } catch (error) {
            console.error(error);
            const shouldRetry = shouldRetryTaskStatusUpdate(error);
            if (!shouldRetry) {
                clearPendingTaskStatusUpdate({ collectionName, taskId: task.id, mutationId });
            }
            showToast(shouldRetry ? 'Cambio pendiente de sincronizar. Se reintentara al recargar.' : errorMessage, 'error');
            await auditAction({
                action: shouldRetry ? 'status_change_queued' : 'status_change_failed',
                entityType,
                entityId: task.id,
                description,
                status: shouldRetry ? 'queued' : 'error',
                changes: { ...(changes || {}), error: error.message, collectionName, queued: shouldRetry }
            });
            return null;
        }
    };

    const getPreferredUserRole = (records = []) => (
        [...records].sort((left, right) => getUserRolePriority(right.role) - getUserRolePriority(left.role))[0]?.role || 'viewer'
    );

    const mergeEmailVerificationPayload = (records = [], mergedEmail = '', mergedVerified = false) => {
        if (!mergedEmail) return {};
        const bestRecord = [...records].sort((left, right) => getVerificationPriority(right) - getVerificationPriority(left))[0] || {};
        const currentPayload = bestRecord.emailVerification || {};
        if (mergedVerified) {
            return {
                ...currentPayload,
                status: 'verified',
                source: currentPayload.source || (bestRecord.authUid ? 'google' : 'merged'),
                verifiedAt: currentPayload.verifiedAt || bestRecord.updatedAt || nowIso()
            };
        }
        if (Object.keys(currentPayload).length > 0) return currentPayload;
        return {
            status: 'pending',
            requestedAt: nowIso()
        };
    };

    const reconcileUserDirectory = async ({ silent = false } = {}) => {
        if (!db) return { changed: false, removedCount: 0, signature: '' };

        const [
            usersSnapshot,
            managersSnapshot,
            editorsSnapshot,
            clientsSnapshot,
            accountTasksSnapshot,
            editingTasksSnapshot,
            managementTasksSnapshot
        ] = await Promise.all([
            getDocs(dataCollection('users')),
            getDocs(dataCollection('managers')),
            getDocs(dataCollection('editors')),
            getDocs(dataCollection('clients')),
            getDocs(dataCollection('account_tasks')),
            getDocs(dataCollection('editing')),
            getDocs(dataCollection('management_tasks'))
        ]);

        const usersList = usersSnapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
        const managersList = managersSnapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
        const editorsList = editorsSnapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
        const clientsList = clientsSnapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
        const accountTasksList = accountTasksSnapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
        const editingTasksList = editingTasksSnapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
        const managementTasksList = managementTasksSnapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));

        const duplicateGroups = buildDuplicateUserGroups(usersList);
        const signature = duplicateGroups
            .map((group) => group.map((item) => item.id).sort().join(','))
            .sort()
            .join('|');

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

            const duplicateUsers = group.filter((item) => item.id !== canonicalUser.id);
            if (duplicateUsers.length === 0) return;

            const managementMeta = group
                .filter((item) => item.role === 'management')
                .map((item) => getManagementDirectoryMeta(item))
                .find(Boolean) || null;
            const mergedEmail = group.map((item) => normalizeEmail(item.email)).find(Boolean) || '';
            const mergedVerified = mergedEmail ? group.some((item) => item.emailVerified === true || item.emailVerification?.status === 'verified') : false;
            const mergedVerification = mergeEmailVerificationPayload(group, mergedEmail, mergedVerified);
            const canonicalPatch = {
                name: managementMeta?.name || canonicalUser.name || group[0]?.name || '',
                email: mergedEmail,
                role: managementMeta ? 'management' : getPreferredUserRole(group),
                isActive: group.some((item) => item.isActive !== false),
                seeded: group.some((item) => item.seeded === true),
                authUid: canonicalUser.authUid || group.find((item) => item.authUid)?.authUid || '',
                emailVerified: mergedVerified,
                emailVerification: mergedVerification,
                linkedManagerId: canonicalUser.linkedManagerId || group.find((item) => item.linkedManagerId)?.linkedManagerId || '',
                linkedEditorId: canonicalUser.linkedEditorId || group.find((item) => item.linkedEditorId)?.linkedEditorId || '',
                managementKey: managementMeta?.directoryKey || canonicalUser.managementKey || '',
                updatedAt: stamp
            };

            queueUpdate('users', canonicalUser.id, canonicalPatch);

            duplicateUsers.forEach((duplicateUser) => {
                managersList
                    .filter((item) => item.userId === duplicateUser.id)
                    .forEach((item) => queueUpdate('managers', item.id, { userId: canonicalUser.id, updatedAt: stamp }));

                editorsList
                    .filter((item) => item.userId === duplicateUser.id)
                    .forEach((item) => queueUpdate('editors', item.id, { userId: canonicalUser.id, updatedAt: stamp }));

                clientsList
                    .filter((item) => item.managerUserId === duplicateUser.id)
                    .forEach((item) => queueUpdate('clients', item.id, { managerUserId: canonicalUser.id, updatedAt: stamp }));

                accountTasksList
                    .filter((item) => item.assigneeUserId === duplicateUser.id)
                    .forEach((item) => queueUpdate('account_tasks', item.id, { assigneeUserId: canonicalUser.id, updatedAt: stamp }));

                editingTasksList
                    .filter((item) => item.assigneeUserId === duplicateUser.id)
                    .forEach((item) => queueUpdate('editing', item.id, { assigneeUserId: canonicalUser.id, updatedAt: stamp }));

                managementTasksList
                    .filter((item) => item.assigneeUserId === duplicateUser.id || item.contextId === duplicateUser.id)
                    .forEach((item) => {
                        const taskPatch = { updatedAt: stamp };
                        if (item.assigneeUserId === duplicateUser.id) taskPatch.assigneeUserId = canonicalUser.id;
                        if (item.contextId === duplicateUser.id) taskPatch.contextId = canonicalUser.id;
                        queueUpdate('management_tasks', item.id, taskPatch);
                    });

                queueDelete('users', duplicateUser.id);
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

    const syncIdentityLinks = async ({ email, userId = '', managerId = '', editorId = '', silent = true }) => {
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
                queueUpdate('users', linkedUser.id, { ...userPatch, updatedAt: stamp });
                identityMutations += 1;
            }
        }

        if (linkedManager && linkedUser && linkedManager.userId !== linkedUser.id) {
            queueUpdate('managers', linkedManager.id, { userId: linkedUser.id, updatedAt: stamp });
            identityMutations += 1;
        }

        if (linkedEditor && linkedUser && linkedEditor.userId !== linkedUser.id) {
            queueUpdate('editors', linkedEditor.id, { userId: linkedUser.id, updatedAt: stamp });
            identityMutations += 1;
        }

        if (linkedManager && linkedUser) {
            clients
                .filter((client) => client.managerId === linkedManager.id && client.managerUserId !== linkedUser.id)
                .forEach((client) => {
                    queueUpdate('clients', client.id, { managerUserId: linkedUser.id, updatedAt: stamp });
                    linkedClients += 1;
                });

            accountTasks
                .filter((task) => task.contextId === linkedManager.id && task.assigneeUserId !== linkedUser.id)
                .forEach((task) => {
                    queueUpdate('account_tasks', task.id, { assigneeUserId: linkedUser.id, updatedAt: stamp });
                    migratedAccountTasks += 1;
                });
        }

        if (linkedEditor && linkedUser) {
            editingTasks
                .filter((task) => task.contextId === linkedEditor.id && task.assigneeUserId !== linkedUser.id)
                .forEach((task) => {
                    queueUpdate('editing', task.id, { assigneeUserId: linkedUser.id, updatedAt: stamp });
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

    const requestUserVerification = async (userRecord, successMessage = 'Se envio el correo de acceso') => {
        const email = normalizeEmail(userRecord?.email);
        if (!email || !userRecord?.id) {
            showToast('El usuario necesita un correo valido', 'error');
            return null;
        }
        if (userRecord?.isActive === false) {
            showToast('Activa el usuario antes de enviar el correo de acceso.', 'error');
            return null;
        }
        if (userRecord.emailVerified === true || userRecord.emailVerification?.status === 'verified') {
            showToast('Ese correo ya esta verificado');
            return null;
        }
        return runMutation({
            permission: 'manage_users',
            action: 'request_verification',
            entityType: 'user',
            entityId: userRecord.id,
            description: `Envia acceso por correo para ${email}`,
            changes: { email, channel: 'firebase_auth_email_link' },
            successMessage,
            errorMessage: 'No se pudo enviar el correo de acceso',
            execute: () => sendUserEmailLink({
                userId: userRecord.id,
                email,
                userRecord,
                reason: 'manual_resend'
            })
        });
    };

    const duplicateUserSignature = buildDuplicateUserGroups(appUsers)
        .map((group) => group.map((item) => item.id).sort().join(','))
        .sort()
        .join('|');

    useEffect(() => {
        if (!db || !user || !usersLoaded || !duplicateUserSignature) return;
        if (isReconcilingUsersRef.current || lastReconciledDuplicateSignatureRef.current === duplicateUserSignature) return;

        let isCancelled = false;
        isReconcilingUsersRef.current = true;

        reconcileUserDirectory()
            .then((result) => {
                if (!isCancelled) {
                    lastReconciledDuplicateSignatureRef.current = result?.signature || duplicateUserSignature;
                }
            })
            .catch((error) => {
                console.error('No se pudo reconciliar el directorio de usuarios:', error);
            })
            .finally(() => {
                isReconcilingUsersRef.current = false;
            });

        return () => {
            isCancelled = true;
        };
    }, [db, user, usersLoaded, duplicateUserSignature]);

    useEffect(() => {
        if (!db || !usersLoaded || duplicateUserSignature || hasBackfilledIdentityLinks || !userHasPermission(currentUserProfile, 'manage_users')) return;
        if (isBackfillingIdentityLinksRef.current) return;
        const candidates = appUsers.filter((item) => normalizeEmail(item.email));
        if (candidates.length === 0) {
            setHasBackfilledIdentityLinks(true);
            return;
        }
        let isCancelled = false;
        isBackfillingIdentityLinksRef.current = true;
        Promise.all(candidates.map((item) => syncIdentityLinks({ email: item.email, userId: item.id, silent: true })))
            .finally(() => {
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
        ].join('|');
        if (lastIdentityLinkSyncSignatureRef.current === syncSignature) return;
        lastIdentityLinkSyncSignatureRef.current = syncSignature;
        syncIdentityLinks({ email: authEmail, userId: currentUserProfile.id, silent: true }).catch(() => {
            lastIdentityLinkSyncSignatureRef.current = '';
        });
    }, [db, usersLoaded, duplicateUserSignature, currentUserProfile?.id, authEmail, managers.length, editors.length, clients.length, accountTasks.length, editingTasks.length]);

    const handleNavigate = (newView) => {
        if (!canAccessView(currentUserProfile, newView) || profileBlocked) {
            ensurePermission(VIEW_PERMISSIONS[newView], `Intento de acceso a ${newView}`);
            return;
        }
        setView(newView);
        localStorage.setItem('cluster_os_view', newView);
        setIsMobileMenuOpen(false);
        auditAction({ action: 'navigate', entityType: 'navigation', entityId: newView, description: `Abre la vista ${newView}` });
    };

    const handleEventClick = (event, type) => setEventAction({ isOpen: true, event, type });
    const triggerConfetti = () => { if (window.confetti) window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#9333ea', '#3b82f6', '#10b981', '#f59e0b'] }); };

    const handleGoogleSignIn = async () => {
        if (!auth || !GOOGLE_PROVIDER) return;
        setIsSigningIn(true);
        try {
            const result = await signInWithPopup(auth, GOOGLE_PROVIDER);
            if (!result?.pendingRedirect) {
                showToast('Sesion iniciada con Google');
            }
        } catch (error) {
            console.error(error);
            showToast(getGoogleAuthErrorMessage(error), 'error');
        } finally {
            setIsSigningIn(false);
        }
    };

    const handleEmailLinkSignIn = async (event) => {
        event?.preventDefault();
        if (!auth) return;
        const normalizedEmail = normalizeEmail(loginEmail);
        if (!normalizedEmail) {
            showToast('Escribe tu correo para enviarte el acceso', 'error');
            return;
        }

        setIsSendingLoginLink(true);
        try {
            auth.languageCode = 'es';
            window.localStorage.setItem(EMAIL_LINK_STORAGE_KEY, normalizedEmail);
            await sendSignInLinkToEmail(auth, normalizedEmail, buildEmailLinkActionCodeSettings());
            showToast('Te enviamos un enlace de acceso al correo');
        } catch (error) {
            console.error(error);
            showToast(getEmailLinkAuthErrorMessage(error, 'send'), 'error');
        } finally {
            setIsSendingLoginLink(false);
        }
    };

    const handleLogout = async () => {
        if (!auth) return;
        try {
            await auditAction({ action: 'logout', entityType: 'session', description: 'Cierre de sesion' });
            await firebaseSignOut(auth);
            await signInAnonymously(auth);
            showToast('Sesion cerrada');
        } catch (error) {
            console.error(error);
            showToast('No se pudo cerrar la sesion', 'error');
        }
    };

    const urgentEditions = editingTasks.filter((task) => getEditingHierarchyId(task) === 'p1' && task.status !== 'aprobado' && task.status !== 'publicado').length;
    const pendingAccounts = accountTasks.filter(t => t.status === 'por_disenar').length;
    const pendingManagement = managementTasks.filter((task) => task.status !== 'cerrado').length;

    let allActivities = [
        ...events.map(e => ({ ...e, collectionType: 'event', _color: 'emerald', _icon: 'CalendarIcon', _label: 'Producción' })),
        ...accountTasks.map(t => {
            const manager = managers.find(m => m.id === t.contextId);
            let rawColor = manager?.color || 'indigo';
            let mColor = LEGACY_COLOR_MAP[rawColor] || rawColor; 
            return { ...t, collectionType: 'accountTask', _color: mColor, _icon: 'LayoutList', _label: 'Account' };
        }),
        ...editingTasks.map(t => ({ ...t, collectionType: 'editingTask', _color: 'slate', _icon: 'Video', _label: 'Edición' }))
    ];
    allActivities = [
        ...events.map((event) => ({ ...event, collectionType: 'event', _color: 'emerald', _icon: 'CalendarIcon', _label: 'Produccion' })),
        ...accountTasks.map((task) => {
            const manager = managers.find((item) => item.id === task.contextId);
            const rawColor = manager?.color || 'indigo';
            const mappedColor = LEGACY_COLOR_MAP[rawColor] || rawColor;
            return { ...task, collectionType: 'accountTask', _color: mappedColor, _icon: 'LayoutList', _label: 'Account' };
        }),
        ...editingTasks.map((task) => ({ ...task, collectionType: 'editingTask', _color: 'slate', _icon: 'Video', _label: 'Edicion' })),
        ...managementTasks.map((task) => ({ ...task, collectionType: 'managementTask', _color: 'violet', _icon: 'ShieldCheck', _label: 'Gestion' }))
    ];

    // Acciones Base de Datos
    const addClient = async (fd) => {
        const manager = managers.find(m => m.id === fd.managerId);
        await runMutation({
            permission: 'manage_clients',
            action: 'create',
            entityType: 'client',
            description: `Crea el cliente ${fd.name}`,
            changes: { name: fd.name, managerId: fd.managerId || '' },
            successMessage: 'Cliente creado',
            execute: () => addDoc(dataCollection('clients'), { ...fd, manager: manager ? manager.name : '', managerId: fd.managerId || '', managerUserId: manager?.userId || '', status: 'Activo', mood: 'Contento', createdAt: getHondurasTodayStr(), updatedAt: nowIso(), workflow: { week1: false, week2: false, week3: false, week4: false } }),
            afterSuccess: closeModal
        });
    };
    const updateClient = async (id, data) => { 
        const nextData = { ...data };
        if (Object.prototype.hasOwnProperty.call(nextData, 'managerId')) {
            const manager = managers.find((item) => item.id === nextData.managerId);
            nextData.manager = manager ? manager.name : '';
            nextData.managerUserId = manager?.userId || '';
        }
        await runMutation({
            permission: 'manage_clients',
            action: 'update',
            entityType: 'client',
            entityId: id,
            description: `Actualiza el cliente ${id}`,
            changes: nextData,
            successMessage: 'Cliente actualizado',
            execute: () => updateDoc(dataDoc('clients', id), { ...nextData, updatedAt: nowIso() }),
            afterSuccess: closeModal
        });
    };
    const reassignClientManager = async (client, newManagerId) => {
        if (!newManagerId) return;
        const newManager = managers.find(m => m.id === newManagerId);
        if (!newManager) return;
        await runMutation({
            permission: 'manage_clients',
            action: 'reassign',
            entityType: 'client',
            entityId: client.id,
            description: `Reasigna ${client.name} a ${newManager.name}`,
            changes: { from: client.managerId || '', to: newManagerId },
            successMessage: `Cliente mudado a ${newManager.name}`,
            execute: async () => {
                await updateDoc(dataDoc('clients', client.id), { manager: newManager.name, managerId: newManager.id, updatedAt: nowIso() });
                const tasksToMove = accountTasks.filter((task) => task.clientId === client.id);
                await Promise.all(tasksToMove.map((task) => updateDoc(dataDoc('account_tasks', task.id), { contextId: newManager.id, assigneeUserId: newManager.userId || '', updatedAt: nowIso() })));
            },
            errorMessage: 'Error al reasignar'
        });
    };

    const addManager = async (fd) => {
        const color = ACCOUNT_COLORS[managers.length % ACCOUNT_COLORS.length];
        const normalizedEmail = normalizeEmail(fd.email);
        const result = await runMutation({
            permission: 'manage_managers',
            action: 'create',
            entityType: 'manager',
            description: `Crea manager ${fd.name}`,
            changes: { name: fd.name, email: normalizedEmail },
            successMessage: 'Manager agregado',
            execute: () => addDoc(dataCollection('managers'), { ...fd, email: normalizedEmail, color, createdAt: nowIso(), updatedAt: nowIso(), userId: '' }),
            afterSuccess: closeModal
        });
        if (result?.id && normalizedEmail) await syncIdentityLinks({ email: normalizedEmail, managerId: result.id, silent: true });
    };
    const updateManager = async (id, data) => {
        const normalizedEmail = normalizeEmail(data.email);
        const result = await runMutation({
            permission: 'manage_managers',
            action: 'update',
            entityType: 'manager',
            entityId: id,
            description: `Actualiza manager ${id}`,
            changes: data,
            successMessage: 'Actualizado',
            execute: () => updateDoc(dataDoc('managers', id), { ...data, email: normalizedEmail, updatedAt: nowIso() }),
            afterSuccess: closeModal
        });
        if (result !== null && normalizedEmail) await syncIdentityLinks({ email: normalizedEmail, managerId: id, silent: true });
    };

    const addEditor = async (fd) => {
        const color = EDITOR_COLORS[editors.length % EDITOR_COLORS.length];
        const normalizedEmail = normalizeEmail(fd.email);
        const result = await runMutation({
            permission: 'manage_editors',
            action: 'create',
            entityType: 'editor',
            description: `Crea editor ${fd.name}`,
            changes: { name: fd.name, email: normalizedEmail },
            successMessage: 'Editor agregado',
            execute: () => addDoc(dataCollection('editors'), { ...fd, email: normalizedEmail, color, createdAt: nowIso(), updatedAt: nowIso(), userId: '' }),
            afterSuccess: closeModal
        });
        if (result?.id && normalizedEmail) await syncIdentityLinks({ email: normalizedEmail, editorId: result.id, silent: true });
    };
    const updateEditor = async (id, data) => {
        const normalizedEmail = normalizeEmail(data.email);
        const result = await runMutation({
            permission: 'manage_editors',
            action: 'update',
            entityType: 'editor',
            entityId: id,
            description: `Actualiza editor ${id}`,
            changes: data,
            successMessage: 'Actualizado',
            execute: () => updateDoc(dataDoc('editors', id), { ...data, email: normalizedEmail, updatedAt: nowIso() }),
            afterSuccess: closeModal
        });
        if (result !== null && normalizedEmail) await syncIdentityLinks({ email: normalizedEmail, editorId: id, silent: true });
    };

    const addAccountTask = async (data) => {
        const manager = managers.find((item) => item.id === data.contextId);
        await runMutation({
            permission: 'create_account_tasks',
            action: 'create',
            entityType: 'accountTask',
            description: `Crea tarea de account ${data.title}`,
            changes: data,
            successMessage: 'Agendado',
            execute: () => addDoc(dataCollection('account_tasks'), { ...data, assigneeUserId: manager?.userId || '', notificationsEnabled: data.notificationsEnabled !== false, status: 'por_disenar', createdAt: nowIso(), updatedAt: nowIso() }),
            afterSuccess: closeModal
        });
    };
    const updateAccountTask = async (id, data) => {
        const manager = managers.find((item) => item.id === data.contextId);
        await runMutation({
            permission: 'manage_account_tasks',
            action: 'update',
            entityType: 'accountTask',
            entityId: id,
            description: `Actualiza tarea de account ${id}`,
            changes: data,
            successMessage: 'Guardado',
            execute: () => updateDoc(dataDoc('account_tasks', id), { ...data, assigneeUserId: manager?.userId || '', updatedAt: nowIso() }),
            afterSuccess: closeModal
        });
    };
    const changeAccountTaskStatus = async (task, newStatus) => {
        if (newStatus) {
            await runQueuedTaskStatusMutation({
                collectionName: 'account_tasks',
                task,
                newStatus,
                permission: 'manage_account_tasks',
                entityType: 'accountTask',
                description: `Mueve task ${task.title} a ${newStatus}`,
                changes: { previousStatus: task.status, nextStatus: newStatus },
                afterSuccess: () => { if (newStatus === 'publicado') triggerConfetti(); }
            });
        }
    };

    const addEditingTask = async (data) => {
        const editor = editors.find((item) => item.id === data.contextId);
        await runMutation({
            permission: 'create_editing_tasks',
            action: 'create',
            entityType: 'editingTask',
            description: `Crea video ${data.title}`,
            changes: { ...data, hierarchy: data.hierarchy || getEditingHierarchyId(data) },
            successMessage: 'Agendado',
            execute: () => addDoc(dataCollection('editing'), { ...data, hierarchy: data.hierarchy || getEditingHierarchyId(data), assigneeUserId: editor?.userId || '', notificationsEnabled: data.notificationsEnabled !== false, status: data.status || 'editar', createdAt: nowIso(), updatedAt: nowIso() }),
            afterSuccess: closeModal
        });
    };
    const updateEditingTask = async (id, data) => {
        const editor = editors.find((item) => item.id === data.contextId);
        await runMutation({
            permission: 'manage_editing_tasks',
            action: 'update',
            entityType: 'editingTask',
            entityId: id,
            description: `Actualiza video ${id}`,
            changes: data,
            successMessage: 'Guardado',
            execute: () => updateDoc(dataDoc('editing', id), { ...data, hierarchy: data.hierarchy || getEditingHierarchyId(data), assigneeUserId: editor?.userId || '', updatedAt: nowIso() }),
            afterSuccess: closeModal
        });
    };
    const changeEditingTaskStatus = async (task, newStatus) => {
        if (newStatus) {
            await runQueuedTaskStatusMutation({
                collectionName: 'editing',
                task,
                newStatus,
                permission: 'manage_editing_tasks',
                entityType: 'editingTask',
                description: `Mueve video ${task.title} a ${newStatus}`,
                changes: { previousStatus: task.status, nextStatus: newStatus, hierarchy: getEditingHierarchyId(task) },
                afterSuccess: () => { if (newStatus === 'aprobado' || newStatus === 'publicado') triggerConfetti(); }
            });
        }
    };

    const addManagementTask = async (data) => {
        const member = managementUsers.find((item) => item.id === data.contextId);
        const normalizedDate = normalizeDateOnlyString(data.date);
        const normalizedTime = normalizeTimeValue(data.time);
        if (!normalizedDate || !normalizedTime) {
            showToast('La tarea de gestion requiere fecha y hora limite.', 'error');
            return;
        }
        if (data.notificationsEnabled !== false && !normalizeEmail(member?.email)) {
            showToast('El integrante asignado necesita un correo para recibir recordatorios automaticos.', 'error');
            return;
        }
        await runMutation({
            permission: 'create_management_tasks',
            action: 'create',
            entityType: 'managementTask',
            description: `Crea tarea de gestion ${data.title}`,
            changes: data,
            successMessage: 'Agendado',
            execute: () => addDoc(dataCollection('management_tasks'), { ...data, date: normalizedDate, time: normalizedTime, assigneeUserId: member?.id || '', status: 'pendiente', createdAt: nowIso(), updatedAt: nowIso() }),
            afterSuccess: closeModal
        });
    };
    const updateManagementTask = async (id, data) => {
        const member = managementUsers.find((item) => item.id === data.contextId);
        const normalizedDate = normalizeDateOnlyString(data.date);
        const normalizedTime = normalizeTimeValue(data.time);
        if (!normalizedDate || !normalizedTime) {
            showToast('La tarea de gestion requiere fecha y hora limite.', 'error');
            return;
        }
        if (data.notificationsEnabled !== false && !normalizeEmail(member?.email)) {
            showToast('El integrante asignado necesita un correo para recibir recordatorios automaticos.', 'error');
            return;
        }
        await runMutation({
            permission: 'manage_management_tasks',
            action: 'update',
            entityType: 'managementTask',
            entityId: id,
            description: `Actualiza tarea de gestion ${id}`,
            changes: data,
            successMessage: 'Guardado',
            execute: () => updateDoc(dataDoc('management_tasks', id), { ...data, date: normalizedDate, time: normalizedTime, assigneeUserId: member?.id || '', updatedAt: nowIso() }),
            afterSuccess: closeModal
        });
    };
    const changeManagementTaskStatus = async (task, newStatus) => {
        if (newStatus) {
            await runQueuedTaskStatusMutation({
                collectionName: 'management_tasks',
                task,
                newStatus,
                permission: 'manage_management_tasks',
                entityType: 'managementTask',
                description: `Mueve tarea de gestion ${task.title} a ${newStatus}`,
                changes: { previousStatus: task.status, nextStatus: newStatus }
            });
        }
    };

    const addEvent = async (data) => {
        await runMutation({
            permission: 'manage_calendar',
            action: 'create',
            entityType: 'event',
            description: `Crea evento ${data.title}`,
            changes: data,
            successMessage: 'Agendado',
            execute: () => addDoc(dataCollection('events'), { ...data, createdAt: nowIso(), updatedAt: nowIso() }),
            afterSuccess: closeModal
        });
    };
    const updateEvent = async (id, data) => {
        await runMutation({
            permission: 'manage_calendar',
            action: 'update',
            entityType: 'event',
            entityId: id,
            description: `Actualiza evento ${id}`,
            changes: data,
            successMessage: 'Guardado',
            execute: () => updateDoc(dataDoc('events', id), { ...data, updatedAt: nowIso() }),
            afterSuccess: closeModal
        });
    };

    const addUserRecord = async (data) => {
        const email = normalizeEmail(data.email);
        const requestedRole = data.role || 'viewer';
        const nextActive = data.isActive !== false;
        const managementKey = requestedRole === 'management' ? getManagementDirectoryKey(data.name) : '';
        const existingManagementUser = managementKey
            ? chooseCanonicalUserRecord(appUsers.filter((item) => item.role === 'management' && (item.managementKey || getManagementDirectoryKey(item)) === managementKey))
            : null;
        if (!email) {
            showToast('El correo es obligatorio', 'error');
            return;
        }
        if (existingManagementUser) {
            await updateUserRecord(existingManagementUser.id, { ...data, role: 'management' });
            return;
        }
        if (appUsers.some((item) => normalizeEmail(item.email) === email)) {
            showToast('Ese correo ya existe', 'error');
            return;
        }
        const requestedAt = nowIso();
        const pendingVerification = {
            status: 'pending',
            source: 'email_link',
            requestedAt,
            lastError: ''
        };
        const result = await runMutation({
            permission: 'manage_users',
            action: 'create',
            entityType: 'user',
            description: `Crea usuario ${email}`,
            changes: { name: data.name, email, role: requestedRole, isActive: data.isActive },
            successMessage: null,
            execute: () => addDoc(dataCollection('users'), {
                name: data.name,
                email,
                role: requestedRole,
                isActive: nextActive,
                createdAt: requestedAt,
                updatedAt: requestedAt,
                lastSeenAt: '',
                emailVerified: false,
                emailVerification: pendingVerification,
                managementKey: requestedRole === 'management' ? managementKey : '',
                linkedManagerId: '',
                linkedEditorId: ''
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
                    reason: 'user_created'
                });
                showToast('Usuario creado y correo de acceso enviado.');
            } catch (error) {
                console.error(error);
                showToast('Usuario creado, pero no se pudo enviar el correo de acceso.', 'error');
            }
        } else {
            showToast('Usuario creado');
        }

        await syncIdentityLinks({ email, userId: result.id, silent: true });
    };

    const updateUserRecord = async (id, data) => {
        const email = normalizeEmail(data.email);
        if (!email) {
            showToast('El correo es obligatorio', 'error');
            return;
        }
        if (appUsers.some((item) => item.id !== id && normalizeEmail(item.email) === email)) {
            showToast('Ese correo ya esta en uso', 'error');
            return;
        }
        const current = appUsers.find((item) => item.id === id);
        const nextRole = data.role || current?.role || 'viewer';
        const nextManagementKey = nextRole === 'management' ? getManagementDirectoryKey(data.name || current?.name || '') : '';
        const nextActive = data.isActive !== false;
        const emailChanged = email !== normalizeEmail(current?.email);
        if (privilegedUsers.length === 1 && privilegedUsers[0].id === id && (!['super_admin', 'operations'].includes(nextRole) || !nextActive)) {
            showToast('Debe existir al menos un usuario administrador activo', 'error');
            return;
        }
        const nextVerification = emailChanged
            ? {
                ...(current?.emailVerification || {}),
                status: 'pending',
                source: 'email_link',
                requestedAt: nowIso(),
                sentAt: '',
                failedAt: '',
                verifiedAt: '',
                lastRecipient: email,
                lastError: ''
            }
            : (current?.emailVerification || {});
        const nextEmailVerified = emailChanged ? false : current?.emailVerified === true;
        const result = await runMutation({
            permission: 'manage_users',
            action: 'update',
            entityType: 'user',
            entityId: id,
            description: `Actualiza usuario ${email}`,
            changes: { name: data.name, email, role: nextRole, isActive: nextActive, emailChanged },
            successMessage: emailChanged ? null : 'Usuario actualizado',
            execute: () => updateDoc(dataDoc('users', id), {
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
            showToast('Usuario actualizado');
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
                    emailVerification: nextVerification
                },
                reason: 'email_changed'
            });
            showToast('Usuario actualizado y correo de acceso enviado.');
        } catch (error) {
            console.error(error);
            showToast('Usuario actualizado, pero no se pudo enviar el correo de acceso.', 'error');
        }
    };

    const handleDelete = async () => {
        const { type, id } = deleteConfirm;
        const map = {
            client: { collection: 'clients', permission: 'manage_clients', entityType: 'client', after: () => { setView('clients'); setSelectedClient(null); } },
            manager: { collection: 'managers', permission: 'manage_managers', entityType: 'manager', after: () => { setView('managers'); setSelectedManager(null); } },
            editor: { collection: 'editors', permission: 'manage_editors', entityType: 'editor', after: () => { setView('editors'); setSelectedEditor(null); } },
            event: { collection: 'events', permission: 'manage_calendar', entityType: 'event' },
            accountTask: { collection: 'account_tasks', permission: 'manage_account_tasks', entityType: 'accountTask' },
            editingTask: { collection: 'editing', permission: 'manage_editing_tasks', entityType: 'editingTask' },
            managementTask: { collection: 'management_tasks', permission: 'manage_management_tasks', entityType: 'managementTask' }
        };
        const current = map[type];
        if (!current) {
            closeDelete();
            return;
        }
        await runMutation({
            permission: current.permission,
            action: 'delete',
            entityType: current.entityType,
            entityId: id,
            description: `Elimina ${current.entityType} ${id}`,
            successMessage: 'Eliminado',
            execute: () => deleteDoc(dataDoc(current.collection, id)),
            afterSuccess: () => {
                if (current.after) current.after();
                closeDelete();
            }
        });
    };

    const canEditActivity = (collectionType) => {
        if (collectionType === 'accountTask') return userHasPermission(currentUserProfile, 'manage_account_tasks');
        if (collectionType === 'editingTask') return userHasPermission(currentUserProfile, 'manage_editing_tasks');
        if (collectionType === 'managementTask') return userHasPermission(currentUserProfile, 'manage_management_tasks');
        if (collectionType === 'event') return userHasPermission(currentUserProfile, 'manage_calendar');
        return false;
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950"><Icon name="Loader2" className="animate-spin text-purple-600" size={32}/></div>;

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
                {toast && <Toast message={toast.message} type={toast.type} />}
            </>
        );
    }

    return (
        <div className="flex h-screen text-slate-900 dark:text-slate-100 overflow-hidden flex-col md:flex-row font-sans transition-colors duration-300">
            
            {/* Header Móvil */}
            <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center z-30 shadow-sm shrink-0">
                <div className="flex items-center gap-2"><AgencyLogo className="w-8 h-8 text-sm" /><span className="font-black text-slate-800 dark:text-white text-lg">CLUSTER</span></div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><Icon name={isMobileMenuOpen ? "X" : "Menu"} size={24} /></button>
            </div>

            <div className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity md:hidden ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)} />

            {/* Sidebar */}
            <aside className={`fixed md:relative z-50 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col w-64 shrink-0 transition-transform duration-300 top-0 left-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-8 hidden md:block">
                    <div className="flex items-center gap-3 mb-1"><AgencyLogo className="w-8 h-8 text-lg" /><h1 className="text-2xl font-black text-slate-800 dark:text-white">CLUSTER</h1></div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 pl-11">Agency OS</p>
                </div>
                
                <nav className="flex-1 px-4 space-y-1 pt-20 md:pt-4 overflow-y-auto custom-scroll">
                    <SidebarItem active={view === 'dashboard'} onClick={() => handleNavigate('dashboard')} icon="LayoutDashboard" label="Panel Central" color="purple" />
                    <div className="pt-4 pb-2 pl-4 text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">Equipo & Clientes</div>
                    <SidebarItem active={view === 'clients' || view === 'client-detail'} onClick={() => handleNavigate('clients')} icon="Briefcase" label="Clientes" color="blue" />
                    <SidebarItem active={view === 'managers' || view === 'manager-detail'} onClick={() => handleNavigate('managers')} icon="Users" label="Account Managers" color="indigo" />
                    <SidebarItem active={view === 'editors' || view === 'editor-detail'} onClick={() => handleNavigate('editors')} icon="PenTool" label="Editores" color="rose" />
                    
                    <div className="pt-4 pb-2 pl-4 text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">Salas de Trabajo</div>
                    <SidebarItem active={view === 'account-room'} onClick={() => handleNavigate('account-room')} icon="LayoutList" label="Sala de Accounts" color="indigo" badge={pendingAccounts > 0 ? pendingAccounts : null} badgeColor="bg-indigo-500 text-white" />
                    <SidebarItem active={view === 'management-room'} onClick={() => handleNavigate('management-room')} icon="ShieldCheck" label="Sala de Gestion" color="violet" badge={pendingManagement > 0 ? pendingManagement : null} badgeColor="bg-violet-500 text-white" />
                    <SidebarItem active={view === 'editions'} onClick={() => handleNavigate('editions')} icon="Video" label="Sala de Edición" color="amber" badge={urgentEditions > 0 ? urgentEditions : null} badgeColor="bg-red-500 text-white animate-pulse" />
                    
                    <div className="pt-4 pb-2 pl-4 text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">Control & Global</div>
                    <SidebarItem active={view === 'control-center'} onClick={() => handleNavigate('control-center')} icon="ClipboardList" label="Usuarios y Accesos" color="purple" />
                    <SidebarItem active={view === 'general-calendar'} onClick={() => handleNavigate('general-calendar')} icon="CalendarDays" label="Calendario General" color="blue" />
                    <SidebarItem active={view === 'calendar'} onClick={() => handleNavigate('calendar')} icon="CalendarIcon" label="Agenda Producción" color="emerald" />
                </nav>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${profileBlocked ? 'bg-red-500' : authEmail ? 'bg-gradient-to-tr from-purple-500 to-indigo-500' : 'bg-slate-500'}`}>
                            {(currentUserProfile?.name || 'IN').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{currentUserProfile?.name || 'Invitado'}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{currentRoleMeta.label}{authEmail ? ` · ${authEmail}` : ' · Sin correo'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${
                            profileBlocked
                                ? 'bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                                : currentVerificationMeta.color === 'emerald'
                                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                                  : currentVerificationMeta.color === 'amber'
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                                    : currentVerificationMeta.color === 'blue'
                                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                            {profileBlocked ? 'Bloqueado' : authEmail ? currentVerificationMeta.label : 'Invitado'}
                        </span>
                        <button onClick={() => setIsDark(!isDark)} className="ml-auto p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300"><Icon name={isDark ? 'Sun' : 'Moon'} size={16} /></button>
                        {authEmail ? (
                            <button onClick={handleLogout} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300"><Icon name="LogOut" size={16} /></button>
                        ) : (
                            <button onClick={handleGoogleSignIn} disabled={isSigningIn} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 disabled:opacity-60"><Icon name={isSigningIn ? 'Loader2' : 'LogIn'} size={16} className={isSigningIn ? 'animate-spin' : ''} /></button>
                        )}
                    </div>
                </div>
            </aside>

            {/* Vistas Principales */}
            <main className="flex-1 overflow-y-auto relative w-full h-full">
                <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-full pb-20">
                    {view === 'dashboard' && <DashboardView clients={clients} managers={managers} events={events} tasks={editingTasks} accountTasks={accountTasks} managementTasks={managementTasks} currentUserProfile={currentUserProfile} onSignIn={handleGoogleSignIn} />}
                    {view === 'clients' && <ClientsView clients={clients} onAdd={() => setModalConfig({ isOpen: true, type: 'client' })} onSelect={(c) => { setSelectedClient(c); handleNavigate('client-detail'); }} />}
                    {view === 'client-detail' && selectedClient && <ClientDetail client={selectedClient} managers={managers} onReassignManager={reassignClientManager} onBack={() => handleNavigate('clients')} onUpdate={updateClient} onDelete={() => setDeleteConfirm({ isOpen: true, type: 'client', id: selectedClient.id, title: selectedClient.name })} onEdit={() => setModalConfig({ isOpen: true, type: 'client', data: selectedClient, isEdit: true })} />}
                    {view === 'managers' && <TeamView title="Account Managers" team={managers} iconColor="indigo" onAdd={() => setModalConfig({ isOpen: true, type: 'manager' })} onSelect={(m) => { setSelectedManager(m); handleNavigate('manager-detail'); }} onDelete={(m) => setDeleteConfirm({ isOpen: true, type: 'manager', id: m.id, title: m.name })} onEdit={(m) => setModalConfig({ isOpen: true, type: 'manager', data: m, isEdit: true })} />}
                    {view === 'manager-detail' && selectedManager && <PersonCalendarDetail person={selectedManager} tasks={accountTasks} title="Planificación de Cuentas" baseColor={LEGACY_COLOR_MAP[selectedManager.color] || selectedManager.color || 'indigo'} onBack={() => handleNavigate('managers')} onAddEvent={(dateStr) => setModalConfig({ isOpen: true, type: 'accountTask', data: { date: dateStr, contextId: selectedManager.id } })} onEventClick={(e) => handleEventClick(e, 'accountTask')} />}
                    {view === 'editors' && <TeamView title="Editores" team={editors} iconColor="rose" onAdd={() => setModalConfig({ isOpen: true, type: 'editor' })} onSelect={(e) => { setSelectedEditor(e); handleNavigate('editor-detail'); }} onDelete={(e) => setDeleteConfirm({ isOpen: true, type: 'editor', id: e.id, title: e.name })} onEdit={(e) => setModalConfig({ isOpen: true, type: 'editor', data: e, isEdit: true })} />}
                    {view === 'editor-detail' && selectedEditor && <PersonCalendarDetail person={selectedEditor} tasks={editingTasks} title="Planificación de Edición" baseColor={selectedEditor.color || 'rose'} onBack={() => handleNavigate('editors')} onAddEvent={(dateStr) => setModalConfig({ isOpen: true, type: 'editingTask', data: { date: dateStr, contextId: selectedEditor.id } })} onEventClick={(e) => handleEventClick(e, 'editingTask')} />}
                    {view === 'account-room' && <AccountRoomView tasks={accountTasks} managers={managers} clients={clients} currentUserProfile={currentUserProfile} onAdd={(dateStr) => setModalConfig({ isOpen: true, type: 'accountTask', data: { date: dateStr } })} onEdit={(task) => setModalConfig({ isOpen: true, type: 'accountTask', data: task, isEdit: true })} onChangeStatus={changeAccountTaskStatus} onDelete={(id) => setDeleteConfirm({ isOpen: true, type: 'accountTask', id, title: 'Tarea' })} onTaskClick={(t) => setTaskDetailConfig({ isOpen: true, task: t, type: 'accountTask' })} legacyColorMap={LEGACY_COLOR_MAP} />}
                    {view === 'editions' && <EditionsRoomView tasks={editingTasks} editors={editors} clients={clients} currentUserProfile={currentUserProfile} onAdd={(dateStr) => setModalConfig({ isOpen: true, type: 'editingTask', data: { date: dateStr } })} onEdit={(task) => setModalConfig({ isOpen: true, type: 'editingTask', data: task, isEdit: true })} onChangeStatus={changeEditingTaskStatus} onDelete={(id) => setDeleteConfirm({ isOpen: true, type: 'editingTask', id, title: 'Tarea' })} onTaskClick={(t) => setTaskDetailConfig({ isOpen: true, task: t, type: 'editingTask' })} />}
                    {view === 'management-room' && <ManagementRoomView tasks={managementTasks} members={managementUsers} clients={clients} currentUserProfile={currentUserProfile} onAdd={(dateStr) => setModalConfig({ isOpen: true, type: 'managementTask', data: { date: dateStr } })} onEdit={(task) => setModalConfig({ isOpen: true, type: 'managementTask', data: task, isEdit: true })} onChangeStatus={changeManagementTaskStatus} onDelete={(id) => setDeleteConfirm({ isOpen: true, type: 'managementTask', id, title: 'Tarea de gestion' })} onTaskClick={(t) => setTaskDetailConfig({ isOpen: true, task: t, type: 'managementTask' })} />}
                    {view === 'control-center' && <UsersAccessView users={appUsers} managers={managers} editors={editors} auditLogs={auditLogs} currentUserProfile={currentUserProfile} onAdd={() => setModalConfig({ isOpen: true, type: 'user' })} onEdit={(userRecord) => setModalConfig({ isOpen: true, type: 'user', data: userRecord, isEdit: true })} onResendVerification={requestUserVerification} />}
                    {view === 'general-calendar' && (
                        <div className="h-full flex flex-col space-y-6 fade-in"><h2 className="text-2xl font-black text-slate-800 dark:text-white">Calendario General</h2><div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden"><GeneralCalendarGrid activities={allActivities} onDayClick={(dateStr) => setDayDetailsModal({ isOpen: true, date: dateStr })} /></div></div>
                    )}
                    {view === 'calendar' && (
                        <div className="h-full flex flex-col space-y-6 fade-in"><h2 className="text-2xl font-black text-slate-800 dark:text-white">Agenda de Producciones</h2><div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden"><CalendarGrid events={events.filter(e => e.type === 'production')} baseColor="emerald" onAdd={(dateStr) => setModalConfig({ isOpen: true, type: 'event', data: { date: dateStr, type: 'production' } })} onEventClick={(e) => handleEventClick(e, 'event')} /></div></div>
                    )}
                </div>
            </main>

            {toast && <Toast message={toast.message} type={toast.type} />}
            {modalConfig.isOpen && <Modal config={modalConfig} onClose={closeModal} clients={clients} managers={managers} editors={editors} managementUsers={managementUsers} actions={{ addClient, updateClient, addManager, updateManager, addEditor, updateEditor, addEvent, updateEvent, addAccountTask, updateAccountTask, addEditingTask, updateEditingTask, addManagementTask, updateManagementTask, addUserRecord, updateUserRecord }} />}
            {deleteConfirm.isOpen && <DeleteConfirmModal config={deleteConfirm} onClose={closeDelete} onConfirm={handleDelete} />}
            <EventActionModal config={eventAction} canEdit={canEditActivity(eventAction.type)} onClose={() => setEventAction({ isOpen: false, event: null, type: null })} onEdit={(event, type) => setModalConfig({ isOpen: true, type, data: event, isEdit: true })} onDelete={(event, type) => setDeleteConfirm({ isOpen: true, type, id: event.id, title: event.title })} />
            <DayDetailsModal config={dayDetailsModal} onClose={() => setDayDetailsModal({ isOpen: false, date: null })} activities={allActivities} clients={clients} managers={managers} editors={editors} users={managementUsers} canEditActivity={canEditActivity} onEdit={(act, type) => setModalConfig({ isOpen: true, type, data: act, isEdit: true })} onDelete={(act, type) => setDeleteConfirm({ isOpen: true, type, id: act.id, title: act.title })} />
            <TaskDetailModal config={taskDetailConfig} onClose={() => setTaskDetailConfig({ isOpen: false, task: null, type: null })} clients={clients} managers={managers} editors={editors} users={managementUsers} canEdit={(type) => canEditActivity(type)} onEdit={(task, type) => { setTaskDetailConfig({ isOpen: false, task: null, type: null }); setModalConfig({ isOpen: true, type, data: task, isEdit: true }); }} />
        </div>
    );
}

// --- SUBCOMPONENTES ---
const SidebarItem = ({ active, onClick, icon, label, color, badge, badgeColor }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 group ${active ? `bg-${color}-50 dark:bg-${color}-500/20 text-${color}-700 dark:text-${color}-300 shadow-sm border-${color}-100 dark:border-${color}-500/30` : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 border-transparent"}`}>
        <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'} text-[inherit]`}><Icon name={icon} size={20}/></div>
        <span className="font-bold text-sm flex-1 text-left text-[inherit]">{label}</span>
        {badge && <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>}
        {active && !badge && <Icon name="ChevronRight" size={14} className={`ml-auto text-${color}-400 dark:text-${color}-500`} />}
    </button>
);

const Button = ({ children, onClick, type = 'button', color = 'purple', full, icon }) => (
    <button type={type} onClick={onClick} className={`${full ? 'w-full' : ''} min-h-[46px] whitespace-nowrap bg-${color}-600 hover:bg-${color}-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-${color}-500/30 flex items-center justify-center gap-2 transition-all transform active:scale-95`}>{icon && <Icon name={icon}/>} {children}</button>
);

const EmptyState = ({ icon, text }) => (
    <div className="flex flex-col items-center justify-center p-6 text-center h-full opacity-60">
        <Icon name={icon} size={32} className="text-slate-400 dark:text-slate-500 mb-3" />
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{text}</p>
    </div>
);

const LoginScreen = ({ isDark, onToggleTheme, onGoogleSignIn, isSigningIn, email, onEmailChange, onEmailSubmit, isSendingLoginLink }) => (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
                <AgencyLogo className="w-9 h-9 text-lg" />
                <div>
                    <h1 className="font-black text-lg leading-none">CLUSTER</h1>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-1">Agency OS</p>
                </div>
            </div>
            <button onClick={onToggleTheme} className="p-2 rounded-full bg-white/10 text-slate-200 border border-white/10">
                <Icon name={isDark ? 'Sun' : 'Moon'} size={18} />
            </button>
        </div>

        <main className="flex-1 grid place-items-center px-5 py-8">
            <section className="w-full max-w-md">
                <div className="mb-8">
                    <p className="text-xs font-black uppercase tracking-wider text-purple-300 mb-3">Acceso privado</p>
                    <h2 className="text-3xl font-black leading-tight">Inicia sesion para entrar al panel</h2>
                    <p className="text-sm text-slate-400 mt-3 leading-6">Usa tu cuenta autorizada de Cluster para gestionar clientes, tareas y calendario.</p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={onGoogleSignIn}
                        disabled={isSigningIn || isSendingLoginLink}
                        className="w-full min-h-[52px] rounded-xl bg-white text-slate-900 font-black flex items-center justify-center gap-3 disabled:opacity-60"
                    >
                        <Icon name={isSigningIn ? 'Loader2' : 'LogIn'} size={18} className={isSigningIn ? 'animate-spin' : ''} />
                        Entrar con Google
                    </button>

                    <form onSubmit={onEmailSubmit} className="space-y-3">
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => onEmailChange(event.target.value)}
                            placeholder="correo@cluster.com"
                            className="w-full min-h-[52px] rounded-xl bg-white/10 border border-white/10 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-400 placeholder:text-slate-500"
                        />
                        <button
                            type="submit"
                            disabled={isSigningIn || isSendingLoginLink}
                            className="w-full min-h-[52px] rounded-xl bg-purple-600 hover:bg-purple-700 font-black flex items-center justify-center gap-3 disabled:opacity-60"
                        >
                            <Icon name={isSendingLoginLink ? 'Loader2' : 'Mail'} size={18} className={isSendingLoginLink ? 'animate-spin' : ''} />
                            Enviarme enlace
                        </button>
                    </form>
                </div>
            </section>
        </main>
    </div>
);

const SearchBar = ({ searchTerm, setSearchTerm, placeholder }) => (
    <div className="relative w-full md:w-64 shrink-0">
        <Icon name="Search" className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={16}/>
        <input type="text" placeholder={placeholder} value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} className="min-h-[46px] w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"/>
    </div>
);

const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
        <div><p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{title}</p><p className="text-3xl font-black text-slate-800 dark:text-white">{value}</p></div>
        <div className={`p-3 rounded-xl bg-${color}-50 dark:bg-${color}-500/20 text-${color}-600 dark:text-${color}-400`}><Icon name={icon} size={24}/></div>
    </div>
);

const Input = ({ label, ...props }) => (<div>{label && <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">{label}</label>}<input className="w-full p-4 md:p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500" {...props} /></div>);

const CheckItem = ({ label, checked, onToggle }) => (
    <button onClick={onToggle} className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${checked ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 text-green-800 dark:text-green-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-600'}`}><span className="font-bold text-sm">{label}</span>{checked ? <Icon name="CheckCircle2" size={20} className="text-green-500" /> : <Icon name="Circle" size={20} />}</button>
);

const clampPercent = (value = 0) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(100, numeric));
};

const DASHBOARD_PALETTE = {
    emerald: { solid: '#22c55e', strong: '#15803d' },
    amber: { solid: '#f59e0b', strong: '#b45309' },
    red: { solid: '#ef4444', strong: '#b91c1c' },
    purple: { solid: '#9333ea', strong: '#6b21a8' },
    violet: { solid: '#8b5cf6', strong: '#6d28d9' },
    indigo: { solid: '#6366f1', strong: '#4338ca' },
    blue: { solid: '#3b82f6', strong: '#1d4ed8' },
    cyan: { solid: '#06b6d4', strong: '#0e7490' },
    orange: { solid: '#f97316', strong: '#c2410c' },
    fuchsia: { solid: '#d946ef', strong: '#a21caf' },
    stone: { solid: '#78716c', strong: '#44403c' },
    slate: { solid: '#64748b', strong: '#334155' }
};

const getDashboardPalette = (name = 'slate') => DASHBOARD_PALETTE[name] || DASHBOARD_PALETTE.slate;

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
};

const describeArc = (centerX, centerY, radius, startAngle, endAngle) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');
};

const buildRingSegments = (segments, startAngle = -90, totalAngle = 360, gapAngle = 6) => {
    const activeSegments = segments.filter((segment) => segment.value > 0);
    if (activeSegments.length === 0) return [];

    const normalizedGap = activeSegments.length === 1 ? 0 : gapAngle;
    const gapCount = Math.max(activeSegments.length - 1, 0);
    const availableAngle = Math.max(totalAngle - (normalizedGap * gapCount), 0);
    const totalValue = activeSegments.reduce((sum, segment) => sum + segment.value, 0) || 1;
    let cursor = startAngle;

    return activeSegments.map((segment, index) => {
        const sweepAngle = Math.min((segment.value / totalValue) * availableAngle, 359.999);
        const segmentStart = cursor;
        const segmentEnd = cursor + sweepAngle;
        cursor = segmentEnd + (index < activeSegments.length - 1 ? normalizedGap : 0);
        return { ...segment, startAngle: segmentStart, endAngle: segmentEnd };
    });
};

const CompactMetricBar = ({ label, value, color = 'slate', meta, helper }) => {
    const palette = getDashboardPalette(color);
    const safeValue = clampPercent(value);

    return (
        <div className="min-w-0">
            <div className="mb-1.5 flex items-start justify-between gap-3">
                <span className="min-w-0 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">{label}</span>
                <span className="shrink-0 text-[11px] font-bold" style={{ color: palette.strong }}>{meta || `${Math.round(safeValue)}%`}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${safeValue}%`, background: `linear-gradient(90deg, ${palette.solid}, ${palette.strong})` }} />
            </div>
            {helper ? <p className="mt-1.5 break-words text-[10px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">{helper}</p> : null}
        </div>
    );
};

const PortfolioHealthChart = ({ totalClients, contentos, neutrales, enRiesgo }) => {
    const segments = [
        { key: 'healthy', label: 'Sanos', value: contentos, color: '#22c55e', strong: '#15803d' },
        { key: 'neutral', label: 'Neutral', value: neutrales, color: '#f59e0b', strong: '#b45309' },
        { key: 'risk', label: 'Riesgo', value: enRiesgo, color: '#ef4444', strong: '#b91c1c' }
    ];
    const ringSegments = buildRingSegments(segments);
    const healthScore = totalClients > 0 ? Math.round((((contentos * 1) + (neutrales * 0.55) + (enRiesgo * 0.15)) / totalClients) * 100) : 0;
    const attentionCount = neutrales + enRiesgo;
    const dominantSegment = [...segments].sort((left, right) => right.value - left.value)[0];
    const healthLabel = totalClients === 0 ? 'Sin datos' : (healthScore >= 75 ? 'Estable' : (healthScore >= 45 ? 'Mixta' : 'Fragil'));

    return (
        <div className="mt-5 grid grid-cols-1 gap-5">
            <div className="relative mx-auto h-44 w-44">
                <svg viewBox="0 0 220 220" className="h-full w-full">
                    <circle cx="110" cy="110" r="70" fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth="20" />
                    {ringSegments.map((segment) => (
                        <path key={segment.key} d={describeArc(110, 110, 70, segment.startAngle, segment.endAngle)} fill="none" stroke={segment.color} strokeWidth="20" strokeLinecap="round" />
                    ))}
                    <circle cx="110" cy="110" r="86" fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="1.5" strokeDasharray="4 8" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-24 w-24 rounded-full border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Indice</span>
                        <span className="mt-1 text-3xl font-black leading-none text-slate-900 dark:text-white">{healthScore}</span>
                        <span className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{healthLabel}</span>
                    </div>
                </div>
            </div>

            <div className="min-w-0 space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">Pulso actual</p>
                        <p className="mt-1 break-words text-lg font-black leading-tight text-slate-900 dark:text-white">{dominantSegment?.label || 'Sin datos'}</p>
                        <p className="break-words text-xs leading-relaxed font-medium text-slate-500 dark:text-slate-400">{totalClients > 0 ? Math.round(((dominantSegment?.value || 0) / totalClients) * 100) : 0}% de la cartera</p>
                    </div>
                    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">En foco</p>
                        <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">{attentionCount}</p>
                        <p className="break-words text-xs leading-relaxed font-medium text-slate-500 dark:text-slate-400">{totalClients > 0 ? Math.round((attentionCount / totalClients) * 100) : 0}% con seguimiento cercano</p>
                    </div>
                </div>

                {segments.map((segment) => {
                    const percent = totalClients > 0 ? Math.round((segment.value / totalClients) * 100) : 0;
                    return (
                        <div key={segment.key} className="min-w-0 rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0 flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                                    <span className="truncate text-sm font-bold text-slate-700 dark:text-slate-200">{segment.label}</span>
                                </div>
                                <div className="shrink-0 text-right">
                                    <span className="text-sm font-black text-slate-900 dark:text-white">{segment.value}</span>
                                    <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">{percent}%</span>
                                </div>
                            </div>
                            <div className="mt-2 h-2.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percent}%`, background: `linear-gradient(90deg, ${segment.color}, ${segment.strong})` }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ProgressOverviewChart = ({ completionPercent, completedTasks, totalTasks, groups }) => {
    const safePercent = clampPercent(completionPercent);
    const pendingTasks = Math.max(totalTasks - completedTasks, 0);
    const radius = 72;
    const circumference = 2 * Math.PI * radius;
    const strokeOffset = circumference * (1 - (safePercent / 100));

    return (
        <div className="mt-5 grid grid-cols-1 gap-5">
            <div className="relative mx-auto h-44 w-44">
                <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90">
                    <defs>
                        <linearGradient id="dashboard-progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="55%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                    </defs>
                    <circle cx="110" cy="110" r={radius} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="18" />
                    <circle cx="110" cy="110" r={radius} fill="none" stroke="url(#dashboard-progress-gradient)" strokeWidth="18" strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={strokeOffset} />
                    <circle cx="110" cy="110" r="86" fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="1.5" strokeDasharray="4 8" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-24 w-24 rounded-full border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Avance</span>
                        <span className="mt-1 text-3xl font-black leading-none text-slate-900 dark:text-white">{Math.round(safePercent)}%</span>
                        <span className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{completedTasks}/{totalTasks}</span>
                    </div>
                </div>
            </div>

            <div className="min-w-0 space-y-3">
                {groups.map((group) => {
                    const palette = getDashboardPalette(group.color);
                    return (
                        <div key={group.key} className="min-w-0 rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: palette.solid }} />
                                        <span className="break-words text-sm font-bold leading-tight text-slate-800 dark:text-slate-100">{group.label}</span>
                                    </div>
                                    <p className="mt-1 break-words pr-2 text-xs leading-relaxed font-medium text-slate-500 dark:text-slate-400">{group.note}</p>
                                </div>
                                <div className="w-16 shrink-0 text-right">
                                    <p className="text-lg font-black" style={{ color: palette.strong }}>{group.percent}%</p>
                                    <p className="break-words text-[10px] leading-tight font-semibold text-slate-500 dark:text-slate-400">{group.completed}/{group.total}</p>
                                </div>
                            </div>
                            <div className="mt-2.5 h-3 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${group.percent}%`, background: `linear-gradient(90deg, ${palette.solid}, ${palette.strong})` }} />
                            </div>
                        </div>
                    );
                })}

                <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-2.5 text-center dark:border-slate-800 dark:bg-slate-950/50">
                        <p className="break-words text-[9px] font-black uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">Total</p>
                        <p className="mt-1 text-lg font-black leading-none text-slate-900 dark:text-white">{totalTasks}</p>
                    </div>
                    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-2.5 text-center dark:border-slate-800 dark:bg-slate-950/50">
                        <p className="break-words text-[9px] font-black uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">Hechas</p>
                        <p className="mt-1 text-lg font-black leading-none text-slate-900 dark:text-white">{completedTasks}</p>
                    </div>
                    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/80 p-2.5 text-center dark:border-slate-800 dark:bg-slate-950/50">
                        <p className="break-words text-[9px] font-black uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">Abiertas</p>
                        <p className="mt-1 text-lg font-black leading-none text-slate-900 dark:text-white">{pendingTasks}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- DASHBOARD PRINCIPAL CON RANKING ---
const DashboardView = ({ clients, managers, events, tasks, accountTasks, managementTasks = [], currentUserProfile, onSignIn }) => {
    const contentos = clients.filter(c => c.mood === 'Contento').length;
    const neutrales = clients.filter(c => c.mood === 'Neutral').length;
    const enRiesgo = clients.filter(c => c.mood === 'En Riesgo').length;
    const realTotalClients = clients.length;
    const totalClients = realTotalClients || 1;

    const completedEditingTasks = tasks.filter((task) => isCompletedStatus(task.status)).length;
    const completedAccountTasks = accountTasks.filter((task) => task.status === 'aprobado_internamente' || task.status === 'publicado').length;
    const completedManagementTasks = managementTasks.filter((task) => task.status === 'cerrado').length;

    const progressGroups = [
        { key: 'editing', label: 'Edicion', note: 'Produccion audiovisual', total: tasks.length, completed: completedEditingTasks, color: 'amber' },
        { key: 'account', label: 'Accounts', note: 'Seguimiento comercial', total: accountTasks.length, completed: completedAccountTasks, color: 'indigo' },
        { key: 'management', label: 'Gestion', note: 'Operacion interna', total: managementTasks.length, completed: completedManagementTasks, color: 'cyan' }
    ].map((group) => ({
        ...group,
        percent: group.total > 0 ? Math.round((group.completed / group.total) * 100) : 0
    }));

    const completedTasks = progressGroups.reduce((sum, group) => sum + group.completed, 0);
    const totalTasks = progressGroups.reduce((sum, group) => sum + group.total, 0);
    const compPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const todayStr = getHondurasTodayStr();
    
    // Recolectar tareas urgentes o atrasadas
    const urgentTasks = [
        ...tasks.filter(t => (t.priority === 'urgente' || isDateBeforeDateString(t.date, todayStr)) && t.status !== 'aprobado' && t.status !== 'publicado').map(t => ({...t, _type: 'Edición'})),
        ...accountTasks.filter(t => isDateBeforeDateString(t.date, todayStr) && t.status !== 'publicado').map(t => ({...t, _type: 'Account'}))
    ].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 6);

    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = new Date().toLocaleDateString('es-HN', dateOptions);

    // LOGICA DEL RANKING DE ACCOUNT MANAGERS
    const managerStats = managers.map(m => {
        // Tareas
        const mTasks = accountTasks.filter(t => t.contextId === m.id);
        const mCompletedTasksArr = mTasks.filter(t => t.status === 'aprobado_internamente' || t.status === 'publicado');
        const mCompletedTasks = mCompletedTasksArr.length;
        let taskScore = 0;
        mCompletedTasksArr.forEach(t => {
            const h = t.hierarchy || (t.priority === 'urgente' ? 'p1' : (t.priority === 'recurrente' ? 'p3' : 'p2'));
            if (h === 'p1') taskScore += 10;
            else if (h === 'p2') taskScore += 5;
            else taskScore += 2;
        });

        // Clientes
        const mClients = clients.filter(c => c.managerId === m.id);
        let workflowTotal = mClients.length * 4;
        let workflowCompleted = 0;
        mClients.forEach(c => {
            if(c.workflow?.week1) workflowCompleted++;
            if(c.workflow?.week2) workflowCompleted++;
            if(c.workflow?.week3) workflowCompleted++;
            if(c.workflow?.week4) workflowCompleted++;
        });
        const clientScore = workflowCompleted * 3;

        // Puntuación Combinada
        const finalScore = taskScore + clientScore;

        let mappedColorName = LEGACY_COLOR_MAP[m.color] || m.color || 'slate';

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

    const maxTaskScore = Math.max(...managerStats.map(s => s.taskScore), 1);
    const maxClientScore = Math.max(...managerStats.map(s => s.clientScore), 1);
    const maxOverallScore = Math.max(...managerStats.map(s => s.score), 1);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* Hero Banner */}
            <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 rounded-3xl p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-purple-400 opacity-20 rounded-full blur-2xl translate-y-1/3"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10">Resumen Operativo</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">¡Hola, Equipo Cluster! 👋</h2>
                    <p className="text-purple-100 font-medium text-sm md:text-base max-w-xl leading-relaxed">
                        Hoy es <span className="capitalize">{formattedDate}</span>. 
                        Tienes <strong className="text-white">{urgentTasks.length}</strong> tareas que requieren atención prioritaria. Mantén el ritmo, ya han completado {completedTasks} asignaciones en total.
                    </p>
                </div>
                <Icon name="Sparkles" size={140} className="absolute -right-8 -top-8 text-white opacity-10 rotate-12" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard title="Clientes Activos" value={clients.length} icon="Briefcase" color="blue" />
                <StatCard title="Account Managers" value={managers.length} icon="Users" color="indigo" />
                <StatCard title="Tareas Accounts" value={accountTasks.filter(t => t.status !== 'publicado').length} icon="LayoutList" color="indigo" />
                <StatCard title="Pendientes Edición" value={tasks.filter(t => t.status !== 'aprobado' && t.status !== 'publicado').length} icon="Video" color="amber" />
            </div>

            {/* Paneles Inferiores */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm self-start">
                            <div>
                                <h3 className="text-sm font-black text-slate-800 dark:text-white mb-1">Salud de la Cartera</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Distribución según satisfacción actual</p>
                            </div>
                            <PortfolioHealthChart totalClients={realTotalClients} contentos={contentos} neutrales={neutrales} enRiesgo={enRiesgo} />
                            <div className="hidden">
                                <div className="flex gap-1 h-6 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner">
                                    <div style={{width: `${(contentos/totalClients)*100}%`}} className="bg-green-500 transition-all cursor-help" title={`Contentos: ${contentos}`}></div>
                                    <div style={{width: `${(neutrales/totalClients)*100}%`}} className="bg-amber-400 transition-all cursor-help" title={`Neutrales: ${neutrales}`}></div>
                                    <div style={{width: `${(enRiesgo/totalClients)*100}%`}} className="bg-red-500 animate-pulse transition-all cursor-help" title={`En Riesgo: ${enRiesgo}`}></div>
                                </div>
                                <div className="flex justify-between mt-4 text-[10px] font-bold uppercase tracking-wider">
                                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm"></span> <span className="text-slate-600 dark:text-slate-300">Sanos ({contentos})</span></div>
                                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm"></span> <span className="text-slate-600 dark:text-slate-300">Neutral ({neutrales})</span></div>
                                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></span> <span className="text-slate-600 dark:text-slate-300">Riesgo ({enRiesgo})</span></div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm self-start">
                            <div>
                                <h3 className="text-sm font-black text-slate-800 dark:text-white mb-1">Progreso Global</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Volumen completado vs general</p>
                            </div>
                            <ProgressOverviewChart completionPercent={compPercent} completedTasks={completedTasks} totalTasks={totalTasks} groups={progressGroups} />
                            <div className="hidden">
                                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-6 overflow-hidden shadow-inner p-1">
                                    <div style={{width: `${compPercent}%`}} className="bg-purple-600 h-full rounded-full flex items-center justify-end px-2 transition-all duration-1000 ease-out relative overflow-hidden"></div>
                                </div>
                                <span className="text-3xl font-black text-purple-600 dark:text-purple-400 w-16 text-right">{compPercent}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tareas Urgentes */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[300px]">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-black text-slate-800 dark:text-white mb-1">Atención Requerida</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Urgentes y atrasadas</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black tracking-[0.12em] uppercase text-slate-500 dark:text-slate-400">{urgentTasks.length}</span>
                            <div className="p-2.5 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl"><Icon name="Flame" size={18} className="animate-pulse"/></div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 custom-scroll pr-2">
                        {urgentTasks.length === 0 ? (
                            <EmptyState icon="Smile" text="¡Todo al día! No hay urgencias." />
                        ) : (
                            urgentTasks.map(t => (
                                <div key={t.id} className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-3 group cursor-pointer min-w-0">
                                    <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${isDateBeforeDateString(t.date, todayStr) ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="break-words text-sm font-bold leading-tight text-slate-800 dark:text-slate-100 group-hover:text-purple-600 transition-colors">{t.title}</p>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-[0.14em]">{t._type}</span>
                                            <span className={`text-[9px] font-bold break-words ${isDateBeforeDateString(t.date, todayStr) ? 'text-red-500' : 'text-slate-400'}`}>Vence: {t.date}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Ranking Account Managers */}
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mt-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1 flex items-center gap-2">
                            <Icon name="Trophy" size={20} className="text-yellow-500" /> Ranking de Productividad por Account
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Rendimiento basado en tareas resueltas y avance en workflows.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {managerStats.length === 0 ? (
                        <div className="col-span-full"><EmptyState icon="Users" text="No hay Accounts para evaluar aún." /></div>
                    ) : (
                        managerStats.map((ms, index) => {
                            const isTop = index === 0;
                            const isSecond = index === 1;
                            const isThird = index === 2;
                            const palette = getDashboardPalette(ms.mappedColor);
                            
                            let medalColor = 'text-slate-400';
                            let medalBg = 'bg-slate-100 dark:bg-slate-800';
                            if (isTop) { medalColor = 'text-yellow-500'; medalBg = 'bg-yellow-50 dark:bg-yellow-500/10 ring-2 ring-yellow-400/50'; }
                            else if (isSecond) { medalColor = 'text-slate-400'; medalBg = 'bg-slate-50 dark:bg-slate-500/10 ring-2 ring-slate-300/50'; }
                            else if (isThird) { medalColor = 'text-amber-600'; medalBg = 'bg-amber-50 dark:bg-amber-600/10 ring-2 ring-amber-600/50'; }

                            return (
                                <div key={ms.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col gap-4 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm relative overflow-hidden min-w-0">
                                    <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: `linear-gradient(90deg, ${palette.solid}, ${palette.strong})` }} />
                                    <div className="flex justify-between items-start gap-3 min-w-0">
                                        <div className="flex min-w-0 flex-1 items-center gap-3">
                                            <div className={`w-8 h-8 shrink-0 flex items-center justify-center font-black rounded-full shadow-sm text-sm ${medalBg} ${medalColor}`}>
                                                #{index + 1}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="min-w-0 font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight flex items-center gap-1.5">
                                                    <span className="truncate">{ms.name}</span>
                                                    {isTop && <Icon name="Sparkles" size={14} className="text-yellow-500"/>}
                                                </h4>
                                                <p className="break-words text-[10px] leading-relaxed text-slate-500 font-medium">
                                                    {ms.completedTasks}/{ms.totalTasks} Tareas | {ms.totalClients} Clientes
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Score</p>
                                            <span className="text-2xl font-black" style={{ color: palette.strong }}>{ms.score} pts</span>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-3 dark:border-slate-800/80 dark:bg-slate-900/40">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Tareas</p>
                                            <p className="mt-1 text-base font-black text-slate-900 dark:text-white">{ms.completedTasks}/{ms.totalTasks}</p>
                                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">resueltas</p>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Workflow</p>
                                            <p className="mt-1 text-base font-black text-slate-900 dark:text-white">{ms.workflowCompleted}/{ms.workflowTotal}</p>
                                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">hitos activos</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <CompactMetricBar
                                            label="Ejecucion"
                                            value={(ms.taskScore / maxTaskScore) * 100}
                                            color={ms.mappedColor}
                                            meta={`${ms.taskScore} pts`}
                                            helper={ms.totalTasks > 0 ? `${ms.completedTasks} de ${ms.totalTasks} tareas cerradas` : 'Sin tareas asignadas'}
                                        />
                                        <CompactMetricBar
                                            label="Workflow"
                                            value={(ms.clientScore / maxClientScore) * 100}
                                            color={ms.mappedColor}
                                            meta={`${ms.clientScore} pts`}
                                            helper={ms.workflowTotal > 0 ? `${ms.workflowCompleted} de ${ms.workflowTotal} hitos completados` : 'Sin workflow activo'}
                                        />
                                    </div>

                                    <div className="hidden">
                                        <div 
                                            style={{width: `${(ms.score / maxOverallScore) * 100}%`}} 
                                            className={`h-full rounded-full transition-all duration-1000 ease-out bg-${ms.mappedColor}-500 ${ms.score > 0 ? 'min-w-[0.5rem]' : ''}`}
                                        ></div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

const TeamView = ({ title, team, iconColor, onAdd, onSelect, onDelete, onEdit }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredTeam = team.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">{title}</h2>
                <div className="flex flex-col md:flex-row w-full md:w-auto gap-3">
                    <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Buscar miembro..." />
                    <Button onClick={onAdd} icon="UserPlus" color={iconColor}>Agregar a {title}</Button>
                </div>
            </div>
            {filteredTeam.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 h-64"><EmptyState icon="Users" text="No hay miembros en este equipo aún." /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTeam.map(person => {
                        let mappedColorName = LEGACY_COLOR_MAP[person.color] || person.color || 'slate';
                        const style = PERSON_COLORS[mappedColorName] || PERSON_COLORS.slate;
                        return (
                            <div key={person.id} onClick={() => onSelect(person)} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer group relative">
                                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); onEdit(person); }} className="text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 p-3 md:p-2 bg-slate-50 dark:bg-slate-800 rounded-full hover:bg-blue-50 dark:hover:bg-slate-700"><Icon name="Edit" size={16}/></button>
                                    <button onClick={(e) => { e.stopPropagation(); onDelete(person); }} className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 p-3 md:p-2 bg-slate-50 dark:bg-slate-800 rounded-full hover:bg-red-50 dark:hover:bg-slate-700"><Icon name="Trash2" size={16}/></button>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className={`h-14 w-14 ${style.bg} rounded-xl flex items-center justify-center text-2xl font-black ${style.text} shadow-sm border border-black/5 dark:border-white/5`}>
                                        {person.name ? person.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white pr-16 md:pr-12 truncate">{person.name}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{person.email || 'Miembro del equipo'}</p>
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

const PersonCalendarDetail = ({ person, tasks, title, baseColor, onBack, onAddEvent, onEventClick }) => {
    let mappedColorName = LEGACY_COLOR_MAP[baseColor] || baseColor;
    const style = PERSON_COLORS[mappedColorName] || PERSON_COLORS.slate;
    return (
        <div className="h-full flex flex-col space-y-6 fade-in">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <button onClick={onBack} className="p-3 md:p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300"><Icon name="ChevronLeft"/></button>
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-sm border border-black/5 dark:border-white/5 ${style.bg} ${style.text}`}>{person.name ? person.name.charAt(0).toUpperCase() : '?'}</div>
                        {person.name}
                    </h2>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{title}</span>
                </div>
            </div>
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                <CalendarGrid events={tasks.filter(t => t.contextId === person.id)} baseColor={mappedColorName} onAdd={onAddEvent} onEventClick={onEventClick} />
            </div>
        </div>
    );
};

const DateHeader = ({ currentDate, setCurrentDate, filterMode, setFilterMode, ownershipFilter = 'all', setOwnershipFilter, title, onAdd, btnColor, btnIcon, searchTerm, setSearchTerm }) => {
    const today = getHondurasTodayStr();
    return (
        <div className="flex flex-col 2xl:flex-row justify-between items-start 2xl:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:flex-wrap items-start lg:items-center gap-4 w-full min-w-0 2xl:w-auto">
                <div className="flex items-center gap-3 shrink-0">
                    <Icon name="LayoutList" className={`text-${btnColor}-500 dark:text-${btnColor}-400 hidden md:block`} size={28}/>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white">{title}</h2>
                </div>
                <div className="flex flex-col lg:flex-row lg:flex-wrap gap-3 w-full min-w-0 lg:w-auto">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto max-w-full overflow-x-auto custom-scroll">
                    <button onClick={() => setFilterMode('date')} className={`shrink-0 px-4 py-2 text-sm font-bold rounded-lg transition-all ${filterMode === 'date' ? `bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm` : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>Día Específico</button>
                    <button onClick={() => setFilterMode('overdue')} className={`shrink-0 px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${filterMode === 'overdue' ? `bg-red-500 text-white shadow-sm` : 'text-slate-500 dark:text-slate-400 hover:text-red-500'}`}>Atrasadas <Icon name="Flame" size={14}/></button>
                    <button onClick={() => setFilterMode('all')} className={`shrink-0 px-4 py-2 text-sm font-bold rounded-lg transition-all ${filterMode === 'all' ? `bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm` : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>Ver Todas</button>
                    </div>
                    {setOwnershipFilter && (
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto max-w-full overflow-x-auto custom-scroll">
                            <button onClick={() => setOwnershipFilter('all')} className={`shrink-0 px-4 py-2 text-sm font-bold rounded-lg transition-all ${ownershipFilter === 'all' ? `bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm` : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>Todas</button>
                            <button onClick={() => setOwnershipFilter('mine')} className={`shrink-0 px-4 py-2 text-sm font-bold rounded-lg transition-all ${ownershipFilter === 'mine' ? `bg-${btnColor}-500 text-white shadow-sm` : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>Asignadas a mi</button>
                        </div>
                    )}
                </div>
                {filterMode === 'date' && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input type="date" value={currentDate} onChange={(e) => setCurrentDate(e.target.value)} className="min-h-[46px] w-full sm:w-auto text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none"/>
                        {currentDate === today && <span className="text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-bold px-2 py-1 rounded-full shrink-0">Hoy</span>}
                    </div>
                )}
            </div>
            <div className="flex flex-col sm:flex-row sm:flex-wrap w-full 2xl:w-auto gap-3 items-stretch sm:items-center">
                <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Buscar tarea..." />
                <div className="w-full sm:w-auto shrink-0">
                    <Button onClick={() => onAdd(filterMode === 'date' ? currentDate : today)} color={btnColor} icon={btnIcon} full>Nueva Tarea</Button>
                </div>
            </div>
        </div>
    );
};

const AccountRoomView = ({ tasks, managers, clients, currentUserProfile, onAdd, onEdit, onChangeStatus, onDelete, onTaskClick, legacyColorMap }) => {
    const {
        currentDate,
        setCurrentDate,
        filterMode,
        setFilterMode,
        ownershipFilter,
        setOwnershipFilter
    } = useTaskRoomState('cluster_account_room_state', { preferMine: Boolean(currentUserProfile?.linkedManagerId) });
    const [searchTerm, setSearchTerm] = useState('');
    const [draggedTaskId, setDraggedTaskId] = useState(null);
    const todayStr = getHondurasTodayStr();

    const columns = [
        { id: 'por_disenar', title: 'Por Diseñar', color: 'slate' },
        { id: 'aprobacion_interna', title: 'Aprobación Interna', color: 'blue' },
        { id: 'aprobado_internamente', title: 'Aprobado Interno', color: 'emerald' },
        { id: 'publicado', title: 'Publicado', color: 'indigo' }
    ];

    const filteredTasks = tasks.filter(t => {
        if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (ownershipFilter === 'mine' && !isTaskAssignedToProfile(t, currentUserProfile, [currentUserProfile?.linkedManagerId])) return false;
        if (filterMode === 'date') return compareDateOnlyStrings(t.date, currentDate) === 0;
        if (filterMode === 'overdue') return isDateBeforeDateString(t.date, todayStr) && t.status !== 'publicado';
        return true;
    });
    const handleAddTask = (dateStr) => {
        const nextDate = normalizeDateOnlyString(dateStr) || todayStr;
        setCurrentDate(nextDate);
        setFilterMode('date');
        onAdd(nextDate);
    };

    const handleDragStart = (e, taskId) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.effectAllowed = 'move';
        try {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const clone = e.currentTarget.cloneNode(true);
            clone.id = "custom-drag-ghost-" + taskId;
            clone.style.width = `${rect.width}px`;
            clone.style.height = `${rect.height}px`;
            clone.style.position = 'absolute';
            clone.style.top = '-9999px';
            clone.style.left = '-9999px';
            clone.style.opacity = '1'; 
            clone.style.backgroundColor = document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff';
            clone.style.borderRadius = '0.75rem';
            clone.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.4)';
            clone.style.transform = 'rotate(3deg) scale(1.05)';
            clone.style.zIndex = '99999';
            clone.style.pointerEvents = 'none';
            document.body.appendChild(clone);
            e.dataTransfer.setDragImage(clone, x, y);
        } catch(err) {}
        setTimeout(() => e.currentTarget.classList.add('drag-source-hidden'), 0);
    };

    const handleDragEnd = (e, taskId) => {
        e.currentTarget.classList.remove('drag-source-hidden');
        setDraggedTaskId(null);
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        const clone = document.getElementById("custom-drag-ghost-" + taskId);
        if (clone) clone.remove();
    };

    const handleDragOver = (e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); };
    const handleDragLeave = (e) => { e.currentTarget.classList.remove('drag-over'); };
    const handleDrop = (e, targetStatus) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        if (draggedTaskId) {
            const task = tasks.find(t => t.id === draggedTaskId);
            if (task && task.status !== targetStatus) onChangeStatus(task, targetStatus);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6 fade-in">
            <DateHeader currentDate={currentDate} setCurrentDate={setCurrentDate} filterMode={filterMode} setFilterMode={setFilterMode} ownershipFilter={ownershipFilter} setOwnershipFilter={setOwnershipFilter} title="Sala de Accounts" onAdd={handleAddTask} btnColor="indigo" btnIcon="Plus" searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            {false && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Jerarquizacion</p>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4">Prioridad de videos en sala</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {EDITING_HIERARCHY_OPTIONS.map((option) => (
                            <div key={option.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">{option.label}</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white mt-2">{rankedTasks.filter((task) => task.hierarchy === option.id).length}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Top ranking</p>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4">Orden sugerido de salida</h3>
                    <div className="space-y-3">
                        {rankedTasks.slice(0, 4).map((task, index) => (
                            <div key={task.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">#{index + 1}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{task.title}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{task.date} · {task.hierarchy?.toUpperCase()}</p>
                                </div>
                            </div>
                        ))}
                        {rankedTasks.length === 0 && <EmptyState icon="Video" text="No hay videos en este filtro." />}
                    </div>
                </div>
            </div>
            )}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 overflow-hidden">
                {columns.map((col, colIndex) => {
                    const colTasks = filteredTasks.filter(t => t.status === col.id);
                    const prevStatus = colIndex > 0 ? columns[colIndex - 1].id : null;
                    const nextStatus = colIndex < columns.length - 1 ? columns[colIndex + 1].id : null;

                    return (
                        <div key={col.id} className="flex flex-col bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 h-full overflow-hidden transition-all duration-300"
                             onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, col.id)}>
                            
                            <div className={`p-3 font-black text-[11px] uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-${col.color}-50 dark:bg-${col.color}-500/10 text-${col.color}-700 dark:text-${col.color}-400`}>
                                {col.title} <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400 shadow-sm">{colTasks.length}</span>
                            </div>
                            
                            <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scroll">
                                {colTasks.length === 0 ? <EmptyState icon="Inbox" text="Vacío" /> : 
                                colTasks.map(t => {
                                    const manager = managers.find(m => m.id === t.contextId);
                                    const client = clients.find(c => c.id === t.clientId);
                                    let mappedColorName = legacyColorMap[manager?.color] || manager?.color;
                                    const mStyles = PERSON_COLORS[mappedColorName] || PERSON_COLORS.slate;
                                    const isOverdue = isDateBeforeDateString(t.date, todayStr) && col.id !== 'publicado';
                                    
                                    return (
                                        <div key={t.id} onClick={() => onTaskClick(t)} 
                                             draggable="true" onDragStart={(e) => handleDragStart(e, t.id)} onDragEnd={(e) => handleDragEnd(e, t.id)}
                                             className={`bg-white dark:bg-slate-900 p-4 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all group cursor-grab active:cursor-grabbing border-y border-r border-slate-200 dark:border-slate-700 relative overflow-hidden ${isOverdue ? 'border-l-red-500 dark:bg-red-950/20' : 'border-l-indigo-500'}`}>
                                            
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex flex-col gap-1.5 items-start">
                                                    {client && (
                                                        <span className="text-[9px] font-black uppercase bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800 flex items-center gap-1 max-w-[140px] truncate">
                                                            <Icon name="Briefcase" size={10}/> {client.name}
                                                        </span>
                                                    )}
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-black/5 dark:border-white/5 ${mStyles.bg} ${mStyles.text}`}>{manager ? manager.name : 'Sin asignar'}</span>
                                                </div>
                                                <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); onEdit(t); }} className="text-slate-400 hover:text-blue-500 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><Icon name="Edit" size={16}/></button>
                                                    <button onClick={(e) => { e.stopPropagation(); onDelete(t.id); }} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><Icon name="Trash2" size={16}/></button>
                                                </div>
                                            </div>
                                            
                                            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-3 pr-2 leading-tight">{t.title}</p>
                                            
                                            {isOverdue && (
                                                <div className="absolute bottom-11 right-2 flex items-center gap-1 text-[9px] font-black text-red-500 bg-red-50 dark:bg-red-900/50 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800">
                                                    Atrasado <Icon name="Flame" size={10} className="animate-pulse"/>
                                                </div>
                                            )}

                                            <div className="flex gap-1.5 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                                {prevStatus && (
                                                    <button onClick={(e) => { e.stopPropagation(); onChangeStatus(t, prevStatus); }} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors`}>
                                                        <Icon name="ChevronLeft" size={12}/> Atrás
                                                    </button>
                                                )}
                                                {nextStatus && (
                                                    <button onClick={(e) => { e.stopPropagation(); onChangeStatus(t, nextStatus); }} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold bg-${col.color}-50 dark:bg-${col.color}-500/20 text-${col.color}-700 dark:text-${col.color}-400 hover:bg-${col.color}-100 dark:hover:bg-${col.color}-500/30 transition-colors`}>
                                                        {nextStatus === 'publicado' ? 'Publicar' : 'Avanzar'} <Icon name={nextStatus === 'publicado' ? "CheckCircle2" : "ChevronRight"} size={12}/>
                                                    </button>
                                                )}
                                                </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

const EditionsRoomView = ({ tasks, editors, clients, currentUserProfile, onAdd, onEdit, onChangeStatus, onDelete, onTaskClick }) => {
    const {
        currentDate,
        setCurrentDate,
        filterMode,
        setFilterMode,
        ownershipFilter,
        setOwnershipFilter
    } = useTaskRoomState('cluster_editions_room_state', { preferMine: Boolean(currentUserProfile?.linkedEditorId) });
    const [searchTerm, setSearchTerm] = useState('');
    const [draggedTaskId, setDraggedTaskId] = useState(null);
    const todayStr = getHondurasTodayStr();

    const columns = [
        { id: 'editar', title: 'Por Editar', color: 'slate' },
        { id: 'correccion', title: 'En Corrección', color: 'amber' },
        { id: 'aprobado', title: 'Aprobado', color: 'emerald' },
        { id: 'publicado', title: 'Publicado', color: 'indigo' } 
    ];
    
    const priorityStyles = {
        urgente: 'bg-red-50 dark:bg-red-500/20 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400',
        normal: 'bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400',
        recurrente: 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
    };
    const hierarchyStyles = {
        p1: 'bg-red-50 dark:bg-red-500/20 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400',
        p2: 'bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400',
        p3: 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
        p4: 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'
    };

    const filteredTasks = tasks.filter(t => {
        if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (ownershipFilter === 'mine' && !isTaskAssignedToProfile(t, currentUserProfile, [currentUserProfile?.linkedEditorId])) return false;
        if (filterMode === 'date') return compareDateOnlyStrings(t.date, currentDate) === 0;
        if (filterMode === 'overdue') return isDateBeforeDateString(t.date, todayStr) && t.status !== 'publicado';
        return true; 
    });
    const canManageEditingTasks = userHasPermission(currentUserProfile, 'manage_editing_tasks');
    const handleAddTask = (dateStr) => {
        const nextDate = normalizeDateOnlyString(dateStr) || todayStr;
        setCurrentDate(nextDate);
        setFilterMode('date');
        onAdd(nextDate);
    };
    const rankedTasks = filteredTasks
        .map((task) => {
            const hierarchy = getEditingHierarchyId(task);
            const delta = task.date ? getDateOnlyDiffDays(task.date, todayStr) : 99;
            const hierarchyScore = hierarchy === 'p1' ? 400 : hierarchy === 'p2' ? 280 : hierarchy === 'p3' ? 170 : 90;
            const priorityBonus = task.priority === 'urgente' ? 130 : task.priority === 'recurrente' ? 30 : 70;
            const dateBonus = delta < 0 ? 180 : delta === 0 ? 120 : delta === 1 ? 70 : delta <= 3 ? 30 : 0;
            const statusPenalty = task.status === 'publicado' ? -250 : task.status === 'aprobado' ? -150 : 0;
            return { ...task, hierarchy, rankScore: hierarchyScore + priorityBonus + dateBonus + statusPenalty };
        })
        .sort((a, b) => b.rankScore - a.rankScore || (a.date || '').localeCompare(b.date || '') || a.title.localeCompare(b.title));
    const rankingMap = rankedTasks.reduce((acc, task, index) => ({ ...acc, [task.id]: index + 1 }), {});

    const handleDragStart = (e, taskId) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.effectAllowed = 'move';
        try {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const clone = e.currentTarget.cloneNode(true);
            clone.id = "custom-drag-ghost-edit-" + taskId;
            clone.style.width = `${rect.width}px`;
            clone.style.height = `${rect.height}px`;
            clone.style.position = 'absolute';
            clone.style.top = '-9999px';
            clone.style.left = '-9999px';
            clone.style.opacity = '1';
            clone.style.backgroundColor = document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff';
            clone.style.borderRadius = '0.75rem';
            clone.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.4)';
            clone.style.transform = 'rotate(3deg) scale(1.05)';
            clone.style.zIndex = '99999';
            clone.style.pointerEvents = 'none';
            document.body.appendChild(clone);
            e.dataTransfer.setDragImage(clone, x, y);
        } catch(err) {}
        setTimeout(() => e.currentTarget.classList.add('drag-source-hidden'), 0);
    };

    const handleDragEnd = (e, taskId) => {
        e.currentTarget.classList.remove('drag-source-hidden');
        setDraggedTaskId(null);
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        const clone = document.getElementById("custom-drag-ghost-edit-" + taskId);
        if (clone) clone.remove();
    };

    const handleDragOver = (e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); };
    const handleDragLeave = (e) => { e.currentTarget.classList.remove('drag-over'); };
    const handleDrop = (e, targetStatus) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        if (draggedTaskId) {
            const task = tasks.find(t => t.id === draggedTaskId);
            if (task && task.status !== targetStatus) onChangeStatus(task, targetStatus);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6 fade-in">
            <DateHeader currentDate={currentDate} setCurrentDate={setCurrentDate} filterMode={filterMode} setFilterMode={setFilterMode} ownershipFilter={ownershipFilter} setOwnershipFilter={setOwnershipFilter} title="Sala de Edición" onAdd={handleAddTask} btnColor="amber" btnIcon="Video" searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 overflow-hidden">
                {columns.map((col, colIndex) => {
                    const colTasks = filteredTasks.filter(t => t.status === col.id);
                    const prevStatus = colIndex > 0 ? columns[colIndex - 1].id : null;
                    const nextStatus = colIndex < columns.length - 1 ? columns[colIndex + 1].id : null;

                    return (
                        <div key={col.id} className="flex flex-col bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 h-full overflow-hidden transition-all duration-300"
                             onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, col.id)}>
                            
                            <div className={`p-3 font-black text-[11px] uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-${col.color}-50 dark:bg-${col.color}-500/10 text-${col.color}-700 dark:text-${col.color}-400`}>
                                {col.title} <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400 shadow-sm">{colTasks.length}</span>
                            </div>
                            
                            <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scroll">
                                {colTasks.length === 0 ? <EmptyState icon="Inbox" text="Vacío" /> : 
                                colTasks.map(t => {
                                    const editor = editors.find(e => e.id === t.contextId);
                                    const client = clients.find(c => c.id === t.clientId);
                                    const pStyle = priorityStyles[t.priority] || priorityStyles.normal;
                                    const hStyle = hierarchyStyles[t.hierarchy] || hierarchyStyles[getEditingHierarchyId(t)] || hierarchyStyles.p2;
                                    const eStyles = PERSON_COLORS[editor?.color] || PERSON_COLORS.slate;
                                    const isOverdue = isDateBeforeDateString(t.date, todayStr) && col.id !== 'publicado';
                                    const hierarchyId = t.hierarchy || getEditingHierarchyId(t);
                                    const borderLeftColor = isOverdue ? 'border-l-red-600' : (hierarchyId === 'p1' ? 'border-l-red-500' : hierarchyId === 'p2' ? 'border-l-amber-500' : hierarchyId === 'p3' ? 'border-l-emerald-500' : 'border-l-slate-400');

                                    return (
                                        <div key={t.id} onClick={() => onTaskClick(t)} 
                                             draggable="true" onDragStart={(e) => handleDragStart(e, t.id)} onDragEnd={(e) => handleDragEnd(e, t.id)}
                                             className={`bg-white dark:bg-slate-900 p-4 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all group cursor-grab active:cursor-grabbing border-y border-r border-slate-200 dark:border-slate-700 relative overflow-hidden ${borderLeftColor} ${isOverdue ? 'dark:bg-red-950/10' : ''}`}>
                                            
                                            <div className="absolute top-3 right-3 text-[10px] font-black px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300">
                                                #{rankingMap[t.id]}
                                            </div>
                                            
                                            <div className="flex justify-between items-start mb-2 pr-12">
                                                <div className="flex flex-col items-start gap-1.5">
                                                    {client && (
                                                        <span className="text-[9px] font-black uppercase bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800 flex items-center gap-1 max-w-[140px] truncate">
                                                            <Icon name="Briefcase" size={10}/> {client.name}
                                                        </span>
                                                    )}
                                                    <div className="flex gap-2">
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase border ${hStyle}`}>{hierarchyId.toUpperCase()}</span>
                                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase border ${pStyle}`}>{t.priority || 'Normal'}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-black/5 dark:border-white/5 ${eStyles.bg} ${eStyles.text}`}>{editor ? editor.name : 'Sin asignar'}</span>
                                                    </div>
                                                </div>
                                                {canManageEditingTasks && (
                                                    <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                        <button onClick={(e) => { e.stopPropagation(); onEdit(t); }} className="text-slate-400 hover:text-blue-500 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><Icon name="Edit" size={16}/></button>
                                                        <button onClick={(e) => { e.stopPropagation(); onDelete(t.id); }} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><Icon name="Trash2" size={16}/></button>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1 leading-tight">{t.title}</p>
                                            {t.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 truncate max-w-[80%]">{t.notes}</p>}
                                            
                                            {isOverdue && (
                                                <div className="absolute bottom-12 right-2 flex items-center gap-1 text-[9px] font-black text-red-500 bg-red-50 dark:bg-red-900/50 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800">
                                                    Atrasado <Icon name="Flame" size={10} className="animate-pulse"/>
                                                </div>
                                            )}

                                            {canManageEditingTasks && (
                                                <div className="flex gap-1.5 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                                {prevStatus && (
                                                    <button onClick={(e) => { e.stopPropagation(); onChangeStatus(t, prevStatus); }} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors`}>
                                                        <Icon name="ChevronLeft" size={12}/> Atrás
                                                    </button>
                                                )}
                                                {nextStatus && (
                                                    <button onClick={(e) => { e.stopPropagation(); onChangeStatus(t, nextStatus); }} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold bg-${col.color}-50 dark:bg-${col.color}-500/20 text-${col.color}-700 dark:text-${col.color}-400 hover:bg-${col.color}-100 dark:hover:bg-${col.color}-500/30 transition-colors`}>
                                                        {nextStatus === 'publicado' ? 'Publicar' : 'Avanzar'} <Icon name={nextStatus === 'publicado' ? "CheckCircle2" : "ChevronRight"} size={12}/>
                                                    </button>
                                                )}
                                            </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

const computeManagementDueBadge = (task) => {
    if (!task?.date || !task?.time || !/^\d{2}:\d{2}$/.test(task.time)) return null;
    const iso = `${task.date}T${task.time}:00-06:00`;
    const ms = Date.parse(iso);
    if (!Number.isFinite(ms)) return null;
    const diffMs = ms - Date.now();
    const absHours = Math.abs(diffMs) / 3600000;
    if (diffMs >= 0) {
        if (absHours >= 48) return { label: `Vence en ${Math.round(absHours / 24)}d`, tone: 'slate' };
        if (absHours >= 1) return { label: `Vence en ${Math.round(absHours)}h`, tone: absHours <= 8 ? 'amber' : 'slate' };
        const mins = Math.max(1, Math.round(diffMs / 60000));
        return { label: `Vence en ${mins}m`, tone: 'red' };
    }
    if (absHours < 1) return { label: `Vencida hace ${Math.max(1, Math.round(-diffMs / 60000))}m`, tone: 'red' };
    if (absHours < 48) return { label: `Vencida hace ${Math.round(absHours)}h`, tone: 'red' };
    return { label: `Vencida hace ${Math.round(absHours / 24)}d`, tone: 'red' };
};

const ManagementRoomView = ({ tasks, members, clients, currentUserProfile, onAdd, onEdit, onChangeStatus, onDelete, onTaskClick }) => {
    const {
        currentDate,
        setCurrentDate,
        filterMode,
        setFilterMode,
        ownershipFilter,
        setOwnershipFilter
    } = useTaskRoomState('cluster_management_room_state', { preferMine: currentUserProfile?.role === 'management' });
    const [searchTerm, setSearchTerm] = useState('');
    const [draggedTaskId, setDraggedTaskId] = useState(null);
    const todayStr = getHondurasTodayStr();

    const columns = [
        { id: 'pendiente', title: 'Pendiente', color: 'slate' },
        { id: 'en_proceso', title: 'En Proceso', color: 'violet' },
        { id: 'en_espera', title: 'En Espera', color: 'amber' },
        { id: 'cerrado', title: 'Cerrado', color: 'emerald' }
    ];

    const filteredTasks = tasks.filter((task) => {
        if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (ownershipFilter === 'mine' && !isTaskAssignedToProfile(task, currentUserProfile, [currentUserProfile?.id])) return false;
        if (filterMode === 'date') return compareDateOnlyStrings(task.date, currentDate) === 0;
        if (filterMode === 'overdue') return isDateBeforeDateString(task.date, todayStr) && task.status !== 'cerrado';
        return true;
    });
    const handleAddTask = (dateStr) => {
        const nextDate = normalizeDateOnlyString(dateStr) || todayStr;
        setCurrentDate(nextDate);
        setFilterMode('date');
        onAdd(nextDate);
    };

    const handleDragStart = (e, taskId) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.effectAllowed = 'move';
    };
    const handleDragEnd = () => setDraggedTaskId(null);
    const handleDragOver = (e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); };
    const handleDragLeave = (e) => { e.currentTarget.classList.remove('drag-over'); };
    const handleDrop = (e, targetStatus) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        if (draggedTaskId) {
            const task = tasks.find((item) => item.id === draggedTaskId);
            if (task && task.status !== targetStatus) onChangeStatus(task, targetStatus);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6 fade-in">
            <DateHeader currentDate={currentDate} setCurrentDate={setCurrentDate} filterMode={filterMode} setFilterMode={setFilterMode} ownershipFilter={ownershipFilter} setOwnershipFilter={setOwnershipFilter} title="Sala de Gestion" onAdd={handleAddTask} btnColor="violet" btnIcon="ShieldCheck" searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Equipo vinculado</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {members.map((member) => (
                            <div key={member.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                                <p className="font-bold text-slate-800 dark:text-white">{member.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{member.email || 'Correo pendiente de asignar'}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Alertas de acceso</p>
                    <div className="space-y-3">
                        {members.filter((member) => !normalizeEmail(member.email)).length === 0 ? (
                            <EmptyState icon="Mail" text="Todos los perfiles de gestion ya tienen correo." />
                        ) : (
                            members.filter((member) => !normalizeEmail(member.email)).map((member) => (
                                <div key={member.id} className="p-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10">
                                    <p className="font-bold text-amber-700 dark:text-amber-300">{member.name}</p>
                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Asignale correo desde Usuarios y Accesos para habilitar su entrada real.</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 overflow-hidden">
                {columns.map((col, colIndex) => {
                    const colTasks = filteredTasks.filter((task) => task.status === col.id);
                    const prevStatus = colIndex > 0 ? columns[colIndex - 1].id : null;
                    const nextStatus = colIndex < columns.length - 1 ? columns[colIndex + 1].id : null;
                    return (
                        <div key={col.id} className="flex flex-col bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 h-full overflow-hidden transition-all duration-300" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, col.id)}>
                            <div className={`p-3 font-black text-[11px] uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-${col.color}-50 dark:bg-${col.color}-500/10 text-${col.color}-700 dark:text-${col.color}-400`}>
                                {col.title} <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400 shadow-sm">{colTasks.length}</span>
                            </div>
                            <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scroll">
                                {colTasks.length === 0 ? <EmptyState icon="Inbox" text="Vacio" /> :
                                    colTasks.map((task) => {
                                        const member = members.find((item) => item.id === task.contextId);
                                        const client = clients.find((item) => item.id === task.clientId);
                                        const isOverdue = isDateBeforeDateString(task.date, todayStr) && col.id !== 'cerrado';
                                        return (
                                            <div key={task.id} onClick={() => onTaskClick(task)} draggable="true" onDragStart={(e) => handleDragStart(e, task.id)} onDragEnd={handleDragEnd} className={`bg-white dark:bg-slate-900 p-4 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all group cursor-grab active:cursor-grabbing border-y border-r border-slate-200 dark:border-slate-700 relative overflow-hidden ${isOverdue ? 'border-l-red-500 dark:bg-red-950/20' : 'border-l-violet-500'}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex flex-col gap-1.5 items-start">
                                                        {client && <span className="text-[9px] font-black uppercase bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800 flex items-center gap-1 max-w-[140px] truncate"><Icon name="Briefcase" size={10}/> {client.name}</span>}
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-black/5 dark:border-white/5 bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-100">{member ? member.name : 'Sin asignar'}</span>
                                                    </div>
                                                    <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                        <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="text-slate-400 hover:text-blue-500 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><Icon name="Edit" size={16}/></button>
                                                        <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><Icon name="Trash2" size={16}/></button>
                                                    </div>
                                                </div>
                                                <p className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-2 leading-tight">{task.title}</p>
                                                {task.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 truncate max-w-[80%]">{task.notes}</p>}
                                                {(() => {
                                                    const badge = computeManagementDueBadge(task);
                                                    if (!badge || col.id === 'cerrado') return null;
                                                    const toneMap = {
                                                        slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
                                                        amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                                                        red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                                    };
                                                    return (
                                                        <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md mb-2 ${toneMap[badge.tone] || toneMap.slate}`}>
                                                            <Icon name={badge.tone === 'red' ? 'AlertTriangle' : 'Clock'} size={10} />
                                                            {badge.label}
                                                            {task.time ? ` · ${task.time}` : ''}
                                                        </span>
                                                    );
                                                })()}
                                                <div className="flex gap-1.5 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                                    {prevStatus && <button onClick={(e) => { e.stopPropagation(); onChangeStatus(task, prevStatus); }} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><Icon name="ChevronLeft" size={12}/> Atras</button>}
                                                    {nextStatus && <button onClick={(e) => { e.stopPropagation(); onChangeStatus(task, nextStatus); }} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold bg-${col.color}-50 dark:bg-${col.color}-500/20 text-${col.color}-700 dark:text-${col.color}-400 hover:bg-${col.color}-100 dark:hover:bg-${col.color}-500/30 transition-colors`}>{nextStatus === 'cerrado' ? 'Cerrar' : 'Avanzar'} <Icon name={nextStatus === 'cerrado' ? 'CheckCircle2' : 'ChevronRight'} size={12}/></button>}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const UsersAccessView = ({ users, managers, editors, auditLogs, currentUserProfile, onAdd, onEdit, onResendVerification }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredUsers = users.filter((item) => `${item.name || ''} ${item.email || ''} ${item.role || ''}`.toLowerCase().includes(searchTerm.toLowerCase()));
    const verifiedUsers = users.filter((item) => getVerificationMeta(item).isVerified).length;
    const pendingVerificationUsers = users.filter((item) => normalizeEmail(item.email) && !getVerificationMeta(item).isVerified).length;

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">Usuarios y Accesos</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Permisos por rol, accesos por correo y bitacora de actividad.</p>
                </div>
                <div className="flex flex-col md:flex-row w-full md:w-auto gap-3">
                    <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Buscar usuario..." />
                    <Button onClick={onAdd} color="purple" icon="UserPlus">Nuevo Usuario</Button>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard title="Usuarios Activos" value={users.filter((item) => item.isActive !== false).length} icon="Users" color="purple" />
                <StatCard title="Correos Verificados" value={verifiedUsers} icon="ShieldCheck" color="emerald" />
                <StatCard title="Pendientes Verificar" value={pendingVerificationUsers} icon="Mail" color="amber" />
                <StatCard title="Admins" value={users.filter((item) => item.isActive !== false && ['super_admin', 'operations'].includes(item.role)).length} icon="ClipboardList" color="indigo" />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-[1.05fr,1.3fr] gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white">Directorio</h3>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-400">{getRoleMeta(currentUserProfile?.role).label}</span>
                    </div>
                    <div className="space-y-3 max-h-[540px] overflow-y-auto custom-scroll pr-2">
                        {filteredUsers.length === 0 ? <EmptyState icon="Users" text="No hay usuarios para este filtro." /> : filteredUsers.map((record) => {
                            const verificationMeta = getVerificationMeta(record);
                            const linkedManager = managers.find((item) => item.id === record.linkedManagerId);
                            const linkedEditor = editors.find((item) => item.id === record.linkedEditorId);
                            const linkedLabels = getLinkedProfileLabels(record);

                            return (
                                <div key={record.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black ${record.isActive === false ? 'bg-red-500' : 'bg-slate-900 dark:bg-slate-700'}`}>{(record.name || '??').slice(0, 2).toUpperCase()}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <p className="font-bold text-slate-800 dark:text-white truncate">{record.name}</p>
                                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300">{getRoleMeta(record.role).label}</span>
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${
                                                verificationMeta.color === 'emerald'
                                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                                                    : verificationMeta.color === 'amber'
                                                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                                                      : verificationMeta.color === 'red'
                                                        ? 'bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                                                        : verificationMeta.color === 'blue'
                                                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                                                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                                            }`}>
                                                {verificationMeta.label}
                                            </span>
                                            {record.isActive === false && <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400">Inactivo</span>}
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-2">{record.email || 'Correo pendiente'}</p>
                                        {record.emailVerification?.lastError && (
                                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 break-words">
                                                {record.emailVerification.lastError}
                                            </p>
                                        )}
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Ultimo acceso: {record.lastSeenAt || 'Sin registro'}</p>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {linkedLabels.map((label) => (
                                                <span key={`${record.id}-${label}`} className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                                                    {label}
                                                </span>
                                            ))}
                                            {linkedManager && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">AM: {linkedManager.name}</span>}
                                            {linkedEditor && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">ED: {linkedEditor.name}</span>}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {normalizeEmail(record.email) && !verificationMeta.isVerified && (
                                            <button onClick={() => onResendVerification(record)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Reenviar acceso por correo">
                                                <Icon name="Mail" size={18} />
                                            </button>
                                        )}
                                        <button onClick={() => onEdit(record)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Editar usuario">
                                            <Icon name="Edit" size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white">Bitacora de Acciones</h3>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{auditLogs.length} registros</span>
                    </div>
                    <div className="space-y-3 max-h-[540px] overflow-y-auto custom-scroll pr-2">
                        {auditLogs.length === 0 ? <EmptyState icon="ClipboardList" text="Aun no hay actividad registrada." /> : auditLogs.map((log) => (
                            <div key={log.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{log.description || `${log.action} · ${log.entityType}`}</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300">{log.action}</span>
                                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">{log.entityType}</span>
                                            {log.status === 'error' && <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400">Error</span>}
                                            {log.status === 'denied' && <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">Denegado</span>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{log.actor?.name || 'Sistema'}</p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500">{log.createdAt || ''}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ClientsView = ({ clients, onAdd, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.niche?.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6 fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">Cartera de Clientes</h2>
                <div className="flex flex-col md:flex-row w-full md:w-auto gap-3">
                    <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Buscar cliente o rubro..." />
                    <Button onClick={onAdd} color="blue" icon="Plus">Nuevo Cliente</Button>
                </div>
            </div>
            {filteredClients.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 h-64"><EmptyState icon="Briefcase" text="No hay clientes que coincidan." /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClients.map(c => (
                        <div key={c.id} onClick={() => onSelect(c)} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer relative">
                            <div className="flex justify-between mb-4">
                                <div className="h-14 w-14 bg-blue-50 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center text-2xl font-black text-blue-600 dark:text-blue-400">
                                    {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                                </div>
                                <div className={`w-3 h-3 rounded-full shadow-sm border border-white dark:border-slate-900 ${c.mood === 'En Riesgo' ? 'bg-red-500 animate-pulse' : c.mood === 'Neutral' ? 'bg-amber-400' : 'bg-green-500'}`}></div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white pr-4 truncate">{c.name}</h3>
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">{c.niche || 'Sin rubro'}</p>
                            <div className="pt-4 border-t border-slate-50 dark:border-slate-800 mt-4 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 truncate"><Icon name="UserCircle2" size={16} className="text-blue-400 dark:text-blue-500 shrink-0"/> {c.manager || 'Sin asignar'}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ClientDetail = ({ client, managers, onReassignManager, onBack, onUpdate, onDelete, onEdit }) => (
    <div className="space-y-6 max-w-5xl mx-auto fade-in">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-sm uppercase p-2 -ml-2"><Icon name="ChevronLeft" size={16}/> Volver</button>
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="bg-slate-900 dark:bg-slate-950 p-6 md:p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative group border-b border-slate-800">
                <button onClick={onEdit} className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><Icon name="Edit" size={18}/></button>
                
                <div className="flex items-start md:items-center gap-6">
                    <div className="h-20 w-20 bg-white/10 rounded-2xl flex items-center justify-center text-4xl font-black shadow-inner shrink-0">
                        {client.name ? client.name.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black">{client.name}</h1>
                        
                        <div className="flex items-center gap-2 mt-2 bg-white/5 px-3 py-1.5 rounded-lg inline-flex border border-white/10 relative transition-all hover:bg-white/10">
                            <Icon name="UserCircle2" size={14} className="text-blue-300"/>
                            <select 
                                value={client.managerId || ""} 
                                onChange={(e) => onReassignManager(client, e.target.value)}
                                className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer appearance-none pr-6 z-10 w-full"
                            >
                                <option value="" className="text-slate-800">Asignar Account Manager...</option>
                                {managers.map(m => <option key={m.id} value={m.id} className="text-slate-800">{m.name}</option>)}
                            </select>
                            <Icon name="ChevronDown" size={12} className="text-blue-300 absolute right-3 pointer-events-none"/>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-2 bg-white/10 p-1 rounded-xl shrink-0 mt-4 md:mt-0">{['Contento', 'Neutral', 'En Riesgo'].map(m => <button key={m} onClick={() => onUpdate(client.id, {mood: m})} className={`p-2 rounded-lg ${client.mood === m ? 'bg-white/20' : 'opacity-50 hover:opacity-100'}`}><Icon name={m === 'Contento' ? 'Smile' : m === 'Neutral' ? 'Meh' : 'Frown'} className={m === 'Contento' ? 'text-green-400' : m === 'Neutral' ? 'text-yellow-400' : 'text-red-400'}/></button>)}</div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
                <div className="lg:col-span-2 p-6 md:p-8 space-y-8">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800"><h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Icon name="Instagram" size={14}/> Redes</h3><div className="flex flex-col md:flex-row gap-2"><input defaultValue={client.instagram} onBlur={(e) => onUpdate(client.id, {instagram: e.target.value})} placeholder="Link Instagram..." className="flex-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl text-sm px-4 py-3 border outline-none text-slate-800 dark:text-slate-200"/><a href={client.instagram || '#'} target="_blank" className="bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 px-4 py-3 rounded-xl font-bold text-sm hover:bg-pink-100 dark:hover:bg-pink-500/20 flex items-center justify-center gap-2">Ver <Icon name="ExternalLink" size={14}/></a></div></div>
                    <button onClick={onDelete} className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 text-xs font-bold flex items-center gap-2 p-2 -ml-2"><Icon name="Trash2" size={14}/> ELIMINAR CLIENTE</button>
                </div>
                <div className="p-6 md:p-8 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2"><Icon name="CheckCircle2" size={14}/> Workflow</h3><div className="space-y-3">{['week1', 'week2', 'week3', 'week4'].map((w, i) => <CheckItem key={w} label={['Estrategia', 'Producción', 'Aprobación', 'Reporte'][i]} checked={client.workflow?.[w] || false} onToggle={() => onUpdate(client.id, {[`workflow.${w}`]: !client.workflow?.[w]})} />)}</div></div>
            </div>
        </div>
    </div>
);

const CalendarGrid = ({ events, onAdd, onEventClick, baseColor = "emerald" }) => {
    const [date, setDate] = useState(new Date());
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const startDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    
    let mappedColorName = LEGACY_COLOR_MAP[baseColor] || baseColor;
    const style = PERSON_COLORS[mappedColorName] || PERSON_COLORS.slate;

    return (
        <>
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className={`font-bold uppercase text-xs tracking-widest text-slate-500 dark:text-slate-400`}>Vista Mensual</div>
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 rounded-lg p-1"><button onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))} className="p-3 md:p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-300 shadow-sm"><Icon name="ChevronLeft" size={16}/></button><span className="font-black text-slate-700 dark:text-slate-200 w-32 text-center text-sm uppercase">{MONTH_NAMES[date.getMonth()]} {date.getFullYear()}</span><button onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))} className="p-3 md:p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-300 shadow-sm"><Icon name="ChevronRight" size={16}/></button></div>
        </div>
        <div className="flex-1 overflow-x-auto overflow-y-auto bg-slate-50 dark:bg-slate-950 custom-scroll">
            <div className="grid grid-cols-7 auto-rows-fr min-w-[800px] h-full">
                {['D','L','M','M','J','V','S'].map(d => <div key={d} className="py-2 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 border-r border-b border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">{d}</div>)}
                {Array(startDay).fill(null).map((_, i) => <div key={`empty-${i}`} className="border-r border-b border-slate-200/50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30" />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                    const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const dayEvents = events.filter(e => e.date === dStr);
                    
                    return (
                        <div key={d} onClick={() => onAdd(dStr)} className="border-r border-b border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 min-h-[120px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group relative">
                            <span className={`text-xs font-bold text-slate-400 dark:text-slate-500 group-hover:text-purple-500 dark:group-hover:text-purple-400`}>{d}</span>
                            <div className="mt-2 space-y-1.5">
                                {dayEvents.map(e => {
                                    const isCompleted = e.status === 'publicado' || e.status === 'aprobado';
                                    const itemBg = isCompleted ? 'bg-emerald-500' : style.bg;
                                    const itemText = isCompleted ? 'text-white' : style.text;
                                    const itemBorder = isCompleted ? 'border-emerald-600' : 'border-black/10 dark:border-white/5';

                                    return (
                                        <div key={e.id} onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }} className={`text-[10px] sm:text-xs font-bold p-2 rounded-lg border shadow-sm relative group/evt cursor-pointer ${itemBg} ${itemText} ${itemBorder} hover:brightness-110 active:scale-95 transition-all flex items-center justify-between`}>
                                            <span className="flex items-center gap-1.5 truncate">
                                                {isCompleted && <Icon name="CheckCircle2" size={14} />}
                                                {e.title}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                            <Icon name="Plus" className={`absolute bottom-2 right-2 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity`} size={16}/>
                        </div>
                    );
                })}
            </div>
        </div>
        </>
    );
};

const GeneralCalendarGrid = ({ activities, onDayClick }) => {
    const [date, setDate] = useState(new Date());
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const startDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    return (
        <>
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className={`font-bold uppercase text-xs tracking-widest text-slate-500 dark:text-slate-400`}>Mes - Todas las Tareas</div>
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 rounded-lg p-1"><button onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))} className="p-3 md:p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-300 shadow-sm"><Icon name="ChevronLeft" size={16}/></button><span className="font-black text-slate-700 dark:text-slate-200 w-32 text-center text-sm uppercase">{MONTH_NAMES[date.getMonth()]} {date.getFullYear()}</span><button onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))} className="p-3 md:p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 dark:text-slate-300 shadow-sm"><Icon name="ChevronRight" size={16}/></button></div>
        </div>
        <div className="flex-1 overflow-x-auto overflow-y-auto bg-slate-50 dark:bg-slate-950 custom-scroll">
            <div className="grid grid-cols-7 auto-rows-fr min-w-[800px] h-full">
                {['D','L','M','M','J','V','S'].map(d => <div key={d} className="py-2 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 border-r border-b border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">{d}</div>)}
                {Array(startDay).fill(null).map((_, i) => <div key={`empty-${i}`} className="border-r border-b border-slate-200/50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30" />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                    const dStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const dayActivities = activities.filter(e => e.date === dStr);
                    
                    return (
                        <div key={d} onClick={() => onDayClick(dStr)} className="border-r border-b border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 min-h-[120px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group relative">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-xs font-bold text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400`}>{d}</span>
                                {dayActivities.length > 0 && <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full">{dayActivities.length}</span>}
                            </div>
                            <div className="space-y-1">
                                {dayActivities.slice(0, 4).map((act, idx) => (
                                    <div key={idx} className={`text-[10px] font-bold px-1.5 py-0.5 rounded truncate bg-${act._color}-100 dark:bg-${act._color}-500/20 text-${act._color}-800 dark:text-${act._color}-400 border border-${act._color}-200 dark:border-${act._color}-500/30`}>
                                        {act.title}
                                    </div>
                                ))}
                                {dayActivities.length > 4 && <div className="text-[10px] font-bold text-slate-400 text-center mt-1">+{dayActivities.length - 4} más</div>}
                            </div>
                            <Icon name="ExternalLink" className={`absolute bottom-2 right-2 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity`} size={14}/>
                        </div>
                    );
                })}
            </div>
        </div>
        </>
    );
};

const EventActionModal = ({ config, canEdit = true, onClose, onEdit, onDelete }) => {
    if (!config.isOpen || !config.event) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
                <div className="p-6 text-center border-b border-slate-100 dark:border-slate-800">
                    <div className="mx-auto w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 mb-4"><Icon name="MousePointerClick" size={24} /></div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white truncate">{config.event.title || 'Elemento'}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">¿Qué deseas hacer?</p>
                </div>
                <div className="p-4 space-y-3">
                    {canEdit ? (
                        <>
                            <button onClick={() => { onClose(); onEdit(config.event, config.type); }} className="w-full flex items-center justify-center gap-3 py-4 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
                                <Icon name="Edit" size={20} /> Editar elemento
                            </button>
                            <button onClick={() => { onClose(); onDelete(config.event, config.type); }} className="w-full flex items-center justify-center gap-3 py-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold rounded-2xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
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
                    <button onClick={onClose} className="w-full py-4 text-slate-500 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors mt-2">
                        {canEdit ? 'Cancelar' : 'Cerrar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const TaskDetailModal = ({ config, onClose, clients, managers, editors, users, canEdit, onEdit }) => {
    if (!config.isOpen || !config.task) return null;
    const { task, type } = config;
    
    const client = clients.find(c => c.id === task.clientId);
    const assignee = type === 'accountTask'
        ? managers.find(m => m.id === task.contextId)
        : type === 'managementTask'
          ? users.find(u => u.id === task.contextId)
          : editors.find(e => e.id === task.contextId);
    const tagColor = type === 'accountTask' ? 'indigo' : type === 'managementTask' ? 'violet' : 'amber';
    const iconName = type === 'accountTask' ? 'LayoutList' : type === 'managementTask' ? 'ShieldCheck' : 'Video';

    return (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                <div className={`p-6 bg-${tagColor}-50 dark:bg-${tagColor}-500/10 border-b border-${tagColor}-100 dark:border-${tagColor}-500/20 relative`}>
                    <button onClick={onClose} className={`absolute top-4 right-4 p-2 hover:bg-${tagColor}-100 dark:hover:bg-${tagColor}-500/30 rounded-full text-${tagColor}-600 dark:text-${tagColor}-400 transition-colors`}><Icon name="X" size={20}/></button>
                    <div className="flex items-center gap-2 mb-3">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-${tagColor}-100 dark:bg-${tagColor}-500/30 text-${tagColor}-700 dark:text-${tagColor}-300`}><Icon name={iconName} size={12}/> {type === 'accountTask' ? 'Account' : 'Edición'}</span>
                        {task.priority && <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${task.priority === 'urgente' ? 'border-red-500 text-red-600 bg-red-50' : 'border-slate-300 text-slate-500'}`}>{task.priority}</span>}
                        {type === 'editingTask' && <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-slate-300 text-slate-500 bg-white/70 dark:bg-slate-900/40">{getEditingHierarchyId(task).toUpperCase()}</span>}
                        {type === 'managementTask' && task.category && <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-violet-200 dark:border-violet-500/30 text-violet-700 dark:text-violet-300 bg-violet-100/80 dark:bg-violet-500/20">{task.category}</span>}
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{task.title}</h2>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[120px]">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Icon name="Briefcase" size={12}/> Cliente</p>
                            {client ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">{client.name ? client.name.charAt(0).toUpperCase() : '?'}</div>
                                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{client.name}</span>
                                </div>
                            ) : <span className="text-sm font-bold text-slate-400">Interno / Sin asignar</span>}
                        </div>
                        <div className="flex-1 min-w-[120px]">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Icon name="UserCircle2" size={12}/> Asignado a</p>
                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{assignee ? assignee.name : 'Nadie'}</span>
                        </div>
                        <div className="flex-1 min-w-[120px]">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Icon name="CalendarDays" size={12}/> Fecha Límite</p>
                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{task.date}</span>
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 min-h-[100px]">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1"><Icon name="ListTree" size={12}/> Notas y Enlaces</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{task.notes || <span className="italic text-slate-400">Sin notas adicionales...</span>}</p>
                    </div>
                    {canEdit(type) && <Button full onClick={() => onEdit(task, type)} color={tagColor} icon="Edit">Editar Tarea</Button>}
                </div>
            </div>
        </div>
    );
};

const DayDetailsModal = ({ config, onClose, activities, clients, managers, editors, users, canEditActivity, onEdit, onDelete }) => {
    if (!config.isOpen) return null;
    const dayActivities = activities.filter(a => a.date === config.date);
    const modalTitles = { client: 'Cliente', manager: 'Account Manager', editor: 'Editor', event: 'Produccion', accountTask: 'Tarea de Account', editingTask: 'Tarea de Edicion', managementTask: 'Tarea de Gestion', user: 'Usuario' };

    let displayDate = '';
    if (config.date) {
        const [y, m, d] = config.date.split('-');
        displayDate = new Date(y, m - 1, d).toLocaleDateString('es-HN', { weekday: 'long', day: 'numeric', month: 'long' });
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950 shrink-0">
                    <div>
                        <h3 className="font-black text-lg text-slate-800 dark:text-white capitalize">{displayDate}</h3>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Detalle de Actividades</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400"><Icon name="X" size={20} /></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scroll space-y-3">
                    {dayActivities.length === 0 ? (
                        <EmptyState icon="Inbox" text="No hay actividades este día" />
                    ) : (
                        dayActivities.map(act => {
                            const client = clients?.find(c => c.id === act.clientId);
                            let personName = 'Sin asignar';
                            
                            if (act.collectionType === 'accountTask') {
                                const manager = managers?.find(m => m.id === act.contextId);
                                if (manager) personName = manager.name;
                            } else if (act.collectionType === 'editingTask') {
                                const editor = editors?.find(e => e.id === act.contextId);
                                if (editor) personName = editor.name;
                            } else if (act.collectionType === 'managementTask') {
                                const managementUser = users?.find(u => u.id === act.contextId);
                                if (managementUser) personName = managementUser.name;
                            }

                            return (
                                <div key={`${act.collectionType}-${act.id}`} className={`p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-sm flex items-center gap-4`}>
                                    <div className={`p-3 rounded-xl bg-${act._color}-50 dark:bg-${act._color}-500/20 text-${act._color}-600 dark:text-${act._color}-400 shrink-0`}>
                                        <Icon name={act._icon} size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{act.title}</p>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                            <span className={`text-[9px] font-black uppercase tracking-wider text-${act._color}-600 dark:text-${act._color}-400`}>{act._label}</span>
                                            
                                            {client && (
                                                <span className="flex items-center gap-1 text-[9px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800">
                                                    <Icon name="Briefcase" size={8}/> {client.name}
                                                </span>
                                            )}
                                            
                                            {(act.collectionType === 'accountTask' || act.collectionType === 'editingTask' || act.collectionType === 'managementTask') && (
                                                <span className="flex items-center gap-1 text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                                    <Icon name="UserCircle2" size={8}/> {personName}
                                                </span>
                                            )}

                                            {act.status && (
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                                                    act.status === 'publicado' || act.status === 'aprobado' 
                                                    ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
                                                    : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                                }`}>
                                                    {act.status.replace(/_/g, ' ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {canEditActivity(act.collectionType) && <div className="flex items-center gap-1 opacity-100 md:opacity-60 md:hover:opacity-100 transition-opacity">
                                        <button onClick={() => { onClose(); onEdit(act, act.collectionType); }} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Editar"><Icon name="Edit" size={18} /></button>
                                        <button onClick={() => { onClose(); onDelete(act, act.collectionType); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Eliminar"><Icon name="Trash2" size={18} /></button>
                                    </div>}
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

const Modal = ({ config, onClose, clients, managers, editors, managementUsers, actions }) => {
    const { type, data, isEdit } = config;
    if(!config.isOpen) return null;

    const eventTitleMatch = type === 'event' && data?.title
        ? data.title.match(/^(\d{2}:\d{2})\s*-\s*(.*)$/)
        : null;
    const eventDefaultTime = eventTitleMatch ? eventTitleMatch[1] : '';
    const eventDefaultTitle = type === 'event'
        ? (eventTitleMatch ? eventTitleMatch[2] : (data?.title || ''))
        : '';
    const normalizeEventTitle = (title = '') => title.replace(/^\d{2}:\d{2}\s*-\s*/, '').trim();
    const buildEventTitle = (title = '', time = '') => {
        const cleanTitle = normalizeEventTitle(title);
        if (time && cleanTitle) return `${time} - ${cleanTitle}`;
        return cleanTitle;
    };
    
    const onSubmit = (e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(e.target));
        
        if (isEdit) {
            if (type === 'client') actions.updateClient(data.id, { name: fd.name || "", niche: fd.niche || "", package: fd.package || "", instagram: fd.instagram || "", managerId: fd.managerId || "" });
            if (type === 'manager') actions.updateManager(data.id, { name: fd.name || "", email: fd.email || "" });
            if (type === 'editor') actions.updateEditor(data.id, { name: fd.name || "", email: fd.email || "" });
            if (type === 'event') actions.updateEvent(data.id, { title: buildEventTitle(fd.title, fd.time) });
            if (type === 'accountTask') actions.updateAccountTask(data.id, { title: fd.title || "", time: fd.time || data.time || "", contextId: fd.manager || data.contextId || "", clientId: fd.clientId || "", notes: fd.notes || "" });
            if (type === 'editingTask') actions.updateEditingTask(data.id, { title: fd.title || "", priority: fd.priority || "normal", hierarchy: fd.hierarchy || "p2", status: fd.status || data.status || "editar", notes: fd.notes || "", contextId: fd.editor || data.contextId || "", clientId: fd.clientId || "" });
            if (type === 'managementTask') actions.updateManagementTask(data.id, { date: fd.date || data.date || "", title: fd.title || "", time: fd.time || data.time || "", contextId: fd.member || data.contextId || "", clientId: fd.clientId || "", category: fd.category || "seguimiento", notes: fd.notes || "", notificationsEnabled: fd.notificationsEnabled === 'on' });
            if (type === 'user') actions.updateUserRecord(data.id, { name: fd.name || "", email: fd.email || "", role: fd.role || "viewer", isActive: fd.isActive === 'true' });
        } else {
            if (type === 'client') actions.addClient({ name: fd.name || "", niche: fd.niche || "", package: fd.package || "", instagram: fd.instagram || "", managerId: fd.managerId || "" });
            if (type === 'manager') actions.addManager({ name: fd.name || "", email: fd.email || "", assignedAccounts: [] });
            if (type === 'editor') actions.addEditor({ name: fd.name || "", email: fd.email || "" });
            if (type === 'event') actions.addEvent({ date: data.date, title: buildEventTitle(fd.title, fd.time), type: data.type });
            if (type === 'accountTask') actions.addAccountTask({ date: data.date, title: fd.title || "", time: fd.time || "", contextId: fd.manager || data.contextId || "", clientId: fd.clientId || "", notes: fd.notes || "" });
            if (type === 'editingTask') actions.addEditingTask({ date: data.date, title: fd.title || "", priority: fd.priority || "normal", hierarchy: fd.hierarchy || "p2", status: fd.status || "editar", notes: fd.notes || "", contextId: fd.editor || data.contextId || "", clientId: fd.clientId || "" });
            if (type === 'managementTask') actions.addManagementTask({ date: fd.date || data.date || "", title: fd.title || "", time: fd.time || "", contextId: fd.member || data.contextId || "", clientId: fd.clientId || "", category: fd.category || "seguimiento", notes: fd.notes || "", notificationsEnabled: fd.notificationsEnabled === 'on' });
            if (type === 'user') actions.addUserRecord({ name: fd.name || "", email: fd.email || "", role: fd.role || "viewer", isActive: fd.isActive === 'true' });
        }
    };

    const titles = {
        client: 'Cliente',
        manager: 'Account Manager',
        editor: 'Editor',
        event: 'Produccion',
        accountTask: 'Tarea de Account',
        editingTask: 'Tarea de Edicion',
        managementTask: 'Tarea de Gestion',
        user: 'Usuario'
    };
    const selectClassName = 'w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none';
    const textareaClassName = 'w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 h-24 text-sm';
    const submitColor = ['editingTask', 'editor'].includes(type)
        ? 'rose'
        : type === 'accountTask'
          ? 'indigo'
          : type === 'managementTask'
            ? 'violet'
            : type === 'manager' || type === 'client'
              ? 'blue'
              : 'purple';

    let displayDate = '';
    if (data?.date && typeof data.date === 'string') {
        const [y, m, d] = data.date.split('-');
        displayDate = new Date(y, m - 1, d).toLocaleDateString('es-HN', { weekday: 'long', day: 'numeric', month: 'long' });
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[90] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950 shrink-0">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">{isEdit ? 'Editar ' : 'Nuevo '}{titles[type]}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400"><Icon name="X" size={20} /></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scroll">
                    <form onSubmit={onSubmit} className="space-y-4">
                        
                        {['event', 'accountTask', 'editingTask', 'managementTask'].includes(type) && !isEdit && (
                            <div className="text-center p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 mb-2">
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Para el día</p>
                                <p className="text-lg font-black text-slate-800 dark:text-white capitalize">{displayDate}</p>
                            </div>
                        )}

                        {type === 'client' && <><Input name="name" placeholder="Nombre" defaultValue={data?.name} required /><Input name="niche" placeholder="Rubro" defaultValue={data?.niche} required /><Input name="package" placeholder="Paquete" defaultValue={data?.package} required /><Input name="instagram" placeholder="Link Instagram" defaultValue={data?.instagram} /><select name="managerId" defaultValue={data?.managerId} className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"><option value="">Asignar Manager (Opcional)</option>{managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></>}
                        
                        {type === 'manager' && <><Input name="name" placeholder="Nombre Completo" defaultValue={data?.name} required /><Input name="email" type="email" placeholder="Correo" defaultValue={data?.email} required /></>}
                        
                        {type === 'editor' && <><Input name="name" placeholder="Nombre del Editor" defaultValue={data?.name} required /><Input name="email" type="email" placeholder="Correo" defaultValue={data?.email} required /></>}
                        
                        {type === 'event' && <><Input name="title" placeholder="Nombre Producción" defaultValue={eventDefaultTitle} required autoFocus /><Input name="time" type="time" label="Hora (Opcional)" defaultValue={eventDefaultTime} /></>}
                        
                        {type === 'accountTask' && <>
                            <Input name="title" placeholder="¿Qué hay que hacer/publicar?" defaultValue={data?.title} required autoFocus />
                            
                            <select name="clientId" defaultValue={data?.clientId || ""} className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none">
                                <option value="">💼 Sin cliente (Tarea interna)</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>

                            <Input name="time" type="time" label="Hora (Opcional)" defaultValue={data?.time || ""} />
                            
                            <select name="manager" required defaultValue={data?.contextId || ""} className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none">
                                <option value="">Selecciona Manager...</option>
                                {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                            
                            <textarea name="notes" placeholder="Notas, copies, ideas..." defaultValue={data?.notes} className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 h-24 text-sm"></textarea>
                        </>}
                        
                        {type === 'editingTask' && <>
                            <Input name="title" placeholder="Título del Video/Diseño" defaultValue={data?.title} required autoFocus />
                            
                            <select name="clientId" defaultValue={data?.clientId || ""} className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none">
                                <option value="">💼 Sin cliente (Tarea interna)</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>

                            <select name="priority" required defaultValue={data?.priority || 'normal'} className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-700 dark:text-slate-200">
                                <option value="normal" className="text-amber-600 dark:text-amber-400">🟡 Prioridad Normal</option>
                                <option value="urgente" className="text-red-600 dark:text-red-400">🔴 URGENTE</option>
                                <option value="recurrente" className="text-emerald-600 dark:text-emerald-400">🟢 Recurrente</option>
                            </select>
                            
                            <select name="hierarchy" required defaultValue={data?.hierarchy || getEditingHierarchyId(data || {})} className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-700 dark:text-slate-200">
                                {EDITING_HIERARCHY_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                            </select>

                            <select name="status" required defaultValue={data?.status || 'editar'} className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-700 dark:text-slate-200">
                                {EDITING_STATUS_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                            </select>

                            <select name="editor" required defaultValue={data?.contextId || ""} className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none">
                                <option value="">Selecciona Editor...</option>
                                {editors.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                            
                            <textarea name="notes" placeholder="Notas, links a drive..." defaultValue={data?.notes} className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 h-24 text-sm"></textarea>
                        </>}

                        {type === 'managementTask' && <>
                            <Input name="title" placeholder="Titulo de la gestion" defaultValue={data?.title} required autoFocus />

                            <Input name="date" type="date" label="Fecha limite *" defaultValue={data?.date || getHondurasTodayStr()} required />

                            <select name="clientId" defaultValue={data?.clientId || ""} className={`${selectClassName} font-bold`}>
                                <option value="">Sin cliente asociado</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>

                            <Input name="time" type="time" label="Hora limite *" defaultValue={data?.time || ""} required />

                            <select name="member" required defaultValue={data?.contextId || ""} className={selectClassName}>
                                <option value="">Selecciona integrante...</option>
                                {managementUsers.map((member) => <option key={member.id} value={member.id}>{member.name}{member.email ? ` (${member.email})` : ''}</option>)}
                            </select>

                            <select name="category" defaultValue={data?.category || 'seguimiento'} className={`${selectClassName} font-bold`}>
                                <option value="seguimiento">Seguimiento</option>
                                <option value="coordinacion">Coordinacion</option>
                                <option value="aprobacion">Aprobacion</option>
                                <option value="soporte">Soporte</option>
                            </select>

                            <textarea name="notes" placeholder="Detalle de la gestion, acuerdos o proximos pasos..." defaultValue={data?.notes} className={textareaClassName}></textarea>

                            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="notificationsEnabled"
                                    defaultChecked={data?.notificationsEnabled !== false}
                                    className="w-4 h-4 accent-violet-600"
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Recordar por correo</p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Envia avisos al asignado 8 horas antes, al vencer y cada 24 horas si sigue abierta.</p>
                                </div>
                            </label>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-2">El integrante asignado debe tener correo para que esta automatizacion funcione.</p>
                        </>}

                        {type === 'user' && <>
                            <Input name="name" placeholder="Nombre completo" defaultValue={data?.name} required autoFocus />
                            <Input name="email" type="email" placeholder="Correo autorizado" defaultValue={data?.email} required />

                            <select name="role" defaultValue={data?.role || 'viewer'} className={`${selectClassName} font-bold`}>
                                {Object.entries(ROLE_DEFINITIONS).map(([roleId, roleMeta]) => <option key={roleId} value={roleId}>{roleMeta.label}</option>)}
                            </select>

                            <select name="isActive" defaultValue={data?.isActive === false ? 'false' : 'true'} className={`${selectClassName} font-bold`}>
                                <option value="true">Activo</option>
                                <option value="false">Inactivo</option>
                            </select>
                        </>}

                        <Button type="submit" full color={submitColor}>{isEdit ? 'Guardar Cambios' : 'Crear'}</Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const DeleteConfirmModal = ({ config, onClose, onConfirm }) => (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400"><Icon name="AlertTriangle" size={32} /></div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">¿Eliminar {config.title}?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Esta acción es permanente y no se puede deshacer.</p>
            <div className="flex gap-3"><button onClick={onClose} className="flex-1 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancelar</button><button onClick={onConfirm} className="flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 shadow-lg shadow-red-500/30 transition-colors">Confirmar</button></div>
        </div>
    </div>
);

const Toast = ({ message, type }) => (<div className={`fixed bottom-6 right-6 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 fade-in z-[110] ${type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 dark:bg-white text-white dark:text-slate-900'}`}><Icon name={type === 'success' ? "CheckCircle2" : "AlertTriangle"} size={20} className={type === 'success' ? "text-green-400" : ""}/><span className="font-bold text-sm">{message}</span></div>);

const root = createRoot(document.getElementById('root'));
root.render(<App />);
