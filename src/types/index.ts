export interface User {
  id: string;
  firstName: string;
  email: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (firstName: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

export interface InvestmentComparison {
  year: number;
  livretA: number;
  custom: number;
  inflation: number;
}

export interface CalculationParams {
  initialAmount: number;
  customRate: number;
  duration: number;
  inflationRate: number;
  monthlyContribution?: number;
  livretARate?: number;
}

export interface RealEstateProjectionInput {
  price: number;
  contribution: number;
  duration: number;
  rate: number;
  rent: number;
  charges: number;
  tax: number;
  insurance: number;
  works: number;
  cfe: number;
  pnoInsurance: number;
  accountingFees: number;
  managementFees: number;
  rentGrowth: number;
  vacancyWeeks: number;
  propertyGrowthRate: number;
  sellYear: number;
  agencyFees: number;
  notaryFees: number;
}

export interface RealEstateYearData {
  year: number;
  remainingPrincipal: number;
  repaidPrincipal: number;
  cumulativeCashflow: number;
  enrichissement: number;
  propertyValue: number;
  plusValue: number;
}
