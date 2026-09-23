import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Package, 
  RotateCcw, 
  ShoppingBag, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Image as ImageIcon, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink, 
  ArrowLeft,
  Search,
  Sparkles,
  Phone,
  User,
  Clock,
  RefreshCw,
  Eye,
  Sliders,
  Store,
  MapPin,
  Share2,
  Calendar,
  Truck,
  Navigation,
  Loader2
} from 'lucide-react';
import { Product, SellRequest, OrderRecord, OrderStatus, OrderTrackingEvent } from '../types';
import { useStoreLogo, DEFAULT_STORE_LOGO } from '../utils/logoManager';
import { auth, db } from '../firebase';
import { getAdminConfig, logoutAdmin } from '../utils/adminAuth';
import { doc, deleteDoc, setDoc } from 'firebase/firestore';
import { getRealDeviceGpsPosition } from '../utils/gpsLocationHelper';
import { saveShopLocationToFirebase } from '../utils/storeSettingsManager';

// Subcomponents
import { ProductEditModal } from './admin/ProductEditModal';
import { OrderDetailsModal } from './admin/OrderDetailsModal';
import { SellRequestDetailsModal } from './admin/SellRequestDetailsModal';
import { ShopSettingsTab } from './admin/ShopSettingsTab';

interface AdminPanelProps {
  products: Product[];
  sellRequests: SellRequest[];
  orders: OrderRecord[];
  onBackToStore: () => void;
  onLaunchProduct: (product: Product) => void;
  onUpdateSellRequest: (requestId: string, status: string) => void;
  onSelectProduct?: (productId: string) => void;
  onDeleteProduct?: (productId: string) => void;
  onUpdateOrderStatus?: (orderId: string, status: OrderStatus, trackingEvent?: OrderTrackingEvent) => void;
  onToggleStock?: (productId: string) => void;
  onShowToast?: (msg: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  products,
  sellRequests,
  orders,
  onBackToStore,
  onLaunchProduct,
  onUpdateSellRequest,
  onSelectProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onToggleStock,
  onShowToast = () => {}
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'sells' | 'shop' | 'logo'>('products');
  const [currentStoreLogo, setStoreLogoInFirebase] = useStoreLogo();
  
  // Website Logo Control States
  const [logoInputUrl, setLogoInputUrl] = useState(currentStoreLogo);
  const [previewLogoUrl, setPreviewLogoUrl] = useState(currentStoreLogo);
  const [logoSaving, setLogoSaving] = useState(false);
  const [logoSaveSuccess, setLogoSaveSuccess] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  // Admin Account Details
  const [adminUid, setAdminUid] = useState<string>('');
  const [adminEmail, setAdminEmail] = useState<string>('');

  // Product Modals & States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Order Details Modal
  const [viewingOrder, setViewingOrder] = useState<OrderRecord | null>(null);

  // Sell Request Details Modal
  const [viewingSellRequest, setViewingSellRequest] = useState<SellRequest | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState<'all' | 'in-stock' | 'out-of-stock' | 'new' | 'used'>('all');

  // Location Geolocation State
  const [isDetectingAdminLocation, setIsDetectingAdminLocation] = useState(false);

  const handleAdminUseCurrentLocation = async () => {
    setIsDetectingAdminLocation(true);
    try {
      const coords = await getRealDeviceGpsPosition();
      await saveShopLocationToFirebase(coords.latitude, coords.longitude, coords.accuracy);
      onShowToast(`📍 Shop coordinates saved to Firebase: ${coords.latitude}, ${coords.longitude}`);
    } catch (err: any) {
      onShowToast(err?.message || '❌ Unable to detect current location.');
    } finally {
      setIsDetectingAdminLocation(false);
    }
  };

  useEffect(() => {
    // Sync current logo to inputs
    setLogoInputUrl(currentStoreLogo);
    setPreviewLogoUrl(currentStoreLogo);

    // Fetch verified admin credentials
    getAdminConfig().then((cfg) => {
      if (cfg) {
        setAdminUid(cfg.adminUid);
        setAdminEmail(cfg.adminEmail);
      } else if (auth.currentUser) {
        setAdminUid(auth.currentUser.uid);
        setAdminEmail(auth.currentUser.email || '');
      }
    });
  }, [currentStoreLogo]);

  // Handle Logo Save
  const handleSaveLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogoError(null);
    setLogoSaveSuccess(false);

    const cleanUrl = logoInputUrl.trim();
    if (!cleanUrl) {
      setLogoError('Please provide a valid image URL for the website logo.');
      return;
    }

    setLogoSaving(true);
    try {
      await setStoreLogoInFirebase(cleanUrl);
      setPreviewLogoUrl(cleanUrl);
      setLogoSaveSuccess(true);
      onShowToast('Store logo updated and synchronized with Firebase! 🌟');
      setTimeout(() => setLogoSaveSuccess(false), 3500);
    } catch (err: any) {
      console.error('Error saving logo:', err);
      setLogoError(err?.message || 'Failed to save logo to Firebase.');
    } finally {
      setLogoSaving(false);
    }
  };

