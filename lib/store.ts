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
}

export const useGameStore = create<GameStore>((set) => ({
  selectedIndustry: null,
  setSelectedIndustry: (industry) => set({ selectedIndustry: industry }),
  gameState: null,
  setGameState: (state) => set({ gameState: state }),
  updateCash: (amount) => set((state) => state.gameState ? { gameState: { ...state.gameState, cash: state.gameState.cash + amount } } : {}),
  updateRevenue: (amount) => set((state) => state.gameState ? { gameState: { ...state.gameState, revenue: state.gameState.revenue + amount } } : {}),
  updateExpenses: (amount) => set((state) => state.gameState ? { gameState: { ...state.gameState, expenses: state.gameState.expenses + amount } } : {}),
  updateCustomerRating: (amount) => set((state) => state.gameState ? { gameState: { ...state.gameState, customer_rating: state.gameState.customer_rating + amount } } : {}),
  setIndustryId: (industry_id) => set((state) => state.gameState ? { gameState: { ...state.gameState, industry_id } } : {}),
  addHistory: (entry) => set((state) => state.gameState ? { gameState: { ...state.gameState, history: [...state.gameState.history, entry] } } : {}),
  setGameOver: (isOver) => set((state) => state.gameState ? { gameState: { ...state.gameState, game_over: isOver } } : {}),
  setWinCondition: (isWin) => set((state) => state.gameState ? { gameState: { ...state.gameState, win_condition_met: isWin } } : {}),
  setActiveCards: (activeCards) => set((state) => state.gameState ? { gameState: { ...state.gameState, active_cards: activeCards } } : {}),
  nextMonth: () => set((state) => state.gameState ? { gameState: { ...state.gameState, month: state.gameState.month + 1 } } : {}),
  resetGame: () => set({ selectedIndustry: null, gameState: null }),
}));