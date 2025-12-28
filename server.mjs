import express from 'express';
import cors from 'cors';
import { createHash } from 'crypto';
import TinkoffMerchantAPI from 'tinkoff-merchant-api';

const app = express();

/* ================= CORS ================= */
app.use(cors({
  origin: ['https://ekskyrsiadima.ru', 'https://ekskyrsiadima.ru/*', 'https://cv91330.tw1.ru', 'https://cv91330.tw1.ru/*'],
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

/* ================= CONFIG ================= */
const CONFIG = {
  TERMINAL_KEY: '1766479140318', // Рабочий терминал
  PASSWORD: 's9R^$NsmYPytIY#_',   // Рабочий пароль
  API_URL: 'https://securepay.tinkoff.ru/v2',
};

/* ================= TOKEN GENERATION ================= */
const generateToken = (data) => {
  console.log('=== TOKEN GENERATION START ===');
  
  // Create a copy of data for token generation
  const tokenData = { ...data };
  delete tokenData.Receipt;
  delete tokenData.DATA;
  delete tokenData.Token;
  
  console.log('Original keys:', Object.keys(data));
  console.log('After delete keys:', Object.keys(tokenData));
  
  // Add password to token data
  tokenData.Password = CONFIG.PASSWORD;
  
  // Sort keys alphabetically
  const sortedKeys = Object.keys(tokenData).sort();
  console.log('Token data keys:', Object.keys(tokenData));
  console.log('Sorted keys:', sortedKeys);
  
  // Create token string
  let tokenString = '';
  sortedKeys.forEach(key => {
    const value = String(tokenData[key]);
    console.log(`Key: ${key}, Value: ${value}, Type: ${typeof tokenData[key]}`);
    tokenString += value;
  });
  
  console.log('Token string:', tokenString);
  
  // Generate SHA256 hash
  const token = createHash('sha256').update(tokenString).digest('hex');
  
  console.log('Generated token:', token);
  console.log('=== TOKEN GENERATION END ===');
  
  return token;
};

/* ================= TINKOFF API ================= */
app.post('/api/tinkoff-working', async (req, res) => {
  try {
    console.log('=== ПОЛНЫЙ ЗАПРОС В ТИНЬКОФФ ===');
    console.log('=== ИСПОЛЬЗУЕМ БИБЛИОТЕКУ ТИНЬКОФФ ===');
    console.log('REQUEST DATA:', req.body);

    // Валидация обязательных полей
    if (!req.body.orderId || !req.body.amount) {
      return res.status(400).json({
        success: false,
        error: 'OrderId и Amount обязательны'
      });
    }

    const requestData = {
      ...req.body,
      TerminalKey: CONFIG.TERMINAL_KEY,
      Amount: Math.round(Number(req.body.amount) * 100), // Convert to kopecks
      OrderId: String(req.body.orderId) // Убедимся что OrderId это строка
      // Библиотека TinkoffMerchantAPI сама генерирует токен
    };

    // Add Receipt for fiscal data
    requestData.Receipt = {
      Email: req.body.email,
      Phone: req.body.phone,
      Taxation: 'usn_income',
      FfdVersion: '1.05',
      Items: [{
        Name: req.body.description || 'Payment for tour',
        Price: Math.round(Number(req.body.amount) * 100), // in kopecks
        Quantity: 1,
        Amount: Math.round(Number(req.body.amount) * 100), // in kopecks
        Tax: 'none',
        PaymentMethod: 'full_prepayment',
        PaymentObject: 'service'
      }]
    };

    // Add DATA with customer information
    requestData.DATA = {
      Name: req.body.fullName,
      Email: req.body.email,
      Phone: req.body.phone
    };

    // Add success and fail URLs
    requestData.SuccessURL = `https://ekskyrsiadima.ru/ticket?success=true&orderId=${req.body.orderId}`;
    requestData.FailURL = 'https://ekskyrsiadima.ru/payment-error';
    
    // Add notification URL for webhooks
    requestData.NotificationURL = 'https://nextjs-boilerplateuexkyesua.onrender.com/api/tinkoff-webhook';

    console.log('TINKOFF LIBRARY RESPONSE:');
    
    const tinkoff = new TinkoffMerchantAPI(CONFIG.TERMINAL_KEY, CONFIG.PASSWORD);
    const response = await tinkoff.init(requestData);
    
    console.log(response);

    if (response.Success) {
      res.json({
        success: true,
        paymentUrl: response.PaymentURL,
        paymentId: response.PaymentId,
        orderId: response.OrderId
      });
    } else {
      res.status(400).json({
        success: false,
        error: response.Details || 'Ошибка при инициализации платежа'
      });
    }
  } catch (error) {
    console.error('Tinkoff API error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при обработке платежа'
    });
  }
});

/* ================= WEBHOOK ================= */
app.post('/api/tinkoff-webhook', async (req, res) => {
  try {
    console.log('=== WEBHOOK RECEIVED ===');
    console.log('Webhook body:', req.body);
    
    // Проверяем токен
    const token = generateToken(req.body);
    if (token !== req.body.Token) {
      console.error('Invalid token in webhook');
      return res.status(400).send('Invalid token');
    }
    
    console.log('Webhook token verified successfully');
    
    // Здесь можно добавить логику обработки статуса платежа
    if (req.body.Status === 'CONFIRMED') {
      console.log('Payment confirmed:', req.body.OrderId);
    }
    
    // Ответ Тинькофф что вебхок принят
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

/* ================= TOUR SCHEDULES ================= */
app.get('/api/tour-schedules/:tourId', (req, res) => {
  try {
    const { tourId } = req.params;
    console.log(`Получение расписаний для тура: ${tourId}`);
    
    // Возвращаем пустые расписания - оплата не требует наличия расписаний
    res.json([]);
  } catch (error) {
    console.error('Ошибка получения расписаний:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

/* ================= SIMPLE BOOKING ================= */
app.post('/api/book-simple', async (req, res) => {
  try {
    const { tourData } = req.body;
    console.log('Простое бронирование:', tourData);
    
    res.json({
      success: true,
      message: 'Бронирование принято'
    });
  } catch (error) {
    console.error('Ошибка бронирования:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

/* ================= CLIENT DATA ================= */
app.post('/api/send-client-data', async (req, res) => {
  try {
    console.log('=== ОТПРАВКА ДАННЫХ КЛИЕНТА В TELEGRAM ===');
    console.log('Client data:', req.body);
    
    const { fullName, phone, email, tourTitle, tourDate, tourTime, numberOfPeople, selectedTariff, finalPrice, paymentId, paymentMethod, selectedTime } = req.body;
    
    // Формируем сообщение для Telegram
    const message = `🎫 НОВЫЙ ЗАКАЗ ЭКСКУРСИИ

👤 КЛИЕНТ:
ФИО: ${fullName}
Телефон: ${phone}
Email: ${email}

📍 ЭКСКУРСИЯ:
Название: ${tourTitle}
Дата: ${tourDate}
Время: ${tourTime}
Выбранное время: ${selectedTime || 'Не указано'}
Количество человек: ${numberOfPeople}
Тариф: ${selectedTariff}

💰 ОПЛАТА:
Стоимость: ${finalPrice} ₽
Способ: ${paymentMethod}
ID платежа: ${paymentId}

⏰ Время: ${new Date().toLocaleString('ru-RU')}
🔗 Канал: https://t.me/agenDima`;

    // Отправляем в Telegram
    const telegramResponse = await fetch('https://api.telegram.org/bot7994136906:AAH2K4U8WqZ8YH9gKf8xLq3vS7rT2mK4Y/sendMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: '1183482279',
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      }),
    });

    const telegramResult = await telegramResponse.json();
    console.log('Ответ Telegram:', telegramResult);

    if (!telegramResponse.ok) {
      throw new Error(`Telegram API error: ${telegramResult.description}`);
    }

    console.log('✅ Данные клиента успешно отправлены в Telegram');
    res.json({ 
      success: true, 
      message: 'Данные клиента отправлены в Telegram',
      telegramMessageId: telegramResult.result.message_id
    });
    
  } catch (error) {
    console.error('Ошибка при отправке в Telegram:', error);
    res.status(500).json({ 
      error: 'Ошибка при отправке данных в Telegram',
      details: error.message 
    });
  }
});

/* ================= ADMIN API (WITHOUT FIREBASE) ================= */
// Получение всех туров для админки
app.get('/api/admin/tours', (req, res) => {
  const tours = [
    {
      id: '1757526403608',
      title: 'Боярская экскурсия',
      description: 'Увлекательная экскурсия по Боярке',
      duration: '2 часа',
      pricing: {
        standard: 1000,
        child: 500,
        family: 2500
      },
      image: '/boyarka.jpg'
    },
    {
      id: '1758190733023',
      title: 'Скоро появится',
      description: 'Новая экскурсия в разработке',
      duration: '3 часа',
      pricing: {
        standard: 1500,
        child: 750,
        family: 3500
      },
      image: '/coming-soon.jpg'
    }
  ];
  
  res.json(tours);
});

// Получение всех расписаний для админки (пустые)
app.get('/api/admin/schedules', (req, res) => {
  res.json([]);
});

// Создание нового расписания (заглушка)
app.post('/api/admin/schedules', (req, res) => {
  console.log('Создание расписания (заглушка):', req.body);
  res.json({
    success: true,
    id: Date.now().toString(),
    ...req.body
  });
});

// Обновление расписания (заглушка)
app.put('/api/admin/schedules/:scheduleId', (req, res) => {
  console.log('Обновление расписания (заглушка):', req.params.scheduleId, req.body);
  res.json({ success: true });
});

// Удаление расписания (заглушка)
app.delete('/api/admin/schedules/:scheduleId', (req, res) => {
  console.log('Удаление расписания (заглушка):', req.params.scheduleId);
  res.json({ success: true });
});

/* ================= SIMPLE TOURS API ================= */
app.get('/api/tours', (req, res) => {
  // Возвращаем базовые туры
  const tours = [
    {
      id: '1757526403608',
      title: 'Боярская экскурсия',
      description: 'Увлекательная экскурсия по Боярке',
      duration: '2 часа',
      pricing: {
        standard: 1000,
        child: 500,
        family: 2500
      },
      image: '/boyarka.jpg'
    },
    {
      id: '1758190733023',
      title: 'Скоро появится',
      description: 'Новая экскурсия в разработке',
      duration: '3 часа',
      pricing: {
        standard: 1500,
        child: 750,
        family: 3500
      },
      image: '/coming-soon.jpg'
    }
  ];
  
  res.json(tours);
});

/* ================= HEALTH CHECK ================= */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
  console.log(`📡 Webhook endpoint: https://nextjs-boilerplateuexkyesua.onrender.com/api/tinkoff-webhook`);
  console.log(`📨 Client data endpoint: https://nextjs-boilerplateuexkyesua.onrender.com/api/send-client-data`);
});

export default app;
