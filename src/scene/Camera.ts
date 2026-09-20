import { ArcRotateCamera, Scene, Vector3 } from '@babylonjs/core';

export class GameCamera {
  readonly camera: ArcRotateCamera;
  private alternate = false;

  constructor(scene: Scene, canvas: HTMLCanvasElement) {
    this.camera = new ArcRotateCamera('camera', -Math.PI / 2, 1.05, 18.5, new Vector3(0, 0, 0), scene);
    this.camera.lowerRadiusLimit = 13;
    this.camera.upperRadiusLimit = 25;
    this.camera.lowerBetaLimit = 0.62;
    this.camera.upperBetaLimit = 1.35;
    this.camera.wheelDeltaPercentage = 0.01;
    this.camera.panningSensibility = 0;
    this.camera.attachControl(canvas, true);
  }

  toggleAngle() {
    this.alternate = !this.alternate;
    this.camera.alpha = this.alternate ? -Math.PI / 2 + 0.55 : -Math.PI / 2;
    this.camera.beta = this.alternate ? 0.82 : 1.05;
    this.camera.radius = this.alternate ? 16.5 : 18.5;
  }
}
