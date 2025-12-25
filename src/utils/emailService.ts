interface EmailData {
  fullName: string;
  phone: string;
  email: string;
  tourTitle: string;
  tourDate: string;
  tourTime: string;
  numberOfPeople: number;
  selectedTariff: string;
  finalPrice: number;
  promoCode?: string;
  discountAmount?: number;
  paymentMethod?: string;
}

interface Web3FormsResponse {
  success: boolean;
  message: string;
}

const WEB3FORMS_ACCESS_KEY = '2fa79352-bf0c-4752-8a27-8e63f0c864d3';

export const sendBookingEmail = async (data: EmailData): Promise<Web3FormsResponse> => {
  try {
    const formData = new FormData();
    
    // Основные данные
    formData.append('access_key', WEB3FORMS_ACCESS_KEY);
    formData.append('subject', `Новая бронь: ${data.tourTitle} - ${data.fullName}`);
    
    // Данные клиента
    formData.append('fullName', data.fullName);
    formData.append('phone', data.phone);
    formData.append('email', data.email);
    
    // Данные экскурсии
    formData.append('tourTitle', data.tourTitle);
    formData.append('tourDate', data.tourDate);
    formData.append('tourTime', data.tourTime);
    formData.append('numberOfPeople', data.numberOfPeople.toString());
    formData.append('selectedTariff', data.selectedTariff);
    formData.append('finalPrice', data.finalPrice.toString());
    
    // Промокод (если есть)
    if (data.promoCode) {
      formData.append('promoCode', data.promoCode);
    }
    
    if (data.discountAmount) {
      formData.append('discountAmount', data.discountAmount.toString());
    }
    
    // Метод оплаты (если есть)
    if (data.paymentMethod) {
      formData.append('paymentMethod', data.paymentMethod);
    }
    
    // Формируем HTML сообщение для лучшего отображения
    const htmlMessage = `
      <h2>Новая бронь на экскурсию</h2>
      
      <h3>Данные клиента:</h3>
      <p><strong>ФИО:</strong> ${data.fullName}</p>
      <p><strong>Телефон:</strong> ${data.phone}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      
      <h3>Данные экскурсии:</h3>
      <p><strong>Название:</strong> ${data.tourTitle}</p>
      <p><strong>Дата:</strong> ${data.tourDate}</p>
      <p><strong>Время:</strong> ${data.tourTime}</p>
      <p><strong>Количество человек:</strong> ${data.numberOfPeople}</p>
      <p><strong>Тариф:</strong> ${data.selectedTariff}</p>
      <p><strong>Итоговая цена:</strong> ${data.finalPrice.toLocaleString('ru-RU')} ₽</p>
      
      ${data.promoCode ? `
      <h3>Промокод:</h3>
      <p><strong>Код:</strong> ${data.promoCode}</p>
      <p><strong>Скидка:</strong> ${data.discountAmount?.toLocaleString('ru-RU')} ₽</p>
      ` : ''}
      
      ${data.paymentMethod ? `
      <h3>Оплата:</h3>
      <p><strong>Метод оплаты:</strong> ${data.paymentMethod}</p>
      ` : ''}
      
      <hr>
      <p><em>Это сообщение было отправлено автоматически с сайта туров</em></p>
    `;
    
    formData.append('message', htmlMessage);
    
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Email успешно отправлен:', result);
      return { success: true, message: 'Email успешно отправлен' };
    } else {
      console.error('Ошибка отправки email:', result);
      return { success: false, message: result.message || 'Ошибка отправки email' };
    }
    
  } catch (error: unknown) {
    console.error('Ошибка при отправке email:', error);
    return { success: false, message: 'Ошибка при отправке email: ' + (error as Error).message };
  }
};

