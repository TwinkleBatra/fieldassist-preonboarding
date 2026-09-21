import { EmailTemplateDoc, LinksSettingsDoc } from '../types';
import {
  fetchLinksFromFirestore,
  saveLinksToFirestore,
  fetchEmailTemplatesFromFirestore,
  saveEmailTemplateToFirestore,
} from '../lib/firebase';

// Initial Approved Links as specified by User (stored in settings/links)
export const INITIAL_APPROVED_LINKS: LinksSettingsDoc = {
  ammoPreread: '', // Missing URL: Leave empty so visible TODO is rendered
  voicesFromInside: 'https://www.linkedin.com/posts/fieldassist_life-at-fieldassist-activity-7237014084339052546-C9gs',
  goaHighlights: 'https://www.instagram.com/reel/DLXVelNv9h5/',
  newsletter: 'https://www.linkedin.com/newsletters/rtm-ascent-7084850954738483200/',
  linkedinPage: 'https://www.linkedin.com/company/fieldassist/',
  instagram: 'https://www.instagram.com/fieldassist/',
  pathfinderVideo: 'https://www.youtube.com/watch?v=zsWXyzPxXBs',
  ambitionBox: 'https://www.ambitionbox.com/contribute/interview-story?campaign=membership_reviews&index=0&referrer=https%3A%2F%2Fwww.ambitionbox.com%2Freviews%2Ffieldassist-reviews',
  glassdoor: 'https://www.glassdoor.co.in/Interview/index.htm?countryRedirect=true'
};

// Initial Approved Copy for stages welcome_7d, culture_5d, comm_3d
export const INITIAL_APPROVED_TEMPLATES: Record<string, EmailTemplateDoc> = {
  welcome_7d: {
    id: 'welcome_7d',
    subject: 'Welcome to FieldAssist – Your Onboarding Journey Starts Here!',
    greeting: 'Hi {{firstName}},',
    blocks: [
      {
        type: 'paragraph',
        text: 'Congratulations once again—and a warm welcome to FieldAssist!'
      },
      {
        type: 'paragraph',
        text: 'We’re thrilled to have you as part of our growing team. Your journey with us is just beginning, and we’re committed to making your onboarding experience smooth, engaging, and memorable.'
      },
      {
        type: 'paragraph',
        text: 'Over the next few days, we’ll be sharing important resources and information to help you prepare for your joining.'
      },
      {
        type: 'paragraph',
        text: 'For now, here’s what you can expect:'
      },
      {
        type: 'bullets',
        items: [
          {
            text: 'Access to our AMMO pre-read, to help you get familiar with FieldAssist.',
            linkLabel: 'AMMO',
            linkKey: 'ammoPreread'
          },
          {
            text: 'Introduction to your HR Business Partner and HR Operations SPOC, about 15 days before your joining.'
          }
        ]
      },
      {
        type: 'paragraph',
        text: 'In case you have any questions or need support at any stage, feel free to reach out to your recruiter—your go-to person until your onboarding begins.'
      },
      {
        type: 'paragraph',
        text: 'Cheers!'
      }
    ],
    signoff: 'Thanks & Regards, FA HR'
  },

  culture_5d: {
    id: 'culture_5d',
    subject: 'You + FieldAssist = Let’s Get Started!',
    greeting: 'Hi {{firstName}},',
    blocks: [
      {
        type: 'paragraph',
        text: 'We’re counting down the days till you officially become a part of the FieldAssist tribe, but we couldn’t wait to give you a glimpse of what’s in store.'
      },
      {
        type: 'paragraph',
        text: 'Before your Day 1, we’d love to give you a peek into what it feels like to be at FA.'
      },
      {
        type: 'heading',
        text: 'A Culture that Walks the Talk'
      },
      {
        type: 'bullets',
        items: [
          {
            text: '4× Great Place to Work-Certified – Our culture isn’t a tagline. It’s how we treat people, lead teams, and celebrate progress.'
          },
          {
            text: 'Bootstrapped & Profitable – We’ve built FA on passion, not funding. And we’ve grown year after year with agility and intention.'
          },
          {
            text: 'Voices from the Inside – Hear directly from our teammates about what makes FA special',
            linkLabel: 'Voices from the Inside',
            linkKey: 'voicesFromInside'
          }
        ]
      },
      {
        type: 'heading',
        text: 'Culture in Motion: Our Goa Offsite'
      },
      {
        type: 'paragraph',
        text: 'Earlier this year, we brought the entire company to Goa, not just for fun, but for alignment, celebration, and forward thinking.'
      },
      {
        type: 'paragraph',
        text: 'From powerful strategy sessions to sunset vibes, it was the perfect mix of ambition and culture.'
      },
      {
        type: 'button',
        label: 'See the Highlights →',
        linkKey: 'goaHighlights'
      },
      {
        type: 'note',
        text: '(Yes, that energy is real. Yes, you’ll love it here.)'
      },
      {
        type: 'paragraph',
        text: 'Here’s to a journey full of impact, learning, and growth.'
      }
    ],
    signoff: 'Thanks & Regards, FA HR'
  },

  comm_3d: {
    id: 'comm_3d',
    subject: 'Getting Started at FieldAssist – Resources to Know Us Better!',
    greeting: 'Hi {{firstName}},',
    blocks: [
      {
        type: 'paragraph',
        text: 'Hope you enjoyed the sneak peek we shared earlier about life at FieldAssist — that was just the beginning!'
      },
      {
        type: 'paragraph',
        text: 'Your journey with us is just getting started, and we’re here to ensure it begins on a smooth and exciting note.'
      },
      {
        type: 'paragraph',
        text: 'To help you get familiar with our culture, people, and what makes FA a great place to work, we’ve put together a few useful resources just for you:'
      },
      {
        type: 'bullets',
        items: [
          {
            text: 'FA Newsletter - Stay updated with all the exciting happenings!',
            linkLabel: 'Read Newsletter',
            linkKey: 'newsletter'
          },
          {
            text: 'LinkedIn Page - Follow us for company updates and stories from the field.',
            linkLabel: 'Visit LinkedIn',
            linkKey: 'linkedinPage'
          },
          {
            text: 'Instagram - A peek into our people, events, and behind-the-scenes moments.',
            linkLabel: 'Follow Instagram',
            linkKey: 'instagram'
          },
          {
            text: 'Latest Pathfinder\'s video - Hear stories straight from our employees about their growth and impact.',
            linkLabel: 'Watch Video',
            linkKey: 'pathfinderVideo'
          }
        ]
      },
      {
        type: 'paragraph',
        text: 'If you have any questions, feel free to reach out to your respective recruiter or reply to this email.'
      },
      {
        type: 'paragraph',
        text: 'You can also rate us at - AmbitionBox: (linkLabel "Link", ambitionBox) | Glassdoor: (linkLabel "Link", glassdoor)'
      }
    ],
    signoff: 'Thanks & Regards, Team FA'
  }
};

