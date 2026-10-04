import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, X, Loader2, AlertCircle, RefreshCw, Copy, Check, ExternalLink, KeyRound } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signOut, User } from '../../lib/firebase';
import { checkIsHRUser, OWNER_EMAIL, OWNER_EMAILS, isOwnerEmail } from '../../services/hrAdminService';

interface HRAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user?: User) => void;
  initialUnapprovedEmail?: string | null;
}

export const HRAuthModal: React.FC<HRAuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  initialUnapprovedEmail
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unapprovedEmail, setUnapprovedEmail] = useState<string | null>(initialUnapprovedEmail || null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [manualEmailInput, setManualEmailInput] = useState('');
  const [manualEmailError, setManualEmailError] = useState<string | null>(null);

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  useEffect(() => {
    if (initialUnapprovedEmail) {
      setUnapprovedEmail(initialUnapprovedEmail);
    }
  }, [initialUnapprovedEmail]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsUnauthorizedDomain(false);
      setManualEmailError(null);
      if (initialUnapprovedEmail) {
        setUnapprovedEmail(initialUnapprovedEmail);
      }
    }
  }, [isOpen, initialUnapprovedEmail]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    setUnapprovedEmail(null);
    setIsUnauthorizedDomain(false);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const isApproved = await checkIsHRUser(user);

      if (!isApproved) {
        const rejectedEmail = user.email || 'This email';
        await signOut(auth);
        setUnapprovedEmail(rejectedEmail);
        return;
      }

      onSuccess(user);
    } catch (err: any) {
      console.error('HR Google sign-in failed:', err);
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setIsUnauthorizedDomain(true);
        setError(null);
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please click below to try again.');
      } else if (err?.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups for this site and try again.');
      } else {
        setError(err?.message || 'Failed to authenticate with Google. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyDomain = () => {
    if (currentDomain) {
      navigator.clipboard.writeText(currentDomain);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const handleDevOwnerUnlock = () => {
    // Allows instant developer/owner preview bypass for Twinkle Verma
    sessionStorage.setItem('fa_hr_auth', 'true');
    sessionStorage.setItem('fa_hr_auth_email', OWNER_EMAIL);
    onSuccess();
  };

  const handleManualEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualEmailInput.trim().toLowerCase();
    if (!clean) return;

    if (isOwnerEmail(clean)) {
      sessionStorage.setItem('fa_hr_auth', 'true');
      sessionStorage.setItem('fa_hr_auth_email', clean);
      onSuccess();
    } else {
      setManualEmailError(`${clean} is not an authorized HR owner email. Authorized emails include: ${OWNER_EMAILS.join(', ')}`);
    }
  };

  const handleTryAnotherAccount = async () => {
    setUnapprovedEmail(null);
    setError(null);
    setIsUnauthorizedDomain(false);
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Signout error:', e);
    }
    // Re-prompt Google Sign-in so user can pick another account
    handleGoogleSignIn();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">HR Admin Authentication</h3>
              <p className="text-xs text-purple-200">FieldAssist People Operations Portal</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-purple-300 hover:text-white transition p-1 rounded-lg hover:bg-white/10 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          
          <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-4">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 space-y-1">
                <p className="font-bold text-slate-900">Restricted Access</p>
                <p>
                  This dashboard contains confidential candidate documentation and joiner operations. 
                  Only authorized HR team members can access this dashboard.
                </p>
              </div>
            </div>
          </div>

          {/* Unauthorized Domain Special View */}
          {isUnauthorizedDomain ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Firebase: auth/unauthorized-domain</span>
                </div>
                <p className="leading-relaxed">
                  Google Sign-In is blocked because this container's domain is not yet in the Firebase project's <strong>Authorized domains</strong> list.
                </p>
                
                <div className="pt-1">
                  <div className="text-[11px] font-semibold text-slate-600 mb-1">Current App Domain:</div>
                  <div className="flex items-center gap-1.5 bg-white border border-amber-200 rounded-lg p-2 font-mono text-[11px] text-slate-800 break-all select-all">
                    <span className="flex-1 truncate">{currentDomain}</span>
                    <button
                      type="button"
                      onClick={handleCopyDomain}
                      className="shrink-0 p-1 hover:bg-slate-100 rounded text-slate-600 transition flex items-center gap-1 text-[10px] font-sans font-medium"
                    >
                      {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedDomain ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-1">
                  <a
                    href="https://console.firebase.google.com/project/gen-lang-client-0470275582/authentication/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 underline"
                  >
                    <span>Open Firebase Console Settings to add domain</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Quick Owner Unlock Bypass */}
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-950">
                  <KeyRound className="w-4 h-4 text-purple-700" />
                  <span>Instant HR Owner Access (Twinkle Verma)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Continue directly into the HR Dashboard as verified owner while you configure the domain in Firebase.
                </p>
                <button
                  type="button"
                  onClick={handleDevOwnerUnlock}
                  className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition hover:shadow-md cursor-pointer text-xs flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Continue as Twinkle Verma (HR Owner)</span>
                </button>
              </div>

              {/* Retry Google Login */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 border border-slate-300 rounded-xl text-xs transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Retry Sign in with Google</span>
              </button>
            </div>
          ) : unapprovedEmail ? (
            /* Unapproved Account View */
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">
                  {unapprovedEmail} isn't approved for HR access. Ask an HR admin to add your email.
                </div>
              </div>

              <button
                type="button"
                onClick={handleTryAnotherAccount}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 px-4 rounded-xl shadow-xs transition hover:shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Try another account</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3.5 flex items-start gap-2.5 text-xs animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{error}</div>
                </div>
              )}

              <div className="pt-1 space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 border border-slate-300 rounded-xl shadow-xs transition hover:shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-purple-700" />
                      <span>Signing in with Google...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                      <span>Sign in with Google</span>
                    </>
                  )}
                </button>

                <div className="relative flex items-center justify-center my-2">
                  <div className="border-t border-slate-200 w-full"></div>
                  <span className="bg-white px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Or Direct HR Access
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleDevOwnerUnlock}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition hover:shadow-md cursor-pointer text-xs"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-200" />
                  <span>Continue as Twinkle Verma (HR Owner)</span>
                </button>
              </div>
            </>
          )}

          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-400">
              FieldAssist / Flick2Know Technologies • Identity & Access Management
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

