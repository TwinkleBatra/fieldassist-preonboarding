import { MASTER_LOCATIONS, findLocationById, MasterLocation } from '../config/locations';

export interface TimeZoneConversionResult {
  localTimeFormatted: string; // e.g. "11:00 AM"
  localTzAbbr: string;       // e.g. "GST"
  localTzOffset: string;     // e.g. "UTC+4"
  istTimeFormatted: string;   // e.g. "12:30 PM"
  istFullLabel: string;      // e.g. "12:30 PM IST"
  hrHelperLine: string;      // e.g. "11:00 AM Dubai (GST) = 12:30 PM IST"
  tableBadgeText: string;    // e.g. "11:00 AM GST | 12:30 PM IST"
  portalTimeBadge: string;   // e.g. "11:00 AM (GST, Dubai)"
  isIndia: boolean;
}

export function parseTimeToHourMinute(timeStr?: string): { hour: number; minute: number } {
  if (!timeStr) return { hour: 11, minute: 0 };
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return { hour: 11, minute: 0 };
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const meridian = match[3]?.toUpperCase();
  if (meridian === 'PM' && hour < 12) hour += 12;
  if (meridian === 'AM' && hour === 12) hour = 0;
  return { hour, minute };
}

/**
 * Given a local clock time (e.g. "11:00 AM"), a date string (YYYY-MM-DD),
 * and an IANA time zone (e.g. "Asia/Dubai"), returns full conversion to IST and labels.
 */
export function getZonedTimeDetails(
  timeStr: string = '11:00 AM',
  dateStr?: string,
  ianaTimeZone: string = 'Asia/Kolkata',
  locationLabel?: string
): TimeZoneConversionResult {
  const { hour, minute } = parseTimeToHourMinute(timeStr);
  const cleanDate = dateStr?.split('T')[0] || new Date().toISOString().split('T')[0];
  const parts = cleanDate.split('-');
  const y = parseInt(parts[0], 10) || 2026;
  const m = parseInt(parts[1], 10) || 10;
  const d = parseInt(parts[2], 10) || 5;

  // Resolve matched MasterLocation for preferred standard abbreviation
  const matchedLoc = MASTER_LOCATIONS.find(l => l.ianaTimeZone === ianaTimeZone);
  let localTzAbbr = matchedLoc?.tzAbbreviation;

  // Construct nominal instant and convert using Intl.DateTimeFormat
  let istFormatted = '11:00 AM';
  let localTzOffset = 'UTC+5:30';

  try {
    const nominalUtc = new Date(Date.UTC(y, m - 1, d, hour, minute, 0));
    const tzParts = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaTimeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    }).formatToParts(nominalUtc);

    const getPart = (type: string) => parseInt(tzParts.find(p => p.type === type)?.value || '0', 10);
    let tzHour = getPart('hour');
    if (tzHour === 24) tzHour = 0;
    const tzDateAsUtc = Date.UTC(getPart('year'), getPart('month') - 1, getPart('day'), tzHour, getPart('minute'), 0);
    const exactInstant = new Date(nominalUtc.getTime() + (nominalUtc.getTime() - tzDateAsUtc));

    // Convert exact instant to IST
    const istFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    istFormatted = istFormatter.format(exactInstant);

    // Get offset label (e.g. UTC+4)
    const offsetParts = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaTimeZone,
      timeZoneName: 'shortOffset'
    }).formatToParts(exactInstant);
    const rawOffset = offsetParts.find(p => p.type === 'timeZoneName')?.value;
    if (rawOffset) {
      localTzOffset = rawOffset.replace('GMT', 'UTC');
    }

    if (!localTzAbbr) {
      const shortParts = new Intl.DateTimeFormat('en-US', {
        timeZone: ianaTimeZone,
        timeZoneName: 'short'
      }).formatToParts(exactInstant);
      localTzAbbr = shortParts.find(p => p.type === 'timeZoneName')?.value || 'Local';
    }
  } catch {
    istFormatted = timeStr;
    if (!localTzAbbr) localTzAbbr = 'IST';
  }

  const isIndia = ianaTimeZone === 'Asia/Kolkata';
  const cityName = matchedLoc?.city || locationLabel || (isIndia ? 'India' : 'Local');

  // Local time formatted (normalize "11:00 am" -> "11:00 AM")
  const localTimeFormatted = `${String(hour > 12 ? hour - 12 : hour === 0 ? 12 : hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;

  // Helper line for HR modal: "11:00 AM Dubai (GST) = 12:30 PM IST"
  const hrHelperLine = isIndia 
    ? `${localTimeFormatted} IST (Indian Standard Time)`
    : `${localTimeFormatted} ${cityName} (${localTzAbbr}) = ${istFormatted} IST`;

  // Table badge: "11:00 AM GST | 12:30 PM IST" or "11:00 AM IST"
  const tableBadgeText = isIndia
    ? `${localTimeFormatted} IST`
    : `${localTimeFormatted} ${localTzAbbr} | ${istFormatted} IST`;

  // Candidate portal badge: "11:00 AM (GST, Dubai)" or "11:00 AM (IST)"
  const portalTimeBadge = isIndia
    ? `${localTimeFormatted} (IST)`
    : `${localTimeFormatted} (${localTzAbbr}, ${cityName})`;

  return {
    localTimeFormatted,
    localTzAbbr: localTzAbbr || 'IST',
    localTzOffset,
    istTimeFormatted: istFormatted,
    istFullLabel: `${istFormatted} IST`,
    hrHelperLine,
    tableBadgeText,
    portalTimeBadge,
    isIndia
  };
}

/**
 * Calculates days and hours remaining until 11:00 AM in the candidate's local time zone.
 */
export function getLocalZonedCountdown(joiningDateStr?: string, timeStr: string = '11:00 AM', ianaTimeZone: string = 'Asia/Kolkata'): {
  daysLeft: number;
  isToday: boolean;
  isPast: boolean;
} {
  if (!joiningDateStr) return { daysLeft: 0, isToday: false, isPast: false };

  try {
    const { hour, minute } = parseTimeToHourMinute(timeStr);
    const cleanDate = joiningDateStr.split('T')[0];
    const [y, m, d] = cleanDate.split('-').map(Number);

    // Exact instant of 11:00 AM in candidate's timezone
    const nominalUtc = new Date(Date.UTC(y, m - 1, d, hour, minute, 0));
    const tzParts = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaTimeZone,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false
    }).formatToParts(nominalUtc);

    const getPart = (type: string) => parseInt(tzParts.find(p => p.type === type)?.value || '0', 10);
    let tzHour = getPart('hour');
    if (tzHour === 24) tzHour = 0;
    const tzDateAsUtc = Date.UTC(getPart('year'), getPart('month') - 1, getPart('day'), tzHour, getPart('minute'), 0);
    const exactTargetInstant = new Date(nominalUtc.getTime() + (nominalUtc.getTime() - tzDateAsUtc));

    const now = new Date();
    const diffMs = exactTargetInstant.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return {
      daysLeft: Math.max(0, diffDays),
      isToday: diffDays === 0,
      isPast: diffMs < 0
    };
  } catch {
    return { daysLeft: 0, isToday: false, isPast: false };
  }
}
