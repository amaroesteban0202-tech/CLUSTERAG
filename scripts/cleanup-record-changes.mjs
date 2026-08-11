import { db } from '../server/db/knex.js';

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const backupConfirmed = args.has('--backup-confirmed');
const daysArg = process.argv.find((value) => value.startsWith('--days='));
const retentionDays = Math.max(7, Number(daysArg?.split('=')[1]) || 30);
const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
const batchSize = 5_000;

const main = async () => {
    const [{ count: total }] = await db('record_changes').count({ count: '*' });
    const [{ count: older }] = await db('record_changes')
        .where('changed_at', '<', cutoff)
        .count({ count: '*' });

    console.log(JSON.stringify({
        mode: apply ? 'apply' : 'dry-run',
        retentionDays,
        cutoff,
        totalChanges: Number(total),
        changesOlderThanCutoff: Number(older)
    }, null, 2));

    if (!apply) {
        console.log('No se modifico la base. Usa --apply --backup-confirmed despues de verificar un respaldo.');
        return;
    }
    if (!backupConfirmed) {
        throw new Error('Se requiere --backup-confirmed para modificar record_changes.');
    }

    const client = db.client.config.client;
    if (client === 'pg') {
        await db.raw(`
            CREATE INDEX CONCURRENTLY IF NOT EXISTS record_changes_record_cursor_idx
            ON record_changes (collection_name, record_id, id)
        `);
    } else {
        await db.raw(`
            CREATE INDEX IF NOT EXISTS record_changes_record_cursor_idx
            ON record_changes (collection_name, record_id, id)
        `);
    }

    let deleted = 0;
    while (true) {
        const rows = await db('record_changes as current')
            .select('current.id')
            .where('current.changed_at', '<', cutoff)
            .whereExists(function newerChangeExists() {
                this.select(db.raw('1'))
                    .from('record_changes as newer')
                    .whereRaw('newer.collection_name = current.collection_name')
                    .whereRaw('newer.record_id = current.record_id')
                    .whereRaw('newer.id > current.id');
            })
            .orderBy('current.id', 'asc')
            .limit(batchSize);
        if (rows.length === 0) break;
        await db('record_changes').whereIn('id', rows.map((row) => row.id)).delete();
        deleted += rows.length;
        console.log(`Cambios redundantes eliminados: ${deleted}`);
    }

    const now = new Date().toISOString();
    const expiredSessions = await db('auth_sessions').where('expires_at', '<', now).delete();
    const expiredOauthStates = await db('auth_oauth_states').where('expires_at', '<', now).delete();
    console.log(JSON.stringify({ deleted, expiredSessions, expiredOauthStates }, null, 2));
};

try {
    await main();
} finally {
    await db.destroy();
}
