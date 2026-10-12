// Production-grade email templates for FieldAssist HR Pre-Onboarding
import { AMMO_PREREAD_URL, FIELDASSIST_LINKS } from './_links.js';

export function extractFirstName(fullName) {
  if (!fullName) return 'Team Member';
  const clean = fullName.trim().split(' ')[0];
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase() || 'Team Member';
}

export function formatJoiningDate(dateStr) {
  if (!dateStr) return 'Upcoming';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
  } catch (e) {}
  return dateStr;
}

const FOOTER_HTML = `
  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.5;">
    <p style="margin: 0 0 6px 0; font-weight: bold; color: #475569;">FieldAssist (Flick2Know Technologies Pvt. Ltd.)</p>
    <p style="margin: 0 0 4px 0;">Corporate HQ: Plot No. 12, Sector 44, Gurugram, Haryana 122003, India</p>
    <p style="margin: 0;">This email is an official onboarding communication sent by FieldAssist HR. If you received this in error, please reply to <a href="mailto:twinkle.verma@fieldassist.com" style="color: #4f46e5;">twinkle.verma@fieldassist.com</a>.</p>
  </div>
`;

const FOOTER_TEXT = `
---
FieldAssist (Flick2Know Technologies Pvt. Ltd.)
Corporate HQ: Plot No. 12, Sector 44, Gurugram, Haryana 122003, India
Official HR Onboarding Communication | twinkle.verma@fieldassist.com
`;

