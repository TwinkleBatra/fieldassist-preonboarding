import { Candidate, CandidateFormData } from '../types';
import {
  buildCompleteCandidatePayload,
  formatCandidateMasterMap,
  formatDetailsAndDocumentsMap,
  formatPersonalAndInterestsMap,
} from './sheetsDataFormatters';

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  webhookUrl?: string;
  syncMode?: 'webhook' | 'oauth';
  autoSyncEnabled: boolean;
  lastSyncedAt: string;
  connectedAccountEmail?: string;
}

const STORAGE_KEY_CONFIG = 'fieldassist_google_sheets_config_v1';

export const DEFAULT_SHEETS_CONFIG: GoogleSheetsConfig = {
  spreadsheetId: '17UxO1djDD-IvD3JmVzaVoOyyo8TEYcT9cnDii7sjUI0',
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/17UxO1djDD-IvD3JmVzaVoOyyo8TEYcT9cnDii7sjUI0/edit',
  webhookUrl: 'https://script.google.com/macros/s/AKfycbxSc3zPy8ZG8YITC9rvGtw-Xk_pLhLSJrL_ot8kcSWATiM5V8Qu8jxY-s5Uei_sq5E/exec',
  syncMode: 'webhook',
  autoSyncEnabled: true,
  lastSyncedAt: '',
  connectedAccountEmail: '',
};

let cachedConfig: GoogleSheetsConfig = { ...DEFAULT_SHEETS_CONFIG };

try {
  const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
  if (saved) {
    const parsed = JSON.parse(saved);
    cachedConfig = {
      ...DEFAULT_SHEETS_CONFIG,
      ...parsed,
      // If previous storage was empty or using outdated webhook, adopt current default
      webhookUrl: (parsed.webhookUrl && !parsed.webhookUrl.includes('AKfycbznOAZAiK86')) ? parsed.webhookUrl : DEFAULT_SHEETS_CONFIG.webhookUrl,
      spreadsheetId: parsed.spreadsheetId || DEFAULT_SHEETS_CONFIG.spreadsheetId,
      spreadsheetUrl: parsed.spreadsheetUrl || DEFAULT_SHEETS_CONFIG.spreadsheetUrl,
    };
  }
} catch (e) {
  console.warn('Failed to load Google Sheets config from storage', e);
}

// Hydrate config from server if webhookUrl is empty in client memory
export async function hydrateConfigFromServer(): Promise<GoogleSheetsConfig> {
  try {
    const res = await fetch('/api/sheets/config');
    if (res.ok) {
      const data = await res.json();
      if (data.config) {
        if (data.config.webhookUrl && !cachedConfig.webhookUrl) {
          cachedConfig.webhookUrl = data.config.webhookUrl;
        }
        if (data.config.spreadsheetId && !cachedConfig.spreadsheetId) {
          cachedConfig.spreadsheetId = data.config.spreadsheetId;
        }
        if (data.config.spreadsheetUrl && !cachedConfig.spreadsheetUrl) {
          cachedConfig.spreadsheetUrl = data.config.spreadsheetUrl;
        }
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(cachedConfig));
      }
    }
  } catch (err) {
    console.warn('Could not hydrate sheets config from server:', err);
  }
  return { ...cachedConfig };
}

// Initial async hydration
hydrateConfigFromServer().catch(() => {});

export function getGoogleSheetsConfig(): GoogleSheetsConfig {
  return { ...cachedConfig };
}

