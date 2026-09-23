import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { 
  X, 
  Upload, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Star, 
  AlertCircle, 
  Image as ImageIcon 
} from 'lucide-react';
import { uploadImageToImgBB } from '../../utils/imgbb';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface ProductEditModalProps {
  product: Product | null; // null for "Add New Product", existing Product for "Edit"
  isOpen: boolean;
  onClose: () => void;
  onSave: (savedProduct: Product) => void;
}

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  product,
  isOpen,
  onClose,
  onSave
}) => {
  const isEditing = !!product;

  // Form States
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('Apple');
  const [category, setCategory] = useState<'mobile' | 'watch' | 'accessory'>('mobile');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [stockQuantity, setStockQuantity] = useState('5');
  const [outOfStock, setOutOfStock] = useState(false);
  const [conditionType, setConditionType] = useState<'new' | 'used'>('used');
  const [condition, setCondition] = useState('Superb');
  const [quality, setQuality] = useState('32-Point Certified Pre-Owned');
  const [warranty, setWarranty] = useState('6 Months Store Warranty');
  const [ram, setRam] = useState('8 GB');
  const [rom, setRom] = useState('128 GB');
  const [processor, setProcessor] = useState('High Performance Flagship Chip');
  const [display, setDisplay] = useState('6.7" OLED Super Retina XDR 120Hz');
  const [camera, setCamera] = useState('48MP AI Quad Camera System');
  const [battery, setBattery] = useState('89% Battery Health');
  const [description, setDescription] = useState('');
  
  // Images (Up to 4)
  const [images, setImages] = useState<string[]>([]);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Populate fields when modal opens
  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setBrand(product.brand || 'Apple');
      setCategory(product.category || 'mobile');
      setPrice(product.price ? product.price.toString() : '');
      setMrp(product.mrp ? product.mrp.toString() : '');
      setStockQuantity(product.stockQuantity !== undefined ? product.stockQuantity.toString() : '5');
      setOutOfStock(!!product.outOfStock);
      setConditionType(product.conditionType || 'used');
      setCondition(product.condition || 'Superb');
      setQuality(product.quality || '32-Point Certified Pre-Owned');
      setWarranty(product.warranty || '6 Months Store Warranty');
      setRam(product.highlights?.ram || '8 GB');
      setRom(product.highlights?.rom || '128 GB');
      setProcessor(product.processor || 'High Performance Chip');
      setDisplay(product.display || 'OLED Display');
      setCamera(product.camera || 'High Definition Camera');
      setBattery(product.battery || '89% Battery Health');
      setDescription(product.description || '');
      setImages(product.images && product.images.length > 0 ? [...product.images] : []);
    } else {
      // Default reset for Add New Product
      setName('');
      setBrand('Apple');
      setCategory('mobile');
      setPrice('');
      setMrp('');
      setStockQuantity('5');
      setOutOfStock(false);
      setConditionType('used');
      setCondition('Superb');
      setQuality('32-Point Quality Certified');
      setWarranty('6 Months Store Warranty');
      setRam('8 GB');
      setRom('128 GB');
      setProcessor('Octa-Core High Speed Processor');
      setDisplay('6.7" Super Retina AMOLED');
      setCamera('48MP AI Camera');
      setBattery('89% Battery Health');
      setDescription('');
      setImages([]);
    }
    setCustomImageUrl('');
    setUploadError(null);
  }, [product, isOpen]);

  // Handle image upload via ImgBB
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length >= 4) {
      setUploadError('Maximum 4 images allowed per product.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const availableSlots = 4 - images.length;
    const filesToUpload = Array.from(files).slice(0, availableSlots);

    try {
      const uploadPromises = filesToUpload.map((file) => uploadImageToImgBB(file));
      const uploadedUrls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploadedUrls].slice(0, 4));
    } catch (err: any) {
      setUploadError(err?.message || 'Error uploading image to ImgBB.');
    } finally {
      setIsUploading(false);
      // Clear input
      e.target.value = '';
    }
  };

  // Add image by URL
  const handleAddImageUrl = () => {
    const cleanUrl = customImageUrl.trim();
    if (!cleanUrl) return;

    if (images.length >= 4) {
      setUploadError('Maximum 4 images allowed per product.');
      return;
    }

    setImages((prev) => [...prev, cleanUrl]);
    setCustomImageUrl('');
    setUploadError(null);
  };

  // Remove an image
  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Set image as main (move to index 0)
  const handleSetAsMain = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.unshift(item);
      return copy;
    });
  };

  // Save product (Add or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      setUploadError('Product name and selling price are required.');
      return;
    }

    const priceNum = parseFloat(price) || 0;
    const mrpNum = parseFloat(mrp) || Math.round(priceNum * 1.35);
    const stockQtyNum = parseInt(stockQuantity, 10) || 0;

    const fallbackImage = 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80';
    const finalImages = images.length > 0 ? images : [fallbackImage];

    const productId = product?.id || `p-${Date.now()}`;

    const updatedProduct: Product = {
      id: productId,
      name: name.trim(),
      brand: brand.trim(),
      category,
      price: priceNum,
      mrp: mrpNum,
      rating: product?.rating || 4.9,
      reviewsCount: product?.reviewsCount || 12,
      createdAt: product?.createdAt || Date.now(),
      outOfStock: outOfStock || stockQtyNum <= 0,
      stockQuantity: stockQtyNum,
      conditionType,
      condition: condition.trim() || (conditionType === 'new' ? 'Brand New Sealed' : 'Superb'),
      quality: quality.trim() || 'Certified 32-Point Quality Inspected',
      bodyCondition: conditionType === 'new' ? 'Pristine Sealed' : 'Flawless Condition',
      displayCondition: 'Original Tested Display',
      batteryCondition: battery.trim(),
      accessories: conditionType === 'new' ? 'Original In-Box Accessories' : 'Fast Charger & Cable Included',
      boxAvailable: conditionType === 'new' ? 'Original Brand Sealed Box' : 'Yes (Original or Store Box)',
      warranty: warranty.trim() || (conditionType === 'new' ? '1 Year Brand Warranty' : '6 Months Store Warranty'),
      processor: processor.trim(),
      camera: camera.trim(),
      display: display.trim(),
      battery: battery.trim(),
      network: '5G Dual SIM Ready',
      images: finalImages,
      description: description.trim(),
      highlights: {
        ram: ram.trim(),
        rom: rom.trim()
      }
    };

    setIsSaving(true);
    try {
      // Save directly to Firebase Firestore
      const docRef = doc(db, 'products', productId);
      await setDoc(docRef, updatedProduct, { merge: true });
    } catch (err) {
      console.warn('Firestore product write note:', err);
    }

    setIsSaving(false);
    onSave(updatedProduct);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative my-8 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h3 className="text-base sm:text-lg font-black text-slate-100">
                {isEditing ? `Edit Product: ${product?.name}` : 'Add New Device / Product to Store'}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEditing 
                ? 'Update specifications, pricing, stock and images. Changes sync instantly.' 
                : 'Fill in product details to immediately publish to customer storefront.'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 py-4 space-y-5">
          {/* Section 1: Basic Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider">
              1. Basic Information &amp; Product Type
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Product Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apple iPhone 15 Pro Max (Natural Titanium, 256GB)"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Brand <span className="text-red-400">*</span>
                </label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                >
                  <option value="Apple">Apple</option>
                  <option value="Samsung">Samsung</option>
                  <option value="OnePlus">OnePlus</option>
                  <option value="Google">Google Pixel</option>
                  <option value="Xiaomi">Xiaomi</option>
                  <option value="Realme">Realme</option>
                  <option value="Vivo">Vivo</option>
                  <option value="Motorola">Motorola</option>
                  <option value="Nothing">Nothing</option>
                  <option value="Other">Other Brand</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                >
                  <option value="mobile">Smartphone</option>
                  <option value="watch">Smartwatch</option>
                  <option value="accessory">Accessory</option>
                </select>
              </div>

              {/* Product Type (NEW vs USED) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Product Type <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 border border-slate-700 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setConditionType('new');
                      if (condition === 'Superb') setCondition('Brand New Sealed');
                      if (warranty.includes('Store')) setWarranty('1 Year Brand Warranty');
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      conditionType === 'new'
                        ? 'bg-emerald-500 text-slate-950 font-black shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    NEW
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConditionType('used');
                      if (condition === 'Brand New Sealed') setCondition('Superb');
                      if (warranty.includes('Brand')) setWarranty('6 Months Store Warranty');
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      conditionType === 'used'
                        ? 'bg-amber-400 text-slate-950 font-black shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    2ND HAND
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Stock Control */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider">
              2. Price, Stock &amp; Inventory Status
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Selling Price (₹) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 54999"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-bold focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Original MRP (₹)
                </label>
                <input
                  type="number"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  placeholder="e.g. 79999"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Stock Units (Quantity)
                </label>
                <input
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => {
                    setStockQuantity(e.target.value);
                    if (parseInt(e.target.value, 10) <= 0) setOutOfStock(true);
                  }}
                  min="0"
                  placeholder="e.g. 5"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Stock Status Toggle
                </label>
                <button
                  type="button"
                  onClick={() => setOutOfStock(!outOfStock)}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    outOfStock
                      ? 'bg-red-950/80 border border-red-500/60 text-red-300 hover:bg-red-900'
                      : 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 hover:bg-emerald-900'
                  }`}
                >
                  {outOfStock ? (
                    <>
                      <X className="w-3.5 h-3.5" />
                      <span>Out of Stock</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>In Stock</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Condition & Specifications */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider">
              3. Condition, Warranty &amp; Specifications
            </h4>

            {/* Condition Text Input + Quick Chips */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300 uppercase">
                  Device Condition (Manual Text)
                </label>
                <span className="text-[11px] text-slate-400">
                  Shown on customer product page
                </span>
              </div>
              <input
                type="text"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="e.g. Excellent condition, Minor scratches, 100% Mint, Like New"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-400 mb-2"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500">Presets:</span>
                {['Brand New Sealed', 'Flawless (Like New)', 'Superb Condition', 'Very Good (Minor Scratches)', 'Fair / Budget'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setCondition(chip)}
                    className="px-2 py-0.5 rounded-lg text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Quality Assurance Label
                </label>
                <input
                  type="text"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  placeholder="e.g. 32-Point Quality Certified"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Warranty Coverage
                </label>
                <input
                  type="text"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                  placeholder="e.g. 6 Months Store Warranty"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  RAM
                </label>
                <input
                  type="text"
                  value={ram}
                  onChange={(e) => setRam(e.target.value)}
                  placeholder="e.g. 8 GB"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Storage (ROM)
                </label>
                <input
                  type="text"
                  value={rom}
                  onChange={(e) => setRom(e.target.value)}
                  placeholder="e.g. 128 GB"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Battery / Health
                </label>
                <input
                  type="text"
                  value={battery}
                  onChange={(e) => setBattery(e.target.value)}
                  placeholder="e.g. 89% Battery Health"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Processor
                </label>
                <input
                  type="text"
                  value={processor}
                  onChange={(e) => setProcessor(e.target.value)}
                  placeholder="e.g. A17 Pro / Snapdragon"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Display Specs
                </label>
                <input
                  type="text"
                  value={display}
                  onChange={(e) => setDisplay(e.target.value)}
                  placeholder='e.g. 6.7" Super Retina XDR 120Hz'
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Camera Specs
                </label>
                <input
                  type="text"
                  value={camera}
                  onChange={(e) => setCamera(e.target.value)}
                  placeholder="e.g. 48MP Main + 12MP Ultra-wide"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Additional Description / Highlights
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Key highlights, special bundled accessories, store inspection notes..."
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 resize-none focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Section 4: Product Images (Up to 4 images with ImgBB upload & URL) */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider">
                4. Product Images (Up to 4 Photos)
              </h4>
              <span className="text-[11px] font-bold text-slate-400">
                {images.length} / 4 Images
              </span>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Existing Images Thumbnails */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 aspect-square flex items-center justify-center p-2"
                  >
                    <img
                      src={imgUrl}
                      alt={`Product image ${idx + 1}`}
                      className="max-h-full max-w-full object-contain"
                    />

                    {/* Badge */}
                    <div className="absolute top-2 left-2">
                      {idx === 0 ? (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-cyan-500 text-slate-950 shadow">
                          Main Image
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-900/80 text-slate-300 border border-slate-700">
                          #{idx + 1}
                        </span>
                      )}
                    </div>

                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetAsMain(idx)}
                          className="px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold hover:bg-cyan-500 hover:text-slate-950 transition-colors w-full cursor-pointer"
                        >
                          Set as Main
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="px-2 py-1 rounded-lg bg-red-950 text-red-300 border border-red-500/40 text-[10px] font-bold hover:bg-red-800 transition-colors flex items-center justify-center gap-1 w-full cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Image Inputs */}
            {images.length < 4 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Upload File Button */}
                <label className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-400 bg-slate-950/60 hover:bg-slate-950 transition-all cursor-pointer ${
                  isUploading ? 'opacity-60 pointer-events-none' : ''
                }`}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                  {isUploading ? (
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Uploading to ImgBB...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-cyan-400 mb-1" />
                      <span className="text-xs font-bold text-slate-200">
                        Upload Image File
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        JPEG, PNG, WebP via ImgBB
                      </span>
                    </>
                  )}
                </label>

                {/* Paste Image URL */}
                <div className="flex flex-col justify-center p-3 rounded-2xl border border-slate-700 bg-slate-950/60">
                  <label className="text-[11px] font-bold text-slate-400 mb-1">
                    Or Enter Image URL:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-bold cursor-pointer transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to Firebase...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isEditing ? 'Save Product Changes' : 'Publish to Catalog'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
