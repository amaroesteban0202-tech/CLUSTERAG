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

const config = env.databaseClient === 'pg'
    ? {
        client: 'pg',
        connection: env.databaseUrl,
        pool: {
            min: 0,
            max: 2
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
