import React, { useState, useMemo } from 'react';
import { ProductCategory, Product } from '../types';
import { BrandLogo, getBrandMeta } from './BrandLogo';
import { 
  Filter, 
  RotateCcw, 
  Check, 
  Smartphone, 
  Watch, 
  Headphones, 
  Tag, 
  IndianRupee, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  X,
  Search,
  CheckCircle2
} from 'lucide-react';

export interface FilterState {
  brand: string;
  category: ProductCategory;
  minPrice: number;
  maxPrice: number;
  condition: string;
  preset: string;
  sortBy: string;
}

interface ProductFilterSidebarProps {
  products: Product[];
  filterState: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onResetFilters: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  totalResultsCount: number;
}

export const ProductFilterSidebar: React.FC<ProductFilterSidebarProps> = ({
  products,
  filterState,
  onFilterChange,
  onResetFilters,
  isMobileOpen = false,
  onCloseMobile,
  totalResultsCount
}) => {
  const [brandSearch, setBrandSearch] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    brands: true,
    price: true,
    condition: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Known brand metadata & brand list derived from products
  const allBrandsWithCounts = useMemo(() => {
    const brandMap = new Map<string, number>();
    products.forEach((p) => {
      const b = p.brand ? p.brand.trim() : 'Other';
      brandMap.set(b, (brandMap.get(b) || 0) + 1);
    });

    // Curated prominent brands order
    const priority = ['Apple', 'Samsung', 'OnePlus', 'Vivo', 'Realme', 'Oppo', 'Xiaomi', 'Google'];
    const sortedBrands: { name: string; count: number }[] = [];

    priority.forEach((bName) => {
      if (brandMap.has(bName)) {
        sortedBrands.push({ name: bName, count: brandMap.get(bName)! });
        brandMap.delete(bName);
      }
    });

    // Add remaining brands
    brandMap.forEach((count, name) => {
      sortedBrands.push({ name, count });
    });

    return sortedBrands;
  }, [products]);

  // Filtered brand list according to brand search
  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) return allBrandsWithCounts;
    const q = brandSearch.toLowerCase().trim();
    return allBrandsWithCounts.filter((b) => b.name.toLowerCase().includes(q));
  }, [allBrandsWithCounts, brandSearch]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: products.length,
      mobile: 0,
      watch: 0,
      accessory: 0
    };
    products.forEach((p) => {
      if (counts[p.category] !== undefined) {
        counts[p.category]++;
      }
    });
    return counts;
  }, [products]);

  // Condition counts
  const conditionOptions = useMemo(() => {
    const counts: Record<string, number> = {
      all: products.length,
      flawless: 0,
      superb: 0,
      good: 0
    };
    products.forEach((p) => {
      const cond = (p.condition || '').toLowerCase();
      if (cond.includes('flawless') || cond.includes('like new')) counts.flawless++;
      else if (cond.includes('superb')) counts.superb++;
      else counts.good++;
    });
    return counts;
  }, [products]);

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterState.brand !== 'All') count++;
    if (filterState.category !== 'all') count++;
    if (filterState.minPrice > 0 || filterState.maxPrice < 75000) count++;
    if (filterState.condition !== 'all') count++;
    return count;
  }, [filterState]);

  // Preset Budget Handler
  const handlePricePreset = (preset: string) => {
    if (preset === 'all') {
      onFilterChange({ minPrice: 0, maxPrice: 75000, preset: 'all' });
    } else if (preset === 'under15') {
      onFilterChange({ minPrice: 0, maxPrice: 15000, preset: 'under15' });
    } else if (preset === '15to30') {
      onFilterChange({ minPrice: 15000, maxPrice: 30000, preset: '15to30' });
    } else if (preset === '30to50') {
      onFilterChange({ minPrice: 30000, maxPrice: 50000, preset: '30to50' });
    } else if (preset === 'above50') {
      onFilterChange({ minPrice: 50000, maxPrice: 120000, preset: 'above50' });
    }
  };

  // Prominent brands for top quick-tap logo tiles
  const prominentBrands = useMemo(() => {
    return allBrandsWithCounts.slice(0, 8);
  }, [allBrandsWithCounts]);

  const sidebarContent = (
    <div className="space-y-5 text-xs text-slate-200">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-500/10">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5">
              Filters
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              Showing <span className="text-cyan-400 font-bold">{totalResultsCount}</span> devices
            </p>
          </div>
        </div>

        {activeFiltersCount > 0 && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 text-[11px] font-bold text-rose-400 hover:text-rose-300 transition-colors bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 px-2 py-1 rounded-lg"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Categories Section */}
      <div className="space-y-2.5 pb-4 border-b border-slate-800/80">
        <div
          onClick={() => toggleSection('categories')}
          className="flex items-center justify-between cursor-pointer select-none py-1 group"
        >
          <span className="font-bold text-xs uppercase tracking-wider text-slate-300 group-hover:text-cyan-400 transition-colors">
            Device Category
          </span>
          {expandedSections.categories ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          )}
        </div>

        {expandedSections.categories && (
          <div className="space-y-1.5 pt-1">
            {[
              { id: 'all', label: 'All Products', icon: Sparkles, count: categoryCounts.all },
              { id: 'mobile', label: 'Smartphones', icon: Smartphone, count: categoryCounts.mobile },
              { id: 'watch', label: 'Smartwatches', icon: Watch, count: categoryCounts.watch },
              { id: 'accessory', label: 'Accessories', icon: Headphones, count: categoryCounts.accessory }
            ].map((cat) => {
              const Icon = cat.icon;
              const isSelected = filterState.category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onFilterChange({ category: cat.id as ProductCategory })}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500/20 to-sky-500/10 border border-cyan-500/40 text-cyan-300 font-bold shadow-sm'
                      : 'bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 text-slate-300 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span className="text-xs">{cat.label}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-cyan-400 text-slate-950 font-black'
                        : 'bg-slate-800/80 text-slate-400'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Brand Selection Section */}
      <div className="space-y-2.5 pb-4 border-b border-slate-800/80">
        <div
          onClick={() => toggleSection('brands')}
          className="flex items-center justify-between cursor-pointer select-none py-1 group"
        >
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-300 group-hover:text-cyan-400 transition-colors">
              Brand
            </span>
            {filterState.brand !== 'All' && (
              <span className="inline-flex items-center gap-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] pl-1 pr-1.5 py-0.5 rounded-md font-bold">
                <BrandLogo brand={filterState.brand} size="sm" showBorder={false} />
                <span>{filterState.brand}</span>
              </span>
            )}
          </div>
          {expandedSections.brands ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          )}
        </div>

        {expandedSections.brands && (
          <div className="space-y-2.5 pt-1">
            {/* Quick-Tap Brand Logo Tiles Grid */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Popular Brands
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {prominentBrands.map((b) => {
                  const isSelected = filterState.brand.toLowerCase() === b.name.toLowerCase();
                  return (
                    <button
                      key={b.name}
                      onClick={() => onFilterChange({ brand: isSelected ? 'All' : b.name })}
                      title={`${b.name} (${b.count} devices)`}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center group cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-b from-cyan-500/25 to-sky-500/10 border-cyan-400 shadow-md shadow-cyan-500/20 -translate-y-0.5'
                          : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90 text-slate-300'
                      }`}
                    >
                      <BrandLogo brand={b.name} size="md" />
                      <span className={`text-[10px] font-bold mt-1.5 truncate max-w-full leading-tight ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                        {b.name}
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                        {b.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick search inside brands if more than 5 */}
            {allBrandsWithCounts.length > 5 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  placeholder="Search brand by name..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
                {brandSearch && (
                  <button
                    onClick={() => setBrandSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Brand Options List */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              {/* All Brands Option */}
              <button
                onClick={() => onFilterChange({ brand: 'All' })}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                  filterState.brand === 'All'
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold'
                    : 'bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 text-slate-300 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                      filterState.brand === 'All'
                        ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    {filterState.brand === 'All' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <BrandLogo brand="All" size="md" />
                  <div className="flex flex-col min-w-0 truncate">
                    <span className="text-xs font-bold leading-tight">All Brands</span>
                    <span className="text-[10px] text-slate-400 font-normal truncate">Complete multi-brand collection</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded-md shrink-0">
                  {products.length}
                </span>
              </button>

              {/* Individual Brands */}
              {filteredBrands.map((b) => {
                const isSelected = filterState.brand.toLowerCase() === b.name.toLowerCase();
                const meta = getBrandMeta(b.name);
                return (
                  <button
                    key={b.name}
                    onClick={() => onFilterChange({ brand: isSelected ? 'All' : b.name })}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-500/20 to-sky-500/10 border border-cyan-500/40 text-cyan-300 font-bold shadow-sm'
                        : 'bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 text-slate-300 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                            : 'border-slate-700 bg-slate-900'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <BrandLogo brand={b.name} size="md" />
                      <div className="flex flex-col min-w-0 truncate">
                        <span className={`text-xs font-semibold leading-tight truncate ${isSelected ? 'text-cyan-300' : 'text-slate-100'}`}>
                          {b.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal truncate">
                          {meta.popularSeries}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                        isSelected
                          ? 'bg-cyan-400 text-slate-950 font-black'
                          : 'bg-slate-800/80 text-slate-400'
                      }`}
                    >
                      {b.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Price Range Section */}
      <div className="space-y-3 pb-4 border-b border-slate-800/80">
        <div
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between cursor-pointer select-none py-1 group"
        >
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-300 group-hover:text-cyan-400 transition-colors">
              Price Range
            </span>
            {(filterState.minPrice > 0 || filterState.maxPrice < 75000) && (
              <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] px-1.5 py-0.2 rounded font-black">
                Custom
              </span>
            )}
          </div>
          {expandedSections.price ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          )}
        </div>

        {expandedSections.price && (
          <div className="space-y-3 pt-1">
            {/* Visual Budget Range Display */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Min Price</span>
                <span className="text-xs font-bold text-slate-200">
                  ₹ {filterState.minPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="h-4 w-px bg-slate-800" />
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-medium">Max Price</span>
                <span className="text-xs font-bold text-cyan-400">
                  {filterState.maxPrice >= 75000
                    ? '₹ 75,000+'
                    : `₹ ${filterState.maxPrice.toLocaleString('en-IN')}`}
                </span>
              </div>
            </div>

            {/* Slider for Max Price */}
            <div className="space-y-1">
              <input
                type="range"
                min="5000"
                max="75000"
                step="1000"
                value={filterState.maxPrice}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onFilterChange({
                    maxPrice: val,
                    minPrice: 0,
                    preset: val >= 75000 ? 'all' : 'custom'
                  });
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                <span>₹ 5,000</span>
                <span>₹ 75,000+</span>
              </div>
            </div>

            {/* Quick Price Range Radio Chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Quick Price Brackets
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { id: 'all', label: 'All Budgets', sub: '₹ 0 – Unlimited' },
                  { id: 'under15', label: 'Under ₹ 15,000', sub: 'Budget Friendly' },
                  { id: '15to30', label: '₹ 15,000 – ₹ 30,000', sub: 'Mid-Range Value' },
                  { id: '30to50', label: '₹ 30,000 – ₹ 50,000', sub: 'Flagship Killers' },
                  { id: 'above50', label: 'Above ₹ 50,000', sub: 'Premium Flagships' }
                ].map((item) => {
                  const isSelected = filterState.preset === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handlePricePreset(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 font-bold'
                          : 'bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                              : 'border-slate-700 bg-slate-900'
                          }`}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                        </div>
                        <span className="text-xs font-semibold">{item.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">{item.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Device Condition Section */}
      <div className="space-y-2.5 pb-2">
        <div
          onClick={() => toggleSection('condition')}
          className="flex items-center justify-between cursor-pointer select-none py-1 group"
        >
          <span className="font-bold text-xs uppercase tracking-wider text-slate-300 group-hover:text-cyan-400 transition-colors">
            Condition &amp; Grade
          </span>
          {expandedSections.condition ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          )}
        </div>

        {expandedSections.condition && (
          <div className="space-y-1.5 pt-1">
            {[
              { id: 'all', label: 'All Conditions', count: conditionOptions.all },
              { id: 'flawless', label: 'Like New (Flawless)', count: conditionOptions.flawless },
              { id: 'superb', label: 'Superb Condition', count: conditionOptions.superb },
              { id: 'good', label: 'Good Value Grade', count: conditionOptions.good }
            ].map((cond) => {
              const isSelected = filterState.condition === cond.id;
              return (
                <button
                  key={cond.id}
                  onClick={() => onFilterChange({ condition: cond.id })}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold'
                      : 'bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800/60 text-slate-300'
                  }`}
                >
                  <span className="text-xs">{cond.label}</span>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded-md">
                    {cond.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Trust Badges */}
      <div className="pt-2">
        <div className="bg-gradient-to-br from-cyan-950/30 to-slate-950 border border-cyan-500/20 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Rittik Quality Guarantee</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Every phone undergoes 32-point technician testing, warranty backing &amp; battery health check.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0">
        <div className="sticky top-20 bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer (Slide-over Bottom/Side Sheet) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Content */}
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200">
            {/* Mobile Header Bar */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-cyan-400" />
                <span className="font-extrabold text-sm text-slate-100">Filter Products</span>
              </div>
              <button
                onClick={onCloseMobile}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Filters */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              {sidebarContent}
            </div>

            {/* Mobile Footer Apply Button */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center gap-3">
              <button
                onClick={onResetFilters}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={onCloseMobile}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
              >
                Apply ({totalResultsCount})
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
