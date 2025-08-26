import React, { useState } from 'react';
import Header from './components/Header';
import Home from './components/Home';
import InflationBeat from './components/InflationBeat';
import RealEstateProjection from './components/RealEstateProjection';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'inflation-beat':
        return <InflationBeat />;
      case 'projet-immo':
        return <RealEstateProjection />;
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