// In-memory cache synced with localStorage & Firestore
const STORAGE_KEY_LINKS = 'fieldassist_links_doc_v1';
const STORAGE_KEY_TEMPLATES = 'fieldassist_templates_doc_v1';

let cachedLinks: LinksSettingsDoc | null = null;
let cachedTemplates: Record<string, EmailTemplateDoc> | null = null;

export function getCachedLinks(): LinksSettingsDoc {
  if (cachedLinks) return cachedLinks;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LINKS);
    if (saved) {
      cachedLinks = { ...INITIAL_APPROVED_LINKS, ...JSON.parse(saved) };
      return cachedLinks;
    }
  } catch (e) {
    console.error('Error loading links from localStorage:', e);
  }
  cachedLinks = { ...INITIAL_APPROVED_LINKS };
  return cachedLinks;
}

export function getCachedTemplates(): Record<string, EmailTemplateDoc> {
  if (cachedTemplates) return cachedTemplates;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TEMPLATES);
    if (saved) {
      cachedTemplates = { ...INITIAL_APPROVED_TEMPLATES, ...JSON.parse(saved) };
      return cachedTemplates;
    }
  } catch (e) {
    console.error('Error loading templates from localStorage:', e);
  }
  cachedTemplates = { ...INITIAL_APPROVED_TEMPLATES };
  return cachedTemplates;
}

/**
 * Initializes and seeds Firestore with approved links and templates if empty
 */
export async function syncEmailStoreWithFirestore(): Promise<{
  links: LinksSettingsDoc;
  templates: Record<string, EmailTemplateDoc>;
}> {
  let links = getCachedLinks();
  let templates = getCachedTemplates();

  try {
    // 1. Sync Links with Firestore
    const remoteLinks = await fetchLinksFromFirestore();
    if (remoteLinks && Object.keys(remoteLinks).length > 0) {
      links = { ...INITIAL_APPROVED_LINKS, ...remoteLinks };
    } else {
      // Seed Firestore with initial links
      await saveLinksToFirestore(INITIAL_APPROVED_LINKS);
      links = { ...INITIAL_APPROVED_LINKS };
    }
    cachedLinks = links;
    try {
      localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify(links));
    } catch {}

    // 2. Sync Templates with Firestore
    const remoteTemplates = await fetchEmailTemplatesFromFirestore();
    if (remoteTemplates && Object.keys(remoteTemplates).length > 0) {
      templates = { ...INITIAL_APPROVED_TEMPLATES, ...remoteTemplates };
    } else {
      // Seed Firestore with initial templates
      for (const [stageKey, tmpl] of Object.entries(INITIAL_APPROVED_TEMPLATES)) {
        await saveEmailTemplateToFirestore(stageKey, tmpl);
      }
      templates = { ...INITIAL_APPROVED_TEMPLATES };
    }
    cachedTemplates = templates;
    try {
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
    } catch {}
  } catch (err) {
    console.warn('Firestore sync for email store encountered error; fallback to local cache:', err);
  }

  return { links, templates };
}

/**
 * Saves updated links to Firestore and local cache
 */
export async function updateStoredLinks(links: LinksSettingsDoc): Promise<void> {
  cachedLinks = { ...links };
  try {
    localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify(links));
  } catch {}
  await saveLinksToFirestore(links);
}

/**
 * Saves single updated template to Firestore and local cache
 */
export async function updateStoredTemplate(stageKey: string, template: EmailTemplateDoc): Promise<void> {
  if (!cachedTemplates) cachedTemplates = getCachedTemplates();
  cachedTemplates[stageKey] = { ...template, id: stageKey };
  try {
    localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(cachedTemplates));
  } catch {}
  await saveEmailTemplateToFirestore(stageKey, template);
}
