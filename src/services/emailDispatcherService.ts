import { Candidate, EmailStageKey, EmailStageLog } from '../types';
import { EMAIL_TEMPLATES, extractFirstName, calculateTargetDate } from './emailTemplates';
import { getCandidates, saveCandidate, getCandidateById } from './candidateStorage';

export interface EmailDispatchResult {
  success: boolean;
  message: string;
  candidate?: Candidate;
  stageLog?: EmailStageLog;
  provider: string;
}

/**
 * Check if candidate is active and eligible for email sending
 */
export function isCandidateActive(candidate: Candidate): boolean {
  if (!candidate) return false;
  const statusLower = (candidate.status || '').toLowerCase();
  if (statusLower.includes('cancel') || statusLower.includes('inactive') || statusLower.includes('reject')) {
    return false;
  }
  return true;
}

/**
 * Dispatches an email stage for a candidate via the server API provider.
 * Requires an active email provider API key (Resend or SMTP). Returns explicit failure if unconfigured.
 */
export async function dispatchCandidateEmail(
  candidateId: string,
  stageKey: EmailStageKey,
  options: {
    forceResend?: boolean;
    isTestSimulation?: boolean;
    triggeredBy?: 'automated_cron' | 'hr_manual' | 'test_simulation';
  } = {}
): Promise<EmailDispatchResult> {
  const candidate = getCandidateById(candidateId);
  if (!candidate) {
    throw new Error('Candidate not found');
  }

  if (!isCandidateActive(candidate)) {
    throw new Error(`Email sending blocked: Candidate status is '${candidate.status}' (Inactive/Cancelled)`);
  }

  const template = EMAIL_TEMPLATES[stageKey];
  if (!template) {
    throw new Error(`Unknown email template stage: ${stageKey}`);
  }

  const currentStages = candidate.emailAutomation?.stages || {};
  const existingLog = currentStages[stageKey];

  // Prevent duplicate sending unless forceResend is true
  if (existingLog && existingLog.status === 'Sent' && !options.forceResend) {
    return {
      success: false,
      message: `Email stage "${template.stageName}" was already sent on ${existingLog.sentAt ? new Date(existingLog.sentAt).toLocaleString() : 'earlier date'}. Confirm Resend to send again.`,
      candidate,
      stageLog: existingLog,
      provider: existingLog.provider || 'System'
    };
  }

  const firstName = extractFirstName(candidate.name);
  const targetDate = calculateTargetDate(candidate.joiningDate, template.daysBeforeJoining);
  const emailSubject = template.subject;

  // Contact Server API Endpoint
  let serverResponse: any = null;
  let usedServerApi = false;
  let errorMessage: string | undefined = undefined;

  try {
    const res = await fetch('/api/emails/send-manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId,
        stageKey,
        forceResend: options.forceResend,
        isTestSimulation: options.isTestSimulation,
        triggeredBy: options.triggeredBy || 'hr_manual',
        candidateData: candidate
      })
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      const text = await res.text().catch(() => '');
      if (res.status === 404 || text.includes('The page could not be found')) {
        errorMessage = 'Vercel 404: The email API routes (/api/emails/*) are not deployed on Vercel yet. Please redeploy your latest changes on Vercel.';
      } else {
        errorMessage = `Email dispatch failed (HTTP ${res.status}): ${text.slice(0, 120)}`;
      }
    } else {
      const data = await res.json().catch(() => ({}));
      serverResponse = data;
      usedServerApi = true;
    }
  } catch (err: any) {
    console.warn('Server API call for email send failed:', err);
    errorMessage = err.message || 'Unable to reach email service';
  }

  let providerNote = 'None Configured';
  let success = false;

  if (usedServerApi && serverResponse) {
    providerNote = serverResponse.provider || providerNote;
    success = !!serverResponse.success;
    errorMessage = serverResponse.errorMessage;
  }

  const nowIso = new Date().toISOString();
  const triggerLabel = options.isTestSimulation
    ? 'Manual Test Simulation'
    : options.triggeredBy === 'automated_cron'
      ? 'Automated 7/5/3/1 Day Scheduler'
      : 'HR Manual Send';

  const updatedLog: EmailStageLog = {
    id: existingLog?.id || `email-${candidate.id}-${stageKey}`,
    stageKey,
    stageName: template.stageName,
    daysBeforeJoining: template.daysBeforeJoining,
    targetDate,
    recipientEmail: candidate.email,
    recipientName: candidate.name,
    subject: emailSubject,
    status: success ? 'Sent' : 'Failed',
    sentAt: success ? nowIso : existingLog?.sentAt,
    errorMessage: success ? undefined : errorMessage,
    triggeredBy: options.triggeredBy || (options.isTestSimulation ? 'test_simulation' : 'hr_manual'),
    provider: providerNote,
    logs: [
      ...(existingLog?.logs || []),
      `[${new Date(nowIso).toLocaleTimeString()}] ${triggerLabel} - ${success ? 'Sent successfully' : 'Failed'}: ${success ? providerNote : errorMessage}`
    ]
  };

  const updatedCandidate: Candidate = {
    ...candidate,
    emailAutomation: {
      stages: {
        ...(candidate.emailAutomation?.stages || {}),
        [stageKey]: updatedLog
      } as Record<EmailStageKey, EmailStageLog>,
      lastEvaluatedAt: nowIso
    }
  };

  saveCandidate(updatedCandidate);

  const resultMsg = success
    ? `Email sent successfully to ${candidate.email}`
    : `Email failed: ${errorMessage || 'Unknown error'}`;

  return {
    success,
    message: resultMsg,
    candidate: updatedCandidate,
    stageLog: updatedLog,
    provider: providerNote
  };
}

