const PROJECT_ID = 'cluster-41f73';
const APP_ID = 'cluster-agency-pro-mobile-v6';
const BASE_PATH = `artifacts/${APP_ID}/public/data`;
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const TARGET_USER = {
    name: 'Andrea Chamorro',
    email: 'achchamorro25@gmail.com',
    color: 'c3',
    userId: 'auth_5GbMQ3jwOVSXtefnMWRoi9bFplK2'
};

const nowIso = () => new Date().toISOString();
const toStringField = (value = '') => ({ stringValue: String(value ?? '') });
const toBooleanField = (value) => ({ booleanValue: Boolean(value) });
const toMapField = (fields = {}) => ({ mapValue: { fields } });
const getDocumentId = (documentName = '') => String(documentName || '').split('/').pop();

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function createDocument(collectionName, fields, docId = null) {
    let url = `${FIRESTORE_BASE}/${BASE_PATH}/${collectionName}`;
    if (docId) url += `?documentId=${docId}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
    });
    if (!res.ok) {
        const text = await res.text();
        // If it already exists, maybe we can ignore it if we are sure? 409 Conflict
        if (res.status === 409) {
            console.log(`Document ${docId} already exists in ${collectionName}`);
            return { name: `${BASE_PATH}/${collectionName}/${docId}`, fields };
        }
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

async function ensureEditorProfile() {
    const stamp = nowIso();
    // Try creating it blindly with a specific ID based on email
    const editorId = 'editor_andrea_c';
    return await createDocument('editors', {
        name: toStringField(TARGET_USER.name),
        email: toStringField(TARGET_USER.email),
        color: toStringField(TARGET_USER.color),
        userId: toStringField(TARGET_USER.userId),
        createdAt: toStringField(stamp),
        updatedAt: toStringField(stamp)
    }, editorId);
}

async function main() {
    console.log(`Creando/Actualizando perfil de editor...`);
    const editorDoc = await ensureEditorProfile();
    const editorId = getDocumentId(editorDoc.name);
    console.log(`Editor listo: ${editorId}`);

    await delay(1000);

    const stamp = nowIso();
    const fieldsToUpdate = {
        role: toStringField('editor'),
        linkedEditorId: toStringField(editorId),
        isActive: toBooleanField(true),
        emailVerified: toBooleanField(true),
        emailVerification: toMapField({
            status: toStringField('verified'),
            source: toStringField('manual_fix'),
            verifiedAt: toStringField(stamp),
            lastError: toStringField('')
        }),
        updatedAt: toStringField(stamp)
    };

    console.log(`Actualizando usuario en Firestore: ${TARGET_USER.userId}`);
    const docName = `${BASE_PATH}/users/${TARGET_USER.userId}`;
    await updateDocumentFields(docName, fieldsToUpdate);
    console.log(`Usuario actualizado correctamente.`);
}

main().catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
});
