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
            'create_calendar_events',
            'manage_calendar',
            'view_users',
            'manage_users',
            'view_audit_logs',
            'view_client_chat',
            'send_client_chat',
            'moderate_client_chat'
        ]
    },
    management: {
        label: 'Gestion',
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
        permissions: [
            'view_dashboard',
            'view_account_room',
            'create_account_tasks',
            'view_editions_room',
            'create_editing_tasks',
            'manage_editing_tasks',
            'view_management_room',
            'create_management_tasks',
            'view_client_chat',
            'send_client_chat'
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
    // Las salas de Produccion y Podcast son tableros de `events`: mover una
    // tarjeta es un update. Por eso todo rol que pueda crear eventos tambien
    // administra el calendario; si no, crea tarjetas que jamas puede mover.
    events: {
        read: 'view_calendar',
        create: 'create_calendar_events',
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
    },
    ranking_settings: {
        read: 'view_dashboard',
        create: 'manage_ranking_settings',
        update: 'manage_ranking_settings',
        delete: 'manage_ranking_settings'
    },
    client_chats: {
        read: 'view_client_chat',
        create: 'send_client_chat',
        // Solo moderadores pueden editar/borrar cualquier mensaje; el autor puede
        // editar/borrar el suyo via la ruta self-edit en routes/collections.js.
        update: 'moderate_client_chat',
        delete: 'moderate_client_chat'
    },
    chat_reads: {
        read: 'view_client_chat',
        create: 'view_client_chat',
        update: 'view_client_chat',
        delete: 'view_client_chat'
    },
    chat_mutes: {
        read: 'view_client_chat',
        create: 'view_client_chat',
        update: 'view_client_chat',
        delete: 'view_client_chat'
    },
    chat_hidden: {
        read: 'view_client_chat',
        create: 'view_client_chat',
        update: 'view_client_chat',
        delete: 'view_client_chat'
    },
    chat_reactions: {
        read: 'view_client_chat',
        create: 'view_client_chat',
        update: 'view_client_chat',
        delete: 'view_client_chat'
    },
    chat_pins: {
        read: 'view_client_chat',
        create: 'view_client_chat',
        update: 'view_client_chat',
        delete: 'view_client_chat'
    },
    // Biblioteca compartida de stickers (webp/gif/png). Cualquiera del equipo
    // puede verlos y subir; borrar queda para moderadores (o el autor via la
    // ruta self-edit en routes/collections.js).
    chat_stickers: {
        read: 'view_client_chat',
        create: 'send_client_chat',
        update: 'moderate_client_chat',
        delete: 'moderate_client_chat'
    }
};
