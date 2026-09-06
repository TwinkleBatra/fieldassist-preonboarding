import React, { useState, useEffect } from 'react';
import { 
  X, Save, Building2, Laptop, Globe, MapPin, UserCheck, Mail, Phone, 
  Sparkles, Calendar, User, ShieldCheck, AlertCircle, RefreshCw, CheckCircle2 
} from 'lucide-react';
import { Candidate, DressCodeType, JoiningLocation, WorkMode } from '../../types';
import { getHRBPForDepartment, LIST_OF_OFFICIAL_HRBPS, DEPARTMENT_OPTIONS, OFFICIAL_HRBPS } from '../../utils/hrbp';
import { toTitleCase } from '../../utils/textUtils';
import { CandidateCoreDetailsUpdate } from '../../services/candidateStorage';
import { formatJoiningDate } from '../../utils/dateUtils';

interface EditCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  locations: JoiningLocation[];
  onOpenAddLocationModal?: () => void;
  onSave: (candidateId: string, updates: CandidateCoreDetailsUpdate) => Promise<void> | void;
}

export const EditCandidateModal: React.FC<EditCandidateModalProps> = ({
  isOpen,
  onClose,
  candidate,
  locations,
  onOpenAddLocationModal,
  onSave
}) => {
  if (!isOpen || !candidate) return null;

  const [workMode, setWorkMode] = useState<WorkMode>(candidate.workMode || 'Office');
  const [selectedLocationId, setSelectedLocationId] = useState<string>(candidate.locationId || locations[0]?.id || '');
  
  // Remote fields
  const [remoteCountry, setRemoteCountry] = useState<string>(candidate.remoteCountry || candidate.officeCountry || '');
  const [remoteCity, setRemoteCity] = useState<string>(candidate.remoteCity || candidate.officeCity || '');
  const [remoteTimeZone, setRemoteTimeZone] = useState<string>(candidate.remoteTimeZone || candidate.timeZone || 'IST (UTC+5:30)');
  const [remoteInstructions, setRemoteInstructions] = useState<string>(candidate.remoteInstructions || '');

  // Form core fields
  const [name, setName] = useState<string>(candidate.name);
  const [email, setEmail] = useState<string>(candidate.email);
  const [phone, setPhone] = useState<string>(candidate.phone);
  const [role, setRole] = useState<string>(candidate.role);
  const [department, setDepartment] = useState<string>(candidate.department);
  const [joiningDate, setJoiningDate] = useState<string>(candidate.joiningDate);
  const [reportingTime, setReportingTime] = useState<string>(candidate.reportingTime || '10:30 AM');
  const [timeZone, setTimeZone] = useState<string>(candidate.timeZone || 'IST (UTC+5:30)');
  const [officeCity, setOfficeCity] = useState<string>(candidate.officeCity || 'Gurugram');
  const [officeCountry, setOfficeCountry] = useState<string>(candidate.officeCountry || 'India');
  const [officeAddress, setOfficeAddress] = useState<string>(candidate.officeAddress || '');
  const [dressCode, setDressCode] = useState<DressCodeType>(candidate.dressCode || 'Smart Casuals');
  const [lunchInfo, setLunchInfo] = useState<string>(candidate.lunchInfo || '');
  const [reportingManager, setReportingManager] = useState<string>(candidate.reportingManager || '');
  const [reportingManagerRole, setReportingManagerRole] = useState<string>(candidate.reportingManagerRole || '');
  const [status, setStatus] = useState<Candidate['status']>(candidate.status);
  const [notes, setNotes] = useState<string>(candidate.notes || '');

  // HRBP fields
  const currentHrbp = candidate.hrbp || getHRBPForDepartment(candidate.department);
  const [hrbpName, setHrbpName] = useState<string>(currentHrbp.name);
  const [hrbpRole, setHrbpRole] = useState<string>(currentHrbp.role);
  const [hrbpEmail, setHrbpEmail] = useState<string>(currentHrbp.email);
  const [hrbpPhone, setHrbpPhone] = useState<string>(currentHrbp.phone);
  const [hrbpAvatarUrl, setHrbpAvatarUrl] = useState<string>(currentHrbp.avatarUrl || '');
  const [isHrbpOverridden, setIsHrbpOverridden] = useState<boolean>(false);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state whenever candidate changes or modal opens
  useEffect(() => {
    if (candidate) {
      setWorkMode(candidate.workMode || 'Office');
      setSelectedLocationId(candidate.locationId || locations[0]?.id || '');
      setRemoteCountry(candidate.remoteCountry || candidate.officeCountry || '');
      setRemoteCity(candidate.remoteCity || candidate.officeCity || '');
      setRemoteTimeZone(candidate.remoteTimeZone || candidate.timeZone || 'IST (UTC+5:30)');
      setRemoteInstructions(candidate.remoteInstructions || '');
      setName(candidate.name);
      setEmail(candidate.email);
      setPhone(candidate.phone);
      setRole(candidate.role);
      setDepartment(candidate.department);
      setJoiningDate(candidate.joiningDate);
      setReportingTime(candidate.reportingTime || '10:30 AM');
      setTimeZone(candidate.timeZone || 'IST (UTC+5:30)');
      setOfficeCity(candidate.officeCity || 'Gurugram');
      setOfficeCountry(candidate.officeCountry || 'India');
      setOfficeAddress(candidate.officeAddress || '');
      setDressCode(candidate.dressCode || 'Smart Casuals');
      setLunchInfo(candidate.lunchInfo || '');
      setReportingManager(candidate.reportingManager || '');
      setReportingManagerRole(candidate.reportingManagerRole || '');
      setStatus(candidate.status);
      setNotes(candidate.notes || '');

      const hrbp = candidate.hrbp || getHRBPForDepartment(candidate.department);
      setHrbpName(hrbp.name);
      setHrbpRole(hrbp.role);
      setHrbpEmail(hrbp.email);
      setHrbpPhone(hrbp.phone);
      setHrbpAvatarUrl(hrbp.avatarUrl || '');
      setIsHrbpOverridden(false);
      setErrorMessage(null);
    }
  }, [candidate, isOpen]);

  const handleLocationChange = (locId: string) => {
    if (locId === 'add-new-location' && onOpenAddLocationModal) {
      onOpenAddLocationModal();
      return;
    }
    setSelectedLocationId(locId);
    const loc = locations.find(l => l.id === locId);
    if (loc) {
      setOfficeCity(loc.city);
      setOfficeCountry(loc.country);
      setOfficeAddress(loc.officeAddress);
      setReportingTime(loc.reportingTime);
      setTimeZone(loc.timeZone);
      setDressCode(loc.dressCode);
      setLunchInfo(loc.lunchInfo);
    }
  };

  const handleDepartmentChange = (newDept: string) => {
    setDepartment(newDept);
    if (!isHrbpOverridden) {
      const autoHrbp = getHRBPForDepartment(newDept);
      setHrbpName(autoHrbp.name);
      setHrbpRole(autoHrbp.role);
      setHrbpEmail(autoHrbp.email);
      setHrbpPhone(autoHrbp.phone);
      setHrbpAvatarUrl(autoHrbp.avatarUrl);
    }
  };

  const handleSelectHrbpPreset = (hrbp: typeof OFFICIAL_HRBPS[keyof typeof OFFICIAL_HRBPS]) => {
    setIsHrbpOverridden(true);
    setHrbpName(hrbp.name);
    setHrbpRole(hrbp.role);
    setHrbpEmail(hrbp.email);
    setHrbpPhone(hrbp.phone);
    setHrbpAvatarUrl(hrbp.avatarUrl);
  };

  const handleResetHrbpAuto = () => {
    setIsHrbpOverridden(false);
    const autoHrbp = getHRBPForDepartment(department);
    setHrbpName(autoHrbp.name);
    setHrbpRole(autoHrbp.role);
    setHrbpEmail(autoHrbp.email);
    setHrbpPhone(autoHrbp.phone);
    setHrbpAvatarUrl(autoHrbp.avatarUrl);
  };

  const isJoiningDateChanged = Boolean(candidate && joiningDate !== candidate.joiningDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !role.trim() || !joiningDate) {
      setErrorMessage('Please fill in all required fields (Name, Email, Role, and Date of Joining).');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const assignedHrbp = {
      name: hrbpName,
      role: hrbpRole,
      email: hrbpEmail,
      phone: hrbpPhone,
      whatsapp: hrbpPhone,
      avatarUrl: hrbpAvatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    };

    const updates: CandidateCoreDetailsUpdate = {
      name: toTitleCase(name.trim()),
      email: email.trim(),
      phone: phone.trim() || '+91 98765 00000',
      role: role.trim(),
      department,
      joiningDate,
      workMode,
      reportingManager: reportingManager.trim() || 'Department Manager',
      reportingManagerRole: reportingManagerRole.trim() || 'Reporting Lead',
      hrbp: assignedHrbp,
      status,
      notes,
      ...(workMode === 'Remote'
        ? {
            remoteCountry,
            remoteCity,
            remoteTimeZone,
            remoteInstructions,
            officeCity: remoteCity,
            officeCountry: remoteCountry,
            timeZone: remoteTimeZone,
            officeAddress: `Remote / Work From Home (${remoteCity}, ${remoteCountry})`,
            reportingTime: reportingTime || '10:30 AM',
            dressCode: 'Smart Casuals' as DressCodeType,
            lunchInfo: 'Remote food delivery allowance provided for Day 1'
          }
        : {
            locationId: selectedLocationId,
            officeCity,
            officeCountry,
            officeAddress,
            reportingTime,
            timeZone,
            dressCode,
            lunchInfo
          })
    };

    try {
      await onSave(candidate.id, updates);
      setIsSaving(false);
      onClose();
    } catch (err: any) {
      console.error('Failed to update candidate:', err);
      setErrorMessage(err?.message || 'Failed to save updates. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full my-8 overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 p-5 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-700/60 border border-purple-400/40 flex items-center justify-center text-white shadow-inner">
              <UserCheck className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Edit Candidate Details</h3>
                <span className="text-[10px] font-mono font-bold bg-white text-purple-950 px-2 py-0.5 rounded shadow-xs">
                  {candidate.accessCode || candidate.id}
                </span>
              </div>
              <p className="text-xs text-purple-200 font-medium">
                Update core profile details, joining schedule, and reporting hierarchy for <strong className="text-white">{candidate.name}</strong>.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 rounded-lg hover:bg-white/10 text-purple-200 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Joining Date Alert Banner if Date Modified */}
          {isJoiningDateChanged && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 font-medium shadow-2xs">
              <RefreshCw className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 animate-spin-slow" />
              <div>
                <strong className="font-extrabold text-amber-950 block">Joining Date Reschedule Notice:</strong>
                Date of Joining changed from <span className="line-through text-slate-500 font-semibold">{formatJoiningDate(candidate.joiningDate)}</span> to <span className="text-amber-900 font-bold underline">{formatJoiningDate(joiningDate)}</span>.
                Saving will automatically recalculate the entire pre-onboarding email automation schedule (Welcome 7D, Culture 5D, Communications 3D, and Day 1 reminders) to align with this new date.
              </div>
            </div>
          )}

          {/* Work Mode Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Work Mode / Office Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setWorkMode('Office')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  workMode === 'Office'
                    ? 'bg-purple-900 text-white border-purple-900 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Office Joiner (Campus)</span>
              </button>
              <button
                type="button"
                onClick={() => setWorkMode('Remote')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  workMode === 'Remote'
                    ? 'bg-purple-900 text-white border-purple-900 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>Remote / WFH Joiner</span>
              </button>
            </div>
          </div>

          {/* Section 1: Core Candidate Identity */}
          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-xs font-extrabold text-purple-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-700" />
              <span>Candidate Identity & Contact</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-purple-600 font-semibold"
                  placeholder="e.g. Ananya Sharma"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-purple-600 font-medium"
                  placeholder="e.g. ananya@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Contact Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-purple-600 font-medium"
                  placeholder="e.g. +91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Date of Joining <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-purple-300 rounded-lg focus:outline-none focus:border-purple-600 font-bold bg-purple-50/40 text-purple-950 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Role, Department & Hierarchy */}
          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-xs font-extrabold text-purple-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-700" />
              <span>Role, Department & Reporting Line</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Role / Designation <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-purple-600 font-semibold"
                  placeholder="e.g. Senior Frontend Engineer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Department <span className="text-rose-500">*</span>
                </label>
                <select
                  value={department}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-purple-600 font-semibold bg-white cursor-pointer"
                >
                  {DEPARTMENT_OPTIONS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Reporting Manager Name
                </label>
                <input
                  type="text"
                  value={reportingManager}
                  onChange={(e) => setReportingManager(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-purple-600 font-medium"
                  placeholder="e.g. Rajesh Kumar"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Reporting Manager Title / Role
                </label>
                <input
                  type="text"
                  value={reportingManagerRole}
                  onChange={(e) => setReportingManagerRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-purple-600 font-medium"
                  placeholder="e.g. Director of Engineering"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Office Location / Remote Specs */}
          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-xs font-extrabold text-purple-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-purple-700" />
              <span>{workMode === 'Office' ? 'Office Location & Timings' : 'Remote Joiner Specifications'}</span>
            </h4>

            {workMode === 'Office' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Assigned Office Location
                    </label>
                    <select
                      value={selectedLocationId}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-purple-600 font-semibold bg-white cursor-pointer"
                    >
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.city}, {loc.country})
                        </option>
                      ))}
                      {onOpenAddLocationModal && (
                        <option value="add-new-location">+ Add New Location...</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Day 1 Reporting Time
                    </label>
                    <input
                      type="text"
                      value={reportingTime}
                      onChange={(e) => setReportingTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-purple-600 font-semibold"
                      placeholder="10:30 AM"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      City & Country
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={officeCity}
                        onChange={(e) => setOfficeCity(e.target.value)}
                        className="w-1/2 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none font-medium"
                        placeholder="City"
                      />
                      <input
                        type="text"
                        value={officeCountry}
                        onChange={(e) => setOfficeCountry(e.target.value)}
                        className="w-1/2 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none font-medium"
                        placeholder="Country"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Dress Code
                    </label>
                    <select
                      value={dressCode}
                      onChange={(e) => setDressCode(e.target.value as DressCodeType)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none font-medium bg-white cursor-pointer"
                    >
                      <option value="Smart Casuals">Smart Casuals</option>
                      <option value="Business Formal">Business Formal</option>
                      <option value="Casuals">Casuals</option>
                      <option value="Business Casual">Business Casual</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Office Address
                  </label>
                  <input
                    type="text"
                    value={officeAddress}
                    onChange={(e) => setOfficeAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none font-medium"
                    placeholder="e.g. Tower B, DLF Cyber City, Sector 24, Gurugram"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Remote Country <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={workMode === 'Remote'}
                      value={remoteCountry}
                      onChange={(e) => setRemoteCountry(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none font-medium"
                      placeholder="e.g. India or Singapore"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Remote City <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={workMode === 'Remote'}
                      value={remoteCity}
                      onChange={(e) => setRemoteCity(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none font-medium"
                      placeholder="e.g. Pune or Bengaluru"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Candidate Time Zone
                    </label>
                    <input
                      type="text"
                      value={remoteTimeZone}
                      onChange={(e) => setRemoteTimeZone(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none font-medium"
                      placeholder="e.g. IST (UTC+5:30) or SGT (UTC+8)"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Virtual Orientation Time
                    </label>
                    <input
                      type="text"
                      value={reportingTime}
                      onChange={(e) => setReportingTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none font-medium"
                      placeholder="10:30 AM"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Remote Onboarding Instructions (Shown in Portal)
                  </label>
                  <input
                    type="text"
                    value={remoteInstructions}
                    onChange={(e) => setRemoteInstructions(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none font-medium"
                    placeholder="Your laptop and welcome kit will be delivered to your address..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 4: HRBP Assignment */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-extrabold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                <span>Assigned HR Business Partner (HRBP)</span>
              </h4>
              {isHrbpOverridden && (
                <button
                  type="button"
                  onClick={handleResetHrbpAuto}
                  className="text-[11px] font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                >
                  Reset to Auto-Assign ({department})
                </button>
              )}
            </div>

            {/* Quick HRBP Preset Chips */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-[11px] font-semibold text-slate-500">Quick Assign:</span>
              {LIST_OF_OFFICIAL_HRBPS.map(hrbp => {
                const isSelected = hrbpEmail === hrbp.email;
                return (
                  <button
                    key={hrbp.email}
                    type="button"
                    onClick={() => handleSelectHrbpPreset(hrbp)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-purple-100 text-purple-900 border-purple-300 shadow-2xs font-extrabold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-purple-700" />}
                    <span>{hrbp.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-purple-50/50 p-3 rounded-xl border border-purple-100">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">HRBP Name</label>
                <input
                  type="text"
                  value={hrbpName}
                  onChange={(e) => {
                    setHrbpName(e.target.value);
                    setIsHrbpOverridden(true);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">HRBP Email</label>
                <input
                  type="email"
                  value={hrbpEmail}
                  onChange={(e) => {
                    setHrbpEmail(e.target.value);
                    setIsHrbpOverridden(true);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">HRBP Phone</label>
                <input
                  type="tel"
                  value={hrbpPhone}
                  onChange={(e) => {
                    setHrbpPhone(e.target.value);
                    setIsHrbpOverridden(true);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none font-medium text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Status & Internal Notes */}
          <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Onboarding Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Candidate['status'])}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none font-bold text-slate-900 bg-white cursor-pointer"
              >
                <option value="Offer Accepted">Offer Accepted</option>
                <option value="Form Pending">Form Pending</option>
                <option value="Under Review">Under Review</option>
                <option value="Ready for Day 1">Ready for Day 1</option>
                <option value="Joined">Joined</option>
                <option value="Onboarding Complete">Onboarding Complete</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                HR Internal Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none font-medium"
                placeholder="Optional notes or background verification flags"
              />
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-purple-900 hover:bg-purple-950 text-white rounded-xl text-xs font-extrabold transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving & Syncing Sheets...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Candidate Updates</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