/**
 * Sends a test email to an arbitrary recipient address.
 */
export async function sendTestEmailToCustomRecipient(
  candidateId: string,
  stageKey: EmailStageKey,
  testRecipientEmail: string
): Promise<EmailDispatchResult> {
  const candidate = getCandidateById(candidateId);
  if (!candidate) {
    throw new Error('Candidate not found');
  }

  const template = EMAIL_TEMPLATES[stageKey];
  if (!template) {
    throw new Error(`Unknown email stage: ${stageKey}`);
  }

  let providerNote = 'None Configured';
  let success = false;
  let errorMessage: string | undefined = 'No email provider API key configured or server API call failed.';

  try {
    const res = await fetch('/api/emails/send-manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId,
        stageKey,
        forceResend: true,
        isTestSimulation: true,
        triggeredBy: 'test_simulation',
        candidateData: {
          ...candidate,
          email: testRecipientEmail
        }
      })
    });

    const data = await res.json().catch(() => ({}));
    providerNote = data.provider || providerNote;
    success = !!data.success;
    errorMessage = data.errorMessage || (!res.ok ? `HTTP ${res.status}` : undefined);
  } catch (err: any) {
    console.warn('Server test call failed:', err);
    errorMessage = err.message || 'Server connection error';
  }

  const resultMsg = success
    ? `Email sent successfully to ${testRecipientEmail}`
    : `Email failed: ${errorMessage || 'Unknown error'}`;

  return {
    success,
    message: resultMsg,
    provider: providerNote
  };
}

/**
 * Runs automated evaluation for all candidates across 7d, 5d, 3d, 1d stages.
 */
export async function processAllScheduledCandidateEmails(): Promise<{
  processedCount: number;
  sentCount: number;
  skippedCount: number;
  details: string[];
}> {
  const candidates = getCandidates();
  const todayStr = new Date().toISOString().split('T')[0];
  const stages: EmailStageKey[] = ['welcome_7d', 'culture_5d', 'comm_3d', 'day1_1d'];

  let sentCount = 0;
  let skippedCount = 0;
  const details: string[] = [];

  for (const candidate of candidates) {
    if (!isCandidateActive(candidate)) {
      skippedCount++;
      continue;
    }

    for (const stageKey of stages) {
      const template = EMAIL_TEMPLATES[stageKey];
      const targetDate = calculateTargetDate(candidate.joiningDate, template.daysBeforeJoining);
      const existingLog = candidate.emailAutomation?.stages?.[stageKey];

      if (todayStr === targetDate && (!existingLog || existingLog.status === 'Pending')) {
        try {
          const res = await dispatchCandidateEmail(candidate.id, stageKey, {
            triggeredBy: 'automated_cron'
          });
          if (res.success) {
            sentCount++;
            details.push(`[${candidate.name}] Sent ${stageKey} (Scheduled for ${targetDate})`);
          } else {
            details.push(`[${candidate.name}] Failed ${stageKey}: ${res.message}`);
          }
        } catch (err: any) {
          details.push(`[${candidate.name}] Error ${stageKey}: ${err.message}`);
        }
      } else {
        skippedCount++;
      }
    }
  }

  return {
    processedCount: candidates.length,
    sentCount,
    skippedCount,
    details
  };
}
