import nodemailer from 'nodemailer';

export function createTransporter() {
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = Number(process.env.SMTP_PORT) || (host.includes('gmail') ? 465 : 587);
  const secure = port === 465;
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
}

export async function sendEmail({ toEmail, toName, subject, bodyText, bodyHtml }) {
  // 1. Resend API
  if (process.env.RESEND_API_KEY) {
    try {
      const fromEmail = process.env.EMAIL_FROM || 'FieldAssist HR <onboarding@resend.dev>';
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
        }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          provider: 'Resend API',
          errorMessage: resData.message || `Resend returned ${res.status}`,
        };
      }
      return {
        success: true,
        provider: `Resend API (ID: ${resData.id})`,
        messageId: resData.id,
      };
    } catch (err) {
      return { success: false, provider: 'Resend API', errorMessage: err.message };
    }
  }

  // 2. SMTP
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
  if (user && pass) {
    try {
      const transporter = createTransporter();
      const host = process.env.SMTP_HOST || 'smtp.gmail.com';
      const fromEmail = process.env.EMAIL_FROM || `FieldAssist HR <${user}>`;

      const info = await transporter.sendMail({
        from: fromEmail,
        to: toName ? `"${toName}" <${toEmail}>` : toEmail,
        subject,
        text: bodyText,
        html: bodyHtml,
      });

      return {
        success: true,
        provider: `SMTP (${host}) - Message ID: ${info.messageId}`,
        messageId: info.messageId,
      };
    } catch (err) {
      console.error('SMTP send error:', err);
      let friendly = err.message || 'SMTP delivery failed';
      if (err.code === 'EAUTH') {
        friendly = 'Google SMTP Authentication failed: Please verify your Google email and 16-character App Password.';
      }
      return {
        success: false,
        provider: `SMTP (${process.env.SMTP_HOST || 'smtp.gmail.com'})`,
        errorMessage: friendly,
      };
    }
  }

  return {
    success: false,
    provider: 'None Configured',
    errorMessage: 'No email provider credentials configured. Please configure SMTP_USER and SMTP_PASS in Vercel Environment Variables.',
  };
}
