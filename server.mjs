import express from 'express';
import cors from 'cors';
import { createHash } from 'crypto';

const app = express();

/* ================= CORS ================= */
app.use(cors({
  origin: 'https://ekskyrsiadima.ru',
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

/* ================= CONFIG ================= */
const CONFIG = {
  TERMINAL_KEY: '1766479140318',
  PASSWORD: 's9R^$NsmYPytIY#_',
  API_URL: 'https://securepay.tinkoff.ru/v2',
};

/* ================= TOKEN (РАБОЧИЙ ВАРИАНТ) ================= */
function generateToken(data) {
  console.log('=== TOKEN GENERATION START ===');
  const copy = { ...data };
  console.log('Original keys:', Object.keys(copy));
  
  delete copy.Token;
  delete copy.Receipt; // Удаляем Receipt
  delete copy.DATA;    // Удаляем DATA (важно!)
  delete copy.SuccessURL;    // Удаляем URL поля
  delete copy.FailURL;       // Удаляем URL поля
  delete copy.NotificationURL; // Удаляем URL поля
  delete copy.CustomerKey;    // Убираем email
  delete copy.Email;          // Убираем email
  delete copy.Phone;          // Убираем телефон
  
  console.log('After delete keys:', Object.keys(copy));
  
  const tokenData = {
    ...copy,
    Password: CONFIG.PASSWORD
  };
  
  console.log('Token data keys:', Object.keys(tokenData));
  
  const sortedKeys = Object.keys(tokenData).sort();
  console.log('Sorted keys:', sortedKeys);
  
  const tokenString = sortedKeys.map(key => {
    const value = key === 'Password' ? CONFIG.PASSWORD : tokenData[key];
    console.log(`Key: ${key}, Value: ${value}, Type: ${typeof value}`);
    return String(value);
  }).join('');
  
  console.log('Token string:', tokenString);
  
  const token = createHash('sha256').update(tokenString).digest('hex');
  console.log('Generated token:', token);
  console.log('=== TOKEN GENERATION END ===');
  
  return token;
}

/* ================= API ================= */
app.post('/api/tinkoff-working', async (req, res) => {
  try {
    const { amount, description, orderId, fullName, email, phone } = req.body;

    if (!amount || !orderId || !description || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const amountKopeks = Math.round(Number(amount) * 100);
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanDescription = `Payment for tour`.substring(0, 250);

    /* ===== RECEIPT (НЕ УЧАСТВУЕТ В TOKEN) ===== */
    const receipt = {
      Email: email,
      Phone: cleanPhone,
      Taxation: 'usn_income',
      FfdVersion: '1.05',
      Items: [
        {
          Name: cleanDescription.substring(0, 128),
          Price: amountKopeks,
          Quantity: 1,
          Amount: amountKopeks,
          Tax: 'none',
          PaymentMethod: 'full_prepayment',
          PaymentObject: 'service',
        },
      ],
    };

    /* ===== PAYMENT DATA ===== */
    const paymentData = {
      TerminalKey: CONFIG.TERMINAL_KEY,
      Amount: amountKopeks,
      OrderId: String(orderId),
      Description: cleanDescription,
      CustomerKey: email,
      Email: email,
      Phone: cleanPhone,

      // эти поля НЕ участвуют в Token
      Receipt: receipt,
      SuccessURL: `https://ekskyrsiadima.ru/ticket?success=true&orderId=${orderId}`,
      FailURL: 'https://ekskyrsiadima.ru/payment-error',
      NotificationURL:
        'https://nextjs-boilerplateuexkyesua.onrender.com/api/tinkoff-webhook',
    };

    /* ===== TOKEN ===== */
    paymentData.Token = generateToken(paymentData);

    console.log('=== ПОЛНЫЙ ЗАПРОС В ТИНЬКОФФ ===');
    console.log('JSON:', JSON.stringify(paymentData, null, 2));
    console.log('TOKEN DEBUG:');
    console.log('- TerminalKey:', paymentData.TerminalKey);
    console.log('- Amount:', paymentData.Amount);
    console.log('- OrderId:', paymentData.OrderId);
    console.log('- Description:', paymentData.Description);
    console.log('- CustomerKey:', paymentData.CustomerKey);
    console.log('- Email:', paymentData.Email);
    console.log('- Phone:', paymentData.Phone);
    console.log('=== КОНЕЦ ДЕБАГА ===');

    const response = await fetch(`${CONFIG.API_URL}/Init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();
    console.log('TINKOFF RESPONSE:', result);

    res.status(result.Success ? 200 : 400).json(result);

  } catch (err) {
    console.error('SERVER ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= START ================= */
app.listen(3000, () => {
  console.log('✅ Server started on port 3000');
});
