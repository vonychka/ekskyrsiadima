// Утилита для отправки данных в Telegram бот
export const sendToTelegram = async (bookingData: any) => {
  try {
    console.log('=== ОТПРАВКА В TELEGRAM ===');
    console.log('Данные для отправки:', bookingData);

    const botToken = '8209677930:AAFYQhWh_a4NvzRgnBjeJTO_Af5JkxWeauE';
    const chatId = 'ВАШ_CHAT_ID'; // Нужно получить ваш chat_id

    const message = `
🎫 НОВЫЙ ЗАКАЗ ЭКСКУРСИИ

👤 КЛИЕНТ:
ФИО: ${bookingData.fullName || 'Не указано'}
Телефон: ${bookingData.phone || 'Не указано'}
Email: ${bookingData.email || 'Не указано'}

📍 ЭКСКУРСИЯ:
Название: ${bookingData.tourTitle || 'Не указано'}
Дата: ${bookingData.tourDate || 'Не указано'}
Время: ${bookingData.tourTime || 'Не указано'}
Количество человек: ${bookingData.numberOfPeople || 1}
Тариф: ${bookingData.selectedTariff || 'standard'}

💰 ОПЛАТА:
Стоимость: ${bookingData.finalPrice || 0} ₽
Способ: ${bookingData.paymentMethod || 'Не указано'}
ID платежа: ${bookingData.paymentId || 'Не указано'}

⏰ Время: ${new Date().toLocaleString('ru-RU')}
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
      console.log('✅ Данные отправлены в Telegram');
      return { success: true, message: 'Данные отправлены в Telegram' };
    } else {
      console.error('❌ Ошибка отправки в Telegram:', result);
      return { success: false, message: 'Ошибка отправки в Telegram', details: result };
    }

  } catch (error) {
    console.error('❌ Ошибка при отправке в Telegram:', error);
    return { 
      success: false, 
      message: 'Сетевая ошибка при отправке в Telegram', 
      details: error instanceof Error ? error.message : 'Неизвестная ошибка' 
    };
  }
};

// Функция для получения вашего chat_id
export const getChatId = async () => {
  const botToken = '8209677930:AAFYQhWh_a4NvzRgnBjeJTO_Af5JkxWeauE';
  
  try {
    // Отправляем тестовое сообщение чтобы получить обновления
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
    const data = await response.json();
    
    console.log('Обновления бота:', data);
    
    if (data.ok && data.result.length > 0) {
      const chatId = data.result[0].message.chat.id;
      console.log('Ваш chat_id:', chatId);
      return chatId;
    }
    
    return null;
  } catch (error) {
    console.error('Ошибка получения chat_id:', error);
    return null;
  }
};
