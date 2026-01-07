import React, { useState, useEffect } from 'react';

interface Tour {
  id: string;
  title: string;
  maxGroupSize?: number;
}

interface TourSchedule {
  id: string;
  tourId: string;
  date: string;
  time: string;
  availableSpots: number;
  maxSpots: number;
}

export const TestBookingButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [tours, setTours] = useState<Tour[]>([]);
  const [schedules, setSchedules] = useState<TourSchedule[]>([]);
  const [selectedTourId, setSelectedTourId] = useState<string>('');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [bookingCount, setBookingCount] = useState<number>(1);

  // Загружаем туры из Firebase
  useEffect(() => {
    const loadTours = async () => {
      try {
        const response = await fetch('https://nextjs-boilerplateuexkyesua.onrender.com/api/tours');
        if (response.ok) {
          const data = await response.json();
          setTours(data);
        }
      } catch (error) {
        console.error('Ошибка загрузки туров:', error);
      }
    };
    loadTours();
  }, []);

  // Загружаем расписания для выбранного тура
  useEffect(() => {
    if (selectedTourId) {
      const loadSchedules = async () => {
        try {
          const response = await fetch('https://nextjs-boilerplateuexkyesua.onrender.com/api/schedules');
          if (response.ok) {
            const data = await response.json();
            const tourSchedules = data.filter((s: TourSchedule) => s.tourId === selectedTourId);
            setSchedules(tourSchedules);
          }
        } catch (error) {
          console.error('Ошибка загрузки расписаний:', error);
        }
      };
      loadSchedules();
    } else {
      setSchedules([]);
      setSelectedScheduleId('');
    }
  }, [selectedTourId]);

  const handleBooking = async () => {
    if (!selectedTourId) {
      setResult('❌ Выберите экскурсию');
      return;
    }

    setIsLoading(true);
    setResult('');

    try {
      console.log('=== ТЕСТОВОЕ БРОНИРОВАНИЕ МЕСТ ===');
      console.log('Выбранный тур:', selectedTourId);
      console.log('Выбранное расписание:', selectedScheduleId);
      console.log('Количество мест:', bookingCount);

      let url = 'https://nextjs-boilerplateuexkyesua.onrender.com/api/bookings';
      let body: any = {
        tourId: selectedTourId,
        numberOfPeople: bookingCount
      };

      // Если выбрано конкретное расписание, добавляем его
      if (selectedScheduleId) {
        url = 'https://nextjs-boilerplateuexkyesua.onrender.com/api/bookings/schedule';
        body.scheduleId = selectedScheduleId;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log('Ответ сервера:', data);

      if (response.ok) {
        setResult(`✅ Успешно забронировано ${bookingCount} место(а)! Осталось мест: ${data.availableSpots || 'неизвестно'}`);
        
        // Обновляем данные расписаний если нужно
        if (selectedScheduleId) {
          setSchedules(prev => prev.map(s => 
            s.id === selectedScheduleId 
              ? { ...s, availableSpots: data.availableSpots || s.availableSpots - bookingCount }
              : s
          ));
        }
        
        // Обновляем кэш на клиенте чтобы изменения были видны везде
        try {
          // Обновляем кэш расписаний
          const schedulesCache = localStorage.getItem('schedules_cache');
          if (schedulesCache) {
            const cachedData = JSON.parse(schedulesCache);
            const updatedSchedules = cachedData.map((s: any) => 
              s.id === selectedScheduleId 
                ? { ...s, availableSpots: data.availableSpots || s.availableSpots - bookingCount }
                : s
            );
            localStorage.setItem('schedules_cache', JSON.stringify(updatedSchedules));
            console.log('Updated schedules cache with new available spots');
          }
          
          // Обновляем кэш туров если нужно
          const toursCache = localStorage.getItem('tours_cache');
          if (toursCache) {
            const cachedTours = JSON.parse(toursCache);
            // Если изменились места для тура (не расписания)
            if (!selectedScheduleId && data.availableSpots !== undefined) {
              const updatedTours = cachedTours.map((t: any) => 
                t.id === selectedTourId 
                  ? { ...t, maxGroupSize: data.availableSpots }
                  : t
              );
              localStorage.setItem('tours_cache', JSON.stringify(updatedTours));
              console.log('Updated tours cache with new maxGroupSize');
            }
          }
          
          // Принудительно перезагружаем данные чтобы обновить UI
          window.dispatchEvent(new CustomEvent('forceDataRefresh'));
          
        } catch (cacheError) {
          console.error('Error updating cache:', cacheError);
        }
      } else {
        setResult(`❌ Ошибка бронирования: ${data.message || data.error}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setResult(`❌ Сетевая ошибка: ${errorMessage}`);
      console.error('Ошибка бронирования:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTour = tours.find(t => t.id === selectedTourId);
  const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);
  const maxBooking = selectedSchedule ? selectedSchedule.availableSpots : (selectedTour?.maxGroupSize || 10);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🎫 Тестовое бронирование мест</h3>
      
      <div className="space-y-4">
        {/* Выбор экскурсии */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Выберите экскурсию
          </label>
          <select
            value={selectedTourId}
            onChange={(e) => setSelectedTourId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Выберите экскурсию...</option>
            {tours.map((tour) => (
              <option key={tour.id} value={tour.id}>
                {tour.title} (макс. {tour.maxGroupSize || 10} человек)
              </option>
            ))}
          </select>
        </div>

        {/* Выбор даты/времени из админки */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Выберите дату и время
          </label>
          {selectedTourId && schedules.length > 0 ? (
            <select
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Выберите дату...</option>
              {schedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.date} в {schedule.time} (свободно: {schedule.availableSpots}/{schedule.maxSpots})
                </option>
              ))}
            </select>
          ) : selectedTourId ? (
            <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500">
              Нет доступных дат для этой экскурсии
            </div>
          ) : (
            <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500">
              Сначала выберите экскурсию
            </div>
          )}
        </div>

        {/* Выбор количества мест */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Количество мест для бронирования
          </label>
          <input
            type="number"
            min="1"
            max={maxBooking}
            value={bookingCount}
            onChange={(e) => setBookingCount(Math.min(Math.max(1, parseInt(e.target.value) || 1), maxBooking))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Максимум: {maxBooking} место(а)
          </p>
        </div>
        
        <button
          onClick={handleBooking}
          disabled={isLoading || !selectedTourId}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '🔄 Бронирование...' : '🎫 Забронировать места'}
        </button>
        
        {result && (
          <div className={`p-3 rounded-md text-sm ${result.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {result}
          </div>
        )}
        
        <div className="text-xs text-gray-500 text-center">
          Тестовое бронирование мест на экскурсии
        </div>
      </div>
    </div>
  );
};
