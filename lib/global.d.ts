interface Industry {
  id: string;
  name: string;
  description: string;
  icon: string;
  startingCash: number;
  startingRevenue: number;
  startingExpenses: number;
  isAvailable: boolean;
}

interface CardChoice {
  label: string;
  description: string;
  cash: number;
  revenue: number;
  expenses: number;
  customerRating: number;
  duration: number;
}

interface Card {
  id: number;
  type: string;
  title: string;
  description: string;
  stage_month?: number;
  min_cash?: number;
  max_cash?: number;
  choices: CardChoice[];
}

interface GameState {
  cash: number;
  revenue: number;
  expenses: number;
  month: number;
  month_end: boolean;
  temporary_effects: {
    name: string;
    revenue: number;
    expenses: number;
    monthsRemaining: number;
  }[];
  delayed_effects: {
    name: string;
    revenue: number;
    expenses: number;
    monthsRemaining: number;
  }[];
}
