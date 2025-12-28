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

/* ================= TINKOFF API ================= */
const tinkoffAPI = new TinkoffMerchantAPI(CONFIG.TERMINAL_KEY, CONFIG.PASSWORD);

/* ================= TOKEN (РАБОЧИЙ ВАРИАНТ) ================= */
function generateToken(data) {
  console.log('=== TOKEN GENERATION START ===');
  const copy = { ...data };
  console.log('Original keys:', Object.keys(copy));
  
  delete copy.Token;
  delete copy.Receipt; // Удаляем Receipt
  delete copy.DATA;    // Удаляем DATA (важно!)
  delete copy.SuccessURL;    // Удаляем URL поля
  delete copy.FailURL;       // Удаляем URL поля
  delete copy.NotificationURL; // Удаляем URL поля
  delete copy.Email;          // Убираем email
  delete copy.Phone;          // Убираем телефон
  
  console.log('After delete keys:', Object.keys(copy));
  
  const tokenData = {
    ...copy,
    Password: CONFIG.PASSWORD
  };
  
  console.log('Token data keys:', Object.keys(tokenData));
  
  const sortedKeys = ['Amount', 'OrderId', 'Password', 'TerminalKey'];
  console.log('Sorted keys:', sortedKeys);
  
  const tokenString = sortedKeys.map(key => {
    let value = key === 'Password' ? CONFIG.PASSWORD : tokenData[key];
    if (key === 'Amount') value = String(value); // Amount как строка
    console.log(`Key: ${key}, Value: ${value}, Type: ${typeof value}`);
    return String(value);
  }).join('');
  
  console.log('Token string:', tokenString);
  
  const token = createHash('sha256').update(tokenString).digest('hex');
  console.log('Generated token:', token);
  console.log('=== TOKEN GENERATION END ===');
  
  return token;
}

