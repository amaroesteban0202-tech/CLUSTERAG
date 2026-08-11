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

const [{ createApp }, { db }, { createRecord, getRecord, upsertRecord }, { randomToken, sha256, signPayload }, { addHoursToIso, nowIso }, { resolveSafeWebRedirect }, { ensureAuthUserRecord }] = await Promise.all([
    import('../app.js'),
    import('../db/knex.js'),
    import('../lib/records.js'),
    import('../lib/crypto.js'),
    import('../lib/time.js'),
    import('./auth.js'),
    import('../lib/users.js')
]);

let server;
let baseUrl;
let viewerToken;
let operationsToken;
let managerToken;
let editorToken;
let superAdminToken;

const createToken = async (userId) => {
    const token = randomToken(48);
    const stamp = nowIso();
    await db('auth_sessions').insert({
        session_id: sha256(token),
        user_record_id: userId,
        provider: 'test',
        expires_at: addHoursToIso(1),
        last_seen_at: stamp,
        created_at: stamp
    });
    return token;
};

const request = async (pathname, { token, method = 'GET', body, origin } = {}) => {
    const response = await fetch(`${baseUrl}${pathname}`, {
        method,
        headers: {
            ...(token ? { cookie: `cluster_session=${token}` } : {}),
            ...(origin ? { origin } : {}),
            ...(body === undefined ? {} : { 'content-type': 'application/json' })
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    const payload = await response.json().catch(() => null);
    return { status: response.status, payload, headers: response.headers };
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
        collectionName: 'users',
        recordId: 'manager',
        payload: {
            name: 'Manager Test',
            email: 'manager@example.test',
            role: 'manager',
            isActive: true
        }
    });
    await createRecord({
        collectionName: 'users',
        recordId: 'super-admin',
        payload: {
            name: 'Super Admin Test',
            email: 'super@example.test',
            role: 'super_admin',
            isActive: true
        }
    });
    await createRecord({
        collectionName: 'users',
        recordId: 'editor',
        payload: {
            name: 'Editor Test',
            email: 'editor@example.test',
            role: 'editor',
            isActive: true
        }
    });
    await createRecord({
        collectionName: 'clients',
        recordId: 'client-1',
        payload: { name: 'Cliente de prueba' }
    });
    await createRecord({
        collectionName: 'events',
        recordId: 'event-production-1',
        payload: {
            title: 'Produccion de prueba',
            type: 'production',
            date: '2026-08-06',
            status: 'programado'
        }
    });
    await createRecord({
        collectionName: 'client_chats',
        recordId: 'message-1',
        payload: {
            clientId: 'client-1',
            text: 'Mensaje historico',
            authorId: 'viewer',
            authorEmail: 'viewer@example.test',
            authorName: 'Viewer Test'
        }
    });

    viewerToken = await createToken('viewer');
    operationsToken = await createToken('operations');
    managerToken = await createToken('manager');
    editorToken = await createToken('editor');
    superAdminToken = await createToken('super-admin');
});

after(async () => {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await db.destroy();
    await rm(tempDir, { recursive: true, force: true });
});

test('business collections require an authenticated session', async () => {
    assert.equal((await request('/api/collections/clients')).status, 401);
    assert.equal((await request('/api/collections/clients', { token: viewerToken })).status, 403);
    assert.equal((await request('/api/collections/clients', { token: managerToken })).status, 200);
});

test('unsafe cross-origin requests are rejected and security headers are present', async () => {
    const rejected = await request('/api/collections/events', {
        token: operationsToken,
        method: 'POST',
        origin: 'https://evil.example.test',
        body: { data: { title: 'No debe crearse', date: '2026-08-10' } }
    });
    assert.equal(rejected.status, 403);
    assert.equal(rejected.payload?.error?.code, 'security/origin-denied');

    const safe = await request('/api/collections/events', { token: operationsToken });
    assert.equal(safe.status, 200);
    const contentSecurityPolicy = safe.headers.get('content-security-policy') || '';
    assert.match(contentSecurityPolicy, /default-src 'self'/);
    assert.match(contentSecurityPolicy, /script-src 'self' https:\/\/8x8\.vc/);
    assert.equal(safe.headers.get('x-content-type-options'), 'nosniff');

    const popup = await request('/api/auth/google/start?popup=1');
    assert.equal(popup.status, 200);
    assert.match(popup.headers.get('content-security-policy') || '', /script-src 'nonce-[A-Za-z0-9_-]+'/);
});