  // Reset to Default Store Logo
  const handleResetDefaultLogo = async () => {
    setLogoError(null);
    setLogoSaving(true);
    try {
      await setStoreLogoInFirebase(DEFAULT_STORE_LOGO);
      setLogoInputUrl(DEFAULT_STORE_LOGO);
      setPreviewLogoUrl(DEFAULT_STORE_LOGO);
      setLogoSaveSuccess(true);
      onShowToast('Reset to default Rittik Mobile Shop logo.');
      setTimeout(() => setLogoSaveSuccess(false), 3500);
    } catch (err: any) {
      setLogoError(err?.message || 'Failed to reset logo.');
    } finally {
      setLogoSaving(false);
    }
  };

  // Open "Add New Product"
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  // Open "Edit Product"
  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setIsProductModalOpen(true);
  };

  // Save product from modal
  const handleSaveProductFromModal = (savedProduct: Product) => {
    onLaunchProduct(savedProduct);
    onShowToast(`✅ "${savedProduct.name}" saved to store catalog!`);
  };

  // Permanent Delete Product with Firestore removal
  const handleDeleteProductConfirmed = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (err) {
      console.warn('Firestore delete error:', err);
    }

    if (onDeleteProduct) {
      onDeleteProduct(productId);
    }
    setDeleteConfirmId(null);
    onShowToast('Product permanently deleted from store catalog.');
  };

  // Stock status toggle with Firestore persistence
  const handleToggleStockDirect = async (p: Product) => {
    const nextState = !p.outOfStock;
    try {
      await setDoc(doc(db, 'products', p.id), { outOfStock: nextState }, { merge: true });
    } catch (err) {
      console.warn('Firestore stock toggle error:', err);
    }

    if (onToggleStock) {
      onToggleStock(p.id);
    }
    onShowToast(`"${p.name}" marked as ${nextState ? 'Out of Stock' : 'In Stock'}`);
  };

  // Secure Admin Logout
  const handleAdminLogout = async () => {
    await logoutAdmin();
    onBackToStore();
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (productFilter === 'in-stock') return !p.outOfStock;
    if (productFilter === 'out-of-stock') return !!p.outOfStock;
    if (productFilter === 'new') return p.conditionType === 'new';
    if (productFilter === 'used') return p.conditionType !== 'new';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Admin Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-amber-500/30 px-4 sm:px-6 py-3 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-black">
              <ShieldCheck className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-100 tracking-tight">
                  Rittik Mobile Shop
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase border border-amber-500/30">
                  Admin Control Center
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Authorized Admin: <span className="text-amber-300 font-mono font-bold">{adminEmail || auth.currentUser?.email || 'admin'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAdminUseCurrentLocation}
              disabled={isDetectingAdminLocation}
              title="Use Current Location"
              aria-label="Use Current Location"
              data-testid="admin-header-use-current-location-btn"
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
            >
              {isDetectingAdminLocation ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Detecting...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Use Current Location</span>
                </>
              )}
            </button>

            <button
              onClick={onBackToStore}
              className="px-3 py-1.5 rounded-xl border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Store</span>
            </button>

            <button
              onClick={handleAdminLogout}
              className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Secure Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'products'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 scale-[1.02]'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products Catalog ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 scale-[1.02]'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Customer Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sells')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'sells'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 scale-[1.02]'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Sell Requests ({sellRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('shop')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'shop'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 scale-[1.02]'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Mobile Shop &amp; Location</span>
          </button>

          <button
            onClick={() => setActiveTab('logo')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'logo'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 scale-[1.02]'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Website Logo &amp; Branding</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT AREAS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        
        {/* ======================================================== */}
        {/* TAB 1: PRODUCTS CATALOG & INVENTORY                      */}
        {/* ======================================================== */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex-1 flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[220px] max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products by name or brand..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-[11px] font-bold">
                  {(['all', 'in-stock', 'out-of-stock', 'new', 'used'] as const).map((filterKey) => (
                    <button
                      key={filterKey}
                      onClick={() => setProductFilter(filterKey)}
                      className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer capitalize ${
                        productFilter === filterKey
                          ? 'bg-cyan-500 text-slate-950 font-black'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {filterKey.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleOpenAddProduct}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 hover:brightness-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </button>
            </div>

            {/* Products Table / Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg relative group"
                >
                  <div>
                    {/* Image Area */}
                    <div className="w-full h-44 rounded-2xl bg-slate-950/80 flex items-center justify-center p-3 relative overflow-hidden mb-3">
                      <img
                        src={p.images?.[0] || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80'}
                        alt={p.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
                        {p.conditionType === 'new' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            NEW
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            2ND HAND
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/90 border border-slate-700 text-slate-300">
                          {p.condition || 'Superb'}
                        </span>
                      </div>

                      {p.outOfStock && (
                        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="px-3 py-1 rounded-xl bg-red-950/90 border border-red-500/60 text-red-300 text-xs font-black uppercase tracking-wider">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                      {p.brand}
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-100 line-clamp-1">
                      {p.name}
                    </h3>
                    
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-base font-black text-slate-100">
                        ₹{p.price.toLocaleString('en-IN')}
                      </span>
                      {p.mrp && p.mrp > p.price && (
                        <span className="text-xs text-slate-500 line-through">
                          ₹{p.mrp.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-2">
                      <span>{p.highlights?.ram || '8GB'} / {p.highlights?.rom || '128GB'}</span>
                      <span>•</span>
                      <span>{p.warranty || '6 Mo Warranty'}</span>
                    </div>
                  </div>

                  {/* Card Controls: Toggle Stock, Edit, Delete, View */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleStockDirect(p)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                        p.outOfStock
                          ? 'bg-red-950/60 border border-red-500/40 text-red-400 hover:bg-red-900'
                          : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-900'
                      }`}
                      title="Toggle in-stock / out-of-stock"
                    >
                      {p.outOfStock ? 'Out of Stock' : 'In Stock'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditProduct(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit product details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {onSelectProduct && (
                        <button
                          onClick={() => onSelectProduct(p.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="View on Customer Store"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => setDeleteConfirmId(p.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800">
                <Package className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-300">No products match your search or filter</h3>
                <p className="text-xs text-slate-500 mt-1">Try another search term or click "Add New Product" above.</p>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: CUSTOMER ORDERS & FULFILLMENT                     */}
        {/* ======================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-100">
                  Customer Orders &amp; Fulfillment
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any order to view customer details, Google Maps location coordinates, share with delivery boy, and update tracking status.
                </p>
              </div>
              <span className="text-xs font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1 rounded-full">
                {orders.length} Total Orders
              </span>
            </div>

            <div className="space-y-3">
              {orders.map((o) => (
                <div
                  key={o.id}
                  onClick={() => setViewingOrder(o)}
                  className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-md cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={o.productImage}
                      alt={o.productName}
                      className="w-14 h-14 object-contain rounded-xl bg-white p-1.5 shrink-0"
                    />

                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-xs font-black text-cyan-400">
                          #{o.id}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                          {o.status}
                        </span>
                        {o.location && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            <span>GPS Located</span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-sm text-slate-100 group-hover:text-cyan-400 transition-colors">
                        {o.productName}
                      </h3>

                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className="text-slate-300 font-medium">Customer: {o.customerName}</span>
                        <span>•</span>
                        <span>{o.customerPhone}</span>
                        <span>•</span>
                        <span>{o.date || 'Recent'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-0 pt-3 sm:pt-0 border-slate-800">
                    <div className="text-right">
                      <div className="text-base font-black text-slate-100">
                        ₹{(o.productPrice || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-amber-400 font-bold uppercase">
                        {o.paymentMethod === 'cod' ? 'Cash on Delivery' : o.paymentMethod.toUpperCase()}
                      </div>
                    </div>

                    <span className="mt-2 text-xs text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">
                      <span>View &amp; Track</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}

              {orders.length === 0 && (
                <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800">
                  <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-slate-300">No customer orders placed yet</h3>
                  <p className="text-xs text-slate-500 mt-1">Orders placed on the storefront will appear here instantly.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: SELL PHONE TRADE-IN REQUESTS                      */}
        {/* ======================================================== */}
        {activeTab === 'sells' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-100">
                  Customer Trade-in &amp; Sell Phone Submissions
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any submission to view device specifications, inspect customer uploaded photos in full-screen lightbox, message seller, and launch live to catalog.
                </p>
              </div>
              <span className="text-xs font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1 rounded-full">
                {sellRequests.length} Trade-ins
              </span>
            </div>

            <div className="space-y-3">
              {sellRequests.map((req) => (
                <div
                  key={req.id}
                  onClick={() => setViewingSellRequest(req)}
                  className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-md cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={req.images?.[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80'}
                      alt={req.name}
                      className="w-14 h-14 object-cover rounded-xl border border-slate-700 shrink-0"
                    />

                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-xs font-black text-cyan-400">
                          #{req.id}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {req.status}
                        </span>
                        {req.images && req.images.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                            <Eye className="w-2.5 h-2.5" />
                            <span>{req.images.length} Photos</span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-sm text-slate-100 group-hover:text-cyan-400 transition-colors">
                        {req.deviceName || req.name}
                      </h3>

                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className="text-slate-300 font-medium">Seller: {req.sellerName || 'Customer'}</span>
                        <span>•</span>
                        <span>Phone: {req.contact}</span>
                        <span>•</span>
                        <span>Condition: {req.condition || 'Good'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-0 pt-3 sm:pt-0 border-slate-800">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Expected:</div>
                      <div className="text-base font-black text-cyan-400">
                        ₹{(req.expectedPrice || req.price || 0).toLocaleString('en-IN')}
                      </div>
                    </div>

                    <span className="mt-2 text-xs text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">
                      <span>Inspect Details</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}

              {sellRequests.length === 0 && (
                <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800">
                  <RotateCcw className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-slate-300">No trade-in submissions received</h3>
                  <p className="text-xs text-slate-500 mt-1">Customer sell requests submitted online will appear here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: MOBILE SHOP DETAILS & LOCATION CONTROL            */}
        {/* ======================================================== */}
        {activeTab === 'shop' && (
          <ShopSettingsTab onShowToast={onShowToast} />
        )}

        {/* ======================================================== */}
        {/* TAB 5: WEBSITE LOGO & BRANDING                           */}
        {/* ======================================================== */}
        {activeTab === 'logo' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-amber-400 font-black text-xs uppercase tracking-widest">
                  Control System
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 mb-2">
                WEBSITE LOGO CONTROL
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Replace or customize the store logo shown on the customer header and website. The image URL is synchronized real-time to Firebase and saved across all visitor sessions.
              </p>

              {logoSaveSuccess && (
                <div className="mb-5 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 animate-bounce">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="font-bold">Website logo updated and synchronized with Firebase!</span>
                </div>
              )}

              {logoError && (
                <div className="mb-5 p-3.5 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{logoError}</span>
                </div>
              )}

              <form onSubmit={handleSaveLogo} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Logo Image URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={logoInputUrl}
                      onChange={(e) => setLogoInputUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      required
                      className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Supports high-resolution PNG, SVG, WEBP, JPG or ImgBB image URLs.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={logoSaving}
                    className="py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {logoSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Save Logo to Website</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewLogoUrl(logoInputUrl.trim())}
                    className="py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
                  >
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span>Preview URL</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetDefaultLogo}
                    disabled={logoSaving}
                    className="py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer border border-slate-800 ml-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset to Default</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Preview Box */}
            <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-cyan-400 font-black text-xs uppercase tracking-widest block mb-1">
                  Real-time Visual Check
                </span>
                <h3 className="text-lg font-black text-slate-100 mb-4">
                  Website Header Logo Preview
                </h3>

                {/* Simulated Header Bar */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-4">
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-2">Simulated Customer Header</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center overflow-hidden border border-slate-700 shadow-sm">
                        <img
                          src={previewLogoUrl}
                          alt="Store Logo Preview"
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <span className="font-extrabold text-sm text-slate-100">Rittik Mobile Shop</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">5-Click Trigger Active</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 space-y-2">
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span>Admin UID:</span>
                    <span className="font-mono text-cyan-400 truncate max-w-[150px]">{adminUid || 'Verified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Access Method:</span>
                    <span className="text-amber-300 font-bold">5-Rapid Logo Clicks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODALS                                                   */}
      {/* ======================================================== */}

      {/* Add / Edit Product Modal */}
      <ProductEditModal
        product={editingProduct}
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProductFromModal}
      />

      {/* Order Details & Tracking Modal */}
      <OrderDetailsModal
        order={viewingOrder}
        isOpen={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
        onUpdateStatus={(orderId, status, trackingEvent) => {
          if (onUpdateOrderStatus) onUpdateOrderStatus(orderId, status, trackingEvent);
          if (viewingOrder && viewingOrder.id === orderId) {
            setViewingOrder((prev) => prev ? {
              ...prev,
              status,
              trackingEvents: trackingEvent ? [...(prev.trackingEvents || []), trackingEvent] : prev.trackingEvents
            } : null);
          }
        }}
        onShowToast={onShowToast}
      />

      {/* Sell Request Details & Messaging Modal */}
      <SellRequestDetailsModal
        request={viewingSellRequest}
        isOpen={!!viewingSellRequest}
        onClose={() => setViewingSellRequest(null)}
        onUpdateStatus={(reqId, status) => {
          onUpdateSellRequest(reqId, status);
          if (viewingSellRequest && viewingSellRequest.id === reqId) {
            setViewingSellRequest((prev) => prev ? { ...prev, status } : null);
          }
        }}
        onLaunchProduct={onLaunchProduct}
        onShowToast={onShowToast}
      />

      {/* Delete Product Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-red-500/40 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-500/50 flex items-center justify-center mx-auto text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-100">Delete Product?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to permanently delete this device from the store catalog? This action will remove it from Firebase.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteProductConfirmed(deleteConfirmId)}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 cursor-pointer transition-all active:scale-95"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
