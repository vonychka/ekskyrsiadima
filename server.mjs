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

/* ================= TOKEN ================= */
function generateToken(data) {
  const allowedFields = {
    TerminalKey: data.TerminalKey,
    Amount: data.Amount,
    OrderId: data.OrderId,
    Description: data.Description,
    CustomerKey: data.CustomerKey,
    Email: data.Email,
    Phone: data.Phone,
    Password: CONFIG.PASSWORD,
  };

  const tokenString = Object.keys(allowedFields)
    .sort()
    .map(key => String(allowedFields[key]))
    .join('');

  return createHash('sha256').update(tokenString).digest('hex');
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
    const cleanDescription = `${fullName} - ${description}`.substring(0, 250);

    /* ===== Receipt (НЕ УЧАСТВУЕТ В TOKEN) ===== */
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
      Receipt: receipt,
      SuccessURL: `https://ekskyrsiadima.ru/ticket?success=true&orderId=${orderId}`,
      FailURL: 'https://ekskyrsiadima.ru/payment-error',
      NotificationURL: process.env.RENDER_EXTERNAL_URL + '/api/tinkoff-webhook',
    };

    /* ===== TOKEN ===== */
    paymentData.Token = generateToken(paymentData);

    console.log('SEND TO TINKOFF:', JSON.stringify(paymentData, null, 2));

    const response = await fetch(`${CONFIG.API_URL}/Init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();
    console.log('TINKOFF RESPONSE:', result);

    res.status(result.Success ? 200 : 400).json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= START ================= */
app.listen(3000, () => {
  console.log('✅ Server started on port 3000');
});
