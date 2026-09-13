import { Candidate, EmailStageKey, EmailStageLog } from '../types';
import { EMAIL_TEMPLATES, extractFirstName, calculateTargetDate } from './emailTemplates';
import { getCandidateById, saveCandidate } from './candidateStorage';

/**
 * Creates a formatted Gmail Web Compose URL (mail.google.com/mail/?view=cm)
 * Opens directly in Gmail with to, subject, and body prefilled.
 */
export function buildGmailComposeUrl(options: {
  toEmail: string;
  subject: string;
  bodyText: string;
}): string {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: options.toEmail,
    su: options.subject,
    body: options.bodyText,
  });

  return `https://mail.google.com/mail/?${params.toString()}`;
}

/**
 * Opens Gmail compose in a new tab for a specific stage
 */
export function openGmailComposeForCandidate(candidateId: string, stageKey: EmailStageKey): { success: boolean; url: string } {
  const candidate = getCandidateById(candidateId);
  if (!candidate) {
    throw new Error('Candidate not found');
  }

  const template = EMAIL_TEMPLATES[stageKey];
  if (!template) {
    throw new Error(`Invalid stage template: ${stageKey}`);
  }

  const firstName = extractFirstName(candidate.name);
  const bodyText = template.getBodyText(firstName, candidate);
  const subject = template.subject;

  const url = buildGmailComposeUrl({
    toEmail: candidate.email,
    subject,
    bodyText,
  });

  // Open Gmail web client
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // Record that HR prepared/opened this in Gmail
  const nowIso = new Date().toISOString();
  const existingLog = candidate.emailAutomation?.stages?.[stageKey];
  const targetDate = calculateTargetDate(candidate.joiningDate, template.daysBeforeJoining);

  const updatedLog: EmailStageLog = {
    id: existingLog?.id || `email-${candidate.id}-${stageKey}`,
    stageKey,
    stageName: template.stageName,
    daysBeforeJoining: template.daysBeforeJoining,
    targetDate,
    recipientEmail: candidate.email,
    recipientName: candidate.name,
    subject,
    status: 'Sent',
    sentAt: nowIso,
    triggeredBy: 'hr_manual',
    provider: 'Gmail Compose (Google Workspace)',
    logs: [
      ...(existingLog?.logs || []),
      `[${new Date(nowIso).toLocaleTimeString()}] Opened in Gmail Compose for direct Workspace dispatch`
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

  return { success: true, url };
}

/**
 * Manually marks a stage as sent (e.g. after HR sends via Gmail or external client)
 */
export function markStageAsSentManually(
  candidateId: string,
  stageKey: EmailStageKey,
  providerName: string = 'Gmail Compose (Google Workspace)'
): Candidate {
  const candidate = getCandidateById(candidateId);
  if (!candidate) {
    throw new Error('Candidate not found');
  }

  const template = EMAIL_TEMPLATES[stageKey];
  const targetDate = calculateTargetDate(candidate.joiningDate, template?.daysBeforeJoining || 0);
  const nowIso = new Date().toISOString();
  const existingLog = candidate.emailAutomation?.stages?.[stageKey];

  const updatedLog: EmailStageLog = {
    id: existingLog?.id || `email-${candidate.id}-${stageKey}`,
    stageKey,
    stageName: template?.stageName || stageKey,
    daysBeforeJoining: template?.daysBeforeJoining || 0,
    targetDate,
    recipientEmail: candidate.email,
    recipientName: candidate.name,
    subject: template?.subject || 'Pre-Onboarding Communication',
    status: 'Sent',
    sentAt: nowIso,
    triggeredBy: 'hr_manual',
    provider: providerName,
    logs: [
      ...(existingLog?.logs || []),
      `[${new Date(nowIso).toLocaleTimeString()}] Sent via ${providerName}`
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
  return updatedCandidate;
}

/**
 * Creates a mailto link fallback
 */
export function buildMailtoUrl(options: {
  toEmail: string;
  subject: string;
  bodyText: string;
}): string {
  return `mailto:${encodeURIComponent(options.toEmail)}?subject=${encodeURIComponent(options.subject)}&body=${encodeURIComponent(options.bodyText)}`;
}
