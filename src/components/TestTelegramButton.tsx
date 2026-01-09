import { useState } from 'react';
import { Send, Check, X } from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

const TestTelegramButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const testTelegramSending = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      console.log('=== ТЕСТ ОТПРАВКИ В TELEGRAM ===');
      
      const testData = {
        fullName: 'Тестовый Клиент',
        phone: '+7 (999) 123-45-67',
        email: 'test@example.com',
        tourTitle: 'Тестовая экскурсия (ТЕСТ)',
        tourDate: new Date().toLocaleDateString('ru-RU'),
        tourTime: '14:00',
        numberOfPeople: 2,
        selectedTariff: 'standard',
        finalPrice: 1600,
        paymentMethod: 'ТЕСТОВЫЙ',
        paymentId: 'test-' + Date.now(),
        selectedTime: '14:00'
      };

      console.log('Отправляю тестовые данные на сервер:', testData);

      // Используем прямой вызов Telegram API без сервера
      const botToken = '8209677930:AAFYQhWh_a4NvzRgnBjeJTO_Af5JkxWeauE';
      const chatIds = [1183482279, 1537691086]; // Основной пользователь и dinisfrench
      
      const message = `
🎫 НОВЫЙ ЗАКАЗ ЭКСКУРСИИ (ТЕСТ)

👤 КЛИЕНТ:
ФИО: ${testData.fullName}
Телефон: ${testData.phone}
Email: ${testData.email}

📍 ЭКСКУРСИЯ:
Название: ${testData.tourTitle}
Дата: ${testData.tourDate}
Время: ${testData.tourTime}
Количество человек: ${testData.numberOfPeople}
Тариф: ${testData.selectedTariff}

💰 ОПЛАТА:
Стоимость: ${testData.finalPrice} ₽
Способ: ${testData.paymentMethod}
ID платежа: ${testData.paymentId}

⏰ Время: ${new Date().toLocaleString('ru-RU')}
🔗 Канал: https://t.me/agenDima
      `.trim();

      let successCount = 0;
      const errors: string[] = [];

      // Отправляем каждому пользователю
      for (const chatId of chatIds) {
        try {
          const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
              parse_mode: 'HTML',
              disable_web_page_preview: false
            }),
          });

          const result = await response.json();
          
          if (response.ok && result.ok) {
            successCount++;
            console.log(`✅ Сообщение отправлено пользователю ${chatId}`);
          } else {
            errors.push(`Пользователь ${chatId}: ${result.description}`);
            console.error(`❌ Ошибка отправки пользователю ${chatId}:`, result);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
          errors.push(`Пользователь ${chatId}: ${errorMessage}`);
          console.error(`❌ Сетевая ошибка для пользователя ${chatId}:`, error);
        }
      }

      if (successCount > 0) {
        setResult({
          success: true,
          message: `✅ Тестовое уведомление отправлено ${successCount} из ${chatIds.length} пользователям!`,
          details: errors.length > 0 ? `Ошибки: ${errors.join(', ')}` : 'Все уведомления отправлены успешно'
        });
      } else {
        setResult({
          success: false,
          message: '❌ Не удалось отправить уведомления',
          details: errors.join(', ')
        });
      }
    } catch (error) {
      console.error('Ошибка теста:', error);
      setResult({
        success: false,
        message: '❌ Сетевая ошибка',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">Тест Telegram</h3>
      
      <button
        onClick={testTelegramSending}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Отправка...</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>Тест в Telegram</span>
          </>
        )}
      </button>

      {result && (
        <div className={`mt-3 p-2 rounded-md text-xs ${
          result.success 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-start gap-1">
            {result.success ? (
              <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
            ) : (
              <X className="w-3 h-3 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <div className="font-medium">{result.message}</div>
              {result.details && (
                <div className="mt-1 text-xs opacity-75">
                  {typeof result.details === 'string' ? result.details : JSON.stringify(result.details)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestTelegramButton;
