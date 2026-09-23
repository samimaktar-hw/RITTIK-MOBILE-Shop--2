import { useSyncExternalStore } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { StoreSettings } from '../types';
import { DEFAULT_STORE_LOGO } from './logoManager';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  logoUrl: DEFAULT_STORE_LOGO,
  shopName: 'Rittik Mobile Shop',
  shopDescription: 'Your certified destination for premium pre-owned and new smartphones. Complete with 32-point inspection, 6 months store warranty, and instant Cash on Delivery.',
  homeTitle: 'Certified Pre-Owned & New Smartphones',
  homeSubtitle: '100% Quality Inspected • 6 Months Store Warranty • Instant Cash on Delivery',
  announcement: '🔥 FESTIVE SALE: Extra ₹1,500 off on Trade-in Exchange + Free 6-Month Store Warranty!',
  phone: '+91 98300 12345',
  email: 'contact@rittikmobileshop.com',
  whatsapp: '+919830012345',
  address: 'Main Market Road, Sector 5, Salt Lake, Kolkata, West Bengal - 700091',
  openingHours: '10:00 AM',
  closingHours: '09:00 PM',
  workingDays: 'Monday – Sunday (7 Days Open)',
  latitude: 22.5855,
  longitude: 88.4312,
  googleMapsUrl: 'https://www.google.com/maps?q=22.5855,88.4312',
  deliverySettings: 'Free Express Doorstep Delivery within 24-48 Hours across West Bengal. Counter pickup available.',
  services: 'Certified Pre-Owned Phones, 32-Point Hardware Inspection, On-Spot Cash Trade-In, 6-Month Store Warranty'
};

const STORAGE_KEY = 'rittik_store_settings';

export function getLocalStoreSettings(): StoreSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_STORE_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {}
  return DEFAULT_STORE_SETTINGS;
}

// Module-level singleton state & subscriber registry
let currentStoreSettings: StoreSettings = getLocalStoreSettings();
const storeListeners = new Set<() => void>();
let isSyncStarted = false;

function emitChange() {
  storeListeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Store listener error:', e);
    }
  });
}

export function setLocalStoreSettings(settings: StoreSettings): void {
  currentStoreSettings = settings;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
  emitChange();
}

function initSyncOnce() {
  if (isSyncStarted || typeof window === 'undefined') return;
  isSyncStarted = true;

  // Listen to storage events from other tabs
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      currentStoreSettings = getLocalStoreSettings();
      emitChange();
    }
  });

  // 1. Single shared listener to settings/website
  try {
    const ref = doc(db, 'settings', 'website');
    onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Partial<StoreSettings>;
        currentStoreSettings = { ...currentStoreSettings, ...data };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(currentStoreSettings));
        } catch {}
        emitChange();
      }
    }, (err) => {
      console.warn('Realtime store settings listener:', err?.message);
    });
  } catch (err) {
    console.warn('Failed to attach website settings listener:', err);
  }

  // 2. Single shared listener to primary shopSettings/location
  try {
    const locRef = doc(db, 'shopSettings', 'location');
    onSnapshot(locRef, (snap) => {
      if (snap.exists()) {
        const locData = snap.data() as { latitude?: number; longitude?: number };
        if (locData.latitude !== undefined && locData.longitude !== undefined) {
          if (
            currentStoreSettings.latitude === locData.latitude &&
            currentStoreSettings.longitude === locData.longitude
          ) {
            return;
          }
          currentStoreSettings = {
            ...currentStoreSettings,
            latitude: locData.latitude,
            longitude: locData.longitude,
            googleMapsUrl: `https://www.google.com/maps?q=${locData.latitude},${locData.longitude}`
          };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentStoreSettings));
          } catch {}
          emitChange();
        }
      }
    }, (err) => {
      console.warn('Realtime shop location listener:', err?.message);
    });
  } catch (err) {
    console.warn('Failed to attach shop location listener:', err);
  }
}

function subscribe(callback: () => void) {
  initSyncOnce();
  storeListeners.add(callback);
  return () => {
    storeListeners.delete(callback);
  };
}

function getSnapshot() {
  return currentStoreSettings;
}

/**
 * Save GPS location coordinates to Firebase under shopSettings/location
 * and sync with settings/website.
 */
export async function saveShopLocationToFirebase(latitude: number, longitude: number, accuracy?: number): Promise<void> {
  const current = getLocalStoreSettings();
  const updatedAt = new Date().toISOString();
  
  const merged: StoreSettings = {
    ...current,
    latitude,
    longitude,
    googleMapsUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
    updatedAt
  };

  setLocalStoreSettings(merged);

  try {
    // 1. Primary storage under shopSettings/location as specified
    const locationRef = doc(db, 'shopSettings', 'location');
    await setDoc(locationRef, {
      latitude,
      longitude,
      accuracy: accuracy || null,
      updatedAt
    }, { merge: true });

    // 2. Also sync to settings/website
    const websiteRef = doc(db, 'settings', 'website');
    await setDoc(websiteRef, {
      latitude,
      longitude,
      googleMapsUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
      updatedAt
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore shop location write error:', err);
  }
}

export async function saveStoreSettingsToFirestore(updated: Partial<StoreSettings>): Promise<void> {
  const current = getLocalStoreSettings();
  const merged: StoreSettings = {
    ...current,
    ...updated,
    updatedAt: new Date().toISOString()
  };

  setLocalStoreSettings(merged);

  try {
    const ref = doc(db, 'settings', 'website');
    await setDoc(ref, merged, { merge: true });

    if (updated.latitude !== undefined && updated.longitude !== undefined) {
      const locationRef = doc(db, 'shopSettings', 'location');
      await setDoc(locationRef, {
        latitude: updated.latitude,
        longitude: updated.longitude,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (err) {
    console.warn('Firestore store settings write note:', err);
  }
}

export function useStoreSettings(): [StoreSettings, (newSettings: Partial<StoreSettings>) => Promise<void>] {
  const settings = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_STORE_SETTINGS);

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    await saveStoreSettingsToFirestore(newSettings);
  };

  return [settings, updateSettings];
}

