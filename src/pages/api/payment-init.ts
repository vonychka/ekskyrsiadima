// src/pages/api/payment-init.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { initPayment, TinkoffPaymentRequest, TinkoffResponse } from '../../lib/tinkoff';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Received request to /api/payment-init');
  
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are allowed'
    });
  }

  try {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      amount,
      orderId,
      description,
      email,
      phone,
      customerKey,
      successUrl,
      failUrl,
      notificationUrl,
    } = req.body as TinkoffPaymentRequest;

    if (!amount || !orderId || !description) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['amount', 'orderId', 'description']
      });
    }

    // Вызываем унифицированную функцию инициализации платежа
    const result = await initPayment({
      amount,
      orderId,
      description,
      email,
      phone,
      customerKey,
      successUrl: successUrl || `${req.headers.origin}/payment/success?orderId=${orderId}`,
      failUrl: failUrl || `${req.headers.origin}/payment/failure?orderId=${orderId}`,
      notificationUrl: notificationUrl || `${req.headers.origin}/api/payment/notification`
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in /api/payment-init:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
