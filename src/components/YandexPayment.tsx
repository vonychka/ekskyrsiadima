// src/components/YandexPayment.tsx
import React, { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface YandexPaymentProps {
  amount: number;
  orderId?: string;
  email: string;
  phone: string;
  description: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

// Backend endpoint that creates Yandex payment (local server)
const CREATE_PAYMENT_API = 'http://localhost:3001/api/yandex/create-payment';

// Для продакшена на хостинге используем API endpoint на том же домене
const PROD_PAYMENT_API = 'https://ekskyrsiadima.ru:3002/api/yandex/create-payment';

// Yandex Pay API Key
const YANDEX_PAY_API_KEY = '19c1e757-cf1e-4789-b576-48c30474c6d8';

// If you don't want to run any server, you can set a static payment link in Vite env:
// VITE_PAYMENT_LINK=https://example.com/pay
// The component will redirect the user to that URL with `orderId` and `amount` query params.
const STATIC_PAYMENT_LINK = (import.meta as any).env?.VITE_PAYMENT_LINK || '';

const YandexPayment: React.FC<YandexPaymentProps> = ({
  amount,
  orderId = `order-${Date.now()}`,
  email,
  phone,
  description,
  onSuccess,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Note: This component now creates a payment in Yandex.Pay directly (test key).
  // For production keep Merchant API Key on the server and use a backend endpoint.

  const initPayment = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError('');

    // Client-only shortcut: redirect to a static payment link (no server, no secret keys)
    if (STATIC_PAYMENT_LINK) {
      try {
        const url = new URL(STATIC_PAYMENT_LINK);
        url.searchParams.set('orderId', orderId);
        url.searchParams.set('amount', String(Math.round(amount * 100))); // kopecks
        url.searchParams.set('description', description || '');
        window.location.href = url.toString();
        return;
      } finally {
        setIsLoading(false);
      }
    }

    // Определяем, где мы запущены: localhost или продакшен
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    try {
      let result;
      
      if (isLocalhost) {
        // На localhost используем локальный API сервер
        const resp = await fetch(CREATE_PAYMENT_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // send in kopecks
            orderId,
            description,
            email,
            phone: phone.replace(/\D/g, ''),
            apiKey: YANDEX_PAY_API_KEY
          })
        });
        
        result = resp.headers.get('content-type')?.includes('application/json') ? await resp.json() : { raw: await resp.text() };
        console.log('Backend / Yandex response:', resp.status, result);

        if (!resp.ok) {
          const msg = result?.message || result?.error || result?.description || JSON.stringify(result);
          throw new Error(`Ошибка создания платежа: ${msg}`);
        }
      } else {
        // На продакшене используем PHP API endpoint на хостинге
        const resp = await fetch(PROD_PAYMENT_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // send in kopecks
            orderId,
            description,
            email,
            phone: phone.replace(/\D/g, ''),
            apiKey: YANDEX_PAY_API_KEY
          })
        });
        
        result = resp.headers.get('content-type')?.includes('application/json') ? await resp.json() : { raw: await resp.text() };
        console.log('Production API response:', resp.status, result);

        if (!resp.ok) {
          const msg = result?.message || result?.error || result?.description || JSON.stringify(result);
          throw new Error(`Ошибка создания платежа: ${msg}`);
        }
      }

      const paymentUrl = result?.data?.paymentUrl || result?.paymentUrl || result?.confirmation?.confirmation_url || result?.confirmation?.url || result?.payment_url || result?.confirmation?.confirmationUrl;
      if (!paymentUrl) {
        console.error('Payment response structure:', result);
        throw new Error('Не получен URL для оплаты. Проверьте ответ от API.');
      }

      sessionStorage.setItem('lastPaymentInfo', JSON.stringify({ orderId, amount, description, timestamp: new Date().toISOString() }));
      window.location.href = paymentUrl;
      onSuccess?.(result?.data?.orderId || result?.orderId || result?.id || '');

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
    <div className="space-y-4">
      <button
        onClick={initPayment}
        disabled={isLoading}
        className={`w-full flex items-center justify-center px-6 py-3 rounded-md text-white font-medium ${
          isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
            Обработка...
          </>
        ) : (
          'Оплатить через Яндекс Пей'
        )}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default YandexPayment;