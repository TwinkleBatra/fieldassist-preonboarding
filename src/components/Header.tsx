import React from 'react';
import { Users, User, ShieldCheck, ChevronDown, Sparkles, LogOut, Key, Link2 } from 'lucide-react';
import { Candidate } from '../types';
import { CandidateAvatar } from './CandidateAvatar';
import { toTitleCase } from '../utils/textUtils';

interface HeaderProps {
  activeView: 'candidate' | 'hr';
  setActiveView: (view: 'candidate' | 'hr') => void;
  candidates: Candidate[];
  activeCandidateId: string;
  onSelectCandidate: (id: string) => void;
  isCandidateLoggedIn: boolean;
  onLogoutCandidate: () => void;
  onOpenCandidateLogin: () => void;
  onOpenHRAuth: () => void;
  isHRAuthenticated: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  candidates,
  activeCandidateId,
  onSelectCandidate,
  isCandidateLoggedIn,
  onLogoutCandidate,
  onOpenCandidateLogin,
  onOpenHRAuth,
  isHRAuthenticated
}) => {
  const activeCandidate = candidates.find(c => c.id === activeCandidateId);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveView(activeView)}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 font-black text-xl tracking-tight">
              FA
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">FieldAssist</span>
                <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Pre-Onboarding
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Welcome & Onboarding Portal</p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Candidate Logged In Badge */}
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
                  title="Switch / Log Out Candidate"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* If Candidate not logged in but in candidate view */}
            {activeView === 'candidate' && !isCandidateLoggedIn && (
              <button
                onClick={onOpenCandidateLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 text-purple-700" />
                <span>Candidate Login</span>
              </button>
            )}

            {/* Experience Switcher Tabs */}
            <div className="bg-slate-100/90 p-1 rounded-xl flex items-center space-x-1 border border-slate-200">
              <button
                id="btn-candidate-portal-view"
                onClick={() => {
                  if (!isCandidateLoggedIn) {
                    onOpenCandidateLogin();
                  } else {
                    setActiveView('candidate');
                  }
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeView === 'candidate'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Candidate Portal</span>
              </button>

              <button
                id="btn-hr-dashboard-view"
                onClick={() => {
                  if (!isHRAuthenticated) {
                    onOpenHRAuth();
                  } else {
                    setActiveView('hr');
                  }
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeView === 'hr'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>HR Dashboard</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
