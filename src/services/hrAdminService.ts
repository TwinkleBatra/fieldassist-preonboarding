import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db, auth, signOut } from '../lib/firebase';
import { User } from 'firebase/auth';

export const OWNER_EMAIL = 'twinkle.verma@fieldassist.com';
export const OWNER_EMAILS = ['twinkle.verma@fieldassist.com', 'twinkle.verma@flick2know.com'];

export interface HRAdminDoc {
  email: string;
  addedBy: string;
  addedAt: string;
}

/**
 * Checks if a given email is the owner.
 */
export function isOwnerEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return OWNER_EMAILS.some(e => e.toLowerCase() === normalized);
}

/**
 * Validates whether an authenticated Firebase user has HR access.
 * Must use the same logic as firestore.rules:
 * User's email is verified AND (email equals owner email OR document exists in hrAdmins/{email.lower()}).
 */
export async function checkIsHRUser(user?: User | null): Promise<boolean> {
  if (!user || !user.email) return false;

  const normalizedEmail = user.email.trim().toLowerCase();

  // 1. Owner email is always approved
  if (isOwnerEmail(normalizedEmail)) {
    return true;
  }

  // 2. Check if document exists in hrAdmins collection
  try {
    const adminDocRef = doc(db, 'hrAdmins', normalizedEmail);
    const snap = await getDoc(adminDocRef);
    return snap.exists();
  } catch (err) {
    // If permission denied or error, user is not authorized
    return false;
  }
}

/**
 * Fetches all HR admins from the hrAdmins collection.
 * Ensures the owner is always included in the returned list.
 */
export async function fetchHRAdmins(): Promise<HRAdminDoc[]> {
  const admins: HRAdminDoc[] = [];
  try {
    const colRef = collection(db, 'hrAdmins');
    const snap = await getDocs(colRef);
    snap.forEach((d) => {
      const data = d.data() as Partial<HRAdminDoc>;
      admins.push({
        email: (data.email || d.id).toLowerCase(),
        addedBy: data.addedBy || 'HR Admin',
        addedAt: data.addedAt || new Date().toISOString()
      });
    });
  } catch (err) {
    console.warn('Error fetching hrAdmins collection:', err);
  }

  // Ensure owner is always present
  const hasOwner = admins.some(a => a.email.toLowerCase() === OWNER_EMAIL.toLowerCase());
  if (!hasOwner) {
    admins.unshift({
      email: OWNER_EMAIL.toLowerCase(),
      addedBy: 'System Owner',
      addedAt: new Date().toISOString()
    });
  }

  // Filter out any legacy owner record if accidentally present
  const filteredAdmins = admins.filter(a => a.email.toLowerCase() !== 'twinkle.verma@flick2know.com');

  // Sort: owner first, then alphabetically
  return filteredAdmins.sort((a, b) => {
    if (a.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) return -1;
    if (b.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) return 1;
    return a.email.localeCompare(b.email);
  });
}

/**
 * Seeds the owner record in hrAdmins if not already present.
 */
export async function seedOwnerHRAdmin(): Promise<void> {
  try {
    const ownerRef = doc(db, 'hrAdmins', OWNER_EMAIL.toLowerCase());
    const snap = await getDoc(ownerRef);
    if (!snap.exists()) {
      await setDoc(ownerRef, {
        email: OWNER_EMAIL.toLowerCase(),
        addedBy: 'System Owner',
        addedAt: new Date().toISOString()
      });
    }

    // Clean up legacy owner record in hrAdmins if present
    try {
      const legacyOwnerRef = doc(db, 'hrAdmins', 'twinkle.verma@flick2know.com');
      const legacySnap = await getDoc(legacyOwnerRef);
      if (legacySnap.exists()) {
        await deleteDoc(legacyOwnerRef);
      }
    } catch {
      // Ignore if not found or restricted
    }
  } catch (err) {
    // Ignore if not permitted or network issue
  }
}

/**
 * Adds a new HR admin email.
 * Validates format, blocks duplicates, lowercases email, and writes to Firestore.
 */
export async function addHRAdmin(email: string, addedByEmail: string): Promise<HRAdminDoc> {
  const cleanEmail = email.trim().toLowerCase();

  // Validate format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    throw new Error('Please enter a valid email address.');
  }

  if (cleanEmail === OWNER_EMAIL.toLowerCase()) {
    throw new Error(`${cleanEmail} is the system owner and already has HR access.`);
  }

  // Check duplicate
  const existingRef = doc(db, 'hrAdmins', cleanEmail);
  const existingSnap = await getDoc(existingRef);
  if (existingSnap.exists()) {
    throw new Error(`${cleanEmail} already has HR access.`);
  }

  const newAdmin: HRAdminDoc = {
    email: cleanEmail,
    addedBy: addedByEmail || 'HR Admin',
    addedAt: new Date().toISOString()
  };

  await setDoc(existingRef, newAdmin);
  return newAdmin;
}

/**
 * Removes an HR admin.
 * Protects owner email and prevents deleting owner.
 */
export async function removeHRAdmin(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail === OWNER_EMAIL.toLowerCase()) {
    throw new Error('The owner cannot be removed.');
  }

  const docRef = doc(db, 'hrAdmins', cleanEmail);
  await deleteDoc(docRef);
}
