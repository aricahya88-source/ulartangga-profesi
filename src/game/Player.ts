import { Animation, Scene, TransformNode, Vector3 } from '@babylonjs/core';
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

  async moveTo(tile: number, board: Board, scene: Scene, duration = 240): Promise<void> {
    this.position = tile;
    if (!this.root) return;
    const from = this.root.position.clone();
    const to = this.offsetPosition(board.tilePosition(tile));
    const anim = new Animation(`playerMove${this.index}`, 'position', 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
    anim.setKeys([{ frame: 0, value: from }, { frame: 12, value: to.add(new Vector3(0, 0.28, 0)) }, { frame: 24, value: to }]);
    await new Promise<void>((resolve) => {
      scene.beginDirectAnimation(this.root!, [anim], 0, 24, false, 1000 / duration, resolve);
    });
  }
}
