import { AMMO_PREREAD_URL, FIELDASSIST_LINKS } from '../constants/links';

export interface EmailSettings {
  ammoPrereadUrl: string;
  newsletterUrl: string;
  linkedinUrl: string;
  instagramUrl: string;
  pathfinderVideoUrl: string;
  ambitionBoxUrl: string;
  glassdoorUrl: string;
}

const STORAGE_KEY = 'fieldassist_email_settings_v1';

export const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  ammoPrereadUrl: AMMO_PREREAD_URL,
  newsletterUrl: FIELDASSIST_LINKS.newsletter,
  linkedinUrl: FIELDASSIST_LINKS.linkedin,
  instagramUrl: FIELDASSIST_LINKS.instagram,
  pathfinderVideoUrl: FIELDASSIST_LINKS.youtube,
  ambitionBoxUrl: FIELDASSIST_LINKS.ambitionBox,
  glassdoorUrl: FIELDASSIST_LINKS.glassdoor
};

export function getEmailSettings(): EmailSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_EMAIL_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error reading email settings:', e);
  }
  return { ...DEFAULT_EMAIL_SETTINGS };
}

export function saveEmailSettings(settings: EmailSettings): EmailSettings {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving email settings:', e);
  }
  return settings;
}
