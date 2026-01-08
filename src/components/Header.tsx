import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, MessageCircle } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Туристическое агенство</h1>
              <p className="text-sm text-blue-600 font-medium">ДИМА</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-2 text-gray-600">
              <Phone className="w-4 h-4" />
              <span className="text-sm">+7 (999) 140-80-94</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Mail className="w-4 h-4" />
              <span className="text-sm">rmok0082@gmail.com</span>
            </div>
            <a
              href="https://t.me/Dinisfrench"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Задать вопрос</span>
            </a>
            <Link 
              to="/admin"
              className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              Админ
            </Link>
          </div>

          {/* Mobile version - only show button and phone */}
          <div className="md:hidden flex items-center space-x-3">
            <a
              href="https://t.me/Dinisfrench"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Вопрос</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;