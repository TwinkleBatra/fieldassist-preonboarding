import React from 'react';
import { Calendar, MapPin, Clock, CheckCircle2, AlertCircle, Sparkles, UserCheck } from 'lucide-react';
import { Candidate } from '../../types';
import { formatJoiningDate, getDaysUntilJoining, getCandidateAccessInfo } from '../../utils/dateUtils';
import { toTitleCase } from '../../utils/textUtils';

interface WelcomeBannerProps {
  candidate: Candidate;
  onNavigateToSection: (sectionId: string) => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  candidate,
  onNavigateToSection
}) => {
  const daysLeft = getDaysUntilJoining(candidate.joiningDate);
  const accessInfo = getCandidateAccessInfo(candidate.joiningDate);

  const getStatusBadge = (status: Candidate['status']) => {
    switch (status) {
      case 'Ready for Day 1':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Ready for Day 1
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Form Under HR Review
          </span>
        );
      case 'Form Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <AlertCircle className="w-3.5 h-3.5 text-purple-600" />
            Pre-Onboarding Form Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
            <UserCheck className="w-3.5 h-3.5 text-slate-600" />
            {status}
          </span>
        );
    }
  };

  const formattedJoiningDate = formatJoiningDate(candidate.joiningDate, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 rounded-2xl px-5 py-4 sm:px-7 sm:py-5 lg:px-8 lg:py-5 text-white shadow-xl shadow-purple-950/10 relative overflow-hidden border border-purple-700/50">
      
      {/* Decorative Background Accents */}
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
        
        {/* Left Side: Personal Info */}
        <div className="space-y-2.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-purple-500/20 text-purple-200 border border-purple-400/30">
              <Sparkles className="w-3 h-3 text-purple-300" />
              Welcome to the Squad
            </span>
            {getStatusBadge(candidate.status)}
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Welcome, {toTitleCase(candidate.name)}! 👋
            </h1>
            <p className="mt-1 text-purple-200 text-xs sm:text-sm font-medium leading-normal">
              We are thrilled to have you join FieldAssist as <span className="text-white font-semibold">{candidate.role}</span> in the <span className="text-white font-semibold">{candidate.department}</span> team.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-5 text-xs sm:text-sm text-purple-100/90 pt-0.5">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-purple-300 shrink-0" />
              <span>Joining: <strong className="text-white">{formattedJoiningDate}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-300 shrink-0" />
              <span>Time: <strong className="text-white">{candidate.reportingTime} {candidate.timeZone ? `(${candidate.timeZone})` : ''}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-purple-300 shrink-0" />
              <span>Office: <strong className="text-white">{candidate.joiningLocation?.name || candidate.officeCity}{candidate.officeCountry ? `, ${candidate.officeCountry}` : ''}</strong></span>
            </div>
          </div>
        </div>

        {/* Right Side: Days Countdown Card & Quick Actions */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3.5 sm:p-4 lg:p-4.5 flex flex-col sm:flex-row lg:flex-col items-center justify-between gap-3 min-w-[240px] sm:min-w-[280px] text-center">
          
          {accessInfo.isGracePeriod ? (
            <div className="space-y-1.5 w-full py-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                Active Joiner • Day {accessInfo.graceDayNumber}
              </span>
              <p className="text-sm sm:text-base font-black text-white tracking-tight leading-snug px-1">
                🎉 Welcome to FieldAssist! You are now an active team member.
              </p>
              <p className="text-[11px] text-purple-200">
                Pre-Onboarding records submitted & locked.
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              <span className="text-xs uppercase tracking-wider font-semibold text-purple-200">
                Countdown to Day 1
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-baseline justify-center gap-1.5">
                <span>{daysLeft > 0 ? daysLeft : 0}</span>
                <span className="text-xs sm:text-sm font-semibold text-purple-200">{daysLeft === 1 ? 'day to go' : 'days to go'}</span>
              </div>
              <p className="text-[11px] text-purple-200">
                Form completion: <strong className="text-white">{candidate.formData.completionPercentage}%</strong>
              </p>
            </div>
          )}

          <div className="w-full">
            {accessInfo.isGracePeriod ? (
              <button
                onClick={() => onNavigateToSection('first-day-info')}
                className="w-full bg-white text-purple-900 hover:bg-purple-50 font-bold px-3.5 py-2 rounded-lg text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>View First-Day Guide</span>
              </button>
            ) : candidate.formData.completionPercentage < 100 ? (
              <button
                onClick={() => onNavigateToSection('pre-onboarding-form')}
                className="w-full bg-white text-purple-900 hover:bg-purple-50 font-bold px-3.5 py-2 rounded-lg text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Complete Pre-Onboarding Form</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigateToSection('first-day-info')}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3.5 py-2 rounded-lg text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>View First-Day Guide</span>
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
