"use client";
import React, { useRef, useEffect, useCallback } from "react";
import { CharacterSprite } from "@/lib/game/entities/CharacterSprite";
import { BackgroundRenderer } from "@/lib/game/managers/BackgroundRenderer";
import { EmojiDecorationManager } from "@/lib/game/managers/EmojiDecorationManager";
import { RoadObjectsManager } from "@/lib/game/managers/RoadObjectManager";

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

const GameRunnerScene: React.FC<GameRunnerSceneProps> = ({ 
  isPaused, 
  backgroundConfig,
  onCollect 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const characterRef = useRef<CharacterSprite | null>(null);
  const backgroundRendererRef = useRef<BackgroundRenderer | null>(null);
  const emojiManagerRef = useRef<EmojiDecorationManager | null>(null);
  const roadObjectsRef = useRef<RoadObjectsManager | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Initialize managers only once
  useEffect(() => {
    const config = backgroundConfig || defaultBackgroundConfig;
    
    // Create managers if they don't exist
    if (!backgroundRendererRef.current) {
      backgroundRendererRef.current = new BackgroundRenderer(config);
    }
    
    if (!emojiManagerRef.current && config.emojis) {
      emojiManagerRef.current = new EmojiDecorationManager(config.emojis, 400);
    }
    
    if (!roadObjectsRef.current) {
      roadObjectsRef.current = new RoadObjectsManager(1500);
    }
    
    // Update background config if it changed
    if (backgroundConfig) {
      backgroundRendererRef.current.updateConfig(backgroundConfig);
    }
  }, [backgroundConfig]);

  // Check collisions
  const checkCollisions = useCallback(() => {
    if (!characterRef.current || !roadObjectsRef.current) return;
    
    const character = characterRef.current;
    const collectibles = roadObjectsRef.current.getCollectibleObjects();
    
    collectibles.forEach(obj => {
      // Simple collision detection based on z-depth and x position
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

    // Initialize character
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
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      if (backgroundRendererRef.current) {
        backgroundRendererRef.current.draw(ctx, canvas.width, canvas.height);
      }
      
      // Update and draw emoji decorations
      if (emojiManagerRef.current) {
        const currentTime = Date.now();
        if (!isPaused) {
          emojiManagerRef.current.spawn(currentTime);
        }
        emojiManagerRef.current.update(16);
        emojiManagerRef.current.draw(ctx, canvas.width, canvas.height);
      }
      
      // Update and draw road objects
      if (roadObjectsRef.current) {
        const currentTime = Date.now();
        if (!isPaused) {
          roadObjectsRef.current.spawn(currentTime);
        }
        roadObjectsRef.current.update(16);
        roadObjectsRef.current.draw(ctx, canvas.width, canvas.height);
        
        // Check collisions
        if (!isPaused) {
          checkCollisions();
        }
      }
      
      // Update and draw character
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
  }, [isPaused, checkCollisions]);

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
};

export default GameRunnerScene;