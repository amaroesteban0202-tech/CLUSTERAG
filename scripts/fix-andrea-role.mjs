// Script para asegurar que Andrea Chamorro tenga acceso como editor en Firestore.
const PROJECT_ID = 'cluster-41f73';
const APP_ID = 'cluster-agency-pro-mobile-v6';
const BASE_PATH = `artifacts/${APP_ID}/public/data`;
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const TARGET_USER = {
    name: 'Andrea Chamorro',
    email: 'achchamorro25@gmail.com',
    color: 'c3'
};

const nowIso = () => new Date().toISOString();
const toStringField = (value = '') => ({ stringValue: String(value ?? '') });
const toBooleanField = (value) => ({ booleanValue: Boolean(value) });
const toMapField = (fields = {}) => ({ mapValue: { fields } });
const getDocumentId = (documentName = '') => String(documentName || '').split('/').pop();

async function runQuery(collectionName, fieldName, operator, value) {
    const url = `${FIRESTORE_BASE}/${BASE_PATH}:runQuery`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            structuredQuery: {
                from: [{ collectionId: collectionName }],
                where: {
                    fieldFilter: {
                        field: { fieldPath: fieldName },
                        op: operator,
                        value: value
                    }
                },
                limit: 1
            }
        })
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error en runQuery ${collectionName}: ${res.status} - ${text}`);
    }
    const data = await res.json();
    return data
        .map(item => item.document)
        .filter(Boolean);
}

async function createDocument(collectionName, fields) {
    const url = `${FIRESTORE_BASE}/${BASE_PATH}/${collectionName}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error al crear ${collectionName}: ${res.status} - ${text}`);
    }
    return await res.json();
}

async function updateDocumentFields(documentName, fields) {
    const fieldPaths = Object.keys(fields)
        .map((fieldName) => `updateMask.fieldPaths=${encodeURIComponent(fieldName)}`)
        .join('&');
    const url = `${FIRESTORE_BASE}/${documentName}?${fieldPaths}`;
    const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error al actualizar ${documentName}: ${res.status} - ${text}`);
    }
    return await res.json();
}

async function findUserByEmail(email) {
    const docs = await runQuery('users', 'email', 'EQUAL', toStringField(email));
    return docs[0] || null;
}

async function findEditorProfile() {
    const docs = await runQuery('editors', 'email', 'EQUAL', toStringField(TARGET_USER.email));
    return docs[0] || null;
}

async function ensureEditorProfile() {
    const existingEditor = await findEditorProfile();
    if (existingEditor) return existingEditor;

    const stamp = nowIso();
    return await createDocument('editors', {
        name: toStringField(TARGET_USER.name),
        email: toStringField(TARGET_USER.email),
        color: toStringField(TARGET_USER.color),
        userId: toStringField(''),
        createdAt: toStringField(stamp),
        updatedAt: toStringField(stamp)
    });
}

async function createUserRecord(editorId) {
    const stamp = nowIso();
    return await createDocument('users', {
        name: toStringField(TARGET_USER.name),
        email: toStringField(TARGET_USER.email),
        role: toStringField('editor'),
        isActive: toBooleanField(true),
        createdAt: toStringField(stamp),
        updatedAt: toStringField(stamp),
        lastSeenAt: toStringField(''),
        emailVerified: toBooleanField(false),
        emailVerification: toMapField({
            status: toStringField('pending'),
            source: toStringField('manual_seed'),
            requestedAt: toStringField(stamp),
            lastError: toStringField('')
        }),
        managementKey: toStringField(''),
        linkedManagerId: toStringField(''),
        linkedEditorId: toStringField(editorId)
    });
}

async function ensureUserRecord(editorId) {
    let existingUser = await findUserByEmail(TARGET_USER.email);
    
    if (!existingUser) {
        // Fallback check: check if it's stored with caps or something
        // Just let's check lowercase too just in case
        const docs = await runQuery('users', 'email', 'EQUAL', toStringField(TARGET_USER.email.toLowerCase()));
        existingUser = docs[0] || null;
    }

    if (!existingUser) {
        return await createUserRecord(editorId);
    }

    const currentRole = existingUser.fields?.role?.stringValue || '';
    const currentLinkedEditorId = existingUser.fields?.linkedEditorId?.stringValue || '';
    const currentName = existingUser.fields?.name?.stringValue || '';
    const currentActiveState = existingUser.fields?.isActive?.booleanValue;
    const stamp = nowIso();
    const fieldsToUpdate = {};

    if (currentRole !== 'editor') fieldsToUpdate.role = toStringField('editor');
    if (currentLinkedEditorId !== editorId) fieldsToUpdate.linkedEditorId = toStringField(editorId);
    if (currentName !== TARGET_USER.name) fieldsToUpdate.name = toStringField(TARGET_USER.name);
    if (currentActiveState !== true) fieldsToUpdate.isActive = toBooleanField(true);
    if (Object.keys(fieldsToUpdate).length > 0) {
        fieldsToUpdate.updatedAt = toStringField(stamp);
        await updateDocumentFields(existingUser.name, fieldsToUpdate);
    }

    return existingUser;
}

async function ensureEditorLink(editorDoc, userId) {
    const currentUserId = editorDoc.fields?.userId?.stringValue || '';
    if (currentUserId === userId) return editorDoc;

    await updateDocumentFields(editorDoc.name, {
        userId: toStringField(userId),
        updatedAt: toStringField(nowIso())
    });
    return {
        ...editorDoc,
        fields: {
            ...(editorDoc.fields || {}),
            userId: toStringField(userId)
        }
    };
}

async function main() {
    console.log(`Buscando o creando perfil de editor para ${TARGET_USER.email}...`);
    const editorDoc = await ensureEditorProfile();
    const editorId = getDocumentId(editorDoc.name);
    const editorName = editorDoc.fields?.name?.stringValue || TARGET_USER.name;
    console.log(`Perfil de editor listo: ${editorName} (${editorId})`);

    console.log(`Buscando o creando usuario...`);
    const userDoc = await ensureUserRecord(editorId);
    const userId = getDocumentId(userDoc.name);
    const userRole = userDoc.fields?.role?.stringValue || 'editor';
    console.log(`Usuario listo: ${TARGET_USER.email} (${userId}) con rol ${userRole}`);

    await ensureEditorLink(editorDoc, userId);

    console.log('');
    console.log('Estado final:');
    console.log(`- user.email: ${TARGET_USER.email}`);
    console.log(`- user.role: editor`);
    console.log(`- user.linkedEditorId: ${editorId}`);
    console.log(`- editor.userId: ${userId}`);
}

main().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
});
