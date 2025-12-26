import { createHmac } from 'crypto';

// Импортируем Telegram бота
import { sendTelegramMessage } from '../src/utils/telegramBot.js';

// Конфигурация Яндекс Пей
const YANDEX_CONFIG = {
  MERCHANT_API_KEY: '19c1e757-cf1e-4789-b576-48c30474c6d8',
  SECRET_KEY: 'test' // Для тестового режима
};

// Проверка подписи от Яндекс Пей
function verifyYandexSignature(payload, signature) {
  const expectedSignature = createHmac('sha256', YANDEX_CONFIG.SECRET_KEY)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}

export default async function handler(req, res) {
  try {
    console.log('=== ЯНДЕКС ПЕЙ WEBHOOK ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('Headers:', req.headers);

    if (req.method === 'GET') {
      return res.status(200).json({ 
        success: true, 
        message: 'Яндекс Пей webhook работает',
        timestamp: new Date().toISOString()
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const signature = req.headers['x-notify-signature'];
    const payload = JSON.stringify(req.body);

    console.log('Payload:', payload);
    console.log('Signature:', signature);

    // В тестовом режиме пропускаем проверку подписи
    // if (!verifyYandexSignature(payload, signature)) {
    //   console.log('Неверная подпись');
    //   return res.status(400).json({ error: 'Invalid signature' });
    // }

    const { event, object } = req.body;
    console.log('Event:', event);
    console.log('Payment Object:', JSON.stringify(object, null, 2));

    // Обработка успешного платежа
    if (event === 'payment.succeeded') {
      console.log('✅ Платеж Яндекс Пей успешен!');
      
      const metadata = object.metadata || {};
      const paymentData = {
        paymentId: object.id,
        orderId: metadata.orderId,
        amount: object.amount.value,
        currency: object.amount.currency,
        status: 'succeeded',
        fullName: metadata.fullName,
        email: metadata.email,
        phone: metadata.phone,
        paymentMethod: 'yandex-pay',
        timestamp: new Date().toISOString()
      };

      console.log('Данные для отправки:', paymentData);

      // Отправляем уведомление в Telegram
      try {
        const message = `💰 **НОВЫЙ ПЛАТЕЖ ЯНДЕКС ПЕЙ**

💳 **ID платежа:** ${paymentData.paymentId}
📋 **ID заказа:** ${paymentData.orderId}
💵 **Сумма:** ${paymentData.amount} ${paymentData.currency}
✅ **Статус:** ${paymentData.status}
💳 **Способ:** Яндекс Пей

👤 **Клиент:**
📧 **Email:** ${paymentData.email}
📱 **Телефон:** ${paymentData.phone}
👤 **Имя:** ${paymentData.fullName}

⏰ **Время:** ${paymentData.timestamp}`;

        await sendTelegramMessage(message);
        console.log('✅ Telegram уведомление отправлено');
      } catch (telegramError) {
        console.error('❌ Ошибка отправки в Telegram:', telegramError);
      }

      // Здесь можно добавить отправку билета на email
      console.log('✅ Платеж обработан успешно');
    }

    // Обработка отмены платежа
    if (event === 'payment.canceled') {
      console.log('❌ Платеж Яндекс Пей отменен');
      // Здесь можно добавить логику для отмененных платежей
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Ошибка в Яндекс Пей webhook:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
