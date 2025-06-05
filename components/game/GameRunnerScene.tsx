"use client";
import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { CharacterSprite } from "@/lib/game/entities/CharacterSprite";
import { BackgroundRenderer } from "@/lib/game/managers/BackgroundRenderer";
import { BackgroundImageManager } from "@/lib/game/managers/BackgroundImageManager";
import { EmojiDecorationManager } from "@/lib/game/managers/EmojiDecorationManager";
import { RoadObjectsManager, RoadObject } from "@/lib/game/managers/RoadObjectManager";
import { CardTypeEnum } from '@/lib/constants';
import { INDUSTRY_BACKGROUNDS } from '@/lib/constants';

// CardTypeEnum is now imported from constants

// Define handles to be exposed to the parent component (GameScreen)
export interface GameRunnerSceneHandles {
  spawnCard: (cardType: CardTypeEnum, cardId: string) => void;
  spawnCash: () => void;
  clearRoadObjects: () => void;
}

interface BackgroundConfig {
  skyTop?: string;
  skyBottom?: string;
  ground?: string;
  road?: string;
  emojis?: string[];
  mobile_background?: string;
  desktop_background?: string;
}

interface GameRunnerSceneProps {
  isPaused: boolean;
  backgroundConfig?: BackgroundConfig;
  onCollect?: (collectedObject: RoadObject) => void;
  disableInteraction?: boolean;
}

// Helper function to detect mobile
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768; // Tailwind's md breakpoint
};

// Helper function to get appropriate background image
const getBackgroundImage = (config: BackgroundConfig): string | undefined => {
  // If specific mobile/desktop images are provided (from Supabase), use them
  if (isMobile() && config.mobile_background) {
    return config.mobile_background;
  }
  if (!isMobile() && config.desktop_background) {
    return config.desktop_background;
  }
  
  // Simple fallbacks: use default local images
  const device = isMobile() ? 'mobile' : 'desktop';
  return INDUSTRY_BACKGROUNDS[device];
};

const defaultConfig: BackgroundConfig = {
  skyTop: "#4A90E2",
  skyBottom: "#7BB3F4",
  ground: "#1a1a2e",
  road: "#2C3E50",
  emojis: ["🌳", "🌴", "🌵", "🪨", "🌲", "🌿"], 
  // No backgroundImage here - will use getBackgroundImage function
};

// Wrap component with forwardRef
const GameRunnerScene = forwardRef<GameRunnerSceneHandles, GameRunnerSceneProps>(({ 
  isPaused, 
  backgroundConfig,
  onCollect,
  disableInteraction
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const characterRef = useRef<CharacterSprite | null>(null);
  const backgroundRendererRef = useRef<BackgroundRenderer | null>(null);
  const backgroundImageRef = useRef<BackgroundImageManager | null>(null);
  const emojiManagerRef = useRef<EmojiDecorationManager | null>(null);
  const roadObjectsRef = useRef<RoadObjectsManager | null>(null);
  const animationFrameRef = useRef<number>(0);
  const [viewportChanged, setViewportChanged] = React.useState(0);

  // Expose specific methods to the parent component using useImperativeHandle
  useImperativeHandle(ref, () => ({
    spawnCard: (cardType: CardTypeEnum, cardId: string) => {
      roadObjectsRef.current?.spawnCard(cardType, cardId);
    },
    spawnCash: () => {
      roadObjectsRef.current?.spawnCash();
    },
    clearRoadObjects: () => {
      roadObjectsRef.current?.clear();
    }
  }));

  useEffect(() => {
    const config = { ...defaultConfig, ...backgroundConfig };
    const backgroundImageSrc = getBackgroundImage(config);
    
    if (!backgroundRendererRef.current) {
      backgroundRendererRef.current = new BackgroundRenderer(config);
    } else {
      backgroundRendererRef.current.updateConfig(config);
    }
    
    if (!backgroundImageRef.current) {
      backgroundImageRef.current = new BackgroundImageManager();
    }
    
    if (backgroundImageSrc) {
      backgroundImageRef.current.updateImage(backgroundImageSrc);
    }
    
    if (!roadObjectsRef.current) {
      roadObjectsRef.current = new RoadObjectsManager(); 
    }
  }, [backgroundConfig, viewportChanged]);

  const checkCollisions = useCallback(() => {
    if (!characterRef.current || !roadObjectsRef.current) return;
    
    const character = characterRef.current;
    const collectibles = roadObjectsRef.current.getCollectibleObjects();
    
    collectibles.forEach(obj => {
      if (obj.z < 0.5 && obj.z > 0 && Math.abs(obj.x) < 0.2) {
        roadObjectsRef.current!.collectObject(obj.id);
        onCollect?.(obj);
      }
    });
  }, [onCollect]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!characterRef.current) {
      characterRef.current = new CharacterSprite({
        src: "/sprites/hero.png",
        x: window.innerWidth / 2,
        y: window.innerHeight - 50,
        animationFrameLimit: 8,
        scale: 6,
      });
    }

    function resize(): void {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (characterRef.current) {
        characterRef.current.x = window.innerWidth / 2;
        characterRef.current.y = window.innerHeight - 50;
      }
    }
    
    resize();
    window.addEventListener("resize", resize);

    function gameLoop() {
      if (!canvas || !ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Disabled - only draw background image, no overlays
      // if (backgroundRendererRef.current) {
      //   backgroundRendererRef.current.draw(ctx, canvas.width, canvas.height);
      // }
      
      if (backgroundImageRef.current) {
        backgroundImageRef.current.draw(ctx, canvas.width, canvas.height);
      }
      
      // 3. Temporarily commented out emojis
      // if (emojiManagerRef.current) {
      //   const currentTime = Date.now();
      //   if (!isPaused) {
      //     emojiManagerRef.current.spawn(currentTime);
      //     emojiManagerRef.current.update(16);
      //   }
      //   emojiManagerRef.current.draw(ctx, canvas.width, canvas.height);
      // }
      
      if (roadObjectsRef.current) {
        if (!isPaused) {
          roadObjectsRef.current.update(16);
          if (!disableInteraction) {
            checkCollisions();
          }
        }
        roadObjectsRef.current.draw(ctx, canvas.width, canvas.height);
      }
      
      if (characterRef.current) {
        if (!isPaused) {
          characterRef.current.update();
        }
        characterRef.current.draw(ctx);
      }
      
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPaused, checkCollisions, backgroundConfig, disableInteraction]);

  // Handle viewport changes to switch between mobile/desktop images
  useEffect(() => {
    const handleResize = () => {
      setViewportChanged(prev => prev + 1); // Force re-evaluation of background image
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100vw",
        height: "100vh",
        display: "block",
        imageRendering: "pixelated",
      }}
    />
  );
});

export default GameRunnerScene;