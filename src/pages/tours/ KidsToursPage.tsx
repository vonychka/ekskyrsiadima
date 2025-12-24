import React from 'react';
import { Seo } from '../../components/Seo';

const KidsToursPage = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <Seo 
        title="Экскурсии для детей по Нижнему Новгороду"
        description="Интерактивные прогулки для маленьких путешественников"
        keywords="детские экскурсии, Нижний Новгород, экскурсии для школьников"
      />
      
      <article className="prose max-w-4xl mx-auto">
        <h1>Экскурсии для детей по Нижнему Новгороду</h1>
        
        <div className="bg-blue-50 p-6 rounded-xl my-8">
          <h2 className="mt-0">Кратко о маршруте</h2>
          <ul className="space-y-2">
            <li>🔹 <strong>Для кого:</strong> Дети 6-14 лет с родителями</li>
            <li>🔹 <strong>Длительность:</strong> 1 часа</li>
            <li>🔹 <strong>Стоимость:</strong> от 700 ₽ с человека</li>
            <li>🔹 <strong>Формат:</strong> Игровая экскурсия</li>
          </ul>
        </div>
      </article>
    </div>
  );
};

export default KidsToursPage;