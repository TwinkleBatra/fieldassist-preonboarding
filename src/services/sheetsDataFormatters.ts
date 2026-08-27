import { Candidate, CandidateFormData, RequiredDocument } from '../types';

export const SHEET_NAMES = {
  CANDIDATE_MASTER: 'Candidate Master',
  DETAILS_DOCUMENTS: 'Details & Documents',
  PERSONAL_INTERESTS: 'Personal & Interests',
} as const;

export const EXACT_HEADERS = {
  [SHEET_NAMES.CANDIDATE_MASTER]: [
    'Timestamp',
    'Email Address',
    'Candidate ID',
    'Full Name',
    'Contact Number',
    'Date of Joining',
    'Role / Designation',
    'Department',
    'Reporting Manager',
    'HRBP / SPOC Name',
    'HRBP Email',
    'HRBP Phone',
    'Form Status',
    'Form Completion %',
    'Candidate Status',
    'Total Years of Experience',
    'Last Employer & Designation',
    'Current Company',
    'Remarks',
  ],
  [SHEET_NAMES.DETAILS_DOCUMENTS]: [
    'Candidate ID',
    'Full Name',
    'Email Address',
    'Emergency Contact Number',
    'Date of Birth',
    'Marital Status',
    'Spouse + Child 1 + Child 2 DOB and Name (If applicable)',
    'Current Address (including Pincode)',
    'Permanent Address (including Pincode)',
    'Want to Opt for PF',
    'UAN',
    'Aadhar Card No',
    'Aadhar Card',
    'Pan Card No',
    'Pan Card',
    'Clear, Professional Photo',
    'Clear Casual Photo',
    'Document Status',
    'Verified By HRBP',
    'HR Remarks',
  ],
  [SHEET_NAMES.PERSONAL_INTERESTS]: [
    'Candidate ID',
    'Full Name',
    'Email Address',
    'Tshirt Size',
    "What's one thing you're passionate about and could talk about for hours? (e.g., cafes, books, travel, fitness, movies, photography etc.)",
    "What's one hobby or community activity you'd love to make time for? (e.g., social service, theatre, volunteering, music, dance or sports)",
    'Share your LinkedIn Profile URL/ID',
  ],
};

function getDocUrl(docs?: RequiredDocument[], ...terms: string[]): string {
  if (!docs || !docs.length) return '';
  for (const d of docs) {
    const nameLower = (d.name || '').toLowerCase();
    const idLower = (d.id || '').toLowerCase();
    if (terms.some((t) => nameLower.includes(t.toLowerCase()) || idLower.includes(t.toLowerCase()))) {
      return d.fileUrl || (d.status === 'Uploaded' || d.status === 'Verified' ? 'Uploaded' : '');
    }
  }
  return '';
}

// 1. Candidate Master Formatter (22 columns)
export function formatCandidateMasterRow(c: Candidate): string[] {
  const fd = c.formData || ({} as Partial<CandidateFormData>);
  const displayId = c.accessCode || c.id || '';
  const fullName = c.name || fd.fullName || fd.fullNameAadhaar || '';
  const email = c.email || fd.personalEmail || fd.email || '';
  const phone = c.phone || fd.phone || '';
  const doj = c.joiningDate || fd.joiningDate || '';
  const role = c.role || '';
  const dept = c.department || '';
  const reportingManager = c.reportingManager || '';

  const hrbpName = typeof c.hrbp === 'string' ? c.hrbp : c.hrbp?.name || '';
  const hrbpEmail = typeof c.hrbp === 'object' && c.hrbp?.email ? c.hrbp.email : '';
  const hrbpPhone = typeof c.hrbp === 'object' && c.hrbp?.phone ? c.hrbp.phone : '';

  const formStatus =
    c.formStatus ||
    (fd.isSubmitted ? 'Submitted' : fd.completionPercentage ? 'In Progress' : 'Not Started');
  const completionPct = `${
    fd.completionPercentage ??
    (c.formStatus === 'Submitted' || c.formStatus === 'Verified'
      ? 100
      : c.formStatus === 'In Progress'
      ? 50
      : 0)
  }%`;
  const candidateStatus = c.status || 'Offer Accepted';

  const totalExp =
    fd.totalWorkExperience ||
    (fd.totalExperienceYears !== undefined ? `${fd.totalExperienceYears} Years` : '') ||
    c.totalExperience ||
    '';

  const lastEmployer =
    fd.previousCompany || c.lastEmployer || c.currentCompany || '';
  const lastDesignation =
    fd.previousDesignation || c.lastDesignation || '';
  const lastEmpAndDesig = lastEmployer
    ? `${lastEmployer}${lastDesignation ? ' - ' + lastDesignation : ''}`
    : '';

  const currentCompany = fd.previousCompany || c.currentCompany || c.lastEmployer || '';
  const remarks = c.notes || fd.hrRemarks || c.hrRemarks || '';
  const timestamp = fd.submittedAt || new Date().toISOString();

  return [
    timestamp,
    email,
    displayId,
    fullName,
    phone,
    doj,
    role,
    dept,
    reportingManager,
    hrbpName,
    hrbpEmail,
    hrbpPhone,
    formStatus,
    completionPct,
    candidateStatus,
    totalExp,
    lastEmpAndDesig,
    currentCompany,
    remarks,
  ];
}

