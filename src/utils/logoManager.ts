import { useSyncExternalStore } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from './firestoreError';

const base = import.meta.env.BASE_URL || '/';
const normalizedBase = base.endsWith('/') ? base : `${base}/`;
export const DEFAULT_STORE_LOGO = `${normalizedBase}assets/logo.svg`;
const STORAGE_KEY = 'rittik_store_logo';

export function normalizeLogoUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return DEFAULT_STORE_LOGO;
  }
  const clean = url.trim();
  if (
    clean === '/assets/logo.svg' || 
    clean === '/assets/logo.png' || 
    clean === 'assets/logo.svg' || 
    clean === 'assets/logo.png' ||
    clean === './assets/logo.svg' ||
    clean === './assets/logo.png'
  ) {
    return DEFAULT_STORE_LOGO;
  }
  return clean;
}

export function getStoreLogo(): string {
  try {
    const custom = localStorage.getItem(STORAGE_KEY);
    if (custom && custom.trim().length > 0) {
      return normalizeLogoUrl(custom);
    }
  } catch {}
  return DEFAULT_STORE_LOGO;
}

let currentLogo: string = getStoreLogo();
const logoListeners = new Set<() => void>();
let isLogoSyncStarted = false;

function emitLogoChange() {
  logoListeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Logo listener error:', e);
    }
  });
}

export function setStoreLogo(url: string): void {
  const clean = url && url.trim().length > 0 ? url.trim() : DEFAULT_STORE_LOGO;
  currentLogo = clean;
  try {
    if (url && url.trim().length > 0) {
      localStorage.setItem(STORAGE_KEY, clean);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
  emitLogoChange();
}

function initLogoSyncOnce() {
  if (isLogoSyncStarted || typeof window === 'undefined') return;
  isLogoSyncStarted = true;

  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      currentLogo = getStoreLogo();
      emitLogoChange();
    }
  });

  try {
    const settingsDocRef = doc(db, 'settings', 'website');
    onSnapshot(settingsDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data?.logoUrl && typeof data.logoUrl === 'string' && data.logoUrl.trim().length > 0) {
          const remoteUrl = normalizeLogoUrl(data.logoUrl);
          if (currentLogo !== remoteUrl) {
            currentLogo = remoteUrl;
            try {
              localStorage.setItem(STORAGE_KEY, remoteUrl);
            } catch {}
            emitLogoChange();
          }
        }
      }
    }, (error) => {
      console.warn('Realtime logo listener note:', error?.message);
    });
  } catch (err) {
    console.warn('Failed to attach logo listener:', err);
  }
}

function subscribeLogo(callback: () => void) {
  initLogoSyncOnce();
  logoListeners.add(callback);
  return () => {
    logoListeners.delete(callback);
  };
}

function getLogoSnapshot() {
  return currentLogo;
}

/**
 * Persist website logo to Firestore so all visitors and customer devices sync automatically.
 */
export async function saveStoreLogoToFirestore(url: string): Promise<void> {
  const targetUrl = url.trim();
  const settingsDocRef = doc(db, 'settings', 'website');
  
  try {
    await setDoc(settingsDocRef, {
      logoUrl: targetUrl,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    setStoreLogo(targetUrl);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/website');
  }
}

/**
 * Hook to retrieve and react to the store logo in real-time,
 * combining local caching for instant render with Firestore real-time synchronization.
 */
export function useStoreLogo(): [string, (newUrl: string) => Promise<void>] {
  const logo = useSyncExternalStore(subscribeLogo, getLogoSnapshot, () => DEFAULT_STORE_LOGO);

  const updateLogo = async (newUrl: string) => {
    await saveStoreLogoToFirestore(newUrl);
  };

  return [logo, updateLogo];
}
