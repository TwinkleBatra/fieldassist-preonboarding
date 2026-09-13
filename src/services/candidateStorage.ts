import { Candidate, FAQItem, HRQuery, RequiredDocument, CandidateFormData, JoiningLocation, FirstDayScheduleItem, EmailStageKey, EmailStageLog } from '../types';
import { INITIAL_CANDIDATES, INITIAL_FAQS, INITIAL_LOCATIONS, DEFAULT_FIELDASSIST_SCHEDULE } from './mockData';
import { saveCandidateToFirestore, fetchCandidatesFromFirestore, deleteCandidateFromFirestore } from '../lib/firebase';
import { EMAIL_TEMPLATES, extractFirstName, calculateTargetDate } from './emailTemplates';
import { getHRBPForDepartment } from '../utils/hrbp';
import { syncCandidateToGoogleSheets, syncDocumentUpdateToGoogleSheets, syncDocumentAndCandidate } from './googleSheetsSync';

const STORAGE_KEYS = {
  CANDIDATES: 'fieldassist_candidates_v3',
  ACTIVE_CANDIDATE_ID: 'fieldassist_active_candidate_id_v1',
  FAQS: 'fieldassist_faqs_v1',
  QUERIES: 'fieldassist_queries_v1',
  LOCATIONS: 'fieldassist_locations_v1'
};

export const ensureEmailAutomationState = (candidate: Candidate): { candidate: Candidate; updated: boolean } => {
  let updated = false;
  const existingAutomation = candidate.emailAutomation;
  const stagesKeys: EmailStageKey[] = ['account_ready', 'welcome_7d', 'culture_5d', 'comm_3d', 'day1_1d'];
  const todayStr = new Date().toISOString().split('T')[0];
  
  const newStages: Record<EmailStageKey, EmailStageLog> = existingAutomation?.stages
    ? { ...existingAutomation.stages }
    : {} as Record<EmailStageKey, EmailStageLog>;

  for (const key of stagesKeys) {
    const tpl = EMAIL_TEMPLATES[key];
    const existingLog = newStages[key];
    const targetDate = key === 'account_ready'
      ? (existingLog?.targetDate || todayStr)
      : calculateTargetDate(candidate.joiningDate, tpl.daysBeforeJoining);

    if (!existingLog) {
      updated = true;
      newStages[key] = {
        id: `email-${candidate.id}-${key}`,
        stageKey: key,
        stageName: tpl.stageName,
        daysBeforeJoining: tpl.daysBeforeJoining,
        targetDate,
        recipientEmail: candidate.email,
        recipientName: candidate.name,
        subject: tpl.subject,
        status: 'Pending',
        logs: [key === 'account_ready' ? 'Immediate on candidate creation' : `Scheduled for ${targetDate} (Automated 7/5/3-day timeline)`]
      };
    } else {
      if (existingLog.targetDate !== targetDate || existingLog.recipientEmail !== candidate.email || existingLog.subject !== tpl.subject) {
        updated = true;
        const currentLogs = Array.isArray(existingLog.logs) ? [...existingLog.logs] : [];
        if (existingLog.targetDate !== targetDate) {
          currentLogs.push(`Rescheduled to ${targetDate} (Joining date updated to ${candidate.joiningDate})`);
        }
        newStages[key] = {
          ...existingLog,
          targetDate,
          recipientEmail: candidate.email,
          recipientName: candidate.name,
          subject: tpl.subject,
          logs: currentLogs
        };
      }
    }
  }

  if (updated || !candidate.emailAutomation) {
    return {
      candidate: {
        ...candidate,
        emailAutomation: {
          stages: newStages,
          lastEvaluatedAt: existingAutomation?.lastEvaluatedAt || new Date().toISOString()
        }
      },
      updated: true
    };
  }

  return { candidate, updated: false };
};

export const ensureAccessCode = (candidate: Candidate): { candidate: Candidate; updated: boolean } => {
  if (candidate.name.toLowerCase().includes('ananya')) {
    if (candidate.accessCode !== 'FA-1001') {
      return { candidate: { ...candidate, accessCode: 'FA-1001' }, updated: true };
    }
  }
  if (candidate.accessCode) return { candidate, updated: false };

  let code = 'FA-1001';
  if (candidate.name.toLowerCase().includes('ananya') || candidate.id === 'cand-4') code = 'FA-1001';
  else if (candidate.id === 'cand-1') code = 'FA-1006';
  else if (candidate.id === 'cand-2') code = 'FA-1002';
  else if (candidate.id === 'cand-3') code = 'FA-1003';
  else if (candidate.id === 'cand-5') code = 'FA-1005';
  else code = `FA-${Math.floor(1000 + Math.random() * 9000)}`;

  return {
    candidate: { ...candidate, accessCode: code },
    updated: true
  };
};

export const ensureLatestSchedule = (candidate: Candidate): { candidate: Candidate; updated: boolean } => {
  if (!candidate.schedule || candidate.schedule.length === 0) {
    return {
      candidate: { ...candidate, schedule: DEFAULT_FIELDASSIST_SCHEDULE },
      updated: true
    };
  }

  // If schedule starts with old 10:30 AM time or has outdated titles, upgrade to the 11:00 AM - 4:00 PM schedule
  const startsAt1030 = candidate.schedule[0]?.time === '10:30 AM';
  const hasObsoleteLegacyTitles = candidate.schedule.some(item => 
    item.title.includes('Welcome & Campus Reception') ||
    item.title.includes('HR Induction & Culture Overview') ||
    item.title.includes('IT Asset & Hardware Setup') ||
    item.title.includes('Team Lunch & Coffee') ||
    item.title === 'Office Tour & Manager Meet'
  );

  if (startsAt1030 || hasObsoleteLegacyTitles) {
    return {
      candidate: {
        ...candidate,
        reportingTime: candidate.reportingTime === '10:30 AM' ? '11:00 AM' : candidate.reportingTime,
        schedule: DEFAULT_FIELDASSIST_SCHEDULE
      },
      updated: true
    };
  }

  return { candidate, updated: false };
};

