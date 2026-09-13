import { sendEmail } from './_emailHelper.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { candidateData, stageKey, forceResend } = body;

    if (!candidateData || !candidateData.email) {
      return res.status(400).json({ success: false, errorMessage: 'Candidate data with email is required' });
    }

    const candidate = candidateData;
    const name = candidate.name || 'Team Member';
    const firstName = name.trim().split(' ')[0] || 'Team Member';
    const accessCode = candidate.accessCode || 'FA-PORTAL';

    let subject = 'Welcome to FieldAssist';
    let bodyText = '';
    let bodyHtml = '';

    if (stageKey === 'account_ready') {
      subject = 'Your FieldAssist Account is Ready';
      bodyText = `Hi ${firstName},\n\nWelcome to FieldAssist! We are thrilled to have you join our team.\n\nYour candidate onboarding account is now ready.\n\nYour Access Code: ${accessCode}\n\nPlease complete your Pre-Onboarding Form as soon as possible.\n\nThanks & Regards,\nTwinkle Verma\nFieldAssist HR`;
      bodyHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #4338ca; margin-top: 0;">Your FieldAssist Account is Ready</h2>
        <p>Hi <strong>${firstName}</strong>,</p>
        <p>Welcome to FieldAssist! We are thrilled to have you join our team.</p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <div style="font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase;">Your Access Code</div>
          <div style="font-size: 24px; font-weight: bold; color: #4338ca; font-family: monospace; letter-spacing: 2px;">${accessCode}</div>
        </div>
        <p>Please log in and submit your Pre-Onboarding Form with required documents as soon as possible.</p>
        <p>Thanks &amp; Regards,<br/><strong>Twinkle Verma</strong><br/>FieldAssist HR</p>
      </div>`;
    } else if (stageKey === 'welcome_7d') {
      subject = 'Welcome to FieldAssist – Your Onboarding Journey Starts Here!';
      bodyText = `Hi ${firstName},\n\nCongratulations once again—and a warm welcome to FieldAssist!\n\nWe’re thrilled to have you as part of our growing team. Your journey with us is just beginning.\n\nJoining Date: ${candidate.joiningDate || 'Upcoming'}\n\nWarm regards,\nTwinkle Verma\nFieldAssist HR`;
      bodyHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #4338ca; margin-top: 0;">Welcome to FieldAssist!</h2>
        <p>Hi <strong>${firstName}</strong>,</p>
        <p>Congratulations once again—and a warm welcome to FieldAssist! We’re thrilled to have you as part of our team.</p>
        <p>Your joining date is scheduled for: <strong>${candidate.joiningDate || 'Upcoming'}</strong>.</p>
        <p>Warm regards,<br/><strong>Twinkle Verma</strong><br/>FieldAssist HR</p>
      </div>`;
    } else if (stageKey === 'culture_5d') {
      subject = 'Inside FieldAssist – Our Culture, Values & Team';
      bodyText = `Hi ${firstName},\n\nAs your joining date approaches, we wanted to give you a quick glimpse into the culture, values, and people that make FieldAssist special.\n\nWarm regards,\nTwinkle Verma\nFieldAssist HR`;
      bodyHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #4338ca; margin-top: 0;">Inside FieldAssist</h2>
        <p>Hi <strong>${firstName}</strong>,</p>
        <p>As your joining date approaches, we wanted to share our culture, core values, and community with you!</p>
        <p>Warm regards,<br/><strong>Twinkle Verma</strong><br/>FieldAssist HR</p>
      </div>`;
    } else if (stageKey === 'comm_3d') {
      subject = 'Preparing for Day 1 – Tools, Equipment & Work Setup';
      bodyText = `Hi ${firstName},\n\nWith just a few days left until your first day, we are finalizing all your work tools, accounts, and workstation setup.\n\nWarm regards,\nTwinkle Verma\nFieldAssist HR`;
      bodyHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #4338ca; margin-top: 0;">Preparing for Day 1</h2>
        <p>Hi <strong>${firstName}</strong>,</p>
        <p>With just a few days to go, we are getting your workstation, laptop, and accounts ready for you.</p>
        <p>Warm regards,<br/><strong>Twinkle Verma</strong><br/>FieldAssist HR</p>
      </div>`;
    } else if (stageKey === 'day1_1d') {
      subject = 'Tomorrow is the Big Day! See You at FieldAssist';
      bodyText = `Hi ${firstName},\n\nTomorrow is your first official day at FieldAssist! We could not be more excited to welcome you in person.\n\nReporting Time: ${candidate.reportingTime || '11:00 AM'}\nOffice: ${candidate.officeAddress || 'Gurgaon Office'}\n\nSee you tomorrow!\nTwinkle Verma\nFieldAssist HR`;
      bodyHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #4338ca; margin-top: 0;">Tomorrow is Day 1!</h2>
        <p>Hi <strong>${firstName}</strong>,</p>
        <p>Tomorrow is your first official day at FieldAssist! We are excited to welcome you.</p>
        <p><strong>Reporting Time:</strong> ${candidate.reportingTime || '11:00 AM'}<br/>
        <strong>Office Location:</strong> ${candidate.officeAddress || 'Gurgaon Office'}</p>
        <p>See you tomorrow,<br/><strong>Twinkle Verma</strong><br/>FieldAssist HR</p>
      </div>`;
    }

    const dispatchResult = await sendEmail({
      toEmail: candidate.email,
      toName: candidate.name,
      subject,
      bodyText,
      bodyHtml,
    });

    const nowIso = new Date().toISOString();
    return res.status(200).json({
      success: dispatchResult.success,
      provider: dispatchResult.provider,
      errorMessage: dispatchResult.errorMessage,
      stageLog: {
        id: `email-${candidate.id}-${stageKey}`,
        stageKey,
        stageName: subject,
        daysBeforeJoining: 0,
        targetDate: nowIso.split('T')[0],
        recipientEmail: candidate.email,
        recipientName: candidate.name,
        subject,
        status: dispatchResult.success ? 'Sent' : 'Failed',
        sentAt: nowIso,
        errorMessage: dispatchResult.errorMessage,
        triggeredBy: 'hr_manual',
        provider: dispatchResult.provider,
        logs: [`[${new Date(nowIso).toLocaleTimeString()}] Sent via ${dispatchResult.provider}`]
      }
    });
  } catch (err) {
    console.error('Error in Vercel /api/emails/send-manual:', err);
    return res.status(500).json({ success: false, errorMessage: err.message || 'Server error' });
  }
}
