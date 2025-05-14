// app/[industry]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { industries } from '@/lib/game-data/industries';
import { cards } from '@/lib/game-data/cards';
import Card from '@/components/game/Card';
import MonthSummary from '@/components/game/MonthSummary';
import GameOver from '@/components/game/GameOver';
import { motion, AnimatePresence } from 'framer-motion';

export default function IndustryPage({ params }) {
  // Unwrap params
  const resolvedParams = use(params);
  const { industry } = resolvedParams;

  const router = useRouter();

  // Game state
  const [gameState, setGameState] = useState(null);
  const [currentCard, setCurrentCard] = useState(null);
  const [industryData, setIndustryData] = useState(null);
  const [showMonthSummary, setShowMonthSummary] = useState(false);
  const [monthSummary, setMonthSummary] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [effects, setEffects] = useState(null);
  const [cardsThisMonth, setCardsThisMonth] = useState(0);
  const [isProcessingDecision, setIsProcessingDecision] = useState(false);

  // Find industry data
  useEffect(() => {
    const foundIndustry = industries.find(ind => ind.id === industry);
    if (!foundIndustry) {
      router.push('/');
      return;
    }

    setIndustryData(foundIndustry);

    // Initialize game state
    setGameState({
      cash: foundIndustry.startingCash,
      revenue: foundIndustry.startingRevenue,
      expenses: foundIndustry.startingExpenses,
      day: 1,
      month: 4, // Start in April
      year: 2025,
      temporaryEffects: [],
      delayedEffects: [] // For effects that trigger in future months
    });

    setCurrentDate('April 2025');
    setCardsThisMonth(0);
  }, [industry, router]);

  // Show a new card when game state changes
  useEffect(() => {
    if (gameState && !showMonthSummary && !isGameOver && !isGameWon && !isProcessingDecision) {
      const industryCards = cards[industry] || [];
      if (industryCards.length > 0) {
        const randomIndex = Math.floor(Math.random() * industryCards.length);
        setCurrentCard(industryCards[randomIndex]);
      }
    }
  }, [gameState, showMonthSummary, industry, isGameOver, isGameWon, isProcessingDecision]);

  // Process month end
  const processMonthEnd = (state) => {
    // Calculate monthly profit
    const monthlyRevenue = state.revenue;
    const monthlyExpenses = state.expenses;
    const monthlyProfit = monthlyRevenue - monthlyExpenses;

    // Add profit to cash
    state.cash += monthlyProfit;

    // Process delayed effects (like B2B payments)
    if (state.delayedEffects && state.delayedEffects.length > 0) {
      const currentMonth = state.month + (state.year - 2025) * 12;

      const triggeredEffects = [];
      const remainingEffects = [];

      state.delayedEffects.forEach(effect => {
        if (effect.triggerMonth <= currentMonth) {
          // Apply the effect now
          state.cash += effect.cash || 0;
          state.revenue += effect.revenue || 0;
          state.expenses += effect.expenses || 0;

          // Track for UI feedback
          triggeredEffects.push(effect);
        } else {
          // Keep for future
          remainingEffects.push(effect);
        }
      });

      // Update delayed effects
      state.delayedEffects = remainingEffects;
    }

    // Check if game over
    if (state.cash < 0) {
      setIsGameOver(true);
      return state;
    }

    // Check if win condition met
    if (state.cash >= 100000) {
      setIsGameWon(true);
      return state;
    }

    // Process temporary effects
    if (state.temporaryEffects?.length > 0) {
      state.temporaryEffects = state.temporaryEffects
        .map(effect => ({
          ...effect,
          monthsRemaining: effect.monthsRemaining - 1
        }))
        .filter(effect => effect.monthsRemaining > 0);
    }

    // Prepare month summary
    setMonthSummary({
      month: state.month,
      year: state.year,
      revenue: monthlyRevenue,
      expenses: monthlyExpenses,
      profit: monthlyProfit,
      cash: state.cash
    });

    setShowMonthSummary(true);
    return state;
  };

  // Handle player decision
  const makeDecision = (choice) => {
    if (!gameState || isProcessingDecision) return;

    // Set processing flag to prevent multiple clicks
    setIsProcessingDecision(true);

    // Show all effects at once
    setEffects({
      cash: choice.effects.cash || 0,
      revenue: choice.effects.revenue || 0,
      expenses: choice.effects.expenses || 0
    });

    // Apply effects after animation delay
    setTimeout(() => {
      // Apply immediate effects
      const newState = {
        ...gameState,
        cash: gameState.cash + (choice.effects.cash || 0),
        revenue: gameState.revenue + (choice.effects.revenue || 0),
        expenses: gameState.expenses + (choice.effects.expenses || 0),
      };

      // Handle delayed cash effects (like B2B payments)
      if (choice.effects.delayed_cash) {
        const currentMonth = newState.month + (newState.year - 2025) * 12;
        const triggerMonth = currentMonth + choice.effects.delayed_cash.months;

        newState.delayedEffects = [
          ...gameState.delayedEffects || [],
          {
            source: currentCard.id,
            description: `Payment from ${currentCard.question}`,
            cash: choice.effects.delayed_cash.value,
            triggerMonth
          }
        ];
      }

      // Handle temporary effects
      if (choice.effects.duration > 1) {
        newState.temporaryEffects = [
          ...gameState.temporaryEffects || [],
          {
            source: currentCard.id,
            name: currentCard.question,
            revenue: choice.effects.revenue || 0,
            expenses: choice.effects.expenses || 0,
            monthsRemaining: choice.effects.duration - 1
          }
        ];
      }

      // Update month counter - every 2 cards = 1 month
      const newCardsThisMonth = cardsThisMonth + 1;
      setCardsThisMonth(newCardsThisMonth);

      if (newCardsThisMonth >= 2) {
        // Month is over after 2 cards
        setCardsThisMonth(0);

        // Update month and year
        let newMonth = gameState.month;
        let newYear = gameState.year;

        newMonth++;
        if (newMonth > 12) {
          newMonth = 1;
          newYear++;
        }

        newState.month = newMonth;
        newState.year = newYear;

        // Update the date
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
        setCurrentDate(`${monthNames[newMonth - 1]} ${newYear}`);

        // Process month-end financials
        const processedState = processMonthEnd(newState);
        setGameState(processedState);
      } else {
        // Still in the same month
        setGameState(newState);
      }

      // Clear effects display and processing flag
      setTimeout(() => {
        setEffects(null);
        setIsProcessingDecision(false);
      }, 1000);
    }, 1500); // Delay for animations
  };

  // Close month summary and continue
  const closeMonthSummary = () => {
    setShowMonthSummary(false);
  };

  // Restart game
  const restartGame = () => {
    router.push('/');
  };

  const getProfit = () => {
    return gameState ? gameState.revenue - gameState.expenses : 0;
  };

  if (!industryData || !gameState) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-xl">Loading your business empire...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-md mx-auto bg-slate-800 min-h-screen relative overflow-hidden">
        {/* Game Header with Company & Date */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 shadow-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-2xl mr-2">{industryData.icon}</span>
              <h1 className="font-bold">{industryData.name}</h1>
            </div>
            <div className="bg-blue-900/50 px-3 py-1 rounded-full text-sm">
              {currentDate}
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

          {/* Profit/Loss Indicator */}
          <div className="mb-2">
            <div className={`text-center py-1 px-2 rounded-md text-sm font-medium ${getProfit() >= 0 ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
              {getProfit() >= 0 ? '🔼 PROFIT' : '🔽 LOSS'}:
              <span className="font-bold ml-1">
                ${Math.abs(getProfit()).toLocaleString()}/month
              </span>
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
          {gameState.temporaryEffects && gameState.temporaryEffects.length > 0 && (
            <div className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs font-medium text-slate-400">Active Effects:</p>
                <span className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded-full">{gameState.temporaryEffects.length}</span>
              </div>
              <div className="space-y-1">
                {gameState.temporaryEffects.map((effect, index) => (
                  <div
                    key={index}
                    className="text-xs bg-slate-700/50 px-3 py-1 rounded-md flex justify-between items-center border border-slate-600/50"
                  >
                    <span className="truncate text-slate-300">{effect.name.substring(0, 20)}...</span>
                    <span className="whitespace-nowrap">
                      {effect.revenue !== 0 && (
                        <span className={effect.revenue > 0 ? 'text-green-400' : 'text-red-400'}>
                          {effect.revenue > 0 ? '+' : ''}${effect.revenue}
                        </span>
                      )}
                      {effect.expenses !== 0 && (
                        <span className={effect.expenses < 0 ? 'text-green-400' : 'text-red-400'}>
                          {effect.expenses > 0 ? ' +' : ' '}${effect.expenses}
                        </span>
                      )}
                      <span className="text-slate-400 ml-1">({effect.monthsRemaining}m)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delayed Effects */}
          {gameState.delayedEffects && gameState.delayedEffects.length > 0 && (
            <div className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs font-medium text-slate-400">Pending Payments:</p>
                <span className="text-xs bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded-full">{gameState.delayedEffects.length}</span>
              </div>
              <div className="space-y-1">
                {gameState.delayedEffects.map((effect, index) => {
                  const currentMonth = gameState.month + (gameState.year - 2025) * 12;
                  const monthsRemaining = effect.triggerMonth - currentMonth;
                  return (
                    <div
                      key={index}
                      className="text-xs bg-amber-900/20 px-3 py-1 rounded-md flex justify-between items-center border border-amber-800/30"
                    >
                      <span className="truncate text-slate-300">{effect.description.substring(0, 15)}...</span>
                      <span className="whitespace-nowrap text-amber-300">
                        +${effect.cash.toLocaleString()} <span className="text-slate-400 ml-1">({monthsRemaining}m)</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-50"></div>

        {/* Card, Month Summary, or Game Over */}
        <div className="p-4 flex-grow">
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
  );
}