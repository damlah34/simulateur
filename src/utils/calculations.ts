import { InvestmentComparison, CalculationParams } from '../types';

const LIVRET_A_RATE = 0.03; // 3% taux Livret A

export const calculateInvestmentComparison = (params: CalculationParams): InvestmentComparison[] => {
  const { initialAmount, customRate, duration, inflationRate, monthlyContribution = 0 } = params;
  const results: InvestmentComparison[] = [];

  // Taux mensuels
  const livretAMonthlyRate = LIVRET_A_RATE / 12;
  const customMonthlyRate = (customRate / 100) / 12;
  const inflationMonthlyRate = (inflationRate / 100) / 12;

  for (let year = 0; year <= duration; year++) {
    const monthsElapsed = year * 12;
    
    let livretAValue, customValue, inflationValue;
    
    if (monthsElapsed === 0) {
      // Année 0 : capital initial seulement
      livretAValue = initialAmount;
      customValue = initialAmount;
      inflationValue = initialAmount;
    } else {
      // Calcul mois par mois pour une précision maximale
      livretAValue = calculateMonthlyCompounding(initialAmount, livretAMonthlyRate, monthlyContribution, monthsElapsed);
      customValue = calculateMonthlyCompounding(initialAmount, customMonthlyRate, monthlyContribution, monthsElapsed);
      inflationValue = calculateMonthlyCompounding(initialAmount, inflationMonthlyRate, monthlyContribution, monthsElapsed);
    }

    results.push({
      year,
      livretA: Math.round(livretAValue),
      custom: Math.round(customValue),
      inflation: Math.round(inflationValue),
    });
  }

  return results;
};

// Fonction pour calculer la capitalisation mensuelle avec versements
const calculateMonthlyCompounding = (
  initialAmount: number, 
  monthlyRate: number, 
  monthlyContribution: number, 
  totalMonths: number
): number => {
  let balance = initialAmount;
  
  // Simulation mois par mois
  for (let month = 1; month <= totalMonths; month++) {
    // Application des intérêts sur le solde existant
    balance = balance * (1 + monthlyRate);
    
    // Ajout du versement mensuel (qui commencera à produire des intérêts le mois suivant)
    balance += monthlyContribution;
  }
  
  return balance;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export const getLivretARate = (): number => LIVRET_A_RATE;