export function buildSpouseKidsString(fd?: Partial<CandidateFormData>): string {
  if (!fd) return '';
  const parts: string[] = [];

  // 1. Spouse Details (if Married and spouse name provided)
  const isMarried = fd.maritalStatus === 'Married';
  if (isMarried && fd.spouseName && fd.spouseName.trim()) {
    const dobPart = fd.spouseDob && fd.spouseDob.trim() ? ` (DOB: ${fd.spouseDob.trim()})` : '';
    parts.push(`Spouse: ${fd.spouseName.trim()}${dobPart}`);
  }

  // 2. Children Details (if hasChildren toggle is enabled)
  const hasKids = fd.hasChildren === true || fd.hasChildren === 'Yes';
  if (hasKids) {
    if (fd.child1Name && fd.child1Name.trim()) {
      const dobPart = fd.child1Dob && fd.child1Dob.trim() ? ` (DOB: ${fd.child1Dob.trim()})` : '';
      parts.push(`Child 1: ${fd.child1Name.trim()}${dobPart}`);
    }
    if (fd.child2Name && fd.child2Name.trim()) {
      const dobPart = fd.child2Dob && fd.child2Dob.trim() ? ` (DOB: ${fd.child2Dob.trim()})` : '';
      parts.push(`Child 2: ${fd.child2Name.trim()}${dobPart}`);
    }
  }

  // 3. Fallback to existing composite childDetails if structured fields were not populated
  if (parts.length === 0 && fd.childDetails && fd.childDetails.trim()) {
    return fd.childDetails.trim();
  }

  return parts.join(', ');
}

// 2. Details & Documents Formatter (20 columns)
export function formatDetailsAndDocumentsRow(c: Candidate): string[] {
  const fd = c.formData || ({} as Partial<CandidateFormData>);
  const displayId = c.accessCode || c.id || '';
  const fullName = c.name || fd.fullName || fd.fullNameAadhaar || '';
  const email = c.email || fd.personalEmail || fd.email || '';

  const emergencyPhone = fd.emergencyContactPhone || '';
  const emergencyName = fd.emergencyContactName || '';
  const emergencyRel = fd.emergencyContactRelation || '';
  const emergencyContactStr = emergencyPhone
    ? `${emergencyPhone}${emergencyName ? ' (' + emergencyName + (emergencyRel ? ' - ' + emergencyRel : '') + ')' : ''}`
    : emergencyName
    ? `${emergencyName} (${emergencyRel || 'Contact'})`
    : '';

  const dob = fd.dob || '';
  const maritalStatus = fd.maritalStatus || 'Single';

  let spouseKids = buildSpouseKidsString(fd);
  if (!spouseKids && maritalStatus === 'Married' && emergencyRel.toLowerCase().includes('spouse')) {
    spouseKids = `Spouse: ${emergencyName}`;
  }

  const currentAddress = fd.currentAddress || '';
  const permanentAddress = fd.permanentAddress || '';
  const optPf = fd.pfOptIn || 'Yes';
  const uan = fd.uanNumber || '';

  const aadhaarNo = fd.aadhaarNumber || '';
  const aadhaarDoc =
    fd.aadhaarDocUrl ||
    c.aadhaarDocUrl ||
    getDocUrl(c.documents, 'aadhaar') ||
    (fd.aadhaarNumber ? 'Uploaded' : '');

  const panNo = fd.panNumber || '';
  const panDoc =
    fd.panDocUrl ||
    c.panDocUrl ||
    getDocUrl(c.documents, 'pan') ||
    (fd.panNumber ? 'Uploaded' : '');

  const proPhoto =
    fd.professionalPhotoUrl ||
    c.photoDocUrl ||
    getDocUrl(c.documents, 'professional', 'pro photo') ||
    '';
  const casualPhoto =
    fd.casualPhotoUrl ||
    getDocUrl(c.documents, 'casual', 'casual photo') ||
    '';

  const hasCoreDocs = Boolean(aadhaarDoc && panDoc && (proPhoto || casualPhoto));
  const docStatus = hasCoreDocs
    ? 'All Uploaded'
    : (aadhaarDoc || panDoc || proPhoto || casualPhoto)
    ? 'Uploaded'
    : 'Pending';

  const verifiedBy =
    c.verifiedByHrbp ||
    fd.verifiedByHrbp ||
    (c.status === 'Ready for Day 1' || c.status === 'Joined'
      ? typeof c.hrbp === 'string'
        ? c.hrbp
        : c.hrbp?.name || 'HRBP'
      : 'Pending Verification');

  const hrRemarks = c.hrRemarks || fd.hrRemarks || c.notes || '';

  return [
    displayId,
    fullName,
    email,
    emergencyContactStr,
    dob,
    maritalStatus,
    spouseKids,
    currentAddress,
    permanentAddress,
    optPf,
    uan,
    aadhaarNo,
    aadhaarDoc,
    panNo,
    panDoc,
    proPhoto,
    casualPhoto,
    docStatus,
    verifiedBy,
    hrRemarks,
  ];
}

