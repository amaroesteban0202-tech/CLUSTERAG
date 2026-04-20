export const ROLE_DEFINITIONS = {
    super_admin: {
        label: 'Super Admin',
        permissions: ['*']
    },
    operations: {
        label: 'Operaciones',
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

export const COLLECTION_PERMISSIONS = {
    clients: {
        read: 'view_clients',
        create: 'manage_clients',
        update: 'manage_clients',
        delete: 'manage_clients'
    },
    managers: {
        read: 'view_managers',
        create: 'manage_managers',
        update: 'manage_managers',
        delete: 'manage_managers'
    },
    editors: {
        read: 'view_editors',
        create: 'manage_editors',
        update: 'manage_editors',
        delete: 'manage_editors'
    },
    account_tasks: {
        read: 'view_account_room',
        create: 'create_account_tasks',
        update: 'manage_account_tasks',
        delete: 'manage_account_tasks'
    },
    editing: {
        read: 'view_editions_room',
        create: 'create_editing_tasks',
        update: 'manage_editing_tasks',
        delete: 'manage_editing_tasks'
    },
    management_tasks: {
        read: 'view_management_room',
        create: 'create_management_tasks',
        update: 'manage_management_tasks',
        delete: 'manage_management_tasks'
    },
    events: {
        read: 'view_calendar',
        create: 'manage_calendar',
        update: 'manage_calendar',
        delete: 'manage_calendar'
    },
    users: {
        read: 'view_users',
        create: 'manage_users',
        update: 'manage_users',
        delete: 'manage_users'
    },
    audit_logs: {
        read: 'view_audit_logs',
        create: 'view_dashboard',
        update: 'manage_users',
        delete: 'manage_users'
    }
};
