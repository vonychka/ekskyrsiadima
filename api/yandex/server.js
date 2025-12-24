// Простой Node.js сервер для Яндекс Пей API
const http = require('http');

const PORT = process.env.PORT || 3002;

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
  if (req.method === 'POST' && req.url === '/api/yandex/create-payment') {
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

          // Данные для заказа Яндекс Пей
          const orderData = {
            orderId: orderId,
            cart: {
              items: [{
                productId: `tour-${Date.now()}`,
                title: description.substring(0, 2048),
                quantity: {
                  count: "1"
                },
                total: (amount / 100).toFixed(2),
                receipt: {
                  tax: 1, // Без НДС
                  paymentMethodType: 1, // Полная предварительная оплата
                  paymentSubjectType: 4 // Услуга
                }
              }],
              total: {
                amount: (amount / 100).toFixed(2)
              }
            },
            currencyCode: "RUB",
            redirectUrls: {
              onSuccess: `https://ekskyrsiadima.ru/payment/success?orderId=${orderId}`,
              onError: `https://ekskyrsiadima.ru/payment/error?orderId=${orderId}`
            },
            metadata: {
              email: email,
              phone: phone,
              description: description
            }
          };

          // Отправляем запрос в Яндекс Пей API
          const yandexResponse = await fetch('https://pay.yandex.ru/api/merchant/v1/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'Idempotence-Key': orderId
            },
            body: JSON.stringify(orderData)
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

          // Возвращаем успешный ответ
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'success',
            data: {
              paymentUrl: result.data?.paymentUrl,
              orderId: result.data?.orderId || orderId
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
  console.log(`Yandex Pay API сервер запущен на порту ${PORT}`);
  console.log('Доступные endpoints:');
  console.log('  POST /api/yandex/create-payment - Создание платежа Яндекс Пей');
});
