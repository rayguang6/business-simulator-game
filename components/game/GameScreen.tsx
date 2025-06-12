"use client";
import GameRunnerScene, { GameRunnerSceneHandles } from './GameRunnerScene';
import React, { useState, useEffect, useRef } from 'react';
import { CardTypeEnum, CARD_TYPE_DEFINITIONS, TOTAL_CARD_TYPE_WEIGHT, CARD_TYPE_COLORS } from '@/lib/constants';
import GameHUD from './GameHUD';
import { useRouter } from 'next/navigation';
import { RoadObject } from '@/lib/game/managers/RoadObjectManager';
import CardDisplay from '@/components/game/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { getRandomInRange, getRandomInt, getRandomPercentInRange } from '@/lib/game-data/data-service';
import { GameSessionService } from '@/lib/services/gameSessionService';
import { UserProfileService } from '@/lib/services/userProfileService';
import GameOver from './GameOver';
import PnLReport from './PnLReport';

// CardTypeEnum, Industry, Card, CardChoice are globally available from lib/global.d.ts

interface EffectCalculationDetail {
  metric: 'cash' | 'revenue' | 'expenses' | 'customerRating';
  value: number; // The actual calculated monetary or point change
  isPercent: boolean;
  displayPercentValue?: number; // The raw percentage value, e.g., 10 for 10%
}

export interface EffectAnimationItem extends EffectCalculationDetail {
  id: string;
}

// Session tracking interface for analytics and leaderboard (using imported GameSession type)
// interface GameSession - removed as we're importing it from sessionStorage

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getCurrentMonthYear = () => {
  const now = new Date();
  return { month: now.getMonth(), year: now.getFullYear() };
};

const formatMonthYear = (month: number, year: number) => {
  return `${monthNames[month]} ${year}`;
};

const getRandomCardType = (): CardTypeEnum => {
  let randomWeight = Math.random() * TOTAL_CARD_TYPE_WEIGHT;
  for (const def of CARD_TYPE_DEFINITIONS) {
    if (randomWeight < def.weight) {
      return def.type;
    }
    randomWeight -= def.weight;
  }
  return CardTypeEnum.opportunity; // Fallback
};

interface GameScreenProps {
  industry: Industry; 
  cards: Card[]; // This should contain the actual card data for the game
}

type MonthPhase = 'awaitingFirstCard' | 'awaitingSecondCard' | 'awaitingCash' | 'cardDecision';
type GameOverStatus = 'win' | 'lose' | null; // New type for game over

// Simple client-side auth check function
async function checkAuthAndRedirect(router: ReturnType<typeof useRouter>) {
  const userProfile = await UserProfileService.getCurrentUserAndProfile();
  if (!userProfile) {
    router.replace('/');
  }
}

