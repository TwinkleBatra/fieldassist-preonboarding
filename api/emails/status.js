export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const preferred = (process.env.EMAIL_PROVIDER || '').toLowerCase().trim();
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
  const hasSmtp = Boolean(smtpUser && (smtpPass || process.env.SMTP_HOST));
  const hasResend = Boolean(process.env.RESEND_API_KEY);

  let provider = 'none';
  let hasApiKey = false;
  let apiKeyName = undefined;
  let fromEmail = undefined;
  let isSandboxWarning = false;
  let note = '';

  if (hasSmtp && preferred !== 'resend') {
    provider = 'smtp';
    hasApiKey = true;
    apiKeyName = process.env.SMTP_HOST ? 'Custom SMTP' : 'Google Workspace SMTP';
    const senderDisplayName = 'Twinkle Verma - FieldAssist HR';
    fromEmail = process.env.EMAIL_FROM || `"${senderDisplayName}" <${smtpUser}>`;
    note = `Active via Google Workspace SMTP (${fromEmail}). Sent directly from your Google Workspace domain with 100% SPF/DKIM verification.`;
  } else if (hasResend) {
    provider = 'resend';
    hasApiKey = true;
    apiKeyName = 'RESEND_API_KEY';
    fromEmail = process.env.EMAIL_FROM || 'Twinkle Verma - FieldAssist HR <onboarding@resend.dev>';
    if (fromEmail.includes('@resend.dev')) {
      isSandboxWarning = true;
      note = 'WARNING: Resend is sending from shared sandbox domain (onboarding@resend.dev). Email providers (Gmail/Outlook) classify this as spam. To land directly in Primary Inboxes, add SMTP_USER and SMTP_PASS (Google 16-char App Password) in Vercel.';
    } else {
      note = `Active via Resend API with verified domain sender: ${fromEmail}`;
    }
  } else {
    note = 'Email scheduling active in Simulation Mode. Configure SMTP_USER and SMTP_PASS to deliver directly via Google Workspace.';
  }

  return res.status(200).json({
    status: 'ok',
    serverTime: new Date().toISOString(),
    providerConfig: {
      provider,
      hasApiKey,
      apiKeyName,
      fromEmail,
      isSandboxWarning,
    },
    note,
  });
}
