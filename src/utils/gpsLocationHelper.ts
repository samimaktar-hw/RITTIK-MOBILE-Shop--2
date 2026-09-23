/**
 * Real Device GPS Location Helper
 * Uses browser Geolocation API: navigator.geolocation.getCurrentPosition()
 * with enableHighAccuracy: true, timeout: 15000, maximumAge: 0.
 *
 * Strictly adheres to real device coordinates:
 * - NO hardcoded coordinates
 * - NO fake/guess locations
 * - NO default mock coordinates
 * - NO manual Google Maps URLs
 */

export interface RealGpsResult {
  latitude: number;
  longitude: number;
  accuracy: number;
}

/**
 * Request real GPS position from browser/device Geolocation API
 */
export function getRealDeviceGpsPosition(): Promise<RealGpsResult> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Number(position.coords.latitude.toFixed(6));
        const longitude = Number(position.coords.longitude.toFixed(6));
        const accuracy = Math.round(position.coords.accuracy);
        resolve({ latitude, longitude, accuracy });
      },
      (error) => {
        if (error.code === 1) {
          // PERMISSION_DENIED
          reject(new Error('Location permission was denied.\nPlease allow location access and try again.'));
        } else if (error.code === 2) {
          // POSITION_UNAVAILABLE
          reject(new Error('Please turn on device location/GPS and try again.'));
        } else if (error.code === 3) {
          // TIMEOUT
          reject(new Error('Unable to detect your current location.\nPlease try again.'));
        } else {
          reject(new Error('Unable to detect your current location.\nPlease try again.'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Generate a dynamic Google Maps URL strictly from real latitude & longitude
 */
export function getGoogleMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export interface GeocodedAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
  displayName: string;
}

/**
 * Reverse geocode real coordinates to auto-assist customer address fields
 */
export async function reverseGeocodeRealCoords(latitude: number, longitude: number): Promise<GeocodedAddress | null> {
  // Method 1: Photon OSM (Open CORS, high reliability)
  try {
    const res = await fetch(`https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`, {
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) {
      const json = await res.json();
      const props = json.features?.[0]?.properties;
      if (props) {
        const streetParts = [props.street || props.name, props.district, props.locality].filter(Boolean);
        const street = streetParts.length > 0 ? streetParts.join(', ') : (props.name || '');
        const city = props.city || props.town || props.district || '';
        const state = props.state || '';
        const pincode = props.postcode || '';
        const displayName = [street, city, state, pincode].filter(Boolean).join(', ');
        return { street, city, state, pincode, displayName };
      }
    }
  } catch {}

  // Method 2: OpenStreetMap Nominatim
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const a = data.address;
        const streetParts = [a.road || a.pedestrian || a.street, a.suburb || a.neighbourhood || a.residential].filter(Boolean);
        const street = streetParts.length > 0 ? streetParts.join(', ') : (data.name || '');
        const city = a.city || a.town || a.village || a.county || '';
        const state = a.state || '';
        const pincode = a.postcode || '';
        const displayName = data.display_name || [street, city, state, pincode].filter(Boolean).join(', ');
        return { street, city, state, pincode, displayName };
      }
    }
  } catch {}

  return null;
}