test('authentication is invitation-only and inactive sessions are rejected', async () => {
    await assert.rejects(
        () => ensureAuthUserRecord({
            email: 'unknown@example.test',
            name: 'Unknown',
            provider: 'google',
            authUid: 'unknown-provider-id',
            verified: true
        }),
        (error) => error?.code === 'auth/invitation-required'
    );

    await upsertRecord({
        collectionName: 'users',
        recordId: 'viewer',
        payload: { isActive: false }
    });
    const inactive = await request('/api/collections/users', { token: viewerToken });
    assert.equal(inactive.status, 401);
    assert.equal(inactive.payload?.error?.code, 'auth/session-required');
    await upsertRecord({
        collectionName: 'users',
        recordId: 'viewer',
        payload: { isActive: true }
    });
    viewerToken = await createToken('viewer');
});

test('native login tokens are single-use and reusable refresh tokens are rejected', async () => {
    const state = 'native-security-state';
    const nativeToken = signPayload({
        typ: 'native_google',
        state,
        email: 'viewer@example.test',
        name: 'Viewer Test',
        provider: 'google.com',
        authUid: 'viewer-native',
        exp: addHoursToIso(1)
    }, 'security-test-secret');
    await db('auth_oauth_states').insert({
        state,
        popup: false,
        redirect_after: 'clusteragency://auth/google',
        result_token: nativeToken,
        expires_at: addHoursToIso(1),
        created_at: nowIso()
    });

    assert.equal((await request('/api/auth/token/exchange', {
        method: 'POST',
        body: { token: nativeToken }
    })).status, 200);
    assert.equal((await request('/api/auth/token/exchange', {
        method: 'POST',
        body: { token: nativeToken }
    })).status, 400);

    const refreshToken = signPayload({
        typ: 'refresh',
        email: 'viewer@example.test',
        exp: addHoursToIso(1)
    }, 'security-test-secret');
    assert.equal((await request('/api/auth/token/exchange', {
        method: 'POST',
        body: { token: refreshToken }
    })).status, 400);
});

test('audit logs are immutable and sensitive collections reject batches', async () => {
    const auditCreate = await request('/api/collections/audit_logs', {
        token: superAdminToken,
        method: 'POST',
        body: { data: { action: 'forged' } }
    });
    assert.equal(auditCreate.status, 403);
    assert.equal(auditCreate.payload?.error?.code, 'audit/immutable');

    const userBatch = await request('/api/collections/_batch', {
        token: superAdminToken,
        method: 'POST',
        body: {
            ops: [{
                collectionName: 'users',
                action: 'create',
                recordId: 'forged-admin',
                data: { email: 'forged@example.test', role: 'super_admin' }
            }]
        }
    });
    assert.equal(userBatch.status, 403);
    assert.equal(userBatch.payload?.error?.code, 'batch/collection-denied');
});