export function saveGoogleSheetsConfig(config: Partial<GoogleSheetsConfig>): GoogleSheetsConfig {
  cachedConfig = { ...cachedConfig, ...config };
  if (cachedConfig.spreadsheetId && !cachedConfig.spreadsheetUrl) {
    cachedConfig.spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${cachedConfig.spreadsheetId}/edit`;
  }
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(cachedConfig));
  } catch (e) {
    console.warn('Failed to persist Google Sheets config', e);
  }

  fetch('/api/sheets/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      spreadsheetId: cachedConfig.spreadsheetId,
      webhookUrl: cachedConfig.webhookUrl,
      syncMode: cachedConfig.syncMode,
      autoSyncEnabled: cachedConfig.autoSyncEnabled,
    }),
  }).catch(() => {});

  return { ...cachedConfig };
}

/**
 * Universal webhook dispatcher: tries server proxy first, then falls back to direct client fetch
 */
async function sendWebhookPayload(payload: {
  action: string;
  candidate?: Candidate;
  candidates?: Candidate[];
  docType?: string;
  documentType?: string;
  fileUrl?: string;
  uploadedAt?: string;
  candidateId?: string;
  candidateInternalRecordId?: string;
  email?: string;
  name?: string;
}): Promise<{
  success: boolean;
  sheetUpdated?: boolean;
  sheetName?: string;
  rowNumber?: number | string;
  data?: any;
  errorMessage?: string;
  error?: string;
  diagnostics?: any;
}> {
  let webhookUrl = cachedConfig.webhookUrl?.trim();
  if (!webhookUrl) {
    const fresh = await hydrateConfigFromServer();
    webhookUrl = fresh.webhookUrl?.trim();
  }

  const candidateObj = payload.candidate;
  const effectiveCandidateId = payload.candidateId || candidateObj?.accessCode || candidateObj?.id || '';
  const effectiveInternalId = payload.candidateInternalRecordId || candidateObj?.id || 'N/A';
  const effectiveEmail = payload.email || candidateObj?.email || candidateObj?.formData?.personalEmail || '';
  const effectiveName = payload.name || candidateObj?.name || candidateObj?.formData?.fullName || '';
  const effectiveUploadedAt = payload.uploadedAt || new Date().toISOString();
  const effectiveDocType = payload.docType || payload.documentType;
  const effectiveFileUrl = payload.fileUrl || '';

  const fullPayload = {
    ...payload,
    docType: effectiveDocType,
    documentType: effectiveDocType,
    candidateInternalRecordId: effectiveInternalId,
    candidateId: effectiveCandidateId,
    email: effectiveEmail,
    name: effectiveName,
    fileUrl: effectiveFileUrl,
    uploadedAt: effectiveUploadedAt,
  };

  // [4_WEBHOOK_REQUEST]
  console.log(`[4_WEBHOOK_REQUEST] Candidate ID: ${effectiveCandidateId || effectiveInternalId || 'N/A'}, Email: ${effectiveEmail || 'N/A'}, Action: ${fullPayload.action}, DocType: ${effectiveDocType || 'N/A'}, Target URL: ${webhookUrl || '/api/sheets/webhook-sync'}, Payload:`, fullPayload);

  // 1. Try server-side proxy first (bypasses browser CORS & handles sheet verification)
  try {
    const proxyRes = await fetch('/api/sheets/webhook-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...fullPayload,
        webhookUrl: webhookUrl || undefined,
      }),
    });

    const contentType = proxyRes.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await proxyRes.json().catch(() => ({})) : {};

    // [5_WEBHOOK_RESPONSE]
    console.log(`[5_WEBHOOK_RESPONSE] Candidate ID: ${effectiveCandidateId || effectiveInternalId || 'N/A'}, Email: ${effectiveEmail || 'N/A'}, Status: ${proxyRes.status} ${proxyRes.statusText}, Result:`, data);

    const defaultTargetSheet = (effectiveDocType === 'aadhaar' || effectiveDocType === 'pan') ? 'Document Tracker' :
                               effectiveDocType === 'offer_letter' ? 'Offer Letters' : 'Candidate Master';

    if (proxyRes.ok && isJson && data && (data.success === true || data.sheetUpdated === true)) {
      return {
        success: true,
        sheetUpdated: true,
        sheetName: data.sheetName || defaultTargetSheet,
        rowNumber: data.rowNumber || 'Updated',
        data,
        diagnostics: data.diagnostics,
      };
    } else {
      console.warn('[Google Sheets] Server proxy returned non-success or non-JSON response, attempting direct client fetch fallback.', {
        status: proxyRes.status,
        contentType,
        data,
      });
    }
  } catch (proxyErr: any) {
    console.warn('[Google Sheets] Server proxy call exception, trying direct client fetch fallback:', proxyErr);
  }

  // 2. Direct client fetch fallback (if webhookUrl is available in client)
  if (webhookUrl) {
    try {
      console.info('[Google Sheets] Initiating direct fetch to Webhook URL:', webhookUrl);
      const directRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(fullPayload),
      });

      let resData: any = {};
      const resText = await directRes.text();
      try {
        resData = JSON.parse(resText);
      } catch {
        resData = { success: directRes.ok, raw: resText };
      }

      console.info('[Google Sheets Direct Webhook Response Diagnostic]', {
        httpStatus: directRes.status,
        responseBody: resData,
      });

      if (directRes.ok && (resData.success === true || resData.sheetUpdated === true)) {
        return {
          success: true,
          sheetUpdated: true,
          sheetName: effectiveDocType === 'offer_letter' ? 'Offer Letters' : 'Candidate Master',
          rowNumber: resData.rowNumber || resData.row || 'Updated',
          data: resData,
        };
      } else if (resData.success === false) {
        const errReason = resData.error || resData.message || resText || 'Google Apps Script webhook rejected update.';
        return {
          success: false,
          sheetUpdated: false,
          sheetName: effectiveDocType === 'offer_letter' ? 'Offer Letters' : 'Candidate Master',
          error: errReason,
          errorMessage: errReason,
        };
      }

      return {
        success: true,
        sheetUpdated: true,
        sheetName: effectiveDocType === 'offer_letter' ? 'Offer Letters' : 'Candidate Master',
        rowNumber: resData.rowNumber || resData.row || 'Updated',
        data: resData,
      };
    } catch (err: any) {
      console.warn('[Google Sheets] Direct webhook fetch error, trying no-cors fallback:', err);
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(fullPayload),
        });
        return {
          success: true,
          sheetUpdated: true,
          sheetName: 'Candidate Master',
          rowNumber: 'Updated (no-cors mode)',
          data: { success: true, mode: 'no-cors' },
        };
      } catch (noCorsErr: any) {
        return {
          success: false,
          sheetUpdated: false,
          error: err?.message || 'Failed to connect to Google Apps Script webhook.',
          errorMessage: err?.message || 'Failed to connect to Google Apps Script webhook.',
        };
      }
    }
  }

  return {
    success: false,
    sheetUpdated: false,
    error: 'Google Apps Script Webhook URL is not configured.',
    errorMessage: 'Google Apps Script Webhook URL is not configured. Please open HR Portal > Google Sheets Sync to connect your sheet.',
  };
}

/**
 * Initializes or verifies the Google Spreadsheet with safe health check
 */
export async function initializeGoogleSpreadsheet(
  customIdOrWebhook?: string
): Promise<{ success: boolean; spreadsheetId: string; spreadsheetUrl: string; errorMessage?: string }> {
  const activeWebhook =
    customIdOrWebhook?.startsWith('http')
      ? customIdOrWebhook
      : cachedConfig.webhookUrl;

  if (activeWebhook) {
    const res = await sendWebhookPayload({ action: 'ping' });
    if (res.success) {
      const resData = res.data || {};
      const spreadsheetId = resData.spreadsheetId || cachedConfig.spreadsheetId || 'new-pre-onboarding';
      const spreadsheetUrl = resData.spreadsheetUrl || cachedConfig.spreadsheetUrl || (spreadsheetId.startsWith('http') ? spreadsheetId : `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);

      const updated = saveGoogleSheetsConfig({
        webhookUrl: activeWebhook,
        spreadsheetId,
        spreadsheetUrl,
        syncMode: 'webhook',
        lastSyncedAt: new Date().toISOString(),
      });

      return {
        success: true,
        spreadsheetId: updated.spreadsheetId,
        spreadsheetUrl: updated.spreadsheetUrl,
      };
    } else {
      return {
        success: false,
        spreadsheetId: cachedConfig.spreadsheetId,
        spreadsheetUrl: cachedConfig.spreadsheetUrl,
        errorMessage: res.errorMessage || 'Failed to reach Apps Script Webhook. Make sure it is deployed as a Web app with access set to "Anyone".',
      };
    }
  }

  return {
    success: false,
    spreadsheetId: cachedConfig.spreadsheetId,
    spreadsheetUrl: cachedConfig.spreadsheetUrl,
    errorMessage: 'Please paste your Google Apps Script Web App URL from your Google Sheet.',
  };
}

