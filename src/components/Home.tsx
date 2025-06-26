import React from 'react';
import { TrendingUp, Calculator, Shield, Target } from 'lucide-react';

interface HomeProps {
  onNavigate: (page: string) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const features = [
    {
      icon: Calculator,
      title: 'Battre l\'inflation',
      description: 'Comparez vos placements avec le Livret A et découvrez la meilleure stratégie pour préserver votre pouvoir d\'achat.',
      action: 'inflation-beat',
      buttonText: 'Calculer maintenant'
    },
    {
      icon: Shield,
      title: 'Sécurité garantie',
      description: 'Vos données sont protégées et vos calculs restent confidentiels.',
      action: null,
      buttonText: null
    },
    {
      icon: Target,
      title: 'Objectifs personnalisés',
      description: 'Définissez vos objectifs financiers et suivez vos progrès vers la liberté financière.',
      action: null,
      buttonText: null
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center animate-fade-in">
            <div className="flex items-center justify-center mb-6">
              <TrendingUp className="h-16 w-16 text-primary-600" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Focus <span className="text-primary-600">Patrimoine</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Prenez le contrôle de votre patrimoine financier. Comparez vos placements, 
              battez l'inflation et construisez votre avenir financier en toute sérénité.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('inflation-beat')}
                className="bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Commencer l'analyse
              </button>
              <button
                onClick={() => onNavigate('register')}
                className="border-2 border-primary-600 text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                Créer un compte
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pourquoi choisir Focus Patrimoine ?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Des outils simples et puissants pour optimiser vos investissements
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-lg mb-6 mx-auto">
                  <feature.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-6 text-center">
                  {feature.description}
                </p>
                {feature.action && feature.buttonText && (
                  <div className="text-center">
                    <button
                      onClick={() => onNavigate(feature.action)}
                      className="bg-accent-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-accent-600 transition-colors"
                    >
                      {feature.buttonText}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à optimiser votre patrimoine ?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers d'épargnants qui ont déjà pris le contrôle de leurs finances
          </p>
          <button
            onClick={() => onNavigate('register')}
            className="bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            Commencer gratuitement
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;