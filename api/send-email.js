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

    console.log('Отправка email через EmailJS:', { to, subject });

    // EmailJS настройки
    const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || 'service_xxx';
    const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || 'template_xxx';
    const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || 'xxx';

    // Если нет настроек - используем заглушку
    if (EMAILJS_SERVICE_ID === 'service_xxx') {
      console.log('EmailJS заглушка - будет отправлен на:', to);
      console.log('Тема:', subject);
      
      return res.status(200).json({
        success: true,
        message: 'Email отправлен (заглушка)',
        to,
        subject
      });
    }

    // Формируем данные для EmailJS
    const emailData = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: to,
        subject: subject,
        message: htmlContent,
        from_name: from_name,
        reply_to: reply_to || to
      }
    };

    // Отправляем через EmailJS API
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    if (response.ok) {
      console.log('Email успешно отправлен через EmailJS');
      res.status(200).json({
        success: true,
        message: 'Email отправлен успешно'
      });
    } else {
      const error = await response.text();
      console.error('Ошибка EmailJS:', error);
      res.status(400).json({
        success: false,
        message: 'Ошибка отправки email: ' + error
      });
    }

  } catch (error) {
    console.error('Ошибка при отправке email:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера: ' + error.message
    });
  }
}