export const ensureUpcomingJoiningDate = (candidate: Candidate): { candidate: Candidate; updated: boolean } => {
  let updated = false;
  let newCand = { ...candidate };

  if (newCand.id === 'cand-1' && (newCand.joiningDate === '2026-08-18' || newCand.joiningDate.startsWith('2026-08-'))) {
    newCand.joiningDate = '2026-09-24';
    updated = true;
  }
  if (newCand.id === 'cand-2' && (newCand.joiningDate === '2026-08-20' || newCand.joiningDate.startsWith('2026-08-'))) {
    newCand.joiningDate = '2026-09-28';
    updated = true;
  }
  if (newCand.id === 'cand-3' && (newCand.joiningDate === '2026-08-28' || newCand.joiningDate.startsWith('2026-08-'))) {
    newCand.joiningDate = '2026-09-12';
    updated = true;
  }
  if (newCand.id === 'cand-4' && newCand.joiningDate === '2026-08-25') {
    newCand.joiningDate = '2026-09-18';
    updated = true;
  }
  if (newCand.id === 'cand-5' && newCand.joiningDate === '2026-09-01') {
    newCand.joiningDate = '2026-09-25';
    updated = true;
  }

  if (newCand.reportingTime === '10:30 AM') {
    newCand.reportingTime = '11:00 AM';
    updated = true;
  }

  if (newCand.lunchInfo && (newCand.lunchInfo.includes('espresso') || newCand.lunchInfo.includes('coffee'))) {
    newCand.lunchInfo = 'In-house cafeteria on the 1st floor with complimentary hot buffet lunch. Day 1 welcome lunch with your team members.';
    updated = true;
  }

  // Ensure documents with fileUrl are also synced into formData doc URLs so Replace/Remove buttons are instantly ready
  if (newCand.documents && newCand.documents.length > 0) {
    const aadhaarDoc = newCand.documents.find(d => d.name.toLowerCase().includes('aadhaar') || d.id === 'doc-aadhaar');
    const panDoc = newCand.documents.find(d => d.name.toLowerCase().includes('pan') || d.id === 'doc-pan');
    const proPhoto = newCand.documents.find(d => d.name.toLowerCase().includes('professional') || d.id === 'doc-photo-pro');
    const casualPhoto = newCand.documents.find(d => d.name.toLowerCase().includes('casual') || d.id === 'doc-photo-casual');

    let formDataChanged = false;
    const newFormData = { ...newCand.formData };

    if (aadhaarDoc?.fileUrl && !newFormData.aadhaarDocUrl) {
      newFormData.aadhaarDocUrl = aadhaarDoc.fileUrl;
      newFormData.aadhaarDocName = newFormData.aadhaarDocName || aadhaarDoc.name || 'aadhaar_card.pdf';
      formDataChanged = true;
    }
    if (panDoc?.fileUrl && !newFormData.panDocUrl) {
      newFormData.panDocUrl = panDoc.fileUrl;
      newFormData.panDocName = newFormData.panDocName || panDoc.name || 'pan_card.pdf';
      formDataChanged = true;
    }
    if (proPhoto?.fileUrl && !newFormData.professionalPhotoUrl) {
      newFormData.professionalPhotoUrl = proPhoto.fileUrl;
      newFormData.professionalPhotoName = newFormData.professionalPhotoName || proPhoto.name || 'professional_photo.jpg';
      formDataChanged = true;
    }
    if (casualPhoto?.fileUrl && !newFormData.casualPhotoUrl) {
      newFormData.casualPhotoUrl = casualPhoto.fileUrl;
      newFormData.casualPhotoName = newFormData.casualPhotoName || casualPhoto.name || 'casual_photo.jpg';
      formDataChanged = true;
    }

    if (formDataChanged) {
      newCand.formData = newFormData;
      updated = true;
    }
  }

  return { candidate: newCand, updated };
};

// Initialize localStorage if empty
export const initializeStorage = (): void => {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.LOCATIONS)) {
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(INITIAL_LOCATIONS));
  }

  if (!localStorage.getItem(STORAGE_KEYS.CANDIDATES)) {
    localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(INITIAL_CANDIDATES));
  }

  if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_CANDIDATE_ID)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CANDIDATE_ID, INITIAL_CANDIDATES[0].id);
  }

  if (!localStorage.getItem(STORAGE_KEYS.FAQS)) {
    localStorage.setItem(STORAGE_KEYS.FAQS, JSON.stringify(INITIAL_FAQS));
  }

  if (!localStorage.getItem(STORAGE_KEYS.QUERIES)) {
    localStorage.setItem(STORAGE_KEYS.QUERIES, JSON.stringify([]));
  }
};

