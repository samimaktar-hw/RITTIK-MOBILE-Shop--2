import React, { useState } from 'react';
import { SellRequest, CustomerProfile } from '../types';
import { 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  Smartphone, 
  Laptop,
  Tablet,
  Cpu,
  ShieldCheck, 
  Check, 
  Banknote,
  Upload,
  ArrowRight,
  AlertCircle,
  Image as ImageIcon,
  Clock,
  MapPin,
  Phone
} from 'lucide-react';
import { DevicePhotosUpload } from './DevicePhotosUpload';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface SellPhoneViewProps {
  onBack: () => void;
  onSellSubmitted: (req: SellRequest) => void;
  onShowToast: (msg: string) => void;
  currentUserProfile?: CustomerProfile | null;
}

export type DeviceCategory = 'mobile' | 'laptop' | 'tablet' | 'other';

export const SellPhoneView: React.FC<SellPhoneViewProps> = ({
  onBack,
  onSellSubmitted,
  onShowToast,
  currentUserProfile
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Device Category
  const [deviceCategory, setDeviceCategory] = useState<DeviceCategory>('mobile');

  // Form State
  const [brand, setBrand] = useState('Apple');
  const [model, setModel] = useState('');
  const [ramRom, setRamRom] = useState('8GB / 128GB');
  const [condition, setCondition] = useState<'flawless' | 'good' | 'fair' | 'damaged'>('good');
  const [hasBox, setHasBox] = useState(true);
  const [hasCharger, setHasCharger] = useState(true);
  const [hasBill, setHasBill] = useState(true);
  const [screenWorking, setScreenWorking] = useState(true);
  const [expectedPrice, setExpectedPrice] = useState<number>(15000);

  // Customer contact info (prefill from profile if logged in)
  const [name, setName] = useState(currentUserProfile?.name || '');
  const [phone, setPhone] = useState(currentUserProfile?.mobile || '');
  const [email, setEmail] = useState(currentUserProfile?.email || '');
  const [address, setAddress] = useState('');
  const [handoverType, setHandoverType] = useState<'pickup' | 'store'>('pickup');
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedId, setSubmittedId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mandatory Device Photos (ImgBB URLs)
  const [devicePhotoUrls, setDevicePhotoUrls] = useState<string[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [photosError, setPhotosError] = useState<string | null>(null);

  const handleImagesReady = React.useCallback((urls: string[]) => {
    setDevicePhotoUrls((prev) => {
      if (prev.length === urls.length && prev.every((u, i) => u === urls[i])) {
        return prev;
      }
      return urls;
    });
    if (urls.length > 0) setPhotosError(null);
  }, []);

  const handleUploadStateChange = React.useCallback((isUploading: boolean) => {
    setIsUploadingPhotos(isUploading);
  }, []);

  // Dynamically calculate estimated quote
  const calculatedEstimate = React.useMemo(() => {
    let base = 20000;
    if (deviceCategory === 'mobile') {
      if (brand === 'Apple') base = 32000;
      else if (brand === 'Samsung') base = 25000;
      else if (brand === 'OnePlus') base = 22000;
      else if (brand === 'Vivo' || brand === 'Oppo') base = 16000;
      else if (brand === 'Realme' || brand === 'Xiaomi') base = 14000;
      else base = 15000;
    } else if (deviceCategory === 'laptop') {
      if (brand === 'Apple') base = 48000;
      else if (brand === 'Dell' || brand === 'HP') base = 30000;
      else if (brand === 'Lenovo' || brand === 'Asus') base = 26000;
      else base = 24000;
    } else if (deviceCategory === 'tablet') {
      if (brand === 'Apple') base = 28000;
      else if (brand === 'Samsung') base = 20000;
      else base = 12000;
    } else {
      base = 8000;
    }

    let multiplier = 1.0;
    if (condition === 'flawless') multiplier = 1.15;
    if (condition === 'good') multiplier = 1.0;
    if (condition === 'fair') multiplier = 0.8;
    if (condition === 'damaged') multiplier = 0.55;

    let bonus = 0;
    if (hasBox) bonus += 500;
    if (hasCharger) bonus += 500;
    if (hasBill) bonus += 700;
    if (!screenWorking) multiplier *= 0.6;

    const finalVal = Math.round(base * multiplier + bonus);
    return {
      min: Math.round(finalVal * 0.95),
      max: Math.round(finalVal * 1.08),
      recommended: finalVal
    };
  }, [deviceCategory, brand, condition, hasBox, hasCharger, hasBill, screenWorking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhotosError(null);

    if (!name.trim() || !phone.trim()) {
      onShowToast('Please enter your full name and phone number.');
      return;
    }

    if (isUploadingPhotos) {
      setPhotosError('Please wait for photos to finish uploading to ImgBB.');
      onShowToast('Please wait for photos to finish uploading to ImgBB.');
      return;
    }

    // MANDATORY IMAGE UPLOAD VALIDATION
    if (!devicePhotoUrls || devicePhotoUrls.length === 0) {
      setPhotosError('Device photos are mandatory. Please select and upload at least 1 photo.');
      onShowToast('Device photos are mandatory. Please select and upload at least 1 photo.');
      return;
    }

    setIsSubmitting(true);
    const reqId = 'SELL-' + Date.now().toString().slice(-6);

    const deviceDisplayName = `${brand} ${model || (deviceCategory === 'mobile' ? 'Smartphone' : deviceCategory === 'laptop' ? 'Laptop' : deviceCategory === 'tablet' ? 'Tablet' : 'Electronic Device')} (${ramRom})`;

    const newReq: SellRequest = {
      id: reqId,
      sellerName: name.trim(),
      sellerMobile: phone.trim(),
      sellerEmail: email.trim(),
      deviceName: deviceDisplayName,
      name: deviceDisplayName,
      deviceType: deviceCategory,
      brand,
      model: model.trim(),
      ramRom,
      price: expectedPrice || calculatedEstimate.recommended,
      expectedPrice: expectedPrice || calculatedEstimate.recommended,
      condition: condition === 'flawless' ? 'Flawless' : condition === 'good' ? 'Good' : condition === 'fair' ? 'Fair' : 'Damaged',
      contact: phone.trim(),
      email: email.trim(),
      address: handoverType === 'pickup' ? address.trim() : 'Store Counter Drop-off',
      handoverType,
      images: devicePhotoUrls,
      status: 'Pending Verification',
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      createdAt: Date.now()
    };

    // Save to Firebase Firestore
    try {
      const docRef = doc(db, 'sellRequests', reqId);
      await setDoc(docRef, {
        id: reqId,
        sellerName: newReq.sellerName,
        sellerMobile: newReq.sellerMobile,
        sellerEmail: newReq.sellerEmail,
        deviceName: newReq.deviceName,
        name: newReq.name,
        deviceType: newReq.deviceType,
        brand: newReq.brand,
        model: newReq.model,
        ramRom: newReq.ramRom,
        condition: newReq.condition,
        expectedPrice: newReq.expectedPrice,
        price: newReq.price,
        contact: newReq.contact,
        email: newReq.email,
        address: newReq.address,
        handoverType: newReq.handoverType,
        images: newReq.images,
        status: newReq.status,
        createdAt: new Date().toISOString(),
        createdTimestamp: Date.now()
      });
    } catch (err) {
      console.warn('Firestore write notice (local fallback active):', err);
    }

    onSellSubmitted(newReq);
    setSubmittedId(reqId);
    setIsSubmitting(false);
    setIsSuccess(true);
    onShowToast('Sell request submitted with device photos! 📸');
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-12 pb-28">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 fill-emerald-500/20 text-emerald-400" />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 mb-1">
              Valuation Request Submitted!
            </h2>
            <p className="text-xs text-slate-400">
              Our valuation team will inspect your device details & photos and contact you at <strong className="text-slate-200">{phone}</strong> within 30 minutes for doorstep evaluation and spot cash/UPI payout.
            </p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-left text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Reference ID:</span>
              <span className="font-mono font-bold text-cyan-400">#{submittedId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Device Photos:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                {devicePhotoUrls.length} Photos Attached (ImgBB)
              </span>
            </div>
            {devicePhotoUrls.length > 0 && (
              <div className="flex gap-2 pt-1 overflow-x-auto">
                {devicePhotoUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Uploaded photo ${i + 1}`}
                    className="w-12 h-12 object-cover rounded-lg border border-slate-700"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={onBack}
              className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:brightness-110 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
            >
              Back to Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
              <RotateCcw className="w-6 h-6 text-cyan-400" />
              Sell Your Device for Instant Cash
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Submit your mobile phone, laptop, tablet, or electronics for instant valuation, free doorstep pickup & spot payout.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 1 ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>1</span>
            <span className="text-xs font-bold text-slate-200">Device Specs</span>
          </div>
          <div className="h-0.5 flex-1 bg-slate-800 mx-3" />
          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 2 ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>2</span>
            <span className="text-xs font-bold text-slate-200">Condition</span>
          </div>
          <div className="h-0.5 flex-1 bg-slate-800 mx-3" />
          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= 3 ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>3</span>
            <span className="text-xs font-bold text-slate-200">Photos & Quote</span>
          </div>
        </div>

        {/* STEP 1: DEVICE CATEGORY & SPECS */}
        {step === 1 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-2">
                1. Select Device Type
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'mobile', label: 'Mobile / Smartphone', icon: Smartphone },
                  { id: 'laptop', label: 'Laptop / PC', icon: Laptop },
                  { id: 'tablet', label: 'Tablet / iPad', icon: Tablet },
                  { id: 'other', label: 'Other Electronics', icon: Cpu }
                ].map((cat) => {
                  const Icon = cat.icon;
                  const isActive = deviceCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setDeviceCategory(cat.id as DeviceCategory);
                        if (cat.id === 'laptop') setBrand('Apple');
                        else if (cat.id === 'tablet') setBrand('Apple');
                        else if (cat.id === 'other') setBrand('Apple');
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center justify-center text-center gap-2 ${
                        isActive
                          ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-md shadow-cyan-500/20'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Brand & Specification
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Brand</label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {deviceCategory === 'mobile' && (
                      <>
                        <option value="Apple">Apple iPhone</option>
                        <option value="Samsung">Samsung Galaxy</option>
                        <option value="Vivo">Vivo</option>
                        <option value="Realme">Realme</option>
                        <option value="Oppo">Oppo</option>
                        <option value="Xiaomi">Xiaomi / Redmi</option>
                        <option value="OnePlus">OnePlus</option>
                        <option value="Google">Google Pixel</option>
                        <option value="Motorola">Motorola</option>
                      </>
                    )}
                    {deviceCategory === 'laptop' && (
                      <>
                        <option value="Apple">Apple MacBook</option>
                        <option value="Dell">Dell</option>
                        <option value="HP">HP</option>
                        <option value="Lenovo">Lenovo</option>
                        <option value="Asus">Asus ROG / ZenBook</option>
                        <option value="Acer">Acer</option>
                        <option value="MSI">MSI</option>
                      </>
                    )}
                    {deviceCategory === 'tablet' && (
                      <>
                        <option value="Apple">Apple iPad</option>
                        <option value="Samsung">Samsung Galaxy Tab</option>
                        <option value="Lenovo">Lenovo Tab</option>
                        <option value="Xiaomi">Xiaomi Pad</option>
                        <option value="OnePlus">OnePlus Pad</option>
                      </>
                    )}
                    {deviceCategory === 'other' && (
                      <>
                        <option value="Apple">Apple Watch / AirPods</option>
                        <option value="Samsung">Samsung Galaxy Watch / Buds</option>
                        <option value="Sony">Sony PlayStation / Headphones</option>
                        <option value="Microsoft">Microsoft Xbox</option>
                        <option value="Other">Other Brand</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Exact Model Name</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={
                      deviceCategory === 'mobile'
                        ? 'e.g. iPhone 14 Pro / Galaxy S23'
                        : deviceCategory === 'laptop'
                        ? 'e.g. MacBook Air M2 / XPS 13'
                        : deviceCategory === 'tablet'
                        ? 'e.g. iPad Air 5th Gen'
                        : 'e.g. Apple Watch Series 8'
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-semibold mb-1">
                    RAM & Storage / Specification
                  </label>
                  <select
                    value={ramRom}
                    onChange={(e) => setRamRom(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {deviceCategory === 'laptop' ? (
                      <>
                        <option value="8GB RAM / 256GB SSD">8GB RAM / 256GB SSD</option>
                        <option value="8GB RAM / 512GB SSD">8GB RAM / 512GB SSD</option>
                        <option value="16GB RAM / 512GB SSD">16GB RAM / 512GB SSD</option>
                        <option value="16GB RAM / 1TB SSD">16GB RAM / 1TB SSD</option>
                        <option value="32GB RAM / 1TB SSD">32GB RAM / 1TB SSD</option>
                      </>
                    ) : (
                      <>
                        <option value="4GB / 64GB">4 GB RAM / 64 GB ROM</option>
                        <option value="6GB / 128GB">6 GB RAM / 128 GB ROM</option>
                        <option value="8GB / 128GB">8 GB RAM / 128 GB ROM</option>
                        <option value="8GB / 256GB">8 GB RAM / 256 GB ROM</option>
                        <option value="12GB / 256GB">12 GB RAM / 256 GB ROM</option>
                        <option value="16GB / 512GB">16 GB RAM / 512 GB ROM</option>
                        <option value="1TB">1 TB Storage Edition</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-xl text-xs font-extrabold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:brightness-110 shadow-md shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span>Continue to Condition Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CONDITION ASSESSMENT */}
        {step === 2 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              2. Physical & Operational Condition
            </h2>

            {/* Overall Condition Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'flawless', label: 'Flawless', desc: 'No scratches or dents, like new' },
                { id: 'good', label: 'Good', desc: 'Minor signs of regular use' },
                { id: 'fair', label: 'Fair', desc: 'Dents, scratches or chipped paint' },
                { id: 'damaged', label: 'Damaged', desc: 'Cracked screen, body or issues' }
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCondition(c.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    condition === c.id
                      ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-md shadow-cyan-500/10'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-extrabold text-xs text-slate-200">{c.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{c.desc}</div>
                </button>
              ))}
            </div>

            {/* Accessories Checklist */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-300 block">Available Accessories:</span>

              <label className="flex items-center gap-2 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={hasBox}
                  onChange={(e) => setHasBox(e.target.checked)}
                  className="accent-cyan-400"
                />
                <span className="text-slate-200">Original Packaging Box available (+ ₹ 500)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={hasCharger}
                  onChange={(e) => setHasCharger(e.target.checked)}
                  className="accent-cyan-400"
                />
                <span className="text-slate-200">Original Fast Charger & Cable (+ ₹ 500)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={hasBill}
                  onChange={(e) => setHasBill(e.target.checked)}
                  className="accent-cyan-400"
                />
                <span className="text-slate-200">Original Store Invoice / Bill (+ ₹ 700)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={screenWorking}
                  onChange={(e) => setScreenWorking(e.target.checked)}
                  className="accent-cyan-400"
                />
                <span className="text-slate-200">Display & Touch/Screen fully functional</span>
              </label>
            </div>

            <div className="pt-3 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl text-xs font-extrabold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:brightness-110 shadow-md shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span>Continue to Photos & Quote</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: VALUATION, MANDATORY PHOTOS & HANDOVER */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* AI Valuation Card */}
            <div className="bg-gradient-to-br from-cyan-950/50 via-slate-900 to-sky-950/40 border border-cyan-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                AI Real-time Valuation Quote
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-200">
                {brand} {model || (deviceCategory === 'mobile' ? 'Smartphone' : 'Device')} ({ramRom})
              </h3>

              <div className="text-3xl sm:text-4xl font-black text-cyan-400 my-2">
                ₹ {calculatedEstimate.min.toLocaleString('en-IN')} – ₹ {calculatedEstimate.max.toLocaleString('en-IN')}
              </div>

              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                Guaranteed price range upon doorstep verification. Spot payment directly into your Bank Account or UPI ID!
              </p>
            </div>

            {/* MANDATORY DEVICE PHOTOS UPLOAD SECTION */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3">
              <DevicePhotosUpload
                required={true}
                onImagesReady={handleImagesReady}
                onUploadStateChange={handleUploadStateChange}
              />

              {photosError && (
                <div className="bg-rose-950/70 border border-rose-500/50 text-rose-300 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{photosError}</span>
                </div>
              )}
            </div>

            {/* Handover & Contact Information Form */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 text-xs">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Seller Information & Handover Preference
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setHandoverType('pickup')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    handoverType === 'pickup'
                      ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400'
                  }`}
                >
                  <div className="font-bold text-slate-200">Free Doorstep Pickup</div>
                  <div className="text-[10px] text-slate-400">Our agent visits your address with instant cash</div>
                </div>

                <div
                  onClick={() => setHandoverType('store')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    handoverType === 'store'
                      ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400'
                  }`}
                >
                  <div className="font-bold text-slate-200">Store Drop-off</div>
                  <div className="text-[10px] text-slate-400">Bring device to Rittik Mobile Store counter</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Amit Sen"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Mobile Number (For Payout Call) *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. yourname@example.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Your Expected Price (₹)</label>
                  <input
                    type="number"
                    value={expectedPrice}
                    onChange={(e) => setExpectedPrice(Number(e.target.value))}
                    placeholder={`e.g. ${calculatedEstimate.recommended}`}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {handoverType === 'pickup' && (
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-semibold mb-1">Pickup Address & City *</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. 14B Lake Gardens, South Kolkata"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingPhotos}
                  className="px-6 py-3 rounded-xl text-xs sm:text-sm font-extrabold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:brightness-110 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Banknote className="w-4 h-4 fill-slate-950" />
                  <span>
                    {isSubmitting ? 'Submitting Request...' : 'Submit Sell Request with Photos'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
