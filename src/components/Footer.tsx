import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 py-6 mt-12">
      <div className="container mx-auto px-4">
        <div className="border-t border-gray-200 pt-6">
          <div className="text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} ТурАгентстводима. Все права защищены.</p>
            <p className="mt-2">ИНН: 525716902100</p>
            <p className="mt-2">
              <a 
                href="/Публичная оферта.pdf" 
                className="text-blue-600 hover:text-blue-800 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Публичная оферта
              </a>
            </p>
            <p className="mt-2">
              <a 
                href="/Новый документ.pdf" 
                className="text-blue-600 hover:text-blue-800 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Политика конфиденциальности
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;