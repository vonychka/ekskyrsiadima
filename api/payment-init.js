// api/payment-init.js - Vercel serverless функция для Тинькофф API
const crypto = require('crypto');

// Конфигурация Тинькофф
const TINKOFF_CONFIG = {
  TERMINAL_KEY: process.env.TINKOFF_TERMINAL_KEY || '1766479140271DEMO',
  PASSWORD: process.env.TINKOFF_PASSWORD || '!BuR2jlFEFF25Hh5',
  API_URL: 'https://securepay.tinkoff.ru/v2'
};

// Генерация токена для Тинькофф
function generateTinkoffToken(params) {
  const { Token, Receipt, ...paramsToSign } = params;
  
  // Сортируем по алфавиту и конвертируем в строки
  const sortedParams = Object.entries(paramsToSign)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .reduce((acc, [key, value]) => {
      acc[key] = String(value ?? '');
      return acc;
    }, {});

  // Создаем строку для подписи (значения в алфавитном порядке ключей)
  const stringToSign = Object.values(sortedParams).join('') + TINKOFF_CONFIG.PASSWORD;

  console.log('String to sign:', stringToSign);

  return crypto
    .createHash('sha256')
    .update(stringToSign)
    .digest('hex');
}

// Основной handler для Vercel serverless функции
module.exports = async (req, res) => {
  try {
    // Установка CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    // Обработка OPTIONS запросов
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Только POST запросы
    if (req.method !== 'POST') {
      res.status(405).json({
        error: 'METHOD_NOT_ALLOWED',
        message: 'Only POST requests are allowed'
      });
      return;
    }

    // Парсим тело запроса
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { amount, orderId, description, email, phone, customerKey } = JSON.parse(body);

        // Валидация
        if (!amount || !orderId || !description) {
          res.status(400).json({
            error: 'VALIDATION_ERROR',
            message: 'Отсутствуют обязательные параметры: amount, orderId, description'
          });
          return;
        }

        console.log('Received payment request:', { amount, orderId, description, email, phone, customerKey });

        // Подготовка базовых данных для запроса
        const paymentData = {
          TerminalKey: TINKOFF_CONFIG.TERMINAL_KEY,
          Amount: Math.round(amount * 100),
          OrderId: orderId,
          Description: description.substring(0, 250),
          PayType: 'O',
          CustomerKey: customerKey || orderId
        };

        console.log('Payment data for token:', paymentData);

        // Генерируем токен
        const token = generateTinkoffToken(paymentData);
        
        // Добавляем токен и остальные поля
        const requestData = {
          ...paymentData,
          Token: token,
          ...(email && { Email: email }),
          ...(phone && { Phone: phone.replace(/\D/g, '') })
        };

        console.log('Final request data:', JSON.stringify(requestData, null, 2));

        // Отправляем запрос в Тинькофф
        const tinkoffResponse = await fetch(`${TINKOFF_CONFIG.API_URL}/Init`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        });

        const result = await tinkoffResponse.json();
        console.log('Tinkoff response:', JSON.stringify(result, null, 2));

        if (!tinkoffResponse.ok) {
          throw new Error(`Tinkoff API error: ${result.Message || tinkoffResponse.statusText}`);
        }

        res.status(200).json(result);

      } catch (error) {
        console.error('Tinkoff payment error:', error);
        res.status(500).json({
          error: 'SERVER_ERROR',
          message: error.message || 'Внутренняя ошибка сервера'
        });
      }
    });

  } catch (error) {
    console.error('Request error:', error);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: error.message || 'Внутренняя ошибка сервера'
    });
  }
};