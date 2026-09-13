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

  let provider = 'none';
  let hasApiKey = false;
  let apiKeyName = undefined;
  let fromEmail = undefined;

  if (process.env.RESEND_API_KEY) {
    provider = 'resend';
    hasApiKey = true;
    apiKeyName = 'RESEND_API_KEY';
    fromEmail = process.env.EMAIL_FROM || 'FieldAssist HR <onboarding@resend.dev>';
  } else if ((process.env.SMTP_HOST && process.env.SMTP_USER) || (process.env.SMTP_USER && process.env.SMTP_PASS)) {
    provider = 'smtp';
    hasApiKey = true;
    apiKeyName = process.env.SMTP_HOST ? 'SMTP_HOST & SMTP_USER' : 'SMTP_USER & SMTP_PASS (Gmail/Workspace)';
    fromEmail = process.env.EMAIL_FROM || `FieldAssist HR <${process.env.SMTP_USER}>`;
  }

  return res.status(200).json({
    status: 'ok',
    serverTime: new Date().toISOString(),
    providerConfig: {
      provider,
      hasApiKey,
      apiKeyName,
      fromEmail,
    },
    note: hasApiKey
      ? `Real email service active via ${apiKeyName}`
      : 'Email scheduling active in Simulation Mode. Connect RESEND_API_KEY or SMTP credentials in Settings for live inbox delivery.',
  });
}
