export class Sprite {
  image: HTMLImageElement;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  currentFrame: number = 0;
  animationFrameLimit: number;
  animationFrameProgress: number;
  loaded: boolean = false;

  constructor({ src, frameWidth, frameHeight, frameCount, animationFrameLimit = 8 }: {
    src: string;
    frameWidth: number;
    frameHeight: number;
    frameCount: number;
    animationFrameLimit?: number;
  }) {
    this.image = new window.Image();
    this.image.onload = () => { this.loaded = true; };
    this.image.src = src;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.frameCount = frameCount;
    this.animationFrameLimit = animationFrameLimit;
    this.animationFrameProgress = this.animationFrameLimit;
  }

  updateAnimationProgress() {
    if (this.animationFrameProgress > 0) {
      this.animationFrameProgress -= 1;
      return;
    }
    this.animationFrameProgress = this.animationFrameLimit;
    this.currentFrame = (this.currentFrame + 1) % this.frameCount;
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number = 1) {
    if (!this.loaded) return;
    ctx.drawImage(
      this.image,
      this.currentFrame * this.frameWidth,
      0,
      this.frameWidth,
      this.frameHeight,
      x - (this.frameWidth * scale) / 2,
      y - (this.frameHeight * scale) / 2,
      this.frameWidth * scale,
      this.frameHeight * scale
    );
    this.updateAnimationProgress();
  }
} 