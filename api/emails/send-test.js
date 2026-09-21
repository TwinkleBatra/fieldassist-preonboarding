import { sendEmail } from './_emailHelper.js';
import { getFullEmailContent } from './_templates.js';

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

    const hostHeader = req.headers['x-forwarded-host'] || req.headers.host || '';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const origin = hostHeader ? `${protocol}://${hostHeader}` : (process.env.APP_URL || 'https://fieldassist-preonboarding.vercel.app');

    const mockCandidate = {
      id: 'test-preview-candidate',
      name: recipientName,
      email: toEmail,
      accessCode: 'FA-TEST2026',
      role: 'Enterprise Solutions Consultant',
      department: 'Sales & Growth',
      joiningDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      reportingTime: '10:30 AM',
      officeAddress: 'Plot No. 12, Sector 44, Gurugram, Haryana 122003',
      officeCity: 'Gurugram',
      dressCode: 'Smart Casuals'
    };

    const { subject, bodyText, bodyHtml } = getFullEmailContent(stageKey, mockCandidate, origin);

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
      fromEmail: dispatchResult.fromEmail,
      isSandboxWarning: dispatchResult.isSandboxWarning,
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
