import { normalizeEmail } from './text.js';

const normalizeName = (value = '') => String(value || '')
    .trim()
    .toLocaleLowerCase('es');

const uniqueStrings = (values = []) => [...new Set(
    (Array.isArray(values) ? values : [])
        .map((value) => String(value || '').trim())
        .filter(Boolean)
)];

export const canManageChatGroups = (userRecord) => (
    userRecord?.isActive !== false
    && ['manager', 'super_admin'].includes(String(userRecord?.role || ''))
);

export const buildChatDirectory = ({ users = [], managers = [], editors = [] } = {}) => {
    const sourceRecords = [...users, ...managers, ...editors];
    const people = [];
    const personByEmail = new Map();
    const personById = new Map();

    sourceRecords.forEach((record) => {
        if (record?.isActive === false) return;
        const recordId = String(record?.id || '').trim();
        const email = normalizeEmail(record?.email);
        const name = String(record?.name || email || '').trim();
        const canReceiveCallsOutsideGroups = canManageChatGroups(record);
        if (!recordId && !email) return;

        let person = record?.userId
            ? personById.get(String(record.userId))
            : null;
        if (!person && email) person = personByEmail.get(email);
        if (!person) {
            const id = recordId || email;
            person = {
                id,
                name: name || email,
                email,
                canReceiveCallsOutsideGroups
            };
            people.push(person);
            if (email) personByEmail.set(email, person);
        }
        if (canReceiveCallsOutsideGroups) person.canReceiveCallsOutsideGroups = true;
        if (recordId) personById.set(recordId, person);
        if (record?.linkedManagerId) personById.set(String(record.linkedManagerId), person);
        if (record?.linkedEditorId) personById.set(String(record.linkedEditorId), person);
    });

    const peopleByName = new Map();
    people.forEach((person) => {
        const nameKey = normalizeName(person.name);
        if (!nameKey) return;
        const matches = peopleByName.get(nameKey) || [];
        matches.push(person);
        peopleByName.set(nameKey, matches);
    });

    const resolvePersonId = ({ id = '', email = '', name = '' } = {}) => {
        const idKey = String(id || '').trim();
        if (idKey && personById.has(idKey)) return personById.get(idKey).id;
        const emailKey = normalizeEmail(email);
        if (emailKey && personByEmail.has(emailKey)) return personByEmail.get(emailKey).id;
        const nameMatches = peopleByName.get(normalizeName(name)) || [];
        return nameMatches.length === 1 ? nameMatches[0].id : '';
    };

    people.sort((left, right) => (left.name || '').localeCompare(right.name || '', 'es', {
        sensitivity: 'base'
    }));

    return { people, resolvePersonId };
};

export const buildChatGroups = ({
    clients = [],
    messages = [],
    membershipRecords = [],
    users = [],
    managers = [],
    editors = []
} = {}) => {
    const directory = buildChatDirectory({ users, managers, editors });
    const clientIds = new Set(clients.map((client) => String(client?.id || '')).filter(Boolean));
    const derivedByClient = new Map();
    const addDerivedMember = (clientId, memberId) => {
        if (!clientId || !memberId) return;
        if (!derivedByClient.has(clientId)) derivedByClient.set(clientId, new Set());
        derivedByClient.get(clientId).add(memberId);
    };

    // El manager asignado al cliente es relevante aun cuando todavia no haya
    // escrito. El resto de integrantes se descubre del historial real.
    clients.forEach((client) => {
        const clientId = String(client?.id || '').trim();
        const managerId = directory.resolvePersonId({ id: client?.managerId });
        addDerivedMember(clientId, managerId);
    });

    messages.forEach((message) => {
        const clientId = String(message?.clientId || '').trim();
        if (!clientId || (clientIds.size > 0 && !clientIds.has(clientId))) return;
        addDerivedMember(clientId, directory.resolvePersonId({
            id: message?.authorId,
            email: message?.authorEmail,
            name: message?.authorName
        }));
        uniqueStrings(message?.mentionedIds).forEach((mentionedId) => {
            addDerivedMember(clientId, directory.resolvePersonId({ id: mentionedId }));
        });
    });

    const explicitByClient = new Map();
    membershipRecords.forEach((record) => {
        const clientId = String(record?.clientId || record?.id || '').trim();
        if (!clientId) return;
        const current = explicitByClient.get(clientId);
        if (!current || String(record?.updatedAt || '') >= String(current?.updatedAt || '')) {
            explicitByClient.set(clientId, record);
        }
    });

    const groups = clients.map((client) => {
        const clientId = String(client?.id || '').trim();
        const explicit = explicitByClient.get(clientId);
        const memberIds = explicit
            ? uniqueStrings(explicit.memberIds)
                .map((id) => directory.resolvePersonId({ id }))
                .filter(Boolean)
            : [...(derivedByClient.get(clientId) || new Set())];
        return {
            clientId,
            memberIds: uniqueStrings(memberIds),
            source: explicit ? 'managed' : 'history',
            updatedAt: explicit?.updatedAt || ''
        };
    });

    return { ...directory, groups };
};

export const getChatGroupChangeError = ({
    actorRole = '',
    actorId = '',
    currentMemberIds = [],
    nextMemberIds = []
} = {}) => {
    if (!['manager', 'super_admin'].includes(String(actorRole || ''))) {
        return 'forbidden';
    }
    const normalizedActorId = String(actorId || '');
    const removesSelf = normalizedActorId
        && uniqueStrings(currentMemberIds).includes(normalizedActorId)
        && !uniqueStrings(nextMemberIds).includes(normalizedActorId);
    if (removesSelf && actorRole !== 'super_admin') return 'manager-cannot-leave';
    return '';
};
