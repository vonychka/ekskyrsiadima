// server/index.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const TINKOFF_API = 'https://securepay.tinkoff.ru/v2/Init';
const TERMINAL_KEY = process.env.TINKOFF_TERMINAL_KEY || '1766479140318';
const SECRET_KEY = process.env.TINKOFF_SECRET_KEY || '';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

function stableStringify(obj) {
  if (obj === null) return 'null';
  if (Array.isArray(obj)) return '[' + obj.map(stableStringify).join(',') + ']';
  if (typeof obj !== 'object') return String(obj);
  return '{' + Object.keys(obj).sort().map(k => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}';
}

function buildToken(params) {
  const p = { ...params };
  delete p.Token;
  const keys = Object.keys(p).sort();
  let concatValues = '';
  for (const k of keys) {
    const v = p[k];
    if (v === null || v === undefined) continue;
    if (typeof v === 'object') concatValues += stableStringify(v);
    else concatValues += String(v);
  }
  // Log string used for signing (without SECRET_KEY) for debugging only
  console.log('String to sign (without secret):', concatValues + SECRET_KEY ? concatValues : concatValues);
  const stringToHash = concatValues + SECRET_KEY;
  return crypto.createHash('sha256').update(stringToHash).digest('hex');
}

app.post('/api/tinkoff/init', async (req, res) => {
  try {
    const { amount, orderId, description, email, phone } = req.body;
    if (!amount || !orderId) return res.status(400).json({ error: 'amount and orderId required' });

    const amountInt = Math.round(amount); // expect client sends kopecks, or server can multiply

    const payment = {
      TerminalKey: TERMINAL_KEY,
      Amount: amountInt,
      OrderId: orderId,
      Description: description ? String(description).slice(0, 250) : undefined,
      DATA: {
        Email: email,
        Phone: (phone || '').replace(/\D/g, '')
      },
      SuccessURL: `${APP_URL}/payment/success`,
      FailURL: `${APP_URL}/payment/failure`,
      Receipt: {
        Email: email,
        Phone: (phone || '').replace(/\D/g, ''),
        Taxation: 'osn',
        Items: [
          {
            Name: description ? String(description).slice(0, 100) : 'Оплата',
            Price: amountInt,
            Quantity: 1,
            Amount: amountInt,
            Tax: 'none',
            PaymentMethod: 'full_prepayment',
            PaymentObject: 'service'
          }
        ]
      }
    };

    const token = buildToken(payment);
    const body = { ...payment, Token: token };

    const resp = await axios.post(TINKOFF_API, body, { headers: { 'Content-Type': 'application/json' }, timeout: 10000 });

    return res.json(resp.data);
  } catch (err) {
    console.error('init error', err.response?.data || err.message);
    return res.status(500).json({ error: 'init_failed', details: err.response?.data || err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Tinkoff proxy server listening on ${PORT}`));