export const getLocations = (): JoiningLocation[] => {
  initializeStorage();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LOCATIONS);
    if (!data) return INITIAL_LOCATIONS;
    const parsed: JoiningLocation[] = JSON.parse(data);
    // Filter out obsolete registered office locations that are no longer supported
    const valid3Cities = ['gurugram', 'gurgaon', 'bengaluru', 'bangalore', 'mumbai'];
    const filtered = parsed.filter(l => valid3Cities.includes(l.city.toLowerCase()));
    
    const hasGurgaon = filtered.some(l => l.city.toLowerCase().includes('gurg') || l.name.toLowerCase().includes('gurg'));
    const hasBangalore = filtered.some(l => l.city.toLowerCase().includes('beng') || l.city.toLowerCase().includes('bang') || l.name.toLowerCase().includes('bang') || l.name.toLowerCase().includes('beng'));
    const hasMumbai = filtered.some(l => l.city.toLowerCase().includes('mumbai') || l.name.toLowerCase().includes('mumbai'));

    // Refresh if stored data contains outdated addresses, old 10:30 AM reporting time, or coffee references
    const hasOutdatedData = filtered.some(l => 
      l.officeAddress.includes('Unitech Cyber Park') || 
      l.officeAddress.includes('BKC Tech Park') || 
      l.officeAddress.includes('100 Feet Road') ||
      l.reportingTime === '10:30 AM' ||
      (l.lunchInfo && (l.lunchInfo.includes('espresso') || l.lunchInfo.includes('coffee')))
    );

    if (hasOutdatedData || !hasGurgaon || !hasBangalore || !hasMumbai || filtered.length < 3) {
      localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(INITIAL_LOCATIONS));
      return INITIAL_LOCATIONS;
    }
    return filtered;
  } catch {
    return INITIAL_LOCATIONS;
  }
};

export const getLocationById = (id: string): JoiningLocation | undefined => {
  const locations = getLocations();
  return locations.find(l => l.id === id);
};

export const saveLocation = (location: JoiningLocation): JoiningLocation => {
  const locations = getLocations();
  const index = locations.findIndex(l => l.id === location.id);
  
  let savedLoc = { ...location };
  if (!savedLoc.id) {
    savedLoc.id = `loc-${Date.now()}`;
  }

  if (index >= 0) {
    locations[index] = savedLoc;
  } else {
    locations.push(savedLoc);
  }

  localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locations));
  return savedLoc;
};

export const deleteLocation = (id: string): void => {
  const locations = getLocations();
  const updated = locations.filter(l => l.id !== id);
  localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(updated));
};

export const ensureCorrectHRBP = (candidate: Candidate): { candidate: Candidate; updated: boolean } => {
  const currentEmail = candidate.hrbp?.email || '';
  const currentName = candidate.hrbp?.name || '';

  const isLegacy = !currentEmail ||
    currentEmail.includes('@fieldassist.in') ||
    currentEmail.includes('@fieldassist.com') ||
    currentEmail.includes('@fieldassist.sg') ||
    currentName === 'Megha Rastogi' ||
    currentName === 'Eleanor Vance' ||
    currentName === 'Cheryl Tan' ||
    currentName === 'Pooja Kapoor';

  if (isLegacy) {
    const deptHrbp = getHRBPForDepartment(candidate.department);
    return {
      candidate: {
        ...candidate,
        hrbp: deptHrbp
      },
      updated: true
    };
  }

  return { candidate, updated: false };
};

export const enrichCandidateWithLocation = (candidate: Candidate, locations: JoiningLocation[]): Candidate => {
  // If Remote employee, do not force matching to physical office
  if (candidate.workMode === 'Remote') {
    const city = candidate.remoteCity || candidate.officeCity || 'Remote';
    const country = candidate.remoteCountry || candidate.officeCountry || 'Global';
    const timeZone = candidate.remoteTimeZone || candidate.timeZone || 'IST (UTC+5:30)';
    const instructions = candidate.remoteInstructions || candidate.firstDayInstructions || 'On Day 1, join the Google Meet welcome link sent by your HR Partner.';

    return {
      ...candidate,
      workMode: 'Remote',
      officeCity: city,
      officeCountry: country,
      timeZone: timeZone,
      officeAddress: candidate.officeAddress && !candidate.officeAddress.includes('FieldAssist UK') && !candidate.officeAddress.includes('APAC Pte')
        ? candidate.officeAddress
        : `Remote / Work From Home (${city}, ${country})`,
      firstDayInstructions: instructions,
      remoteCity: city,
      remoteCountry: country,
      remoteTimeZone: timeZone,
      remoteInstructions: instructions,
      hrbp: candidate.hrbp || getHRBPForDepartment(candidate.department)
    };
  }

  let matchedLoc = locations.find(l => l.id === candidate.locationId);
  if (!matchedLoc && candidate.officeCity) {
    matchedLoc = locations.find(l => l.city.toLowerCase() === candidate.officeCity.toLowerCase());
  }

  if (matchedLoc) {
    return {
      ...candidate,
      workMode: 'Office',
      locationId: matchedLoc.id,
      joiningLocation: matchedLoc,
      officeCity: matchedLoc.city,
      officeCountry: matchedLoc.country,
      officeAddress: matchedLoc.officeAddress,
      reportingTime: matchedLoc.reportingTime,
      timeZone: matchedLoc.timeZone,
      googleMapsUrl: matchedLoc.googleMapsUrl,
      dressCode: matchedLoc.dressCode,
      lunchInfo: matchedLoc.lunchInfo,
      firstDayInstructions: matchedLoc.firstDayInstructions,
      hrbp: candidate.hrbp || getHRBPForDepartment(candidate.department)
    };
  }

  return {
    ...candidate,
    workMode: candidate.workMode || 'Office',
    hrbp: candidate.hrbp || getHRBPForDepartment(candidate.department)
  };
};

