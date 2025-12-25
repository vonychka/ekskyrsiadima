// Утилита для отправки email через Web3Forms
export const sendTicketEmailWeb3Forms = async (bookingData: any) => {
  try {
    console.log('=== ОТПРАВКА БИЛЕТА ЧЕРЕЗ Web3Forms ===');
    console.log('Данные для отправки:', bookingData);

    const formData = new FormData();
    
    // Основные данные
    formData.append('fullName', bookingData.fullName || '');
    formData.append('phone', bookingData.phone || '');
    formData.append('email', bookingData.email || '');
    formData.append('tourTitle', bookingData.tourTitle || '');
    formData.append('tourDate', bookingData.tourDate || '');
    formData.append('tourTime', bookingData.tourTime || '');
    formData.append('numberOfPeople', String(bookingData.numberOfPeople || 1));
    formData.append('selectedTariff', bookingData.selectedTariff || '');
    formData.append('finalPrice', String(bookingData.finalPrice || 0));
    formData.append('paymentMethod', bookingData.paymentMethod || '');
    formData.append('paymentId', bookingData.paymentId || '');
    formData.append('access_key', '2fa79352-bf0c-4752-8a27-8e63f0c864d3');

    // HTML сообщение для email
    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5282;">🎫 Билет на экскурсию</h2>
        <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>ФИО:</strong> ${bookingData.fullName}</p>
          <p><strong>Телефон:</strong> ${bookingData.phone}</p>
          <p><strong>Email:</strong> ${bookingData.email}</p>
          <p><strong>Экскурсия:</strong> ${bookingData.tourTitle}</p>
          <p><strong>Дата:</strong> ${bookingData.tourDate}</p>
          <p><strong>Время:</strong> ${bookingData.tourTime}</p>
          <p><strong>Количество человек:</strong> ${bookingData.numberOfPeople}</p>
          <p><strong>Тариф:</strong> ${bookingData.selectedTariff}</p>
          <p><strong>Стоимость:</strong> ${bookingData.finalPrice} ₽</p>
          <p><strong>Способ оплаты:</strong> ${bookingData.paymentMethod}</p>
          <p><strong>ID платежа:</strong> ${bookingData.paymentId}</p>
        </div>
        <p style="color: #718096; font-size: 14px;">Спасибо за покупку! Ждем вас на экскурсии.</p>
      </div>
    `;
    
    formData.append('message', htmlMessage);

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
