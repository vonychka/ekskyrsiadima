import React, { useState } from 'react';

interface TinkoffPaymentMobileProps {
  amount: number;
  orderId: string;
  description: string;
  email?: string;
  phone?: string;
  fullName?: string;
  onSuccess?: (paymentUrl: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const TinkoffPaymentMobile: React.FC<TinkoffPaymentMobileProps> = ({
  amount,
  orderId,
  description,
  email,
  phone,
  fullName = '',
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
      // Определяем мобильное устройство
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      const apiUrl = isMobile 
        ? 'https://nextjs-boilerplateuexkyesua.onrender.com/api/tinkoff-mobile'
        : 'https://nextjs-boilerplateuexkyesua.onrender.com/api/tinkoff-working';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify({
          amount,
          orderId,
          description,
          email,
          phone,
          customerKey: email || orderId,
          userAgent: navigator.userAgent
        }),
      });

      const data = await response.json();
      console.log('Mobile payment response:', data);

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Ошибка при инициализации платежа');
      }

      if (data.Success) {
        if (data.PaymentURL || data.paymentUrl) {
          // Сохраняем данные для отправки чека после редиректа
          const paymentData = {
            fullName,
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
          
          const paymentUrl = data.PaymentURL || data.paymentUrl;
          
          // Для мобильных устройств используем специальную обработку
          if (isMobile) {
            // Проверяем поддерживает ли браузер открытие в новой вкладке
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            
            if (isIOS) {
              // Для iOS используем window.location
              window.location.href = paymentUrl;
            } else {
              // Для Android и других пробуем открыть в новой вкладке
              const newWindow = window.open(paymentUrl, '_blank', 'noopener,noreferrer');
              
              // Если не удалось открыть в новой вкладке, используем текущую
              if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                window.location.href = paymentUrl;
              }
            }
          } else {
            window.location.href = paymentUrl;
          }
          
          onSuccess?.(paymentUrl);
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
    <div className={`tinkoff-payment-mobile ${className}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}
      
      <button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 transform active:scale-95 shadow-lg disabled:shadow-none"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Обработка платежа...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
            </svg>
            <span>Оплатить через Т-Банк</span>
          </>
        )}
      </button>
      
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500">
          Безопасная оплата через Тинькофф Банк
        </p>
        <div className="flex justify-center gap-2 mt-1">
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-xs text-gray-600">Защита данных</span>
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 016 0v2h2V7a5 5 0 00-5-5z"/>
          </svg>
          <span className="text-xs text-gray-600">Безопасно</span>
        </div>
      </div>
    </div>
  );
};

export default TinkoffPaymentMobile;
