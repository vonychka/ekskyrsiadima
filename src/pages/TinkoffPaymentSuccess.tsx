import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Home } from 'lucide-react';

export const TinkoffPaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState<string>('');

  useEffect(() => {
    const PaymentIdParam = searchParams.get('PaymentId'); // Правильный параметр Тинькофф
    const OrderIdParam = searchParams.get('OrderId'); // Дополнительно получаем OrderId
    if (PaymentIdParam) {
      setOrderId(PaymentIdParam);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Оплата прошла успешно!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Ваш платеж успешно обработан. 
          {orderId && (
            <span className="block mt-2">
              Номер заказа: <strong>{orderId}</strong>
            </span>
          )}
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4" />
            Вернуться на главную
          </button>
        </div>
        
        <div className="mt-6 text-xs text-gray-500">
          Если у вас возникли вопросы, свяжитесь с нашей службой поддержки.
        </div>
      </div>
    </div>
  );
};
