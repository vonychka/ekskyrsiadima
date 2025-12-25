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
    // CORS
    res.setHeader('Access-Control-Allow-Origin', 'https://ekskyrsiadima.ru');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const { amount, orderId, description, fullName, email, phone } = req.body;
    
    // Чистые данные
    const cleanDescription = String(description).replace(/tour-\d+/g, '').replace(/-\d+/g, '').trim();
    
    const paymentData = {
      TerminalKey: CONFIG.TERMINAL_KEY,
      Amount: Math.round(amount * 100),
      OrderId: String(orderId),
      Description: cleanDescription.substring(0, 250),
      CustomerKey: String(orderId),
      PayType: 'O',
      Recurrent: 'N',
      // Добавляем URL для возврата на страницу билета
      SuccessURL: 'https://ekskyrsiadima.ru/ticket',
      FailURL: 'https://ekskyrsiadima.ru/payment-error'
    };

    // Генерируем токен с правильным порядком
    paymentData.Token = generateToken(paymentData);

    // Добавляем опциональные поля ПОСЛЕ токена
    if (fullName) paymentData.Description = `${fullName} - ${paymentData.Description}`;
    if (email) paymentData.Email = email;
    if (phone) paymentData.Phone = phone.replace(/\D/g, '');

    console.log('Отправляем в Тинькофф:', JSON.stringify(paymentData, null, 2));

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
