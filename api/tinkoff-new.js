// Новый API endpoint с исправленным CORS
import crypto from 'crypto';

const CONFIG = {
  TERMINAL_KEY: process.env.TINKOFF_TERMINAL_KEY || '1766479140271DEMO',
  PASSWORD: process.env.TINKOFF_PASSWORD || '!BuR2jlFEFF25Hh5',
  API_URL: 'https://securepay.tinkoff.ru/v2'
};

// Генерация токена
function generateToken(paymentData) {
  // ПРАВИЛЬНЫЙ ПОРЯДОК с паролем ПОСЛЕ OrderId
  const tokenString = [
    paymentData.Amount,
    paymentData.CustomerKey,
    paymentData.Description,
    paymentData.OrderId,
    CONFIG.PASSWORD, // ПАРОЛЬ СЮДА!
    paymentData.PayType,
    paymentData.Recurrent,
    paymentData.TerminalKey
  ].join('');
  
  return crypto.createHash('sha256').update(tokenString).digest('hex');
}

export default async function handler(req, res) {
  try {
    // CORS - динамический Origin в зависимости от домена
    const origin = req.headers.origin;
    console.log('=== NEW API Request Origin:', origin);
    
    if (origin === 'https://ekskyrsiadima.ru' || origin === 'https://cv91330.tw1.ru') {
      res.setHeader('Access-Control-Allow-Origin', origin);
      console.log('CORS Origin set to:', origin);
    } else {
      console.log('CORS Origin not allowed:', origin);
      // Для тестов разрешим все origins временно
      res.setHeader('Access-Control-Allow-Origin', '*');
      console.log('CORS Origin set to * (temporary)');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const { amount, orderId, description, fullName, email, phone } = req.body;
    
    console.log('=== ТИНЬКОФФ NEW API ПОЛУЧИЛ ДАННЫЕ ===');
    console.log('Данные клиента:', { fullName, email, phone });
    console.log('Данные платежа:', { amount, orderId, description });
    
    // Чистые данные
    const cleanDescription = String(description).replace(/tour-\d+/g, '').replace(/-\d+/g, '').trim();
    
    // Определяем домен для SuccessURL
    const referer = req.headers.referer || '';
    let successUrl = 'https://ekskyrsiadima.ru/ticket?success=true';
    
    if (referer.includes('cv91330.tw1.ru')) {
      successUrl = 'https://cv91330.tw1.ru/ticket?success=true';
    }
    
    console.log('Referer:', referer);
    console.log('SuccessURL будет:', successUrl);
    
    const paymentData = {
      TerminalKey: CONFIG.TERMINAL_KEY,
      Amount: Math.round(amount * 100),
      OrderId: String(orderId),
      Description: cleanDescription.substring(0, 250),
      CustomerKey: String(orderId),
      PayType: 'O',
      Recurrent: 'N',
      // Добавляем URL для возврата на страницу билета с параметрами успеха
      SuccessURL: successUrl,
      FailURL: 'https://ekskyrsiadima.ru/payment-error'
    };

    // Генерируем токен с правильным порядком
    paymentData.Token = generateToken(paymentData);

    // Добавляем опциональные поля ПОСЛЕ токена
    if (fullName) paymentData.Description = `${fullName} - ${paymentData.Description}`;
    if (email) paymentData.Email = email;
    if (phone) paymentData.Phone = phone.replace(/\D/g, '');

    console.log('Отправляем в Тинькофф (NEW API):', JSON.stringify(paymentData, null, 2));
    console.log('SuccessURL:', paymentData.SuccessURL);
    console.log('FailURL:', paymentData.FailURL);

    // Запрос в Тинькофф
    const response = await fetch(`${CONFIG.API_URL}/Init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();
    console.log('Ответ Тинькофф (NEW API):', JSON.stringify(result, null, 2));

    if (result.Success) {
      res.status(200).json(result);
    } else {
      res.status(400).json({ 
        success: false, 
        message: result.Message || 'Ошибка от Тинькофф',
        details: result,
        debug: { origin, successUrl }
      });
    }

  } catch (error) {
    console.error('Ошибка в NEW API:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Внутренняя ошибка сервера',
      details: error.message 
    });
  }
}
