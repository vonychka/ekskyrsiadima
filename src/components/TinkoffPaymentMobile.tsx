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

const TinkoffPaymentMobile: React.FC<TinkoffPaymentMobileProps> = ({
  amount,
  orderId,
  description,
  email,
  phone,
  fullName = '',
  onSuccess,
  onError,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl =
        'https://nextjs-boilerplateuexkyesua.onrender.com/api/tinkoff-working';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          orderId,
          description,
          email: email || '',
          phone: phone || '',
          customerKey: (email && email.trim()) ? email : orderId
        }),
      });

      const data = await response.json();
      console.log('Tinkoff response:', data);

      if (!response.ok) {
        throw new Error(data?.Message || data?.message || data?.error || 'Ошибка при инициализации платежа');
      }

      if (data.Success) {
        if (data.PaymentURL) {
          // сохраняем данные для чека
          const paymentData = {
            fullName,
            phone,
            email,
            description,
            amount,
            paymentId: data.PaymentId,
            paymentMethod: 'Tinkoff',
          };

          localStorage.setItem(
            'pendingTicketData',
            JSON.stringify(paymentData)
          );

          onSuccess?.(data.PaymentURL);
          window.location.href = data.PaymentURL;
        } else {
          throw new Error('Не получена ссылка на оплату');
        }
      } else {
        throw new Error(data.Message || 'Ошибка от Тинькофф');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`tinkoff-payment ${className}`}>
      {error && (
        <div className="mb-4 text-sm text-red-600">{error}</div>
      )}

      <button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full rounded-xl bg-blue-600 py-4 text-white font-semibold disabled:opacity-50"
      >
        {isLoading ? 'Переход к оплате…' : 'Оплатить через Т-Банк'}
      </button>
    </div>
  );
};

export default TinkoffPaymentMobile;
