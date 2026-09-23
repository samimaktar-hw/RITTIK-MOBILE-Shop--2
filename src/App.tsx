import React, { useState, useEffect } from 'react';
import { 
  AppView, 
  LanguageCode, 
  Product, 
  ProductVariant, 
  CartItem, 
  OrderRecord, 
  OrderStatus,
  OrderTrackingEvent,
  SellRequest,
  CustomerProfile,
  PendingAuthAction
} from './types';
import { initialProducts } from './data/products';
import { translations } from './data/translations';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { ProductDetailsView } from './components/ProductDetailsView';
import { CartView } from './components/CartView';
import { CheckoutView } from './components/CheckoutView';
import { OrderSuccessView } from './components/OrderSuccessView';
import { ProfileView } from './components/ProfileView';
import { SellPhoneView } from './components/SellPhoneView';
import { LanguageModal } from './components/LanguageModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { AdminPanel } from './components/AdminPanel';
import { AdminLoginModal } from './components/AdminLoginModal';
import { verifyUserIsAdmin } from './utils/adminAuth';
import { useStoreSettings } from './utils/storeSettingsManager';
import { 
  Home, 
  MapPin, 
  RotateCcw, 
  ShoppingBag, 
  User, 
  ShieldCheck, 
  Phone, 
  Clock, 
  Heart,
  ExternalLink
} from 'lucide-react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { auth, db } from './firebase';

