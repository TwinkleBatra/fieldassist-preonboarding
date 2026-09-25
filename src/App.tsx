import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { WelcomeBanner } from './components/candidate/WelcomeBanner';
import { FirstDayInfo } from './components/candidate/FirstDayInfo';
import { PreOnboardingForm } from './components/candidate/PreOnboardingForm';
import { OnboardingStatusTracker } from './components/candidate/OnboardingStatusTracker';
import { CandidateFAQ } from './components/candidate/CandidateFAQ';
import { ContactHRModal } from './components/candidate/ContactHRModal';
import { CandidateLoginModal } from './components/candidate/CandidateLoginModal';
import { HRDashboard } from './components/hr/HRDashboard';
import { CandidateDetailModal } from './components/hr/CandidateDetailModal';
import { AddCandidateModal } from './components/hr/AddCandidateModal';
import { EditCandidateModal } from './components/hr/EditCandidateModal';
import { AddedCandidateSuccessModal } from './components/hr/AddedCandidateSuccessModal';
import { LocationModal } from './components/hr/LocationModal';
import { LocationManagerModal } from './components/hr/LocationManagerModal';
import { HRAuthModal } from './components/hr/HRAuthModal';
import { PostOnboardingTransitionView } from './components/candidate/PostOnboardingTransitionView';
import { getCandidateAccessInfo } from './utils/dateUtils';
import { getHRBPForDepartment } from './utils/hrbp';
import { auth, signOut, onAuthStateChanged, User as FirebaseUser } from './lib/firebase';
import { isApprovedHREmail, checkIsHRUser } from './utils/hrAuth';

