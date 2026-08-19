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
            'create_calendar_events',
            'manage_calendar',
            'view_users',
            'manage_users',
            'manage_ranking_settings',
            'view_audit_logs',
            'view_client_chat',
            'send_client_chat',
            'moderate_client_chat'
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
            'manage_account_tasks',
            'view_editions_room',
            'create_editing_tasks',
            'manage_editing_tasks',
            'view_management_room',
            'create_management_tasks',
            'manage_management_tasks',
            'view_general_calendar',
            'view_calendar',
            'create_calendar_events',
            'manage_calendar',
            'view_client_chat',
            'send_client_chat'
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
            'view_editors',
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
            'create_calendar_events',
            'manage_calendar',
            'view_client_chat',
            'send_client_chat'
        ]
    },
    editor: {
        label: 'Editor',
        color: 'rose',
        permissions: [
            'view_dashboard',
            'view_managers',
            'view_account_room',
            'create_account_tasks',
            'view_editors',
            'view_editions_room',
            'create_editing_tasks',
            'manage_editing_tasks',
            'view_management_room',
            'create_management_tasks',
            'view_general_calendar',
            'view_calendar',
            'create_calendar_events',
            'manage_calendar',
            'view_client_chat',
            'send_client_chat'
        ]
    },
    viewer: {
        label: 'Viewer',
        color: 'slate',
        permissions: ['view_dashboard']
    }
};
