import React from 'react';
import { Product } from '../types';
import { Star, Heart, ShoppingBag, Zap } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, productId: string) => void;
  onViewDetails: (productId: string) => void;
  onQuickAddToCart: (e: React.MouseEvent, product: Product) => void;
  onQuickBuyNow?: (e: React.MouseEvent, product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isFavorite,
  onToggleFavorite,
  onViewDetails,
  onQuickAddToCart,
  onQuickBuyNow
}) => {
  const discount = product.mrp 
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100) 
    : 0;

  const firstImg = product.images?.[0] || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80';
  const isProductNew = product.conditionType === 'new';

  return (
    <div 
      onClick={() => onViewDetails(product.id)}
      className="bg-slate-900/80 dark:bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between group cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 relative"
    >
      {/* Wishlist Button */}
      <button
        onClick={(e) => onToggleFavorite(e, product.id)}
        title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
        className={`absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          isFavorite 
            ? 'bg-red-500/20 text-red-500 border border-red-500/40' 
            : 'bg-slate-950/60 text-slate-400 hover:text-red-400 hover:bg-slate-900 border border-slate-700/50'
        }`}
      >
        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500' : ''}`} />
      </button>

      {/* Image Container */}
      <div>
        <div className="w-full h-44 sm:h-48 bg-white rounded-xl flex items-center justify-center p-3 mb-3 overflow-hidden group-hover:scale-[1.02] transition-transform relative">
          <img 
            src={firstImg} 
            alt={product.name}
            className="max-h-full max-w-full object-contain drop-shadow"
            loading="lazy"
          />
          {product.outOfStock && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px] flex items-center justify-center">
              <span className="px-2.5 py-1 rounded-lg bg-red-950/90 border border-red-500/60 text-red-300 text-[11px] font-black uppercase tracking-wider">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Badges / Rating / Condition */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-800 text-slate-200 border border-slate-700">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            {product.rating.toFixed(1)}
          </span>

          {isProductNew ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              NEW
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              2ND HAND
            </span>
          )}

          <span className="text-[10px] text-slate-400 font-medium truncate max-w-[110px]" title={product.condition}>
            {product.condition || 'Superb'}
          </span>
        </div>

        {/* Product Title */}
        <h3 className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-cyan-400 transition-colors line-clamp-1 mb-1" title={product.name}>
          {product.name}
        </h3>

        {/* Specs Pill */}
        <p className="text-[11px] text-slate-400 mb-2 truncate">
          {product.highlights?.ram || '6 GB'} RAM • {product.highlights?.rom || '128 GB'} ROM
        </p>

        {/* Price & MRP */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-base sm:text-lg font-extrabold text-cyan-400">
            ₹ {product.price.toLocaleString('en-IN')}
          </span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-xs text-slate-500 line-through">
              ₹ {product.mrp.toLocaleString('en-IN')}
            </span>
          )}
          {discount > 0 && (
            <span className="text-[11px] font-bold text-emerald-400">
              {discount}% off
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2 border-t border-slate-800/80">
        <button
          onClick={(e) => onQuickAddToCart(e, product)}
          className="flex-1 py-2 px-2 rounded-xl text-xs font-bold text-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 flex items-center justify-center gap-1 active:scale-95 transition-all"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add to</span> Cart
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onQuickBuyNow) {
              onQuickBuyNow(e, product);
            } else {
              onViewDetails(product.id);
            }
          }}
          className="flex-1 py-2 px-2 rounded-xl text-xs font-extrabold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:brightness-110 flex items-center justify-center gap-1 shadow-md shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 fill-slate-950" />
          Buy Now
        </button>
      </div>
    </div>
  );
};
