import { PerspectiveUtils, WorldPosition } from '@/lib/game/perspective';

export interface RoadObject extends WorldPosition {
  id: string;
  type: 'card' | 'cash';
  width: number;
  height: number;
  collected: boolean;
}

export class RoadObjectsManager {
  private objects: RoadObject[] = [];
  private images: Record<string, HTMLImageElement> = {};
  private lastSpawnTime: number = 0;
  private spawnInterval: number;
  private nextId: number = 0;
  private readonly MOVEMENT_SPEED = 0.08; // Consistent movement speed
  
  constructor(spawnInterval = 2000) {
    this.spawnInterval = spawnInterval;
    this.loadImages();
  }

  private loadImages(): void {
    const cardImg = new Image();
    cardImg.src = '/images/card.png';
    this.images.card = cardImg;

    const cashImg = new Image();
    cashImg.src = '/images/cash.png';
    this.images.cash = cashImg;
  }

  spawn(currentTime: number): void {
    if (currentTime - this.lastSpawnTime < this.spawnInterval) return;
    
    const type: 'card' | 'cash' = Math.random() < 0.5 ? 'card' : 'cash';
    
    // Position exactly in the middle of the road
    const x = 0; // 0 means center of the road
    
    this.objects.push({
      id: `obj_${this.nextId++}`,
      type,
      x,
      z: PerspectiveUtils.MAX_DEPTH,
      width: 128,  // Increased from 64
      height: 128, // Increased from 64
      collected: false
    });
    
    this.lastSpawnTime = currentTime;
  }

  update(deltaTime: number): void {
    this.objects.forEach(obj => {
      if (!obj.collected) {
        obj.z -= this.MOVEMENT_SPEED;
      }
    });
    
    this.objects = this.objects.filter(obj => obj.z > -0.5 && !obj.collected);
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.save();
    
    const sorted = [...this.objects].sort((a, b) => b.z - a.z);
    
    // --- Professional, aspect-ratio-correct image rendering (width-based) ---
    const CARD_WIDTH = 220; // Bigger card
    const CASH_WIDTH = 120; // Keep cash as before
    const SCALE_MULTIPLIER = 1.5; // Global scale for visibility

    sorted.forEach(obj => {
      if (obj.collected) return;
      const image = this.images[obj.type];
      if (!image?.complete) return;

      const { x, y, scale } = PerspectiveUtils.worldToScreen(
        { x: obj.x, z: obj.z },
        width,
        height
      );

      // Use different width for card and cash
      let drawWidth = CASH_WIDTH * scale * SCALE_MULTIPLIER;
      if (obj.type === 'card') {
        drawWidth = CARD_WIDTH * scale * SCALE_MULTIPLIER;
      }
      const aspectRatio = image.naturalWidth / image.naturalHeight;
      const drawHeight = drawWidth / aspectRatio;
      const alpha = PerspectiveUtils.getDepthAlpha(obj.z, 8, 0.5);

      ctx.globalAlpha = alpha;

      // Draw shadow (ellipse under the object)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.ellipse(
        x,
        y + drawHeight * 0.4,
        drawWidth * 0.4,
        drawHeight * 0.1,
        0, 0, Math.PI * 2
      );
      ctx.fill();

      // Draw the image, centered at (x, y), with correct aspect ratio
      ctx.drawImage(
        image,
        x - drawWidth / 2,
        y - drawHeight / 2,
        drawWidth,
        drawHeight
      );
    });
    
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Get objects in collision range
  getCollectibleObjects(): RoadObject[] {
    return this.objects.filter(obj => 
      !obj.collected && 
      obj.z < 2 && 
      obj.z > 0
    );
  }

  // Mark object as collected
  collectObject(objectId: string): void {
    const object = this.objects.find(obj => obj.id === objectId);
    if (object) {
      object.collected = true;
    }
  }

  clear(): void {
    this.objects = [];
  }
}