import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { format, parseISO, isAfter, parse } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useToursContext } from '../context/ToursContext';
import { Calendar, Clock, Users, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import ImageGallery from '../components/ImageGallery';
import PromoCodeInput from '../components/PromoCodeInput';

// Type definitions
interface Tour {
  id: string;
  title: string;
  description: string;
  duration: string;
  pricing: {
    standard: number;
    child?: number;
    family?: number;
  };
  highlights: string[];
  gallery: string[];
  image: string;
}

interface Schedule {
  id: string;
  tourId: string;
  date: string;
  time: string;
  availableSpots: number;
  maxSpots: number;
}

const TourDetails: React.FC = () => {
  const { tourId = '' } = useParams<{ tourId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Booking form state with proper types
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [numberOfPeople, setNumberOfPeople] = useState<number>(1);
  const [selectedTariff, setSelectedTariff] = useState<'standard' | 'child' | 'family'>('standard');
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string>('');
  const [tour, setTour] = useState<Tour | null>(null);
  const [availableSchedules, setAvailableSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingType, setBookingType] = useState<'scheduled' | 'custom'>('scheduled');
  const [customDate, setCustomDate] = useState<string>('');
  const [customTime, setCustomTime] = useState<string>('');
  
  // Get data from context
  const { tours, schedules, loading } = useToursContext();
  
  // Helper function for plural forms
  const getPluralForm = (n: number, forms: [string, string, string]): string => {
    n = Math.abs(n) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 === 1) return forms[0];
    return forms[2];
  };

  // Load tour and schedules
  const loadTourData = useCallback(async () => {
    if (!tourId) {
      setError('ID экскурсии не указан');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      if (!tours || tours.length === 0) {
        setError('Данные об экскурсиях не загружены. Пожалуйста, попробуйте обновить страницу.');
        return;
      }
      
      const foundTour = tours.find((t: Tour) => t.id === tourId);
      if (!foundTour) {
        setError('Экскурсия не найдена. Возможно, она была удалена или перемещена.');
        return;
      }
      
      setTour(foundTour);
      
      const tourSchedules = (schedules as Schedule[])
        .filter(schedule => 
          schedule.tourId === tourId && 
          schedule.availableSpots > 0 &&
          isAfter(
            parse(`${schedule.date} ${schedule.time}`, 'yyyy-MM-dd HH:mm', new Date()),
            new Date()
          )
        )
        .sort((a, b) => {
          const dateA = parse(`${a.date} ${a.time}`, 'yyyy-MM-dd HH:mm', new Date());
          const dateB = parse(`${b.date} ${b.time}`, 'yyyy-MM-dd HH:mm', new Date());
          return dateA.getTime() - dateB.getTime();
        });
      
      setAvailableSchedules(tourSchedules);
      
      if (tourSchedules.length > 0 && !selectedScheduleId) {
        setSelectedScheduleId(tourSchedules[0].id);
      }
      
    } catch (err: unknown) {
      console.error('Error loading tour data:', err);
      setError('Не удалось загрузить данные об экскурсии. Пожалуйста, попробуйте обновить страницу.');
    } finally {
      setIsLoading(false);
    }
  }, [tourId, tours, schedules, selectedScheduleId]);
  
  // Load data on component mount and when dependencies change
  useEffect(() => {
    loadTourData();
  }, [loadTourData]);
  
  // Check for promo code in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const promoCode = params.get('promo');
    if (promoCode) {
      // Handle promo code from URL if needed
      console.log('Promo code from URL:', promoCode);
    }
  }, [location.search]);

  // Показываем загрузку
  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных экскурсии...</p>
        </div>
      </div>
    );
  }

  // Показываем ошибку, если есть
  if (error || !tour) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Ошибка загрузки</h2>
          <p className="text-gray-600 mb-6">
            {error || 'Не удалось загрузить информацию об экскурсии'}
          </p>
          <button
            onClick={() => navigate('/')}
            data-analytics="tour-details-back"
            data-button-text="Вернуться к списку экскурсий"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Вернуться к списку экскурсий
          </button>
        </div>
      </div>
    );
  }

  const handleBooking = () => {
    // Validation for custom booking
    if (bookingType === 'custom') {
      if (!customDate) {
        alert('Пожалуйста, выберите желаемую дату');
        return;
      }
      
      if (!customTime) {
        alert('Пожалуйста, выберите желаемое время');
        return;
      }
      
      // For custom booking, price is always 300₽
      const finalPrice = 300;
      
      console.log('Custom booking debug:', {
        customDate,
        customTime,
        numberOfPeople,
        finalPrice,
        bookingType
      });
      
      // Navigate to booking with custom data
      navigate('/booking', {
        state: {
          tourId: tour.id,
          tour: tour,
          numberOfPeople: numberOfPeople,
          selectedTariff: selectedTariff,
          customDate: customDate,
          customTime: customTime,
          bookingType: 'custom',
          finalPrice: finalPrice,
          appliedPromoCode: appliedPromoCode
        }
      });
      
      return;
    }

    // Validation for scheduled booking
    if (!selectedScheduleId) {
      alert('Пожалуйста, выберите дату и время');
      return;
    }

    const selectedSchedule = availableSchedules.find(s => s.id === selectedScheduleId);
    if (!selectedSchedule) {
      alert('Выбранное расписание больше не доступно. Пожалуйста, обновите страницу.');
      return;
    }
    
    if (selectedSchedule.availableSpots < numberOfPeople) {
      alert(`Извините, осталось только ${selectedSchedule.availableSpots} мест`);
      return;
    }

    // Calculate prices
    const basePrice = (tour.pricing[selectedTariff] || 0) * numberOfPeople;
    const finalPrice = discountedPrice !== null ? discountedPrice : basePrice;
    
    // Отладка - посмотрим значения
    console.log('handleBooking debug:', {
      basePrice,
      discountedPrice,
      finalPrice,
      isFree: finalPrice === 0,
      selectedTariff,
      numberOfPeople,
      tourPricing: tour.pricing
    });
    
    // Если цена 0 (бесплатный тур), переходим сразу на страницу билета
    if (finalPrice === 0) {
      console.log('Redirecting to ticket page...');
      navigate('/ticket', {
        state: {
          tourId,
          scheduleId: selectedScheduleId,
          scheduleData: selectedSchedule,
          numberOfPeople,
          selectedTariff,
          totalAmount: finalPrice,
          appliedPromoCode: appliedPromoCode,
          discountAmount: discountAmount,
          isFreeTour: true
        }
      });
      return;
    }

    // Для платных туров переходим на страницу оплаты
    console.log('Redirecting to payment page...');
    navigate('/payment', {
      state: {
        tourId,
        scheduleId: selectedScheduleId,
        scheduleData: selectedSchedule,
        numberOfPeople,
        selectedTariff,
        totalAmount: finalPrice,
        appliedPromoCode: appliedPromoCode,
        discountAmount: discountAmount
      }
    });
  };

  const handlePromoApplied = (newDiscountedPrice: number, newDiscountAmount: number, promoCode: string) => {
    setDiscountedPrice(newDiscountedPrice);
    setDiscountAmount(newDiscountAmount);
    setAppliedPromoCode(promoCode);
  };

  const handlePromoRemoved = () => {
    setDiscountedPrice(null);
    setDiscountAmount(0);
    setAppliedPromoCode('');
  };

  // Group schedules by date for display
  const groupedSchedules = availableSchedules.reduce<Record<string, Schedule[]>>((groups, schedule) => {
    const date = schedule.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(schedule);
    return groups;
  }, {});
  
  // Format price with currency
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };
  
  // Get price for selected tariff
  const getPriceForTariff = (tariff: string): number => {
    return tour?.pricing?.[tariff as keyof Tour['pricing']] || 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <button 
          onClick={() => navigate('/')}
          data-analytics="tour-details-nav-back"
          data-button-text="Назад к экскурсиям"
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к экскурсиям
        </button>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
            <p className="mb-2">{error}</p>
            <button 
              onClick={() => navigate('/')}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              <ArrowLeft className="mr-1 w-4 h-4" />
              Вернуться к списку экскурсий
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : tour ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tour Info */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <ImageGallery gallery={tour.gallery} mainImage={tour.image} title={tour.title} />
                
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{tour.title}</h1>
                      <div className="flex items-center space-x-4 text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{tour.duration}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>До 20 человек</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">
                        {tour.pricing.standard?.toLocaleString('ru-RU') || '0'} ₽
                      </div>
                      <div className="text-gray-500">за человека</div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Описание</h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{tour.description}</p>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Что вас ждет</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tour.highlights.map((highlight, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <span className="text-gray-700">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Забронировать экскурсию</h3>

                {/* Tariff Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Выберите тариф
                  </label>
                  <div className="space-y-2">
                    {['standard', 'child', 'family'].map((tariff) => {
                      const price = getPriceForTariff(tariff);
                      if (price <= 0) return null;
                      
                      const tariffNames = {
                        standard: 'Стандартный',
                        child: 'Детский (до 12 лет)',
                        family: 'Семейный (до 3 чел.)'
                      };
                      
                      return (
                        <label 
                          key={tariff}
                          className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            selectedTariff === tariff 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name="tariff"
                              value={tariff}
                              checked={selectedTariff === tariff}
                              onChange={(e) => setSelectedTariff(e.target.value as any)}
                              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="font-medium">{tariffNames[tariff as keyof typeof tariffNames]}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{formatPrice(price)} ₽</div>
                            {tariff === 'family' && (
                              <div className="text-xs text-gray-500">
                                {formatPrice(Math.round(price / 3 * 100) / 100)} ₽/чел.
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
                {/* Number of People */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Количество человек
                    </label>
                    {selectedScheduleId && (
                      <span className="text-xs text-gray-500">
                        Макс. {availableSchedules.find(s => s.id === selectedScheduleId)?.maxSpots || 10} чел.
                      </span>
                    )}
                  </div>
                  
                  <div className="relative">
                    <select
                      value={numberOfPeople}
                      onChange={(e) => {
                        const newValue = Number(e.target.value);
                        const maxSpots = availableSchedules.find(s => s.id === selectedScheduleId)?.availableSpots || 10;
                        setNumberOfPeople(Math.min(newValue, maxSpots));
                      }}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                    >
                      {[...Array(10)].map((_, i) => {
                        const value = i + 1;
                        const maxSpots = availableSchedules.find(s => s.id === selectedScheduleId)?.availableSpots || 10;
                        const isDisabled = value > maxSpots;
                        
                        return (
                          <option 
                            key={value} 
                            value={value}
                            disabled={isDisabled}
                            className={isDisabled ? 'text-gray-400' : ''}
                          >
                            {value} {getPluralForm(value, ['человек', 'человека', 'человек'])}
                            {isDisabled && ' (нет мест)'}
                          </option>
                        );
                      })}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </div>
                  </div>
                  
                  {selectedScheduleId && (
                    <div className="mt-2 text-sm text-gray-500">
                      {numberOfPeople > 1 && (
                        <div className="mb-1">
                          {numberOfPeople} × {formatPrice(getPriceForTariff(selectedTariff))} ₽ = 
                          <span className="font-medium"> {formatPrice(getPriceForTariff(selectedTariff) * numberOfPeople)} ₽</span>
                        </div>
                      )}
                      {selectedTariff === 'family' && numberOfPeople > 3 && (
                        <div className="text-yellow-700 bg-yellow-50 p-2 rounded-md text-xs mt-2">
                          Семейный тариф рассчитан на 3 человек. Каждый дополнительный человек оплачивается по стандартному тарифу.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Booking Type Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Тип бронирования
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setBookingType('scheduled')}
                      data-analytics="tour-booking-scheduled"
                      data-button-text="Выберите дату и время"
                      className={`p-4 rounded-xl border-2 transition-all ${
                        bookingType === 'scheduled'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="text-left">
                        <div className="font-medium mb-1">Выберите дату и время</div>
                        <div className="text-sm opacity-75">Готовые даты и время</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingType('custom')}
                      data-analytics="tour-booking-custom"
                      data-button-text="Любая удобная дата"
                      className={`p-4 rounded-xl border-2 transition-all ${
                        bookingType === 'custom'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="text-left">
                        <div className="font-medium mb-1">Любая удобная дата</div>
                        <div className="text-sm opacity-75">Любая удобная дата (300₽)</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Schedule Selection - only show for scheduled booking */}
{bookingType === 'scheduled' && (
  <div className="mb-6">
    <div className="flex items-center justify-between mb-4">
      <label className="block text-sm font-medium text-gray-700">
        Выберите дату и время
      </label>
      {availableSchedules.length === 0 && !isLoading && (
        <span className="text-sm text-yellow-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          Нет доступных дат
        </span>
      )}
    </div>
                  
                  {availableSchedules.length > 0 ? (
      <div className="space-y-4">
        {Object.entries(groupedSchedules).map(([date, daySchedules]) => {
          const displayDate = format(parseISO(date), 'd MMMM, EEEE', { locale: ru });

          return (
            <div key={date} className="border-2 border-gray-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h4 className="font-medium text-gray-900">
                  {displayDate.charAt(0).toUpperCase() + displayDate.slice(1)}
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {daySchedules.map(schedule => {
                  const isLow = schedule.availableSpots <= 3;
                  const isFull = schedule.availableSpots <= 0;

                  return (
                    <label key={schedule.id} className="cursor-pointer">
                      <input
                        type="radio"
                        name="schedule"
                        value={schedule.id}
                        checked={selectedScheduleId === schedule.id}
                        onChange={e => setSelectedScheduleId(e.target.value)}
                        disabled={isFull}
                        className="sr-only"
                      />

                      <div
                        className={`border-2 rounded-xl p-3 text-center transition ${
                          selectedScheduleId === schedule.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${isFull ? 'opacity-50 bg-gray-100' : ''}`}
                      >
                        <div className="flex justify-center items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {schedule.time}
                        </div>

                        <div className={`text-xs mt-1 ${isLow ? 'text-red-600' : 'text-gray-600'}`}>
                          {isFull
                            ? 'Нет мест'
                            : `${schedule.availableSpots} ${getPluralForm(schedule.availableSpots, ['место','места','мест'])}`}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <div className="text-center py-6 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Нет доступных дат</p>
        <button
          onClick={loadTourData}
          className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Обновить
        </button>
      </div>
    )}
  </div>
)}


                {/* Custom Date Selection - only show for custom booking */}
                {bookingType === 'custom' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Выберите желаемую дату
                    </label>
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    
                    <label className="block text-sm font-medium text-gray-700 mb-3 mt-4">
                      Выберите желаемое время
                    </label>
                    <select
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Выберите время</option>
                      <option value="09:00">09:00</option>
                      <option value="10:00">10:00</option>
                      <option value="11:00">11:00</option>
                      <option value="12:00">12:00</option>
                      <option value="13:00">13:00</option>
                      <option value="14:00">14:00</option>
                      <option value="15:00">15:00</option>
                      <option value="16:00">16:00</option>
                      <option value="17:00">17:00</option>
                      <option value="18:00">18:00</option>
                      <option value="19:00">19:00</option>
                      <option value="20:00">20:00</option>
                    </select>
                    
                    <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <div className="font-medium mb-1">Как это работает:</div>
                          <ul className="space-y-1 text-blue-700">
                            <li>• Выбираете любую удобную дату</li>
                            <li>• Оплачиваете бронирование 300₽</li>
                            <li>• Мы связываемся с вами для подтверждения</li>
                            <li>• При подтверждении - полная стоимость экскурсии</li>
                            <li>• Если невозможно - возврат 300₽</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Promo Code */}
                <div className="mb-6">
                  <PromoCodeInput
                    tourId={tourId}
                    tariff={selectedTariff}
                    numberOfPeople={numberOfPeople}
                    originalPrice={(tour.pricing[selectedTariff] || 0) * numberOfPeople}
                    appliedPromoCode={appliedPromoCode}
                    onPromoApplied={handlePromoApplied}
                    onPromoRemoved={handlePromoRemoved}
                  />
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        {bookingType === 'custom' ? 'Стоимость бронирования:' : 'Стоимость:'}
                      </span>
                      <span className="font-medium">
                        {bookingType === 'custom' 
                          ? '300 ₽' 
                          : `${formatPrice(getPriceForTariff(selectedTariff) * numberOfPeople)} ₽`
                        }
                      </span>
                    </div>
                    
                    {bookingType !== 'custom' && appliedPromoCode && (
                      <div className="flex justify-between items-center text-green-600">
                        <span>Скидка {discountAmount * 100}%:</span>
                        <span className="font-medium">
                          -{formatPrice(getPriceForTariff(selectedTariff) * numberOfPeople * discountAmount)} ₽
                        </span>
                      </div>
                    )}
                    
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Итого к оплате:</span>
                        <div className="text-right">
                          <div className="text-blue-600">
                            {bookingType === 'custom' 
                              ? '300 ₽'
                              : `${formatPrice(
                                  Math.round(
                                    (getPriceForTariff(selectedTariff) * numberOfPeople * 
                                    (1 - (discountedPrice ? discountAmount : 0))) * 100
                                  ) / 100
                                )} ₽`
                            }
                          </div>
                          {bookingType !== 'custom' && appliedPromoCode && (
                            <div className="text-xs text-gray-500 mt-1">
                              Промокод: {appliedPromoCode}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleBooking}
                  data-analytics="tour-booking-submit"
                  data-button-text="Забронировать"
                  disabled={
                    (bookingType === 'scheduled' && (!selectedScheduleId || availableSchedules.length === 0)) ||
                    (bookingType === 'custom' && (!customDate || !customTime))
                  }
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-colors ${
                    (bookingType === 'scheduled' && (!selectedScheduleId || availableSchedules.length === 0)) ||
                    (bookingType === 'custom' && (!customDate || !customTime))
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-[1.02] transition-transform'
                  }`}
                >
                  {bookingType === 'custom' 
                    ? (!customDate || !customTime ? 'Выберите дату и время' : 'Забронировать за 300₽')
                    : (availableSchedules.length === 0 
                      ? 'Нет доступных мест' 
                      : !selectedScheduleId 
                      ? 'Выберите время экскурсии' 
                      : `Забронировать за ${formatPrice(
                          Math.round(
                            (getPriceForTariff(selectedTariff) * numberOfPeople * 
                            (1 - (discountedPrice ? discountAmount : 0))) * 100
                          ) / 100
                        )} ₽`)
                  }
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-800">Экскурсия не найдена</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default TourDetails;