import {
  getCandidates,
  getActiveCandidateId,
  setActiveCandidateId,
  updateCandidateForm,
  updateDocumentStatus,
  addCandidate,
  saveCandidate,
  updateCandidateCoreDetails,
  CandidateCoreDetailsUpdate,
  deleteCandidate,
  getFAQs,
  submitHRQuery,
  getLocations,
  saveLocation,
  deleteLocation,
  syncCandidatesWithFirestore,
  updateCandidateSchedule
} from './services/candidateStorage';
import { dispatchCandidateEmail } from './services/emailDispatcherService';
import { Candidate, CandidateFormData, FAQItem, OnboardingStatus, RequiredDocument, JoiningLocation, FirstDayScheduleItem } from './types';
import { Calendar, ClipboardList, CheckCircle2, HelpCircle, User, MessageSquare } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<'candidate' | 'hr'>('candidate');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [locations, setLocations] = useState<JoiningLocation[]>([]);
  const [activeCandidateId, setActiveCandidateIdState] = useState<string>('');
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  
  // Auth & Access States
  const [isCandidateLoggedIn, setIsCandidateLoggedIn] = useState<boolean>(false);
  const [isHRAuthenticated, setIsHRAuthenticated] = useState<boolean>(() => {
    const user = auth.currentUser;
    return Boolean(user && user.email && isApprovedHREmail(user.email));
  });
  const [hrUser, setHrUser] = useState<FirebaseUser | null>(() => auth.currentUser);
  const [unapprovedHREmail, setUnapprovedHREmail] = useState<string | null>(null);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Active Candidate Portal Tab
  const [candidateTab, setCandidateTab] = useState<'overview' | 'form' | 'tracker' | 'faqs'>('overview');

  // Modals
  const [isCandidateLoginModalOpen, setIsCandidateLoginModalOpen] = useState(false);
  const [isHRAuthModalOpen, setIsHRAuthModalOpen] = useState(false);
  const [isContactHROpen, setIsContactHROpen] = useState(false);
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [newlyAddedCandidate, setNewlyAddedCandidate] = useState<Candidate | null>(null);
  const [isLocationManagerOpen, setIsLocationManagerOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<JoiningLocation | null>(null);
  const [inspectCandidate, setInspectCandidate] = useState<Candidate | null>(null);
  const [candidateToEdit, setCandidateToEdit] = useState<Candidate | null>(null);
  const [unmatchedUrlCode, setUnmatchedUrlCode] = useState<string>('');

  // Listen to Firebase Auth state for authorized HR users
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        const isAuth = await checkIsHRUser(user);
        if (isAuth) {
          setHrUser(user);
          setIsHRAuthenticated(true);
          setUnapprovedHREmail(null);
          sessionStorage.setItem('fa_hr_auth', 'true');
        } else {
          setHrUser(null);
          setIsHRAuthenticated(false);
          sessionStorage.removeItem('fa_hr_auth');
          const pathname = window.location.pathname;
          const isHr = pathname === '/hr' || pathname.startsWith('/hr') || new URLSearchParams(window.location.search).get('view') === 'hr';
          if (isHr) {
            setUnapprovedHREmail(user.email);
            setIsHRAuthModalOpen(true);
            await signOut(auth);
          }
        }
      } else {
        setHrUser(null);
        setIsHRAuthenticated(false);
        sessionStorage.removeItem('fa_hr_auth');
      }
    });

    return () => unsubscribe();
  }, []);

  // Synchronize route with URL path
  useEffect(() => {
    const handleLocationChange = async () => {
      const pathname = window.location.pathname;
      const urlParams = new URLSearchParams(window.location.search);
      const isHr = pathname === '/hr' || pathname.startsWith('/hr') || urlParams.get('view') === 'hr';

      if (isHr) {
        setActiveView('hr');
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.email) {
          const isAuth = await checkIsHRUser(currentUser);
          setIsHRAuthenticated(isAuth);
          if (!isAuth) {
            setUnapprovedHREmail(currentUser.email);
            setIsHRAuthModalOpen(true);
            await signOut(auth);
          } else {
            setHrUser(currentUser);
          }
        } else {
          setIsHRAuthenticated(false);
          setIsHRAuthModalOpen(true);
        }
      } else {
        setActiveView('candidate');
        setIsHRAuthModalOpen(false);
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Load initial data from storage and check URL parameters for candidate auto-login
  useEffect(() => {
    const loadedLocations = getLocations();
    const loadedCandidates = getCandidates();
    const loadedFaqs = getFAQs();

    setLocations(loadedLocations);
    setCandidates(loadedCandidates);
    setFaqs(loadedFaqs);

    // Sync with backend email automation server
    fetch('/api/emails/sync-candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidates: loadedCandidates })
    }).catch(() => {});

    // Parse URL query parameter (e.g. ?accessCode=FA-1001 or ?code=FA-1002)
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('accessCode') || urlParams.get('code') || urlParams.get('email');
    const pathname = window.location.pathname;
    const isHrRoute = pathname === '/hr' || pathname.startsWith('/hr') || urlParams.get('view') === 'hr';

    if (codeParam) {
      const q = codeParam.trim().toLowerCase();
      const matched = loadedCandidates.find(c =>
        c.email.toLowerCase() === q ||
        (c.accessCode && c.accessCode.toLowerCase() === q) ||
        c.id.toLowerCase() === q
      );

      if (matched) {
        setActiveCandidateIdState(matched.id);
        setActiveCandidateId(matched.id);
        setIsCandidateLoggedIn(true);
        setIsCandidateLoginModalOpen(false);
        setActiveView('candidate');
      } else {
        // Code param was provided but not found in current local dataset
        setUnmatchedUrlCode(codeParam);
        setIsCandidateLoggedIn(false);
        if (!isHrRoute) {
          setIsCandidateLoginModalOpen(true);
        }
      }
    } else {
      // Root URL shows ONLY candidate portal login if not already logged in
      if (!isHrRoute) {
        setIsCandidateLoggedIn(false);
        setIsCandidateLoginModalOpen(true);
      }
    }

    // Sync Firestore data in background
    syncCandidatesWithFirestore().then(synced => {
      if (synced && synced.length > 0) {
        setCandidates(synced);
        // If codeParam was passed and previously unmatched, try matching against synced candidates
        if (codeParam) {
          const q = codeParam.trim().toLowerCase();
          const remoteMatch = synced.find(c =>
            c.email.toLowerCase() === q ||
            (c.accessCode && c.accessCode.toLowerCase() === q) ||
            c.id.toLowerCase() === q
          );
          if (remoteMatch) {
            setActiveCandidateIdState(remoteMatch.id);
            setActiveCandidateId(remoteMatch.id);
            setIsCandidateLoggedIn(true);
            setIsCandidateLoginModalOpen(false);
            setActiveView('candidate');
          }
        }
        fetch('/api/emails/sync-candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidates: synced })
        }).catch(() => {});
      }
    }).catch(console.error);
  }, []);

  const activeCandidate = candidates.find(c => c.id === activeCandidateId) || null;

  const handleSelectCandidate = (id: string) => {
    setActiveCandidateIdState(id);
    setActiveCandidateId(id);
    setIsCandidateLoggedIn(true);
  };

  const handleCandidateLogin = (candidate: Candidate) => {
    setActiveCandidateIdState(candidate.id);
    setActiveCandidateId(candidate.id);
    setIsCandidateLoggedIn(true);
    setIsCandidateLoginModalOpen(false);
    setActiveView('candidate');
  };

  const handleCandidateLogout = () => {
    setIsCandidateLoggedIn(false);
    setIsCandidateLoginModalOpen(true);
  };

  const handleHRAuthSuccess = (user?: FirebaseUser) => {
    if (user) {
      setHrUser(user);
    }
    sessionStorage.setItem('fa_hr_auth', 'true');
    setIsHRAuthenticated(true);
    setIsHRAuthModalOpen(false);
    setActiveView('hr');

    // Fetch full candidates collection from Firestore with authorized HR credentials
    syncCandidatesWithFirestore().then(synced => {
      if (synced && synced.length > 0) {
        setCandidates(synced);
      }
    }).catch(err => {
      console.warn('Sync candidates on HR auth notice:', err);
    });
  };

  const handleHRAuthClose = () => {
    setIsHRAuthModalOpen(false);
    setUnapprovedHREmail(null);
    if (!isHRAuthenticated) {
      // Redirect back to root candidate portal if HR auth closed without unlocking
      window.history.pushState({}, '', '/');
      setActiveView('candidate');
      if (!isCandidateLoggedIn) {
        setIsCandidateLoginModalOpen(true);
      }
    }
  };

  const handleExitHR = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Firebase sign-out notice:', err);
    }
    sessionStorage.removeItem('fa_hr_auth');
    setIsHRAuthenticated(false);
    setHrUser(null);
    window.history.pushState({}, '', '/');
    setActiveView('candidate');
    setIsCandidateLoggedIn(false);
    setIsCandidateLoginModalOpen(true);
  };

  const handleSaveForm = (formData: Partial<CandidateFormData>, isSubmit: boolean) => {
    if (!activeCandidate) return;
    const updated = updateCandidateForm(activeCandidate.id, formData, isSubmit);
    setCandidates(getCandidates());
    if (inspectCandidate && inspectCandidate.id === activeCandidate.id) {
      setInspectCandidate(updated);
    }
  };

  const handleUploadDoc = (docId: string, status: RequiredDocument['status'], fileName?: string, fileUrl?: string) => {
    if (!activeCandidate) return;
    const updated = updateDocumentStatus(activeCandidate.id, docId, status, fileUrl, fileName);
    setCandidates(getCandidates());
    if (inspectCandidate && inspectCandidate.id === activeCandidate.id) {
      setInspectCandidate(updated);
    }
  };

  const handleUpdateStatus = (candidateId: string, status: OnboardingStatus) => {
    const cand = candidates.find(c => c.id === candidateId);
    if (!cand) return;
    const updated = { ...cand, status };
    saveCandidate(updated);
    setCandidates(getCandidates());
    if (inspectCandidate && inspectCandidate.id === candidateId) {
      setInspectCandidate(updated);
    }
  };

  const handleVerifyDoc = (candidateId: string, docId: string, status: RequiredDocument['status']) => {
    updateDocumentStatus(candidateId, docId, status);
    const updatedList = getCandidates();
    setCandidates(updatedList);
    if (inspectCandidate && inspectCandidate.id === candidateId) {
      setInspectCandidate(updatedList.find(c => c.id === candidateId) || null);
    }
  };

  const handleUpdateSchedule = (candidateId: string, newSchedule: FirstDayScheduleItem[]) => {
    const updated = updateCandidateSchedule(candidateId, newSchedule);
    const updatedList = getCandidates();
    setCandidates(updatedList);
    if (inspectCandidate && inspectCandidate.id === candidateId) {
      setInspectCandidate(updated);
    }
  };

  const handleAddCandidate = async (candData: Omit<Candidate, 'id' | 'formData' | 'documents' | 'milestones' | 'schedule'>) => {
    try {
      setFirestoreError(null);
      const created = await addCandidate(candData);
      setCandidates(getCandidates());
      setNewlyAddedCandidate(created);

      // The moment HR adds a new candidate and clicks Save/Submit, immediately send "Your FieldAssist Account is Ready" email
      try {
        await dispatchCandidateEmail(created.id, 'account_ready', {
          forceResend: true,
          triggeredBy: 'hr_manual'
        });
        const updatedList = getCandidates();
        setCandidates(updatedList);
        const updatedCreated = updatedList.find(c => c.id === created.id);
        if (updatedCreated) {
          setNewlyAddedCandidate(updatedCreated);
        }
      } catch (err) {
        console.warn('Immediate credential email dispatch notice:', err);
      }
    } catch (err: any) {
      console.error('Failed to save candidate to Firestore:', err);
      setFirestoreError(`Failed to save candidate to Firestore: ${err?.message || 'Database write error'}. Please verify your Firestore connection.`);
    }
  };

  const handleSubmitHRQuery = (subject: string, message: string, recipientName = 'Twinkle Verma', recipientEmail = 'twinkle.verma@flick2know.com') => {
    if (!activeCandidate) return;
    submitHRQuery({
      candidateId: activeCandidate.id,
      candidateName: activeCandidate.name,
      recipientName,
      recipientEmail,
      subject,
      message
    });
  };

  const handleNavigateToSection = (sectionId: string) => {
    if (sectionId === 'pre-onboarding-form') {
      setCandidateTab('form');
    } else if (sectionId === 'first-day-info') {
      setCandidateTab('overview');
    } else if (sectionId === 'onboarding-status') {
      setCandidateTab('tracker');
    } else if (sectionId === 'candidate-faqs') {
      setCandidateTab('faqs');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchToCandidateViewFromHR = (candidateId: string) => {
    handleSelectCandidate(candidateId);
    setActiveView('candidate');
    setCandidateTab('overview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveLocation = (loc: JoiningLocation) => {
    saveLocation(loc);
    const updatedLocations = getLocations();
    setLocations(updatedLocations);
    setCandidates(getCandidates()); // Refresh candidates enriched with updated locations
  };

  const handleDeleteLocation = (locId: string) => {
    deleteLocation(locId);
    const updatedLocations = getLocations();
    setLocations(updatedLocations);
    setCandidates(getCandidates());
  };

  const handleOpenAddLocation = () => {
    setEditingLocation(null);
    setIsLocationModalOpen(true);
  };

  const handleOpenEditLocation = (loc: JoiningLocation) => {
    setEditingLocation(loc);
    setIsLocationModalOpen(true);
  };

  const handleReassignLocation = (candidateId: string, locationId: string) => {
    const loc = locations.find(l => l.id === locationId);
    if (!loc) return;

    const candidateToUpdate = candidates.find(c => c.id === candidateId);
    if (!candidateToUpdate) return;

    const updated: Candidate = {
      ...candidateToUpdate,
      locationId: loc.id,
      officeCity: loc.city,
      officeCountry: loc.country,
      officeAddress: loc.officeAddress,
      reportingTime: loc.reportingTime,
      timeZone: loc.timeZone,
      googleMapsUrl: loc.googleMapsUrl,
      dressCode: loc.dressCode,
      lunchInfo: loc.lunchInfo,
      firstDayInstructions: loc.firstDayInstructions,
      joiningLocation: loc,
      hrbp: candidateToUpdate.hrbp || getHRBPForDepartment(candidateToUpdate.department)
    };

    saveCandidate(updated);
    const refreshed = getCandidates();
    setCandidates(refreshed);
    if (inspectCandidate && inspectCandidate.id === candidateId) {
      setInspectCandidate(refreshed.find(c => c.id === candidateId) || updated);
    }
  };

  const handleDeleteCandidate = (candidateId: string) => {
    deleteCandidate(candidateId);
    const refreshed = getCandidates();
    setCandidates(refreshed);
    if (inspectCandidate && inspectCandidate.id === candidateId) {
      setInspectCandidate(null);
    }
    if (activeCandidateId === candidateId && refreshed.length > 0) {
      setActiveCandidateIdState(refreshed[0].id);
      setActiveCandidateId(refreshed[0].id);
    }
  };

  const handleSaveCandidateCoreDetails = async (candidateId: string, updates: CandidateCoreDetailsUpdate) => {
    const updated = updateCandidateCoreDetails(candidateId, updates);
    const refreshed = getCandidates();
    setCandidates(refreshed);
    if (inspectCandidate && inspectCandidate.id === candidateId) {
      setInspectCandidate(refreshed.find(c => c.id === candidateId) || updated);
    }
    if (activeCandidateId === candidateId) {
      setActiveCandidateIdState(updated.id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Top Header */}
      <Header
        activeView={activeView}
        candidates={candidates}
        activeCandidateId={activeCandidateId}
        onSelectCandidate={handleSelectCandidate}
        isCandidateLoggedIn={isCandidateLoggedIn}
        onLogoutCandidate={handleCandidateLogout}
        onOpenCandidateLogin={() => setIsCandidateLoginModalOpen(true)}
        isHRAuthenticated={isHRAuthenticated}
        onLogoutHR={handleExitHR}
        hrEmail={hrUser?.email || undefined}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* CANDIDATE PORTAL EXPERIENCE */}
        {activeView === 'candidate' && activeCandidate && (() => {
          const accessInfo = getCandidateAccessInfo(activeCandidate.joiningDate);

          // After Day 3 post-joining: show transition message only
          if (accessInfo.isExpired) {
            return (
              <PostOnboardingTransitionView
                candidate={activeCandidate}
                onLogout={handleCandidateLogout}
              />
            );
          }

          return (
            <div className="space-y-6 animate-fadeIn">
              {/* Welcome Hero Banner */}
              <WelcomeBanner
                candidate={activeCandidate}
                onNavigateToSection={handleNavigateToSection}
              />

              {/* Candidate Portal Tab Navigation Bar */}
              <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-xs flex items-center justify-between overflow-x-auto scrollbar-none select-none">
                <div className="flex items-center space-x-1 w-full">
                  {[
                    {
                      id: 'overview' as const,
                      elementId: 'tab-first-day-overview',
                      label: 'First-Day Info',
                      icon: Calendar,
                      hasBadge: false,
                    },
                    {
                      id: 'form' as const,
                      elementId: 'tab-pre-onboarding-form',
                      label: 'Pre-Onboarding Form',
                      icon: ClipboardList,
                      hasBadge: activeCandidate.formData.completionPercentage < 100,
                    },
                    {
                      id: 'tracker' as const,
                      elementId: 'tab-onboarding-tracker',
                      label: 'Status Checklist',
                      icon: CheckCircle2,
                      hasBadge: false,
                    },
                    {
                      id: 'faqs' as const,
                      elementId: 'tab-faqs',
                      label: 'FAQs & Help',
                      icon: HelpCircle,
                      hasBadge: false,
                    },
                  ].map((tab) => {
                    const isActive = candidateTab === tab.id;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        id={tab.elementId}
                        type="button"
                        onClick={() => setCandidateTab(tab.id)}
                        className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer select-none outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 ${
                          isActive
                            ? 'bg-purple-700 text-white shadow-xs'
                            : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                        <span className="select-none">{tab.label}</span>
                        {tab.hasBadge && (
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isActive ? 'bg-amber-300' : 'bg-amber-500 animate-pulse'
                            }`}
                            title="Form In Progress"
                            aria-label="Form In Progress"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Tab Content */}
              {candidateTab === 'overview' && (
                <FirstDayInfo
                  candidate={activeCandidate}
                  onOpenContactHR={() => setIsContactHROpen(true)}
                />
              )}

              {candidateTab === 'form' && (
                <PreOnboardingForm
                  key={activeCandidate.id}
                  candidate={activeCandidate}
                  onSaveForm={handleSaveForm}
                  onUploadDoc={handleUploadDoc}
                  isReadOnly={accessInfo.isGracePeriod}
                />
              )}

              {candidateTab === 'tracker' && (
                <OnboardingStatusTracker candidate={activeCandidate} />
              )}

              {candidateTab === 'faqs' && (
                <CandidateFAQ
                  faqs={faqs}
                  candidate={activeCandidate}
                  onOpenContactHR={() => setIsContactHROpen(true)}
                />
              )}

            </div>
          );
        })()}

        {/* HR DASHBOARD EXPERIENCE */}
        {activeView === 'hr' && (
          <HRDashboard
            candidates={candidates}
            locations={locations}
            currentUser={hrUser}
            firestoreError={firestoreError}
            onClearFirestoreError={() => setFirestoreError(null)}
            onSelectCandidateToInspect={setInspectCandidate}
            onOpenAddModal={() => setIsAddCandidateOpen(true)}
            onOpenLocationManager={() => setIsLocationManagerOpen(true)}
            onSwitchToCandidateView={handleSwitchToCandidateViewFromHR}
            onSendReminder={(name, email) => {
              setCandidates(getCandidates());
            }}
            onCandidateUpdated={() => {
              setCandidates(getCandidates());
            }}
            onDeleteCandidate={handleDeleteCandidate}
            onOpenEditCandidate={setCandidateToEdit}
          />
        )}

      </main>

      {/* Modals */}
      <CandidateLoginModal
        isOpen={isCandidateLoginModalOpen}
        onLogin={handleCandidateLogin}
        candidates={candidates}
        initialCode={unmatchedUrlCode}
      />

      <HRAuthModal
        isOpen={isHRAuthModalOpen}
        onClose={handleHRAuthClose}
        onSuccess={handleHRAuthSuccess}
        initialUnapprovedEmail={unapprovedHREmail}
      />

      <AddedCandidateSuccessModal
        candidate={newlyAddedCandidate}
        isOpen={Boolean(newlyAddedCandidate)}
        onClose={() => setNewlyAddedCandidate(null)}
        onOpenCandidatePortal={(candidateId) => {
          handleSwitchToCandidateViewFromHR(candidateId);
          setIsCandidateLoggedIn(true);
        }}
      />

      {activeCandidate && (
        <ContactHRModal
          candidate={activeCandidate}
          isOpen={isContactHROpen}
          onClose={() => setIsContactHROpen(false)}
          onSubmitQuery={handleSubmitHRQuery}
        />
      )}

      <AddCandidateModal
        isOpen={isAddCandidateOpen}
        onClose={() => setIsAddCandidateOpen(false)}
        onAddCandidate={handleAddCandidate}
        locations={locations}
        onOpenAddLocationModal={handleOpenAddLocation}
      />

      <LocationManagerModal
        isOpen={isLocationManagerOpen}
        onClose={() => setIsLocationManagerOpen(false)}
        locations={locations}
        onOpenAddLocation={handleOpenAddLocation}
        onOpenEditLocation={handleOpenEditLocation}
        onDeleteLocation={handleDeleteLocation}
      />

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSaveLocation={handleSaveLocation}
        onDeleteLocation={handleDeleteLocation}
        initialLocation={editingLocation}
      />

      <CandidateDetailModal
        candidate={inspectCandidate}
        locations={locations}
        isOpen={Boolean(inspectCandidate)}
        onClose={() => setInspectCandidate(null)}
        onUpdateStatus={handleUpdateStatus}
        onReassignLocation={handleReassignLocation}
        onVerifyDoc={handleVerifyDoc}
        onSwitchToCandidateView={handleSwitchToCandidateViewFromHR}
        onUpdateSchedule={handleUpdateSchedule}
        onDeleteCandidate={handleDeleteCandidate}
        onEditCandidate={setCandidateToEdit}
      />

      <EditCandidateModal
        candidate={candidateToEdit}
        isOpen={Boolean(candidateToEdit)}
        onClose={() => setCandidateToEdit(null)}
        locations={locations}
        onOpenAddLocationModal={handleOpenAddLocation}
        onSave={handleSaveCandidateCoreDetails}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-purple-800">FieldAssist</span>
            <span>• Pre-Onboarding Platform</span>
          </div>
          <p>© 2026 FieldAssist. All rights reserved. Designed for seamless employee joining experience.</p>
        </div>
      </footer>

    </div>
  );
}
