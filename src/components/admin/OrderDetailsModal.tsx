import React, { useState } from 'react';
import { OrderRecord, OrderStatus, OrderTrackingEvent } from '../../types';
import { 
  X, 
  MapPin, 
  ExternalLink, 
  Share2, 
  Copy, 
  Check, 
  Phone, 
  Mail, 
  User, 
  Package, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Truck, 
  AlertCircle,
  Navigation
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface OrderDetailsModalProps {
  order: OrderRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus, trackingEvent?: OrderTrackingEvent) => void;
  onShowToast: (msg: string) => void;
}

const ORDER_STATUS_STEPS: OrderStatus[] = [
  'Order Placed',
  'Confirmed & Processing',
  '32-Point Quality Inspection',
  'Shipped',
  'Out for Delivery',
  'Delivered'
];

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
  onShowToast
}) => {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order?.status || 'Order Placed');
  const [trackingNote, setTrackingNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (order) {
      setSelectedStatus(order.status);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const orderLat = typeof order.latitude === 'number' ? order.latitude : order.location?.lat;
  const orderLng = typeof order.longitude === 'number' ? order.longitude : order.location?.lng;
  const hasCustomerGps = typeof orderLat === 'number' && typeof orderLng === 'number' && !isNaN(orderLat) && !isNaN(orderLng);
  const customerMapUrl = hasCustomerGps
    ? `https://www.google.com/maps?q=${orderLat},${orderLng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`;

  // Formatted delivery summary text for delivery boy
  const getDeliveryShareText = () => {
    const itemsList = order.items && order.items.length > 0
      ? order.items.map((i) => `• ${i.name} (x${i.quantity})`).join('\n')
      : `• ${order.productName}`;

    return [
      '----------------------------------------',
      'RITTIK MOBILE SHOP — DELIVERY DETAILS',
      '----------------------------------------',
      `Order ID: #${order.id}`,
      `Date: ${order.date || 'Recent'} ${order.time ? `(${order.time})` : ''}`,
      `Customer Name: ${order.customerName}`,
      `Mobile Number: ${order.customerPhone}`,
      order.customerEmail ? `Email: ${order.customerEmail}` : '',
      `Delivery Type: ${order.deliveryType === 'store' ? 'Store Counter Pickup' : 'Home Delivery'}`,
      'Delivery Address:',
      order.address,
      order.city ? `City: ${order.city}` : '',
      order.state ? `State: ${order.state}` : '',
      order.pincode ? `PIN Code: ${order.pincode}` : '',
      hasCustomerGps 
        ? `Customer Real GPS Location (Google Maps):\nhttps://www.google.com/maps?q=${orderLat},${orderLng}`
        : 'Google Maps Search Link:\n' + customerMapUrl,
      '----------------------------------------',
      'Order Items:',
      itemsList,
      `Total Amount: ₹${(order.productPrice || 0).toLocaleString('en-IN')}`,
      `Payment Method: ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod.toUpperCase()}`,
      `Current Status: ${order.status}`,
      '----------------------------------------',
      'Rittik Mobile Shop | Certified Pre-Owned'
    ].filter(Boolean).join('\n');
  };

  // Handle Share / Copy
  const handleShareDeliveryDetails = async () => {
    const text = getDeliveryShareText();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Delivery Details - Order #${order.id}`,
          text: text
        });
        onShowToast('Delivery details shared! 🚀');
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    // Fallback: Copy to Clipboard
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onShowToast('Delivery details copied to clipboard! 📋');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      onShowToast('Unable to copy details.');
    }
  };

  // Save Status Change with Tracking Event
  const handleSaveStatus = async () => {
    setIsUpdating(true);
    const newEvent: OrderTrackingEvent = {
      status: selectedStatus,
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      note: trackingNote.trim() || undefined
    };

    const existingEvents = order.trackingEvents || [];
    const updatedEvents = [...existingEvents, newEvent];

    try {
      const docRef = doc(db, 'orders', order.id);
      await setDoc(docRef, {
        status: selectedStatus,
        trackingEvents: updatedEvents
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore order status write note:', err);
    }

    onUpdateStatus(order.id, selectedStatus, newEvent);
    setIsUpdating(false);
    setTrackingNote('');
    onShowToast(`Order #${order.id} status updated to "${selectedStatus}"`);
  };

  return (
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
                Order #{order.id}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-200 border border-slate-700">
                {order.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{order.date || 'Recent'}</span>
              {order.time && <span>• {order.time}</span>}
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
          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleShareDeliveryDetails}
              className="flex-1 min-w-[200px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? 'Copied Details!' : 'Share Delivery Details with Delivery Boy'}</span>
            </button>

            {hasCustomerGps ? (
              <a
                href={customerMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
              >
                <Navigation className="w-4 h-4 text-slate-950" />
                <span>🗺 Open Customer Location</span>
              </a>
            ) : (
              <a
                href={customerMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span>Search Address on Map</span>
              </a>
            )}
          </div>

          {/* Customer Information Card */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Customer Information</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400">Full Name: </span>
                <span className="font-bold text-slate-200">{order.customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Phone / Mobile: </span>
                <a 
                  href={`tel:${order.customerPhone}`}
                  className="font-bold text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" />
                  <span>{order.customerPhone}</span>
                </a>
              </div>
              {order.customerEmail && (
                <div className="col-span-full flex items-center gap-2">
                  <span className="text-slate-400">Email: </span>
                  <a href={`mailto:${order.customerEmail}`} className="text-slate-300 hover:underline flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    <span>{order.customerEmail}</span>
                  </a>
                </div>
              )}
              {order.userId && (
                <div className="col-span-full text-[11px] text-slate-500 font-mono truncate">
                  User UID: {order.userId}
                </div>
              )}
            </div>
          </div>

          {/* Delivery & Address Card */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Delivery Details</span>
            </h4>

            <div className="space-y-1.5 text-xs">
              <div>
                <span className="text-slate-400">Delivery Mode: </span>
                <span className="font-bold text-slate-200 uppercase">
                  {order.deliveryType === 'store' ? 'Counter Pickup' : 'Express Home Delivery'}
                </span>
              </div>

              <div>
                <span className="text-slate-400">Delivery Address: </span>
                <span className="text-slate-200 font-medium">{order.address}</span>
              </div>
            </div>
          </div>

          {/* CUSTOMER LOCATION CARD */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span>CUSTOMER LOCATION</span>
              </h4>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${hasCustomerGps ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                {hasCustomerGps ? '📍 Real GPS Coordinates Available' : 'No GPS Coordinates Saved'}
              </span>
            </div>

            {hasCustomerGps ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-900/90 p-3 rounded-xl border border-slate-800 font-mono text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">📍 Latitude</span>
                    <span className="text-emerald-300 font-bold text-sm">{orderLat!.toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">📍 Longitude</span>
                    <span className="text-emerald-300 font-bold text-sm">{orderLng!.toFixed(6)}</span>
                  </div>
                </div>

                {order.location?.accuracy && (
                  <p className="text-[10px] text-slate-400 font-mono">
                    GPS Accuracy: ±{order.location.accuracy}m
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={customerMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider active:scale-95 transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                  >
                    <span>🗺 Open Customer Location</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Live Google Map Preview of Customer Location */}
                <div className="rounded-xl overflow-hidden border border-slate-800 h-36 bg-slate-900 shadow-inner">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    src={`https://maps.google.com/maps?q=${orderLat},${orderLng}&z=16&output=embed`}
                    title="Customer Saved GPS Location"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
                <p>No GPS coordinates were captured for this order.</p>
                <p className="text-slate-300 font-medium">Delivery Address: {order.address}</p>
                {order.address && (
                  <a
                    href={customerMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline inline-flex items-center gap-1 text-[11px] pt-1"
                  >
                    <span>Search Address on Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Order Items & Payment Card */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              <span>Order Items &amp; Payment Summary</span>
            </h4>

            <div className="space-y-2">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 text-xs py-1 border-b border-slate-800/60 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={item.image || order.productImage}
                        alt={item.name}
                        className="w-10 h-10 object-contain rounded-lg bg-white p-1"
                      />
                      <div>
                        <div className="font-bold text-slate-100">{item.name}</div>
                        <div className="text-[11px] text-slate-400">
                          Qty: {item.quantity} {item.variantName ? `• ${item.variantName}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-cyan-400">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-between gap-3 text-xs py-1">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={order.productImage}
                      alt={order.productName}
                      className="w-10 h-10 object-contain rounded-lg bg-white p-1"
                    />
                    <div>
                      <div className="font-bold text-slate-100">{order.productName}</div>
                      <div className="text-[11px] text-slate-400">Variant: {order.selectedVariant || 'Standard'}</div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-cyan-400">
                    ₹{(order.productPrice || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Payment Mode: </span>
                <span className="font-bold text-amber-400 uppercase">
                  {order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : order.paymentMethod.toUpperCase()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[11px]">Total: </span>
                <span className="text-base font-black text-slate-100">
                  ₹{(order.productPrice || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Order Tracking Flow & Status Update */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" />
              <span>Order Tracking &amp; Status Controls</span>
            </h4>

            {/* Tracking Steps Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {ORDER_STATUS_STEPS.map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setSelectedStatus(step)}
                  className={`p-2 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer ${
                    selectedStatus === step
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-[9px] uppercase opacity-75">Status</div>
                  <div className="truncate">{step}</div>
                </button>
              ))}
            </div>

            {/* Tracking Note */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Add Tracking Note / Courier Docket Number:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={trackingNote}
                  onChange={(e) => setTrackingNote(e.target.value)}
                  placeholder="e.g. Dispatched via Express Boy Rahul (Ph: 9830000000)"
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={handleSaveStatus}
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase transition-all cursor-pointer whitespace-nowrap disabled:opacity-60"
                >
                  {isUpdating ? 'Saving...' : 'Update Status'}
                </button>
              </div>
            </div>

            {/* Tracking Timeline Log */}
            {order.trackingEvents && order.trackingEvents.length > 0 && (
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-500">Tracking History:</span>
                <div className="space-y-1">
                  {order.trackingEvents.map((ev, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-100">{ev.status}</span>
                        <span className="text-slate-500 text-[10px] ml-1.5">({ev.timestamp})</span>
                        {ev.note && <div className="text-slate-400 text-[10px] italic">{ev.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
  );
};
