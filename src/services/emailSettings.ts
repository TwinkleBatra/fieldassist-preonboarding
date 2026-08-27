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
  ammoPrereadUrl: 'https://www.fieldassist.com/ammo-preread',
  newsletterUrl: 'https://www.fieldassist.com/newsletter',
  linkedinUrl: 'https://www.linkedin.com/company/fieldassist',
  instagramUrl: 'https://www.instagram.com/fieldassist/',
  pathfinderVideoUrl: 'https://www.youtube.com/@FieldAssist',
  ambitionBoxUrl: 'https://www.ambitionbox.com/reviews/fieldassist-reviews',
  glassdoorUrl: 'https://www.glassdoor.co.in/Reviews/FieldAssist-Reviews-E1204893.htm'
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
