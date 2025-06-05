import { PerspectiveUtils } from '@/lib/game/perspective';

export interface BackgroundConfig {
  skyTop?: string;
  skyBottom?: string;
  ground?: string;
  road?: string;
}

export class BackgroundRenderer {
  private config: BackgroundConfig;
  
  private readonly defaults = {
    skyTop: "#4A90E2",
    skyBottom: "#7BB3F4",
    ground: "#1a1a2e",
    road: "#2C3E50"
  };

  constructor(config: BackgroundConfig = {}) {
    this.config = { ...this.defaults, ...config };
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    this.drawSky(ctx, width, height);
    this.drawGround(ctx, width, height);
    this.drawRoad(ctx, width, height);
  }

  private drawSky(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const horizon = height * PerspectiveUtils.getHorizonY();
    const gradient = ctx.createLinearGradient(0, 0, 0, horizon);
    gradient.addColorStop(0, this.config.skyTop!);
    gradient.addColorStop(1, this.config.skyBottom!);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, horizon);
  }

  private drawGround(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const horizon = height * PerspectiveUtils.getHorizonY();
    ctx.fillStyle = this.config.ground!;
    ctx.fillRect(0, horizon, width, height - horizon);
  }

  private drawRoad(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const horizon = height * PerspectiveUtils.getHorizonY();
    const vanishing = { x: width / 2, y: horizon };
    const roadWidth = width * PerspectiveUtils.ROAD_WIDTH_BOTTOM;
    
    ctx.save();
    ctx.fillStyle = this.config.road!;
    ctx.beginPath();
    ctx.moveTo(vanishing.x - 30, vanishing.y);
    ctx.lineTo(vanishing.x + 30, vanishing.y);
    ctx.lineTo(width / 2 + roadWidth / 2, height);
    ctx.lineTo(width / 2 - roadWidth / 2, height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  updateConfig(config: BackgroundConfig): void {
    this.config = { ...this.config, ...config };
  }
}