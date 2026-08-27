import nodemailer from 'nodemailer';

export interface ServerEmailProviderConfig {
  provider: 'resend' | 'smtp' | 'none';
  hasApiKey: boolean;
  apiKeyName?: string;
  fromEmail?: string;
}

export function getServerEmailConfig(): ServerEmailProviderConfig {
  if (process.env.RESEND_API_KEY) {
    return {
      provider: 'resend',
      hasApiKey: true,
      apiKeyName: 'RESEND_API_KEY',
      fromEmail: process.env.EMAIL_FROM || 'FieldAssist HR <onboarding@resend.dev>'
    };
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return {
      provider: 'smtp',
      hasApiKey: true,
      apiKeyName: 'SMTP_HOST',
      fromEmail: process.env.EMAIL_FROM || process.env.SMTP_USER
    };
  }
  return { provider: 'none', hasApiKey: false };
}

/**
 * Dispatches real email if RESEND_API_KEY or SMTP is configured.
 * If no provider is configured, returns an explicit error without marking as sent.
 */
export async function sendEmailViaProvider(options: {
  toEmail: string;
  toName: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
}): Promise<{ success: boolean; provider: string; messageId?: string; errorMessage?: string }> {
  const config = getServerEmailConfig();

  // 1. Resend API Flow
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
        console.error('Resend API dispatch error:', errorMsg, resData);
        return {
          success: false,
          provider: 'Resend API',
          errorMessage: errorMsg
        };
      }

      const messageId = resData.id || `resend-${Date.now()}`;
      return {
        success: true,
        provider: `Resend API (Message ID: ${messageId})`,
        messageId
      };
    } catch (err: any) {
      console.error('Error sending email via Resend:', err);
      return {
        success: false,
        provider: 'Resend API',
        errorMessage: err.message || 'Resend API dispatch failed'
      };
    }
  }

  // 2. SMTP Flow
  if (config.provider === 'smtp' && process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER;
      const info = await transporter.sendMail({
        from: fromEmail,
        to: `"${options.toName}" <${options.toEmail}>`,
        subject: options.subject,
        text: options.bodyText,
        html: options.bodyHtml
      });

      return {
        success: true,
        provider: `SMTP (${process.env.SMTP_HOST}) - Message ID: ${info.messageId}`,
        messageId: info.messageId
      };
    } catch (err: any) {
      console.error('Error sending email via SMTP:', err);
      return {
        success: false,
        provider: 'SMTP',
        errorMessage: err.message || 'SMTP dispatch failed'
      };
    }
  }

  // 3. No Provider Configured - Fail explicitly
  console.warn(`[FA HR EMAIL AUTOMATION] Dispatch failed: No email provider configured.`);
  return {
    success: false,
    provider: 'None Configured',
    errorMessage: 'No email provider API key configured. Please set RESEND_API_KEY or SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) in environment variables.'
  };
}
