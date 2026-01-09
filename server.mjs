import express from 'express';
import cors from 'cors';
import { createHash } from 'crypto';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, update, remove } from 'firebase/database';

const app = express();

/* ================= CORS ================= */
app.use(cors({
  origin: [
    'https://ekskyrsiadima.ru', 
    'https://ekskyrsiadima.ru/*', 
    'https://cv91330.tw1.ru', 
    'https://cv91330.tw1.ru/*',
    'http://cv91330.tw1.ru',
    'http://cv91330.tw1.ru/*',
    'http://localhost:3000', 
    'http://localhost:5173'
  ],
  methods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'User-Agent', 'Accept'],
  credentials: true
}));

// Additional CORS handling for mobile devices
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, User-Agent');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

/* ================= STATIC FILES & MIME TYPES ================= */
// Serve static files with proper MIME types
app.use(express.static('.', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    }
  }
}));

/* ================= CONFIG ================= */
const CONFIG = {
  TERMINAL_KEY: '1766479140318', // Рабочий терминал (подтвержден поддержкой)
  PASSWORD: 's9R^$NsmYPytIY#_',   // Рабочий пароль (подтвержден поддержкой)
  API_URL: 'https://securepay.tinkoff.ru/v2',
};

/* ================= FIREBASE CONFIG ================= */
const firebaseConfig = {
  apiKey: "AIzaSyBE-bcqM7DM_zV8xivFKKbrSAHifIWYgps",
  authDomain: "exursional.firebaseapp.com",
  databaseURL: "https://exursional-default-rtdb.firebaseio.com",
  projectId: "exursional",
  storageBucket: "exursional.firebasestorage.app",
  messagingSenderId: "770008017138",
  appId: "1:770008017138:web:23909355289d478208c86b"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

/* ================= TOKEN GENERATION - TINKOFF SUPPORT RULES ================= */
const generateToken = (data) => {
  console.log('=== CORRECT TINKOFF TOKEN GENERATION (SUPPORT RESPONSE) ===');
  
  // ШАГ 1: Используем ВСЕ параметры запроса, кроме Receipt и DATA
  const tokenData = { ...data };
  delete tokenData.Receipt;
  delete tokenData.DATA;
  delete tokenData.Token; // Убираем старый токен если есть
  // Добавляем Password для генерации токена
  tokenData.Password = CONFIG.PASSWORD;
  
  console.log('Token data (ALL parameters except Receipt/DATA):', tokenData);
  
  // ШАГ 2: Сортируем по алфавиту по ключу
  const sortedKeys = Object.keys(tokenData).sort();
  console.log('Sorted keys:', sortedKeys);
  
  // ШАГ 3: Конкатенируем только значения в одну строку
  let tokenString = '';
  sortedKeys.forEach(key => {
    const value = String(tokenData[key]);
    console.log(`Key: ${key}, Value: ${value}`);
    tokenString += value;
  });
  
  console.log('Token string (concatenated values):', tokenString);
  
  // ШАГ 4: Применяем SHA-256 с поддержкой UTF-8
  const token = createHash('sha256').update(tokenString, 'utf8').digest('hex');
  console.log('Generated token (SHA-256):', token);
  console.log('=== TOKEN GENERATION COMPLETE ===');
  
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
      TerminalKey: CONFIG.TERMINAL_KEY,
      Amount: Math.round(Number(req.body.amount) * 100), // Convert to kopecks
      OrderId: String(req.body.orderId), // Убедимся что OrderId это строка
      Description: req.body.description,
      CustomerKey: req.body.customerKey
      // ❌ УБРАЛИ Email и Phone из корневых параметров по требованию поддержки
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

    // Add DATA with customer information (Email и Phone только здесь по требованию поддержки)
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

    // Используем унифицированную функцию генерации токена
    requestData.Token = generateToken(requestData);
    
    console.log('Final request data:', JSON.stringify(requestData, null, 2));
    
    // Прямой запрос к API Тинькофф
    const response = await fetch(`${CONFIG.API_URL}/Init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });
    
    const result = await response.json();
    console.log('Tinkoff response:', result);

    if (result.Success) {
      res.json({
        success: true,
        paymentUrl: result.PaymentURL,
        paymentId: result.PaymentId,
        orderId: result.OrderId
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.Details || 'Ошибка при инициализации платежа'
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

/* ================= HANDLE SUCCESSFUL PAYMENT ================= */
const handleSuccessfulPayment = async (paymentData) => {
  try {
    console.log('=== HANDLING SUCCESSFUL PAYMENT ===');
    console.log('Payment data:', paymentData);
    
    // Извлекаем данные из платежа
    const { OrderId, Description } = paymentData;
    
    // Ищем заказ в базе данных или используем данные из описания
    // Предполагаем что в описании есть информация о туре и количестве мест
    // Format: "Бронирование: tourId=xxx, seats=xx, scheduleId=xxx"
    let tourId = null;
    let numberOfPeople = 1;
    let scheduleId = null;
    
    if (Description && Description.includes('tourId=')) {
      const tourMatch = Description.match(/tourId=([^,]+)/);
      const seatsMatch = Description.match(/seats=([^,]+)/);
      const scheduleMatch = Description.match(/scheduleId=([^,]+)/);
      
      if (tourMatch) tourId = tourMatch[1];
      if (seatsMatch) numberOfPeople = parseInt(seatsMatch[1]);
      if (scheduleMatch) scheduleId = scheduleMatch[1];
    }
    
    console.log(`Processing booking: tourId=${tourId}, seats=${numberOfPeople}, scheduleId=${scheduleId}`);
    
    if (!tourId) {
      console.log('No tourId found in payment description');
      return;
    }
    
    // Уменьшаем места в расписании если указано
    if (scheduleId) {
      const scheduleRef = ref(database, `schedules/${scheduleId}`);
      const scheduleSnapshot = await get(scheduleRef);
      
      if (scheduleSnapshot.exists()) {
        const schedule = scheduleSnapshot.val();
        const currentAvailableSpots = schedule.availableSpots || 0;
        const newAvailableSpots = Math.max(0, currentAvailableSpots - numberOfPeople);
        
        await update(scheduleRef, {
          availableSpots: newAvailableSpots,
          updatedAt: new Date().toISOString()
        });
        
        console.log(`Updated schedule ${scheduleId} availableSpots: ${currentAvailableSpots} -> ${newAvailableSpots}`);
      } else {
        console.log(`Schedule ${scheduleId} not found`);
      }
    } else {
      // Уменьшаем maxGroupSize для тура если нет расписания
      const tourRef = ref(database, `tours/${tourId}`);
      const tourSnapshot = await get(tourRef);
      
      if (tourSnapshot.exists()) {
        const tour = tourSnapshot.val();
        const currentMaxGroupSize = tour.maxGroupSize || 10;
        const newMaxGroupSize = Math.max(0, currentMaxGroupSize - numberOfPeople);
        
        await update(tourRef, {
          maxGroupSize: newMaxGroupSize,
          updatedAt: new Date().toISOString()
        });
        
        console.log(`Updated tour ${tourId} maxGroupSize: ${currentMaxGroupSize} -> ${newMaxGroupSize}`);
      } else {
        console.log(`Tour ${tourId} not found`);
      }
    }
    
    console.log('=== PAYMENT BOOKING HANDLED SUCCESSFULLY ===');
    
  } catch (error) {
    console.error('Error in handleSuccessfulPayment:', error);
    throw error;
  }
};

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
      
      // Уменьшаем количество мест после успешной оплаты
      try {
        await handleSuccessfulPayment(req.body);
      } catch (bookingError) {
        console.error('Error handling booking after payment:', bookingError);
      }
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
    console.log('Отправка сообщения в Telegram...');
    console.log('Bot token: 7994136906:AAH2K4U8WqZ8YH9gKf8xLq3vS7rT2mK4Y');
    console.log('Chat ID: 1183482279');
    console.log('Message length:', message.length);
    
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

/* ================= SCHEDULES API ================= */
app.get('/api/schedules', async (req, res) => {
  try {
    console.log('=== GET /api/schedules ===');
    
    // Проверяем инициализацию Firebase
    if (!database) {
      console.error('Firebase database not initialized');
      return res.status(500).json({ error: 'База данных не инициализирована' });
    }
    
    const schedulesRef = ref(database, 'schedules');
    console.log('Fetching schedules from Firebase...');
    
    const snapshot = await get(schedulesRef);
    
    if (snapshot.exists()) {
      const schedules = snapshot.val();
      const schedulesArray = Object.entries(schedules).map(([id, data]) => ({
        id,
        ...data
      }));
      console.log(`Found ${schedulesArray.length} schedules`);
      res.json(schedulesArray);
    } else {
      console.log('No schedules found in database');
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching schedules:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Ошибка при загрузке расписаний',
      details: error.message 
    });
  }
});

/* ================= BOOKINGS API ================= */
app.post('/api/bookings', async (req, res) => {
  try {
    console.log('=== POST /api/bookings ===');
    console.log('Request body:', req.body);
    
    // Проверяем инициализацию Firebase
    if (!database) {
      console.error('Firebase database not initialized');
      return res.status(500).json({ error: 'База данных не инициализирована' });
    }
    
    const { tourId, numberOfPeople } = req.body;
    
    if (!tourId || !numberOfPeople) {
      return res.status(400).json({ error: 'Отсутствуют обязательные поля' });
    }
    
    // Получаем информацию о туре
    const tourRef = ref(database, `tours/${tourId}`);
    const tourSnapshot = await get(tourRef);
    
    if (!tourSnapshot.exists()) {
      return res.status(404).json({ error: 'Экскурсия не найдена' });
    }
    
    const tour = tourSnapshot.val();
    const currentMaxGroupSize = tour.maxGroupSize || 10;
    const newMaxGroupSize = Math.max(0, currentMaxGroupSize - numberOfPeople);
    
    // Обновляем максимальный размер группы
    await update(tourRef, { 
      maxGroupSize: newMaxGroupSize,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`Updated tour ${tourId} maxGroupSize: ${currentMaxGroupSize} -> ${newMaxGroupSize}`);
    
    res.json({ 
      success: true, 
      message: `Забронировано ${numberOfPeople} место(а)`,
      availableSpots: newMaxGroupSize,
      tourId: tourId
    });
    
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Ошибка при бронировании' });
  }
});

app.post('/api/bookings/schedule', async (req, res) => {
  try {
    console.log('=== POST /api/bookings/schedule ===');
    console.log('Request body:', req.body);
    
    const { scheduleId, numberOfPeople } = req.body;
    
    if (!scheduleId || !numberOfPeople) {
      return res.status(400).json({ error: 'Отсутствуют обязательные поля' });
    }
    
    // Получаем информацию о расписании
    const scheduleRef = ref(database, `schedules/${scheduleId}`);
    const scheduleSnapshot = await get(scheduleRef);
    
    if (!scheduleSnapshot.exists()) {
      return res.status(404).json({ error: 'Расписание не найдено' });
    }
    
    const schedule = scheduleSnapshot.val();
    const currentAvailableSpots = schedule.availableSpots || 0;
    
    if (currentAvailableSpots < numberOfPeople) {
      return res.status(400).json({ error: `Недостаточно свободных мест. Доступно: ${currentAvailableSpots}` });
    }
    
    const newAvailableSpots = currentAvailableSpots - numberOfPeople;
    
    // Обновляем количество доступных мест
    await update(scheduleRef, { 
      availableSpots: newAvailableSpots,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`Updated schedule ${scheduleId} availableSpots: ${currentAvailableSpots} -> ${newAvailableSpots}`);
    
    res.json({ 
      success: true, 
      message: `Забронировано ${numberOfPeople} место(а)`,
      availableSpots: newAvailableSpots,
      scheduleId: scheduleId
    });
    
  } catch (error) {
    console.error('Error creating schedule booking:', error);
    res.status(500).json({ error: 'Ошибка при бронировании расписания' });
  }
});

/* ================= HEALTH CHECK ================= */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/* ================= SERVER-SIDE RENDERING ROUTES ================= */
// Serve main page with server-side content
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Туристическое агентство ДИМА</title>
      <meta name="description" content="Экскурсии в Нижнем Новгороде">
      <!-- Yandex.Metrika counter -->
      <script type="text/javascript">
          (function(m,e,t,r,i,k,a){
              m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
          })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=106179717', 'ym');

          ym(106179717, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true});
      </script>
      <noscript><div><img src="https://mc.yandex.ru/watch/106179717" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
      <!-- /Yandex.Metrika counter -->
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .header { text-align: center; margin-bottom: 30px; }
        .tours { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .tour { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
        .tour h3 { color: #2563eb; margin-bottom: 10px; }
        .tour p { color: #666; line-height: 1.5; }
        .btn { background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        .btn:hover { background: #1d4ed8; }
        .loading { text-align: center; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📍 Туристическое агентство ДИМА</h1>
          <p>Лучшие экскурсии в Нижнем Новгороде</p>
          <p><strong>📞 +7 (999) 140-80-94</strong></p>
        </div>
        
        <div class="tours">
          <div class="tour">
            <h3>Прогулка с Дедом Морозом</h3>
            <p>Увлекательная экскурсия по зимнему Нижнему Новгороду с встречей с Дедом Морозом</p>
            <p><strong>Длительность:</strong> 2 часа</p>
            <p><strong>Цена:</strong> от 1500₽</p>
            <button class="btn" onclick="window.location.href='/tour/1757526403608'">Подробнее</button>
          </div>
          
          <div class="tour">
            <h3>Скоро появится</h3>
            <p>Новая интересная экскурсия уже в разработке</p>
            <p><strong>Скоро!</strong></p>
            <button class="btn" disabled>Скоро</button>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px; color: #666;">
          <p>Для полного функционала включите JavaScript</p>
          <p><a href="/admin">Административная панель</a></p>
        </div>
      </div>
      
      <script>
        // Проверяем доступность JavaScript и перенаправляем на React app если доступно
        setTimeout(function() {
          if (typeof window !== 'undefined') {
            console.log('JavaScript доступен, перенаправляем на React приложение...');
            // Можно добавить перенаправление на React app если нужно
          }
        }, 1000);
      </script>
    </body>
    </html>
  `);
});

