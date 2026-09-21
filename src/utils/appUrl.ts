export const PRODUCTION_APP_URL =
  (typeof process !== 'undefined' && process.env?.APP_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_APP_URL) ||
  'https://fieldassist-preonboarding.vercel.app';

/**
 * Returns the effective base URL for candidate links.
 * When accessed from a deployed domain (such as Vercel), it uses that domain.
 * When running inside a local dev server or preview sandbox, it defaults to the production Vercel app URL.
 */
export function getAppBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const isSandboxOrLocal =
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('ais-dev-') ||
      origin.includes('ais-pre-');
    if (!isSandboxOrLocal && origin.startsWith('http')) {
      return origin;
    }
  }
  return PRODUCTION_APP_URL;
}

/**
 * Generates the candidate onboarding portal link with their unique access code.
 * Format: https://fieldassist-preonboarding.vercel.app/?code=FA-XXXX
 */
export function getCandidateAccessUrl(accessCode: string, origin?: string): string {
  const base = (origin || getAppBaseUrl()).replace(/\/+$/, '');
  const cleanCode = (accessCode || '').trim();
  if (!cleanCode) {
    return base;
  }
  return `${base}/?code=${encodeURIComponent(cleanCode)}`;
}
