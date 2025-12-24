import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Clock, Users, Star, ArrowRight } from 'lucide-react';
import { Tour } from '../types';
import DiscountTimer from './DiscountTimer';

interface TourCardProps {
  tour: Tour;
}

const TourCard: React.FC<TourCardProps> = ({ tour }) => {
  // Debug information
  React.useEffect(() => {
    console.log('TourCard - Tour data:', {
      id: tour.id,
      title: tour.title,
      hasDiscount: !!tour.pricing.discountEndDate,
      discountEndDate: tour.pricing.discountEndDate,
      discountAmount: tour.pricing.discountAmount,
      currentTime: new Date().toISOString(),
      isFuture: tour.pricing.discountEndDate ? new Date(tour.pricing.discountEndDate) > new Date() : false
    });
  }, [tour]);
  const navigate = useNavigate();
  
  const handleCardClick = () => {
    console.log('Navigating to tour with ID:', tour.id);
    // Ensure proper URL encoding of the tour ID
    navigate(`/tour/${encodeURIComponent(tour.id)}`);
  };

  return (
    <div 
      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Бейдж популярности */}
      {tour.isPopular && (
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
            🔥 Популярно
          </span>
        </div>
      )}
      <div className="relative overflow-hidden">
        <img 
          src={tour.image} 
          alt={tour.title}
          className="w-full h-64 object-cover transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            {tour.category}
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm font-medium">{tour.rating || '4.5'}</span>
            <span className="text-xs text-gray-500">({tour.reviewCount || 45})</span>
          </div>
        </div>
        {/* Available spots */}
        <div className="absolute bottom-4 left-4">
          <div className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-bold">
            ⏰ Осталось {tour.spotsLeft !== undefined ? tour.spotsLeft : 0} мест
          </div>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {tour.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 whitespace-pre-wrap line-clamp-3">
          {tour.description}
        </p>

        {/* Основные преимущества */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Профессиональный гид
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Малая группа до 10 человек
          </div>
        </div>

        {/* Removed discount badge from image */}

        <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{tour.duration}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>До 10 человек</span>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="text-lg font-bold text-gray-900">
                от {Math.round(tour.pricing.child).toLocaleString('ru-RU')} ₽
              </div>
              <div className="text-xs text-gray-500">
                Взрослый: {Math.round(tour.pricing.standard).toLocaleString('ru-RU')} ₽
              </div>
            </div>
            
            <Link 
              to={`/tour/${tour.id}`}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-bold transition-all duration-200 flex items-center space-x-2 group shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span>Забронировать</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourCard;