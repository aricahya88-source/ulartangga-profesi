import { Animation, ArcRotateCamera, CubicEase, EasingFunction, Scene, Vector3 } from '@babylonjs/core';

interface CameraPreset {
  alpha: number;
  beta: number;
  radius: number;
  target: Vector3;
}

export class GameCamera {
  readonly camera: ArcRotateCamera;
  private mode = 0;
  private readonly presets: CameraPreset[] = [
    {
      alpha: -Math.PI / 2 + 0.18,
      beta: 0.98,
      radius: 18.8,
      target: new Vector3(0, 0.45, 0.1)
    },
    {
      alpha: -Math.PI / 2 + 0.74,
      beta: 0.84,
      radius: 16.6,
      target: new Vector3(0.5, 0.85, -0.15)
    },
    {
      alpha: -Math.PI / 2 - 0.52,
      beta: 1.08,
      radius: 20.4,
      target: new Vector3(-0.35, 0.25, 0.4)
    }
  ];

  constructor(private readonly scene: Scene, canvas: HTMLCanvasElement) {
    const p = this.presets[0];
    this.camera = new ArcRotateCamera('camera', p.alpha, p.beta, p.radius, p.target.clone(), scene);
    this.camera.lowerRadiusLimit = 13;
    this.camera.upperRadiusLimit = 25;
    this.camera.lowerBetaLimit = 0.58;
    this.camera.upperBetaLimit = 1.35;
    this.camera.wheelDeltaPercentage = 0.01;
    this.camera.panningSensibility = 0;
    this.camera.attachControl(canvas, true);
  }

  toggleAngle() {
    this.mode = (this.mode + 1) % this.presets.length;
    this.animateTo(this.presets[this.mode]);
  }

  private animateTo(preset: CameraPreset) {
    const ease = new CubicEase();
    ease.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    this.animateFloat('alpha', this.camera.alpha, preset.alpha, ease);
    this.animateFloat('beta', this.camera.beta, preset.beta, ease);
    this.animateFloat('radius', this.camera.radius, preset.radius, ease);

    const anim = new Animation('camTarget', 'target', 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
    anim.setEasingFunction(ease);
    anim.setKeys([
      { frame: 0, value: this.camera.target.clone() },
      { frame: 30, value: preset.target.clone() }
    ]);
    this.scene.beginDirectAnimation(this.camera, [anim], 0, 30, false);
  }

  private animateFloat(property: 'alpha' | 'beta' | 'radius', from: number, to: number, ease: CubicEase) {
    const anim = new Animation(`cam-${property}`, property, 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    anim.setEasingFunction(ease);
    anim.setKeys([
      { frame: 0, value: from },
      { frame: 30, value: to }
    ]);
    this.scene.beginDirectAnimation(this.camera, [anim], 0, 30, false);
  }
}
