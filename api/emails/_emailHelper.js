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
      const fromEmail = process.env.EMAIL_FROM || 'Twinkle Verma - FieldAssist HR <onboarding@resend.dev>';
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
          reply_to: 'twinkle.verma@flick2know.com',
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
      const userDomain = user.includes('@') ? user.split('@')[1] : 'flick2know.com';
      
      // Best-practice anti-spam sender formatting
      const senderDisplayName = 'Twinkle Verma - FieldAssist HR';
      const fromFormatted = process.env.EMAIL_FROM || `"${senderDisplayName}" <${user}>`;
      const recipientFormatted = toName ? `"${toName.replace(/"/g, '')}" <${toEmail}>` : toEmail;
      
      const customMessageId = `<fa-onboard-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@${userDomain}>`;

      const info = await transporter.sendMail({
        from: fromFormatted,
        to: recipientFormatted,
        replyTo: `"${senderDisplayName}" <${user}>`,
        subject,
        text: bodyText,
        html: bodyHtml,
        messageId: customMessageId,
        date: new Date(),
        headers: {
          'X-Mailer': 'FieldAssist HR Onboarding Portal',
          'X-Entity-Ref-ID': customMessageId,
          'Feedback-ID': `FieldAssist:HR-Onboarding:${userDomain}`,
          'Organization': 'FieldAssist (Flick2Know Technologies Pvt. Ltd.)'
        }
      });

      return {
        success: true,
        provider: `SMTP (${host}) - Message ID: ${info.messageId || customMessageId}`,
        messageId: info.messageId || customMessageId,
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
