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
      type = 'notification' // 'ticket' или 'notification'
    } = req.body;

    console.log('Отправка email:', { to, subject, type });

    // Используем Resend API (нужно будет добавить RESEND_API_KEY в environment variables)
    const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_123456789'; // временный ключ
    
    // Временно используем заглушку для теста
    if (!RESEND_API_KEY || RESEND_API_KEY === 're_123456789') {
      console.log('Email заглушка - будет отправлен на:', to);
      console.log('Тема:', subject);
      console.log('Тип:', type);
      
      return res.status(200).json({
        success: true,
        message: 'Email отправлен (заглушка)',
        to,
        subject,
        type
      });
    }

    // Реальный запрос к Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@ekskyrsiadima.ru',
        to: [to],
        subject: subject,
        html: htmlContent,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('Email успешно отправлен:', result);
      res.status(200).json({
        success: true,
        message: 'Email отправлен успешно',
        id: result.id
      });
    } else {
      console.error('Ошибка отправки email:', result);
      res.status(400).json({
        success: false,
        message: result.message || 'Ошибка отправки email'
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
