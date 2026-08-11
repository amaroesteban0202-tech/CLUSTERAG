import assert from 'node:assert/strict';
import test from 'node:test';
import { verifyFirebaseIdTokenWithIdentityToolkit } from './firebase-admin.js';

test('Identity Toolkit convierte un ID token valido en claims compatibles', async () => {
    let request = null;
    const decoded = await verifyFirebaseIdTokenWithIdentityToolkit('firebase-token', {
        apiKey: 'public-web-key',
        fetchImpl: async (url, options) => {
            request = { url, options };
            return {
                ok: true,
                json: async () => ({
                    users: [{
                        localId: 'firebase-isabel',
                        email: 'pintofernandezisabel@gmail.com',
                        emailVerified: true,
                        displayName: 'Isabel',
                        providerUserInfo: [{ providerId: 'password' }]
                    }]
                })
            };
        }
    });

    assert.match(request.url, /^https:\/\/identitytoolkit\.googleapis\.com\/v1\/accounts:lookup\?key=/);
    assert.equal(request.options.method, 'POST');
    assert.deepEqual(JSON.parse(request.options.body), { idToken: 'firebase-token' });
    assert.deepEqual(decoded, {
        uid: 'firebase-isabel',
        sub: 'firebase-isabel',
        email: 'pintofernandezisabel@gmail.com',
        name: 'Isabel',
        email_verified: true,
        firebase: { sign_in_provider: 'password' }
    });
});

test('Identity Toolkit nunca acepta un token rechazado por Firebase', async () => {
    await assert.rejects(
        verifyFirebaseIdTokenWithIdentityToolkit('invalid-token', {
            apiKey: 'public-web-key',
            fetchImpl: async () => ({
                ok: false,
                json: async () => ({ error: { message: 'INVALID_ID_TOKEN' } })
            })
        }),
        (error) => error.code === 'auth/invalid-id-token'
    );
});

test('Identity Toolkit exige una cuenta Firebase completa', async () => {
    await assert.rejects(
        verifyFirebaseIdTokenWithIdentityToolkit('token-without-user', {
            apiKey: 'public-web-key',
            fetchImpl: async () => ({
                ok: true,
                json: async () => ({ users: [] })
            })
        }),
        (error) => error.code === 'auth/invalid-id-token'
    );
});
