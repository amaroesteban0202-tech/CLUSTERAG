// Mantener este string visible en runtime ayuda a no perder clases dinamicas de Tailwind CDN.
export const TAILWIND_SAFELIST = 'bg-purple-50 text-purple-700 border-purple-200 bg-purple-100 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30 bg-purple-500 text-purple-600 ' +
'bg-indigo-50 text-indigo-700 border-indigo-200 bg-indigo-100 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30 bg-indigo-500 text-indigo-600 ' +
'bg-blue-50 text-blue-700 border-blue-200 bg-blue-100 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30 bg-blue-500 text-blue-600 ' +
'bg-cyan-50 text-cyan-700 border-cyan-200 bg-cyan-100 dark:bg-cyan-500/20 dark:text-cyan-400 dark:border-cyan-500/30 bg-cyan-500 text-cyan-600 ' +
'bg-amber-50 text-amber-700 border-amber-200 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30 bg-amber-500 text-amber-600 ' +
'bg-orange-50 text-orange-700 border-orange-200 bg-orange-100 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30 bg-orange-500 text-orange-600 ' +
'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 bg-fuchsia-100 dark:bg-fuchsia-500/20 dark:text-fuchsia-400 dark:border-fuchsia-500/30 bg-fuchsia-500 text-fuchsia-600 ' +
'bg-violet-50 text-violet-700 border-violet-200 bg-violet-100 dark:bg-violet-500/20 dark:text-violet-400 dark:border-violet-500/30 bg-violet-500 text-violet-600 ' +
'bg-stone-50 text-stone-700 border-stone-200 bg-stone-100 dark:bg-stone-500/20 dark:text-stone-400 dark:border-stone-500/30 bg-stone-500 text-stone-600 ' +
'bg-emerald-50 text-emerald-700 border-emerald-200 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 bg-emerald-500 text-emerald-600 ' +
'bg-rose-50 text-rose-700 border-rose-200 bg-rose-100 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30 bg-rose-500 text-rose-600 ' +
'bg-slate-50 text-slate-700 border-slate-200 bg-slate-100 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30 bg-slate-500 text-slate-600 ' +
'ring-amber-600/50 bg-amber-600/10';

export const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const PERSON_COLORS = {
    purple: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-800 dark:text-purple-100' },
    indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900', text: 'text-indigo-800 dark:text-indigo-100' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-100' },
    cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900', text: 'text-cyan-800 dark:text-cyan-100' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900', text: 'text-amber-800 dark:text-amber-100' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-800 dark:text-orange-100' },
    fuchsia: { bg: 'bg-fuchsia-100 dark:bg-fuchsia-900', text: 'text-fuchsia-800 dark:text-fuchsia-100' },
    violet: { bg: 'bg-violet-100 dark:bg-violet-900', text: 'text-violet-800 dark:text-violet-100' },
    stone: { bg: 'bg-stone-200 dark:bg-stone-800', text: 'text-stone-800 dark:text-stone-100' },
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900', text: 'text-emerald-800 dark:text-emerald-100' },
    slate: { bg: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-800 dark:text-slate-100' },

    c1: { bg: 'bg-red-500', text: 'text-white' },
    c2: { bg: 'bg-blue-600', text: 'text-white' },
    c3: { bg: 'bg-emerald-600', text: 'text-white' },
    c4: { bg: 'bg-amber-500', text: 'text-white' },
    c5: { bg: 'bg-purple-600', text: 'text-white' },
    c6: { bg: 'bg-pink-600', text: 'text-white' },
    c7: { bg: 'bg-cyan-600', text: 'text-white' },
    c8: { bg: 'bg-orange-600', text: 'text-white' },
    c9: { bg: 'bg-indigo-600', text: 'text-white' },
    c10: { bg: 'bg-teal-600', text: 'text-white' },

    c21: { bg: 'bg-red-200 dark:bg-red-900', text: 'text-red-900 dark:text-red-100' },
    c22: { bg: 'bg-blue-200 dark:bg-blue-900', text: 'text-blue-900 dark:text-blue-100' },
    c23: { bg: 'bg-emerald-200 dark:bg-emerald-900', text: 'text-emerald-900 dark:text-emerald-100' },
    c24: { bg: 'bg-yellow-300 dark:bg-yellow-900', text: 'text-yellow-900 dark:text-yellow-100' },
    c25: { bg: 'bg-purple-200 dark:bg-purple-900', text: 'text-purple-900 dark:text-purple-100' },
    c26: { bg: 'bg-pink-200 dark:bg-pink-900', text: 'text-pink-900 dark:text-pink-100' }
};

