import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Shirt, Utensils, Phone, Mail, MessageSquare, CheckSquare, ExternalLink, ShieldCheck, User, Globe, Laptop, Copy, Check, Users } from 'lucide-react';
import { Candidate } from '../../types';
import { formatJoiningDate } from '../../utils/dateUtils';
import { toTitleCase } from '../../utils/textUtils';
import { getPrimaryContactForCandidate, getHRBPForDepartment } from '../../utils/hrbp';

interface FirstDayInfoProps {
  candidate: Candidate;
  onOpenContactHR: () => void;
}

export const FirstDayInfo: React.FC<FirstDayInfoProps> = ({ candidate, onOpenContactHR }) => {
  const isRemote = candidate.workMode === 'Remote';
  const primaryContactInfo = getPrimaryContactForCandidate(candidate);
  const activeContact = primaryContactInfo.contact;
  const assignedHrbp = candidate.hrbp || getHRBPForDepartment(candidate.department);

  const [copiedHrbpEmail, setCopiedHrbpEmail] = useState(false);

  const handleCopyHrbpEmail = () => {
    if (!assignedHrbp?.email) return;
    navigator.clipboard.writeText(assignedHrbp.email);
    setCopiedHrbpEmail(true);
    setTimeout(() => setCopiedHrbpEmail(false), 2000);
  };

  const formattedJoiningDate = formatJoiningDate(candidate.joiningDate, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div id="first-day-info" className="space-y-6">
      
      {/* Section Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-700" />
            First-Day Key Information
          </h2>
          {isRemote ? (
            <span className="text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>Remote Employee</span>
            </span>
          ) : (
            <span className="text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-purple-600" />
              <span>Office Joiner</span>
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          {isRemote 
            ? 'Everything you need to know for a smooth virtual Day 1 and remote onboarding at FieldAssist.'
            : 'Everything you need to know for a seamless Day 1 at FieldAssist.'}
        </p>
      </div>

      {/* Grid: Key Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Date & Time */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date & Time</span>
              <h3 className="text-base font-bold text-slate-900 mt-1">{formattedJoiningDate}</h3>
              <p className="text-xs font-semibold text-purple-700 mt-0.5">Report / Start at {candidate.reportingTime}</p>
              {candidate.timeZone && (
                <p className="text-[11px] font-medium text-slate-600 mt-0.5">Time zone: {candidate.timeZone}</p>
              )}
              <p className="text-xs text-slate-500 mt-2">
                {isRemote ? 'Please join the virtual orientation call 5 minutes prior.' : 'Please arrive 10-15 minutes early for guest pass issuance.'}
              </p>
            </div>
          </div>
        </div>

        {/* Location or Remote Joining Info */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
              {isRemote ? <Laptop className="w-5 h-5 text-indigo-700" /> : <MapPin className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {isRemote ? 'Work Mode & Location' : 'Office Location'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isRemote ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'}`}>
                  {isRemote ? `Remote (${candidate.remoteCity || candidate.officeCity || 'Remote'}, ${candidate.remoteCountry || candidate.officeCountry || 'Global'})` : `${candidate.officeCity}, ${candidate.officeCountry}`}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-2">
                {isRemote ? (candidate.officeAddress || `Remote / Work From Home (${candidate.remoteCity || candidate.officeCity}, ${candidate.remoteCountry || candidate.officeCountry})`) : candidate.officeAddress}
              </h3>
              {!isRemote && (
                <a
                  href={candidate.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(candidate.officeAddress)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-800 mt-2"
                >
                  <span>Get Directions on Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {isRemote && (
                <p className="text-[11px] text-slate-500 mt-2">
                  Remote onboarding link & laptop tracking sent by HR.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Dress Code & Vibe */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dress Code</span>
              <h3 className="text-base font-bold text-slate-900 mt-1">{candidate.dressCode || 'Smart Casuals'}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {isRemote ? 'Neat smart casuals for video calls during Day 1 onboarding.' : 'Polos, smart shirts, chinos or dark denim are ideal. Fridays are casual.'}
              </p>
            </div>
          </div>
        </div>

        {/* Lunch & Food Allowance */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition lg:col-span-2">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isRemote ? 'Day 1 Meal Allowance' : 'Lunch & Refreshments'}
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-1">{candidate.lunchInfo || (isRemote ? 'Remote meal allowance provided for Day 1' : 'Complimentary lunch at office cafeteria')}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {isRemote ? (
                  <>Day 1 virtual welcome session with your team and team members! Food delivery voucher is on us.</>
                ) : (
                  <>Day 1 welcome lunch with your team and team members.</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Column: Primary HR Contact + Assigned HRBP Reference */}
        <div className="flex flex-col gap-3">
          {/* Dedicated HR Contact */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200/80 shadow-xs flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">{primaryContactInfo.cardTitle}</span>
                <span className="text-[10px] font-bold bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full">{primaryContactInfo.contactTypeBadge}</span>
              </div>
              
              <div className="flex items-center gap-3 mt-3">
                <img
                  src={activeContact.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'}
                  alt={activeContact.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-purple-300 shadow-xs"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{toTitleCase(activeContact.name)}</h4>
                  <p className="text-xs text-purple-700 font-medium">{activeContact.role}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{activeContact.email}</p>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenContactHR}
              className="mt-4 w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Send Message to Twinkle</span>
            </button>
          </div>

          {/* Assigned HRBP (Reference Only - Plain Text Display) */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                Assigned HRBP
              </span>
              <span className="text-[10px] font-semibold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                Reference Only
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-bold text-slate-900">{toTitleCase(assignedHrbp.name)}</span>
                <span className="text-[11px] text-slate-500 truncate max-w-[140px]">{candidate.department || assignedHrbp.role}</span>
              </div>
              
              <div className="flex items-center justify-between gap-2 pt-1.5 mt-1 border-t border-slate-200/60">
                <span className="text-[11px] text-slate-600 font-mono truncate select-all" title={assignedHrbp.email}>
                  {assignedHrbp.email}
                </span>
                <button
                  type="button"
                  onClick={handleCopyHrbpEmail}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 hover:text-purple-800 bg-white hover:bg-purple-50 border border-purple-200 px-2 py-1 rounded transition cursor-pointer shrink-0"
                  title="Copy HRBP email address"
                >
                  {copiedHrbpEmail ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Email</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Day 1 Schedule & Timeline */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-700" />
              Day 1 Orientation Schedule
            </h3>
            <p className="text-xs text-slate-500">Your personalized itinerary for your first day at FieldAssist</p>
          </div>
          <span className="text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-full w-fit">
            {candidate.schedule?.length || 0} Planned Sessions
          </span>
        </div>

        <div className="space-y-4 relative before:absolute before:inset-0 before:left-[19px] sm:before:left-[130px] before:w-0.5 before:bg-slate-200">
          {candidate.schedule.map((item, index) => (
            <div key={index} className="relative flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 group">
              {/* Time pill (desktop) */}
              <div className="hidden sm:block w-28 text-right text-xs font-bold text-purple-800 pt-0.5 shrink-0">
                {item.time}
              </div>

              {/* Dot Marker */}
              <div className="absolute left-2 sm:left-[122px] top-1.5 w-4 h-4 rounded-full bg-purple-700 ring-4 ring-white shadow-xs z-10 group-hover:scale-125 transition" />

              {/* Content Box */}
              <div className="pl-8 sm:pl-0 flex-1 bg-slate-50/70 hover:bg-purple-50/40 p-4 rounded-xl border border-slate-200/60 transition">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="sm:hidden text-xs font-bold text-purple-800">{item.time}</span>
                  <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  <span className="text-[11px] font-semibold bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {item.location}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Joining Instructions / Remote Banner */}
      {(() => {
        const rawInstructions = isRemote
          ? (candidate.remoteInstructions || candidate.firstDayInstructions || '')
          : (candidate.firstDayInstructions || '');

        // Remove any mention of physical documents, IDs, photos, cheques, bank docs, etc.
        let cleanInstructions = rawInstructions
          .replace(/(?:Please\s+)?(?:carry|bring|have ready|provide)\s+[^.!?]*?(?:PAN|Aadhaar|Govt ID|Government ID|passport photos|cancelled cheque|cheque|bank|payroll|photo ID|physical|original ID)[^.!?]*?[.!?]?\s*/gi, '')
          .replace(/(?:Carry|Bring|Have)\s+valid\s+photo\s+ID\s*(?:and\s*)?/gi, '')
          .replace(/for\s+payroll\s+verification[.!?]?\s*/gi, '')
          .replace(/for\s+physical\s+verification[^.!?]*?[.!?]?\s*/gi, '')
          .trim();

        // If after cleaning, instructions are empty or missing, provide clean default arrival/remote instructions
        if (!cleanInstructions) {
          cleanInstructions = isRemote
            ? 'On Day 1, join the Google Meet welcome session link sent by your HR Partner. Your IT laptop setup and welcome kit will be delivered directly to your home address.'
            : 'Check in at the main reception desk upon arrival. Our Workplace Experience team will issue your visitor pass and guide you to your team floor.';
        }

        return (
          <div className="bg-purple-50/80 rounded-2xl p-5 border border-purple-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-purple-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-700" />
              {isRemote 
                ? `Remote Joining & Hardware Setup Instructions (${candidate.remoteCity || candidate.officeCity || 'Remote'}, ${candidate.remoteCountry || candidate.officeCountry || ''})`
                : `Location Access & Security Instructions (${candidate.officeCity})`}
            </h3>
            <p className="text-xs text-slate-700 mt-2 leading-relaxed">
              {cleanInstructions}
            </p>
          </div>
        );
      })()}

      {/* What to Bring on Your First Day */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-bold text-white">What to Bring on Your First Day</h3>
        </div>
        
        <div className="bg-purple-950/60 border border-purple-500/30 rounded-xl p-3.5 mt-3 text-xs text-purple-200 font-medium leading-relaxed">
          You don't need to bring any physical documents. All required documents and details are collected online during the pre-onboarding process / through Keka.
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 text-xs flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-300 font-bold flex items-center justify-center shrink-0 text-xs border border-purple-500/30">1</span>
            <p className="text-slate-200 font-medium leading-relaxed pt-0.5">
              Just bring yourself and your enthusiasm! 🎉
            </p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 text-xs flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-300 font-bold flex items-center justify-center shrink-0 text-xs border border-purple-500/30">2</span>
            <p className="text-slate-200 font-medium leading-relaxed pt-0.5">
              Check your reporting time and joining location before leaving.
            </p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 text-xs flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-300 font-bold flex items-center justify-center shrink-0 text-xs border border-purple-500/30">3</span>
            <p className="text-slate-200 font-medium leading-relaxed pt-0.5">
              Keep your phone available for any HR communication.
            </p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 text-xs flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-300 font-bold flex items-center justify-center shrink-0 text-xs border border-purple-500/30">4</span>
            <p className="text-slate-200 font-medium leading-relaxed pt-0.5">
              Come ready to meet your team and have a great first day.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

