// Webhook для уведомлений от Тинькофф о статусе оплаты
import crypto from 'crypto';

const CONFIG = {
  TERMINAL_KEY: process.env.TINKOFF_TERMINAL_KEY || '1766479140271DEMO',
  PASSWORD: process.env.TINKOFF_PASSWORD || '!BuR2jlFEFF25Hh5'
};

// Генерация токена для проверки webhook
function generateToken(paymentData) {
  const tokenString = [
    paymentData.Amount,
    paymentData.CustomerKey,
    paymentData.Description,
    paymentData.OrderId,
    CONFIG.PASSWORD,
    paymentData.PayType,
    paymentData.Recurrent,
    paymentData.TerminalKey
  ].join('');
  
  return crypto.createHash('sha256').update(tokenString).digest('hex');
}

export default async function handler(req, res) {
  try {
    console.log('=== ТИНЬКОФФ WEBHOOK УВЕДОМЛЕНИЕ ===');
    console.log('Method:', req.method);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const notification = req.body;
    
    console.log('Получено уведомление:', notification);

    // Проверяем токен для безопасности
    if (notification.Token) {
      const expectedToken = generateToken(notification);
      if (notification.Token !== expectedToken) {
        console.log('❌ Неверный токен уведомления');
        return res.status(400).json({ error: 'Invalid token' });
      }
    }

    // Проверяем статус оплаты
    if (notification.Status === 'CONFIRMED' || notification.Status === 'AUTHORIZED') {
      console.log('✅ ОПЛАТА УСПЕШНА!');
      console.log('OrderId:', notification.OrderId);
      console.log('PaymentId:', notification.PaymentId);
      console.log('Amount:', notification.Amount);
      
      // Отправляем уведомление в Telegram
      try {
        const { sendToTelegram } = await import('../../src/utils/telegramBot.js');
        
        const telegramData = {
          fullName: 'Клиент',
          email: 'client@example.com',
          phone: '+7XXXXXXXXXX',
          tourName: 'Экскурсия',
          amount: notification.Amount / 100,
          paymentId: notification.PaymentId,
          orderId: notification.OrderId,
          paymentMethod: 'Тинькофф',
          status: 'ОПЛАЧЕНО'
        };
        
        await sendToTelegram(telegramData);
        console.log('✅ Telegram уведомление отправлено');
      } catch (error) {
        console.error('❌ Ошибка отправки в Telegram:', error);
      }
      
      // Здесь можно добавить отправку email и другие действия
      console.log('✅ Все уведомления отправлены после успешной оплаты');
    } else {
      console.log('⏳ Статус оплаты:', notification.Status);
    }

    // Возвращаем успешный ответ Тинькоффу
    res.status(200).json({ success: true });

  } catch (error) {
    console.error('❌ Ошибка в webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
