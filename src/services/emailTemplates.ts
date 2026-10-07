import { Candidate, EmailStageKey } from '../types';
import { getEmailSettings } from './emailSettings';
import { formatJoiningDate } from '../utils/dateUtils';
import { toTitleCase } from '../utils/textUtils';
import { getCandidateAccessUrl } from '../utils/appUrl';
import { renderFirestoreTemplate } from './emailRenderer';
import { getCachedTemplates } from './emailStore';

export interface EmailTemplateDefinition {
  key: EmailStageKey;
  daysBeforeJoining: number;
  stageName: string;
  subject: string;
  getSubject?: (firstName: string, candidate?: Candidate) => string;
  getFirstName: (fullName: string) => string;
  getBodyText: (firstName: string, candidate?: Candidate) => string;
  getHtmlContent: (firstName: string, candidate?: Candidate) => string;
}

export function extractFirstName(fullName: string): string {
  if (!fullName) return 'Team Member';
  const clean = fullName.trim().split(' ')[0];
  return toTitleCase(clean) || 'Team Member';
}

export function calculateTargetDate(joiningDateStr: string, daysBefore: number): string {
  if (!joiningDateStr) return new Date().toISOString().split('T')[0];
  try {
    const parts = joiningDateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(Date.UTC(year, month, day));
      date.setUTCDate(date.getUTCDate() - daysBefore);
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  } catch (err) {
    console.error('Error calculating target date:', err);
  }
  return joiningDateStr;
}

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

