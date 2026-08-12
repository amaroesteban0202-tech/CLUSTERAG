import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';

const tempDir = await mkdtemp(path.join(os.tmpdir(), 'clusterag-task-refs-'));
const emptyEnv = path.join(tempDir, 'empty.env');
await writeFile(emptyEnv, '');

Object.assign(process.env, {
    NODE_ENV: 'test',
    DOTENV_CONFIG_PATH: emptyEnv,
    DATABASE_CLIENT: 'sqlite3',
    DATABASE_URL: '',
    POSTGRES_URL: '',
    POSTGRES_PRISMA_URL: '',
    POSTGRES_URL_NON_POOLING: '',
    DATABASE_URL_UNPOOLED: '',
    SQLITE_FILENAME: path.join(tempDir, 'task-refs.sqlite'),
    SESSION_SECRET: 'task-refs-test-secret',
    SESSION_COOKIE_NAME: 'cluster_session',
    APP_BASE_URL: 'https://app.example.test',
    SMTP_HOST: '',
    SMTP_USER: '',
    SMTP_PASSWORD: '',
    SEED_SUPER_ADMIN_EMAILS: 'bootstrap@example.test',
    SEED_MANAGEMENT_TEAM_JSON: '[]',
    SEED_EDITOR_TEAM_JSON: '[]'
});

const [{ createApp }, { db }, { createRecord }, { randomToken, sha256 }, { addHoursToIso, nowIso }] = await Promise.all([
    import('../app.js'),
    import('../db/knex.js'),
    import('../lib/records.js'),
    import('../lib/crypto.js'),
    import('../lib/time.js')
]);

let server;
let baseUrl;
let token;

const request = async (pathname, { method = 'GET', body } = {}) => {
    const response = await fetch(`${baseUrl}${pathname}`, {
        method,
        headers: {
            cookie: `cluster_session=${token}`,
            ...(body === undefined ? {} : { 'content-type': 'application/json' })
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    return { status: response.status, payload: await response.json().catch(() => null) };
};

before(async () => {
    const app = await createApp();
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    await createRecord({
        collectionName: 'users',
        recordId: 'gestion',
        payload: { name: 'Gestion Test', email: 'gestion@example.test', role: 'management', isActive: true }
    });
    await createRecord({
        collectionName: 'users',
        recordId: 'super-admin',
        payload: { name: 'Admin Test', email: 'admin@example.test', role: 'super_admin', isActive: true }
    });
    await createRecord({ collectionName: 'clients', recordId: 'client-1', payload: { name: 'Cliente' } });
    // Persona del directorio sin usuario de la app: el caso que rompia el alta.
    await createRecord({ collectionName: 'managers', recordId: 'manager-sin-user', payload: { name: 'Genesis' } });
    await createRecord({ collectionName: 'editors', recordId: 'editor-sin-user', payload: { name: 'Juan' } });
    // Tarea historica con un responsable que ya no existe en ninguna coleccion.
    await createRecord({
        collectionName: 'editing',
        recordId: 'editing-heredada',
        payload: {
            title: 'Video historico',
            clientId: 'client-1',
            contextId: 'pending-user',
            assigneeUserId: 'pending-user',
            status: 'editar'
        }
    });

    token = randomToken(48);
    await db('auth_sessions').insert({
        session_id: sha256(token),
        user_record_id: 'super-admin',
        provider: 'test',
        expires_at: addHoursToIso(1),
        last_seen_at: nowIso(),
        created_at: nowIso()
    });
});

after(async () => {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await db.destroy();
    await rm(tempDir, { recursive: true, force: true });
});

test('el responsable puede venir de cualquiera de los tres directorios', async () => {
    const accountTask = await request('/api/collections/account_tasks', {
        method: 'POST',
        body: { data: { title: 'Post', clientId: 'client-1', contextId: 'gestion', assigneeUserId: 'gestion' } }
    });
    assert.equal(accountTask.status, 201);

    const editingTask = await request('/api/collections/editing', {
        method: 'POST',
        body: { data: { title: 'Video', clientId: 'client-1', contextId: 'gestion', assigneeUserId: 'gestion' } }
    });
    assert.equal(editingTask.status, 201);

    const managementTask = await request('/api/collections/management_tasks', {
        method: 'POST',
        body: {
            data: {
                title: 'Seguimiento',
                clientId: 'client-1',
                date: '2026-08-20',
                time: '10:00',
                contextId: 'editor-sin-user',
                assigneeUserId: 'editor-sin-user',
                notificationsEnabled: false
            }
        }
    });
    assert.equal(managementTask.status, 201);
});

test('un responsable inexistente sigue rechazandose al crear', async () => {
    const response = await request('/api/collections/account_tasks', {
        method: 'POST',
        body: { data: { title: 'Post', clientId: 'client-1', contextId: 'no-existe' } }
    });
    assert.equal(response.status, 400);
    assert.equal(response.payload?.error?.code, 'document/invalid-reference');
});

test('una referencia heredada rota no bloquea mover la tarea', async () => {
    const response = await request('/api/collections/editing/editing-heredada', {
        method: 'PATCH',
        body: { data: { status: 'aprobado' } }
    });
    assert.equal(response.status, 200);
    assert.equal(response.payload?.record?.status, 'aprobado');
});

test('reasignar a alguien inexistente sigue rechazandose al editar', async () => {
    const response = await request('/api/collections/editing/editing-heredada', {
        method: 'PATCH',
        body: { data: { contextId: 'tampoco-existe' } }
    });
    assert.equal(response.status, 400);
    assert.equal(response.payload?.error?.code, 'document/invalid-reference');
});
