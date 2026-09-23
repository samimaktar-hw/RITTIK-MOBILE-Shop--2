import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  X, 
  CheckCircle2, 
  Loader2,
  ShieldAlert,
  Sparkles,
  UserCheck,
  ArrowRight,
  LogOut
} from 'lucide-react';
import { 
  signInWithPopup,
  signOut,
  User as FirebaseUser,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { getAdminConfig, initializeFirstAdmin, verifyUserIsAdmin } from '../utils/adminAuth';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: FirebaseUser) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [hasExistingAdmin, setHasExistingAdmin] = useState<boolean | null>(null);
  const [configuredAdminEmail, setConfiguredAdminEmail] = useState<string | null>(null);
  const [configuredAdminUid, setConfiguredAdminUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAdminState, setCheckingAdminState] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<FirebaseUser | null>(auth.currentUser);
  const isProcessingRef = useRef(false);

  // Monitor active Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setActiveUser(user);
    });
    return () => unsub();
  }, []);

  // Check admin lock status whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setCheckingAdminState(true);
      setErrorMessage(null);
      setInfoMessage(null);
      setActiveUser(auth.currentUser);

      getAdminConfig()
        .then((config) => {
          if (config && config.adminUid) {
            setHasExistingAdmin(true);
            setConfiguredAdminEmail(config.adminEmail);
            setConfiguredAdminUid(config.adminUid);
          } else {
            setHasExistingAdmin(false);
            setConfiguredAdminEmail(null);
            setConfiguredAdminUid(null);
          }
        })
        .catch(() => {
          setHasExistingAdmin(false);
        })
        .finally(() => {
          setCheckingAdminState(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Google Sign-in for Admin
  const handleGoogleAdminAuth = async () => {
    if (isProcessingRef.current || loading) return;
    isProcessingRef.current = true;
    setErrorMessage(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Verify or initialize Admin
      const config = await getAdminConfig();

      if (!config || !config.adminUid) {
        // First-Time Setup: Lock this Google account as the store administrator
        await initializeFirstAdmin(user);
        onSuccess(user);
        onClose();
        return;
      }

      // Check if this Google account is the authorized Admin
      const authResult = await verifyUserIsAdmin(user);
      if (authResult.isAuthorized) {
        onSuccess(user);
        onClose();
      } else {
        await signOut(auth);
        setErrorMessage(
          `ACCESS DENIED: Google account "${user.email}" is not authorized. The registered store administrator is "${config.adminEmail || 'another account'}".`
        );
      }
    } catch (err: any) {
      // Benign user cancellation or superseded duplicate popup requests
      if (err?.code === 'auth/cancelled-popup-request') {
        return;
      }
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Google sign-in popup was closed before completing.');
        return;
      }
      if (err?.code === 'auth/popup-blocked') {
        setErrorMessage('Sign-in popup was blocked by your browser. Please allow popups for this site.');
        return;
      }

      console.error('Google Admin Sign-in error:', err);
      setErrorMessage(err?.message || 'Google authentication failed.');
    } finally {
      isProcessingRef.current = false;
      setLoading(false);
    }
  };

  // Authorize with current active user session directly
  const handleClaimOrEnterWithActiveAccount = async () => {
    if (!activeUser || isProcessingRef.current || loading) return;
    isProcessingRef.current = true;
    setErrorMessage(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      const config = await getAdminConfig();

      if (!config || !config.adminUid) {
        // First-time setup with active user
        await initializeFirstAdmin(activeUser);
        onSuccess(activeUser);
        onClose();
        return;
      }

      // Verify active user matches authorized admin UID
      const authResult = await verifyUserIsAdmin(activeUser);
      if (authResult.isAuthorized) {
        onSuccess(activeUser);
        onClose();
      } else {
        setErrorMessage(
          `ACCESS DENIED: Account "${activeUser.email}" is not authorized. The registered admin is "${config.adminEmail}".`
        );
      }
    } catch (err: any) {
      console.error('Admin authorize error:', err);
      setErrorMessage(err.message || 'Failed to authorize administrator account.');
    } finally {
      isProcessingRef.current = false;
      setLoading(false);
    }
  };

  const isCurrentActiveUserTheAdmin = Boolean(
    activeUser && configuredAdminUid && activeUser.uid === configuredAdminUid
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Return to Customer Store"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge & Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/20 mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
            Rittik Mobile Shop
          </h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-1 rounded-full bg-slate-800/90 border border-amber-500/40 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Admin Control Center</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">
            {hasExistingAdmin === false
              ? 'First-Time Setup: Sign in with Google to establish and lock the primary store administrator.'
              : 'Secure Administrator Portal for managing products, sell requests, and customer orders.'}
          </p>
        </div>

        {/* Alert / Feedback Messages */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5 animate-shake">
            <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-cyan-950/70 border border-cyan-500/50 text-cyan-200 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{infoMessage}</div>
          </div>
        )}

        {checkingAdminState ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            <span>Verifying store security configuration...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* FIRST TIME SETUP FLOW */}
            {hasExistingAdmin === false && (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-400">
                    <Sparkles className="w-4 h-4" />
                    <span>First-Time Setup Mode</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    No administrator is configured yet. Click below to sign in with your Google account. Your account UID will be locked as the sole store administrator.
                  </p>
                </div>

                {/* If active Google user is already logged in in the app */}
                {activeUser ? (
                  <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-amber-500/40 space-y-2.5">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-amber-300">
                      <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Current Google Account:</span>
                    </div>
                    <div className="text-xs font-bold text-slate-100 bg-slate-950/60 p-2.5 rounded-xl border border-slate-700/60 break-all">
                      {activeUser.email || activeUser.displayName || 'Google User'}
                    </div>

                    <button
                      type="button"
                      onClick={handleClaimOrEnterWithActiveAccount}
                      disabled={loading}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Locking Admin Privileges...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Lock {activeUser.email?.split('@')[0]} as Store Admin</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : null}

                {/* Primary Google Setup Button */}
                <button
                  type="button"
                  onClick={handleGoogleAdminAuth}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/90 border border-slate-700 hover:border-slate-600 text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Authenticating with Google...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>
                        {activeUser ? 'Use Different Google Account' : 'Continue with Google (Setup Admin)'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* EXISTING CONFIGURED ADMIN FLOW */}
            {hasExistingAdmin === true && (
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Registered Store Administrator
                  </div>
                  <div className="text-xs font-bold text-amber-300 truncate">
                    {configuredAdminEmail || 'Authorized Administrator UID'}
                  </div>
                </div>

                {/* If the current active user is the authorized admin */}
                {isCurrentActiveUserTheAdmin ? (
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Authenticated as Store Administrator</span>
                    </div>
                    <div className="text-xs text-slate-300">
                      Signed in as <span className="font-bold text-white">{activeUser?.email}</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleClaimOrEnterWithActiveAccount}
                      disabled={loading}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Entering...</span>
                        </>
                      ) : (
                        <>
                          <span>Enter Admin Control Center</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Active user is NOT the admin */}
                    {activeUser && (
                      <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[10px] text-slate-400">Currently signed in:</div>
                          <div className="text-xs font-medium text-slate-200 truncate">
                            {activeUser.email}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => signOut(auth)}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                          title="Sign Out"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Switch</span>
                        </button>
                      </div>
                    )}

                    {/* Sign in with Google (Admin) */}
                    <button
                      type="button"
                      onClick={handleGoogleAdminAuth}
                      disabled={loading}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying Admin Access...</span>
                        </>
                      ) : (
                        <>
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
                          <span>Sign in with Google (Admin)</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Cancel Footer */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                Cancel &amp; Return to Store
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