export const EMAIL_TEMPLATES: Record<EmailStageKey, EmailTemplateDefinition> = {
  account_ready: {
    key: 'account_ready',
    daysBeforeJoining: 0,
    stageName: 'Immediate – Account Ready & Credentials',
    subject: 'Your FieldAssist Account is Ready',
    getFirstName: extractFirstName,
    getBodyText: (firstName: string, candidate?: Candidate) => {
      const accessCode = candidate?.accessCode || 'Your Access Code';
      const portalUrl = candidate?.accessCode ? getCandidateAccessUrl(candidate.accessCode) : getCandidateAccessUrl('');
      return `Hi ${firstName},

Welcome to FieldAssist! We are thrilled to have you join our team.

Your candidate onboarding account is now ready. Please use your credentials below to log into the Candidate Portal and complete your Pre-Onboarding Form as soon as possible:

• Your Access Code: ${accessCode}
• Candidate Portal Login Link: ${portalUrl}

What to do next:
1. Click the portal link above to open your Candidate Portal.
2. Enter your Access Code (${accessCode}) or personal email to log in.
3. Complete the Pre-Onboarding Form with your personal details, emergency contact, and required document uploads (Aadhaar, PAN, and photos).

Please log in and submit the form as soon as possible. Completing this promptly ensures your background verification, IT asset allocation, and welcome kit are prepared smoothly ahead of your Day 1.

If you have any questions or need support, feel free to reach out to HR (Twinkle Verma at twinkle.verma@fieldassist.com).

We can’t wait to welcome you aboard!

Thanks & Regards,
Twinkle Verma | FieldAssist HR
${OFFICIAL_FOOTER_TEXT}`;
    },
    getHtmlContent: (firstName: string, candidate?: Candidate) => {
      const accessCode = candidate?.accessCode || 'Your Access Code';
      const portalUrl = candidate?.accessCode ? getCandidateAccessUrl(candidate.accessCode) : getCandidateAccessUrl('');
      return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
  <div style="background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%); padding: 28px 32px; text-align: left;">
    <span style="color: #c7d2fe; font-size: 11px; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase;">FieldAssist Pre-Onboarding</span>
    <h1 style="color: #ffffff; margin: 4px 0 0 0; font-size: 22px; font-weight: 800;">Your FieldAssist Account is Ready</h1>
  </div>
  <div style="padding: 32px;">
    <p style="margin-top: 0; font-size: 16px;">Hi <strong>${firstName}</strong>,</p>
    <p>Welcome to FieldAssist! We are thrilled to have you join our team.</p>
    <p>Your candidate onboarding account is now ready. Please use your credentials below to log into the Candidate Portal and complete your Pre-Onboarding Form as soon as possible:</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px; margin: 24px 0;">
      <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Your Candidate Access Code</div>
      <div style="font-family: 'SFMono-Regular', Consolas, Menlo, monospace; font-size: 26px; font-weight: 800; color: #4338ca; letter-spacing: 2px;">${accessCode}</div>
      <div style="margin-top: 18px;">
        <a href="${portalUrl}" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.12);">Log In to Candidate Portal &rarr;</a>
      </div>
      <div style="margin-top: 14px; font-size: 12px; color: #64748b; word-break: break-all;">
        Direct link: <a href="${portalUrl}" style="color: #4f46e5; text-decoration: underline;">${portalUrl}</a>
      </div>
    </div>

    <h3 style="color: #1e1b4b; font-size: 15px; margin-top: 24px; margin-bottom: 10px;">What to do next:</h3>
    <ol style="padding-left: 20px; margin-bottom: 24px; font-size: 14px; line-height: 1.7;">
      <li style="margin-bottom: 6px;">Click the login button or direct link above to open your portal.</li>
      <li style="margin-bottom: 6px;">Enter your Access Code (<strong>${accessCode}</strong>) or registered email.</li>
      <li style="margin-bottom: 6px;">Complete the Pre-Onboarding Form with your personal, contact, and education details.</li>
      <li style="margin-bottom: 6px;">Upload your required identity and verification documents (Aadhaar Card, PAN Card, and photos).</li>
    </ol>

    <div style="font-size: 13px; color: #1e40af; background-color: #eff6ff; padding: 14px 18px; border-left: 4px solid #3b82f6; border-radius: 6px; margin-bottom: 24px;">
      <strong>Please note:</strong> Please log in and complete the form as soon as possible. Completing this promptly allows us to finalize your IT asset allocation, background verification, and welcome kit ahead of your Day 1.
    </div>

    <p style="font-size: 14px; color: #334155;">
      If you have any questions or need support at any stage, feel free to reply directly or contact HR (Twinkle Verma at <a href="mailto:twinkle.verma@fieldassist.com" style="color: #4f46e5; font-weight: 600;">twinkle.verma@fieldassist.com</a>).
    </p>

    <p style="margin-top: 28px; margin-bottom: 0;">Thanks &amp; Regards,<br><strong>Twinkle Verma</strong><br><span style="color: #64748b; font-size: 13px;">FieldAssist HR</span></p>
    ${OFFICIAL_FOOTER_HTML}
  </div>
</div>`;
    }
  },
  welcome_7d: {
    key: 'welcome_7d',
    daysBeforeJoining: 7,
    stageName: '7 Days Before – The Story You\'re Joining',
    subject: "7 days to go, {{Name}}! Here's the story you're joining",
    getFirstName: extractFirstName,
    getSubject: (firstName: string) => `7 days to go, ${firstName}! Here's the story you're joining`,
    getBodyText: (firstName: string, candidate?: Candidate) => {
      const cand = candidate || { id: 'FA-1001', name: firstName, email: '', phone: '', role: '', department: '', joiningDate: '', reportingTime: '', officeAddress: '', officeCity: '', lunchInfo: '', dressCode: '', reportingManager: '', reportingManagerRole: '', hrbp: { name: 'Twinkle Verma', email: 'twinkle.verma@fieldassist.com', phone: '', role: 'HRBP' }, status: 'Offer Accepted', formStatus: 'Not Started', formData: {} as any, documents: [], milestones: [], schedule: [] };
      return renderFirestoreTemplate('welcome_7d', cand, firstName).bodyText;
    },
    getHtmlContent: (firstName: string, candidate?: Candidate) => {
      const cand = candidate || { id: 'FA-1001', name: firstName, email: '', phone: '', role: '', department: '', joiningDate: '', reportingTime: '', officeAddress: '', officeCity: '', lunchInfo: '', dressCode: '', reportingManager: '', reportingManagerRole: '', hrbp: { name: 'Twinkle Verma', email: 'twinkle.verma@fieldassist.com', phone: '', role: 'HRBP' }, status: 'Offer Accepted', formStatus: 'Not Started', formData: {} as any, documents: [], milestones: [], schedule: [] };
      return renderFirestoreTemplate('welcome_7d', cand, firstName).bodyHtml;
    }
  },

  culture_5d: {
    key: 'culture_5d',
    daysBeforeJoining: 5,
    stageName: '5 Days Before – Everyone Gets to Build',
    subject: '5 days to go, {{Name}}! At FieldAssist, everyone gets to build',
    getFirstName: extractFirstName,
    getSubject: (firstName: string) => `5 days to go, ${firstName}! At FieldAssist, everyone gets to build`,
    getBodyText: (firstName: string, candidate?: Candidate) => {
      const cand = candidate || { id: 'FA-1001', name: firstName, email: '', phone: '', role: '', department: '', joiningDate: '', reportingTime: '', officeAddress: '', officeCity: '', lunchInfo: '', dressCode: '', reportingManager: '', reportingManagerRole: '', hrbp: { name: 'Twinkle Verma', email: 'twinkle.verma@fieldassist.com', phone: '', role: 'HRBP' }, status: 'Offer Accepted', formStatus: 'Not Started', formData: {} as any, documents: [], milestones: [], schedule: [] };
      return renderFirestoreTemplate('culture_5d', cand, firstName).bodyText;
    },
    getHtmlContent: (firstName: string, candidate?: Candidate) => {
      const cand = candidate || { id: 'FA-1001', name: firstName, email: '', phone: '', role: '', department: '', joiningDate: '', reportingTime: '', officeAddress: '', officeCity: '', lunchInfo: '', dressCode: '', reportingManager: '', reportingManagerRole: '', hrbp: { name: 'Twinkle Verma', email: 'twinkle.verma@fieldassist.com', phone: '', role: 'HRBP' }, status: 'Offer Accepted', formStatus: 'Not Started', formData: {} as any, documents: [], milestones: [], schedule: [] };
      return renderFirestoreTemplate('culture_5d', cand, firstName).bodyHtml;
    }
  },

  comm_3d: {
    key: 'comm_3d',
    daysBeforeJoining: 3,
    stageName: '3 Days Before – World Stage & NDTV Profit',
    subject: '3 day to go, {{Name}}! FieldAssist on the world stage and on NDTV Profit',
    getFirstName: extractFirstName,
    getSubject: (firstName: string) => `3 day to go, ${firstName}! FieldAssist on the world stage and on NDTV Profit`,
    getBodyText: (firstName: string, candidate?: Candidate) => {
      const cand = candidate || { id: 'FA-1001', name: firstName, email: '', phone: '', role: '', department: '', joiningDate: '', reportingTime: '', officeAddress: '', officeCity: '', lunchInfo: '', dressCode: '', reportingManager: '', reportingManagerRole: '', hrbp: { name: 'Twinkle Verma', email: 'twinkle.verma@fieldassist.com', phone: '', role: 'HRBP' }, status: 'Offer Accepted', formStatus: 'Not Started', formData: {} as any, documents: [], milestones: [], schedule: [] };
      return renderFirestoreTemplate('comm_3d', cand, firstName).bodyText;
    },
    getHtmlContent: (firstName: string, candidate?: Candidate) => {
      const cand = candidate || { id: 'FA-1001', name: firstName, email: '', phone: '', role: '', department: '', joiningDate: '', reportingTime: '', officeAddress: '', officeCity: '', lunchInfo: '', dressCode: '', reportingManager: '', reportingManagerRole: '', hrbp: { name: 'Twinkle Verma', email: 'twinkle.verma@fieldassist.com', phone: '', role: 'HRBP' }, status: 'Offer Accepted', formStatus: 'Not Started', formData: {} as any, documents: [], milestones: [], schedule: [] };
      return renderFirestoreTemplate('comm_3d', cand, firstName).bodyHtml;
    }
  },

  day1_1d: {
    key: 'day1_1d',
    daysBeforeJoining: 1,
    stageName: '1 Day Before – Final Day-1 Guide',
    subject: 'Tomorrow’s the Day! Here’s Everything You Need for Day 1 🚀',
    getFirstName: extractFirstName,
    getBodyText: (firstName: string, candidate?: Candidate) => {
      const accessCode = (candidate?.accessCode || candidate?.id || 'FA-PORTAL').trim();
      const portalUrl = getCandidateAccessUrl(accessCode);
      const joiningDate = candidate?.joiningDate ? formatJoiningDate(candidate.joiningDate, { month: 'long', day: 'numeric', year: 'numeric' }) : 'Tomorrow';
      const reportingTime = candidate?.reportingTime || '11:00 AM';
      const isRemote = candidate?.workMode === 'Remote';
      const locationName = isRemote ? 'Remote / Work From Home' : (candidate?.joiningLocation?.name || candidate?.officeCity || 'Office Hub');
      const address = isRemote ? (candidate?.remoteInstructions || 'Remote joining instructions will be delivered to your inbox.') : (candidate?.officeAddress || 'Registered Office Address');
      const dressCode = candidate?.dressCode || 'Smart Casuals';

      let scheduleItems = candidate?.schedule || [];
      if (isRemote) {
        scheduleItems = scheduleItems.filter(item => 
          !item.title.toLowerCase().includes('lunch') && 
          !item.description.toLowerCase().includes('lunch') &&
          item.location !== 'Cafeteria'
        );
      }

      const defaultRemoteScheduleText = `• 11:00 AM — Join the Call (Join the welcome call using the link in your email)\n• 11:50 AM — Laptop & IT Setup (Get your IT access and setup help. Your laptop is couriered before your joining date.)\n• 01:15 PM — HR Induction (Introduction to FieldAssist, culture, policies, benefits and important HR information.)\n• 03:00 PM — Buddy Meet (Meet your onboarding buddy and get familiar with the team.)\n• 04:30 PM — Pre-Onboarding Formalities (Complete remaining joining formalities and required documentation.)`;
      const defaultOfficeScheduleText = `• 11:00 AM — Arrival & Welcome\n• 11:20 AM — Laptop & Welcome Kit\n• 11:50 AM — HR Induction (Introduction to FieldAssist, culture & policies)\n• 01:15 PM — Welcome Lunch (Lunch with new joiners and team members)\n• 02:15 PM — Pre-Onboarding Formalities\n• 03:00 PM — Buddy Meet\n• 03:30 PM — Office Tour`;

      const scheduleText = scheduleItems.length > 0
        ? scheduleItems.map(item => `• ${item.time} — ${item.title} (${item.description})`).join('\n')
        : (isRemote ? defaultRemoteScheduleText : defaultOfficeScheduleText);

      return `Hi ${firstName},

The countdown is almost over — we’re excited to welcome you to FieldAssist tomorrow! 🎉

Here’s everything you need for a smooth start:

📍 YOUR DAY 1 DETAILS

Joining Date: ${joiningDate}
Reporting Time: ${reportingTime}
Location: ${locationName}
Address/Instructions: ${address}
Dress Code: ${dressCode}


🗓️ WHAT YOUR DAY LOOKS LIKE

${scheduleText}


🔗 CANDIDATE PORTAL & DAY 1 PASS
Access your digital onboarding portal anytime:
${portalUrl} (Access Code: ${accessCode})


💻 A QUICK NOTE

You don't need to carry any physical documents tomorrow.

All required documents are collected online, and the remaining employment formalities will be completed through Keka.

Just bring yourself, your enthusiasm, and any questions you may have. 😊

If you need any help before joining, feel free to reach out to HR (Twinkle Verma at twinkle.verma@fieldassist.com).

See you tomorrow! 🚀

Thanks & Regards,
Twinkle Verma | FieldAssist HR
${OFFICIAL_FOOTER_TEXT}`;
    },
    getHtmlContent: (firstName: string, candidate?: Candidate) => {
      const accessCode = (candidate?.accessCode || candidate?.id || 'FA-PORTAL').trim();
      const portalUrl = getCandidateAccessUrl(accessCode);
      const joiningDate = candidate?.joiningDate ? formatJoiningDate(candidate.joiningDate, { month: 'long', day: 'numeric', year: 'numeric' }) : 'Tomorrow';
      const reportingTime = candidate?.reportingTime || '11:00 AM';
      const isRemote = candidate?.workMode === 'Remote';
      const locationName = isRemote ? 'Remote / Work From Home' : (candidate?.joiningLocation?.name || candidate?.officeCity || 'Office Hub');
      const address = isRemote ? (candidate?.remoteInstructions || 'Remote joining instructions delivered via portal.') : (candidate?.officeAddress || 'Registered Office Address');
      const dressCode = candidate?.dressCode || 'Smart Casuals';

      let scheduleItems = candidate?.schedule || [];
      if (isRemote) {
        scheduleItems = scheduleItems.filter(item => 
          !item.title.toLowerCase().includes('lunch') && 
          !item.description.toLowerCase().includes('lunch') &&
          item.location !== 'Cafeteria'
        );
      }

      const defaultRemoteScheduleHtml = `<ul style="padding-left: 20px; line-height: 1.8;">
            <li><strong>11:00 AM</strong> — Join the Call <span style="color: #64748b;">(Join the welcome call using the link in your email)</span></li>
            <li><strong>11:50 AM</strong> — Laptop &amp; IT Setup <span style="color: #64748b;">(Get your IT access and setup help. Your laptop is couriered before your joining date.)</span></li>
            <li><strong>01:15 PM</strong> — HR Induction <span style="color: #64748b;">(Introduction to FieldAssist, culture, policies, benefits and important HR information.)</span></li>
            <li><strong>03:00 PM</strong> — Buddy Meet <span style="color: #64748b;">(Meet your onboarding buddy and get familiar with the team.)</span></li>
            <li><strong>04:30 PM</strong> — Pre-Onboarding Formalities <span style="color: #64748b;">(Complete remaining joining formalities and required documentation.)</span></li>
          </ul>`;
      const defaultOfficeScheduleHtml = `<ul style="padding-left: 20px; line-height: 1.8;">
            <li><strong>11:00 AM</strong> — Arrival &amp; Welcome</li>
            <li><strong>11:20 AM</strong> — Laptop &amp; Welcome Kit</li>
            <li><strong>11:50 AM</strong> — HR Induction (Get familiar with FieldAssist, our culture &amp; policies)</li>
            <li><strong>01:15 PM</strong> — Welcome Lunch (Lunch with new joiners and team members)</li>
            <li><strong>02:15 PM</strong> — Pre-Onboarding Formalities (Complete remaining joining formalities)</li>
            <li><strong>03:00 PM</strong> — Buddy Meet-up</li>
            <li><strong>03:30 PM</strong> — Office Tour</li>
          </ul>`;

      const scheduleHtml = scheduleItems.length > 0
        ? `<ul style="padding-left: 20px; line-height: 1.8;">` + scheduleItems.map(item => `<li><strong>${item.time}</strong> — ${item.title} <span style="color: #64748b;">(${item.description})</span></li>`).join('') + `</ul>`
        : (isRemote ? defaultRemoteScheduleHtml : defaultOfficeScheduleHtml);

      return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
  <div style="background: linear-gradient(135deg, #3730a3 0%, #4f46e5 100%); padding: 24px 32px; text-align: left;">
    <span style="color: #c7d2fe; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">FieldAssist Day 1</span>
    <h1 style="color: #ffffff; margin: 4px 0 0 0; font-size: 20px; font-weight: 800;">Tomorrow is Day 1! 🚀</h1>
  </div>
  <div style="padding: 32px;">
    <p style="margin-top: 0; font-size: 16px;">Hi <strong>${firstName}</strong>,</p>
    <p>The countdown is almost over — we’re excited to welcome you to FieldAssist tomorrow! 🎉</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1e1b4b; font-size: 15px;">📍 YOUR DAY 1 DETAILS</h3>
      <p style="margin: 6px 0; font-size: 14px;"><strong>Joining Date:</strong> ${joiningDate}</p>
      <p style="margin: 6px 0; font-size: 14px;"><strong>Reporting Time:</strong> ${reportingTime}</p>
      <p style="margin: 6px 0; font-size: 14px;"><strong>Location:</strong> ${locationName}</p>
      <p style="margin: 6px 0; font-size: 14px;"><strong>Address / Instructions:</strong> ${address}</p>
      <p style="margin: 6px 0; font-size: 14px;"><strong>Dress Code:</strong> ${dressCode}</p>
    </div>

    <h3 style="color: #1e1b4b; margin-top: 24px; margin-bottom: 8px; font-size: 15px;">🗓️ WHAT YOUR DAY LOOKS LIKE</h3>
    ${scheduleHtml}

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 18px; border-radius: 8px; margin: 24px 0;">
      <h4 style="margin-top: 0; color: #166534; font-size: 14px;">🔗 Candidate Onboarding Portal</h4>
      <p style="margin: 0 0 10px 0; font-size: 13px; color: #15803d;">You can view your onboarding checklist and campus details directly in your portal:</p>
      <a href="${portalUrl}" target="_blank" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; font-size: 13px;">Open Your Candidate Portal &rarr;</a>
      <div style="margin-top: 6px; font-size: 12px; color: #166534;">Access Code: <strong style="font-family: monospace;">${accessCode}</strong></div>
    </div>

    <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; padding: 16px; border-radius: 8px; margin: 24px 0;">
      <h4 style="margin-top: 0; color: #4c1d95; font-size: 14px;">💻 A QUICK NOTE</h4>
      <p style="margin-bottom: 8px; font-size: 13px;">You don't need to carry any physical documents tomorrow.</p>
      <p style="margin-bottom: 8px; font-size: 13px;">All required documents are collected online, and the remaining employment formalities will be completed through Keka.</p>
      <p style="margin: 0; font-size: 13px;">Just bring yourself, your enthusiasm, and any questions you may have. 😊</p>
    </div>

    <p style="font-size: 14px;">If you need any help before joining, feel free to reply directly to this email or reach out to HR (Twinkle Verma at <a href="mailto:twinkle.verma@fieldassist.com" style="color: #4f46e5; font-weight: 600;">twinkle.verma@fieldassist.com</a>).</p>
    <p style="font-weight: bold; font-size: 16px; color: #4f46e5;">See you tomorrow! 🚀</p>
    
    <p style="margin-top: 24px; margin-bottom: 0;">Thanks &amp; Regards,<br><strong>Twinkle Verma</strong><br><span style="color: #64748b; font-size: 13px;">FieldAssist HR</span></p>
    ${OFFICIAL_FOOTER_HTML}
  </div>
</div>`;
    }
  }
};
