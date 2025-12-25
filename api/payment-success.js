// Используем существующий Web3Forms сервис
const WEB3FORMS_ACCESS_KEY = '2fa79352-bf0c-4752-8a27-8e63f0c864d3';

const sendTicketEmail = async (data) => {
  try {
    const formData = new FormData();
    formData.append('access_key', WEB3FORMS_ACCESS_KEY);
    formData.append('subject', `🎫 БИЛЕТ: ${data.tourTitle} - ${data.fullName}`);
    formData.append('from_name', 'Экскурсии с Бояриным');
    formData.append('reply_to', data.email);
    
    const htmlMessage = `
      <h2>🎫 Билет на экскурсию</h2>
      <p><strong>Клиент:</strong> ${data.fullName}</p>
      <p><strong>Телефон:</strong> ${data.phone}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Экскурсия:</strong> ${data.tourTitle}</p>
      <p><strong>Дата:</strong> ${data.tourDate}</p>
      <p><strong>Стоимость:</strong> ${data.finalPrice} ₽</p>
      <hr>
      <p>Отправлено автоматически после оплаты</p>
    `;
    
    formData.append('message', htmlMessage);
    
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    console.log('Web3Forms билет результат:', result);
    return result.success ? { success: true, message: 'Билет отправлен' } : { success: false, message: 'Ошибка отправки' };
  } catch (error) {
    console.error('Ошибка отправки билета:', error);
    return { success: false, message: error.message };
  }
};

const sendAdminNotification = async (data) => {
  try {
    const formData = new FormData();
    formData.append('access_key', WEB3FORMS_ACCESS_KEY);
    formData.append('subject', `💰 НОВАЯ ОПЛАТА: ${data.tourTitle} - ${data.finalPrice} ₽`);
    
    const htmlMessage = `
      <h2>💰 Получена оплата!</h2>
      <p><strong>Клиент:</strong> ${data.fullName}</p>
      <p><strong>Телефон:</strong> ${data.phone}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Экскурсия:</strong> ${data.tourTitle}</p>
      <p><strong>Стоимость:</strong> ${data.finalPrice} ₽</p>
      <p><strong>Метод оплаты:</strong> ${data.paymentMethod}</p>
      <hr>
      <p>Отправлено автоматически</p>
    `;
    
    formData.append('message', htmlMessage);
    
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    console.log('Web3Forms уведомление результат:', result);
    return result.success ? { success: true, message: 'Уведомление отправлено' } : { success: false, message: 'Ошибка отправки' };
  } catch (error) {
    console.error('Ошибка отправки уведомления:', error);
    return { success: false, message: error.message };
  }
};

export default async function handler(req, res) {
  try {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', 'https://ekskyrsiadima.ru');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const { 
      fullName, 
      phone, 
      email, 
      tourTitle, 
      tourDate, 
      tourTime, 
      numberOfPeople, 
      selectedTariff, 
      finalPrice, 
      promoCode, 
      discountAmount,
      paymentId,
      paymentMethod = 'Тинькофф'
    } = req.body;

    console.log('Получен запрос на отправку чека после успешной оплаты:', req.body);

    // Данные для email
    const emailData = {
      fullName,
      phone,
      email,
      tourTitle,
      tourDate,
      tourTime,
      numberOfPeople,
      selectedTariff,
      finalPrice,
      promoCode,
      discountAmount,
      paymentMethod
    };

    // Отправляем билет клиенту
    const ticketResult = await sendTicketEmail(emailData);
    
    // Отправляем уведомление администратору
    const adminResult = await sendAdminNotification(emailData);

    console.log('Результат отправки билета:', ticketResult);
    console.log('Результат уведомления администратора:', adminResult);

    res.status(200).json({
      success: true,
      message: 'Чек и уведомления отправлены',
      ticketSent: ticketResult.success,
      adminNotified: adminResult.success,
      paymentId
    });

  } catch (error) {
    console.error('Ошибка при отправке чека:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при отправке чека: ' + error.message 
    });
  }
}
