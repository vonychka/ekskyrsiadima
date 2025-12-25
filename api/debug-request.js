import crypto from 'crypto';

export default async function handler(req, res) {
  try {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', 'https://ekskyrsiadima.ru');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Показываем что пришло с клиента
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));

    const { amount, orderId, description } = req.body;
    
    // Формируем точные данные как в payment-simple
    const CONFIG = {
      TERMINAL_KEY: '1766479140271DEMO',
      PASSWORD: '!BuR2jlFEFF25Hh5'
    };

    const paymentData = {
      TerminalKey: CONFIG.TERMINAL_KEY,
      Amount: Math.round(amount * 100),
      OrderId: String(orderId),
      Description: String(description).substring(0, 250),
      CustomerKey: String(orderId),
      PayType: 'O',
      Recurrent: 'N'
    };

    // Генерация токена
    const values = [
      paymentData.Amount,
      paymentData.CustomerKey, 
      paymentData.Description,
      paymentData.OrderId,
      paymentData.PayType,
      paymentData.Recurrent,
      paymentData.TerminalKey
    ];
    
    const stringToSign = values.join('') + CONFIG.PASSWORD;
    
    console.log('String for token:', stringToSign);
    
    paymentData.Token = crypto.createHash('sha256').update(stringToSign).digest('hex');

    console.log('Final payment data:', JSON.stringify(paymentData, null, 2));

    res.status(200).json({
      received: req.body,
      paymentData: paymentData,
      tokenString: stringToSign
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
