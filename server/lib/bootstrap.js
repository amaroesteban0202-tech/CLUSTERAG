import { env } from '../config/env.js';
import { upsertRecord, findFirstRecordByEmail } from './records.js';
import { nowIso } from './time.js';
import { normalizeEmail, normalizeNameKey, slugifyKey } from './text.js';

const buildManagementRecordId = (name = '') => `management_${slugifyKey(name) || 'member'}`;

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

export const resolveBootstrapRole = (email = '') => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return { role: 'viewer', managementKey: '' };

    if (env.seedSuperAdminEmails.includes(normalizedEmail)) {
        return { role: 'super_admin', managementKey: '' };
    }

    const managementMember = env.seedManagementTeam.find((item) => normalizeEmail(item.email) === normalizedEmail);
    if (managementMember) {
        return { role: managementMember.role || 'management', managementKey: normalizeNameKey(managementMember.name) };
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
        await upsertRecord({
            collectionName: 'users',
            recordId: existing?.id || buildManagementRecordId(member.name),
            merge: true,
            payload: {
                name: member.name,
                email,
                role: member.role || 'management',
                managementKey,
                isActive: true,
                seeded: true,
                lastSeenAt: existing?.lastSeenAt || '',
                linkedManagerId: existing?.linkedManagerId || '',
                linkedEditorId: existing?.linkedEditorId || '',
                emailVerified: existing?.emailVerified === true,
                emailVerification: existing?.emailVerification || buildVerificationState(false),
                createdAt: existing?.createdAt || stamp,
                updatedAt: stamp
            }
        });
    }

    for (const email of env.seedSuperAdminEmails) {
        const normalizedEmail = normalizeEmail(email);
        if (!normalizedEmail) continue;
        const existing = await findFirstRecordByEmail({ collectionName: 'users', email: normalizedEmail });
        await upsertRecord({
            collectionName: 'users',
            recordId: existing?.id || `seed_${slugifyKey(normalizedEmail)}`,
            merge: true,
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
                emailVerification: existing?.emailVerification || buildVerificationState(false),
                createdAt: existing?.createdAt || stamp,
                updatedAt: stamp
            }
        });
    }
};
