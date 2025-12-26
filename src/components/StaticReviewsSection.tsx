const reviews = [
  {
    id: 1,
    author: 'Sobliiv',
    rating: 5,
    text: 'Все понравилось, очень полезная экскурсия, спасибо за ппиченьки',
    date: '',
  },
  {
    id: 2,
    author: 'Алена Кондрашина',
    rating: 5,
    text: 'Хорошее агенство, хорошие экскурсии',
    date: '',
  },
  {
    id: 3,
    author: 'Влад С.',
    rating: 5,
    text: 'Классный экскурсовод Дмитрий!',
    date: '',
  }
];

const StaticReviewsSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Отзывы клиентов</h2>
          <p className="text-xl text-gray-600">Что говорят о нас наши туристы</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <div className="text-yellow-400 flex">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-700 mb-4">"{review.text}"</p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold mr-3">
                  {review.author.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{review.author}</p>
                  <p className="text-sm text-gray-500">{review.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-6">Оставьте и вы свой отзыв на Яндекс.Картах</p>
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

export default StaticReviewsSection;
