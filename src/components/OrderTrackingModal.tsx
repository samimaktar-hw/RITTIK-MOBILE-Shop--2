import React, { useState } from 'react';
import { OrderRecord } from '../types';
import { 
  X, 
  Check, 
  MapPin, 
  Calendar, 
  Ban, 
  Clock, 
  ShieldAlert, 
  CheckCircle2
} from 'lucide-react';

interface OrderTrackingModalProps {
  order: OrderRecord;
  onClose: () => void;
  onCancelOrder: (orderId: string) => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  order,
  onClose,
  onCancelOrder
}) => {
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  const isCancelled = order.status === 'Cancelled' || order.status.toLowerCase().includes('cancel');

  // Can cancel if in early stages (Placed, Confirmed, Quality Inspection)
  const isCancellable = !isCancelled && (
    order.status === 'Order Placed' || 
    order.status === 'Confirmed & Processing' || 
    order.status === '32-Point Quality Inspection'
  );

  const steps = [
    { title: 'Order Placed', desc: order.date || 'Order registered in system' },
    { title: 'Order Confirmed', desc: 'Verified by Rittik Mobile Store' },
    { title: '32-Point Inspection', desc: 'Hardware & battery diagnostics passed' },
    { title: 'Shipped', desc: 'Dispatched with logistics courier partner' },
    { title: 'Out for Delivery', desc: 'Agent out for doorstep delivery' },
    { title: 'Delivered', desc: 'Handover complete with warranty card' },
  ];

  const getStepIndex = () => {
    if (order.status === 'Order Placed') return 0;
    if (order.status === 'Confirmed & Processing') return 1;
    if (order.status === '32-Point Quality Inspection') return 2;
    if (order.status === 'Shipped') return 3;
    if (order.status === 'Out for Delivery') return 4;
    if (order.status === 'Delivered') return 5;
    return 1;
  };

  const currentStepIdx = getStepIndex();

  const handleConfirmCancel = () => {
    onCancelOrder(order.id);
    setShowConfirmCancel(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4 pr-8">
          <div className="inline-block px-3 py-1 rounded-full text-[11px] font-black font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 mb-2">
            ORDER #{order.id}
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-100">
            Live Order Tracking
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Placed on {order.date} • {order.deliveryType === 'home' ? 'Home Delivery' : 'Store Pickup'}
          </p>
        </div>

        {/* Product Overview Card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 mb-5 flex items-center gap-3">
          <div className="w-14 h-14 bg-white rounded-xl p-1 flex items-center justify-center flex-shrink-0">
            <img src={order.productImage} alt={order.productName} className="max-h-full max-w-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-slate-200 truncate">{order.productName}</h4>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-slate-400">{order.selectedVariant || 'Standard Variant'}</span>
              <span className="font-extrabold text-cyan-400">₹ {order.productPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Status Meta Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-5 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Current Status</span>
            <span className={`font-bold inline-flex items-center gap-1 mt-0.5 ${
              isCancelled ? 'text-red-400' : 'text-cyan-400'
            }`}>
              {isCancelled ? <Ban className="w-3 h-3" /> : <Clock className="w-3 h-3 animate-spin" style={{ animationDuration: '6s' }} />}
              {order.status}
            </span>
          </div>

          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Expected Delivery</span>
            <span className="font-bold text-slate-200 inline-flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3 text-cyan-400" />
              {order.expectedDelivery || '2 - 3 Business Days'}
            </span>
          </div>

          <div className="col-span-2 pt-2 border-t border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Destination</span>
            <span className="text-slate-300 truncate block mt-0.5">{order.address}</span>
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span>Fulfillment Timeline</span>
            {!isCancelled && (
              <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                Live Status
              </span>
            )}
          </h3>

          {isCancelled ? (
            <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-2xl text-xs text-red-300 space-y-1">
              <div className="flex items-center gap-2 font-bold text-red-200">
                <Ban className="w-4 h-4 text-red-400" />
                Order Cancelled
              </div>
              <p className="text-slate-400 text-[11px]">
                This order was cancelled on {order.cancelledAt || 'recently'}. No further delivery attempts will occur.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {steps.map((step, idx) => {
                const isCompleted = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={idx} className="relative">
                    {/* Circle Indicator */}
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                          : isCurrent
                          ? 'bg-cyan-400 border-cyan-400 text-slate-950 ring-4 ring-cyan-500/20 shadow-md shadow-cyan-500/40 animate-pulse'
                          : 'bg-slate-900 border-slate-700 text-slate-500'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                    </div>

                    <div>
                      <h4
                        className={`text-xs font-bold leading-none ${
                          isCurrent
                            ? 'text-cyan-300 font-extrabold'
                            : isCompleted
                            ? 'text-slate-200'
                            : 'text-slate-500'
                        }`}
                      >
                        {step.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cancellation Section */}
        {isCancellable && !showConfirmCancel && (
          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => setShowConfirmCancel(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-red-400 bg-red-950/40 hover:bg-red-900/40 border border-red-500/30 transition-colors"
            >
              Cancel This Order
            </button>
          </div>
        )}

        {/* Confirm Cancellation Dialog */}
        {showConfirmCancel && (
          <div className="p-4 bg-slate-950 border border-red-500/40 rounded-2xl text-xs space-y-3">
            <div className="flex items-center gap-2 text-red-400 font-bold">
              <ShieldAlert className="w-4 h-4" />
              <span>Are you sure you want to cancel this order?</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Once cancelled, the delivery and inspection process will be stopped immediately.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmCancel(false)}
                className="flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Keep Order
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 py-2 px-3 rounded-lg text-xs font-extrabold bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
