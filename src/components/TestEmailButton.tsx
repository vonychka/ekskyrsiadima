import { useState } from 'react';
import { Mail, Send, Check, X } from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

const TestEmailButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [testEmail, setTestEmail] = useState('sokovdima3@gmail.com');

  const testEmailSending = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      console.log('=== ТЕСТ ОТПРАВКИ EMAIL ===');
      
      const testData = {
        fullName: 'Тестовый Клиент',
        phone: '+7 (999) 123-45-67',
        email: testEmail,
        tourTitle: 'Боярская экскурсия (ТЕСТ)',
        tourDate: new Date().toLocaleDateString('ru-RU'),
        tourTime: '14:00',
        numberOfPeople: 1,
        selectedTariff: 'standard',
        finalPrice: 100,
        paymentMethod: 'ТЕСТОВЫЙ',
        paymentId: 'test-' + Date.now()
      };

      console.log('Отправляю тестовые данные:', testData);

      const response = await fetch('https://ekskyrsiadima-jhin.vercel.app/api/payment-success', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      const data = await response.json();
      console.log('Ответ API:', data);

      if (response.ok) {
        setResult({
          success: true,
          message: '✅ Тестовые email отправлены!',
          details: data
        });
      } else {
        setResult({
          success: false,
          message: '❌ Ошибка отправки',
          details: data
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
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 border border-gray-200 z-50 max-w-sm">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-800">Тест Email</h3>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email для теста:
          </label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="test@example.com"
          />
        </div>
        
        <button
          onClick={testEmailSending}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Отправка...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Отправить тест
            </>
          )}
        </button>
        
        {result && (
          <div className={`p-3 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-start gap-2">
              {result.success ? (
                <Check className="w-4 h-4 text-green-600 mt-0.5" />
              ) : (
                <X className="w-4 h-4 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.message}
                </p>
                {result.details && (
                  <details className="mt-1">
                    <summary className="text-xs text-gray-600 cursor-pointer">Детали</summary>
                    <pre className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestEmailButton;
