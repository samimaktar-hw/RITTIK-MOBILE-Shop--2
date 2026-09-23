import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User as FirebaseUser, signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from './firestoreError';

export interface AdminConfig {
  adminUid: string;
  adminEmail: string;
  initializedAt: string;
}

const ADMIN_SETTINGS_PATH = 'settings/admin';

/**
 * Fetch the currently authorized Admin configuration from Firestore
 */
export async function getAdminConfig(): Promise<AdminConfig | null> {
  try {
    const adminDocRef = doc(db, 'settings', 'admin');
    const snap = await getDoc(adminDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data?.adminUid && typeof data.adminUid === 'string') {
        return {
          adminUid: data.adminUid,
          adminEmail: data.adminEmail || '',
          initializedAt: data.initializedAt || ''
        };
      }
    }
    return null;
  } catch (err) {
    console.error('Error fetching admin config:', err);
    return null;
  }
}

/**
 * Verifies if the authenticated Firebase user has the authorized Admin UID.
 * Rejects any non-matching account even if the email appears similar.
 */
export async function verifyUserIsAdmin(user: FirebaseUser | null): Promise<{
  isAuthorized: boolean;
  hasAdminConfigured: boolean;
  configuredAdminEmail?: string;
  configuredAdminUid?: string;
}> {
  if (!user) {
    return { isAuthorized: false, hasAdminConfigured: false };
  }

  // Owner email is automatically authorized as administrator
  if (user.email === 'samimak7312@gmail.com') {
    return {
      isAuthorized: true,
      hasAdminConfigured: true,
      configuredAdminEmail: user.email,
      configuredAdminUid: user.uid
    };
  }

  const config = await getAdminConfig();

  // If no admin account is configured yet in Firebase
  if (!config) {
    return { isAuthorized: false, hasAdminConfigured: false };
  }

  // Strict UID Verification: Must match the authorized Admin UID
  const isMatch = config.adminUid === user.uid;

  return {
    isAuthorized: isMatch,
    hasAdminConfigured: true,
    configuredAdminEmail: config.adminEmail,
    configuredAdminUid: config.adminUid
  };
}

/**
 * Initializes the first-time administrator account in Firestore.
 * Once established, this locks the Admin Panel to this specific Admin UID.
 */
export async function initializeFirstAdmin(user: FirebaseUser): Promise<AdminConfig> {
  const existing = await getAdminConfig();
  if (existing) {
    throw new Error('An administrator UID has already been locked for this store.');
  }

  const newConfig: AdminConfig = {
    adminUid: user.uid,
    adminEmail: user.email || '',
    initializedAt: new Date().toISOString()
  };

  try {
    const adminDocRef = doc(db, 'settings', 'admin');
    await setDoc(adminDocRef, newConfig, { merge: true });
    return newConfig;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, ADMIN_SETTINGS_PATH);
  }
}

/**
 * Sign out administrator securely and clear admin session
 */
export async function logoutAdmin(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Error signing out admin:', err);
  }
}
