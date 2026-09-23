import React, { useState, useEffect } from 'react';
import { 
  Store, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Check, 
  AlertCircle, 
  ExternalLink, 
  Navigation, 
  Save, 
  Sparkles, 
  Loader2,
  Share2,
  Megaphone,
  Compass,
  CheckCircle2,
  Copy
} from 'lucide-react';
import { useStoreSettings, saveShopLocationToFirebase } from '../../utils/storeSettingsManager';
import { StoreSettings } from '../../types';
import { getRealDeviceGpsPosition, reverseGeocodeRealCoords } from '../../utils/gpsLocationHelper';

interface ShopSettingsTabProps {
  onShowToast: (msg: string) => void;
}

export const ShopSettingsTab: React.FC<ShopSettingsTabProps> = ({ onShowToast }) => {
  const [storeSettings, saveStoreSettings] = useStoreSettings();

  // Form State
  const [formData, setFormData] = useState<StoreSettings>(storeSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // GPS Location Control States
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [detectedAddressPreview, setDetectedAddressPreview] = useState<string | null>(null);
  const [locationSavedSuccess, setLocationSavedSuccess] = useState(false);
  const [locationDetectedSuccess, setLocationDetectedSuccess] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);

  const parseCoord = (val: number | string | undefined | null): number | null => {
    if (val === undefined || val === null || val === '') return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
  };

  // Active / Detected Coordinates
  const [detectedLat, setDetectedLat] = useState<number | null>(() => parseCoord(storeSettings.latitude));
  const [detectedLng, setDetectedLng] = useState<number | null>(() => parseCoord(storeSettings.longitude));
  const [detectedAccuracy, setDetectedAccuracy] = useState<number | null>(null);

  useEffect(() => {
    setFormData(storeSettings);
    const parsedLat = parseCoord(storeSettings.latitude);
    const parsedLng = parseCoord(storeSettings.longitude);
    if (parsedLat !== null && parsedLng !== null) {
      setDetectedLat(parsedLat);
      setDetectedLng(parsedLng);
    }
  }, [storeSettings]);

  const handleChange = (field: keyof StoreSettings, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  /**
   * Browser Geolocation: [ 📍 Get Current Location ]
   * Uses navigator.geolocation.getCurrentPosition with enableHighAccuracy: true, timeout: 15000, maximumAge: 0
   */
  const handleGetCurrentLocation = async () => {
    setDetectingGps(true);
    setGpsError(null);
    setLocationSavedSuccess(false);
    setLocationDetectedSuccess(false);

    try {
      const coords = await getRealDeviceGpsPosition();
      const lat = coords.latitude;
      const lng = coords.longitude;
      const accuracy = coords.accuracy || null;

      setDetectedLat(lat);
      setDetectedLng(lng);
      setDetectedAccuracy(accuracy);
      setGpsError(null);
      setLocationDetectedSuccess(true);

      // Update form state with new coordinates
      setFormData((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        googleMapsUrl: `https://www.google.com/maps?q=${lat},${lng}`
      }));

      // Automatically save coordinates to Firebase as requested
      try {
        await saveShopLocationToFirebase(lat, lng, accuracy || undefined);
        setLocationSavedSuccess(true);
        onShowToast(`📍 Location detected & saved to Firebase: ${lat}, ${lng}`);
      } catch (saveErr) {
        console.warn('Auto-save to Firebase note:', saveErr);
        onShowToast(`📍 Location detected: ${lat}, ${lng}`);
      }

      // Reverse Geocode to show readable address preview
      try {
        const geo = await reverseGeocodeRealCoords(lat, lng);
        if (geo?.displayName) {
          setDetectedAddressPreview(geo.displayName);
          if (!formData.address) {
            setFormData((prev) => ({ ...prev, address: geo.displayName }));
          }
        }
      } catch {
        // Graceful fallback for address text
      }
    } catch (err: any) {
      setGpsError(err?.message || 'Unable to detect your current location.\nPlease try again.');
      setLocationDetectedSuccess(false);
    } finally {
      setDetectingGps(false);
    }
  };

  const handleCoordInputChange = (field: 'lat' | 'lng', valueStr: string) => {
    const trimmed = valueStr.trim();
    const num = trimmed === '' ? null : Number(trimmed);
    if (field === 'lat') {
      setDetectedLat(num !== null && !isNaN(num) ? num : null);
      setFormData((prev) => ({
        ...prev,
        latitude: num !== null && !isNaN(num) ? num : undefined,
        googleMapsUrl: num !== null && detectedLng !== null ? `https://www.google.com/maps?q=${num},${detectedLng}` : prev.googleMapsUrl
      }));
    } else {
      setDetectedLng(num !== null && !isNaN(num) ? num : null);
      setFormData((prev) => ({
        ...prev,
        longitude: num !== null && !isNaN(num) ? num : undefined,
        googleMapsUrl: detectedLat !== null && num !== null ? `https://www.google.com/maps?q=${detectedLat},${num}` : prev.googleMapsUrl
      }));
    }
  };

  /**
   * [ 💾 Save Location ]
   * Explicitly saves current detected GPS coordinates to Firebase under shopSettings/location
   */
  const handleSaveLocationOnly = async () => {
    if (detectedLat === null || detectedLng === null) {
      setGpsError('Please click "Get Current Location" first to detect GPS coordinates before saving.');
      return;
    }

    setIsSavingLocation(true);
    setGpsError(null);

    try {
      await saveShopLocationToFirebase(detectedLat, detectedLng, detectedAccuracy || undefined);
      setLocationSavedSuccess(true);
      onShowToast('✅ Shop GPS Location saved to Firebase! Customer website updated.');
      setTimeout(() => setLocationSavedSuccess(false), 3500);
    } catch (err: any) {
      setGpsError(err?.message || 'Failed to save GPS location to Firebase.');
    } finally {
      setIsSavingLocation(false);
    }
  };

  /**
   * [ 🗺 Open Location ]
   * Dynamically opens Google Maps using the latitude and longitude
   */
  const handleOpenLocation = () => {
    const lat = detectedLat ?? formData.latitude;
    const lng = detectedLng ?? formData.longitude;

    if (lat === null || lat === undefined || lng === null || lng === undefined) {
      setGpsError('No GPS location available to open. Please click "Get Current Location" first.');
      return;
    }

    const dynamicMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(dynamicMapsUrl, '_blank', 'noopener,noreferrer');
  };

  // Full form submit (saves shop details + location)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setGpsError(null);

    try {
      const lat = detectedLat ?? parseCoord(formData.latitude);
      const lng = detectedLng ?? parseCoord(formData.longitude);

      await saveStoreSettings({
        ...formData,
        latitude: lat ?? undefined,
        longitude: lng ?? undefined,
        googleMapsUrl: lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : undefined
      });

      if (lat !== null && lng !== null) {
        await saveShopLocationToFirebase(lat, lng, detectedAccuracy || undefined);
      }

      setSaveSuccess(true);
      onShowToast('Shop details & website settings saved to Firebase! 🛡️');
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setGpsError(err?.message || 'Failed to save store settings to Firebase.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-extrabold text-slate-100">
              Mobile Shop Details &amp; GPS Location Control
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your store information and capture the shop's physical GPS location using your device.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold animate-bounce">
            <Check className="w-4 h-4" />
            <span>Saved to Firebase!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ======================================================== */}
        {/* SHOP CURRENT LOCATION — GPS SYSTEM                       */}
        {/* ======================================================== */}
        <div className="bg-slate-900 border-2 border-cyan-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Section Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                <Compass className="w-4 h-4 animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-sm font-black text-cyan-400 uppercase tracking-wider">
                  SHOP CURRENT LOCATION
                </h3>
                <p className="text-[11px] text-slate-400">
                  Real device/browser GPS location system • Synchronized to Firebase &amp; Customer Website
                </p>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px]">
              <div className={`w-2 h-2 rounded-full ${detectedLat !== null && detectedLng !== null ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-300 font-bold">
                {detectedLat !== null && detectedLng !== null ? '📍 Location detected' : 'No GPS Set'}
              </span>
            </div>
          </div>

          {/* Detecting State Note */}
          {detectingGps && (
            <div className="p-3.5 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 text-xs flex items-center gap-2.5 animate-pulse shadow-lg">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
              <span className="font-bold">📍 Detecting current location...</span>
            </div>
          )}

          {/* Success Banner */}
          {locationDetectedSuccess && !detectingGps && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5 shadow-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold">📍 Location detected successfully</span>
            </div>
          )}

          {/* Permission / Error Banner */}
          {gpsError && (
            <div className="p-3.5 rounded-2xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5 animate-fade-in shadow-lg">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-red-300">❌ Unable to detect location</div>
                <div className="whitespace-pre-line text-slate-300 text-[11px] mt-1">{gpsError}</div>
              </div>
            </div>
          )}

          {/* Location Saved Success Banner */}
          {locationSavedSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5 animate-bounce shadow-lg">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="font-bold">
                Shop GPS coordinates saved successfully to Firebase! Customer website is now using this location.
              </span>
            </div>
          )}

          {/* Latitude & Longitude Coordinate Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Latitude */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Latitude:
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-cyan-300 font-mono">
                  {detectedLat !== null ? '📍 Location detected' : 'awaiting detection'}
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 flex items-center justify-between">
                <span>{detectedLat !== null ? detectedLat.toFixed(6) : 'XX.XXXXXX'}</span>
                <MapPin className="w-5 h-5 text-cyan-400 opacity-60" />
              </div>
              <p className="text-[10px] text-slate-500">
                North / South real GPS coordinate
              </p>
            </div>

            {/* Longitude */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Longitude:
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-cyan-300 font-mono">
                  {detectedLng !== null ? '📍 Location detected' : 'awaiting detection'}
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 flex items-center justify-between">
                <span>{detectedLng !== null ? detectedLng.toFixed(6) : 'XX.XXXXXX'}</span>
                <MapPin className="w-5 h-5 text-cyan-400 opacity-60" />
              </div>
              <p className="text-[10px] text-slate-500">
                East / West real GPS coordinate
              </p>
            </div>
          </div>

          {/* Location Preview (Address and Accuracy) */}
          {(detectedAddressPreview || detectedAccuracy !== null) && (
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-bold text-cyan-400 uppercase tracking-wider">Detected Location Preview:</span>
                {detectedAccuracy !== null && (
                  <span className="text-emerald-400 font-mono">±{detectedAccuracy}m GPS accuracy</span>
                )}
              </div>
              {detectedAddressPreview && (
                <p className="text-slate-300 leading-relaxed font-medium">{detectedAddressPreview}</p>
              )}
            </div>
          )}

          {/* Live Shop Google Map Preview */}
          {detectedLat !== null && detectedLng !== null && (
            <div className="rounded-2xl overflow-hidden border border-slate-800 h-48 bg-slate-950 relative shadow-inner">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                src={`https://maps.google.com/maps?q=${detectedLat},${detectedLng}&z=16&output=embed`}
                title="Shop Pin Google Maps Preview"
              />
            </div>
          )}

          {/* Admin Location Controls */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {/* Button 1: [ 📍 Use Current Location ] */}
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={detectingGps}
              title="Use Current Location"
              aria-label="Use Current Location"
              data-testid="admin-use-current-location-btn"
              className="px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {detectingGps ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>📍 Detecting current location...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 text-slate-950" />
                  <span>Use Current Location</span>
                </>
              )}
            </button>

            {/* Button 2: [ 💾 Save Location ] */}
            <button
              type="button"
              onClick={handleSaveLocationOnly}
              disabled={isSavingLocation || detectedLat === null || detectedLng === null}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {isSavingLocation ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Saving to Firebase...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-slate-950" />
                  <span>💾 Save Location</span>
                </>
              )}
            </button>

            {/* Button 3: [ 🗺 Open Map ] */}
            <button
              type="button"
              onClick={handleOpenLocation}
              disabled={detectedLat === null || detectedLng === null}
              className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs uppercase tracking-wider active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <ExternalLink className="w-4 h-4 text-cyan-400" />
              <span>🗺 Open Map</span>
            </button>

            {/* Button 4: Copy Maps URL */}
            {detectedLat !== null && detectedLng !== null && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`https://www.google.com/maps?q=${detectedLat},${detectedLng}`);
                  onShowToast('📋 Google Maps URL copied to clipboard!');
                }}
                className="px-3.5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
                title="Copy Google Maps link"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Copy Link</span>
              </button>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* STOREFRONT IDENTITY & WEBSITE CONTENT                    */}
        {/* ======================================================== */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Megaphone className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-black text-cyan-400 uppercase tracking-wider">
              Storefront Identity &amp; Website Headlines
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Shop Name / Brand Title
              </label>
              <input
                type="text"
                value={formData.shopName || ''}
                onChange={(e) => handleChange('shopName', e.target.value)}
                placeholder="Rittik Mobile Shop"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Top Announcement Banner
              </label>
              <input
                type="text"
                value={formData.announcement || ''}
                onChange={(e) => handleChange('announcement', e.target.value)}
                placeholder="🔥 FESTIVE SALE: Extra ₹1,500 off on Trade-in..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Home Hero Headline
              </label>
              <input
                type="text"
                value={formData.homeTitle || ''}
                onChange={(e) => handleChange('homeTitle', e.target.value)}
                placeholder="Certified Pre-Owned & New Smartphones"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Home Hero Subtitle / Tagline
              </label>
              <input
                type="text"
                value={formData.homeSubtitle || ''}
                onChange={(e) => handleChange('homeSubtitle', e.target.value)}
                placeholder="আপনার বাড়িতে বসে বা আমাদের দোকান থেকে"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Store Description / About Text (Footer &amp; Profile)
            </label>
            <textarea
              rows={2}
              value={formData.shopDescription || ''}
              onChange={(e) => handleChange('shopDescription', e.target.value)}
              placeholder="Your certified destination for premium pre-owned smartphones..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400 resize-none"
            />
          </div>
        </div>

        {/* ======================================================== */}
        {/* CONTACT NUMBERS & WORKING HOURS                          */}
        {/* ======================================================== */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Phone className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-black text-cyan-400 uppercase tracking-wider">
              Contact Numbers &amp; Store Counter Timings
            </h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Shop Physical Address (Written Text Address)
            </label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Main Market Road, Sector 5, Salt Lake, Kolkata, West Bengal - 700091"
              required
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Store Phone / Helpline
              </label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+91 98300 12345"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                WhatsApp Number
              </label>
              <input
                type="text"
                value={formData.whatsapp || ''}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                placeholder="+919830012345"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="contact@rittikmobileshop.com"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Opening Hours
              </label>
              <input
                type="text"
                value={formData.openingHours || ''}
                onChange={(e) => handleChange('openingHours', e.target.value)}
                placeholder="10:00 AM"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Closing Hours
              </label>
              <input
                type="text"
                value={formData.closingHours || ''}
                onChange={(e) => handleChange('closingHours', e.target.value)}
                placeholder="09:00 PM"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Working Days
              </label>
              <input
                type="text"
                value={formData.workingDays || ''}
                onChange={(e) => handleChange('workingDays', e.target.value)}
                placeholder="Monday – Sunday (7 Days Open)"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Delivery Settings &amp; Coverage Text
            </label>
            <input
              type="text"
              value={formData.deliverySettings || ''}
              onChange={(e) => handleChange('deliverySettings', e.target.value)}
              placeholder="Free Express Doorstep Delivery within 24-48 Hours across West Bengal..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Action Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-cyan-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving to Firebase...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Shop Details &amp; Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
