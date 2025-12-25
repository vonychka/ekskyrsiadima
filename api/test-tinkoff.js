import crypto from 'crypto';

const TINKOFF_CONFIG = {
  TERMINAL_KEY: '1766479140271DEMO',
  PASSWORD: '!BuR2jlFEFF25Hh5'
};

function generateTinkoffToken(params) {
  const tokenString = [
    params.Amount,
    params.CustomerKey,
    params.Description,
    params.OrderId,
    params.PayType,
    params.Recurrent,
    params.TerminalKey
  ].join('') + TINKOFF_CONFIG.PASSWORD;

  return crypto.createHash('sha256').update(tokenString).digest('hex');
}

export default async function handler(req, res) {
  try {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', 'https://ekskyrsiadima.ru');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Тестовый запрос с правильным токеном
    const testData = {
      TerminalKey: TINKOFF_CONFIG.TERMINAL_KEY,
      Amount: 1000,
      OrderId: 'test-123',
      Description: 'Тестовый платеж',
      CustomerKey: 'test-123',
      PayType: 'O',
      Recurrent: 'N'
    };

    // Генерируем правильный токен
    const token = generateTinkoffToken(testData);
    testData.Token = token;

    console.log('Test request to Tinkoff:', JSON.stringify(testData, null, 2));

    const response = await fetch('https://securepay.tinkoff.ru/v2/Init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('Tinkoff test response:', JSON.stringify(result, null, 2));

    res.status(200).json({
      status: response.status,
      ok: response.ok,
      result: result
    });

  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ error: error.message });
  }
}
