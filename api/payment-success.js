// Временная заглушка - будем использовать Resend API
const sendTicketEmail = async (data) => {
  console.log('Отправка билета:', data);
  return { success: true, message: 'Билет отправлен' };
};

const sendAdminNotification = async (data) => {
  console.log('Уведомление администратору:', data);
  return { success: true, message: 'Уведомление отправлено' };
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
