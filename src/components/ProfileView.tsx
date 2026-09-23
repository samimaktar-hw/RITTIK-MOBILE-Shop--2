import React, { useState } from 'react';
import { OrderRecord, CartItem, Product, SellRequest, CustomerProfile } from '../types';
import { 
  Package, 
  ShoppingBag, 
  Heart, 
  RotateCcw, 
  User, 
  MapPin, 
  Clock, 
  Ban, 
  CheckCircle2, 
  Truck, 
  ExternalLink,
  Trash2,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  LogOut,
  Sparkles
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { OrderTrackingModal } from './OrderTrackingModal';

interface ProfileViewProps {
  orders: OrderRecord[];
  cart: CartItem[];
  favorites: Record<string, boolean>;
  allProducts: Product[];
  sellRequests: SellRequest[];
  currentUser?: FirebaseUser | null;
  userProfile?: CustomerProfile | null;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  onOpenCart: () => void;
  onViewProduct: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onRemoveFavorite: (productId: string) => void;
  onCancelOrder: (orderId: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  orders,
  cart,
  favorites,
  allProducts,
  sellRequests,
  currentUser,
  userProfile,
  onOpenAuthModal,
  onLogout,
  onOpenCart,
  onViewProduct,
  onAddToCart,
  onRemoveFavorite,
  onCancelOrder
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'cart' | 'favs' | 'sells'>('orders');
  const [trackingOrder, setTrackingOrder] = useState<OrderRecord | null>(null);

  const favoriteProducts = allProducts.filter((p) => favorites[p.id]);

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('cancel')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-950/60 text-red-400 border border-red-500/30">
          <Ban className="w-3 h-3" />
          Cancelled
        </span>
      );
    }
    if (s.includes('delivered')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" />
          Delivered
        </span>
      );
    }
    if (s.includes('shipped') || s.includes('out for delivery')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-950/60 text-sky-400 border border-sky-500/30">
          <Truck className="w-3 h-3" />
          In Transit
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-500/30">
        <Clock className="w-3 h-3" />
        Processing
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* Profile Card */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        {currentUser ? (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 p-0.5 flex-shrink-0 shadow-lg shadow-amber-500/20">
                <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-amber-400 font-black text-xl">
                  {(userProfile?.name || currentUser.displayName || 'Customer').charAt(0).toUpperCase()}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-black text-slate-100">
                    {userProfile?.name || currentUser.displayName || 'Customer'}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Customer
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Status: {userProfile?.accountStatus || 'Active'}
                  </span>
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-3 mt-1.5 flex-wrap text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    {currentUser.email || 'No email'}
                  </span>
                  {userProfile?.mobile && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      {userProfile.mobile}
                    </span>
                  )}
                  {userProfile?.createdDate && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Joined {new Date(userProfile.createdDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="mt-2 text-[10px] font-mono text-slate-500 truncate max-w-xs sm:max-w-md">
                  UID: <span className="text-slate-400">{currentUser.uid}</span>
                </div>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3.5 py-2 rounded-xl border border-slate-700/80 hover:border-red-500/50 text-slate-300 hover:text-red-400 hover:bg-red-950/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer self-center sm:self-start"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span>Log Out</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 flex-shrink-0 border border-slate-700">
                <User className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-100">
                  Guest Browsing Mode
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sign in or create an account to view and synchronize your orders across all your devices.
                </p>
              </div>
            </div>

            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/25 hover:brightness-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4" />
                <span>Login / Sign Up</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4-Tab Navigation Grid */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`p-3 rounded-2xl border text-center transition-all ${
              activeTab === 'orders'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20 border-cyan-400 scale-[1.02]'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Package className="w-4 h-4 mx-auto mb-1" />
            <div className="text-xs font-bold">My Orders ({orders.length})</div>
          </button>

          <button
            onClick={() => setActiveTab('cart')}
            className={`p-3 rounded-2xl border text-center transition-all ${
              activeTab === 'cart'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20 border-cyan-400 scale-[1.02]'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4 mx-auto mb-1" />
            <div className="text-xs font-bold">Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</div>
          </button>

          <button
            onClick={() => setActiveTab('favs')}
            className={`p-3 rounded-2xl border text-center transition-all ${
              activeTab === 'favs'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20 border-cyan-400 scale-[1.02]'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Heart className="w-4 h-4 mx-auto mb-1" />
            <div className="text-xs font-bold">Favorites ({favoriteProducts.length})</div>
          </button>

          <button
            onClick={() => setActiveTab('sells')}
            className={`p-3 rounded-2xl border text-center transition-all ${
              activeTab === 'sells'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20 border-cyan-400 scale-[1.02]'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <RotateCcw className="w-4 h-4 mx-auto mb-1" />
            <div className="text-xs font-bold">Sell Requests ({sellRequests.length})</div>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
        {/* TAB 1: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Order History & Live Tracking</span>
              <span className="text-xs text-slate-500">{orders.length} total</span>
            </h2>

            {orders.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
                No orders placed yet. Choose a flagship phone and place an order with Cash on Delivery!
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div>
                      <span className="font-mono text-xs font-black text-cyan-400 tracking-wider">
                        ORDER #{order.id}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Placed on {order.date} • {order.deliveryType === 'home' ? 'Fast Home Delivery' : 'Store Pickup'}
                      </div>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-16 bg-white rounded-xl p-1.5 flex items-center justify-center flex-shrink-0">
                      <img src={order.productImage} alt={order.productName} className="max-h-full max-w-full object-contain" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                        {order.productName}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {order.selectedVariant || 'Standard Variant'}
                      </p>
                      <p className="text-xs sm:text-sm font-black text-cyan-400 mt-1">
                        ₹ {order.productPrice.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                      {order.address}
                    </span>

                    <button
                      onClick={() => setTrackingOrder(order)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:brightness-110 shadow-md shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Track Order</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: CART PREVIEW */}
        {activeTab === 'cart' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Shopping Cart Items ({cart.length})
            </h2>

            {cart.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
                Your cart is empty.
              </div>
            ) : (
              <>
                <div className="space-y-2.5">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex items-center gap-3"
                    >
                      <img src={item.image} alt={item.name} className="w-12 h-12 bg-white rounded-lg p-1 object-contain" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-200 truncate">{item.name}</h4>
                        <p className="text-[11px] text-cyan-400 font-extrabold">
                          ₹ {(item.price * item.quantity).toLocaleString('en-IN')} (Qty: {item.quantity})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={onOpenCart}
                  className="w-full py-3 px-4 rounded-xl text-xs font-extrabold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:brightness-110 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
                >
                  Open Full Cart & Proceed to Checkout
                </button>
              </>
            )}
          </div>
        )}

        {/* TAB 3: FAVORITES */}
        {activeTab === 'favs' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Saved Wishlist ({favoriteProducts.length})
            </h2>

            {favoriteProducts.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
                No favorites saved yet. Click the heart icon on any device to save it!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {favoriteProducts.map((p) => (
                  <div
                    key={p.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 shadow-lg"
                  >
                    <div 
                      onClick={() => onViewProduct(p.id)}
                      className="w-16 h-16 bg-white rounded-xl p-1.5 flex items-center justify-center flex-shrink-0 cursor-pointer"
                    >
                      <img src={p.images[0]} alt={p.name} className="max-h-full max-w-full object-contain" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 
                        onClick={() => onViewProduct(p.id)}
                        className="text-xs font-bold text-slate-200 truncate cursor-pointer hover:text-cyan-400 transition-colors"
                      >
                        {p.name}
                      </h4>
                      <p className="text-xs font-black text-cyan-400 mt-0.5">
                        ₹ {p.price.toLocaleString('en-IN')}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => onAddToCart(p)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 hover:bg-cyan-900"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() => onRemoveFavorite(p.id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                          title="Remove from favorites"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SELL REQUESTS */}
        {activeTab === 'sells' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              My Phone Sell Requests ({sellRequests.length})
            </h2>

            {sellRequests.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
                No phone sell requests submitted yet. Use our Instant Phone Valuation to sell old devices at maximum market rate.
              </div>
            ) : (
              sellRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      REQUEST #{req.id}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-500/30">
                      {req.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      {req.images && req.images.length > 0 && (
                        <img src={req.images[0]} alt={req.name} className="w-14 h-14 object-cover rounded-xl bg-slate-950 border border-slate-800 shrink-0" />
                      )}
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-100">{req.name}</h4>
                        <p className="text-xs font-bold text-emerald-400 mt-0.5">
                          Expected Price: ₹ {Number(req.price).toLocaleString('en-IN')}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Contact: {req.contact} • {req.address}</p>
                      </div>
                    </div>

                    {req.images && req.images.length > 1 && (
                      <div className="flex gap-1.5 overflow-x-auto pt-1">
                        {req.images.map((imgUrl, idx) => (
                          <img
                            key={idx}
                            src={imgUrl}
                            alt={`Photo ${idx + 1}`}
                            className="w-12 h-12 object-cover rounded-lg border border-slate-800 bg-slate-950 shrink-0"
                          />
                        ))}
                      </div>
                    )}

                    {/* Messages from Admin */}
                    {req.messages && req.messages.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                          Updates &amp; Messages from Store Admin:
                        </span>
                        <div className="space-y-1">
                          {req.messages.map((m) => (
                            <div
                              key={m.id}
                              className={`p-2 rounded-xl text-xs ${
                                m.sender === 'admin'
                                  ? 'bg-cyan-950/60 border border-cyan-500/30 text-cyan-200'
                                  : 'bg-slate-800 border border-slate-700 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                                <span className="font-bold">
                                  {m.sender === 'admin' ? 'Store Administrator' : 'You'}
                                </span>
                                <span>{m.createdAt}</span>
                              </div>
                              <p>{m.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Tracking Modal */}
      {trackingOrder && (
        <OrderTrackingModal
          order={trackingOrder}
          onClose={() => setTrackingOrder(null)}
          onCancelOrder={(id) => {
            onCancelOrder(id);
            const updated = orders.find(o => o.id === id);
            if (updated) setTrackingOrder({ ...updated, status: 'Cancelled' });
          }}
        />
      )}
    </div>
  );
};
