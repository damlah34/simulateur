import React, { useState, useEffect } from 'react';
import { Home as HomeIcon, BarChart } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  calculateNotaryFees,
  calculateMonthlyPayment,
  buildRealEstateProjection,
  formatCurrency,
} from '../utils/calculations';
import { fetchCityPrice } from '../utils/fetchCityPrice';
import { RealEstateYearData } from '../types';

const RealEstateProjection: React.FC = () => {
  const [price, setPrice] = useState(200000);
  const [contribution, setContribution] = useState(20000);
  const [duration, setDuration] = useState(20);
  const [rate, setRate] = useState(2.5);
  const [rent, setRent] = useState(1000);
  const [charges, setCharges] = useState(100);
  const [tax, setTax] = useState(1000);
  const [insurance, setInsurance] = useState(20);
  const [works, setWorks] = useState(0);
  const [cfe, setCfe] = useState(0);
  const [pnoInsurance, setPnoInsurance] = useState(0);
  const [accountingFees, setAccountingFees] = useState(0);
  const [managementFees, setManagementFees] = useState(0);
  const [rentGrowth, setRentGrowth] = useState(0);
  const [vacancy, setVacancy] = useState(0);
  const [propertyGrowthRate, setPropertyGrowthRate] = useState(0);
  const [sellYear, setSellYear] = useState(duration);
  const [notaryFees, setNotaryFees] = useState(
    Math.round(calculateNotaryFees(price))
  );
  const [projection, setProjection] = useState<RealEstateYearData[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [city, setCity] = useState('');
  const [surface, setSurface] = useState(0);
  const [averageCityPrice, setAverageCityPrice] = useState<number | null>(null);
  const [cityError, setCityError] = useState<string | null>(null);

  useEffect(() => {
    setNotaryFees(calculateNotaryFees(price));
  }, [price]);

  useEffect(() => {
    if (sellYear > duration) {
      setSellYear(duration);
    }
  }, [duration, sellYear]);

  const handleCalculate = () => {
    const data = buildRealEstateProjection({
      price,
      contribution,
      duration,
      rate,
      rent,
      charges,
      tax,
      insurance,
      works,
      cfe,
      pnoInsurance,
      accountingFees,
      managementFees,
      rentGrowth,
      vacancyWeeks: vacancy,
      propertyGrowthRate,
      sellYear,
    });
    setProjection(data);
    setShowResults(true);
  };

  const handleCityBlur = async () => {
    if (!city) return;
    try {
      setCityError(null);
      setAverageCityPrice(null);
      const pricePerSqm = await fetchCityPrice(city);
      setAverageCityPrice(pricePerSqm);
    } catch {
      setCityError('Erreur lors de la récupération du prix de la ville.');
    }
  };

  const loanAmount = price - contribution;
  const monthlyPayment =
    loanAmount > 0 ? calculateMonthlyPayment(loanAmount, rate, duration) : 0;

  const monthlyCashflow =
    rent * (1 - vacancy / 52) -
    charges -
    managementFees -
    insurance -
    pnoInsurance / 12 -
    tax / 12 -
    cfe / 12 -
    accountingFees / 12 -
    monthlyPayment;

  const grossYield = (rent * 12 * 100) / price;
  const netAnnualIncome =
    (rent * (1 - vacancy / 52) -
      charges -
      managementFees -
      insurance -
      pnoInsurance / 12) *
      12 -
    tax -
    cfe -
    accountingFees;
  const netYield = (netAnnualIncome * 100) / price;
  const potentialSaleGain =
    projection.length > 0 ? projection[projection.length - 1].plusValue : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{`Année ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${formatCurrency(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <HomeIcon className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Projet immobilier
          </h1>
          <p className="text-lg text-gray-600">
            Simulez un investissement locatif et visualisez sa rentabilité.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              <BarChart className="h-6 w-6 mr-2 text-primary-600" />
              Paramètres
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Mensualité</h3>
                <p className="text-2xl font-bold text-primary-600">
                  {formatCurrency(monthlyPayment)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Cashflow mensuel</h3>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(monthlyCashflow)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                <p className="text-sm text-gray-500">Rendement brut</p>
                <p className="text-xl font-semibold">{grossYield.toFixed(2)}%</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                <p className="text-sm text-gray-500">Rendement net</p>
                <p className="text-xl font-semibold">{netYield.toFixed(2)}%</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onBlur={handleCityBlur}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                {averageCityPrice !== null && (
                  <p className="text-sm text-gray-500 mt-1">
                    Prix moyen : {formatCurrency(averageCityPrice)} /m²
                  </p>
                )}
                {cityError && (
                  <p className="text-sm text-red-600 mt-1">{cityError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Surface (m²)
                </label>
                <input
                  type="number"
                  value={surface}
                  onChange={(e) => setSurface(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                {averageCityPrice !== null && surface > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Prix suggéré : {formatCurrency(averageCityPrice * surface)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix du bien
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">€</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Travaux (total)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={works}
                    onChange={(e) => setWorks(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">€</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frais de notaire
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={notaryFees}
                    onChange={(e) => setNotaryFees(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    step={1}
                  />
                  <span className="absolute right-3 top-2 text-gray-500">€</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apport personnel
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={contribution}
                    onChange={(e) => setContribution(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">€</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durée du prêt
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-1">{duration} ans</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taux du prêt
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    step="0.1"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loyer mensuel attendu
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={rent}
                    onChange={(e) => setRent(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">€</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Augmentation annuelle du loyer
                </label>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={rentGrowth}
                  onChange={(e) => setRentGrowth(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-1">{rentGrowth}%</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Appréciation annuelle du bien
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={propertyGrowthRate}
                  onChange={(e) => setPropertyGrowthRate(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-1">{propertyGrowthRate}%</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Charges mensuelles
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={charges}
                    onChange={(e) => setCharges(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">€</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taxe foncière annuelle
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={tax}
                    onChange={(e) => setTax(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">€</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assurance mensuelle
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={insurance}
                    onChange={(e) => setInsurance(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">€</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CFE annuelle
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={cfe}
                    onChange={(e) => setCfe(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">€</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assurance PNO annuelle
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={pnoInsurance}
                    onChange={(e) => setPnoInsurance(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">€</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expert comptable annuel
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={accountingFees}
                    onChange={(e) => setAccountingFees(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">€</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gestion locative mensuelle
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={managementFees}
                    onChange={(e) => setManagementFees(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">€</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vacance (semaines/an)
                </label>
                <input
                  type="range"
                  min="0"
                  max="8"
                  value={vacancy}
                  onChange={(e) => setVacancy(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-1">{vacancy} semaines</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Année de revente
                </label>
                <input
                  type="range"
                  min="1"
                  max={duration}
                  value={sellYear}
                  onChange={(e) => setSellYear(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-1">{sellYear} ans</p>
              </div>
            </div>
            <button
              onClick={handleCalculate}
              className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700"
            >
              Calculer
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Mensualité</h3>
                <p className="text-2xl font-bold text-primary-600">
                  {formatCurrency(monthlyPayment)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Cashflow mensuel</h3>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(monthlyCashflow)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                <p className="text-sm text-gray-500">Rendement brut</p>
                <p className="text-xl font-semibold">{grossYield.toFixed(2)}%</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                <p className="text-sm text-gray-500">Rendement net</p>
                <p className="text-xl font-semibold">{netYield.toFixed(2)}%</p>
              </div>
            </div>
            {showResults ? (
              <>
                <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                  <p className="text-sm text-gray-500">Plus-value potentielle à l’année {sellYear}</p>
                  <p className="text-xl font-semibold">{formatCurrency(potentialSaleGain)}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={projection} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="year" tick={{ fontSize: 12 }} label={{ value: 'Années', position: 'insideBottom', offset: -10 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line type="monotone" dataKey="repaidPrincipal" stroke="#3b82f6" name="Capital remboursé" strokeWidth={3} />
                        <Line type="monotone" dataKey="cumulativeCashflow" stroke="#10b981" name="Cashflow cumulé" strokeWidth={3} />
                        <Line type="monotone" dataKey="enrichissement" stroke="#f59e0b" name="Enrichissement" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white p-12 rounded-xl shadow-lg text-center">
                <HomeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Remplissez le formulaire pour voir la projection</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealEstateProjection;

