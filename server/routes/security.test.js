import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';

const tempDir = await mkdtemp(path.join(os.tmpdir(), 'clusterag-security-'));
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
    SQLITE_FILENAME: path.join(tempDir, 'audit.sqlite'),
    SESSION_SECRET: 'security-test-secret',
    SESSION_COOKIE_NAME: 'cluster_session',
    APP_BASE_URL: 'https://app.example.test',
    SMTP_HOST: '',
    SMTP_USER: '',
    SMTP_PASSWORD: '',
    SEED_SUPER_ADMIN_EMAILS: 'bootstrap@example.test',
    SEED_MANAGEMENT_TEAM_JSON: '[]',
    SEED_EDITOR_TEAM_JSON: '[]'
});

const [{ createApp }, { db }, { createRecord, getRecord }, { signPayload }, { addHoursToIso, nowIso }, { resolveSafeWebRedirect }] = await Promise.all([
    import('../app.js'),
    import('../db/knex.js'),
    import('../lib/records.js'),
    import('../lib/crypto.js'),
    import('../lib/time.js'),
    import('./auth.js')
]);

let server;
let baseUrl;
let viewerToken;
let operationsToken;

const createToken = (userId) => signPayload({
    sub: userId,
    provider: 'test',
    iat: nowIso(),
    exp: addHoursToIso(1)
}, process.env.SESSION_SECRET);

const request = async (pathname, { token, method = 'GET', body } = {}) => {
    const response = await fetch(`${baseUrl}${pathname}`, {
        method,
        headers: {
            ...(token ? { cookie: `cluster_session=${token}` } : {}),
            ...(body === undefined ? {} : { 'content-type': 'application/json' })
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    const payload = await response.json().catch(() => null);
    return { status: response.status, payload };
};

before(async () => {
    const app = await createApp();
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    await createRecord({
        collectionName: 'users',
        recordId: 'viewer',
        payload: {
            name: 'Viewer Test',
            email: 'viewer@example.test',
            role: 'viewer',
            isActive: true
        }
    });
    await createRecord({
        collectionName: 'users',
        recordId: 'operations',
        payload: {
            name: 'Operations Test',
            email: 'operations@example.test',
            role: 'operations',
            isActive: true
        }
    });
    await createRecord({
        collectionName: 'clients',
        recordId: 'client-1',
        payload: { name: 'Cliente de prueba' }
    });

    const stamp = nowIso();
    await db('auth_sessions').insert({
        session_id: 'legacy-report-session',
        user_record_id: 'viewer',
        provider: 'test',
        expires_at: addHoursToIso(1),
        last_seen_at: stamp,
        created_at: stamp
    });

    viewerToken = createToken('viewer');
    operationsToken = createToken('operations');
});

after(async () => {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await db.destroy();
    await rm(tempDir, { recursive: true, force: true });
});

test('business collections require an authenticated session', async () => {
    assert.equal((await request('/api/collections/clients')).status, 401);
    assert.equal((await request('/api/collections/clients', { token: viewerToken })).status, 200);
});

test('POST cannot overwrite an existing record through a conflicting id', async () => {
    await createRecord({
        collectionName: 'management_tasks',
        recordId: 'protected-task',
        payload: {
            title: 'Original',
            date: '2026-07-27',
            time: '17:00',
            contextId: 'viewer'
        }
    });

    const response = await request('/api/collections/management_tasks', {
        token: viewerToken,
        method: 'POST',
        body: {
            id: 'protected-task',
            data: {
                title: 'Sobrescrita',
                date: '2026-07-27',
                time: '17:00',
                contextId: 'viewer'
            }
        }
    });

    assert.equal(response.status, 409);
    assert.equal((await getRecord({
        collectionName: 'management_tasks',
        recordId: 'protected-task'
    })).title, 'Original');
});

test('management tasks reject an empty title', async () => {
    const response = await request('/api/collections/management_tasks', {
        token: viewerToken,
        method: 'POST',
        body: {
            data: {
                title: '   ',
                date: '2026-07-27',
                time: '17:00',
                contextId: 'viewer'
            }
        }
    });
    assert.equal(response.status, 400);
    assert.equal(response.payload?.error?.code, 'management_tasks/title-required');
});

test('notifications require a session and a known active recipient', async () => {
    assert.equal((await request('/api/notifications/send', {
        method: 'POST',
        body: {}
    })).status, 401);

    assert.equal((await request('/api/notifications/send', {
        token: viewerToken,
        method: 'POST',
        body: { to: 'outside@example.test', type: 'mention' }
    })).status, 400);

    assert.equal((await request('/api/notifications/send', {
        token: viewerToken,
        method: 'POST',
        body: {
            to: 'operations@example.test',
            type: 'mention',
            taskTitle: 'Prueba',
            comment: 'Mensaje'
        }
    })).status, 200);
});

test('editor performance report is protected and database portable', async () => {
    assert.equal((await request('/api/reports/rendimiento-editores')).status, 401);
    assert.equal((await request('/api/reports/rendimiento-editores', { token: viewerToken })).status, 403);

    const response = await request('/api/reports/rendimiento-editores', { token: operationsToken });
    assert.equal(response.status, 200);
    assert.equal(response.payload?.success, true);
    assert.equal(response.payload?.data?.[0]?.email, 'viewer@example.test');
});

test('users without view_users can only read their own profile', async () => {
    const viewerList = await request('/api/collections/users', { token: viewerToken });
    assert.equal(viewerList.status, 200);
    assert.deepEqual(viewerList.payload.records.map((record) => record.id), ['viewer']);

    const ownDoc = await request('/api/collections/users/viewer', { token: viewerToken });
    assert.equal(ownDoc.status, 200);
    assert.equal(ownDoc.payload.record.email, 'viewer@example.test');

    const otherDoc = await request('/api/collections/users/operations', { token: viewerToken });
    assert.equal(otherDoc.status, 403);

    const operationsList = await request('/api/collections/users', { token: operationsToken });
    assert.equal(operationsList.status, 200);
    assert.ok(operationsList.payload.records.map((record) => record.id).includes('operations'));
    assert.ok(operationsList.payload.records.map((record) => record.id).includes('viewer'));
});

test('OAuth web redirects stay on the application origin', () => {
    const req = {
        protocol: 'https',
        get: (name) => (name === 'host' ? 'app.example.test' : '')
    };
    assert.equal(resolveSafeWebRedirect(req, '/sala?tab=gestion'), '/sala?tab=gestion');
    assert.equal(resolveSafeWebRedirect(req, 'https://app.example.test/reportes#hoy'), '/reportes#hoy');
    assert.equal(resolveSafeWebRedirect(req, 'https://evil.example/phishing'), '/');
    assert.equal(resolveSafeWebRedirect(req, '//evil.example/phishing'), '/');
});
