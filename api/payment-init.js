// api/payment-init.js - Упрощенная Vercel serverless функция для Тинькофф API
import crypto from 'crypto';

// Конфигурация Тинькофф
const TINKOFF_CONFIG = {
  TERMINAL_KEY: process.env.TINKOFF_TERMINAL_KEY || '1766479140271DEMO',
  PASSWORD: process.env.TINKOFF_PASSWORD || '!BuR2jlFEFF25Hh5',
  API_URL: 'https://securepay.tinkoff.ru/v2'
};

// Генерация токена для Тинькофф - ПРАВИЛЬНЫЙ АЛГОРИТМ
function generateTinkoffToken(params) {
  // Только эти поля в ТОЧНОМ порядке
  const tokenString = [
    params.Amount,      // число в копейках
    params.CustomerKey, // строка
    params.Description, // строка
    params.OrderId,     // строка
    params.PayType,     // 'O' или 'S'
    params.Recurrent,   // 'Y' или 'N'
    params.TerminalKey  // строка
  ].join('') + TINKOFF_CONFIG.PASSWORD;
  
  console.log('Token string:', tokenString);
  
  return crypto
    .createHash('sha256')
    .update(tokenString)
    .digest('hex');
}

// Основной handler
export default async function handler(req, res) {
  try {
    // CORS headers
    const origin = req.headers.origin;
    const allowedOrigins = ['https://ekskyrsiadima.ru', 'https://ekskyrsiadima-jhin.vercel.app'];
    
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', 'https://ekskyrsiadima.ru');
    }
    
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { amount, orderId, description, email, phone, customerKey } = req.body;

    if (!amount || !orderId || !description) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    // ТОЛЬКО МИНИМУМ данных для Тинькофф
    const paymentData = {
      TerminalKey: TINKOFF_CONFIG.TERMINAL_KEY,
      Amount: Math.round(amount * 100),
      OrderId: String(orderId),
      Description: String(description).substring(0, 250),
      CustomerKey: String(customerKey || orderId),
      PayType: 'O',
      Recurrent: 'N'
    };

    // Генерируем токен
    const token = generateTinkoffToken(paymentData);
    
    // Финальные данные - ТОЛЬКО минимум
    const requestData = {
      ...paymentData,
      Token: token
    };

    console.log('Request to Tinkoff:', JSON.stringify(requestData, null, 2));

    // Быстрый запрос с коротким таймаутом
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд

    try {
      const response = await fetch(`${TINKOFF_CONFIG.API_URL}/Init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      const result = await response.json();
      console.log('Tinkoff response:', JSON.stringify(result, null, 2));

      if (!response.ok) {
        console.error('Tinkoff API error response:', result);
        throw new Error(result.Message || result.errorMessage || 'Tinkoff API error');
      }

      res.status(200).json(result);

    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({
      error: 'Payment failed',
      message: error.message || 'Internal server error'
    });
  }
}