"use client";
import GameRunnerScene, { GameRunnerSceneHandles } from './GameRunnerScene';
import React, { useState, useEffect, useRef } from 'react';
import { CardTypeEnum } from '@/lib/enums';
import GameHUD from './GameHUD';
import { useRouter } from 'next/navigation';

// CardTypeEnum, Industry, Card are globally available from lib/global.d.ts

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
  cards: Card[]; // This prop contains the available cards for the game
}

type MonthPhase = 'awaitingFirstCard' | 'awaitingSecondCard' | 'awaitingCash';

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
  const [currentDeckIndex, setCurrentDeckIndex] = useState(0); // To cycle through props.cards if needed

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
    if (!isMounted) return; 
    const cardTypeToSpawn = getRandomCardType();
    
    // For logging: find a card from props.cards that matches this type
    // This is a simple find; later we might want a more sophisticated deck/draw mechanic
    const matchingCardFromDeck = cards.find(card => card.type === cardTypeToSpawn);

    console.log(`Attempting to spawn card of type: ${cardTypeToSpawn}`);
    if (matchingCardFromDeck) {
      console.log(`  Associated with deck card: ID=${matchingCardFromDeck.id}, Title='${matchingCardFromDeck.title}'`);
    } else {
      console.log(`  No card in the provided deck matches type: ${cardTypeToSpawn}. Spawning with type for image only.`);
    }
    
    gameRunnerSceneRef.current?.spawnCard(cardTypeToSpawn);
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

  const handleCollect = (type: 'card' | 'cash') => {
    if (!isMounted) return; 

    const audioSrc = audioMap[type];
    if (audioSrc) {
      const audio = new Audio(audioSrc);
      audio.volume = 0.7;
      audio.play().catch(error => {
        // Log the error for debugging if needed, but don't let it break the game
        // console.warn("Audio play failed (expected on initial load without user interaction):", error);
      });
    }

    if (type === 'card') {
      setCardsCollectedCount(prev => prev + 1);
      if (monthPhase === 'awaitingFirstCard') {
        setMonthPhase('awaitingSecondCard');
        spawnNewCard(); 
        console.log("First card collected. Phase: awaitingSecondCard.");
      } else if (monthPhase === 'awaitingSecondCard') {
        setMonthPhase('awaitingCash');
        gameRunnerSceneRef.current?.spawnCash();
        console.log("Second card collected. Phase: awaitingCash. Spawned cash.");
      }
    } else if (type === 'cash') {
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
      />
      <GameRunnerScene ref={gameRunnerSceneRef} isPaused={false} onCollect={handleCollect} />
    </div>
  );
};

export default GameScreen; 