// 3. Personal & Interests Formatter (7 columns)
export function formatPersonalAndInterestsRow(c: Candidate): string[] {
  const fd = c.formData || ({} as Partial<CandidateFormData>);
  const displayId = c.accessCode || c.id || '';
  const fullName = c.name || fd.fullName || fd.fullNameAadhaar || '';
  const email = c.email || fd.personalEmail || fd.email || '';
  const tshirtSize = fd.tshirtSize || 'L';

  const passion = fd.passion || '';
  const hobbies = fd.hobbiesCommunity || '';
  const linkedin = fd.linkedinUrl || '';

  return [
    displayId,
    fullName,
    email,
    tshirtSize,
    passion,
    hobbies,
    linkedin,
  ];
}

// 1b. Candidate Master Field Map (19 columns)
export function formatCandidateMasterMap(c: Candidate): Record<string, any> {
  const fd = c.formData || ({} as Partial<CandidateFormData>);
  const displayId = c.accessCode || c.id || '';
  const fullName = c.name || fd.fullName || fd.fullNameAadhaar || '';
  const email = c.email || fd.personalEmail || fd.email || '';
  const phone = c.phone || fd.phone || '';
  const doj = c.joiningDate || fd.joiningDate || '';
  const role = c.role || '';
  const dept = c.department || '';
  const reportingManager = c.reportingManager || '';

  const hrbpName = typeof c.hrbp === 'string' ? c.hrbp : c.hrbp?.name || '';
  const hrbpEmail = typeof c.hrbp === 'object' && c.hrbp?.email ? c.hrbp.email : '';
  const hrbpPhone = typeof c.hrbp === 'object' && c.hrbp?.phone ? c.hrbp.phone : '';

  const formStatus =
    c.formStatus ||
    (fd.isSubmitted ? 'Submitted' : fd.completionPercentage ? 'In Progress' : 'Not Started');
  const completionPct = `${
    fd.completionPercentage ??
    (c.formStatus === 'Submitted' || c.formStatus === 'Verified'
      ? 100
      : c.formStatus === 'In Progress'
      ? 50
      : 0)
  }%`;
  const candidateStatus = c.status || 'Offer Accepted';

  const totalExp =
    fd.totalWorkExperience ||
    (fd.totalExperienceYears !== undefined ? `${fd.totalExperienceYears} Years` : '') ||
    c.totalExperience ||
    '';

  const lastEmployer =
    fd.previousCompany || c.lastEmployer || c.currentCompany || '';
  const lastDesignation =
    fd.previousDesignation || c.lastDesignation || '';
  const lastEmpAndDesig = lastEmployer
    ? `${lastEmployer}${lastDesignation ? ' - ' + lastDesignation : ''}`
    : '';

  const currentCompany = fd.previousCompany || c.currentCompany || c.lastEmployer || '';
  const remarks = c.notes || fd.hrRemarks || c.hrRemarks || '';
  const timestamp = fd.submittedAt || new Date().toISOString();

  return {
    'Timestamp': timestamp,
    'Email Address': email,
    'Candidate ID': displayId,
    'Full Name': fullName,
    'Contact Number': phone,
    'Date of Joining': doj,
    'Role / Designation': role,
    'Department': dept,
    'Reporting Manager': reportingManager,
    'HRBP / SPOC Name': hrbpName,
    'HRBP Email': hrbpEmail,
    'HRBP Phone': hrbpPhone,
    'Form Status': formStatus,
    'Form Completion %': completionPct,
    'Candidate Status': candidateStatus,
    'Total Years of Experience': totalExp,
    'Last Employer & Designation': lastEmpAndDesig,
    'Current Company': currentCompany,
    'Remarks': remarks,
  };
}

