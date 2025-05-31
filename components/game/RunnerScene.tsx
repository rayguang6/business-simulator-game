import React, { useRef, useEffect, useCallback } from 'react';

interface RunnerSceneProps {
  gameState?: any;
  onCardSpawn?: () => void;
  onCashCollect?: (amount: number) => void;
  cardsThisMonth?: number;
  availableCards?: Card[];
  onCardHit?: (card: Card) => void;
  isPaused?: boolean;
}

// Configuration
const CONFIG = {
  GAME_SPEED: 0.01,
  CARD_SPACING: 1.5,
  CASH_SPACING: 0.5,
  CARDS_PER_MONTH: 2,
  PLAYER_SPRITE_SCALE: 8,
  CARD_HIT_BUFFER: 80,
  CASH_HIT_BUFFER: 40,
  MIN_SPAWN_SPACING: 0.5,
  CASH_VALUES: [100, 150, 200],
  CASH_OBJECT_SPACING: 0.2,
  FRAME_TARGET: 16.67,
} as const;

const BUSINESS_TYPE = {
  name: 'Tech Startup',
  skyColor1: '#4A90E2',
  skyColor2: '#7BB3F4',
  roadColor: '#2C3E50',
  background: {
    groundColor: '#1a1a2e',
  },
} as const;

const CARD_TYPE_TO_IMAGE: Record<string, number> = {
  opportunity: 1,
  problem: 2,
  market: 3,
  happy: 4,
} as const;

const CARD_PROBABILITIES = {
  opportunity: 0.60,
  problem: 0.20,
  market: 0.15,
  happy: 0.05,
} as const;

interface SpawnItem {
  type: 'card' | 'cash';
  data?: Card;
  value?: number;
  spawnZ: number;
}

class GameCard {
  x: number;
  z: number;
  image: HTMLImageElement;
  collected: boolean;
  cardData: Card | null;
  hasTriggered: boolean;
  private imageLoaded: boolean = false;

  constructor(cardData?: Card) {
    this.x = 0;
    this.z = 8;
    this.collected = false;
    this.cardData = cardData || null;
    this.hasTriggered = false;
    
    this.image = new Image();
    this.image.onload = () => { this.imageLoaded = true; };
    
    if (cardData && CARD_TYPE_TO_IMAGE[cardData.type]) {
      this.image.src = `/images/cards/card${CARD_TYPE_TO_IMAGE[cardData.type]}.png`;
    } else {
      const cardNumber = Math.floor(Math.random() * 4) + 1;
      this.image.src = `/images/cards/card${cardNumber}.png`;
    }
  }

  update(deltaTime: number): void {
    if (!this.collected) {
      this.z -= CONFIG.GAME_SPEED * 4 * (deltaTime / CONFIG.FRAME_TARGET);
    }
  }

  draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    if (this.collected || this.z <= 0 || !this.imageLoaded) return;
    
    const pos = worldToScreen(this.x, this.z, canvasWidth, canvasHeight);
    const cardWidth = 120 * pos.scale;
    const cardHeight = 160 * pos.scale;

    ctx.drawImage(
      this.image,
      pos.x - cardWidth/2,
      pos.y - cardHeight/2,
      cardWidth,
      cardHeight
    );
  }

  hasHitPlayer(playerY: number, canvasWidth: number, canvasHeight: number): boolean {
    if (this.hasTriggered || this.collected) return false;
    
    const pos = worldToScreen(this.x, this.z, canvasWidth, canvasHeight);
    const cardBottom = pos.y + (160 * pos.scale) / 2;
    
    return cardBottom >= playerY - CONFIG.CARD_HIT_BUFFER;
  }

  markTriggered(): void {
    this.hasTriggered = true;
    this.collected = true;
  }
}

class CashPickup {
  x: number;
  z: number;
  value: number;
  image: HTMLImageElement;
  collected: boolean;
  bobOffset: number;
  hasTriggered: boolean;
  private imageLoaded: boolean = false;

  constructor(value: number) {
    this.x = 0;
    this.z = 8;
    this.value = value;
    this.collected = false;
    this.bobOffset = Math.random() * Math.PI * 2;
    this.hasTriggered = false;
    
    this.image = new Image();
    this.image.onload = () => { this.imageLoaded = true; };
    this.image.src = '/images/cash.png';
  }

