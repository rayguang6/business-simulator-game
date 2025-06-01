"use client";
import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { CharacterSprite } from "@/lib/game/entities/CharacterSprite";
import { BackgroundRenderer } from "@/lib/game/managers/BackgroundRenderer";
import { EmojiDecorationManager } from "@/lib/game/managers/EmojiDecorationManager";
import { RoadObjectsManager } from "@/lib/game/managers/RoadObjectManager";
import { CardTypeEnum } from '@/lib/enums';

// CardTypeEnum is globally available from lib/global.d.ts

// Define handles to be exposed to the parent component (GameScreen)
export interface GameRunnerSceneHandles {
  spawnCard: (cardType: CardTypeEnum) => void;
  spawnCash: () => void;
  clearRoadObjects: () => void;
}

interface GameRunnerSceneProps {
  isPaused: boolean;
  backgroundConfig?: {
    skyTop?: string;
    skyBottom?: string;
    ground?: string;
    road?: string;
    emojis?: string[];
  };
  onCollect?: (type: 'card' | 'cash') => void;
}

const defaultBackgroundConfig = {
  skyTop: "#4A90E2",
  skyBottom: "#7BB3F4",
  ground: "#1a1a2e",
  road: "#2C3E50",
  emojis: ["🌳", "🌴", "🌵", "🪨", "🌲", "🌿"],
};

// Wrap component with forwardRef
const GameRunnerScene = forwardRef<GameRunnerSceneHandles, GameRunnerSceneProps>(({ 
  isPaused, 
  backgroundConfig,
  onCollect 
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const characterRef = useRef<CharacterSprite | null>(null);
  const backgroundRendererRef = useRef<BackgroundRenderer | null>(null);
  const emojiManagerRef = useRef<EmojiDecorationManager | null>(null);
  const roadObjectsRef = useRef<RoadObjectsManager | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Expose specific methods to the parent component using useImperativeHandle
  useImperativeHandle(ref, () => ({
    spawnCard: (cardType: CardTypeEnum) => {
      roadObjectsRef.current?.spawnCard(cardType);
    },
    spawnCash: () => {
      roadObjectsRef.current?.spawnCash();
    },
    clearRoadObjects: () => {
      roadObjectsRef.current?.clear();
    }
  }));

  useEffect(() => {
    const config = backgroundConfig || defaultBackgroundConfig;
    
    if (!backgroundRendererRef.current) {
      backgroundRendererRef.current = new BackgroundRenderer(config);
    }
    
    if (!emojiManagerRef.current && config.emojis) {
      emojiManagerRef.current = new EmojiDecorationManager(config.emojis, 400);
    }
    
    if (!roadObjectsRef.current) {
      // Update RoadObjectManager instantiation - no more spawnInterval argument
      roadObjectsRef.current = new RoadObjectsManager(); 
    }
    
    if (backgroundConfig) {
      backgroundRendererRef.current.updateConfig(backgroundConfig);
    }
  }, [backgroundConfig]);

  const checkCollisions = useCallback(() => {
    if (!characterRef.current || !roadObjectsRef.current) return;
    
    const character = characterRef.current;
    const collectibles = roadObjectsRef.current.getCollectibleObjects();
    
    collectibles.forEach(obj => {
      if (obj.z < 0.5 && obj.z > 0 && Math.abs(obj.x) < 0.2) {
        roadObjectsRef.current!.collectObject(obj.id);
        onCollect?.(obj.type);
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
      
      if (backgroundRendererRef.current) {
        backgroundRendererRef.current.draw(ctx, canvas.width, canvas.height);
      }
      
      if (emojiManagerRef.current) {
        const currentTime = Date.now();
        if (!isPaused) {
          emojiManagerRef.current.spawn(currentTime);
        }
        emojiManagerRef.current.update(16);
        emojiManagerRef.current.draw(ctx, canvas.width, canvas.height);
      }
      
      if (roadObjectsRef.current) {
        roadObjectsRef.current.update(16);
        roadObjectsRef.current.draw(ctx, canvas.width, canvas.height);
        
        if (!isPaused) {
          checkCollisions();
        }
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
  }, [isPaused, checkCollisions, backgroundConfig]);

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