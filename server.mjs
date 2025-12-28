import express from 'express';
import cors from 'cors';
import { createHash } from 'crypto';
import TinkoffMerchantAPI from 'tinkoff-merchant-api';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, update } from 'firebase/database';

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

/* ================= FIREBASE ================= */
const firebaseConfig = {
  databaseURL: "https://exursional-default-rtdb.firebaseio.com/"
};

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

/* ================= TOKEN GENERATION ================= */
const generateToken = (data) => {
  console.log('=== TOKEN GENERATION START ===');
  
  // Create a copy of data and remove Receipt, DATA, and Token
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
      Token: generateToken(req.body)
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

/* ================= TOUR SCHEDULES (LOCAL STORAGE) ================= */
// Локальное хранилище расписаний (без Firebase)
let localSchedules = [
  {
    id: 's1',
    tourId: '1',
    date: '2025-12-28',
    time: '10:00',
    availableSpots: 20,
    maxSpots: 20,
    bookedSpots: 0
  },
  {
    id: 's2',
    tourId: '1',
    date: '2025-12-28',
    time: '14:00',
    availableSpots: 20,
    maxSpots: 20,
    bookedSpots: 0
  },
  {
    id: 's3',
    tourId: '1',
    date: '2025-12-29',
    time: '10:00',
    availableSpots: 20,
    maxSpots: 20,
    bookedSpots: 0
  },
  {
    id: 's4',
    tourId: '2',
    date: '2025-12-28',
    time: '18:00',
    availableSpots: 15,
    maxSpots: 15,
    bookedSpots: 0
  },
  {
    id: 's5',
    tourId: '3',
    date: '2025-12-28',
    time: '11:00',
    availableSpots: 25,
    maxSpots: 25,
    bookedSpots: 0
  }
];

// Получаем расписания из Firebase админки
const getAdminSchedules = async () => {
  try {
    console.log('Получение расписаний из Firebase админки...');
    const schedulesRef = ref(database, 'schedules');
    const snapshot = await get(schedulesRef);
    
    if (snapshot.exists()) {
      const schedules = snapshot.val();
      const schedulesArray = Object.values(schedules).map(schedule => ({
        ...schedule,
        id: Object.keys(schedules).find(key => schedules[key] === schedule)
      }));
      console.log(`Найдено расписаний в админке: ${schedulesArray.length}`);
      return schedulesArray;
    } else {
      console.log('Расписания в админке не найдены, используем локальные');
      return localSchedules;
    }
  } catch (error) {
    console.error('Ошибка получения расписаний из Firebase:', error);
    console.log('Используем локальные расписания как fallback');
    return localSchedules;
  }
};

app.get('/api/tour-schedules/:tourId', async (req, res) => {
  try {
    const { tourId } = req.params;
    console.log(`Получение расписаний для тура: ${tourId}`);
    
    // Получаем локальные расписания
    const adminSchedules = await getAdminSchedules();
    
    // Фильтруем расписания для конкретного тура
    const tourSchedules = adminSchedules.filter(schedule => schedule.tourId === tourId);
    
    // Фильтруем прошедшие даты
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const upcomingSchedules = tourSchedules.filter(schedule => {
      const scheduleDate = schedule.date;
      const scheduleTime = schedule.time.split(':');
      const scheduleHour = parseInt(scheduleTime[0]);
      const scheduleMinute = parseInt(scheduleTime[1]);
      
      if (scheduleDate > today) return true;
      if (scheduleDate === today) {
        return (scheduleHour > currentHour) || 
               (scheduleHour === currentHour && scheduleMinute > currentMinute);
      }
      return false;
    });
    
    console.log(`Найдено расписаний для тура ${tourId}:`, upcomingSchedules.length);
    res.json(upcomingSchedules);
    
  } catch (error) {
    console.error('Ошибка получения расписаний:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/book-schedule', async (req, res) => {
  try {
    const { scheduleId, numberOfPeople } = req.body;
    
    if (!scheduleId || !numberOfPeople || numberOfPeople <= 0) {
      return res.status(400).json({ error: 'Неверные данные' });
    }
    
    console.log(`Попытка бронирования ${numberOfPeople} мест для расписания ${scheduleId}`);
    
    // Получаем расписания из Firebase админки
    const adminSchedules = await getAdminSchedules();
    const schedule = adminSchedules.find(s => s.id === scheduleId);
    
    if (!schedule) {
      return res.status(404).json({ error: 'Расписание не найдено' });
    }
    
    if (schedule.availableSpots < numberOfPeople) {
      return res.status(400).json({ 
        error: 'Недостаточно мест',
        availableSpots: schedule.availableSpots 
      });
    }
    
    // Обновляем расписание в Firebase
    const updatedSchedule = {
      ...schedule,
      availableSpots: schedule.availableSpots - numberOfPeople,
      bookedSpots: (schedule.bookedSpots || 0) + numberOfPeople
    };
    
    try {
      const scheduleRef = ref(database, `schedules/${scheduleId}`);
      await update(scheduleRef, {
        availableSpots: updatedSchedule.availableSpots,
        bookedSpots: updatedSchedule.bookedSpots
      });
      console.log(`Расписание ${scheduleId} обновлено в Firebase`);
    } catch (firebaseError) {
      console.error('Ошибка обновления в Firebase:', firebaseError);
      // Обновляем локально как fallback
      const scheduleIndex = localSchedules.findIndex(s => s.id === scheduleId);
      if (scheduleIndex !== -1) {
        localSchedules[scheduleIndex].availableSpots = updatedSchedule.availableSpots;
        localSchedules[scheduleIndex].bookedSpots = updatedSchedule.bookedSpots;
      }
    }
    
    console.log(`Забронировано ${numberOfPeople} мест для расписания ${scheduleId}. Осталось: ${updatedSchedule.availableSpots}`);
    
    res.json({
      success: true,
      scheduleId: scheduleId,
      bookedSlots: numberOfPeople,
      availableSpots: updatedSchedule.availableSpots,
      maxSpots: schedule.maxSpots,
      source: 'firebase'
    });
  } catch (error) {
    console.error('Ошибка бронирования расписания:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

/* ================= CLIENT DATA ================= */
app.post('/api/send-client-data', async (req, res) => {
  try {
    console.log('=== ОТПРАВКА ДАННЫХ КЛИЕНТА В TELEGRAM ===');
    console.log('Client data:', req.body);
    
    const { fullName, phone, email, tourTitle, tourDate, tourTime, numberOfPeople, selectedTariff, finalPrice, paymentId, paymentMethod } = req.body;
    
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

/* ================= TOURS API ================= */
app.get('/api/tours', async (req, res) => {
  try {
    console.log('Получение списка туров');
    
    // Получаем туры из Firebase
    const toursRef = ref(database, 'tours');
    const snapshot = await get(toursRef);
    
    if (snapshot.exists()) {
      const tours = snapshot.val();
      const toursArray = Object.values(tours).map(tour => ({
        ...tour,
        id: Object.keys(tours).find(key => tours[key] === tour)
      }));
      console.log(`Найдено туров: ${toursArray.length}`);
      res.json(toursArray);
    } else {
      console.log('Туры не найдены, возвращаем пустой массив');
      res.json([]);
    }
  } catch (error) {
    console.error('Ошибка получения туров:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
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

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
  console.log(`📡 Webhook endpoint: https://nextjs-boilerplateuexkyesua.onrender.com/api/tinkoff-webhook`);
  console.log(`📨 Client data endpoint: https://nextjs-boilerplateuexkyesua.onrender.com/api/send-client-data`);
});

export default app;
