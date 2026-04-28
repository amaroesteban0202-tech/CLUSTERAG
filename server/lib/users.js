import { env } from '../config/env.js';
import { findFirstRecordByAuthUid, findFirstRecordByEmail, upsertRecord } from './records.js';
import { nowIso } from './time.js';
import { normalizeEmail, normalizeNameKey, slugifyKey } from './text.js';
import { resolveBootstrapRole } from './bootstrap.js';

const rolePriority = {
    super_admin: 500,
    operations: 400,
    management: 350,
    manager: 300,
    editor: 250,
    viewer: 100
};

const chooseHighestRole = (left = 'viewer', right = 'viewer') => (
    (rolePriority[right] || 0) > (rolePriority[left] || 0) ? right : left
);

const buildVerificationState = ({ provider = 'password', verified = false, requestedAt = nowIso() } = {}) => {
    if (verified) {
        return {
            status: 'verified',
            source: provider,
            verifiedAt: requestedAt,
            lastError: ''
        };
    }

    return {
        status: 'pending',
        source: provider,
        requestedAt,
        lastError: ''
    };
};

export const ensureAuthUserRecord = async ({
    email,
    name = '',
    provider = 'password',
    authUid = '',
    verified = false
}) => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return null;

    const existingByAuthUid = authUid
        ? await findFirstRecordByAuthUid({ collectionName: 'users', authUid })
        : null;
    const existingByEmail = await findFirstRecordByEmail({ collectionName: 'users', email: normalizedEmail });
    const existing = existingByAuthUid || existingByEmail;
    const bootstrap = resolveBootstrapRole(normalizedEmail);
    const role = chooseHighestRole(existing?.role || 'viewer', bootstrap.role);
    const managementMember = env.seedManagementTeam.find((item) => normalizeEmail(item.email) === normalizedEmail);
    const nextName = existing?.name || name || managementMember?.name || normalizedEmail.split('@')[0];
    const stamp = nowIso();

    const record = await upsertRecord({
        collectionName: 'users',
        recordId: existing?.id || `auth_${slugifyKey(authUid || normalizedEmail) || 'user'}`,
        merge: true,
        payload: {
            name: nextName,
            email: normalizedEmail,
            role,
            isActive: existing?.isActive !== false,
            seeded: existing?.seeded === true,
            authUid: authUid || existing?.authUid || '',
            emailVerified: verified || existing?.emailVerified === true,
            emailVerification: verified
                ? {
                    ...(existing?.emailVerification || {}),
                    status: 'verified',
                    source: provider,
                    verifiedAt: existing?.emailVerification?.verifiedAt || stamp,
                    lastError: ''
                }
                : (existing?.emailVerification || buildVerificationState({ provider, verified: false, requestedAt: stamp })),
            managementKey: role === 'management'
                ? (existing?.managementKey || bootstrap.managementKey || normalizeNameKey(managementMember?.name || nextName))
                : (existing?.managementKey || ''),
            linkedManagerId: existing?.linkedManagerId || '',
            linkedEditorId: existing?.linkedEditorId || '',
            createdAt: existing?.createdAt || stamp,
            updatedAt: stamp,
            lastSeenAt: stamp
        }
    });

    return record;
};