  update(deltaTime: number): void {
    if (!this.collected) {
      this.z -= CONFIG.GAME_SPEED * 2.5 * (deltaTime / CONFIG.FRAME_TARGET);
      this.bobOffset += 0.15;
    }
  }

  draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    if (this.collected || this.z <= 0 || !this.imageLoaded) return;
    
    const pos = worldToScreen(this.x, this.z, canvasWidth, canvasHeight);
    const bobY = pos.y + Math.sin(this.bobOffset) * 8 * pos.scale;
    const cashSize = 80 * pos.scale;

    ctx.drawImage(
      this.image,
      pos.x - cashSize/2,
      bobY - cashSize/2,
      cashSize,
      cashSize
    );
  }

  hasHitPlayer(playerY: number, canvasWidth: number, canvasHeight: number): boolean {
    if (this.hasTriggered || this.collected) return false;
    
    const pos = worldToScreen(this.x, this.z, canvasWidth, canvasHeight);
    const cashCenter = pos.y + Math.sin(this.bobOffset) * 8 * pos.scale;
    
    return cashCenter >= playerY - CONFIG.CASH_HIT_BUFFER;
  }

  markTriggered(): void {
    this.hasTriggered = true;
    this.collected = true;
  }
}

class Sprite {
  image: HTMLImageElement;
  frameWidth: number;
  frameHeight: number;
  currentFrame: number;
  frameCount: number;
  frameDelay: number;
  frameTimer: number;
  shadowImg: HTMLImageElement | null;
  frames: number[][];
  private imageLoaded: boolean = false;
  private shadowLoaded: boolean = false;

  constructor(imageSrc: string, frameWidth: number, frameHeight: number, frameCount: number, frameDelay: number = 4, frames?: number[][]) {
    this.image = new Image();
    this.image.onload = () => { this.imageLoaded = true; };
    this.image.src = imageSrc;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.currentFrame = 0;
    this.frameCount = frameCount;
    this.frameDelay = frameDelay;
    this.frameTimer = 0;
    this.frames = frames || [[0,0], [1,0], [2,0], [3,0]];

    this.shadowImg = new Image();
    this.shadowImg.onload = () => { this.shadowLoaded = true; };
    this.shadowImg.src = '/images/shadow.png';
  }

  update(): void {
    this.frameTimer++;
    if (this.frameTimer >= this.frameDelay) {
      this.frameTimer = 0;
      this.currentFrame = (this.currentFrame + 1) % this.frameCount;
    }
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number = 1): void {
    if (!this.imageLoaded) return;

    const drawWidth = this.frameWidth * scale;
    const drawHeight = this.frameHeight * scale;

    if (this.shadowLoaded) {
      const shadowScale = scale * 0.8;
      const shadowWidth = 32 * shadowScale;
      const shadowHeight = 16 * shadowScale;
      ctx.globalAlpha = 0.3;
      ctx.drawImage(
        this.shadowImg!,
        x - shadowWidth / 2,
        y + drawHeight / 2 - shadowHeight / 4,
        shadowWidth,
        shadowHeight
      );
      ctx.globalAlpha = 1.0;
    }

    const [frameX, frameY] = this.frames[this.currentFrame];

    ctx.drawImage(
      this.image,
      frameX * this.frameWidth,
      frameY * this.frameHeight,
      this.frameWidth,
      this.frameHeight,
      x - drawWidth / 2,
      y - drawHeight / 2,
      drawWidth,
      drawHeight
    );
  }
}

const getVanishingPoint = (width: number, height: number) => ({
  x: width / 2,
  y: height * 0.4,
});

const getRoadWidth = (width: number) => width * 0.6;

const drawSky = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const horizon = height * 0.4;
  const gradient = ctx.createLinearGradient(0, 0, 0, horizon);
  gradient.addColorStop(0, BUSINESS_TYPE.skyColor1);
  gradient.addColorStop(1, BUSINESS_TYPE.skyColor2);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, horizon);
};

const drawGround = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const horizon = height * 0.4;
  ctx.fillStyle = BUSINESS_TYPE.background.groundColor;
  ctx.fillRect(0, horizon, width, height - horizon);
};

