import React, { useState, useEffect } from 'react';
import {
  ClipboardList, CheckCircle2, AlertCircle, Save, Send, Upload, FileText, Lock, Sparkles, Check,
  ChevronLeft, ChevronRight, User, Heart, PhoneCall, GraduationCap, Briefcase, FileCheck, Calendar,
  ShieldCheck, Image, Camera, UserCheck, Eye, Trash2, ArrowRight, Mail, Landmark, Building2, CreditCard,
  Users, Baby, HeartHandshake
} from 'lucide-react';
import { Candidate, CandidateFormData } from '../../types';
import { uploadDocumentToFirebaseStorage } from '../../lib/firebase';
import { syncDocumentAndCandidate, syncCandidateToGoogleSheets, getGoogleSheetsConfig } from '../../services/googleSheetsSync';
import { buildSpouseKidsString } from '../../services/sheetsDataFormatters';

interface PreOnboardingFormProps {
  candidate: Candidate;
  onSaveForm: (formData: Partial<CandidateFormData>, isSubmit: boolean) => void;
  onUploadDoc: (docId: string, status: 'Uploaded' | 'Verified', fileName?: string, fileUrl?: string) => void;
}

type DocumentUrlKey =
  | 'aadhaarDocUrl'
  | 'panDocUrl'
  | 'professionalPhotoUrl'
  | 'casualPhotoUrl';

type DocumentNameKey =
  | 'aadhaarDocName'
  | 'panDocName'
  | 'professionalPhotoName'
  | 'casualPhotoName';

