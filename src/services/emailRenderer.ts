import { Candidate, EmailBlock, EmailBulletItem, EmailTemplateDoc, LinksSettingsDoc } from '../types';
import { getCachedLinks, getCachedTemplates } from './emailStore';
import { formatJoiningDate } from '../utils/dateUtils';
import { getCandidateAccessUrl } from '../utils/appUrl';

const OFFICIAL_FOOTER_HTML = `
  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.5;">
    <p style="margin: 0 0 6px 0; font-weight: bold; color: #475569;">FieldAssist (Flick2Know Technologies Pvt. Ltd.)</p>
    <p style="margin: 0 0 4px 0;">Corporate HQ: Plot No. 12, Sector 44, Gurugram, Haryana 122003, India</p>
    <p style="margin: 0;">This email is an official onboarding communication sent by FieldAssist HR. If you received this in error, please reply to <a href="mailto:twinkle.verma@fieldassist.com" style="color: #4f46e5;">twinkle.verma@fieldassist.com</a>.</p>
  </div>
`;

const OFFICIAL_FOOTER_TEXT = `
---
FieldAssist (Flick2Know Technologies Pvt. Ltd.)
Corporate HQ: Plot No. 12, Sector 44, Gurugram, Haryana 122003, India
Official HR Onboarding Communication | twinkle.verma@fieldassist.com
`;

export function resolveUrl(linkKey: string | undefined, links: LinksSettingsDoc): { url: string; isMissing: boolean } {
  if (!linkKey) return { url: '', isMissing: false };
  const raw = links[linkKey]?.trim();
  if (!raw) {
    return { url: '', isMissing: true };
  }
  return { url: raw, isMissing: false };
}

export function substituteVariables(text: string, vars: Record<string, string>): string {
  if (!text) return '';
  let res = text;
  for (const [key, val] of Object.entries(vars)) {
    // Replace all occurrences of {{key}}
    res = res.split(`{{${key}}}`).join(val);
  }
  return res;
}

export function autoLinkHtml(text: string): string {
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; word-break: break-all; font-weight: 500;">${url}</a>`;
  });
}

export function formatRawTextToHtmlBlocks(rawText: string, vars: Record<string, string>): { textLines: string[]; htmlBlocks: string[] } {
  const resolved = substituteVariables(rawText, vars);
  const rawParagraphs = resolved.split(/\n\s*\n/);
  const textLines: string[] = [resolved];
  const htmlBlocks: string[] = [];

  for (const block of rawParagraphs) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Check if block consists of bullet points
    const lines = trimmed.split('\n');
    const isBulletList = lines.length > 0 && lines.every(l => {
      const t = l.trim();
      return !t || t.startsWith('- ') || t.startsWith('• ');
    });

    if (isBulletList) {
      const itemsHtml = lines
        .filter(l => l.trim())
        .map(l => {
          const content = l.trim().replace(/^[-•]\s*/, '');
          return `<li style="margin-bottom: 6px; line-height: 1.6;">${autoLinkHtml(content)}</li>`;
        })
        .join('');
      htmlBlocks.push(`<ul style="padding-left: 20px; margin: 12px 0 16px 0; font-size: 14px; color: #334155;">${itemsHtml}</ul>`);
      continue;
    }

    // Check if this single line is a section heading
    const isHeading = trimmed.length < 80 && !trimmed.includes('\n') && (
      (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) ||
      /^[0-9]+\.\s+[A-Z\s]+:/.test(trimmed) ||
      trimmed.startsWith('WHAT HAPPENED') ||
      trimmed.startsWith('SEE IT FOR YOURSELF') ||
      trimmed.startsWith('WHAT THIS TELLS YOU') ||
      trimmed.startsWith('NEXT UP') ||
      trimmed.startsWith('A QUICK NOTE') ||
      trimmed.startsWith('A GLIMPSE OF') ||
      trimmed.startsWith('GROCERYSHOP 2026') ||
      trimmed.startsWith('FIELDASSIST ON NDTV PROFIT') ||
      trimmed.startsWith('YOUR DAY 1 DETAILS') ||
      trimmed.startsWith('WHAT YOUR DAY LOOKS LIKE') ||
      trimmed.startsWith('YOUR CANDIDATE ONBOARDING PORTAL')
    );

    if (isHeading) {
      htmlBlocks.push(`<h3 style="color: #1e1b4b; font-size: 15px; font-weight: 800; margin: 22px 0 8px 0; text-transform: uppercase; letter-spacing: 0.03em;">${trimmed}</h3>`);
      continue;
    }

    // Normal paragraph with line breaks preserved
    const paragraphLines = lines.map(l => autoLinkHtml(l)).join('<br>');
    htmlBlocks.push(`<p style="margin: 12px 0; font-size: 14px; line-height: 1.65; color: #1e293b;">${paragraphLines}</p>`);
  }

  return { textLines, htmlBlocks };
}

