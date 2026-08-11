import { db } from '../db/knex.js';

const localLocks = new Set();

export const withCronLock = async (name, callback) => {
    const lockName = `clusterag:${String(name || 'job')}`;
    if (db.client.config.client !== 'pg') {
        if (localLocks.has(lockName)) return { skipped: true, reason: 'already-running' };
        localLocks.add(lockName);
        try {
            return await callback();
        } finally {
            localLocks.delete(lockName);
        }
    }

    const connection = await db.client.acquireConnection();
    let acquired = false;
    try {
        const result = await db
            .raw('SELECT pg_try_advisory_lock(hashtext(?)) AS locked', [lockName])
            .connection(connection);
        acquired = result?.rows?.[0]?.locked === true;
        if (!acquired) return { skipped: true, reason: 'already-running' };
        return await callback();
    } finally {
        if (acquired) {
            await db
                .raw('SELECT pg_advisory_unlock(hashtext(?))', [lockName])
                .connection(connection);
        }
        await db.client.releaseConnection(connection);
    }
};
