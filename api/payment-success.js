// Используем SMTP через Nodemailer для отправки email
import nodemailer from 'nodemailer';

const sendTicketEmail = async (data) => {
  try {
    // SMTP настройки для Gmail
    const transporter = nodemailer.createTransporter({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'sokovdima3@gmail.com',
        pass: process.env.SMTP_PASS // App password из Google
      }
    });

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
    
    const mailOptions = {
      from: `"Экскурсии с Бояриным" <sokovdima3@gmail.com>`,
      to: data.email,
      subject: `🎫 Билет: ${data.tourTitle} - ${data.fullName}`,
      html: htmlMessage,
      replyTo: 'sokovdima3@gmail.com'
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Билет отправлен через Gmail:', result.messageId);
    return { success: true, message: 'Билет отправлен' };
  } catch (error) {
    console.error('Ошибка отправки билета:', error);
    return { success: false, message: error.message };
  }
};

const sendAdminNotification = async (data) => {
  try {
    // SMTP настройки для Gmail
    const transporter = nodemailer.createTransporter({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'sokovdima3@gmail.com',
        pass: process.env.SMTP_PASS // App password из Google
      }
    });

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
    
    const mailOptions = {
      from: `"Экскурсии с Бояриным" <sokovdima3@gmail.com>`,
      to: 'sokovdima3@gmail.com', // Администратор получает уведомление
      subject: `💰 НОВАЯ ОПЛАТА: ${data.tourTitle} - ${data.finalPrice} ₽`,
      html: htmlMessage
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Уведомление отправлено через Gmail:', result.messageId);
    return { success: true, message: 'Уведомление отправлено' };
  } catch (error) {
    console.error('Ошибка отправки уведомления:', error);
    return { success: false, message: error.message };
  }
};

export default async function handler(req, res) {
  try {
    console.log('=== PAYMENT SUCCESS API START ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Query:', JSON.stringify(req.query, null, 2));
    
    // CORS - разрешаем все origin для отладки
    console.log('Setting CORS headers...');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-HTTP-Method-Override, Accept, Origin, Cache-Control, X-File-Name');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    console.log('CORS headers set successfully');
    console.log('Response headers after CORS:', res.getHeaders());

    if (req.method === 'OPTIONS') {
      console.log('OPTIONS request detected - returning 200');
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

    console.log('Получен запрос на отправку чека:', { 
      fullName, 
      phone, 
      email, 
      tourTitle, 
      finalPrice, 
      paymentId, 
      paymentMethod 
    });

    // Проверяем SMTP настройки
    console.log('SMTP_PASS существует:', !!process.env.SMTP_PASS);
    console.log('SMTP_PASS длина:', process.env.SMTP_PASS?.length || 0);

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

    console.log('Начинаю отправку билета клиенту...');
    
    // Отправляем билет клиенту
    const ticketResult = await sendTicketEmail(emailData);
    console.log('Результат отправки билета:', ticketResult);
    
    console.log('Начинаю отправку уведомления администратору...');
    
    // Отправляем уведомление администратору
    const adminResult = await sendAdminNotification(emailData);
    console.log('Результат уведомления администратора:', adminResult);

    console.log('=== PAYMENT SUCCESS API END ===');

    res.status(200).json({
      success: true,
      message: 'Чек и уведомления отправлены',
      ticketSent: ticketResult.success,
      adminNotified: adminResult.success,
      paymentId,
      ticketResult,
      adminResult
    });

  } catch (error) {
    console.error('=== PAYMENT SUCCESS API ERROR ===');
    console.error('Ошибка при отправке чека:', error);
    console.error('Stack trace:', error.stack);
    
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при отправке чека: ' + error.message,
      error: error.message,
      stack: error.stack
    });
  }
}