/* ================= API ================= */
app.post('/api/tinkoff-working', async (req, res) => {
  try {
    const { amount, description, orderId, fullName, email, phone } = req.body;

    if (!amount || !orderId || !description || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const amountKopeks = Math.round(Number(amount) * 100);
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanDescription = `Payment for tour`.substring(0, 250);

    /* ===== RECEIPT (НЕ УЧАСТВУЕТ В TOKEN) ===== */
    const receipt = {
      Email: email,
      Phone: cleanPhone,
      Taxation: 'usn_income',
      FfdVersion: '1.05',
      Items: [
        {
          Name: cleanDescription.substring(0, 128),
          Price: amountKopeks,
          Quantity: 1,
          Amount: amountKopeks,
          Tax: 'none',
          PaymentMethod: 'full_prepayment',
          PaymentObject: 'service',
        },
      ],
    };

    /* ===== PAYMENT DATA ===== */
    const paymentData = {
      TerminalKey: CONFIG.TERMINAL_KEY,
      Amount: amountKopeks,
      OrderId: String(orderId),
      Description: cleanDescription,
      CustomerKey: email,
      Email: email,
      Phone: cleanPhone,

      // эти поля НЕ участвуют в Token
      Receipt: receipt,
      SuccessURL: `https://ekskyrsiadima.ru/ticket?success=true&orderId=${orderId}`,
      FailURL: 'https://ekskyrsiadima.ru/payment-error',
      NotificationURL:
        'https://nextjs-boilerplateuexkyesua.onrender.com/api/tinkoff-webhook',
    };

    /* ===== TOKEN ===== */
    paymentData.Token = generateToken(paymentData);

    console.log('=== ПОЛНЫЙ ЗАПРОС В ТИНЬКОФФ ===');
    console.log('=== ИСПОЛЬЗУЕМ БИБЛИОТЕКУ ТИНЬКОФФ ===');
    console.log('REQUEST DATA:', JSON.stringify(paymentData, null, 2));

    try {
      // МИНИМАЛЬНЫЙ ЗАПРОС БЕЗ RECEIPT
      const result = await tinkoffAPI.init({
        Amount: paymentData.Amount,
        OrderId: paymentData.OrderId,
        Description: paymentData.Description,
        CustomerKey: paymentData.CustomerKey,
      });

      console.log('TINKOFF LIBRARY RESPONSE:', result);
      res.status(200).json(result);

    } catch (error) {
      console.log('TINKOFF LIBRARY ERROR:', error);
      res.status(400).json({ 
        Success: false, 
        ErrorCode: 'LIBRARY_ERROR',
        Message: error.message,
        Details: 'Error using Tinkoff library'
      });
    }

  } catch (err) {
    console.error('SERVER ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= TELEGRAM ================= */
const sendWebhookToTelegram = async (webhookData) => {
  try {
    console.log('=== ОТПРАВКА ВЕБХУКА В TELEGRAM ===');
    
    const botToken = '8209677930:AAFYQhWh_a4NvzRgnBjeJTO_Af5JkxWeauE';
    const chatId = '1183482279'; // Временный личный chat_id до добавления бота в канал  
    const message = `
💰 УВЕДОМЛЕНИЕ ОБ ОПЛАТЕ ТИНЬКОФФ

📋 ДАННЫЕ ПЛАТЕЖА:
ID платежа: ${webhookData.PaymentId || 'Не указано'}
ID заказа: ${webhookData.OrderId || 'Не указано'}
Сумма: ${webhookData.Amount ? (webhookData.Amount / 100).toFixed(2) : '0'} ₽
Статус: ${webhookData.Status || 'Не указано'}

👤 КЛИЕНТ:
Email: ${webhookData.Email || 'Не указано'}
Телефон: ${webhookData.Phone || 'Не указано'}

📝 ОПИСАНИЕ: ${webhookData.Description || 'Не указано'}

⏰ Время: ${new Date().toLocaleString('ru-RU')}
🔗 Канал: https://t.me/agenDima
    `.trim();

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const result = await response.json();
    console.log('Ответ Telegram:', result);

    if (response.ok && result.ok) {
      console.log('✅ Вебхок успешно отправлен в Telegram');
    } else {
      console.error('❌ Ошибка отправки в Telegram:', result);
    }

  } catch (error) {
    console.error('❌ Ошибка отправки в Telegram:', error);
  }
};

/* ================= WEBHOOK ================= */
app.post('/api/tinkoff-webhook', async (req, res) => {
  try {
    console.log('=== TINKOFF WEBHOOK RECEIVED ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    // Проверка токена вебхука
    const { Token, ...webhookData } = req.body;
    if (Token) {
      const expectedToken = generateToken(webhookData);
      console.log('Webhook token:', Token);
      console.log('Expected token:', expectedToken);
      
      if (Token !== expectedToken) {
        console.log('❌ Invalid webhook token');
        return res.status(400).send('Invalid token');
      }
    }
    
    // Обработка уведомления
    if (req.body.Status === 'CONFIRMED' || req.body.Status === 'AUTHORIZED') {
      console.log('✅ Payment confirmed:', req.body.PaymentId);
      await sendWebhookToTelegram(req.body);
    } else if (req.body.Status === 'REJECTED' || req.body.Status === 'CANCELED') {
      console.log('❌ Payment rejected:', req.body.PaymentId);
      await sendWebhookToTelegram(req.body);
    } else {
      console.log('ℹ️ Payment status:', req.body.Status);
      await sendWebhookToTelegram(req.body);
    }
    
    // Ответ Тинькофф что вебхок принят
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

/* ================= TOURS AND SCHEDULES FROM FIREBASE ================= */
// Получаем туры из Firebase (как в админке)
const getToursFromFirebase = async () => {
  try {
    const toursRef = ref(database, 'tours');
    const snapshot = await get(toursRef);
    
    if (snapshot.exists()) {
      const tours = snapshot.val();
      return Object.values(tours).map(tour => ({
        ...tour,
        id: tour.id || Object.keys(tours).find(key => tours[key] === tour)
      }));
    }
    return [];
  } catch (error) {
    console.error('Ошибка получения туров из Firebase:', error);
    return [];
  }
};

// Получаем расписания из Firebase (как в админке)
const getSchedulesFromFirebase = async () => {
  try {
    const schedulesRef = ref(database, 'schedules');
    const snapshot = await get(schedulesRef);
    
    if (snapshot.exists()) {
      const schedules = snapshot.val();
      return Object.values(schedules).map(schedule => ({
        ...schedule,
        id: schedule.id || Object.keys(schedules).find(key => schedules[key] === schedule)
      }));
    }
    return [];
  } catch (error) {
    console.error('Ошибка получения расписаний из Firebase:', error);
    return [];
  }
};

// API для получения всех туров (как в админке)
app.get('/api/tours', async (req, res) => {
  try {
    console.log('Получение списка туров из Firebase');
    const tours = await getToursFromFirebase();
    console.log(`Получено туров: ${tours.length}`);
    res.json(tours);
  } catch (error) {
    console.error('Ошибка получения туров:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// API для получения расписаний тура (как в админке)
app.get('/api/tour-schedules/:tourId', async (req, res) => {
  try {
    const { tourId } = req.params;
    console.log(`Получение расписаний для тура: ${tourId}`);
    
    // Получаем расписания из Firebase
    const schedules = await getSchedulesFromFirebase();
    
    // Фильтруем расписания для конкретного тура
    const tourSchedules = schedules.filter(schedule => schedule.tourId === tourId);
    
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
    
    // Находим расписание в Firebase
    const schedules = await getSchedulesFromFirebase();
    const schedule = schedules.find(s => s.id === scheduleId);
    
    if (!schedule) {
      return res.status(404).json({ error: 'Расписание не найдено' });
    }
    
    // Проверяем доступность мест
    const currentAvailableSpots = schedule.maxSpots - (schedule.bookedSpots || 0);
    if (currentAvailableSpots < numberOfPeople) {
      return res.status(400).json({ 
        error: 'Недостаточно мест',
        availableSpots: currentAvailableSpots 
      });
    }
    
    // Обновляем количество забронированных мест в Firebase
    const scheduleRef = ref(database, `schedules/${scheduleId}`);
    const updatedBookedSpots = (schedule.bookedSpots || 0) + numberOfPeople;
    
    await update(scheduleRef, {
      bookedSpots: updatedBookedSpots,
      availableSpots: schedule.maxSpots - updatedBookedSpots
    });
    
    console.log(`Забронировано ${numberOfPeople} мест для расписания ${scheduleId}. Всего забронировано: ${updatedBookedSpots}`);
    
    res.json({
      success: true,
      scheduleId: scheduleId,
      bookedSlots: numberOfPeople,
      availableSpots: schedule.maxSpots - updatedBookedSpots,
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
    
    const { fullName, email, phone, tourTitle, tourDate, tourTime, numberOfPeople, selectedTariff, finalPrice, paymentId, paymentMethod } = req.body;
    
    const message = `
🎫 НОВЫЙ ЗАКАЗ ЭКСКУРСИИ

👤 КЛИЕНТ:
ФИО: ${fullName || 'Не указано'}
Телефон: ${phone || 'Не указано'}
Email: ${email || 'Не указано'}

📍 ЭКСКУРСИЯ:
Название: ${tourTitle || 'Не указано'}
Дата: ${tourDate || 'Не указано'}
Время: ${tourTime || 'Не указано'}
Количество человек: ${numberOfPeople || 1}
Тариф: ${selectedTariff || 'standard'}

💰 ОПЛАТА:
Стоимость: ${finalPrice || 0} ₽
Способ: ${paymentMethod || 'Не указано'}
ID платежа: ${paymentId || 'Не указано'}

⏰ Время: ${new Date().toLocaleString('ru-RU')}
🔗 Канал: https://t.me/agenDima
    `.trim();

    const botToken = '8209677930:AAFYQhWh_a4NvzRgnBjeJTO_Af5JkxWeauE';
    const chatId = '1183482279'; // Личный чат с ботом
    
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const result = await response.json();
    console.log('Ответ Telegram:', result);

    if (response.ok && result.ok) {
      console.log('✅ Данные клиента успешно отправлены в Telegram');
      res.status(200).json({ success: true, message: 'Данные отправлены в Telegram' });
    } else {
      console.error('❌ Ошибка отправки в Telegram:', result);
      res.status(500).json({ success: false, error: 'Ошибка отправки в Telegram' });
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ================= START ================= */
app.listen(3000, () => {
  console.log('✅ Server started on port 3000');
  console.log('📡 Webhook endpoint: https://nextjs-boilerplateuexkyesua.onrender.com/api/tinkoff-webhook');
  console.log('📨 Client data endpoint: https://nextjs-boilerplateuexkyesua.onrender.com/api/send-client-data');
});
