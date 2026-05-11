# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # Start Express backend (port 3000)
npm run build          # Copy static assets from src/ to public/ for deployment
npm run mobile:sync    # Build and sync web assets to Capacitor (Android/iOS)
npm run mobile:android # Open Android Studio
npm run mobile:ios     # Open Xcode
```

There are no test or lint commands configured.

## Architecture

**ClusterAG** is an agency management OS (in Spanish). It's a full-stack app with a React frontend and Express/Node.js backend, currently in an active migration away from Firebase to a custom backend.

### Backend (`/server`)

Express app with Knex.js as query builder over SQLite (dev) or MySQL (prod).

- `server/index.js` — entry point
- `server/app.js` — Express factory, middleware wiring
- `server/config/env.js` — all environment variable parsing
- `server/config/bootstrap.js` — seed roles/teams on startup
- `server/routes/auth.js` — magic links, Google OAuth, session management
- `server/routes/collections.js` — generic CRUD for all data collections
- `server/db/migrate.js` — schema (4 tables: `app_records`, `auth_sessions`, `auth_magic_links`, `auth_oauth_states`)
- `server/lib/` — sessions, permissions, CRUD helpers, email, crypto utilities
- `server/constants/permissions.js` — role definitions and per-collection ACLs

**Data model**: All application data is stored in a single `app_records` table as JSON blobs, keyed by collection name (like Firestore). Collections: `clients`, `managers`, `editors`, `events`, `account_tasks`, `editing`, `management_tasks`, `users`, `audit_logs`.

**Auth flow**: Firebase ID token or magic link token → validated by backend → exchanged for a signed HTTP-only session cookie.

**Roles** (from `server/constants/permissions.js`): `super_admin`, `operations`, `management`, `manager`, `editor`, `viewer`.

### Frontend (`/src/app`)

React 18 loaded via ESM CDN — **no bundler, no build step for JS**. JSX is transpiled by Babel Standalone at runtime in the browser.

- `src/app/main.jsx` — monolithic React root containing all components (~290KB)
- `src/app/lib/firebase-auth-compat.js` — shim that maps Firebase Auth API calls to backend `/api/auth/*`
- `src/app/lib/firebase-firestore-compat.js` — shim that maps Firestore API calls to backend `/api/collections/*`
- `src/app/lib/backend-api.js` — `apiFetch()` wrapper used by all shims

**Key pattern**: The frontend imports Firebase SDK paths that are aliased (via import maps) to the local compatibility shims. This means existing UI code uses `firebase/auth` and `firebase/firestore` syntax, but all requests actually go to the Express backend. Real-time updates are simulated by polling every 4 seconds.

### Request Flow

```
React component (Firebase API syntax)
  → local shim (firebase-auth-compat / firebase-firestore-compat)
    → apiFetch() → Express backend
      → permission check → Knex CRUD on app_records
        → JSON response
```

### Environment

Copy `.env.example` to `.env`. Key variables:
- `DATABASE_CLIENT` — `sqlite3` (dev) or `mysql2` (prod)
- `SESSION_SECRET` — must change before production
- `APP_BASE_URL` — used for magic link callbacks and OAuth redirect
- SMTP vars for magic link emails (logs to console if not configured)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — for Google OAuth

A pre-populated SQLite seed file is included for quick dev startup.

### Mobile (Capacitor)

See `MOBILE.md` for full setup. The web app is wrapped with Capacitor 8 for Android/iOS. After any frontend changes: `npm run mobile:sync` → then build in Android Studio / Xcode.
