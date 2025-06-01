export interface BackgroundConfig {
    skyTop?: string;
    skyBottom?: string;
    ground?: string;
    road?: string;
    emojis?: string[]; // For emoji decoration
  }
  
  export function drawBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    config: BackgroundConfig = {}
  ) {
    const SKY_COLOR_TOP = config.skyTop || "#4A90E2";
    const SKY_COLOR_BOTTOM = config.skyBottom || "#7BB3F4";
    const GROUND_COLOR = config.ground || "#1a1a2e";
    const ROAD_COLOR = config.road || "#2C3E50";
  
    // Draw sky
    const horizon = height * 0.4;
    const gradient = ctx.createLinearGradient(0, 0, 0, horizon);
    gradient.addColorStop(0, SKY_COLOR_TOP);
    gradient.addColorStop(1, SKY_COLOR_BOTTOM);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, horizon);
  
    // Draw ground
    ctx.fillStyle = GROUND_COLOR;
    ctx.fillRect(0, horizon, width, height - horizon);
  
    // Draw road
    const vanishing = { x: width / 2, y: horizon };
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
  
  // --- Emoji Decoration Manager ---
  
  // Calculate road edges at given depth
  function getRoadEdgesAtDepth(z: number, width: number, height: number) {
    const horizon = height * 0.4;
    const vanishingX = width / 2;
    
    // Scale factor based on depth (0 = closest, 1 = horizon)
    const depthFactor = z / 10; // Assuming max depth of 10
    const scale = 1 - depthFactor * 0.9; // Don't go all the way to 0
    
    // Road width at bottom and at horizon
    const roadWidthBottom = width * 0.6;
    const roadWidthHorizon = 60; // Width at vanishing point
    
    // Interpolate road width based on depth
    const roadWidthAtZ = roadWidthHorizon + (roadWidthBottom - roadWidthHorizon) * scale;
    
    return {
      leftEdge: vanishingX - roadWidthAtZ / 2,
      rightEdge: vanishingX + roadWidthAtZ / 2,
      scale: scale
    };
  }
  
  function worldToScreen(worldX: number, worldZ: number, width: number, height: number) {
    const horizon = height * 0.4;
    const edges = getRoadEdgesAtDepth(worldZ, width, height);
    
    // Calculate Y position based on depth
    const depthFactor = worldZ / 10;
    const screenY = horizon + (height - horizon) * (1 - depthFactor);
    
    // Calculate X position
    let screenX: number;
    if (worldX < 0) {
      // Left side: place emoji to the left of the road
      const offset = Math.abs(worldX) * width * 0.15; // How far from road edge
      screenX = edges.leftEdge - offset;
    } else {
      // Right side: place emoji to the right of the road
      const offset = worldX * width * 0.15;
      screenX = edges.rightEdge + offset;
    }
    
    return { 
      x: screenX, 
      y: screenY, 
      scale: edges.scale * 0.5 // Make emojis smaller
    };
  }
  
  interface EmojiDecoration {
    emoji: string;
    x: number; // -1 (left side) or 1 (right side), with variations
    z: number; // depth (0 = close, 10 = far)
    speed: number;
    size: number; // scale multiplier
  }
  
  export class BackgroundEmojiManager {
    private decorations: EmojiDecoration[] = [];
    private lastSpawn: number = Date.now();
    private readonly spawnInterval: number;
    private readonly config: BackgroundConfig;
  
    constructor(config: BackgroundConfig, spawnInterval = 600) {
      this.config = config;
      this.spawnInterval = spawnInterval;
    }
  
    spawnIfNeeded() {
      if (!this.config.emojis || this.config.emojis.length === 0) return;
      if (Date.now() - this.lastSpawn < this.spawnInterval) return;
      
      const emoji = this.config.emojis[Math.floor(Math.random() * this.config.emojis.length)];
      const isLeftSide = Math.random() < 0.5;
      
      // X position: negative for left side, positive for right side
      // Add random variation (0.5 to 1.5) to create different distances from road
      const xBase = isLeftSide ? -1 : 1;
      const xVariation = 0.5 + Math.random() * 1.0;
      const x = xBase * xVariation;
      
      const size = 0.8 + Math.random() * 0.5; // 0.8 to 1.3
      
      this.decorations.push({
        emoji,
        x,
        z: 10, // Start at far distance
        speed: 0.05 + Math.random() * 0.02, // Move towards camera
        size,
      });
      
      this.lastSpawn = Date.now();
    }
  
    update() {
      // Move emojis towards camera
      this.decorations.forEach(e => {
        e.z -= e.speed;
      });
      
      // Remove emojis that have passed the camera
      this.decorations = this.decorations.filter(e => e.z > 0);
    }
  
    draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Sort by depth (far to near) for proper rendering
      const sorted = [...this.decorations].sort((a, b) => b.z - a.z);
      
      sorted.forEach(e => {
        const { x, y, scale } = worldToScreen(e.x, e.z, width, height);
        
        // Fade in/out based on distance
        let alpha = 1;
        if (e.z > 8) {
          // Fade in when far
          alpha = (10 - e.z) / 2;
        } else if (e.z < 1) {
          // Fade out when too close
          alpha = e.z;
        }
        
        ctx.globalAlpha = alpha * 0.9;
        ctx.font = `${Math.floor(64 * scale * e.size)}px serif`;
        ctx.fillText(e.emoji, x, y);
      });
      
      ctx.globalAlpha = 1.0;
      ctx.restore();
    }
  }