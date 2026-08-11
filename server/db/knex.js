import fs from 'node:fs';
import path from 'node:path';
import knex from 'knex';
import { env } from '../config/env.js';

if (env.databaseClient === 'sqlite3') {
    fs.mkdirSync(path.dirname(env.sqliteFilename), { recursive: true });
    const seedFilename = path.resolve(env.rootDir, 'server/db/seed/clusterag.sqlite');
    if (
        env.sqliteSeedOnEmpty
        && fs.existsSync(seedFilename)
        && !fs.existsSync(env.sqliteFilename)
    ) {
        fs.copyFileSync(seedFilename, env.sqliteFilename);
    }
}

// Los tiempos de espera importan en serverless: si Neon tarda en despertar o el
// pooler esta saturado, el default de knex (acquireConnectionTimeout 60s) deja
// la peticion colgada hasta que Vercel mata la funcion con
// FUNCTION_INVOCATION_TIMEOUT (504). Un 504 no lleva cuerpo JSON, asi que el
// cliente no puede distinguirlo de "no hay datos" y dibuja la app vacia. Con
// 8s falla dentro del limite de la funcion y devuelve un error de verdad.
const CONNECTION_TIMEOUT_MS = 8000;

const config = env.databaseClient === 'pg'
    ? {
        client: 'pg',
        connection: {
            connectionString: env.databaseUrl,
            connectionTimeoutMillis: CONNECTION_TIMEOUT_MS
        },
        acquireConnectionTimeout: CONNECTION_TIMEOUT_MS,
        pool: {
            min: 0,
            max: 2,
            acquireTimeoutMillis: CONNECTION_TIMEOUT_MS
        }
    }
    : {
        client: 'sqlite3',
        connection: {
            filename: env.sqliteFilename
        },
        useNullAsDefault: true
    };

export const db = knex(config);
