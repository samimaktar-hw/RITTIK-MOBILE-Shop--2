import React, { useState, useEffect } from 'react';
import { CartItem, OrderRecord, OrderItem, CustomerProfile } from '../types';
import { 
  ArrowLeft, 
  MapPin, 
  Navigation, 
  ShieldCheck, 
  CreditCard, 
  CheckCircle2, 
  Store, 
  Truck,
  Loader2,
  AlertCircle,
  User,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useStoreSettings } from '../utils/storeSettingsManager';
import { getRealDeviceGpsPosition, reverseGeocodeRealCoords } from '../utils/gpsLocationHelper';

interface CheckoutViewProps {
  items: CartItem[];
  currentUser?: FirebaseUser | null;
  userProfile?: CustomerProfile | null;
  onRequireLogin?: () => void;
  onBack: () => void;
  onOrderPlaced: (order: OrderRecord) => void;
  onShowToast: (msg: string) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  items,
  currentUser,
  userProfile,
  onRequireLogin,
  onBack,
  onOrderPlaced,
  onShowToast
}) => {
  const [storeSettings] = useStoreSettings();
  const [customerName, setCustomerName] = useState(userProfile?.name || currentUser?.displayName || '');
  const [customerPhone, setCustomerPhone] = useState(userProfile?.mobile || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [deliveryType, setDeliveryType] = useState<'home' | 'store'>('home');

  useEffect(() => {
    if (userProfile?.name && !customerName) {
      setCustomerName(userProfile.name);
    } else if (currentUser?.displayName && !customerName) {
      setCustomerName(currentUser.displayName);
    }
    if (userProfile?.mobile && !customerPhone) {
      setCustomerPhone(userProfile.mobile);
    }
    if (currentUser?.email && !customerEmail) {
      setCustomerEmail(currentUser.email);
    }
  }, [userProfile, currentUser]);

  // Address fields
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('West Bengal');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');

  // GPS state
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsSuccess, setGpsSuccess] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi' | 'store'>('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  /**
   * Real Device GPS Geolocation
   * Triggered ONLY when customer clicks [ 📍 Use My Current Location ]
   */
  const handleDetectLocation = async () => {
    setIsDetectingGps(true);
    setGpsStatusMessage('📍 Detecting current location...');
    setGpsError(null);
    setGpsSuccess(false);

    try {
      const coords = await getRealDeviceGpsPosition();
      const detected = {
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: coords.accuracy
      };
      setDetectedCoords(detected);
      setGpsStatusMessage('📍 Location detected successfully');
      setGpsSuccess(true);
      setGpsError(null);
      onShowToast(`📍 Location detected: ${coords.latitude}, ${coords.longitude}`);

      // Save detected GPS coordinates to Firebase user profile if authenticated
      if (currentUser?.uid) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await setDoc(userDocRef, {
            latitude: coords.latitude,
            longitude: coords.longitude,
            location: detected,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (fbErr) {
          console.warn('Could not save user location to Firebase:', fbErr);
        }
      }

      // Reverse geocode real coordinates to auto-populate address fields if empty
      try {
        const geo = await reverseGeocodeRealCoords(coords.latitude, coords.longitude);
        if (geo) {
          if (geo.street) {
            setStreet((prev) => (!prev.trim() ? geo.street : prev));
          }
          if (geo.city) {
            setCity((prev) => (!prev.trim() ? geo.city : prev));
          }
          if (geo.state) {
            setState((prev) => (!prev.trim() || prev === 'West Bengal' ? geo.state : prev));
          }
          if (geo.pincode) {
            setPincode((prev) => (!prev.trim() ? geo.pincode : prev));
          }
        }
      } catch {
        // Reverse geocoding optional helper
      }
    } catch (err: any) {
      setGpsStatusMessage('❌ Unable to detect location');
      setGpsError(err?.message || 'Unable to detect your current location. Please try again.');
      setGpsSuccess(false);
    } finally {
      setIsDetectingGps(false);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      onShowToast('Please login or create an account to place your order.');
      if (onRequireLogin) {
        onRequireLogin();
      }
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      onShowToast('Please enter Customer Full Name and Mobile Number.');
      return;
    }

    if (customerPhone.trim().replace(/\D/g, '').length < 10) {
      onShowToast('Please enter a valid 10-digit mobile number.');
      return;
    }

    let fullAddress = '';
    if (deliveryType === 'home') {
      if (!street.trim() || !city.trim() || !pincode.trim()) {
        onShowToast('Please fill in complete Home Delivery Address (Street, City, PIN Code).');
        return;
      }
      fullAddress = `${street.trim()}, ${city.trim()}, ${state.trim()} - ${pincode.trim()}${landmark.trim() ? ` (Landmark: ${landmark.trim()})` : ''}`;
    } else {
      fullAddress = 'Store Counter Pickup (Rittik Mobile Shop, Main Market Road, West Bengal)';
    }

    setIsSubmitting(true);

    const orderId = 'RMS-' + Date.now().toString().slice(-6);

    const orderItems: OrderItem[] = items.map((i) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      mrp: i.mrp,
      image: i.image,
      quantity: i.quantity,
      variantName: i.variantText
    }));

    const newOrder: OrderRecord = {
      id: orderId,
      userId: currentUser.uid,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      mobile: customerPhone.trim(),
      customerEmail: (customerEmail.trim() || currentUser.email) || undefined,
      items: orderItems,
      productName: items.map((i) => `${i.name} (x${i.quantity})`).join(', '),
      productPrice: totalAmount,
      productImage: items[0]?.image || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80',
      selectedVariant: items[0]?.variantText || 'Standard',
      deliveryType,
      address: fullAddress,
      paymentMethod,
      status: 'Confirmed & Processing',
      date: new Date().toLocaleString(),
      createdAt: new Date().toISOString(),
      latitude: detectedCoords ? detectedCoords.lat : undefined,
      longitude: detectedCoords ? detectedCoords.lng : undefined,
      location: detectedCoords || undefined
    };

    // Save to Firestore orders collection
    try {
      await setDoc(doc(db, 'orders', orderId), newOrder);
    } catch (err) {
      console.warn('Firestore order save fallback:', err);
    }

    // Save to local storage
    try {
      const existing = JSON.parse(localStorage.getItem('rittik_orders') || '[]');
      existing.unshift(newOrder);
      localStorage.setItem('rittik_orders', JSON.stringify(existing));
    } catch {
      // Storage fallback
    }

    setIsSubmitting(false);
    onOrderPlaced(newOrder);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28">
      {/* Top Navbar */}
      <div className="sticky top-14 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs font-bold text-slate-300 hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <span className="text-sm font-extrabold text-slate-200">
          Order Checkout
        </span>
        <div className="w-8" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Customer Authentication Status Banner */}
        {!currentUser ? (
          <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-200">Customer Login Required</h4>
                <p className="text-[11px] text-amber-300/80">Please log in to link this order to your account and track its delivery live.</p>
              </div>
            </div>
            {onRequireLogin && (
              <button
                type="button"
                onClick={onRequireLogin}
                className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all cursor-pointer whitespace-nowrap shadow-md shadow-amber-500/20"
              >
                Log In / Sign Up
              </button>
            )}
          </div>
        ) : (
          <div className="mb-6 p-3 px-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Ordering as <strong>{userProfile?.name || currentUser.displayName || currentUser.email}</strong></span>
            </div>
            <span className="text-[10px] text-emerald-400/80 font-mono">UID: {currentUser.uid.slice(0, 8)}...</span>
          </div>
        )}
        <form onSubmit={handleSubmitOrder} className="space-y-6">
          {/* 1. Items Summary Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              Order Items Summary ({items.length})
            </h2>

            <div className="divide-y divide-slate-800/80">
              {items.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center flex-shrink-0">
                    <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-slate-200 truncate">{item.name}</h3>
                    <p className="text-[11px] text-slate-400">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-xs font-extrabold text-cyan-400">
                    ₹ {(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Customer Information */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Customer Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Mobile Number (For Delivery Confirmation) *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">
                  Email Address (Optional for Invoice & Updates)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. rahul.sharma@gmail.com"
                  className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Fulfillment Choice & Address */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              Delivery & Fulfillment Method
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setDeliveryType('home')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  deliveryType === 'home'
                    ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-md shadow-cyan-500/10'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-200">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  Fast Home Delivery
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Direct to your doorstep in 24-48 hours</p>
              </div>

              <div
                onClick={() => setDeliveryType('store')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  deliveryType === 'store'
                    ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-md shadow-cyan-500/10'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-200">
                  <Store className="w-4 h-4 text-emerald-400" />
                  Store Counter Pickup
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Pick up in-person at Rittik Mobile Shop</p>
              </div>
            </div>

            {/* Home Delivery Address Form with GPS Detection */}
            {deliveryType === 'home' ? (
              <div className="space-y-3 pt-2">
                {/* GPS Detect Card */}
                <div className="p-4 bg-slate-950/90 border border-dashed border-cyan-500/50 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={isDetectingGps}
                      title="Use Current Location"
                      aria-label="Use Current Location"
                      data-testid="use-current-location-btn"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/25 cursor-pointer"
                    >
                      {isDetectingGps ? (
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

                    {detectedCoords && (
                      <a
                        href={`https://www.google.com/maps?q=${detectedCoords.lat},${detectedCoords.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 transition-all cursor-pointer"
                      >
                        <span>View on Maps</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Detecting indicator */}
                  {isDetectingGps && (
                    <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="font-semibold">📍 Detecting current location...</span>
                    </div>
                  )}

                  {/* Error Notification */}
                  {gpsError && (
                    <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-xs text-red-200 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-red-300">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>❌ Unable to detect location</span>
                      </div>
                      <p className="whitespace-pre-line text-[11px] text-slate-300 pl-6">
                        {gpsError}
                      </p>
                    </div>
                  )}

                  {/* Detected Result */}
                  {detectedCoords && (
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/40 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400 uppercase tracking-wider">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>📍 Current Location Detected</span>
                        </div>
                        {detectedCoords.accuracy && (
                          <span className="text-[10px] text-emerald-400 font-mono">
                            ±{detectedCoords.accuracy}m GPS accuracy
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Latitude:</span>
                          <span className="text-emerald-300 font-black text-sm">{detectedCoords.lat.toFixed(6)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Longitude:</span>
                          <span className="text-emerald-300 font-black text-sm">{detectedCoords.lng.toFixed(6)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-0.5">
                        <span className="text-emerald-400 font-medium">📍 Location detected successfully</span>
                        <a
                          href={`https://www.google.com/maps?q=${detectedCoords.lat},${detectedCoords.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:underline font-bold inline-flex items-center gap-1"
                        >
                          <span>Open in Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Google Maps Preview */}
                      <div className="rounded-xl overflow-hidden border border-slate-800 h-36 shadow-inner">
                        <iframe
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          scrolling="no"
                          src={`https://maps.google.com/maps?q=${detectedCoords.lat},${detectedCoords.lng}&z=16&output=embed`}
                          title="Customer Delivery GPS Location Preview"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-semibold mb-1">
                      Flat, House No., Building Name & Street *
                    </label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="e.g. Flat 302, Green Avenue, Main Road"
                      className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      City / Town *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="State"
                      className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="6-digit PIN"
                      className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Nearby Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near Metro Station / Bus Stand"
                      className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Store Pickup Information with dynamic Firebase GPS coordinates */
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-slate-200 text-sm">📍 {storeSettings.shopName || 'Rittik Mobile Shop'}</h4>
                  <p className="text-slate-400 mt-1 leading-relaxed">
                    {storeSettings.address || 'Main Market Road, West Bengal, India'}<br />
                    Store Timings: {storeSettings.openingHours || '10:00 AM'} – {storeSettings.closingHours || '09:00 PM'} ({storeSettings.workingDays || 'Monday to Sunday'})
                  </p>
                </div>

                {storeSettings.latitude && storeSettings.longitude && (
                  <div className="rounded-xl overflow-hidden border border-slate-800 h-40">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      src={`https://maps.google.com/maps?q=${storeSettings.latitude},${storeSettings.longitude}&z=15&output=embed`}
                      title="Store Pickup Map Location"
                    />
                  </div>
                )}

                {storeSettings.latitude && storeSettings.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${storeSettings.latitude},${storeSettings.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-bold text-xs pt-1"
                  >
                    <span>Open Shop Location in Google Maps</span>
                    <Navigation className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* 4. Payment Mode & Total Summary */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              Payment Mode & Confirmation
            </h2>

            <div className="space-y-2">
              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  paymentMethod === 'cod' ? 'border-cyan-400 bg-cyan-950/30' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="accent-cyan-400"
                />
                <div>
                  <span className="font-bold text-xs sm:text-sm text-slate-200 block">
                    Cash on Delivery (COD)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Pay securely in cash or UPI upon handover
                  </span>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  paymentMethod === 'upi' ? 'border-cyan-400 bg-cyan-950/30' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                  className="accent-cyan-400"
                />
                <div>
                  <span className="font-bold text-xs sm:text-sm text-slate-200 block">
                    UPI / QR Code Scan on Handover
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Scan Google Pay, PhonePe, or Paytm QR upon arrival
                  </span>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  paymentMethod === 'store' ? 'border-cyan-400 bg-cyan-950/30' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'store'}
                  onChange={() => setPaymentMethod('store')}
                  className="accent-cyan-400"
                />
                <div>
                  <span className="font-bold text-xs sm:text-sm text-slate-200 block">
                    Pay at Store Counter
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Card, Cash, or UPI upon collecting device at shop
                  </span>
                </div>
              </label>
            </div>

            {/* Total Summary */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal:</span>
                <span className="text-slate-200 font-semibold">₹ {totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Delivery & Handling:</span>
                <span className="text-emerald-400 font-bold">FREE</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline text-base sm:text-lg font-black text-slate-100">
                <span>Total Payable Amount:</span>
                <span className="text-cyan-400">₹ {totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-xl text-sm font-black text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:brightness-110 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                  <span>Confirming Order...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 fill-slate-950 text-cyan-400" />
                  <span>CONFIRM & PLACE ORDER</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
