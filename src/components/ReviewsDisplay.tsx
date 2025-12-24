import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Review } from '../types/review';
import { reviewService } from '../services/reviewService';
import ReviewModal from './ReviewModal';

const ReviewsDisplay: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadApprovedReviews = async () => {
      try {
        const approvedReviews = await reviewService.getApprovedReviews();
        // Берем только первые 6 отзывов для отображения
        setReviews(approvedReviews.slice(0, 6));
      } catch (error) {
        console.error('Ошибка при загрузке одобренных отзывов:', error);
      } finally {
        setLoading(false);
      }
    };

    loadApprovedReviews();
  }, []);

  const nextReview = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + reviews.length) % reviews.length);
  };

  const goToReview = (index: number) => {
    setCurrentIndex(index);
  };

  const openReviewModal = () => {
    setIsModalOpen(true);
  };

  const closeReviewModal = () => {
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <>
        <div className="py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка отзывов...</p>
          </div>
        </div>
        
        {/* Модальное окно для отзыва - всегда в DOM */}
        <ReviewModal 
          key={`modal-${isModalOpen}`} 
          isOpen={isModalOpen} 
          onClose={closeReviewModal} 
        />
      </>
    );
  }

  if (reviews.length === 0) {
    return (
      <>
        <div className="py-12">
          <div className="text-center">
            <p className="text-gray-600 mb-6">Отзывов пока нет. Будьте первым, кто оставит отзыв!</p>
            <button
              onClick={openReviewModal}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Оставить отзыв
            </button>
          </div>
        </div>
        
        {/* Модальное окно для отзыва - всегда в DOM */}
        <ReviewModal 
          key={`modal-${isModalOpen}`} 
          isOpen={isModalOpen} 
          onClose={closeReviewModal} 
        />
      </>
    );
  }

  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Отзывы наших гостей</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Узнайте, что говорят наши клиенты о незабываемых экскурсиях и впечатлениях
        </p>
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Карусель отзывов */}
        <div className="overflow-hidden rounded-xl">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {reviews.map((review) => (
              <div
                key={review.id}
                className="w-full flex-shrink-0 px-4"
              >
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{review.name}</h3>
                      <p className="text-sm text-gray-600">{review.location}</p>
                    </div>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">{review.rating}/5</span>
                    </div>
                  </div>

                  <p className="text-gray-700 text-lg mb-6 leading-relaxed">{review.text}</p>

                  {review.images && review.images.length > 0 && (
                    <div className="mb-6">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {review.images.slice(0, 6).map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Фото отзыва ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(image, '_blank')}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4">
                    <span className="font-medium">{review.tour}</span>
                    <span>
                      {new Date(review.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Кнопки навигации */}
        <button
          onClick={prevReview}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-white rounded-full shadow-lg p-3 hover:bg-gray-50 transition-colors z-10"
          aria-label="Предыдущий отзыв"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <button
          onClick={nextReview}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-white rounded-full shadow-lg p-3 hover:bg-gray-50 transition-colors z-10"
          aria-label="Следующий отзыв"
        >
          <ChevronRight className="w-6 h-6 text-gray-600" />
        </button>

        {/* Индикаторы */}
        <div className="flex justify-center mt-6 space-x-2">
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => goToReview(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-label={`Перейти к отзыву ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {reviews.length >= 6 && (
        <div className="text-center mt-8">
          <button
            onClick={openReviewModal}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors mr-4"
          >
            Оставить отзыв
          </button>
          <button className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors">
            Все отзывы
          </button>
        </div>
      )}
      
      {/* Модальное окно для отзыва - всегда в DOM */}
      <ReviewModal 
        key={`modal-${isModalOpen}`} 
        isOpen={isModalOpen} 
        onClose={closeReviewModal} 
      />
    </div>
  );
};

export default ReviewsDisplay;
