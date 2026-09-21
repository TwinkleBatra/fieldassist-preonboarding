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
    const { candidateData, stageKey } = body;

    if (!candidateData || !candidateData.email) {
      return res.status(400).json({ success: false, errorMessage: 'Candidate data with email is required' });
    }

    const hostHeader = req.headers['x-forwarded-host'] || req.headers.host || '';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const origin = hostHeader ? `${protocol}://${hostHeader}` : (process.env.APP_URL || 'https://fieldassist-preonboarding.vercel.app');

    const { subject, bodyText, bodyHtml } = getFullEmailContent(stageKey, candidateData, origin);

    const dispatchResult = await sendEmail({
      toEmail: candidateData.email,
      toName: candidateData.name,
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
        id: `email-${candidateData.id}-${stageKey}`,
        stageKey,
        stageName: subject,
        daysBeforeJoining: 0,
        targetDate: nowIso.split('T')[0],
        recipientEmail: candidateData.email,
        recipientName: candidateData.name,
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
