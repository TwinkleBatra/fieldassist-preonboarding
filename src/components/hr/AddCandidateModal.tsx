import React, { useState, useEffect } from 'react';
import { X, UserPlus, Building2, Laptop, Globe, Plus, MapPin, UserCheck, ShieldCheck, Mail, Phone, Sparkles, FileText } from 'lucide-react';
import { Candidate, DressCodeType, JoiningLocation, WorkMode } from '../../types';
import { getHRBPForDepartment, LIST_OF_OFFICIAL_HRBPS, DEPARTMENT_OPTIONS, OFFICIAL_HRBPS } from '../../utils/hrbp';
import { toTitleCase } from '../../utils/textUtils';

interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCandidate: (candidateData: Omit<Candidate, 'id' | 'formData' | 'documents' | 'milestones' | 'schedule'>) => void;
  locations: JoiningLocation[];
  onOpenAddLocationModal: () => void;
}

export const AddCandidateModal: React.FC<AddCandidateModalProps> = ({
  isOpen,
  onClose,
  onAddCandidate,
  locations,
  onOpenAddLocationModal
}) => {
  const defaultLoc = locations[0];
  const initialDept = 'Engineering & Technology';
  const initialHrbp = getHRBPForDepartment(initialDept);

  const [workMode, setWorkMode] = useState<WorkMode>('Office');
  const [selectedLocationId, setSelectedLocationId] = useState<string>(defaultLoc?.id || '');

  // Remote joiner specific form state
  const [remoteCountry, setRemoteCountry] = useState<string>('');
  const [remoteCity, setRemoteCity] = useState<string>('');
  const [remoteTimeZone, setRemoteTimeZone] = useState<string>('IST (UTC+5:30)');
  const [remoteInstructions, setRemoteInstructions] = useState<string>('');

  const [isHrbpManuallyOverridden, setIsHrbpManuallyOverridden] = useState<boolean>(false);

  const getInitialFormData = (loc?: JoiningLocation) => {
    const targetLoc = loc || locations[0];
    const targetDept = 'Engineering & Technology';
    const autoHrbp = getHRBPForDepartment(targetDept);
    return {
      name: '',
      email: '',
      phone: '',
      role: '',
      department: targetDept,
      joiningDate: '',
      reportingTime: targetLoc?.reportingTime || '10:30 AM',
      timeZone: targetLoc?.timeZone || 'IST (UTC+5:30)',
      officeCity: targetLoc?.city || 'Gurugram',
      officeCountry: targetLoc?.country || 'India',
      officeAddress: targetLoc?.officeAddress || '',
      dressCode: (targetLoc?.dressCode || 'Smart Casuals') as DressCodeType,
      lunchInfo: targetLoc?.lunchInfo || '',
      reportingManager: '',
      reportingManagerRole: '',
      hrbpName: autoHrbp.name,
      hrbpRole: autoHrbp.role,
      hrbpEmail: autoHrbp.email,
      hrbpPhone: autoHrbp.phone,
      hrbpAvatarUrl: autoHrbp.avatarUrl,
      status: 'Offer Accepted' as Candidate['status'],
      notes: ''
    };
  };

  const [formData, setFormData] = useState(getInitialFormData(defaultLoc));

  const resetFormState = () => {
    const targetLoc = locations[0];
    setWorkMode('Office');
    setSelectedLocationId(targetLoc?.id || '');
    setRemoteCountry('');
    setRemoteCity('');
    setRemoteTimeZone('IST (UTC+5:30)');
    setRemoteInstructions('');
    setIsHrbpManuallyOverridden(false);
    setFormData(getInitialFormData(targetLoc));
  };

  // Reset form whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      resetFormState();
    }
  }, [isOpen]);

  useEffect(() => {
    if (locations.length > 0 && !selectedLocationId) {
      const loc = locations[0];
      setSelectedLocationId(loc.id);
      applyLocation(loc);
    }
  }, [locations]);

  const applyLocation = (loc: JoiningLocation) => {
    setSelectedLocationId(loc.id);
    setFormData(prev => ({
      ...prev,
      officeCity: loc.city,
      officeCountry: loc.country,
      officeAddress: loc.officeAddress,
      reportingTime: loc.reportingTime,
      timeZone: loc.timeZone,
      dressCode: loc.dressCode,
      lunchInfo: loc.lunchInfo
    }));
  };

  const handleDepartmentChange = (dept: string) => {
    const autoHrbp = getHRBPForDepartment(dept);
    setFormData(prev => ({
      ...prev,
      department: dept,
      hrbpName: isHrbpManuallyOverridden ? prev.hrbpName : autoHrbp.name,
      hrbpRole: isHrbpManuallyOverridden ? prev.hrbpRole : autoHrbp.role,
      hrbpEmail: isHrbpManuallyOverridden ? prev.hrbpEmail : autoHrbp.email,
      hrbpPhone: isHrbpManuallyOverridden ? prev.hrbpPhone : autoHrbp.phone,
      hrbpAvatarUrl: isHrbpManuallyOverridden ? prev.hrbpAvatarUrl : autoHrbp.avatarUrl
    }));
  };

  const handleSelectHrbpPreset = (hrbp: typeof OFFICIAL_HRBPS[keyof typeof OFFICIAL_HRBPS]) => {
    setIsHrbpManuallyOverridden(true);
    setFormData(prev => ({
      ...prev,
      hrbpName: hrbp.name,
      hrbpRole: hrbp.role,
      hrbpEmail: hrbp.email,
      hrbpPhone: hrbp.phone,
      hrbpAvatarUrl: hrbp.avatarUrl
    }));
  };

  const handleResetHrbpAuto = () => {
    setIsHrbpManuallyOverridden(false);
    const autoHrbp = getHRBPForDepartment(formData.department);
    setFormData(prev => ({
      ...prev,
      hrbpName: autoHrbp.name,
      hrbpRole: autoHrbp.role,
      hrbpEmail: autoHrbp.email,
      hrbpPhone: autoHrbp.phone,
      hrbpAvatarUrl: autoHrbp.avatarUrl
    }));
  };

  if (!isOpen) return null;

  const handleLocationChange = (locId: string) => {
    if (locId === 'add-new-location') {
      onOpenAddLocationModal();
      return;
    }
    const found = locations.find(l => l.id === locId);
    if (found) {
      applyLocation(found);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role || !formData.joiningDate) return;

    const assignedHrbp = {
      name: formData.hrbpName,
      role: formData.hrbpRole,
      email: formData.hrbpEmail,
      phone: formData.hrbpPhone,
      whatsapp: formData.hrbpPhone,
      avatarUrl: formData.hrbpAvatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    };

    if (workMode === 'Remote') {
      if (!remoteCountry || !remoteCity) {
        alert('Please fill in the Country and City for the Remote employee.');
        return;
      }
      onAddCandidate({
        name: toTitleCase(formData.name.trim()),
        email: formData.email,
        phone: formData.phone || '+91 98765 00000',
        role: formData.role,
        department: formData.department,
        joiningDate: formData.joiningDate,
        workMode: 'Remote',
        remoteCountry,
        remoteCity,
        remoteTimeZone: remoteTimeZone || 'IST (UTC+5:30)',
        remoteInstructions: remoteInstructions || 'Your laptop and welcome kit will be delivered to your address. On Day 1, join the Google Meet welcome link sent by HR.',
        officeCity: remoteCity,
        officeCountry: remoteCountry,
        timeZone: remoteTimeZone || 'IST (UTC+5:30)',
        officeAddress: `Remote / Work From Home (${remoteCity}, ${remoteCountry})`,
        reportingTime: formData.reportingTime || '11:00 AM',
        dressCode: 'Smart Casuals',
        lunchInfo: '',
        firstDayInstructions: remoteInstructions || 'On Day 1, join the Google Meet welcome link sent by your HR Partner.',
        reportingManager: formData.reportingManager || 'Department Manager',
        reportingManagerRole: formData.reportingManagerRole || 'Reporting Lead',
        hrbp: assignedHrbp,
        status: formData.status,
        formStatus: 'Not Started',
        notes: formData.notes
      });
    } else {
      const matchedLoc = locations.find(l => l.id === selectedLocationId) || locations[0];
      onAddCandidate({
        name: toTitleCase(formData.name.trim()),
        email: formData.email,
        phone: formData.phone || '+91 98765 00000',
        role: formData.role,
        department: formData.department,
        joiningDate: formData.joiningDate,
        workMode: 'Office',
        locationId: matchedLoc?.id,
        reportingTime: formData.reportingTime,
        officeAddress: formData.officeAddress,
        officeCity: formData.officeCity,
        officeCountry: formData.officeCountry,
        timeZone: formData.timeZone,
        googleMapsUrl: matchedLoc?.googleMapsUrl,
        dressCode: formData.dressCode,
        lunchInfo: formData.lunchInfo,
        firstDayInstructions: matchedLoc?.firstDayInstructions,
        reportingManager: formData.reportingManager || 'Department Manager',
        reportingManagerRole: formData.reportingManagerRole || 'Reporting Lead',
        hrbp: assignedHrbp,
        status: formData.status,
        formStatus: 'Not Started',
        notes: formData.notes
      });
    }

    resetFormState();
    onClose();
  };

  const handleCloseModal = () => {
    resetFormState();
    onClose();
  };

  const autoAssignedHrbp = getHRBPForDepartment(formData.department);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full my-8 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <UserPlus className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Add New Joiner</h2>
              <p className="text-xs text-purple-200">Send pre-onboarding invite, upload Offer Letter & assign department HRBP</p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Work Mode Toggle */}
          <div className="bg-purple-50/60 border border-purple-200/80 p-3.5 rounded-xl">
            <label className="block text-xs font-bold text-slate-800 mb-2">Work Mode / Location Type *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setWorkMode('Office')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-bold transition cursor-pointer ${
                  workMode === 'Office'
                    ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-purple-300'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Office Joiner (Registered Hub)</span>
              </button>
              <button
                type="button"
                onClick={() => setWorkMode('Remote')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-bold transition cursor-pointer ${
                  workMode === 'Remote'
                    ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-purple-300'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Remote / WFH Joiner</span>
              </button>
            </div>
          </div>

          {/* Basic Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="rahul.sharma@example.com"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile / WhatsApp Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder={workMode === 'Remote' ? '+44 7700 900000' : '+91 98765 00000'}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role / Designation *</label>
              <input
                type="text"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g. Solutions Architect / Account Executive"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department / Team *</label>
              <select
                value={formData.department}
                onChange={e => handleDepartmentChange(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium text-slate-900"
              >
                {DEPARTMENT_OPTIONS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <p className="text-[10px] text-purple-700 font-medium mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Auto-assigns HRBP: <strong>{autoAssignedHrbp.name}</strong> ({autoAssignedHrbp.email})
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Date *</label>
              <input
                type="date"
                value={formData.joiningDate}
                onChange={e => setFormData({ ...formData, joiningDate: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reporting Manager</label>
              <input
                type="text"
                value={formData.reportingManager}
                onChange={e => setFormData({ ...formData, reportingManager: e.target.value })}
                placeholder="Manager Name"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reporting Time on Day 1</label>
              <input
                type="text"
                value={formData.reportingTime}
                onChange={e => setFormData({ ...formData, reportingTime: e.target.value })}
                placeholder="10:30 AM"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
              />
            </div>
          </div>

          {/* Conditional Location / Remote fields */}
          {workMode === 'Office' ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Office Joining Location *</label>
                <button
                  type="button"
                  onClick={onOpenAddLocationModal}
                  className="text-purple-700 hover:text-purple-900 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Custom Office Location</span>
                </button>
              </div>
              <select
                value={selectedLocationId}
                onChange={e => handleLocationChange(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium"
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.city}, {loc.country})
                  </option>
                ))}
              </select>

              {/* Selected location preview card */}
              {locations.find(l => l.id === selectedLocationId) && (
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-700 font-semibold">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-purple-700" />
                      {locations.find(l => l.id === selectedLocationId)?.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {locations.find(l => l.id === selectedLocationId)?.timeZone}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[10px] whitespace-pre-line">
                    {locations.find(l => l.id === selectedLocationId)?.officeAddress}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-purple-700" />
                <span>Remote / WFH Joiner Settings</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Country *</label>
                  <input
                    type="text"
                    value={remoteCountry}
                    onChange={e => setRemoteCountry(e.target.value)}
                    placeholder="e.g. United Kingdom, Singapore, USA"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                    required
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {['United Kingdom', 'Singapore', 'United States', 'Germany'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setRemoteCountry(c)}
                        className="text-[9px] font-medium bg-slate-200/80 hover:bg-purple-100 text-slate-700 px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={remoteCity}
                    onChange={e => setRemoteCity(e.target.value)}
                    placeholder="e.g. London, Singapore, Seattle"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Time Zone *</label>
                  <select
                    value={remoteTimeZone}
                    onChange={e => setRemoteTimeZone(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                  >
                    <option value="BST (UTC+1:00)">BST (UTC+1:00) - London/UK</option>
                    <option value="SGT (UTC+8:00)">SGT (UTC+8:00) - Singapore</option>
                    <option value="EST (UTC-5:00)">EST (UTC-5:00) - US East</option>
                    <option value="PST (UTC-8:00)">PST (UTC-8:00) - US West</option>
                    <option value="CET (UTC+1:00)">CET (UTC+1:00) - Europe Central</option>
                    <option value="IST (UTC+5:30)">IST (UTC+5:30) - India Standard</option>
                    <option value="GST (UTC+4:00)">GST (UTC+4:00) - Dubai/UAE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Remote Joining Instructions *</label>
                <textarea
                  value={remoteInstructions}
                  onChange={e => setRemoteInstructions(e.target.value)}
                  rows={2}
                  placeholder="e.g. Your laptop will be shipped via DHL Express. On Day 1, join the video onboarding call at 09:00 AM..."
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                />
              </div>
            </div>
          )}

          {/* Assigned HRBP & Override Section */}
          <div className="bg-gradient-to-br from-purple-50/80 to-slate-50 p-4 rounded-xl border border-purple-200/90 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200/80 pb-2.5">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-800" />
                <h3 className="text-xs font-bold text-slate-900">Assigned HRBP Contact</h3>
                {isHrbpManuallyOverridden ? (
                  <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                    Manually Overridden
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                    Auto-assigned for {formData.department}
                  </span>
                )}
              </div>
              {isHrbpManuallyOverridden && (
                <button
                  type="button"
                  onClick={handleResetHrbpAuto}
                  className="text-[11px] text-purple-700 hover:text-purple-900 font-bold underline cursor-pointer"
                >
                  Reset to Department Default
                </button>
              )}
            </div>

            {/* Quick Presets for Official HRBPs */}
            <div>
              <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                Quick Select / Override HRBP:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {LIST_OF_OFFICIAL_HRBPS.map(hrbp => {
                  const isSelected = formData.hrbpEmail === hrbp.email;
                  return (
                    <button
                      key={hrbp.email}
                      type="button"
                      onClick={() => handleSelectHrbpPreset(hrbp)}
                      className={`p-2 rounded-lg border text-left transition cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-purple-300 hover:bg-purple-50/50'
                      }`}
                    >
                      <img
                        src={hrbp.avatarUrl}
                        alt={hrbp.name}
                        className="w-7 h-7 rounded-full object-cover shrink-0 border border-white/40"
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold leading-tight truncate">{hrbp.name}</p>
                        <p className={`text-[9px] truncate ${isSelected ? 'text-purple-100' : 'text-slate-500'}`}>
                          {hrbp.email.split('@')[0]}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editable Fields for HRBP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">HRBP Name</label>
                <input
                  type="text"
                  value={formData.hrbpName}
                  onChange={e => {
                    setIsHrbpManuallyOverridden(true);
                    setFormData({ ...formData, hrbpName: e.target.value });
                  }}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">HRBP Designation / Role</label>
                <input
                  type="text"
                  value={formData.hrbpRole}
                  onChange={e => {
                    setIsHrbpManuallyOverridden(true);
                    setFormData({ ...formData, hrbpRole: e.target.value });
                  }}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">HRBP Official Email</label>
                <input
                  type="email"
                  value={formData.hrbpEmail}
                  onChange={e => {
                    setIsHrbpManuallyOverridden(true);
                    setFormData({ ...formData, hrbpEmail: e.target.value });
                  }}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">HRBP Phone / WhatsApp</label>
                <input
                  type="text"
                  value={formData.hrbpPhone}
                  onChange={e => {
                    setIsHrbpManuallyOverridden(true);
                    setFormData({ ...formData, hrbpPhone: e.target.value });
                  }}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">HR Notes / Internal Remarks</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              placeholder="Internal notes, hardware details, or special requests..."
              className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Joiner</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
