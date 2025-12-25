import nodemailer from 'nodemailer';

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
      to, 
      subject, 
      htmlContent, 
      from_name = 'Экскурсии с Бояриным',
      reply_to
    } = req.body;

    console.log('Отправка email через SMTP:', { to, subject });

    // SMTP настройки (можно использовать Gmail, Outlook, Yandex)
    const SMTP_CONFIG = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-password'
      }
    };

    // Если нет настроек SMTP - используем заглушку
    if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your-email@gmail.com') {
      console.log('SMTP заглушка - будет отправлен на:', to);
      console.log('Тема:', subject);
      
      return res.status(200).json({
        success: true,
        message: 'Email отправлен (заглушка)',
        to,
        subject
      });
    }

    // Создаем транспорт
    const transporter = nodemailer.createTransporter(SMTP_CONFIG);

    // Настройка письма
    const mailOptions = {
      from: `"${from_name}" <${SMTP_CONFIG.auth.user}>`,
      to: to,
      subject: subject,
      html: htmlContent,
      replyTo: reply_to || to
    };

    // Отправляем email
    const result = await transporter.sendMail(mailOptions);
    
    console.log('Email успешно отправлен:', result.messageId);
    
    res.status(200).json({
      success: true,
      message: 'Email отправлен успешно',
      messageId: result.messageId
    });

  } catch (error) {
    console.error('Ошибка при отправке email:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера: ' + error.message
    });
  }
}
