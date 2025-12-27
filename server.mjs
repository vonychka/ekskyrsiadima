import express from 'express';
import cors from 'cors';
import { createHash } from 'crypto';
import TinkoffMerchantAPI from 'tinkoff-merchant-api';

const app = express();

/* ================= CORS ================= */
app.use(cors({
  origin: 'https://ekskyrsiadima.ru',
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

/* ================= CONFIG ================= */
const CONFIG = {
  TERMINAL_KEY: '1766479140318', // Рабочий терминал
  PASSWORD: 's9R^$NsmYPytIY#_',   // Рабочий пароль
  API_URL: 'https://securepay.tinkoff.ru/v2',
};

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

/* ================= TOUR SLOTS ================= */
const tourSlots = {
  'boiarskaia-ekskursiia': {
    totalSlots: 20,
    bookedSlots: 0,
    availableSlots: 20
  },
  'kreml-ekskursiia': {
    totalSlots: 15,
    bookedSlots: 0,
    availableSlots: 15
  },
  'nizhegorodskaya-yarmarka': {
    totalSlots: 25,
    bookedSlots: 0,
    availableSlots: 25
  }
};

app.get('/api/tour-slots/:tourId', (req, res) => {
  const { tourId } = req.params;
  const slots = tourSlots[tourId];
  
  if (!slots) {
    return res.status(404).json({ error: 'Экскурсия не найдена' });
  }
  
  res.json(slots);
});

app.post('/api/book-slots', (req, res) => {
  const { tourId, numberOfPeople } = req.body;
  
  if (!tourId || !numberOfPeople || numberOfPeople <= 0) {
    return res.status(400).json({ error: 'Неверные данные' });
  }
  
  const slots = tourSlots[tourId];
  
  if (!slots) {
    return res.status(404).json({ error: 'Экскурсия не найдена' });
  }
  
  if (slots.availableSlots < numberOfPeople) {
    return res.status(400).json({ 
      error: 'Недостаточно мест',
      availableSlots: slots.availableSlots 
    });
  }
  
  // Бронируем места
  slots.bookedSlots += numberOfPeople;
  slots.availableSlots -= numberOfPeople;
  
  console.log(`Забронировано ${numberOfPeople} мест для ${tourId}. Осталось: ${slots.availableSlots}`);
  
  res.json({
    success: true,
    bookedSlots: numberOfPeople,
    availableSlots: slots.availableSlots,
    totalSlots: slots.totalSlots
  });
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
