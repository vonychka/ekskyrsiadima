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

  
    

};

export default YandexPayment;