// Утилита для отправки email через Web3Forms
export const sendTicketEmailWeb3Forms = async (bookingData: any) => {
  try {
    console.log('=== ОТПРАВКА БИЛЕТА ЧЕРЕЗ Web3Forms ===');
    console.log('Данные для отправки:', bookingData);

    const formData = new FormData();
    
    // Основные данные для Web3Forms
    formData.append('from_name', 'Экскурсии Нижнего Новгорода');
    formData.append('to_email', bookingData.email || '');
    formData.append('access_key', '2fa79352-bf0c-4752-8a27-8e63f0c864d3');
    
    // Красивый subject для email на русском
    formData.append('subject', `🎫 Ваш билет на экскурсию: ${bookingData.tourTitle}`);
    
    // Отключаем стандартный шаблон Web3Forms
    formData.append('template', 'false');
    formData.append('redirect', 'false');
    
    // Добавляем только HTML сообщение без полей формы
    formData.append('message', '');

    // HTML сообщение для email на русском
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px;">
        <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c5282; margin: 0; font-size: 28px;">🎫 Ваш билет на экскурсию</h1>
            <p style="color: #718096; margin: 10px 0 0 0; font-size: 16px;">Спасибо за покупку! Ждем вас на экскурсии.</p>
          </div>
          
          <div style="background: #f8fafc; padding: 25px; border-radius: 10px; border-left: 4px solid #667eea; margin: 20px 0;">
            <h3 style="color: #2c5282; margin-top: 0; font-size: 18px;">📍 Информация об экскурсии</h3>
            <p style="margin: 8px 0; color: #4a5568;"><strong>Экскурсия:</strong> <span style="color: #2d3748;">${bookingData.tourTitle}</span></p>
            <p style="margin: 8px 0; color: #4a5568;"><strong>Дата:</strong> <span style="color: #2d3748;">${bookingData.tourDate}</span></p>
            <p style="margin: 8px 0; color: #4a5568;"><strong>Время:</strong> <span style="color: #2d3748;">${bookingData.tourTime}</span></p>
            <p style="margin: 8px 0; color: #4a5568;"><strong>📍 Место встречи:</strong> <span style="color: #2d3748; font-weight: 600;">площадь Минина и Пожарского, 1/1</span></p>
            <p style="margin: 8px 0; color: #4a5568;"><strong>Количество человек:</strong> <span style="color: #2d3748;">${bookingData.numberOfPeople}</span></p>
            <p style="margin: 8px 0; color: #4a5568;"><strong>Тариф:</strong> <span style="color: #2d3748;">${bookingData.selectedTariff}</span></p>
            <p style="margin: 8px 0; color: #4a5568;"><strong>💰 Стоимость:</strong> <span style="color: #2d3748; font-size: 18px; font-weight: bold;">${bookingData.finalPrice} ₽</span></p>
          </div>
          
          <div style="background: #edf2f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c5282; margin-top: 0; font-size: 16px;">👤 Данные клиента</h3>
            <p style="margin: 5px 0; color: #4a5568;"><strong>ФИО:</strong> ${bookingData.fullName}</p>
            <p style="margin: 5px 0; color: #4a5568;"><strong>Телефон:</strong> ${bookingData.phone}</p>
            <p style="margin: 5px 0; color: #4a5568;"><strong>Email:</strong> ${bookingData.email}</p>
            <p style="margin: 5px 0; color: #4a5568;"><strong>Способ оплаты:</strong> ${bookingData.paymentMethod}</p>
            ${bookingData.paymentId ? `<p style="margin: 5px 0; color: #4a5568;"><strong>ID платежа:</strong> ${bookingData.paymentId}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #718096; margin: 0; font-size: 14px;">🎉 Приятной экскурсии!</p>
            <p style="color: #a0aec0; margin: 5px 0 0 0; font-size: 12px;">С уважением, команда экскурсий</p>
          </div>
        </div>
      </div>
    `;
    
    // Используем HTML контент вместо message
    formData.append('message', htmlContent);

    // Отправка в Web3Forms
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    console.log('Ответ Web3Forms:', result);

    if (response.ok && result.success) {
      console.log('✅ Билет успешно отправлен на email');
      return { success: true, message: 'Билет отправлен на email' };
    } else {
      console.error('❌ Ошибка отправки билета:', result);
      return { success: false, message: 'Ошибка отправки билета', details: result };
    }

  } catch (error) {
    console.error('❌ Ошибка при отправке билета:', error);
    return { 
      success: false, 
      message: 'Сетевая ошибка при отправке билета', 
      details: error instanceof Error ? error.message : 'Неизвестная ошибка' 
    };
  }
};
