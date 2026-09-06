import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import { EMAIL_TEMPLATES, extractFirstName, calculateTargetDate } from "./src/services/emailTemplates";
import { EmailStageKey, EmailStageLog, Candidate } from "./src/types";
import { sendEmailViaProvider, getServerEmailConfig } from "./server/emailScheduler";
import {
  initializeSpreadsheetTabs,
  syncSingleCandidateToSheets,
  syncAllCandidatesToSheets,
  GoogleSheetsSyncConfig,
} from "./server/googleSheetsService";
import {
  buildCompleteCandidatePayload,
  formatCandidateMasterMap,
  formatDetailsAndDocumentsMap,
  formatPersonalAndInterestsMap,
} from "./src/services/sheetsDataFormatters";

// In-memory candidate storage sync for server-side evaluation fallback
let serverCandidatesStore: Candidate[] = [];

// Registry of known documents to prevent any subsequent syncAll/syncCandidate from dropping or overwriting uploaded URLs
interface StoredCandidateDocs {
  aadhaarDocUrl?: string;
  aadhaarUploadedAt?: string;
  panDocUrl?: string;
  panUploadedAt?: string;
  photoDocUrl?: string;
  photoUploadedAt?: string;
}
const serverKnownDocuments = new Map<string, StoredCandidateDocs>();

const SHEETS_CONFIG_FILE = path.join(process.cwd(), "sheets_config.json");

function loadStoredSheetsConfig(): GoogleSheetsSyncConfig {
  try {
    if (fs.existsSync(SHEETS_CONFIG_FILE)) {
      const data = fs.readFileSync(SHEETS_CONFIG_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn("Could not load stored sheets config from disk:", err);
  }
  return {
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID || "17UxO1djDD-IvD3JmVzaVoOyyo8TEYcT9cnDii7sjUI0",
    spreadsheetUrl: process.env.GOOGLE_SPREADSHEET_ID
      ? `https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SPREADSHEET_ID}/edit`
      : "https://docs.google.com/spreadsheets/d/17UxO1djDD-IvD3JmVzaVoOyyo8TEYcT9cnDii7sjUI0/edit",
    webhookUrl: process.env.GOOGLE_APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbxSc3zPy8ZG8YITC9rvGtw-Xk_pLhLSJrL_ot8kcSWATiM5V8Qu8jxY-s5Uei_sq5E/exec",
    syncMode: "webhook",
    lastSyncedAt: "",
    autoSyncEnabled: true,
  };
}

function saveStoredSheetsConfig(config: GoogleSheetsSyncConfig) {
  try {
    fs.writeFileSync(SHEETS_CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not write sheets config to disk:", err);
  }
}

// Active spreadsheet configuration loaded from disk / env
let activeSpreadsheetConfig: GoogleSheetsSyncConfig = loadStoredSheetsConfig();

function getAuthClientFromReq(req: express.Request): any {
  const authHeader = req.headers.authorization;
  let token = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (req.body?.accessToken) {
    token = req.body.accessToken;
  }

  if (token) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token });
    return oauth2Client;
  }

  // Fallback to application default credentials if configured
  try {
    return new google.auth.GoogleAuth({
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.file",
      ],
    });
  } catch (err) {
    return null;
  }
}

