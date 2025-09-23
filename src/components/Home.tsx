import React from "react";
import { TrendingUp, Calculator, Shield, Target, Home as HomeIcon } from "lucide-react";

interface HomeProps {
  onNavigate: (page: string) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const features = [
    {
      icon: Calculator,
      title: "Battre l'inflation",
      description:
        "Comparez vos placements avec le Livret A et découvrez la meilleure stratégie pour préserver votre pouvoir d'achat.",
      action: "inflation-beat",
      buttonText: "Calculer maintenant",
    },
    {
      icon: HomeIcon,
      title: "Projet immobilier",
      description: "Simulez un investissement locatif et visualisez sa rentabilité.",
      action: "projet-immo",
      buttonText: "Lancer la simulation",
    },
    {
      icon: Shield,
      title: "Sécurité garantie",
      description: "Vos données sont protégées et vos calculs restent confidentiels.",
      action: null,
      buttonText: null,
    },
    {
      icon: Target,
      title: "Objectifs personnalisés",
      description:
        "Définissez vos objectifs financiers et suivez vos progrès vers la liberté financière.",
      action: null,
      buttonText: null,
    },
  ];

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <TrendingUp className="h-16 w-16 text-primary-600" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-3">
              Focus <span className="text-primary-600">Patrimoine</span>
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Des outils simples et puissants pour optimiser vos investissements
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-lg mb-6 mx-auto">
                  <f.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                  {f.title}
                </h3>
                <p className="text-gray-600 mb-6 text-center">{f.description}</p>
                {f.action && f.buttonText && (
                  <div className="text-center">
                    <button
                      onClick={() => onNavigate(f.action!)}
                      className="bg-accent-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-accent-600 transition-colors"
                    >
                      {f.buttonText}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à optimiser votre patrimoine ?
          </h2>
          <p className="text-lg text-primary-100 mb-6 max-w-2xl mx-auto">
            Rejoignez des milliers d'épargnants qui ont déjà pris le contrôle de leurs finances
          </p>
          <button
            onClick={() => onNavigate("inflation-beat")}
            className="bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors shadow"
          >
            Commencer gratuitement
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;
