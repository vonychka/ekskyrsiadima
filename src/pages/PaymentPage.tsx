import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToursContext } from '../context/ToursContext';
import BankRedirectPayment from '../components/BankRedirectPayment';
import SBPPayment from '../components/SBPPayment';
import { CheckCircle, AlertCircle, CreditCard, Smartphone } from 'lucide-react';
import { sendBookingEmail, sendTicketEmail } from '../utils/emailService';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tours, schedules } = useToursContext();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [selectedDate, setSelectedDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed' | 'error'>('pending');
  const [showNotification, setShowNotification] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'sbp'>('sbp'); // По умолчанию СБП
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedPromoCode, setAppliedPromoCode] = useState('');
  const [selectedTariff, setSelectedTariff] = useState('standard');
  const [tourId, setTourId] = useState('');
  const [scheduleId, setScheduleId] = useState('');
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [numberOfPeople, setNumberOfPeople] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    // Проверяем, есть ли данные для бронирования при загрузке страницы
    if (!location.state) {
      // Если данных нет (например, обновили страницу), перенаправляем на главную
      navigate('/');
      return;
    }
    
    const { tourId, scheduleId, scheduleData, numberOfPeople, selectedTariff: tariff, totalAmount, appliedPromoCode, discountAmount } = location.state as any;
    
    setTourId(tourId);
    setScheduleId(scheduleId);
    setScheduleData(scheduleData);
    setNumberOfPeople(numberOfPeople);
    setSelectedTariff(tariff || 'standard');
    setTotalPrice(totalAmount);
    setAppliedPromoCode(appliedPromoCode || '');
    setDiscountAmount(discountAmount || 0);
    setDiscountedPrice(totalAmount - (discountAmount || 0));
    
    const tour = tours.find(t => t.id === tourId);
    if (scheduleId) {
      const selectedSchedule = schedules.find((s: any) => s.id === scheduleId);
      if (selectedSchedule) {
        setSelectedDate(selectedSchedule.date);
      }
    }
  }, [location.state, tours, navigate]);

  const bookingData = location.state;
  const tour = tours.find(t => t.id === tourId);

  const finalPrice = discountedPrice !== null ? discountedPrice : totalPrice;
  
  const getTourDate = () => {
    if (bookingData && bookingData.scheduleData) {
      // Используем scheduleData из состояния навигации
      const schedule = bookingData.scheduleData;
      return schedule.date;
    }
    if (bookingData && bookingData.scheduleId) {
      const selectedSchedule = schedules.find((s: any) => s.id === bookingData.scheduleId);
      if (selectedSchedule) {
        return selectedSchedule.date;
      }
    }
    return '';
  };

  const getTourTime = () => {
    if (bookingData && bookingData.scheduleData) {
      // Используем scheduleData из состояния навигации
      const schedule = bookingData.scheduleData;
      return schedule.time;
    }
    if (bookingData && bookingData.scheduleId) {
      const selectedSchedule = schedules.find((s: any) => s.id === bookingData.scheduleId);
      if (selectedSchedule) {
        return selectedSchedule.time;
      }
    }
    return '';
  };

  // Проверка заполнения всех данных
  const isUserDataComplete = () => {
    return fullName.trim() !== '' && 
           phone.trim() !== '' && 
           email.trim() !== '';
  };

  const handlePaymentComplete = (paymentId?: string) => {
    setPaymentStatus('processing');
    
    // Отправляем email с данными о бронировании
    const sendBookingEmailAsync = async () => {
      try {
        const emailData = {
          fullName,
          phone,
          email,
          tourTitle: tour?.title || '',
          tourDate: getTourDate(),
          tourTime: getTourTime(),
          numberOfPeople,
          selectedTariff,
          finalPrice,
          promoCode: appliedPromoCode,
          discountAmount,
          paymentMethod: paymentMethod === 'bank' ? 'Банковский перевод' : 'СБП',
          paymentId: paymentId || 'N/A'
        };
        
        const emailResult = await sendBookingEmail(emailData);
        
        if (emailResult.success) {
          console.log('Email о бронировании успешно отправлен');
        } else {
          console.error('Ошибка отправки email:', emailResult.message);
        }
        
        // Отправляем билет пользователю
        const ticketResult = await sendTicketEmail(emailData);
        
        if (ticketResult.success) {
          console.log('Билет успешно отправлен пользователю');
        } else {
          console.error('Ошибка отправки билета пользователю:', ticketResult.message);
        }
      } catch (error) {
        console.error('Ошибка при отправке email:', error);
      }
    };
    
    // Запускаем отправку email асинхронно, не дожидаясь завершения
    sendBookingEmailAsync();
    
    setTimeout(() => {
      setPaymentStatus('completed');
      setShowNotification(true);
      
      setTimeout(() => {
        navigate('/payment/success', {
          state: {
            ...bookingData,
            paymentId: paymentId
          }
        });
      }, 3000);
    }, 2000);
  };


  if (!bookingData || !tourId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Экскурсия не найдена</h1>
          <p className="text-gray-600 mb-6">Пожалуйста, выберите экскурсию и вернитесь на страницу оплаты</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Экскурсия не найдена</h1>
          <button 
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li>
              <button 
                onClick={() => navigate('/')}
                className="hover:text-blue-600"
              >
                Главная
              </button>
            </li>
            <li>/</li>
            <li>
              <button 
                onClick={() => navigate(`/tour/${tourId}`)}
                className="hover:text-blue-600"
              >
                {tour.title}
              </button>
            </li>
            <li>/</li>
            <li className="text-gray-900">Оплата</li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">{tour.title}</h1>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Описание:</h3>
              <p className="text-gray-600 mb-4">{tour.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Длительность:</span>
                  <span className="font-medium">{tour.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Категория:</span>
                  <span className="font-medium">{tour.category}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Стоимость:</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Стандарт:</span>
                  <span className="font-medium">{tour.pricing.standard} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Детский:</span>
                  <span className="font-medium">{tour.pricing.child} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Семейный:</span>
                  <span className="font-medium">{tour.pricing.family} ₽</span>
                </div>
              </div>
              
              <div className="border-t pt-2">
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Скидка по промокоду:</span>
                    <span className="font-medium text-green-600">-{discountAmount.toLocaleString('ru-RU')} ₽</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Итого:</span>
                  <span className="text-2xl font-bold text-green-600">{finalPrice} ₽</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Детали бронирования</h2>
          
          <form>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600" htmlFor="fullName">ФИО:</label>
                <input 
                  type="text" 
                  id="fullName" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  className="w-full p-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600" htmlFor="phone">Телефон:</label>
                <input 
                  type="tel" 
                  id="phone" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  className="w-full p-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600" htmlFor="email">Email:</label>
                <input 
                  type="email" 
                  id="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full p-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </form>
        </div>

        {!isUserDataComplete() && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-600 mr-3" />
              <h4 className="text-lg font-bold text-yellow-800">Заполните все данные</h4>
            </div>
            <p className="text-yellow-700">
              Пожалуйста, заполните все поля в разделе "Детали бронирования" (ФИО, телефон, email), чтобы выбрать способ оплаты.
            </p>
          </div>
        )}

        {isUserDataComplete() && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Способ оплаты</h2>
            
            <div className="w-full">
              <div className="p-6 rounded-lg border-2 border-blue-500 bg-blue-50 text-center">
                <div className="flex flex-col items-center space-y-3">
                  <CreditCard className="w-8 h-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-lg">Банковская карта</h3>
                    <p className="text-sm text-gray-600">Оплата через безопасный шлюз Тинькофф</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Компонент оплаты или заглушка */}
        {isUserDataComplete() && (
          <BankRedirectPayment
            amount={finalPrice}
            tourDetails={{
              title: tour.title,
              date: selectedDate,
              fullName: fullName,
              phone: phone,
              email: email,
              promoCode: appliedPromoCode
            }}
            onPaymentComplete={handlePaymentComplete}
            onPaymentError={(error) => console.error('Bank payment error:', error)}
          />
        )}
        
        {showNotification && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            paymentStatus === 'completed' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            <div className="flex items-center space-x-2">
              {paymentStatus === 'completed' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>
                {paymentStatus === 'completed' 
                  ? 'Платеж успешно обработан! Перенаправление...' 
                  : 'Ошибка при обработке платежа. Попробуйте еще раз.'
                }
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Важная информация:</h3>
          <ul className="text-sm space-y-1 text-gray-700">
            <li>• После оплаты вы получите подтверждение на email</li>
            <li>• За 24 часа до экскурсии мы пришлем напоминание</li>
            <li>• При необходимости можно отменить бронирование за 48 часов</li>
            <li>• По вопросам оплаты: +7 (999) 140-80-94</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
