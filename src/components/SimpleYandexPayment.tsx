import React, { useState } from 'react';

interface SimpleYandexPaymentProps {
  amount: number;
  orderId: string;
  description: string;
  email: string;
  phone: string;
  onError?: (error: string) => void;
}

const SimpleYandexPayment: React.FC<SimpleYandexPaymentProps> = ({
  amount,
  orderId,
  description,
  email,
  phone,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    
    try {
      // Создаем простую форму для отправки данных
      const formData = new FormData();
      formData.append('shopId', 'YOUR_SHOP_ID'); // Нужно получить в Яндекс Пей
      formData.append('scid', 'YOUR_SCID'); // Нужно получить в Яндекс Пей
      formData.append('sum', amount.toString());
      formData.append('customerNumber', orderId);
      formData.append('cps_email', email);
      formData.append('cps_phone', phone);
      formData.append('orderDetails', description);
      
      // Отправляем на Яндекс Кассу (старый метод, но работает)
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://money.yandex.ru/eshop.xml';
      
      Object.entries({
        shopId: 'YOUR_SHOP_ID',
        scid: 'YOUR_SCID',
        sum: amount.toString(),
        customerNumber: orderId,
        cps_email: email,
        cps_phone: phone,
        orderDetails: description,
        shopSuccessURL: `https://ekskyrsiadima.ru/payment/success?orderId=${orderId}`,
        shopFailURL: `https://ekskyrsiadima.ru/payment/error?orderId=${orderId}`
      }).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });
      
      document.body.appendChild(form);
      form.submit();
      
    } catch (error) {
      console.error('Payment error:', error);
      onError?.('Ошибка инициализации платежа');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
            <span>Обработка...</span>
          </>
        ) : (
          <>
            <span className="text-xl">💳</span>
            <span>Оплатить через Яндекс Пей</span>
          </>
        )}
      </button>
      
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Безопасная оплата через Яндекс Пей
        </p>
        <div className="flex items-center justify-center space-x-2 mt-2">
          <span className="text-gray-400 text-xs">VISA</span>
          <span className="text-gray-400 text-xs">MasterCard</span>
          <span className="text-gray-400 text-xs">МИР</span>
        </div>
      </div>
    </div>
  );
};

export default SimpleYandexPayment;
