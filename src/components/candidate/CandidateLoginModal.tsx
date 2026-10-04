import React, { useState, useEffect } from 'react';
import { Lock, Key, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { Candidate } from '../../types';
import { lookupCandidateInFirestore } from '../../lib/firebase';
import { saveCandidate } from '../../services/candidateStorage';

interface CandidateLoginModalProps {
  isOpen: boolean;
  onLogin: (candidate: Candidate) => void;
  candidates: Candidate[];
  initialCode?: string;
}

export const CandidateLoginModal: React.FC<CandidateLoginModalProps> = ({
  isOpen,
  onLogin,
  candidates,
  initialCode
}) => {
  const [accessInput, setAccessInput] = useState(initialCode || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialCode && !accessInput) {
      setAccessInput(initialCode);
      setErrorMsg('');
    }
  }, [initialCode]);

  if (!isOpen) return null;

  const handleAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const query = accessInput.trim().toLowerCase();
    if (!query) {
      setErrorMsg('Please enter your email or Access Code.');
      return;
    }

    // 1. Check local state candidates (case-insensitive & trimmed)
    const localMatch = candidates.find(c => {
      const cEmail = (c.email || '').trim().toLowerCase();
      const cCode = (c.accessCode || '').trim().toLowerCase();
      const cId = (c.id || '').trim().toLowerCase();
      return cEmail === query || cCode === query || cId === query;
    });

    if (localMatch) {
      onLogin(localMatch);
      return;
    }

    // 2. Direct Firestore lookup fallback (querying remote cloud database)
    setIsLoading(true);
    try {
      const remoteCandidate = await lookupCandidateInFirestore(query);
      if (remoteCandidate) {
        await saveCandidate(remoteCandidate, true).catch(() => {});
        onLogin(remoteCandidate);
        return;
      }

      setErrorMsg('No joiner profile found matching this Email or Access Code. Please check the credentials in your welcome email or contact your HR team.');
    } catch (err) {
      console.error('Candidate login error:', err);
      setErrorMsg('Unable to verify your access code right now. Please check your network connection or contact HR.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        
        {/* Friendly Welcome Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Lock className="w-7 h-7 text-purple-200" />
          </div>

          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            FieldAssist Pre-Onboarding Access
          </span>

          <h2 className="text-2xl font-black text-white tracking-tight">
            Candidate Access Portal
          </h2>
          <p className="text-xs text-purple-200 mt-1.5 max-w-xs mx-auto leading-relaxed">
            Welcome to FieldAssist! Enter your registered Personal Email or Unique Access Code provided in your welcome email to access your onboarding dashboard.
          </p>
        </div>

        {/* Login Form */}
        <div className="p-6 sm:p-8 space-y-5">
          <form onSubmit={handleAccessSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Personal Email or Access Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={accessInput}
                  onChange={(e) => setAccessInput(e.target.value)}
                  placeholder="e.g. your.email@example.com or FA-XXXXXXXX"
                  disabled={isLoading}
                  className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 transition font-medium disabled:opacity-60"
                  autoFocus
                />
                <Key className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer group disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Access My Pre-Onboarding Portal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
