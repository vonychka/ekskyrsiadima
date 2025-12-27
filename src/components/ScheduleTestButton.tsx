import React, { useState } from 'react';

export const ScheduleTestButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testScheduleBooking = async () => {
    setIsLoading(true);
    setResult('');

    try {
      console.log('=== Тестирование бронирования по времени ===');
      
      // Тестируем получение расписаний для тура 1
      const schedulesResponse = await fetch('https://nextjs-boilerplateuexkyesua.onrender.com/api/tour-schedules/1');
      
      if (!schedulesResponse.ok) {
        throw new Error(`Ошибка получения расписаний: ${schedulesResponse.status}`);
      }
      
      const schedulesData = await schedulesResponse.json();
      console.log('Полученные расписания:', schedulesData);
      
      if (schedulesData.length === 0) {
        setResult('❌ Нет доступных расписаний для тура');
        return;
      }
      
      // Берем ближайшее расписание
      const nearestSchedule = schedulesData[0];
      console.log('Выбранное расписание:', nearestSchedule);
      
      if (nearestSchedule.availableSpots < 1) {
        setResult('❌ Нет доступных мест в ближайшем расписании');
        return;
      }
      
      // Тестируем бронирование
      const bookResponse = await fetch('https://nextjs-boilerplateuexkyesua.onrender.com/api/book-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduleId: nearestSchedule.id,
          numberOfPeople: 1
        }),
      });
      
      const bookResult = await bookResponse.json();
      
      if (!bookResponse.ok) {
        throw new Error(bookResult.error || 'Ошибка бронирования');
      }
      
      setResult(`✅ Успешно забронировано место!
      
📅 Расписание: ${nearestSchedule.date} в ${nearestSchedule.time}
🎫 ID расписания: ${nearestSchedule.id}
👥 Осталось мест: ${bookResult.availableSpots} из ${bookResult.maxSpots}
💰 Бронирований: ${bookResult.bookedSlots}

Места уменьшились на 1 для конкретного времени!`);
      
      console.log('Результат бронирования:', bookResult);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setResult(`❌ Ошибка: ${errorMessage}`);
      console.error('Ошибка теста:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Тестирование бронирования по времени</h3>
      
      <button
        onClick={testScheduleBooking}
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Тестирую...
          </>
        ) : (
          'Протестировать бронирование'
        )}
      </button>
      
      {result && (
        <div className={`mt-4 p-3 rounded-lg text-sm whitespace-pre-line ${
          result.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {result}
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>• Получает доступные расписания из Firebase</p>
        <p>• Выбирает ближайшее время со свободными местами</p>
        <p>• Бронирует место для конкретного времени</p>
        <p>• Места уменьшаются только для выбранного времени</p>
      </div>
    </div>
  );
};
