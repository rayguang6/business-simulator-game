interface SpriteConfig {
  src: string;
  x?: number;
  y?: number;
  animationFrameLimit?: number;
  scale?: number;
}

interface Animation {
  [key: string]: number[][];
}

export class CharacterSprite {
  private image: HTMLImageElement;
  private isLoaded: boolean = false;
  private animations: Animation;
  private currentAnimation: string;
  private currentAnimationFrame: number;
  private animationFrameLimit: number;
  private animationFrameProgress: number;
  public x: number;
  public y: number;
  private scale: number;

  constructor(config: SpriteConfig) {
    this.image = new Image();
    this.image.src = config.src;
    this.image.onload = () => {
      this.isLoaded = true;
    };

    // Walk-up animation frames [x, y] coordinates on the sprite sheet
    this.animations = {
      "walk-up": [[1, 2], [0, 2], [3, 2], [0, 2]]
    };
    
    this.currentAnimation = "walk-up";
    this.currentAnimationFrame = 0;
    this.animationFrameLimit = config.animationFrameLimit || 8;
    this.animationFrameProgress = this.animationFrameLimit;
    
    // Fixed position on canvas
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.scale = config.scale || 1;
  }

  get frame(): number[] {
    return this.animations[this.currentAnimation][this.currentAnimationFrame];
  }

  private updateAnimationProgress(): void {
    if (this.animationFrameProgress > 0) {
      this.animationFrameProgress -= 1;
      return;
    }

    this.animationFrameProgress = this.animationFrameLimit;
    this.currentAnimationFrame = (this.currentAnimationFrame + 1) % this.animations[this.currentAnimation].length;
  }

  update(): void {
    // Only update animation, no movement
    this.updateAnimationProgress();
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.isLoaded) return;
    
    const [frameX, frameY] = this.frame;
    
    // Original sprite size
    const spriteWidth = 32;
    const spriteHeight = 32;
    
    // Scaled size
    const scaledWidth = spriteWidth * this.scale;
    const scaledHeight = spriteHeight * this.scale;
    
    // Draw character sprite at fixed position with scaling
    // Center horizontally and anchor at bottom
    ctx.drawImage(
      this.image,
      frameX * spriteWidth, frameY * spriteHeight,
      spriteWidth, spriteHeight,
      this.x - scaledWidth / 2, this.y - scaledHeight,
      scaledWidth, scaledHeight
    );
  }
}