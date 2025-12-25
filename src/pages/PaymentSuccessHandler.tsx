import React, { useEffect, useState } from 'react';

export const PaymentSuccessHandler: React.FC = () => {
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const sendTicket = async () => {
      try {
        const pendingData = localStorage.getItem('pendingTicketData');
        
        if (pendingData) {
          setIsSending(true);
          setMessage('Отправляем ваш билет на email...');
          
          const paymentData = JSON.parse(pendingData);
          
          // Отправляем чек на email
          const response = await fetch('https://ekskyrsiadima-jhin.vercel.app/api/payment-success', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData),
          });

          const result = await response.json();
          
          if (result.success) {
            setMessage('✅ Билет отправлен на вашу почту! Проверьте входящие сообщения.');
            // Очищаем localStorage после успешной отправки
            localStorage.removeItem('pendingTicketData');
          } else {
            setMessage('❌ Ошибка при отправке билета. Свяжитесь с поддержкой.');
          }
        } else {
          setMessage('Нет данных для отправки билета.');
        }
      } catch (error) {
        console.error('Ошибка при отправке билета:', error);
        setMessage('❌ Произошла ошибка. Пожалуйста, свяжитесь с поддержкой.');
      } finally {
        setIsSending(false);
      }
    };

    // Проверяем URL параметры на успешную оплату
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get('paymentId');
    const success = urlParams.get('success');

    if (success === 'true' || paymentId) {
      sendTicket();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mb-4">
          {isSending ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          ) : (
            <div className="text-green-600 text-5xl mb-4">🎉</div>
          )}
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isSending ? 'Обработка оплаты...' : 'Оплата прошла успешно!'}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        
        {!isSending && message.includes('✅') && (
          <div className="space-y-3">
            <a 
              href="/" 
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
            >
              На главную
            </a>
            <a 
              href="/ticket" 
              className="block w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
            >
              Мой билет
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessHandler;
