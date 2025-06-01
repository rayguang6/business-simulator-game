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

// enum CardTypeEnum { ... } // Definition removed, now in lib/enums.ts

// Card type (matches your cards table)
interface Card {
  id: string;
  industry_id: string;
  type: CardTypeEnum; // This will now refer to the imported enum
  title: string;
  description: string;
  stage_month: number | null;
  min_cash: number | null;
  max_cash: number | null;
  rarity: number | null;
  choices: CardChoice[];
}
  
interface CardChoice {
  id: string;
  card_id: string;
  label: string;
  description: string;
  cash_is_percent: boolean;
  cash_min: number;
  cash_max: number;
  revenue_is_percent: boolean;
  revenue_min: number;
  revenue_max: number;
  revenue_duration: number | null;
  expenses_is_percent: boolean;
  expenses_min: number;
  expenses_max: number;
  expenses_duration: number | null;
  customer_rating_min: number;
  customer_rating_max: number;
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
  // interface CardChoiceGame {
  //   label: string;
  //   description: string;
  //   cash: number;
  //   revenue: number;
  //   expenses: number;
  //   customerRating: number;
  //   duration: number;
  // }

  
  // Admin form interface
  // interface CardFormData {
  //   id: string;
  //   industry_id: string;
  //   type: string;
  //   title: string;
  //   description: string;
  //   stage_month?: number;
  //   min_cash?: number;
  //   max_cash?: number;
  //   probability?: number; // Add probability field
  //   choices: CardChoiceFormData[];
  // }
  
  interface GameState {
    cash: number;
    revenue: number;
    expenses: number;
    month: number;
    month_end: boolean;
    customer_rating: number;
    industry_id: string;
    temporary_effects: {
      name: string;
      revenue?: number;
      expenses?: number;
      cash?: number;
      customer_rating?: number;
      monthsRemaining: number;
    }[];
    history: Array<{
      month: number;
      card_id: string;
      choice_label: string;
      effects: Record<string, any>;
    }>;
    game_over: boolean;
    win_condition_met: boolean;
    active_cards: string[]; // or Card[] if you want to store full card objects
  }

interface UserProfile {
  id: string; // Corresponds to Supabase auth.users.id
  username: string;
  display_name?: string | null; // Optional, can default to username
  email?: string | null; // From auth.users.email, for convenience in UI
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface GameSessionSupabase {
  id: string; 
  user_id: string; 
  industry_id: string;
  start_time: string; 
  end_time?: string | null;
  duration_minutes?: number | null;
  cards_played?: number | null;
  months_played?: number | null;
  outcome?: string | null;
  final_cash?: number | null;
  created_at?: string;
}

interface LeaderboardEntry {
  rank?: number; // Will be assigned client-side
  display_name: string | null;
  final_cash: number | null;
  months_played?: number | null;
  industry_name?: string; // Optional: If we want to show which industry
  outcome?: string | null; // Optional: To show if it was a win, etc.
}