export const sendTicketEmail = async (data: EmailData): Promise<Web3FormsResponse> => {
  try {
    const formData = new FormData();
    
    // Основные данные
    formData.append('access_key', WEB3FORMS_ACCESS_KEY);
    formData.append('subject', `🎫 БИЛЕТ ДЛЯ ПОЛЬЗОВАТЕЛЯ: ${data.tourTitle} - ${data.fullName}`);
    formData.append('from_name', 'Экскурсии с Бояриным');
    formData.append('reply_to', data.email); // Устанавливаем replyto на email пользователя для возможности ответа
    
    // HTML контент письма с билетом и инструкциями для пересылки
    const ticketHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; }
          .admin-notice { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
          .admin-notice h3 { color: #856404; margin: 0 0 10px 0; }
          .admin-notice p { color: #856404; margin: 0; }
          .forward-button { background: #007bff; color: white; padding: 12px 24px; border: none; border-radius: 5px; text-decoration: none; display: inline-block; margin: 10px 0; }
          .ticket { background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin-bottom: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; }
          .content { padding: 30px; }
          .ticket-info { background: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .info-row:last-child { border-bottom: none; }
          .info-label { font-weight: bold; color: #333; }
          .info-value { color: #666; text-align: right; }
          .qr-section { text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 10px; }
          .qr-placeholder { width: 150px; height: 150px; background: #ddd; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; color: #666; font-size: 14px; }
          .footer { background: #333; color: white; text-align: center; padding: 20px; font-size: 14px; }
          .status-badge { display: inline-block; background: #28a745; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .user-info { background: #e3f2fd; border-radius: 10px; padding: 15px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Уведомление для администратора -->
          <div class="admin-notice">
            <h3>📧 ВНИМАНИЕ: Этот билет нужно переслать пользователю!</h3>
            <p><strong>Email пользователя:</strong> ${data.email}</p>
            <p><strong>Тема для пересылки:</strong> Ваш билет на экскурсию: ${data.tourTitle}</p>
            <p>Пожалуйста, переслайте этот билет пользователю, скопировав содержимое ниже или используя функцию "Переслать" в вашем почтовом клиенте.</p>
          </div>
          
          <!-- Информация о пользователе -->
          <div class="user-info">
            <h4>👤 Информация о пользователе:</h4>
            <p><strong>ФИО:</strong> ${data.fullName}</p>
            <p><strong>Телефон:</strong> ${data.phone}</p>
            <p><strong>Email:</strong> ${data.email}</p>
          </div>
          
          <!-- Сам билет -->
          <div class="ticket">
            <div class="header">
              <h1>🎫 Ваш билет на экскурсию</h1>
              <p>Экскурсии с Бояриным</p>
            </div>
            
            <div class="content">
              <div style="text-align: center; margin-bottom: 20px;">
                <span class="status-badge">ОПЛАЧЕНО</span>
              </div>
              
              <div class="ticket-info">
                <div class="info-row">
                  <span class="info-label">Экскурсия:</span>
                  <span class="info-value">${data.tourTitle}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Дата:</span>
                  <span class="info-value">${data.tourDate}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Время:</span>
                  <span class="info-value">${data.tourTime}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Участников:</span>
                  <span class="info-value">${data.numberOfPeople} чел.</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Тариф:</span>
                  <span class="info-value">${data.selectedTariff}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">ФИО:</span>
                  <span class="info-value">${data.fullName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Телефон:</span>
                  <span class="info-value">${data.phone}</span>
                </div>
                ${data.promoCode ? `
                <div class="info-row">
                  <span class="info-label">Промокод:</span>
                  <span class="info-value">${data.promoCode}</span>
                </div>
                ` : ''}
                <div class="info-row">
                  <span class="info-label">Итоговая стоимость:</span>
                  <span class="info-value" style="font-weight: bold; color: #28a745;">${data.finalPrice === 0 ? 'БЕСПЛАТНО' : data.finalPrice + ' ₽'}</span>
                </div>
              </div>
              
              <div class="qr-section">
                <div class="qr-placeholder">
                  QR-код билета
                </div>
                <p style="margin: 0; color: #666; font-size: 14px;">Покажите этот QR-код гиду</p>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">
                  Спасибо за бронирование! Пожалуйста, сохраните это письмо.
                  <br>
                  Прибудьте на место сбора за 15 минут до начала экскурсии.
                </p>
              </div>
            </div>
            
            <div class="footer">
              <p>© 2024 Экскурсии с Бояриным. Все права защищены.</p>
              <p style="margin: 5px 0 0 0; opacity: 0.8;">По вопросам: +7 (999) 140-80-94</p>
            </div>
          </div>
          
          <!-- Инструкции для администратора -->
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 20px;">
            <h4>📋 Инструкция по пересылке билета:</h4>
            <ol style="color: #666; line-height: 1.6;">
              <li>Нажмите "Переслать" в вашем почтовом клиенте</li>
              <li>В поле "Кому" введите: <strong>${data.email}</strong></li>
              <li>Измените тему на: <strong>Ваш билет на экскурсию: ${data.tourTitle}</strong></li>
              <li>Удалите это уведомление для администратора (желтый блок)</li>
              <li>Нажмите "Отправить"</li>
            </ol>
          </div>
        </div>
      </body>
      </html>
    `;
    
    formData.append('message', ticketHtml);
    
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Билет успешно отправлен администратору для пересылки пользователю:', result);
      return { success: true, message: 'Билет отправлен администратору для пересылки пользователю' };
    } else {
      console.error('Ошибка отправки билета администратору:', result);
      return { success: false, message: result.message || 'Ошибка отправки билета администратору' };
    }
    
  } catch (error) {
    console.error('Ошибка при отправке билета администратору:', error);
    return { success: false, message: 'Ошибка при отправке билета администратору: ' + (error as Error).message };
  }
};

export const sendPromoCodeEmail = async (data: EmailData): Promise<Web3FormsResponse> => {
  try {
    const formData = new FormData();
    
    // Основные данные
    formData.append('access_key', WEB3FORMS_ACCESS_KEY);
    formData.append('subject', `Применен промокод на 100%: ${data.tourTitle} - ${data.fullName}`);
    
    // Данные клиента
    formData.append('fullName', data.fullName);
    formData.append('phone', data.phone);
    formData.append('email', data.email);
    
    // Данные экскурсии
    formData.append('tourTitle', data.tourTitle);
    formData.append('tourDate', data.tourDate);
    formData.append('tourTime', data.tourTime);
    formData.append('numberOfPeople', data.numberOfPeople.toString());
    formData.append('selectedTariff', data.selectedTariff);
    formData.append('finalPrice', data.finalPrice.toString());
    
    // Промокод
    if (data.promoCode) {
      formData.append('promoCode', data.promoCode);
    }
    
    if (data.discountAmount) {
      formData.append('discountAmount', data.discountAmount.toString());
    }
    
    // Формируем HTML сообщение для промокода
    const htmlMessage = `
      <h2>Применен промокод на 100% скидку!</h2>
      
      <h3>Данные клиента:</h3>
      <p><strong>ФИО:</strong> ${data.fullName}</p>
      <p><strong>Телефон:</strong> ${data.phone}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      
      <h3>Данные экскурсии:</h3>
      <p><strong>Название:</strong> ${data.tourTitle}</p>
      <p><strong>Дата:</strong> ${data.tourDate}</p>
      <p><strong>Время:</strong> ${data.tourTime}</p>
      <p><strong>Количество человек:</strong> ${data.numberOfPeople}</p>
      <p><strong>Тариф:</strong> ${data.selectedTariff}</p>
      <p><strong>Итоговая цена:</strong> ${data.finalPrice.toLocaleString('ru-RU')} ₽ (бесплатно по промокоду)</p>
      
      <h3>Промокод:</h3>
      <p><strong>Код:</strong> ${data.promoCode}</p>
      <p><strong>Скидка:</strong> ${data.discountAmount?.toLocaleString('ru-RU')} ₽</p>
      
      <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h4 style="color: #856404; margin-top: 0;">Внимание!</h4>
        <p style="color: #856404; margin-bottom: 0;">Клиент получил 100% скидку по промокоду. Необходимо подтвердить бронирование и связаться с клиентом.</p>
      </div>
      
      <hr>
      <p><em>Это сообщение было отправлено автоматически с сайта туров</em></p>
    `;
    
    formData.append('message', htmlMessage);
    
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Email о промокоде успешно отправлен:', result);
      return { success: true, message: 'Email о промокоде успешно отправлен' };
    } else {
      console.error('Ошибка отправки email о промокоде:', result);
      return { success: false, message: result.message || 'Ошибка отправки email о промокоде' };
    }
    
  } catch (error) {
    console.error('Ошибка при отправке email о промокоде:', error);
    return { success: false, message: 'Ошибка при отправке email о промокоде: ' + (error as Error).message };
  }
};

export const sendAdminNotification = async (data: EmailData): Promise<Web3FormsResponse> => {
  try {
    const formData = new FormData();
    
    // Основные данные
    formData.append('access_key', WEB3FORMS_ACCESS_KEY);
    formData.append('subject', `🎉 НОВАЯ ОПЛАТА: ${data.tourTitle} - ${data.fullName} - ${data.finalPrice} ₽`);
    
    // Данные клиента
    formData.append('fullName', data.fullName);
    formData.append('phone', data.phone);
    formData.append('email', data.email);
    
    // Данные экскурсии
    formData.append('tourTitle', data.tourTitle);
    formData.append('tourDate', data.tourDate);
    formData.append('tourTime', data.tourTime);
    formData.append('numberOfPeople', data.numberOfPeople.toString());
    formData.append('selectedTariff', data.selectedTariff);
    formData.append('finalPrice', data.finalPrice.toString());
    
    // Метод оплаты
    if (data.paymentMethod) {
      formData.append('paymentMethod', data.paymentMethod);
    }
    
    // Промокод (если есть)
    if (data.promoCode) {
      formData.append('promoCode', data.promoCode);
    }
    
    if (data.discountAmount) {
      formData.append('discountAmount', data.discountAmount.toString());
    }
    
    // Формируем HTML сообщение для уведомления администратора
    const htmlMessage = `
      <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 10px; padding: 20px; margin: 20px 0;">
        <h2 style="color: #155724; margin: 0 0 10px 0;">🎉 ПОЛУЧЕНА ОПЛАТА!</h2>
        <p style="color: #155724; margin: 0; font-size: 18px; font-weight: bold;">
          Сумма: ${data.finalPrice.toLocaleString('ru-RU')} ₽
        </p>
      </div>
      
      <h3>📋 Детали оплаты:</h3>
      <p><strong>ФИО клиента:</strong> ${data.fullName}</p>
      <p><strong>Телефон:</strong> ${data.phone}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Метод оплаты:</strong> ${data.paymentMethod || 'Не указан'}</p>
      
      <h3>🚌 Экскурсия:</h3>
      <p><strong>Название:</strong> ${data.tourTitle}</p>
      <p><strong>Дата:</strong> ${data.tourDate}</p>
      <p><strong>Время:</strong> ${data.tourTime}</p>
      <p><strong>Количество человек:</strong> ${data.numberOfPeople}</p>
      <p><strong>Тариф:</strong> ${data.selectedTariff}</p>
      <p><strong>Итоговая цена:</strong> ${data.finalPrice.toLocaleString('ru-RU')} ₽</p>
      
      ${data.promoCode ? `
      <h3>🎁 Промокод:</h3>
      <p><strong>Код:</strong> ${data.promoCode}</p>
      <p><strong>Скидка:</strong> ${data.discountAmount?.toLocaleString('ru-RU')} ₽</p>
      ` : ''}
      
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
        <h4 style="color: #856404; margin-top: 0;">⚡ Что делать дальше:</h4>
        <ol style="color: #856404; line-height: 1.6;">
          <li>Проверьте поступление платежа на счет</li>
          <li>Отправьте билет клиенту на email: ${data.email}</li>
          <li>За 24 часа до экскурсии отправьте напоминание</li>
          <li>При необходимости свяжитесь с клиентом: ${data.phone}</li>
        </ol>
      </div>
      
      <hr>
      <p><em>Это уведомление отправлено автоматически после успешной оплаты</em></p>
    `;
    
    formData.append('message', htmlMessage);
    
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Уведомление администратору успешно отправлено:', result);
      return { success: true, message: 'Уведомление администратору отправлено' };
    } else {
      console.error('Ошибка отправки уведомления администратору:', result);
      return { success: false, message: result.message || 'Ошибка отправки уведомления' };
    }
    
  } catch (error: unknown) {
    console.error('Ошибка при отправке уведомления администратору:', error);
    return { success: false, message: 'Ошибка при отправке уведомления: ' + (error as Error).message };
  }
};
