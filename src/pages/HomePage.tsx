import React, { useMemo } from 'react';
import { useOptimizedTours } from '../hooks/useOptimizedTours';
import TourCard from '../components/TourCard';
import StaticReviewsSection from '../components/StaticReviewsSection';
import SkeletonLoader from '../components/SkeletonLoader';
import { ScheduleBookingTestButton } from '../components/ScheduleBookingTestButton';
import { getNearestTourSpots } from '../data/tours';
import { Tour } from '../types';

const HomePage: React.FC = () => {
  const { tours, schedules, loading } = useOptimizedTours();
  
  // Debug: Log tour data to check discount info
  React.useEffect(() => {
    if (tours.length > 0) {
      console.log('Tours data with discount info:', tours.map(tour => ({
        id: tour.id,
        title: tour.title,
        hasDiscount: !!tour.pricing?.discountEndDate,
        discountEndDate: tour.pricing?.discountEndDate,
        discountAmount: tour.pricing?.discountAmount
      })));
    }
  }, [tours]);

  const toursWithSpots = useMemo(() => {
    // Add test discount to the first tour for debugging
    const toursWithTestData = [...tours];
    if (toursWithTestData.length > 0) {
      toursWithTestData[0] = {
        ...toursWithTestData[0],
        pricing: {
          ...toursWithTestData[0].pricing,
          discountEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          discountAmount: 20,
          originalPrice: toursWithTestData[0].pricing.standard,
          discountPercentage: 20
        }
      };
    }
    
    return toursWithTestData.map((tour: Tour) => ({
      ...tour,
      spotsLeft: getNearestTourSpots(tour.id, schedules || [])
    }));
  }, [tours, schedules]);

  const scrollToTours = () => {
    const toursSection = document.getElementById('tours-section');
    if (toursSection) {
      const offsetPosition = toursSection.offsetTop - -220; // Увеличиваем отступ сверху
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const scrollToContacts = () => {
    const contactsSection = document.getElementById('contacts-section');
    if (contactsSection) {
      contactsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  
  
  const contactInfo = [
    { 
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>, 
      label: 'Телефон', 
      value: '+7 (999) 140-80-94',
      href: 'tel:+79991408094'
    },
    { 
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>, 
      label: 'Email', 
      value: 'rmok0082@gmail.com',
      href: 'mailto:rmok0082@gmail.com'
    },
    { 
      icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.78 5.42-.94 6.8-.11.94-.34 1.26-.58 1.3-.48.07-.84-.32-1.3-.63-.72-.47-1.13-.77-1.83-1.22-.81-.52-.28-.8.18-1.27.12-.12 2.16-1.98 2.2-2.15.03-.05.03-.23-.09-.33-.12-.1-.3-.07-.43-.04-.18.05-3.08 1.96-8.71 5.76-.83.57-1.58.85-2.24.83-.74-.02-2.16-.42-3.22-.76-.94-.3-1.68-.46-1.62-.97.03-.26.39-.53 1.1-.81 5.72-2.49 9.54-4.13 11.44-4.96 5.45-2.27 6.58-2.66 7.34-2.68.16 0 .52.04.76.22.2.16.26.37.28.52.02.15.02.56-.02.88z"/></svg>, 
      label: 'Telegram', 
      value: '@Dinisfrench',
      href: 'https://t.me/Dinisfrench'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Фоновое изображение */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: "url('./images/photo_2025-09-10 17.51.25.jpeg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 1,
          }}
        ></div>

        {/* Синий прозрачный фон поверх фотографии */}
        <div className="absolute inset-0 bg-blue-900 bg-opacity-65"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white -mt-12 md:-mt-8">
          <h1
  className="
    w-full
    max-w-md
    mx-auto
    px-4
    text-5xl
    leading-tight
    font-extrabold
    mb-6
    tracking-tight
    md:px-0
    md:max-w-none
    md:text-6xl
    lg:text-7xl
  "
>
 <span
  className="
    block
    text-white
    bg-gradient-to-r from-white to-blue-100
    bg-clip-text text-transparent
    font-black
    rotate-[-1deg]
    inline-block
  "
>
  Прогулка
</span>

<span
  className="
    block
    text-yellow-300
    text-20xl -mt-2
    font-semibold
    tracking-wide
    rotate-[0.5deg]
    inline-block
    md:text-5xl
    lg:text-60xl
  "
>
  с Бояриным
</span>

  <span
    className="
      block
      text-blue-100
      text-lg
      mt-0
      font-normal
      tracking-wide
      md:text-2xl
      lg:text-3xl
    "
  >
    <span
      className="
        block
        italic
        rotate-[-0.5deg]
        transition-transform duration-300
        hover:scale-105
      "
    >
      эмоции и приключения
    </span>

    <span className="block mt-0">
      <span
        className="
          inline-block
          bg-yellow-400
          text-blue-900
          px-6 py-3
          rounded-full
          text-base
          font-semibold
          tracking-wide
          shadow-md
          rotate-[1deg]
          md:text-lg
        "
      >
        купи билет сейчас
      </span>
    </span>
  </span>
</h1>



            
            <div className="flex flex-col items-center gap-4 mt-12 md:mt-20 mb-2 w-full">
  {/* Primary CTA */}
  <button
  onClick={scrollToTours}
  className="
    group relative
    w-full max-w-sm
    bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-400
    text-black
    py-4 px-6
    rounded-2xl
    text-base sm:text-lg
    font-bold
    tracking-wide
    shadow-lg hover:shadow-xl
    transition-all duration-300
    active:scale-[0.98]
    focus:outline-none
    transform hover:scale-105
    border-2 border-yellow-300
  "
>
  <span className="relative z-10">Наши прогулки</span>
  <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
  <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
</button>
{/* Secondary actions */}
<div className="flex flex-col gap-3 w-full max-w-sm">
  <button
    onClick={() =>
      document
        .getElementById('reviews-section')
        ?.scrollIntoView({ behavior: 'smooth' })
    }
    className="
      group relative
      w-full
      py-3 px-6
      rounded-2xl
      text-sm sm:text-base
      font-medium
      text-white
      backdrop-blur-sm
      bg-white/10
      border border-white/20
      shadow-md hover:shadow-lg
      transition-all duration-300
      active:scale-[0.98]
      hover:bg-white/20
      hover:border-white/40
      transform hover:scale-105
    "
  >
    <span className="relative z-10">Отзывы</span>
    <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
  </button>
  <button
    onClick={scrollToContacts}
    className="
      group relative
      w-full
      py-3 px-6
      rounded-2xl
      text-sm sm:text-base
      font-medium
      text-white
      backdrop-blur-sm
      bg-white/10
      border border-white/20
      shadow-md hover:shadow-lg
      transition-all duration-300
      active:scale-[0.98]
      hover:bg-white/20
      hover:border-white/40
      transform hover:scale-105
    "
  >
    <span className="relative z-10">Контакты</span>
    <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
  </button>
  </div>
</div>

          </div>
        </div>
      </section>

      {/* Tours Section */}
      <section id="tours-section" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-blue-600 mb-4">
              Наши прогулки
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Познакомьтесь с богатой историей и культурой Нижнего Новгорода вместе с нашими опытными гидами
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {loading ? (
              <SkeletonLoader count={3} />
            ) : (
              toursWithSpots.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <div id="reviews-section">
        <StaticReviewsSection />
      </div>

      {/* Stats Section */}
      <section id="contacts-section" className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Наши контакты
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Свяжитесь с нами любым удобным способом
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {contactInfo.map((stat, index) => (
              <a key={index} href={stat.href} target={stat.href.startsWith('tel:') || stat.href.startsWith('mailto:') ? '_self' : '_blank'} rel="noopener noreferrer" className="group">
                <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-200 hover:scale-105">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors duration-200">
                    {stat.icon}
                  </div>
                  <div className="text-xl font-bold text-gray-900 mb-2 break-words">{stat.value}</div>
                  <div className="text-base text-gray-600">{stat.label}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule Booking Test Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <ScheduleBookingTestButton />
        </div>
      </section>

      </div>
  );
};

export default HomePage;