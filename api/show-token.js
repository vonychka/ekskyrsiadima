import crypto from 'crypto';

const CONFIG = {
  TerminalKey: '1766479140318',
  PASSWORD: 's9R^$NsmYPytIY#_'
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

    console.log('=== ПОЛНАЯ ДИАГНОСТИКА ТОКЕНА ===');
    console.log('req.body:', JSON.stringify(req.body, null, 2));

    const { amount, orderId, description } = req.body;
    
    console.log('Параметры:');
    console.log('- amount:', amount, '(тип:', typeof amount, ')');
    console.log('- orderId:', orderId, '(тип:', typeof orderId, ')');
    console.log('- description:', description, '(тип:', typeof description, ')');
    
    // Данные для токена
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

    console.log('paymentData:', JSON.stringify(paymentData, null, 2));

    // Генерация токена - ПРАВИЛЬНЫЙ ПОРЯДОК
    const values = [
      paymentData.Amount,
      paymentData.CustomerKey,
      paymentData.Description,
      paymentData.OrderId,
      CONFIG.PASSWORD, // ПАРОЛЬ ПОСЛЕ OrderId!
      paymentData.PayType,
      paymentData.Recurrent,
      paymentData.TerminalKey
    ];
    
    console.log('values для токена:', values);
    
    const stringToSign = values.join(''); // БЕЗ добавления пароля в конец!
    const token = crypto.createHash('sha256').update(stringToSign).digest('hex');

    console.log('stringToSign:', stringToSign);
    console.log('generatedToken:', token);
    console.log('=== КОНЕЦ ДИАГНОСТИКИ ===');

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
    console.error('Ошибка в show-token:', error);
    res.status(500).json({ error: error.message });
  }
}
