import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';
import config from '../firebase-applet-config.json';
import { INITIAL_CANDIDATES } from '../src/services/mockData';

const app = initializeApp(config);
const db = getFirestore(app, (config as any).firestoreDatabaseId);

async function runMigration() {
  console.log('--- STARTING CANDIDATE MIGRATION TO CLOUD FIRESTORE ---');
  console.log(`Target Database ID: ${(config as any).firestoreDatabaseId}`);
  console.log(`Found ${INITIAL_CANDIDATES.length} candidates in INITIAL_CANDIDATES.`);

  const candidatesCol = collection(db, 'candidates');

  for (const candidate of INITIAL_CANDIDATES) {
    const candidateDocRef = doc(candidatesCol, candidate.id);
    await setDoc(candidateDocRef, {
      ...candidate,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`Migrated: ${candidate.name.padEnd(20)} | ID: ${candidate.id.padEnd(18)} | Code: ${candidate.accessCode}`);
  }

  console.log('--- VERIFYING FIRESTORE CONTENTS ---');
  const snapshot = await getDocs(candidatesCol);
  console.log(`Total documents in Firestore candidates collection: ${snapshot.size}`);

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    console.log(`[Firestore Record] ID: ${docSnap.id} | Code: ${data.accessCode} | Name: ${data.name} | Email: ${data.email}`);
  });

  console.log('--- MIGRATION COMPLETED SUCCESSFULLY ---');
  process.exit(0);
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
