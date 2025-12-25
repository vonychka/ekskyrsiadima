import React, { useEffect } from 'react';

interface YandexPayButtonProps {
  amount: number;
  description: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const YandexPayButton: React.FC<YandexPayButtonProps> = ({
  amount,
  description,
  onSuccess,
  onError
}) => {
  useEffect(() => {
    // Загружаем скрипт Яндекс Пей
    const script = document.createElement('script');
    script.src = 'https://pay.yandex.ru/sdk/v1/pay.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      // Инициализируем кнопку после загрузки скрипта
      if (window.YandexPay) {
        const paymentButton = window.YandexPay.createPaymentButton({
          env: 'production', // или 'sandbox' для тестов
          currency: 'RUB',
          amount: amount * 100, // в копейках
          description: description,
          merchant: {
            id: 'YOUR_MERCHANT_ID', // Нужно получить в Яндекс Пей
            name: 'Экскурсии'
          },
          onPaymentSuccess: () => {
            console.log('Payment successful');
            onSuccess?.();
          },
          onPaymentError: (error: any) => {
            console.error('Payment error:', error);
            onError?.('Ошибка оплаты');
          }
        });

        // Рендерим кнопку
        const container = document.getElementById('yandex-pay-button');
        if (container) {
          container.innerHTML = '';
          paymentButton.render(container);
        }
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [amount, description, onSuccess, onError]);

  return (
    <div className="flex justify-center">
      <div id="yandex-pay-button" className="yandex-pay-button-container"></div>
    </div>
  );
};

// Добавляем типы для window.YandexPay
declare global {
  interface Window {
    YandexPay?: {
      createPaymentButton: (config: any) => any;
    };
  }
}

export default YandexPayButton;