export function getFullEmailContent(stageKey, candidate, origin = 'https://fieldassist-preonboarding.vercel.app') {
  const firstName = extractFirstName(candidate.name);
  const joiningDateFormatted = formatJoiningDate(candidate.joiningDate);
  const reportingTime = candidate.reportingTime || '10:30 AM';
  const accessCode = (candidate.accessCode || candidate.id || 'FA-PORTAL').trim();
  const base = (origin || 'https://fieldassist-preonboarding.vercel.app').replace(/\/+$/, '');
  const portalUrl = accessCode ? `${base}/?code=${encodeURIComponent(accessCode)}` : base;
  
  const isRemote = candidate.workMode === 'Remote';
  const locationName = isRemote ? 'Remote / Work From Home' : (candidate.joiningLocation?.name || candidate.officeCity || 'Gurgaon Corporate Hub');
  const address = isRemote
    ? (candidate.remoteInstructions || 'Remote joining instructions will be shared by HR.')
    : (candidate.officeAddress || 'Plot No. 12, Sector 44, Gurugram, Haryana 122003');
  const dressCode = candidate.dressCode || 'Smart Casuals';

  const ammoPrereadUrl = AMMO_PREREAD_URL;
  const goaHighlightsUrl = FIELDASSIST_LINKS.goaHighlights || FIELDASSIST_LINKS.linkedin;
  const linkedinUrl = FIELDASSIST_LINKS.linkedin;
  const instagramUrl = FIELDASSIST_LINKS.instagram;
  const newsletterUrl = FIELDASSIST_LINKS.newsletter;
  const pathfinderVideoUrl = FIELDASSIST_LINKS.youtube;
  const ambitionBoxUrl = FIELDASSIST_LINKS.ambitionBox;
  const glassdoorUrl = FIELDASSIST_LINKS.glassdoor;

  let subject = '';
  let bodyText = '';
  let bodyHtml = '';

  if (stageKey === 'account_ready') {
    subject = 'Your FieldAssist Account is Ready';
    bodyText = `Hi ${firstName},

Welcome to FieldAssist! We are thrilled to have you join our team.

Your candidate onboarding account is now ready. Please use your credentials below to log into the Candidate Portal and complete your Pre-Onboarding Form as soon as possible:

• Your Access Code: ${accessCode}
• Candidate Portal Login Link: ${portalUrl}

What to do next:
1. Click the portal link above to open your Candidate Portal.
2. Enter your Access Code (${accessCode}) or registered email to log in.
3. Complete the Pre-Onboarding Form with your personal details, emergency contact, and education details.
4. Upload your required identity and verification documents (Aadhaar Card, PAN Card, and passport-size photo).

Please log in and submit the form as soon as possible. Completing this promptly ensures your background verification, IT asset allocation, and welcome kit are prepared smoothly ahead of your Day 1.

If you have any questions or need support at any stage, feel free to reply directly to this email or reach out to HR (Twinkle Verma at twinkle.verma@fieldassist.com).

We can’t wait to welcome you aboard!

Thanks & Regards,
Twinkle Verma
FieldAssist HR
${FOOTER_TEXT}`;

    bodyHtml = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
  <div style="background: linear-gradient(135deg, #3730a3 0%, #4f46e5 100%); padding: 26px 32px; text-align: left;">
    <span style="color: #c7d2fe; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">FieldAssist Pre-Onboarding</span>
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
      <li style="margin-bottom: 6px;">Complete the Pre-Onboarding Form with your personal, contact, and emergency details.</li>
      <li style="margin-bottom: 6px;">Upload your required identity and verification documents (Aadhaar Card, PAN Card, and photo).</li>
    </ol>

    <div style="font-size: 13px; color: #1e40af; background-color: #eff6ff; padding: 14px 18px; border-left: 4px solid #3b82f6; border-radius: 6px; margin-bottom: 24px;">
      <strong>Please note:</strong> Please log in and submit the form as soon as possible. Completing this promptly allows us to finalize your IT asset allocation, background verification, and welcome kit ahead of your Day 1.
    </div>

    <p style="font-size: 14px; color: #334155;">
      If you have any questions or need support at any stage, feel free to reply directly to this email or contact HR (Twinkle Verma at <a href="mailto:twinkle.verma@fieldassist.com" style="color: #4f46e5; font-weight: 600;">twinkle.verma@fieldassist.com</a>).
    </p>

    <p style="margin-top: 24px; margin-bottom: 0;">Thanks &amp; Regards,<br><strong>Twinkle Verma</strong><br><span style="color: #64748b; font-size: 13px;">FieldAssist HR</span></p>
    ${FOOTER_HTML}
  </div>
</div>`;
  } else if (stageKey === 'welcome_7d') {
    subject = `7 days to go, ${firstName}! Here's the story you're joining`;
    bodyText = `Hi ${firstName},
7 days to go! On ${joiningDateFormatted}, you'll officially become part of FieldAssist, and we thought you should know the story you're stepping into.

FROM INDIA TO THE WORLD
FieldAssist started by helping CPG brands run smarter field operations. Today, some of the biggest names in the industry look to us for answers on how AI can transform the way field teams work, how retailers are understood, and how decisions get made in real time.
The best proof is FieldVerse.

WHAT IS FIELDVERSE?
FieldVerse is our invite-only, closed-door forum for senior CPG leaders. It is a room where CXOs talk openly with their peers about AI-led field execution, retail intelligence and real-time decision-making. No sales pitches. No demos. Just honest conversations.
After the success of FieldVerse India, the forum went global:
- Dubai
- Singapore
- Jakarta
- Nairobi, Kenya (newest)
- London (newest)

WHY THIS MATTERS TO YOU
When leaders from across the world choose to spend their time with us, it says something about the trust we've built and the work you'll be a part of from Day 1.
See it for yourself:
FieldVerse highlights
https://www.linkedin.com/feed/update/urn:li:activity:7507734851148734464

More moments from the forum
https://www.linkedin.com/feed/update/urn:li:activity:7500455075962744832
https://www.linkedin.com/feed/update/urn:li:activity:7488869657597370368
https://www.linkedin.com/feed/update/urn:li:activity:7486638886018830337

NEXT UP
In the coming days we'll share what life at FieldAssist looks like and what to expect on Day 1.
Questions in the meantime? Write to me anytime at twinkle.verma@fieldassist.com.
Can't wait to see you!

Warm regards,
Twinkle Verma | FieldAssist HR

Candidate Portal: ${portalUrl}
Access Code: ${accessCode}
${FOOTER_TEXT}`;

    bodyHtml = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
  <div style="background: linear-gradient(135deg, #3730a3 0%, #4f46e5 100%); padding: 24px 32px; text-align: left;">
    <span style="color: #c7d2fe; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">FieldAssist Onboarding</span>
    <h1 style="color: #ffffff; margin: 4px 0 0 0; font-size: 20px; font-weight: 800;">7 days to go, ${firstName}! Here's the story you're joining</h1>
  </div>
  <div style="padding: 32px;">
    <p style="margin-top: 0; font-size: 16px;">Hi <strong>${firstName}</strong>,</p>
    <p><strong>7 days to go!</strong> On <strong>${joiningDateFormatted}</strong>, you'll officially become part of FieldAssist, and we thought you should know the story you're stepping into.</p>
    
    <h3 style="color: #1e1b4b; font-size: 15px; font-weight: 800; margin: 24px 0 8px 0; text-transform: uppercase; letter-spacing: 0.03em;">FROM INDIA TO THE WORLD</h3>
    <p style="margin: 8px 0; font-size: 14px; line-height: 1.65; color: #1e293b;">FieldAssist started by helping CPG brands run smarter field operations. Today, some of the biggest names in the industry look to us for answers on how AI can transform the way field teams work, how retailers are understood, and how decisions get made in real time.</p>
    <p style="margin: 8px 0; font-size: 14px; line-height: 1.65; color: #1e293b;">The best proof is <strong>FieldVerse</strong>.</p>

    <h3 style="color: #1e1b4b; font-size: 15px; font-weight: 800; margin: 24px 0 8px 0; text-transform: uppercase; letter-spacing: 0.03em;">WHAT IS FIELDVERSE?</h3>
    <p style="margin: 8px 0; font-size: 14px; line-height: 1.65; color: #1e293b;">FieldVerse is our invite-only, closed-door forum for senior CPG leaders. It is a room where CXOs talk openly with their peers about AI-led field execution, retail intelligence and real-time decision-making. No sales pitches. No demos. Just honest conversations.</p>
    <p style="margin: 8px 0 4px 0; font-size: 14px; line-height: 1.65; color: #1e293b;">After the success of FieldVerse India, the forum went global:</p>
    <ul style="padding-left: 20px; margin: 8px 0 16px 0; font-size: 14px; color: #334155; line-height: 1.7;">
      <li>Dubai</li>
      <li>Singapore</li>
      <li>Jakarta</li>
      <li>Nairobi, Kenya (newest)</li>
      <li>London (newest)</li>
    </ul>

    <h3 style="color: #1e1b4b; font-size: 15px; font-weight: 800; margin: 24px 0 8px 0; text-transform: uppercase; letter-spacing: 0.03em;">WHY THIS MATTERS TO YOU</h3>
    <p style="margin: 8px 0; font-size: 14px; line-height: 1.65; color: #1e293b;">When leaders from across the world choose to spend their time with us, it says something about the trust we've built and the work you'll be a part of from Day 1.</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <p style="font-weight: bold; margin: 0 0 6px 0; color: #1e1b4b; font-size: 14px;">See it for yourself:</p>
      <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #4338ca;">FieldVerse highlights:</p>
      <p style="margin: 0 0 12px 0; font-size: 13px;"><a href="https://www.linkedin.com/feed/update/urn:li:activity:7507734851148734464" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; word-break: break-all;">https://www.linkedin.com/feed/update/urn:li:activity:7507734851148734464</a></p>
      
      <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #4338ca;">More moments from the forum:</p>
      <ul style="padding-left: 18px; margin: 0; font-size: 13px; line-height: 1.7;">
        <li style="margin-bottom: 4px;"><a href="https://www.linkedin.com/feed/update/urn:li:activity:7500455075962744832" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; word-break: break-all;">https://www.linkedin.com/feed/update/urn:li:activity:7500455075962744832</a></li>
        <li style="margin-bottom: 4px;"><a href="https://www.linkedin.com/feed/update/urn:li:activity:7488869657597370368" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; word-break: break-all;">https://www.linkedin.com/feed/update/urn:li:activity:7488869657597370368</a></li>
        <li><a href="https://www.linkedin.com/feed/update/urn:li:activity:7486638886018830337" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; word-break: break-all;">https://www.linkedin.com/feed/update/urn:li:activity:7486638886018830337</a></li>
      </ul>
    </div>

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

    <h3 style="color: #1e1b4b; font-size: 15px; font-weight: 800; margin: 24px 0 8px 0; text-transform: uppercase; letter-spacing: 0.03em;">NEXT UP</h3>
    <p style="margin: 8px 0; font-size: 14px; line-height: 1.65; color: #1e293b;">In the coming days we'll share what life at FieldAssist looks like and what to expect on Day 1.</p>
    <p style="margin: 8px 0; font-size: 14px; line-height: 1.65; color: #1e293b;">Questions in the meantime? Write to me anytime at <a href="mailto:twinkle.verma@fieldassist.com" style="color: #4f46e5; font-weight: 600;">twinkle.verma@fieldassist.com</a>.</p>
    <p style="margin: 8px 0 20px 0; font-size: 14px; line-height: 1.65; color: #1e293b;">Can't wait to see you!</p>

    <p style="margin-top: 24px; margin-bottom: 0;">Warm regards,<br><strong>Twinkle Verma</strong><br><span style="color: #64748b; font-size: 13px;">FieldAssist HR</span></p>
    ${FOOTER_HTML}
  </div>
</div>`;
  } else if (stageKey === 'culture_5d') {
    subject = `5 days to go, ${firstName}! At FieldAssist, everyone gets to build`;
    bodyText = `Hi ${firstName},

5 days to go! ${joiningDateFormatted} is almost here, and we're counting down with you.

Last time, we showed you how far FieldAssist has travelled. Today, we want to show you something that says a lot about how we think.

AI IS EVERYWHERE. SO BUILDING IS FOR EVERYONE.

At FieldAssist, we believe AI is not only for the tech team. It's a tool anyone can pick up. So we created AI-thon, a hackathon-style challenge built especially for our non-tech colleagues.
The brief was simple: take an idea of your own, use AI to bring it to life, and build something real.
WHAT HAPPENED
- People from non-tech teams came forward with ideas from their own day-to-day work
- They used AI to turn those ideas into working builds, no coding background needed
- A panel of judges reviewed every build and picked the best ones
- The winners received awards and recognition
- And the best part: the winning ideas didn't stay on a stage. They were put to use inside the company
WHAT THIS TELLS YOU ABOUT FIELDASSIST
At FieldAssist, a good idea matters more than your job title. If you can spot a problem and imagine a better way, you can build it, and we'll back you.
SEE IT FOR YOURSELF
The latest from AI-thon:
https://www.linkedin.com/feed/update/urn:li:activity:7500126538240245760

More moments from AI-thon:
https://www.linkedin.com/feed/update/urn:li:activity:7495436037582811136
https://www.linkedin.com/feed/update/urn:li:activity:7494054891640741888
https://www.linkedin.com/feed/update/urn:li:activity:7491108371924922368
https://www.linkedin.com/feed/update/urn:li:activity:7485952306807562240
https://www.linkedin.com/feed/update/urn:li:activity:7480251796720861184
https://www.linkedin.com/feed/update/urn:li:activity:7477988434884661249
https://www.linkedin.com/feed/update/urn:li:activity:7474742241740210176
https://www.linkedin.com/feed/update/urn:li:activity:7472989053064224768
https://www.linkedin.com/feed/update/urn:li:activity:7470091441378279425

So start thinking: what would you build?
Your next big idea could be the one we all end up using. We can't wait to hear it.
See you very soon!
Warm regards,
Twinkle Verma | FieldAssist HR

Candidate Portal: ${portalUrl}
Access Code: ${accessCode}
${FOOTER_TEXT}`;

    bodyHtml = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
  <div style="background: linear-gradient(135deg, #3730a3 0%, #4f46e5 100%); padding: 24px 32px; text-align: left;">
    <span style="color: #c7d2fe; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">Life at FieldAssist</span>
    <h1 style="color: #ffffff; margin: 4px 0 0 0; font-size: 20px; font-weight: 800;">5 days to go, ${firstName}! At FieldAssist, everyone gets to build</h1>
  </div>
  <div style="padding: 32px;">
    <p style="margin-top: 0; font-size: 16px;">Hi <strong>${firstName}</strong>,</p>
    <p><strong>5 days to go!</strong> ${joiningDateFormatted} is almost here, and we're counting down with you.</p>
    <p>Last time, we showed you how far FieldAssist has travelled. Today, we want to show you something that says a lot about how we think.</p>
    
    <h3 style="color: #1e1b4b; font-size: 15px; font-weight: 800; margin: 24px 0 8px 0; text-transform: uppercase; letter-spacing: 0.03em;">AI IS EVERYWHERE. SO BUILDING IS FOR EVERYONE.</h3>
    <p style="margin: 8px 0; font-size: 14px; line-height: 1.65; color: #1e293b;">At FieldAssist, we believe AI is not only for the tech team. It's a tool anyone can pick up. So we created <strong>AI-thon</strong>, a hackathon-style challenge built especially for our non-tech colleagues.</p>
    <p style="margin: 8px 0; font-size: 14px; line-height: 1.65; color: #1e293b;">The brief was simple: take an idea of your own, use AI to bring it to life, and build something real.</p>

    <h3 style="color: #1e1b4b; font-size: 15px; font-weight: 800; margin: 24px 0 8px 0; text-transform: uppercase; letter-spacing: 0.03em;">WHAT HAPPENED</h3>
    <ul style="padding-left: 20px; margin: 8px 0 16px 0; font-size: 14px; color: #334155; line-height: 1.7;">
      <li>People from non-tech teams came forward with ideas from their own day-to-day work</li>
      <li>They used AI to turn those ideas into working builds, no coding background needed</li>
      <li>A panel of judges reviewed every build and picked the best ones</li>
      <li>The winners received awards and recognition</li>
      <li>And the best part: the winning ideas didn't stay on a stage. They were put to use inside the company</li>
    </ul>

    <h3 style="color: #1e1b4b; font-size: 15px; font-weight: 800; margin: 24px 0 8px 0; text-transform: uppercase; letter-spacing: 0.03em;">WHAT THIS TELLS YOU ABOUT FIELDASSIST</h3>
    <p style="margin: 8px 0; font-size: 14px; line-height: 1.65; color: #1e293b;">At FieldAssist, a good idea matters more than your job title. If you can spot a problem and imagine a better way, you can build it, and we'll back you.</p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <p style="font-weight: bold; margin: 0 0 6px 0; color: #1e1b4b; font-size: 14px;">SEE IT FOR YOURSELF</p>
      <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #4338ca;">The latest from AI-thon:</p>
      <p style="margin: 0 0 12px 0; font-size: 13px;"><a href="https://www.linkedin.com/feed/update/urn:li:activity:7500126538240245760" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; word-break: break-all;">https://www.linkedin.com/feed/update/urn:li:activity:7500126538240245760</a></p>
      
      <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #4338ca;">More moments from AI-thon:</p>
      <ul style="padding-left: 18px; margin: 0; font-size: 13px; line-height: 1.7;">
        <li style="margin-bottom: 4px;"><a href="https://www.linkedin.com/feed/update/urn:li:activity:7495436037582811136" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; word-break: break-all;">https://www.linkedin.com/feed/update/urn:li:activity:7495436037582811136</a></li>
        <li style="margin-bottom: 4px;"><a href="https://www.linkedin.com/feed/update/urn:li:activity:7494054891640741888" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; word-break: break-all;">https://www.linkedin.com/feed/update/urn:li:activity:7494054891640741888</a></li>
        <li style="margin-bottom: 4px;"><a href="https://www.linkedin.com/feed/update/urn:li:activity:7491108371924922368" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; word-break: break-all;">https://www.linkedin.com/feed/update/urn:li:activity:7491108371924922368</a></li>
        <li style="margin-bottom: 4px;"><a href="https://www.linkedin.com/feed/update/urn:li:activity:7485952306807562240" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; word-break: break-all;">https://www.linkedin.com/feed/update/urn:li:activity:7485952306807562240</a></li>
        <li style="margin-bottom: 4px;"><a href="https://www.linkedin.com/feed/update/urn:li:activity:7480251796720861184" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; word-break: break-all;">https://www.linkedin.com/feed/update/urn:li:activity:7480251796720861184</a></li>
        <li style="margin-bottom: 4px;"><a href="https://www.linkedin.com/feed/update/urn:li:activity:7477988434884661249" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; word-break: break-all;">https://www.linkedin.com/feed/update/urn:li:activity:7477988434884661249</a></li>
        <li style="margin-bottom: 4px;"><a href="https://www.linkedin.com/feed/update/urn:li:activity:7474742241740210176" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; word-break: break-all;">https://www.linkedin.com/feed/update/urn:li:activity:7474742241740210176</a></li>
        <li style="margin-bottom: 4px;"><a href="https://www.linkedin.com/feed/update/urn:li:activity:7472989053064224768" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; word-break: break-all;">https://www.linkedin.com/feed/update/urn:li:activity:7472989053064224768</a></li>
        <li><a href="https://www.linkedin.com/feed/update/urn:li:activity:7470091441378279425" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; word-break: break-all;">https://www.linkedin.com/feed/update/urn:li:activity:7470091441378279425</a></li>
      </ul>
    </div>

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

    <p style="margin: 16px 0 8px 0; font-size: 14px; line-height: 1.65; color: #1e293b;">So start thinking: <strong>what would you build?</strong></p>
    <p style="margin: 8px 0; font-size: 14px; line-height: 1.65; color: #1e293b;">Your next big idea could be the one we all end up using. We can't wait to hear it.</p>
    <p style="margin: 8px 0 20px 0; font-size: 14px; line-height: 1.65; color: #1e293b;">See you very soon!</p>

    <p style="margin-top: 24px; margin-bottom: 0;">Warm regards,<br><strong>Twinkle Verma</strong><br><span style="color: #64748b; font-size: 13px;">FieldAssist HR</span></p>
    ${FOOTER_HTML}
  </div>
</div>`;
  } else if (stageKey === 'comm_3d') {
    subject = `3 day to go, ${firstName}! FieldAssist on the world stage and on NDTV Profit`;
    bodyText = `Hi ${firstName},

Just 3 day to go! Tomorrow is ${joiningDateFormatted}, and before you walk in, we'd like you to see how FieldAssist is showing up, on the global stage and in the national spotlight.

1. ON THE GLOBAL STAGE: GROCERYSHOP 2026

Groceryshop, held in Las Vegas, is one of the retail industry's most influential global events, bringing together leaders from retail, CPG and consumer brands. FieldAssist took part to make one point: the next big AI opportunity in retail isn't only online. It's inside the store, where most grocery sales still happen.

That is where our Perfect Store comes in: the right products, in the right stores, in the right quantities, executed the right way. Doing this consistently across thousands of stores is the hard part. Brands need to know which micromarkets matter, what assortment belongs in each store, how much to stock and where shelf execution is breaking.

At our booth, the team showcased the Agentic Perfect Store, which spots execution gaps, flags what needs attention and guides field teams to the right action faster, turning shelf gaps into sales opportunities. Our leadership also met CPG and retail leaders to discuss what stronger execution unlocks, from productivity and decision velocity to revenue growth.

The message is simple: move from store-level visibility to store-level action, store by store.

Groceryshop 2026 highlights:
https://www.linkedin.com/feed/update/urn:li:activity:7509223401954283520

More from the event:
https://www.linkedin.com/feed/update/urn:li:activity:7506676960077656066
https://www.linkedin.com/feed/update/urn:li:activity:7506321134439669760

2. IN THE NATIONAL SPOTLIGHT: NDTV PROFIT

FieldAssist was featured on NDTV Profit's The Great Business Story: Transforming India, a series on the ideas, people and technology shaping how India does business.

In a special segment, our Co-Founder & CEO, Divir Tiwari, shared how AI-native Route-to-Market is reshaping CPG, from faster decision-making to smarter last-mile execution. The segment showed how brands can move beyond dashboards and visibility to build intelligent, responsive, execution-led RTM systems, and how FieldAssist helps FMCG and consumer brands turn field intelligence into smarter decisions and stronger execution.

The latest from the segment:
https://www.linkedin.com/feed/update/urn:li:activity:7512467128868868096

More from the feature:
https://www.linkedin.com/feed/update/urn:li:activity:7512041039675781120
https://www.linkedin.com/feed/update/urn:li:activity:7511960782666915840
https://www.linkedin.com/feed/update/urn:li:activity:7511422371392794624

Tomorrow, you become part of this story.

Any last-minute questions? Write to me anytime at twinkle.verma@fieldassist.com.

Warm regards,
Twinkle Verma | FieldAssist HR

Candidate Portal: ${portalUrl}
Access Code: ${accessCode}
${FOOTER_TEXT}`;

    bodyHtml = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
  <div style="background: linear-gradient(135deg, #3730a3 0%, #4f46e5 100%); padding: 24px 32px; text-align: left;">
    <span style="color: #c7d2fe; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">FieldAssist Spotlight</span>
    <h1 style="color: #ffffff; margin: 4px 0 0 0; font-size: 20px; font-weight: 800;">3 day to go, ${firstName}! FieldAssist on the world stage and on NDTV Profit</h1>
  </div>
  <div style="padding: 32px;">
    <p style="margin-top: 0; font-size: 16px;">Hi <strong>${firstName}</strong>,</p>
    <p><strong>Just 3 day to go!</strong> Tomorrow is <strong>${joiningDateFormatted}</strong>, and before you walk in, we'd like you to see how FieldAssist is showing up, on the global stage and in the national spotlight.</p>
    
    <h3 style="color: #1e1b4b; font-size: 15px; font-weight: 800; margin: 24px 0 8px 0; text-transform: uppercase; letter-spacing: 0.03em;">1. ON THE GLOBAL STAGE: GROCERYSHOP 2026</h3>
    <p style="margin: 8px 0; font-size: 14px; line-height: 1.65; color: #1e293b;">Groceryshop, held in Las Vegas, is one of the retail industry's most influential global events, bringing together leaders from retail, CPG and consumer brands. FieldAssist took part to make one point: the next big AI opportunity in retail isn't only online. It's inside the store, where most grocery sales still happen.</p>
    <p style="margin: 8px 0; font-size: 14px; line-height: 1.65; color: #1e293b;">That is where our <strong>Perfect Store</strong> comes in: the right products, in the right stores, in the right quantities, executed the right way. Doing this consistently across thousands of stores is the hard part. Brands need to know which micromarkets matter, what assortment belongs in each store, how much to stock and where shelf execution is breaking.</p>
    <p style="margin: 8px 0; font-size: 14px; line-height: 1.65; color: #1e293b;">At our booth, the team showcased the Agentic Perfect Store, which spots execution gaps, flags what needs attention and guides field teams to the right action faster, turning shelf gaps into sales opportunities. Our leadership also met CPG and retail leaders to discuss what stronger execution unlocks, from productivity and decision velocity to revenue growth.</p>
    <p style="margin: 8px 0; font-size: 14px; line-height: 1.65; color: #1e293b;">The message is simple: move from store-level visibility to store-level action, store by store.</p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <p style="font-weight: bold; margin: 0 0 6px 0; color: #1e1b4b; font-size: 14px;">Groceryshop 2026 highlights:</p>
      <p style="margin: 0 0 12px 0; font-size: 13px;"><a href="https://www.linkedin.com/feed/update/urn:li:activity:7509223401954283520" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; word-break: break-all;">https://www.linkedin.com/feed/update/urn:li:activity:7509223401954283520</a></p>
      
      <p style="font-weight: bold; margin: 0 0 6px 0; color: #1e1b4b; font-size: 14px;">More from the event:</p>
      <ul style="padding-left: 18px; margin: 0; font-size: 13px; line-height: 1.7;">
        <li style="margin-bottom: 4px;"><a href="https://www.linkedin.com/feed/update/urn:li:activity:7506676960077656066" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; word-break: break-all;">https://www.linkedin.com/feed/update/urn:li:activity:7506676960077656066</a></li>
        <li><a href="https://www.linkedin.com/feed/update/urn:li:activity:7506321134439669760" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; word-break: break-all;">https://www.linkedin.com/feed/update/urn:li:activity:7506321134439669760</a></li>
      </ul>
    </div>

    <h3 style="color: #1e1b4b; font-size: 15px; font-weight: 800; margin: 24px 0 8px 0; text-transform: uppercase; letter-spacing: 0.03em;">2. IN THE NATIONAL SPOTLIGHT: NDTV PROFIT</h3>
    <p style="margin: 8px 0; font-size: 14px; line-height: 1.65; color: #1e293b;">FieldAssist was featured on NDTV Profit's <em>The Great Business Story: Transforming India</em>, a series on the ideas, people and technology shaping how India does business.</p>
    <p style="margin: 8px 0; font-size: 14px; line-height: 1.65; color: #1e293b;">In a special segment, our Co-Founder &amp; CEO, Divir Tiwari, shared how AI-native Route-to-Market is reshaping CPG, from faster decision-making to smarter last-mile execution. The segment showed how brands can move beyond dashboards and visibility to build intelligent, responsive, execution-led RTM systems, and how FieldAssist helps FMCG and consumer brands turn field intelligence into smarter decisions and stronger execution.</p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <p style="font-weight: bold; margin: 0 0 6px 0; color: #1e1b4b; font-size: 14px;">The latest from the segment:</p>
      <p style="margin: 0 0 12px 0; font-size: 13px;"><a href="https://www.linkedin.com/feed/update/urn:li:activity:7512467128868868096" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; word-break: break-all;">https://www.linkedin.com/feed/update/urn:li:activity:7512467128868868096</a></p>
      
      <p style="font-weight: bold; margin: 0 0 6px 0; color: #1e1b4b; font-size: 14px;">More from the feature:</p>
      <ul style="padding-left: 18px; margin: 0; font-size: 13px; line-height: 1.7;">
        <li style="margin-bottom: 4px;"><a href="https://www.linkedin.com/feed/update/urn:li:activity:7512041039675781120" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; word-break: break-all;">https://www.linkedin.com/feed/update/urn:li:activity:7512041039675781120</a></li>
        <li style="margin-bottom: 4px;"><a href="https://www.linkedin.com/feed/update/urn:li:activity:7511960782666915840" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; word-break: break-all;">https://www.linkedin.com/feed/update/urn:li:activity:7511960782666915840</a></li>
        <li><a href="https://www.linkedin.com/feed/update/urn:li:activity:7511422371392794624" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: underline; word-break: break-all;">https://www.linkedin.com/feed/update/urn:li:activity:7511422371392794624</a></li>
      </ul>
    </div>

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

    <p style="margin: 16px 0 8px 0; font-size: 14px; line-height: 1.65; color: #1e293b;">Tomorrow, you become part of this story.</p>
    <p style="margin: 8px 0 20px 0; font-size: 14px; line-height: 1.65; color: #1e293b;">Any last-minute questions? Write to me anytime at <a href="mailto:twinkle.verma@fieldassist.com" style="color: #4f46e5; font-weight: 600;">twinkle.verma@fieldassist.com</a>.</p>

    <p style="margin-top: 24px; margin-bottom: 0;">Warm regards,<br><strong>Twinkle Verma</strong><br><span style="color: #64748b; font-size: 13px;">FieldAssist HR</span></p>
    ${FOOTER_HTML}
  </div>
</div>`;
  } else if (stageKey === 'day1_1d') {
    subject = 'Tomorrow’s the Day! Here’s Everything You Need for Day 1 🚀';
    
    let scheduleItems = candidate.schedule || [];
    if (isRemote) {
      scheduleItems = scheduleItems.filter(item => 
        !item.title.toLowerCase().includes('lunch') && 
        !item.description.toLowerCase().includes('lunch') &&
        item.location !== 'Cafeteria'
      );
    }

    const defaultRemoteScheduleText = `• 11:00 AM — Join the Call (Join the welcome call using the link in your email)\n• 11:50 AM — Laptop & IT Setup (Get your IT access and setup help. Your laptop is couriered before your joining date.)\n• 01:15 PM — HR Induction (Introduction to FieldAssist, culture, policies, benefits and important HR information.)\n• 03:00 PM — Buddy Meet (Meet your onboarding buddy and get familiar with the team.)\n• 04:30 PM — Pre-Onboarding Formalities (Complete remaining joining formalities and required documentation.)`;
    const defaultOfficeScheduleText = `• 11:00 AM — Arrival & Welcome\n• 11:20 AM — Laptop & Welcome Kit\n• 11:50 AM — HR Induction (Get familiar with FieldAssist, our culture & policies)\n• 01:15 PM — Welcome Lunch (Lunch with new joiners and team members)\n• 02:15 PM — Pre-Onboarding Formalities\n• 03:00 PM — Buddy Meet\n• 03:30 PM — Office Tour`;

    const scheduleText = scheduleItems.length > 0
      ? scheduleItems.map(item => `• ${item.time} — ${item.title} (${item.description})`).join('\n')
      : (isRemote ? defaultRemoteScheduleText : defaultOfficeScheduleText);

    const defaultRemoteScheduleHtml = `<ul style="padding-left: 20px; line-height: 1.8; font-size: 14px;">
          <li><strong>11:00 AM</strong> — Join the Call <span style="color: #64748b;">(Join the welcome call using the link in your email)</span></li>
          <li><strong>11:50 AM</strong> — Laptop &amp; IT Setup <span style="color: #64748b;">(Get your IT access and setup help. Your laptop is couriered before your joining date.)</span></li>
          <li><strong>01:15 PM</strong> — HR Induction <span style="color: #64748b;">(Introduction to FieldAssist, culture, policies, benefits and important HR information.)</span></li>
          <li><strong>03:00 PM</strong> — Buddy Meet <span style="color: #64748b;">(Meet your onboarding buddy and get familiar with the team.)</span></li>
          <li><strong>04:30 PM</strong> — Pre-Onboarding Formalities <span style="color: #64748b;">(Complete remaining joining formalities and required documentation.)</span></li>
        </ul>`;
    const defaultOfficeScheduleHtml = `<ul style="padding-left: 20px; line-height: 1.8; font-size: 14px;">
          <li><strong>11:00 AM</strong> — Arrival &amp; Welcome</li>
          <li><strong>11:20 AM</strong> — Laptop &amp; Welcome Kit</li>
          <li><strong>11:50 AM</strong> — HR Induction (Get familiar with FieldAssist, our culture &amp; policies)</li>
          <li><strong>01:15 PM</strong> — Welcome Lunch (Lunch with new joiners and team members)</li>
          <li><strong>02:15 PM</strong> — Pre-Onboarding Formalities (Complete remaining joining formalities)</li>
          <li><strong>03:00 PM</strong> — Buddy Meet-up</li>
          <li><strong>03:30 PM</strong> — Office Tour</li>
        </ul>`;

    const scheduleHtml = scheduleItems.length > 0
      ? `<ul style="padding-left: 20px; line-height: 1.8; font-size: 14px;">` + scheduleItems.map(item => `<li><strong>${item.time}</strong> — ${item.title} <span style="color: #64748b;">(${item.description})</span></li>`).join('') + `</ul>`
      : (isRemote ? defaultRemoteScheduleHtml : defaultOfficeScheduleHtml);

    bodyText = `Hi ${firstName},

The countdown is almost over — we’re excited to welcome you to FieldAssist tomorrow! 🎉

Here’s everything you need for a smooth start:

📍 YOUR DAY 1 DETAILS
Joining Date: ${joiningDateFormatted}
Reporting Time: ${reportingTime}
Location: ${locationName}
Address / Instructions: ${address}
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

If you need any help before joining, feel free to reply directly to this email or reach out to HR (Twinkle Verma at twinkle.verma@fieldassist.com).

See you tomorrow! 🚀

Thanks & Regards,
Twinkle Verma | FieldAssist HR
${FOOTER_TEXT}`;

    bodyHtml = `
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
      <p style="margin: 6px 0; font-size: 14px;"><strong>Joining Date:</strong> ${joiningDateFormatted}</p>
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

    <p style="font-size: 14px;">If you need any help before joining, feel free to reply directly to this email or reach out to HR.</p>
    <p style="font-weight: bold; font-size: 16px; color: #4f46e5;">See you tomorrow! 🚀</p>
    
    <p style="margin-top: 24px; margin-bottom: 0;">Thanks &amp; Regards,<br><strong>Twinkle Verma</strong><br><span style="color: #64748b; font-size: 13px;">FieldAssist HR</span></p>
    ${FOOTER_HTML}
  </div>
</div>`;
  }

  return { subject, bodyText, bodyHtml };
}
