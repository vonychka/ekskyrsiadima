// server.js - Продакшн версия API сервера для хостинга
const http = require('http');
const crypto = require('crypto');
const url = require('url');

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

// Установка CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// Обработка OPTIONS запросов для CORS
function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(200);
    res.end();
    return true;
  }
  return false;
}

// Основной обработчик запросов
const server = http.createServer(async (req, res) => {
  // CORS обработка
  if (handleOptions(req, res)) return;
  setCorsHeaders(res);

  // Разбираем URL
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Только POST запросы к нашему API
  if (req.method === 'POST' && pathname === '/api/payment-init') {
    try {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          console.log('Raw body received:', body);
          const parsed = JSON.parse(body);
          console.log('Parsed body:', parsed);
          const { amount, orderId, description, email, phone, customerKey } = parsed;

          // Валидация
          if (!amount || !orderId || !description) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: 'VALIDATION_ERROR',
              message: 'Отсутствуют обязательные параметры: amount, orderId, description'
            }));
            return;
          }

          console.log('Received payment request:', { amount, orderId, description, email, phone, customerKey });

          // Подготовка базовых данных для запроса (упрощенная версия без Receipt)
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

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));

        } catch (error) {
          console.error('Tinkoff payment error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'SERVER_ERROR',
            message: error.message || 'Внутренняя ошибка сервера'
          }));
        }
      });

    } catch (error) {
      console.error('Server error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'SERVER_ERROR',
        message: 'Внутренняя ошибка сервера',
        details: error.message
      }));
    }
  } else {
    // 404 для остальных маршрутов
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'NOT_FOUND',
      message: 'Endpoint не найден'
    }));
  }
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`API сервер запущен на порту ${PORT}`);
  console.log('Доступные endpoints:');
  console.log('  POST /api/payment-init - Создание платежа Тинькофф');
});
