import { env } from '../config/env.js';
import { upsertRecord, findFirstRecordByEmail } from './records.js';
import { nowIso } from './time.js';
import { normalizeEmail, normalizeNameKey, slugifyKey } from './text.js';

const buildManagementRecordId = (name = '') => `management_${slugifyKey(name) || 'member'}`;

const getSeedManagementRole = (member = {}) => member.role || 'management';

const buildVerificationState = (verified = false) => verified
    ? {
        status: 'verified',
        source: 'seed',
        verifiedAt: nowIso(),
        lastError: ''
    }
    : {
        status: 'pending',
        source: 'seed',
        requestedAt: nowIso(),
        lastError: ''
    };

const valuesMatch = (existing = {}, desired = {}) => Object.entries(desired).every(
    ([key, value]) => JSON.stringify(existing?.[key]) === JSON.stringify(value)
);

const upsertBootstrapUser = async ({ existing, recordId, payload, stamp }) => {
    if (existing && valuesMatch(existing, payload)) return existing;
    return upsertRecord({
        collectionName: 'users',
        recordId: existing?.id || recordId,
        merge: true,
        payload: {
            ...payload,
            createdAt: existing?.createdAt || stamp,
            updatedAt: stamp
        }
    });
};

export const resolveBootstrapRole = (email = '') => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return { role: 'viewer', managementKey: '' };

    if (env.seedSuperAdminEmails.includes(normalizedEmail)) {
        return { role: 'super_admin', managementKey: '' };
    }

    const managementMember = env.seedManagementTeam.find((item) => normalizeEmail(item.email) === normalizedEmail);
    if (managementMember) {
        return { role: getSeedManagementRole(managementMember), managementKey: normalizeNameKey(managementMember.name) };
    }

    const editorMember = env.seedEditorsTeam.find((item) => normalizeEmail(item.email) === normalizedEmail);
    if (editorMember) {
        return { role: 'editor', managementKey: '' };
    }

    return { role: 'viewer', managementKey: '' };
};

export const ensureBootstrapData = async () => {
    const stamp = nowIso();

    for (const member of env.seedManagementTeam) {
        const email = normalizeEmail(member.email);
        const managementKey = normalizeNameKey(member.name);
        const existing = await findFirstRecordByEmail({ collectionName: 'users', email });
        const role = env.seedSuperAdminEmails.includes(email)
            ? 'super_admin'
            : getSeedManagementRole(member);
        await upsertBootstrapUser({
            existing,
            recordId: buildManagementRecordId(member.name),
            stamp,
            payload: {
                name: member.name,
                email,
                role,
                managementKey,
                isActive: true,
                seeded: true,
                lastSeenAt: existing?.lastSeenAt || '',
                linkedManagerId: existing?.linkedManagerId || '',
                linkedEditorId: existing?.linkedEditorId || '',
                emailVerified: existing?.emailVerified === true,
                emailVerification: existing?.emailVerification || buildVerificationState(false)
            }
        });
    }

    for (const email of env.seedSuperAdminEmails) {
        const normalizedEmail = normalizeEmail(email);
        if (!normalizedEmail) continue;
        const existing = await findFirstRecordByEmail({ collectionName: 'users', email: normalizedEmail });
        await upsertBootstrapUser({
            existing,
            recordId: `seed_${slugifyKey(normalizedEmail)}`,
            stamp,
            payload: {
                name: existing?.name || normalizedEmail.split('@')[0],
                email: normalizedEmail,
                role: 'super_admin',
                isActive: true,
                seeded: true,
                lastSeenAt: existing?.lastSeenAt || '',
                linkedManagerId: existing?.linkedManagerId || '',
                linkedEditorId: existing?.linkedEditorId || '',
                managementKey: existing?.managementKey || '',
                emailVerified: existing?.emailVerified === true,
                emailVerification: existing?.emailVerification || buildVerificationState(false)
            }
        });
    }
};
