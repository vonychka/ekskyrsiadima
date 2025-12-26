import crypto from 'crypto';

const CONFIG = {
  TerminalKey: '1766479140318',
  PASSWORD: 's9R^$NsmYPytIY#_',
  API_URL: 'https://securepay.tinkoff.ru/v2'
};

function generateToken(data) {
  const values = [
    data.Amount,
    data.CustomerKey, 
    data.Description,
    data.OrderId,
    data.PayType,
    data.Recurrent,
    data.TerminalKey
  ];
  
  const stringToSign = values.join('') + CONFIG.PASSWORD;
  return crypto.createHash('sha256').update(stringToSign).digest('hex');
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://ekskyrsiadima.ru');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { amount, orderId, description } = req.body;
    
    // Минимальные данные
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

    console.log('Sending to Tinkoff:', JSON.stringify(paymentData, null, 2));

    // Запрос в Тинькофф
    const response = await fetch(`${CONFIG.API_URL}/Init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();
    console.log('Tinkoff response:', JSON.stringify(result, null, 2));

    if (result.Success) {
      return res.status(200).json(result);
    } else {
      console.error('Tinkoff error details:', result);
      return res.status(400).json({
        error: result.Message || 'Tinkoff API error',
        details: result,
        errorCode: result.ErrorCode
      });
    }

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
