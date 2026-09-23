import React, { useState } from 'react';
import { SellRequest, SellerMessage, Product } from '../../types';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  Send, 
  ExternalLink,
  Smartphone,
  Eye,
  MessageCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { ImageViewerLightbox } from './ImageViewerLightbox';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface SellRequestDetailsModalProps {
  request: SellRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (requestId: string, status: string) => void;
  onLaunchProduct: (product: Product) => void;
  onShowToast: (msg: string) => void;
}

export const SellRequestDetailsModal: React.FC<SellRequestDetailsModalProps> = ({
  request,
  isOpen,
  onClose,
  onUpdateStatus,
  onLaunchProduct,
  onShowToast
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Admin messaging state
  const [adminMessageText, setAdminMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messagesList, setMessagesList] = useState<SellerMessage[]>(request?.messages || []);

  React.useEffect(() => {
    if (request) {
      setMessagesList(request.messages || []);
    }
  }, [request]);

  if (!isOpen || !request) return null;

  const images = request.images && request.images.length > 0 ? request.images : [];
  const expectedPriceNum = Number(request.expectedPrice || request.price || 0);

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Quick preset messages
  const handleQuickMessage = (preset: string) => {
    setAdminMessageText(preset);
  };

  // Send message to Seller
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = adminMessageText.trim();
    if (!text) return;

    setIsSendingMessage(true);

    const newMsg: SellerMessage = {
      id: `msg-${Date.now()}`,
      sender: 'admin',
      text,
      createdAt: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
    };

    const updatedMessages = [...messagesList, newMsg];
    setMessagesList(updatedMessages);

    try {
      const docRef = doc(db, 'sellRequests', request.id);
      await setDoc(docRef, {
        messages: updatedMessages
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore message save note:', err);
    }

    setIsSendingMessage(false);
    setAdminMessageText('');
    onShowToast('Message sent to seller! 💬');
  };

  // Accept & Launch Product to Storefront
  const handleAcceptAndLaunch = async () => {
    const launchPrice = Math.round(expectedPriceNum * 1.25);
    const mrpPrice = Math.round(launchPrice * 1.35);

    const ramValue = request.ram || request.ramRom?.split('/')[0] || '8 GB';
    const romValue = request.storage || request.ramRom?.split('/')[1] || '128 GB';

    const fallbackImg = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80';
    const finalImages = images.length > 0 ? images : [fallbackImg];

    const newProduct: Product = {
      id: `prod-${request.id}`,
      name: request.deviceName || `${request.brand || 'Device'} ${request.model || ''}`.trim() || request.name,
      brand: request.brand || 'Smartphone',
      category: 'mobile',
      price: launchPrice,
      mrp: mrpPrice,
      rating: 4.9,
      reviewsCount: 6,
      createdAt: Date.now(),
      conditionType: 'used',
      condition: request.condition || 'Superb',
      quality: '32-Point Quality Certified Pre-Owned',
      bodyCondition: 'Inspected Minor Wear',
      displayCondition: 'Original Tested Screen',
      batteryCondition: 'Battery Health Tested > 85%',
      accessories: 'Original Fast Charger & Cable Included',
      boxAvailable: 'Store Eco-Box Packaged',
      warranty: '6 Months Store Warranty',
      processor: 'High Speed Octa-Core Processor',
      camera: 'Triple High Resolution AI Cameras',
      display: 'AMOLED 120Hz Smooth Display',
      battery: '4500mAh Tested Battery',
      network: '5G Dual SIM',
      images: finalImages,
      description: `Certified trade-in device acquired directly from verified customer ${request.sellerName || ''}. Underwent complete 32-point diagnostic testing.`,
      highlights: {
        ram: ramValue,
        rom: romValue
      }
    };

    // Save product to Firestore
    try {
      await setDoc(doc(db, 'products', newProduct.id), newProduct);
      await setDoc(doc(db, 'sellRequests', request.id), {
        status: 'Accepted & Live in Store'
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore launch write note:', err);
    }

    onLaunchProduct(newProduct);
    onUpdateStatus(request.id, 'Accepted & Live in Store');
    onShowToast(`🚀 "${newProduct.name}" launched live to store catalog!`);
    onClose();
  };

  const whatsappLink = `https://wa.me/91${request.contact.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
    `Hello ${request.sellerName || 'Customer'}, this is Rittik Mobile Shop regarding your trade-in submission for ${request.name} (Request #${request.id}).`
  )}`;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
        <div 
          className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative my-6 max-h-[92vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base sm:text-lg font-black text-cyan-400">
                  Request #{request.id}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {request.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{request.date || 'Recent Submission'}</span>
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-5">
            {/* Seller Contact Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`tel:${request.contact}`}
                className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span>Call Seller ({request.contact})</span>
              </a>

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp Seller</span>
              </a>

              {request.email && (
                <a
                  href={`mailto:${request.email}`}
                  className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Email</span>
                </a>
              )}
            </div>

            {/* Seller Information Card */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Seller Information</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Seller Name: </span>
                  <span className="font-bold text-slate-200">{request.sellerName || 'Customer'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Mobile: </span>
                  <span className="font-bold text-slate-200">{request.contact}</span>
                </div>
                {request.email && (
                  <div>
                    <span className="text-slate-400">Email: </span>
                    <span className="text-slate-300">{request.email}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400">Handover Mode: </span>
                  <span className="font-bold text-slate-200 uppercase">
                    {request.handoverType === 'store' ? 'Store Counter Drop-off' : 'Doorstep Pickup'}
                  </span>
                </div>
                <div className="col-span-full">
                  <span className="text-slate-400">Pickup Address: </span>
                  <span className="text-slate-200 font-medium">{request.address}</span>
                </div>
              </div>
            </div>

            {/* Device Details Card */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Device Specifications &amp; Valuation</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Device: </span>
                  <span className="font-bold text-slate-100">{request.deviceName || request.name}</span>
                </div>
                <div>
                  <span className="text-slate-400">Expected Price: </span>
                  <span className="font-bold text-cyan-400 font-mono">
                    ₹{expectedPriceNum.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Brand / Model: </span>
                  <span className="text-slate-200">{request.brand || 'N/A'} {request.model || ''}</span>
                </div>
                <div>
                  <span className="text-slate-400">RAM / Storage: </span>
                  <span className="text-slate-200">{request.ramRom || `${request.ram || '6 GB'} / ${request.storage || '128 GB'}`}</span>
                </div>
                <div>
                  <span className="text-slate-400">Condition Reported: </span>
                  <span className="font-bold text-amber-300">{request.condition || 'Good'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Suggested Retail Price: </span>
                  <span className="text-emerald-400 font-bold">
                    ₹{Math.round(expectedPriceNum * 1.25).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Device Verification Photos with Lightbox Trigger */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Physical Device Photos ({images.length} Photos)</span>
                </h4>
                {images.length > 0 && (
                  <span className="text-[10px] text-slate-400">
                    Click photo to open full-screen viewer
                  </span>
                )}
              </div>

              {images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleOpenLightbox(idx)}
                      className="relative rounded-xl overflow-hidden aspect-square border border-slate-700 bg-slate-950 group cursor-pointer hover:border-cyan-400 transition-all"
                    >
                      <img
                        src={imgUrl}
                        alt={`Device photo ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Eye className="w-5 h-5 text-cyan-300" />
                      </div>
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-900/90 text-slate-300">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/60 rounded-xl border border-slate-800">
                  No device photos attached.
                </div>
              )}
            </div>

            {/* Admin Actions */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider">
                Evaluation &amp; Trade-in Actions
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateStatus(request.id, 'Inspection Approved');
                    onShowToast('Request marked as "Inspection Approved" ✅');
                  }}
                  className="py-2 px-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Accept Request</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onUpdateStatus(request.id, 'Declined');
                    onShowToast('Request declined.');
                  }}
                  className="py-2 px-3 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject Request</span>
                </button>

                <button
                  type="button"
                  onClick={handleAcceptAndLaunch}
                  className="py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Accept &amp; Launch</span>
                </button>
              </div>
            </div>

            {/* Seller Message System (Admin -> Seller) */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Admin-to-Seller Messaging System</span>
              </h4>

              <p className="text-[11px] text-slate-400">
                Messages sent here appear directly in the customer's Sell Requests dashboard.
              </p>

              {/* Message History */}
              {messagesList.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-slate-900/80 rounded-xl border border-slate-800">
                  {messagesList.map((m) => (
                    <div
                      key={m.id}
                      className={`p-2.5 rounded-xl text-xs ${
                        m.sender === 'admin'
                          ? 'bg-cyan-950/60 border border-cyan-500/30 text-cyan-200 ml-4'
                          : 'bg-slate-800 border border-slate-700 text-slate-200 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-bold uppercase tracking-wider">
                          {m.sender === 'admin' ? 'Store Administrator' : 'Customer'}
                        </span>
                        <span>{m.createdAt}</span>
                      </div>
                      <p>{m.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-[11px] text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800/60">
                  No messages exchanged yet with this seller.
                </div>
              )}

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-slate-500">Quick templates:</span>
                {[
                  'Your device has been approved for inspection.',
                  'Please provide clearer photos of device screen and edges.',
                  'Our pickup agent will contact you tomorrow.',
                  'Your expected price has been reviewed and approved.'
                ].map((txt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleQuickMessage(txt)}
                    className="px-2 py-0.5 rounded-lg text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                  >
                    {txt.slice(0, 30)}...
                  </button>
                ))}
              </div>

              {/* Message Input Form */}
              <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={adminMessageText}
                  onChange={(e) => setAdminMessageText(e.target.value)}
                  placeholder="Type message to seller..."
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={isSendingMessage || !adminMessageText.trim()}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {isSendingMessage ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-slate-100 cursor-pointer transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>

      {/* Full Screen Image Lightbox */}
      {lightboxOpen && (
        <ImageViewerLightbox
          images={images}
          initialIndex={lightboxIndex}
          title={`${request.name} - Verification Photo`}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
};
