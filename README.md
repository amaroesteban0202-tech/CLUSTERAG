# ClusterAG

Aplicacion web y movil con frontend React, API Express y persistencia SQL. PostgreSQL es la base de produccion; SQLite se conserva para desarrollo local y pruebas. Firebase se usa solo para autenticacion por enlace/correo y notificaciones push, nunca como base de datos de la aplicacion.

## Arranque local

1. Copia `.env.example` a `.env` y completa los valores locales.
2. Ejecuta `npm install`.
3. Ejecuta `npm run dev`.
4. Abre `http://127.0.0.1:3000`.

La base local se crea en `.tmp/clusterag.sqlite`. El proyecto no copia ni restaura automaticamente una base semilla.

## Configuracion de produccion

- Define `DATABASE_CLIENT=pg` y una `DATABASE_URL` de PostgreSQL.
- Usa valores aleatorios de al menos 32 caracteres para `SESSION_SECRET` y `CRON_SECRET`. El servidor rechaza el arranque inseguro en produccion.
- Configura `APP_BASE_URL` y `GOOGLE_CALLBACK_URL` con el dominio real.
- Declara los usuarios iniciales mediante `SEED_SUPER_ADMIN_EMAILS`, `SEED_MANAGEMENT_TEAM_JSON` y `SEED_EDITOR_TEAM_JSON`; no hay identidades privilegiadas dentro del codigo.
- Ejecuta el bootstrap solo de forma deliberada con `RUN_BOOTSTRAP_ON_START=true`. En Vercel permanece desactivado por defecto.
- Completa `FIREBASE_*` para autenticacion por correo y push, y `SMTP_*` para reportes/notificaciones por email.

El acceso es por invitacion: una identidad de Google o Firebase que no exista previamente en `users` ni en la configuracion de bootstrap es rechazada.

## Comandos

- `npm test`: pruebas del backend y controles de seguridad.
- `npm run build`: genera CSS, bundle JavaScript y el directorio `public/`.
- `npm run check:design`: valida invariantes visuales y dependencias del frontend.
- `npm run check:kpi`: valida calculos KPI y ranking.
- `npm run check:polling`: valida la sincronizacion adaptativa.
- `npm run db:cleanup:dry-run`: calcula la limpieza segura del historial sin modificar datos.

La limpieza real del historial exige `--apply --backup-confirmed`. No se debe ejecutar contra produccion sin una copia verificada.

## Arquitectura

- `server/routes/auth.js`: OAuth, intercambio nativo de un solo uso y sesiones opacas revocables.
- `server/routes/collections.js`: autorizacion, validacion, integridad referencial y mutaciones SQL.
- `server/lib/audit.js`: auditoria inmutable generada por el servidor.
- `server/db/migrate.js`: migraciones versionadas y serializadas en PostgreSQL.
- `src/app/lib/firebase-*-compat.js`: adaptadores del frontend hacia la API y Firebase Auth.
- `src/app/main.jsx`: interfaz principal; las reparaciones automaticas de datos estan desactivadas.

Firestore y Firebase Hosting no exponen datos: las reglas deniegan todo y el backend sirve unicamente `public/`.
