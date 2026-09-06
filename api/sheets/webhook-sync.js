export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const targetWebhookUrl = (
      body.webhookUrl ||
      process.env.GOOGLE_APPS_SCRIPT_URL ||
      'https://script.google.com/macros/s/AKfycbxSc3zPy8ZG8YITC9rvGtw-Xk_pLhLSJrL_ot8kcSWATiM5V8Qu8jxY-s5Uei_sq5E/exec'
    ).trim();

    if (!targetWebhookUrl) {
      return res.status(400).json({
        success: false,
        error: 'Google Apps Script Webhook URL is not configured.',
      });
    }

    const scriptRes = await fetch(targetWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
    });

    const resText = await scriptRes.text();
    let scriptData = {};
    try {
      scriptData = JSON.parse(resText);
    } catch {
      scriptData = { success: scriptRes.ok, raw: resText };
    }

    return res.status(scriptRes.ok ? 200 : 400).json(scriptData);
  } catch (error) {
    console.error('Error in /api/sheets/webhook-sync serverless function:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while syncing to Google Sheets',
    });
  }
}
