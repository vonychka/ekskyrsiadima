import React, { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';

interface TinkoffPaymentProps {
  amount: number;
  orderId: string;
  description: string;
  fullName: string;
  email: string;
  phone: string;
  onSuccess?: (paymentUrl: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const TinkoffPayment: React.FC<TinkoffPaymentProps> = ({
  amount,
  orderId,
  description,
  fullName,
  email,
  phone,
  onSuccess,
  onError,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Updated: Using live Tinkoff credentials
  console.log('TinkoffPayment: Using live credentials (v2.0)');

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('=== ОТПРАВКА В ТИНЬКОФФ ===');
      console.log('Данные клиента:', { fullName, email, phone });
      console.log('Данные платежа:', { amount, orderId, description });
      
      // Валидация данных перед отправкой
      if (!amount || amount <= 0) {
        throw new Error('Сумма платежа должна быть больше 0');
      }
      if (!orderId) {
        throw new Error('OrderId обязателен');
      }
      if (!description) {
        throw new Error('Описание обязательно');
      }
      if (!fullName || fullName.trim() === '') {
        throw new Error('Имя клиента обязательно');
      }
      if (!email || email.trim() === '') {
        throw new Error('Email обязателен');
      }
      if (!phone || phone.trim() === '') {
        throw new Error('Телефон обязателен');
      }

      // Определяем ID экскурсии из описания
      let tourId = 'boiarskaia-ekskursiia'; // по умолчанию
      if (description.toLowerCase().includes('кремль')) {
        tourId = 'kreml-ekskursiia';
      } else if (description.toLowerCase().includes('ярмарк')) {
        tourId = 'nizhegorodskaya-yarmarka';
      }

      // Проверяем доступность мест
      const slotsResponse = await fetch(`https://nextjs-boilerplateuexkyesua.onrender.com/api/tour-slots/${tourId}`);
      const slotsData = await slotsResponse.json();
      
      if (!slotsResponse.ok) {
        throw new Error('Ошибка проверки доступности мест');
      }

      console.log('Доступные места:', slotsData.availableSlots);
      
      if (slotsData.availableSlots < 1) {
        throw new Error('Нет доступных мест для этой экскурсии');
      }

      // Бронируем места
      const bookResponse = await fetch('https://nextjs-boilerplateuexkyesua.onrender.com/api/book-slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tourId: tourId,
          numberOfPeople: 1
        }),
      });

      const bookResult = await bookResponse.json();
      
      if (!bookResponse.ok) {
        throw new Error(bookResult.error || 'Ошибка бронирования мест');
      }

      console.log('Места забронированы:', bookResult);
      
      const requestData = {
        amount: Number(amount),
        orderId: String(orderId),
        description: String(description).trim(),
        fullName: String(fullName).trim(),
        email: String(email).trim(),
        phone: String(phone).trim(),
        customerKey: String(email).trim() || String(orderId)
      };
      
      console.log('Полный запрос в Тинькофф:', requestData);
      
      const response = await fetch('https://nextjs-boilerplateuexkyesua.onrender.com/api/tinkoff-working', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      console.log('Debug response:', data);

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Ошибка при инициализации платежа');
      }

      if (data.Success) {
        if (data.PaymentURL) {
          // Отправляем данные клиента в Telegram перед редиректом
          try {
            const clientData = {
              fullName: fullName,
              phone: phone,
              email: email,
              tourTitle: description,
              tourDate: new Date().toLocaleDateString('ru-RU'),
              tourTime: 'Не указано',
              numberOfPeople: 1,
              selectedTariff: 'standard',
              finalPrice: amount,
              paymentId: data.PaymentId,
              paymentMethod: 'Тинькофф'
            };
            
            console.log('Отправка данных клиента в Telegram:', clientData);
            
            const telegramResponse = await fetch('https://nextjs-boilerplateuexkyesua.onrender.com/api/send-client-data', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(clientData),
            });
            
            const telegramResult = await telegramResponse.json();
            console.log('Ответ Telegram API:', telegramResult);
            
            if (!telegramResponse.ok) {
              console.error('Ошибка отправки в Telegram:', telegramResult);
            }
          } catch (telegramError) {
            console.error('Ошибка при отправке в Telegram:', telegramError);
            // Не прерываем оплату если Telegram не сработал
          }
          
          // Сохраняем данные для билета после редиректа
          const paymentData = {
            fullName: fullName,
            phone,
            email,
            tourTitle: description,
            tourDate: new Date().toLocaleDateString('ru-RU'),
            tourTime: 'Не указано',
            numberOfPeople: 1,
            selectedTariff: 'standard',
            finalPrice: amount,
            paymentId: data.PaymentId,
            paymentMethod: 'Тинькофф'
          };
          
          localStorage.setItem('pendingTicketData', JSON.stringify(paymentData));
          
          window.location.href = data.PaymentURL;
          onSuccess?.(data.PaymentURL);
        } else {
          throw new Error('Не получена ссылка на оплату');
        }
      } else {
        throw new Error(data.Message || 'Ошибка от Тинькофф');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла неизвестная ошибка';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`tinkoff-payment ${className}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      <button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Обработка...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Оплатить через T-Pay
          </>
        )}
      </button>
      
      <div className="mt-3 text-xs text-gray-500 text-center">
        Оплата через защищенный шлюз Тинькофф
      </div>
    </div>
  );
};
