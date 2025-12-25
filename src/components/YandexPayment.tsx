// src/components/YandexPayment.tsx
import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface YandexPaymentProps {
  amount: number;
  orderId?: string;
  email: string;
  phone: string;
  description: string;
  onError?: (error: string) => void;
}

const YandexPayment: React.FC<YandexPaymentProps> = ({
  amount,
  orderId = `order-${Date.now()}`,
  email,
  phone,
  description,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initPayment = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError('');

    try {
      // Самый простой вариант - переадресация на ЮMoney (бывшие Яндекс Деньги)
      const paymentUrl = `https://yoomoney.ru/quickpay/shop-widget?writer=seller&targets=${encodeURIComponent(description)}&targets-hint=&default-sum=${amount}&button-text=11&payment-type-choice=on&mobile-payment-type-choice=on&comment=${orderId}&hint=&successURL=${encodeURIComponent(`http://localhost:5173/payment/success?orderId=${orderId}&amount=${amount}&email=${encodeURIComponent(email)}`)}&failURL=${encodeURIComponent(`http://localhost:5173/payment/error?orderId=${orderId}`)}&quickpay=shop&account=4100116739925364`; // Ваш номер кошелька ЮMoney
      
      // Сохраняем информацию о платеже
      sessionStorage.setItem('lastPaymentInfo', JSON.stringify({ 
        orderId, 
        amount, 
        description, 
        email, 
        phone,
        timestamp: new Date().toISOString() 
      }));
      
      // Переадресация на страницу оплаты
      window.location.href = paymentUrl;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка инициализации платежа';
      console.error('Payment error:', errorMessage, err);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={initPayment}
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Обработка...</span>
          </>
        ) : (
          <>
            <span>Оплатить через ЮKassa</span>
          </>
        )}
      </button>
      
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Безопасная оплата через ЮKassa
        </p>
        <div className="flex items-center justify-center space-x-2 mt-2">
          <span className="text-gray-400 text-xs">VISA</span>
          <span className="text-gray-400 text-xs">MasterCard</span>
          <span className="text-gray-400 text-xs">МИР</span>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default YandexPayment;