import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, Users, Clock, CheckCircle2, UserCheck, AlertCircle, Eye, Mail, FileText, ChevronRight, ShieldCheck, Download, Globe, MapPin, Link2, Copy, Check, X, FileCheck, Table, FileSpreadsheet, Trash2, Pencil } from 'lucide-react';
import { Candidate, OnboardingStatus, JoiningLocation, EmailStageKey } from '../../types';
import { dispatchCandidateEmail } from '../../services/emailDispatcherService';
import { formatJoiningDate } from '../../utils/dateUtils';
import { GoogleSheetsSyncModal } from './GoogleSheetsSyncModal';
import { CandidateAvatar } from '../CandidateAvatar';
import { getCandidateAccessUrl } from '../../utils/appUrl';
import { toTitleCase } from '../../utils/textUtils';
import { INITIAL_LOCATIONS } from '../../services/mockData';

interface HRDashboardProps {
  candidates: Candidate[];
  locations: JoiningLocation[];
  onSelectCandidateToInspect: (candidate: Candidate) => void;
  onOpenAddModal: () => void;
  onOpenLocationManager: () => void;
  onSwitchToCandidateView: (candidateId: string) => void;
  onSendReminder: (candidateName: string, email: string) => void;
  onCandidateUpdated?: () => void;
  onDeleteCandidate?: (candidateId: string) => void;
  onOpenEditCandidate?: (candidate: Candidate) => void;
  firestoreError?: string | null;
  onClearFirestoreError?: () => void;
}

