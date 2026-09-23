import React from 'react';
import { OrderRecord } from '../types';
import { CheckCircle2, ArrowRight, ShoppingBag, Truck, MapPin } from 'lucide-react';

interface OrderSuccessViewProps {
  order: OrderRecord;
  onViewOrders: () => void;
  onContinueShopping: () => void;
}

export const OrderSuccessView: React.FC<OrderSuccessViewProps> = ({
  order,
  onViewOrders,
  onContinueShopping
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-12 pb-24">
      <div className="max-w-xl w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
        {/* Animated Checkmark Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 fill-emerald-500/20 text-emerald-400" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-100 mb-1 tracking-tight">
          Order Confirmed!
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto mb-4">
          Thank you for choosing Rittik Mobile Shop. Your order is registered and our team is preparing it for 32-point inspection.
        </p>

        {/* Order ID Badge */}
        <div className="inline-block px-4 py-1.5 rounded-full text-xs font-black text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 mb-6 font-mono tracking-wider">
          ORDER #{order.id}
        </div>

        {/* Receipt Table */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 text-left text-xs sm:text-sm space-y-2.5 mb-6">
          <div className="flex justify-between text-slate-400">
            <span>Customer Name:</span>
            <span className="font-bold text-slate-200">{order.customerName}</span>
          </div>

          <div className="flex justify-between text-slate-400">
            <span>Contact Phone:</span>
            <span className="font-bold text-slate-200">{order.customerPhone}</span>
          </div>

          <div className="flex justify-between text-slate-400">
            <span>Fulfillment Type:</span>
            <span className="font-bold text-cyan-400 flex items-center gap-1">
              {order.deliveryType === 'home' ? <Truck className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
              {order.deliveryType === 'home' ? 'Fast Doorstep Delivery' : 'Store Pickup'}
            </span>
          </div>

          <div className="flex justify-between text-slate-400 items-start">
            <span>Delivery Address:</span>
            <span className="font-medium text-slate-200 text-right max-w-[240px] truncate-2">
              {order.address}
            </span>
          </div>

          <div className="flex justify-between text-slate-400">
            <span>Payment Method:</span>
            <span className="font-bold text-slate-200 uppercase">
              {order.paymentMethod === 'cod' ? 'Cash on Delivery' : (order.paymentMethod === 'upi' ? 'UPI QR on Handover' : 'Store Counter')}
            </span>
          </div>

          {/* Items breakdown */}
          <div className="pt-3 border-t border-slate-800 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Items Ordered:
            </span>
            {order.items.map((i, idx) => (
              <div key={idx} className="flex justify-between text-xs text-slate-300">
                <span className="truncate max-w-[250px]">• {i.name} (x{i.quantity})</span>
                <span className="font-semibold text-slate-200">
                  ₹ {(i.price * i.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline font-black text-base text-slate-100">
            <span>Total Payable:</span>
            <span className="text-cyan-400 text-lg">₹ {order.productPrice.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onViewOrders}
            className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:brightness-110 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Track in My Orders</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onContinueShopping}
            className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </button>
        </div>
      </div>
    </div>
  );
};
