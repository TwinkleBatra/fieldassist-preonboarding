import React, { useState } from 'react';
import { CheckCircle2, Copy, Link2, Key, UserCheck, X, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import { Candidate } from '../../types';
import { formatJoiningDate } from '../../utils/dateUtils';
import { CandidateAvatar } from '../CandidateAvatar';

interface AddedCandidateSuccessModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenCandidatePortal: (candidateId: string) => void;
}

export const AddedCandidateSuccessModal: React.FC<AddedCandidateSuccessModalProps> = ({
  candidate,
  isOpen,
  onClose,
  onOpenCandidatePortal
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !candidate) return null;

  const accessCode = candidate.accessCode || candidate.email;
  const accessUrl = `${window.location.origin}${window.location.pathname}?accessCode=${accessCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(accessUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-emerald-900 p-6 text-white text-center relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <CheckCircle2 className="w-6 h-6 text-emerald-200" />
          </div>

          <h3 className="text-xl font-black text-white tracking-tight">
            New Joiner Profile Created!
          </h3>
          <p className="text-xs text-emerald-100 mt-1">
            Access link and login credentials generated successfully.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          
          {/* Candidate Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-center gap-3">
              <CandidateAvatar candidate={candidate} size="md" />
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">{candidate.name}</h4>
                <p className="text-xs text-slate-500 font-medium">{candidate.role}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-200/80">
              <div>
                <span className="text-slate-400 block font-medium">Joining Location:</span>
                <span className="font-bold text-slate-800">{candidate.officeCity}, {candidate.officeCountry}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Joining Date:</span>
                <span className="font-bold text-slate-800">
                  {formatJoiningDate(candidate.joiningDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Login ID & Access Link Box */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Candidate Access Code / ID
              </label>
              <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-purple-700" />
                  <span className="font-mono font-black text-base text-purple-950 tracking-wider">
                    {accessCode}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-purple-700 bg-white px-2 py-0.5 rounded-md border border-purple-200">
                  Unique Login ID
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Direct Candidate Portal Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={accessUrl}
                  className="w-full text-xs px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl font-mono text-slate-700 focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs transition shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                onOpenCandidatePortal(candidate.id);
                onClose();
              }}
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <UserCheck className="w-4 h-4" />
              <span>Log In as {candidate.name.split(' ')[0]} Now</span>
            </button>

            <button
              onClick={onClose}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer text-center"
            >
              Return to HR Dashboard
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
