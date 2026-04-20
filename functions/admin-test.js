const admin = require('firebase-admin');

try {
    admin.initializeApp({
        projectId: 'cluster-41f73'
    });
} catch (e) {
    console.error("Failed to init admin:", e);
    process.exit(1);
}

const db = admin.firestore();
const appId = 'cluster-agency-pro-mobile-v6';

async function main() {
    try {
        const snapshot = await db.collection(`artifacts/${appId}/public/data/users`).limit(1).get();
        if (snapshot.empty) {
            console.log("No users found");
        } else {
            console.log("Successfully read a user: ", snapshot.docs[0].id);
        }
    } catch (error) {
        console.log("ERROR_MESSAGE: " + error.message);
        console.log("ERROR_CODE: " + error.code);
    }
}

main();
