import { Animation, CubicEase, EasingFunction, Scene, TransformNode, Vector3 } from '@babylonjs/core';
import type { Board } from './Board';

export class Player {
  position = 0;
  score = 0;
  correct = 0;
  answered = 0;
  root: TransformNode | null = null;

  constructor(public name: string, public readonly index: number) {}

  get accuracy(): string {
    return this.answered ? `${Math.round((this.correct / this.answered) * 100)}%` : '–';
  }

  attach(root: TransformNode) {
    this.root = root;
  }

  reset(board: Board) {
    this.position = 0;
    this.score = 0;
    this.correct = 0;
    this.answered = 0;
    if (this.root) this.root.position.copyFrom(this.offsetPosition(board.tilePosition(0)));
  }

  private offsetPosition(pos: Vector3): Vector3 {
    const copy = pos.clone();
    copy.x += this.index === 0 ? -0.28 : 0.28;
    copy.y += 0.02;
    return copy;
  }

  async moveTo(tile: number, board: Board, scene: Scene, duration = 260): Promise<void> {
    this.position = tile;
    if (!this.root) return;
    const from = this.root.position.clone();
    const to = this.offsetPosition(board.tilePosition(tile));
    const mid = Vector3.Lerp(from, to, 0.5).add(new Vector3(0, Math.max(0.26, from.subtract(to).length() * 0.10), 0));

    const ease = new CubicEase();
    ease.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    const anim = new Animation(`playerMove${this.index}`, 'position', 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
    anim.setEasingFunction(ease);
    anim.setKeys([
      { frame: 0, value: from },
      { frame: 16, value: mid },
      { frame: 32, value: to }
    ]);
    await new Promise<void>((resolve) => {
      scene.beginDirectAnimation(this.root!, [anim], 0, 32, false, 1000 / duration, resolve);
    });
  }
}
