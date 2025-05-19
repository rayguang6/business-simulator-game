// lib/store.ts
import { create } from 'zustand';

interface GameStore {
  selectedIndustry: Industry | null;
  setSelectedIndustry: (industry: Industry) => void;
  gameState: GameState | null;
  setGameState: (state: GameState) => void;
  updateCash: (amount: number) => void;
  updateRevenue: (amount: number) => void;
  updateExpenses: (amount: number) => void;
  updateCustomerRating: (amount: number) => void;
  setIndustryId: (industry_id: string) => void;
  addHistory: (entry: { month: number; card_id: string; choice_label: string; effects: Record<string, any>; }) => void;
  setGameOver: (isOver: boolean) => void;
  setWinCondition: (isWin: boolean) => void;
  setActiveCards: (activeCards: string[]) => void;
  nextMonth: () => void;
  resetGame: () => void;
  
  // New functions for temporary effects
  addTemporaryEffect: (effect: {
    name: string;
    revenue?: number;
    expenses?: number;
    customer_rating?: number;
    monthsRemaining: number;
  }) => void;
  processTemporaryEffects: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  selectedIndustry: null,
  setSelectedIndustry: (industry) => set({ selectedIndustry: industry }),
  
  gameState: null,
  setGameState: (state) => set({ gameState: state }),
  
  updateCash: (amount) => set((state) => 
    state.gameState ? { 
      gameState: { 
        ...state.gameState, 
        cash: state.gameState.cash + amount 
      } 
    } : {}
  ),
  
  updateRevenue: (amount) => set((state) => 
    state.gameState ? { 
      gameState: { 
        ...state.gameState, 
        revenue: state.gameState.revenue + amount 
      } 
    } : {}
  ),
  
  updateExpenses: (amount) => set((state) => 
    state.gameState ? { 
      gameState: { 
        ...state.gameState, 
        expenses: state.gameState.expenses + amount 
      } 
    } : {}
  ),
  
  updateCustomerRating: (amount) => set((state) => {
    if (!state.gameState) return {};
    
    // Ensure customer rating stays between 1 and 5
    const newRating = Math.min(5, Math.max(1, state.gameState.customer_rating + amount));
    
    return { 
      gameState: { 
        ...state.gameState, 
        customer_rating: newRating 
      } 
    };
  }),
  
  setIndustryId: (industry_id) => set((state) => 
    state.gameState ? { 
      gameState: { 
        ...state.gameState, 
        industry_id 
      } 
    } : {}
  ),
  
  addHistory: (entry) => set((state) => 
    state.gameState ? { 
      gameState: { 
        ...state.gameState, 
        history: [...state.gameState.history, entry] 
      } 
    } : {}
  ),
  
  setGameOver: (isOver) => set((state) => 
    state.gameState ? { 
      gameState: { 
        ...state.gameState, 
        game_over: isOver 
      } 
    } : {}
  ),
  
  setWinCondition: (isWin) => set((state) => 
    state.gameState ? { 
      gameState: { 
        ...state.gameState, 
        win_condition_met: isWin 
      } 
    } : {}
  ),
  
  setActiveCards: (activeCards) => set((state) => 
    state.gameState ? { 
      gameState: { 
        ...state.gameState, 
        active_cards: activeCards 
      } 
    } : {}
  ),
  
  nextMonth: () => set((state) => 
    state.gameState ? { 
      gameState: { 
        ...state.gameState, 
        month: state.gameState.month + 1 
      } 
    } : {}
  ),
  
  resetGame: () => set({ selectedIndustry: null, gameState: null }),
  
  // New function to add temporary effects
  addTemporaryEffect: (effect) => set((state) => {
    if (!state.gameState) return {};
    
    return { 
      gameState: { 
        ...state.gameState, 
        temporary_effects: [...(state.gameState.temporary_effects || []), effect] 
      } 
    };
  }),
  
  // Process temporary effects at month end
  processTemporaryEffects: () => set((state) => {
    if (!state.gameState) return {};
    
    // Reduce duration and filter out expired effects
    const updatedEffects = (state.gameState.temporary_effects || [])
      .map(effect => ({
        ...effect,
        monthsRemaining: effect.monthsRemaining - 1
      }))
      .filter(effect => effect.monthsRemaining > 0);
    
    return { 
      gameState: { 
        ...state.gameState, 
        temporary_effects: updatedEffects 
      } 
    };
  }),
}));