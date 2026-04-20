import fs from 'node:fs';
import path from 'node:path';
import knex from 'knex';
import { env } from '../config/env.js';

if (env.databaseClient === 'sqlite3') {
    fs.mkdirSync(path.dirname(env.sqliteFilename), { recursive: true });
}

const config = env.databaseClient === 'mysql2'
    ? {
        client: 'mysql2',
        connection: {
            host: env.mysql.host,
            port: env.mysql.port,
            database: env.mysql.database,
            user: env.mysql.user,
            password: env.mysql.password
        },
        pool: {
            min: 0,
            max: 10
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
