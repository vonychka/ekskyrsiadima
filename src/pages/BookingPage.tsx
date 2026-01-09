import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, Clock } from 'lucide-react';

interface BookingState {
  tourId: string;
  tour: any;
  numberOfPeople: number;
  selectedTariff: string;
  customDate?: string;
  bookingType: 'scheduled' | 'custom';
  finalPrice: number;
  appliedPromoCode: string;
}

const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [bookingData, setBookingData] = useState<BookingState | null>(null);

  useEffect(() => {
    const state = location.state as BookingState;
    if (!state) {
      navigate('/');
      return;
    }
    setBookingData(state);
  }, [location.state, navigate]);

  if (!bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  const handlePayment = () => {
    // Переход на страницу оплаты с данными бронирования
    navigate('/payment', {
      state: {
        tourId: bookingData.tourId,
        tour: bookingData.tour,
        numberOfPeople: bookingData.numberOfPeople,
        selectedTariff: bookingData.selectedTariff,
        customDate: bookingData.customDate,
        bookingType: bookingData.bookingType,
        finalPrice: bookingData.finalPrice,
        appliedPromoCode: bookingData.appliedPromoCode
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Вернуться назад
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Подтверждение бронирования</h1>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Детали бронирования</h2>
          
          <div className="space-y-4">
            {/* Tour Info */}
            <div className="border-b pb-4">
              <h3 className="font-medium text-lg text-gray-900 mb-2">
                {bookingData.tour.title}
              </h3>
              <p className="text-gray-600">{bookingData.tour.description}</p>
            </div>

            {/* Booking Type */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <div className="font-medium">
                    {bookingData.bookingType === 'custom' 
                      ? 'Выбранная дата' 
                      : 'Тип бронирования'
                    }
                  </div>
                  <div className="text-sm text-gray-600">
                    {bookingData.bookingType === 'custom' 
                      ? new Date(bookingData.customDate || '').toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })
                      : 'Стандартное бронирование'
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Number of People */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <div className="font-medium">Количество человек</div>
                  <div className="text-sm text-gray-600">
                    {bookingData.numberOfPeople} {bookingData.numberOfPeople === 1 ? 'человек' : 
                     bookingData.numberOfPeople > 1 && bookingData.numberOfPeople < 5 ? 'человека' : 'человек'}
                  </div>
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <div className="font-medium">Длительность</div>
                  <div className="text-sm text-gray-600">{bookingData.tour.duration}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Стоимость</h2>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                {bookingData.bookingType === 'custom' ? 'Стоимость бронирования:' : 'Стоимость экскурсии:'}
              </span>
              <span className="font-medium">
                {bookingData.finalPrice.toLocaleString('ru-RU')} ₽
              </span>
            </div>
            
            {bookingData.bookingType === 'custom' && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="text-sm text-blue-800">
                  <div className="font-medium mb-2">Важно:</div>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Это бронирование на выбранную дату</li>
                    <li>• Мы свяжемся с вами для подтверждения</li>
                    <li>• При подтверждении - полная стоимость экскурсии</li>
                    <li>• Если невозможно - возврат 300₽</li>
                  </ul>
                </div>
              </div>
            )}
            
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Итого к оплате:</span>
                <span className="text-blue-600">
                  {bookingData.finalPrice.toLocaleString('ru-RU')} ₽
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center">
          <button
            onClick={handlePayment}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors transform hover:scale-[1.02] transition-transform"
          >
            Перейти к оплате
          </button>
          <p className="text-sm text-gray-500 mt-3">
            Безопасная оплата через банковскую карту
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
