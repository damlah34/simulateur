import {
  InvestmentComparison,
  CalculationParams,
  RealEstateProjectionInput,
  RealEstateYearData,
} from '../types';

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

// --- Real estate helpers ---
export const calculateNotaryFees = (price: number): number => price * 0.07;

export const calculateMonthlyPayment = (
  loanAmount: number,
  annualRate: number,
  durationYears: number
): number => {
  const monthlyRate = annualRate / 12 / 100;
  const months = durationYears * 12;
  if (monthlyRate === 0) {
    return loanAmount / months;
  }
  return (
    loanAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months))
  );
};


export const buildRealEstateProjection = (
  input: RealEstateProjectionInput
): RealEstateYearData[] => {
  const {
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
    vacancyWeeks,
  } = input;

  const loanAmount = price - contribution;
  const monthlyPayment = calculateMonthlyPayment(loanAmount, rate, duration);
  const months = duration * 12;
  const monthlyRate = rate / 12 / 100;

  let remaining = loanAmount;
  let cumulativeCashflow = -works;
  let currentRent = rent;

  const results: RealEstateYearData[] = [];

  for (let m = 1; m <= months; m++) {
    if (m > 1 && (m - 1) % 12 === 0) {
      currentRent *= 1 + rentGrowth / 100;
    }
    const monthlyNetRent =
      currentRent * (1 - vacancyWeeks / 52) -
      charges -
      managementFees -
      insurance -
      pnoInsurance / 12 -
      tax / 12 -
      cfe / 12 -
      accountingFees / 12;
    const interest = remaining * monthlyRate;
    const principal = monthlyPayment - interest;
    remaining -= principal;
    cumulativeCashflow += monthlyNetRent - monthlyPayment;

    if (m % 12 === 0) {
      const year = m / 12;
      const capitalRepaid = loanAmount - remaining;
      const enrichissement = capitalRepaid + cumulativeCashflow;
      results.push({
        year,
        remainingPrincipal: Math.max(0, Math.round(remaining)),
        cumulativeCashflow: Math.round(cumulativeCashflow),
        enrichissement: Math.round(enrichissement),
      });
    }
  }

  return results;
};

