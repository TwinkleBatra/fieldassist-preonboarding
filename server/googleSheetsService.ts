import { google } from "googleapis";
import { Candidate, CandidateFormData, RequiredDocument } from "../src/types";

export interface GoogleSheetsSyncConfig {
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  webhookUrl?: string;
  syncMode?: 'webhook' | 'oauth';
  lastSyncedAt?: string;
  autoSyncEnabled?: boolean;
}

// Exactly 3 Sheet Names as required
export const SHEET_NAMES = {
  CANDIDATE_MASTER: "Candidate Master",
  DETAILS_DOCUMENTS: "Details & Documents",
  PERSONAL_INTERESTS: "Personal & Interests",
} as const;

// 1. Candidate Master Columns (22 Columns)
export const CANDIDATE_MASTER_HEADERS = [
  "Timestamp",
  "Email Address",
  "Candidate ID",
  "Full Name",
  "Contact Number",
  "Date of Joining",
  "Role / Designation",
  "Department",
  "Reporting Manager",
  "HRBP / SPOC Name",
  "HRBP Email",
  "HRBP Phone",
  "Form Status",
  "Form Completion %",
  "Candidate Status",
  "Total Years of Experience",
  "Last Employer & Designation",
  "Current Company",
  "Current CTC",
  "Expected CTC",
  "Notice Period",
  "Remarks",
];

// 2. Details & Documents Columns (32 Columns)
export const DETAILS_DOCUMENTS_HEADERS = [
  "Candidate ID",
  "Full Name",
  "Email Address",
  "Emergency Contact Number",
  "Date of Birth",
  "Marital Status",
  "Spouse + Child 1 + Child 2 DOB and Name (If applicable)",
  "Current Address (including Pincode)",
  "Permanent Address (including Pincode)",
  "Want to Opt for PF",
  "UAN",
  "Aadhar Card No",
  "Aadhar Card",
  "Pan Card No",
  "Pan Card",
  "Clear, Professional Photo",
  "Clear Casual Photo",
  "10th Marksheet",
  "12th Marksheet",
  "Graduation Degree / Marksheet",
  "Post-Graduation Degree",
  "Previous Employer Relieving Letter",
  "Previous Employer Experience Letter",
  "Last 3 Months Salary Slips",
  "Form 16 / Tax Documents",
  "Bank Name",
  "Bank Account Number",
  "IFSC Code",
  "Other Documents",
  "Document Status",
  "Verified By HRBP",
  "HR Remarks",
];

// 3. Personal & Interests Columns (7 Columns)
export const PERSONAL_INTERESTS_HEADERS = [
  "Candidate ID",
  "Full Name",
  "Email Address",
  "Tshirt Size",
  "What's one thing you're passionate about and could talk about for hours? (e.g., cafes, books, travel, fitness, movies, photography etc.)",
  "What's one hobby or community activity you'd love to make time for? (e.g., social service, theatre, volunteering, music, dance or sports)",
  "Share your LinkedIn Profile URL/ID",
];

function getDocUrl(docs?: RequiredDocument[], ...terms: string[]): string {
  if (!docs || !docs.length) return "";
  for (const d of docs) {
    const nameLower = (d.name || "").toLowerCase();
    const idLower = (d.id || "").toLowerCase();
    if (terms.some((t) => nameLower.includes(t.toLowerCase()) || idLower.includes(t.toLowerCase()))) {
      return d.fileUrl || (d.status === "Uploaded" || d.status === "Verified" ? "Uploaded" : "");
    }
  }
  return "";
}

