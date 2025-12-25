import crypto from 'crypto';

export default async function handler(req, res) {
  try {
    console.log('=== НАЧАЛО DEBUG ЗАПРОСА ===');
    
    // CORS
    res.setHeader('Access-Control-Allow-Origin', 'https://ekskyrsiadima.ru');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      console.log('OPTIONS запрос - завершаю');
      return res.status(200).end();
    }

    console.log('Метод запроса:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    // Показываем что пришло с клиента
    console.log('Тело запроса с клиента:', JSON.stringify(req.body, null, 2));

    const { amount, orderId, description, email, phone, customerKey } = req.body;
    
    console.log('Распарсенные параметры:');
    console.log('- amount:', amount);
    console.log('- orderId:', orderId);
    console.log('- description:', description);
    console.log('- email:', email);
    console.log('- phone:', phone);
    console.log('- customerKey:', customerKey);
    
    // Формируем точные данные как в payment-simple
    const CONFIG = {
      TERMINAL_KEY: '1766479140271DEMO',
      PASSWORD: '!BuR2jlFEFF25Hh5'
    };

    console.log('Конфигурация Тинькофф:');
    console.log('- TERMINAL_KEY:', CONFIG.TERMINAL_KEY);
    console.log('- PASSWORD:', CONFIG.PASSWORD);

    const paymentData = {
      TerminalKey: CONFIG.TERMINAL_KEY,
      Amount: Math.round(amount * 100),
      OrderId: String(orderId),
      Description: String(description).substring(0, 250),
      CustomerKey: String(orderId), // Только OrderId, без email!
      PayType: 'O',
      Recurrent: 'N'
    };

    console.log('Данные для токена:', JSON.stringify(paymentData, null, 2));

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
    
    console.log('Строка для подписи токена:');
    console.log('1. Значения в порядке:', values);
    console.log('2. Склеенная строка:', values.join(''));
    console.log('3. Финальная строка с паролем:', stringToSign);
    
    paymentData.Token = crypto.createHash('sha256').update(stringToSign).digest('hex');

    console.log('Сгенерированный токен:', paymentData.Token);
    console.log('Финальные данные для отправки в Тинькофф:', JSON.stringify(paymentData, null, 2));

    // Пробуем отправить в Тинькофф
    console.log('=== ОТПРАВКА ЗАПРОСА В ТИНЬКОФФ ===');
    
    const tinkoffResponse = await fetch('https://securepay.tinkoff.ru/v2/Init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });

    console.log('Статус ответа Тинькофф:', tinkoffResponse.status);
    console.log('Headers ответа:', JSON.stringify(Object.fromEntries(tinkoffResponse.headers), null, 2));

    const result = await tinkoffResponse.json();
    console.log('Ответ от Тинькофф:', JSON.stringify(result, null, 2));

    console.log('=== КОНЕЦ DEBUG ЗАПРОСА ===');

    res.status(200).json({
      success: true,
      received: req.body,
      paymentData: paymentData,
      tokenString: stringToSign,
      tinkoffResponse: {
        status: tinkoffResponse.status,
        ok: tinkoffResponse.ok,
        body: result
      }
    });

  } catch (error) {
    console.error('ОШИБКА В DEBUG ЗАПРОСЕ:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
}