export const getCandidates = (): Candidate[] => {
  initializeStorage();
  const locations = getLocations();
  let rawCandidates: Candidate[] = [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CANDIDATES);
    rawCandidates = data ? JSON.parse(data) : INITIAL_CANDIDATES;
  } catch {
    rawCandidates = INITIAL_CANDIDATES;
  }

  let needsSave = false;
  const processed = rawCandidates.map(c => {
    let currentCand = c;
    const { candidate: hrbpChecked, updated: hrbpUpdated } = ensureCorrectHRBP(currentCand);
    if (hrbpUpdated) {
      currentCand = hrbpChecked;
      needsSave = true;
    }

    const enriched = enrichCandidateWithLocation(currentCand, locations);
    const { candidate: dateUpdatedCand, updated: dateUpdated } = ensureUpcomingJoiningDate(enriched);
    const { candidate: codeUpdatedCand, updated: codeUpdated } = ensureAccessCode(dateUpdatedCand);
    const { candidate: scheduleUpdatedCand, updated: schedUpdated } = ensureLatestSchedule(codeUpdatedCand);
    const { candidate: autoUpdatedCand, updated: autoUpdated } = ensureEmailAutomationState(scheduleUpdatedCand);
    if (dateUpdated || codeUpdated || schedUpdated || autoUpdated) needsSave = true;
    return autoUpdatedCand;
  });

  if (needsSave) {
    localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(processed));
    processed.forEach(c => saveCandidateToFirestore(c));
  }

  return processed;
};

export const getCandidateById = (id: string): Candidate | undefined => {
  const candidates = getCandidates();
  return candidates.find(c => c.id === id);
};

export const getCandidateByAccessCodeOrEmail = (query: string): Candidate | undefined => {
  const candidates = getCandidates();
  const q = query.trim().toLowerCase();
  if (!q) return undefined;

  return candidates.find(c => 
    c.email.toLowerCase() === q || 
    (c.accessCode && c.accessCode.toLowerCase() === q) ||
    c.id.toLowerCase() === q
  );
};

export const getActiveCandidateId = (): string => {
  initializeStorage();
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_CANDIDATE_ID) || INITIAL_CANDIDATES[0].id;
};

export const setActiveCandidateId = (id: string): void => {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_CANDIDATE_ID, id);
};

export const saveCandidate = (candidate: Candidate, skipGoogleSheetsSync = false): void => {
  const candidates = getCandidates();
  const index = candidates.findIndex(c => c.id === candidate.id);
  
  if (index >= 0) {
    candidates[index] = candidate;
  } else {
    candidates.push(candidate);
  }
  
  localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(candidates));
  saveCandidateToFirestore(candidate);

  // Background Google Sheets Synchronization only if not explicitly skipped
  if (!skipGoogleSheetsSync) {
    syncCandidateToGoogleSheets(candidate).catch(err => {
      console.warn('[Google Sheets Sync] Background sync skipped/notice:', err?.message || err);
    });
  }
};

export const deleteCandidate = (candidateId: string): void => {
  const candidates = getCandidates();
  const updated = candidates.filter(c => c.id !== candidateId);
  localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(updated));
  deleteCandidateFromFirestore(candidateId);

  // If deleted candidate was active, reset active candidate pointer
  const activeId = getActiveCandidateId();
  if (activeId === candidateId) {
    if (updated.length > 0) {
      setActiveCandidateId(updated[0].id);
    }
  }

  // Synchronize removal with backend email server
  if (typeof fetch !== 'undefined') {
    fetch('/api/emails/sync-candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidates: updated })
    }).catch(() => {});
  }
};

export const syncCandidatesWithFirestore = async (): Promise<Candidate[]> => {
  const remoteCandidates = await fetchCandidatesFromFirestore();
  if (remoteCandidates && remoteCandidates.length > 0) {
    const locations = getLocations();
    let needsRemoteUpdate = false;
    const processed = remoteCandidates.map(c => {
      const enriched = enrichCandidateWithLocation(c, locations);
      const { candidate: schedCand, updated: schedUpdated } = ensureLatestSchedule(enriched);
      const { candidate: autoCand, updated: autoUpdated } = ensureEmailAutomationState(schedCand);
      if (schedUpdated || autoUpdated) needsRemoteUpdate = true;
      return autoCand;
    });

    localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(processed));
    if (needsRemoteUpdate) {
      processed.forEach(c => saveCandidateToFirestore(c));
    }
    return processed;
  }
  // If remote is empty, populate remote with current local candidates
  const current = getCandidates();
  current.forEach(c => saveCandidateToFirestore(c));
  return current;
};

