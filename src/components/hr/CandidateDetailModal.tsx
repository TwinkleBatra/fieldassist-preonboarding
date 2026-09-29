import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, Clock, FileText, User, Laptop, Shirt, ShieldCheck, Mail, Phone, Calendar, 
  Edit3, Save, MapPin, Globe, Plus, Trash2, ArrowUp, ArrowDown, RotateCcw, Check, Sparkles,
  Download, Eye, Paperclip, FileDown, FileCheck
} from 'lucide-react';
import { Candidate, OnboardingStatus, RequiredDocument, JoiningLocation, FirstDayScheduleItem } from '../../types';
import { DEFAULT_FIELDASSIST_SCHEDULE, DEFAULT_REMOTE_SCHEDULE } from '../../services/mockData';
import { EmailAutomationSection } from './EmailAutomationSection';
import { getCandidateById, saveCandidate } from '../../services/candidateStorage';
import { LIST_OF_OFFICIAL_HRBPS, getHRBPForDepartment } from '../../utils/hrbp';
import { formatJoiningDate, getEffectiveCandidateStatus, getTodayDateString } from '../../utils/dateUtils';
import { CandidateAvatar } from '../CandidateAvatar';
import { toTitleCase } from '../../utils/textUtils';

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  locations?: JoiningLocation[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (candidateId: string, status: OnboardingStatus) => void;
  onReassignLocation?: (candidateId: string, locationId: string) => void;
  onVerifyDoc: (candidateId: string, docId: string, status: RequiredDocument['status']) => void;
  onSwitchToCandidateView: (candidateId: string) => void;
  onUpdateSchedule?: (candidateId: string, newSchedule: FirstDayScheduleItem[]) => void;
  onDeleteCandidate?: (candidateId: string) => void;
  onEditCandidate?: (candidate: Candidate) => void;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidate,
  locations = [],
  isOpen,
  onClose,
  onUpdateStatus,
  onReassignLocation,
  onVerifyDoc,
  onSwitchToCandidateView,
  onUpdateSchedule,
  onDeleteCandidate,
  onEditCandidate
}) => {
  const [currentCandidate, setCurrentCandidate] = useState<Candidate | null>(candidate);
  const [notesText, setNotesText] = useState(candidate?.notes || '');
  const [scheduleItems, setScheduleItems] = useState<FirstDayScheduleItem[]>(candidate?.schedule || DEFAULT_FIELDASSIST_SCHEDULE);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<FirstDayScheduleItem>({ time: '', title: '', description: '', location: '' });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItem, setNewItem] = useState<FirstDayScheduleItem>({ time: '04:30 PM onwards', title: '', description: '', location: 'Assigned Workstation' });
  const [scheduleSavedToast, setScheduleSavedToast] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (candidate) {
      setCurrentCandidate(candidate);
      setNotesText(candidate.notes || '');
      setScheduleItems(candidate.schedule || DEFAULT_FIELDASSIST_SCHEDULE);
    }
  }, [candidate]);

  if (!isOpen || !candidate) return null;

  const displayCandidate = currentCandidate || candidate;

  const handleRefreshCandidate = () => {
    if (candidate) {
      const fresh = getCandidateById(candidate.id);
      if (fresh) {
        setCurrentCandidate(fresh);
      }
    }
  };

  const handleHrbpChange = (newHrbpEmail: string) => {
    const matchedHrbp = LIST_OF_OFFICIAL_HRBPS.find(h => h.email === newHrbpEmail);
    if (matchedHrbp && currentCandidate) {
      const updated = {
        ...currentCandidate,
        hrbp: matchedHrbp
      };
      saveCandidate(updated);
      setCurrentCandidate(updated);
    }
  };

  const handleSaveSchedule = () => {
    if (onUpdateSchedule && candidate) {
      onUpdateSchedule(candidate.id, scheduleItems);
      setScheduleSavedToast(true);
      setTimeout(() => setScheduleSavedToast(false), 3000);
    }
  };

  const handleResetSchedule = () => {
    const isRemote = candidate?.workMode === 'Remote';
    const reset = isRemote ? [...DEFAULT_REMOTE_SCHEDULE] : [...DEFAULT_FIELDASSIST_SCHEDULE];
    setScheduleItems(reset);
    if (onUpdateSchedule && candidate) {
      onUpdateSchedule(candidate.id, reset);
      setScheduleSavedToast(true);
      setTimeout(() => setScheduleSavedToast(false), 3000);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...scheduleItems];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setScheduleItems(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === scheduleItems.length - 1) return;
    const updated = [...scheduleItems];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setScheduleItems(updated);
  };

  const handleDeleteItem = (index: number) => {
    const updated = scheduleItems.filter((_, i) => i !== index);
    setScheduleItems(updated);
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingItem({ ...scheduleItems[index] });
  };

  const handleSaveEdit = (index: number) => {
    const updated = [...scheduleItems];
    updated[index] = { ...editingItem };
    setScheduleItems(updated);
    setEditingIndex(null);
  };

  const handleAddNewItem = () => {
    if (!newItem.title || !newItem.time) return;
    setScheduleItems([...scheduleItems, { ...newItem }]);
    setNewItem({ time: '04:30 PM onwards', title: '', description: '', location: 'Assigned Workstation' });
    setIsAddingNew(false);
  };

  const handleAddPreset = (preset: { time: string; title: string; location: string; description: string }) => {
    setScheduleItems([...scheduleItems, preset]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full my-8 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 p-6 text-white flex items-start justify-between">
          <div className="flex items-center gap-4">
            <CandidateAvatar candidate={displayCandidate} size="xl" className="border-2 border-purple-300 shadow-md" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-white">{toTitleCase(candidate.name)}</h3>
                <span className="text-[10px] font-bold bg-purple-500/30 text-purple-200 px-2.5 py-0.5 rounded-full border border-purple-400/30">
                  {candidate.department}
                </span>
                <span className="text-[11px] font-mono font-bold bg-white text-purple-950 px-2.5 py-0.5 rounded-md shadow-xs">
                  Code: {candidate.accessCode || 'FA-1001'}
                </span>
              </div>
              <p className="text-xs text-purple-200 font-medium">{candidate.role}</p>
              <div className="flex items-center gap-4 text-[11px] text-purple-200/90 mt-1">
                <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-purple-300" /> {candidate.email}</span>
                <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-purple-300" /> {candidate.phone}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEditCandidate && (
              <button
                onClick={() => onEditCandidate(displayCandidate)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/20 cursor-pointer shadow-xs"
                title="Edit Candidate's Core Details"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                <span>Edit Details</span>
              </button>
            )}
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-purple-200 hover:text-white transition cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Quick Controls Bar */}
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-500 block">Current Onboarding Status</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-purple-900 bg-white px-3 py-1 rounded-lg border border-purple-200">
                  {getEffectiveCandidateStatus(candidate)}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  Form: <strong className="text-purple-700">{candidate.formStatus} ({candidate.formData.completionPercentage}%)</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={getEffectiveCandidateStatus(candidate)}
                onChange={(e) => onUpdateStatus(candidate.id, e.target.value as OnboardingStatus)}
                className="text-xs bg-white border border-purple-300 text-purple-900 font-bold rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
              >
                <option value="Offer Accepted">Offer Accepted</option>
                <option value="Form Pending">Form Pending</option>
                <option value="Under Review">Under Review</option>
                <option value="Ready for Day 1">Ready for Day 1</option>
                {Boolean(candidate.joiningDate && candidate.joiningDate <= getTodayDateString()) && (
                  <>
                    <option value="Joined">Joined</option>
                    <option value="Onboarding Complete">Onboarding Complete</option>
                  </>
                )}
              </select>

              <button
                onClick={() => {
                  onSwitchToCandidateView(candidate.id);
                  onClose();
                }}
                className="px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
              >
                <User className="w-3.5 h-3.5" />
                <span>View Candidate Portal</span>
              </button>
            </div>
          </div>

          {/* Joining Details Summary & Location Re-assignment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-400 block uppercase tracking-wider text-[10px]">Joining Date & Time</span>
                  {onEditCandidate && (
                    <button
                      onClick={() => onEditCandidate(displayCandidate)}
                      className="text-[10px] text-purple-700 hover:text-purple-900 font-bold flex items-center gap-0.5 cursor-pointer"
                      title="Edit Date or Reporting Details"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {formatJoiningDate(candidate.joiningDate, { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="text-purple-700 font-semibold text-[11px] block">{candidate.reportingTime}</span>
                {candidate.timeZone && (
                  <span className="text-slate-500 text-[10px] block font-medium">TZ: {candidate.timeZone}</span>
                )}
              </div>
            </div>

            <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-purple-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-purple-700" />
                    Assigned Location
                  </span>
                </div>
                <span className="font-bold text-slate-900 text-xs block">
                  {candidate.joiningLocation?.name || candidate.officeCity}
                </span>
                <span className="text-purple-800 font-semibold text-[11px] block">
                  {candidate.officeCity}{candidate.officeCountry ? `, ${candidate.officeCountry}` : ''}
                </span>
              </div>

              {locations.length > 0 && onReassignLocation && (
                <div className="mt-2 pt-2 border-t border-purple-200/80">
                  <label className="block text-[10px] font-bold text-purple-900 mb-1">Reassign Joining Location:</label>
                  <select
                    value={candidate.locationId || ''}
                    onChange={(e) => e.target.value && onReassignLocation(candidate.id, e.target.value)}
                    className="w-full text-[11px] bg-white border border-purple-300 font-semibold text-slate-800 rounded-lg p-1.5 focus:outline-none cursor-pointer"
                  >
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.city}, {loc.country})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-400 block uppercase tracking-wider text-[10px]">Reporting Manager</span>
              <span className="font-bold text-slate-900 mt-0.5 block text-xs">{displayCandidate.reportingManager}</span>
              <span className="text-slate-500 text-[10px] block">{displayCandidate.reportingManagerRole || 'Department Manager'}</span>

              <div className="mt-3 pt-2.5 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Assigned HRBP</span>
                  <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                    {displayCandidate.department}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={displayCandidate.hrbp?.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'}
                    alt={displayCandidate.hrbp?.name || 'HRBP'}
                    className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-300"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-xs leading-tight">{displayCandidate.hrbp?.name}</p>
                    <p className="text-purple-700 font-medium text-[10px] truncate">{displayCandidate.hrbp?.email}</p>
                  </div>
                </div>

                <label className="block text-[10px] font-bold text-slate-600 mb-1">Override HRBP Assignment:</label>
                <select
                  value={displayCandidate.hrbp?.email || ''}
                  onChange={(e) => handleHrbpChange(e.target.value)}
                  className="w-full text-[11px] bg-white border border-slate-300 font-semibold text-slate-800 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-purple-600/30 cursor-pointer"
                >
                  {LIST_OF_OFFICIAL_HRBPS.map(hrbp => (
                    <option key={hrbp.email} value={hrbp.email}>
                      {hrbp.name} ({hrbp.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Email Automation Section */}
          <EmailAutomationSection candidate={displayCandidate} onCandidateUpdated={handleRefreshCandidate} />

          {/* First Day Schedule Customizer Section */}
          <div className="bg-purple-50/50 rounded-2xl p-5 border border-purple-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-200/80 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-700" />
                  First Day Schedule Customizer ({toTitleCase(candidate.name)})
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customize the Day 1 agenda visible to this joiner on their candidate portal.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetSchedule}
                  className="px-2.5 py-1.5 bg-white hover:bg-purple-100 text-purple-800 border border-purple-300 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                  title="Reset to standard FieldAssist schedule"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset FieldAssist Agenda</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddingNew(true)}
                  className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Session</span>
                </button>
              </div>
            </div>

            {scheduleSavedToast && (
              <div className="bg-emerald-900 text-white text-xs font-bold p-2.5 rounded-xl flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Schedule changes saved & synced for candidate portal!</span>
              </div>
            )}

            {/* Quick Add Presets for HR */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-600 bg-white p-3 rounded-xl border border-purple-200/80 shadow-2xs">
              <span className="font-bold text-purple-900 flex items-center gap-1 text-xs shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Add Optional Sessions:
              </span>
              <button
                type="button"
                onClick={() => handleAddPreset({
                  time: '02:30 PM - 03:00 PM',
                  title: 'Manager 1-on-1 & 30-60-90 Day Plan',
                  description: 'Role expectations, key projects roadmap and 1-on-1 meeting with reporting manager.',
                  location: 'Reporting Manager Cabin'
                })}
                className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg border border-purple-300 font-bold cursor-pointer transition shadow-2xs flex items-center gap-1"
                title="Add Manager 1-on-1 when reporting manager is available"
              >
                <span>+ Manager 1-on-1 & 30-60-90 Day Plan</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddPreset({
                  time: '04:00 PM - 04:30 PM',
                  title: 'FieldAssist Product Deep Dive',
                  description: 'Overview of FieldAssist Sales Force Automation & DMS platforms.',
                  location: 'Training Room Beta'
                })}
                className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-md border border-purple-200 font-semibold cursor-pointer transition"
              >
                + Product Deep Dive
              </button>

              <button
                type="button"
                onClick={() => handleAddPreset({
                  time: '04:30 PM - 05:00 PM',
                  title: 'Executive Leadership Q&A',
                  description: 'Interactive session with leadership team.',
                  location: 'Conference Room Alpha'
                })}
                className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-md border border-purple-200 font-semibold cursor-pointer transition"
              >
                + Executive Q&A
              </button>
            </div>

            {/* Add New Session Form Inline */}
            {isAddingNew && (
              <div className="bg-white p-4 rounded-xl border-2 border-purple-300 shadow-md space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-purple-900 uppercase">Add New Schedule Event</h5>
                  <button onClick={() => setIsAddingNew(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Time Range</label>
                    <input
                      type="text"
                      value={newItem.time}
                      onChange={(e) => setNewItem({ ...newItem, time: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 p-2 rounded-lg font-bold"
                      placeholder="e.g. 04:30 PM onwards"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Event Title</label>
                    <input
                      type="text"
                      value={newItem.title}
                      onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 p-2 rounded-lg font-bold"
                      placeholder="e.g. Executive Q&A Session"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Location</label>
                    <input
                      type="text"
                      value={newItem.location}
                      onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 p-2 rounded-lg font-bold"
                      placeholder="e.g. Conference Room Alpha"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 p-2 rounded-lg font-medium"
                    placeholder="Session details and topics covered..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewItem}
                    className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs"
                  >
                    Add Event
                  </button>
                </div>
              </div>
            )}

            {/* Schedule Items List */}
            <div className="space-y-3">
              {scheduleItems.map((item, index) => (
                <div key={index} className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-purple-300 transition">
                  {editingIndex === index ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Time</label>
                          <input
                            type="text"
                            value={editingItem.time}
                            onChange={(e) => setEditingItem({ ...editingItem, time: e.target.value })}
                            className="w-full text-xs font-bold bg-purple-50 border border-purple-300 p-1.5 rounded-lg text-purple-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Title</label>
                          <input
                            type="text"
                            value={editingItem.title}
                            onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                            className="w-full text-xs font-bold bg-purple-50 border border-purple-300 p-1.5 rounded-lg text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">Location</label>
                          <input
                            type="text"
                            value={editingItem.location}
                            onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                            className="w-full text-xs font-semibold bg-purple-50 border border-purple-300 p-1.5 rounded-lg text-slate-700"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">Description</label>
                        <textarea
                          rows={2}
                          value={editingItem.description}
                          onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                          className="w-full text-xs bg-purple-50 border border-purple-300 p-1.5 rounded-lg text-slate-700 font-medium"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingIndex(null)}
                          className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(index)}
                          className="px-3 py-1 bg-purple-700 text-white text-xs font-bold rounded-md flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Update Entry</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-xs font-black text-purple-900 bg-purple-100 px-2.5 py-1 rounded-md shrink-0 mt-0.5 border border-purple-200">
                          {item.time}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="text-xs font-bold text-slate-900">{item.title}</h5>
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {item.location}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{item.description}</p>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-1 rounded-md text-slate-400 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === scheduleItems.length - 1}
                          className="p-1 rounded-md text-slate-400 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(index)}
                          className="p-1 rounded-md text-slate-400 hover:text-purple-700 hover:bg-purple-50 cursor-pointer"
                          title="Edit event"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(index)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-purple-200">
              <span className="text-xs text-slate-500 font-medium">
                Total Sessions Scheduled: <strong className="text-purple-900 font-bold">{scheduleItems.length}</strong>
              </span>
              <button
                type="button"
                onClick={handleSaveSchedule}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save & Publish Schedule</span>
              </button>
            </div>
          </div>

          {/* Form & Documents Summary Section - Full 9-Section Inspection */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-700" />
                Pre-Onboarding Form Submission (All 9 Sections)
              </h4>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                displayCandidate.formData.isSubmitted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {displayCandidate.formData.isSubmitted ? 'Form Submitted' : `${displayCandidate.formData.completionPercentage}% Complete`}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* Sec 1 & 2 Personal Details */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">1 & 2. Personal & Contact</span>
                <p><strong className="text-slate-500">Aadhaar Name:</strong> {displayCandidate.formData.fullNameAadhaar || displayCandidate.formData.fullName}</p>
                <p><strong className="text-slate-500">Email:</strong> {displayCandidate.formData.email}</p>
                <p><strong className="text-slate-500">Phone:</strong> {displayCandidate.formData.phone}</p>
                <p><strong className="text-slate-500">DOB:</strong> {displayCandidate.formData.dob || 'Not filled'}</p>
                <p><strong className="text-slate-500">T-Shirt Size:</strong> {displayCandidate.formData.tshirtSize || 'Not filled'}</p>
                <p><strong className="text-slate-500">Marital Status:</strong> {displayCandidate.formData.maritalStatus || 'Single'}</p>
                {displayCandidate.formData.childDetails && (
                  <p><strong className="text-slate-500">Children:</strong> {displayCandidate.formData.childDetails}</p>
                )}
                {displayCandidate.formData.linkedinUrl && (
                  <p><strong className="text-slate-500">LinkedIn:</strong> <a href={displayCandidate.formData.linkedinUrl} target="_blank" rel="noreferrer" className="text-purple-700 hover:underline">View Profile</a></p>
                )}
              </div>

              {/* Sec 3 Get to Know You */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">3. Get to Know You</span>
                <p><strong className="text-slate-500 block">Passionate About:</strong> {displayCandidate.formData.passion || 'Not filled'}</p>
                <p><strong className="text-slate-500 block mt-1">Hobbies / Community:</strong> {displayCandidate.formData.hobbiesCommunity || 'Not filled'}</p>
              </div>

              {/* Sec 4 Emergency Contact */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">4. Emergency Contact</span>
                <p><strong className="text-slate-500">Name:</strong> {displayCandidate.formData.emergencyContactName || 'Not filled'}</p>
                <p><strong className="text-slate-500">Relation:</strong> {displayCandidate.formData.emergencyContactRelation || 'Not filled'}</p>
                <p><strong className="text-slate-500">Phone:</strong> {displayCandidate.formData.emergencyContactPhone || 'Not filled'}</p>
              </div>

              {/* Sec 5 Education */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">5. Education Details</span>
                <p><strong className="text-slate-500">Highest Qualification:</strong> {displayCandidate.formData.highestQualification || 'Not filled'}</p>
                <p><strong className="text-slate-500">College / University:</strong> {displayCandidate.formData.collegeUniversity || 'Not filled'}</p>
                <p><strong className="text-slate-500">Year of Passing:</strong> {displayCandidate.formData.yearOfPassing || 'Not filled'}</p>
              </div>

              {/* Sec 6 Previous Employment */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">6. Previous Employment</span>
                <p><strong className="text-slate-500">Previous Company:</strong> {displayCandidate.formData.previousCompany || 'N/A'}</p>
                <p><strong className="text-slate-500">Designation:</strong> {displayCandidate.formData.previousDesignation || 'N/A'}</p>
                <p><strong className="text-slate-500">Total Experience:</strong> {displayCandidate.formData.totalWorkExperience || 'N/A'}</p>
                <p><strong className="text-slate-500">UAN Number:</strong> {displayCandidate.formData.uanNumber || 'Not provided'}</p>
              </div>

              {/* Sec 7, 8 & 9 Identity, Joining & Declaration */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">7, 8 & 9. Identity & Joining</span>
                <p><strong className="text-slate-500">Aadhaar #:</strong> {displayCandidate.formData.aadhaarNumber || 'Not filled'}</p>
                <p><strong className="text-slate-500">PAN #:</strong> {displayCandidate.formData.panNumber || 'Not filled'}</p>
                <p><strong className="text-slate-500">Opt for PF:</strong> {displayCandidate.formData.pfOptIn || 'Yes'}</p>
                <p><strong className="text-slate-500">Joining Date Comfortable:</strong> {displayCandidate.formData.isJoiningDateComfortable || 'Yes'}</p>
                {displayCandidate.formData.joiningDateUncomfortableReason && (
                  <p><strong className="text-slate-500">Reason:</strong> {displayCandidate.formData.joiningDateUncomfortableReason}</p>
                )}
                <p><strong className="text-slate-500">Declaration Agreed:</strong> {displayCandidate.formData.declarationAccepted ? 'Yes (Accepted)' : 'No'}</p>
              </div>
            </div>
          </div>

          {/* Required Documents Verification List & Previews */}
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Mandatory Document Uploads Inspector
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { title: 'Aadhaar Card', url: displayCandidate.formData.aadhaarDocUrl, name: displayCandidate.formData.aadhaarDocName || 'Aadhaar Document' },
                { title: 'PAN Card', url: displayCandidate.formData.panDocUrl, name: displayCandidate.formData.panDocName || 'PAN Document' },
                { title: 'Professional Photo', url: displayCandidate.formData.professionalPhotoUrl, name: displayCandidate.formData.professionalPhotoName || 'Professional Photo' },
                { title: 'Casual Photo', url: displayCandidate.formData.casualPhotoUrl, name: displayCandidate.formData.casualPhotoName || 'Casual Photo' }
              ].map((doc, idx) => {
                const matchedInList = displayCandidate.documents.find(d => 
                  d.name.toLowerCase().includes(doc.title.toLowerCase()) ||
                  (doc.title.includes('Aadhaar') && (d.id === 'doc-aadhaar' || d.name.toLowerCase().includes('aadhaar'))) ||
                  (doc.title.includes('PAN') && (d.id === 'doc-pan' || d.name.toLowerCase().includes('pan'))) ||
                  (doc.title.includes('Professional') && (d.id === 'doc-photo-pro' || d.name.toLowerCase().includes('professional'))) ||
                  (doc.title.includes('Casual') && (d.id === 'doc-photo-casual' || d.name.toLowerCase().includes('casual')))
                );
                const docUrl = doc.url || matchedInList?.fileUrl;

                return (
                  <div key={idx} className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-700" />
                        <span className="font-bold text-xs text-slate-900">{doc.title}</span>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        docUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {docUrl ? 'Uploaded' : 'Pending Upload'}
                      </span>
                    </div>

                    {docUrl ? (
                      <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
                        {docUrl.startsWith('data:image') || docUrl.includes('firebasestorage') || docUrl.includes('unsplash') ? (
                          <img src={docUrl} alt={doc.title} className="w-12 h-12 object-cover rounded-lg border border-slate-300 shadow-2xs shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                            DOC
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-800 truncate">{doc.name}</p>
                          <a
                            href={docUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-purple-700 font-bold hover:underline block mt-0.5"
                          >
                            View / Download Document
                          </a>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic bg-slate-50 p-2 rounded-xl border border-dashed border-slate-200 text-center">
                        Document not uploaded by joiner yet
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleSaveSchedule}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save All Changes</span>
            </button>

            {onDeleteCandidate && (
              <>
                {!isConfirmingDelete ? (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                    title="Delete Candidate Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Candidate</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-rose-100/90 border border-rose-300 p-1 rounded-lg">
                    <span className="text-[11px] font-bold text-rose-900 px-1.5">Confirm Delete?</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (candidate) {
                          onDeleteCandidate(candidate.id);
                          onClose();
                        }
                      }}
                      className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white text-[11px] font-bold rounded cursor-pointer"
                    >
                      Yes, Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded border border-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition cursor-pointer"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
