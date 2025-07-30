import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, AlertCircle, PiggyBank } from 'lucide-react';
import ComparisonChart from './ComparisonChart';
import { calculateInvestmentComparison, formatCurrency, getLivretARate } from '../utils/calculations';
import { InvestmentComparison } from '../types';

const InflationBeat: React.FC = () => {
  const [initialAmount, setInitialAmount] = useState<number>(0);
  const [customRate, setCustomRate] = useState<number>(5);
  const [livretARate, setLivretARate] = useState<number>(getLivretARate() * 100);
  const [duration, setDuration] = useState<number>(10);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(0);
  const [comparisonData, setComparisonData] = useState<InvestmentComparison[]>([]);

  const inflationRate = 2; // 2% d'inflation moyenne

  const showResults = initialAmount > 0 || monthlyContribution > 0;

  useEffect(() => {
    if (showResults) {
      const data = calculateInvestmentComparison({
        initialAmount,
        customRate,
        duration,
        inflationRate,
        monthlyContribution,
        livretARate,
      });
      setComparisonData(data);
    } else {
      setComparisonData([]);
    }
  }, [initialAmount, customRate, duration, monthlyContribution, livretARate]);

  const finalCustomValue = comparisonData.length > 0 ? comparisonData[comparisonData.length - 1].custom : 0;
  const finalLivretAValue = comparisonData.length > 0 ? comparisonData[comparisonData.length - 1].livretA : 0;
  const difference = finalCustomValue - finalLivretAValue;
  const isCustomBetter = difference > 0;

  const totalContributions = initialAmount + (monthlyContribution * duration * 12);
  const customGain = finalCustomValue - totalContributions;
  const livretAGain = finalLivretAValue - totalContributions;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Calculator className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Battre l'inflation
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Comparez votre stratégie de placement avec le Livret A et découvrez 
            la meilleure option pour préserver votre pouvoir d'achat.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="h-6 w-6 mr-2 text-primary-600" />
              Paramètres de simulation
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capital initial
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    min="1000"
                    step="1000"
                  />
                  <span className="absolute right-3 top-3 text-gray-500">€</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center">
                    <PiggyBank className="h-4 w-4 mr-1 text-primary-600" />
                    Versement mensuel (optionnel)
                  </div>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    min="0"
                    step="50"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-3 text-gray-500">€/mois</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Montant que vous souhaitez épargner chaque mois
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taux de votre placement personnalisé
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={customRate}
                    onChange={(e) => setCustomRate(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    min="0"
                    max="20"
                    step="0.1"
                  />
                  <span className="absolute right-3 top-3 text-gray-500">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taux du Livret A
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={livretARate}
                    onChange={(e) => setLivretARate(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    min="0"
                    max="5"
                    step="0.1"
                  />
                  <span className="absolute right-3 top-3 text-gray-500">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée de placement
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    min="1"
                    max="30"
                  />
                  <span className="absolute right-3 top-3 text-gray-500">ans</span>
                </div>
              </div>

              {monthlyContribution > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Récapitulatif des versements</h4>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p>• Capital initial : {formatCurrency(initialAmount)}</p>
                    <p>• Versements mensuels : {formatCurrency(monthlyContribution)} × {duration * 12} mois</p>
                    <p>• Total des versements : {formatCurrency(monthlyContribution * duration * 12)}</p>
                    <p className="font-semibold border-t border-blue-300 pt-2 mt-2">
                      Total investi : {formatCurrency(totalContributions)}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Références utilisées :</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Livret A : {livretARate}% (taux saisi)</li>
                  <li>• Inflation moyenne : {inflationRate}%</li>
                </ul>
              </div>

            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {showResults && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Livret A ({duration} ans)</h3>
                    <p className="text-2xl font-bold text-amber-600">
                      {formatCurrency(finalLivretAValue)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Gain : {formatCurrency(livretAGain)}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Votre placement ({duration} ans)</h3>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(finalCustomValue)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Gain : {formatCurrency(customGain)}
                    </p>
                  </div>
                </div>

                {/* Investment Summary */}
                {monthlyContribution > 0 && (
                  <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé de votre investissement</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Capital initial</p>
                        <p className="font-semibold">{formatCurrency(initialAmount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Versements mensuels</p>
                        <p className="font-semibold">{formatCurrency(monthlyContribution * duration * 12)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total investi</p>
                        <p className="font-semibold text-lg">{formatCurrency(totalContributions)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Différence de gain</p>
                        <p className={`font-semibold text-lg ${isCustomBetter ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(customGain - livretAGain)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comparison Result */}
                <div className={`p-6 rounded-xl shadow-lg ${isCustomBetter ? 'bg-emerald-50 border-l-4 border-emerald-500' : 'bg-amber-50 border-l-4 border-amber-500'}`}>
                  <div className="flex items-start">
                    <AlertCircle className={`h-6 w-6 mt-1 mr-3 ${isCustomBetter ? 'text-emerald-600' : 'text-amber-600'}`} />
                    <div>
                      <h3 className={`font-semibold ${isCustomBetter ? 'text-emerald-800' : 'text-amber-800'}`}>
                        {isCustomBetter ? 'Excellent choix !' : 'Attention !'}
                      </h3>
                      <p className={`mt-1 text-sm ${isCustomBetter ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {isCustomBetter
                          ? `Votre placement rapporte ${formatCurrency(Math.abs(difference))} de plus que le Livret A sur ${duration} ans.`
                          : `Le Livret A rapporte ${formatCurrency(Math.abs(difference))} de plus que votre placement sur ${duration} ans.`
                        }
                      </p>
                      {monthlyContribution > 0 && (
                        <p className={`mt-2 text-xs ${isCustomBetter ? 'text-emerald-600' : 'text-amber-600'}`}>
                          Avec vos versements mensuels de {formatCurrency(monthlyContribution)}, 
                          vous investissez {formatCurrency(totalContributions)} au total.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Chart */}
                <ComparisonChart data={comparisonData} customRate={customRate} />
              </>
            )}

            {!showResults && (
              <div className="bg-white p-12 rounded-xl shadow-lg text-center">
                <Calculator className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">
                  Prêt pour la simulation ?
                </h3>
                <p className="text-gray-400">
                  Remplissez le formulaire pour voir les résultats en temps réel
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InflationBeat;