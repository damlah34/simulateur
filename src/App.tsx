import React, { useState } from 'react';
import Header from './components/Header';
import Home from './components/Home';
import InflationBeat from './components/InflationBeat';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={setCurrentPage} />;
      case 'inflation-beat':
        return <InflationBeat />;
      case 'login':
        return <Login onNavigate={setCurrentPage} />;
      case 'register':
        return <Register onNavigate={setCurrentPage} />;
      default:
        return <Home onNavigate={setCurrentPage} />;
    }
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 font-inter">
        <Header currentPage={currentPage} onNavigate={setCurrentPage} />
        <main>
          {renderPage()}
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;