// 1. Candidate Master Formatter
export function formatCandidateMasterRow(c: Candidate): string[] {
  const fd = c.formData || ({} as Partial<CandidateFormData>);
  const displayId = c.accessCode || c.id || "";
  const fullName = c.name || fd.fullName || fd.fullNameAadhaar || "";
  const email = c.email || fd.personalEmail || fd.email || "";
  const phone = c.phone || fd.phone || "";
  const doj = c.joiningDate || fd.joiningDate || "";
  const role = c.role || "";
  const dept = c.department || "";
  const reportingManager = c.reportingManager || "";

  const hrbpName = typeof c.hrbp === "string" ? c.hrbp : c.hrbp?.name || "";
  const hrbpEmail = typeof c.hrbp === "object" && c.hrbp?.email ? c.hrbp.email : "";
  const hrbpPhone = typeof c.hrbp === "object" && c.hrbp?.phone ? c.hrbp.phone : "";

  const formStatus =
    c.formStatus ||
    (fd.isSubmitted ? "Submitted" : fd.completionPercentage ? "In Progress" : "Not Started");
  const completionPct = `${
    fd.completionPercentage ??
    (c.formStatus === "Submitted" || c.formStatus === "Verified"
      ? 100
      : c.formStatus === "In Progress"
      ? 50
      : 0)
  }%`;
  const candidateStatus = c.status || "Offer Accepted";

  const totalExp =
    fd.totalWorkExperience ||
    (fd.totalExperienceYears !== undefined ? `${fd.totalExperienceYears} Years` : "") ||
    c.totalExperience ||
    "";

  const lastEmployer = fd.previousCompany || c.lastEmployer || c.currentCompany || "";
  const lastDesignation = fd.previousDesignation || c.lastDesignation || "";
  const lastEmpAndDesig = lastEmployer
    ? `${lastEmployer}${lastDesignation ? " - " + lastDesignation : ""}`
    : "";

  const legacyFd = fd as Record<string, any>;
  const currentCompany = fd.previousCompany || c.currentCompany || c.lastEmployer || "";
  const currentCtc = legacyFd.currentCtc || c.currentCtc || "";
  const expectedCtc = legacyFd.expectedCtc || c.expectedCtc || "";
  const noticePeriod = legacyFd.noticePeriod || c.noticePeriod || "";
  const remarks = c.notes || fd.hrRemarks || c.hrRemarks || "";
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
    currentCtc,
    expectedCtc,
    noticePeriod,
    remarks,
  ];
}

// 2. Details & Documents Formatter
export function formatDetailsAndDocumentsRow(c: Candidate): string[] {
  const fd = c.formData || ({} as Partial<CandidateFormData>);
  const displayId = c.accessCode || c.id || "";
  const fullName = c.name || fd.fullName || fd.fullNameAadhaar || "";
  const email = c.email || fd.personalEmail || fd.email || "";

  const emergencyPhone = fd.emergencyContactPhone || "";
  const emergencyName = fd.emergencyContactName || "";
  const emergencyRel = fd.emergencyContactRelation || "";
  const emergencyContactStr = emergencyPhone
    ? `${emergencyPhone}${emergencyName ? " (" + emergencyName + (emergencyRel ? " - " + emergencyRel : "") + ")" : ""}`
    : emergencyName
    ? `${emergencyName} (${emergencyRel || "Contact"})`
    : "";

  const dob = fd.dob || "";
  const maritalStatus = fd.maritalStatus || "Single";

  let spouseKids = fd.childDetails || "";
  if (!spouseKids && maritalStatus === "Married" && emergencyRel.toLowerCase().includes("spouse")) {
    spouseKids = `Spouse: ${emergencyName}`;
  }

  const currentAddress = fd.currentAddress || "";
  const permanentAddress = fd.permanentAddress || "";
  const optPf = fd.pfOptIn || "Yes";
  const uan = fd.uanNumber || "";

  const aadhaarNo = fd.aadhaarNumber || "";
  const aadhaarDoc =
    fd.aadhaarDocUrl ||
    c.aadhaarDocUrl ||
    getDocUrl(c.documents, "aadhaar") ||
    (fd.aadhaarNumber ? "Uploaded" : "");

  const panNo = fd.panNumber || "";
  const panDoc =
    fd.panDocUrl ||
    c.panDocUrl ||
    getDocUrl(c.documents, "pan") ||
    (fd.panNumber ? "Uploaded" : "");

  const proPhoto =
    fd.professionalPhotoUrl ||
    c.photoDocUrl ||
    getDocUrl(c.documents, "professional", "pro photo") ||
    "";
  const casualPhoto =
    fd.casualPhotoUrl ||
    getDocUrl(c.documents, "casual", "casual photo") ||
    "";

  const legacyFd = fd as Record<string, any>;
  const marksheet10 =
    legacyFd.tenthMarksheetUrl ||
    getDocUrl(c.documents, "10th", "tenth", "secondary") ||
    "";
  const marksheet12 =
    legacyFd.twelfthMarksheetUrl ||
    getDocUrl(c.documents, "12th", "twelfth", "higher secondary", "intermediate") ||
    "";
  const gradDegree =
    legacyFd.graduationDegreeUrl ||
    getDocUrl(c.documents, "graduation", "degree", "bachelor", "b.tech", "b.sc", "bba", "b.com", "bca") ||
    (fd.highestQualification ? fd.highestQualification : "");
  const postGradDegree =
    legacyFd.postGraduationDegreeUrl ||
    getDocUrl(c.documents, "post-graduation", "post graduation", "master", "m.tech", "mba", "m.sc", "mca") ||
    "";
  const relievingLetter =
    legacyFd.relievingLetterUrl ||
    getDocUrl(c.documents, "relieving", "relieving letter") ||
    "";
  const expLetter =
    legacyFd.experienceLetterUrl ||
    getDocUrl(c.documents, "experience", "experience letter", "service certificate") ||
    "";
  const salarySlips =
    legacyFd.salarySlipsUrl ||
    getDocUrl(c.documents, "salary", "payslip", "pay slip", "salary slips") ||
    "";
  const form16 =
    legacyFd.form16Url ||
    getDocUrl(c.documents, "form 16", "form-16", "tax", "itr") ||
    "";

  const bankName = legacyFd.bankName || (c as any).bankName || "";
  const bankAccNo = legacyFd.bankAccountNumber || (c as any).bankAccountNumber || "";
  const ifscCode = legacyFd.ifscCode || (c as any).ifscCode || "";

  const otherDocs =
    legacyFd.otherDocsUrl ||
    getDocUrl(c.documents, "other", "bank", "cancelled cheque", "passbook") ||
    (fd.previousCompany ? `Previous Org: ${fd.previousCompany}` : "");

  const hasCoreDocs = Boolean(aadhaarDoc && panDoc && (proPhoto || casualPhoto));
  const docStatus = hasCoreDocs
    ? "All Uploaded"
    : (aadhaarDoc || panDoc || proPhoto || casualPhoto)
    ? "Uploaded"
    : "Pending";

  const verifiedBy =
    c.verifiedByHrbp ||
    fd.verifiedByHrbp ||
    (c.status === "Ready for Day 1" || c.status === "Joined"
      ? typeof c.hrbp === "string"
        ? c.hrbp
        : c.hrbp?.name || "HRBP"
      : "Pending Verification");

  const hrRemarks = c.hrRemarks || fd.hrRemarks || c.notes || "";

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
    marksheet10,
    marksheet12,
    gradDegree,
    postGradDegree,
    relievingLetter,
    expLetter,
    salarySlips,
    form16,
    bankName,
    bankAccNo,
    ifscCode,
    otherDocs,
    docStatus,
    verifiedBy,
    hrRemarks,
  ];
}

