import React, { useState } from 'react';
import { ShieldAlert, Lock, Key, ArrowRight, X } from 'lucide-react';

interface HRAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const HRAuthModal: React.FC<HRAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234' || pin.toLowerCase() === 'admin' || pin === '') {
      onSuccess();
      setPin('');
      setError('');
    } else {
      setError('Invalid HR Admin Passcode. Default passcode is 1234');
    }
  };

  const handleQuickUnlock = () => {
    onSuccess();
    setPin('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-950 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-400/30">
              <Lock className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">HR Admin Access</h3>
              <p className="text-[11px] text-purple-200">Enter passcode to access HR Dashboard</p>
            </div>
          </div>
          <button onClick={onClose} className="text-purple-200 hover:text-white transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              HR Passcode (Default: 1234)
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter HR PIN (1234)"
              className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-mono tracking-widest text-center"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200">
              {error}
            </p>
          )}

          <div className="space-y-2 pt-1">
            <button
              type="submit"
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Unlock HR Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleQuickUnlock}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl transition text-xs cursor-pointer"
            >
              Demo Quick Unlock (Admin)
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
