import React, { useState, useMemo } from 'react';
import { Product, ProductCategory, AppView, StoreSettings } from '../types';
import { ProductCard } from './ProductCard';
import { ProductFilterSidebar } from './ProductFilterSidebar';
import { BrandLogo } from './BrandLogo';
import { useStoreSettings } from '../utils/storeSettingsManager';
import { 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Sparkles,
  Smartphone,
  Watch,
  Headphones,
  RotateCcw,
  CheckCircle2,
  X,
  Megaphone
} from 'lucide-react';

interface HomeViewProps {
  products: Product[];
  favorites: Record<string, boolean>;
  storeSettings?: StoreSettings;
  onToggleFavorite: (e: React.MouseEvent, productId: string) => void;
  onViewDetails: (productId: string) => void;
  onQuickAddToCart: (e: React.MouseEvent, product: Product) => void;
  onQuickBuyNow?: (e: React.MouseEvent, product: Product) => void;
  onNavigate: (view: AppView) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  products,
  favorites,
  storeSettings: propStoreSettings,
  onToggleFavorite,
  onViewDetails,
  onQuickAddToCart,
  onQuickBuyNow,
  onNavigate
}) => {
  const [defaultStoreSettings] = useStoreSettings();
  const storeSettings = propStoreSettings || defaultStoreSettings;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(75000);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [activePreset, setActivePreset] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const brandList = [
    { name: 'All', label: 'All' },
    { name: 'Apple', label: 'Apple' },
    { name: 'Samsung', label: 'Samsung' },
    { name: 'Vivo', label: 'Vivo' },
    { name: 'Realme', label: 'Realme' },
    { name: 'Oppo', label: 'Oppo' },
    { name: 'Xiaomi', label: 'Xiaomi' },
    { name: 'OnePlus', label: 'OnePlus' },
    { name: 'Google', label: 'Pixel' }
  ];

  // Preset Budget Buttons
  const handlePreset = (preset: string) => {
    setActivePreset(preset);
    if (preset === 'all') {
      setMinPrice(0);
      setMaxPrice(75000);
    } else if (preset === 'under15') {
      setMinPrice(0);
      setMaxPrice(15000);
    } else if (preset === '15to30') {
      setMinPrice(15000);
      setMaxPrice(30000);
    } else if (preset === '30to50') {
      setMinPrice(30000);
      setMaxPrice(50000);
    } else if (preset === 'above50') {
      setMinPrice(50000);
      setMaxPrice(100000);
    }
  };

  const handleSliderChange = (val: number) => {
    setMaxPrice(val);
    setMinPrice(0);
    if (val >= 75000) {
      setActivePreset('all');
    } else if (val === 15000) {
      setActivePreset('under15');
    } else {
      setActivePreset('custom');
    }
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedBrand('All');
    setSelectedCategory('all');
    setSelectedCondition('all');
    setMaxPrice(75000);
    setMinPrice(0);
    setActivePreset('all');
    setSortBy('featured');
  };

  // Search dropdown results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return products.filter(
      p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [products, searchQuery]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }

    // Brand filter
    if (selectedBrand !== 'All') {
      list = list.filter(p => p.brand.toLowerCase() === selectedBrand.toLowerCase());
    }

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter(p => p.category === selectedCategory);
    }

    // Condition filter
    if (selectedCondition !== 'all') {
      list = list.filter(p => {
        const cond = (p.condition || '').toLowerCase();
        if (selectedCondition === 'flawless') return cond.includes('flawless') || cond.includes('like new');
        if (selectedCondition === 'superb') return cond.includes('superb');
        return !cond.includes('flawless') && !cond.includes('superb');
      });
    }

    // Budget range
    list = list.filter(p => p.price >= minPrice && p.price <= maxPrice);

    // Sorting
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'newest') {
      list.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortBy === 'popular') {
      list.sort((a, b) => (b.rating * 100 + b.reviewsCount) - (a.rating * 100 + a.reviewsCount));
    } else if (sortBy === 'discount') {
      list.sort((a, b) => {
        const discA = a.mrp ? ((a.mrp - a.price) / a.mrp) : 0;
        const discB = b.mrp ? ((b.mrp - b.price) / b.mrp) : 0;
        return discB - discA;
      });
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [products, searchQuery, selectedBrand, selectedCategory, selectedCondition, minPrice, maxPrice, sortBy]);

  const isFilterActive =
    selectedBrand !== 'All' ||
    selectedCategory !== 'all' ||
    selectedCondition !== 'all' ||
    maxPrice < 75000 ||
    minPrice > 0 ||
    searchQuery !== '';

  return (
    <div className="pb-16">
      {/* Dynamic Announcement Banner from Firebase Store Settings */}
      {storeSettings.announcement && (
        <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 border-b border-cyan-500/30 px-4 py-2 text-center">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs font-bold text-cyan-300">
            <Megaphone className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-bounce" />
            <span className="truncate">{storeSettings.announcement}</span>
          </div>
        </div>
      )}

      {/* Search Input Box with Dropdown Autocomplete */}
      <div className="px-4 sm:px-6 py-3 bg-slate-900/60 border-b border-slate-800 relative z-30">
        <div className="max-w-4xl mx-auto relative">
          <div className="relative">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="mainSearchInput"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mobiles, brands, models (iPhone, Samsung, Vivo, Pixel)..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden z-40">
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSearchQuery('');
                    onViewDetails(item.id);
                  }}
                  className="px-4 py-2.5 hover:bg-slate-800/80 flex items-center gap-3 cursor-pointer border-b border-slate-800/60 last:border-none"
                >
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="w-8 h-8 object-contain rounded bg-white p-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-200 truncate">{item.name}</p>
                    <p className="text-[11px] text-cyan-400 font-extrabold">₹ {item.price.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Brand Horizontal Carousel */}
      <div className="px-4 sm:px-6 py-3 border-b border-slate-800/60 bg-slate-950/40">
        <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          {brandList.map((brandItem) => {
            const isSelected = selectedBrand.toLowerCase() === brandItem.name.toLowerCase();
            return (
              <button
                key={brandItem.name}
                onClick={() => setSelectedBrand(brandItem.name)}
                className={`w-[66px] h-[66px] min-w-[66px] rounded-2xl flex flex-col items-center justify-center p-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/15 border-2 border-cyan-400 text-cyan-400 shadow-lg shadow-cyan-500/25 -translate-y-0.5'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-300 hover:border-cyan-500/40 hover:text-slate-100'
                }`}
              >
                <BrandLogo brand={brandItem.name} size="md" />
                <span className="text-[10px] font-bold mt-1 uppercase tracking-tight truncate max-w-full">
                  {brandItem.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Promotional Banner */}
      <div className="px-4 sm:px-6 pt-4 pb-2">
        <div className="max-w-7xl mx-auto bg-gradient-to-br from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/25 rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-black text-cyan-400 tracking-tight mb-2">
              {storeSettings.homeTitle || 'Buy & Sell Premium Devices'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mb-4">
              {storeSettings.homeSubtitle || 'আপনার বাড়িতে বসে বা আমাদের দোকান থেকে'}
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => onNavigate('sell')}
                className="px-4 py-2 rounded-xl text-xs font-extrabold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:brightness-110 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
              >
                Sell Your Old Phone
              </button>
              <button
                onClick={() => setSelectedCategory('all')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 active:scale-95 transition-all"
              >
                Browse All Gadgets
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid (Using Authentic Cashify Assets) */}
      <div className="px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-cyan-400 rounded-full" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Our Services</h3>
          </div>
          <div className="grid grid-cols-4 gap-2.5 sm:gap-4 text-center">
            <div
              onClick={() => onNavigate('sell')}
              className="flex flex-col items-center cursor-pointer group"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900 border border-slate-800 group-hover:border-cyan-400 group-hover:shadow-lg group-hover:shadow-cyan-500/20 flex items-center justify-center p-2.5 transition-all group-hover:-translate-y-1">
                <img
                  src="https://s3ng.cashify.in/builder/cd13764b153e46e19f9c6551ee52b5e6.webp"
                  alt="Sell Phone"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-300 mt-2 group-hover:text-cyan-400 transition-colors">Sell Phone</span>
            </div>

            <div
              onClick={() => setSelectedCategory('mobile')}
              className="flex flex-col items-center cursor-pointer group"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900 border border-slate-800 group-hover:border-cyan-400 group-hover:shadow-lg group-hover:shadow-cyan-500/20 flex items-center justify-center p-2.5 transition-all group-hover:-translate-y-1">
                <img
                  src="https://s3ng.cashify.in/builder/caa3a1efa51541a5aa37fd292790ea81.webp"
                  alt="Buy Phone"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-300 mt-2 group-hover:text-cyan-400 transition-colors">Buy Phone</span>
            </div>

            <div
              onClick={() => setSelectedCategory('watch')}
              className="flex flex-col items-center cursor-pointer group"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900 border border-slate-800 group-hover:border-cyan-400 group-hover:shadow-lg group-hover:shadow-cyan-500/20 flex items-center justify-center p-2.5 transition-all group-hover:-translate-y-1">
                <img
                  src="https://s3ng.cashify.in/builder/f1f0df2917bd410b8da95675c63be2d1.webp"
                  alt="Smartwatches"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-300 mt-2 group-hover:text-cyan-400 transition-colors">Smartwatches</span>
            </div>

            <div
              onClick={() => setSelectedCategory('accessory')}
              className="flex flex-col items-center cursor-pointer group"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900 border border-slate-800 group-hover:border-cyan-400 group-hover:shadow-lg group-hover:shadow-cyan-500/20 flex items-center justify-center p-2.5 transition-all group-hover:-translate-y-1">
                <img
                  src="https://s3ng.cashify.in/builder/75750a866d214239bf52a47ee57e6674.webp"
                  alt="Accessories"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-300 mt-2 group-hover:text-cyan-400 transition-colors">Accessories</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Catalog Area with Sticky Filter Sidebar & Responsive Product Grid */}
      <div className="px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 items-start">
          {/* Desktop Filter Sidebar & Mobile Drawer */}
          <ProductFilterSidebar
            products={products}
            filterState={{
              brand: selectedBrand,
              category: selectedCategory,
              minPrice,
              maxPrice,
              condition: selectedCondition,
              preset: activePreset,
              sortBy
            }}
            onFilterChange={(updates) => {
              if (updates.brand !== undefined) setSelectedBrand(updates.brand);
              if (updates.category !== undefined) setSelectedCategory(updates.category);
              if (updates.minPrice !== undefined) setMinPrice(updates.minPrice);
              if (updates.maxPrice !== undefined) setMaxPrice(updates.maxPrice);
              if (updates.condition !== undefined) setSelectedCondition(updates.condition);
              if (updates.preset !== undefined) setActivePreset(updates.preset);
              if (updates.sortBy !== undefined) setSortBy(updates.sortBy);
            }}
            onResetFilters={resetAllFilters}
            isMobileOpen={isMobileFilterOpen}
            onCloseMobile={() => setIsMobileFilterOpen(false)}
            totalResultsCount={filteredProducts.length}
          />

          {/* Right Column: Catalog Toolbar & Products Grid */}
          <div className="flex-1 min-w-0 w-full space-y-4">
            {/* Catalog Toolbar */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 font-bold text-xs hover:bg-cyan-500/25 active:scale-95 transition-all shadow-sm"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filters</span>
                  {(selectedBrand !== 'All' || selectedCategory !== 'all' || maxPrice < 75000 || minPrice > 0 || selectedCondition !== 'all') && (
                    <span className="w-4 h-4 rounded-full bg-cyan-400 text-slate-950 font-black text-[10px] flex items-center justify-center">
                      {[
                        selectedBrand !== 'All',
                        selectedCategory !== 'all',
                        maxPrice < 75000 || minPrice > 0,
                        selectedCondition !== 'all'
                      ].filter(Boolean).length}
                    </span>
                  )}
                </button>

                {/* Showing results count */}
                <div className="text-xs text-slate-400">
                  Showing <strong className="text-slate-100 font-bold">{filteredProducts.length}</strong> of {products.length} devices
                </div>
              </div>

              {/* Quick Sort Dropdown */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
                  Sort:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-950 border border-slate-700/80 text-slate-200 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500 shadow-sm cursor-pointer"
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="newest">✨ Newest First</option>
                  <option value="popular">⭐ Most Popular</option>
                  <option value="discount">🔥 Biggest Discount</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </div>
            </div>

            {/* Active Filter Badges */}
            {isFilterActive && (
              <div className="flex flex-wrap items-center gap-2 px-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Active Filters:
                </span>

                {selectedBrand !== 'All' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                    <BrandLogo brand={selectedBrand} size="sm" showBorder={false} />
                    <span>Brand: {selectedBrand}</span>
                    <button
                      onClick={() => setSelectedBrand('All')}
                      className="hover:text-cyan-100 text-cyan-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                    <span>Category: {selectedCategory}</span>
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="hover:text-cyan-100 text-cyan-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {(maxPrice < 75000 || minPrice > 0) && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                    <span>Price: ₹{minPrice.toLocaleString('en-IN')} – ₹{maxPrice >= 75000 ? '75,000+' : maxPrice.toLocaleString('en-IN')}</span>
                    <button
                      onClick={() => {
                        setMinPrice(0);
                        setMaxPrice(75000);
                        setActivePreset('all');
                      }}
                      className="hover:text-cyan-100 text-cyan-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedCondition !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                    <span>Condition: {selectedCondition}</span>
                    <button
                      onClick={() => setSelectedCondition('all')}
                      className="hover:text-cyan-100 text-cyan-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  onClick={resetAllFilters}
                  className="text-xs font-bold text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 ml-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              </div>
            )}

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center my-4">
                <Smartphone className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-200 mb-1">
                  No gadgets found matching your selection
                </h3>
                <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                  Try widening your budget range or selecting 'All Brands' in the filter sidebar.
                </p>
                <button
                  onClick={resetAllFilters}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:scale-95 transition-all shadow-md shadow-cyan-500/20"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3.5 sm:gap-4.5">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isFavorite={!!favorites[product.id]}
                    onToggleFavorite={onToggleFavorite}
                    onViewDetails={onViewDetails}
                    onQuickAddToCart={onQuickAddToCart}
                    onQuickBuyNow={onQuickBuyNow}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
