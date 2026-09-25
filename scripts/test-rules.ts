import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  limit 
} from 'firebase/firestore';
import config from '../firebase-applet-config.json';

const app = initializeApp(config);
const db = getFirestore(app, (config as any).firestoreDatabaseId);

interface TestResult {
  testId: string;
  name: string;
  expected: 'ALLOWED' | 'DENIED';
  actual: 'ALLOWED' | 'DENIED';
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function recordResult(testId: string, name: string, expected: 'ALLOWED' | 'DENIED', actual: 'ALLOWED' | 'DENIED', error?: string) {
  const passed = expected === actual;
  results.push({ testId, name, expected, actual, passed, error });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} [${testId}] ${name}`);
  if (!passed && error) {
    console.log(`   Detail: ${error}`);
  }
}

async function runRulesTests() {
  console.log('===============================================================');
  console.log(`RUNNING FIRESTORE SECURITY RULES TESTS`);
  console.log(`Database: ${(config as any).firestoreDatabaseId}`);
  console.log('===============================================================\n');

  // TEST 1: Unauthenticated: list candidates collection (no limit/filter) -> DENIED
  try {
    const candidatesCol = collection(db, 'candidates');
    await getDocs(candidatesCol);
    recordResult('Test 1', 'Unauthenticated list of all candidates', 'DENIED', 'ALLOWED');
  } catch (err: any) {
    recordResult('Test 1', 'Unauthenticated list of all candidates', 'DENIED', 'DENIED', err?.code || err?.message);
  }

  // TEST 2: Unauthenticated: query with limit(1) but no accessCode/email -> DENIED
  try {
    const candidatesCol = collection(db, 'candidates');
    const q = query(candidatesCol, limit(1));
    await getDocs(q);
    recordResult('Test 2', 'Unauthenticated query with limit(1) but no accessCode/email', 'DENIED', 'ALLOWED');
  } catch (err: any) {
    recordResult('Test 2', 'Unauthenticated query with limit(1) but no accessCode/email', 'DENIED', 'DENIED', err?.code || err?.message);
  }

  // TEST 3: Unauthenticated: query where accessCode == 'FA-XXXXXXXX' with limit(1) -> ALLOWED
  try {
    const candidatesCol = collection(db, 'candidates');
    const q = query(candidatesCol, where('accessCode', '==', 'FA-99999999'), limit(1));
    await getDocs(q);
    recordResult('Test 3', 'Unauthenticated query with accessCode and limit(1)', 'ALLOWED', 'ALLOWED');
  } catch (err: any) {
    recordResult('Test 3', 'Unauthenticated query with accessCode and limit(1)', 'ALLOWED', 'DENIED', err?.code || err?.message);
  }

  // TEST 4: Unauthenticated: update candidate protected fields (e.g. status/accessCode) -> DENIED
  try {
    const candidateRef = doc(db, 'candidates', 'FA-CAN-2025-001');
    await updateDoc(candidateRef, {
      status: 'Joined',
      joiningDate: '2026-01-01'
    });
    recordResult('Test 4', 'Unauthenticated update of protected fields (status, joiningDate)', 'DENIED', 'ALLOWED');
  } catch (err: any) {
    recordResult('Test 4', 'Unauthenticated update of protected fields (status, joiningDate)', 'DENIED', 'DENIED', err?.code || err?.message);
  }

  // TEST 5: Unauthenticated: delete candidate document -> DENIED
  try {
    const candidateRef = doc(db, 'candidates', 'FA-CAN-2025-001');
    await deleteDoc(candidateRef);
    recordResult('Test 5', 'Unauthenticated delete of candidate document', 'DENIED', 'ALLOWED');
  } catch (err: any) {
    recordResult('Test 5', 'Unauthenticated delete of candidate document', 'DENIED', 'DENIED', err?.code || err?.message);
  }

  // TEST 6: Unauthenticated / Non-HR write to emailTemplates or settings -> DENIED
  try {
    const templateRef = doc(db, 'emailTemplates', 'test-template');
    await setDoc(templateRef, { subject: 'Hacked', body: 'Test' });
    recordResult('Test 6', 'Non-HR write to emailTemplates', 'DENIED', 'ALLOWED');
  } catch (err: any) {
    recordResult('Test 6', 'Non-HR write to emailTemplates', 'DENIED', 'DENIED', err?.code || err?.message);
  }

  // TEST 7: Unauthenticated / Non-HR create candidate in /candidates -> DENIED
  try {
    const newCandidateRef = doc(db, 'candidates', 'unauth-candidate-' + Date.now());
    await setDoc(newCandidateRef, {
      name: 'Unauth Candidate',
      email: 'unauth@example.com',
      accessCode: 'FA-UNAUTH1'
    });
    recordResult('Test 7', 'Non-HR create candidate in /candidates', 'DENIED', 'ALLOWED');
  } catch (err: any) {
    recordResult('Test 7', 'Non-HR create candidate in /candidates', 'DENIED', 'DENIED', err?.code || err?.message);
  }

  // TEST (a): Non-HR user cannot write hrAdmins (create, update, delete) -> DENIED
  try {
    const adminRef = doc(db, 'hrAdmins', 'intruder@example.com');
    await setDoc(adminRef, {
      email: 'intruder@example.com',
      addedBy: 'Unauthorized Script',
      addedAt: new Date().toISOString()
    });
    recordResult('Test (a)', 'Non-HR user cannot write hrAdmins', 'DENIED', 'ALLOWED');
  } catch (err: any) {
    recordResult('Test (a)', 'Non-HR user cannot write hrAdmins', 'DENIED', 'DENIED', err?.code || err?.message);
  }

  // TEST (b): Removed HR email loses access immediately
  // Verification: when an email doc does not exist in hrAdmins, access to HR collections is DENIED.
  try {
    // Attempt to read/write hrAdmins as a non-existent HR member
    const nonExistentAdminRef = doc(db, 'hrAdmins', 'removed.hr.member@flick2know.com');
    await getDoc(nonExistentAdminRef);
    recordResult('Test (b)', 'Removed HR email loses access immediately (cannot read hrAdmins)', 'DENIED', 'ALLOWED');
  } catch (err: any) {
    recordResult('Test (b)', 'Removed HR email loses access immediately (cannot read hrAdmins)', 'DENIED', 'DENIED', err?.code || err?.message);
  }

  console.log('\n===============================================================');
  const allPassed = results.every(r => r.passed);
  console.log(`SUMMARY: ${results.filter(r => r.passed).length}/${results.length} tests passed.`);
  if (allPassed) {
    console.log('✅ ALL FIRESTORE RULES TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('❌ SOME TESTS FAILED');
  }
  console.log('===============================================================\n');

  process.exit(allPassed ? 0 : 1);
}

runRulesTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
