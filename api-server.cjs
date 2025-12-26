// api-server.js - Простой сервер для API endpoints без дополнительных зависимостей
const http = require('http');
const crypto = require('crypto');

const PORT = 3001;

// Конфигурация Тинькофф
const TINKOFF_CONFIG = {
  TerminalKey: '1766479140318',
  PASSWORD: 's9R^$NsmYPytIY#_',
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

  // Только POST запросы к нашему API
  if (req.method === 'POST' && req.url === '/api/payment-init') {
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

          // Подготовка данных для чека
          const receipt = email ? {
            Email: email,
            Phone: phone?.replace(/\D/g, ''),
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
          } : undefined;

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
  } else if (req.method === 'POST' && req.url === '/api/yandex/create-payment') {
    try {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const { amount, orderId, description, email, phone, apiKey } = JSON.parse(body);

          // Валидация
          if (!amount || !orderId || !description || !email || !phone || !apiKey) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: 'VALIDATION_ERROR',
              message: 'Не все обязательные поля заполнены'
            }));
            return;
          }

          // Проверка API ключа
          if (apiKey !== '19c1e757-cf1e-4789-b576-48c30474c6d8') {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: 'INVALID_API_KEY',
              message: 'Неверный API ключ'
            }));
            return;
          }

          // Создание платежа через Яндекс Пей API
          const paymentData = {
            amount: {
              value: (amount / 100).toFixed(2), // конвертируем из копеек в рубли
              currency: 'RUB'
            },
            confirmation: {
              type: 'redirect',
              return_url: `http://localhost:3000/payment/success?orderId=${orderId}`
            },
            description: description.substring(0, 250),
            metadata: {
              orderId: orderId,
              email: email,
              phone: phone
            }
          };

          // Отправляем запрос в Яндекс Пей API
          const yandexResponse = await fetch('https://payment.yandex.net/api/v3/payments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'Idempotence-Key': orderId
            },
            body: JSON.stringify(paymentData)
          });

          const result = await yandexResponse.json();
          
          if (!yandexResponse.ok) {
            console.error('Yandex Pay API error:', result);
            res.writeHead(yandexResponse.status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: result.type || 'PAYMENT_ERROR',
              message: result.description || 'Ошибка создания платежа'
            }));
            return;
          }

          // Возвращаем URL для редиректа
          const paymentUrl = result.confirmation?.confirmation_url;
          if (!paymentUrl) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: 'NO_PAYMENT_URL',
              message: 'Не получен URL для оплаты'
            }));
            return;
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            id: result.id,
            payment_url: paymentUrl,
            confirmation: {
              confirmation_url: paymentUrl
            }
          }));

        } catch (error) {
          console.error('Parse error:', error);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'PARSE_ERROR',
            message: 'Ошибка парсинга JSON'
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

server.listen(PORT, () => {
  console.log(`API сервер запущен на http://localhost:${PORT}`);
  console.log('Доступные endpoints:');
  console.log('  POST /api/payment-init - Создание платежа Тинькофф');
  console.log('  POST /api/yandex/create-payment - Создание платежа Яндекс Пей');
});
