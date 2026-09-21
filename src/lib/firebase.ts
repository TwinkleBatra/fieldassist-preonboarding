import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
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
 * Save or update full candidate record in Firestore
 */
export async function saveCandidateToFirestore(candidate: Candidate): Promise<void> {
  try {
    const candidateRef = doc(db, 'candidates', candidate.id);
    await setDoc(candidateRef, {
      ...candidate,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Error saving candidate to Firestore:', err);
  }
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