/**
 * Renders an email template from Firestore doc + settings/links into subject, text, and html
 */
export function renderFirestoreTemplate(
  stageKey: string,
  candidate: Candidate,
  firstName: string,
  customTemplate?: EmailTemplateDoc,
  customLinks?: LinksSettingsDoc
): {
  subject: string;
  bodyText: string;
  bodyHtml: string;
} {
  const templates = getCachedTemplates();
  const links = customLinks || getCachedLinks();
  const templateDoc = customTemplate || templates[stageKey];

  if (!templateDoc) {
    throw new Error(`Email template not found for stage: ${stageKey}`);
  }

  const accessCode = (candidate?.accessCode || candidate?.id || 'FA-PORTAL').trim();
  const portalUrl = getCandidateAccessUrl(accessCode);
  const joiningDateFormatted = candidate?.joiningDate
    ? formatJoiningDate(candidate.joiningDate, { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Upcoming';

  const reportingTime = candidate?.reportingTime || '11:00 AM';
  const isRemote = candidate?.workMode === 'Remote';
  const locationName = isRemote
    ? 'Remote / Work From Home'
    : (candidate?.joiningLocation?.name || candidate?.officeCity || 'Office Hub');
  const address = isRemote
    ? (candidate?.remoteInstructions || 'Remote joining instructions will be delivered to your inbox.')
    : (candidate?.officeAddress || 'Registered Office Address');
  const dressCode = candidate?.dressCode || 'Smart Casuals';

  const vars: Record<string, string> = {
    firstName: firstName || 'Team Member',
    Name: firstName || 'Team Member',
    name: firstName || 'Team Member',
    joiningDate: joiningDateFormatted,
    'Date of Joining': joiningDateFormatted,
    dateOfJoining: joiningDateFormatted,
    reportingTime: reportingTime,
    'Reporting Time': reportingTime,
    location: locationName,
    'Location': locationName,
    address: address,
    'Address': address,
    'Address / Instructions': address,
    dressCode: dressCode,
    'Dress Code': dressCode,
    accessCode: accessCode,
    'Access Code': accessCode,
    portalUrl: portalUrl,
    'Portal Link': portalUrl
  };

  const subject = substituteVariables(templateDoc.subject, vars);

  const portalBoxHtml = `
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 22px; margin: 24px 0;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 6px;">
        FieldAssist Candidate Portal
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div>
          <a href="${portalUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 13px;">
            Open Your Candidate Portal &rarr;
          </a>
        </div>
        <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 14px; font-size: 12px; color: #475569;">
          Access Code: <strong style="font-family: 'SFMono-Regular', Consolas, Menlo, monospace; font-size: 14px; color: #4338ca; letter-spacing: 1px;">${accessCode}</strong>
        </div>
      </div>
    </div>
  `;

  // If rawText is provided (custom full text edited by HR), render directly from rawText!
  if (templateDoc.rawText) {
    const { textLines: rawTextLines, htmlBlocks: rawHtmlBlocks } = formatRawTextToHtmlBlocks(templateDoc.rawText, vars);

    // Append Candidate Portal Box if not explicitly referenced
    if (!templateDoc.rawText.includes('{{Portal Link}}') && !templateDoc.rawText.includes(portalUrl)) {
      rawHtmlBlocks.push(portalBoxHtml);
      rawTextLines.push(`\nCandidate Portal: ${portalUrl}\nAccess Code: ${accessCode}\n`);
    }

    const bodyText = rawTextLines.join('\n') + '\n\n' + OFFICIAL_FOOTER_TEXT;
    const bodyHtml = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
  <div style="background: linear-gradient(135deg, #3730a3 0%, #4f46e5 100%); padding: 24px 32px; text-align: left;">
    <span style="color: #c7d2fe; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">FieldAssist Onboarding</span>
    <h1 style="color: #ffffff; margin: 4px 0 0 0; font-size: 20px; font-weight: 800;">${subject}</h1>
  </div>
  <div style="padding: 32px;">
    ${rawHtmlBlocks.join('\n')}
    ${OFFICIAL_FOOTER_HTML}
  </div>
</div>`;

    return {
      subject,
      bodyText,
      bodyHtml
    };
  }

  const greeting = substituteVariables(templateDoc.greeting || '', vars);
  const signoff = substituteVariables(templateDoc.signoff || '', vars);

  // Build Text lines
  const textLines: string[] = [];
  if (greeting) textLines.push(greeting, '');

  // Build HTML fragments
  const htmlBlocks: string[] = [];
  if (greeting) {
    htmlBlocks.push(`<p style="margin-top: 0; font-size: 16px;">${greeting}</p>`);
  }

  const blocks: EmailBlock[] = Array.isArray(templateDoc.blocks) ? templateDoc.blocks : [];

  for (const block of blocks) {
    switch (block.type) {
      case 'paragraph': {
        const text = substituteVariables(block.text, vars);
        textLines.push(text, '');
        const textWithLinks = autoLinkHtml(text);
        htmlBlocks.push(`<p style="margin: 12px 0; font-size: 14px; line-height: 1.6; color: #1e293b;">${textWithLinks}</p>`);
        break;
      }
      case 'heading': {
        const text = substituteVariables(block.text, vars);
        textLines.push(`\n** ${text} **\n`);
        htmlBlocks.push(`<h3 style="color: #1e1b4b; font-size: 16px; font-weight: 700; margin: 24px 0 10px 0;">${text}</h3>`);
        break;
      }
      case 'bullets': {
        const bulletItems: EmailBulletItem[] = Array.isArray(block.items) ? block.items : [];
        const htmlItems: string[] = [];

        for (const item of bulletItems) {
          const rawItemText = substituteVariables(item.text, vars);
          let itemText = rawItemText;
          let linkSnippetText = '';
          let linkSnippetHtml = '';

          if (item.linkKey) {
            const { url, isMissing } = resolveUrl(item.linkKey, links);
            const label = item.linkLabel || 'Link';
            if (isMissing) {
              linkSnippetText = ` [TODO: Missing URL for "${item.linkKey}"]`;
              linkSnippetHtml = ` <span style="background-color: #fee2e2; color: #dc2626; font-size: 11px; font-weight: bold; padding: 2px 6px; border-radius: 4px; border: 1px solid #f87171;">TODO: Missing link (${item.linkKey})</span>`;
            } else {
              linkSnippetText = ` - ${label}: ${url}`;
              linkSnippetHtml = ` <a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; font-weight: 600; text-decoration: underline;">[${label}]</a>`;
            }
          }

          textLines.push(`• ${itemText}${linkSnippetText}`);
          htmlItems.push(`<li style="margin-bottom: 8px; line-height: 1.6;">${itemText}${linkSnippetHtml}</li>`);
        }
        textLines.push('');
        htmlBlocks.push(`<ul style="padding-left: 20px; margin: 12px 0 16px 0; font-size: 14px; color: #334155;">${htmlItems.join('')}</ul>`);
        break;
      }
      case 'button': {
        const label = substituteVariables(block.label, vars);
        const { url, isMissing } = resolveUrl(block.linkKey, links);
        if (isMissing) {
          textLines.push(`[Button: ${label} -> TODO: Missing URL for "${block.linkKey}"]`, '');
          htmlBlocks.push(`
            <div style="margin: 20px 0;">
              <span style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 13px;">
                ${label} (TODO: Missing link for ${block.linkKey})
              </span>
            </div>
          `);
        } else {
          textLines.push(`[${label}]: ${url}`, '');
          htmlBlocks.push(`
            <div style="margin: 20px 0;">
              <a href="${url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); color: #ffffff; text-decoration: none; padding: 11px 22px; border-radius: 8px; font-weight: 700; font-size: 13px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.25);">
                ${label}
              </a>
            </div>
          `);
        }
        break;
      }
      case 'note': {
        const text = substituteVariables(block.text, vars);
        textLines.push(`(${text})`, '');
        htmlBlocks.push(`<p style="font-size: 13px; font-style: italic; color: #64748b; margin: 8px 0 16px 0;">${text}</p>`);
        break;
      }
    }
  }

  // Mandatory Portal CTA Button & Access Code Box
  textLines.push(`----------------------------------------`);
  textLines.push(`Candidate Portal: ${portalUrl}`);
  textLines.push(`Access Code: ${accessCode}`);
  textLines.push(`----------------------------------------\n`);

  htmlBlocks.push(portalBoxHtml);

  // Signoff
  if (signoff) {
    const signoffHtml = signoff.replace(/\n/g, '<br>');
    textLines.push(signoff, '');
    htmlBlocks.push(`<p style="margin-top: 24px; margin-bottom: 0; font-size: 14px; color: #334155; line-height: 1.6;">${signoffHtml}</p>`);
  }

  textLines.push(OFFICIAL_FOOTER_TEXT);
  const bodyText = textLines.join('\n');

  // Wrap full email in responsive branded email container
  const bodyHtml = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
  <div style="background: linear-gradient(135deg, #3730a3 0%, #4f46e5 100%); padding: 24px 32px; text-align: left;">
    <span style="color: #c7d2fe; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">FieldAssist Onboarding</span>
    <h1 style="color: #ffffff; margin: 4px 0 0 0; font-size: 20px; font-weight: 800;">${subject}</h1>
  </div>
  <div style="padding: 32px;">
    ${htmlBlocks.join('\n')}
    ${OFFICIAL_FOOTER_HTML}
  </div>
</div>`;

  return {
    subject,
    bodyText,
    bodyHtml
  };
}