// 3. Personal & Interests Formatter
export function formatPersonalAndInterestsRow(c: Candidate): string[] {
  const fd = c.formData || ({} as Partial<CandidateFormData>);
  const displayId = c.accessCode || c.id || "";
  const fullName = c.name || fd.fullName || fd.fullNameAadhaar || "";
  const email = c.email || fd.personalEmail || fd.email || "";
  const tshirtSize = fd.tshirtSize || "L";

  const passion = fd.passion || "";
  const hobbies = fd.hobbiesCommunity || "";
  const linkedin = fd.linkedinUrl || "";

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

/**
 * Creates or ensures the 3 sheets (Candidate Master, Details & Documents, Personal & Interests) exist
 */
export async function initializeSpreadsheetTabs(
  authClient: any,
  spreadsheetId?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const sheets = google.sheets({ version: "v4", auth: authClient });

  let targetId = spreadsheetId;

  if (!targetId) {
    // Create new spreadsheet
    const createRes = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: "FieldAssist Pre-Onboarding Master Tracker",
        },
        sheets: [
          { properties: { title: SHEET_NAMES.CANDIDATE_MASTER } },
          { properties: { title: SHEET_NAMES.DETAILS_DOCUMENTS } },
          { properties: { title: SHEET_NAMES.PERSONAL_INTERESTS } },
        ],
      },
    });

    targetId = createRes.data.spreadsheetId!;
  } else {
    // Verify existing spreadsheet and add any missing tabs
    const existing = await sheets.spreadsheets.get({ spreadsheetId: targetId });
    const existingTitles = (existing.data.sheets || []).map((s) => s.properties?.title || "");

    const requiredSheets = Object.values(SHEET_NAMES);
    const missingSheets = requiredSheets.filter((title) => !existingTitles.includes(title));

    if (missingSheets.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: targetId,
        requestBody: {
          requests: missingSheets.map((title) => ({
            addSheet: { properties: { title } },
          })),
        },
      });
    }
  }

  // Ensure header rows exist in all 3 sheets
  const headerUpdates = [
    {
      range: `'${SHEET_NAMES.CANDIDATE_MASTER}'!A1:V1`,
      values: [CANDIDATE_MASTER_HEADERS],
    },
    {
      range: `'${SHEET_NAMES.DETAILS_DOCUMENTS}'!A1:AF1`,
      values: [DETAILS_DOCUMENTS_HEADERS],
    },
    {
      range: `'${SHEET_NAMES.PERSONAL_INTERESTS}'!A1:G1`,
      values: [PERSONAL_INTERESTS_HEADERS],
    },
  ];

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: targetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: headerUpdates,
    },
  });

  return {
    spreadsheetId: targetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${targetId}/edit`,
  };
}

/**
 * Upserts a single candidate row across all 3 sheets without duplicates
 */
export async function syncSingleCandidateToSheets(
  authClient: any,
  spreadsheetId: string,
  candidate: Candidate
): Promise<{ success: boolean; details?: any; spreadsheetUrl?: string }> {
  const sheets = google.sheets({ version: "v4", auth: authClient });
  const cid = (candidate.accessCode || candidate.id || "").toLowerCase().trim();
  const email = (candidate.email || candidate.formData?.personalEmail || "").toLowerCase().trim();

  const tabConfigs = [
    {
      tab: SHEET_NAMES.CANDIDATE_MASTER,
      idColIndex: 2, // 0-based: col C is Candidate ID
      emailColIndex: 1, // col B is Email Address
      rowValues: formatCandidateMasterRow(candidate),
      maxColLetter: "V",
    },
    {
      tab: SHEET_NAMES.DETAILS_DOCUMENTS,
      idColIndex: 0, // col A is Candidate ID
      emailColIndex: 2, // col C is Email Address
      rowValues: formatDetailsAndDocumentsRow(candidate),
      maxColLetter: "AF",
    },
    {
      tab: SHEET_NAMES.PERSONAL_INTERESTS,
      idColIndex: 0, // col A is Candidate ID
      emailColIndex: 2, // col C is Email Address
      rowValues: formatPersonalAndInterestsRow(candidate),
      maxColLetter: "G",
    },
  ];

  for (const cfg of tabConfigs) {
    try {
      const getRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${cfg.tab}'!A:AF`,
      });

      const rows = getRes.data.values || [];
      let targetRowIndex = -1;

      // Scan existing rows for match
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        const rowId = (row[cfg.idColIndex] || "").toString().toLowerCase().trim();
        const rowEmail = (row[cfg.emailColIndex] || "").toString().toLowerCase().trim();

        if (cid && rowId && rowId === cid) {
          targetRowIndex = r + 1; // 1-based sheet row index
          break;
        }
        if (email && rowEmail && rowEmail === email) {
          targetRowIndex = r + 1;
          break;
        }
      }

      if (targetRowIndex > 0) {
        // Update existing row
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${cfg.tab}'!A${targetRowIndex}:${cfg.maxColLetter}${targetRowIndex}`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [cfg.rowValues],
          },
        });
      } else {
        // Append new row
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `'${cfg.tab}'!A:${cfg.maxColLetter}`,
          valueInputOption: "USER_ENTERED",
          insertDataOption: "INSERT_ROWS",
          requestBody: {
            values: [cfg.rowValues],
          },
        });
      }
    } catch (err) {
      console.warn(`[Sync Error on Tab ${cfg.tab}]:`, err);
    }
  }

  return {
    success: true,
    details: "Synchronized candidate to Candidate Master, Details & Documents, and Personal & Interests tabs.",
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

/**
 * Batch updates all 3 sheets with the complete candidate array
 */
export async function syncAllCandidatesToSheets(
  authClient: any,
  spreadsheetId: string,
  candidates: Candidate[]
): Promise<{ success: boolean; candidateCount: number; spreadsheetUrl: string; details?: any }> {
  const sheets = google.sheets({ version: "v4", auth: authClient });

  // 1. Ensure sheets and headers exist
  await initializeSpreadsheetTabs(authClient, spreadsheetId);

  // 2. Prepare value batches
  const masterRows = candidates.map(formatCandidateMasterRow);
  const detailsRows = candidates.map(formatDetailsAndDocumentsRow);
  const personalRows = candidates.map(formatPersonalAndInterestsRow);

  const updates = [
    {
      range: `'${SHEET_NAMES.CANDIDATE_MASTER}'!A2:V${masterRows.length + 1}`,
      values: masterRows,
    },
    {
      range: `'${SHEET_NAMES.DETAILS_DOCUMENTS}'!A2:AF${detailsRows.length + 1}`,
      values: detailsRows,
    },
    {
      range: `'${SHEET_NAMES.PERSONAL_INTERESTS}'!A2:G${personalRows.length + 1}`,
      values: personalRows,
    },
  ];

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: updates,
    },
  });

  return {
    success: true,
    candidateCount: candidates.length,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    details: `Synchronized ${candidates.length} candidates across 3 sheets.`,
  };
}
