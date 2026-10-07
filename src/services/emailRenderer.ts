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

  const vars: Record<string, string> = {
    firstName: firstName || 'Team Member',
    Name: firstName || 'Team Member',
    name: firstName || 'Team Member',
    joiningDate: joiningDateFormatted,
    'Date of Joining': joiningDateFormatted,
    dateOfJoining: joiningDateFormatted,
    accessCode: accessCode
  };

  const subject = substituteVariables(templateDoc.subject, vars);
  const greeting = substituteVariables(templateDoc.greeting, vars);
  const signoff = substituteVariables(templateDoc.signoff, vars);

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