export const updateCandidateForm = (
  candidateId: string, 
  formData: Partial<CandidateFormData>, 
  isFinalSubmit: boolean = false
): Candidate => {
  const candidate = getCandidateById(candidateId);
  if (!candidate) throw new Error('Candidate not found');

  const updatedFormData: CandidateFormData = {
    ...candidate.formData,
    ...formData,
    isSubmitted: isFinalSubmit ? true : (formData.isSubmitted ?? candidate.formData.isSubmitted),
    submittedAt: isFinalSubmit ? new Date().toISOString() : candidate.formData.submittedAt
  };

  // Synchronize candidate.documents with all 4 document fields if provided in formData
  const docSyncDefs = [
    { key: 'aadhaarDocUrl', nameKey: 'aadhaarDocName', docId: 'doc-aadhaar', title: 'Aadhaar Card Upload' },
    { key: 'panDocUrl', nameKey: 'panDocName', docId: 'doc-pan', title: 'PAN Card Upload' },
    { key: 'professionalPhotoUrl', nameKey: 'professionalPhotoName', docId: 'doc-photo-pro', title: 'Clear Professional Photo Upload' },
    { key: 'casualPhotoUrl', nameKey: 'casualPhotoName', docId: 'doc-photo-casual', title: 'Clear Casual Photo Upload' }
  ] as const;

  let updatedDocuments = candidate.documents.map(doc => {
    const lowerName = doc.name.toLowerCase();
    const docId = doc.id.toLowerCase();

    for (const item of docSyncDefs) {
      const url = updatedFormData[item.key];
      const matches = doc.id === item.docId || 
        (item.key === 'aadhaarDocUrl' && lowerName.includes('aadhaar')) ||
        (item.key === 'panDocUrl' && lowerName.includes('pan')) ||
        (item.key === 'professionalPhotoUrl' && (lowerName.includes('professional') || lowerName.includes('photo-pro'))) ||
        (item.key === 'casualPhotoUrl' && (lowerName.includes('casual') || lowerName.includes('photo-casual')));

      if (matches && url) {
        return {
          ...doc,
          status: (doc.status === 'Verified' ? 'Verified' : 'Uploaded') as RequiredDocument['status'],
          fileUrl: url,
          uploadedAt: doc.uploadedAt || new Date().toISOString().split('T')[0]
        };
      }
    }
    return doc;
  });

  // Ensure all 4 documents exist in the list
  docSyncDefs.forEach(item => {
    const url = updatedFormData[item.key];
    const exists = updatedDocuments.some(doc => 
      doc.id === item.docId || 
      (item.key === 'aadhaarDocUrl' && doc.name.toLowerCase().includes('aadhaar')) ||
      (item.key === 'panDocUrl' && doc.name.toLowerCase().includes('pan')) ||
      (item.key === 'professionalPhotoUrl' && (doc.name.toLowerCase().includes('professional') || doc.id === 'doc-photo-pro')) ||
      (item.key === 'casualPhotoUrl' && (doc.name.toLowerCase().includes('casual') || doc.id === 'doc-photo-casual'))
    );

    if (!exists) {
      updatedDocuments.push({
        id: item.docId,
        name: item.title,
        required: true,
        status: url ? 'Uploaded' : 'Pending',
        fileUrl: url || undefined,
        uploadedAt: url ? new Date().toISOString().split('T')[0] : undefined
      });
    }
  });

  // Calculate completion percentage based on filled fields
  const fieldsToCheck: (keyof CandidateFormData)[] = [
    'email', 'fullName', 'phone', 'dob', 'currentAddress', 'permanentAddress',
    'tshirtSize', 'maritalStatus', 'passion', 'hobbiesCommunity',
    'emergencyContactName', 'emergencyContactRelation', 'emergencyContactPhone',
    'highestQualification', 'collegeUniversity', 'yearOfPassing',
    'aadhaarNumber', 'panNumber', 'pfOptIn', 'isJoiningDateComfortable', 'declarationAccepted'
  ];

  const filledCount = fieldsToCheck.filter(f => Boolean(updatedFormData[f])).length;
  const percentage = Math.min(100, Math.round((filledCount / fieldsToCheck.length) * 100));
  updatedFormData.completionPercentage = percentage;

  let formStatus = candidate.formStatus;
  let status = candidate.status;

  if (isFinalSubmit || percentage === 100) {
    formStatus = 'Submitted';
    if (status === 'Form Pending' || status === 'Offer Accepted') {
      status = 'Under Review';
    }
  } else if (percentage > 0) {
    formStatus = 'In Progress';
  }

  // Update milestone if form is submitted
  const updatedMilestones = candidate.milestones.map(m => {
    if (m.id === 'm-2') {
      return {
        ...m,
        status: (isFinalSubmit || percentage === 100) ? ('Completed' as const) : ('In Progress' as const),
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      };
    }
    return m;
  });

  const updatedCandidate: Candidate = {
    ...candidate,
    formStatus,
    status,
    formData: updatedFormData,
    documents: updatedDocuments,
    milestones: updatedMilestones,
    avatarUrl: updatedFormData.professionalPhotoUrl || candidate.avatarUrl,
    photoDocUrl: updatedFormData.professionalPhotoUrl || candidate.photoDocUrl
  };

  // Save to local storage and remote firestore, skipping redundant background sync so upload flow controls sync sequencing
  saveCandidate(updatedCandidate, true);

  return updatedCandidate;
};