export const ACCOUNT_COLORS = ['purple', 'indigo', 'blue', 'cyan', 'amber', 'orange', 'fuchsia', 'violet', 'stone'];
export const EDITOR_COLORS = ['c21', 'c22', 'c23', 'c24', 'c25', 'c26'];
export const LEGACY_COLOR_MAP = { c1: 'purple', c2: 'blue', c3: 'indigo', c4: 'amber', c5: 'fuchsia', c6: 'violet', c7: 'cyan', c8: 'orange', c9: 'indigo', c10: 'stone' };

export const ROLE_DEFINITIONS = {
    super_admin: {
        label: 'Super Admin',
        color: 'purple',
        permissions: ['*']
    },
    operations: {
        label: 'Operaciones',
        color: 'indigo',
        permissions: [
            'view_dashboard',
            'view_clients',
            'manage_clients',
            'view_managers',
            'manage_managers',
            'view_editors',
            'manage_editors',
            'view_account_room',
            'create_account_tasks',
            'manage_account_tasks',
            'view_editions_room',
            'create_editing_tasks',
            'manage_editing_tasks',
            'view_management_room',
            'create_management_tasks',
            'manage_management_tasks',
            'view_general_calendar',
            'view_calendar',
            'manage_calendar',
            'view_users',
            'manage_users',
            'view_audit_logs'
        ]
    },
    management: {
        label: 'Gestion',
        color: 'violet',
        permissions: [
            'view_dashboard',
            'view_clients',
            'view_account_room',
            'create_account_tasks',
            'view_editions_room',
            'create_editing_tasks',
            'manage_editing_tasks',
            'view_management_room',
            'create_management_tasks',
            'manage_management_tasks',
            'view_general_calendar',
            'view_calendar'
        ]
    },
    manager: {
        label: 'Account Manager',
        color: 'blue',
        permissions: [
            'view_dashboard',
            'view_clients',
            'manage_clients',
            'view_managers',
            'view_account_room',
            'create_account_tasks',
            'manage_account_tasks',
            'view_editions_room',
            'create_editing_tasks',
            'manage_editing_tasks',
            'view_management_room',
            'create_management_tasks',
            'view_general_calendar',
            'view_calendar'
        ]
    },
    editor: {
        label: 'Editor',
        color: 'rose',
        permissions: [
            'view_dashboard',
            'view_account_room',
            'create_account_tasks',
            'view_editors',
            'view_editions_room',
            'create_editing_tasks',
            'manage_editing_tasks',
            'view_management_room',
            'create_management_tasks',
            'view_general_calendar'
        ]
    },
    viewer: {
        label: 'Viewer',
        color: 'slate',
        permissions: [
            'view_dashboard',
            'view_account_room',
            'create_account_tasks',
            'view_editions_room',
            'create_editing_tasks',
            'manage_editing_tasks',
            'view_management_room',
            'create_management_tasks'
        ]
    }
};

export const SUPER_ADMIN_EMAILS = [
    'maycolljaramillo01@gmail.com'
];

export const DEFAULT_MANAGEMENT_TEAM = [
    { name: 'Aiskel', email: 'aiskel.wuerman82@gmail.com' },
    { name: 'Maycoll', email: 'maycolljaramillo01@gmail.com' },
    { name: 'Esteban', email: 'estebanantonio02@gmail.com' },
    { name: 'Maria', email: 'marialaguna2117@gmail.com' },
    { name: 'Orlando', email: 'info@cluster.marketing' }
];

// Editores pre-autorizados: al iniciar sesion con estos correos,
// el sistema les asigna automaticamente el rol 'editor'.
export const DEFAULT_EDITORS_TEAM = [
    { name: 'Maria Galicia', email: 'marialaguna2117@gmail.com', color: 'c22' }
];

export const EDITING_HIERARCHY_OPTIONS = [
    { id: 'p1', label: 'P1 Critico', color: 'red' },
    { id: 'p2', label: 'P2 Alto Impacto', color: 'amber' },
    { id: 'p3', label: 'P3 Operativo', color: 'emerald' },
    { id: 'p4', label: 'P4 Backlog', color: 'slate' }
];