test('chat authorship and private metadata ownership are server-enforced', async () => {
    await createRecord({
        collectionName: 'clients',
        recordId: 'client-authorship',
        payload: { name: 'Cliente autoria' }
    });
    await createRecord({
        collectionName: 'client_chats',
        recordId: 'authorship-membership',
        payload: {
            clientId: 'client-authorship',
            text: 'Mensaje inicial',
            authorId: 'manager',
            authorEmail: 'manager@example.test',
            authorName: 'Manager Test'
        }
    });

    const created = await request('/api/collections/client_chats', {
        token: managerToken,
        method: 'POST',
        body: {
            data: {
                clientId: 'client-authorship',
                text: 'Mensaje autentico',
                authorId: 'super-admin',
                authorEmail: 'super@example.test',
                authorName: 'Suplantado'
            }
        }
    });
    assert.equal(created.status, 201);
    assert.equal(created.payload?.record?.authorId, 'manager');
    assert.equal(created.payload?.record?.authorEmail, 'manager@example.test');
    assert.equal(created.payload?.record?.authorName, 'Manager Test');

    const forgedMention = await request('/api/collections/client_chats', {
        token: managerToken,
        method: 'POST',
        body: {
            data: {
                clientId: 'client-authorship',
                text: 'Mencion no autorizada',
                mentionedIds: ['super-admin']
            }
        }
    });
    assert.equal(forgedMention.status, 403);
    assert.equal(forgedMention.payload?.error?.code, 'chat/mention-not-allowed');

    const unsafeAttachment = await request('/api/collections/client_chats', {
        token: managerToken,
        method: 'POST',
        body: {
            data: {
                clientId: 'client-authorship',
                attachments: [{
                    name: 'pagina.html',
                    type: 'text/html',
                    data: 'data:text/html;base64,PGgxPk5vPC9oMT4='
                }]
            }
        }
    });
    assert.equal(unsafeAttachment.status, 400);
    assert.equal(unsafeAttachment.payload?.error?.code, 'attachment/type-denied');

    await createRecord({
        collectionName: 'chat_reads',
        recordId: 'private-read',
        payload: {
            clientId: 'client-authorship',
            userId: 'viewer',
            lastReadAt: nowIso()
        }
    });
    const ownership = await request('/api/collections/chat_reads/private-read', {
        token: managerToken,
        method: 'PATCH',
        body: { data: { lastReadAt: nowIso() } }
    });
    assert.equal(ownership.status, 403);
    assert.equal(ownership.payload?.error?.code, 'auth/resource-owner-required');
});

test('referenced records cannot be deleted directly or through a batch', async () => {
    const direct = await request('/api/collections/clients/client-1', {
        token: operationsToken,
        method: 'DELETE'
    });
    assert.equal(direct.status, 409);
    assert.equal(direct.payload?.error?.code, 'document/in-use');

    const batched = await request('/api/collections/_batch', {
        token: operationsToken,
        method: 'POST',
        body: {
            ops: [{
                collectionName: 'clients',
                action: 'delete',
                recordId: 'client-1'
            }]
        }
    });
    assert.equal(batched.status, 409);
    assert.equal(batched.payload?.error?.code, 'document/in-use');
    assert.ok(await getRecord({ collectionName: 'clients', recordId: 'client-1' }));
});

test('quien puede crear eventos tambien puede moverlos en Produccion', async () => {
    // Las tarjetas de Produccion/Podcast son eventos: crear sin poder actualizar
    // dejaba al equipo con tarjetas inmovibles.
    for (const token of [editorToken, managerToken, operationsToken]) {
        assert.equal((await request('/api/collections/events', {
            token,
            method: 'POST',
            body: { data: { title: 'Rodaje', type: 'production', date: '2026-08-06', status: 'programado' } }
        })).status, 201);
        assert.equal((await request('/api/collections/events/event-production-1', {
            token,
            method: 'PATCH',
            body: { data: { status: 'publicado' } }
        })).status, 200);
    }

    // El viewer sigue solo mirando: no crea ni mueve eventos.
    assert.equal((await request('/api/collections/events', {
        token: viewerToken,
        method: 'POST',
        body: { data: { title: 'Rodaje', type: 'production', date: '2026-08-06' } }
    })).status, 403);
    assert.equal((await request('/api/collections/events/event-production-1', {
        token: viewerToken,
        method: 'PATCH',
        body: { data: { status: 'publicado' } }
    })).status, 403);
});

