import React from 'react';

const YandexReviewsSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Отзывы клиентов</h2>
          <p className="text-xl text-gray-600">Наши отзывы на Яндекс.Картах</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="w-full h-[600px]">
            <iframe 
              src="https://yandex.ru/maps-reviews-widget.com/79028486560?comments"
              width="100%"
              height="100%"
              frameBorder="0"
              title="Отзывы о Туристическом агентстве Дима"
              style={{ border: 'none' }}
            >
              <p>Ваш браузер не поддерживает iframe. <a href="https://yandex.ru/maps/org/turisticheskoye_agentstvo_dima/79028486560/reviews/" target="_blank" rel="noopener noreferrer">Открыть отзывы на Яндекс.Картах</a></p>
            </iframe>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <a 
            href="https://yandex.ru/maps/org/turisticheskoye_agentstvo_dima/79028486560/reviews/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-8 transition-colors duration-200"
          >
            Оставить отзыв на Яндекс.Картах
          </a>
        </div>
      </div>
    </section>
  );
};

export default YandexReviewsSection;
