export default async function handler(req, res) {
  try {
    console.log('=== ЯНДЕКС ПЕЙ API ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Method:', req.method);

    // CORS
    const origin = req.headers.origin;
    console.log('Request Origin:', origin);
    
    if (origin === 'https://ekskyrsiadima.ru' || origin === 'https://cv91330.tw1.ru') {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method === 'GET') {
      return res.status(200).json({ 
        success: true, 
        message: 'Яндекс Пей API работает',
        timestamp: new Date().toISOString()
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { amount, description, orderId, fullName, email, phone } = req.body;
    
    console.log('Данные клиента:', { fullName, email, phone });
    console.log('Данные платежа:', { amount, orderId, description });

    // Определяем SuccessURL в зависимости от домена
    const referer = req.headers.referer || '';
    let successUrl = 'https://ekskyrsiadima.ru/ticket?success=true&paymentId=' + String(orderId || 'yandex-' + Date.now());
    
    if (referer.includes('cv91330.tw1.ru')) {
      successUrl = 'https://cv91330.tw1.ru/ticket?success=true&paymentId=' + String(orderId || 'yandex-' + Date.now());
    }

    // Тестовый режим - возвращаем mock ответ
    const mockPaymentUrl = 'https://pay.yandex.ru/checkout?mock=true&orderId=' + String(orderId || 'yandex-' + Date.now());

    console.log('SuccessURL:', successUrl);
    console.log('Mock Payment URL:', mockPaymentUrl);

    // В тестовом режиме возвращаем успешный ответ
    res.status(200).json({
      success: true,
      paymentUrl: mockPaymentUrl,
      paymentId: 'yandex-mock-' + Date.now(),
      orderId: orderId,
      message: 'Платеж Яндекс Пей создан (тестовый режим)'
    });

  } catch (error) {
    console.error('Ошибка в Яндекс Пей API:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