export const updateDocumentStatus = (
  candidateId: string,
  docId: string,
  newStatus: RequiredDocument['status'],
  fileUrl?: string,
  fileName?: string
): Candidate => {
  const candidate = getCandidateById(candidateId);
  if (!candidate) throw new Error('Candidate not found');

  const updatedFormData: CandidateFormData = { ...candidate.formData };

  const lowerDocId = docId.toLowerCase();

  if (fileUrl !== undefined) {
    if (fileUrl === '') {
      // Clearing document
      if (lowerDocId.includes('aadhaar') || lowerDocId === 'doc-aadhaar') {
        updatedFormData.aadhaarDocUrl = '';
        updatedFormData.aadhaarDocName = '';
      } else if (lowerDocId.includes('pan') || lowerDocId === 'doc-pan') {
        updatedFormData.panDocUrl = '';
        updatedFormData.panDocName = '';
      } else if (lowerDocId.includes('pro') || lowerDocId === 'doc-photo-pro' || lowerDocId.includes('professional')) {
        updatedFormData.professionalPhotoUrl = '';
        updatedFormData.professionalPhotoName = '';
      } else if (lowerDocId.includes('casual') || lowerDocId === 'doc-photo-casual') {
        updatedFormData.casualPhotoUrl = '';
        updatedFormData.casualPhotoName = '';
      }
    } else {
      if (lowerDocId.includes('aadhaar') || lowerDocId === 'doc-aadhaar') {
        updatedFormData.aadhaarDocUrl = fileUrl;
        if (fileName) updatedFormData.aadhaarDocName = fileName;
      } else if (lowerDocId.includes('pan') || lowerDocId === 'doc-pan') {
        updatedFormData.panDocUrl = fileUrl;
        if (fileName) updatedFormData.panDocName = fileName;
      } else if (lowerDocId.includes('pro') || lowerDocId === 'doc-photo-pro' || lowerDocId.includes('professional')) {
        updatedFormData.professionalPhotoUrl = fileUrl;
        if (fileName) updatedFormData.professionalPhotoName = fileName;
      } else if (lowerDocId.includes('casual') || lowerDocId === 'doc-photo-casual') {
        updatedFormData.casualPhotoUrl = fileUrl;
        if (fileName) updatedFormData.casualPhotoName = fileName;
      }
    }
  }

  let docMatched = false;
  const updatedDocuments = candidate.documents.map(doc => {
    const isMatch = doc.id === docId || 
      (lowerDocId.includes('aadhaar') && (doc.id === 'doc-aadhaar' || doc.name.toLowerCase().includes('aadhaar'))) ||
      (lowerDocId.includes('pan') && (doc.id === 'doc-pan' || doc.name.toLowerCase().includes('pan'))) ||
      ((lowerDocId.includes('pro') || lowerDocId.includes('professional')) && (doc.id === 'doc-photo-pro' || doc.name.toLowerCase().includes('professional'))) ||
      (lowerDocId.includes('casual') && (doc.id === 'doc-photo-casual' || doc.name.toLowerCase().includes('casual')));

    if (isMatch) {
      docMatched = true;
      return {
        ...doc,
        status: newStatus,
        fileUrl: fileUrl !== undefined ? (fileUrl === '' ? undefined : fileUrl) : doc.fileUrl,
        uploadedAt: newStatus === 'Uploaded' || newStatus === 'Verified' ? new Date().toISOString().split('T')[0] : (fileUrl === '' ? undefined : doc.uploadedAt)
      };
    }
    return doc;
  });

  if (!docMatched && fileUrl) {
    let docTitle = 'Uploaded Document';
    if (lowerDocId.includes('aadhaar')) docTitle = 'Aadhaar Card Upload';
    else if (lowerDocId.includes('pan')) docTitle = 'PAN Card Upload';
    else if (lowerDocId.includes('pro') || lowerDocId.includes('professional')) docTitle = 'Clear Professional Photo Upload';
    else if (lowerDocId.includes('casual')) docTitle = 'Clear Casual Photo Upload';

    updatedDocuments.push({
      id: docId,
      name: docTitle,
      required: true,
      status: newStatus,
      fileUrl,
      uploadedAt: new Date().toISOString().split('T')[0]
    });
  }

  const updatedCandidate: Candidate = {
    ...candidate,
    formData: updatedFormData,
    documents: updatedDocuments,
    avatarUrl: updatedFormData.professionalPhotoUrl || candidate.avatarUrl,
    photoDocUrl: updatedFormData.professionalPhotoUrl || candidate.photoDocUrl
  };

  // Save candidate skipping redundant background sync
  saveCandidate(updatedCandidate, true);

  return updatedCandidate;
};