test('users collection is readable but scoped to the caller without view_users', async () => {
    const own = await request('/api/collections/users', { token: managerToken });
    assert.equal(own.status, 200);
    assert.deepEqual(own.payload.records.map((record) => record.id), ['manager']);
    assert.equal(own.payload.records[0].role, 'manager');

    const all = await request('/api/collections/users', { token: operationsToken });
    assert.equal(all.status, 200);
    assert.ok(all.payload.records.length > 1);

    assert.equal((await request('/api/collections/users/manager', { token: managerToken })).status, 200);
    assert.equal((await request('/api/collections/users/viewer', { token: managerToken })).status, 403);
    assert.equal((await request('/api/collections/users')).status, 401);
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
        token: operationsToken,
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
        token: operationsToken,
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

test('chat groups derive members and enforce manager and superadmin rules', async () => {
    const initial = await request('/api/chat-groups', { token: managerToken });
    assert.equal(initial.status, 200);
    assert.deepEqual(
        initial.payload?.groups?.find((group) => group.clientId === 'client-1')?.memberIds,
        ['viewer']
    );

    assert.equal((await request('/api/chat-groups/client-1/members', {
        token: viewerToken,
        method: 'PUT',
        body: { memberIds: ['viewer'] }
    })).status, 403);

    assert.equal((await request('/api/chat-groups/client-1/members', {
        token: managerToken,
        method: 'PUT',
        body: { memberIds: ['viewer', 'manager'] }
    })).status, 200);

    const managerLeaves = await request('/api/chat-groups/client-1/members', {
        token: managerToken,
        method: 'PUT',
        body: { memberIds: ['viewer'] }
    });
    assert.equal(managerLeaves.status, 403);
    assert.equal(managerLeaves.payload?.error?.code, 'chat-groups/manager-cannot-leave');

    assert.equal((await request('/api/chat-groups/client-1/members', {
        token: superAdminToken,
        method: 'PUT',
        body: { memberIds: ['viewer', 'manager', 'super-admin'] }
    })).status, 200);
    assert.equal((await request('/api/chat-groups/client-1/members', {
        token: superAdminToken,
        method: 'PUT',
        body: { memberIds: ['viewer', 'manager'] }
    })).status, 200);

    assert.equal((await request('/api/chat-groups/client-1/members', {
        token: managerToken,
        method: 'PUT',
        body: { memberIds: ['manager'] }
    })).status, 200);
    assert.equal(
        (await request('/api/collections/client_chats', { token: viewerToken })).status,
        403
    );
    const removedMemberSend = await request('/api/collections/client_chats', {
        token: viewerToken,
        method: 'POST',
        body: { data: { clientId: 'client-1', text: 'No permitido' } }
    });
    assert.equal(removedMemberSend.status, 403);
    assert.equal(removedMemberSend.payload?.error?.code, 'auth/insufficient-permission');

    const archivedAdminSend = await request('/api/collections/client_chats', {
        token: superAdminToken,
        method: 'POST',
        body: { data: { clientId: 'client-1', text: 'Tampoco permitido' } }
    });
    assert.equal(archivedAdminSend.status, 403);
    assert.equal((await request('/api/collections/client_chats', {
        token: managerToken,
        method: 'POST',
        body: { data: { clientId: 'client-1', text: 'Mensaje del integrante' } }
    })).status, 201);
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

    await createRecord({
        collectionName: 'management_tasks',
        recordId: 'notification-task',
        payload: {
            title: 'Prueba',
            comments: [{
                authorId: 'manager',
                mentionedIds: ['operations'],
                text: 'Mensaje'
            }]
        }
    });

    assert.equal((await request('/api/notifications/send', {
        token: managerToken,
        method: 'POST',
        body: {
            to: 'operations@example.test',
            type: 'mention',
            taskTitle: 'Prueba',
            taskType: 'managementTask',
            taskId: 'notification-task',
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
    assert.ok(response.payload?.data?.some((item) => item.email === 'viewer@example.test'));
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
