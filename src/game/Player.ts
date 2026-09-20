import * as pc from 'playcanvas';
import type { Board } from './Board';

export class Player {
  position = 0;
  score = 0;
  correct = 0;
  answered = 0;
  root: pc.Entity | null = null;

  constructor(public name: string, public readonly index: number) {}

  get accuracy(): string {
    return this.answered ? `${Math.round((this.correct / this.answered) * 100)}%` : '–';
  }

  attach(root: pc.Entity) {
    this.root = root;
  }

  reset(board: Board) {
    this.position = 0;
    this.score = 0;
    this.correct = 0;
    this.answered = 0;
    if (this.root) this.root.setPosition(this.offsetPosition(board.tilePosition(0)));
  }

  private offsetPosition(pos: pc.Vec3): pc.Vec3 {
    const copy = pos.clone();
    copy.x += this.index === 0 ? -0.26 : 0.26;
    return copy;
  }

  async moveTo(tile: number, board: Board, duration = 300, onFrame?: (position: pc.Vec3) => void): Promise<void> {
    this.position = tile;
    if (!this.root) return;
    const from = this.root.getPosition().clone();
    const to = this.offsetPosition(board.tilePosition(tile));
    const distance = from.clone().sub(to).length();
    const lift = Math.max(0.28, Math.min(1.25, distance * 0.12));
    const start = performance.now();

    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const smooth = t * t * (3 - 2 * t);
        const p = new pc.Vec3().lerp(from, to, smooth);
        p.y += Math.sin(Math.PI * t) * lift;
        this.root!.setPosition(p);
        onFrame?.(p);
        if (t < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
  }
}
