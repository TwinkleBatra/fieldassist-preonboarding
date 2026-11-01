import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { smtpUser, smtpPass, smtpHost, smtpPort, emailFrom } = body;

    const user = (smtpUser || process.env.SMTP_USER || '').trim();
    const pass = (smtpPass || process.env.SMTP_PASS || '').replace(/\s+/g, '');
    const host = (smtpHost || process.env.SMTP_HOST || 'smtp.office365.com').trim();
    const defaultPort = (host.includes('office365') || host.includes('outlook')) ? 587 : (host.includes('gmail') ? 465 : 587);
    const port = Number(smtpPort || process.env.SMTP_PORT) || defaultPort;
    const secure = port === 465;

    if (!user || !pass) {
      return res.status(400).json({
        success: false,
        message: 'Account email and password/App password are required.'
      });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    });

    // Test credentials by verifying connection with SMTP server
    await transporter.verify();

    // Cache in process environment
    process.env.SMTP_USER = user;
    process.env.SMTP_PASS = pass;
    process.env.SMTP_HOST = host;
    process.env.SMTP_PORT = String(port);
    if (emailFrom) {
      process.env.EMAIL_FROM = emailFrom.trim();
    }

    // Try saving to disk if writable
    try {
      const configPath = path.join(process.cwd(), 'smtp_config.json');
      fs.writeFileSync(configPath, JSON.stringify({
        smtpUser: user,
        smtpPass: pass,
        smtpHost: host,
        smtpPort: port,
        emailFrom: process.env.EMAIL_FROM
      }, null, 2), 'utf-8');
    } catch (e) {
      // Ignored on read-only environments
    }

    const isOutlook = host.includes('office365') || host.includes('outlook');
    const providerName = isOutlook
      ? `Microsoft 365 Outlook (${user})`
      : host.includes('gmail')
      ? `Google Workspace (${user})`
      : `SMTP (${host})`;

    return res.status(200).json({
      success: true,
      message: `Verified successfully! Connected to ${providerName}.`,
      providerConfig: {
        provider: 'smtp',
        apiKeyName: isOutlook ? 'Microsoft 365 Outlook SMTP' : 'Google Workspace SMTP',
        fromEmail: process.env.EMAIL_FROM || `"${user}" <${user}>`,
        authEmail: user,
        domainMismatch: false,
        hasApiKey: true,
      }
    });
  } catch (err) {
    console.error('Error verifying SMTP credentials in /api/emails/update-smtp:', err);
    let friendlyMessage = err.message || 'Failed to authenticate with SMTP server.';
    const hostStr = req.body?.smtpHost || '';
    const isOutlook = hostStr.includes('office365') || hostStr.includes('outlook');

    if (err.code === 'EAUTH' || (err.response && err.response.includes('535'))) {
      if (err.response && err.response.includes('5.7.139')) {
        friendlyMessage = 'Microsoft 365 Error (5.7.139): Authenticated SMTP is disabled for your tenant by your IT admin (aka.ms/smtp_auth_disabled). You can ask your IT administrator to enable "Authenticated SMTP" for your mailbox in the M365 Admin Center, or use the "Outlook Send" button to send via Outlook Web.';
      } else if (isOutlook) {
        friendlyMessage = 'Microsoft 365 Authentication failed: Please verify your password or create an App Password at mysignins.microsoft.com/security-info (if MFA is enabled).';
      } else {
        friendlyMessage = 'Google SMTP Authentication failed: Please verify your Google email and 16-character App Password.';
      }
    }

    return res.status(200).json({
      success: false,
      message: friendlyMessage
    });
  }
}
