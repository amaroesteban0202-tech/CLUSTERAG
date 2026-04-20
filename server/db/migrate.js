import { db } from './knex.js';

const ensureAppRecordsTable = async () => {
    const exists = await db.schema.hasTable('app_records');
    if (exists) return;

    await db.schema.createTable('app_records', (table) => {
        table.increments('id').primary();
        table.string('collection_name', 120).notNullable();
        table.string('record_id', 120).notNullable();
        table.text('payload_json').notNullable();
        table.string('created_at', 40).notNullable();
        table.string('updated_at', 40).notNullable();
        table.string('email_index', 255).nullable();
        table.string('role_index', 80).nullable();
        table.boolean('is_active_index').nullable();
        table.string('auth_uid_index', 255).nullable();
        table.string('management_key_index', 255).nullable();
        table.unique(['collection_name', 'record_id']);
        table.index(['collection_name', 'updated_at']);
        table.index(['collection_name', 'email_index']);
        table.index(['collection_name', 'role_index']);
        table.index(['collection_name', 'auth_uid_index']);
    });
};

const ensureAuthSessionsTable = async () => {
    const exists = await db.schema.hasTable('auth_sessions');
    if (exists) return;

    await db.schema.createTable('auth_sessions', (table) => {
        table.string('session_id', 140).primary();
        table.string('user_record_id', 120).notNullable();
        table.string('provider', 120).notNullable().defaultTo('password');
        table.string('expires_at', 40).notNullable();
        table.string('last_seen_at', 40).notNullable();
        table.string('created_at', 40).notNullable();
        table.string('ip_address', 120).nullable();
        table.text('user_agent').nullable();
        table.index(['user_record_id']);
        table.index(['expires_at']);
    });
};

const ensureMagicLinksTable = async () => {
    const exists = await db.schema.hasTable('auth_magic_links');
    if (exists) return;

    await db.schema.createTable('auth_magic_links', (table) => {
        table.string('id', 140).primary();
        table.string('user_record_id', 120).notNullable();
        table.string('email', 255).notNullable();
        table.string('token_hash', 255).notNullable();
        table.text('redirect_url').nullable();
        table.string('reason', 120).nullable();
        table.string('requested_by', 120).nullable();
        table.string('expires_at', 40).notNullable();
        table.string('consumed_at', 40).nullable();
        table.string('created_at', 40).notNullable();
        table.index(['email']);
        table.index(['token_hash']);
    });
};

const ensureOauthStatesTable = async () => {
    const exists = await db.schema.hasTable('auth_oauth_states');
    if (exists) return;

    await db.schema.createTable('auth_oauth_states', (table) => {
        table.string('state', 140).primary();
        table.boolean('popup').notNullable().defaultTo(false);
        table.text('redirect_after').nullable();
        table.string('expires_at', 40).notNullable();
        table.string('created_at', 40).notNullable();
    });
};

export const migrateDatabase = async () => {
    await ensureAppRecordsTable();
    await ensureAuthSessionsTable();
    await ensureMagicLinksTable();
    await ensureOauthStatesTable();
};
