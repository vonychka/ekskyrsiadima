import { createHash } from 'crypto';

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
  
  return createHash('sha256').update(tokenString).digest('hex');
}

export default async function handler(req, res) {
  try {
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
      TaxationSystem: 'USNIncome', // УСН Доход
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
      // Добавляем URL для возврата на страницу билета с параметрами успеха
      SuccessURL: successUrl,
      FailURL: 'https://ekskyrsiadima.ru/payment-error',
      // Добавляем webhook для уведомлений о статусе оплаты
      NotificationURL: 'https://ekskyrsiadima-jhin.vercel.app/api/tinkoff-webhook',
      // Добавляем чек для webhook уведомлений
      Receipt: receipt
    };

    // Генерируем токен с правильным порядком
    paymentData.Token = generateToken(paymentData);

    // Добавляем опциональные поля ПОСЛЕ токена
    if (fullName) paymentData.Description = `${fullName} - ${paymentData.Description}`;
    if (email) paymentData.Email = email;
    if (phone) paymentData.Phone = phone.replace(/\D/g, '');

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
