# ClusterAG sin Firebase

Este repo ahora incluye una base de backend propia para sacar autenticacion y datos de Firebase sin reescribir toda la UI de una sola vez.

## Stack

- Frontend estatico actual
- Backend Express en `server/`
- Persistencia SQL con `sqlite3` por defecto y `mysql2` para despliegue
- Sesiones por cookie HTTP-only
- Magic links por SMTP
- Capa cliente compatible con los imports actuales de Firebase

## Arranque local

1. Copia `.env.example` a `.env`
2. Ejecuta `npm install`
3. Ejecuta `npm run dev`
4. Abre `http://127.0.0.1:3000`

Si no configuras SMTP, los magic links se imprimen en consola para desarrollo.

## Variables clave

- `DATABASE_CLIENT=sqlite3` para local rapido
- `DATABASE_CLIENT=mysql2` para MySQL en hosting propio
- `APP_BASE_URL` debe apuntar a la URL real del backend
- `SESSION_SECRET` debe cambiarse antes de produccion
- `SMTP_*` habilita envio real de magic links
- `GOOGLE_*` habilita login con Google

## Arquitectura

- `server/routes/auth.js`: sesiones, magic links, Google OAuth y custom tokens
- `server/routes/collections.js`: CRUD generico para las colecciones actuales
- `src/app/lib/firebase-*-compat.js`: reemplazo local del SDK de Firebase
- `src/app/config/firebase.js`: ahora apunta al backend propio

## Estado de migracion

- Firebase sale del runtime del frontend
- El modelo de datos actual sigue funcionando como colecciones genericas
- La siguiente fase recomendable es mover la auditoria y las reconciliaciones del frontend al backend
