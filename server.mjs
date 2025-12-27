import { createHash } from 'crypto';
import express from 'express';

const CONFIG = {
  TERMINAL_KEY: '1766479140318',
  PASSWORD: 's9R^$NsmYPytIY#_',
  API_URL: 'https://securepay.tinkoff.ru/v2'
};

function generateToken(data) {
  const copy = { ...data };
  delete copy.Token;

  const tokenString = Object.keys({
    ...copy,
    Password: CONFIG.PASSWORD
  })
    .sort()
    .map(key => {
      if (key === 'Password') return CONFIG.PASSWORD;
      return copy[key];
    })
    .join('');

  return createHash('sha256')
    .update(tokenString)
    .digest('hex');
}

const app = express();

// Middleware
app.use(express.json());

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://ekskyrsiadima.ru');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// API endpoint
app.post('/api/tinkoff-working', async (req, res) => {
  try {
    console.log('=== ЗАПРОС НА ОПЛАТУ ТИНЬКОФФ ===');
    console.log('Body:', req.body);

    const { amount, description, orderId, fullName, email, phone } = req.body;
    
    if (!amount || !orderId || !description) {
      return res.status(400).json({ 
        error: 'Missing required fields: amount, orderId, description' 
      });
    }

    const cleanDescription = String(description).replace(/tour-\d+/g, '').replace(/-\d+/g, '').trim();
    
    const receipt = {
      Email: email,
      Phone: phone,
      EmailCompany: 'sokovdima3@gmail.com',
      FfdVersion: '1.05',
      Items: [{
        Name: cleanDescription.substring(0, 128),
        Price: Math.round(amount * 100),
        Quantity: 1,
        Amount: Math.round(amount * 100),
        Tax: 'none',
        PaymentMethod: 'full_prepayment',
        PaymentObject: 'service'
      }]
    };

    const paymentData = {
      TerminalKey: CONFIG.TERMINAL_KEY,
      Amount: Math.round(amount * 100),
      OrderId: String(orderId),
      Description: cleanDescription.substring(0, 250),
      CustomerKey: String(orderId),
      PayType: 'O',
      Recurrent: 'N',
      Email: email,
      Phone: phone ? phone.replace(/\D/g, '') : undefined,
      SuccessURL: 'https://ekskyrsiadima.ru/ticket?success=true&paymentId=' + String(orderId),
      FailURL: 'https://ekskyrsiadima.ru/payment-error',
      NotificationURL: process.env.RENDER_EXTERNAL_URL + '/api/tinkoff-webhook',
      Taxation: 'USN',
      Receipt: receipt
    };

    // Add fullName to description after token generation
    if (fullName) {
      paymentData.Description = `${fullName} - ${paymentData.Description}`;
    }

    paymentData.Token = generateToken(paymentData);

    console.log('Отправляем в Тинькофф:', JSON.stringify(paymentData, null, 2));
    console.log('=== ТЕСТ - ПРОВЕРКА ПОЛЯ TAXATION ===');
    console.log('Taxation в paymentData:', paymentData.Taxation);
    console.log('Taxation в Receipt:', paymentData.Receipt.Taxation);

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
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Tinkoff API Server is running',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