export const addCandidate = (newCandidateData: Omit<Candidate, 'id' | 'formData' | 'documents' | 'milestones' | 'schedule'>): Candidate => {
  const id = `cand-${Date.now()}`;
  const accessCode = newCandidateData.accessCode || `FA-${Math.floor(1000 + Math.random() * 9000)}`;
  const locations = getLocations();
  
  const isRemote = newCandidateData.workMode === 'Remote';
  const workMode = isRemote ? 'Remote' : 'Office';

  let loc = !isRemote ? locations.find(l => l.id === newCandidateData.locationId) : undefined;
  if (!isRemote && !loc && newCandidateData.officeCity) {
    loc = locations.find(l => l.city.toLowerCase() === newCandidateData.officeCity.toLowerCase());
  }

  const isIntl = isRemote ? (newCandidateData.remoteCountry ? newCandidateData.remoteCountry !== 'India' : false) : (loc?.country !== 'India');

  const defaultDocs: RequiredDocument[] = [
    { id: 'doc-aadhaar', name: 'Aadhaar Card Upload', required: true, status: 'Pending' },
    { id: 'doc-pan', name: 'PAN Card Upload', required: true, status: 'Pending' },
    { id: 'doc-photo-pro', name: 'Clear Professional Photo Upload', required: true, status: 'Pending' },
    { id: 'doc-photo-casual', name: 'Clear Casual Photo Upload', required: true, status: 'Pending' }
  ];

  const city = isRemote ? (newCandidateData.remoteCity || newCandidateData.officeCity || 'Remote') : (loc?.city || newCandidateData.officeCity || 'Gurugram');
  const country = isRemote ? (newCandidateData.remoteCountry || newCandidateData.officeCountry || 'Global') : (loc?.country || newCandidateData.officeCountry || 'India');
  const timeZone = isRemote ? (newCandidateData.remoteTimeZone || newCandidateData.timeZone || 'IST (UTC+5:30)') : (loc?.timeZone || newCandidateData.timeZone || 'IST (UTC+5:30)');
  const instructions = isRemote ? (newCandidateData.remoteInstructions || newCandidateData.firstDayInstructions || 'On Day 1, join the Google Meet welcome session sent by your HR Partner.') : (loc?.firstDayInstructions || newCandidateData.firstDayInstructions);

  const fullCandidate: Candidate = {
    ...newCandidateData,
    id,
    accessCode,
    workMode,
    locationId: isRemote ? undefined : (loc?.id || newCandidateData.locationId),
    officeCity: city,
    officeCountry: country,
    officeAddress: isRemote ? `Remote / Work From Home (${city}, ${country})` : (loc?.officeAddress || newCandidateData.officeAddress),
    reportingTime: isRemote ? (newCandidateData.reportingTime || '10:30 AM') : (loc?.reportingTime || newCandidateData.reportingTime || '10:30 AM'),
    timeZone: timeZone,
    googleMapsUrl: isRemote ? undefined : (loc?.googleMapsUrl || newCandidateData.googleMapsUrl),
    dressCode: isRemote ? 'Smart Casuals' : (loc?.dressCode || newCandidateData.dressCode || 'Smart Casuals'),
    lunchInfo: isRemote ? 'Remote food delivery allowance provided for Day 1' : (loc?.lunchInfo || newCandidateData.lunchInfo || 'In-house cafeteria with complimentary lunch'),
    firstDayInstructions: instructions,
    remoteCountry: isRemote ? country : undefined,
    remoteCity: isRemote ? city : undefined,
    remoteTimeZone: isRemote ? timeZone : undefined,
    remoteInstructions: isRemote ? instructions : undefined,
    hrbp: newCandidateData.hrbp || getHRBPForDepartment(newCandidateData.department),
    formStatus: 'Not Started',
    formData: {
      fullName: newCandidateData.name,
      email: newCandidateData.email,
      personalEmail: newCandidateData.email,
      phone: newCandidateData.phone,
      dob: '',
      emergencyContactName: '',
      emergencyContactRelation: '',
      emergencyContactPhone: '',
      currentAddress: '',
      permanentAddress: '',
      highestQualification: '',
      previousCompany: '',
      totalExperienceYears: 0,
      panNumber: '',
      aadhaarNumber: '',
      tshirtSize: 'M',
      isSubmitted: false,
      completionPercentage: 0
    },
    documents: defaultDocs,
    milestones: [
      { id: 'm-1', title: 'Offer Letter Signed & Accepted', description: 'Offer accepted', status: 'Completed', date: new Date().toISOString().split('T')[0] },
      { id: 'm-2', title: 'Pre-Onboarding Form Completed', description: 'Pending form details', status: 'Pending' },
      { id: 'm-3', title: isRemote ? 'Remote BGV & Identity Verification' : 'Background Verification (BGV)', description: 'Document verification', status: 'Pending' },
      { id: 'm-4', title: isRemote ? 'IT Asset & Laptop Shipping' : 'IT Asset Allocation', description: isRemote ? 'Courier dispatch' : 'Workstation provisioning', status: 'Pending' },
      { id: 'm-5', title: 'Welcome Kit & Swag Box', description: 'Kit shipping', status: 'Pending' },
      { id: 'm-6', title: isRemote ? 'Day 1 Virtual Orientation' : 'Day 1 Orientation', description: isRemote ? 'Google Meet Welcome Room' : `Reporting at ${city}`, status: 'Pending', date: newCandidateData.joiningDate }
    ],
    schedule: loc?.defaultSchedule || DEFAULT_FIELDASSIST_SCHEDULE
  };

  const { candidate: withAutomation } = ensureEmailAutomationState(fullCandidate);
  saveCandidate(withAutomation);
  return withAutomation;
};

export interface CandidateCoreDetailsUpdate {
  name: string;
  email: string;
  phone: string;
  joiningDate: string;
  workMode: 'Office' | 'Remote';
  role: string;
  department: string;
  reportingManager?: string;
  reportingManagerRole?: string;
  hrbp?: Candidate['hrbp'];
  locationId?: string;
  officeCity?: string;
  officeCountry?: string;
  officeAddress?: string;
  reportingTime?: string;
  timeZone?: string;
  remoteCountry?: string;
  remoteCity?: string;
  remoteTimeZone?: string;
  remoteInstructions?: string;
  googleMapsUrl?: string;
  dressCode?: Candidate['dressCode'];
  lunchInfo?: string;
  firstDayInstructions?: string;
  notes?: string;
  status?: Candidate['status'];
}

