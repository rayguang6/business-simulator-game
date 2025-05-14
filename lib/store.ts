import { create } from 'zustand';

interface GameStore {
  selectedIndustry: Industry | null;
  setSelectedIndustry: (industry: Industry) => void;
  gameState: GameState | null;
  setGameState: (state: GameState) => void;
  updateCash: (amount: number) => void;
  updateRevenue: (amount: number) => void;
  updateExpenses: (amount: number) => void;
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
  nextMonth: () => set((state) => state.gameState ? { gameState: { ...state.gameState, month: state.gameState.month + 1 } } : {}),
  resetGame: () => set({ selectedIndustry: null, gameState: null }),
}));