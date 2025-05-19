// components/game/IndustryGame.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/game/Card';
import PnLReport from '@/components/game/PnLReport';
import GameOver from '@/components/game/GameOver';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { getRandomInRange, getRandomInt } from '@/lib/game-data/data-service';

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
  const updateCustomerRating = useGameStore((state) => state.updateCustomerRating);
  const addTemporaryEffect = useGameStore((state) => state.addTemporaryEffect);
  const processTemporaryEffects = useGameStore((state) => state.processTemporaryEffects);
  const addHistory = useGameStore((state) => state.addHistory);
  const nextMonth = useGameStore((state) => state.nextMonth);
  const setGameOver = useGameStore((state) => state.setGameOver);
  const setWinCondition = useGameStore((state) => state.setWinCondition);

  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [showPnLReport, setShowPnLReport] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [effects, setEffects] = useState<any>(null);
  const [cardsThisMonth, setCardsThisMonth] = useState(0);
  const [isProcessingDecision, setIsProcessingDecision] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [needNewCard, setNeedNewCard] = useState(false);

  // Simple card type probabilities
  const CARD_TYPE_PROBABILITIES = {
    opportunity: 0.60,
    problem: 0.20,
    market: 0.15,
    happy: 0.05
  };

  // Initialize game state in Zustand
  useEffect(() => {
    if (!industryData) return;
    
    const initialGameState = {
      cash: industryData.startingCash,
      revenue: industryData.startingRevenue,
      expenses: industryData.startingExpenses,
      month: 4, // Start in April
      month_end: false,
      customer_rating: 3,
      industry_id: industryId,
      temporary_effects: [],
      history: [],
      game_over: false,
      win_condition_met: false,
      active_cards: []
    };
    
    setGameState(initialGameState);
    setCurrentDate('April 2025');
    setCardsThisMonth(0);
  }, [industryData, setGameState, industryId]);

  // Set cards for the selected industry on new game
  useEffect(() => {
    if (!initialCards || !industryId) return;
    
    // Filter cards for this industry 
    const filtered = initialCards.filter(card => card.industry_id === industryId);
    console.log('Setting cards for industry', industryId, 'Count:', filtered.length);
    
    if (filtered.length === 0) {
      console.warn(`No cards found for industry ID "${industryId}"`);
      setCards(initialCards); // Fallback to all cards if none match
    } else {
      setCards(filtered);
    }
    
    setNeedNewCard(true);
  }, [industryId, initialCards]);

  // Helper to pick a type based on probability
  function pickTypeByProbability(probabilities: Record<string, number>): string {
    const rand = Math.random();
    let sum = 0;
    for (const [type, prob] of Object.entries(probabilities)) {
      sum += prob;
      if (rand < sum) return type;
    }
    return Object.keys(probabilities)[0];
  }

  // Show a new card when needed
  useEffect(() => {
    // Only select a new card when conditions allow
    if (!needNewCard || currentCard || !gameState || showPnLReport || isGameOver || isGameWon || isProcessingDecision) {
      return;
    }
    
    // Check if we have cards available
    if (cards.length === 0) {
      console.warn("No cards available to display");
      setNeedNewCard(false);
      return;
    }
    
    // Filter cards by game state requirements
    const filteredCards = cards.filter(card => {
      // Stage month (null means always available)
      if (card.stage_month !== null && card.stage_month > gameState.month) return false;
      // Min cash
      if (card.min_cash !== null && gameState.cash < card.min_cash) return false;
      // Max cash
      if (card.max_cash !== null && gameState.cash > card.max_cash) return false;
      return true;
    });
    
    console.log('Cards after filtering:', filteredCards.length);
    
    if (filteredCards.length === 0) {
      console.warn('No cards meet current criteria, using any available card');
      const randomIndex = Math.floor(Math.random() * cards.length);
      setCurrentCard(cards[randomIndex]);
    } else {
      // Pick a type by probability
      const type = pickTypeByProbability(CARD_TYPE_PROBABILITIES);
      console.log('Selected type:', type);
      
      // Filter by the selected type
      const typeFiltered = filteredCards.filter(card => card.type === type);
      console.log('Cards of type:', typeFiltered.length);
      
      // Use type-filtered cards or fallback to all filtered cards
      let available = typeFiltered.length > 0 ? typeFiltered : filteredCards;
      
      // Pick a random card
      const randomIndex = Math.floor(Math.random() * available.length);
      setCurrentCard(available[randomIndex]);
    }
    
    setNeedNewCard(false);
  }, [needNewCard, currentCard, gameState, showPnLReport, isGameOver, isGameWon, isProcessingDecision, cards]);

  // Process month end
  const processMonthEnd = () => {
    if (!gameState) return;
    
    // Process temporary effects first
    processTemporaryEffects();
    
    // Calculate monthly profit
    const monthlyRevenue = gameState.revenue;
    const monthlyExpenses = gameState.expenses;
    const monthlyProfit = monthlyRevenue - monthlyExpenses;
    
    // Add profit to cash
    updateCash(monthlyProfit);
    
    // Determine if game should end or player has won
    if (gameState.cash + monthlyProfit < 0) {
      setIsGameOver(true);
      setGameOver(true);
    } else if (gameState.cash + monthlyProfit >= 100000) {
      setIsGameWon(true);
      setWinCondition(true);
    }

    // Add monthly entry to history
    addHistory({
      month: gameState.month,
      card_id: 'month_end',
      choice_label: 'Month End',
      effects: {
        cash: monthlyProfit,
        revenue: 0,
        expenses: 0,
        customer_rating: 0
      }
    });
    
    // Show month-end effect animation
    setEffects({
      cash: monthlyProfit
    });
    
    // Clear effects after animation
    setTimeout(() => {
      setEffects(null);
      setNeedNewCard(true);
    }, 1500);
  };

  // Handle player decision
  const makeDecision = (choice: CardChoice) => {
    if (!gameState || isProcessingDecision || !currentCard) return;
    setIsProcessingDecision(true);
    
    // Calculate randomized effects
    const cashEffect = getRandomInRange(choice.cash_min ?? 0, choice.cash_max ?? (choice.cash_min ?? 0));
    const revenueEffect = getRandomInRange(choice.revenue_min ?? 0, choice.revenue_max ?? (choice.revenue_min ?? 0));
    const expensesEffect = getRandomInRange(choice.expenses_min ?? 0, choice.expenses_max ?? (choice.expenses_min ?? 0));
    const customerRatingEffect = getRandomInt(choice.customer_rating_min ?? 0, choice.customer_rating_max ?? (choice.customer_rating_min ?? 0));
    
    // Log the choices and calculated effects
    console.log('--- CHOICE CLICKED ---');
    console.log('Choice data:', choice);
    console.log('Calculated effects:');
    console.log(`Cash: ${cashEffect} (${choice.cash_is_percent ? 'percentage' : 'flat amount'})`);
    console.log(`Revenue: ${revenueEffect}/mo (${choice.revenue_is_percent ? 'percentage' : 'flat amount'})`);
    console.log(`Expenses: ${expensesEffect}/mo (${choice.expenses_is_percent ? 'percentage' : 'flat amount'})`);
    console.log(`Customer Rating: ${customerRatingEffect} points`);
    if (choice.revenue_duration && choice.revenue_duration > 1) {
      console.log(`Revenue effect lasts for ${choice.revenue_duration} months`);
    }
    if (choice.expenses_duration && choice.expenses_duration > 1) {
      console.log(`Expenses effect lasts for ${choice.expenses_duration} months`);
    }
    
    // Show effects animation immediately
    setEffects({
      cash: cashEffect,
      revenue: revenueEffect,
      expenses: expensesEffect,
      customer_rating: customerRatingEffect
    });

    // Apply effects immediately
    updateCash(cashEffect);
    updateRevenue(revenueEffect);
    updateExpenses(expensesEffect);
    if (customerRatingEffect !== 0) {
      updateCustomerRating(customerRatingEffect);
    }

    // Add to game history
    addHistory({
      month: gameState.month,
      card_id: currentCard.id,
      choice_label: choice.label,
      effects: {
        cash: cashEffect,
        revenue: revenueEffect,
        expenses: expensesEffect,
        customer_rating: customerRatingEffect
      }
    });

    // Add any duration-based effects
    if ((choice.revenue_duration && choice.revenue_duration > 1) || (choice.expenses_duration && choice.expenses_duration > 1)) {
      const newEffect = {
        name: `${currentCard.title}: ${choice.label}`,
        revenue: choice.revenue_duration && choice.revenue_duration > 1 ? revenueEffect : undefined,
        expenses: choice.expenses_duration && choice.expenses_duration > 1 ? expensesEffect : undefined,
        customer_rating: customerRatingEffect !== 0 ? customerRatingEffect : undefined,
        monthsRemaining: Math.max(choice.revenue_duration || 0, choice.expenses_duration || 0)
      };
      addTemporaryEffect(newEffect);
    }

    setCards(prevCards => prevCards.filter(card => card.id !== currentCard.id));
    setCurrentCard(null);

    const newCardsThisMonth = cardsThisMonth + 1;
    setCardsThisMonth(newCardsThisMonth);

    setTimeout(() => {
      if (newCardsThisMonth >= 2) {
        setCardsThisMonth(0);
        nextMonth();
        setCurrentDate((prev) => {
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
          if (!gameState) return prev;
          let newMonth = gameState.month + 1;
          let newYear = 2025;
          if (newMonth > 12) {
            newMonth = 1;
            newYear++;
          }
          return `${monthNames[newMonth - 1]} ${newYear}`;
        });
        processMonthEnd();
      } else {
        setEffects(null);
        setNeedNewCard(true);
      }
      setIsProcessingDecision(false);
    }, 1500);
  };

  // Show/hide PnL report
  const togglePnLReport = () => {
    setShowPnLReport(!showPnLReport);
  };
  
  // Close PnL report
  const closePnLReport = () => {
    setShowPnLReport(false);
    setNeedNewCard(true);
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
    setNeedNewCard(true); // Request first card when game starts
  };

  const getProfit = () => {
    return gameState ? gameState.revenue - gameState.expenses : 0;
  };

  // Welcome screen
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

  // Loading state
  if (!industryData || !gameState) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-xl">Loading your business empire...</div>
      </div>
    );
  }

  // Main game UI
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
                  <span 
                    key={i} 
                    className={i < Math.round(gameState.customer_rating) ? 'text-yellow-400 text-lg' : 'text-slate-600 text-lg'}
                  >
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
              {/* Cash Metric Card */}
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
                    {effects && effects.cash !== 0 && effects.cash !== undefined && (
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

              {/* Revenue Metric Card */}
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
                    {effects && effects.revenue !== 0 && effects.revenue !== undefined && (
                      <motion.div
                        key="revenue-effect"
                        className={`text-sm font-semibold ${effects.revenue > 0 ? 'text-green-400' : 'text-red-400'}`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        {effects.revenue > 0 ? '+' : ''}${effects.revenue.toLocaleString()}/mo
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Expenses Metric Card */}
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
                    {effects && effects.expenses !== 0 && effects.expenses !== undefined && (
                      <motion.div
                        key="expenses-effect"
                        className={`text-sm font-semibold ${effects.expenses < 0 ? 'text-green-400' : 'text-red-400'}`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        {effects.expenses < 0 ? '-' : '+'}${Math.abs(effects.expenses).toLocaleString()}/mo
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            
            {/* Monthly Profit Info */}
            <div className="mb-3 bg-slate-700/50 rounded-md p-2 text-center">
              <div className="text-sm text-slate-300">
                Monthly Profit: <span className={getProfit() >= 0 ? 'text-green-400' : 'text-red-400'}>
                  ${getProfit().toLocaleString()}/mo
                </span>
              </div>
            </div>
            
            {/* PnL Report Button & Month Progress */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={togglePnLReport}
                className="text-xs bg-blue-700/40 hover:bg-blue-700/60 text-blue-200 px-3 py-1 rounded-md transition-colors duration-200 flex items-center"
              >
                <span className="mr-1">📊</span> Financial Report
              </button>
              
              <div className="flex-grow ml-3">
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
                    <p className="text-center text-slate-300 mb-6">Your {industryData.name} has reached $100,000 in cash!</p>

                    <div className="bg-slate-800 p-4 rounded-lg mb-6 border border-slate-600">
                      <div className="text-center">
                        <div className="text-sm text-slate-400 mb-1">You succeeded in</div>
                        <div className="text-3xl font-bold text-white">{gameState.month - 4} months</div>
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
              ) : showPnLReport ? (
                <motion.div
                  key="pnl-report"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <PnLReport
                    gameState={gameState}
                    onClose={closePnLReport}
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