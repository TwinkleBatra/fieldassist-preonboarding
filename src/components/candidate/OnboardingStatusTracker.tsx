import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Circle, ArrowRight } from 'lucide-react';
import { Candidate } from '../../types';

interface OnboardingStatusTrackerProps {
  candidate: Candidate;
}

export const OnboardingStatusTracker: React.FC<OnboardingStatusTrackerProps> = ({ candidate }) => {
  const completedCount = candidate.milestones.filter(m => m.status === 'Completed').length;
  const progressPercent = Math.round((completedCount / candidate.milestones.length) * 100);

  return (
    <div id="onboarding-status" className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-purple-700" />
            Onboarding Progress & Checklist
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Track your pre-joining milestones and status in real-time.</p>
        </div>

        <div className="flex items-center gap-3 bg-purple-50 px-4 py-2 rounded-xl border border-purple-100 shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Completed</span>
            <span className="text-sm font-extrabold text-purple-900">{completedCount} of {candidate.milestones.length} Steps</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
            {progressPercent}%
          </div>
        </div>
      </div>

      {/* Milestones Vertical Steps */}
      <div className="space-y-4 relative before:absolute before:inset-0 before:left-[19px] before:w-0.5 before:bg-slate-200">
        {candidate.milestones.map((milestone, idx) => {
          const isCompleted = milestone.status === 'Completed';
          const isInProgress = milestone.status === 'In Progress';

          return (
            <div key={milestone.id} className="relative flex items-start gap-4 group">
              {/* Status Icon Marker */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs z-10 transition shrink-0 ${
                  isCompleted
                    ? 'bg-purple-700 text-white ring-4 ring-purple-100 shadow-xs'
                    : isInProgress
                    ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                    : 'bg-slate-100 text-slate-400 border border-slate-300'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isInProgress ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Step Card */}
              <div
                className={`flex-1 p-4 rounded-xl border transition ${
                  isCompleted
                    ? 'bg-purple-50/30 border-purple-200/80'
                    : isInProgress
                    ? 'bg-amber-50/30 border-amber-200/80'
                    : 'bg-slate-50/50 border-slate-200/60'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{milestone.title}</h4>
                  
                  {isCompleted && (
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full border border-purple-200">
                      Completed {milestone.date ? `• ${milestone.date}` : ''}
                    </span>
                  )}

                  {isInProgress && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                      In Progress {milestone.date ? `• ${milestone.date}` : ''}
                    </span>
                  )}

                  {!isCompleted && !isInProgress && (
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full">
                      Pending {milestone.date ? `• Target: ${milestone.date}` : ''}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 mt-1">{milestone.description}</p>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
