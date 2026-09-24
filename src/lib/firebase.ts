import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  deleteDoc,
  query,
  where,
  limit
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider,
  User 
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import { Candidate, EmailTemplateDoc, LinksSettingsDoc } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore Database (using custom database ID if specified in config)
const customDbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = customDbId && customDbId !== '(default)'
  ? getFirestore(app, customDbId)
  : getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
export { signInWithPopup, signOut, onAuthStateChanged, type User };

// Initialize Firebase Storage
export const storage = getStorage(app);

/**
 * Uploads a document file to Firebase Storage under candidate folder.
 * Returns the public download URL, or falls back to base64 DataURL if storage is unavailable.
 */
export async function uploadDocumentToFirebaseStorage(
  candidateId: string,
  docType: string,
  file: File
): Promise<{ url: string; fileName: string }> {
  const sanitizeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `candidates/${candidateId}/${docType}_${Date.now()}_${sanitizeName}`;
  const storageRef = ref(storage, storagePath);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return { url: downloadUrl, fileName: file.name };
  } catch (err) {
    console.warn('Firebase Storage upload failed or restricted, using secure fallback:', err);
    // Fallback to reading file as Data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({ url: reader.result as string, fileName: file.name });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Recursively removes undefined values from an object or array so Firestore setDoc does not throw
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as any;
  }
  return data;
}

/**
 * Save or update full candidate record in Firestore
 */
export async function saveCandidateToFirestore(candidate: Candidate): Promise<void> {
  try {
    const candidateRef = doc(db, 'candidates', candidate.id);
    const sanitizedCandidate = sanitizeForFirestore({
      ...candidate,
      updatedAt: new Date().toISOString()
    });
    await setDoc(candidateRef, sanitizedCandidate, { merge: true });
  } catch (err) {
    console.error('Error saving candidate to Firestore:', err);
    throw err;
  }
}

/**
 * Direct lookup in Firestore collection candidates by accessCode or email
 * Handles trimming and case-insensitive matching
 */
export async function lookupCandidateInFirestore(queryStr: string): Promise<Candidate | null> {
  const rawQ = (queryStr || '').trim();
  if (!rawQ) return null;

  // 1. Direct getDoc if the input matches candidate document ID
  try {
    const docRef = doc(db, 'candidates', rawQ);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Candidate;
    }
  } catch {
    // Ignore and proceed to accessCode query
  }

  // 2. Query by accessCode with limit(1) (supports exact, uppercase, or lowercase codes)
  const candidateCollection = collection(db, 'candidates');
  const codesToTry = Array.from(new Set([rawQ.toUpperCase(), rawQ, rawQ.toLowerCase()]));

  for (const code of codesToTry) {
    try {
      const q = query(candidateCollection, where('accessCode', '==', code), limit(1));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs[0].data() as Candidate;
      }
    } catch {
      // Continue trying alternatives
    }
  }

  // 3. Query by registered email with limit(1)
  try {
    const qEmail = query(candidateCollection, where('email', '==', rawQ.toLowerCase()), limit(1));
    const snap = await getDocs(qEmail);
    if (!snap.empty) {
      return snap.docs[0].data() as Candidate;
    }
  } catch {
    // Fallback
  }

  return null;
}

/**
 * Fetch all candidates from Firestore
 */
export async function fetchCandidatesFromFirestore(): Promise<Candidate[] | null> {
  try {
    const querySnapshot = await getDocs(collection(db, 'candidates'));
    if (querySnapshot.empty) return null;
    const candidates: Candidate[] = [];
    querySnapshot.forEach(docSnap => {
      candidates.push(docSnap.data() as Candidate);
    });
    return candidates;
  } catch (err) {
    console.error('Error fetching candidates from Firestore:', err);
    return null;
  }
}

/**
 * Delete a candidate document from Firestore
 */
export async function deleteCandidateFromFirestore(candidateId: string): Promise<void> {
  try {
    const candidateRef = doc(db, 'candidates', candidateId);
    await deleteDoc(candidateRef);
  } catch (err) {
    console.error('Error deleting candidate from Firestore:', err);
  }
}

/**
 * Fetch links dictionary from settings/links in Firestore
 */
export async function fetchLinksFromFirestore(): Promise<LinksSettingsDoc | null> {
  try {
    const linkDocRef = doc(db, 'settings', 'links');
    const snap = await getDoc(linkDocRef);
    if (snap.exists()) {
      return snap.data() as LinksSettingsDoc;
    }
    return null;
  } catch (err) {
    console.error('Error fetching settings/links from Firestore:', err);
    return null;
  }
}

/**
 * Save links dictionary to settings/links in Firestore
 */
export async function saveLinksToFirestore(links: LinksSettingsDoc): Promise<void> {
  try {
    const linkDocRef = doc(db, 'settings', 'links');
    await setDoc(linkDocRef, links, { merge: true });
  } catch (err) {
    console.error('Error saving settings/links to Firestore:', err);
    throw err;
  }
}

/**
 * Fetch all email templates from emailTemplates collection in Firestore
 */
export async function fetchEmailTemplatesFromFirestore(): Promise<Record<string, EmailTemplateDoc> | null> {
  try {
    const snap = await getDocs(collection(db, 'emailTemplates'));
    if (snap.empty) return null;
    const result: Record<string, EmailTemplateDoc> = {};
    snap.forEach(docSnap => {
      const data = docSnap.data() as EmailTemplateDoc;
      result[docSnap.id] = { ...data, id: docSnap.id };
    });
    return result;
  } catch (err) {
    console.error('Error fetching emailTemplates from Firestore:', err);
    return null;
  }
}

/**
 * Save single email template to emailTemplates collection in Firestore
 */
export async function saveEmailTemplateToFirestore(stageKey: string, template: EmailTemplateDoc): Promise<void> {
  try {
    const templateRef = doc(db, 'emailTemplates', stageKey);
    await setDoc(templateRef, {
      ...template,
      id: stageKey,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error(`Error saving email template ${stageKey} to Firestore:`, err);
    throw err;
  }
}

