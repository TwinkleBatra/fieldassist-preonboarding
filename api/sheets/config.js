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

  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || '17UxO1djDD-IvD3JmVzaVoOyyo8TEYcT9cnDii7sjUI0';
  const webhookUrl = process.env.GOOGLE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbxSc3zPy8ZG8YITC9rvGtw-Xk_pLhLSJrL_ot8kcSWATiM5V8Qu8jxY-s5Uei_sq5E/exec';

  return res.status(200).json({
    status: 'ok',
    config: {
      spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      webhookUrl,
      syncMode: 'webhook',
      lastSyncedAt: '',
      autoSyncEnabled: true,
    },
  });
}
