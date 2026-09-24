/**
 * HR Authentication and Authorization Helpers
 * FieldAssist / Flick2Know Technologies
 */

export const APPROVED_HR_DOMAINS = [
  'flick2know.com',
  'fieldassist.in',
  'fieldassist.com'
];

export const APPROVED_HR_EMAILS = [
  'twinkle.verma@flick2know.com',
  'megha.r@fieldassist.in',
  'anand.k@fieldassist.in',
  'pooja.k@fieldassist.in'
];

/**
 * Validates whether an email belongs to an authorized HR administrator.
 * Only @flick2know.com, approved FieldAssist corporate domains, and explicit HR emails are allowed.
 */
export function isApprovedHREmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();

  // 1. Explicitly approved HR emails
  if (APPROVED_HR_EMAILS.map(e => e.toLowerCase()).includes(normalized)) {
    return true;
  }

  // 2. Approved organizational corporate domains
  const domain = normalized.split('@')[1];
  if (domain && APPROVED_HR_DOMAINS.includes(domain)) {
    return true;
  }

  return false;
}
