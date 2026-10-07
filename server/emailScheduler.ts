import nodemailer from 'nodemailer';

export interface ServerEmailProviderConfig {
  provider: 'resend' | 'smtp' | 'none';
  hasApiKey: boolean;
  apiKeyName?: string;
  fromEmail?: string;
  isSandboxWarning?: boolean;
}

const DEFAULT_SMTP_USER = 'twinkle.verma@flick2know.com';
const DEFAULT_SMTP_PASS = 'cggongqbbtyjunkd';
const DEFAULT_SMTP_HOST = 'smtp.gmail.com';
const DEFAULT_SMTP_PORT = 465;

export function getServerEmailConfig(): ServerEmailProviderConfig {
  const preferred = (process.env.EMAIL_PROVIDER || '').toLowerCase().trim();
  const smtpUser = (process.env.SMTP_USER || DEFAULT_SMTP_USER).trim();
  const smtpPass = (process.env.SMTP_PASS || DEFAULT_SMTP_PASS).replace(/\s+/g, '');
  const hasSmtp = Boolean(smtpUser && smtpPass);

  // 1. Google Workspace SMTP Priority (always prioritized over Resend so candidate emails don't hit Resend's free tier sandbox block)
  if (hasSmtp && preferred !== 'resend') {
    const senderDisplayName = 'Twinkle Verma - FieldAssist HR';
    return {
      provider: 'smtp',
      hasApiKey: true,
      apiKeyName: process.env.SMTP_HOST ? 'Custom SMTP' : 'Google Workspace SMTP',
      fromEmail: process.env.EMAIL_FROM || `"${senderDisplayName}" <${smtpUser}>`,
      isSandboxWarning: false
    };
  }

  // 2. Resend API Flow (only if explicitly preferred or SMTP disabled)
  if (process.env.RESEND_API_KEY) {
    const fromEmail = process.env.EMAIL_FROM || 'FieldAssist HR <onboarding@resend.dev>';
    const isSandboxWarning = fromEmail.includes('@resend.dev');
    return {
      provider: 'resend',
      hasApiKey: true,
      apiKeyName: 'RESEND_API_KEY',
      fromEmail,
      isSandboxWarning
    };
  }

  return { provider: 'none', hasApiKey: false, isSandboxWarning: false };
}

/**
 * Creates a configured nodemailer transport with support for Gmail / Google Workspace and custom SMTP
 */
function createSmtpTransporter() {
  const host = (process.env.SMTP_HOST || DEFAULT_SMTP_HOST).trim();
  const port = Number(process.env.SMTP_PORT) || (host.includes('gmail') ? 465 : 587);
  const secure = port === 465;
  const user = (process.env.SMTP_USER || DEFAULT_SMTP_USER).trim();
  const pass = (process.env.SMTP_PASS || DEFAULT_SMTP_PASS).replace(/\s+/g, '');

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false
    }
  });
}

/**
 * Checks if the SMTP connection credentials work
 */
export async function verifySmtpConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = createSmtpTransporter();
    await transporter.verify();
    return { success: true, message: `SMTP connection to ${process.env.SMTP_HOST || DEFAULT_SMTP_HOST} verified successfully.` };
  } catch (err: any) {
    console.error('SMTP verification error:', err);
    return {
      success: false,
      message: err.message || 'Failed to verify SMTP credentials. Please check your App Password or credentials.'
    };
  }
}

/**
 * Sends email via SMTP transporter
 */
async function sendViaSmtp(options: {
  toEmail: string;
  toName: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
}): Promise<{ success: boolean; provider: string; messageId?: string; errorMessage?: string }> {
  try {
    const transporter = createSmtpTransporter();
    const hostName = process.env.SMTP_HOST || DEFAULT_SMTP_HOST;
    const user = (process.env.SMTP_USER || DEFAULT_SMTP_USER).trim();
    const userDomain = user.includes('@') ? user.split('@')[1] : 'fieldassist.com';
    const senderDisplayName = 'Twinkle Verma - FieldAssist HR';
    const fromEmail = process.env.EMAIL_FROM || `"${senderDisplayName}" <${user}>`;
    const customMessageId = `<fa-onboard-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@${userDomain}>`;

    const info = await transporter.sendMail({
      from: fromEmail,
      to: `"${options.toName.replace(/"/g, '')}" <${options.toEmail}>`,
      replyTo: `"${senderDisplayName}" <${user}>`,
      subject: options.subject,
      text: options.bodyText,
      html: options.bodyHtml,
      messageId: customMessageId,
      date: new Date(),
      headers: {
        'X-Mailer': 'FieldAssist HR Onboarding Portal',
        'X-Entity-Ref-ID': customMessageId,
        'Feedback-ID': `FieldAssist:HR-Onboarding:${userDomain}`,
        'Organization': 'FieldAssist (Flick2Know Technologies Pvt. Ltd.)'
      }
    });

    console.log(`[SMTP Dispatch] Successfully sent email to ${options.toEmail} via ${hostName}. MessageId: ${info.messageId}`);

    return {
      success: true,
      provider: `SMTP (${hostName}) - Message ID: ${info.messageId || customMessageId}`,
      messageId: info.messageId || customMessageId
    };
  } catch (err: any) {
    console.error('Error sending email via SMTP:', err);
    let friendlyError = err.message || 'SMTP dispatch failed';
    if (err.code === 'EAUTH' || (err.response && err.response.includes('Username and Password not accepted'))) {
      friendlyError = 'Google SMTP Authentication failed: Please verify your Google email and 16-character App Password (ensure 2-Step Verification is enabled in Google Account).';
    }
    return {
      success: false,
      provider: `SMTP (${process.env.SMTP_HOST || DEFAULT_SMTP_HOST})`,
      errorMessage: friendlyError
    };
  }
}

/**
 * Dispatches real email via SMTP (primary) or Resend (if configured).
 * Automatically falls back to SMTP if Resend fails due to sandbox domain restrictions.
 */
export async function sendEmailViaProvider(options: {
  toEmail: string;
  toName: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
}): Promise<{ success: boolean; provider: string; messageId?: string; errorMessage?: string }> {
  const config = getServerEmailConfig();

  // 1. Resend API Flow (only if provider explicitly configured to resend)
  if (config.provider === 'resend' && process.env.RESEND_API_KEY) {
    try {
      const fromEmail = process.env.EMAIL_FROM || 'FieldAssist HR <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [options.toEmail],
          subject: options.subject,
          text: options.bodyText,
          html: options.bodyHtml
        })
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg = resData.message || resData.error?.message || `Resend API returned status ${res.status}`;
        console.warn('Resend API dispatch failed. Falling back to Google Workspace SMTP:', errorMsg);
        // Automatic fallback to Google Workspace SMTP
        return await sendViaSmtp(options);
      }

      const messageId = resData.id || `resend-${Date.now()}`;
      return {
        success: true,
        provider: `Resend API (Message ID: ${messageId})`,
        messageId
      };
    } catch (err: any) {
      console.warn('Error sending email via Resend, falling back to SMTP:', err);
      return await sendViaSmtp(options);
    }
  }

  // 2. Default SMTP Flow (Gmail, Google Workspace, or custom SMTP)
  return await sendViaSmtp(options);
}
