// components/game/IndustryGame.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/game/Card';
import MonthSummary from '@/components/game/MonthSummary';
import GameOver from '@/components/game/GameOver';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/store';

export default function IndustryGame({ industryData: serverIndustryData, initialCards, industryId }: {
  industryData: Industry,
  initialCards: Card[],
  industryId: string
}) {
  const router = useRouter();
  const [industryData, setIndustryData] = useState(serverIndustryData);

  // Zustand game state and actions
  const gameState = useGameStore((state) => state.gameState);
  const setGameState = useGameStore((state) => state.setGameState);
  const updateCash = useGameStore((state) => state.updateCash);
  const updateRevenue = useGameStore((state) => state.updateRevenue);
  const updateExpenses = useGameStore((state) => state.updateExpenses);
  const nextMonth = useGameStore((state) => state.nextMonth);

  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [showMonthSummary, setShowMonthSummary] = useState(false);
  const [monthSummary, setMonthSummary] = useState<any>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [effects, setEffects] = useState<any>(null);
  const [cardsThisMonth, setCardsThisMonth] = useState(0);
  const [isProcessingDecision, setIsProcessingDecision] = useState(false);
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  // Initialize game state in Zustand
  useEffect(() => {
    if (!industryData) return;
    setGameState({
      cash: industryData.startingCash,
      revenue: industryData.startingRevenue,
      expenses: industryData.startingExpenses,
      month: 4, // Start in April
      month_end: false,
      customer_rating: 3, // Default starting rating, or use industryData.startingCustomerRating if available
      industry_id: industryData.id,
      temporary_effects: [],
      history: [],
      game_over: false,
      win_condition_met: false,
      active_cards: []
    });
    setCurrentDate('April 2025');
    setCardsThisMonth(0);
  }, [industryData, setGameState]);

  // Show a new card when game state changes
  useEffect(() => {
    if (gameState && !showMonthSummary && !isGameOver && !isGameWon && !isProcessingDecision && cards.length > 0) {
      const randomIndex = Math.floor(Math.random() * cards.length);
      setCurrentCard(cards[randomIndex]);
    }
  }, [gameState, showMonthSummary, cards, isGameOver, isGameWon, isProcessingDecision]);
  
  // Process month end
  const processMonthEnd = (state: GameState) => {
    // Calculate monthly profit
    const monthlyRevenue = state.revenue;
    const monthlyExpenses = state.expenses;
    const monthlyProfit = monthlyRevenue - monthlyExpenses;

    // Add profit to cash
    const newCash = state.cash + monthlyProfit;
    updateCash(monthlyProfit);
    
      // Check for game over
  if (newCash < 0) {
      setIsGameOver(true);
  } else if (newCash >= 100000) {
      setIsGameWon(true);
    }

    // Prepare month summary
    setMonthSummary({
      month: state.month,
      revenue: monthlyRevenue,
      expenses: monthlyExpenses,
      profit: monthlyProfit,
      cash: state.cash + monthlyProfit
    });
    setShowMonthSummary(true);
    return state;
  };

  // Handle player decision
  const makeDecision = (choice: CardChoice) => {
    if (!gameState || isProcessingDecision) return;
    setIsProcessingDecision(true);
    // Use the effect values as-is (already scaled and rounded by backend)
    setEffects({
      cash: (choice.cash_min ?? 0),
      revenue: (choice.revenue_min ?? 0),
      expenses: (choice.expenses_min ?? 0)
    });
    setTimeout(() => {
      updateCash(choice.cash_min ?? 0);
      updateRevenue(choice.revenue_min ?? 0);
      updateExpenses(choice.expenses_min ?? 0);
      // Update month counter - every 2 cards = 1 month
      const newCardsThisMonth = cardsThisMonth + 1;
      setCardsThisMonth(newCardsThisMonth);
      if (newCardsThisMonth >= 2) {
        setCardsThisMonth(0);
        nextMonth();
        setCurrentDate((prev) => {
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
          if (!gameState) return prev;
          let newMonth = gameState.month + 1;
          let newYear = 2025; // Static for now
        if (newMonth > 12) {
          newMonth = 1;
          newYear++;
        }
          return `${monthNames[newMonth - 1]} ${newYear}`;
        });
        processMonthEnd({ ...gameState, month: gameState.month + 1 } as GameState);
      }
      setTimeout(() => {
        setEffects(null);
        setIsProcessingDecision(false);
      }, 1000);
    }, 1500);
  };

  // Close month summary and continue
  const closeMonthSummary = () => {
    setShowMonthSummary(false);
  };

  // Restart game
  const restartGame = () => {
    router.push('/');
  };

  // Confirmation dialog for back button
  const handleBack = () => {
    setShowConfirm(true);
  };
  const confirmBack = () => {
    setShowConfirm(false);
    router.push('/');
  };
  const cancelBack = () => {
    setShowConfirm(false);
  };

  // Start game from welcome screen
  const startGame = () => {
    setShowWelcome(false);
  };

  const getProfit = () => {
    return gameState ? gameState.revenue - gameState.expenses : 0;
  };

  if (showWelcome) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
        <div className="bg-slate-800 rounded-xl shadow-lg p-8 max-w-md w-full border-2 border-blue-700/30">
          <div className="flex flex-col items-center mb-4">
            <span className="text-5xl mb-2">{industryData.icon}</span>
            <h2 className="text-2xl font-bold mb-1">Welcome to {industryData.name}!</h2>
            <p className="text-slate-300 text-center mb-2">{industryData.description}</p>
          </div>
          <div className="mb-4 text-center">
            <p className="text-lg text-blue-300 font-semibold mb-1">How to Win</p>
            <p className="text-slate-200">Grow your business and reach <span className="text-green-400 font-bold">$100,000</span> cash before going bankrupt.</p>
          </div>
          <button
            onClick={startGame}
            className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg transition-all duration-200 text-lg"
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  if (!industryData || !gameState) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-xl">Loading your business empire...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-900 text-white">
      <div className="max-w-md mx-auto bg-slate-800 h-screen flex flex-col">
        {/* Fixed Header Area */}
        <div className="flex-shrink-0">
          {/* Game Header with Company & Date */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 shadow-lg">
            <div className="flex justify-between items-center">
              {/* Back Button */}
              <button
                onClick={handleBack}
                className="mr-2 text-white hover:text-blue-200 focus:outline-none"
                aria-label="Back to Home"
              >
                <span className="text-2xl">←</span>
              </button>
              {/* Industry Icon and Name */}
              <div className="flex items-center">
                <span className="text-2xl mr-2">{industryData.icon}</span>
                <h1 className="font-bold">{industryData.name}</h1>
              </div>
              {/* Date in Center */}
              <div className="bg-blue-900/50 px-3 py-1 rounded-full text-sm mx-auto">
                {currentDate}
              </div>
              {/* Customer Rating Stars at Right */}
              <div className="flex items-center ml-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < Math.round(gameState.customer_rating) ? 'text-yellow-400 text-lg' : 'text-slate-600 text-lg'}>
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Business Dashboard */}
          <div className="pt-3 pb-2 px-3 bg-slate-800">
            {/* Main Metrics */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {/* Fixed UI for Cash Metric Card to avoid overlap */}
              <div className="relative bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-3 overflow-hidden border border-slate-700 shadow-md">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-amber-400 opacity-75"></div>
                <div className="flex items-center text-amber-400 text-sm mb-1 font-medium">
                  <span className="mr-1">💰</span>
                  <span>CASH</span>
                </div>
                <div className="flex flex-col">
                  <div className="text-xl font-bold text-white mb-1">
                    ${gameState.cash.toLocaleString()}
                  </div>
                  {/* Cash Animation */}
                  <AnimatePresence>
                    {effects && effects.cash !== 0 && (
                      <motion.div
                        key="cash-effect"
                        className={`text-sm font-semibold ${effects.cash > 0 ? 'text-green-400' : 'text-red-400'}`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        {effects.cash > 0 ? '+' : ''}${effects.cash.toLocaleString()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Fixed UI for Revenue Metric Card to avoid overlap */}
              <div className="relative bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-3 overflow-hidden border border-slate-700 shadow-md">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400 opacity-75"></div>
                <div className="flex items-center text-emerald-400 text-sm mb-1 font-medium">
                  <span className="mr-1">📈</span>
                  <span>REVENUE</span>
                </div>
                <div className="flex flex-col">
                  <div className="text-xl font-bold text-white mb-1">
                    ${gameState.revenue.toLocaleString()}
                  </div>
                  {/* Revenue Animation */}
                  <AnimatePresence>
                    {effects && effects.revenue !== 0 && (
                      <motion.div
                        key="revenue-effect"
                        className={`text-sm font-semibold ${effects.revenue > 0 ? 'text-green-400' : 'text-red-400'}`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        {effects.revenue > 0 ? '+' : ''}${effects.revenue.toLocaleString()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Fixed UI for Expenses Metric Card to avoid overlap */}
              <div className="relative bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-3 overflow-hidden border border-slate-700 shadow-md">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-400 opacity-75"></div>
                <div className="flex items-center text-rose-400 text-sm mb-1 font-medium">
                  <span className="mr-1">📉</span>
                  <span>EXPENSES</span>
                </div>
                <div className="flex flex-col">
                  <div className="text-xl font-bold text-white mb-1">
                    ${gameState.expenses.toLocaleString()}
                  </div>
                  {/* Expenses Animation */}
                  <AnimatePresence>
                    {effects && effects.expenses !== 0 && (
                      <motion.div
                        key="expenses-effect"
                        className={`text-sm font-semibold ${effects.expenses < 0 ? 'text-green-400' : 'text-red-400'}`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        {effects.expenses < 0 ? '-' : '+'}${Math.abs(effects.expenses).toLocaleString()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            
            {/* Month Progress */}
            <div className="mb-3">
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 rounded-full"
                  style={{ width: `${cardsThisMonth * 50}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Month Progress</span>
                <span>{cardsThisMonth}/2 decisions</span>
              </div>
            </div>

            {/* Active Effects */}
            {gameState.temporary_effects && gameState.temporary_effects.length > 0 && (
              <div className="mb-2">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-medium text-slate-400">Active Effects:</p>
                  <span className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded-full">{gameState.temporary_effects.length}</span>
                </div>
                <div className="space-y-1">
                  {gameState.temporary_effects.map((effect: any, index: number) => (
                    <div
                      key={index}
                      className="text-xs bg-slate-700/50 px-3 py-1 rounded-md flex justify-between items-center border border-slate-600/50"
                    >
                      <span className="truncate text-slate-300">{effect.name.substring(0, 20)}...</span>
                      <span className="whitespace-nowrap">
                        {(effect.revenue ?? 0) !== 0 && (
                          <span className={(effect.revenue ?? 0) > 0 ? 'text-green-400' : 'text-red-400'}>
                            {(effect.revenue ?? 0) > 0 ? '+' : ''}${effect.revenue ?? 0}
                          </span>
                        )}
                        {(effect.expenses ?? 0) !== 0 && (
                          <span className={(effect.expenses ?? 0) < 0 ? 'text-green-400' : 'text-red-400'}>
                            {(effect.expenses ?? 0) > 0 ? ' +' : ' '}${effect.expenses ?? 0}
                          </span>
                        )}
                        <span className="text-slate-400 ml-1">({effect.monthsRemaining}m)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-50"></div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-grow overflow-y-auto">
          <div className="p-4">
            <AnimatePresence mode="wait">
              {isGameOver ? (
                <motion.div
                  key="game-over"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <GameOver
                    stats={gameState}
                    onRestart={restartGame}
                  />
                </motion.div>
              ) : isGameWon ? (
                <motion.div
                  key="game-won"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <div className="bg-slate-700 rounded-xl shadow-lg p-6 border-2 border-green-500/50">
                    <h2 className="text-3xl font-bold text-center mb-2 text-green-400">You Win!</h2>
                    <p className="text-center text-slate-300 mb-6">Your coffee shop has reached $100,000 in cash!</p>

                    <div className="bg-slate-800 p-4 rounded-lg mb-6 border border-slate-600">
                      <div className="text-center">
                        <div className="text-sm text-slate-400 mb-1">You succeeded in</div>
                        <div className="text-3xl font-bold text-white">{gameState.month} months</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="text-center">
                          <div className="text-sm text-slate-400 mb-1">Final Cash</div>
                          <div className="text-xl font-bold text-green-400">${gameState.cash.toLocaleString()}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-slate-400 mb-1">Monthly Profit</div>
                          <div className="text-xl font-bold text-white">${(gameState.revenue - gameState.expenses).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 text-center">
                      <motion.button
                        onClick={restartGame}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg transition-all duration-200"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Play Again
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ) : showMonthSummary ? (
                <motion.div
                  key="month-summary"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <MonthSummary
                    summary={monthSummary}
                    onClose={closeMonthSummary}
                  />
                </motion.div>
              ) : currentCard ? (
                <motion.div
                  key={currentCard.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <Card
                    card={currentCard}
                    onDecision={makeDecision}
                    disabled={isProcessingDecision}
                  />
                </motion.div>
              ) : (
                <div className="text-center text-slate-400 py-10">
                  <div className="animate-spin inline-block w-8 h-8 border-4 border-slate-600 border-t-indigo-500 rounded-full mb-2"></div>
                  <p>Loading next decision...</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-slate-800 rounded-lg shadow-lg p-6 max-w-xs w-full border border-blue-700/40">
            <h3 className="text-lg font-bold mb-2 text-white">Quit Game?</h3>
            <p className="text-slate-300 mb-4">Are you sure you want to quit? Your progress will be lost.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelBack}
                className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmBack}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Quit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}