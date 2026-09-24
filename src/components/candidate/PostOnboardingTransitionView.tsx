import React from 'react';
import { CheckCircle2, Mail, ExternalLink, ShieldCheck, Sparkles, Building2, User, LogOut } from 'lucide-react';
import { Candidate } from '../../types';
import { formatJoiningDate } from '../../utils/dateUtils';
import { toTitleCase } from '../../utils/textUtils';

interface PostOnboardingTransitionViewProps {
  candidate: Candidate;
  onLogout: () => void;
}

export const PostOnboardingTransitionView: React.FC<PostOnboardingTransitionViewProps> = ({
  candidate,
  onLogout
}) => {
  const formattedJoiningDate = formatJoiningDate(candidate.joiningDate);
  const hrbpEmail = candidate.hrbp?.email || 'twinkle.verma@flick2know.com';
  const hrbpName = candidate.hrbp?.name || 'Twinkle Verma';

  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4 animate-fadeIn">
      {/* Main Transition Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        
        {/* Card Header Banner */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 p-8 sm:p-10 text-white relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-9 h-9 text-emerald-300" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pre-Onboarding Lifecycle Completed</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome to the FieldAssist Team, {toTitleCase(candidate.name)}!
            </h1>

            <p className="text-purple-200 text-xs sm:text-sm max-w-lg font-medium">
              Joined as <strong className="text-white">{candidate.role}</strong> in the <strong className="text-white">{candidate.department}</strong> department on <strong className="text-white">{formattedJoiningDate}</strong>.
            </p>
          </div>
        </div>

        {/* Card Body with Mandated Transition Message */}
        <div className="p-6 sm:p-10 space-y-8">
          
          {/* Primary Transition Box */}
          <div className="p-5 sm:p-6 bg-purple-50/80 border-2 border-purple-200 rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-200/70 text-purple-900 flex items-center justify-center shrink-0 mt-0.5">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-sm sm:text-base font-extrabold text-purple-950">
                  Pre-Onboarding Period Concluded
                </h2>
                <p className="text-sm text-purple-900 font-medium leading-relaxed">
                  You have successfully completed pre-onboarding and joined FieldAssist! Please access the internal FieldAssist Employee Portal for ongoing HR services, or contact your HRBP at <a href={`mailto:${hrbpEmail}`} className="underline font-bold hover:text-purple-950">{hrbpEmail}</a> if you need assistance.
                </p>
              </div>
            </div>
          </div>

          {/* Key Reference Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* HRBP Contact Box */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <User className="w-4 h-4 text-purple-700" />
                <span>Assigned HR Business Partner</span>
              </div>
              <p className="text-sm font-bold text-slate-900">{hrbpName}</p>
              <p className="text-xs text-slate-600">People & Culture Team</p>
              <a
                href={`mailto:${hrbpEmail}?subject=FieldAssist HR Assistance - ${candidate.name}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-800 hover:text-purple-950 pt-1"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{hrbpEmail}</span>
              </a>
            </div>

            {/* Workplace Location */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <span>Joining Location</span>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {candidate.joiningLocation?.name || candidate.officeCity || 'Gurugram HQ'}
              </p>
              <p className="text-xs text-slate-600 line-clamp-2">
                {candidate.joiningLocation?.officeAddress || candidate.officeAddress || 'FieldAssist Campus'}
              </p>
            </div>

          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <a
              href={`mailto:${hrbpEmail}?subject=FieldAssist HR Support Inquiry - ${candidate.name}`}
              className="w-full sm:w-auto px-5 py-2.5 bg-purple-900 hover:bg-purple-950 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Mail className="w-4 h-4" />
              <span>Contact HRBP ({hrbpEmail})</span>
            </a>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
