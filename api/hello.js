export default function handler(req, res) {
  console.log('=== HELLO API CALLED ===');
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request - returning 200');
    return res.status(200).end();
  }
  
  console.log('Returning success response');
  res.status(200).json({
    message: 'Hello from Vercel API!',
    timestamp: new Date().toISOString(),
    method: req.method,
    headers: req.headers
  });
}
