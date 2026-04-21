import { hydrateLegacyFirestoreData } from '../server/lib/legacy-firestore.js';
import { db } from '../server/db/knex.js';

try {
    const result = await hydrateLegacyFirestoreData({ force: true });
    console.log(JSON.stringify(result, null, 2));
} catch (error) {
    console.error(error);
    process.exitCode = 1;
} finally {
    await db.destroy();
}
