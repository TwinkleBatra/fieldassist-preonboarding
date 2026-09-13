import nodemailer from 'nodemailer';

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

  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = Number(process.env.SMTP_PORT) || (host.includes('gmail') ? 465 : 587);
  const secure = port === 465;

  if (!user || !pass) {
    return res.status(200).json({
      success: false,
      message: 'SMTP credentials not found. Please set SMTP_USER and SMTP_PASS environment variables.'
    });
  }

  try {
    const transporter = nodemailer.createTransporter({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });

    await transporter.verify();
    return res.status(200).json({
      success: true,
      message: `SMTP connection to ${host} verified successfully.`
    });
  } catch (err) {
    console.error('Vercel SMTP verification error:', err);
    return res.status(200).json({
      success: false,
      message: err.message || 'Failed to verify SMTP credentials'
    });
  }
}
