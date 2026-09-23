import React, { useState, useEffect, useRef } from 'react';
import { AppView, LanguageCode } from '../types';
import { 
  ShoppingBag, 
  Globe, 
  User, 
  Search,
  Check,
  Moon,
  Sun,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { useStoreLogo } from '../utils/logoManager';

interface HeaderProps {
  currentView?: AppView;
  activeView?: AppView;
  onNavigate: (view: AppView) => void;
  cartCount: number;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  language?: LanguageCode;
  currentLang?: LanguageCode;
  onLanguageChange?: (lang: LanguageCode) => void;
  onOpenLangModal?: () => void;
  onSearchClick?: () => void;
  currentUser?: FirebaseUser | null;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  onOpenAdminLogin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  activeView,
  onNavigate,
  cartCount,
  theme = 'dark',
  onToggleTheme,
  language,
  currentLang,
  onLanguageChange,
  onOpenLangModal,
  onSearchClick,
  currentUser,
  onOpenAuthModal,
  onLogout,
  onOpenAdminLogin
}) => {
  const [logoUrl] = useStoreLogo();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const activeLanguage = currentLang || language || 'en';
  const effectiveView = activeView || currentView || 'home';

  // Hidden 5-Rapid-Click Admin Access Listener
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Maximum time allowed between consecutive clicks to be considered rapid (in ms)
  const RAPID_CLICK_THRESHOLD_MS = 600;
  // Inactivity timeout before resetting the click counter (in ms)
  const RESET_TIMEOUT_MS = 800;

  // Clean up any pending timer on component unmount
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const handleLogoClick = (e: React.MouseEvent) => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current;

    // Clear any pending inactivity reset timer
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    // If clicks occur too slowly, reset sequence and count this as the first click
    if (timeSinceLastClick > RAPID_CLICK_THRESHOLD_MS) {
      clickCountRef.current = 1;
    } else {
      clickCountRef.current += 1;
    }
    lastClickTimeRef.current = now;

    // If 5 rapid clicks are achieved, trigger the Admin Login Modal and reset
    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      lastClickTimeRef.current = 0;
      if (onOpenAdminLogin) {
        onOpenAdminLogin();
      }
      return;
    }

    // Schedule automatic state reset if user stops or clicks occur too slowly
    resetTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
      lastClickTimeRef.current = 0;
    }, RESET_TIMEOUT_MS);

    // Normal first click navigates to Home view
    if (clickCountRef.current === 1) {
      onNavigate('home');
    }
  };

  const languages: { code: LanguageCode; label: string; native: string; flag: string }[] = [
    { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'bn', label: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' }
  ];

  const currentLangObj = languages.find(l => l.code === activeLanguage) || languages[0];

  const handleSelectLang = (code: LanguageCode) => {
    if (onLanguageChange) {
      onLanguageChange(code);
    }
    setLangMenuOpen(false);
  };

  const handleSearch = () => {
    if (onSearchClick) {
      onSearchClick();
    } else {
      const el = document.getElementById('mainSearchInput');
      if (el) {
        el.focus();
      } else {
        onNavigate('home');
        setTimeout(() => {
          document.getElementById('mainSearchInput')?.focus();
        }, 150);
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/95 border-b border-cyan-500/25 px-3 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Logo and Store Name with Hidden 5-Rapid-Click Access */}
        <div 
          onClick={handleLogoClick}
          className="flex items-center gap-2.5 cursor-pointer group select-none flex-shrink-0"
        >
          <img
            src={logoUrl}
            alt="Rittik Mobile Shop Logo"
            draggable={false}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/assets/logo.svg';
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-xl bg-slate-950/80 border border-cyan-500/40 p-1 shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform pointer-events-none"
          />
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-100 flex items-center gap-1">
              Rittik <span className="text-cyan-400 font-extrabold">Mobile Shop</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              Buy &amp; Sell Premium Devices
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 relative">
          {/* Quick Search Shortcut */}
          <button
            onClick={handleSearch}
            title="Search products"
            className="p-2 rounded-xl text-slate-300 hover:text-cyan-400 hover:bg-slate-800/80 border border-slate-700/60 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Theme Toggle Button */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="p-2 rounded-xl text-slate-300 hover:text-cyan-400 hover:bg-slate-800/80 border border-slate-700/60 transition-colors"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4 text-cyan-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
          )}

          {/* Language Selector */}
          {onOpenLangModal ? (
            <button
              onClick={onOpenLangModal}
              title="Change Language"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-cyan-400 hover:bg-slate-800/80 border border-slate-700/60 transition-all hover:border-cyan-500/40"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">{currentLangObj.native}</span>
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                title="Select Language"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-cyan-400 hover:bg-slate-800/80 border border-slate-700/60 transition-all hover:border-cyan-500/40"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">{currentLangObj.native}</span>
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-40 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-50">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => handleSelectLang(l.code)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 flex items-center justify-between text-slate-200"
                    >
                      <span className="flex items-center gap-2">
                        <span>{l.flag}</span>
                        <span>{l.native}</span>
                      </span>
                      {activeLanguage === l.code && (
                        <Check className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sell Phone Quick Link */}
          <button
            onClick={() => onNavigate('sell')}
            title="Sell Your Old Phone"
            className={`hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              effectiveView === 'sell'
                ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:text-cyan-400 hover:bg-slate-800/80 border border-slate-700/60'
            }`}
          >
            Sell Device
          </button>

          {/* Shopping Cart Button */}
          <button
            onClick={() => onNavigate('cart')}
            title="Shopping Cart"
            className="relative p-2 rounded-xl text-slate-200 hover:text-cyan-400 hover:bg-slate-800/80 border border-slate-700/60 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>

          {/* Customer Account / Auth Button */}
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onNavigate('profile')}
                title="Customer Dashboard & Orders"
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-slate-950" />
                <span className="max-w-[70px] sm:max-w-[100px] truncate">
                  {currentUser.displayName?.split(' ')[0] || 'My Account'}
                </span>
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Log out"
                  className="p-1.5 sm:px-2 rounded-xl border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400 hover:bg-red-950/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              title="Customer Login / Sign Up"
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-slate-950" />
              <span className="whitespace-nowrap">Login / Sign Up</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
