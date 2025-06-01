import { PerspectiveUtils, WorldPosition } from '@/lib/game/perspective';
import { CardTypeEnum } from '@/lib/enums';

export interface RoadObject extends WorldPosition {
  id: string;
  type: 'card' | 'cash';
  actualCardType?: CardTypeEnum;
  cardId?: string;
  width: number;
  height: number;
  collected: boolean;
}

export class RoadObjectsManager {
  private objects: RoadObject[] = [];
  private images: Record<string, HTMLImageElement> = {}; // Will store images keyed by CardTypeEnum string or 'cash'
  private nextId: number = 0;
  private readonly MOVEMENT_SPEED = 0.08; // Consistent movement speed
  
  constructor() {
    this.loadImages();
  }

  private loadImages(): void {
    // Load images for each card type
    const card1Img = new Image();
    card1Img.src = '/images/cards/card1.png'; // Assuming Opportunity
    this.images[CardTypeEnum.opportunity] = card1Img;

    const card2Img = new Image();
    card2Img.src = '/images/cards/card2.png'; // Assuming Problem
    this.images[CardTypeEnum.problem] = card2Img;

    const card3Img = new Image();
    card3Img.src = '/images/cards/card3.png'; // Assuming Market
    this.images[CardTypeEnum.market] = card3Img;

    const card4Img = new Image();
    card4Img.src = '/images/cards/card4.png'; // Assuming Happy
    this.images[CardTypeEnum.happy] = card4Img;

    // Load cash image
    const cashImg = new Image();
    cashImg.src = '/images/cash.png';
    this.images.cash = cashImg; // Keep 'cash' as a distinct key for cash objects
  }

  public spawnCard(specificCardType: CardTypeEnum, cardId: string): void {
    const x = 0; 
    this.objects.push({
      id: `obj_${this.nextId++}`,
      type: 'card',
      actualCardType: specificCardType,
      cardId: cardId,
      x,
      z: PerspectiveUtils.MAX_DEPTH,
      width: 128, // Default width, actual draw width is handled in draw()
      height: 128, // Default height, actual draw height is handled in draw()
      collected: false
    });
    // console.log('RoadObjectManager: Spawned Card'); // Optional: for debugging
  }

  public spawnCash(): void {
    const x = 0; // Position exactly in the middle of the road
    this.objects.push({
      id: `obj_${this.nextId++}`,
      type: 'cash',
      // no actualCardType for cash objects
      x,
      z: PerspectiveUtils.MAX_DEPTH,
      width: 128,
      height: 128,
      collected: false
    });
    // console.log('RoadObjectManager: Spawned Cash'); // Optional: for debugging
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

      let image: HTMLImageElement | undefined;
      let drawWidth = CASH_WIDTH * PerspectiveUtils.worldToScreen({ x: obj.x, z: obj.z }, width, height).scale * SCALE_MULTIPLIER;

      if (obj.type === 'card' && obj.actualCardType) {
        image = this.images[obj.actualCardType];
        // Use CARD_WIDTH for cards, but calculate scale based on perspective first
        const { scale } = PerspectiveUtils.worldToScreen({ x: obj.x, z: obj.z }, width, height);
        drawWidth = CARD_WIDTH * scale * SCALE_MULTIPLIER;
      } else if (obj.type === 'cash') {
        image = this.images.cash; // Already using cash key
        // For cash, width is already set based on CASH_WIDTH and scale
      }

      if (!image?.complete) {
        // Optionally, draw a placeholder or log if image not ready/found
        // console.warn(`Image not ready or found for object type: ${obj.type}, cardType: ${obj.actualCardType}`);
        return;
      }

      const { x: screenX, y: screenY, scale } = PerspectiveUtils.worldToScreen(
        { x: obj.x, z: obj.z },
        width,
        height
      );
      
      // Aspect ratio is based on the selected image
      const aspectRatio = image.naturalWidth / image.naturalHeight;
      const drawHeight = drawWidth / aspectRatio;
      const alpha = PerspectiveUtils.getDepthAlpha(obj.z, 8, 0.5);

      ctx.globalAlpha = alpha;

      // Draw shadow (ellipse under the object)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.ellipse(
        screenX,
        screenY + drawHeight * 0.4,
        drawWidth * 0.4,
        drawHeight * 0.1,
        0, 0, Math.PI * 2
      );
      ctx.fill();

      // Draw the image, centered at (x, y), with correct aspect ratio
      ctx.drawImage(
        image, // Use the selected image
        screenX - drawWidth / 2,
        screenY - drawHeight / 2,
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
    // console.log('RoadObjectManager: Cleared objects'); // Optional: for debugging
  }
}