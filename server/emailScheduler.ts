import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

export interface ServerEmailProviderConfig {
  provider: 'resend' | 'smtp' | 'none';
  hasApiKey: boolean;
  apiKeyName?: string;
  fromEmail?: string;
  authEmail?: string;
  domainMismatch?: boolean;
  isSandboxWarning?: boolean;
}

const SMTP_CONFIG_FILE = path.join(process.cwd(), 'smtp_config.json');

export interface StoredSmtpConfig {
  smtpUser: string;
  smtpPass: string;
  smtpHost?: string;
  smtpPort?: number;
  emailFrom?: string;
}

export function loadStoredSmtpConfig(): StoredSmtpConfig {
  try {
    if (fs.existsSync(SMTP_CONFIG_FILE)) {
      const data = fs.readFileSync(SMTP_CONFIG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Could not read smtp_config.json:', err);
  }
  return {
    smtpUser: process.env.SMTP_USER || DEFAULT_SMTP_USER,
    smtpPass: (process.env.SMTP_PASS && process.env.SMTP_PASS !== 'hsideusbifqpldgw') ? process.env.SMTP_PASS : DEFAULT_SMTP_PASS,
    smtpHost: process.env.SMTP_HOST || DEFAULT_SMTP_HOST,
    smtpPort: Number(process.env.SMTP_PORT) || DEFAULT_SMTP_PORT,
    emailFrom: process.env.EMAIL_FROM || DEFAULT_FROM_EMAIL
  };
}

export function saveStoredSmtpConfig(config: StoredSmtpConfig) {
  try {
    fs.writeFileSync(SMTP_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save smtp_config.json:', err);
  }
}

const DEFAULT_SMTP_USER = 'twinkle.verma@flick2know.com';
const DEFAULT_SMTP_PASS = 'cggongqbbtyjunkd';
const DEFAULT_SMTP_HOST = 'smtp.gmail.com';
const DEFAULT_SMTP_PORT = 465;
export const DEFAULT_FROM_EMAIL = '"Twinkle Verma - FieldAssist HR" <twinkle.verma@fieldassist.com>';

export function getServerEmailConfig(): ServerEmailProviderConfig {
  const stored = loadStoredSmtpConfig();
  const preferred = (process.env.EMAIL_PROVIDER || '').toLowerCase().trim();
  const smtpUser = (process.env.SMTP_USER || stored.smtpUser || DEFAULT_SMTP_USER).trim();
  const rawPass = (process.env.SMTP_PASS || stored.smtpPass || DEFAULT_SMTP_PASS).replace(/\s+/g, '');
  const smtpPass = rawPass && rawPass !== 'hsideusbifqpldgw' ? rawPass : DEFAULT_SMTP_PASS;
  const hasSmtp = Boolean(smtpUser && smtpPass);

  const activeFrom = (process.env.EMAIL_FROM && !process.env.EMAIL_FROM.includes('flick2know') && !process.env.EMAIL_FROM.includes('fieldassist.in'))
    ? process.env.EMAIL_FROM
    : (stored.emailFrom || DEFAULT_FROM_EMAIL);

  const domainMismatch = Boolean(
    smtpUser &&
    !smtpUser.includes('fieldassist.com') &&
    activeFrom.includes('fieldassist.com')
  );

  // 1. Google Workspace SMTP Priority (always prioritized over Resend so candidate emails don't hit Resend's free tier sandbox block)
  if (hasSmtp && preferred !== 'resend') {
    return {
      provider: 'smtp',
      hasApiKey: true,
      apiKeyName: (process.env.SMTP_HOST || stored.smtpHost) ? 'Custom SMTP' : 'Google Workspace SMTP',
      fromEmail: activeFrom,
      authEmail: smtpUser,
      domainMismatch,
      isSandboxWarning: false
    };
  }

  // 2. Resend API Flow (only if explicitly preferred or SMTP disabled)
  if (process.env.RESEND_API_KEY) {
    const fromEmail = activeFrom;
    const isSandboxWarning = fromEmail.includes('@resend.dev');
    return {
      provider: 'resend',
      hasApiKey: true,
      apiKeyName: 'RESEND_API_KEY',
      fromEmail,
      authEmail: smtpUser,
      domainMismatch,
      isSandboxWarning
    };
  }

  return { provider: 'none', hasApiKey: false, isSandboxWarning: false };
}

/**
 * Creates a configured nodemailer transport with support for Gmail / Google Workspace and custom SMTP
 */
function createSmtpTransporter(customConfig?: Partial<StoredSmtpConfig>) {
  const stored = loadStoredSmtpConfig();
  const host = (customConfig?.smtpHost || process.env.SMTP_HOST || stored.smtpHost || DEFAULT_SMTP_HOST).trim();
  const port = Number(customConfig?.smtpPort || process.env.SMTP_PORT || stored.smtpPort) || (host.includes('gmail') ? 465 : 587);
  const secure = port === 465;
  const user = (customConfig?.smtpUser || process.env.SMTP_USER || stored.smtpUser || DEFAULT_SMTP_USER).trim();
  const rawPass = (customConfig?.smtpPass || process.env.SMTP_PASS || stored.smtpPass || '').replace(/\s+/g, '');
  const pass = rawPass && rawPass !== 'hsideusbifqpldgw' ? rawPass : DEFAULT_SMTP_PASS;

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
export async function verifySmtpConnection(customConfig?: Partial<StoredSmtpConfig>): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = createSmtpTransporter(customConfig);
    await transporter.verify();
    const host = customConfig?.smtpHost || process.env.SMTP_HOST || DEFAULT_SMTP_HOST;
    return { success: true, message: `SMTP connection to ${host} verified successfully.` };
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
    const fromEmail = (process.env.EMAIL_FROM && !process.env.EMAIL_FROM.includes('flick2know') && !process.env.EMAIL_FROM.includes('fieldassist.in'))
      ? process.env.EMAIL_FROM
      : DEFAULT_FROM_EMAIL;
    const customMessageId = `<fa-onboard-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@fieldassist.com>`;

    const info = await transporter.sendMail({
      from: fromEmail,
      to: `"${options.toName.replace(/"/g, '')}" <${options.toEmail}>`,
      replyTo: DEFAULT_FROM_EMAIL,
      subject: options.subject,
      text: options.bodyText,
      html: options.bodyHtml,
      messageId: customMessageId,
      date: new Date(),
      headers: {
        'X-Mailer': 'FieldAssist HR Onboarding Portal',
        'X-Entity-Ref-ID': customMessageId,
        'Feedback-ID': 'FieldAssist:HR-Onboarding:fieldassist.com',
        'Organization': 'FieldAssist'
      }
    });

    console.log(`[SMTP Dispatch] Successfully sent email to ${options.toEmail} via ${hostName} from ${fromEmail}. MessageId: ${info.messageId}`);

    return {
      success: true,
      provider: `Google Workspace SMTP (twinkle.verma@fieldassist.com)`,
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
      const fromEmail = process.env.EMAIL_FROM || DEFAULT_FROM_EMAIL;
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
          html: options.bodyHtml,
          reply_to: 'twinkle.verma@fieldassist.com'
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
