import React, { useState, useEffect } from 'react';
import { Lock, UserCheck, Key, ArrowRight, ShieldCheck, Sparkles, CheckCircle, Mail } from 'lucide-react';
import { Candidate } from '../../types';
import { CandidateAvatar } from '../CandidateAvatar';
import { toTitleCase } from '../../utils/textUtils';

interface CandidateLoginModalProps {
  isOpen: boolean;
  onLogin: (candidate: Candidate) => void;
  onSwitchToHR: () => void;
  candidates: Candidate[];
}

export const CandidateLoginModal: React.FC<CandidateLoginModalProps> = ({
  isOpen,
  onLogin,
  onSwitchToHR,
  candidates
}) => {
  const [accessInput, setAccessInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const query = accessInput.trim().toLowerCase();
    if (!query) {
      setErrorMsg('Please enter your email or Access Code.');
      return;
    }

    const matched = candidates.find(c =>
      c.email.toLowerCase() === query ||
      (c.accessCode && c.accessCode.toLowerCase() === query) ||
      c.id.toLowerCase() === query
    );

    if (matched) {
      onLogin(matched);
    } else {
      setErrorMsg('No joiner profile found matching this Email or Access Code. Please check your HR invitation email or use a Demo Login below.');
    }
  };

  const handleQuickDemoLogin = (cand: Candidate) => {
    setAccessInput(cand.accessCode || cand.email);
    onLogin(cand);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        
        {/* Banner */}
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
          <p className="text-xs text-purple-200 mt-1 max-w-sm mx-auto">
            Welcome to FieldAssist! Enter your Personal Email or Unique Access Code provided by your HR team to access your personalized joining details.
          </p>
        </div>

        {/* Login Form */}
        <div className="p-6 sm:p-8 space-y-6">
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
                  placeholder="e.g. rahul.sharma@example.com or FA-1001"
                  className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 transition font-medium"
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
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>Access My Pre-Onboarding Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Demo Profiles */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2 text-center">
              ⚡ Quick Demo Login (Click to Test)
            </span>
            <div className="space-y-2">
              {candidates.slice(0, 3).map((cand) => (
                <button
                  key={cand.id}
                  onClick={() => handleQuickDemoLogin(cand)}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-purple-50 hover:border-purple-300 transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <CandidateAvatar candidate={cand} size="sm" />
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-purple-900">{toTitleCase(cand.name)}</p>
                      <p className="text-[10px] text-slate-500">{cand.role.split('(')[0]} • {cand.officeCity}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-2 py-1 rounded-md border border-purple-200">
                    {cand.accessCode || 'FA-1001'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* HR Switch */}
          <div className="pt-2 text-center">
            <button
              onClick={onSwitchToHR}
              className="text-xs text-purple-700 hover:text-purple-900 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Are you an HR Administrator? Open HR Dashboard</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
