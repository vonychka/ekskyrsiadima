import React, { useState, useEffect } from 'react';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Пробуем альтернативный подход с Firebase
let database: any = null;

try {
  // Импортируем Firebase с try-catch
  const firebase = require('firebase/app');
  require('firebase/database');
  
  const firebaseConfig = {
    apiKey: "AIzaSyD4VQ5-2Q8V9F3W7R6T5Y4U3I2O1P0Q9R8",
    authDomain: "ekskyrsiadima.firebaseapp.com",
    databaseURL: "https://ekskyrsiadima-default-rtdb.firebaseio.com",
    projectId: "ekskyrsiadima",
    storageBucket: "ekskyrsiadima.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789012345"
  };
  
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  database = firebase.database();
  console.log('Firebase успешно инициализирован для аналитики');
} catch (error) {
  console.error('Ошибка инициализации Firebase:', error);
}

interface ClickData {
  buttonId: string;
  buttonText: string;
  page: string;
  timestamp: number;
  date: string;
}

interface AnalyticsData {
  [buttonId: string]: {
    buttonText: string;
    page: string;
    clicks: number;
    lastClick: number;
  };
}

const AnalyticsPage: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({});
  const [loading, setLoading] = useState(true);
  const [totalClicks, setTotalClicks] = useState(0);
  const [firebaseError, setFirebaseError] = useState(false);

  useEffect(() => {
    if (!database) {
      setFirebaseError(true);
      setLoading(false);
      return;
    }

    // Используем реальный Firebase
    const analyticsRef = database.ref('analytics');
    
    const unsubscribe = analyticsRef.on('value', (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        const processedData: AnalyticsData = {};
        let total = 0;
        
        Object.keys(data).forEach(buttonId => {
          const buttonData = data[buttonId];
          processedData[buttonId] = {
            buttonText: buttonData.buttonText || buttonId,
            page: buttonData.page || 'Unknown',
            clicks: buttonData.clicks || 0,
            lastClick: buttonData.lastClick || 0
          };
          total += buttonData.clicks || 0;
        });
        
        setAnalyticsData(processedData);
        setTotalClicks(total);
      } else {
        setAnalyticsData({});
        setTotalClicks(0);
      }
      setLoading(false);
    }, (error: any) => {
      console.error('Ошибка Firebase:', error);
      setFirebaseError(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ru-RU');
  };

  const resetAnalytics = async () => {
    if (window.confirm('Вы уверены, что хотите сбросить всю аналитику? Это действие нельзя отменить.')) {
      try {
        if (database) {
          await database.ref('analytics').set({});
          setAnalyticsData({});
          setTotalClicks(0);
          alert('Аналитика успешно сброшена!');
        } else {
          alert('Ошибка: Firebase недоступен');
        }
      } catch (error) {
        console.error('Ошибка при сбросе аналитики:', error);
        alert('Ошибка при сбросе аналитики');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Загрузка аналитики...</div>
      </div>
    );
  }

  if (firebaseError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">Ошибка подключения к Firebase</div>
          <div className="text-gray-600">Аналитика временно недоступна. Пожалуйста, проверьте консоль для деталей.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">📊 Аналитика кликов</h1>
            <button
              onClick={resetAnalytics}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              🗑️ Сбросить аналитику
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="text-2xl font-bold text-blue-600">{totalClicks}</div>
              <div className="text-sm text-blue-600 mt-1">Всего кликов</div>
            </div>
            <div className="bg-green-50 rounded-lg p-6">
              <div className="text-2xl font-bold text-green-600">{Object.keys(analyticsData).length}</div>
              <div className="text-sm text-green-600 mt-1">Уникальных кнопок</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-6">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(analyticsData).length > 0 ? Math.round(totalClicks / Object.keys(analyticsData).length) : 0}
              </div>
              <div className="text-sm text-purple-600 mt-1">Среднее кликов на кнопку</div>
            </div>
          </div>
        </div>

        {Object.keys(analyticsData).length > 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📋 Детальная статистика кликов</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Кнопка
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Страница
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Кликов
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Последний клик
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(analyticsData)
                    .sort(([, a], [, b]) => b.clicks - a.clicks)
                    .map(([buttonId, data]) => (
                      <tr key={buttonId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {data.buttonText}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {data.page}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {data.clicks}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {data.lastClick ? formatDate(data.lastClick) : 'Нет данных'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Нет данных аналитики</h3>
            <p className="text-gray-600">Начните нажимать на кнопки на сайте, чтобы увидеть статистику здесь</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