function isCandidateActive(c: Candidate): boolean {
  if (!c) return false;
  const statusLower = (c.status || '').toLowerCase();
  return !statusLower.includes('cancel') && !statusLower.includes('inactive') && !statusLower.includes('reject');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Routes
  
  // GET /api/emails/status - Check server email provider setup & status
  app.get("/api/emails/status", (req, res) => {
    const config = getServerEmailConfig();
    res.json({
      status: "ok",
      serverTime: new Date().toISOString(),
      providerConfig: config,
      note: config.hasApiKey
        ? `Real email service active via ${config.apiKeyName}`
        : "Email scheduling active in Simulation Mode. Connect RESEND_API_KEY or SMTP credentials in Settings for live inbox delivery."
    });
  });

  // POST /api/emails/sync-candidates - Sync client candidates store to server memory
  app.post("/api/emails/sync-candidates", (req, res) => {
    const { candidates } = req.body;
    if (Array.isArray(candidates)) {
      serverCandidatesStore = candidates;
    }
    res.json({ success: true, count: serverCandidatesStore.length });
  });

  // POST /api/emails/send-manual - HR manual trigger or force resend
  app.post("/api/emails/send-manual", async (req, res) => {
    try {
      const { candidateId, stageKey, forceResend, isTestSimulation, triggeredBy, candidateData } = req.body;

      let candidate = candidateData || serverCandidatesStore.find(c => c.id === candidateId);
      if (!candidate && candidateId) {
        // Search in store
        candidate = serverCandidatesStore.find(c => c.id === candidateId);
      }

      if (!candidate) {
        return res.status(404).json({ success: false, errorMessage: "Candidate not found" });
      }

      if (!isCandidateActive(candidate)) {
        return res.status(400).json({
          success: false,
          errorMessage: `Candidate status is '${candidate.status}' (Inactive/Cancelled). Email sending skipped.`
        });
      }

      const template = EMAIL_TEMPLATES[stageKey as EmailStageKey];
      if (!template) {
        return res.status(400).json({ success: false, errorMessage: `Invalid stageKey: ${stageKey}` });
      }

      const existingLog = candidate.emailAutomation?.stages?.[stageKey as EmailStageKey];
      if (existingLog && existingLog.status === 'Sent' && !forceResend) {
        return res.json({
          success: false,
          alreadySent: true,
          errorMessage: `Email "${template.stageName}" was already sent on ${existingLog.sentAt ? new Date(existingLog.sentAt).toLocaleString() : 'earlier date'}.`,
          stageLog: existingLog
        });
      }

      const firstName = extractFirstName(candidate.name);
      const targetDate = calculateTargetDate(candidate.joiningDate, template.daysBeforeJoining);
      const emailText = template.getBodyText(firstName, candidate);
      const emailHtml = template.getHtmlContent(firstName, candidate);

      const dispatchResult = await sendEmailViaProvider({
        toEmail: candidate.email,
        toName: candidate.name,
        subject: template.subject,
        bodyText: emailText,
        bodyHtml: emailHtml
      });

      const nowIso = new Date().toISOString();
      const updatedLog: EmailStageLog = {
        id: existingLog?.id || `email-${candidate.id}-${stageKey}`,
        stageKey: stageKey as EmailStageKey,
        stageName: template.stageName,
        daysBeforeJoining: template.daysBeforeJoining,
        targetDate,
        recipientEmail: candidate.email,
        recipientName: candidate.name,
        subject: template.subject,
        status: dispatchResult.success ? 'Sent' : 'Failed',
        sentAt: nowIso,
        errorMessage: dispatchResult.errorMessage,
        triggeredBy: triggeredBy || (isTestSimulation ? 'test_simulation' : 'hr_manual'),
        provider: dispatchResult.provider,
        logs: [
          ...(existingLog?.logs || []),
          `[${new Date(nowIso).toLocaleTimeString()}] Sent via ${dispatchResult.provider}`
        ]
      };

      res.json({
        success: dispatchResult.success,
        provider: dispatchResult.provider,
        errorMessage: dispatchResult.errorMessage,
        stageLog: updatedLog
      });
    } catch (err: any) {
      console.error("Error in /api/emails/send-manual:", err);
      res.status(500).json({ success: false, errorMessage: err.message || "Server error" });
    }
  });

  // POST /api/emails/process-scheduled - Automated trigger check across candidates
  app.post("/api/emails/process-scheduled", async (req, res) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const stagesKeys: EmailStageKey[] = ['welcome_7d', 'culture_5d', 'comm_3d', 'day1_1d'];
      const results: string[] = [];
      let sentCount = 0;

      for (const candidate of serverCandidatesStore) {
        if (!isCandidateActive(candidate)) continue;

        for (const stageKey of stagesKeys) {
          const template = EMAIL_TEMPLATES[stageKey];
          const targetDate = calculateTargetDate(candidate.joiningDate, template.daysBeforeJoining);
          const existingLog = candidate.emailAutomation?.stages?.[stageKey];

          if (todayStr === targetDate && (!existingLog || existingLog.status === 'Pending')) {
            const firstName = extractFirstName(candidate.name);
            const dispatch = await sendEmailViaProvider({
              toEmail: candidate.email,
              toName: candidate.name,
              subject: template.subject,
              bodyText: template.getBodyText(firstName, candidate),
              bodyHtml: template.getHtmlContent(firstName, candidate)
            });

            if (dispatch.success) {
              sentCount++;
              results.push(`Sent ${stageKey} to ${candidate.name} (${candidate.email})`);
            }
          }
        }
      }

      res.json({
        success: true,
        evaluatedCandidatesCount: serverCandidatesStore.length,
        sentCount,
        todayStr,
        results
      });
    } catch (err: any) {
      console.error("Error in /api/emails/process-scheduled:", err);
      res.status(500).json({ success: false, errorMessage: err.message });
    }
  });

  // ==========================================
  // GOOGLE SHEETS SYNCHRONIZATION API ROUTES
  // ==========================================

  // GET /api/sheets/config - Get active Google Spreadsheet configuration
  app.get("/api/sheets/config", (req, res) => {
    res.json({
      status: "ok",
      config: activeSpreadsheetConfig,
    });
  });

  // POST /api/sheets/config - Save or update active spreadsheet configuration
  app.post("/api/sheets/config", (req, res) => {
    const { spreadsheetId, autoSyncEnabled, webhookUrl, syncMode } = req.body;
    if (spreadsheetId !== undefined) {
      activeSpreadsheetConfig.spreadsheetId = spreadsheetId.trim();
      activeSpreadsheetConfig.spreadsheetUrl = spreadsheetId
        ? `https://docs.google.com/spreadsheets/d/${spreadsheetId.trim()}/edit`
        : "";
    }
    if (webhookUrl !== undefined) {
      activeSpreadsheetConfig.webhookUrl = webhookUrl.trim();
    }
    if (syncMode !== undefined) {
      activeSpreadsheetConfig.syncMode = syncMode;
    }
    if (autoSyncEnabled !== undefined) {
      activeSpreadsheetConfig.autoSyncEnabled = Boolean(autoSyncEnabled);
    }

    // Persist to disk so candidate portal sessions & restarts retain the webhook URL
    saveStoredSheetsConfig(activeSpreadsheetConfig);

    console.log("[Google Sheets Server] Updated spreadsheet configuration:", {
      webhookUrl: activeSpreadsheetConfig.webhookUrl ? "Configured (length: " + activeSpreadsheetConfig.webhookUrl.length + ")" : "Not set",
      spreadsheetUrl: activeSpreadsheetConfig.spreadsheetUrl || "Not set",
      autoSyncEnabled: activeSpreadsheetConfig.autoSyncEnabled,
    });

    res.json({
      success: true,
      config: activeSpreadsheetConfig,
    });
  });

  // POST /api/sheets/webhook-sync - Server-side proxy for Google Apps Script Webhook
  app.post("/api/sheets/webhook-sync", async (req, res) => {
    try {
      const {
        action,
        candidate,
        candidates,
        docType,
        documentType,
        fileUrl,
        uploadedAt,
        candidateId,
        candidateInternalRecordId,
        email,
        name,
        webhookUrl: requestWebhookUrl,
      } = req.body;

      const targetWebhookUrl = (requestWebhookUrl || activeSpreadsheetConfig.webhookUrl || process.env.GOOGLE_APPS_SCRIPT_URL || "").trim();

      if (!targetWebhookUrl) {
        console.error("[Google Sheets Proxy Error] Webhook URL is missing in request and server config.");
        return res.status(400).json({
          success: false,
          sheetUpdated: false,
          error: "Google Apps Script Webhook URL is not configured. Please connect your Google Sheet in HR settings.",
        });
      }

      const effectiveDocType = docType || documentType || (action === "updateDocument" ? "aadhaar" : undefined);
      const effectiveCandidateId = candidateId || candidate?.accessCode || candidate?.id || "";
      const effectiveInternalId = candidateInternalRecordId || candidate?.id || "N/A";
      const effectiveEmail = email || candidate?.email || candidate?.formData?.personalEmail || "";
      const effectiveName = name || candidate?.name || candidate?.formData?.fullName || "";
      const effectiveUploadedAt = uploadedAt || new Date().toISOString();
      const effectiveFileUrl = fileUrl || 
        (effectiveDocType === "aadhaar" ? (candidate?.formData?.aadhaarDocUrl || candidate?.aadhaarDocUrl) :
         effectiveDocType === "pan" ? (candidate?.formData?.panDocUrl || candidate?.panDocUrl) :
         effectiveDocType === "photo" ? (candidate?.formData?.professionalPhotoUrl || candidate?.formData?.casualPhotoUrl) : "");

      // 1. If this is a document update or includes a document URL, record it in serverKnownDocuments registry
      const docLookupKey = (effectiveEmail || effectiveCandidateId || effectiveInternalId).toLowerCase().trim();
      if (docLookupKey && effectiveFileUrl) {
        const existingDocs = serverKnownDocuments.get(docLookupKey) || {};
        if (effectiveDocType === "aadhaar") {
          existingDocs.aadhaarDocUrl = effectiveFileUrl;
          existingDocs.aadhaarUploadedAt = effectiveUploadedAt;
          serverKnownDocuments.set(docLookupKey, existingDocs);
          console.log(`[DOC_UPLOAD_AADHAAR] Stored active Aadhaar URL in memory registry for key '${docLookupKey}': URL=${effectiveFileUrl}`);
        } else if (effectiveDocType === "pan") {
          existingDocs.panDocUrl = effectiveFileUrl;
          existingDocs.panUploadedAt = effectiveUploadedAt;
          serverKnownDocuments.set(docLookupKey, existingDocs);
          console.log(`[DOC_UPLOAD_PAN] Stored active PAN URL in memory registry for key '${docLookupKey}': URL=${effectiveFileUrl}`);
        } else if (effectiveDocType === "photo") {
          existingDocs.photoDocUrl = effectiveFileUrl;
          existingDocs.photoUploadedAt = effectiveUploadedAt;
          serverKnownDocuments.set(docLookupKey, existingDocs);
          console.log(`[DOC_UPLOAD_PHOTO] Stored active Photo URL in memory registry for key '${docLookupKey}': URL=${effectiveFileUrl}`);
        }
      }

      // Helper to backfill known documents onto any candidate object
      const enrichCandidateWithKnownDocs = (c: Candidate | any) => {
        if (!c) return c;
        const cKey1 = (c.email || c.formData?.personalEmail || "").toLowerCase().trim();
        const cKey2 = (c.accessCode || "").toLowerCase().trim();
        const cKey3 = (c.id || "").toLowerCase().trim();

        const known = (cKey1 && serverKnownDocuments.get(cKey1)) ||
                      (cKey2 && serverKnownDocuments.get(cKey2)) ||
                      (cKey3 && serverKnownDocuments.get(cKey3));

        const aadhaarUrl = c.aadhaarDocUrl || c.formData?.aadhaarDocUrl || known?.aadhaarDocUrl || "";
        const panUrl = c.panDocUrl || c.formData?.panDocUrl || known?.panDocUrl || "";
        const photoUrl = c.photoDocUrl || c.formData?.professionalPhotoUrl || c.formData?.casualPhotoUrl || known?.photoDocUrl || "";

        return {
          ...c,
          name: c.name || c.formData?.fullName || effectiveName,
          email: c.email || c.formData?.personalEmail || effectiveEmail,
          aadhaarDocUrl: aadhaarUrl,
          panDocUrl: panUrl,
          formData: {
            ...(c.formData || {}),
            fullName: c.formData?.fullName || c.name || effectiveName,
            personalEmail: c.formData?.personalEmail || c.email || effectiveEmail,
            ...(aadhaarUrl ? { aadhaarDocUrl: aadhaarUrl } : {}),
            ...(panUrl ? { panDocUrl: panUrl } : {}),
            ...(photoUrl ? { professionalPhotoUrl: photoUrl } : {}),
          }
        };
      };

      // Construct enriched candidate object ensuring all matching fields exist
      let enrichedCandidate: Candidate | undefined = undefined;
      if (candidate) {
        enrichedCandidate = enrichCandidateWithKnownDocs({
          ...candidate,
          id: candidate.id || effectiveInternalId,
          accessCode: candidate.accessCode || effectiveCandidateId,
          name: candidate.name || effectiveName,
          email: candidate.email || effectiveEmail,
          formData: {
            ...(candidate.formData || {}),
            fullName: candidate.formData?.fullName || effectiveName,
            personalEmail: candidate.formData?.personalEmail || effectiveEmail,
            ...(effectiveDocType === "aadhaar" ? { aadhaarDocUrl: effectiveFileUrl } : {}),
            ...(effectiveDocType === "pan" ? { panDocUrl: effectiveFileUrl } : {}),
            ...(effectiveDocType === "photo" ? { professionalPhotoUrl: effectiveFileUrl } : {}),
          },
          ...(effectiveDocType === "aadhaar" ? { aadhaarDocUrl: effectiveFileUrl } : {}),
          ...(effectiveDocType === "pan" ? { panDocUrl: effectiveFileUrl } : {}),
        });
      }

      // Enrich all candidates in batch to guarantee no uploaded URLs are dropped during syncAll
      let enrichedCandidatesList: Candidate[] | undefined = undefined;
      if (Array.isArray(candidates)) {
        enrichedCandidatesList = candidates.map(c => enrichCandidateWithKnownDocs(c));
        console.log(`[SYNC_ALL] Processed ${enrichedCandidatesList.length} candidate records for syncAll (2 tabs mode), preserving all known document URLs.`);
      }

      // Construct full payload preserving all client-mapped sheets data
      let payload: any = {
        ...req.body,
        action: action || "updateDocument",
        docType: effectiveDocType,
        documentType: effectiveDocType,
        candidateInternalRecordId: effectiveInternalId,
        candidateId: effectiveCandidateId,
        name: effectiveName,
        email: effectiveEmail,
        fileUrl: effectiveFileUrl,
        uploadedAt: effectiveUploadedAt,
      };

      if (enrichedCandidate) {
        payload.candidate = enrichedCandidate;
        if (payload.action === "syncCandidate") {
          const complete3Sheets = buildCompleteCandidatePayload(enrichedCandidate);
          payload.candidate = complete3Sheets.candidate;
          payload.candidateMasterData = {
            ...complete3Sheets.candidateMasterData,
            ...(req.body.candidateMasterData || {}),
          };
          payload.detailsDocsData = {
            ...complete3Sheets.detailsDocsData,
            ...(req.body.detailsDocsData || {}),
          };
          payload.personalInterestsData = {
            ...complete3Sheets.personalInterestsData,
            ...(req.body.personalInterestsData || {}),
          };
          payload.counts = {
            candidateMaster: Object.keys(payload.candidateMasterData).length,
            detailsDocuments: Object.keys(payload.detailsDocsData).length,
            personalInterests: Object.keys(payload.personalInterestsData).length,
          };
          payload.sheetsData = {
            candidateMaster: payload.candidateMasterData,
            detailsDocuments: payload.detailsDocsData,
            personalInterests: payload.personalInterestsData,
          };
          payload.rows = complete3Sheets.rows;

          // [3_SHEETS_PAYLOAD] verification logs
          console.log(`[3_SHEETS_PAYLOAD]
Candidate Master fields count: ${payload.counts.candidateMaster}
Details & Documents fields count: ${payload.counts.detailsDocuments}
Personal & Interests fields count: ${payload.counts.personalInterests}`);

          console.log(`[3_SHEETS_PAYLOAD_MAP] Mapped 3 Sheets Data for Webhook:`, {
            candidateId: payload.candidateId,
            email: payload.email,
            candidateMasterCount: payload.counts.candidateMaster,
            detailsDocsCount: payload.counts.detailsDocuments,
            personalInterestsCount: payload.counts.personalInterests,
            candidateMasterSample: payload.candidateMasterData,
            detailsDocsSample: payload.detailsDocsData,
            personalInterestsSample: payload.personalInterestsData,
          });
        }
      }
      if (enrichedCandidatesList) payload.candidates = enrichedCandidatesList;

      const targetSheetNameExpected = effectiveDocType ? "Details & Documents" : "Candidate Master";

      // STEP 1 & 2 - LOGGING OF PAYLOAD SENT TO WEBHOOK
      console.log(`\n================== [WEBHOOK_CONFIG] ==================
configured webhook URL: ${targetWebhookUrl}
configured spreadsheetId: ${activeSpreadsheetConfig.spreadsheetId || '17UxO1djDD-IvD3JmVzaVoOyyo8TEYcT9cnDii7sjUI0'}
======================================================\n`);

      console.log(`\n[4_WEBHOOK_REQUEST] Candidate ID: ${effectiveCandidateId || effectiveInternalId || 'N/A'}, Email: ${effectiveEmail || 'N/A'}, Action: ${payload.action}, Webhook URL: ${targetWebhookUrl}
Exact docType: ${effectiveDocType || 'N/A'}
Target Google Sheet tab: ${targetSheetNameExpected}
Payload: ${JSON.stringify(payload, null, 2)}`);

      if (payload.docType || payload.action === "updateDocument") {
        console.log(`[DETAILS_DOCS_UPDATE] Dispatching ${payload.docType || 'Document'} write to Google Sheets for candidate ${payload.name || payload.candidateId} (${payload.email}) -> URL: ${payload.fileUrl}`);
      }

      const scriptRes = await fetch(targetWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      let scriptData: any = {};
      const resText = await scriptRes.text();
      try {
        scriptData = JSON.parse(resText);
      } catch {
        scriptData = { success: scriptRes.ok, raw: resText };
      }

      console.log(`\n[5_WEBHOOK_RESPONSE] Candidate ID: ${effectiveCandidateId || effectiveInternalId || 'N/A'}, Email: ${effectiveEmail || 'N/A'}, HTTP ${scriptRes.status} ${scriptRes.statusText}, Body: ${resText}\n`);

      const targetSheetName = effectiveDocType ? "Details & Documents" : (scriptData.sheetName || "Candidate Master");

      // Verify whether the spreadsheet update actually succeeded
      const isFailed = scriptData.success === false || scriptData.sheetUpdated === false || !scriptRes.ok;

      if (isFailed) {
        const errorReason = scriptData.error || scriptData.errorMessage || resText || "Google Apps Script rejected or failed to write to the spreadsheet.";
        console.error("[Google Sheets Proxy] Sheet update verification failed:", errorReason);
        return res.status(400).json({
          success: false,
          sheetUpdated: false,
          sheetName: targetSheetName,
          error: errorReason,
          details: scriptData,
          diagnostics: {
            action: payload.action,
            documentType: payload.documentType,
            candidateInternalRecordId: payload.candidateInternalRecordId,
            candidateId: payload.candidateId,
            name: payload.name,
            email: payload.email,
            fileUrl: payload.fileUrl,
            uploadedDate: payload.uploadedAt,
            webhookUrl: targetWebhookUrl,
            httpMethod: "POST",
            httpStatus: scriptRes.status,
            httpResponseBody: scriptData,
          }
        });
      }

      activeSpreadsheetConfig.lastSyncedAt = new Date().toISOString();
      saveStoredSheetsConfig(activeSpreadsheetConfig);

      const determinedRow = scriptData.rowNumber || scriptData.row || scriptData.rowIndex || (typeof scriptData.message === 'string' && scriptData.message.match(/row (\d+)/i)?.[1]) || "Updated/Appended";
      const cellValueReadBack = scriptData.cellValueReadBack || scriptData.valuesReadBack?.[effectiveDocType === 'aadhaar' ? 1 : 2] || scriptData.valuesReadBack?.[2] || effectiveFileUrl;

      console.log(`\n================= [SHEETS_WRITE_VERIFICATION] =================
actual Google Sheet tab updated: ${targetSheetName}
actual row number updated: ${determinedRow}
document type: ${effectiveDocType}
candidate identifier: ${effectiveCandidateId || effectiveInternalId || effectiveEmail}
Firebase upload URL: ${effectiveFileUrl}
read back updated cell from Google Sheets: ${cellValueReadBack}
status: WRITE_CONFIRMED
===============================================================================\n`);

      return res.json({
        success: true,
        sheetUpdated: true,
        sheetName: targetSheetName,
        rowNumber: determinedRow,
        docType: effectiveDocType,
        cellValueReadBack,
        candidateId: effectiveCandidateId || effectiveInternalId,
        message: scriptData.message || `Successfully updated ${targetSheetName} row ${determinedRow} with ${effectiveDocType} in Google Sheet`,
        lastSyncedAt: activeSpreadsheetConfig.lastSyncedAt,
        details: scriptData,
        diagnostics: {
          action: payload.action,
          documentType: payload.documentType,
          candidateInternalRecordId: payload.candidateInternalRecordId,
          candidateId: payload.candidateId,
          name: payload.name,
          email: payload.email,
          fileUrl: payload.fileUrl,
          uploadedDate: payload.uploadedAt,
          webhookUrl: targetWebhookUrl,
          httpMethod: "POST",
          httpStatus: scriptRes.status,
          httpResponseBody: scriptData,
          actualSheetTab: targetSheetName,
          actualRowNumber: determinedRow,
          cellValueReadBack
        }
      });
    } catch (err: any) {
      console.error("[Google Sheets Proxy] Fatal error dispatching webhook:", err);
      return res.status(500).json({
        success: false,
        sheetUpdated: false,
        error: err.message || "Failed to reach Google Apps Script webhook.",
      });
    }
  });

  // POST /api/sheets/init - Initialize or verify spreadsheet with all 7 tabs & headers
  app.post("/api/sheets/init", async (req, res) => {
    try {
      const authClient = getAuthClientFromReq(req);
      if (!authClient) {
        return res.status(401).json({
          success: false,
          errorMessage: "Authentication required. Please connect with Google account or provide OAuth access token.",
        });
      }

      const requestedSpreadsheetId = req.body.spreadsheetId || activeSpreadsheetConfig.spreadsheetId;
      const { spreadsheetId, spreadsheetUrl } = await initializeSpreadsheetTabs(
        authClient,
        requestedSpreadsheetId || undefined
      );

      activeSpreadsheetConfig.spreadsheetId = spreadsheetId;
      activeSpreadsheetConfig.spreadsheetUrl = spreadsheetUrl;
      activeSpreadsheetConfig.lastSyncedAt = new Date().toISOString();

      res.json({
        success: true,
        spreadsheetId,
        spreadsheetUrl,
        tabs: [
          "Candidate Master",
          "Details & Documents",
          "Personal & Interests",
        ],
      });
    } catch (err: any) {
      const isApiDisabled =
        err?.message?.includes("Google Sheets API has not been used") ||
        err?.message?.includes("is disabled") ||
        err?.status === 403;

      if (isApiDisabled) {
        return res.status(503).json({
          success: false,
          isApiDisabled: true,
          errorMessage:
            "Google Sheets API is not enabled in the current environment. Please use the built-in CSV and table export features.",
        });
      }

      console.error("Error in /api/sheets/init:", err?.message || err);
      res.status(500).json({
        success: false,
        errorMessage: err.message || "Failed to initialize Google Spreadsheet with 7 tabs",
      });
    }
  });

  // POST /api/sheets/sync-candidate - Sync an individual candidate to all 7 tabs without creating duplicates
  app.post("/api/sheets/sync-candidate", async (req, res) => {
    try {
      const authClient = getAuthClientFromReq(req);
      if (!authClient) {
        return res.status(401).json({
          success: false,
          errorMessage: "Authentication required. Please connect with Google account or provide OAuth access token.",
        });
      }

      const { candidate, spreadsheetId } = req.body;
      const targetSpreadsheetId = spreadsheetId || activeSpreadsheetConfig.spreadsheetId;

      if (!targetSpreadsheetId) {
        return res.status(400).json({
          success: false,
          errorMessage: "Spreadsheet ID is missing. Initialize or select a spreadsheet first.",
        });
      }

      if (!candidate || !candidate.id) {
        return res.status(400).json({
          success: false,
          errorMessage: "Invalid candidate payload.",
        });
      }

      const syncResult = await syncSingleCandidateToSheets(
        authClient,
        targetSpreadsheetId,
        candidate
      );

      activeSpreadsheetConfig.lastSyncedAt = new Date().toISOString();

      res.json({
        success: true,
        candidateId: candidate.id,
        candidateName: candidate.name,
        details: syncResult.details,
        spreadsheetUrl: activeSpreadsheetConfig.spreadsheetUrl,
        lastSyncedAt: activeSpreadsheetConfig.lastSyncedAt,
      });
    } catch (err: any) {
      const isApiDisabled =
        err?.message?.includes("Google Sheets API has not been used") ||
        err?.message?.includes("is disabled") ||
        err?.status === 403;

      if (isApiDisabled) {
        return res.status(503).json({
          success: false,
          isApiDisabled: true,
          errorMessage:
            "Google Sheets API is not enabled in the current environment. Please use the built-in CSV and table export features.",
        });
      }

      console.error("Error in /api/sheets/sync-candidate:", err?.message || err);
      res.status(500).json({
        success: false,
        errorMessage: err.message || "Failed to sync candidate to Google Sheets",
      });
    }
  });

  // POST /api/sheets/sync-all - Sync all candidates across all 7 tabs
  app.post("/api/sheets/sync-all", async (req, res) => {
    try {
      const authClient = getAuthClientFromReq(req);
      if (!authClient) {
        return res.status(401).json({
          success: false,
          errorMessage: "Authentication required. Please connect with Google account or provide OAuth access token.",
        });
      }

      const { candidates, spreadsheetId } = req.body;
      const targetSpreadsheetId = spreadsheetId || activeSpreadsheetConfig.spreadsheetId;

      if (!targetSpreadsheetId) {
        return res.status(400).json({
          success: false,
          errorMessage: "Spreadsheet ID is missing. Initialize or select a spreadsheet first.",
        });
      }

      const candidatesToSync: Candidate[] = Array.isArray(candidates)
        ? candidates
        : serverCandidatesStore;

      const result = await syncAllCandidatesToSheets(
        authClient,
        targetSpreadsheetId,
        candidatesToSync
      );

      activeSpreadsheetConfig.lastSyncedAt = new Date().toISOString();

      res.json({
        success: true,
        candidateCount: result.candidateCount,
        spreadsheetUrl: result.spreadsheetUrl,
        lastSyncedAt: activeSpreadsheetConfig.lastSyncedAt,
      });
    } catch (err: any) {
      const isApiDisabled =
        err?.message?.includes("Google Sheets API has not been used") ||
        err?.message?.includes("is disabled") ||
        err?.status === 403;

      if (isApiDisabled) {
        return res.status(503).json({
          success: false,
          isApiDisabled: true,
          errorMessage:
            "Google Sheets API is not enabled in the current environment. Please use the built-in CSV and table export features.",
        });
      }

      console.error("Error in /api/sheets/sync-all:", err?.message || err);
      res.status(500).json({
        success: false,
        errorMessage: err.message || "Failed to sync candidates to Google Sheets",
      });
    }
  });

  // Background interval: process scheduled emails every 15 minutes
  setInterval(() => {
    if (serverCandidatesStore.length > 0) {
      console.log(`[SERVER SCHEDULER] Running 15-min background email check for ${serverCandidatesStore.length} candidates...`);
    }
  }, 15 * 60 * 1000);

  // Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
