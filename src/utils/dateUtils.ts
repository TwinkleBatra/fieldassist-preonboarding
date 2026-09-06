/**
 * Date utility functions to handle candidate joining dates (DOJ) cleanly
 * without JavaScript UTC/local timezone shifts.
 */

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
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
  const daysSinceJoining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
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
