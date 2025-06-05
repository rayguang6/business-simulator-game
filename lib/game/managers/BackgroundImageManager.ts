import { PerspectiveUtils } from '@/lib/game/perspective';

export class BackgroundImageManager {
  private image: HTMLImageElement | null = null;
  private imageLoaded: boolean = false;
  private imagePath: string | null = null;

  constructor(imagePath?: string) {
    if (imagePath) {
      this.loadImage(imagePath);
    }
  }

  /**
   * Load a background image
   */
  loadImage(imagePath: string): void {
    this.imagePath = imagePath;
    this.image = new Image();
    this.image.onload = () => {
      this.imageLoaded = true;
    };
    this.image.onerror = () => {
      console.warn(`Failed to load background image: ${imagePath}`);
      this.imageLoaded = false;
    };
    this.image.src = imagePath;
  }

  /**
   * Update the background image path
   */
  updateImage(imagePath: string): void {
    if (this.imagePath !== imagePath) {
      this.loadImage(imagePath);
    }
  }

  /**
   * Draw the background image covering the basic background but not blocking game elements
   */
  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.image || !this.imageLoaded) {
      return;
    }

    ctx.save();
    
    // Set a reduced opacity so it doesn't completely hide the underlying background
    // This creates a nice overlay effect
    ctx.globalAlpha = 0.8;
    
    // Calculate how to fit the image to cover the screen while maintaining aspect ratio
    const imageAspectRatio = this.image.naturalWidth / this.image.naturalHeight;
    const screenAspectRatio = width / height;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (imageAspectRatio > screenAspectRatio) {
      // Image is wider than screen - fit by height
      drawHeight = height;
      drawWidth = height * imageAspectRatio;
      offsetX = (width - drawWidth) / 2;
      offsetY = 0;
    } else {
      // Image is taller than screen - fit by width  
      drawWidth = width;
      drawHeight = width / imageAspectRatio;
      offsetX = 0;
      offsetY = (height - drawHeight) / 2;
    }
    
    // Draw the background image to cover the entire screen
    ctx.drawImage(
      this.image,
      offsetX,
      offsetY,
      drawWidth,
      drawHeight
    );
    
    ctx.globalAlpha = 1.0;
    ctx.restore();
  }

  /**
   * Clear the current background image
   */
  clear(): void {
    this.image = null;
    this.imageLoaded = false;
    this.imagePath = null;
  }

  /**
   * Check if image is loaded and ready to draw
   */
  isReady(): boolean {
    return this.imageLoaded && this.image !== null;
  }
} 