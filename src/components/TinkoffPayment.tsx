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

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://ekskyrsiadima-jhin.vercel.app/api/tinkoff-working', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          orderId,
          description,
          email,
          phone,
          customerKey: email || orderId
        }),
      });

      const data = await response.json();
      console.log('Debug response:', data);

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Ошибка при инициализации платежа');
      }

      if (data.Success) {
        if (data.PaymentURL) {
          // Сохраняем данные для отправки чека после редиректа
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
          
          // Сохраняем в localStorage для отправки после возврата с платежной страницы
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
            Оплатить картой Тинькофф
          </>
        )}
      </button>
      
      <div className="mt-3 text-xs text-gray-500 text-center">
        Оплата через защищенный шлюз Тинькофф
      </div>
    </div>
  );
};