export const PreOnboardingForm: React.FC<PreOnboardingFormProps> = ({
  candidate,
  onSaveForm,
  onUploadDoc
}) => {
  const [currentSection, setCurrentSection] = useState<number>(1);

  const handleSectionChange = (sectionNum: number) => {
    setCurrentSection(sectionNum);
    setTimeout(() => {
      const headerElem = document.getElementById('section-content-header');
      if (headerElem) {
        headerElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        const formElem = document.getElementById('pre-onboarding-form');
        if (formElem) {
          formElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 20);
  };
  const [formData, setFormData] = useState<CandidateFormData>({
    ...candidate.formData,
    email: candidate.formData?.email || candidate.email,
    personalEmail: candidate.formData?.personalEmail || candidate.formData?.email || candidate.email,
    fullName: candidate.formData?.fullName || candidate.name,
    fullNameAadhaar: candidate.formData?.fullNameAadhaar || candidate.formData?.fullName || candidate.name,
    phone: candidate.formData?.phone || candidate.phone,
    joiningDate: candidate.formData?.joiningDate || candidate.joiningDate,
    tshirtSize: candidate.formData?.tshirtSize || 'L',
    maritalStatus: candidate.formData?.maritalStatus || 'Single',
    spouseName: candidate.formData?.spouseName || '',
    spouseDob: candidate.formData?.spouseDob || '',
    hasChildren: candidate.formData?.hasChildren || (candidate.formData?.child1Name ? 'Yes' : 'No'),
    child1Name: candidate.formData?.child1Name || '',
    child1Dob: candidate.formData?.child1Dob || '',
    child2Name: candidate.formData?.child2Name || '',
    child2Dob: candidate.formData?.child2Dob || '',
    childDetails: candidate.formData?.childDetails || '',
    pfOptIn: candidate.formData?.pfOptIn || 'Yes',
    currentCompany: candidate.formData?.currentCompany || candidate.currentCompany || '',
    previousCompany: candidate.formData?.previousCompany || '',
    previousDesignation: candidate.formData?.previousDesignation || '',
    totalWorkExperience: candidate.formData?.totalWorkExperience || '',
    lastWorkingDate: candidate.formData?.lastWorkingDate || '',
    uanNumber: candidate.formData?.uanNumber || '',
    isJoiningDateComfortable: candidate.formData?.isJoiningDateComfortable || 'Yes',
    declarationAccepted: candidate.formData?.declarationAccepted || false,
  });

  useEffect(() => {
    if (candidate) {
      setFormData(prev => ({
        ...prev,
        ...candidate.formData,
        spouseName: candidate.formData?.spouseName || prev.spouseName,
        spouseDob: candidate.formData?.spouseDob || prev.spouseDob,
        hasChildren: candidate.formData?.hasChildren || prev.hasChildren,
        child1Name: candidate.formData?.child1Name || prev.child1Name,
        child1Dob: candidate.formData?.child1Dob || prev.child1Dob,
        child2Name: candidate.formData?.child2Name || prev.child2Name,
        child2Dob: candidate.formData?.child2Dob || prev.child2Dob,
        childDetails: candidate.formData?.childDetails || prev.childDetails,
        aadhaarDocUrl: candidate.formData?.aadhaarDocUrl || prev.aadhaarDocUrl,
        aadhaarDocName: candidate.formData?.aadhaarDocName || prev.aadhaarDocName,
        panDocUrl: candidate.formData?.panDocUrl || prev.panDocUrl,
        panDocName: candidate.formData?.panDocName || prev.panDocName,
        professionalPhotoUrl: candidate.formData?.professionalPhotoUrl || prev.professionalPhotoUrl,
        professionalPhotoName: candidate.formData?.professionalPhotoName || prev.professionalPhotoName,
        casualPhotoUrl: candidate.formData?.casualPhotoUrl || prev.casualPhotoUrl,
        casualPhotoName: candidate.formData?.casualPhotoName || prev.casualPhotoName,
      }));
    }
  }, [
    candidate.id,
    candidate.formData?.aadhaarDocUrl,
    candidate.formData?.panDocUrl,
    candidate.formData?.professionalPhotoUrl,
    candidate.formData?.casualPhotoUrl,
  ]);

  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string | null>>({});
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Validation helpers
  const isValidEmail = (email: string) => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidAadhaar = (aadhaar: string) => !aadhaar || /^\d{12}$/.test(aadhaar.replace(/\s+/g, ''));
  const isValidPan = (pan: string) => !pan || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());

  // Calculate dynamic completion percentage across required fields
  const calculateCompletion = (data: CandidateFormData): number => {
    const requiredFields = [
      Boolean(data.email && isValidEmail(data.email)),
      Boolean(data.fullNameAadhaar || data.fullName),
      Boolean(data.phone),
      Boolean(data.dob),
      Boolean(data.currentAddress),
      Boolean(data.permanentAddress),
      Boolean(data.tshirtSize),
      Boolean(data.maritalStatus),
      Boolean(data.passion),
      Boolean(data.hobbiesCommunity),
      Boolean(data.emergencyContactName),
      Boolean(data.emergencyContactRelation),
      Boolean(data.emergencyContactPhone),
      Boolean(data.highestQualification),
      Boolean(data.collegeUniversity),
      Boolean(data.yearOfPassing),
      Boolean(data.aadhaarNumber && isValidAadhaar(data.aadhaarNumber)),
      Boolean(data.panNumber && isValidPan(data.panNumber)),
      Boolean(data.aadhaarDocUrl || candidate.documents.find(d => d.name.toLowerCase().includes('aadhaar'))?.fileUrl),
      Boolean(data.panDocUrl || candidate.documents.find(d => d.name.toLowerCase().includes('pan'))?.fileUrl),
      Boolean(data.professionalPhotoUrl || candidate.documents.find(d => d.name.toLowerCase().includes('professional'))?.fileUrl),
      Boolean(data.casualPhotoUrl || candidate.documents.find(d => d.name.toLowerCase().includes('casual'))?.fileUrl),
      Boolean(data.isJoiningDateComfortable),
      Boolean(data.declarationAccepted)
    ];

    const filled = requiredFields.filter(Boolean).length;
    return Math.round((filled / requiredFields.length) * 100);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData(prev => {
      const updated: CandidateFormData = {
        ...prev,
        [name]: val
      };

      // Synchronize composite family/kids string dynamically
      if (['maritalStatus', 'spouseName', 'spouseDob', 'hasChildren', 'child1Name', 'child1Dob', 'child2Name', 'child2Dob'].includes(name)) {
        updated.childDetails = buildSpouseKidsString(updated);
      }

      updated.completionPercentage = calculateCompletion(updated);
      return updated;
    });
  };

  const handleCopyCurrentToPermanentAddress = () => {
    setFormData(prev => ({
      ...prev,
      permanentAddress: prev.currentAddress
    }));
    setSaveToast('Permanent address copied from Current address!');
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Document File Upload Handler using Firebase Storage
  const handleFileUpload = async (
    fieldUrlKey: DocumentUrlKey,
    fieldNameKey: DocumentNameKey,
    docSearchTitle: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSizeBytes = 15 * 1024 * 1024; // 15MB limit
    if (file.size > maxSizeBytes) {
      setUploadErrors(prev => ({ ...prev, [fieldUrlKey]: 'File size exceeds 15MB limit. Please select a smaller document.' }));
      return;
    }

    setUploadingState(prev => ({ ...prev, [fieldUrlKey]: true }));
    setUploadErrors(prev => ({ ...prev, [fieldUrlKey]: null }));

    try {
      const { url, fileName } = await uploadDocumentToFirebaseStorage(candidate.id, docSearchTitle, file);

      const updated: CandidateFormData = {
        ...formData,
        [fieldUrlKey]: url,
        [fieldNameKey]: fileName,
      };
      updated.completionPercentage = calculateCompletion(updated);
      setFormData(updated);

      // Persist to local storage
      onSaveForm(updated, false);

      const matchedDoc = candidate.documents.find(d => 
        d.name.toLowerCase().includes(docSearchTitle.toLowerCase()) ||
        (fieldUrlKey === 'aadhaarDocUrl' && (d.name.toLowerCase().includes('aadhaar') || d.id === 'doc-aadhaar')) ||
        (fieldUrlKey === 'panDocUrl' && (d.name.toLowerCase().includes('pan') || d.id === 'doc-pan')) ||
        (fieldUrlKey === 'professionalPhotoUrl' && (d.name.toLowerCase().includes('professional') || d.id === 'doc-photo-pro')) ||
        (fieldUrlKey === 'casualPhotoUrl' && (d.name.toLowerCase().includes('casual') || d.id === 'doc-photo-casual'))
      );

      if (matchedDoc) {
        onUploadDoc(matchedDoc.id, 'Uploaded', fileName, url);
      } else {
        const fallbackId = `doc-${fieldUrlKey.replace('Url', '').toLowerCase()}`;
        onUploadDoc(fallbackId, 'Uploaded', fileName, url);
      }

      // Build enriched candidate record for Google Sheets synchronization
      const candidateForSync: Candidate = {
        ...candidate,
        name: candidate.name || updated.fullName || '',
        email: candidate.email || updated.personalEmail || candidate.formData?.personalEmail || '',
        aadhaarDocUrl: updated.aadhaarDocUrl || candidate.aadhaarDocUrl,
        panDocUrl: updated.panDocUrl || candidate.panDocUrl,
        photoDocUrl: updated.professionalPhotoUrl || candidate.photoDocUrl,
        formData: updated,
      };

      let docTypeKey = 'document';
      if (fieldUrlKey === 'aadhaarDocUrl') docTypeKey = 'aadhaar';
      else if (fieldUrlKey === 'panDocUrl') docTypeKey = 'pan';
      else if (fieldUrlKey === 'professionalPhotoUrl') docTypeKey = 'photo_pro';
      else if (fieldUrlKey === 'casualPhotoUrl') docTypeKey = 'photo_casual';
      else docTypeKey = String(fieldUrlKey).replace(/DocUrl|Url$/i, '').toLowerCase();

      let sheetSyncError: string | null = null;
      try {
        const syncRes = await syncDocumentAndCandidate(candidateForSync, docTypeKey, url, new Date().toISOString());
        if (!syncRes.success) {
          sheetSyncError = syncRes.errorMessage || 'Failed to update Google Sheets.';
        }
      } catch (sheetErr: any) {
        console.error('[Google Sheets Sync Exception on Upload]:', sheetErr);
        sheetSyncError = sheetErr?.message || 'Failed to update Google Sheets.';
      }

      if (sheetSyncError) {
        setUploadErrors(prev => ({
          ...prev,
          [fieldUrlKey]: `Document uploaded successfully, but Google Sheets sync failed: ${sheetSyncError}`
        }));
        setSaveToast(`Document uploaded successfully, but Google Sheets sync failed: ${sheetSyncError}`);
      } else {
        setSaveToast(`"${docSearchTitle}" uploaded and saved successfully.`);
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      setUploadErrors(prev => ({ ...prev, [fieldUrlKey]: 'Failed to upload document. Please check connection and retry.' }));
    } finally {
      setUploadingState(prev => ({ ...prev, [fieldUrlKey]: false }));
      setTimeout(() => setSaveToast(null), 3500);
    }
  };

  const handleSaveDraft = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated = {
      ...formData,
      completionPercentage: calculateCompletion(formData)
    };
    onSaveForm(updated, false);
    setSaveToast('Form progress saved securely to Firestore! You can return and complete remaining sections anytime.');
    setTimeout(() => setSaveToast(null), 4000);
  };

  const handleSubmitFinal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.declarationAccepted) {
      alert('Please read and check the declaration agreement checkbox in Section 9 before final submission.');
      return;
    }

    if (!formData.email || !isValidEmail(formData.email)) {
      alert('Please enter a valid personal email address in Section 1 / Section 2.');
      return;
    }

    if (formData.aadhaarNumber && !isValidAadhaar(formData.aadhaarNumber)) {
      alert('Please enter a valid 12-digit Aadhaar Card number in Section 7.');
      return;
    }

    if (formData.panNumber && !isValidPan(formData.panNumber)) {
      alert('Please enter a valid 10-character PAN card number (e.g. ABCDE1234F) in Section 7.');
      return;
    }

    const candidateId = candidate.accessCode || candidate.id || 'N/A';
    const candidateEmail = formData.email || candidate.email || formData.personalEmail || '';

    // [1_FORM_SUBMIT]
    console.log(`[1_FORM_SUBMIT] Candidate ID: ${candidateId}, Email: ${candidateEmail}, Action: Pre-Onboarding Form Final Submit Initiated`);

    const updated: CandidateFormData = {
      ...formData,
      isSubmitted: true,
      submittedAt: new Date().toISOString(),
      completionPercentage: 100
    };

    setFormData(updated);

    // Save candidate to local store & Firestore
    onSaveForm(updated, true);

    // [2_CANDIDATE_SAVED]
    console.log(`[2_CANDIDATE_SAVED] Candidate ID: ${candidateId}, Email: ${candidateEmail}, Result: Form data saved to Candidate Store & Firestore`);

    // Prepare candidate object for Google Sheets synchronization
    const candidateToSync: Candidate = {
      ...candidate,
      name: updated.fullName || candidate.name,
      email: updated.email || updated.personalEmail || candidate.email,
      phone: updated.phone || candidate.phone,
      formStatus: 'Submitted',
      status: (candidate.status === 'Form Pending' || candidate.status === 'Offer Accepted') ? 'Under Review' : candidate.status,
      aadhaarDocUrl: updated.aadhaarDocUrl || candidate.aadhaarDocUrl,
      panDocUrl: updated.panDocUrl || candidate.panDocUrl,
      photoDocUrl: updated.professionalPhotoUrl || candidate.photoDocUrl,
      formData: updated,
    };

    // [3_SHEETS_SYNC_CALLED]
    console.log(`[3_SHEETS_SYNC_CALLED] Candidate ID: ${candidateId}, Email: ${candidateEmail}, Action: Triggering Google Sheets Sync for Candidate Master, Details & Documents, and Personal & Interests`);

    try {
      const syncResult = await syncCandidateToGoogleSheets(candidateToSync);
      // [6_SHEET_SYNC_COMPLETE]
      console.log(`[6_SHEET_SYNC_COMPLETE] Candidate ID: ${candidateId}, Email: ${candidateEmail}, Result: ${syncResult.success ? 'Success' : 'Failed'} - ${syncResult.errorMessage || 'All 3 sheets updated successfully'}`);
    } catch (syncErr: any) {
      console.error(`[6_SHEET_SYNC_COMPLETE] Candidate ID: ${candidateId}, Email: ${candidateEmail}, Error: ${syncErr?.message || syncErr}`);
    }

    setSaveToast('Pre-Onboarding Form officially submitted to FieldAssist HR!');
    setTimeout(() => setSaveToast(null), 5000);
  };

  const sections = [
    { num: 1, title: 'Welcome', icon: Sparkles },
    { num: 2, title: 'Personal Details', icon: User },
    { num: 3, title: 'Get to Know You', icon: Heart },
    { num: 4, title: 'Emergency Contact', icon: PhoneCall },
    { num: 5, title: 'Education', icon: GraduationCap },
    { num: 6, title: 'Employment Details', icon: Briefcase },
    { num: 7, title: 'Identity Details', icon: Camera },
    { num: 8, title: 'Joining Info', icon: Calendar },
    { num: 9, title: 'Declaration', icon: ShieldCheck }
  ];

  return (
    <div id="pre-onboarding-form" className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      
      {/* Header Banner & Section Progress Tracker */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-purple-900 p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-purple-200 shadow-md">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30 mb-1">
                <Sparkles className="w-3 h-3 text-purple-300" />
                FieldAssist Pre-Onboarding Form
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Pre-Onboarding Information Portal
              </h2>
              <p className="text-xs text-purple-200 mt-0.5">
                Complete all 9 sections for HR verification & statutory setup.
              </p>
            </div>
          </div>

          {/* Section Indicator Badge */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 min-w-[220px]">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="text-purple-200 font-extrabold">Section {currentSection} of 9</span>
              <span className="text-white font-mono">{formData.completionPercentage}% Done</span>
            </div>
            <div className="w-full bg-purple-950/60 h-2.5 rounded-full overflow-hidden p-0.5 border border-purple-400/20">
              <div
                className="bg-gradient-to-r from-purple-400 to-indigo-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${formData.completionPercentage}%` }}
              />
            </div>
            {formData.isSubmitted ? (
              <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1 mt-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Form Officially Submitted
              </span>
            ) : (
              <span className="text-[10px] text-purple-200 mt-1 block">
                Progress saved automatically to Firestore
              </span>
            )}
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1.5 mt-6 pt-4 border-t border-purple-800/60">
          {sections.map((sec) => {
            const isActive = currentSection === sec.num;
            return (
              <button
                key={sec.num}
                id={`tab-section-${sec.num}`}
                type="button"
                onClick={() => handleSectionChange(sec.num)}
                className={`p-2 rounded-xl text-left transition flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-white text-purple-950 font-bold shadow-md'
                    : 'bg-white/10 hover:bg-white/20 text-purple-200 text-xs font-semibold'
                }`}
              >
                <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold shrink-0 ${
                  isActive ? 'bg-purple-900 text-white' : 'bg-purple-800/80 text-purple-200'
                }`}>
                  {sec.num}
                </span>
                <span className="text-[10px] truncate">{sec.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Save Notification Toast */}
      {saveToast && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-6 py-3 flex items-center justify-between transition animate-fadeIn shadow-inner">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveToast}</span>
          </div>
          <button onClick={() => setSaveToast(null)} className="text-white/80 hover:text-white font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Submitted Status Banner */}
      {formData.isSubmitted && (
        <div className="m-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-950 text-sm">Form Completed & Submitted to HR</h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Submitted on {formData.submittedAt ? new Date(formData.submittedAt).toLocaleDateString() : 'recently'}. Your details and document verification are securely stored in Firestore and Firebase Storage.
              </p>
            </div>
          </div>
          <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 shrink-0">
            Status: Submitted
          </span>
        </div>
      )}

      {/* Main Form Content */}
      <form onSubmit={handleSubmitFinal} className="p-6 sm:p-8">

        {/* SECTION 1: Welcome */}
        {currentSection === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div id="section-content-header" className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-700" />
                  SECTION 1 — Welcome
                </h3>
                <p className="text-sm font-medium text-slate-600 mt-1">FieldAssist Pre-Onboarding Form</p>
              </div>
              <span className="text-xs font-bold text-purple-800 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                1 of 9
              </span>
            </div>

            <div className="bg-purple-50/70 border border-purple-200/80 p-6 rounded-2xl space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-700 text-white rounded-2xl shrink-0 shadow-md">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-purple-950">Welcome to FieldAssist!</h4>
                  <p className="text-sm text-purple-900/90 mt-1.5 leading-relaxed font-normal">
                    We are thrilled to welcome you to our team. Please take a few minutes to complete this pre-onboarding form. This helps us ensure a seamless joining experience, prepare your IT credentials, verify statutory records, and finalize your Day 1 schedule.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-purple-200/60 max-w-md">
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Confirm Your Personal Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-purple-600 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={(e) => {
                      handleChange(e);
                      setFormData(prev => ({ ...prev, personalEmail: e.target.value }));
                    }}
                    placeholder="e.g. rahul.sharma@example.com"
                    className={`w-full text-xs pl-10 pr-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 font-medium ${
                      formData.email && !isValidEmail(formData.email)
                        ? 'border-rose-400 bg-rose-50/50 focus:ring-rose-500/30'
                        : 'border-slate-300 focus:ring-purple-600/30 focus:border-purple-600 bg-white'
                    }`}
                    required
                  />
                </div>
                {formData.email && !isValidEmail(formData.email) && (
                  <p className="text-[10px] text-rose-600 mt-1 font-semibold">Please enter a valid email address</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: Personal Details */}
        {currentSection === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div id="section-content-header" className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-700" />
                  SECTION 2 — Personal Details
                </h3>
                <p className="text-sm font-medium text-slate-600 mt-1">Provide your legal identity, contact info, and sizing preferences.</p>
              </div>
              <span className="text-xs font-bold text-purple-800 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                2 of 9
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name (As per Aadhaar Card) *</label>
                <input
                  type="text"
                  name="fullNameAadhaar"
                  value={formData.fullNameAadhaar || formData.fullName || ''}
                  onChange={(e) => {
                    handleChange(e);
                    setFormData(prev => ({ ...prev, fullName: e.target.value }));
                  }}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Personal Email ID *</label>
                <input
                  type="email"
                  name="personalEmail"
                  value={formData.personalEmail || formData.email || ''}
                  onChange={(e) => {
                    handleChange(e);
                    setFormData(prev => ({ ...prev, email: e.target.value, personalEmail: e.target.value }));
                  }}
                  placeholder="e.g. rahul.sharma@example.com"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mobile Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Date of Birth *</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob || ''}
                  onChange={handleChange}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">LinkedIn Profile URL / ID</label>
                <input
                  type="text"
                  name="linkedinUrl"
                  value={formData.linkedinUrl || ''}
                  onChange={handleChange}
                  placeholder="e.g. linkedin.com/in/rahulsharma"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">T-Shirt Size *</label>
                <select
                  name="tshirtSize"
                  value={formData.tshirtSize || 'L'}
                  onChange={handleChange}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-bold"
                  required
                >
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Marital Status *</label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus || 'Single'}
                  onChange={handleChange}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-bold bg-white"
                  required
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced / Separated">Divorced / Separated</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
            </div>

            {/* Conditional Spouse Details if Married */}
            {formData.maritalStatus === 'Married' && (
              <div className="p-4 bg-purple-50/50 border border-purple-200/70 rounded-2xl space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                  <HeartHandshake className="w-4 h-4 text-purple-700" />
                  <span>Spouse Details</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Spouse Name</label>
                    <input
                      type="text"
                      name="spouseName"
                      value={formData.spouseName || ''}
                      onChange={handleChange}
                      placeholder="e.g. Priya Sharma"
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Spouse Date of Birth</label>
                    <input
                      type="date"
                      name="spouseDob"
                      value={formData.spouseDob || ''}
                      onChange={handleChange}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Children Section with Toggle */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Baby className="w-4 h-4 text-purple-700" />
                  <span className="font-bold text-xs text-slate-900">Do you have children?</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="hasChildren"
                      value="No"
                      checked={formData.hasChildren === 'No' || formData.hasChildren === false || !formData.hasChildren}
                      onChange={() => {
                        setFormData(prev => {
                          const updated = {
                            ...prev,
                            hasChildren: 'No',
                            child1Name: '',
                            child1Dob: '',
                            child2Name: '',
                            child2Dob: ''
                          };
                          updated.childDetails = buildSpouseKidsString(updated);
                          updated.completionPercentage = calculateCompletion(updated);
                          return updated;
                        });
                      }}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span>No</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="hasChildren"
                      value="Yes"
                      checked={formData.hasChildren === 'Yes' || formData.hasChildren === true}
                      onChange={() => {
                        setFormData(prev => {
                          const updated = {
                            ...prev,
                            hasChildren: 'Yes'
                          };
                          updated.childDetails = buildSpouseKidsString(updated);
                          updated.completionPercentage = calculateCompletion(updated);
                          return updated;
                        });
                      }}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span>Yes</span>
                  </label>
                </div>
              </div>

              {(formData.hasChildren === 'Yes' || formData.hasChildren === true) && (
                <div className="pt-3 border-t border-slate-200 space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Child 1 */}
                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                      <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Child 1 Details</span>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Child 1 Name</label>
                        <input
                          type="text"
                          name="child1Name"
                          value={formData.child1Name || ''}
                          onChange={handleChange}
                          placeholder="e.g. Aarav Sharma"
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Child 1 Date of Birth</label>
                        <input
                          type="date"
                          name="child1Dob"
                          value={formData.child1Dob || ''}
                          onChange={handleChange}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium"
                        />
                      </div>
                    </div>

                    {/* Child 2 */}
                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                      <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Child 2 Details</span>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Child 2 Name</label>
                        <input
                          type="text"
                          name="child2Name"
                          value={formData.child2Name || ''}
                          onChange={handleChange}
                          placeholder="e.g. Ananya Sharma"
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Child 2 Date of Birth</label>
                        <input
                          type="date"
                          name="child2Dob"
                          value={formData.child2Dob || ''}
                          onChange={handleChange}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Address Subsection */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Address Details</h4>
                <button
                  type="button"
                  onClick={handleCopyCurrentToPermanentAddress}
                  className="text-xs text-purple-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  Copy Current Address to Permanent
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Current Address *</label>
                  <textarea
                    name="currentAddress"
                    value={formData.currentAddress || ''}
                    onChange={handleChange}
                    rows={3}
                    placeholder="House/Flat No., Street, Area, City, State, Pincode"
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Permanent Address *</label>
                  <textarea
                    name="permanentAddress"
                    value={formData.permanentAddress || ''}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Permanent hometown address as per ID proof"
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: Get to Know You */}
        {currentSection === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div id="section-content-header" className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-purple-700" />
                  SECTION 3 — Get to Know You
                </h3>
                <p className="text-sm font-medium text-slate-600 mt-1">Help us introduce you to the team!</p>
              </div>
              <span className="text-xs font-bold text-purple-800 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                3 of 9
              </span>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
                <label className="block text-xs font-extrabold text-slate-900">
                  What's one thing you're passionate about and could talk about for hours? *
                </label>
                <p className="text-xs font-normal text-slate-600 italic">
                  Example: cafes, books, travel, fitness, movies, photography etc.
                </p>
                <textarea
                  name="passion"
                  value={formData.passion || ''}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Share what excites you (e.g. specialty coffee brewing, sci-fi novels, long-distance cycling...)"
                  className="w-full text-xs p-3.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium bg-white"
                  required
                />
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
                <label className="block text-xs font-extrabold text-slate-900">
                  What's one hobby or community activity you'd love to make time for? *
                </label>
                <p className="text-xs font-normal text-slate-600 italic">
                  Example: social service, theatre, volunteering, music, dance or sports
                </p>
                <textarea
                  name="hobbiesCommunity"
                  value={formData.hobbiesCommunity || ''}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Share your interests (e.g. playing badminton, volunteering, learning acoustic guitar...)"
                  className="w-full text-xs p-3.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium bg-white"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: Emergency Contact Details */}
        {currentSection === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div id="section-content-header" className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-purple-700" />
                  SECTION 4 — Emergency Contact Details
                </h3>
                <p className="text-sm font-medium text-slate-600 mt-1">Provide a primary family or emergency contact.</p>
              </div>
              <span className="text-xs font-bold text-purple-800 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                4 of 9
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Emergency Contact Name *</label>
                <input
                  type="text"
                  name="emergencyContactName"
                  value={formData.emergencyContactName || ''}
                  onChange={handleChange}
                  placeholder="e.g. Priya Sharma"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Relationship with Emergency Contact *</label>
                <input
                  type="text"
                  name="emergencyContactRelation"
                  value={formData.emergencyContactRelation || ''}
                  onChange={handleChange}
                  placeholder="e.g. Spouse / Father / Mother / Sibling"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Emergency Contact Number *</label>
                <input
                  type="tel"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone || ''}
                  onChange={handleChange}
                  placeholder="+91 98765 00112"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: Education Details */}
        {currentSection === 5 && (
          <div className="space-y-6 animate-fadeIn">
            <div id="section-content-header" className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-purple-700" />
                  SECTION 5 — Education Details
                </h3>
                <p className="text-sm font-medium text-slate-600 mt-1">Academic qualifications and highest degree information.</p>
              </div>
              <span className="text-xs font-bold text-purple-800 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                5 of 9
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Highest Qualification *</label>
                <input
                  type="text"
                  name="highestQualification"
                  value={formData.highestQualification || ''}
                  onChange={handleChange}
                  placeholder="e.g. B.Tech Computer Science / MBA"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">College / University Name *</label>
                <input
                  type="text"
                  name="collegeUniversity"
                  value={formData.collegeUniversity || ''}
                  onChange={handleChange}
                  placeholder="e.g. NIT Kurukshetra / Delhi University"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Year of Passing *</label>
                <input
                  type="text"
                  name="yearOfPassing"
                  value={formData.yearOfPassing || ''}
                  onChange={handleChange}
                  placeholder="e.g. 2021"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6: Employment Details */}
        {currentSection === 6 && (
          <div className="space-y-6 animate-fadeIn">
            <div id="section-content-header" className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-purple-700" />
                  SECTION 6 — Employment Details
                </h3>
                <p className="text-sm font-medium text-slate-600 mt-1">Details regarding your career background and work history.</p>
              </div>
              <span className="text-xs font-bold text-purple-800 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                6 of 9
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Previous Company Name</label>
                <input
                  type="text"
                  name="previousCompany"
                  value={formData.previousCompany || ''}
                  onChange={handleChange}
                  placeholder="e.g. Zomato Media / Salesforce"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Previous Designation</label>
                <input
                  type="text"
                  name="previousDesignation"
                  value={formData.previousDesignation || ''}
                  onChange={handleChange}
                  placeholder="e.g. Software Engineer / Product Specialist"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Total Work Experience</label>
                <input
                  type="text"
                  name="totalWorkExperience"
                  value={formData.totalWorkExperience || ''}
                  onChange={handleChange}
                  placeholder="e.g. 4.5 Years"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Last Working Date</label>
                <input
                  type="date"
                  name="lastWorkingDate"
                  value={formData.lastWorkingDate || ''}
                  onChange={handleChange}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">UAN Number (PF Universal Account No.)</label>
                <input
                  type="text"
                  name="uanNumber"
                  value={formData.uanNumber || ''}
                  onChange={handleChange}
                  placeholder="12-digit UAN"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-mono tracking-wider font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 7: Identity Details */}
        {currentSection === 7 && (
          <div className="space-y-6 animate-fadeIn">
            <div id="section-content-header" className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-purple-700" />
                  SECTION 7 — Identity Details
                </h3>
                <p className="text-sm font-medium text-slate-600 mt-1">Statutory numbers and required document uploads (stored in Firebase Storage).</p>
              </div>
              <span className="text-xs font-bold text-purple-800 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                7 of 9
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Aadhaar Card Number *</label>
                <input
                  type="text"
                  name="aadhaarNumber"
                  value={formData.aadhaarNumber || ''}
                  onChange={handleChange}
                  placeholder="12-digit Aadhaar Number"
                  className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 font-mono font-medium ${
                    formData.aadhaarNumber && !isValidAadhaar(formData.aadhaarNumber)
                      ? 'border-rose-400 bg-rose-50/50 focus:ring-rose-500/30'
                      : 'border-slate-300 focus:ring-purple-600/30 focus:border-purple-600'
                  }`}
                  required
                />
                {formData.aadhaarNumber && !isValidAadhaar(formData.aadhaarNumber) && (
                  <p className="text-[10px] text-rose-600 mt-1 font-semibold">Must be exactly 12 digits</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">PAN Card Number *</label>
                <input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber || ''}
                  onChange={handleChange}
                  placeholder="10-digit PAN (e.g. ABCDE1234F)"
                  className={`w-full text-xs px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 font-mono uppercase font-medium ${
                    formData.panNumber && !isValidPan(formData.panNumber)
                      ? 'border-rose-400 bg-rose-50/50 focus:ring-rose-500/30'
                      : 'border-slate-300 focus:ring-purple-600/30 focus:border-purple-600'
                  }`}
                  required
                />
                {formData.panNumber && !isValidPan(formData.panNumber) && (
                  <p className="text-[10px] text-rose-600 mt-1 font-semibold">Format e.g. ABCDE1234F</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Want to Opt for PF? *</label>
                <select
                  name="pfOptIn"
                  value={formData.pfOptIn || 'Yes'}
                  onChange={handleChange}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-bold"
                  required
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>

            {/* Document Upload Grid */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Mandatory Identity Document Uploads (Firebase Storage)
                </h4>
                <span className="text-[11px] text-purple-700 font-bold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Secure Storage
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Aadhaar Card Upload */}
                <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50/60 hover:bg-white transition space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-700" />
                      <span className="font-bold text-xs text-slate-900">Aadhaar Card Upload *</span>
                    </div>
                    {formData.aadhaarDocUrl ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Required
                      </span>
                    )}
                  </div>

                  {formData.aadhaarDocUrl && (
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {formData.aadhaarDocUrl.startsWith('data:image') || formData.aadhaarDocUrl.includes('firebasestorage') ? (
                          <img src={formData.aadhaarDocUrl} alt="Aadhaar preview" className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0" />
                        ) : (
                          <FileText className="w-8 h-8 text-purple-600 shrink-0" />
                        )}
                        <span className="text-[11px] font-mono text-slate-700 truncate font-semibold">
                          {formData.aadhaarDocName || 'aadhaar_card.pdf'}
                        </span>
                      </div>
                      <a href={formData.aadhaarDocUrl} target="_blank" rel="noreferrer" className="text-[10px] text-purple-700 font-bold hover:underline shrink-0">
                        View
                      </a>
                    </div>
                  )}

                  <label className="block w-full">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      disabled={uploadingState['aadhaarDocUrl']}
                      onChange={(e) => handleFileUpload('aadhaarDocUrl', 'aadhaarDocName', 'Aadhaar Card', e)}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-800 hover:file:bg-purple-200 cursor-pointer"
                    />
                  </label>
                </div>

                {/* 2. PAN Card Upload */}
                <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50/60 hover:bg-white transition space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-700" />
                      <span className="font-bold text-xs text-slate-900">PAN Card Upload *</span>
                    </div>
                    {formData.panDocUrl ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Required
                      </span>
                    )}
                  </div>

                  {formData.panDocUrl && (
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {formData.panDocUrl.startsWith('data:image') || formData.panDocUrl.includes('firebasestorage') ? (
                          <img src={formData.panDocUrl} alt="PAN preview" className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0" />
                        ) : (
                          <FileText className="w-8 h-8 text-purple-600 shrink-0" />
                        )}
                        <span className="text-[11px] font-mono text-slate-700 truncate font-semibold">
                          {formData.panDocName || 'pan_card.pdf'}
                        </span>
                      </div>
                      <a href={formData.panDocUrl} target="_blank" rel="noreferrer" className="text-[10px] text-purple-700 font-bold hover:underline shrink-0">
                        View
                      </a>
                    </div>
                  )}

                  <label className="block w-full">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      disabled={uploadingState['panDocUrl']}
                      onChange={(e) => handleFileUpload('panDocUrl', 'panDocName', 'PAN Card', e)}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-800 hover:file:bg-purple-200 cursor-pointer"
                    />
                  </label>
                </div>

                {/* 3. Clear Professional Photo Upload */}
                <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50/60 hover:bg-white transition space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4 text-purple-700" />
                      <span className="font-bold text-xs text-slate-900">Clear Professional Photo *</span>
                    </div>
                    {formData.professionalPhotoUrl ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Required
                      </span>
                    )}
                  </div>

                  {formData.professionalPhotoUrl && (
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <img src={formData.professionalPhotoUrl} alt="Professional Photo" className="w-12 h-12 object-cover rounded-lg border border-slate-200 shadow-2xs shrink-0" />
                        <span className="text-[11px] font-mono text-slate-700 truncate font-semibold">
                          {formData.professionalPhotoName || 'headshot.jpg'}
                        </span>
                      </div>
                      <a href={formData.professionalPhotoUrl} target="_blank" rel="noreferrer" className="text-[10px] text-purple-700 font-bold hover:underline shrink-0">
                        View
                      </a>
                    </div>
                  )}

                  <label className="block w-full">
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingState['professionalPhotoUrl']}
                      onChange={(e) => handleFileUpload('professionalPhotoUrl', 'professionalPhotoName', 'Professional Photo', e)}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-800 hover:file:bg-purple-200 cursor-pointer"
                    />
                  </label>
                </div>

                {/* 4. Clear Casual Photo Upload */}
                <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50/60 hover:bg-white transition space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-purple-700" />
                      <span className="font-bold text-xs text-slate-900">Clear Casual Photo *</span>
                    </div>
                    {formData.casualPhotoUrl ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Required
                      </span>
                    )}
                  </div>

                  {formData.casualPhotoUrl && (
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <img src={formData.casualPhotoUrl} alt="Casual Photo" className="w-12 h-12 object-cover rounded-lg border border-slate-200 shadow-2xs shrink-0" />
                        <span className="text-[11px] font-mono text-slate-700 truncate font-semibold">
                          {formData.casualPhotoName || 'casual_photo.jpg'}
                        </span>
                      </div>
                      <a href={formData.casualPhotoUrl} target="_blank" rel="noreferrer" className="text-[10px] text-purple-700 font-bold hover:underline shrink-0">
                        View
                      </a>
                    </div>
                  )}

                  {uploadErrors['casualPhotoUrl'] && (
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{uploadErrors['casualPhotoUrl']}</span>
                    </div>
                  )}

                  <label className="block w-full">
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingState['casualPhotoUrl']}
                      onChange={(e) => handleFileUpload('casualPhotoUrl', 'casualPhotoName', 'Casual Photo', e)}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-800 hover:file:bg-purple-200 cursor-pointer"
                    />
                  </label>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* SECTION 8: Joining Information */}
        {currentSection === 8 && (
          <div className="space-y-6 animate-fadeIn">
            <div id="section-content-header" className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-700" />
                  SECTION 8 — Joining Information
                </h3>
                <p className="text-sm font-medium text-slate-600 mt-1">Confirm your scheduled joining date and readiness.</p>
              </div>
              <span className="text-xs font-bold text-purple-800 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                8 of 9
              </span>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Date of Joining *</label>
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    name="joiningDate"
                    value={formData.joiningDate || candidate.joiningDate || ''}
                    disabled
                    className="w-full max-w-xs text-xs px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl font-extrabold text-slate-700 cursor-not-allowed"
                  />
                  <span className="text-[11px] text-slate-500 italic">
                    (Pre-filled from official offer letter)
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Are you comfortable joining on your scheduled date? *
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
                    <input
                      type="radio"
                      name="isJoiningDateComfortable"
                      value="Yes"
                      checked={formData.isJoiningDateComfortable === 'Yes'}
                      onChange={handleChange}
                      className="w-4 h-4 text-purple-700 focus:ring-purple-600"
                    />
                    Yes
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
                    <input
                      type="radio"
                      name="isJoiningDateComfortable"
                      value="No"
                      checked={formData.isJoiningDateComfortable === 'No'}
                      onChange={handleChange}
                      className="w-4 h-4 text-purple-700 focus:ring-purple-600"
                    />
                    No
                  </label>
                </div>
              </div>

              {formData.isJoiningDateComfortable === 'No' && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    If No, please mention the reason: *
                  </label>
                  <textarea
                    name="joiningDateUncomfortableReason"
                    value={formData.joiningDateUncomfortableReason || ''}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Please explain reason for requested extension or date adjustment..."
                    className="w-full text-xs p-3.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium"
                    required
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 9: Declaration */}
        {currentSection === 9 && (
          <div className="space-y-6 animate-fadeIn">
            <div id="section-content-header" className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-700" />
                  SECTION 9 — Declaration
                </h3>
                <p className="text-sm font-medium text-slate-600 mt-1">Review statement and execute final submission.</p>
              </div>
              <span className="text-xs font-bold text-purple-800 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                9 of 9
              </span>
            </div>

            <div className="bg-purple-50/70 border border-purple-200 p-6 rounded-2xl space-y-4">
              <h4 className="text-sm font-extrabold text-purple-950 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-purple-700" />
                Applicant Declaration
              </h4>

              <blockquote className="text-xs text-slate-700 bg-white p-4 rounded-xl border border-purple-100 font-medium leading-relaxed shadow-2xs italic">
                "I hereby declare that the information provided by me is true and correct to the best of my knowledge. I understand that any false information may affect my employment."
              </blockquote>

              <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-purple-200 cursor-pointer hover:bg-purple-50/50 transition">
                <input
                  type="checkbox"
                  name="declarationAccepted"
                  checked={Boolean(formData.declarationAccepted)}
                  onChange={handleChange}
                  className="w-5 h-5 text-purple-700 rounded-md border-slate-300 focus:ring-purple-600 mt-0.5 cursor-pointer shrink-0"
                  required
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    I agree to the declaration above *
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Checking this box acts as your official electronic signature for FieldAssist HR records.
                  </span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Form Controls Footer */}
        <div className="mt-8 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {currentSection > 1 && (
              <button
                type="button"
                onClick={() => handleSectionChange(currentSection - 1)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous Section
              </button>
            )}

            {currentSection < 9 && (
              <button
                type="button"
                onClick={() => handleSectionChange(currentSection + 1)}
                className="px-5 py-2.5 bg-purple-900 hover:bg-purple-950 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                Next Section
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => handleSaveDraft()}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4 text-purple-700" />
              <span>Save Progress</span>
            </button>

            {currentSection === 9 && (
              <button
                type="submit"
                disabled={!formData.declarationAccepted}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-900 hover:to-indigo-900 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>Submit Form</span>
              </button>
            )}
          </div>
        </div>

      </form>
    </div>
  );
};
