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

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { amount, orderId, description, email, phone, customerKey } = req.body;

    // Точные параметры для Тинькофф API
    const paymentData = {
      TerminalKey: '1766479140318',
      Amount: Math.round(amount * 100),
      OrderId: String(orderId),
      Description: String(description).substring(0, 250),
      CustomerKey: String(customerKey || orderId),
      PayType: 'O',
      Recurrent: 'N'
    };

    // Создаем Receipt если есть email или phone
    const receipt = (email || phone) ? {
      Email: email,
      Phone: phone ? phone.replace(/\D/g, '') : undefined,
      Taxation: 'osn',
      Items: [
        {
          Name: String(description).substring(0, 128),
          Price: Math.round(amount * 100),
          Quantity: 1,
          Amount: Math.round(amount * 100),
          Tax: 'none'
        }
      ]
    } : undefined;
    
    // Финальные данные запроса
    const requestData = {
      ...paymentData,
      Token: 'DEBUG_TOKEN',
      ...(receipt && { Receipt: receipt })
    };

    console.log('DEBUG - Request data:', JSON.stringify(requestData, null, 2));

    res.status(200).json({
      message: 'Debug request data',
      requestData: requestData,
      paymentData: paymentData,
      receipt: receipt
    });

  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
}
