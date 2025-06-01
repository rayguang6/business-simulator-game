// EmojiDecorationManager.ts
import { PerspectiveUtils, WorldPosition } from '@/lib/game/perspective';

interface EmojiDecoration extends WorldPosition {
  emoji: string;
  speed: number;
  size: number;
}

export class EmojiDecorationManager {
  private decorations: EmojiDecoration[] = [];
  private lastSpawnTime: number = 0;
  private spawnInterval: number;
  private emojis: string[];
  private readonly MOVEMENT_SPEED = 0.08; // same as road objects

  constructor(emojis: string[], spawnInterval = 600) {
    this.emojis = emojis;
    this.spawnInterval = spawnInterval;
  }

  /**
   * Spawn a new emoji “just under the sky” and “just off the road.”
   *
   * We pick:
   *   • z somewhere between 0.7*MAX_DEPTH and MAX_DEPTH  →  that projects high (just below the sky).
   *   • x in [–1.2, –0.6] or [0.6, 1.2]                  →  that sits just outside the road’s |x| ≤ 0.5.
   *
   * @param currentTime   Current timestamp (ms)
   */
  spawn(currentTime: number): void {
    if (this.emojis.length === 0) return;
    if (currentTime - this.lastSpawnTime < this.spawnInterval) return;

    const emoji = this.emojis[
      Math.floor(Math.random() * this.emojis.length)
    ];

    // ─────────────────────────────────────────────────────
    // 1) CHOOSE z so that emoji appears “under the sky”
    //    (i.e. high on screen). We’ll pick a random z in
    //    [0.7*MAX_DEPTH, MAX_DEPTH].
    // ─────────────────────────────────────────────────────
    const raw = Math.random(); // 0..1
    const zMin = PerspectiveUtils.MAX_DEPTH * 0.7; // e.g. 7 if MAX_DEPTH=10
    const zMax = PerspectiveUtils.MAX_DEPTH;       // 10
    const z = zMin + raw * (zMax - zMin);

    // ─────────────────────────────────────────────────────
    // 2) CHOOSE x so that |x| is just outside the road (|x| ≤ 0.5).
    //    We’ll pick worldX in [–1.2, –0.6] or [0.6, 1.2]. 
    //    That way, at the chosen depth (z), the emoji will be off‐road
    //    but not so far off‐screen that it never shows.
    // ─────────────────────────────────────────────────────
    const sideMargin = 8;   // just outside the road’s half‐width (0.5)
    const sideMax    = 16;   // how far to the side we allow
    let x: number;

    if (Math.random() < 0.5) {
      // LEFT side: choose x ∈ [–sideMax, –sideMargin]
      x = -sideMargin - Math.random() * (sideMax - sideMargin);
    } else {
      // RIGHT side: choose x ∈ [ sideMargin,  sideMax]
      x =  sideMargin + Math.random() * (sideMax - sideMargin);
    }

    // ─────────────────────────────────────────────────────
    // 3) PUSH the new decoration
    // ─────────────────────────────────────────────────────
    this.decorations.push({
      emoji,
      x,
      z,
      speed: this.MOVEMENT_SPEED,
      size: 4 + Math.random() * 0.5, // random “scale” factor
    });

    this.lastSpawnTime = currentTime;
  }

  update(deltaTime: number): void {
    // Move every decoration forward (decreasing z):
    this.decorations.forEach((dec) => {
      dec.z -= this.MOVEMENT_SPEED;
    });
    // Remove anything that’s passed the camera (z ≤ 0)
    this.decorations = this.decorations.filter((d) => d.z > 0);
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Sort by depth (furthest first)
    const sorted = [...this.decorations].sort((a, b) => b.z - a.z);
    sorted.forEach((decoration) => {
      const { x: screenX, y: screenY, scale } = PerspectiveUtils.worldToScreen(
        { x: decoration.x, z: decoration.z },
        width,
        height
      );
      const alpha = PerspectiveUtils.getDepthAlpha(decoration.z);
      ctx.globalAlpha = alpha * 0.9;
      const fontSize = Math.floor(64 * scale * decoration.size);
      ctx.font = `${fontSize}px serif`;
      ctx.fillText(decoration.emoji, screenX, screenY);
    });

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  clear(): void {
    this.decorations = [];
  }
}