/**
 * Safely upserts a single candidate's data across all 3 tabs (Candidate Master, Details & Documents, Personal & Interests).
 */
export async function syncCandidateToGoogleSheets(
  candidate: Candidate
): Promise<{ success: boolean; errorMessage?: string }> {
  if (!cachedConfig.autoSyncEnabled) {
    return { success: true };
  }

  // Construct complete 3-sheet mapped payload
  const fullPayload = buildCompleteCandidatePayload(candidate);

  // [3_SHEETS_PAYLOAD] verification logs
  console.log(`[3_SHEETS_PAYLOAD]
Candidate Master fields count: ${fullPayload.counts.candidateMaster}
Details & Documents fields count: ${fullPayload.counts.detailsDocuments}
Personal & Interests fields count: ${fullPayload.counts.personalInterests}`);

  console.log(`[3_SHEETS_PAYLOAD_MAPPING] Complete Candidate Payload Constructed for Webhook:`, {
    candidateId: fullPayload.candidateId,
    email: fullPayload.email,
    name: fullPayload.name,
    counts: fullPayload.counts,
    candidateMasterFields: Object.keys(fullPayload.candidateMasterData),
    detailsDocsFields: Object.keys(fullPayload.detailsDocsData),
    personalInterestsFields: Object.keys(fullPayload.personalInterestsData),
    candidateMasterData: fullPayload.candidateMasterData,
    detailsDocsData: fullPayload.detailsDocsData,
    personalInterestsData: fullPayload.personalInterestsData,
  });

  const res = await sendWebhookPayload(fullPayload);

  if (res.success) {
    saveGoogleSheetsConfig({ lastSyncedAt: new Date().toISOString() });
    return { success: true };
  } else {
    console.error('[Google Sheets Sync Error]:', res.errorMessage);
    return { success: false, errorMessage: res.errorMessage };
  }
}

