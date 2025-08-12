import React, { useState } from 'react';
import Header from './components/Header';
import Home from './components/Home';
import InflationBeat from './components/InflationBeat';
import RealEstateProjection from './components/RealEstateProjection';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { useAuth } from './contexts/AuthContext';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const { isAuthenticated } = useAuth();

  const handleNavigate = (page: string) => {
    if (!isAuthenticated && (page === 'inflation-beat' || page === 'projet-immo')) {
      setCurrentPage('login');
    } else {
      setCurrentPage(page);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'inflation-beat':
        return <InflationBeat />;
      case 'projet-immo':
        return <RealEstateProjection />;
      case 'login':
        return <Login onNavigate={handleNavigate} />;
      case 'register':
        return <Register onNavigate={handleNavigate} />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <Header currentPage={currentPage} onNavigate={handleNavigate} />
      <main>{renderPage()}</main>
    </div>
  );
}

export default App;