const drawRoad = (ctx: CanvasRenderingContext2D, width: number, height: number, roadOffset: number) => {
  const vanishing = getVanishingPoint(width, height);
  const roadWidth = getRoadWidth(width);
  
  ctx.save();
  ctx.fillStyle = BUSINESS_TYPE.roadColor;
  ctx.beginPath();
  ctx.moveTo(vanishing.x - 30, vanishing.y);
  ctx.lineTo(vanishing.x + 30, vanishing.y);
  ctx.lineTo(width / 2 + roadWidth / 2, height);
  ctx.lineTo(width / 2 - roadWidth / 2, height);
  ctx.closePath();
  ctx.fill();
  
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(vanishing.x - 30, vanishing.y);
  ctx.lineTo(width / 2 - roadWidth / 2, height);
  ctx.moveTo(vanishing.x + 30, vanishing.y);
  ctx.lineTo(width / 2 + roadWidth / 2, height);
  ctx.stroke();
  
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 4;
  ctx.beginPath();
  const dashCount = 8;
  for (let i = 0; i < dashCount; i++) {
    let dashZ = 1.5 - ((roadOffset * 4 + i * 0.4) % 2.0);
    if (dashZ >= 0 && dashZ <= 1.5) {
      const start = worldToScreen(0, dashZ, width, height);
      const end = worldToScreen(0, Math.max(0, dashZ - 0.15), width, height);
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
    }
  }
  ctx.stroke();
  ctx.restore();
};

function worldToScreen(worldX: number, worldZ: number, width: number, height: number) {
  const scale = 1 / (1 + worldZ * 2);
  const vanishing = getVanishingPoint(width, height);
  const roadWidthAtZ = getRoadWidth(width) * scale;
  const screenX = vanishing.x + worldX * roadWidthAtZ / 3;
  const screenY = vanishing.y + (height - vanishing.y) * scale;
  return { x: screenX, y: screenY, scale };
}

function selectCardByProbability(availableCards: Card[]): Card | undefined {
  if (!availableCards.length) return undefined;
  
  const rand = Math.random();
  let targetType: string;
  
  if (rand < CARD_PROBABILITIES.opportunity) targetType = 'opportunity';
  else if (rand < CARD_PROBABILITIES.opportunity + CARD_PROBABILITIES.problem) targetType = 'problem';
  else if (rand < CARD_PROBABILITIES.opportunity + CARD_PROBABILITIES.problem + CARD_PROBABILITIES.market) targetType = 'market';
  else targetType = 'happy';
  
  const typeCards = availableCards.filter(card => card.type === targetType);
  const finalCards = typeCards.length > 0 ? typeCards : availableCards;
  const randomIndex = Math.floor(Math.random() * finalCards.length);
  
  return finalCards[randomIndex];
}

