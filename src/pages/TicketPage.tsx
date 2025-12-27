import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToursContext } from '../context/ToursContext';
import { CheckCircle, Download, Share2, Home } from 'lucide-react';
import { sendPromoCodeEmail, sendTicketEmail } from '../utils/emailService';
import { sendTicketEmailWeb3Forms } from '../utils/emailWeb3Forms';
import { sendToTelegram } from '../utils/telegramBot';

const TicketPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tours } = useToursContext();

  useEffect(() => {
    window.scrollTo(0, 0);
    
    console.log('=== TICKET PAGE useEffect ЗАПУЩЕН ===');
    console.log('URL search:', location.search);
    
    // Проверяем если пришли с успешной оплаты Тинькофф
    const urlParams = new URLSearchParams(location.search);
    const PaymentId = urlParams.get('PaymentId'); // Правильный параметр Тинькофф
    const Status = urlParams.get('Status'); // Правильный параметр Тинькофф
    const OrderId = urlParams.get('OrderId'); // Дополнительно получаем OrderId
    
    console.log('URL параметры:', { PaymentId, Status, OrderId });
    
    if (Status === 'CONFIRMED' || Status === 'AUTHORIZED' || PaymentId) {
      console.log('Обнаружена успешная оплата, загружаем данные...');
      
      // Загружаем данные из localStorage если есть
      const pendingData = localStorage.getItem('pendingTicketData');
      console.log('Данные в localStorage:', pendingData);
      
      if (pendingData) {
        const data = JSON.parse(pendingData);
        console.log('Распарсенные данные:', data);
        
        setFullName(data.fullName || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setTicketGenerated(true);
        
        // Отправляем билет на email через Web3Forms
        const ticketData = {
          ...data,
          paymentId: PaymentId || data.paymentId,
          paymentMethod: 'Тинькофф'
        };
        
        console.log('Отправка билета после успешной оплаты Тинькофф...');
        sendTicketEmailWeb3Forms(ticketData);
        
        // Отправляем данные администратору в Telegram
        console.log('Отправка данных администратору в Telegram...');
        sendToTelegram(ticketData).then(result => {
          console.log('Результат отправки в Telegram:', result);
        }).catch(error => {
          console.error('Ошибка отправки в Telegram:', error);
        });
        
        // Очищаем после использования
        localStorage.removeItem('pendingTicketData');
      } else {
        console.log('❌ Нет данных в localStorage!');
      }
    } else {
      console.log('❌ Не обнаружено успешной оплаты');
    }
  }, [location.search]);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [ticketGenerated, setTicketGenerated] = useState(false);

  const bookingData = location.state;
  const tourId = bookingData?.tourId;
  const tour = tours.find(t => t.id === tourId);

  const getTourDate = () => {
    if (bookingData && bookingData.scheduleData) {
      return new Date(bookingData.scheduleData.date).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    return '';
  };

  const getTourTime = () => {
    if (bookingData && bookingData.scheduleData) {
      return bookingData.scheduleData.time;
    }
    return '';
  };

  const handleGenerateTicket = async () => {
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    setIsGenerating(true);
    
    // Отправляем email с данными о промокоде
    try {
      const emailData = {
        fullName,
        phone,
        email,
        tourTitle: tour?.title || '',
        tourDate: getTourDate(),
        tourTime: getTourTime(),
        numberOfPeople: bookingData?.numberOfPeople || 1,
        selectedTariff: bookingData?.selectedTariff || 'standard',
        finalPrice: bookingData?.totalAmount || 0,
        promoCode: bookingData?.appliedPromoCode || '',
        discountAmount: bookingData?.discountAmount || 0
      };
      
      const emailResult = await sendPromoCodeEmail(emailData);
      
      if (emailResult.success) {
        console.log('Email о промокоде успешно отправлен');
      } else {
        console.error('Ошибка отправки email:', emailResult.message);
        // Не прерываем процесс генерации билета даже если email не отправился
      }
      
      // Отправляем билет пользователю
      const ticketResult = await sendTicketEmail(emailData);
      
      if (ticketResult.success) {
        console.log('Билет успешно отправлен пользователю');
      } else {
        console.error('Ошибка отправки билета пользователю:', ticketResult.message);
        // Не прерываем процесс генерации билета даже если email не отправился
      }
    } catch (error) {
      console.error('Ошибка при отправке email:', error);
      // Не прерываем процесс генерации билета даже если email не отправился
    }
    
    // Имитация генерации билета
    setTimeout(() => {
      setIsGenerating(false);
      setTicketGenerated(true);
    }, 2000);
  };

  const handleDownload = () => {
    // Здесь можно добавить логику скачивания билета
    alert('Билет скачивается...');
  };

  const handleShare = () => {
    // Здесь можно добавить логику поделиться билетом
    alert('Ссылка на билет скопирована!');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (!bookingData || !tourId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Ошибка</h1>
          <p className="text-gray-600 mb-6">Данные для бронирования не найдены</p>
          <button
            onClick={handleGoHome}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
          <h1 className="text-3xl font-bold mb-2">🎉 Ваш бесплатный билет ЖДЕТ!</h1>
          <p className="text-lg opacity-90">Вы получили бесплатный доступ к экскурсии</p>
        </div>

        <div className="p-6">
          {/* Tour Information */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Информация об экскурсии</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Название:</h3>
                <p className="text-gray-900">{tour?.title}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Дата и время:</h3>
                <p className="text-gray-900">{getTourDate()} в {getTourTime()}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Тариф:</h3>
                <p className="text-gray-900">
                  {bookingData.selectedTariff === 'standard' && 'Стандартный'}
                  {bookingData.selectedTariff === 'child' && 'Детский'}
                  {bookingData.selectedTariff === 'family' && 'Семейный'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Количество человек:</h3>
                <p className="text-gray-900">{bookingData.numberOfPeople}</p>
              </div>
              <div className="md:col-span-2">
                <h3 className="font-semibold text-gray-700 mb-2">📍 Место встречи:</h3>
                <p className="text-gray-900 font-medium">{tour?.address || 'Большая Покровская улица, 1/1'}</p>
                <p className="text-gray-600 text-sm mt-1">Пожалуйста, приходите за 15 минут до начала экскурсии</p>
              </div>
            </div>
          </div>

          {/* User Data Form */}
          {!ticketGenerated && (
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Ваши данные</h2>
              <p className="text-gray-600 mb-6">Пожалуйста, укажите ваши данные для генерации билета</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ФИО *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Введите ваше ФИО"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Телефон *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerateTicket}
                disabled={isGenerating}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors mt-6"
              >
                {isGenerating ? 'Генерируем билет...' : 'Сгенерировать билет'}
              </button>
            </div>
          )}

          {/* Ticket Generated */}
          {ticketGenerated && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
              <div className="text-center mb-6">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-800 mb-2">Билет успешно сгенерирован!</h2>
                <p className="text-green-700">Ваш бесплатный билет готов</p>
              </div>

              <div className="bg-white rounded-lg p-4 mb-6 border-2 border-dashed border-green-300">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">🎫 БИЛЕТ</div>
                  <div className="text-lg font-semibold mb-2">{tour?.title}</div>
                  <div className="text-gray-600 mb-1">{getTourDate()} в {getTourTime()}</div>
                  <div className="text-gray-600 mb-1">{fullName}</div>
                  <div className="text-gray-600 mb-1">{phone}</div>
                  <div className="text-gray-600 mb-1 font-medium">📍 {tour?.address}</div>
                  <div className="text-sm text-gray-500 mb-1">Подходите за 15 минут до начала</div>
                  <div className="text-sm text-gray-500">ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Скачать билет
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Поделиться
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleGoHome}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Вернуться на главную
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketPage;
