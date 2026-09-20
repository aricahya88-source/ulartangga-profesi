import { Animation, Scene, TransformNode, Vector3 } from '@babylonjs/core';

export class Dice {
  constructor(private readonly scene: Scene, private readonly root: TransformNode) {}

  async roll(): Promise<number> {
    const value = 1 + Math.floor(Math.random() * 6);
    const from = this.root.rotation.clone();
    const to = from.add(new Vector3(
      Math.PI * (4 + Math.random() * 2),
      Math.PI * (5 + Math.random() * 2),
      Math.PI * (3 + Math.random() * 2)
    ));
    const anim = new Animation('diceRoll', 'rotation', 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
    anim.setKeys([{ frame: 0, value: from }, { frame: 42, value: to }]);
    await new Promise<void>((resolve) => {
      this.scene.beginDirectAnimation(this.root, [anim], 0, 42, false, 1.45, resolve);
    });
    return value;
  }
}
