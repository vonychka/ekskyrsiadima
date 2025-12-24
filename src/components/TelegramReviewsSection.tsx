import React from 'react';
import { Star, MessageCircle, ExternalLink } from 'lucide-react';

const TelegramReviewsSection: React.FC = () => {
  const telegramChannelUrl = 'https://t.me/agenDima';

  return (
    <section className="py-20 md:py-28 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 md:mb-8">
            Отзывы наших клиентов
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-full md:max-w-3xl mx-auto px-2 md:px-4">
            Все реальные отзывы наших клиентов вы можете найти в нашем Telegram канале
          </p>
        </div>

        <div className="max-w-full md:max-w-4xl mx-auto px-2 md:px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-12 md:p-16 lg:p-20 text-center">
            <div className="mb-6 md:mb-8">
              <div className="inline-flex items-center justify-center w-28 h-28 md:w-32 md:h-32 bg-blue-100 rounded-full mb-8 md:mb-10">
                <MessageCircle className="w-14 h-14 md:w-16 md:h-16 text-blue-600" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 md:mb-8">
                Отзывы в Telegram
              </h3>
              <p className="text-gray-600 mb-10 md:mb-12 leading-relaxed text-lg md:text-xl px-2 md:px-4 max-w-full">
                Мы публикуем все отзывы наших клиентов в нашем Telegram канале. 
                Там вы найдете реальные фотографии, впечатления и рекомендации 
                от людей, которые уже побывали на наших турах.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10 mb-12 md:mb-16">
              <div className="text-center px-4 md:px-2">
                <div className="flex justify-center mb-4">
                  <Star className="w-8 h-8 md:w-10 md:h-10 text-yellow-400 fill-current" />
                </div>
                <h4 className="font-bold text-gray-900 mb-3 md:mb-4 text-lg md:text-xl">Настоящие отзывы</h4>
                <p className="text-gray-600 text-base md:text-lg leading-relaxed max-w-xs md:max-w-none mx-auto">
                  Только реальные отзывы от наших клиентов
                </p>
              </div>
              
              <div className="text-center px-4 md:px-2">
                <div className="flex justify-center mb-4">
                  <Star className="w-8 h-8 md:w-10 md:h-10 text-yellow-400 fill-current" />
                </div>
                <h4 className="font-bold text-gray-900 mb-3 md:mb-4 text-lg md:text-xl">Фото и видео</h4>
                <p className="text-gray-600 text-base md:text-lg leading-relaxed max-w-xs md:max-w-none mx-auto">
                  Фотографии и видео с наших туров
                </p>
              </div>
              
              <div className="text-center px-4 md:px-2">
                <div className="flex justify-center mb-4">
                  <Star className="w-8 h-8 md:w-10 md:h-10 text-yellow-400 fill-current" />
                </div>
                <h4 className="font-bold text-gray-900 mb-3 md:mb-4 text-lg md:text-xl">Актуальная информация</h4>
                <p className="text-gray-600 text-base md:text-lg leading-relaxed max-w-xs md:max-w-none mx-auto">
                  Последние новости и специальные предложения
                </p>
              </div>
            </div>

            <div className="space-y-6 md:space-y-8">
              <a
                href={telegramChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full px-6 py-4 md:px-10 md:py-6 sm:px-14 sm:py-8 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white font-bold text-xl md:text-2xl rounded-2xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-300 hover:scale-105 relative overflow-hidden group before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] before:group-hover:translate-x-[100%] before:transition-transform before:duration-700 before:ease-out"
              >
                <MessageCircle className="w-6 h-6 md:w-7 md:h-8 mr-2 md:mr-4 group-hover:animate-pulse" />
                <span className="text-center hidden sm:inline">Перейти к отзывам в Telegram</span>
                <span className="text-center sm:hidden">Отзывы в Telegram</span>
                <ExternalLink className="w-5 h-5 md:w-6 md:h-7 ml-2 md:ml-4 flex-shrink-0 group-hover:translate-x-1 transition-transform duration-300" />
              </a>
              
              <p className="text-gray-500 text-lg md:text-xl font-medium">
                Канал: @agenDima
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TelegramReviewsSection;
