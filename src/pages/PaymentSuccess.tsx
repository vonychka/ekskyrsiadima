import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Mail, Download } from 'lucide-react';
import { sendTicketEmail, sendAdminNotification } from '../utils/emailService';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSendingTicket, setIsSendingTicket] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);

  useEffect(() => {
    // Проверяем, есть ли параметры платежа в URL
    const params = new URLSearchParams(location.search);
    const orderId = params.get('orderId');
    const amount = params.get('amount');
    const email = params.get('email');

    if (!orderId) {
      // Если нет orderId, перенаправляем на главную
      navigate('/');
      return;
    }

    // Отправляем билет пользователю и уведомление администратору
    if (email && !ticketSent) {
      sendTicketToUser(orderId, amount, email);
    }
  }, [location.search, navigate, ticketSent]);

  const sendTicketToUser = async (orderId: string | null, amount: string | null, email: string | null) => {
    if (!email || !orderId) return;

    setIsSendingTicket(true);
    
    try {
      // Получаем информацию о платеже из sessionStorage
      const paymentInfo = sessionStorage.getItem('lastPaymentInfo');
      const bookingData = paymentInfo ? JSON.parse(paymentInfo) : {};

      const ticketData = {
        fullName: bookingData.fullName || 'Клиент',
        phone: bookingData.phone || '',
        email: email,
        tourTitle: bookingData.description || 'Экскурсия',
        tourDate: bookingData.tourDate || new Date().toLocaleDateString('ru-RU'),
        tourTime: bookingData.tourTime || '12:00',
        numberOfPeople: bookingData.numberOfPeople || 1,
        selectedTariff: bookingData.selectedTariff || 'standard',
        finalPrice: amount || bookingData.amount || '0',
        amount: amount || bookingData.amount || '0',
        orderId: orderId,
        paymentDate: new Date().toLocaleDateString('ru-RU'),
        paymentTime: new Date().toLocaleTimeString('ru-RU')
      };

      // Отправляем билет клиенту
      const ticketResult = await sendTicketEmail(ticketData);
      
      // Отправляем уведомление администратору
      const adminResult = await sendAdminNotification({
        ...ticketData,
        paymentMethod: bookingData.paymentMethod || 'card'
      });
      
      if (ticketResult.success && adminResult.success) {
        setTicketSent(true);
        console.log('Билет успешно отправлен клиенту и уведомление администратору:', email);
      } else {
        console.error('Ошибка отправки:', ticketResult.message, adminResult.message);
      }
    } catch (error) {
      console.error('Ошибка при отправке:', error);
    } finally {
      setIsSendingTicket(false);
    }
  };

  const params = new URLSearchParams(location.search);
  const orderId = params.get('orderId');
  const amount = params.get('amount');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          {/* Иконка успеха */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          {/* Заголовок */}
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Оплата прошла успешно!
          </h1>

          {/* Подтверждение */}
          <p className="text-gray-600 mb-6">
            Ваш платеж на сумму <span className="font-semibold text-green-600">{amount} ₽</span> успешно принят.
          </p>

          {/* Номер заказа */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">Номер заказа</p>
            <p className="font-mono font-semibold text-gray-800">{orderId}</p>
          </div>

          {/* Статус билета */}
          <div className="mb-8">
            {isSendingTicket ? (
              <div className="flex items-center justify-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span>Отправляем билет на email...</span>
              </div>
            ) : ticketSent ? (
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <Mail className="w-5 h-5" />
                <span>Билет отправлен на вашу почту</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2 text-gray-500">
                <Mail className="w-5 h-5" />
                <span>Билет будет отправлен на email</span>
              </div>
            )}
          </div>

          {/* Информация */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">Что дальше?</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Билет отправлен на ваш email</li>
              <li>• За 24 часа до экскурсии пришлем напоминание</li>
              <li>• При необходимости можно отменить за 48 часов</li>
            </ul>
          </div>

          {/* Кнопки */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Вернуться на главную
            </button>
            
            <button
              onClick={() => window.print()}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Сохранить как PDF</span>
            </button>
          </div>

          {/* Поддержка */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Если билет не пришел в течение 15 минут, проверьте папку "Спам" или напишите нам: 
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

export default PaymentSuccess;
