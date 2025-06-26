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
}