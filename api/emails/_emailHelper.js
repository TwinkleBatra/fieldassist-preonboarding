import nodemailer from 'nodemailer';

export function createTransporter() {
  const host = (process.env.SMTP_HOST || 'smtp.office365.com').trim();
  const defaultPort = (host.includes('office365') || host.includes('outlook')) ? 587 : (host.includes('gmail') ? 465 : 587);
  const port = Number(process.env.SMTP_PORT) || defaultPort;
  const secure = port === 465;
  const user = (process.env.SMTP_USER || 'twinkle.verma@fieldassist.com').trim();
  const rawPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
  const pass = rawPass && rawPass !== 'hsideusbifqpldgw' ? rawPass : 'cggongqbbtyjunkd';

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    },
  });
}

export async function sendEmail({ toEmail, toName, subject, bodyText, bodyHtml }) {
  const preferred = (process.env.EMAIL_PROVIDER || '').toLowerCase().trim();
  const host = (process.env.SMTP_HOST || 'smtp.office365.com').trim();
  const smtpUser = (process.env.SMTP_USER || 'twinkle.verma@fieldassist.com').trim();
  const rawPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
  const smtpPass = rawPass && rawPass !== 'hsideusbifqpldgw' ? rawPass : 'cggongqbbtyjunkd';
  const hasSmtp = Boolean(smtpUser && smtpPass);
  const hasResend = Boolean(process.env.RESEND_API_KEY);

  // 1. SMTP Priority (Microsoft 365 Outlook or Google Workspace)
  if (hasSmtp && preferred !== 'resend') {
    try {
      const transporter = createTransporter();
      const isOutlook = host.includes('office365') || host.includes('outlook');
      
      // Best-practice anti-spam sender formatting
      const senderDisplayName = 'Twinkle Verma - FieldAssist HR';
      const fromFormatted = process.env.EMAIL_FROM || `"${senderDisplayName}" <twinkle.verma@fieldassist.com>`;
      const recipientFormatted = toName ? `"${toName.replace(/"/g, '')}" <${toEmail}>` : toEmail;
      
      const customMessageId = `<fa-onboard-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@fieldassist.com>`;

      const info = await transporter.sendMail({
        from: fromFormatted,
        to: recipientFormatted,
        replyTo: `"${senderDisplayName}" <twinkle.verma@fieldassist.com>`,
        subject,
        text: bodyText,
        html: bodyHtml,
        messageId: customMessageId,
        date: new Date(),
        headers: {
          'X-Mailer': 'FieldAssist HR Onboarding Portal',
          'X-Entity-Ref-ID': customMessageId,
          'Feedback-ID': 'FieldAssist:HR-Onboarding:fieldassist.com',
          'Organization': 'FieldAssist'
        }
      });

      console.log(`[SMTP] Sent from ${fromFormatted} to ${toEmail} via ${host}. Message ID: ${info.messageId || customMessageId}`);

      return {
        success: true,
        provider: isOutlook ? `Microsoft 365 Outlook SMTP (${smtpUser})` : `Google Workspace SMTP (${smtpUser})`,
        fromEmail: fromFormatted,
        messageId: info.messageId || customMessageId,
      };
    } catch (err) {
      console.error('SMTP send error:', err);
      if (!hasResend) {
        let friendly = err.message || 'SMTP delivery failed';
        const isOutlook = host.includes('office365') || host.includes('outlook');
        if (err.code === 'EAUTH') {
          friendly = isOutlook
            ? 'Microsoft 365 Authentication failed: Please verify your Microsoft password or App Password.'
            : 'Google SMTP Authentication failed: Please verify your Google email and 16-character App Password.';
        }
        return {
          success: false,
          provider: `SMTP (${process.env.SMTP_HOST || 'smtp.gmail.com'})`,
          errorMessage: friendly,
        };
      }
      console.warn('Google SMTP failed, falling back to Resend API...');
    }
  }

  // 2. Resend API Flow (Used if SMTP is not configured or if EMAIL_PROVIDER=resend)
  if (hasResend) {
    try {
      const fromEmail = process.env.EMAIL_FROM || 'Twinkle Verma - FieldAssist HR <twinkle.verma@fieldassist.com>';
      const isSandboxDomain = fromEmail.includes('@resend.dev');

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject,
          text: bodyText,
          html: bodyHtml,
          reply_to: 'twinkle.verma@fieldassist.com',
        }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          provider: 'Resend API',
          fromEmail,
          errorMessage: resData.message || `Resend returned ${res.status}`,
        };
      }

      return {
        success: true,
        provider: isSandboxDomain ? 'Resend API (onboarding@resend.dev - Sandbox)' : `Resend API (${fromEmail})`,
        fromEmail,
        isSandboxWarning: isSandboxDomain,
        messageId: resData.id,
      };
    } catch (err) {
      return { success: false, provider: 'Resend API', errorMessage: err.message };
    }
  }

  return {
    success: false,
    provider: 'None Configured',
    errorMessage: 'No email credentials configured. Please configure SMTP_USER & SMTP_PASS in Vercel Environment Variables to send directly from your Google Workspace account.',
  };
}
