import * as pc from 'playcanvas';
import { MaterialFactory } from '../scene/MaterialFactory';

const FACE_PIPS: Record<number, Array<[number, number]>> = {
  1: [[0, 0]],
  2: [[-1, 1], [1, -1]],
  3: [[-1, 1], [0, 0], [1, -1]],
  4: [[-1, 1], [1, 1], [-1, -1], [1, -1]],
  5: [[-1, 1], [1, 1], [0, 0], [-1, -1], [1, -1]],
  6: [[-1, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [1, -1]]
};

export class Dice {
  readonly root = new pc.Entity('3D Dice');

  constructor(private readonly app: pc.Application, private readonly materials: MaterialFactory) {
    const cube = new pc.Entity('Dice Body');
    cube.addComponent('render', { type: 'box' });
    if (cube.render) {
      cube.render.material = materials.dice;
      cube.render.castShadows = true;
      cube.render.receiveShadows = true;
    }
    cube.setLocalScale(0.82, 0.82, 0.82);
    this.root.addChild(cube);
    this.addPips();
    this.root.setPosition(8.6, 1.25, -2.7);
    app.root.addChild(this.root);
  }

  async roll(): Promise<number> {
    const value = 1 + Math.floor(Math.random() * 6);
    const startEuler = this.root.getEulerAngles().clone();
    const targetEuler = new pc.Vec3(
      startEuler.x + 720 + Math.random() * 300,
      startEuler.y + 900 + Math.random() * 300,
      startEuler.z + 540 + Math.random() * 240
    );
    const startY = this.root.getPosition().y;
    const startTime = performance.now();
    const duration = 760;

    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        const t = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const rx = pc.math.lerp(startEuler.x, targetEuler.x, eased);
        const ry = pc.math.lerp(startEuler.y, targetEuler.y, eased);
        const rz = pc.math.lerp(startEuler.z, targetEuler.z, eased);
        this.root.setEulerAngles(rx, ry, rz);
        const pos = this.root.getPosition().clone();
        pos.y = startY + Math.sin(Math.PI * t) * 1.05;
        this.root.setPosition(pos);
        if (t < 1) requestAnimationFrame(tick);
        else {
          const pos2 = this.root.getPosition().clone();
          pos2.y = startY;
          this.root.setPosition(pos2);
          resolve();
        }
      };
      requestAnimationFrame(tick);
    });
    return value;
  }

  private addPips() {
    const offset = 0.425;
    const spread = 0.18;
    const pipScale = 0.055;

    const addFace = (value: number, face: 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right') => {
      for (const [gx, gy] of FACE_PIPS[value]) {
        const pip = new pc.Entity(`pip-${face}-${gx}-${gy}`);
        pip.addComponent('render', { type: 'sphere' });
        if (pip.render) pip.render.material = this.materials.dicePip;
        pip.setLocalScale(pipScale, pipScale * 0.45, pipScale);

        switch (face) {
          case 'top':
            pip.setLocalPosition(gx * spread, offset, gy * spread);
            break;
          case 'bottom':
            pip.setLocalPosition(gx * spread, -offset, -gy * spread);
            break;
          case 'front':
            pip.setLocalPosition(gx * spread, gy * spread, -offset);
            pip.setLocalEulerAngles(90, 0, 0);
            break;
          case 'back':
            pip.setLocalPosition(-gx * spread, gy * spread, offset);
            pip.setLocalEulerAngles(90, 0, 0);
            break;
          case 'left':
            pip.setLocalPosition(-offset, gy * spread, gx * spread);
            pip.setLocalEulerAngles(0, 0, 90);
            break;
          case 'right':
            pip.setLocalPosition(offset, gy * spread, -gx * spread);
            pip.setLocalEulerAngles(0, 0, 90);
            break;
        }
        this.root.addChild(pip);
      }
    };

    addFace(1, 'top');
    addFace(6, 'bottom');
    addFace(2, 'front');
    addFace(5, 'back');
    addFace(3, 'left');
    addFace(4, 'right');
  }
}