export const HRDashboard: React.FC<HRDashboardProps> = ({
  candidates,
  locations,
  onSelectCandidateToInspect,
  onOpenAddModal,
  onOpenLocationManager,
  onSwitchToCandidateView,
  onSendReminder,
  onCandidateUpdated,
  onDeleteCandidate,
  onOpenEditCandidate,
  firestoreError,
  onClearFirestoreError
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [locationFilter, setLocationFilter] = useState<string>('All');
  const [formStatusFilter, setFormStatusFilter] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCandidateId, setCopiedCandidateId] = useState<string | null>(null);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);
  const [linkModalData, setLinkModalData] = useState<{ candidateName: string; accessCode: string; url: string } | null>(null);
  const [modalCopied, setModalCopied] = useState(false);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);

  const fallbackCopyTextToClipboard = (text: string): boolean => {
    let textArea: HTMLTextAreaElement | null = null;
    try {
      textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";
      textArea.style.opacity = "0.01";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, 99999);
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error('Fallback copy failed', err);
      if (textArea && textArea.parentNode) {
        document.body.removeChild(textArea);
      }
      return false;
    }
  };

  const handleCopyAccessLink = async (candidate: Candidate) => {
    const code = candidate.accessCode || candidate.email;
    const url = getCandidateAccessUrl(code);
    
    let success = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        success = true;
      } else {
        success = fallbackCopyTextToClipboard(url);
      }
    } catch (e) {
      success = fallbackCopyTextToClipboard(url);
    }

    setCopiedCandidateId(candidate.id);
    setTimeout(() => {
      setCopiedCandidateId(null);
    }, 3000);

    setToastMessage("Candidate Portal Link Copied!");
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);

    setLinkModalData({
      candidateName: candidate.name,
      accessCode: code,
      url: url
    });
    setModalCopied(success);
  };

  const handleCopyFromModal = async (url: string) => {
    let success = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        success = true;
      } else {
        success = fallbackCopyTextToClipboard(url);
      }
    } catch (e) {
      success = fallbackCopyTextToClipboard(url);
    }
    setModalCopied(true);
    setToastMessage("Candidate Portal Link Copied!");
    setTimeout(() => {
      setModalCopied(false);
    }, 2500);
  };

  const handleDeleteConfirm = () => {
    if (!candidateToDelete) return;
    const name = candidateToDelete.name;
    if (onDeleteCandidate) {
      onDeleteCandidate(candidateToDelete.id);
    }
    setCandidateToDelete(null);
    setToastMessage(`Candidate "${name}" removed successfully.`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Helper to determine if pre-onboarding form is completed
  const isCandidateFormComplete = (c: Candidate): boolean => {
    return Boolean(
      c.formData?.isSubmitted ||
      c.formStatus === 'Submitted' ||
      c.formStatus === 'Verified' ||
      c.formData?.completionPercentage === 100
    );
  };

  const getCandidateFormPercentage = (c: Candidate): number => {
    if (isCandidateFormComplete(c)) return 100;
    return typeof c.formData?.completionPercentage === 'number' ? c.formData.completionPercentage : 0;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to determine if candidate has already joined (Date of Joining <= today, excluding cancelled/rejected/inactive)
  const isJoinedCandidate = (c: Candidate): boolean => {
    const statusStr = (c.status || '').toLowerCase();
    if (statusStr.includes('cancel') || statusStr.includes('reject') || statusStr.includes('inactive')) {
      return false;
    }
    if (c.status === 'Joined' || c.status === 'Onboarding Complete') return true;
    return Boolean(c.joiningDate && c.joiningDate <= todayStr);
  };

  const isUpcomingCandidate = (c: Candidate): boolean => {
    const statusStr = (c.status || '').toLowerCase();
    if (statusStr.includes('cancel') || statusStr.includes('reject') || statusStr.includes('inactive')) {
      return false;
    }
    return !isJoinedCandidate(c);
  };

  // Compute metrics
  const totalCount = candidates.length;
  const joinedCount = candidates.filter(isJoinedCandidate).length;
  const upcomingCount = candidates.filter(isUpcomingCandidate).length;
  const completedFormCount = candidates.filter(c => isCandidateFormComplete(c)).length;
  const inProgressFormCount = candidates.filter(c => !isCandidateFormComplete(c) && getCandidateFormPercentage(c) > 0).length;
  const notStartedFormCount = candidates.filter(c => !isCandidateFormComplete(c) && getCandidateFormPercentage(c) === 0).length;
  const pendingFormCount = totalCount - completedFormCount;
  const readyForDay1Count = candidates.filter(c => c.status === 'Ready for Day 1').length;
  const remoteJoinersCount = candidates.filter(c => c.workMode === 'Remote').length;

  const departments = ['All', ...Array.from(new Set(candidates.map(c => c.department)))];

  const registeredOffices = useMemo(() => {
    const list = locations.filter(loc => {
      const city = (loc.city || '').toLowerCase();
      const name = (loc.name || '').toLowerCase();
      return (
        city.includes('gurg') || name.includes('gurg') ||
        city.includes('beng') || city.includes('bang') || name.includes('bang') || name.includes('beng') ||
        city.includes('mumbai') || name.includes('mumbai')
      );
    });

    const hasGurgaon = list.some(l => (l.city || '').toLowerCase().includes('gurg') || (l.name || '').toLowerCase().includes('gurg'));
    if (!hasGurgaon) {
      const fallbackGurgaon = INITIAL_LOCATIONS.find(l => (l.city || '').toLowerCase().includes('gurg') || (l.name || '').toLowerCase().includes('gurg'));
      if (fallbackGurgaon) list.unshift(fallbackGurgaon);
    }
    return list;
  }, [locations]);

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.officeCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.officeCountry && c.officeCountry.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.reportingManager.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.hrbp.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Joined'
        ? isJoinedCandidate(c)
        : c.status === statusFilter;
    const matchesDept = departmentFilter === 'All' || c.department === departmentFilter;
    
    let matchesLocation = true;
    if (locationFilter === 'Remote') {
      matchesLocation = c.workMode === 'Remote';
    } else if (locationFilter === 'Office') {
      matchesLocation = c.workMode === 'Office' || !c.workMode;
    } else if (locationFilter !== 'All') {
      const targetLoc = locations.find(l => l.id === locationFilter) || INITIAL_LOCATIONS.find(l => l.id === locationFilter);
      if (targetLoc) {
        const locCity = (targetLoc.city || '').toLowerCase();
        const candCity = (c.officeCity || '').toLowerCase();
        matchesLocation = (c.workMode === 'Office' || !c.workMode) && (
          c.locationId === locationFilter ||
          candCity === locCity ||
          (locCity.includes('gurg') && (candCity.includes('gurg') || candCity.includes('delhi'))) ||
          (targetLoc.name.toLowerCase().includes('gurgaon') && (candCity.includes('gurg') || candCity.includes('delhi'))) ||
          (locCity.includes('bang') && (candCity.includes('beng') || candCity.includes('bang'))) ||
          (locCity.includes('beng') && (candCity.includes('beng') || candCity.includes('bang'))) ||
          (locCity.includes('mumbai') && candCity.includes('mumbai'))
        );
      } else {
        matchesLocation = c.locationId === locationFilter || c.officeCity.toLowerCase() === locationFilter.toLowerCase();
      }
    }

    let matchesForm = true;
    if (formStatusFilter === 'Completed') {
      matchesForm = isCandidateFormComplete(c);
    } else if (formStatusFilter === 'InProgress') {
      matchesForm = !isCandidateFormComplete(c) && getCandidateFormPercentage(c) > 0;
    } else if (formStatusFilter === 'NotStarted') {
      matchesForm = !isCandidateFormComplete(c) && getCandidateFormPercentage(c) === 0;
    }

    return matchesSearch && matchesStatus && matchesDept && matchesLocation && matchesForm;
  });

  // Upcoming candidates sorted by nearest Date of Joining first
  const upcomingCandidates = useMemo(() => {
    return filteredCandidates
      .filter(c => !isJoinedCandidate(c))
      .sort((a, b) => (a.joiningDate || '').localeCompare(b.joiningDate || ''));
  }, [filteredCandidates, todayStr]);

  // Already joined candidates sorted by joining date
  const joinedCandidates = useMemo(() => {
    return filteredCandidates
      .filter(c => isJoinedCandidate(c))
      .sort((a, b) => (b.joiningDate || '').localeCompare(a.joiningDate || ''));
  }, [filteredCandidates, todayStr]);

  const handleReminderClick = async (c: Candidate) => {
    const stagesKeys: EmailStageKey[] = ['welcome_7d', 'culture_5d', 'comm_3d', 'day1_1d'];
    const pendingStage = stagesKeys.find(key => !c.emailAutomation?.stages?.[key] || c.emailAutomation?.stages?.[key]?.status !== 'Sent') || 'welcome_7d';
    try {
      const res = await dispatchCandidateEmail(c.id, pendingStage, {
        forceResend: c.emailAutomation?.stages?.[pendingStage]?.status === 'Sent',
        triggeredBy: 'hr_manual'
      });
      setToastMessage(res.message);
    } catch (err: any) {
      onSendReminder(toTitleCase(c.name), c.email);
      setToastMessage(`Email reminder dispatched to ${toTitleCase(c.name)} (${c.email})`);
    }
    if (onCandidateUpdated) {
      onCandidateUpdated();
    }
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleExportCSV = () => {
    const headers = "Name,Role,Department,Joining Date,Reporting Manager,HRBP,Form Status,Completion %,Status\n";
    const rows = candidates.map(c => 
      `"${toTitleCase(c.name)}","${c.role}","${c.department}","${c.joiningDate}","${c.reportingManager}","${c.hrbp.name}","${c.formStatus}",${c.formData.completionPercentage}%,"${c.status}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FieldAssist_PreOnboarding_Joiners_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setToastMessage('Candidate list exported to CSV');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Visible Firestore / HR Error Toast */}
      {firestoreError && (
        <div className="bg-rose-950 text-rose-100 text-xs font-bold px-4 py-3.5 rounded-xl shadow-lg flex items-center justify-between transition border border-rose-700 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-extrabold text-white block">Firestore Synchronization Notice</span>
              <span className="text-rose-200 font-normal">{firestoreError}</span>
            </div>
          </div>
          {onClearFirestoreError && (
            <button onClick={onClearFirestoreError} className="text-rose-300 hover:text-white font-bold cursor-pointer p-1 ml-3">✕</button>
          )}
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-purple-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg flex items-center justify-between transition border border-purple-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-purple-300 hover:text-white font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* HR Dashboard Banner & Stats */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-purple-800/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold bg-purple-500/20 text-purple-200 border border-purple-400/30 px-3 py-1 rounded-full uppercase tracking-wider">
              FieldAssist HR Command Center
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
              Pre-Onboarding & Joiners Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/90 mt-1">
              Manage upcoming hires, verify statutory forms, track equipment dispatch and Day 1 readiness.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsGoogleSheetsModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-900/90 hover:bg-emerald-800 text-white text-xs font-bold transition border border-emerald-400/40 flex items-center gap-2 cursor-pointer shadow-xs"
              title="Google Sheets Real-Time Sync (6 Master Tabs)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Google Sheets Sync</span>
            </button>

            <button
              onClick={onOpenLocationManager}
              className="px-3.5 py-2.5 rounded-xl bg-purple-800/90 hover:bg-purple-800 text-white text-xs font-bold transition border border-purple-500/50 flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Globe className="w-4 h-4 text-purple-300" />
              <span>Manage Joining Locations</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 rounded-xl bg-purple-800/80 hover:bg-purple-800 text-white text-xs font-bold transition border border-purple-600/50 flex items-center gap-2 cursor-pointer shadow-xs"
              title="Export Candidate Master CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export Candidates CSV</span>
            </button>

            <button
              id="btn-add-candidate"
              onClick={onOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-purple-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Joiner</span>
            </button>
          </div>
        </div>

        {/* 5 Overview Metrics Cards including Joined */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-8 pt-6 border-t border-purple-800/60">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
            <span className="text-[11px] font-bold text-purple-200 uppercase tracking-wider block">Total Joiners</span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">{totalCount}</div>
            <span className="text-[10px] text-purple-300">All registered joiners</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
            <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">Joined</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-300 mt-1">{joinedCount}</div>
            <span className="text-[10px] text-emerald-200/80">{upcomingCount} upcoming</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
            <span className="text-[11px] font-bold text-amber-200 uppercase tracking-wider block">Pending Forms</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-1">{pendingFormCount}</div>
            <span className="text-[10px] text-amber-200/80">{completedFormCount} of {totalCount} completed</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
            <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">Forms Completed</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-300 mt-1">{completedFormCount}</div>
            <span className="text-[10px] text-emerald-200/80">
              {totalCount > 0 ? Math.round((completedFormCount / totalCount) * 100) : 0}% completion rate
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
            <span className="text-[11px] font-bold text-purple-200 uppercase tracking-wider block">Remote Joiners</span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">{remoteJoinersCount}</div>
            <span className="text-[10px] text-purple-300">Work From Home / Remote</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search candidate, role, city, manager or HRBP..."
            className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0 font-semibold">
            <FileCheck className="w-3.5 h-3.5 text-purple-700" />
            <span>Form:</span>
          </div>
          <select
            value={formStatusFilter}
            onChange={e => setFormStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 font-semibold text-slate-800 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
            title="Filter by candidate pre-onboarding form completion"
          >
            <option value="All">All Form Statuses ({totalCount})</option>
            <option value="Completed">✅ Completed ({completedFormCount})</option>
            <option value="InProgress">⏳ In Progress ({inProgressFormCount})</option>
            <option value="NotStarted">⚠️ Not Started ({notStartedFormCount})</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0 font-semibold ml-1">
            <Globe className="w-3.5 h-3.5 text-purple-700" />
            <span>Location:</span>
          </div>
          <select
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 font-semibold text-slate-800 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="All">All Modes & Locations</option>
            <option value="Office">🏢 Office Joiners</option>
            <option value="Remote">💻 Remote Joiners</option>
            <optgroup label="Registered Offices">
              {registeredOffices.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.city})
                </option>
              ))}
            </optgroup>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0 font-semibold ml-1">
            <Filter className="w-3.5 h-3.5 text-purple-700" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 font-semibold text-slate-800 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Offer Accepted">Offer Accepted</option>
            <option value="Form Pending">Form Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Ready for Day 1">Ready for Day 1</option>
            <option value="Joined">Joined</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0 font-semibold ml-1">
            <span>Dept:</span>
          </div>
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 font-semibold text-slate-800 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
          >
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">Candidate</th>
                <th className="py-3.5 px-4">Role & Dept</th>
                <th className="py-3.5 px-4">Joining Date & Location</th>
                <th className="py-3.5 px-4">HRBP</th>
                <th className="py-3.5 px-4">Pre-Onboarding Form</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No joiners found matching filter criteria.
                  </td>
                </tr>
              ) : (
                <>
                  {/* 1. Upcoming Joiners First (Nearest joining date first, bold name and date) */}
                  {upcomingCandidates.map(candidate => (
                    <tr key={candidate.id} className="hover:bg-purple-50/30 transition group">
                      
                      {/* Candidate Name & Email */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <CandidateAvatar candidate={candidate} size="md" />
                          <div>
                            <p className="font-extrabold text-slate-950 group-hover:text-purple-900 text-[13px]">{toTitleCase(candidate.name)}</p>
                            <p className="text-[11px] text-slate-500">{candidate.email}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded border border-purple-200">
                                {candidate.accessCode || 'FA-1001'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Department */}
                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-900">{candidate.role}</p>
                        <span className="inline-block mt-0.5 text-[10px] font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">
                          {candidate.department}
                        </span>
                      </td>

                      {/* Joining Date & Location / Work Mode */}
                      <td className="py-4 px-4">
                        <p className="font-black text-slate-950 text-xs">
                          {formatJoiningDate(candidate.joiningDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {candidate.workMode === 'Remote' ? (
                            <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full border border-indigo-200">
                              💻 Remote ({candidate.remoteCity || candidate.officeCity}, {candidate.remoteCountry || candidate.officeCountry})
                            </span>
                          ) : (
                            <span className="text-[11px] text-purple-900 font-bold">
                              🏢 {candidate.officeCity.toLowerCase().includes('gurg') ? 'Gurgaon' : candidate.officeCity.toLowerCase().includes('beng') || candidate.officeCity.toLowerCase().includes('bang') ? 'Bangalore' : candidate.officeCity.toLowerCase().includes('mumbai') ? 'Mumbai' : candidate.officeCity}
                            </span>
                          )}
                        </div>
                        {candidate.timeZone && (
                          <p className="text-[10px] text-slate-400 font-medium">{candidate.timeZone}</p>
                        )}
                      </td>

                      {/* HRBP */}
                      <td className="py-4 px-4">
                        <p className="font-semibold text-slate-900"><strong className="text-slate-400 font-normal">HRBP:</strong> {candidate.hrbp?.name || 'Unassigned'}</p>
                      </td>

                      {/* Pre-Onboarding Form Status, Percentage & Documents */}
                      <td className="py-4 px-4 min-w-[170px]">
                        {(() => {
                          const isComplete = isCandidateFormComplete(candidate);
                          const pct = getCandidateFormPercentage(candidate);
                          const isZero = !isComplete && pct === 0;

                          return (
                            <div className="space-y-1.5 max-w-[160px]">
                              <div className="flex items-center justify-between gap-1">
                                {isComplete ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span>Completed</span>
                                  </span>
                                ) : isZero ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                                    <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                                    <span>Not Started</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                                    <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                                    <span>In Progress</span>
                                  </span>
                                )}

                                <span className={`text-[11px] font-black ${
                                  isComplete ? 'text-emerald-700' : isZero ? 'text-rose-600' : 'text-amber-700'
                                }`}>
                                  {isComplete ? '100%' : `${pct}%`}
                                </span>
                              </div>

                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/70">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isComplete ? 'bg-emerald-600' : isZero ? 'bg-slate-300' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${isComplete ? 100 : pct}%` }}
                                />
                              </div>

                              <div className="flex items-center gap-1 mt-1">
                                {(() => {
                                  const uploadedDocs = candidate.documents.filter(d => d.status === 'Uploaded' || d.status === 'Verified' || d.fileUrl).length;
                                  const totalDocs = candidate.documents.length || 4;
                                  const totalStagesCount = 4;
                                  const sentEmailsCount = Object.values(candidate.emailAutomation?.stages || {}).filter((s: any) => s?.status === 'Sent').length;
                                  return (
                                    <>
                                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                        uploadedDocs >= totalDocs
                                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                          : uploadedDocs > 0
                                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                                          : 'bg-rose-50 text-rose-700 border-rose-200'
                                      }`}>
                                        {uploadedDocs}/{totalDocs} Docs
                                      </span>

                                      <button
                                        onClick={() => onSelectCandidateToInspect(candidate)}
                                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded border flex items-center gap-0.5 cursor-pointer hover:opacity-80 transition ${
                                          sentEmailsCount === totalStagesCount
                                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                            : sentEmailsCount > 0
                                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                                            : 'bg-amber-50 text-amber-800 border-amber-200'
                                        }`} title="Click to view & manage pre-onboarding email automation">
                                        <Mail className="w-2.5 h-2.5" />
                                        <span>Emails {sentEmailsCount}/{totalStagesCount}</span>
                                      </button>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Onboarding Status Badge */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          candidate.status === 'Ready for Day 1'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : candidate.status === 'Under Review'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : candidate.status === 'Form Pending'
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {candidate.status}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleCopyAccessLink(candidate)}
                            className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition border flex items-center gap-1 cursor-pointer ${
                              copiedCandidateId === candidate.id
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
                            }`}
                            title="Copy Candidate Access Link"
                          >
                            {copiedCandidateId === candidate.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Copied ✓</span>
                              </>
                            ) : (
                              <>
                                <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                                <span className="hidden sm:inline">Copy Link</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => onSelectCandidateToInspect(candidate)}
                            className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-[11px] transition border border-purple-200 flex items-center gap-1 cursor-pointer"
                            title="Inspect Candidate Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>

                          <button
                            onClick={() => onOpenEditCandidate && onOpenEditCandidate(candidate)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[11px] transition border border-amber-200 flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Edit Candidate Details"
                          >
                            <Pencil className="w-3.5 h-3.5 text-amber-700" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleReminderClick(candidate)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition border border-slate-200 cursor-pointer"
                            title="Send Email Reminder"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setCandidateToDelete(candidate)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 font-bold text-[11px] transition border border-rose-200 cursor-pointer"
                            title="Delete Candidate Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onSwitchToCandidateView(candidate.id)}
                            className="p-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] transition cursor-pointer"
                            title="View Portal as this candidate"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}

                  {/* 2. "Joined (n)" Section Divider */}
                  {joinedCandidates.length > 0 && (
                    <tr className="bg-emerald-50/85 border-y-2 border-emerald-200">
                      <td colSpan={7} className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-600 text-white shadow-2xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            Joined ({joinedCandidates.length})
                          </span>
                          <span className="text-xs text-emerald-900 font-bold">
                            Candidates who have completed Day 1 joining & officially joined FieldAssist
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* 3. Already-Joined Candidates (Slightly muted rows, green "Joined ✓" badge) */}
                  {joinedCandidates.map(candidate => (
                    <tr key={candidate.id} className="opacity-80 bg-slate-50/60 hover:opacity-100 hover:bg-emerald-50/20 transition group">
                      
                      {/* Candidate Name & Email */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <CandidateAvatar candidate={candidate} size="md" />
                          <div>
                            <p className="font-bold text-slate-800 group-hover:text-emerald-950">{toTitleCase(candidate.name)}</p>
                            <p className="text-[11px] text-slate-500">{candidate.email}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono font-bold bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded border border-slate-300">
                                {candidate.accessCode || 'FA-1001'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Department */}
                      <td className="py-4 px-4">
                        <p className="font-semibold text-slate-800">{candidate.role}</p>
                        <span className="inline-block mt-0.5 text-[10px] font-semibold bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-md">
                          {candidate.department}
                        </span>
                      </td>

                      {/* Joining Date & Location / Work Mode */}
                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-800">
                          {formatJoiningDate(candidate.joiningDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {candidate.workMode === 'Remote' ? (
                            <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full border border-indigo-200">
                              💻 Remote ({candidate.remoteCity || candidate.officeCity}, {candidate.remoteCountry || candidate.officeCountry})
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-700 font-bold">
                              🏢 {candidate.officeCity.toLowerCase().includes('gurg') ? 'Gurgaon' : candidate.officeCity.toLowerCase().includes('beng') || candidate.officeCity.toLowerCase().includes('bang') ? 'Bangalore' : candidate.officeCity.toLowerCase().includes('mumbai') ? 'Mumbai' : candidate.officeCity}
                            </span>
                          )}
                        </div>
                        {candidate.timeZone && (
                          <p className="text-[10px] text-slate-400 font-medium">{candidate.timeZone}</p>
                        )}
                      </td>

                      {/* HRBP */}
                      <td className="py-4 px-4">
                        <p className="font-semibold text-slate-800"><strong className="text-slate-400 font-normal">HRBP:</strong> {candidate.hrbp?.name || 'Unassigned'}</p>
                      </td>

                      {/* Pre-Onboarding Form Status, Percentage & Documents */}
                      <td className="py-4 px-4 min-w-[170px]">
                        {(() => {
                          const isComplete = isCandidateFormComplete(candidate);
                          const pct = getCandidateFormPercentage(candidate);
                          const isZero = !isComplete && pct === 0;

                          return (
                            <div className="space-y-1.5 max-w-[160px]">
                              <div className="flex items-center justify-between gap-1">
                                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>Completed</span>
                                </span>

                                <span className="text-[11px] font-black text-emerald-700">
                                  {isComplete ? '100%' : `${pct}%`}
                                </span>
                              </div>

                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/70">
                                <div
                                  className="h-full rounded-full bg-emerald-600"
                                  style={{ width: `${isComplete ? 100 : pct}%` }}
                                />
                              </div>

                              <div className="flex items-center gap-1 mt-1">
                                {(() => {
                                  const uploadedDocs = candidate.documents.filter(d => d.status === 'Uploaded' || d.status === 'Verified' || d.fileUrl).length;
                                  const totalDocs = candidate.documents.length || 4;
                                  return (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded border bg-emerald-100 text-emerald-800 border-emerald-200">
                                      {uploadedDocs}/{totalDocs} Docs
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Onboarding Status Badge - Green "Joined ✓" Badge */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                          <Check className="w-3 h-3 text-emerald-700 stroke-[3]" />
                          <span>Joined ✓</span>
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleCopyAccessLink(candidate)}
                            className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition border flex items-center gap-1 cursor-pointer ${
                              copiedCandidateId === candidate.id
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                            }`}
                            title="Copy Candidate Access Link"
                          >
                            {copiedCandidateId === candidate.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Copied ✓</span>
                              </>
                            ) : (
                              <>
                                <Link2 className="w-3.5 h-3.5 text-slate-600" />
                                <span className="hidden sm:inline">Copy Link</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => onSelectCandidateToInspect(candidate)}
                            className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-[11px] transition border border-purple-200 flex items-center gap-1 cursor-pointer"
                            title="Inspect Candidate Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>

                          <button
                            onClick={() => onOpenEditCandidate && onOpenEditCandidate(candidate)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[11px] transition border border-amber-200 flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Edit Candidate Details"
                          >
                            <Pencil className="w-3.5 h-3.5 text-amber-700" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleReminderClick(candidate)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition border border-slate-200 cursor-pointer"
                            title="Send Email Reminder"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setCandidateToDelete(candidate)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 font-bold text-[11px] transition border border-rose-200 cursor-pointer"
                            title="Delete Candidate Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onSwitchToCandidateView(candidate.id)}
                            className="p-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] transition cursor-pointer"
                            title="View Portal as this candidate"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Candidate Portal Link Modal */}
      {linkModalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Candidate Portal Link Copied!</h3>
                  <p className="text-xs text-slate-500">
                    Candidate: <strong className="text-slate-800">{linkModalData.candidateName}</strong> &bull; Code: <strong className="text-purple-700 font-mono">{linkModalData.accessCode}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLinkModalData(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 bg-purple-50/70 p-4 rounded-xl border border-purple-100 space-y-2">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Direct Candidate Portal URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={linkModalData.url}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 select-all"
                />
                <button
                  onClick={() => handleCopyFromModal(linkModalData.url)}
                  className={`px-3.5 py-2 font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    modalCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-purple-700 hover:bg-purple-800 text-white'
                  }`}
                >
                  {modalCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{modalCopied ? 'Copied ✓' : 'Copy URL'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                The direct link has been copied to your clipboard. You can paste and test this link in a new browser tab to access {linkModalData.candidateName}'s onboarding portal.
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setLinkModalData(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Sheets Sync Manager Modal */}
      <GoogleSheetsSyncModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
        candidates={candidates}
      />

      {/* Delete Candidate Confirmation Modal */}
      {candidateToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-extrabold text-slate-900">Delete Candidate Record</h3>
                <p className="text-xs text-slate-500 mt-0.5">This operation cannot be undone.</p>
              </div>
              <button
                onClick={() => setCandidateToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Candidate Card Summary */}
            <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <CandidateAvatar candidate={candidateToDelete} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{candidateToDelete.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{candidateToDelete.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded border border-purple-200">
                    {candidateToDelete.accessCode || 'FA-1001'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium truncate">
                    {candidateToDelete.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3.5 bg-rose-50/80 p-3 rounded-xl border border-rose-200/70 text-rose-900 text-xs leading-relaxed space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Permanent Deletion Notice
              </p>
              <p className="text-[11px] text-rose-700">
                Deleting this record will permanently remove all submitted form responses, document uploads, and scheduled pre-onboarding emails for this candidate.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCandidateToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Candidate</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
