// api/yandex/create-payment.js
// Vercel-style serverless function. Stores Merchant key in env: YANDEX_MERCHANT_KEY

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const { amount, orderId, description, email, phone } = req.body || {};
    if (!amount || !orderId) return res.status(400).json({ error: 'amount and orderId required' });

    const MERCHANT_KEY = process.env.YANDEX_MERCHANT_KEY;
    const APP_URL = process.env.APP_URL || (req.headers.origin || '');

    if (!MERCHANT_KEY) return res.status(500).json({ error: 'merchant_key_not_configured' });

    // amount expected in kopecks by frontend; Yandex expects rubles with decimals
    const value = (Number(amount) / 100).toFixed(2);

    const payload = {
      amount: { value, currency: 'RUB' },
      confirmation: { type: 'redirect', return_url: `${APP_URL}/payment/success` },
      description: String(description || '').slice(0, 128),
      metadata: { orderId },
      // optionally: payment_method_data etc.
    };

    console.log('create-payment payload:', payload, 'calling Yandex API');

    const resp = await fetch('https://pay.yandex.ru/api/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MERCHANT_KEY}`
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    try {
      const data = JSON.parse(text);
      console.log('Yandex response status', resp.status, data);
      return res.status(resp.status).json(data);
    } catch (e) {
      console.log('Yandex non-json response', text);
      return res.status(resp.status).send(text);
    }
  } catch (err) {
    console.error('create-payment error', err.message || err);
    return res.status(500).json({ error: 'create_payment_failed', details: err.message || String(err) });
  }
};
