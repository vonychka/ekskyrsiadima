// src/pages/api/payment/notification.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, TinkoffResponse } from '../../../lib/tinkoff';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Received notification from Tinkoff:', JSON.stringify(req.body, null, 2));

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are allowed'
    });
  }

  try {
    const { PaymentId, OrderId, Status, Amount, Token } = req.body;

    // Проверяем обязательные поля
    if (!PaymentId || !OrderId || !Status || !Token) {
      console.error('Missing required fields in notification');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Проверяем токен
    if (!verifyToken(req.body)) {
      console.error('Invalid token in notification');
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Обрабатываем статус платежа
    console.log(`Payment ${PaymentId} for order ${OrderId} has status: ${Status}`);

    // Здесь можно добавить бизнес-логику:
    // - Обновить статус заказа в базе данных
    // - Отправить email уведомление клиенту
    // - Начать выполнение услуги и т.д.

    // Отправляем успешный ответ Тинькофф
    const response: TinkoffResponse = {
      Success: true,
      OrderId: OrderId,
      PaymentId: PaymentId,
      Status: Status
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error processing Tinkoff notification:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
