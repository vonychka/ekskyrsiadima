import React, { useState, useEffect } from 'react';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Используем такой же подход как в storageService.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';

// Firebase конфигурация (используем ту же что и в storageService.ts)
const firebaseConfig = {
  apiKey: "AIzaSyBE-bcqM7DM_zV8xivFKKbrSAHifIWYgps",
  authDomain: "exursional.firebaseapp.com",
  databaseURL: "https://exursional-default-rtdb.firebaseio.com",
  projectId: "exursional",
  storageBucket: "exursional.firebasestorage.app",
  messagingSenderId: "770008017138",
  appId: "1:770008017138:web:23909355289d478208c86b"
};

// Инициализируем Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const database = getDatabase(app);

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
    // Используем реальный Firebase
    const analyticsRef = ref(database, 'analytics');
    
    const unsubscribe = onValue(analyticsRef, (snapshot: any) => {
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
        await set(ref(database, 'analytics'), {});
        setAnalyticsData({});
        setTotalClicks(0);
        alert('Аналитика успешно сброшена!');
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

        {/* Список кнопок с количеством кликов */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🔘 Кнопки и количество кликов</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(analyticsData).map(([buttonId, data]) => (
              <div key={buttonId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{data.buttonText}</div>
                  <div className="text-sm text-gray-500">{data.page}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {data.clicks} кликов
                  </span>
                  {data.lastClick > 0 && (
                    <span className="text-xs text-gray-400">
                      {formatDate(data.lastClick).split(',')[1]}
                    </span>
                  )}
                </div>
              </div>
            ))}
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
