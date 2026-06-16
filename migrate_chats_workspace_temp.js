const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const keyPath = path.join(__dirname, 'firebase-service-account.json');
if (!fs.existsSync(keyPath)) {
  console.error('Service account key not found at:', keyPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function run() {
  console.log('Fetching chats to migrate...');
  const chatsSnapshot = await db.collection('chats').get();
  
  for (const doc of chatsSnapshot.docs) {
    const chatData = doc.data();
    console.log(`Migrating chat ${doc.id}: Setting workspace to "DY@Software"`);
    await doc.ref.update({
      workspace: 'DY@Software',
    });
  }
  console.log('Migration complete!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
