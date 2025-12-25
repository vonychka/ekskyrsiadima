import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw, Phone } from 'lucide-react';

const PaymentError = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Проверяем, есть ли параметры платежа в URL
    const params = new URLSearchParams(location.search);
    const orderId = params.get('orderId');

    if (!orderId) {
      // Если нет orderId, перенаправляем на главную
      navigate('/');
      return;
    }
  }, [location.search, navigate]);

  const params = new URLSearchParams(location.search);
  const orderId = params.get('orderId');

  const handleRetryPayment = () => {
    // Возвращаемся на страницу оплаты для повторной попытки
    navigate('/payment');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          {/* Иконка ошибки */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>

          {/* Заголовок */}
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Ошибка оплаты
          </h1>

          {/* Сообщение */}
          <p className="text-gray-600 mb-6">
            К сожалению, не удалось обработать ваш платеж. Пожалуйста, попробуйте еще раз или свяжитесь с поддержкой.
          </p>

          {/* Номер заказа */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">Номер заказа</p>
            <p className="font-mono font-semibold text-gray-800">{orderId}</p>
          </div>

          {/* Возможные причины */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-2">Возможные причины:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Недостаточно средств на карте</li>
              <li>• Превышен лимит операций</li>
              <li>• Технические проблемы банка</li>
              <li>• Неверные данные карты</li>
            </ul>
          </div>

          {/* Кнопки */}
          <div className="space-y-3">
            <button
              onClick={handleRetryPayment}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Попробовать еще раз</span>
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Вернуться на главную
            </button>
          </div>

          {/* Поддержка */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <Phone className="w-4 h-4" />
              <span className="text-sm">Нужна помощь? </span>
              <a href="tel:+79991408094" className="text-blue-600 hover:underline font-semibold">
                +7 (999) 140-80-94
              </a>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Или напишите: 
              <a href="mailto:support@ekskyrsiadima.ru" className="text-blue-600 hover:underline ml-1">
                support@ekskyrsiadima.ru
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentError;
