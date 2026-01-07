import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';

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
            <Link 
              to="/admin"
              className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              Админ
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;