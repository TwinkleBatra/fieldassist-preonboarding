import React from 'react';
import { Users, User, ShieldCheck, LogOut, Key } from 'lucide-react';
import { Candidate } from '../types';
import { CandidateAvatar } from './CandidateAvatar';
import { toTitleCase } from '../utils/textUtils';

interface HeaderProps {
  activeView: 'candidate' | 'hr';
  setActiveView?: (view: 'candidate' | 'hr') => void;
  candidates: Candidate[];
  activeCandidateId: string;
  onSelectCandidate?: (id: string) => void;
  isCandidateLoggedIn: boolean;
  onLogoutCandidate: () => void;
  onOpenCandidateLogin: () => void;
  onOpenHRAuth?: () => void;
  isHRAuthenticated?: boolean;
  onLogoutHR?: () => void;
  hrEmail?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  candidates,
  activeCandidateId,
  isCandidateLoggedIn,
  onLogoutCandidate,
  onOpenCandidateLogin,
  isHRAuthenticated,
  onLogoutHR,
  hrEmail
}) => {
  const activeCandidate = candidates.find(c => (c.id || '').trim() === (activeCandidateId || '').trim());

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 font-black text-xl tracking-tight">
              FA
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">FieldAssist</span>
                <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {activeView === 'hr' ? 'HR Management' : 'Pre-Onboarding'}
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                {activeView === 'hr' ? 'HR Operations & Joiner Governance' : 'Welcome & Onboarding Portal'}
              </p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Candidate Logged In Badge (Only in Candidate View) */}
            {activeView === 'candidate' && isCandidateLoggedIn && activeCandidate && (
              <div className="flex items-center gap-2 bg-purple-50 border border-purple-200/80 rounded-xl px-3 py-1.5 text-xs">
                <CandidateAvatar candidate={activeCandidate} size="xs" />
                <div className="hidden sm:block">
                  <span className="font-bold text-slate-900 block leading-tight">{toTitleCase(activeCandidate.name)}</span>
                  <span className="text-[10px] text-purple-700 font-mono font-bold block">{activeCandidate.accessCode || 'FA-1001'}</span>
                </div>
                <button
                  onClick={onLogoutCandidate}
                  className="ml-1 p-1 hover:bg-purple-200/60 rounded-lg text-purple-800 transition cursor-pointer"
                  title="Log Out Candidate"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* If Candidate not logged in and on candidate portal */}
            {activeView === 'candidate' && !isCandidateLoggedIn && (
              <button
                onClick={onOpenCandidateLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 text-purple-700" />
                <span>Candidate Login</span>
              </button>
            )}

            {/* HR Admin Badge & Actions (Only in HR View) */}
            {activeView === 'hr' && isHRAuthenticated && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>HR Admin Mode</span>
                  {hrEmail && (
                    <span className="hidden md:inline text-[11px] font-medium text-purple-200 border-l border-slate-700 pl-2 ml-1">
                      {hrEmail}
                    </span>
                  )}
                </div>
                {onLogoutHR && (
                  <button
                    onClick={onLogoutHR}
                    className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition cursor-pointer text-xs flex items-center gap-1"
                    title="Lock / Exit HR Admin"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Exit HR</span>
                  </button>
                )}
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
