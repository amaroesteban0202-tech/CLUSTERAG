import { Router } from 'express';
import { asyncHandler, createHttpError } from '../lib/http.js';
import {
    buildChatGroups,
    canManageChatGroups,
    getChatGroupChangeError
} from '../lib/chat-groups.js';
import { getRecord, listRecords, upsertRecord } from '../lib/records.js';
import { hasPermission } from '../lib/permissions.js';
import { requireAuthenticatedUser } from '../lib/sessions.js';
import { nowIso } from '../lib/time.js';

const router = Router();

const loadChatGroupContext = async () => {
    const [clients, messages, membershipRecords, users, managers, editors] = await Promise.all([
        listRecords({ collectionName: 'clients' }),
        listRecords({ collectionName: 'client_chats' }),
        listRecords({ collectionName: 'chat_group_memberships' }),
        listRecords({ collectionName: 'users' }),
        listRecords({ collectionName: 'managers' }),
        listRecords({ collectionName: 'editors' })
    ]);
    return {
        clients,
        messages,
        membershipRecords,
        users,
        managers,
        editors,
        ...buildChatGroups({ clients, messages, membershipRecords, users, managers, editors })
    };
};

const requireChatAccess = (userRecord) => {
    if (!hasPermission(userRecord, 'view_client_chat')) {
        throw createHttpError(403, 'No tienes permisos para el chat.', 'auth/insufficient-permission');
    }
};

router.get('/', asyncHandler(async (req, res) => {
    const userRecord = requireAuthenticatedUser(req);
    requireChatAccess(userRecord);
    const context = await loadChatGroupContext();
    const currentUserId = context.resolvePersonId({
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name
    });
    res.json({
        people: context.people,
        groups: context.groups,
        currentUserId,
        canManage: canManageChatGroups(userRecord),
        canLeave: userRecord.role === 'super_admin'
    });
}));

router.put('/:clientId/members', asyncHandler(async (req, res) => {
    const userRecord = requireAuthenticatedUser(req);
    const clientId = String(req.params.clientId || '').trim();
    if (!canManageChatGroups(userRecord)) {
        throw createHttpError(403, 'Solo managers y superadmins pueden administrar integrantes.', 'chat-groups/manage-forbidden');
    }
    if (!clientId || !(await getRecord({ collectionName: 'clients', recordId: clientId }))) {
        throw createHttpError(404, 'El grupo no existe.', 'chat-groups/not-found');
    }

    const context = await loadChatGroupContext();
    const group = context.groups.find((item) => item.clientId === clientId);
    const requestedIds = [...new Set(
        (Array.isArray(req.body?.memberIds) ? req.body.memberIds : [])
            .map((value) => String(value || '').trim())
            .filter(Boolean)
    )];
    const knownIds = new Set(context.people.map((person) => String(person.id)));
    const unknownIds = requestedIds.filter((id) => !knownIds.has(id));
    if (unknownIds.length > 0) {
        throw createHttpError(400, 'Hay integrantes que ya no pertenecen al directorio.', 'chat-groups/unknown-member');
    }

    const actorId = context.resolvePersonId({
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name
    });
    const changeError = getChatGroupChangeError({
        actorRole: userRecord.role,
        actorId,
        currentMemberIds: group?.memberIds || [],
        nextMemberIds: requestedIds
    });
    if (changeError === 'manager-cannot-leave') {
        throw createHttpError(403, 'Los managers no pueden salir por si mismos del grupo.', 'chat-groups/manager-cannot-leave');
    }

    const stamp = nowIso();
    const record = await upsertRecord({
        collectionName: 'chat_group_memberships',
        recordId: clientId,
        payload: {
            clientId,
            memberIds: requestedIds,
            managed: true,
            updatedAt: stamp,
            updatedById: actorId || userRecord.id,
            updatedByName: userRecord.name || userRecord.email || 'Usuario'
        },
        merge: true
    });

    res.json({
        group: {
            clientId,
            memberIds: record.memberIds || [],
            source: 'managed',
            updatedAt: record.updatedAt || stamp
        }
    });
}));

export default router;
