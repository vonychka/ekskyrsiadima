import { createHmac } from 'crypto';

// Конфигурация Яндекс Пей
const YANDEX_CONFIG = {
  MERCHANT_API_KEY: '19c1e757-cf1e-4789-b576-48c30474c6d8',
  API_URL: 'https://pay.yandex.ru/api/merchant/v1',
  CALLBACK_URL: 'https://ekskyrsiadima-jhin.vercel.app/api/yandex-webhook',
  SUCCESS_URL: 'https://ekskyrsiadima.ru/ticket?success=true&paymentId=',
  FAIL_URL: 'https://ekskyrsiadima.ru/payment-error'
};

// Генерация подписи для Яндекс Пей
function generateYandexSignature(data, secret) {
  const sortedData = Object.keys(data)
    .sort()
    .reduce((result, key) => {
      result[key] = data[key];
      return result;
    }, {});
  
  const stringToSign = Object.values(sortedData).join('');
  return createHmac('sha256', secret).update(stringToSign).digest('hex');
}

export default async function handler(req, res) {
  try {
    console.log('=== ЯНДЕКС ПЕЙ API ===');
    console.log('Timestamp:', new Date().toISOString());

    // CORS
    const origin = req.headers.origin;
    console.log('Request Origin:', origin);
    
    if (origin === 'https://ekskyrsiadima.ru' || origin === 'https://cv91330.tw1.ru') {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { amount, description, orderId, fullName, email, phone } = req.body;
    
    console.log('Данные клиента:', { fullName, email, phone });
    console.log('Данные платежа:', { amount, orderId, description });

    // Определяем SuccessURL в зависимости от домена
    const referer = req.headers.referer || '';
    let successUrl = YANDEX_CONFIG.SUCCESS_URL + String(orderId || 'yandex-' + Date.now());
    
    if (referer.includes('cv91330.tw1.ru')) {
      successUrl = 'https://cv91330.tw1.ru/ticket?success=true&paymentId=' + String(orderId || 'yandex-' + Date.now());
    }

    // Данные для создания платежа Яндекс Пей
    const paymentData = {
      amount: {
        value: String(amount || 1000),
        currency: 'RUB'
      },
      description: description || 'Экскурсия',
      confirmation: {
        type: 'redirect',
        return_url: successUrl
      },
      capture: true,
      metadata: {
        orderId: String(orderId || 'yandex-' + Date.now()),
        fullName: fullName || '',
        email: email || '',
        phone: phone || ''
      },
      receipt: {
        customer: {
          email: email || 'customer@example.com',
          phone: phone || '+79991234567'
        },
        items: [{
          description: description || 'Экскурсия',
          quantity: '1',
          amount: {
            value: String(amount || 1000),
            currency: 'RUB'
          },
          vat_code: '1',
          payment_mode: 'full_prepayment',
          payment_subject: 'service'
        }]
      }
    };

    console.log('Отправляем в Яндекс Пей:', JSON.stringify(paymentData, null, 2));
    console.log('SuccessURL:', successUrl);
    console.log('Callback URL:', YANDEX_CONFIG.CALLBACK_URL);

    // Запрос к Яндекс Пей API
    const response = await fetch(`${YANDEX_CONFIG.API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${YANDEX_CONFIG.MERCHANT_API_KEY}`,
        'Idempotence-Key': String(orderId || 'yandex-' + Date.now())
      },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();
    console.log('Ответ Яндекс Пей:', JSON.stringify(result, null, 2));

    if (result.confirmation && result.confirmation.confirmation_url) {
      res.status(200).json({
        success: true,
        paymentUrl: result.confirmation.confirmation_url,
        paymentId: result.id,
        orderId: orderId,
        message: 'Платеж Яндекс Пей создан'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.description || 'Ошибка создания платежа',
        details: result
      });
    }

  } catch (error) {
    console.error('Ошибка в Яндекс Пей API:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
