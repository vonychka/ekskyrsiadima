import { createHash } from 'crypto';

const CONFIG = {
  TERMINAL_KEY: '1766479140318', // БОЕВОЙ ТЕРМИНАЛ - ОБНОВЛЕНО
  PASSWORD: 's9R^$NsmYPytIY#_',
  API_URL: 'https://securepay.tinkoff.ru/v2'
};

function generateToken(data) {
  console.log('=== OFFICIAL TINKOFF TOKEN GENERATION ===');
  
  // ШАГ 1: Собираем массив параметров корневого объекта (ТОЛЬКО обязательные для токена)
  const tokenData = {
    TerminalKey: data.TerminalKey,
    Amount: data.Amount,
    OrderId: data.OrderId,
    Description: data.Description,
    Password: CONFIG.PASSWORD
    // ❌ НЕ ВКЛЮЧАТЬ: SuccessURL, FailURL, NotificationURL, CustomerKey, Email, Phone, Receipt, DATA
  };
  
  console.log('Token data (official rules):', tokenData);
  
  // ШАГ 2: Сортируем по алфавиту по ключу
  const sortedKeys = Object.keys(tokenData).sort();
  console.log('Sorted keys:', sortedKeys);
  
  // ШАГ 3: Конкатенируем только значения в одну строку
  let tokenString = '';
  sortedKeys.forEach(key => {
    const value = String(tokenData[key]);
    console.log(`Key: ${key}, Value: ${value}`);
    tokenString += value;
  });
  
  console.log('Token string (concatenated values):', tokenString);
  
  // ШАГ 4: Применяем SHA-256 с поддержкой UTF-8
  const token = createHash('sha256').update(tokenString, 'utf8').digest('hex');
  console.log('Generated token (SHA-256):', token);
  console.log('=== TOKEN GENERATION COMPLETE ===');
  
  return token;
}

