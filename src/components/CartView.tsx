import React from 'react';
import { CartItem } from '../types';
import { 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ShieldCheck, 
  Truck, 
  ArrowRight 
} from 'lucide-react';

interface CartViewProps {
  cart: CartItem[];
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  onContinueShopping: () => void;
}

export const CartView: React.FC<CartViewProps> = ({
  cart,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  onContinueShopping
}) => {
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPayable = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalMrp = cart.reduce((sum, item) => sum + (item.mrp || Math.round(item.price * 1.25)) * item.quantity, 0);
  const totalDiscount = totalMrp - totalPayable;

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center pb-20">
        <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4 shadow-xl">
          <ShoppingBag className="w-10 h-10 text-cyan-400/50" />
        </div>
        <h2 className="text-xl font-bold text-slate-200 mb-1">Your Shopping Cart is Empty</h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-6">
          Explore our certified pre-owned and new flagship smartphones, smartwatches, and accessories.
        </p>
        <button
          onClick={onContinueShopping}
          className="px-6 py-3 rounded-xl text-xs sm:text-sm font-extrabold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:brightness-110 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
        >
          Shop Latest Gadgets
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28">
      {/* Top Navbar */}
      <div className="sticky top-14 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <button
          onClick={onContinueShopping}
          className="text-xs font-bold text-slate-300 hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </button>

        <button
          onClick={onClearCart}
          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-bold transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Cart</span>
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight mb-4 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-cyan-400" />
          My Shopping Cart ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cart Items List */}
          <div className="lg:col-span-7 space-y-3">
            {cart.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex gap-3.5 sm:gap-4 items-center shadow-lg transition-all"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-xl p-2 flex items-center justify-center flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-100 truncate" title={item.name}>
                    {item.name}
                  </h3>

                  {item.variantText && (
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {item.variantText}
                    </p>
                  )}

                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-sm sm:text-base font-extrabold text-cyan-400">
                      ₹ {(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                    {item.mrp && item.mrp > item.price && (
                      <span className="text-xs text-slate-500 line-through">
                        ₹ {(item.mrp * item.quantity).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center border border-slate-700 bg-slate-950 rounded-lg overflow-hidden">
                      <button
                        onClick={() => onUpdateQty(item.id, -1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-200">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQty(item.id, 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-xs font-semibold text-red-400 hover:text-red-300 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Price Breakdown Sidebar */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl sticky top-28 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3">
                Price Breakdown
              </h2>

              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Price ({totalItemsCount} items):</span>
                  <span className="text-slate-200 font-semibold">₹ {totalMrp.toLocaleString('en-IN')}</span>
                </div>

                {totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Discount Savings:</span>
                    <span>- ₹ {totalDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-400">
                  <span>Delivery Charges:</span>
                  <span className="text-emerald-400 font-bold">FREE</span>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline text-base sm:text-lg font-black text-slate-100">
                  <span>Total Payable:</span>
                  <span className="text-cyan-400">₹ {totalPayable.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onProceedToCheckout}
                  className="w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:brightness-110 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-300 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Safe & Encrypted Checkout</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 font-medium">
                  <Truck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Free doorstep handover with cash / UPI on delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
