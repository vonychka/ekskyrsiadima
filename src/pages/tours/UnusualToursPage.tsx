import React from 'react';
import { Seo } from '../../components/Seo';

const UnusualToursPage = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <Seo 
        title="Необычные экскурсии по Нижнему Новгороду"
        description="Уникальные маршруты по неочевидным местам города"
        keywords="необычные экскурсии, Нижний Новгород, нестандартные маршруты"
      />
      
      <article className="prose max-w-4xl mx-auto">
        <h1>Необычные экскурсии по Нижнему Новгороду</h1>
        
        <div className="bg-blue-50 p-6 rounded-xl my-8">
          <h2 className="mt-0">Кратко о маршруте</h2>
          <ul className="space-y-2">
            <li>🔹 <strong>Где:</strong> Разные локации Нижнего Новгорода</li>
            <li>🔹 <strong>Длительность:</strong> от 1 часов</li>
            <li>🔹 <strong>Стоимость:</strong> от 700 ₽ с человека</li>
            <li>🔹 <strong>Размер группы:</strong> до 10 человек</li>
          </ul>
        </div>
      </article>
    </div>
  );
};

export default UnusualToursPage;
