// Shared perspective and positioning utilities

export interface ScreenPosition {
    x: number;
    y: number;
    scale: number;
  }
  
  export interface WorldPosition {
    x: number;  // -1 to 1 (normalized)
    z: number;  // 0 (close) to 10+ (far)
  }
  
  export class PerspectiveUtils {
    // static readonly HORIZON_Y = 0.4; // 40% from top
    // static readonly ROAD_WIDTH_BOTTOM = 0.6; // 60% of screen width
    // static readonly ROAD_WIDTH_TOP = 60; // Pixels at vanishing point
    // static readonly MAX_DEPTH = 10;
    static readonly HORIZON_Y = 0.55; // 40% from top
    static readonly ROAD_WIDTH_BOTTOM = 0.6; // 60% of screen width
    static readonly ROAD_WIDTH_TOP = 60; // Pixels at vanishing point
    static readonly MAX_DEPTH = 10;
  
    /**
     * Convert world coordinates to screen coordinates
     */
    static worldToScreen(
      world: WorldPosition,
      screenWidth: number,
      screenHeight: number
    ): ScreenPosition {
      const horizon = screenHeight * this.HORIZON_Y;
      const vanishingX = screenWidth / 2;
      
      // Exact same formula as working RunnerScene.tsx
      const scale = 1 / (1 + world.z * 2);
      
      // Calculate road width at this depth
      const roadWidthAtZ = (screenWidth * this.ROAD_WIDTH_BOTTOM) * scale;
      
      // Calculate screen positions - same for ALL objects
      const screenX = vanishingX + world.x * roadWidthAtZ / 3;
      const screenY = horizon + (screenHeight - horizon) * scale;
      
      return { x: screenX, y: screenY, scale };
    }
  
    /**
     * Get road width at specific depth
     */
    static getRoadWidthAtDepth(z: number, screenWidth: number): number {
      const depthFactor = Math.min(z / this.MAX_DEPTH, 1);
      const scale = 1 - depthFactor * 0.9;
      
      const roadWidthBottom = screenWidth * this.ROAD_WIDTH_BOTTOM;
      return this.ROAD_WIDTH_TOP + (roadWidthBottom - this.ROAD_WIDTH_TOP) * scale;
    }
  
    /**
     * Get road edges at specific depth
     */
    static getRoadEdgesAtDepth(
      z: number,
      screenWidth: number,
      screenHeight: number
    ): { left: number; right: number; scale: number } {
      const vanishingX = screenWidth / 2;
      const roadWidth = this.getRoadWidthAtDepth(z, screenWidth);
      const scale = 1 - Math.min(z / this.MAX_DEPTH, 1) * 0.9;
      
      return {
        left: vanishingX - roadWidth / 2,
        right: vanishingX + roadWidth / 2,
        scale
      };
    }
  
    /**
     * Calculate alpha (transparency) based on depth
     */
    static getDepthAlpha(z: number, fadeInStart = 8, fadeOutEnd = 0.5): number {
      if (z > fadeInStart) {
        return (this.MAX_DEPTH - z) / (this.MAX_DEPTH - fadeInStart);
      } else if (z < fadeOutEnd) {
        return z / fadeOutEnd;
      }
      return 1;
    }
  
    /**
     * Check if position is on the road
     */
    static isOnRoad(worldX: number): boolean {
      return Math.abs(worldX) <= 0.5;
    }
  }