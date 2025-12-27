import React, { useState } from 'react';

export const WebhookTestButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testWebhook = async () => {
    setIsLoading(true);
    setResult('');

    try {
      const testData = {
        PaymentId: 'TEST-' + Date.now(),
        OrderId: 'test-order-' + Date.now(),
        Amount: 1000,
        Status: 'CONFIRMED',
        Email: 'test@example.com',
        Phone: '79991234567',
        Description: 'Тестовый вебхок для проверки',
        TerminalKey: '1766479140318'
      };

      console.log('Отправка тестового вебхука:', testData);

      const response = await fetch('https://nextjs-boilerplateuexkyesua.onrender.com/api/tinkoff-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const responseText = await response.text();
      
      if (response.ok) {
        setResult('✅ Вебхок успешно отправлен! Проверьте Telegram канал https://t.me/agenDima');
        console.log('Вебхок отправлен успешно:', responseText);
      } else {
        setResult(`❌ Ошибка: ${response.status} - ${responseText}`);
        console.error('Ошибка вебхука:', response.status, responseText);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setResult(`❌ Ошибка соединения: ${errorMessage}`);
      console.error('Ошибка:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Тестирование вебхуков Тинькофф</h3>
      
      <button
        onClick={testWebhook}
        disabled={isLoading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Отправка...
          </>
        ) : (
          'Отправить тестовый вебхок'
        )}
      </button>
      
      {result && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          result.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {result}
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>• Тест отправляет вебхок на сервер</p>
        <p>• Сервер проверяет токен и отправляет данные в Telegram</p>
        <p>• Канал: https://t.me/agenDima</p>
      </div>
    </div>
  );
};
