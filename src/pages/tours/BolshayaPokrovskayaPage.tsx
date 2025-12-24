import React from 'react';
import { Seo } from '../../components/Seo';
import { Link } from 'react-router-dom';

const BolshayaPokrovskayaPage = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <Seo 
        title="Экскурсия по Большой Покровской в Нижнем Новгороде"
        description="Увлекательная пешеходная экскурсия по главной улице Нижнего Новгорода"
        keywords="экскурсия, большая покровская, нижегород, пешеходная экскурсия"
      />
      
      <article className="prose max-w-4xl mx-auto">
        <h1>Экскурсия по Большой Покровской в Нижнем Новгороде</h1>
        
        <div className="bg-blue-50 p-6 rounded-xl my-8">
          <h2 className="mt-0">Кратко о маршруте</h2>
          <ul className="space-y-2">
            <li>🔹 <strong>Где:</strong> ул. Большая Покровская, Нижний Новгород</li>
            <li>🔹 <strong>Длительность:</strong> 1 часа</li>
            <li>🔹 <strong>Стоимость:</strong> от 700 ₽ с человека</li>
            <li>🔹 <strong>Размер группы:</strong> до 10 человек</li>
          </ul>
        </div>

        <div className="mt-12 text-center">
          <Link 
            to="/tour/bolshaya-pokrovskaya" 
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 px-8 rounded-full text-lg inline-block transition-colors"
          >
            Записаться на экскурсию
          </Link>
        </div>
      </article>
    </div>
  );
};

export default BolshayaPokrovskayaPage;