const GameScreen: React.FC<GameScreenProps> = ({ industry, cards }) => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [cash, setCash] = useState(() => industry.startingCash || 0);
  const [revenue, setRevenue] = useState(() => industry.startingRevenue || 0);
  const [expenses, setExpenses] = useState(() => industry.startingExpenses || 0);
  const [customerRating, setCustomerRating] = useState(75);

  const [month, setMonth] = useState(() => getCurrentMonthYear().month);
  const [year, setYear] = useState(() => getCurrentMonthYear().year);
  
  const [monthPhase, setMonthPhase] = useState<MonthPhase>('awaitingFirstCard');
  const [cardsCollectedCount, setCardsCollectedCount] = useState(0); 
  const [currentDisplayCard, setCurrentDisplayCard] = useState<Card | null>(null);
  const [effectAnimations, setEffectAnimations] = useState<EffectAnimationItem[]>([]);
  const [gameOverStatus, setGameOverStatus] = useState<GameOverStatus>(null);
  const [monthsPlayed, setMonthsPlayed] = useState(0);

  // NEW Local state for simplified session tracking
  const [gameSessionStartTime, setGameSessionStartTime] = useState<number>(0);
  const [cardsPlayedThisSession, setCardsPlayedThisSession] = useState<number>(0);

  const [showQuitModal, setShowQuitModal] = useState(false); // New state for quit confirmation

  const gameRunnerSceneRef = useRef<GameRunnerSceneHandles>(null);
  const backgroundAudioRef = useRef<HTMLAudioElement>(null); // Added for background audio

  const [highestCash, setHighestCash] = useState(cash); // Track highest cash

  const [playerName, setPlayerName] = useState<string>('');
  const [newRecord, setNewRecord] = useState<{months: boolean, cash: boolean, cards: boolean}>({months: false, cash: false, cards: false});
  const [shareMessage, setShareMessage] = useState<string>('');

  const [showPnLReport, setShowPnLReport] = useState(false);
  
  // Track decisions across all months for PnL Report
  const [decisionHistory, setDecisionHistory] = useState<Array<{
    month: number;
    cardTitle: string;
    choiceLabel: string;
    effects: any;
  }>>([]);

  useEffect(() => {
    (async () => {
      // Wait for background image to load before mounting
      if (gameRunnerSceneRef.current && gameRunnerSceneRef.current.waitForBackgroundImageLoad) {
        try {
          await gameRunnerSceneRef.current.waitForBackgroundImageLoad();
        } catch (e) {
          // Ignore error, allow game to mount anyway
        }
      }
      setIsMounted(true);
      setCash(industry.startingCash || 0);
      setRevenue(industry.startingRevenue || 0); 
      setExpenses(industry.startingExpenses || 0);
      setMonthsPlayed(0);
      setCardsPlayedThisSession(0); 
      setGameSessionStartTime(Date.now()); 
      setGameOverStatus(null); 
      setIsInitialized(true);
    })();
  }, [industry]);

  useEffect(() => {
    if (isMounted && backgroundAudioRef.current) {
      backgroundAudioRef.current.loop = true;
      backgroundAudioRef.current.play().catch(error => {
        console.warn("Background audio playback failed:", error);
        // Optionally, provide a UI element for the user to manually start audio
      });
    }
  }, [isMounted]);

  // Auth check on mount
  useEffect(() => {
    checkAuthAndRedirect(router);
  }, [router]);

  // Whenever cash changes, update highestCash if needed
  useEffect(() => {
    setHighestCash(prev => (cash > prev ? cash : prev));
  }, [cash]);

  useEffect(() => {
    (async () => {
      const profile = await UserProfileService.getCurrentUserAndProfile();
      setPlayerName(profile?.display_name || profile?.username || 'Player');
      const sessions = await GameSessionService.getGameSessionsForCurrentUser();
      const stats = GameSessionService.calculateUserStats(sessions);
      setNewRecord({
        months: monthsPlayed > (stats.longestSurvival || 0),
        cash: highestCash > (stats.highestCash || 0),
        cards: cardsPlayedThisSession > Math.max(...sessions.map(s => s.cards_played || 0), 0)
      });
      setShareMessage(
        `I survived ${monthsPlayed} months as a ${industry.icon || '🏭'} ${industry.name} in Business Simulator! My highest cash: $${highestCash.toLocaleString()}. Can you beat me? ${window.location.origin}`
      );
    })();
  }, [gameOverStatus]);

  const audioMap: Record<string, string> = {
    card: '/audio/card.mp3',
    cash: '/audio/cash.mp3',
  };

  const handleBackButtonClick = () => {
    if (gameOverStatus) { 
        router.push('/');
        return;
    }
    setShowQuitModal(true); // Show custom modal instead of confirm
  };

  const handleConfirmQuit = () => {
    handleGameConcluded('quit', cash, monthsPlayed);
    router.push('/');
  };

  const spawnNewCard = () => {
    if (!isMounted || !cards || cards.length === 0 || gameOverStatus) { // Halt if game over
      console.error("GameScreen: Cannot spawn card. Not mounted, no cards, or game over.");
      return;
    } 

    const cardTypeToSpawn = getRandomCardType();
    const currentGameMonthOneIndexed = month + 1;

    console.log(`GameScreen: ----- New Card Spawn Attempt -----`);
    console.log(`GameScreen: Target type: ${cardTypeToSpawn}, Current month (1-idx): ${currentGameMonthOneIndexed}, Current cash: $${cash}`);
    console.log(`GameScreen: Total cards in deck: ${cards.length}`);
    console.log(`GameScreen: Industry starting cash: ${industry.startingCash}, Current isInitialized: ${isInitialized}`);

    // Primary filter: by type and conditions
    const primaryEligibleCards = cards.filter(card => {
      const typeMatch = card.type === cardTypeToSpawn;
      const stageMatch = (card.stage_month === null || currentGameMonthOneIndexed >= card.stage_month);
      const minCashMatch = (card.min_cash === null || cash >= card.min_cash);
      const maxCashMatch = (card.max_cash === null || cash <= card.max_cash);
      // console.log(`  - Card Eval (Primary): ${card.id} - ${card.title.substring(0,20)}... | Type: ${card.type}(${typeMatch}) | Stage: ${card.stage_month}(${stageMatch}) | MinCash: ${card.min_cash}(${minCashMatch}) | MaxCash: ${card.max_cash}(${maxCashMatch}) | Result: ${typeMatch && stageMatch && minCashMatch && maxCashMatch}`);
      return typeMatch && stageMatch && minCashMatch && maxCashMatch;
    });
    console.log(`GameScreen: Found ${primaryEligibleCards.length} cards matching target type AND conditions.`);
    primaryEligibleCards.forEach(c => console.log(`  - Eligible (Primary): ${c.title} (Type: ${c.type}, Stage: ${c.stage_month}, MinCash: ${c.min_cash}, MaxCash: ${c.max_cash})`));

    let specificCardToSpawn: Card | undefined = undefined;
    let spawnStrategy = "primary";

    if (primaryEligibleCards.length > 0) {
      specificCardToSpawn = primaryEligibleCards[Math.floor(Math.random() * primaryEligibleCards.length)];
    } else {
      console.warn(`GameScreen: No eligible cards for target type ${cardTypeToSpawn}. Attempting fallback (any type, matching conditions).`);
      spawnStrategy = "fallback";
      
      const fallbackEligibleCards = cards.filter(card => { 
        const stageMatch = (card.stage_month === null || currentGameMonthOneIndexed >= card.stage_month);
        const minCashMatch = (card.min_cash === null || cash >= card.min_cash);
        const maxCashMatch = (card.max_cash === null || cash <= card.max_cash);
        return stageMatch && minCashMatch && maxCashMatch;
      });
      console.log(`GameScreen: Found ${fallbackEligibleCards.length} cards matching conditions for fallback.`);
      fallbackEligibleCards.forEach(c => console.log(`  - Eligible (Fallback): ${c.title} (Type: ${c.type}, Stage: ${c.stage_month}, MinCash: ${c.min_cash}, MaxCash: ${c.max_cash})`));

      if (fallbackEligibleCards.length > 0) {
        specificCardToSpawn = fallbackEligibleCards[Math.floor(Math.random() * fallbackEligibleCards.length)];
      } else {
        console.warn("GameScreen: Fallback failed. Attempting ultimate fallback - any card with no min_cash or min_cash <= current cash.");
        spawnStrategy = "ultimate";
        
        // Ultimate fallback: find cards with either no min_cash requirement or very low min_cash
        const ultimateEligibleCards = cards.filter(card => {
          const hasNoMinCash = card.min_cash === null || card.min_cash === undefined;
          const hasLowMinCash = card.min_cash !== null && card.min_cash <= cash;
          const stageMatch = (card.stage_month === null || currentGameMonthOneIndexed >= card.stage_month);
          return stageMatch && (hasNoMinCash || hasLowMinCash);
        });
        
        console.log(`GameScreen: Found ${ultimateEligibleCards.length} cards for ultimate fallback.`);
        ultimateEligibleCards.forEach(c => console.log(`  - Eligible (Ultimate): ${c.title} (Type: ${c.type}, Stage: ${c.stage_month}, MinCash: ${c.min_cash}, MaxCash: ${c.max_cash})`));
        
        if (ultimateEligibleCards.length > 0) {
          specificCardToSpawn = ultimateEligibleCards[Math.floor(Math.random() * ultimateEligibleCards.length)];
        } else {
          // Absolute last resort: just pick the first card
          console.error("GameScreen: All fallbacks failed. Using first available card as last resort.");
          specificCardToSpawn = cards[0];
          spawnStrategy = "emergency";
        }
      }
    }

    if (!specificCardToSpawn) {
      console.error("GameScreen: Critical error - specificCardToSpawn is undefined. No card spawned.");
      return; 
    }

    console.log(`GameScreen: Spawning card (Strategy: ${spawnStrategy}) - ID: ${specificCardToSpawn.id}, Title: '${specificCardToSpawn.title}', Actual Type: ${specificCardToSpawn.type}`);
    gameRunnerSceneRef.current?.spawnCard(specificCardToSpawn.type, specificCardToSpawn.id);
  };

  const startMonthCycle = (currentMonth: number, currentYear: number) => {
    if (gameOverStatus) return; // Halt if game over
    console.log(`Starting new month: ${formatMonthYear(currentMonth, currentYear)}, Phase: awaitingFirstCard`);
    gameRunnerSceneRef.current?.clearRoadObjects();
    setMonthPhase('awaitingFirstCard');
    setCardsCollectedCount(0);
    // setEffectAnimations([]); // TEMPORARILY COMMENTED OUT FOR TESTING PNL ANIMATION
    if (isMounted) { 
      spawnNewCard(); 
    }
  };

  useEffect(() => {
    // Only start the game cycle when everything is properly initialized
    if (isMounted && isInitialized && !gameOverStatus) {
      startMonthCycle(month, year);
    }
  }, [month, year, isMounted, isInitialized, gameOverStatus]);

  const handleCollect = (collectedObject: RoadObject) => {
    if (!isMounted || gameOverStatus) return;

    const audioSrc = audioMap[collectedObject.type];
    if (audioSrc) {
      const audio = new Audio(audioSrc);
      audio.volume = 0.7;
      audio.play().catch(error => {
        // Log the error for debugging if needed, but don't let it break the game
        // console.warn("Audio play failed (expected on initial load without user interaction):", error);
      });
    }

    if (collectedObject.type === 'card') {
      console.log("Collected a card object. Specific Card ID from RoadObject:", collectedObject.cardId);
      setEffectAnimations([]); // Force clear animations when a card object is collected
      // Find the actual card data from props.cards using the cardId
      const actualCardData = cards.find(card => card.id === collectedObject.cardId);
      if (actualCardData) {
        console.log("Actual Card Data collected:", actualCardData.title, actualCardData);
        // TODO: Next step - display this card's details / choices
        setCurrentDisplayCard(actualCardData);
        setMonthPhase('cardDecision');
      } else {
        console.warn("Collected card object, but could not find matching card data in props.cards for ID:", collectedObject.cardId);
      }

      setCardsCollectedCount(prev => prev + 1);
    } else if (collectedObject.type === 'cash') {
      if (monthPhase === 'awaitingCash') {
        console.log("Cash collected. Calculating PNL and advancing month.");
        
        const pnlForMonth = revenue - expenses;
        let updatedCash = cash + pnlForMonth;

        // Prepare animation for PNL if it's non-zero
        if (pnlForMonth !== 0) {
          const animationId = Date.now().toString() + Math.random().toString();
          const pnlAnimation: EffectAnimationItem = {
            id: animationId,
            metric: 'cash',
            value: pnlForMonth,
            isPercent: false,
          };
          setEffectAnimations([pnlAnimation]); // Show only this PNL animation
        } else {
          // If PNL is zero, ensure no old cash animations are lingering from card choices
          setEffectAnimations(prevAnims => prevAnims.filter(anim => anim.metric !== 'cash'));
        }

        const newMonthsPlayed = monthsPlayed + 1; // Month is now completed

        // Check for bankruptcy
        if (updatedCash <= 0 && !gameOverStatus) { // Ensure not already game over
            setCash(0); 
            setGameOverStatus('lose');
            handleGameConcluded('loss', 0, newMonthsPlayed); // Log session
            console.log("GAME OVER: Bankrupt from month-end PNL!");
            return; 
        }
        // Check for win condition 
        else if (updatedCash >= 100000 && !gameOverStatus) { // Ensure not already game over
            setCash(updatedCash);
            setGameOverStatus('win');
            handleGameConcluded('win', updatedCash, newMonthsPlayed); // Log session
            console.log("YOU WIN! Reached $100,000 cash from month-end PNL.");
            return;
        } else {
             setCash(updatedCash); 
        }

        // Increment actual months played counter when month completes
        setMonthsPlayed(newMonthsPlayed);
        
        console.log(`Month completed! Total months played: ${newMonthsPlayed}`);
        
        setMonth(prevMonth => {
          if (prevMonth === 11) { 
            setYear(prevYear => prevYear + 1);
            return 0; 
          } else {
            return prevMonth + 1;
          }
        });
      }
    }
  };
  
  if (!isMounted) {
    return <div style={{ position: 'fixed', top: '0', left: '0', width: '100%', textAlign: 'center', padding: '10px', backgroundColor: '#333', color: 'white', zIndex: 2000 }}>Loading Game...</div>;
  }

  const handleAnimationComplete = (animationId: string) => {
    setEffectAnimations(prevAnims => prevAnims.filter(anim => anim.id !== animationId));
  };

  // Function to calculate card choice effects
  const calculateCardChoiceEffects = (choice: CardChoice, currentGameState: { cash: number, revenue: number, expenses: number, customerRating: number }): EffectCalculationDetail[] => {
    if (!isMounted) {
      console.warn("calculateCardChoiceEffects: Not mounted.");
      return [];
    }

    const { cash: currentCash, revenue: currentRevenue, expenses: currentExpenses, customerRating: currentCustomerRating } = currentGameState;
    const calculatedEffects: EffectCalculationDetail[] = [];

    console.log(`GameScreen: Calculating effects for choice: "${choice.label}"`);

    // --- Cash Effect ---
    if (choice.cash_min !== undefined) {
      let cashChange = 0;
      let displayPercent: number | undefined = undefined;
      if (choice.cash_is_percent) {
        const percentToApply = (choice.cash_max !== undefined && choice.cash_min !== choice.cash_max) 
            ? getRandomPercentInRange(choice.cash_min, choice.cash_max)
            : choice.cash_min;
        cashChange = Math.round(currentCash * (percentToApply / 100));
        displayPercent = percentToApply;
      } else {
        cashChange = (choice.cash_max !== undefined && choice.cash_min !== choice.cash_max)
            ? getRandomInRange(choice.cash_min, choice.cash_max)
            : choice.cash_min;
      }
      if (cashChange !== 0) {
        calculatedEffects.push({
            metric: 'cash',
            value: cashChange,
            isPercent: choice.cash_is_percent,
            displayPercentValue: displayPercent
        });
      }
    }

    // --- Revenue Effect ---
    if (choice.revenue_min !== undefined) {
      let revenueChange = 0;
      let displayPercent: number | undefined = undefined;
      if (choice.revenue_is_percent) {
        const percentToApply = (choice.revenue_max !== undefined && choice.revenue_min !== choice.revenue_max)
            ? getRandomPercentInRange(choice.revenue_min, choice.revenue_max)
            : choice.revenue_min;
        revenueChange = Math.round(currentRevenue * (percentToApply / 100));
        displayPercent = percentToApply;
      } else {
        revenueChange = (choice.revenue_max !== undefined && choice.revenue_min !== choice.revenue_max)
            ? getRandomInRange(choice.revenue_min, choice.revenue_max)
            : choice.revenue_min;
      }
      if (revenueChange !== 0) {
         calculatedEffects.push({
            metric: 'revenue',
            value: revenueChange,
            isPercent: choice.revenue_is_percent,
            displayPercentValue: displayPercent
        });
      }
    }

    // --- Expenses Effect ---
    if (choice.expenses_min !== undefined) {
      let expensesChange = 0;
      let displayPercent: number | undefined = undefined;
      if (choice.expenses_is_percent) {
        const percentToApply = (choice.expenses_max !== undefined && choice.expenses_min !== choice.expenses_max)
            ? getRandomPercentInRange(choice.expenses_min, choice.expenses_max)
            : choice.expenses_min;
        expensesChange = Math.round(currentExpenses * (percentToApply / 100));
        displayPercent = percentToApply;
      } else {
        expensesChange = (choice.expenses_max !== undefined && choice.expenses_min !== choice.expenses_max)
            ? getRandomInRange(choice.expenses_min, choice.expenses_max)
            : choice.expenses_min;
      }
       if (expensesChange !== 0) {
        calculatedEffects.push({
            metric: 'expenses',
            value: expensesChange,
            isPercent: choice.expenses_is_percent,
            displayPercentValue: displayPercent
        });
      }
    }

    // --- Customer Rating Effect ---
    if (choice.customer_rating_min !== undefined) {
      let ratingChange = 0;
      if (choice.customer_rating_max !== undefined && choice.customer_rating_min !== choice.customer_rating_max) {
        ratingChange = getRandomInt(choice.customer_rating_min, choice.customer_rating_max);
      } else {
        ratingChange = choice.customer_rating_min;
      }
      if (ratingChange !== 0) {
          const potentialNewRating = currentCustomerRating + ratingChange;
          const actualNewRating = Math.max(0, Math.min(100, potentialNewRating));
          const finalRatingChange = actualNewRating - currentCustomerRating;

          if(finalRatingChange !== 0) {
            calculatedEffects.push({
                metric: 'customerRating',
                value: finalRatingChange, 
                isPercent: false, // Customer rating is not percentage based in this model
            });
          }
      }
    }
    console.log("Calculated effects:", calculatedEffects);
    return calculatedEffects;
  };

  const handleCardDecision = (choice: CardChoice) => {
    if (gameOverStatus || !currentDisplayCard || !isMounted) return;

    console.log("GameScreen: Handling card decision:", choice.label);
    setCardsPlayedThisSession(prev => prev + 1);

    const effectsDetails = calculateCardChoiceEffects(choice, { cash, revenue, expenses, customerRating });
    
    let tempCash = cash;
    let tempRevenue = revenue;
    let tempExpenses = expenses;
    let tempCustomerRating = customerRating;

    // Calculate actual effects for tracking
    const actualEffects: any = {};
    effectsDetails.forEach(effect => {
      switch (effect.metric) {
        case 'cash': 
          tempCash += effect.value; 
          actualEffects.cash = effect.value;
          break;
        case 'revenue': 
          tempRevenue += effect.value; 
          actualEffects.revenue = effect.value;
          break;
        case 'expenses': 
          tempExpenses += effect.value; 
          actualEffects.expenses = effect.value;
          break;
        case 'customerRating': 
          const oldRating = tempCustomerRating;
          tempCustomerRating = Math.min(100, Math.max(0, tempCustomerRating + effect.value)); 
          actualEffects.customerRating = tempCustomerRating - oldRating;
          break;
      }
    });

    setCash(tempCash);
    setRevenue(tempRevenue);
    setExpenses(tempExpenses);
    setCustomerRating(tempCustomerRating);
    
    // Track this decision for PnL Report
    setDecisionHistory(prev => [...prev, {
      month: monthsPlayed, // Use months played as the month counter
      cardTitle: currentDisplayCard.title,
      choiceLabel: choice.label,
      effects: actualEffects
    }]);
    
    const newAnimations = effectsDetails.map(detail => ({ ...detail, id: Date.now().toString() + Math.random() }));
    setEffectAnimations(prev => [...prev, ...newAnimations]);

    setCurrentDisplayCard(null); 

    // Check for game over first
    let newGameOverStatus: GameOverStatus = null;
    if (tempCash <= 0) {
      newGameOverStatus = 'lose';
    } else if (tempCash >= 100000) { 
      newGameOverStatus = 'win';
    }

    if (newGameOverStatus) {
      setGameOverStatus(newGameOverStatus);
      if (newGameOverStatus === 'win') {
        handleGameConcluded('win', tempCash, monthsPlayed);
      } else if (newGameOverStatus === 'lose') {
        handleGameConcluded('loss', tempCash, monthsPlayed);
      }
      console.log(newGameOverStatus === 'win' ? "YOU WIN! Reached $100,000 cash." : "GAME OVER: Bankrupt!");
    } else {
      // Check if we need a second card or should go to cash phase
      if (cardsCollectedCount < 2) {
        console.log(`Card decision complete. Need ${2 - cardsCollectedCount} more card(s) this month.`);
        setMonthPhase('awaitingSecondCard');
        // Spawn the next card
        if (isMounted) {
          spawnNewCard();
        }
      } else {
        console.log("Both cards collected and decided. Moving to cash phase.");
        setMonthPhase('awaitingCash');
        gameRunnerSceneRef.current?.spawnCash();
      }
    }
  };

  // NEW function to log game session conclusion
  const handleGameConcluded = async (
    outcome: 'win' | 'loss' | 'quit',
    finalCashValue: number,
    finalMonthsPlayed: number
  ) => {
    if (!gameSessionStartTime) {
      console.error("[GameScreen] Game session start time not set. Cannot log session.");
      return;
    }
    await GameSessionService.logCompletedGameSession(
      industry.id,
      outcome,
      finalCashValue,
      finalMonthsPlayed,
      cardsPlayedThisSession,
      gameSessionStartTime,
      Date.now(),
      highestCash // new argument
    );
    console.log(`[GameScreen] Game concluded. Outcome: ${outcome}, Cash: ${finalCashValue}, Months: ${finalMonthsPlayed}, Cards: ${cardsPlayedThisSession}`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Business Simulator',
        text: shareMessage,
        url: window.location.origin
      });
    } else {
      navigator.clipboard.writeText(shareMessage);
      alert('Share message copied to clipboard!');
    }
  };

  // Render game over overlay if status is set
  const renderGameOverOverlay = () => {
    if (!gameOverStatus) return null;
    // Calculate play time for display
    const playTimeMs = gameSessionStartTime ? Date.now() - gameSessionStartTime : 0;
    const playTimeMinutes = playTimeMs / (1000 * 60);
    return (
      <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <GameOver
          outcome={gameOverStatus === 'win' ? 'win' : 'loss'}
          monthsSurvived={monthsPlayed}
          highestCash={highestCash}
          cardsPlayed={cardsPlayedThisSession}
          industryName={industry.name}
          industryIcon={industry.icon}
          playTimeMinutes={playTimeMinutes}
          playerName={playerName}
          newRecord={newRecord}
          onShare={handleShare}
          shareMessage={shareMessage}
          onRestart={() => window.location.reload()}
          onMainMenu={() => router.push('/')}
        />
      </div>
    );
  };
  
  // Pass this to GameHUD
  const handlePnlReportClick = () => setShowPnLReport(true);

  // Build a compatible gameState object for PnLReport
  const gameStateForReport = {
    cash,
    revenue,
    expenses,
    month,
    customer_rating: customerRating,
    temporary_effects: [], // No temp effects yet
    month_end: monthPhase === 'awaitingCash',
    industry_id: industry.id,
    history: [], // Not used
    game_over: !!gameOverStatus,
    year,
    win_condition_met: gameOverStatus === 'win',
    active_cards: [],
    monthsPlayed,
    recentDecisions: decisionHistory,
    revenueBreakdown: [],
    expenseBreakdown: [],
    activeEffects: [],
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Quit Confirmation Modal */}
      <AnimatePresence>
        {showQuitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8 max-w-xs w-full text-center"
            >
              <h2 className="text-xl font-bold mb-2 text-white">Quit Game?</h2>
              <p className="text-slate-300 mb-6">Are you sure you want to quit and return to the main menu? Your progress for this session will be lost.</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowQuitModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 text-white font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmQuit}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition shadow-md"
                >
                  Quit Game
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Game Over Overlay */}
      {gameOverStatus && renderGameOverOverlay()}

      {/* Background Audio Element */}
      <audio ref={backgroundAudioRef} src="/audio/bg.mp3" preload="auto" />

      {/* HUD */}
      {isMounted && !gameOverStatus && ( // Hide HUD if game is over, or style it differently
        <GameHUD 
          cash={cash}
          revenue={revenue}
          expenses={expenses}
          customerRating={customerRating}
          month={month}
          year={year}
          industryName={industry.name}
          cardsCollectedCount={cardsCollectedCount}
          onBackButtonClick={handleBackButtonClick}
          effectAnimations={effectAnimations}
          onAnimationComplete={handleAnimationComplete}
          monthsPlayed={monthsPlayed}
          onPnlReportClick={handlePnlReportClick}
        />
      )}
      
      {/* Game Runner Scene (Canvas) */}
      {isMounted && ( // Conditionally render or disable interaction
        <GameRunnerScene 
          ref={gameRunnerSceneRef} 
          onCollect={handleCollect}
          isPaused={!!currentDisplayCard || !!gameOverStatus} // Added isPaused prop
          disableInteraction={!!gameOverStatus} // Pass a prop to disable clicks if game over
          backgroundConfig={{
            mobile_background: industry.mobile_background,
            desktop_background: industry.desktop_background
          }}
        />
      )}

      {/* Card Display Modal */}
      {isMounted && currentDisplayCard && !gameOverStatus && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        >
        </motion.div>
      )}

      {isMounted && currentDisplayCard && !gameOverStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="fixed top-36 sm:top-40 md:top-44 bottom-4 sm:bottom-5 md:bottom-6 left-0 right-0 mx-auto z-[1050] flex flex-col w-[95%] sm:w-[90%] max-w-lg rounded-lg shadow-xl border-2 overflow-hidden"
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.5)', // slate-800 with 95% opacity (slightly transparent)
            borderColor: CARD_TYPE_COLORS[currentDisplayCard.type as keyof typeof CARD_TYPE_COLORS] || CARD_TYPE_COLORS.opportunity,
            boxShadow: `0 0 30px ${CARD_TYPE_COLORS[currentDisplayCard.type as keyof typeof CARD_TYPE_COLORS] || CARD_TYPE_COLORS.opportunity}20` // Glow effect with card color
          }}
        >
          <div className="overflow-y-auto p-3 sm:p-4 flex-grow">
            <CardDisplay 
              card={currentDisplayCard} 
              onDecision={handleCardDecision}
            />
          </div>
        </motion.div>
      )}

      {/* PnL Report Modal */}
      {showPnLReport && (
        <PnLReport 
          gameState={gameStateForReport} 
          onClose={() => setShowPnLReport(false)}
        />
      )}
    </div>
  );
};

export default GameScreen; 