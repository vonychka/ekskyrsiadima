import React, { useState } from 'react';
import { sendTicketEmailWeb3Forms } from '../utils/emailWeb3Forms';

interface TestTicketEmailButtonProps {}

export const TestTicketEmailButton: React.FC<TestTicketEmailButtonProps> = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [testEmail, setTestEmail] = useState('sokovdima3@gmail.com');

  const testTicketEmail = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      console.log('=== ТЕСТОВАЯ ОТПРАВКА БИЛЕТА НА EMAIL ===');
      
      // Тестовые данные как при реальной оплате
      const testData = {
        fullName: 'Соков Дима Алексеевич',
        phone: '9991408094',
        email: testEmail,
        tourTitle: 'Боярская экскурсия',
        tourDate: new Date().toLocaleDateString('ru-RU'),
        tourTime: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        numberOfPeople: 1,
        selectedTariff: 'standard',
        finalPrice: 10,
        paymentMethod: 'Тинькофф',
        paymentId: 'TEST-' + Date.now()
      };
      
      console.log('Отправляю тестовые данные:', testData);
      
      const response = await sendTicketEmailWeb3Forms(testData);
      
      if (response.success) {
        setResult('✅ Билет успешно отправлен на email! Проверьте почту.');
        console.log('✅ Тестовый билет отправлен успешно');
      } else {
        setResult('❌ Ошибка отправки: ' + response.message);
        console.error('❌ Ошибка отправки тестового билета:', response);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setResult('❌ Сетевая ошибка: ' + errorMessage);
      console.error('❌ Сетевая ошибка при отправке тестового билета:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🎫 Тест отправки билета</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email для получения билета
          </label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="test@example.com"
          />
        </div>
        
        <button
          onClick={testTicketEmail}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '📧 Отправка...' : '📧 Отправить тестовый билет'}
        </button>
        
        {result && (
          <div className={`p-3 rounded-md text-sm ${result.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {result}
          </div>
        )}
        
        <div className="text-xs text-gray-500 text-center">
          Тест отправки билета на email с красивым шаблоном
        </div>
      </div>
    </div>
  );
};
