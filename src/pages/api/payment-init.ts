// src/pages/api/payment-init.ts
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

const PASSWORD = '!BuR2jlFEFF25Hh5'; // In production, use environment variables
const TERMINAL_KEY = '1766479140271DEMO';

interface PaymentData {
  TerminalKey: string;
  Amount: number;
  OrderId: string;
  Description: string;
  CustomerKey: string;
  SuccessURL: string;
  FailURL: string;
  NotificationURL: string;
  PayType: string;
  Email?: string;
  Phone?: string;
}

type TinkoffInitRequest = Omit<PaymentData, 'PayType' | 'Email' | 'Phone'> & {
  email?: string;
  phone?: string;
};

function generateTinkoffToken(params: Record<string, any>): string {
  // 1. Remove Token and Receipt from parameters
  const { Token, Receipt, ...paramsToSign } = params;
  
  // 2. Convert all values to strings and sort by key
  const sortedParams = Object.entries(paramsToSign)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => [key, String(value ?? '')]);

  // 3. Create string to sign (only values, concatenated)
  const stringToSign = sortedParams
    .map(([_, value]) => value)
    .join('') + PASSWORD;

  console.log('String to sign:', stringToSign);

  // 4. Generate SHA-256 hash
  return crypto
    .createHash('sha256')
    .update(stringToSign)
    .digest('hex');
}

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
      TerminalKey = TERMINAL_KEY,
      Amount,
      OrderId,
      Description,
      CustomerKey,
      SuccessURL,
      FailURL,
      NotificationURL,
      email,
      phone,
    } = req.body as TinkoffInitRequest;

    if (!Amount || !OrderId || !Description || !CustomerKey) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['Amount', 'OrderId', 'Description', 'CustomerKey']
      });
    }

    // 1. Prepare base payment data (without Receipt)
    const paymentData: PaymentData = {
      TerminalKey,
      Amount,
      OrderId,
      Description,
      CustomerKey,
      SuccessURL: SuccessURL || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/success`,
      FailURL: FailURL || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/failure`,
      NotificationURL: NotificationURL || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payment/notification`,
      PayType: 'O', // Two-stage payment
      ...(email && { Email: email }),
      ...(phone && { Phone: phone.replace(/\D/g, '') })
    };
    
    console.log('Prepared payment data:', JSON.stringify(paymentData, null, 2));

    // 3. Generate token (without Receipt)
    const token = generateTinkoffToken(paymentData);
    
    // 4. Add token to payment data
    const paymentDataWithToken = {
      ...paymentData,
      Token: token,
    };

    console.log('Sending to Tinkoff:', JSON.stringify(paymentDataWithToken, null, 2));

    // 5. Call Tinkoff Init API
    const tinkoffResponse = await fetch('https://securepay.tinkoff.ru/v2/Init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentDataWithToken),
    });

    const result = await tinkoffResponse.json();
    console.log('Tinkoff response:', JSON.stringify(result, null, 2));

    if (!tinkoffResponse.ok) {
      throw new Error(`Tinkoff API error: ${result.Message || tinkoffResponse.statusText}`);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in /api/payment-init:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
