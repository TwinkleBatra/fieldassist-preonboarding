/**
 * Text formatting and capitalization utilities.
 */

/**
 * Converts a name or string into Title Case regardless of how it is stored.
 * Handles single names, multi-word names, hyphenated names, and trims extra spaces.
 * 
 * Examples:
 *   "twinkle" -> "Twinkle"
 *   "twinkle verma" -> "Twinkle Verma"
 *   "RAHUL SHARMA" -> "Rahul Sharma"
 *   "mary-jane watson" -> "Mary-Jane Watson"
 *   "o'connor" -> "O'Connor"
 */
export function toTitleCase(str?: string | null): string {
  if (!str || typeof str !== 'string') return '';
  const trimmed = str.trim();
  if (!trimmed) return '';

  return trimmed
    .split(/\s+/)
    .map(word => {
      // Handle hyphenated names like "Mary-Jane"
      return word
        .split('-')
        .map(part => {
          if (!part) return '';
          // Handle apostrophes like "O'Connor" or "D'Angelo"
          if (part.includes("'")) {
            return part
              .split("'")
              .map(sub => (sub ? sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase() : ''))
              .join("'");
          }
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        })
        .join('-');
    })
    .join(' ');
}

/**
 * Safely extracts the first name in Title Case.
 */
export function getFirstName(fullName?: string | null, fallback = 'Team Member'): string {
  if (!fullName || typeof fullName !== 'string') return fallback;
  const titled = toTitleCase(fullName);
  const first = titled.split(' ')[0];
  return first || fallback;
}
