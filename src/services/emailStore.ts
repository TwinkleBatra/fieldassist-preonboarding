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
    subject: "7 days to go, {{Name}}! Here's the story you're joining",
    greeting: 'Hi {{Name}},',
    blocks: [
      {
        type: 'paragraph',
        text: "7 days to go! On {{Date of Joining}}, you'll officially become part of FieldAssist, and we thought you should know the story you're stepping into."
      },
      {
        type: 'heading',
        text: 'FROM INDIA TO THE WORLD'
      },
      {
        type: 'paragraph',
        text: 'FieldAssist started by helping CPG brands run smarter field operations. Today, some of the biggest names in the industry look to us for answers on how AI can transform the way field teams work, how retailers are understood, and how decisions get made in real time.'
      },
      {
        type: 'paragraph',
        text: 'The best proof is FieldVerse.'
      },
      {
        type: 'heading',
        text: 'WHAT IS FIELDVERSE?'
      },
      {
        type: 'paragraph',
        text: 'FieldVerse is our invite-only, closed-door forum for senior CPG leaders. It is a room where CXOs talk openly with their peers about AI-led field execution, retail intelligence and real-time decision-making. No sales pitches. No demos. Just honest conversations.'
      },
      {
        type: 'paragraph',
        text: 'After the success of FieldVerse India, the forum went global:'
      },
      {
        type: 'bullets',
        items: [
          { text: 'Dubai' },
          { text: 'Singapore' },
          { text: 'Jakarta' },
          { text: 'Nairobi, Kenya (newest)' },
          { text: 'London (newest)' }
        ]
      },
      {
        type: 'heading',
        text: 'WHY THIS MATTERS TO YOU'
      },
      {
        type: 'paragraph',
        text: "When leaders from across the world choose to spend their time with us, it says something about the trust we've built and the work you'll be a part of from Day 1."
      },
      {
        type: 'paragraph',
        text: 'See it for yourself:'
      },
      {
        type: 'paragraph',
        text: 'FieldVerse highlights:\nhttps://www.linkedin.com/feed/update/urn:li:activity:7507734851148734464'
      },
      {
        type: 'paragraph',
        text: 'More moments from the forum:\nhttps://www.linkedin.com/feed/update/urn:li:activity:7500455075962744832\nhttps://www.linkedin.com/feed/update/urn:li:activity:7488869657597370368\nhttps://www.linkedin.com/feed/update/urn:li:activity:7486638886018830337'
      },
      {
        type: 'heading',
        text: 'NEXT UP'
      },
      {
        type: 'paragraph',
        text: "In the coming days we'll share what life at FieldAssist looks like and what to expect on Day 1."
      },
      {
        type: 'paragraph',
        text: 'Questions in the meantime? Write to me anytime at twinkle.verma@fieldassist.com.'
      },
      {
        type: 'paragraph',
        text: "Can't wait to see you!"
      }
    ],
    signoff: 'Warm regards,\nTwinkle Verma | FieldAssist HR'
  },

  culture_5d: {
    id: 'culture_5d',
    subject: '5 days to go, {{Name}}! At FieldAssist, everyone gets to build',
    greeting: 'Hi {{Name}},',
    blocks: [
      {
        type: 'paragraph',
        text: "5 days to go! {{Date of Joining}} is almost here, and we're counting down with you."
      },
      {
        type: 'paragraph',
        text: 'Last time, we showed you how far FieldAssist has travelled. Today, we want to show you something that says a lot about how we think.'
      },
      {
        type: 'heading',
        text: 'AI IS EVERYWHERE. SO BUILDING IS FOR EVERYONE.'
      },
      {
        type: 'paragraph',
        text: "At FieldAssist, we believe AI is not only for the tech team. It's a tool anyone can pick up. So we created AI-thon, a hackathon-style challenge built especially for our non-tech colleagues."
      },
      {
        type: 'paragraph',
        text: 'The brief was simple: take an idea of your own, use AI to bring it to life, and build something real.'
      },
      {
        type: 'heading',
        text: 'WHAT HAPPENED'
      },
      {
        type: 'bullets',
        items: [
          { text: 'People from non-tech teams came forward with ideas from their own day-to-day work' },
          { text: 'They used AI to turn those ideas into working builds, no coding background needed' },
          { text: 'A panel of judges reviewed every build and picked the best ones' },
          { text: 'The winners received awards and recognition' },
          { text: "And the best part: the winning ideas didn't stay on a stage. They were put to use inside the company" }
        ]
      },
      {
        type: 'heading',
        text: 'WHAT THIS TELLS YOU ABOUT FIELDASSIST'
      },
      {
        type: 'paragraph',
        text: "At FieldAssist, a good idea matters more than your job title. If you can spot a problem and imagine a better way, you can build it, and we'll back you."
      },
      {
        type: 'heading',
        text: 'SEE IT FOR YOURSELF'
      },
      {
        type: 'paragraph',
        text: 'The latest from AI-thon:\nhttps://www.linkedin.com/feed/update/urn:li:activity:7500126538240245760'
      },
      {
        type: 'paragraph',
        text: 'More moments from AI-thon:\nhttps://www.linkedin.com/feed/update/urn:li:activity:7495436037582811136\nhttps://www.linkedin.com/feed/update/urn:li:activity:7494054891640741888\nhttps://www.linkedin.com/feed/update/urn:li:activity:7491108371924922368\nhttps://www.linkedin.com/feed/update/urn:li:activity:7485952306807562240\nhttps://www.linkedin.com/feed/update/urn:li:activity:7480251796720861184\nhttps://www.linkedin.com/feed/update/urn:li:activity:7477988434884661249\nhttps://www.linkedin.com/feed/update/urn:li:activity:7474742241740210176\nhttps://www.linkedin.com/feed/update/urn:li:activity:7472989053064224768\nhttps://www.linkedin.com/feed/update/urn:li:activity:7470091441378279425'
      },
      {
        type: 'paragraph',
        text: 'So start thinking: what would you build?'
      },
      {
        type: 'paragraph',
        text: "Your next big idea could be the one we all end up using. We can't wait to hear it."
      },
      {
        type: 'paragraph',
        text: 'See you very soon!'
      }
    ],
    signoff: 'Warm regards,\nTwinkle Verma | FieldAssist HR'
  },

  comm_3d: {
    id: 'comm_3d',
    subject: '3 day to go, {{Name}}! FieldAssist on the world stage and on NDTV Profit',
    greeting: 'Hi {{Name}},',
    blocks: [
      {
        type: 'paragraph',
        text: "Just 1 day to go! Tomorrow is {{Date of Joining}}, and before you walk in, we'd like you to see how FieldAssist is showing up, on the global stage and in the national spotlight."
      },
      {
        type: 'heading',
        text: '1. ON THE GLOBAL STAGE: GROCERYSHOP 2026'
      },
      {
        type: 'paragraph',
        text: "Groceryshop, held in Las Vegas, is one of the retail industry's most influential global events, bringing together leaders from retail, CPG and consumer brands. FieldAssist took part to make one point: the next big AI opportunity in retail isn't only online. It's inside the store, where most grocery sales still happen."
      },
      {
        type: 'paragraph',
        text: 'That is where our Perfect Store comes in: the right products, in the right stores, in the right quantities, executed the right way. Doing this consistently across thousands of stores is the hard part. Brands need to know which micromarkets matter, what assortment belongs in each store, how much to stock and where shelf execution is breaking.'
      },
      {
        type: 'paragraph',
        text: 'At our booth, the team showcased the Agentic Perfect Store, which spots execution gaps, flags what needs attention and guides field teams to the right action faster, turning shelf gaps into sales opportunities. Our leadership also met CPG and retail leaders to discuss what stronger execution unlocks, from productivity and decision velocity to revenue growth.'
      },
      {
        type: 'paragraph',
        text: 'The message is simple: move from store-level visibility to store-level action, store by store.'
      },
      {
        type: 'paragraph',
        text: 'Groceryshop 2026 highlights:\nhttps://www.linkedin.com/feed/update/urn:li:activity:7509223401954283520'
      },
      {
        type: 'paragraph',
        text: 'More from the event:\nhttps://www.linkedin.com/feed/update/urn:li:activity:7506676960077656066\nhttps://www.linkedin.com/feed/update/urn:li:activity:7506321134439669760'
      },
      {
        type: 'heading',
        text: '2. IN THE NATIONAL SPOTLIGHT: NDTV PROFIT'
      },
      {
        type: 'paragraph',
        text: "FieldAssist was featured on NDTV Profit's The Great Business Story: Transforming India, a series on the ideas, people and technology shaping how India does business."
      },
      {
        type: 'paragraph',
        text: 'In a special segment, our Co-Founder & CEO, Divir Tiwari, shared how AI-native Route-to-Market is reshaping CPG, from faster decision-making to smarter last-mile execution. The segment showed how brands can move beyond dashboards and visibility to build intelligent, responsive, execution-led RTM systems, and how FieldAssist helps FMCG and consumer brands turn field intelligence into smarter decisions and stronger execution.'
      },
      {
        type: 'paragraph',
        text: 'The latest from the segment:\nhttps://www.linkedin.com/feed/update/urn:li:activity:7512467128868868096'
      },
      {
        type: 'paragraph',
        text: 'More from the feature:\nhttps://www.linkedin.com/feed/update/urn:li:activity:7512041039675781120\nhttps://www.linkedin.com/feed/update/urn:li:activity:7511960782666915840\nhttps://www.linkedin.com/feed/update/urn:li:activity:7511422371392794624'
      },
      {
        type: 'paragraph',
        text: 'Tomorrow, you become part of this story.'
      },
      {
        type: 'paragraph',
        text: 'Any last-minute questions? Write to me anytime at twinkle.verma@fieldassist.com.'
      }
    ],
    signoff: 'Warm regards,\nTwinkle Verma | FieldAssist HR'
  }
};

// In-memory cache synced with localStorage & Firestore
const STORAGE_KEY_LINKS = 'fieldassist_links_doc_v2';
const STORAGE_KEY_TEMPLATES = 'fieldassist_templates_doc_v3';

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