export const updateCandidateCoreDetails = (
  candidateId: string,
  updates: CandidateCoreDetailsUpdate
): Candidate => {
  const candidate = getCandidateById(candidateId);
  if (!candidate) throw new Error(`Candidate with ID ${candidateId} not found`);

  const locations = getLocations();
  const isRemote = updates.workMode === 'Remote';
  const workMode = isRemote ? 'Remote' : 'Office';

  let loc = !isRemote ? locations.find(l => l.id === updates.locationId) : undefined;
  if (!isRemote && !loc && updates.officeCity) {
    loc = locations.find(l => l.city.toLowerCase() === updates.officeCity?.toLowerCase());
  }

  const city = isRemote ? (updates.remoteCity || updates.officeCity || 'Remote') : (loc?.city || updates.officeCity || 'Gurugram');
  const country = isRemote ? (updates.remoteCountry || updates.officeCountry || 'Global') : (loc?.country || updates.officeCountry || 'India');
  const timeZone = isRemote ? (updates.remoteTimeZone || updates.timeZone || 'IST (UTC+5:30)') : (loc?.timeZone || updates.timeZone || 'IST (UTC+5:30)');
  const instructions = isRemote ? (updates.remoteInstructions || updates.firstDayInstructions || 'On Day 1, join the Google Meet welcome session sent by your HR Partner.') : (loc?.firstDayInstructions || updates.firstDayInstructions);

  const assignedHrbp = updates.hrbp || getHRBPForDepartment(updates.department);

  // Update Day 1 milestone date and location description if joining date / work mode updated
  const updatedMilestones = candidate.milestones.map(m => {
    if (m.id === 'm-6') {
      return {
        ...m,
        date: updates.joiningDate,
        description: isRemote ? 'Google Meet Welcome Room' : `Reporting at ${city}`
      };
    }
    return m;
  });

  const updatedCandidate: Candidate = {
    ...candidate,
    name: updates.name.trim(),
    email: updates.email.trim(),
    phone: updates.phone.trim(),
    role: updates.role.trim(),
    department: updates.department,
    joiningDate: updates.joiningDate,
    workMode,
    locationId: isRemote ? undefined : (loc?.id || updates.locationId),
    officeCity: city,
    officeCountry: country,
    officeAddress: isRemote ? `Remote / Work From Home (${city}, ${country})` : (loc?.officeAddress || updates.officeAddress || candidate.officeAddress),
    reportingTime: updates.reportingTime || loc?.reportingTime || candidate.reportingTime || '10:30 AM',
    timeZone: timeZone,
    googleMapsUrl: isRemote ? undefined : (loc?.googleMapsUrl || updates.googleMapsUrl || candidate.googleMapsUrl),
    dressCode: isRemote ? 'Smart Casuals' : (updates.dressCode || loc?.dressCode || candidate.dressCode || 'Smart Casuals'),
    lunchInfo: isRemote ? 'Remote food delivery allowance provided for Day 1' : (updates.lunchInfo || loc?.lunchInfo || candidate.lunchInfo || 'In-house cafeteria with complimentary lunch'),
    firstDayInstructions: instructions,
    remoteCountry: isRemote ? country : undefined,
    remoteCity: isRemote ? city : undefined,
    remoteTimeZone: isRemote ? timeZone : undefined,
    remoteInstructions: isRemote ? instructions : undefined,
    reportingManager: updates.reportingManager || candidate.reportingManager || 'Department Manager',
    reportingManagerRole: updates.reportingManagerRole || candidate.reportingManagerRole || 'Reporting Lead',
    hrbp: assignedHrbp,
    status: updates.status || candidate.status,
    notes: updates.notes !== undefined ? updates.notes : candidate.notes,
    formData: {
      ...candidate.formData,
      fullName: (!candidate.formData.fullName || candidate.formData.fullName === candidate.name) ? updates.name.trim() : candidate.formData.fullName,
      email: (!candidate.formData.email || candidate.formData.email === candidate.email) ? updates.email.trim() : candidate.formData.email,
      phone: (!candidate.formData.phone || candidate.formData.phone === candidate.phone) ? updates.phone.trim() : candidate.formData.phone
    },
    milestones: updatedMilestones
  };

  // Recalculate email automation stages (welcome_7d, culture_5d, comm_3d, day1_1d) based on new joining date
  const { candidate: withAutomation } = ensureEmailAutomationState(updatedCandidate);

  // Save to localStorage, update Firestore, and background sync to Google Sheets
  saveCandidate(withAutomation);

  // Sync candidate list with backend email server
  if (typeof fetch !== 'undefined') {
    fetch('/api/emails/sync-candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidates: getCandidates() })
    }).catch(() => {});
  }

  return withAutomation;
};

export const updateCandidateSchedule = (
  candidateId: string,
  newSchedule: FirstDayScheduleItem[]
): Candidate => {
  const candidate = getCandidateById(candidateId);
  if (!candidate) throw new Error('Candidate not found');

  const updatedCandidate: Candidate = {
    ...candidate,
    schedule: newSchedule
  };

  saveCandidate(updatedCandidate);
  return updatedCandidate;
};

export const getFAQs = (): FAQItem[] => {
  initializeStorage();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.FAQS);
    return data ? JSON.parse(data) : INITIAL_FAQS;
  } catch {
    return INITIAL_FAQS;
  }
};

export const submitHRQuery = (query: Omit<HRQuery, 'id' | 'createdAt' | 'status'>): HRQuery => {
  initializeStorage();
  const queriesData = localStorage.getItem(STORAGE_KEYS.QUERIES);
  const queries: HRQuery[] = queriesData ? JSON.parse(queriesData) : [];
  
  const newQuery: HRQuery = {
    ...query,
    recipientName: 'Twinkle Verma',
    recipientEmail: 'twinkle.verma@flick2know.com',
    id: `query-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'Open'
  };

  queries.unshift(newQuery);
  localStorage.setItem(STORAGE_KEYS.QUERIES, JSON.stringify(queries));
  return newQuery;
};

export const getHRQueries = (): HRQuery[] => {
  initializeStorage();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.QUERIES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};
