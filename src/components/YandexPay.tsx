import React, { useState } from 'react';
import { CreditCard, AlertCircle, CheckCircle } from 'lucide-react';

interface YandexPayProps {
  amount: number;
  description: string;
  fullName: string;
  email: string;
  phone: string;
  onPaymentSuccess?: (paymentId: string) => void;
  onPaymentError?: (error: string) => void;
}

export const YandexPay: React.FC<YandexPayProps> = ({
  amount,
  description,
  fullName,
  email,
  phone,
  onPaymentSuccess,
  onPaymentError
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const orderId = `yandex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await fetch('/api/yandex-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          description,
          orderId,
          fullName,
          email,
          phone
        })
      });

      const result = await response.json();

      if (result.success && result.paymentUrl) {
        // Сохраняем данные билета в localStorage для использования после оплаты
        const ticketData = {
          orderId,
          fullName,
          email,
          phone,
          description,
          amount,
          paymentMethod: 'yandex-pay',
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('pendingTicketData', JSON.stringify(ticketData));
        
        // Перенаправляем на страницу оплаты Яндекс Пей
        window.location.href = result.paymentUrl;
        
        if (onPaymentSuccess) {
          onPaymentSuccess(result.paymentId);
        }
      } else {
        const errorMessage = result.error || 'Ошибка создания платежа Яндекс Пей';
        setError(errorMessage);
        if (onPaymentError) {
          onPaymentError(errorMessage);
        }
      }
    } catch (err) {
      const errorMessage = 'Ошибка сети. Попробуйте еще раз.';
      setError(errorMessage);
      if (onPaymentError) {
        onPaymentError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="yandex-pay-container">
      <div className="payment-method-header">
        <CreditCard className="w-6 h-6 text-yellow-500" />
        <h3 className="text-lg font-semibold">Яндекс Пей</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Быстрая и безопасная оплата через Яндекс Пей
      </p>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-700">Платеж успешно создан</span>
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            Создание платежа...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Оплатить через Яндекс Пей
          </>
        )}
      </button>

      <div className="mt-4 text-xs text-gray-500">
        <p>• Оплата банковской картой</p>
        <p>• Через кошелек Яндекс Пей</p>
        <p>• SberPay и другие способы</p>
      </div>
    </div>
  );
};