// 2b. Details & Documents Field Map (20 columns)
export function formatDetailsAndDocumentsMap(c: Candidate): Record<string, any> {
  const fd = c.formData || ({} as Partial<CandidateFormData>);
  const displayId = c.accessCode || c.id || '';
  const fullName = c.name || fd.fullName || fd.fullNameAadhaar || '';
  const email = c.email || fd.personalEmail || fd.email || '';

  const emergencyPhone = fd.emergencyContactPhone || '';
  const emergencyName = fd.emergencyContactName || '';
  const emergencyRel = fd.emergencyContactRelation || '';
  const emergencyContactStr = emergencyPhone
    ? `${emergencyPhone}${emergencyName ? ' (' + emergencyName + (emergencyRel ? ' - ' + emergencyRel : '') + ')' : ''}`
    : emergencyName
    ? `${emergencyName} (${emergencyRel || 'Contact'})`
    : '';

  const dob = fd.dob || '';
  const maritalStatus = fd.maritalStatus || 'Single';

  let spouseKids = fd.childDetails || '';
  if (!spouseKids && maritalStatus === 'Married' && emergencyRel.toLowerCase().includes('spouse')) {
    spouseKids = `Spouse: ${emergencyName}`;
  }

  const currentAddress = fd.currentAddress || '';
  const permanentAddress = fd.permanentAddress || '';
  const optPf = fd.pfOptIn || 'Yes';
  const uan = fd.uanNumber || '';

  const aadhaarNo = fd.aadhaarNumber || '';
  const aadhaarDoc =
    fd.aadhaarDocUrl ||
    c.aadhaarDocUrl ||
    getDocUrl(c.documents, 'aadhaar') ||
    (fd.aadhaarNumber ? 'Uploaded' : '');

  const panNo = fd.panNumber || '';
  const panDoc =
    fd.panDocUrl ||
    c.panDocUrl ||
    getDocUrl(c.documents, 'pan') ||
    (fd.panNumber ? 'Uploaded' : '');

  const proPhoto =
    fd.professionalPhotoUrl ||
    c.photoDocUrl ||
    getDocUrl(c.documents, 'professional', 'pro photo') ||
    '';
  const casualPhoto =
    fd.casualPhotoUrl ||
    getDocUrl(c.documents, 'casual', 'casual photo') ||
    '';

  const hasCoreDocs = Boolean(aadhaarDoc && panDoc && (proPhoto || casualPhoto));
  const docStatus = hasCoreDocs
    ? 'All Uploaded'
    : (aadhaarDoc || panDoc || proPhoto || casualPhoto)
    ? 'Uploaded'
    : 'Pending';

  const verifiedBy =
    c.verifiedByHrbp ||
    fd.verifiedByHrbp ||
    (c.status === 'Ready for Day 1' || c.status === 'Joined'
      ? typeof c.hrbp === 'string'
        ? c.hrbp
        : c.hrbp?.name || 'HRBP'
      : 'Pending Verification');

  const hrRemarks = c.hrRemarks || fd.hrRemarks || c.notes || '';

  return {
    'Candidate ID': displayId,
    'Full Name': fullName,
    'Email Address': email,
    'Emergency Contact Number': emergencyContactStr,
    'Date of Birth': dob,
    'Marital Status': maritalStatus,
    'Spouse + Child 1 + Child 2 DOB and Name (If applicable)': spouseKids,
    'Current Address (including Pincode)': currentAddress,
    'Permanent Address (including Pincode)': permanentAddress,
    'Want to Opt for PF': optPf,
    'UAN': uan,
    'Aadhar Card No': aadhaarNo,
    'Aadhar Card': aadhaarDoc,
    'Pan Card No': panNo,
    'Pan Card': panDoc,
    'Clear, Professional Photo': proPhoto,
    'Clear Casual Photo': casualPhoto,
    'Document Status': docStatus,
    'Verified By HRBP': verifiedBy,
    'HR Remarks': hrRemarks,
  };
}

