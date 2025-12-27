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

  // Исключаем поля, которые не должны участвовать в токене
  delete copy.Receipt;
  delete copy.SuccessURL;
  delete copy.FailURL;
  delete copy.NotificationURL;
  delete copy.CustomerKey;
  delete copy.PayType;
  delete copy.Recurrent;
  delete copy.Email;
  delete copy.Phone;
  delete copy.Description;

  const tokenData = {
    ...copy,
    Password: CONFIG.PASSWORD
  };

  console.log('=== TOKEN GENERATION DEBUG ===');
  console.log('Data for token:', JSON.stringify(tokenData, null, 2));

  const tokenString = Object.keys(tokenData)
    .sort()
    .map(key => {
      const value = tokenData[key];
      console.log(`Token field: ${key} = ${value}`);
      return String(value);
    })
    .join('');

  console.log('Token string:', tokenString);

  const token = createHash('sha256')
    .update(tokenString)
    .digest('hex');

  console.log('Generated token:', token);
  console.log('=== END TOKEN DEBUG ===');

  return token;
}

console.log('=== SERVER FILE DEBUG ===');
console.log('Running server.mjs - ES module version');
console.log('Current working directory:', process.cwd());
console.log('Node version:', process.version);
console.log('TerminalKey:', CONFIG.TERMINAL_KEY);
console.log('Password exists:', !!CONFIG.PASSWORD);
console.log('=== END DEBUG ===');

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
      Email: email || 'noreply@example.com',
      Phone: phone || '+70000000000',
      EmailCompany: 'sokovdima3@gmail.com',
      Taxation: 'usn_income',
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
      Email: email || 'noreply@example.com',
      Phone: phone || '+70000000000',
      SuccessURL: 'https://ekskyrsiadima.ru/ticket?success=true&paymentId=' + String(orderId),
      FailURL: 'https://ekskyrsiadima.ru/payment-error',
      NotificationURL: process.env.RENDER_EXTERNAL_URL + '/api/tinkoff-webhook',
      Receipt: receipt
    };

    // Add fullName to description BEFORE token generation
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
