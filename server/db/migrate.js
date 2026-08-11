import { db } from './knex.js';

const MIGRATION_LOCK_ID = 1_248_711_903;

const withMigrationLock = async (callback) => {
    if (db.client.config.client !== 'pg') return callback();

    const connection = await db.client.acquireConnection();
    try {
        await db.raw('SELECT pg_advisory_lock(?)', [MIGRATION_LOCK_ID]).connection(connection);
        return await callback();
    } finally {
        try {
            await db.raw('SELECT pg_advisory_unlock(?)', [MIGRATION_LOCK_ID]).connection(connection);
        } finally {
            await db.client.releaseConnection(connection);
        }
    }
};

const ensureSchemaMigrationsTable = async () => {
    if (await db.schema.hasTable('schema_migrations')) return;
    await db.schema.createTable('schema_migrations', (table) => {
        table.string('version', 120).primary();
        table.string('applied_at', 40).notNullable();
    });
};

const markMigration = async (version) => {
    await db('schema_migrations')
        .insert({
            version,
            applied_at: new Date().toISOString()
        })
        .onConflict('version')
        .ignore();
};

const runMigration = async (version, migration) => {
    const applied = await db('schema_migrations').where({ version }).first();
    if (applied) return;
    const completed = await migration();
    if (completed === false) return;
    await markMigration(version);
};

const ensureAppRecordsTable = async () => {
    const exists = await db.schema.hasTable('app_records');
    if (!exists) {
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
            table.string('date_index', 20).nullable();
            table.string('status_index', 80).nullable();
            table.unique(['collection_name', 'record_id']);
            table.index(['collection_name', 'updated_at']);
            table.index(['collection_name', 'email_index']);
            table.index(['collection_name', 'role_index']);
            table.index(['collection_name', 'auth_uid_index']);
            table.index(['collection_name', 'date_index']);
            table.index(['collection_name', 'status_index']);
        });
        return;
    }

    const addColumn = async (name, build) => {
        if (await db.schema.hasColumn('app_records', name)) return;
        await db.schema.table('app_records', build);
    };

    await addColumn('date_index', (table) => table.string('date_index', 20).nullable());
    await addColumn('status_index', (table) => table.string('status_index', 80).nullable());
};

const ensureRecordChangesTable = async () => {
    if (await db.schema.hasTable('record_changes')) return;

    await db.schema.createTable('record_changes', (table) => {
        table.bigIncrements('id').primary();
        table.string('collection_name', 120).notNullable();
        table.string('record_id', 120).notNullable();
        table.string('action', 20).notNullable();
        table.string('changed_at', 40).notNullable();
        table.index(['collection_name', 'id']);
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

const ensureOauthStatesTable = async () => {
    const exists = await db.schema.hasTable('auth_oauth_states');
    if (!exists) {
        await db.schema.createTable('auth_oauth_states', (table) => {
            table.string('state', 140).primary();
            table.boolean('popup').notNullable().defaultTo(false);
            table.text('redirect_after').nullable();
            table.text('result_token').nullable();
            table.string('expires_at', 40).notNullable();
            table.string('created_at', 40).notNullable();
        });
        return;
    }

    if (!await db.schema.hasColumn('auth_oauth_states', 'result_token')) {
        await db.schema.table('auth_oauth_states', (table) => {
            table.text('result_token').nullable();
        });
    }
};

const ensureIdentityUniqueIndexes = async () => {
    const duplicateEmail = await db('app_records')
        .select('email_index')
        .where({ collection_name: 'users' })
        .whereNotNull('email_index')
        .groupBy('email_index')
        .havingRaw('COUNT(*) > 1')
        .first();
    const duplicateAuthUid = await db('app_records')
        .select('auth_uid_index')
        .where({ collection_name: 'users' })
        .whereNotNull('auth_uid_index')
        .whereNot('auth_uid_index', '')
        .groupBy('auth_uid_index')
        .havingRaw('COUNT(*) > 1')
        .first();
    if (duplicateEmail || duplicateAuthUid) {
        console.warn('No se crearon indices unicos de usuarios: primero deben resolverse identidades duplicadas.');
        return false;
    }

    const client = db.client.config.client;
    if (client === 'pg') {
        await db.raw(`
            CREATE UNIQUE INDEX IF NOT EXISTS app_records_users_email_unique
            ON app_records (email_index)
            WHERE collection_name = 'users' AND email_index IS NOT NULL
        `);
        await db.raw(`
            CREATE UNIQUE INDEX IF NOT EXISTS app_records_users_auth_uid_unique
            ON app_records (auth_uid_index)
            WHERE collection_name = 'users' AND auth_uid_index IS NOT NULL AND auth_uid_index <> ''
        `);
        return true;
    }
    if (client === 'sqlite3') {
        await db.raw(`
            CREATE UNIQUE INDEX IF NOT EXISTS app_records_users_email_unique
            ON app_records (email_index)
            WHERE collection_name = 'users' AND email_index IS NOT NULL
        `);
        await db.raw(`
            CREATE UNIQUE INDEX IF NOT EXISTS app_records_users_auth_uid_unique
            ON app_records (auth_uid_index)
            WHERE collection_name = 'users' AND auth_uid_index IS NOT NULL AND auth_uid_index <> ''
        `);
        return true;
    }
    return false;
};

export const migrateDatabase = async () => {
    await withMigrationLock(async () => {
        await ensureSchemaMigrationsTable();
        await runMigration('001_app_records', ensureAppRecordsTable);
        await runMigration('002_record_changes', ensureRecordChangesTable);
        await runMigration('003_auth_sessions', ensureAuthSessionsTable);
        await runMigration('004_oauth_result_token', ensureOauthStatesTable);
        await runMigration('005_unique_user_identity', ensureIdentityUniqueIndexes);
    });
};
