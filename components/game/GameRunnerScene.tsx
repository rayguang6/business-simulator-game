"use client";
import React, { useRef, useEffect } from "react";
import { CharacterSprite } from "./CharacterSprite";
import { drawBackground, BackgroundConfig, BackgroundEmojiManager } from "./GameBackground";

interface GameRunnerSceneProps {
  isPaused: boolean;
  backgroundConfig?: BackgroundConfig;
}

const defaultBackgroundConfig: BackgroundConfig = {
  skyTop: "#4A90E2",
  skyBottom: "#7BB3F4",
  ground: "#1a1a2e",
  road: "#2C3E50",
  emojis: ["🌳", "🌴", "🌵", "🪨", "🌲", "🌿"], // Trees and nature for roadside
};

const GameRunnerScene: React.FC<GameRunnerSceneProps> = ({ isPaused, backgroundConfig }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const characterRef = useRef<CharacterSprite | null>(null);
  const emojiManagerRef = useRef<BackgroundEmojiManager | null>(null);

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
        scale: 3,
      });
    }

    // Create or update emoji manager
    const config = backgroundConfig || defaultBackgroundConfig;
    emojiManagerRef.current = new BackgroundEmojiManager(config, 400); // Faster spawn rate

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

    let animationId: number;

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      drawBackground(
        ctx,
        canvas.width,
        canvas.height,
        config
      );
      
      // Emoji decorations
      if (emojiManagerRef.current) {
        // Only spawn new emojis when not paused
        if (!isPaused) {
          emojiManagerRef.current.spawnIfNeeded();
        }
        
        // Always update movement (even when paused for smooth visuals)
        emojiManagerRef.current.update();
        emojiManagerRef.current.draw(ctx, canvas.width, canvas.height);
      }
      
      // Character animation
      if (!isPaused && characterRef.current) {
        characterRef.current.update();
      }
      if (characterRef.current) {
        characterRef.current.draw(ctx);
      }
      
      animationId = requestAnimationFrame(draw);
    }

    animationId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, [isPaused, backgroundConfig]);

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