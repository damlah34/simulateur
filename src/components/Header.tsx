// src/components/Header.tsx
import React from "react";
import { useAuth } from "../contexts/AuthContext";

type Props = {
  currentPage: string;
  onNavigate: (page: string) => void;
};

export default function Header({ currentPage, onNavigate }: Props) {
  const { token, user, logout } = useAuth();

  const NavBtn = ({ page, label }: { page: string; label: string }) => (
    <button
      className={`px-3 py-2 rounded ${
        currentPage === page ? "bg-black text-white" : "hover:bg-gray-200"
      }`}
      onClick={() => onNavigate(page)}
    >
      {label}
    </button>
  );

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="font-semibold">🏠 Mon App Immo</div>

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
            {user?.role === 'admin' && (
              <button
                onClick={() => onNavigate('users')}
                className={`text-sm font-medium transition-colors ${
                  currentPage === 'users'
                    ? 'text-primary-600 border-b-2 border-primary-600 pb-1'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Utilisateurs
              </button>
            )}
          </nav>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="hidden sm:inline text-sm text-gray-600">
                  Bonjour, {user.fullName ?? user.email}
                </span>
                <button
                  onClick={logout}
                  className="text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="text-sm font-medium text-primary-600 border border-primary-200 px-3 py-1 rounded-lg hover:bg-primary-50 transition-colors"
              >
                Connexion
              </button>
            )}
          </div>
        </div>
        <nav className="flex items-center gap-2">
          <NavBtn page="home" label="Accueil" />
          <NavBtn page="inflation-beat" label="Battre l’inflation" />
          <NavBtn page="projet-immo" label="Projection immo" />
          <NavBtn page="budget" label="Budget" /> {/* <= AJOUT */}

          <span className="opacity-30 mx-2">|</span>

          {!token ? (
            <>
              <NavBtn page="login" label="Se connecter" />
              <NavBtn page="signup" label="Créer un compte" />
            </>
          ) : (
            <>
              <NavBtn page="simulations" label="Mes simulations" />
              <span className="text-sm text-gray-700">
                {user?.firstName ? `Bonjour ${user.firstName}` : user?.email}
              </span>
              <button
                className="px-3 py-2 rounded border hover:bg-gray-50"
                onClick={logout}
                title="Se déconnecter"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
