import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, RefreshCw, Home } from 'lucide-react';

export const TinkoffPaymentError: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState<string>('');

  useEffect(() => {
    const PaymentIdParam = searchParams.get('PaymentId'); // Правильный параметр Тинькофф
    if (PaymentIdParam) {
      setOrderId(PaymentIdParam);
    }
  }, [searchParams]);

  const handleRetry = () => {
    // Возвращаемся на страницу оплаты для повторной попытки
    navigate('/payment');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <XCircle className="w-16 h-16 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Оплата не прошла
        </h1>
        
        <p className="text-gray-600 mb-6">
          К сожалению, не удалось обработать ваш платеж. 
          {orderId && (
            <span className="block mt-2">
              Номер заказа: <strong>{orderId}</strong>
            </span>
          )}
        </p>
        
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Попробовать снова
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4" />
            Вернуться на главную
          </button>
        </div>
        
        <div className="mt-6 text-xs text-gray-500">
          Если проблема повторяется, свяжитесь с нашей службой поддержки или попробуйте другой способ оплаты.
        </div>
      </div>
    </div>
  );
};
