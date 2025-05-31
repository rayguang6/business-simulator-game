// components/game/IndustryGame.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/game/Card';
import PnLReport from '@/components/game/PnLReport';
import GameOver from '@/components/game/GameOver';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { getRandomInRange, getRandomInt, getRandomPercentInRange } from '@/lib/game-data/data-service';
import GameRunnerScene from './GameRunnerScene';

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
  const resetGame = useGameStore((state) => state.resetGame);

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
  const [effectDetails, setEffectDetails] = useState<any>(null);

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
  }, [industryId, initialCards]);

  // Defensive sync: reset state if industry_id does not match
  useEffect(() => {
    if (gameState && gameState.industry_id !== industryId) {
      resetGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industryId]);

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

  // Process month end
  const processMonthEnd = () => {
    // Always get the latest state from the store
    const latestState = useGameStore.getState();
    const latestGameState = latestState.gameState;
    if (!latestGameState) return;
    
    // Process temporary effects first
    processTemporaryEffects();
    
    // Calculate monthly profit using the latest state
    const monthlyRevenue = latestGameState.revenue;
    const monthlyExpenses = latestGameState.expenses;
    const monthlyProfit = monthlyRevenue - monthlyExpenses;
    
    // Add profit to cash
    updateCash(monthlyProfit);
    
    // Determine if game should end or player has won
    if (latestGameState.cash + monthlyProfit < 0) {
      setIsGameOver(true);
      setGameOver(true);
    } else if (latestGameState.cash + monthlyProfit >= 100000) {
      setIsGameWon(true);
      setWinCondition(true);
    }

    // Add monthly entry to history
    addHistory({
      month: latestGameState.month,
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
    }, 1500);
  };

  // Handle player decision
  const makeDecision = (choice: CardChoice) => {
    if (!gameState || isProcessingDecision || !currentCard) return;
    setIsProcessingDecision(true);
    
    // Calculate randomized effects
    // If *_is_percent is true, calculate as a percent of the current value
    const cashBase = gameState.cash;
    const revenueBase = gameState.revenue;
    const expensesBase = gameState.expenses;

    // Cash
    let cashRandom: number;
    if (choice.cash_is_percent) {
      cashRandom = getRandomPercentInRange(choice.cash_min ?? 0, choice.cash_max ?? (choice.cash_min ?? 0));
    } else {
      cashRandom = getRandomInRange(choice.cash_min ?? 0, choice.cash_max ?? (choice.cash_min ?? 0));
    }
    let cashEffect = cashRandom;
    if (choice.cash_is_percent) {
      cashEffect = Math.round(cashBase * (cashRandom / 100));
    }

    // Revenue
    let revenueRandom: number;
    if (choice.revenue_is_percent) {
      revenueRandom = getRandomPercentInRange(choice.revenue_min ?? 0, choice.revenue_max ?? (choice.revenue_min ?? 0));
    } else {
      revenueRandom = getRandomInRange(choice.revenue_min ?? 0, choice.revenue_max ?? (choice.revenue_min ?? 0));
    }
    let revenueEffect = revenueRandom;
    if (choice.revenue_is_percent) {
      revenueEffect = Math.round(revenueBase * (revenueRandom / 100));
    }

    // Expenses
    let expensesRandom: number;
    if (choice.expenses_is_percent) {
      expensesRandom = getRandomPercentInRange(choice.expenses_min ?? 0, choice.expenses_max ?? (choice.expenses_min ?? 0));
    } else {
      expensesRandom = getRandomInRange(choice.expenses_min ?? 0, choice.expenses_max ?? (choice.expenses_min ?? 0));
    }
    let expensesEffect = expensesRandom;
    if (choice.expenses_is_percent) {
      expensesEffect = Math.round(expensesBase * (expensesRandom / 100));
    }

    const customerRatingEffect = getRandomInt(choice.customer_rating_min ?? 0, choice.customer_rating_max ?? (choice.customer_rating_min ?? 0));
    
    // Store effect details for UI
    setEffectDetails({
      cash: choice.cash_is_percent ? { percent: cashRandom, value: cashEffect } : null,
      revenue: choice.revenue_is_percent ? { percent: revenueRandom, value: revenueEffect } : null,
      expenses: choice.expenses_is_percent ? { percent: expensesRandom, value: expensesEffect } : null,
    });

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

  // Callback functions for RunnerScene
  const handleCardSpawn = () => {
    console.log('Card collected in runner scene!');
    // Could trigger UI feedback here
  };

  const handleCashCollect = (amount: number) => {
    // Cash collection is already logged in RunnerScene
    // Could show cash collection animation/sound here
  };

  // Handle when player hits a card in runner scene
  const handleCardHit = (card: Card) => {
    // Just process the game logic, popup is already shown by RunnerScene
    setCurrentCard(card);
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

  // After welcome, show the animated runner scene with game integration
  return (
    <div className="relative">
      <GameRunnerScene isPaused={!!currentCard} />
      
      {/* Card Choice Modal */}
      <AnimatePresence>
        {currentCard && !isProcessingDecision && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <div className="max-w-lg w-full mx-4">
              <Card 
                card={currentCard} 
                onDecision={makeDecision}
                disabled={isProcessingDecision}
                effectDetails={effectDetails}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Effects Animation */}
      <AnimatePresence>
        {effects && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40"
          >
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-600 shadow-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {effects.cash !== 0 && (
                  <div className={`text-center ${effects.cash > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <div className="font-semibold">Cash</div>
                    <div>{effects.cash > 0 ? '+' : ''}${effects.cash}</div>
                  </div>
                )}
                {effects.revenue !== 0 && (
                  <div className={`text-center ${effects.revenue > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <div className="font-semibold">Revenue</div>
                    <div>{effects.revenue > 0 ? '+' : ''}${effects.revenue}/mo</div>
                  </div>
                )}
                {effects.expenses !== 0 && (
                  <div className={`text-center ${effects.expenses > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    <div className="font-semibold">Expenses</div>
                    <div>{effects.expenses > 0 ? '+' : ''}${effects.expenses}/mo</div>
                  </div>
                )}
                {effects.customer_rating !== 0 && (
                  <div className={`text-center ${effects.customer_rating > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <div className="font-semibold">Rating</div>
                    <div>{effects.customer_rating > 0 ? '+' : ''}{effects.customer_rating}</div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}