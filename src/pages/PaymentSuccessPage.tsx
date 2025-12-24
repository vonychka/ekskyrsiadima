import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Home, Phone, Mail, MessageSquare, MapPin } from 'lucide-react';
import { useToursContext } from '../context/ToursContext';

const PaymentSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tours } = useToursContext();

  const bookingData = location.state;
  const tourId = bookingData?.tourId;
  const tour = tours.find(t => t.id === tourId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Главный контейнер */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-center">
            {/* Иконка подтверждения */}
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-12 h-12 text-blue-600" />
            </div>
            
            {/* Основной текст */}
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Спасибо за оплату!</h1>
            <p className="text-gray-600 text-lg mb-6">
              С вами скоро свяжутся чтобы сообщить место или детали экскурсии
            </p>
            
            {/* Контактная информация */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Phone className="w-5 h-5 text-blue-600" />
                <Mail className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800 font-medium">Наши контакты</span>
              </div>
              <div className="space-y-2">
                <p className="text-blue-700 flex items-center justify-center">
                  <Phone className="w-4 h-4 mr-2" />
                  +7 (999) 140-80-94
                </p>
                <p className="text-blue-700 flex items-center justify-center">
                  <Mail className="w-4 h-4 mr-2" />
                  rmok0082@gmail.com
                </p>
                <p className="text-blue-600 text-sm text-center mt-2">
                  Мы свяжемся с вами по указанным данным в ближайшее время
                </p>
              </div>
            </div>
            
            {/* Информация о билете */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-gray-600 text-sm">
                💡 <strong>Ваш билет:</strong> это сам перевод с текстом, который вы скопировали. 
                Пожалуйста, сохраните его до нашей связи.
              </p>
              {tour && (
                <div className="mt-4">
                  <p className="text-gray-600 text-sm">
                    <MapPin className="w-4 h-4 mr-2" />
                    Адрес экскурсии: {tour.address}
                  </p>
                </div>
              )}
            </div>
            
            {/* Кнопка возврата */}
            <button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
            >
              <Home className="w-5 h-5 inline mr-2" />
              Вернуться на главную
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;