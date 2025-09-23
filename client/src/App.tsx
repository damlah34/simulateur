// client/src/App.tsx
import React, { useCallback, useState } from "react";
import Header from "./components/Header";
import Home from "./components/Home";
import InflationBeat from "./components/InflationBeat";
import RealEstateProjection from "./components/RealEstateProjection";
import Simulations from "./pages/Simulations";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Confirm from "./pages/Confirm";
import { AuthProvider } from "./contexts/AuthContext";
import CsvImport from "./components/CsvImport"; // <= AJOUT

type Page =
  | "home"
  | "inflation-beat"
  | "projet-immo"
  | "simulations"
  | "login"
  | "signup"
  | "confirm"
  | "import-csv"; // <= AJOUT

declare global {
  interface Window {
    __pageParams?: any;
  }
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");

  const handleNavigate = useCallback((page: Page, params?: any) => {
    window.__pageParams = params || null;
    setCurrentPage(page);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <Home onNavigate={handleNavigate} />;
      case "inflation-beat":
        return <InflationBeat />;
      case "projet-immo":
        return <RealEstateProjection onNavigate={handleNavigate} />;
      case "simulations":
        return <Simulations onNavigate={handleNavigate} />;
      case "login":
        return <Login onNavigate={handleNavigate} />;
      case "signup":
        return <Signup onNavigate={handleNavigate} />;
      case "confirm":
        return <Confirm onNavigate={handleNavigate} />;
      case "import-csv": // <= AJOUT
        return <CsvImport />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 font-inter">
        <Header currentPage={currentPage} onNavigate={handleNavigate} />
        <main>{renderPage()}</main>
      </div>
    </AuthProvider>
  );
}
