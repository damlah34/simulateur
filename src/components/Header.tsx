import React from 'react';
import { TrendingUp } from 'lucide-react';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onNavigate('home')}
          >
            <TrendingUp className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">Focus Patrimoine</span>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => onNavigate('home')}
              className={`text-sm font-medium transition-colors ${
                currentPage === 'home' 
                  ? 'text-primary-600 border-b-2 border-primary-600 pb-1' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Accueil
            </button>
            <button
              onClick={() => onNavigate('inflation-beat')}
              className={`text-sm font-medium transition-colors ${
                currentPage === 'inflation-beat'
                  ? 'text-primary-600 border-b-2 border-primary-600 pb-1'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Battre l'inflation
            </button>
            <button
              onClick={() => onNavigate('projet-immo')}
              className={`text-sm font-medium transition-colors ${
                currentPage === 'projet-immo'
                  ? 'text-primary-600 border-b-2 border-primary-600 pb-1'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Projet Immobilier
            </button>
          </nav>
          <div className="flex items-center space-x-4" />
        </div>
      </div>
    </header>
  );
};

export default Header;
