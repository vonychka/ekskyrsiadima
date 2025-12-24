// src/pages/api/payment/init.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

// В продакшене используйте переменные окружения!
const TINKOFF_TERMINAL_KEY = process.env.TINKOFF_TERMINAL_KEY || '1766479140271DEMO';
const TINKOFF_PASSWORD = process.env.TINKOFF_PASSWORD || '!BuR2jlFEFF25Hh5';

interface TinkoffPaymentRequest {
  amount: number;
  orderId: string;
  description: string;
  email: string;
  phone: string;
}

interface ReceiptItem {
  Name: string;
  Price: number;
  Quantity: number;
  Amount: number;
  Tax: string;
  PaymentMethod: string;
  PaymentObject: string;
}

interface Receipt {
  Email: string;
  Phone: string;
  Taxation: string;
  Items: ReceiptItem[];
}

function generateTinkoffToken(params: Record<string, any>): string {
  const { Token, Receipt, ...paramsToSign } = params;
  
  const sortedParams = Object.entries(paramsToSign)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => [key, String(value ?? '')]);

  const stringToSign = sortedParams
    .map(([_, value]) => value)
    .join('') + TINKOFF_PASSWORD;

  return crypto.createHash('sha256').update(stringToSign).digest('hex');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, orderId, description, email, phone } = req.body as TinkoffPaymentRequest;

    // Валидация входящих данных
    if (!amount || !orderId || !description || !email || !phone) {
      return res.status(400).json({ 
        Success: false,
        ErrorCode: 'VALIDATION_ERROR',
        Message: 'Не все обязательные поля заполнены' 
      });
    }

    // Формируем данные для чека
    const receipt: Receipt = {
      Email: email,
      Phone: phone.replace(/\D/g, ''),
      Taxation: 'osn',
      Items: [{
        Name: description.substring(0, 100),
        Price: Math.round(amount * 100),
        Quantity: 1,
        Amount: Math.round(amount * 100),
        Tax: 'none',
        PaymentMethod: 'full_prepayment',
        PaymentObject: 'service'
      }]
    };

    // Подготавливаем данные для отправки в Tinkoff
    const paymentData = {
      TerminalKey: TINKOFF_TERMINAL_KEY,
      Amount: Math.round(amount * 100),
      OrderId: orderId,
      Description: description.substring(0, 250),
      DATA: JSON.stringify({ 
        Email: email, 
        Phone: phone 
      }),
      SuccessURL: `${req.headers.origin}/payment/success?orderId=${orderId}`,
      FailURL: `${req.headers.origin}/payment/failure?orderId=${orderId}`,
      PayType: 'O',
      Receipt: receipt
    };

    // Генерируем токен
    const token = generateTinkoffToken(paymentData);
    
    // Добавляем токен к данным
    const requestData = {
      ...paymentData,
      Token: token
    };

    // Отправляем запрос в Tinkoff
    const response = await fetch('https://securepay.tinkoff.ru/v2/Init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    const result = await response.json();
    return res.status(response.status).json(result);
  } catch (error) {
    console.error('Tinkoff payment error:', error);
    return res.status(500).json({ 
      Success: false,
      ErrorCode: 'SERVER_ERROR',
      Message: 'Внутренняя ошибка сервера',
      Details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
}