/**
 * Safely syncs all candidates across all 7 sheets without clearing existing contents.
 */
export async function syncAllCandidatesToGoogleSheets(
  candidates: Candidate[]
): Promise<{ success: boolean; candidateCount?: number; lastSyncedAt?: string; errorMessage?: string }> {
  console.info(`[SYNC_ALL] Initiating syncAll for ${candidates.length} candidates.`);
  
  const sanitizedCandidates: Candidate[] = candidates.map(c => {
    return {
      ...c,
      formData: {
        ...(c.formData || {}),
        email: c.formData?.email || c.email || '',
        personalEmail: c.formData?.personalEmail || c.email || '',
        fullName: c.formData?.fullName || c.name || '',
      } as CandidateFormData
    };
  });

  const res = await sendWebhookPayload({
    action: 'syncAll',
    candidates: sanitizedCandidates,
  });

  if (res.success) {
    const now = new Date().toISOString();
    saveGoogleSheetsConfig({ lastSyncedAt: now });
    console.info(`[SYNC_ALL] Successfully synchronized ${candidates.length} candidates to Google Sheets.`);
    return {
      success: true,
      candidateCount: candidates.length,
      lastSyncedAt: now,
    };
  } else {
    console.error('[SYNC_ALL] Batch sync failed:', res.errorMessage);
    return {
      success: false,
      errorMessage: res.errorMessage || 'Failed to write to Google Sheet via Webhook.',
    };
  }
}

/**
 * Targeted single document update (Aadhaar, PAN, etc.)
 */
export async function syncDocumentUpdateToGoogleSheets(
  candidate: Candidate,
  docType: 'aadhaar' | 'pan' | string,
  fileUrl: string,
  uploadedAt?: string
): Promise<{ success: boolean; errorMessage?: string }> {
  const timestamp = uploadedAt || new Date().toISOString();

  const res = await sendWebhookPayload({
    action: 'updateDocument',
    docType,
    fileUrl,
    uploadedAt: timestamp,
    candidate,
  });

  if (res.success) {
    saveGoogleSheetsConfig({ lastSyncedAt: new Date().toISOString() });
    return { success: true };
  } else {
    console.error(`[Google Sheets Doc Update Error for ${docType}]:`, res.errorMessage);
    return { success: false, errorMessage: res.errorMessage };
  }
}

/**
 * Synchronizes a document upload event (Aadhaar, PAN, etc.)
 * First updates specific document via updateDocument, then syncs full candidate record.
 */
export async function syncDocumentAndCandidate(
  candidate: Candidate,
  docType: 'aadhaar' | 'pan' | string,
  fileUrl: string,
  uploadedAt?: string
): Promise<{ success: boolean; errorMessage?: string; diagnostics?: any }> {
  const timestamp = uploadedAt || new Date().toISOString();

  // 1. Send targeted document update
  const docRes = await sendWebhookPayload({
    action: 'updateDocument',
    docType,
    fileUrl,
    uploadedAt: timestamp,
    candidate,
  });

  if (!docRes.success) {
    console.error(`[POST_UPLOAD_SYNC] Targeted doc update failed for ${docType}:`, docRes.errorMessage);
    return {
      success: false,
      errorMessage: docRes.errorMessage || `Failed to sync ${docType} to Google Sheets.`,
      diagnostics: docRes.diagnostics,
    };
  }

  // 2. Synchronize master candidate record across all tabs
  const enrichedCandidateForFullSync: Candidate = {
    ...candidate,
    formData: {
      ...(candidate.formData || {}),
      email: candidate.formData?.email || candidate.email || '',
      personalEmail: candidate.formData?.personalEmail || candidate.email || '',
      fullName: candidate.formData?.fullName || candidate.name || '',
    } as CandidateFormData
  };

  const fullRes = await sendWebhookPayload({
    action: 'syncCandidate',
    candidate: enrichedCandidateForFullSync,
    fileUrl,
    docType,
    documentType: docType,
    uploadedAt: timestamp,
  });

  if (!fullRes.success) {
    console.warn('[POST_UPLOAD_SYNC] Candidate master update had non-fatal warning:', fullRes.errorMessage);
  }

  saveGoogleSheetsConfig({ lastSyncedAt: new Date().toISOString() });
  return { success: true, diagnostics: fullRes.diagnostics || docRes.diagnostics };
}

