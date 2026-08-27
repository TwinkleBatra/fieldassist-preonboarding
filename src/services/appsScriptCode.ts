/**
 * FieldAssist Safe 3-Tab Google Apps Script Webhook
 * 
 * Works directly with your Google Sheet using ONLY the 3 final tabs:
 * 1. Candidate Master (22 columns)
 * 2. Details & Documents (32 columns)
 * 3. Personal & Interests (7 columns)
 * 
 * SAFETY GUARANTEES:
 * - NEVER uses clearContents() on unmapped rows.
 * - Dynamically matches columns by header name, preserving your existing order & formatting.
 * - Uses Candidate ID (or Email as fallback) to upsert rows without duplicates.
 * - Safely updates individual cells when candidates upload Aadhaar, PAN, Photo, or any other document.
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * FieldAssist Safe Google Sheets Webhook (3 Tabs: Candidate Master, Details & Documents, Personal & Interests)
 */

// Target Tab Names
var TAB_CANDIDATE_MASTER = "Candidate Master";
var TAB_DETAILS_DOCUMENTS = "Details & Documents";
var TAB_PERSONAL_INTERESTS = "Personal & Interests";

// Canonical Header Definitions (used if a tab needs to be created or initialized)
var CANONICAL_HEADERS = {
  "Candidate Master": [
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
    "Remarks"
  ],
  "Details & Documents": [
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
    "Document Status",
    "Verified By HRBP",
    "HR Remarks"
  ],
  "Personal & Interests": [
    "Candidate ID",
    "Full Name",
    "Email Address",
    "Tshirt Size",
    "What's one thing you're passionate about and could talk about for hours? (e.g., cafes, books, travel, fitness, movies, photography etc.)",
    "What's one hobby or community activity you'd love to make time for? (e.g., social service, theatre, volunteering, music, dance or sports)",
    "Share your LinkedIn Profile URL/ID"
  ]
};

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    message: "FieldAssist Google Sheets Webhook is active and listening (3-tab mode)!",
    spreadsheet: SpreadsheetApp.getActiveSpreadsheet().getName(),
    tabs: [
      TAB_CANDIDATE_MASTER,
      TAB_DETAILS_DOCUMENTS,
      TAB_PERSONAL_INTERESTS
    ]
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Wait up to 10 seconds for concurrent write operations
    lock.waitLock(10000);
    
    var rawContent = e.postData.contents;
    var payload = JSON.parse(rawContent);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = payload.action;

    // Action 1: Health check / Verification
    if (action === "init" || action === "ping") {
      ensureAllTabsExist(ss);
      return jsonResponse({
        success: true,
        message: "Connected safely to '" + ss.getName() + "' (Candidate Master, Details & Documents, Personal & Interests tabs active).",
        spreadsheetId: ss.getId(),
        spreadsheetUrl: ss.getUrl(),
        tabs: [TAB_CANDIDATE_MASTER, TAB_DETAILS_DOCUMENTS, TAB_PERSONAL_INTERESTS]
      });
    }

    // Action 2: Safe Upsert of Single Candidate across all 3 tabs
    if (action === "syncCandidate" && payload.candidate) {
      ensureAllTabsExist(ss);
      upsertCandidateToAllTabs(ss, payload.candidate);
      return jsonResponse({
        success: true,
        message: "Candidate " + (payload.candidate.name || "") + " safely synchronized to Candidate Master, Details & Documents, and Personal & Interests!",
        candidateId: payload.candidate.id || payload.candidate.accessCode
      });
    }

    // Action 3: Safe Batch Upsert of All Candidates (Preserves existing rows)
    if (action === "syncAll" && payload.candidates) {
      ensureAllTabsExist(ss);
      var count = 0;
      for (var i = 0; i < payload.candidates.length; i++) {
        upsertCandidateToAllTabs(ss, payload.candidates[i]);
        count++;
      }
      return jsonResponse({
        success: true,
        message: "Successfully synchronized " + count + " candidates across all 3 tabs!",
        candidateCount: count
      });
    }

    // Action 4: Targeted Document Cell Update (Aadhaar, PAN, Photos, Degrees, Slips, etc.) with Proof of Write
    if (action === "updateDocument") {
      ensureAllTabsExist(ss);
      var docResult = updateDocumentCell(ss, payload);
      return jsonResponse(docResult);
    }

    return jsonResponse({ success: false, error: "Unknown action: " + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Ensures the 3 required tabs exist without altering or deleting existing sheets
 */
function ensureAllTabsExist(ss) {
  for (var tabName in CANONICAL_HEADERS) {
    var sheet = getSheetByNameCaseInsensitive(ss, tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
      var headers = CANONICAL_HEADERS[tabName];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#2563eb");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
  }
}

/**
 * Builds a column header mapping for any sheet (e.g. { "candidate id": 1, "full name": 2, ... })
 */
function getHeaderColumnMap(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return {};
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    var key = String(headers[i] || "").trim().toLowerCase();
    if (key) {
      map[key] = i + 1; // 1-based column index
    }
  }
  return map;
}

/**
 * Finds existing row index for a candidate using Candidate ID, Secondary ID, or Email
 */
function findRowIndex(sheet, colMap, candidateId, secondaryId, email) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;

  var idCol = colMap["candidate id"] || colMap["id"];
  var emailCol = colMap["email address"] || colMap["personal email"] || colMap["email id"] || colMap["email"];

  var cid = candidateId ? String(candidateId).trim().toLowerCase() : "";
  var sid = secondaryId ? String(secondaryId).trim().toLowerCase() : "";
  var em = email ? String(email).trim().toLowerCase() : "";

  var values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

  for (var r = 0; r < values.length; r++) {
    var row = values[r];
    var rowId = idCol ? String(row[idCol - 1] || "").trim().toLowerCase() : "";
    var rowEmail = emailCol ? String(row[emailCol - 1] || "").trim().toLowerCase() : "";

    // 1. Exact Candidate ID Match
    if (cid && rowId && (rowId === cid || rowId === sid)) {
      return r + 2;
    }
    if (sid && rowId && rowId === sid) {
      return r + 2;
    }
    // 2. Email ID Fallback Match (prevents duplicates before Candidate ID is created)
    if (em && rowEmail && rowEmail === em) {
      return r + 2;
    }
  }

  return -1;
}

/**
 * Safely updates or appends a candidate across Candidate Master, Details & Documents, and Personal & Interests
 */
function upsertCandidateToAllTabs(ss, c) {
  var candidateId = c.accessCode || c.id || "";
  var secondaryId = c.id || "";
  var email = c.email || (c.formData ? c.formData.personalEmail : "") || "";
  var name = c.name || (c.formData ? (c.formData.fullName || c.formData.fullNameAadhaar) : "") || "";
  var fd = c.formData || {};
  var docs = c.documents || [];

  var hrbpName = typeof c.hrbp === "string" ? c.hrbp : (c.hrbp ? c.hrbp.name : "");
  var hrbpEmail = (typeof c.hrbp === "object" && c.hrbp && c.hrbp.email) ? c.hrbp.email : "";
  var hrbpPhone = (typeof c.hrbp === "object" && c.hrbp && c.hrbp.phone) ? c.hrbp.phone : "";

  var formStatus = c.formStatus || (fd.isSubmitted ? "Submitted" : (fd.completionPercentage ? "In Progress" : "Not Started"));
  var completionPct = (fd.completionPercentage !== undefined ? fd.completionPercentage : (c.formStatus === "Submitted" || c.formStatus === "Verified" ? 100 : c.formStatus === "In Progress" ? 50 : 0)) + "%";

  var aadhaarUrl = fd.aadhaarDocUrl || c.aadhaarDocUrl || getDocUrl(docs, "aadhaar") || (fd.aadhaarNumber ? "Uploaded" : "");
  var panUrl = fd.panDocUrl || c.panDocUrl || getDocUrl(docs, "pan") || (fd.panNumber ? "Uploaded" : "");
  var proPhotoUrl = fd.professionalPhotoUrl || c.photoDocUrl || getDocUrl(docs, "professional") || "";
  var casualPhotoUrl = fd.casualPhotoUrl || getDocUrl(docs, "casual") || "";

  var docStatus = (aadhaarUrl && panUrl && (proPhotoUrl || casualPhotoUrl)) ? "All Uploaded" : (aadhaarUrl || panUrl || proPhotoUrl || casualPhotoUrl) ? "Uploaded" : "Pending";

  var totalExp = fd.totalWorkExperience || (fd.totalExperienceYears !== undefined ? (fd.totalExperienceYears + " Years") : "") || c.totalExperience || "";
  var lastEmployer = fd.previousCompany || c.lastEmployer || c.currentCompany || "";
  var lastDesignation = fd.previousDesignation || c.lastDesignation || "";
  var lastEmpAndDesig = lastEmployer ? (lastEmployer + (lastDesignation ? (" - " + lastDesignation) : "")) : "";
  var currentCompany = fd.previousCompany || c.currentCompany || c.lastEmployer || "";
  var remarks = c.notes || fd.hrRemarks || c.hrRemarks || "";
  var timestamp = fd.submittedAt || new Date().toISOString();

  // ==========================================
  // --- 1. SHEET 1: Candidate Master ---
  // ==========================================
  var masterData = {
    "timestamp": timestamp,
    "email address": email,
    "personal email": email,
    "email id": email,
    "candidate id": candidateId,
    "full name": name,
    "candidate name": name,
    "contact number": c.phone || fd.phone || "",
    "mobile": c.phone || fd.phone || "",
    "date of joining": c.joiningDate || fd.joiningDate || "",
    "doj": c.joiningDate || fd.joiningDate || "",
    "role / designation": c.role || "",
    "role": c.role || "",
    "designation": c.role || "",
    "department": c.department || "",
    "reporting manager": c.reportingManager || "",
    "hrbp / spoc name": hrbpName,
    "hrbp name": hrbpName,
    "hrbp email": hrbpEmail,
    "hrbp phone": hrbpPhone,
    "form status": formStatus,
    "form completion %": completionPct,
    "candidate status": c.status || "Offer Accepted",
    "overall status": c.status || "Offer Accepted",
    "total years of experience": totalExp,
    "last employer & designation": lastEmpAndDesig,
    "current company": currentCompany,
    "remarks": remarks
  };
  safeUpsertRow(ss, TAB_CANDIDATE_MASTER, candidateId, secondaryId, email, masterData);

  // ==========================================
  // --- 2. SHEET 2: Details & Documents ---
  // ==========================================
  var emergencyPhone = fd.emergencyContactPhone || "";
  var emergencyName = fd.emergencyContactName || "";
  var emergencyRel = fd.emergencyContactRelation || "";
  var emergencyContactStr = emergencyPhone
    ? (emergencyPhone + (emergencyName ? (" (" + emergencyName + (emergencyRel ? (" - " + emergencyRel) : "") + ")") : ""))
    : (emergencyName ? (emergencyName + " (" + (emergencyRel || "Contact") + ")") : "");

  var spouseKids = fd.childDetails || "";
  if (!spouseKids && (fd.maritalStatus === "Married") && emergencyRel.toLowerCase().indexOf("spouse") !== -1) {
    spouseKids = "Spouse: " + emergencyName;
  }

  var verifiedBy = c.verifiedByHrbp || fd.verifiedByHrbp || ((c.status === "Ready for Day 1" || c.status === "Joined") ? (hrbpName || "HRBP") : "Pending Verification");
  var hrRemarks = c.hrRemarks || fd.hrRemarks || c.notes || "";

  var detailsDocsData = {
    "candidate id": candidateId,
    "full name": name,
    "candidate name": name,
    "email address": email,
    "personal email": email,
    "email id": email,
    "emergency contact number": emergencyContactStr,
    "date of birth": fd.dob || "",
    "marital status": fd.maritalStatus || "Single",
    "spouse + child 1 + child 2 dob and name (if applicable)": spouseKids,
    "current address (including pincode)": fd.currentAddress || "",
    "permanent address (including pincode)": fd.permanentAddress || "",
    "want to opt for pf": fd.pfOptIn || "Yes",
    "uan": fd.uanNumber || "",
    "aadhar card no": fd.aadhaarNumber || "",
    "aadhar card": aadhaarUrl,
    "pan card no": fd.panNumber || "",
    "pan card": panUrl,
    "clear, professional photo": proPhotoUrl,
    "clear casual photo": casualPhotoUrl,
    "document status": docStatus,
    "verified by hrbp": verifiedBy,
    "hr remarks": hrRemarks
  };
  safeUpsertRow(ss, TAB_DETAILS_DOCUMENTS, candidateId, secondaryId, email, detailsDocsData);

  // ==========================================
  // --- 3. SHEET 3: Personal & Interests ---
  // ==========================================
  var personalInterestsData = {
    "candidate id": candidateId,
    "full name": name,
    "candidate name": name,
    "email address": email,
    "personal email": email,
    "email id": email,
    "tshirt size": fd.tshirtSize || "L",
    "what's one thing you're passionate about and could talk about for hours? (e.g., cafes, books, travel, fitness, movies, photography etc.)": fd.passion || "",
    "what's one hobby or community activity you'd love to make time for? (e.g., social service, theatre, volunteering, music, dance or sports)": fd.hobbiesCommunity || "",
    "share your linkedin profile url/id": fd.linkedinUrl || ""
  };
  safeUpsertRow(ss, TAB_PERSONAL_INTERESTS, candidateId, secondaryId, email, personalInterestsData);
}

/**
 * Safely updates an existing row matching Candidate ID/Email, or appends a new row
 */
function safeUpsertRow(ss, tabName, candidateId, secondaryId, email, fieldValues) {
  var sheet = getSheetByNameCaseInsensitive(ss, tabName);
  if (!sheet) return;

  var colMap = getHeaderColumnMap(sheet);
  if (Object.keys(colMap).length === 0) return;

  var rowIndex = findRowIndex(sheet, colMap, candidateId, secondaryId, email);

  if (rowIndex > 0) {
    // Update existing row cell-by-cell for mapped columns only
    for (var headerKey in fieldValues) {
      var colIdx = colMap[headerKey.toLowerCase()];
      var val = fieldValues[headerKey];
      if (colIdx && val !== undefined && val !== null && val !== "") {
        sheet.getRange(rowIndex, colIdx).setValue(val);
      }
    }
  } else {
    // Append new row mapped to exact column headers
    var lastCol = sheet.getLastColumn();
    var newRow = new Array(lastCol).fill("");
    var hasContent = false;

    for (var hKey in fieldValues) {
      var cIdx = colMap[hKey.toLowerCase()];
      var v = fieldValues[hKey];
      if (cIdx && cIdx <= lastCol && v !== undefined && v !== null) {
        newRow[cIdx - 1] = v;
        if (v !== "") hasContent = true;
      }
    }

    if (hasContent) {
      sheet.appendRow(newRow);
    }
  }
}

/**
 * Handles targeted document upload cell updates in "Details & Documents" with Proof of Write
 */
function updateDocumentCell(ss, payload) {
  var docType = (payload.docType || payload.documentType || "aadhaar").toLowerCase();
  var fileUrl = payload.fileUrl || "";
  var candidate = payload.candidate || {};
  var candidateId = candidate.accessCode || candidate.id || payload.candidateId || "";
  var email = candidate.email || (candidate.formData ? candidate.formData.personalEmail : "") || payload.email || "";
  var name = candidate.name || (candidate.formData ? (candidate.formData.fullName || candidate.formData.fullNameAadhaar) : "") || payload.name || "";

  // 1. Locate Details & Documents sheet (case-insensitive)
  var docSheet = getSheetByNameCaseInsensitive(ss, TAB_DETAILS_DOCUMENTS) || getSheetByNameCaseInsensitive(ss, "Details & Documents") || getSheetByNameCaseInsensitive(ss, "Document Tracker");
  if (!docSheet) {
    docSheet = ss.insertSheet(TAB_DETAILS_DOCUMENTS);
    var docHeaders = CANONICAL_HEADERS[TAB_DETAILS_DOCUMENTS];
    docSheet.getRange(1, 1, 1, docHeaders.length).setValues([docHeaders]);
  }

  var colMap = getHeaderColumnMap(docSheet);
  var candidateInternalRecordId = payload.candidateInternalRecordId || candidate.id || "";
  
  // Find matching column for this document in Details & Documents
  var targetCol = null;
  if (docType === "aadhaar" || docType === "aadhar") {
    targetCol = colMap["aadhar card"] || colMap["aadhaar card"] || colMap["aadhar"] || colMap["aadhaar"];
  } else if (docType === "pan") {
    targetCol = colMap["pan card"] || colMap["pan"];
  } else if (docType.indexOf("pro") !== -1 || docType === "photo_pro" || docType === "professional") {
    targetCol = colMap["clear, professional photo"] || colMap["professional photo"] || colMap["photo"];
  } else if (docType.indexOf("casual") !== -1 || docType === "photo_casual") {
    targetCol = colMap["clear casual photo"] || colMap["casual photo"];
  } else if (docType.indexOf("10") !== -1) {
    targetCol = colMap["10th marksheet"] || colMap["10th"];
  } else if (docType.indexOf("12") !== -1) {
    targetCol = colMap["12th marksheet"] || colMap["12th"];
  } else if (docType.indexOf("grad") !== -1 || docType.indexOf("degree") !== -1) {
    targetCol = colMap["graduation degree / marksheet"] || colMap["graduation degree"];
  } else if (docType.indexOf("post") !== -1 || docType.indexOf("master") !== -1) {
    targetCol = colMap["post-graduation degree"] || colMap["post graduation"];
  } else if (docType.indexOf("reliev") !== -1) {
    targetCol = colMap["previous employer relieving letter"] || colMap["relieving letter"];
  } else if (docType.indexOf("exp") !== -1) {
    targetCol = colMap["previous employer experience letter"] || colMap["experience letter"];
  } else if (docType.indexOf("salary") !== -1 || docType.indexOf("payslip") !== -1) {
    targetCol = colMap["last 3 months salary slips"] || colMap["salary slips"];
  } else if (docType.indexOf("16") !== -1 || docType.indexOf("tax") !== -1) {
    targetCol = colMap["form 16 / tax documents"] || colMap["form 16"];
  }

  // Fallback search by keyword
  if (!targetCol) {
    for (var k in colMap) {
      if (k.indexOf(docType) !== -1) {
        targetCol = colMap[k];
        break;
      }
    }
  }

  // Default to Aadhaar or PAN columns if still unfound
  if (!targetCol) {
    targetCol = (docType === "pan") ? 15 : 13;
  }

  // 2. Locate row in Details & Documents using Candidate ID, internal record ID, or email
  var targetRowIndex = findRowIndex(docSheet, colMap, candidateId, candidateInternalRecordId, email);

  if (targetRowIndex > 0) {
    // Update cell in existing row with the Firebase file URL / status
    docSheet.getRange(targetRowIndex, targetCol).setValue(fileUrl || "Uploaded");
    
    // Ensure Candidate Name and Email are filled in if missing
    var nameCol = colMap["full name"] || colMap["candidate name"] || 2;
    var emailCol = colMap["email address"] || colMap["personal email"] || colMap["email id"] || 3;
    if (name && nameCol) docSheet.getRange(targetRowIndex, nameCol).setValue(name);
    if (email && emailCol) docSheet.getRange(targetRowIndex, emailCol).setValue(email);

    // Update Document Status column if exists
    var statusCol = colMap["document status"] || colMap["status"];
    if (statusCol) {
      docSheet.getRange(targetRowIndex, statusCol).setValue("Uploaded");
    }
  } else {
    // Append new row for candidate in Details & Documents
    var lastCol = docSheet.getLastColumn() || 32;
    var newRow = new Array(lastCol).fill("");
    var idCol = colMap["candidate id"] || colMap["id"] || 1;
    var nameColIdx = colMap["full name"] || colMap["candidate name"] || 2;
    var emailColIdx = colMap["email address"] || colMap["personal email"] || 3;
    var statusColIdx = colMap["document status"] || colMap["status"] || 30;

    newRow[idCol - 1] = candidateId || candidateInternalRecordId || email || name;
    if (nameColIdx <= lastCol) newRow[nameColIdx - 1] = name;
    if (emailColIdx <= lastCol) newRow[emailColIdx - 1] = email;
    if (targetCol <= lastCol) newRow[targetCol - 1] = fileUrl || "Uploaded";
    if (statusColIdx <= lastCol) newRow[statusColIdx - 1] = "Uploaded";

    docSheet.appendRow(newRow);
    targetRowIndex = docSheet.getLastRow();
  }

  // Also sync candidate across Candidate Master & Personal & Interests
  if (candidate && Object.keys(candidate).length > 0) {
    upsertCandidateToAllTabs(ss, candidate);
  }

  SpreadsheetApp.flush();

  // PROOF OF WRITE: Read back written value from actual sheet cell
  var readBackRange = docSheet.getRange(targetRowIndex, 1, 1, docSheet.getLastColumn()).getValues()[0];
  var candidateIdRead = String(readBackRange[0] || "");
  var cellValueReadBack = targetCol ? String(readBackRange[targetCol - 1] || "") : "";

  var writeVerified = cellValueReadBack.length > 0;

  return {
    success: writeVerified,
    sheetUpdated: writeVerified,
    sheetName: docSheet.getName(),
    rowNumber: targetRowIndex,
    docType: docType,
    fileUrl: fileUrl,
    cellValueReadBack: cellValueReadBack,
    candidateIdReadBack: candidateIdRead,
    valuesReadBack: readBackRange
  };
}

function getSheetByNameCaseInsensitive(ss, name) {
  var sheets = ss.getSheets();
  var target = name.toLowerCase().trim();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getName().toLowerCase().trim() === target) {
      return sheets[i];
    }
  }
  return null;
}

function getDocUrl(docs, term) {
  if (!docs || !docs.length) return "";
  for (var i = 0; i < docs.length; i++) {
    var d = docs[i];
    if (d.name && d.name.toLowerCase().indexOf(term) !== -1 && d.fileUrl) {
      return d.fileUrl;
    }
  }
  return "";
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
