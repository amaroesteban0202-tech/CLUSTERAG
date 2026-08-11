// Auditoria de solo lectura de la coleccion `users`. No escribe nada.
// Sirve para ver cuentas duplicadas o heredadas que tapan a la buena:
// findFirstRecordByEmail usa .first() sin ORDER BY, asi que con dos registros
// para el mismo correo el que gana es arbitrario.
//
// Uso: node scripts/audit-users.mjs [correo-a-filtrar]
import { db } from '../server/db/knex.js';

const filter = String(process.argv[2] || '').trim().toLowerCase();

const rows = await db('app_records')
    .where({ collection_name: 'users' })
    .select('record_id', 'email_index', 'auth_uid_index', 'role_index', 'is_active_index', 'payload_json', 'created_at', 'updated_at');

const users = rows.map((row) => {
    let payload = {};
    try {
        payload = JSON.parse(row.payload_json || '{}');
    } catch { /* payload corrupto: se reporta abajo */ }
    return {
        recordId: row.record_id,
        emailIndex: row.email_index || '',
        emailPayload: String(payload.email || '').toLowerCase(),
        role: String(payload.role || row.role_index || ''),
        roleIndex: row.role_index || '',
        authUid: row.auth_uid_index || '',
        isActive: payload.isActive !== false,
        seeded: payload.seeded === true,
        createdAt: payload.createdAt || row.created_at,
        updatedAt: payload.updatedAt || row.updated_at
    };
}).filter((user) => !filter || user.emailIndex === filter || user.emailPayload === filter);

const byEmail = new Map();
for (const user of users) {
    const key = user.emailIndex || user.emailPayload || '(sin correo)';
    if (!byEmail.has(key)) byEmail.set(key, []);
    byEmail.get(key).push(user);
}

const show = (user) => [
    `    recordId=${user.recordId}`,
    `rol=${user.role || '(vacio)'}`,
    `authUid=${user.authUid || '(vacio)'}`,
    `activo=${user.isActive}`,
    `seeded=${user.seeded}`,
    `creado=${user.createdAt}`
].join('  ');

const duplicated = [...byEmail.entries()].filter(([, list]) => list.length > 1);
console.log(`\n=== ${users.length} usuarios en ${byEmail.size} correos ===`);

if (duplicated.length > 0) {
    console.log(`\n--- ${duplicated.length} CORREOS DUPLICADOS (uno tapa al otro) ---`);
    for (const [email, list] of duplicated) {
        console.log(`\n  ${email}  (${list.length} registros)`);
        list.forEach((user) => console.log(show(user)));
    }
} else {
    console.log('\nSin correos duplicados.');
}

// email_index es lo que consulta el login; si no coincide con el correo del
// payload, el usuario existe pero el login nunca lo encuentra.
const desynced = users.filter((user) => user.emailPayload && user.emailIndex !== user.emailPayload);
if (desynced.length > 0) {
    console.log(`\n--- ${desynced.length} CON INDICE DESINCRONIZADO (el login no los encuentra) ---`);
    desynced.forEach((user) => console.log(`  ${user.emailPayload} != indice "${user.emailIndex}"\n${show(user)}`));
}

const roleCount = users.reduce((acc, user) => {
    const role = user.role || '(vacio)';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
}, {});
console.log('\n--- ROLES ---');
Object.entries(roleCount)
    .sort((left, right) => right[1] - left[1])
    .forEach(([role, count]) => console.log(`  ${role}: ${count}`));

console.log('\n--- VIEWERS ACTIVOS ---');
users
    .filter((user) => user.role === 'viewer' && user.isActive)
    .sort((left, right) => String(left.createdAt).localeCompare(String(right.createdAt)))
    .forEach((user) => console.log(`  ${user.emailIndex || user.emailPayload}${show(user)}`));

await db.destroy();