export default function App() {
  const [currentLang, setCurrentLang] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem('selectedLanguage');
      if (saved === 'en' || saved === 'bn' || saved === 'hi') return saved;
    } catch {}
    return 'en';
  });
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return (localStorage.getItem('rittik_theme') as 'dark' | 'light') || 'dark';
    } catch {
      return 'dark';
    }
  });

  // Customer Authentication States
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<CustomerProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAuthAction, setPendingAuthAction] = useState<PendingAuthAction | null>(null);

  // Hidden Admin Control Center States
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);

  // Listen to Firebase Auth state changes and verify Admin UID
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Verify if logged in user is the authorized Admin UID
        verifyUserIsAdmin(user).then((res) => {
          setIsAdminAuthorized(res.isAuthorized);
          if (!res.isAuthorized && activeView === 'admin') {
            setActiveView('home');
          }
        });
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            setUserProfile(snap.data() as CustomerProfile);
          } else {
            setUserProfile({
              uid: user.uid,
              name: user.displayName || user.email?.split('@')[0] || 'Customer',
              mobile: user.phoneNumber || '',
              email: user.email || '',
              createdDate: new Date().toISOString(),
              accountStatus: 'active'
            });
          }
        } catch {
          // Local fallback
          setUserProfile({
            uid: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'Customer',
            mobile: user.phoneNumber || '',
            email: user.email || '',
            createdDate: new Date().toISOString(),
            accountStatus: 'active'
          });
        }
      } else {
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('rittik_theme', nextTheme);
    } catch {}
  };

  const handleSelectLanguage = (lang: LanguageCode) => {
    setCurrentLang(lang);
    try {
      localStorage.setItem('selectedLanguage', lang);
    } catch {}
  };

  const [activeView, setActiveView] = useState<AppView>('home');
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('rittik_products');
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialProducts;
  });
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProducts[0]?.id || 'apple-iphone-13');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [storeSettings] = useStoreSettings();

  // Sync launched products to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('rittik_products', JSON.stringify(products));
    } catch {}
  }, [products]);

  // Sync products in real-time from Firestore
  useEffect(() => {
    try {
      const q = collection(db, 'products');
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteProds: Product[] = [];
            snapshot.forEach((d) => remoteProds.push(d.data() as Product));
            setProducts((prev) => {
              const map = new Map<string, Product>();
              // Remote first
              remoteProds.forEach((p) => map.set(p.id, p));
              // Keep local
              prev.forEach((p) => {
                if (!map.has(p.id)) map.set(p.id, p);
              });
              initialProducts.forEach((p) => {
                if (!map.has(p.id)) map.set(p.id, p);
              });
              const nextList = Array.from(map.values());
              if (
                nextList.length === prev.length &&
                nextList.every((p, i) => p.id === prev[i]?.id && p.price === prev[i]?.price)
              ) {
                return prev;
              }
              return nextList;
            });
          }
        },
        (err) => {
          console.warn('Realtime products listener note:', err?.message);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Products sync setup note:', err);
    }
  }, []);

  // Sync orders in real-time from Firestore (scoped by authentication and role)
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    try {
      const isOwnerAdmin = isAdminAuthorized || currentUser.email === 'samimak7312@gmail.com';
      const q = isOwnerAdmin
        ? collection(db, 'orders')
        : query(collection(db, 'orders'), where('userId', '==', currentUser.uid));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteOrders: OrderRecord[] = [];
            snapshot.forEach((d) => remoteOrders.push(d.data() as OrderRecord));
            setOrders((prev) => {
              const map = new Map<string, OrderRecord>();
              remoteOrders.forEach((o) => map.set(o.id, o));
              prev.forEach((o) => {
                if (!map.has(o.id)) map.set(o.id, o);
              });
              return Array.from(map.values());
            });
          }
        },
        (err) => {
          console.warn('Realtime orders listener note:', err?.message);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Orders sync setup note:', err);
    }
  }, [currentUser, isAdminAuthorized]);

  // Sync sellRequests in real-time from Firestore
  useEffect(() => {
    try {
      const q = collection(db, 'sellRequests');
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteReqs: SellRequest[] = [];
            snapshot.forEach((d) => remoteReqs.push(d.data() as SellRequest));
            setSellRequests((prev) => {
              const map = new Map<string, SellRequest>();
              remoteReqs.forEach((r) => map.set(r.id, r));
              prev.forEach((r) => {
                if (!map.has(r.id)) map.set(r.id, r);
              });
              return Array.from(map.values());
            });
          }
        },
        (err) => {
          console.warn('Realtime sellRequests listener note:', err?.message);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('SellRequests sync setup note:', err);
    }
  }, []);

  // Cart State (Persisted)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('rittik_cart');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'prod-1-base',
        productId: 'prod-1',
        name: 'Apple iPhone 15 Pro Max',
        price: 64999,
        mrp: 144900,
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80',
        quantity: 1,
        variantText: '8 GB RAM | 256 GB ROM'
      }
    ];
  });

  // Favorites State (Persisted)
  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('rittik_favorites');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { 'prod-1': true, 'prod-2': true };
  });

  // Orders State (Persisted)
  const [orders, setOrders] = useState<OrderRecord[]>(() => {
    try {
      const saved = localStorage.getItem('rittik_orders');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'RMS-982145',
        customerName: 'Rittik Biswas',
        customerPhone: '9830012345',
        items: [
          {
            id: 'prod-2',
            name: 'Samsung Galaxy S24 Ultra 5G',
            price: 74999,
            mrp: 129999,
            image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80',
            quantity: 1,
            variantText: '12 GB RAM | 256 GB ROM'
          }
        ],
        productName: 'Samsung Galaxy S24 Ultra 5G',
        productPrice: 74999,
        productImage: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80',
        selectedVariant: '12 GB RAM | 256 GB ROM',
        deliveryType: 'home',
        address: 'Sector 5, Salt Lake, Kolkata, West Bengal - 700091',
        paymentMethod: 'cod',
        status: '32-Point Quality Inspection',
        date: new Date(Date.now() - 86400000).toLocaleDateString()
      }
    ];
  });

  // Sell Requests State (Persisted)
  const [sellRequests, setSellRequests] = useState<SellRequest[]>(() => {
    try {
      const saved = localStorage.getItem('rittik_sell_requests');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'SELL-48192',
        name: 'Apple iPhone 12 (128GB)',
        price: 24500,
        condition: 'Good',
        contact: '9830012345',
        address: 'Free Doorstep Pickup',
        status: 'Under Verification',
        images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80'],
        createdAt: Date.now() - 172800000
      }
    ];
  });

  // Last placed order for the success screen
  const [lastPlacedOrder, setLastPlacedOrder] = useState<OrderRecord | null>(null);

  // Sync state to local storage
  useEffect(() => {
    try {
      localStorage.setItem('rittik_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('rittik_favorites', JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem('rittik_orders', JSON.stringify(orders));
    } catch {}
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem('rittik_sell_requests', JSON.stringify(sellRequests));
    } catch {}
  }, [sellRequests]);

  // Toast handler
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Toggle Favorite
  const handleToggleFavorite = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = { ...prev, [productId]: !prev[productId] };
      if (next[productId]) {
        showToast('Saved to your Wishlist! ❤️');
      } else {
        showToast('Removed from Wishlist.');
      }
      return next;
    });
  };

  // View Product Details
  const handleViewProduct = (productId: string) => {
    setSelectedProductId(productId);
    setActiveView('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Quick Add to Cart from Card
  const handleQuickAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const itemId = `${product.id}-default`;
    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === itemId);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].quantity += 1;
        return copy;
      }
      return [
        ...prev,
        {
          id: itemId,
          productId: product.id,
          name: product.name,
          price: product.price,
          mrp: product.mrp,
          image: product.images[0],
          quantity: 1,
          variantText: `${product.highlights?.ram || '6 GB'} RAM | ${product.highlights?.rom || '128 GB'} ROM`
        }
      ];
    });
    showToast(`Added ${product.name} to cart! 🛒`);
  };

  // Add to cart with variant
  const handleAddToCartWithVariant = (product: Product, variant?: ProductVariant) => {
    const ram = variant?.ram || product.highlights?.ram || '6 GB';
    const rom = variant?.rom || product.highlights?.rom || '128 GB';
    const price = variant?.price || product.price;
    const mrp = variant?.mrp || product.mrp;
    const itemId = `${product.id}-${ram}-${rom}`;

    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === itemId);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].quantity += 1;
        return copy;
      }
      return [
        ...prev,
        {
          id: itemId,
          productId: product.id,
          name: product.name,
          price: price,
          mrp: mrp,
          image: product.images[0],
          quantity: 1,
          variantText: `${ram} RAM | ${rom} ROM`
        }
      ];
    });
    showToast(`Added ${product.name} (${ram}/${rom}) to cart! 🛒`);
  };

  // Auth Guarded Quick Add to Cart
  const handleQuickAddToCartWithAuth = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (!currentUser) {
      setPendingAuthAction({
        type: 'add_to_cart',
        product
      });
      setIsAuthModalOpen(true);
      return;
    }
    handleQuickAddToCart(e, product);
  };

  // Auth Guarded Add to Cart with Variant
  const handleAddToCartWithVariantWithAuth = (product: Product, variant?: ProductVariant) => {
    if (!currentUser) {
      setPendingAuthAction({
        type: 'add_to_cart',
        product,
        variant
      });
      setIsAuthModalOpen(true);
      return;
    }
    handleAddToCartWithVariant(product, variant);
  };

  // Auth Guarded Buy Now
  const handleBuyNowWithAuth = (product: Product, variant?: ProductVariant) => {
    if (!currentUser) {
      setPendingAuthAction({
        type: 'buy_now',
        product,
        variant
      });
      setIsAuthModalOpen(true);
      return;
    }
    handleAddToCartWithVariant(product, variant);
    setActiveView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth Guarded Quick Buy Now from Card
  const handleQuickBuyNowWithAuth = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (!currentUser) {
      setPendingAuthAction({
        type: 'buy_now',
        product
      });
      setIsAuthModalOpen(true);
      return;
    }
    handleAddToCartWithVariant(product);
    setActiveView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth Guarded Proceed to Checkout from Cart
  const handleProceedToCheckoutWithAuth = () => {
    if (!currentUser) {
      setPendingAuthAction({
        type: 'buy_now',
        product: cart[0] ? (products.find((p) => p.id === cart[0].productId) || products[0]) : products[0]
      });
      setIsAuthModalOpen(true);
      return;
    }
    setActiveView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth Success Callback
  const handleAuthSuccess = (user: FirebaseUser) => {
    setIsAuthModalOpen(false);
    showToast(`Welcome, ${user.displayName || user.email?.split('@')[0] || 'Customer'}! 👋`);

    if (pendingAuthAction) {
      const action = pendingAuthAction;
      setPendingAuthAction(null);
      if (action.type === 'add_to_cart') {
        handleAddToCartWithVariant(action.product, action.variant);
      } else if (action.type === 'buy_now') {
        handleAddToCartWithVariant(action.product, action.variant);
        setActiveView('checkout');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Auth Modal Close Callback (Cancels pending action safely)
  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
    setPendingAuthAction(null);
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast('Logged out successfully.');
    } catch {
      showToast('Error logging out.');
    }
  };

  // Cart quantity controls
  const handleUpdateQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
    showToast('Item removed from cart.');
  };

  const handleClearCart = () => {
    setCart([]);
    showToast('Cart cleared.');
  };

  // Order Placement
  const handleOrderPlaced = (order: OrderRecord) => {
    setOrders((prev) => [order, ...prev]);
    setLastPlacedOrder(order);
    setCart([]);
    setActiveView('order-success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Order Cancellation
  const handleCancelOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: 'Cancelled', cancelledAt: new Date().toLocaleDateString() }
          : o
      )
    );
    showToast(`Order #${orderId} has been cancelled.`);
  };

  // Sell Phone Submission
  const handleSellSubmitted = (req: SellRequest) => {
    setSellRequests((prev) => [req, ...prev]);
  };

  // Launch Product from Admin Panel
  const handleLaunchProduct = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev.filter((p) => p.id !== newProduct.id)]);
    showToast(`🚀 "${newProduct.name}" launched live to store catalog!`);
  };

  // Update Sell Request status from Admin
  const handleUpdateSellRequest = (reqId: string, status: string) => {
    setSellRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status } : r))
    );
  };

  const currentProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const t = translations[currentLang] || translations.en;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-cyan-400 text-cyan-300 px-4 py-2 rounded-2xl shadow-2xl text-xs sm:text-sm font-bold flex items-center gap-2 animate-bounce">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header with Navigation */}
      <Header
        currentLang={currentLang}
        onLanguageChange={handleSelectLanguage}
        activeView={activeView}
        onNavigate={(view) => {
          if (view === 'admin' && !isAdminAuthorized) {
            setIsAdminLoginModalOpen(true);
            return;
          }
          setActiveView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenLangModal={() => setIsLangModalOpen(true)}
        currentUser={currentUser}
        onOpenAuthModal={() => {
          setPendingAuthAction(null);
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
      />

      {/* Language Modal */}
      <LanguageModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
        currentLang={currentLang}
        onSelectLang={handleSelectLanguage}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeView === 'home' && (
          <HomeView
            products={products}
            favorites={favorites}
            storeSettings={storeSettings}
            onToggleFavorite={handleToggleFavorite}
            onViewDetails={handleViewProduct}
            onQuickAddToCart={handleQuickAddToCartWithAuth}
            onQuickBuyNow={handleQuickBuyNowWithAuth}
            onNavigate={(view) => {
              setActiveView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeView === 'details' && currentProduct && (
          <ProductDetailsView
            product={currentProduct}
            allProducts={products}
            isFavorite={!!favorites[currentProduct.id]}
            onToggleFavorite={handleToggleFavorite}
            onAddToCart={handleAddToCartWithVariantWithAuth}
            onBuyNow={handleBuyNowWithAuth}
            onBack={() => setActiveView('home')}
            onSelectProduct={handleViewProduct}
            onShowToast={showToast}
          />
        )}

        {activeView === 'cart' && (
          <CartView
            cart={cart}
            onUpdateQty={handleUpdateQty}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onProceedToCheckout={handleProceedToCheckoutWithAuth}
            onContinueShopping={() => setActiveView('home')}
          />
        )}

        {activeView === 'checkout' && (
          <CheckoutView
            items={cart}
            currentUser={currentUser}
            userProfile={userProfile}
            onRequireLogin={() => setIsAuthModalOpen(true)}
            onBack={() => setActiveView('cart')}
            onOrderPlaced={handleOrderPlaced}
            onShowToast={showToast}
          />
        )}

        {activeView === 'order-success' && lastPlacedOrder && (
          <OrderSuccessView
            order={lastPlacedOrder}
            onViewOrders={() => setActiveView('profile')}
            onContinueShopping={() => setActiveView('home')}
          />
        )}

        {activeView === 'profile' && (
          <ProfileView
            orders={orders}
            cart={cart}
            favorites={favorites}
            allProducts={products}
            sellRequests={sellRequests}
            currentUser={currentUser}
            userProfile={userProfile}
            onOpenAuthModal={() => {
              setPendingAuthAction(null);
              setIsAuthModalOpen(true);
            }}
            onLogout={handleLogout}
            onOpenCart={() => setActiveView('cart')}
            onViewProduct={handleViewProduct}
            onAddToCart={(p) => handleQuickAddToCartWithAuth({ stopPropagation: () => {} } as any, p)}
            onRemoveFavorite={(id) => {
              setFavorites((prev) => {
                const next = { ...prev };
                delete next[id];
                return next;
              });
            }}
            onCancelOrder={handleCancelOrder}
          />
        )}

        {activeView === 'sell' && (
          <SellPhoneView
            onBack={() => setActiveView('home')}
            onSellSubmitted={handleSellSubmitted}
            onShowToast={showToast}
            currentUserProfile={userProfile}
          />
        )}

        {/* Hidden Admin Control Center */}
        {activeView === 'admin' && (
          isAdminAuthorized ? (
            <AdminPanel
              products={products}
              sellRequests={sellRequests}
              orders={orders}
              onBackToStore={() => setActiveView('home')}
              onLaunchProduct={(newProduct) => {
                setProducts((prev) => [newProduct, ...prev.filter((p) => p.id !== newProduct.id)]);
                showToast(`🚀 "${newProduct.name}" launched live to store catalog!`);
              }}
              onUpdateSellRequest={(reqId, status) => {
                setSellRequests((prev) =>
                  prev.map((r) => (r.id === reqId ? { ...r, status } : r))
                );
                showToast(`Sell request status updated to "${status}"`);
              }}
              onSelectProduct={handleViewProduct}
              onDeleteProduct={(productId) => {
                setProducts((prev) => prev.filter((p) => p.id !== productId));
                showToast('Product removed from catalog.');
              }}
              onUpdateOrderStatus={(orderId: string, status: OrderStatus, trackingEvent?: OrderTrackingEvent) => {
                setOrders((prev) =>
                  prev.map((o) => (o.id === orderId ? {
                    ...o,
                    status,
                    trackingEvents: trackingEvent ? [...(o.trackingEvents || []), trackingEvent] : o.trackingEvents
                  } : o))
                );
                showToast(`Order status updated to "${status}"`);
              }}
              onToggleStock={(productId) => {
                setProducts((prev) =>
                  prev.map((p) =>
                    p.id === productId ? { ...p, outOfStock: !p.outOfStock } : p
                  )
                );
              }}
              onShowToast={showToast}
            />
          ) : (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
              <ShieldCheck className="w-12 h-12 text-amber-400 mb-3" />
              <h2 className="text-xl font-bold text-slate-100">Admin Authorization Required</h2>
              <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
                You must authenticate with the verified store administrator account to view this section.
              </p>
              <button
                onClick={() => setIsAdminLoginModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer"
              >
                Open Admin Login
              </button>
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-xs text-slate-400 py-8 px-4 sm:px-6 mb-14 sm:mb-0">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-sky-400 flex items-center justify-center text-slate-950 font-black">
                R
              </div>
              <h3 className="font-extrabold text-sm text-slate-100">{storeSettings.shopName || 'Rittik Mobile Shop'}</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {storeSettings.shopDescription || 'Your certified destination for premium pre-owned and new smartphones. Complete with 32-point inspection, 6 months store warranty, and instant Cash on Delivery.'}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-200 uppercase tracking-wider mb-2">
              Store Counter &amp; Timing
            </h4>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>{storeSettings.address || 'Main Market Road, West Bengal, India'}</span>
              </div>

              {(storeSettings.latitude && storeSettings.longitude) ? (
                <div className="pl-5">
                  <a
                    href={`https://www.google.com/maps?q=${storeSettings.latitude},${storeSettings.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1 font-bold text-[10px]"
                  >
                    <span>View Store Directions on Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : storeSettings.googleMapsUrl ? (
                <div className="pl-5">
                  <a
                    href={storeSettings.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1 font-bold text-[10px]"
                  >
                    <span>View Store Directions on Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : null}

              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span>
                  {storeSettings.workingDays || 'Monday – Sunday'}: {storeSettings.openingHours || '10:00 AM'} – {storeSettings.closingHours || '9:00 PM'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span>Customer Care: {storeSettings.phone || '+91 98300 12345'}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-200 uppercase tracking-wider mb-2">
              Genuine Assurance &amp; Warranty
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
              Every certified pre-owned smartphone undergoes a 32-point hardware and battery health inspection and comes with a 6-month store warranty and 7-day easy exchange guarantee.
            </p>
            <div className="text-cyan-400 font-bold text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>100% Quality Inspected Devices</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 mt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Rittik Mobile Shop. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Premium Certified Pre-Owned Smartphones & Accessories</p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (Matching Reference Website) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-around py-1.5 px-2 shadow-2xl">
        <button
          onClick={() => {
            setActiveView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeView === 'home' ? 'text-cyan-400 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <img
            src="https://s3ng.cashify.in/builder/f635449b43954fd1af1d88e7272d5dc2.webp"
            alt="Home"
            className="w-5 h-5 object-contain"
          />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => {
            setActiveView('sell');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeView === 'sell' ? 'text-cyan-400 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <img
            src="https://s3ng.cashify.in/builder/31d6a6d498ca43d4a6eee6cccd421474.webp"
            alt="Sell"
            className="w-5 h-5 object-contain"
          />
          <span className="text-[10px]">Sell</span>
        </button>

        <button
          onClick={() => {
            setActiveView('cart');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all relative cursor-pointer ${
            activeView === 'cart' ? 'text-cyan-400 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <img
              src="https://s3ng.cashify.in/builder/caa3a1efa51541a5aa37fd292790ea81.webp"
              alt="Cart"
              className="w-5 h-5 object-contain"
            />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-cyan-400 text-slate-950 font-black text-[9px] flex items-center justify-center shadow">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <span className="text-[10px]">Cart</span>
        </button>

        <button
          onClick={() => {
            setActiveView('profile');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeView === 'profile' ? 'text-cyan-400 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <img
            src="https://s3ng.cashify.in/builder/60cc75a071de4f729b9377681e594821.webp"
            alt="Profile"
            className="w-5 h-5 object-contain"
          />
          <span className="text-[10px]">Profile</span>
        </button>
      </nav>

      {/* Animated Lamp Customer Authentication Modal */}
      <CustomerAuthModal
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuthModal}
        onSuccess={handleAuthSuccess}
        pendingAction={pendingAuthAction}
      />

      {/* Hidden Admin Login Modal (Triggered by 5 rapid clicks on logo) */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onSuccess={() => {
          setIsAdminAuthorized(true);
          setIsAdminLoginModalOpen(false);
          setActiveView('admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          showToast('Welcome to Rittik Mobile Shop Admin Control Center! 🛡️');
        }}
      />
    </div>
  );
}
