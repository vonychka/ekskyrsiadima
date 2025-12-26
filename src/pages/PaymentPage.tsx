import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToursContext } from '../context/ToursContext';
import BankRedirectPayment from '../components/BankRedirectPayment';
import { PaymentSelector } from '../components/PaymentSelector';
import { AlertCircle } from 'lucide-react';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tours } = useToursContext();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [selectedDate, setSelectedDate] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedPromoCode, setAppliedPromoCode] = useState('');
  const [tourId, setTourId] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    // Проверяем, есть ли данные для бронирования при загрузке страницы
    if (!location.state) {
      // Если данных нет (например, обновили страницу), перенаправляем на главную
      navigate('/');
      return;
    }
    
    const { tourId: id, scheduleData: data, totalAmount, appliedPromoCode: promo, discountAmount: discount } = location.state as any;
    
    setTourId(id);
    setTotalPrice(totalAmount);
    setAppliedPromoCode(promo || '');
    setDiscountAmount(discount || 0);
    setDiscountedPrice(totalAmount - (discount || 0));
    
    if (data) {
      setSelectedDate(data.date);
    }
  }, [location.state, navigate]);

  const bookingData = location.state;
  const currentTour = tours.find(t => t.id === tourId);

  const finalPrice = discountedPrice !== null ? discountedPrice : totalPrice;
  
  // Проверка заполнения всех данных
  const isUserDataComplete = () => {
    return fullName.trim() !== '' && 
           phone.trim() !== '' && 
           email.trim() !== '';
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

  if (!currentTour) {
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
                {currentTour.title}
              </button>
            </li>
            <li>/</li>
            <li className="text-gray-900">Оплата</li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">{currentTour.title}</h1>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Описание:</h3>
              <p className="text-gray-600 mb-4">{currentTour.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Длительность:</span>
                  <span className="font-medium">{currentTour.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Категория:</span>
                  <span className="font-medium">{currentTour.category}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Стоимость:</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Стандарт:</span>
                  <span className="font-medium">{currentTour.pricing.standard} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Детский:</span>
                  <span className="font-medium">{currentTour.pricing.child} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Семейный:</span>
                  <span className="font-medium">{currentTour.pricing.family} ₽</span>
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
            <PaymentSelector
              amount={finalPrice}
              description={`Оплата экскурсии: ${currentTour.title}`}
              fullName={fullName}
              email={email}
              phone={phone}
              onPaymentSuccess={(paymentId) => {
                console.log('Payment successful:', paymentId);
              }}
              onPaymentError={(error) => {
                console.error('Payment error:', error);
              }}
            />
          </div>
        )}

        {/* Компонент оплаты или заглушка */}
        {isUserDataComplete() && (
          <BankRedirectPayment
            amount={finalPrice}
            tourDetails={{
              title: currentTour.title,
              date: selectedDate,
              fullName: fullName,
              phone: phone,
              email: email,
              promoCode: appliedPromoCode
            }}
            onPaymentError={(error) => console.error('Bank payment error:', error)}
          />
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
