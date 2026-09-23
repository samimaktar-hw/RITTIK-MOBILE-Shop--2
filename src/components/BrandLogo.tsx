import React from 'react';
import { Tag, Sparkles, Smartphone } from 'lucide-react';

interface BrandLogoProps {
  brand: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showBorder?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  brand,
  size = 'md',
  className = '',
  showBorder = true
}) => {
  const norm = (brand || '').toLowerCase().trim();

  // Size dimensions
  const sizeMap = {
    sm: 'w-5 h-5 rounded-md text-[9px]',
    md: 'w-6 h-6 rounded-lg text-[10px]',
    lg: 'w-8 h-8 rounded-xl text-xs'
  };

  const currentSizeClass = sizeMap[size];

  // Specific Brand Logo Implementations
  if (norm === 'all' || norm === 'all brands') {
    return (
      <div
        className={`flex items-center justify-center shrink-0 bg-gradient-to-tr from-cyan-500/20 via-sky-500/20 to-indigo-500/20 ${
          showBorder ? 'border border-cyan-400/40' : ''
        } text-cyan-400 shadow-sm ${currentSizeClass} ${className}`}
        title="All Brands"
      >
        <Sparkles className={size === 'sm' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      </div>
    );
  }

  if (norm === 'apple') {
    return (
      <div
        className={`flex items-center justify-center shrink-0 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 ${
          showBorder ? 'border border-zinc-600/60' : ''
        } text-white shadow-sm shadow-black/40 ${currentSizeClass} ${className}`}
        title="Apple"
      >
        <svg
          viewBox="0 0 170 170"
          className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4.5 h-4.5' : 'w-3.5 h-3.5'} fill-current -translate-y-px`}
        >
          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.6-7.83-11.74-14.35-5.98-9.35-10.63-19.78-13.94-31.28-3.32-11.5-4.98-22.38-4.98-32.65 0-14.35 3.59-26.3 10.77-35.85 7.18-9.55 16.29-14.42 27.32-14.63 4.13 0 9.08 1.14 14.85 3.42 5.76 2.28 9.38 3.48 10.87 3.59 1.96-.22 5.76-1.52 11.41-3.91 5.66-2.39 10.65-3.48 14.99-3.26 11.52.43 21.08 4.78 28.69 13.04-10.22 6.2-15.22 14.78-15 25.75.22 8.7 3.48 16.08 9.78 22.17 6.3 6.09 13.91 9.46 22.82 10.11-2.17 6.52-4.67 13.04-7.5 19.56zM119.22 31.84c0-7.39 2.61-14.24 7.83-20.54 5.21-6.3 11.63-10.22 19.23-11.74.22 1.3.33 2.5.33 3.59 0 7.39-2.72 14.35-8.15 20.87-5.43 6.52-11.95 10.32-19.56 11.41-.43-1.09-.65-2.28-.65-3.59z" />
        </svg>
      </div>
    );
  }

  if (norm === 'samsung') {
    return (
      <div
        className={`flex items-center justify-center shrink-0 bg-gradient-to-br from-[#0c2f82] via-[#034ea2] to-[#012258] ${
          showBorder ? 'border border-blue-400/40' : ''
        } text-white shadow-sm shadow-blue-900/40 ${currentSizeClass} ${className}`}
        title="Samsung"
      >
        <span className="font-black text-[9px] sm:text-[10px] tracking-tight font-sans text-sky-100">
          SAM
        </span>
      </div>
    );
  }

  if (norm === 'google' || norm === 'pixel') {
    return (
      <div
        className={`flex items-center justify-center shrink-0 bg-slate-900 ${
          showBorder ? 'border border-slate-700/90' : ''
        } shadow-sm ${currentSizeClass} ${className}`}
        title="Google Pixel"
      >
        <svg
          viewBox="0 0 24 24"
          className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4.5 h-4.5' : 'w-3.5 h-3.5'}
        >
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
      </div>
    );
  }

  if (norm === 'oneplus') {
    return (
      <div
        className={`flex items-center justify-center shrink-0 bg-[#EB0029] ${
          showBorder ? 'border border-red-400/50' : ''
        } text-white shadow-sm shadow-red-500/25 ${currentSizeClass} ${className}`}
        title="OnePlus"
      >
        <div className="flex items-center justify-center font-black leading-none tracking-tighter">
          <span>1</span>
          <span className="text-[7px] font-extrabold -mt-1 ml-0.5">+</span>
        </div>
      </div>
    );
  }

  if (norm === 'xiaomi' || norm === 'redmi' || norm === 'mi') {
    return (
      <div
        className={`flex items-center justify-center shrink-0 bg-gradient-to-tr from-[#FF5700] to-[#FF7700] ${
          showBorder ? 'border border-orange-400/50' : ''
        } text-white shadow-sm shadow-orange-500/25 ${currentSizeClass} ${className}`}
        title="Xiaomi"
      >
        <span className="font-black text-[10px] tracking-tighter leading-none -translate-y-px">
          mi
        </span>
      </div>
    );
  }

  if (norm === 'vivo') {
    return (
      <div
        className={`flex items-center justify-center shrink-0 bg-gradient-to-br from-[#0066FF] to-[#0047BA] ${
          showBorder ? 'border border-blue-400/50' : ''
        } text-white shadow-sm shadow-blue-500/20 ${currentSizeClass} ${className}`}
        title="Vivo"
      >
        <span className="font-black text-[9px] tracking-tighter lowercase leading-none">
          vivo
        </span>
      </div>
    );
  }

  if (norm === 'realme') {
    return (
      <div
        className={`flex items-center justify-center shrink-0 bg-gradient-to-br from-[#FFD100] to-[#FFB700] ${
          showBorder ? 'border border-amber-300/60' : ''
        } text-slate-950 shadow-sm shadow-amber-400/20 ${currentSizeClass} ${className}`}
        title="Realme"
      >
        <span className="font-black text-[11px] tracking-tight leading-none font-sans">
          r.
        </span>
      </div>
    );
  }

  if (norm === 'oppo') {
    return (
      <div
        className={`flex items-center justify-center shrink-0 bg-gradient-to-br from-[#059669] via-[#047857] to-[#064e3b] ${
          showBorder ? 'border border-emerald-400/50' : ''
        } text-white shadow-sm shadow-emerald-500/20 ${currentSizeClass} ${className}`}
        title="Oppo"
      >
        <span className="font-black text-[8px] tracking-wider uppercase leading-none font-sans">
          OPPO
        </span>
      </div>
    );
  }

  if (norm === 'motorola' || norm === 'moto') {
    return (
      <div
        className={`flex items-center justify-center shrink-0 bg-[#001428] ${
          showBorder ? 'border border-sky-400/50' : ''
        } text-sky-400 shadow-sm shadow-sky-500/15 ${currentSizeClass} ${className}`}
        title="Motorola"
      >
        <span className="font-black text-[11px] italic tracking-tighter leading-none text-[#00A3E0]">
          M
        </span>
      </div>
    );
  }

  if (norm === 'nothing') {
    return (
      <div
        className={`flex items-center justify-center shrink-0 bg-black ${
          showBorder ? 'border border-white/40' : ''
        } text-white shadow-sm ${currentSizeClass} ${className}`}
        title="Nothing"
      >
        <span className="font-mono font-bold text-[8px] tracking-widest">
          (N)
        </span>
      </div>
    );
  }

  if (norm === 'poco') {
    return (
      <div
        className={`flex items-center justify-center shrink-0 bg-yellow-400 text-slate-950 ${
          showBorder ? 'border border-yellow-300' : ''
        } font-black shadow-sm ${currentSizeClass} ${className}`}
        title="POCO"
      >
        <span className="text-[7.5px] font-black tracking-tight leading-none">POCO</span>
      </div>
    );
  }

  if (norm === 'iqoo') {
    return (
      <div
        className={`flex items-center justify-center shrink-0 bg-slate-950 text-amber-400 ${
          showBorder ? 'border border-amber-400/50' : ''
        } font-black shadow-sm ${currentSizeClass} ${className}`}
        title="iQOO"
      >
        <span className="text-[7.5px] font-black tracking-tight leading-none">iQOO</span>
      </div>
    );
  }

  if (norm === 'asus' || norm === 'rog') {
    return (
      <div
        className={`flex items-center justify-center shrink-0 bg-gradient-to-br from-red-600 to-rose-950 text-white ${
          showBorder ? 'border border-red-500/50' : ''
        } shadow-sm shadow-red-500/20 ${currentSizeClass} ${className}`}
        title="Asus ROG"
      >
        <span className="font-black text-[8px] tracking-tight">ROG</span>
      </div>
    );
  }

  if (norm === 'sony') {
    return (
      <div
        className={`flex items-center justify-center shrink-0 bg-slate-900 text-slate-100 ${
          showBorder ? 'border border-slate-700' : ''
        } shadow-sm ${currentSizeClass} ${className}`}
        title="Sony"
      >
        <span className="font-serif font-black text-[7.5px] tracking-widest">SONY</span>
      </div>
    );
  }

  if (norm === 'dell' || norm === 'hp' || norm === 'lenovo') {
    return (
      <div
        className={`flex items-center justify-center shrink-0 bg-slate-800 text-cyan-300 ${
          showBorder ? 'border border-slate-700' : ''
        } shadow-sm font-bold ${currentSizeClass} ${className}`}
        title={brand}
      >
        <span className="font-mono text-[8px] uppercase">{brand.slice(0, 3)}</span>
      </div>
    );
  }

  // Fallback for any other custom brand
  return (
    <div
      className={`flex items-center justify-center shrink-0 bg-slate-900 text-slate-400 ${
        showBorder ? 'border border-slate-800' : ''
      } shadow-sm ${currentSizeClass} ${className}`}
      title={brand}
    >
      <Smartphone className={size === 'sm' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />
    </div>
  );
};

// Helpful metadata for brands (taglines / models)
export const getBrandMeta = (brandName: string): { tagline: string; popularSeries: string } => {
  const norm = (brandName || '').toLowerCase().trim();
  switch (norm) {
    case 'apple':
      return { tagline: 'Think Different', popularSeries: 'iPhone & iPad' };
    case 'samsung':
      return { tagline: 'Galaxy Series', popularSeries: 'S & Z Series' };
    case 'google':
    case 'pixel':
      return { tagline: 'Pure Android', popularSeries: 'Pixel 8 & 9' };
    case 'oneplus':
      return { tagline: 'Never Settle', popularSeries: 'Flagship & Nord' };
    case 'xiaomi':
    case 'redmi':
      return { tagline: 'Innovation for Everyone', popularSeries: 'Redmi & Note' };
    case 'vivo':
      return { tagline: 'Camera & Design', popularSeries: 'V & X Series' };
    case 'realme':
      return { tagline: 'Dare to Leap', popularSeries: 'Number & GT' };
    case 'oppo':
      return { tagline: 'Inspiration Ahead', popularSeries: 'Reno & Find' };
    case 'motorola':
      return { tagline: 'Hello Moto', popularSeries: 'Edge & G Series' };
    default:
      return { tagline: 'Certified Pre-Owned', popularSeries: 'Genuine Devices' };
  }
};
