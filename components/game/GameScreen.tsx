"use client";
import GameRunnerScene, { GameRunnerSceneHandles } from './GameRunnerScene';
import React, { useState, useEffect, useRef } from 'react';
import { CardTypeEnum } from '@/lib/enums';
import GameHUD from './GameHUD';
import { useRouter } from 'next/navigation';
import { RoadObject } from '@/lib/game/managers/RoadObjectManager';
import CardDisplay from '@/components/game/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { getRandomInRange, getRandomInt, getRandomPercentInRange } from '@/lib/game-data/data-service';

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

// Simplified Card Type Probabilities & Getter
const CARD_TYPE_DEFINITIONS = [
  { type: CardTypeEnum.opportunity, weight: 60 }, // e.g., 60%
  { type: CardTypeEnum.problem,    weight: 20 }, // e.g., 20%
  { type: CardTypeEnum.market,     weight: 15 }, // e.g., 15%
  { type: CardTypeEnum.happy,      weight: 5 }  // e.g., 5%
];
// Calculate total weight once
const totalCardTypeWeight = CARD_TYPE_DEFINITIONS.reduce((sum, def) => sum + def.weight, 0);

const getRandomCardType = (): CardTypeEnum => {
  let randomWeight = Math.random() * totalCardTypeWeight;
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

const GameScreen: React.FC<GameScreenProps> = ({ industry, cards }) => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  // State for HUD values
  const [cash, setCash] = useState(0); // Initialize with 0 or a default
  const [revenue, setRevenue] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [customerRating, setCustomerRating] = useState(75); // Default customer rating

  const [month, setMonth] = useState(() => getCurrentMonthYear().month);
  const [year, setYear] = useState(() => getCurrentMonthYear().year);
  
  const [monthPhase, setMonthPhase] = useState<MonthPhase>('awaitingFirstCard');
  const [cardsCollectedCount, setCardsCollectedCount] = useState(0); 
  const [currentDisplayCard, setCurrentDisplayCard] = useState<Card | null>(null);
  const [effectAnimations, setEffectAnimations] = useState<EffectAnimationItem[]>([]); // New state for animations

  const gameRunnerSceneRef = useRef<GameRunnerSceneHandles>(null);

  useEffect(() => {
    setIsMounted(true);
    // Initialize HUD state based on the industry prop
    // Ensure your Industry type has startingCash, startingRevenue, startingExpenses
    setCash(industry.startingCash || 0);
    setRevenue(industry.startingRevenue || 0); 
    setExpenses(industry.startingExpenses || 0);
    // setCustomerRating(industry.startingCustomerRating || 75); // If you add this to Industry type
  }, [industry]); // Effect depends on the industry prop

  const audioMap: Record<string, string> = {
    card: '/audio/card.mp3',
    cash: '/audio/cash.mp3',
  };

  const handleBackButtonClick = () => {
    if (window.confirm("Are you sure you want to quit the game and return to the main page?")) {
      router.push('/');
    }
  };

  const spawnNewCard = () => {
    if (!isMounted || !cards || cards.length === 0) {
      console.error("GameScreen: Cannot spawn card. Not mounted or no cards available in props.");
      return;
    } 

    const cardTypeToSpawn = getRandomCardType();
    const currentGameMonthOneIndexed = month + 1;

    console.log(`GameScreen: ----- New Card Spawn Attempt -----`);
    console.log(`GameScreen: Target type: ${cardTypeToSpawn}, Current month (1-idx): ${currentGameMonthOneIndexed}, Current cash: $${cash}`);
    console.log(`GameScreen: Total cards in deck: ${cards.length}`);

    // Primary filter: by type and conditions
    const primaryEligibleCards = cards.filter(card => {
      const typeMatch = card.type === cardTypeToSpawn;
      const stageMatch = (card.stage_month === null || currentGameMonthOneIndexed >= card.stage_month);
      const minCashMatch = (card.min_cash === null || cash >= card.min_cash);
      const maxCashMatch = (card.max_cash === null || cash <= card.max_cash);
      // Detailed log for each card evaluation (can be verbose, remove if too noisy after testing)
      // console.log(`  - Card: ${card.title} (Type: ${card.type}) -> TypeMatch: ${typeMatch}, Stage: ${stageMatch} (Need: ${card.stage_month}), MinCash: ${minCashMatch} (Need: ${card.min_cash}), MaxCash: ${maxCashMatch} (Need: ${card.max_cash})`);
      return typeMatch && stageMatch && minCashMatch && maxCashMatch;
    });
    console.log(`GameScreen: Found ${primaryEligibleCards.length} cards matching target type AND conditions.`);
    primaryEligibleCards.forEach(c => console.log(`  - Eligible (Primary): ${c.title} (Type: ${c.type}, Stage: ${c.stage_month}, MinCash: ${c.min_cash}, MaxCash: ${c.max_cash})`));

    let specificCardToSpawn: Card | undefined = undefined;
    let spawnStrategy = "primary";

    if (primaryEligibleCards.length > 0) {
      specificCardToSpawn = primaryEligibleCards[Math.floor(Math.random() * primaryEligibleCards.length)];
      // console.log(`GameScreen: Selected from primary eligible: ${specificCardToSpawn.title}`); // Already logged selection below
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
        console.error("GameScreen: Fallback failed. No cards meet any conditions.");
        return;
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
    console.log(`Starting new month: ${formatMonthYear(currentMonth, currentYear)}, Phase: awaitingFirstCard`);
    gameRunnerSceneRef.current?.clearRoadObjects();
    setMonthPhase('awaitingFirstCard');
    setCardsCollectedCount(0);
    if (isMounted) { 
      spawnNewCard(); 
    }
  };

  useEffect(() => {
    if (isMounted) { 
      startMonthCycle(month, year);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year, isMounted]); 

  const handleCollect = (collectedObject: RoadObject) => {
    if (!isMounted) return; 

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
        console.log("Cash collected. Advancing month.");
        // Update cash based on PNL for the month (temporary)
        setCash(prevCash => prevCash + revenue - expenses);
        // Potentially adjust customer rating (example)
        // setCustomerRating(prev => Math.max(0, Math.min(100, prev + Math.floor(Math.random()*3)-1)));

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
      if (cashChange !== 0 || choice.cash_min !== 0) { // Add if there's a change or if it explicitly sets to 0 from non-zero
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
      if (revenueChange !== 0 || choice.revenue_min !==0) {
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
       if (expensesChange !== 0 || choice.expenses_min !== 0) {
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
      if (ratingChange !== 0 || choice.customer_rating_min !== 0) {
          const potentialNewRating = currentCustomerRating + ratingChange;
          const actualNewRating = Math.max(0, Math.min(100, potentialNewRating));
          const finalRatingChange = actualNewRating - currentCustomerRating;

          if(finalRatingChange !== 0 || choice.customer_rating_min !== 0) {
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
    console.log("Card decision made:", choice.label, choice);
    
    if (currentDisplayCard) {
      const effectsToApply = calculateCardChoiceEffects(choice, {cash, revenue, expenses, customerRating});
      
      const newAnimations: EffectAnimationItem[] = [];

      effectsToApply.forEach(eff => {
        const animationId = `eff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        newAnimations.push({ ...eff, id: animationId });

        switch(eff.metric) {
          case 'cash':
            setCash(prev => {
              const newValue = prev + eff.value;
              console.log(`  Cash: ${prev} -> ${newValue} (Applied Change: ${eff.value >= 0 ? '+' : ''}${eff.value})`);
              return newValue;
            });
            break;
          case 'revenue':
            setRevenue(prev => {
              const newValue = prev + eff.value;
              console.log(`  Revenue: ${prev} -> ${newValue} (Applied Change: ${eff.value >= 0 ? '+' : ''}${eff.value})`);
              return newValue;
            });
            break;
          case 'expenses':
            setExpenses(prev => {
              const newValue = prev + eff.value;
              console.log(`  Expenses: ${prev} -> ${newValue} (Applied Change: ${eff.value >= 0 ? '+' : ''}${eff.value})`);
              return newValue;
            });
            break;
          case 'customerRating':
            setCustomerRating(prev => {
              const newValue = prev + eff.value; // eff.value already considers 0-100 bounds
              console.log(`  Customer Rating: ${prev} -> ${newValue} (Applied Change: ${eff.value >= 0 ? '+' : ''}${eff.value})`);
              return newValue; // No need to clamp again as calculateCardChoiceEffects pre-clamps for rating
            });
            break;
        }
      });

      if (newAnimations.length > 0) {
        setEffectAnimations(prevAnims => [...prevAnims, ...newAnimations]);
      }

    } else {
      console.warn("handleCardDecision called but currentDisplayCard is null. Effects not applied.");
    }

    setCurrentDisplayCard(null);

    if (cardsCollectedCount === 1) {
      setMonthPhase('awaitingSecondCard');
      spawnNewCard();
      console.log("Decision made for first card. Phase: awaitingSecondCard. Spawning second card.");
    } else if (cardsCollectedCount === 2) {
      setMonthPhase('awaitingCash');
      gameRunnerSceneRef.current?.spawnCash();
      console.log("Decision made for second card. Phase: awaitingCash. Spawned cash.");
    }
  };

  return (
    <div>
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
      />
      <GameRunnerScene ref={gameRunnerSceneRef} isPaused={!!currentDisplayCard} onCollect={handleCollect} />

      <AnimatePresence>
        {currentDisplayCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          >
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentDisplayCard && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed top-28 sm:top-32 md:top-36 bottom-4 sm:bottom-5 md:bottom-6 left-0 right-0 mx-auto z-[1050] flex flex-col w-[95%] sm:w-[90%] max-w-lg bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden"
          >
            <div className="overflow-y-auto p-3 sm:p-4 flex-grow">
              <CardDisplay 
                card={currentDisplayCard} 
                onDecision={handleCardDecision}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameScreen; 