// global.d.ts

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
    // Updated to match your new schema with min/max values
    cash_min: number;
    cash_max: number;
    revenue_min: number;
    revenue_max: number;
    expenses_min: number;
    expenses_max: number;
    customer_rating_min: number;
    customer_rating_max: number;
    duration: number;
  }
  
  // For the admin interface to edit card choices
  interface CardChoiceFormData {
    id?: number; // Database ID (optional for new choices)
    card_id: string;
    label: string;
    description: string;
    cash_min: number;
    cash_max: number;
    revenue_min: number;
    revenue_max: number;
    expenses_min: number;
    expenses_max: number;
    customer_rating_min: number;
    customer_rating_max: number;
    duration: number;
  }
  
  // For the game to use generated values
  interface CardChoiceGame {
    label: string;
    description: string;
    cash: number;
    revenue: number;
    expenses: number;
    customerRating: number;
    duration: number;
  }
  
// global.d.ts update

interface Card {
    id: string;
    industry_id: string;
    type: string;
    title: string;
    description: string;
    stage_month?: number;
    min_cash?: number;
    max_cash?: number;
    probability?: number; // Add probability field (0-100)
    choices: CardChoiceGame[];
  }
  
  // Admin form interface
  interface CardFormData {
    id: string;
    industry_id: string;
    type: string;
    title: string;
    description: string;
    stage_month?: number;
    min_cash?: number;
    max_cash?: number;
    probability?: number; // Add probability field
    choices: CardChoiceFormData[];
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
    customer_rating: number; // Added based on your schema changes
  }