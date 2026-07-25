import { Router } from 'express';
import { asyncHandler, createHttpError } from '../lib/http.js';
import { hasPermission } from '../lib/permissions.js';
import { requireAuthenticatedUser } from '../lib/sessions.js';
import { listRecords } from '../lib/records.js';
import { normalizeEmail } from '../lib/text.js';

const router = Router();

// Directorio minimo de personas para el chat interno: solo { id, name, email }.
// Accesible a cualquier usuario con permiso de chat, incluidos editores/viewers
// que NO pueden leer la coleccion completa de usuarios. Asi todos pueden
// mencionar a cualquiera del equipo.
router.get('/', asyncHandler(async (req, res) => {
    const userRecord = requireAuthenticatedUser(req);
    if (!hasPermission(userRecord, 'view_client_chat')) {
        throw createHttpError(403, 'No tienes permisos para el chat.', 'auth/insufficient-permission');
    }

    const [users, managers, editors] = await Promise.all([
        listRecords({ collectionName: 'users' }),
        listRecords({ collectionName: 'managers' }),
        listRecords({ collectionName: 'editors' })
    ]);

    const seenEmail = new Set();
    const seenId = new Set();
    const people = [];
    const add = (record) => {
        if (record?.isActive === false) return;
        const email = normalizeEmail(record?.email);
        const id = record?.id ? String(record.id) : '';
        const name = record?.name || email || '';
        if (!name && !email) return;
        if (email) {
            if (seenEmail.has(email)) return;
            seenEmail.add(email);
        } else if (id) {
            if (seenId.has(id)) return;
            seenId.add(id);
        } else {
            return;
        }
        people.push({ id: id || email, name, email });
    };

    users.forEach(add);
    managers.forEach(add);
    editors.forEach(add);
    people.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    res.json({ people });
}));

export default router;
