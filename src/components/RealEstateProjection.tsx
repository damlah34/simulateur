// src/components/RealEstateProjection.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Home as HomeIcon, BarChart } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  calculateNotaryFees,
  calculateMonthlyPayment,
  buildRealEstateProjection,
  formatCurrency,
} from "../utils/calculations";
import { fetchCities, CitySuggestion } from "../utils/fetchCities";
import { RealEstateYearData } from "../types";
import { useAuth } from "../contexts/AuthContext";


type Props = {
  onNavigate?: (page: string, params?: any) => void;
};

export default function RealEstateProjection({ onNavigate }: Props) {
  // ------------------ États principaux ------------------
  const [price, setPrice] = useState(0);
  const [contribution, setContribution] = useState(0);

  // Default duration & rate as requested, but we won’t overwrite user values later:
  const [duration, setDuration] = useState(20); // défaut 20 ans
  const [rate, setRate] = useState(3); // défaut 3%

  const [propertyType, setPropertyType] =
    useState<"appartement" | "immeuble" | "colocation">("appartement");

  const [rent, setRent] = useState(0);
  const [lotCount, setLotCount] = useState(0);
  const [lotRents, setLotRents] = useState<number[]>([0]);
  const [roomCount, setRoomCount] = useState(0);
  const [roomRents, setRoomRents] = useState<number[]>([0]);

  const [charges, setCharges] = useState(0);
  const [tax, setTax] = useState(0);
  const [insurance, setInsurance] = useState(0);
  const [works, setWorks] = useState(0);
  const [cfe, setCfe] = useState(0);
  const [pnoInsurance, setPnoInsurance] = useState(0);
  const [accountingFees, setAccountingFees] = useState(0);
  const [managementFees, setManagementFees] = useState(0);
  const [rentGrowth, setRentGrowth] = useState(0);
  const [vacancy, setVacancy] = useState(0);
  const [propertyGrowthRate, setPropertyGrowthRate] = useState(0);

  // Défaut demandé : année de revente = 20 ans
  const [sellYear, setSellYear] = useState(20);

  const [agencyFees, setAgencyFees] = useState(0);
  const [notaryFees, setNotaryFees] = useState(0);
  const [projection, setProjection] = useState<RealEstateYearData[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [city, setCity] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);

  // Enregistrement
  const [title, setTitle] = useState("Projet locatif");
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);
  const [saveAsLoading, setSaveAsLoading] = useState(false);
  const { token, authFetch: af } = useAuth();

  // ------------------ Effets calculs de base ------------------
  useEffect(() => {
    setNotaryFees(calculateNotaryFees(price));
  }, [price]);

  // Reset projection quand un input important change
  useEffect(() => {
    setShowResults(false);
    setProjection([]);
  }, [
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
    vacancy,
    propertyGrowthRate,
    sellYear,
    agencyFees,
    notaryFees,
    propertyType,
  ]);

  // Ajustements du type de bien
  useEffect(() => {
    if (propertyType === "appartement") {
      setRent(0);
    } else if (propertyType === "immeuble") {
      setLotCount(1);
      setLotRents([0]);
      setRent(0);
    } else if (propertyType === "colocation") {
      setRoomCount(1);
      setRoomRents([0]);
      setRent(0);
    }
  }, [propertyType]);

  // ------------------ Calculs dépendants ------------------
  const financingNeed = useMemo(
    () => price + notaryFees + works + agencyFees - contribution,
    [price, notaryFees, works, agencyFees, contribution]
  );

  // ⚠️ Règle demandée : si besoin > 0 → par défaut durée=20 et taux=3 SANS écraser une saisie
  useEffect(() => {
    if (financingNeed > 0) {
      if (!duration || duration <= 0) setDuration(20);
      if (!rate || rate <= 0) setRate(3);
    }
    // Si besoin = 0, on n'impose rien, on masque juste les champs (voir rendu)
  }, [financingNeed, duration, rate]);

  const loanAmount = financingNeed;
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

  const grossYield = price + works > 0 ? (rent * 12 * 100) / (price + works) : 0;
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
  const netYieldBase = price + notaryFees + works + agencyFees;
  const netYield = netYieldBase > 0 ? (netAnnualIncome * 100) / netYieldBase : 0;

  const potentialSaleGain =
    projection.length > 0 ? projection[projection.length - 1].plusValue : 0;

  const globalBudget = price + works + notaryFees + agencyFees;

  // ------------------ Décision & alerte loyer manquant ------------------
  const rentIsZero = rent <= 0; // déjà consolidé pour immeuble/colocation
  const decisionBase =
    netYield >= 7 ? "Favorable" : netYield >= 5.5 ? "A Approfondir" : "NOGO (sauf exception patrimoniale)";

  const decisionText =
    showResults && rentIsZero
      ? "Attention, vous avez oublié de renseigner les revenus locatifs !"
      : showResults
      ? decisionBase
      : "-";

  const decisionColor =
    showResults && rentIsZero
      ? "text-red-600"
      : !showResults
      ? "text-gray-600"
      : netYield >= 7
      ? "text-emerald-600"
      : netYield >= 5.5
      ? "text-orange-600"
      : "text-red-600";

  // ------------------ Handlers ------------------
  function handleCalculate() {
    // Si loyer = 0, on peut quand même calculer (pour le reste), mais la décision sera l’alerte rouge
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
      agencyFees,
      notaryFees,
    });
    setProjection(data);
    setShowResults(true);
  }

  const handleCityChange = async (value: string) => {
    setCity(value);
    if (value.length < 2) {
      setCitySuggestions([]);
      return;
    }
    try {
      const results = await fetchCities(value);
      setCitySuggestions(results);
    } catch {
      setCitySuggestions([]);
    }
  };

  const handleCitySelect = (suggestion: CitySuggestion) => {
    setCity(`${suggestion.codePostal} ${suggestion.nom}`);
    setCitySuggestions([]);
  };

  const handleLotCountChange = (value: number) => {
    const count = Math.max(1, value);
    setLotCount(count);
    const newRents = [...lotRents];
    if (newRents.length < count) newRents.push(...Array(count - newRents.length).fill(0));
    else newRents.splice(count);
    setLotRents(newRents);
    setRent(newRents.reduce((sum, r) => sum + r, 0));
  };

  const handleLotRentChange = (index: number, value: number) => {
    const newRents = [...lotRents];
    newRents[index] = value;
    setLotRents(newRents);
    setRent(newRents.reduce((sum, r) => sum + r, 0));
  };

  const handleRoomCountChange = (value: number) => {
    const count = Math.max(1, value);
    setRoomCount(count);
    const newRents = [...roomRents];
    if (newRents.length < count) newRents.push(...Array(count - newRents.length).fill(0));
    else newRents.splice(count);
    setRoomRents(newRents);
    setRent(newRents.reduce((sum, r) => sum + r, 0));
  };

  const handleRoomRentChange = (index: number, value: number) => {
    const newRents = [...roomRents];
    newRents[index] = value;
    setRoomRents(newRents);
    setRent(newRents.reduce((sum, r) => sum + r, 0));
  };

  // Payload pour enregistrer
  function buildPayload() {
    return {
      meta: {
        city,
        propertyType,
        createdAt: new Date().toISOString(),
      },
      inputs: {
        price,
        contribution,
        duration,
        rate,
        rent,
        lotCount,
        lotRents,
        roomCount,
        roomRents,
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
        agencyFees,
        notaryFees,
      },
      computed: {
        financingNeed,
        loanAmount,
        monthlyPayment,
        monthlyCashflow,
        grossYield,
        netAnnualIncome,
        netYieldBase,
        netYield,
        potentialSaleGain,
        globalBudget,
      },
      projection,
    };
  }

  // Create
  async function saveSimulation() {
    try {
      if (!token) {
        if (onNavigate) onNavigate("login", { nextPage: "projet-immo" });
        else alert("Connectez-vous pour enregistrer votre simulation.");
        return;
      }
      setSaveErr(null);
      setSaveOk(false);
      setSaving(true);

      const body = {
        title: title && title.trim().length > 0 ? title.trim() : `Projet du ${new Date().toLocaleDateString()}`,
        payload: buildPayload(),
      };

      await af("/api/simulations", { method: "POST", body: JSON.stringify(body) });
      setSaveOk(true);
      if (onNavigate) onNavigate("simulations");
    } catch (e: any) {
      setSaveErr(e?.message || "Erreur lors de l’enregistrement");
    } finally {
      setSaving(false);
    }
  }

  // Save as (duplique)
  async function saveAs() {
    try {
      if (!token) {
        if (onNavigate) onNavigate("login", { nextPage: "projet-immo" });
        else alert("Connectez-vous pour enregistrer.");
        return;
      }
      setSaveErr(null);
      setSaveOk(false);
      setSaveAsLoading(true);

      const body = {
        title:
          title && title.trim().length > 0
            ? title.trim()
            : `Copie du ${new Date().toLocaleDateString()}`,
        payload: buildPayload(),
      };

      await af("/api/simulations", { method: "POST", body: JSON.stringify(body) });
      setSaveOk(true);
      if (onNavigate) onNavigate("simulations");
    } catch (e: any) {
      setSaveErr(e?.message || "Erreur lors de l’enregistrement (copie)");
    } finally {
      setSaveAsLoading(false);
    }
  }

  // ------------------ Tooltip ------------------
  interface TooltipPayload {
    color: string;
    name: string;
    value: number;
  }
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: TooltipPayload[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{`Année ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${formatCurrency(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // ------------------ Rendu ------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <HomeIcon className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Projet Immobilier
          </h1>

          {/* Zone titre + actions (mise en évidence haut de page) */}
          <div className="mt-4 flex flex-col md:flex-row items-center justify-center gap-2">
            <input
              className="border rounded px-3 py-2 w-full md:w-80"
              placeholder="Titre du projet (ex: F2 centre ville)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              title="Titre de la simulation"
            />
            <button
              onClick={saveSimulation}
              disabled={saving}
              className={`px-4 py-2 rounded text-white ${
                saving ? "bg-gray-400" : "bg-black hover:bg-gray-800"
              }`}
              title={token ? "Enregistrer cette simulation" : "Connectez-vous pour enregistrer"}
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              onClick={saveAs}
              disabled={saveAsLoading}
              className={`px-4 py-2 rounded border ${
                saveAsLoading ? "opacity-60" : "hover:bg-gray-50"
              }`}
              title={token ? "Enregistrer sous (dupliquer)" : "Connectez-vous pour enregistrer"}
            >
              {saveAsLoading ? "Duplication…" : "Enregistrer sous"}
            </button>
          </div>

          {saveErr && <p className="text-red-600 mt-2">{saveErr}</p>}
          {saveOk && <p className="text-green-600 mt-2">Simulation enregistrée ✅</p>}

          <p className="text-lg text-gray-600 mt-6">
            Simulez un investissement locatif et visualisez sa rentabilité.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Colonne paramètres */}
          <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              <BarChart className="h-6 w-6 mr-2 text-primary-600" />
              Paramètres
            </h2>

            <div className="grid grid-cols-3 gap-4">
              {/* Ville */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  {citySuggestions.length > 0 && (
                    <ul className="absolute z-10 bg-white border border-gray-300 mt-1 max-h-60 overflow-y-auto w-full rounded-md shadow-lg">
                      {citySuggestions.map((s) => (
                        <li
                          key={`${s.code}-${s.codePostal}`}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onMouseDown={() => handleCitySelect(s)}
                        >
                          {s.codePostal} {s.nom}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Prix */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix du bien (hors FAI)
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

              {/* Frais d'agence */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frais d'agence
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={agencyFees}
                    onChange={(e) => setAgencyFees(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <span className="absolute right-3 top-2 text-gray-500">€</span>
                </div>
              </div>

              {/* Travaux */}
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

              {/* Notaire */}
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

              {/* Apport */}
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

              {/* Durée + Taux → masqués si besoin = 0 */}
              {financingNeed > 0 && (
                <>
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
                </>
              )}

              {/* Type de bien + loyers */}
              <div className="col-span-3 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de bien
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) =>
                      setPropertyType(
                        e.target.value as "appartement" | "immeuble" | "colocation"
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="appartement">Appartement</option>
                    <option value="immeuble">Immeuble</option>
                    <option value="colocation">Colocation</option>
                  </select>
                </div>

                {propertyType === "appartement" && (
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
                )}

                {propertyType === "immeuble" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre de lots
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={lotCount}
                        onChange={(e) => handleLotCountChange(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    {lotRents.map((lotRent, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700">
                          {`Lot ${index + 1}`}
                        </label>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            value={lotRent}
                            onChange={(e) => handleLotRentChange(index, Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                          <span className="absolute right-3 top-2 text-gray-500">€</span>
                        </div>
                      </div>
                    ))}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Loyer mensuel total
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={rent}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                        />
                        <span className="absolute right-3 top-2 text-gray-500">€</span>
                      </div>
                    </div>
                  </>
                )}

                {propertyType === "colocation" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre de chambres
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={roomCount}
                        onChange={(e) => handleRoomCountChange(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    {roomRents.map((roomRent, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700">
                          {`Chambre ${index + 1}`}
                        </label>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            value={roomRent}
                            onChange={(e) => handleRoomRentChange(index, Number(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                          <span className="absolute right-3 top-2 text-gray-500">€</span>
                        </div>
                      </div>
                    ))}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Loyer mensuel total
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={rent}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                        />
                        <span className="absolute right-3 top-2 text-gray-500">€</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* curseurs */}
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

              {/* Charges & co */}
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
                  min={1}
                  max={30}
                  value={sellYear}
                  onChange={(e) => setSellYear(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-1">{sellYear} ans</p>
              </div>
            </div>

            <button
              onClick={handleCalculate}
              className="w-full bg-accent-600 text-white py-3 rounded-lg hover:bg-accent-700"
            >
              Calculer
            </button>
          </div>

          {/* Colonne résultats */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              <BarChart className="h-6 w-6 mr-2 text-primary-600" />
              Projection
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Budget global</h3>
                <p className="text-2xl font-bold text-primary-600">
                  {formatCurrency(globalBudget)}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Besoin en financement</h3>
                <p className="text-2xl font-bold text-primary-600">
                  {formatCurrency(financingNeed)}
                </p>
              </div>

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
                <p className={`text-xl font-semibold ${decisionColor}`}>{netYield.toFixed(2)}%</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg text-center col-span-2">
                <p className="text-sm text-gray-500">Décision</p>
                <p className={`text-xl font-semibold ${decisionColor}`}>{decisionText}</p>
              </div>
            </div>

            {showResults ? (
              <>
                <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                  <p className="text-sm text-gray-500">
                    Plus-value potentielle à l’année {sellYear}
                  </p>
                  <p className="text-xl font-semibold">{formatCurrency(potentialSaleGain)}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={projection}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="year"
                          tick={{ fontSize: 12 }}
                          label={{ value: "Années", position: "insideBottom", offset: -10 }}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="repaidPrincipal"
                          stroke="#3b82f6"
                          name="Capital remboursé"
                          strokeWidth={3}
                        />
                        <Line
                          type="monotone"
                          dataKey="cumulativeCashflow"
                          stroke="#10b981"
                          name="Cashflow cumulé"
                          strokeWidth={3}
                        />
                        <Line
                          type="monotone"
                          dataKey="enrichissement"
                          stroke="#f59e0b"
                          name="Enrichissement"
                          strokeWidth={3}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => window.print()}
                    className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700"
                  >
                    Enregistrer en PDF
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-white p-12 rounded-xl shadow-lg text-center">
                <HomeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  Remplissez le formulaire pour voir la projection
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}