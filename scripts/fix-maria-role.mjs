// Script para actualizar el rol de Maria Galicia a 'editor' via REST API de Firestore
const PROJECT_ID = 'cluster-41f73';
const APP_ID = 'cluster-agency-pro-mobile-v6';
const BASE_PATH = `artifacts/${APP_ID}/public/data`;
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const TARGET_EMAIL = 'marialaguna2117@gmail.com';

// Listar todos los usuarios y filtrar por email
async function findUserByEmail(email) {
    const url = `${FIRESTORE_BASE}/${BASE_PATH}/users?pageSize=500`;
    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error al listar usuarios: ${res.status} - ${text}`);
    }
    const data = await res.json();
    const docs = data.documents || [];
    return docs.find(doc => {
        const docEmail = doc.fields?.email?.stringValue || '';
        return docEmail.toLowerCase() === email.toLowerCase();
    }) || null;
}

// Listar editores
async function listEditors() {
    const url = `${FIRESTORE_BASE}/${BASE_PATH}/editors?pageSize=200`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.documents || [];
}

// Crear perfil de editor
async function createEditorProfile(name, email) {
    const url = `${FIRESTORE_BASE}/${BASE_PATH}/editors`;
    const now = new Date().toISOString();
    const body = {
        fields: {
            name: { stringValue: name },
            email: { stringValue: email },
            color: { stringValue: 'c22' },
            createdAt: { stringValue: now },
            updatedAt: { stringValue: now }
        }
    };
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error al crear editor: ${res.status} - ${text}`);
    }
    const data = await res.json();
    const docId = data.name.split('/').pop();
    return { id: docId };
}

// Actualizar campos del usuario (PATCH parcial)
async function updateUserFields(docName, fields) {
    const fieldPaths = Object.keys(fields).map(f => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join('&');
    const url = `${FIRESTORE_BASE}/${docName}?${fieldPaths}`;
    const now = new Date().toISOString();
    const allFields = { ...fields, updatedAt: { stringValue: now } };
    const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: allFields })
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error al actualizar: ${res.status} - ${text}`);
    }
    return await res.json();
}

async function main() {
    console.log(`\n🔍 Buscando usuario: ${TARGET_EMAIL}...\n`);

    const userDoc = await findUserByEmail(TARGET_EMAIL);
    if (!userDoc) {
        console.error(`❌ No se encontró ningún usuario con email: ${TARGET_EMAIL}`);
        process.exit(1);
    }

    const userId = userDoc.name.split('/').pop();
    const currentRole = userDoc.fields?.role?.stringValue || 'sin rol';
    const currentName = userDoc.fields?.name?.stringValue || 'Desconocido';
    const currentLinkedEditor = userDoc.fields?.linkedEditorId?.stringValue || '';

    console.log(`✅ Usuario encontrado:`);
    console.log(`   ID:            ${userId}`);
    console.log(`   Nombre:        ${currentName}`);
    console.log(`   Rol actual:    ${currentRole}`);
    console.log(`   linkedEditor:  ${currentLinkedEditor || '(ninguno)'}\n`);

    // Buscar perfil de editor existente
    console.log(`🔍 Buscando perfil de editor...`);
    const editors = await listEditors();
    let editorProfile = editors.find(e => {
        const editorEmail = (e.fields?.email?.stringValue || '').toLowerCase();
        const editorName = (e.fields?.name?.stringValue || '').toLowerCase();
        return editorEmail === TARGET_EMAIL.toLowerCase() ||
            editorName.includes('maria galicia') ||
            editorName.includes('maria laguna');
    });

    let editorId = '';
    if (editorProfile) {
        editorId = editorProfile.name.split('/').pop();
        const editorName = editorProfile.fields?.name?.stringValue || '';
        console.log(`✅ Perfil de editor encontrado: "${editorName}" (ID: ${editorId})\n`);
    } else {
        console.log(`⚠️  Sin perfil de editor. Creando "Maria Galicia"...`);
        const newEditor = await createEditorProfile('Maria Galicia', TARGET_EMAIL);
        editorId = newEditor.id;
        console.log(`✅ Perfil creado con ID: ${editorId}\n`);
    }

    // Actualizar rol y linkedEditorId
    if (currentRole === 'editor' && currentLinkedEditor === editorId) {
        console.log(`ℹ️  Ya tiene rol "editor" vinculado. Sin cambios necesarios.`);
    } else {
        console.log(`🔄 Actualizando usuario...`);
        await updateUserFields(userDoc.name, {
            role: { stringValue: 'editor' },
            linkedEditorId: { stringValue: editorId }
        });
        console.log(`\n✅ ¡Hecho! María Galicia actualizada:`);
        console.log(`   Rol:          editor`);
        console.log(`   linkedEditorId: ${editorId}`);
        console.log(`\n🎉 María ya puede acceder a la Sala de Edición y crear tareas.`);
    }
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
