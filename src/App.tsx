import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Home from './components/Home';
import InflationBeat from './components/InflationBeat';
import RealEstateProjection from './components/RealEstateProjection';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import { useAuth } from './context/AuthContext';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const { user, loading } = useAuth();

  const handleNavigate = (page: string) => {
    if (page === 'users' && user?.role !== 'admin') {
      setCurrentPage(user ? 'home' : 'login');
      return;
    }
    setCurrentPage(page);
  };

  useEffect(() => {
    if (!user && currentPage === 'users') {
      setCurrentPage('login');
    } else if (user && currentPage === 'login') {
      setCurrentPage('home');
    }
  }, [user, currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'inflation-beat':
        return <InflationBeat />;
      case 'projet-immo':
        return <RealEstateProjection />;
      case 'users':
        return <UserManagement />;
      case 'login':
        return <Login onSuccess={() => setCurrentPage('home')} />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Chargement de vos informations...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <Header currentPage={currentPage} onNavigate={handleNavigate} />
      <main>{renderPage()}</main>
    </div>
  );
}

export default App;
