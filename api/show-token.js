import crypto from 'crypto';

const CONFIG = {
  TERMINAL_KEY: '1766479140271DEMO',
  PASSWORD: '!BuR2jlFEFF25Hh5'
};

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
    
    // Данные для токена
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
    const token = crypto.createHash('sha256').update(stringToSign).digest('hex');

    res.status(200).json({
      paymentData: paymentData,
      tokenValues: values,
      stringToSign: stringToSign,
      generatedToken: token,
      manualCheck: {
        step1_values: values,
        step2_joined: values.join(''),
        step3_withPassword: stringToSign,
        step4_hash: token
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
