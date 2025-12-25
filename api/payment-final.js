import crypto from 'crypto';

const CONFIG = {
  TERMINAL_KEY: '1766479140271DEMO',
  PASSWORD: '!BuR2jlFEFF25Hh5',
  API_URL: 'https://securepay.tinkoff.ru/v2'
};

function generateToken(data) {
  // ТОЛЬКО эти поля в ТОЧНОМ порядке
  const tokenString = [
    data.Amount,
    data.CustomerKey,
    data.Description,
    data.OrderId,
    data.PayType,
    data.Recurrent,
    data.TerminalKey
  ].join('') + CONFIG.PASSWORD;
  
  return crypto.createHash('sha256').update(tokenString).digest('hex');
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

    const { amount, orderId, description } = req.body;
    
    // Чистые данные без лишнего
    const paymentData = {
      TerminalKey: CONFIG.TERMINAL_KEY,
      Amount: Math.round(amount * 100),
      OrderId: String(orderId),
      Description: String(description).substring(0, 250),
      CustomerKey: String(orderId),
      PayType: 'O',
      Recurrent: 'N'
    };

    // Генерируем токен
    paymentData.Token = generateToken(paymentData);

    console.log('Финальные данные для Тинькофф:', JSON.stringify(paymentData, null, 2));

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
