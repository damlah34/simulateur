
import { TrendingUp } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useFormattedBuildTime } from "../hooks/useFormattedBuildTime";

type HeaderProps = {
  currentPage: string;
  onNavigate: (page: string) => void;
};

type NavItem = {
  page: string;
  label: string;
  requiresAuth?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { page: "home", label: "Accueil" },
  { page: "inflation-beat", label: "Battre l'inflation" },
  { page: "projet-immo", label: "Projection immo" },
  { page: "budget", label: "Budget", requiresAuth: true },
  { page: "simulations", label: "Mes simulations", requiresAuth: true },
];

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const { token, user, logout } = useAuth();
  const formattedBuildTime = useFormattedBuildTime();


    return (
      <button
        key={item.page}
        onClick={() => onNavigate(item.page)}
        className={`text-sm font-medium transition-colors px-3 py-2 rounded ${
          isActive ? "text-primary-600 bg-primary-50" : "text-gray-600 hover:text-gray-900"
        }`}
      >
        {item.label}
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer text-gray-900 hover:text-primary-600 transition-colors"
          onClick={() => onNavigate("home")}
        >
          <TrendingUp className="h-6 w-6" />

        </div>

        <nav className="flex flex-wrap items-center gap-2 justify-start md:justify-center">
          {NAV_ITEMS.map(renderNavButton)}
        </nav>

        <div className="flex items-center gap-3 justify-end">
          {!token ? (
            <>
              <button
                onClick={() => onNavigate("login")}
                className="text-sm font-medium text-primary-600 border border-primary-200 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
              >
                Connexion
              </button>
              <button
                onClick={() => onNavigate("signup")}
                className="text-sm font-medium text-white bg-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Créer un compte
              </button>
            </>
          ) : (
            <>
              <span className="hidden sm:inline text-sm text-gray-600 truncate max-w-[160px]">
                Bonjour, {user?.fullName ?? user?.firstName ?? user?.email}
              </span>
              <button
                onClick={logout}
                className="text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors"
              >
                Déconnexion
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