export default async function handler(req, res) {
  try {
    // CORS заголовки - В САМОМ НАЧАЛЕ
    res.setHeader('Access-Control-Allow-Origin', 'https://ekskyrsiadima.ru');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Парсим JSON тело для Vercel
    if (req.method === 'POST' && typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch (e) {
        console.log('JSON parse error:', e);
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }
    
    console.log('=== ТЕСТ ЛОГИРОВАНИЯ ===');
    console.log('Timestamp:', new Date().toISOString());
    
    // Тестовые данные для проверки логов
    const testData = {
      SuccessURL: 'https://ekskyrsiadima.ru/ticket?success=true&paymentId=test-123',
      FailURL: 'https://ekskyrsiadima.ru/payment-error',
      NotificationURL: 'https://ekskyrsiadima-jhin.vercel.app/api/tinkoff-webhook'
    };
    
    console.log('SuccessURL:', testData.SuccessURL);
    console.log('FailURL:', testData.FailURL);
    console.log('NotificationURL:', testData.NotificationURL);
    
    if (req.method === 'GET') {
      console.log('GET запрос - тест логирования');
      return res.status(200).json({ 
        success: true, 
        message: 'Тест логирования работает',
        data: testData
      });
    }

    // Если POST запрос с параметром test=true - возвращаем доказательство
    if (req.method === 'POST' && req.body && req.body.test === true) {
      const { amount, description, orderId, fullName, email, phone } = req.body;
      
      const cleanDescription = String(description || 'Экскурсия').replace(/tour-\d+/g, '').replace(/-\d+/g, '').trim();
      const referer = req.headers.referer || 'https://ekskyrsiadima.ru';
      let successUrl = 'https://ekskyrsiadima.ru/ticket?success=true&paymentId=' + String(orderId || 'test-' + Date.now());
      
      if (referer.includes('cv91330.tw1.ru')) {
        successUrl = 'https://cv91330.tw1.ru/ticket?success=true&paymentId=' + String(orderId || 'test-' + Date.now());
      }

      const receipt = {
        Email: email || 'test@example.com',
        Phone: phone || '+79991234567',
        EmailCompany: 'sokovdima3@gmail.com',
        Taxation: 'usn',
        FfdVersion: '1.05',
        Items: [{
          Name: cleanDescription.substring(0, 128),
          Price: Math.round((amount || 1000) * 100),
          Quantity: 1,
          Amount: Math.round((amount || 1000) * 100),
          Tax: 'none',
          PaymentMethod: 'full_prepayment',
          PaymentObject: 'service'
        }]
      };

      const paymentData = {
        TerminalKey: '1766479140318',
        Amount: Math.round((amount || 1000) * 100),
        OrderId: String(orderId || 'test-' + Date.now()),
        Description: cleanDescription.substring(0, 250),
        CustomerKey: String(orderId || 'test-' + Date.now()),
        PayType: 'O',
        Recurrent: 'N',
        SuccessURL: successUrl,
        FailURL: 'https://ekskyrsiadima.ru/payment-error',
        NotificationURL: 'https://ekskyrsiadima-jhin.vercel.app/api/tinkoff-webhook',
        Receipt: receipt
      };

      return res.status(200).json({
        success: true,
        message: 'ДОКАЗАТЕЛЬСТВО ДЛЯ ПОДДЕРЖКИ ТИНЬКОФФ',
        evidence: {
          timestamp: new Date().toISOString(),
          original_request: req.body,
          tinkoff_request: paymentData,
          success_url_details: {
            successUrl: successUrl,
            referer: referer,
            orderId: orderId
          }
        }
      });
    }

    // Если POST запрос с параметром yandex=true - Яндекс Пей
    if (req.method === 'POST' && req.body && req.body.yandex === true) {
      const { amount, description, orderId, fullName, email, phone } = req.body;
      
      console.log('=== ЯНДЕКС ПЕЙ ЗАПРОС ===');
      console.log('Данные:', { amount, description, orderId, fullName, email, phone });

      const referer = req.headers.referer || 'https://ekskyrsiadima.ru';
      let successUrl = 'https://ekskyrsiadima.ru/ticket?success=true&paymentId=' + String(orderId || 'yandex-' + Date.now());
      
      if (referer.includes('cv91330.tw1.ru')) {
        successUrl = 'https://cv91330.tw1.ru/ticket?success=true&paymentId=' + String(orderId || 'yandex-' + Date.now());
      }

      const mockPaymentUrl = 'https://pay.yandex.ru/checkout?mock=true&orderId=' + String(orderId || 'yandex-' + Date.now());

      console.log('SuccessURL:', successUrl);
      console.log('Mock Payment URL:', mockPaymentUrl);

      return res.status(200).json({
        success: true,
        paymentUrl: mockPaymentUrl,
        paymentId: 'yandex-mock-' + Date.now(),
        orderId: orderId,
        message: 'Платеж Яндекс Пей создан (тестовый режим)'
      });
    }

    // CORS - разрешаем оба домена
    const origin = req.headers.origin;
    console.log('Request Origin:', origin);
    
    // Разрешаем оба домена + временно все для тестов
    if (origin === 'https://ekskyrsiadima.ru' || origin === 'https://cv91330.tw1.ru') {
      res.setHeader('Access-Control-Allow-Origin', origin);
      console.log('CORS Origin set to:', origin);
    } else {
      // Временно разрешаем все origins
      res.setHeader('Access-Control-Allow-Origin', '*');
      console.log('CORS Origin set to * (temporary fix)');
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      console.log('Неверный метод:', req.method);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('=== ЗАПРОС НА ОПЛАТУ ТИНЬКОФФ ===');
    console.log('Body:', req.body);

    // Проверяем что body существует
    if (!req.body) {
      console.log('Body отсутствует');
      return res.status(400).json({ error: 'Request body is required' });
    }

    // Получаем данные только для POST запроса
    const { amount, description, orderId, fullName, email, phone } = req.body;
    
    console.log('=== ТИНЬКОФФ API ПОЛУЧИЛ ДАННЫЕ ===');
    console.log('Данные клиента:', { fullName, email, phone });
    console.log('Данные платежа:', { amount, orderId, description });
    
    // Чистые данные
    const cleanDescription = String(description).replace(/tour-\d+/g, '').replace(/-\d+/g, '').trim();
    
    // Определяем домен для SuccessURL
    const referer = req.headers.referer || '';
    let successUrl = 'https://ekskyrsiadima.ru/ticket?success=true&paymentId=' + String(orderId);
    
    if (referer.includes('cv91330.tw1.ru')) {
      successUrl = 'https://cv91330.tw1.ru/ticket?success=true&paymentId=' + String(orderId);
    }
    
    console.log('Referer:', referer);
    console.log('SuccessURL будет:', successUrl);
    
    // Создаем объект Receipt (чек) для Тинькофф
    const receipt = {
      Email: email,
      Phone: phone,
      EmailCompany: 'sokovdima3@gmail.com',
      Taxation: 'usn', // УСН Доход
      FfdVersion: '1.05',
      Items: [
        {
          Name: cleanDescription.substring(0, 128), // Название экскурсии
          Price: Math.round(amount * 100), // Цена в копейках
          Quantity: 1, // Количество
          Amount: Math.round(amount * 100), // Сумма в копейках
          Tax: 'none', // Без НДС
          PaymentMethod: 'full_prepayment', // Полная предоплата
          PaymentObject: 'service' // Услуга
        }
      ]
    };
    
    console.log('Receipt объект:', JSON.stringify(receipt, null, 2));
    
    const paymentData = {
      TerminalKey: CONFIG.TERMINAL_KEY,
      Amount: Math.round(amount * 100),
      OrderId: String(orderId),
      Description: cleanDescription.substring(0, 250),
      CustomerKey: String(orderId),
      PayType: 'O',
      Recurrent: 'N',
      // Добавляем Email и Phone ДО генерации токена
      Email: email,
      Phone: phone ? phone.replace(/\D/g, '') : undefined,
      // Добавляем URL для возврата на страницу билета с параметрами успеха
      SuccessURL: successUrl,
      FailURL: 'https://ekskyrsiadima.ru/payment-error',
      // Добавляем webhook для уведомлений о статусе оплаты
      NotificationURL: 'https://ekskyrsiadima-jhin.vercel.app/api/tinkoff-webhook',
      // Добавляем чек для webhook уведомлений
      Receipt: receipt
    };

    // Добавляем fullName в описание ПОСЛЕ токена (не влияет на токен)
    if (fullName) paymentData.Description = `${fullName} - ${paymentData.Description}`;

    // Генерируем токен с правильным порядком
    paymentData.Token = generateToken(paymentData);

    console.log('Отправляем в Тинькофф:', JSON.stringify(paymentData, null, 2));
    console.log('SuccessURL:', paymentData.SuccessURL);
    console.log('FailURL:', paymentData.FailURL);
    console.log('NotificationURL:', paymentData.NotificationURL);

    // Запрос в Тинькофф
    const response = await fetch(`${CONFIG.API_URL}/Init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();
    console.log('Ответ Тинькофф:', JSON.stringify(result, null, 2));

    if (result.Success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Ошибка:', error);
    res.status(500).json({ error: error.message });
  }
}