// 3b. Personal & Interests Field Map (7 columns)
export function formatPersonalAndInterestsMap(c: Candidate): Record<string, any> {
  const fd = c.formData || ({} as Partial<CandidateFormData>);
  const displayId = c.accessCode || c.id || '';
  const fullName = c.name || fd.fullName || fd.fullNameAadhaar || '';
  const email = c.email || fd.personalEmail || fd.email || '';
  const tshirtSize = fd.tshirtSize || 'L';

  const passion = fd.passion || '';
  const hobbies = fd.hobbiesCommunity || '';
  const linkedin = fd.linkedinUrl || '';

  return {
    'Candidate ID': displayId,
    'Full Name': fullName,
    'Email Address': email,
    'Tshirt Size': tshirtSize,
    "What's one thing you're passionate about and could talk about for hours? (e.g., cafes, books, travel, fitness, movies, photography etc.)": passion,
    "What's one hobby or community activity you'd love to make time for? (e.g., social service, theatre, volunteering, music, dance or sports)": hobbies,
    'Share your LinkedIn Profile URL/ID': linkedin,
  };
}

// Build ONE complete, fully mapped candidate payload for all 3 sheets
export function buildCompleteCandidatePayload(c: Candidate): {
  action: string;
  candidateId: string;
  email: string;
  name: string;
  candidate: Candidate;
  counts: {
    candidateMaster: number;
    detailsDocuments: number;
    personalInterests: number;
  };
  candidateMasterData: Record<string, any>;
  detailsDocsData: Record<string, any>;
  personalInterestsData: Record<string, any>;
  sheetsData: {
    candidateMaster: Record<string, any>;
    detailsDocuments: Record<string, any>;
    personalInterests: Record<string, any>;
  };
  rows: {
    candidateMaster: string[];
    detailsDocuments: string[];
    personalInterests: string[];
  };
} {
  const fd = c.formData || ({} as Partial<CandidateFormData>);
  const candidateId = c.accessCode || c.id || '';
  const email = c.email || fd.personalEmail || fd.email || '';
  const name = c.name || fd.fullName || fd.fullNameAadhaar || '';

  const candidateMasterData = formatCandidateMasterMap(c);
  const detailsDocsData = formatDetailsAndDocumentsMap(c);
  const personalInterestsData = formatPersonalAndInterestsMap(c);

  const candidateMasterRow = formatCandidateMasterRow(c);
  const detailsDocumentsRow = formatDetailsAndDocumentsRow(c);
  const personalInterestsRow = formatPersonalAndInterestsRow(c);

  // Fully enriched candidate record with all document URLs and form fields at both root & formData levels
  const enrichedCandidate: Candidate = {
    ...c,
    id: c.id || candidateId,
    accessCode: c.accessCode || candidateId,
    name: name || c.name,
    email: email || c.email,
    phone: c.phone || fd.phone || '',
    joiningDate: c.joiningDate || fd.joiningDate || '',
    role: c.role || '',
    department: c.department || '',
    reportingManager: c.reportingManager || '',
    aadhaarDocUrl: fd.aadhaarDocUrl || c.aadhaarDocUrl || getDocUrl(c.documents, 'aadhaar'),
    panDocUrl: fd.panDocUrl || c.panDocUrl || getDocUrl(c.documents, 'pan'),
    photoDocUrl: fd.professionalPhotoUrl || c.photoDocUrl || getDocUrl(c.documents, 'professional'),
    formData: {
      ...fd,
      fullName: name,
      personalEmail: email,
      email: email,
      phone: c.phone || fd.phone || '',
      aadhaarDocUrl: fd.aadhaarDocUrl || c.aadhaarDocUrl || getDocUrl(c.documents, 'aadhaar'),
      panDocUrl: fd.panDocUrl || c.panDocUrl || getDocUrl(c.documents, 'pan'),
      professionalPhotoUrl: fd.professionalPhotoUrl || c.photoDocUrl || getDocUrl(c.documents, 'professional'),
      casualPhotoUrl: fd.casualPhotoUrl || getDocUrl(c.documents, 'casual'),
    } as CandidateFormData,
  };

  return {
    action: 'syncCandidate',
    candidateId,
    email,
    name,
    candidate: enrichedCandidate,
    counts: {
      candidateMaster: Object.keys(candidateMasterData).length,
      detailsDocuments: Object.keys(detailsDocsData).length,
      personalInterests: Object.keys(personalInterestsData).length,
    },
    candidateMasterData,
    detailsDocsData,
    personalInterestsData,
    sheetsData: {
      candidateMaster: candidateMasterData,
      detailsDocuments: detailsDocsData,
      personalInterests: personalInterestsData,
    },
    rows: {
      candidateMaster: candidateMasterRow,
      detailsDocuments: detailsDocumentsRow,
      personalInterests: personalInterestsRow,
    },
  };
}
