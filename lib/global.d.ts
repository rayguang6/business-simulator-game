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

interface Card {
  id: string;
  type: string;
  question: string;
  choices: {
    label: string;
    description: string;
    cashEffect: number;
    revenueEffect: number;
    expensesEffect: number;
    duration: number;
  }[];
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
