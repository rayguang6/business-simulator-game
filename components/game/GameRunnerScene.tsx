"use client";
import React, { useRef, useEffect } from "react";

const SKY_COLOR_TOP = "#4A90E2";
const SKY_COLOR_BOTTOM = "#7BB3F4";
const GROUND_COLOR = "#1a1a2e";
const ROAD_COLOR = "#2C3E50";

function drawSky(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const horizon = height * 0.4;
  const gradient = ctx.createLinearGradient(0, 0, 0, horizon);
  gradient.addColorStop(0, SKY_COLOR_TOP);
  gradient.addColorStop(1, SKY_COLOR_BOTTOM);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, horizon);
}

function drawGround(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const horizon = height * 0.4;
  ctx.fillStyle = GROUND_COLOR;
  ctx.fillRect(0, horizon, width, height - horizon);
}

function drawRoad(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const vanishing = { x: width / 2, y: height * 0.4 };
  const roadWidth = width * 0.6;
  ctx.save();
  ctx.fillStyle = ROAD_COLOR;
  ctx.beginPath();
  ctx.moveTo(vanishing.x - 30, vanishing.y);
  ctx.lineTo(vanishing.x + 30, vanishing.y);
  ctx.lineTo(width / 2 + roadWidth / 2, height);
  ctx.lineTo(width / 2 - roadWidth / 2, height);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

interface GameRunnerSceneProps {
  isPaused: boolean;
}

const GameRunnerScene: React.FC<GameRunnerSceneProps> = ({ isPaused }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    let animationId: number;

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawSky(ctx, canvas.width, canvas.height);
      drawGround(ctx, canvas.width, canvas.height);
      drawRoad(ctx, canvas.width, canvas.height);
      animationId = requestAnimationFrame(draw);
    }
    if (!isPaused) {
      animationId = requestAnimationFrame(draw);
    }
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, [isPaused]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100vw", height: "100vh", display: "block", imageRendering: "pixelated" }}
    />
  );
};

export default GameRunnerScene;