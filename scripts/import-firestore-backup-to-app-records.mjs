import fs from 'node:fs/promises';
import path from 'node:path';
import { migrateDatabase } from '../server/db/migrate.js';
import { db } from '../server/db/knex.js';

const backupPath = process.argv[2] || '.tmp/firestore-backups/2026-06-23T23-59-44-076Z/firestore-backup.full.json';
const resolvedPath = path.resolve(backupPath);
const raw = await fs.readFile(resolvedPath, 'utf8');
const backup = JSON.parse(raw);

await migrateDatabase();

const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();
const getIndexes = (payload = {}) => ({
    email_index: normalizeEmail(payload.email),
    role_index: payload.role ? String(payload.role) : null,
    is_active_index: typeof payload.isActive === 'boolean' ? payload.isActive : null,
    auth_uid_index: payload.authUid ? String(payload.authUid) : null,
    management_key_index: payload.managementKey ? String(payload.managementKey) : null,
    date_index: payload.date ? String(payload.date).slice(0, 20) : null,
    status_index: payload.status ? String(payload.status) : null
});

const chunk = (items, size) => {
    const chunks = [];
    for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
    return chunks;
};

let imported = 0;
for (const [collectionName, collectionBackup] of Object.entries(backup.collections || {})) {
    const documents = Array.isArray(collectionBackup.documents) ? collectionBackup.documents : [];
    const rows = documents.map((document) => {
        const payload = { id: document.id, ...(document.data || {}) };
        return {
            collection_name: collectionName,
            record_id: document.id,
            payload_json: JSON.stringify(payload),
            created_at: payload.createdAt || document.createTime || new Date().toISOString(),
            updated_at: payload.updatedAt || document.updateTime || new Date().toISOString(),
            ...getIndexes(payload)
        };
    });

    for (const rowsChunk of chunk(rows, 250)) {
        if (rowsChunk.length === 0) continue;
        await db('app_records')
            .insert(rowsChunk)
            .onConflict(['collection_name', 'record_id'])
            .merge([
                'payload_json',
                'created_at',
                'updated_at',
                'email_index',
                'role_index',
                'is_active_index',
                'auth_uid_index',
                'management_key_index',
                'date_index',
                'status_index'
            ]);
        imported += rowsChunk.length;
    }

    console.log(`${collectionName}: ${documents.length}`);
}

console.log(`TOTAL: ${imported}`);
await db.destroy();
