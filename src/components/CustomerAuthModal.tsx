import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Phone, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ShieldCheck, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  sendPasswordResetEmail, 
  updateProfile,
  User 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { PendingAuthAction } from '../types';
import { useStoreLogo } from '../utils/logoManager';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  pendingAction: PendingAuthAction | null;
}

type AuthMode = 'login' | 'signup' | 'forgot_password';

// Synthetic mechanical lamp switch click sound using Web Audio API
const playSwitchSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Primary click
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(1400, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);
    gain1.gain.setValueAtTime(0.35, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.045);

    // Rebound resonant click (12ms later)
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(800, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.035);
        gain2.gain.setValueAtTime(0.2, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.04);
      } catch {}
    }, 15);
  } catch {}
};

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  pendingAction
}) => {
  const [storeLogo] = useStoreLogo();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isLampOn, setIsLampOn] = useState(true);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pull String Physics & Pointer Dragging
  const [pullOffset, setPullOffset] = useState(0);
  const [isDraggingString, setIsDraggingString] = useState(false);
  const dragStartY = useRef(0);
  const currentPullOffset = useRef(0);
  const stringHandleRef = useRef<HTMLDivElement>(null);
  const isGoogleSigningInRef = useRef(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLampOn(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      setPullOffset(0);
    }
  }, [isOpen]);

  // Toggle Lamp with string pull
  const handleToggleLamp = useCallback(() => {
    playSwitchSound();
    setIsLampOn(prev => !prev);
  }, []);

  // Pointer event handlers for string handle
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDraggingString(true);
    dragStartY.current = e.clientY;
    currentPullOffset.current = 0;
    if (stringHandleRef.current) {
      stringHandleRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingString) return;
    const deltaY = Math.max(0, Math.min(e.clientY - dragStartY.current, 65));
    currentPullOffset.current = deltaY;
    setPullOffset(deltaY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingString) return;
    setIsDraggingString(false);
    if (stringHandleRef.current && stringHandleRef.current.hasPointerCapture(e.pointerId)) {
      stringHandleRef.current.releasePointerCapture(e.pointerId);
    }

    // Trigger toggle if dragged past 20px OR if simple tap/click
    if (currentPullOffset.current >= 18 || Math.abs(e.clientY - dragStartY.current) < 5) {
      handleToggleLamp();
    }

    // Animate snap back with elastic spring
    setPullOffset(0);
  };

  // Human-friendly Firebase error messages
  const getFriendlyErrorMessage = (error: unknown): string => {
    if (!error || typeof error !== 'object') return 'Something went wrong. Please try again.';
    const err = error as { code?: string; message?: string };
    const code = err.code || '';

    switch (code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.';
      case 'auth/operation-not-allowed':
        return 'Email/Password sign-in is disabled for this Firebase project. Please sign in using the "Continue with Google" button below.';
      case 'auth/network-request-failed':
        return 'Network connection error. Please check your internet.';
      case 'auth/cancelled-popup-request':
        return '';
      case 'auth/popup-closed-by-user':
        return 'Google sign-in popup was closed before completing.';
      case 'auth/popup-blocked':
        return 'Sign-in popup was blocked by your browser. Please allow popups.';
      default:
        return err.message || 'Authentication error. Please try again.';
    }
  };

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // Update or ensure user document in Firestore
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            uid: user.uid,
            name: user.displayName || cleanEmail.split('@')[0],
            mobile: user.phoneNumber || '',
            email: cleanEmail,
            createdDate: new Date().toISOString(),
            accountStatus: 'active'
          });
        }
      } catch {
        // Document fetch fallback
      }

      onSuccess(user);
    } catch (err) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Signup submission
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    const cleanName = fullName.trim();
    const cleanMobile = mobileNumber.trim();

    if (!cleanName) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (cleanMobile && cleanMobile.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!cleanEmail) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // Update Firebase Auth Display Name
      await updateProfile(user, { displayName: cleanName });

      // Save customer profile in Firestore
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: cleanName,
          mobile: cleanMobile,
          email: cleanEmail,
          createdDate: new Date().toISOString(),
          accountStatus: 'active'
        });
      } catch {
        // Fallback for Firestore rules if offline
      }

      onSuccess(user);
    } catch (err) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Login
  const handleGoogleSignIn = async () => {
    if (isGoogleSigningInRef.current || isLoading) return;
    isGoogleSigningInRef.current = true;
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Ensure customer profile in Firestore
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            uid: user.uid,
            name: user.displayName || 'Customer',
            mobile: user.phoneNumber || '',
            email: user.email || '',
            createdDate: new Date().toISOString(),
            accountStatus: 'active'
          });
        }
      } catch {
        // Firestore fallback
      }

      onSuccess(user);
    } catch (err: any) {
      if (err?.code === 'auth/cancelled-popup-request') {
        return;
      }
      const msg = getFriendlyErrorMessage(err);
      if (msg) {
        setErrorMessage(msg);
      }
    } finally {
      isGoogleSigningInRef.current = false;
      setIsLoading(false);
    }
  };

  // Handle Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setSuccessMessage('Password reset email sent! Check your inbox for instructions.');
    } catch (err) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Fireflies particle data
  const fireflyCount = 14;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/80 backdrop-blur-md transition-opacity duration-300 select-none"
      onClick={onClose}
    >
      {/* Dark Room Container */}
      <div 
        className="relative w-full max-w-lg min-h-[580px] bg-[#050505] rounded-3xl border border-neutral-800/80 shadow-2xl overflow-hidden flex flex-col items-center justify-start p-4 sm:p-6 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button (Safely Cancels Pending Action) */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100 flex items-center justify-center border border-neutral-700/60 transition-all hover:scale-110 active:scale-95 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ambient Room Light (Blooms when lamp is ON) */}
        <div 
          className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ease-out ${
            isLampOn ? 'opacity-100' : 'opacity-15'
          }`}
          style={{
            background: 'radial-gradient(ellipse 90% 70% at 50% 12%, rgba(255, 214, 102, 0.22) 0%, rgba(255, 170, 0, 0.06) 45%, transparent 85%)'
          }}
        />

        {/* ======================================================== */}
        {/* ANIMATED LAMP FIXTURE & INTERACTIVE PULL STRING         */}
        {/* ======================================================== */}
        <div className="relative z-20 w-full flex flex-col items-center pt-1 mb-2">
          {/* Ceiling Mount */}
          <div className="w-12 h-1.5 bg-neutral-700 rounded-full shadow-md" />

          {/* Lamp Stem */}
          <div className="w-1.5 h-6 bg-gradient-to-b from-neutral-600 via-neutral-500 to-amber-700/80" />

          {/* Lamp Socket Collar */}
          <div className="w-7 h-2 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 rounded-sm shadow-sm" />

          {/* Lamp Shade (Head) */}
          <div className="relative">
            <svg 
              viewBox="0 0 160 50" 
              className="w-36 h-11 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
            >
              <defs>
                <linearGradient id="shadeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#262626" />
                  <stop offset="50%" stopColor="#171717" />
                  <stop offset="90%" stopColor="#0a0a0a" />
                  <stop offset="100%" stopColor="#eab308" />
                </linearGradient>
              </defs>
              {/* Conical shade polygon */}
              <polygon 
                points="42,2 118,2 152,46 8,46" 
                fill="url(#shadeGrad)" 
                stroke={isLampOn ? '#fbbf24' : '#525252'} 
                strokeWidth="1.5"
              />
              {/* Golden trim line */}
              <line x1="8" y1="46" x2="152" y2="46" stroke="#fbbf24" strokeWidth="2.5" />
            </svg>

            {/* Lamp Bulb Glow (Warm yellow burst) */}
            <div 
              className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-8 rounded-full blur-md transition-all duration-500 pointer-events-none ${
                isLampOn ? 'bg-amber-300 opacity-95 scale-110' : 'bg-transparent opacity-0 scale-75'
              }`}
            />
          </div>

          {/* Conical Light Beam Effect */}
          <div 
            className={`pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 w-80 sm:w-96 h-[440px] transition-all duration-700 ease-out origin-top ${
              isLampOn ? 'opacity-90 scale-100' : 'opacity-0 scale-90'
            }`}
            style={{
              background: 'linear-gradient(to bottom, rgba(255, 226, 120, 0.42) 0%, rgba(255, 195, 50, 0.14) 45%, rgba(255, 180, 20, 0.02) 100%)',
              clipPath: 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)',
              filter: 'blur(2px)'
            }}
          />

          {/* Fireflies floating particles in light beam */}
          {isLampOn && (
            <div className="pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 w-72 h-72 overflow-hidden">
              {Array.from({ length: fireflyCount }).map((_, i) => {
                const posX = 15 + ((i * 37) % 70);
                const posY = 10 + ((i * 23) % 75);
                const delay = (i * 0.45) % 3.5;
                const size = 2 + (i % 3);
                return (
                  <div
                    key={i}
                    className="absolute rounded-full bg-amber-200 shadow-[0_0_8px_#fef08a] animate-pulse"
                    style={{
                      left: `${posX}%`,
                      top: `${posY}%`,
                      width: `${size}px`,
                      height: `${size}px`,
                      animationDelay: `${delay}s`,
                      animationDuration: `${2.5 + (i % 3)}s`
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Interactive Pull String (SVG Bead Chain + Handle) */}
          <div 
            className="absolute top-[52px] right-[78px] sm:right-[112px] z-30 flex flex-col items-center cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            title={isLampOn ? "Pull string to turn off lamp" : "Pull string to turn on lamp"}
          >
            {/* Hanging String (Stretches on Drag) */}
            <svg 
              width="6" 
              height={45 + pullOffset} 
              className="overflow-visible transition-transform"
            >
              <line 
                x1="3" 
                y1="0" 
                x2="3" 
                y2={45 + pullOffset} 
                stroke="#d97706" 
                strokeWidth="1.8" 
                strokeDasharray="2.5,2.5" 
              />
            </svg>

            {/* Brass String Handle (Bead) */}
            <div 
              ref={stringHandleRef}
              className={`w-3.5 h-5 rounded-full bg-gradient-to-b from-amber-300 via-amber-500 to-yellow-600 shadow-md border border-amber-300/80 transition-transform active:scale-110 flex items-center justify-center ${
                isDraggingString ? 'scale-110 ring-2 ring-amber-400/50' : 'hover:scale-105'
              }`}
              style={{
                transform: `translateY(${pullOffset}px)`,
                transition: isDraggingString ? 'none' : 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <div className="w-1 h-2 bg-amber-100 rounded-full opacity-60" />
            </div>

            {/* Hint prompt when lamp is OFF */}
            {!isLampOn && (
              <div className="absolute top-12 left-6 whitespace-nowrap bg-neutral-900/90 border border-amber-500/40 text-amber-300 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xl animate-bounce pointer-events-none flex items-center gap-1">
                <span>💡 Pull string to turn on!</span>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* GLASSMORPHISM LOGIN / SIGNUP CARD                       */}
        {/* ======================================================== */}
        <div 
          className={`relative z-20 w-full max-w-sm rounded-3xl p-5 sm:p-6 transition-all duration-500 ease-out ${
            isLampOn 
              ? 'opacity-100 translate-y-0 bg-[#12141c]/80 backdrop-blur-xl border border-amber-400/30 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_35px_rgba(245,158,11,0.18)]' 
              : 'opacity-25 translate-y-2 pointer-events-none bg-neutral-950/60 border border-neutral-800'
          }`}
        >
          {/* Card Header & Brand */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <img 
                src={storeLogo} 
                alt="Rittik Mobile Shop" 
                className="w-8 h-8 rounded-xl object-contain drop-shadow"
                onError={(e) => {
                  // Fallback to text initials if image fails
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="font-extrabold text-sm tracking-wide text-amber-400 uppercase">
                Rittik Mobile Shop
              </span>
            </div>

            {authMode === 'login' && (
              <>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Welcome Back
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Login to continue shopping
                </p>
              </>
            )}

            {authMode === 'signup' && (
              <>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Create Account
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Join Rittik Mobile Shop for verified deals
                </p>
              </>
            )}

            {authMode === 'forgot_password' && (
              <>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Reset Password
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Enter your email to receive a password reset link
                </p>
              </>
            )}

            {/* Pending Action Notification Badge */}
            {pendingAction && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>
                  {pendingAction.type === 'add_to_cart'
                    ? `Login to add "${pendingAction.product.name}" to cart`
                    : `Login to buy "${pendingAction.product.name}"`}
                </span>
              </div>
            )}
          </div>

          {/* Error Message Banner */}
          {errorMessage && (
            <div className="mb-3.5 p-2.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs font-semibold flex items-start gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message Banner */}
          {successMessage && (
            <div className="mb-3.5 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-start gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* LOGIN FORM                                              */}
          {/* ======================================================== */}
          {authMode === 'login' && (
            <div className="space-y-3">
              {/* Google Login Button (Primary & Recommended) */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-neutral-950 text-xs font-black flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-60"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#1e293b"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#1e293b"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#1e293b"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#1e293b"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google (Instant)</span>
              </button>

              <div className="relative my-2 flex items-center justify-center">
                <div className="w-full border-t border-neutral-800" />
                <span className="absolute bg-[#12141c] px-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                  OR WITH EMAIL
                </span>
              </div>

              <form onSubmit={handleLogin} className="space-y-3">
                {/* Email Address */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-neutral-900/90 border border-neutral-700 focus:border-amber-400 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-neutral-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage(null);
                        setSuccessMessage(null);
                        setAuthMode('forgot_password');
                      }}
                      className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-9 pr-9 py-2 bg-neutral-900/90 border border-neutral-700 focus:border-amber-400 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-neutral-300" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>LOGIN WITH PASSWORD</span>
                  )}
                </button>

                {/* Switch to Signup */}
                <div className="pt-2 text-center text-xs text-neutral-400">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setAuthMode('signup');
                    }}
                    className="font-bold text-amber-400 hover:text-amber-300 ml-1 transition-colors cursor-pointer"
                  >
                    SIGN UP
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* SIGNUP FORM                                             */}
          {/* ======================================================== */}
          {authMode === 'signup' && (
            <div className="space-y-2.5">
              {/* Google Fast Signup */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-neutral-950 text-xs font-black flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-60"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#1e293b"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#1e293b"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#1e293b"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#1e293b"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign up with Google (Fast & 1-Click)</span>
              </button>

              <div className="relative my-2 flex items-center justify-center">
                <div className="w-full border-t border-neutral-800" />
                <span className="absolute bg-[#12141c] px-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                  OR FILL FORM
                </span>
              </div>

              <form onSubmit={handleSignup} className="space-y-2.5">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your Full Name"
                    required
                    className="w-full pl-9 pr-3 py-1.5 bg-neutral-900/90 border border-neutral-700 focus:border-amber-400 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                  Mobile Number (For Order Confirmation)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="10-digit mobile number"
                    required
                    className="w-full pl-9 pr-3 py-1.5 bg-neutral-900/90 border border-neutral-700 focus:border-amber-400 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-9 pr-3 py-1.5 bg-neutral-900/90 border border-neutral-700 focus:border-amber-400 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all"
                  />
                </div>
              </div>

              {/* Password & Confirm Password Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      required
                      className="w-full pl-7 pr-2 py-1.5 bg-neutral-900/90 border border-neutral-700 focus:border-amber-400 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                    Confirm
                  </label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat"
                      required
                      className="w-full pl-7 pr-2 py-1.5 bg-neutral-900/90 border border-neutral-700 focus:border-amber-400 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-black text-neutral-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-105 active:scale-[0.98] shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>CREATE ACCOUNT</span>
                )}
              </button>

              {/* Switch back to Login */}
              <div className="pt-1.5 text-center text-xs text-neutral-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setAuthMode('login');
                  }}
                  className="font-bold text-amber-400 hover:text-amber-300 ml-1 transition-colors cursor-pointer"
                >
                  LOGIN
                </button>
              </div>
            </form>
          </div>
        )}

          {/* ======================================================== */}
          {/* FORGOT PASSWORD FORM                                    */}
          {/* ======================================================== */}
          {authMode === 'forgot_password' && (
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-neutral-900/90 border border-neutral-700 focus:border-amber-400 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-black text-neutral-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-105 active:scale-[0.98] shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                    <span>Sending link...</span>
                  </>
                ) : (
                  <span>SEND RESET LINK</span>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setAuthMode('login');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Login</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