// Tour details page
app.get('/tour/:tourId', (req, res) => {
  const tourId = req.params.tourId;
  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Экскурсия - Туристическое агентство ДИМА</title>
      <!-- Yandex.Metrika counter -->
      <script type="text/javascript">
          (function(m,e,t,r,i,k,a){
              m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
          })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=106179717', 'ym');

          ym(106179717, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true});
      </script>
      <noscript><div><img src="https://mc.yandex.ru/watch/106179717" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
      <!-- /Yandex.Metrika counter -->
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .back { margin-bottom: 20px; }
        .btn { background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; }
        .btn:hover { background: #1d4ed8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="back">
          <a href="/" class="btn">← Назад к списку экскурсий</a>
        </div>
        
        <h1>📍 Экскурсия</h1>
        <p>Информация об экскурсии ID: ${tourId}</p>
        
        <div style="margin-top: 30px;">
          <h3>Для бронирования и полной информации:</h3>
          <p>📞 Позвоните: +7 (999) 140-80-94</p>
          <p>📧 Напишите: rmok0082@gmail.com</p>
        </div>
        
        <div style="text-align: center; margin-top: 40px; color: #666;">
          <p>Для полного функционала включите JavaScript</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Admin page
app.get('/admin', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Админ панель - Туристическое агентство ДИМА</title>
      <!-- Yandex.Metrika counter -->
      <script type="text/javascript">
          (function(m,e,t,r,i,k,a){
              m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
          })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=106179717', 'ym');

          ym(106179717, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true});
      </script>
      <noscript><div><img src="https://mc.yandex.ru/watch/106179717" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
      <!-- /Yandex.Metrika counter -->
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .btn { background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; }
        .btn:hover { background: #1d4ed8; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔐 Административная панель</h1>
        <p>Для доступа к административной панели требуется JavaScript.</p>
        
        <div style="margin-top: 30px;">
          <a href="/" class="btn">← На главную</a>
        </div>
        
        <div style="margin-top: 20px; color: #666;">
          <p>Убедитесь что JavaScript включен в браузере для доступа к админ панеле.</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Ticket page
app.get('/ticket', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Билет - Туристическое агентство ДИМА</title>
      <!-- Yandex.Metrika counter -->
      <script type="text/javascript">
          (function(m,e,t,r,i,k,a){
              m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
          })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=106179717', 'ym');

          ym(106179717, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true});
      </script>
      <noscript><div><img src="https://mc.yandex.ru/watch/106179717" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
      <!-- /Yandex.Metrika counter -->
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .ticket { border: 2px dashed #2563eb; padding: 20px; margin: 20px 0; text-align: center; }
        .btn { background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; }
        .btn:hover { background: #1d4ed8; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎫 Ваш билет</h1>
        
        <div class="ticket">
          <h2>Билет на экскурсию</h2>
          <p>Спасибо за заказ!</p>
          <p>Для получения полного билета включите JavaScript</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="/" class="btn">← На главную</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
  console.log(`📡 Webhook endpoint: https://nextjs-boilerplateuexkyesua.onrender.com/api/tinkoff-webhook`);
  console.log(`📨 Client data endpoint: https://nextjs-boilerplateuexkyesua.onrender.com/api/send-client-data`);
  console.log(`🌐 Server-side rendering enabled for better mobile compatibility`);
});

export default app;
