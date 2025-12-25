import crypto from 'crypto';

const CONFIG = {
  TERMINAL_KEY: '1766479140271DEMO',
  PASSWORD: '!BuR2jlFEFF25Hh5',
  API_URL: 'https://securepay.tinkoff.ru/v2'
};

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
    console.log('=== MOBILE PAYMENT DEBUG ===');
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    // CORS для мобильных устройств
    const origin = req.headers.origin;
    const allowedOrigins = [
      'https://ekskyrsiadima.ru',
      'https://ekskyrsiadima-jhin.vercel.app',
      'http://localhost:3000',
      'capacitor://localhost',
      'ionic://localhost'
    ];
    
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, User-Agent');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Проверяем обязательные поля
    const { amount, orderId, description } = req.body;
    
    if (!amount || !orderId || !description) {
      console.log('Missing required fields:', { amount, orderId, description });
      return res.status(422).json({
        Success: false,
        ErrorCode: 'VALIDATION_ERROR',
        Message: 'Отсутствуют обязательные поля',
        Details: `Required: amount, orderId, description. Got: amount=${amount}, orderId=${orderId}, description=${description}`
      });
    }

    const { email, phone, userAgent } = req.body;
    
    console.log('Mobile payment request:', { amount, orderId, description, email, phone, userAgent });
    
    // Чистые данные для мобильных устройств
    const cleanDescription = String(description).replace(/tour-\d+/g, '').replace(/-\d+/g, '').trim();
    
    const paymentData = {
      TerminalKey: CONFIG.TERMINAL_KEY,
      Amount: Math.round(amount * 100),
      OrderId: String(orderId),
      Description: cleanDescription.substring(0, 250),
      CustomerKey: String(orderId),
      PayType: 'O',
      Recurrent: 'N'
    };

    // Генерируем токен с правильным порядком
    paymentData.Token = generateToken(paymentData);

    // Добавляем опциональные поля ПОСЛЕ токена
    if (email) paymentData.Email = email;
    if (phone) paymentData.Phone = phone.replace(/\D/g, '');

    console.log('Отправляем в Тинькофф (mobile):', JSON.stringify(paymentData, null, 2));

    // Запрос в Тинькофф с увеличенным таймаутом для мобильных
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 секунд

    try {
      const response = await fetch(`${CONFIG.API_URL}/Init`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': userAgent || 'MobileApp'
        },
        body: JSON.stringify(paymentData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const result = await response.json();
      console.log('Ответ Тинькофф (mobile):', JSON.stringify(result, null, 2));

      // Для мобильных устройств возвращаем дополнительную информацию
      const mobileResult = {
        ...result,
        isMobile: true,
        paymentUrl: result.PaymentURL,
        fallbackUrl: result.PaymentURL // Для мобильных браузеров
      };

      if (result.Success) {
        res.status(200).json(mobileResult);
      } else {
        res.status(400).json(mobileResult);
      }

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        res.status(408).json({ 
          Success: false, 
          ErrorCode: 'TIMEOUT', 
          Message: 'Таймаут запроса. Попробуйте еще раз.' 
        });
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('Ошибка (mobile):', error);
    res.status(500).json({ 
      Success: false, 
      ErrorCode: 'SERVER_ERROR', 
      Message: 'Ошибка сервера: ' + error.message 
    });
  }
}
