export default async function handler(req, res) {
  try {
    console.log('=== VERIFY DEPLOY API ===');
    
    // CORS - разрешаем все origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    const deployInfo = {
      success: true,
      message: 'DEPLOY VERIFICATION SUCCESS',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      api: 'verify-deploy',
      method: req.method,
      origin: req.headers.origin,
      userAgent: req.headers['user-agent']
    };
    
    console.log('Deploy verification successful:', deployInfo);
    
    res.status(200).json(deployInfo);
    
  } catch (error) {
    console.error('=== VERIFY DEPLOY ERROR ===');
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Deploy verification failed: ' + error.message,
      error: error.message
    });
  }
}
