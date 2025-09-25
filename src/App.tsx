import React, { useCallback, useEffect, useState } from "react";
import Header from "./components/Header";
import Home from "./components/Home";
import InflationBeat from "./components/InflationBeat";
import RealEstateProjection from "./components/RealEstateProjection";
import Simulations from "./pages/Simulations";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Confirm from "./pages/Confirm";
import Budget from "./pages/Budget";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { useAuth } from "./contexts/AuthContext";

type Page =
  | "home"
  | "inflation-beat"
  | "projet-immo"
  | "simulations"
  | "login"
  | "signup"
  | "confirm"
  | "budget"
  | "forgot-password"
  | "reset-password";

const PROTECTED_PAGES: Page[] = ["simulations", "budget"];

declare global {
  interface Window {
    __pageParams?: any;
  }
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const { token } = useAuth();

  const handleNavigate = useCallback(
    (page: Page, params?: any) => {
      const requiresAuth = PROTECTED_PAGES.includes(page);

      if (requiresAuth && !token) {
        window.__pageParams = { nextPage: page, nextParams: params };
        setCurrentPage("login");
        return;
      }

      window.__pageParams = params ?? null;
      setCurrentPage(page);
    },
    [token]
  );

  useEffect(() => {
    if (!token && PROTECTED_PAGES.includes(currentPage)) {
      window.__pageParams = { nextPage: currentPage };
      setCurrentPage("login");
    }
  }, [token, currentPage]);

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
      case "budget":
        return <Budget onNavigate={handleNavigate} />;
      case "forgot-password":
        return <ForgotPassword onNavigate={handleNavigate} />;
      case "reset-password":
        return <ResetPassword onNavigate={handleNavigate} />;
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
