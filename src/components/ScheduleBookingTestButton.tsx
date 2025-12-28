import React, { useState, useEffect } from 'react';

interface TourSchedule {
  id: string;
  tourId: string;
  date: string;
  time: string;
  availableSpots: number;
  maxSpots: number;
}

interface Tour {
  id: string;
  title: string;
}

export const ScheduleBookingTestButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [tours, setTours] = useState<Tour[]>([]);
  const [schedules, setSchedules] = useState<TourSchedule[]>([]);
  const [selectedTourId, setSelectedTourId] = useState<string>('');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');

  // Загружаем реальные туры из Firebase
  useEffect(() => {
    const loadTours = async () => {
      try {
        const response = await fetch('https://nextjs-boilerplateuexkyesua.onrender.com/api/tours');
        if (response.ok) {
          const toursData = await response.json();
          setTours(toursData);
          console.log('Загружены туры из Firebase:', toursData.length);
        } else {
          throw new Error('Ошибка загрузки туров');
        }
      } catch (error) {
        console.error('Ошибка загрузки туров:', error);
        // Fallback на тестовые данные
        const mockTours: Tour[] = [
          { id: '1', title: 'Историческая прогулка по Нижнему Новгороду' },
          { id: '2', title: 'Вечерняя прогулка по набережной Волги' },
          { id: '3', title: 'Архитектурное наследие Нижнего Новгорода' }
        ];
        setTours(mockTours);
      }
    };

    loadTours();
  }, []);

  // Загружаем расписания при выборе тура
  useEffect(() => {
    if (selectedTourId) {
      loadSchedules(selectedTourId);
    }
  }, [selectedTourId]);

  const loadSchedules = async (tourId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`https://nextjs-boilerplateuexkyesua.onrender.com/api/tour-schedules/${tourId}`);
      
      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status}`);
      }
      
      const data = await response.json();
      setSchedules(data);
      setSelectedScheduleId(''); // Сбрасываем выбор расписания
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setResult(`❌ Ошибка загрузки расписаний: ${errorMessage}`);
      setSchedules([]);
    } finally {
      setIsLoading(false);
    }
  };

  const bookSelectedSchedule = async () => {
    if (!selectedScheduleId) {
      setResult('❌ Пожалуйста, выберите время экскурсии');
      return;
    }

    try {
      setIsLoading(true);
      setResult('');

      console.log(`Попытка бронирования расписания: ${selectedScheduleId}`);
      
      const response = await fetch('https://nextjs-boilerplateuexkyesua.onrender.com/api/book-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduleId: selectedScheduleId,
          numberOfPeople: 1
        }),
      });

      const bookResult = await response.json();
      
      if (!response.ok) {
        throw new Error(bookResult.error || 'Ошибка бронирования');
      }

      const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);
      const selectedTour = tours.find(t => t.id === selectedTourId);

      setResult(`✅ Успешно забронировано!
      
🎫 Экскурсия: ${selectedTour?.title}
📅 Дата: ${selectedSchedule?.date}
⏰ Время: ${selectedSchedule?.time}
🆔 ID расписания: ${selectedScheduleId}
👥 Осталось мест: ${bookResult.availableSpots} из ${bookResult.maxSpots}
💰 Источник: ${bookResult.source}

Место забронировано для конкретного времени!`);
      
      // Обновляем список расписаний
      await loadSchedules(selectedTourId);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setResult(`❌ Ошибка бронирования: ${errorMessage}`);
      console.error('Ошибка бронирования:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSchedules = () => {
    if (selectedTourId) {
      loadSchedules(selectedTourId);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-6">Тестирование бронирования по времени</h3>
      
      {/* Выбор экскурсии */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Выберите экскурсию:
        </label>
        <select
          value={selectedTourId}
          onChange={(e) => setSelectedTourId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        >
          <option value="">Выберите экскурсию...</option>
          {tours.map((tour) => (
            <option key={tour.id} value={tour.id}>
              {tour.title}
            </option>
          ))}
        </select>
      </div>

      {/* Выбор времени */}
      {schedules.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Выберите время:
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {schedules.map((schedule) => (
              <label
                key={schedule.id}
                className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="schedule"
                  value={schedule.id}
                  checked={selectedScheduleId === schedule.id}
                  onChange={(e) => setSelectedScheduleId(e.target.value)}
                  className="mr-3"
                  disabled={isLoading}
                />
                <div className="flex-1">
                  <div className="font-medium">
                    {schedule.date} в {schedule.time}
                  </div>
                  <div className="text-sm text-gray-600">
                    Доступно мест: {schedule.availableSpots} из {schedule.maxSpots}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Кнопки действий */}
      <div className="flex space-x-3 mb-4">
        <button
          onClick={bookSelectedSchedule}
          disabled={!selectedScheduleId || isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Бронирую...
            </>
          ) : (
            'Забронировать выбранное время'
          )}
        </button>
        
        {selectedTourId && (
          <button
            onClick={refreshSchedules}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Обновить
          </button>
        )}
      </div>

      {/* Результат */}
      {result && (
        <div className={`p-4 rounded-lg text-sm whitespace-pre-line ${
          result.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {result}
        </div>
      )}

      {/* Инструкция */}
      <div className="mt-4 text-xs text-gray-500">
        <p className="font-semibold mb-2">Как использовать:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Выберите экскурсию из списка</li>
          <li>Выберите удобное время и дату</li>
          <li>Нажмите "Забронировать выбранное время"</li>
          <li>Место будет забронировано для конкретного времени</li>
        </ol>
        <p className="mt-2">• Система работает с реальными временными слотами</p>
        <p>• Места уменьшаются только для выбранного времени</p>
        <p>• Можно тестировать разные экскурсии и времена</p>
      </div>
    </div>
  );
};
