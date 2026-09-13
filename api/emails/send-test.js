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
    const toEmail = body?.toEmail || 'twinkle.verma@flick2know.com';
    const recipientName = body?.recipientName || 'Twinkle Verma';
    const stageKey = body?.stageKey || 'account_ready';

    const subject = `[FieldAssist Live Test] Your FieldAssist Account is Ready`;
    const bodyText = `Hi ${recipientName},\n\nThis is a verified test email from FieldAssist HR Onboarding.\n\nYour live email integration is active and working properly.\n\nBest regards,\nTwinkle Verma\nPeople Lead, FieldAssist`;
    const bodyHtml = `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #4338ca;">FieldAssist Live Email Test</h2>
      <p>Hi <strong>${recipientName}</strong>,</p>
      <p>This is a verified live test email from your FieldAssist HR Onboarding system.</p>
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p style="margin: 0; font-weight: bold; color: #059669;">✔ Live SMTP delivery working successfully</p>
      </div>
      <p>Best regards,<br/><strong>Twinkle Verma</strong><br/>FieldAssist HR</p>
    </div>`;

    const dispatchResult = await sendEmail({
      toEmail,
      toName: recipientName,
      subject,
      bodyText,
      bodyHtml
    });

    return res.status(200).json({
      success: dispatchResult.success,
      provider: dispatchResult.provider,
      messageId: dispatchResult.messageId,
      errorMessage: dispatchResult.errorMessage,
      targetEmail: toEmail,
      stageKey,
      subject
    });
  } catch (err) {
    console.error('Error in Vercel /api/emails/send-test:', err);
    return res.status(500).json({ success: false, errorMessage: err.message || 'Test dispatch failed' });
  }
}