const RunnerScene: React.FC<RunnerSceneProps> = ({ 
  gameState, 
  onCardSpawn, 
  onCashCollect, 
  cardsThisMonth = 0, 
  availableCards = [], 
  onCardHit, 
  isPaused = false 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const roadOffsetRef = useRef(0);
  const playerSpriteRef = useRef<Sprite | null>(null);
  const cardsRef = useRef<GameCard[]>([]);
  const cashPickupsRef = useRef<CashPickup[]>([]);
  
  const spawnQueueRef = useRef<SpawnItem[]>([]);
  const lastSpawnZRef = useRef<number>(0);
  const monthlyStateRef = useRef({
    month: -1,
    cardsSpawned: 0,
    cashSpawned: false,
    allCashCollected: true,
    totalCashSpawned: 0,
    cashCollected: 0,
  });

  const gameSequenceRef = useRef({
    canSpawnNewMonth: true,
    pendingCashObjects: [] as CashPickup[],
  });

  // THE FIX: Use React.unstable_batchedUpdates to force immediate execution
  const triggerCardHitImmediate = useCallback((card: Card) => {
    console.log(`🎯 Card hit detected: ${card.type} - "${card.title}" at ${performance.now()}`);
    
    // Force immediate execution bypassing React's batching
    if (typeof (React as any).unstable_batchedUpdates === 'function') {
      (React as any).unstable_batchedUpdates(() => {
        if (onCardHit) {
          onCardHit(card);
        } else if (onCardSpawn) {
          onCardSpawn();
        }
      });
    } else {
      // Fallback: Use flushSync for immediate execution
      import('react-dom').then(({ flushSync }) => {
        flushSync(() => {
          if (onCardHit) {
            onCardHit(card);
          } else if (onCardSpawn) {
            onCardSpawn();
          }
        });
      }).catch(() => {
        // Final fallback: direct call
        if (onCardHit) {
          onCardHit(card);
        } else if (onCardSpawn) {
          onCardSpawn();
        }
      });
    }
  }, [onCardHit, onCardSpawn]);

  const spawnCashForMonth = useCallback(() => {
    if (monthlyStateRef.current.cashSpawned) return;
    
    const cashStartZ = lastSpawnZRef.current + CONFIG.CASH_SPACING;
    console.log(`💰 Spawning ${CONFIG.CASH_VALUES.length} cash objects for month end`);
    
    CONFIG.CASH_VALUES.forEach((value, index) => {
      spawnQueueRef.current.push({
        type: 'cash',
        value,
        spawnZ: cashStartZ + (index * CONFIG.CASH_OBJECT_SPACING),
      });
    });
    
    monthlyStateRef.current.cashSpawned = true;
    monthlyStateRef.current.totalCashSpawned = CONFIG.CASH_VALUES.length;
    monthlyStateRef.current.allCashCollected = false;
  }, []);

  const handleCashCollect = useCallback((cash: CashPickup) => {
    monthlyStateRef.current.cashCollected++;
    
    if (monthlyStateRef.current.cashCollected >= monthlyStateRef.current.totalCashSpawned) {
      monthlyStateRef.current.allCashCollected = true;
      console.log(`✅ All cash collected for month ${monthlyStateRef.current.month}! Ready for next month.`);
      
      if (!gameSequenceRef.current.canSpawnNewMonth) {
        gameSequenceRef.current.canSpawnNewMonth = true;
        console.log(`🚀 Next month spawning enabled`);
      }
    }
    
    if (onCashCollect) onCashCollect(cash.value);
  }, [onCashCollect]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    playerSpriteRef.current = new Sprite('/images/hero.png', 32, 32, 4, 8, [[1,2], [0,2], [3,2], [0,2]]);

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    let animationId: number;
    let lastTime = performance.now();
    
    function draw(now: number) {
      if (!canvas || !ctx) return;
      const dt = now - lastTime;
      lastTime = now;
      
      if (!isPaused) {
        roadOffsetRef.current += CONFIG.GAME_SPEED * (dt / CONFIG.FRAME_TARGET);
        if (roadOffsetRef.current > 1.0) roadOffsetRef.current -= 1.0;

        playerSpriteRef.current?.update();
        const playerY = canvas.height - (16 * CONFIG.PLAYER_SPRITE_SCALE);

        // CARD HIT PROCESSING - ISOLATED AND IMMEDIATE
        let cardHitThisFrame = false;
        
        for (let i = cardsRef.current.length - 1; i >= 0; i--) {
          const card = cardsRef.current[i];
          card.update(dt);
          
          if (!cardHitThisFrame && !card.collected && card.hasHitPlayer(playerY, canvas.width, canvas.height)) {
            card.markTriggered();
            cardHitThisFrame = true;
            
            // IMMEDIATE TRIGGER - no delays
            if (card.cardData) {
              triggerCardHitImmediate(card.cardData);
            }
            break;
          }
          
          if (card.z < -1) {
            cardsRef.current.splice(i, 1);
          }
        }

        // ONLY PROCESS OTHER LOGIC IF NO CARD HIT
        if (!cardHitThisFrame) {
          // Cash collection
          for (let i = cashPickupsRef.current.length - 1; i >= 0; i--) {
            const cash = cashPickupsRef.current[i];
            cash.update(dt);
            
            if (!cash.collected && cash.hasHitPlayer(playerY, canvas.width, canvas.height)) {
              console.log(`💰 Cash collected: $${cash.value}`);
              cash.markTriggered();
              handleCashCollect(cash);
            }
            
            if (cash.z < -1) {
              cashPickupsRef.current.splice(i, 1);
            }
          }

          // Game state management
          const currentMonth = gameState?.month || 0;
          
          if (monthlyStateRef.current.month !== currentMonth) {
            console.log(`🗓️ Month ${currentMonth} started`);
            
            const hasPendingCash = cashPickupsRef.current.length > 0;
            
            if (hasPendingCash) {
              console.log(`⏳ Waiting for ${cashPickupsRef.current.length} cash objects to be collected`);
              gameSequenceRef.current.canSpawnNewMonth = false;
            } else {
              console.log(`✅ All cash collected, starting month ${currentMonth}`);
              gameSequenceRef.current.canSpawnNewMonth = true;
              
              monthlyStateRef.current = {
                month: currentMonth,
                cardsSpawned: 0,
                cashSpawned: false,
                allCashCollected: true,
                totalCashSpawned: 0,
                cashCollected: 0,
              };
              spawnQueueRef.current = [];
              lastSpawnZRef.current = 0;
            }
          }

          if (!gameSequenceRef.current.canSpawnNewMonth && cashPickupsRef.current.length === 0) {
            console.log(`🚀 All pending cash collected, enabling spawning`);
            gameSequenceRef.current.canSpawnNewMonth = true;
            
            monthlyStateRef.current = {
              month: currentMonth,
              cardsSpawned: 0,
              cashSpawned: false,
              allCashCollected: true,
              totalCashSpawned: 0,
              cashCollected: 0,
            };
            spawnQueueRef.current = [];
            lastSpawnZRef.current = 0;
          }

          // Spawning logic
          if (gameSequenceRef.current.canSpawnNewMonth) {
            if (monthlyStateRef.current.cardsSpawned < CONFIG.CARDS_PER_MONTH && cardsThisMonth < CONFIG.CARDS_PER_MONTH) {
              const nextSpawnZ = lastSpawnZRef.current + CONFIG.CARD_SPACING;
              
              const hasCardInQueue = spawnQueueRef.current.some(item => 
                item.type === 'card' && item.spawnZ === nextSpawnZ
              );
              
              if (!hasCardInQueue) {
                const cardToSpawn = selectCardByProbability(availableCards);
                
                spawnQueueRef.current.push({
                  type: 'card',
                  data: cardToSpawn,
                  spawnZ: nextSpawnZ,
                });
                
                console.log(`📋 Card queued: ${cardToSpawn?.type} - "${cardToSpawn?.title}"`);
              }
            }

            // SEPARATED CASH SPAWNING - no interference with card hits
            if (cardsThisMonth === CONFIG.CARDS_PER_MONTH && !monthlyStateRef.current.cashSpawned) {
              // Use immediate timer to avoid blocking card hits
              setTimeout(() => spawnCashForMonth(), 0);
            }
          }

          // Process spawn queue
          spawnQueueRef.current = spawnQueueRef.current.filter(item => {
            const tooClose = [...cardsRef.current, ...cashPickupsRef.current].some(obj => 
              Math.abs(obj.z - item.spawnZ) < CONFIG.MIN_SPAWN_SPACING
            );
            
            if (!tooClose) {
              if (item.type === 'card' && item.data) {
                const newCard = new GameCard(item.data);
                newCard.z = item.spawnZ;
                cardsRef.current.push(newCard);
                monthlyStateRef.current.cardsSpawned++;
                lastSpawnZRef.current = item.spawnZ;
                console.log(`🏗️ Card spawned: ${item.data.type} - "${item.data.title}"`);
                return false;
              } else if (item.type === 'cash' && item.value) {
                const newCash = new CashPickup(item.value);
                newCash.z = item.spawnZ;
                cashPickupsRef.current.push(newCash);
                lastSpawnZRef.current = item.spawnZ;
                console.log(`💰 Cash spawned: $${item.value}`);
                return false;
              }
            }
            return true;
          });
        }
      }

      // Rendering
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawSky(ctx, canvas.width, canvas.height);
      drawGround(ctx, canvas.width, canvas.height);
      drawRoad(ctx, canvas.width, canvas.height, roadOffsetRef.current);

      cardsRef.current.forEach(card => {
        if (!card.collected) {
          card.draw(ctx, canvas.width, canvas.height);
        }
      });

      cashPickupsRef.current.forEach(cash => {
        if (!cash.collected) {
          cash.draw(ctx, canvas.width, canvas.height);
        }
      });

      if (playerSpriteRef.current && canvas) {
        const playerX = canvas.width / 2;
        const playerY = canvas.height - (16 * CONFIG.PLAYER_SPRITE_SCALE);
        playerSpriteRef.current.draw(ctx, playerX, playerY, CONFIG.PLAYER_SPRITE_SCALE);
      }

      animationId = requestAnimationFrame(draw);
    }
    
    animationId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [gameState, cardsThisMonth, availableCards, isPaused, triggerCardHitImmediate, handleCashCollect, spawnCashForMonth]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        width: '100vw', 
        height: '100vh', 
        display: 'block',
        imageRendering: 'pixelated'
      }} 
    />
  );
};

export default RunnerScene;