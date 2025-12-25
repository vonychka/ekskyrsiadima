// api/test.js - Простая тестовая функция
export default async function handler(req, res) {
  try {
    console.log('=== TEST API START ===');
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    // CORS - разрешаем все origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    if (req.method === 'OPTIONS') {
      console.log('OPTIONS request - returning 200');
      return res.status(200).end();
    }
    
    console.log('=== TEST API SUCCESS ===');
    res.status(200).json({
      success: true,
      message: 'API работает!',
      timestamp: new Date().toISOString(),
      method: req.method,
      headers: req.headers,
      body: req.body
    });
    
  } catch (error) {
    console.error('=== TEST API ERROR ===');
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка: ' + error.message,
      error: error.message
    });
  }
};
