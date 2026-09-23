import React, { useState, useMemo, useEffect } from 'react';
import { Product, ProductVariant, ProductReview } from '../types';
import { getProductReviews, addProductReview, incrementHelpfulVote } from '../data/reviews';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  Star, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Banknote, 
  Zap, 
  ShoppingBag, 
  ChevronLeft, 
  ChevronRight,
  Cpu,
  Camera,
  Smartphone,
  Battery,
  Wifi,
  Package,
  CheckCircle2,
  Award,
  ThumbsUp,
  MessageSquare,
  PenLine,
  X,
  Filter,
  Sparkles,
  User,
  Check
} from 'lucide-react';

interface ProductDetailsViewProps {
  product: Product;
  allProducts: Product[];
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, productId: string) => void;
  onAddToCart: (product: Product, variant?: ProductVariant) => void;
  onBuyNow: (product: Product, variant?: ProductVariant) => void;
  onBack: () => void;
  onSelectProduct: (productId: string) => void;
  onShowToast: (msg: string) => void;
}

export const ProductDetailsView: React.FC<ProductDetailsViewProps> = ({
  product,
  allProducts,
  isFavorite,
  onToggleFavorite,
  onAddToCart,
  onBuyNow,
  onBack,
  onSelectProduct,
  onShowToast
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Normalize variants list: if product has variants, use them, otherwise create default options
  const variants: ProductVariant[] = useMemo(() => {
    if (product.variants && product.variants.length > 0) {
      return product.variants;
    }
    const baseRam = product.highlights?.ram || '6 GB';
    const baseRom = product.highlights?.rom || '128 GB';
    return [
      {
        id: `${product.id}-v1`,
        ram: baseRam,
        rom: baseRom,
        storage: baseRom,
        price: product.price,
        mrp: product.mrp,
        processor: product.processor,
        camera: product.camera,
        display: product.display,
        battery: product.battery,
        condition: product.condition,
        quality: product.quality
      },
      {
        id: `${product.id}-v2`,
        ram: baseRam.includes('6') ? '8 GB' : '12 GB',
        rom: baseRom.includes('128') ? '256 GB' : '512 GB',
        storage: baseRom.includes('128') ? '256 GB' : '512 GB',
        price: product.price + 3000,
        mrp: product.mrp ? product.mrp + 4000 : Math.round((product.price + 3000) * 1.25),
        processor: `${product.processor} (Turbo RAM)`,
        camera: product.camera,
        display: product.display,
        battery: product.battery,
        condition: 'Like New (Flawless)',
        quality: '32-Point Quality Verified'
      }
    ];
  }, [product]);

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const activeVariant = variants[selectedVariantIndex] || variants[0];

  const currentPrice = activeVariant.price;
  const currentMrp = activeVariant.mrp;
  const discount = currentMrp ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) : 0;
  const isOutOfStock = !!activeVariant.outOfStock;

  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=700&auto=format&fit=crop&q=80'];

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev <= 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev >= images.length - 1 ? 0 : prev + 1));
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} at Rittik Mobile Shop`,
          text: `Check out ${product.name} (₹ ${currentPrice.toLocaleString('en-IN')}) with 6 Months Store Warranty!`,
          url: url
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      onShowToast('Product link copied to clipboard! 📋');
    } catch {
      onShowToast('Share link: ' + url);
    }
  };

  // Similar products in same brand or category
  const similarProducts = useMemo(() => {
    return allProducts
      .filter((p) => p.id !== product.id && (p.brand === product.brand || p.category === product.category))
      .slice(0, 6);
  }, [allProducts, product]);

  // Reviews & Rating System State
  const [reviews, setReviews] = useState<ProductReview[]>(() => getProductReviews(product.id));
  const [showAddReviewForm, setShowAddReviewForm] = useState(false);
  const [newRating, setNewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserCity, setNewUserCity] = useState<string>('');
  const [newReviewTitle, setNewReviewTitle] = useState<string>('');
  const [newComment, setNewComment] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('Battery & Screen Flawless');
  const [formError, setFormError] = useState<string | null>(null);
  const [filterStar, setFilterStar] = useState<'all' | number>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest'>('recent');
  const [votedReviewIds, setVotedReviewIds] = useState<Set<string>>(new Set());

  // Reload reviews when active product changes
  useEffect(() => {
    setReviews(getProductReviews(product.id));
    setShowAddReviewForm(false);
    setFormError(null);
    setFilterStar('all');
  }, [product.id]);

  // Derived rating and review statistics
  const computedReviewsCount = reviews.length;
  const computedAverageRating = useMemo(() => {
    if (reviews.length === 0) return product.rating || 5.0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
  }, [reviews, product.rating]);

  const ratingBreakdown = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[star] = (counts[star] || 0) + 1;
    });
    const total = reviews.length || 1;
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: counts[star] || 0,
      percentage: Math.round(((counts[star] || 0) / total) * 100),
    }));
  }, [reviews]);

  const filteredAndSortedReviews = useMemo(() => {
    let list = [...reviews];
    if (filterStar !== 'all') {
      list = list.filter((r) => Math.round(r.rating) === filterStar);
    }
    if (sortBy === 'recent') {
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sortBy === 'highest') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'lowest') {
      list.sort((a, b) => a.rating - b.rating);
    }
    return list;
  }, [reviews, filterStar, sortBy]);

  const handleHelpfulClick = (reviewId: string) => {
    if (votedReviewIds.has(reviewId)) {
      onShowToast('You already voted this review as helpful! 👍');
      return;
    }
    const updatedCount = incrementHelpfulVote(reviewId);
    setVotedReviewIds((prev) => new Set(prev).add(reviewId));
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, helpfulCount: updatedCount } : r))
    );
    onShowToast('Marked review as helpful! Thank you.');
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRating || newRating < 1 || newRating > 5) {
      setFormError('Please select a rating between 1 and 5 stars.');
      return;
    }
    if (!newComment.trim() || newComment.trim().length < 5) {
      setFormError('Please write a review comment (minimum 5 characters).');
      return;
    }

    const userNameFinal = newUserName.trim() || 'Verified Buyer';
    const userCityFinal = newUserCity.trim() || 'Kolkata';
    const titleFinal = newReviewTitle.trim() || `${newRating}-Star Rating`;

    const updated = addProductReview({
      productId: product.id,
      userName: userNameFinal,
      userCity: userCityFinal,
      rating: newRating,
      title: titleFinal,
      comment: newComment.trim(),
      tag: selectedTag || 'Verified Buyer',
    });

    setReviews(updated);
    setShowAddReviewForm(false);
    setNewComment('');
    setNewReviewTitle('');
    setNewUserName('');
    setNewUserCity('');
    setFormError(null);
    onShowToast(`Thank you! Your ${newRating}-star rating & review have been published. ⭐`);
  };

  const scrollToReviews = () => {
    const el = document.getElementById('customer-reviews-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getRatingDescriptor = (star: number) => {
    switch (star) {
      case 5: return '5 - Excellent';
      case 4: return '4 - Very Good';
      case 3: return '3 - Good';
      case 2: return '2 - Fair';
      case 1: return '1 - Poor';
      default: return 'Select Rating';
    }
  };

  const renderStarIcons = (rating: number, max = 5, sizeClass = "w-4 h-4") => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }).map((_, idx) => {
          const starValue = idx + 1;
          const isFull = rating >= starValue;
          const isHalf = !isFull && rating >= starValue - 0.5;
          return (
            <span key={idx} className="relative inline-block">
              <Star className={`${sizeClass} text-slate-700`} />
              {(isFull || isHalf) && (
                <span
                  className="absolute top-0 left-0 overflow-hidden"
                  style={{ width: isFull ? '100%' : '50%' }}
                >
                  <Star className={`${sizeClass} fill-amber-400 text-amber-400`} />
                </span>
              )}
            </span>
          );
        })}
      </div>
    );
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
          <span>Back to Catalog</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            title="Share Product Link"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-cyan-400 border border-slate-700 transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => onToggleFavorite(e, product.id)}
            title={isFavorite ? "Remove from Wishlist" : "Add to Wishlist"}
            className={`p-2 rounded-lg border transition-colors ${
              isFavorite 
                ? 'bg-red-500/20 text-red-500 border-red-500/40' 
                : 'bg-slate-800/80 text-slate-300 hover:text-red-400 border-slate-700'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500' : ''}`} />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Image Gallery Slider */}
          <div className="lg:col-span-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl sticky top-28">
              {/* Main Stage Image */}
              <div className="w-full h-72 sm:h-96 bg-white rounded-xl flex items-center justify-center p-4 relative overflow-hidden group">
                <img
                  src={images[activeImageIndex]}
                  alt={`${product.name} view ${activeImageIndex + 1}`}
                  className="max-h-full max-w-full object-contain drop-shadow transition-transform duration-300 group-hover:scale-105"
                />

                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center shadow-lg transition-transform active:scale-90"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center shadow-lg transition-transform active:scale-90"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails Row */}
              {images.length > 1 && (
                <div className="flex gap-2.5 mt-4 overflow-x-auto pb-1 scrollbar-none">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white p-1.5 flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                        activeImageIndex === idx
                          ? 'border-cyan-400 shadow-md shadow-cyan-500/20 scale-105'
                          : 'border-slate-800 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="max-w-full max-h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Product Info & Variants */}
          <div className="lg:col-span-6 space-y-5">
            {/* Title & Badges */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 flex-wrap mb-2.5">
                <button
                  onClick={scrollToReviews}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer group"
                  title="Click to view ratings and reviews"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>{computedAverageRating.toFixed(1)}</span>
                  <span className="text-amber-300/80 font-medium">({computedReviewsCount} {computedReviewsCount === 1 ? 'review' : 'reviews'})</span>
                </button>

                {product.conditionType === 'new' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    [ NEW ]
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    [ 2ND HAND ]
                  </span>
                )}

                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {product.brand}
                </span>

                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700" title="Device Condition">
                  Condition: {product.condition || activeVariant.condition || 'Certified Superb'}
                </span>

                {product.warranty && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                    {product.warranty}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight leading-snug mb-3">
                {product.name}
              </h1>

              {/* Price Row */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-2xl sm:text-3xl font-black text-cyan-400">
                  ₹ {currentPrice.toLocaleString('en-IN')}
                </span>
                {currentMrp && currentMrp > currentPrice && (
                  <span className="text-sm sm:text-base text-slate-500 line-through font-medium">
                    ₹ {currentMrp.toLocaleString('en-IN')}
                  </span>
                )}
                {discount > 0 && (
                  <span className="text-xs sm:text-sm font-extrabold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-md">
                    {discount}% OFF
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-4">
                {isOutOfStock ? (
                  <span className="text-xs font-bold text-red-400 bg-red-950/60 border border-red-500/30 px-3 py-1 rounded-md inline-flex items-center gap-1.5">
                    Currently Out of Stock
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-md inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    In Stock & Ready for Immediate Dispatch
                  </span>
                )}
              </div>

              {/* Delivery Perks Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-slate-800 text-[11px] text-slate-300 font-medium">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Free Fast Delivery</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>100% Genuine</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>7-Day Replacement</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Pay on Delivery</span>
                </div>
              </div>
            </div>

            {/* Storage & RAM Variant Selector (Reactive Single Source of Truth) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Select Storage & RAM Variant:
                </h3>
                <span className="text-xs font-bold text-cyan-400">
                  {activeVariant.ram} RAM | {activeVariant.rom} ROM
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {variants.map((variant, idx) => (
                  <button
                    key={variant.id || idx}
                    onClick={() => setSelectedVariantIndex(idx)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedVariantIndex === idx
                        ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-md shadow-cyan-500/10'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-extrabold text-xs sm:text-sm text-slate-200">
                      {variant.ram} | {variant.rom}
                    </div>
                    <div className="text-xs font-black text-cyan-400 mt-1">
                      ₹ {variant.price.toLocaleString('en-IN')}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Condition & 32-Point Quality Checklist Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                Condition & Inspection Checklist
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Body & Frame</span>
                  <span className="text-slate-200 font-semibold">{product.bodyCondition}</span>
                </div>
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Display & Touch</span>
                  <span className="text-slate-200 font-semibold">{product.displayCondition}</span>
                </div>
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Battery Health</span>
                  <span className="text-slate-200 font-semibold">{product.batteryCondition}</span>
                </div>
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Store Warranty</span>
                  <span className="text-slate-200 font-semibold">{product.warranty}</span>
                </div>
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Accessories Included</span>
                  <span className="text-slate-200 font-semibold">{product.accessories}</span>
                </div>
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Packaging Box</span>
                  <span className="text-slate-200 font-semibold">{product.boxAvailable}</span>
                </div>
              </div>
            </div>

            {/* Hardware Specifications */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Hardware Specifications
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/50">
                  <Cpu className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Processor / Chipset</span>
                    <span className="text-slate-200 font-bold">{activeVariant.processor || product.processor}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/50">
                  <Camera className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Camera System</span>
                    <span className="text-slate-200 font-bold">{activeVariant.camera || product.camera}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/50">
                  <Smartphone className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Display Panel</span>
                    <span className="text-slate-200 font-bold">{activeVariant.display || product.display}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/50">
                  <Battery className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Battery Capacity</span>
                    <span className="text-slate-200 font-bold">{activeVariant.battery || product.battery}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/50">
                  <Wifi className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Connectivity</span>
                    <span className="text-slate-200 font-bold">{product.network || '5G SA/NSA, Dual VoLTE, Wi-Fi 6, Bluetooth'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Similar Products Carousel */}
            {similarProducts.length > 0 && (
              <div className="pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Similar Devices & Recommendations:
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {similarProducts.map((sim) => (
                    <div
                      key={sim.id}
                      onClick={() => onSelectProduct(sim.id)}
                      className="w-36 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-2.5 flex-shrink-0 cursor-pointer transition-all hover:-translate-y-0.5"
                    >
                      <div className="w-full h-24 bg-white rounded-lg p-2 mb-2 flex items-center justify-center">
                        <img src={sim.images[0]} alt={sim.name} className="max-h-full max-w-full object-contain" />
                      </div>
                      <p className="text-[11px] font-bold text-slate-200 truncate">{sim.name}</p>
                      <p className="text-xs font-extrabold text-cyan-400 mt-0.5">₹ {sim.price.toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customer Ratings & Reviews Section */}
        <div id="customer-reviews-section" className="mt-12 pt-8 border-t border-slate-800">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                  Customer Ratings & Reviews
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Authentic ratings and verified pre-owned buyer reviews for {product.name}
              </p>
            </div>

            <button
              onClick={() => {
                setShowAddReviewForm((prev) => !prev);
                setFormError(null);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-lg shadow-amber-500/20 active:scale-95 whitespace-nowrap self-start sm:self-auto"
            >
              {showAddReviewForm ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Close Form</span>
                </>
              ) : (
                <>
                  <PenLine className="w-4 h-4" />
                  <span>Write a Review</span>
                </>
              )}
            </button>
          </div>

          {/* Overall Rating & Breakdown Card */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl mb-6">
            {/* Big Rating Summary */}
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-slate-800">
              <div className="text-5xl sm:text-6xl font-black text-amber-400 tracking-tight leading-none mb-2">
                {computedAverageRating.toFixed(1)}
              </div>
              <div className="mb-2">
                {renderStarIcons(computedAverageRating, 5, "w-5 h-5")}
              </div>
              <p className="text-xs font-bold text-slate-300">
                Based on {computedReviewsCount} {computedReviewsCount === 1 ? 'customer review' : 'customer reviews'}
              </p>
              <span className="inline-flex items-center gap-1 mt-3 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% Verified Quality Checked
              </span>
            </div>

            {/* Star Distribution Breakdown */}
            <div className="md:col-span-8 flex flex-col justify-center space-y-2.5 sm:px-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-1">
                <span>Rating Breakdown</span>
                <span>Click star to filter</span>
              </div>
              {ratingBreakdown.map((item) => (
                <div key={item.star} className="flex items-center gap-3 text-xs">
                  <button
                    onClick={() => setFilterStar(filterStar === item.star ? 'all' : item.star)}
                    className={`w-14 font-bold text-left flex items-center gap-1 transition-colors ${
                      filterStar === item.star ? 'text-amber-400 underline underline-offset-2' : 'text-slate-300 hover:text-amber-400'
                    }`}
                  >
                    <span>{item.star}</span>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline" />
                  </button>

                  <div 
                    onClick={() => setFilterStar(filterStar === item.star ? 'all' : item.star)}
                    className="flex-1 h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 cursor-pointer"
                  >
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>

                  <div className="w-20 text-right font-medium text-slate-400 text-[11px]">
                    <span className="font-bold text-slate-300">{item.percentage}%</span>
                    <span className="text-slate-500 ml-1">({item.count})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add a Review Form (Expandable) */}
          {showAddReviewForm && (
            <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-5 sm:p-6 shadow-2xl mb-8 transition-all">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <PenLine className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-100">
                      Rate & Review {product.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Share your experience regarding device performance, battery, and delivery
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddReviewForm(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                {formError && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-2">
                    <X className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Star Rating Picker */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Overall Rating (Required):
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <div 
                      className="flex items-center gap-1 sm:gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800"
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = (hoverRating || newRating) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onClick={() => {
                              setNewRating(star);
                              setFormError(null);
                            }}
                            className="p-1 rounded-lg hover:scale-125 transition-transform focus:outline-none"
                            title={`${star} Star`}
                          >
                            <Star
                              className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                                active
                                  ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                                  : 'text-slate-600 hover:text-slate-400'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-xs sm:text-sm font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-lg">
                      {getRatingDescriptor(hoverRating || newRating)}
                    </span>
                  </div>
                </div>

                {/* Name & City Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="e.g. Debjit Saha"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Your City / Area (Optional)
                    </label>
                    <input
                      type="text"
                      value={newUserCity}
                      onChange={(e) => setNewUserCity(e.target.value)}
                      placeholder="e.g. Salt Lake, Kolkata"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Review Headline */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Review Headline (Optional)
                  </label>
                  <input
                    type="text"
                    value={newReviewTitle}
                    onChange={(e) => setNewReviewTitle(e.target.value)}
                    placeholder="e.g. Outstanding battery backup and pristine display!"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                {/* Review Comment Textarea */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Your Review & Experience (Required)
                  </label>
                  <textarea
                    rows={4}
                    value={newComment}
                    onChange={(e) => {
                      setNewComment(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="Describe the device's condition, screen touch responsiveness, battery endurance, packaging quality, or delivery speed..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-colors resize-none"
                  />
                </div>

                {/* Highlight Tags */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Select a Key Feature Tag:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Battery & Screen Flawless',
                      'Camera Quality',
                      'Super Fast Delivery',
                      'Like New Condition',
                      'Great Value for Money',
                      'Original Accessories'
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedTag(tag)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                          selectedTag === tag
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddReviewForm(false)}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-750 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-md shadow-amber-500/20 active:scale-95 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Submit Review</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filter & Sort Controls Bar */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Star Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1 flex-shrink-0">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                Filter:
              </span>
              <button
                onClick={() => setFilterStar('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  filterStar === 'all'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                }`}
              >
                All ({reviews.length})
              </button>

              {[5, 4, 3, 2, 1].map((s) => {
                const count = reviews.filter((r) => Math.round(r.rating) === s).length;
                return (
                  <button
                    key={s}
                    onClick={() => setFilterStar(filterStar === s ? 'all' : s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1 transition-colors ${
                      filterStar === s
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    <span>{s}</span>
                    <Star className={`w-3 h-3 ${filterStar === s ? 'fill-slate-950' : 'fill-amber-400 text-amber-400'}`} />
                    <span className="text-[10px] opacity-80">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0 text-xs">
              <span className="text-slate-400 font-bold">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 font-bold focus:outline-none focus:border-amber-400"
              >
                <option value="recent">Most Recent</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>
          </div>

          {/* Reviews List */}
          {filteredAndSortedReviews.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center">
              <Star className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-300 mb-1">
                No reviews found for {filterStar} Stars
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Be the first to share your rating and review for this product!
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setFilterStar('all')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-750"
                >
                  Clear Filter
                </button>
                <button
                  onClick={() => {
                    setShowAddReviewForm(true);
                    setNewRating(typeof filterStar === 'number' ? filterStar : 5);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300"
                >
                  Write Review
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg transition-all"
                >
                  {/* Top user row */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400/20 to-cyan-500/20 border border-amber-500/30 flex items-center justify-center font-black text-amber-300 text-sm">
                        {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-slate-200">
                            {rev.userName}
                          </span>
                          {rev.verifiedPurchase && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <ShieldCheck className="w-3 h-3" />
                              Verified Buyer
                            </span>
                          )}
                        </div>
                        {rev.userCity && (
                          <span className="text-[11px] text-slate-500 block">
                            {rev.userCity}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
                      {rev.date}
                    </span>
                  </div>

                  {/* Rating Stars & Tag */}
                  <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                    {renderStarIcons(rev.rating, 5, "w-4 h-4")}
                    <span className="text-xs font-bold text-amber-400">
                      {rev.rating}.0 / 5.0
                    </span>
                    {rev.tag && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {rev.tag}
                      </span>
                    )}
                  </div>

                  {/* Review Title */}
                  {rev.title && (
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-100 mb-1">
                      {rev.title}
                    </h4>
                  )}

                  {/* Review Comment Body */}
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-3">
                    {rev.comment}
                  </p>

                  {/* Bottom Helpful button row */}
                  <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[11px] text-slate-500">
                      Quality Verified by Rittik Mobile Store
                    </span>

                    <button
                      onClick={() => handleHelpfulClick(rev.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors ${
                        votedReviewIds.has(rev.id)
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                      }`}
                      title="Mark review as helpful"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-semibold">
                        Helpful ({rev.helpfulCount || 0})
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Action Buttons Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-4 sm:px-6 py-3 shadow-2xl">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <button
            onClick={() => onAddToCart(product, activeVariant)}
            disabled={isOutOfStock}
            className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-cyan-400 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>

          <button
            onClick={() => onBuyNow(product, activeVariant)}
            disabled={isOutOfStock}
            className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:brightness-110 shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>Buy Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
