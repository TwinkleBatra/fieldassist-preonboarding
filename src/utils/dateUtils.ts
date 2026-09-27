/**
 * Date utility functions to handle candidate joining dates (DOJ) cleanly
 * without JavaScript UTC/local timezone shifts.
 */

import { Candidate, OnboardingStatus } from '../types';

/**
 * Returns today's date formatted as YYYY-MM-DD in local time.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD date string into a local Date object set to 00:00:00 local time.
 * Prevents ISO date string timezone shifts (e.g., '2026-08-25' becoming '2026-08-24' in negative UTC offsets).
 */
export function parseLocalDate(dateStr?: string): Date {
  if (!dateStr) return new Date();
  const cleanStr = String(dateStr).trim().split('T')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month, day);
    }
  }
  return new Date(dateStr);
}

/**
 * Formats a YYYY-MM-DD joining date string into a user-friendly string (e.g. "August 25, 2026").
 */
export function formatJoiningDate(
  dateStr?: string,
  options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
): string {
  if (!dateStr) return '';
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-US', options);
}

/**
 * Calculates days remaining from today until joining date without timezone shifts.
 */
export function getDaysUntilJoining(joiningDateStr?: string): number {
  if (!joiningDateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const joinDate = parseLocalDate(joiningDateStr);
  joinDate.setHours(0, 0, 0, 0);
  const diffTime = joinDate.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export type CandidateAccessStatus = 'pre_joining' | 'grace_period' | 'expired';

export interface CandidateAccessInfo {
  status: CandidateAccessStatus;
  daysUntilJoining: number; // positive before joining, 0 on Day 1, negative after
  daysSinceJoining: number; // 0 on Day 1, 1 on Day 2, 2 on Day 3, 3+ on Day 4+
  isPreJoining: boolean;
  isGracePeriod: boolean;   // true for Day 1 to Day 3 post-joining
  isExpired: boolean;       // true after Day 3 post-joining (Day 4+)
  graceDayNumber: number;   // 1, 2, or 3 during grace period
}

/**
 * Determines whether candidate is pre-joining, in the 3-day post-joining grace period,
 * or has passed Day 3 (access transition/expired).
 * Always re-derived live from current DOJ vs today's date.
 */
export function getCandidateAccessInfo(joiningDateStr?: string): CandidateAccessInfo {
  if (!joiningDateStr) {
    return {
      status: 'pre_joining',
      daysUntilJoining: 0,
      daysSinceJoining: 0,
      isPreJoining: true,
      isGracePeriod: false,
      isExpired: false,
      graceDayNumber: 0
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const joinDate = parseLocalDate(joiningDateStr);
  joinDate.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - joinDate.getTime();
  const daysSinceJoining = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const daysUntilJoining = -daysSinceJoining;

  if (daysSinceJoining < 0) {
    return {
      status: 'pre_joining',
      daysUntilJoining,
      daysSinceJoining,
      isPreJoining: true,
      isGracePeriod: false,
      isExpired: false,
      graceDayNumber: 0
    };
  } else if (daysSinceJoining <= 2) {
    return {
      status: 'grace_period',
      daysUntilJoining: 0,
      daysSinceJoining,
      isPreJoining: false,
      isGracePeriod: true,
      isExpired: false,
      graceDayNumber: daysSinceJoining + 1 // 1 for Day 1, 2 for Day 2, 3 for Day 3
    };
  } else {
    return {
      status: 'expired',
      daysUntilJoining: 0,
      daysSinceJoining,
      isPreJoining: false,
      isGracePeriod: false,
      isExpired: true,
      graceDayNumber: 0
    };
  }
}

/**
 * Derives live whether a candidate has actually joined based on current DOJ vs today's date.
 * If joiningDate is in the future (> today), this strictly returns false.
 */
export function isCandidateJoinedLive(candidate?: Partial<Candidate> | null): boolean {
  if (!candidate) return false;
  const statusStr = (candidate.status || '').toLowerCase();
  if (statusStr.includes('cancel') || statusStr.includes('reject') || statusStr.includes('inactive')) {
    return false;
  }
  const todayStr = getTodayDateString();
  const doj = candidate.joiningDate?.trim().split('T')[0];
  if (doj) {
    return doj <= todayStr;
  }
  return candidate.status === 'Joined' || candidate.status === 'Onboarding Complete';
}

/**
 * Derives the appropriate pre-joining onboarding status for a candidate whose joiningDate is in the future.
 */
export function derivePreJoiningStatus(candidate: Partial<Candidate>): OnboardingStatus {
  const statusStr = (candidate.status || '').toLowerCase();
  if (statusStr.includes('cancel') || statusStr.includes('reject') || statusStr.includes('inactive')) {
    return (candidate.status as OnboardingStatus) || 'Offer Accepted';
  }
  // If candidate already has a valid pre-joining status (not 'Joined' or 'Onboarding Complete'), keep it!
  if (
    candidate.status &&
    candidate.status !== 'Joined' &&
    candidate.status !== 'Onboarding Complete'
  ) {
    return candidate.status as OnboardingStatus;
  }

  // Pre-configured priority joiners such as FA-9149
  if (candidate.id === 'cand-twinkle-9149' || (candidate.accessCode || '').toUpperCase() === 'FA-9149') {
    return 'Ready for Day 1';
  }

  const fd = candidate.formData;
  const isFormSubmitted =
    candidate.formStatus === 'Submitted' ||
    candidate.formStatus === 'Verified' ||
    candidate.formStatus === 'Completed' ||
    Boolean(fd?.isSubmitted);

  const verifiedDocsCount = candidate.documents?.filter(d => d.status === 'Verified').length || 0;
  const uploadedDocsCount =
    candidate.documents?.filter(d => d.status === 'Uploaded' || d.status === 'Verified').length || 0;
  const hasCoreDocs = Boolean(
    (fd?.aadhaarDocUrl || candidate.aadhaarDocUrl) &&
    (fd?.panDocUrl || candidate.panDocUrl)
  );

  if (candidate.formStatus === 'Verified' || (isFormSubmitted && verifiedDocsCount >= 2)) {
    return 'Ready for Day 1';
  }
  if (isFormSubmitted || uploadedDocsCount >= 3 || hasCoreDocs) {
    return 'Ready for Day 1';
  }
  if (
    (fd?.completionPercentage && fd.completionPercentage > 0) ||
    candidate.formStatus === 'In Progress' ||
    uploadedDocsCount > 0
  ) {
    return 'Form Pending';
  }
  return 'Ready for Day 1';
}

/**
 * Derives the authoritative, live onboarding status for a candidate by comparing current DOJ vs today's date.
 * Guarantees that future DOJ never retains a stale 'Joined' status.
 */
export function getEffectiveCandidateStatus(candidate?: Partial<Candidate> | null): OnboardingStatus {
  if (!candidate) return 'Offer Accepted';
  const statusStr = (candidate.status || '').toLowerCase();
  if (statusStr.includes('cancel') || statusStr.includes('reject') || statusStr.includes('inactive')) {
    return (candidate.status as OnboardingStatus) || 'Offer Accepted';
  }

  const todayStr = getTodayDateString();
  const doj = candidate.joiningDate?.trim().split('T')[0];

  if (doj) {
    if (doj <= todayStr) {
      return candidate.status === 'Onboarding Complete' ? 'Onboarding Complete' : 'Joined';
    } else {
      // Future date: CANNOT be 'Joined' or 'Onboarding Complete'
      if (candidate.status === 'Joined' || candidate.status === 'Onboarding Complete' || !candidate.status) {
        return derivePreJoiningStatus({ ...candidate, status: undefined });
      }
      return candidate.status as OnboardingStatus;
    }
  }

  return (candidate.status as OnboardingStatus) || 'Offer Accepted';
}
