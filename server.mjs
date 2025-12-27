import express from 'express';
import cors from 'cors';
import { createHash } from 'crypto';
import TinkoffMerchantAPI from 'tinkoff-merchant-api';

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
  TERMINAL_KEY: '1766479140318', // Рабочий терминал
  PASSWORD: 's9R^$NsmYPytIY#_',   // Рабочий пароль
  API_URL: 'https://securepay.tinkoff.ru/v2',
};

/* ================= TINKOFF API ================= */
const tinkoffAPI = new TinkoffMerchantAPI(CONFIG.TERMINAL_KEY, CONFIG.PASSWORD);

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
  delete copy.Email;          // Убираем email
  delete copy.Phone;          // Убираем телефон
  
  console.log('After delete keys:', Object.keys(copy));
  
  const tokenData = {
    ...copy,
    Password: CONFIG.PASSWORD
  };
  
  console.log('Token data keys:', Object.keys(tokenData));
  
  const sortedKeys = ['Amount', 'OrderId', 'Password', 'TerminalKey'];
  console.log('Sorted keys:', sortedKeys);
  
  const tokenString = sortedKeys.map(key => {
    let value = key === 'Password' ? CONFIG.PASSWORD : tokenData[key];
    if (key === 'Amount') value = String(value); // Amount как строка
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
    console.log('=== ИСПОЛЬЗУЕМ БИБЛИОТЕКУ ТИНЬКОФФ ===');
    console.log('REQUEST DATA:', JSON.stringify(paymentData, null, 2));

    try {
      // МИНИМАЛЬНЫЙ ЗАПРОС БЕЗ RECEIPT
      const result = await tinkoffAPI.init({
        Amount: paymentData.Amount,
        OrderId: paymentData.OrderId,
        Description: paymentData.Description,
        CustomerKey: paymentData.CustomerKey,
      });

      console.log('TINKOFF LIBRARY RESPONSE:', result);
      res.status(200).json(result);

    } catch (error) {
      console.log('TINKOFF LIBRARY ERROR:', error);
      res.status(400).json({ 
        Success: false, 
        ErrorCode: 'LIBRARY_ERROR',
        Message: error.message,
        Details: 'Error using Tinkoff library'
      });
    }

  } catch (err) {
    console.error('SERVER ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= START ================= */
app.listen(3000, () => {
  console.log('✅ Server started on port 3000');
});
