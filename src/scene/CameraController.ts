import * as pc from 'playcanvas';

interface CameraPreset {
  yaw: number;
  pitch: number;
  radius: number;
  target: pc.Vec3;
}

export class CameraController {
  readonly entity: pc.Entity;
  private current = 0;
  private yaw = -18;
  private pitch = 42;
  private radius = 22.5;
  private target = new pc.Vec3(0, 1.65, 0);
  private desiredYaw = this.yaw;
  private desiredPitch = this.pitch;
  private desiredRadius = this.radius;
  private desiredTarget = this.target.clone();
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private cinematicLock = false;

  private readonly presets: CameraPreset[] = [
    { yaw: -18, pitch: 42, radius: 22.5, target: new pc.Vec3(0, 1.65, 0.0) },
    { yaw: 32, pitch: 34, radius: 19.8, target: new pc.Vec3(1.2, 1.90, -0.15) },
    { yaw: -58, pitch: 48, radius: 21.6, target: new pc.Vec3(-1.0, 1.55, 0.35) },
    { yaw: 0, pitch: 73, radius: 23.8, target: new pc.Vec3(0, 1.55, 0) }
  ];

  constructor(private readonly app: pc.Application, private readonly canvas: HTMLCanvasElement) {
    this.entity = new pc.Entity('Cinematic Camera');
    this.entity.addComponent('camera', {
      clearColor: new pc.Color(0.018, 0.032, 0.052),
      fov: 45,
      nearClip: 0.1,
      farClip: 100
    });
    app.root.addChild(this.entity);
    this.bindInput();
    app.on('update', (dt: number) => this.update(dt));
    this.snap();
  }

  togglePreset() {
    if (this.cinematicLock) return;
    this.current = (this.current + 1) % this.presets.length;
    const p = this.presets[this.current];
    this.desiredYaw = p.yaw;
    this.desiredPitch = p.pitch;
    this.desiredRadius = p.radius;
    this.desiredTarget.copy(p.target);
  }

  focus(world: pc.Vec3, radius = 14.8, durationBias = 1) {
    this.desiredTarget.lerp(this.desiredTarget, world, Math.min(1, 0.88 * durationBias));
    this.desiredTarget.y = Math.max(this.desiredTarget.y, world.y + 0.28);
    this.desiredRadius = radius;
    this.desiredPitch = Math.min(this.desiredPitch, 43);
  }

  trackClimb(world: pc.Vec3, tile: number, progress: number, heightProgress: number) {
    this.cinematicLock = true;
    const level = pc.math.clamp((tile - 1) / 49, 0, 1);
    const sideSweep = Math.sin(progress * Math.PI) * (tile % 2 === 0 ? 1 : -1);
    this.desiredTarget.set(world.x, world.y + 0.36 + level * 0.35, world.z);
    this.desiredRadius = pc.math.lerp(14.4, 11.8, level) - Math.sin(progress * Math.PI) * 0.75;
    this.desiredPitch = pc.math.lerp(43, 35, level) - heightProgress * 2.2;
    this.desiredYaw = pc.math.lerp(this.desiredYaw, -16 + sideSweep * 8 + level * 7, 0.08);
  }

  async finalApproach(world: pc.Vec3) {
    this.cinematicLock = true;
    this.desiredTarget.copy(world);
    this.desiredTarget.y += 0.48;
    this.desiredRadius = 10.2;
    this.desiredPitch = 31;
    this.desiredYaw = 24;
    await this.wait(720);

    this.desiredRadius = 8.9;
    this.desiredPitch = 27;
    this.desiredYaw = -26;
    await this.wait(820);
  }

  async finalVictoryOrbit(world: pc.Vec3) {
    this.cinematicLock = true;
    this.desiredTarget.copy(world);
    this.desiredTarget.y += 0.62;
    this.desiredRadius = 9.2;
    this.desiredPitch = 30;
    for (const yaw of [18, 62, 108]) {
      this.desiredYaw = yaw;
      await this.wait(520);
    }
  }

  releaseCinematic() {
    this.cinematicLock = false;
  }

  restoreOverview() {
    this.cinematicLock = false;
    const p = this.presets[this.current];
    this.desiredTarget.copy(p.target);
    this.desiredRadius = p.radius;
    this.desiredPitch = p.pitch;
    this.desiredYaw = p.yaw;
  }

  private bindInput() {
    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.cinematicLock) return;
      this.dragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.canvas.setPointerCapture(e.pointerId);
    });
    this.canvas.addEventListener('pointerup', (e) => {
      this.dragging = false;
      if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId);
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.dragging || this.cinematicLock) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.desiredYaw -= dx * 0.25;
      this.desiredPitch = pc.math.clamp(this.desiredPitch - dy * 0.20, 25, 76);
    });
    this.canvas.addEventListener('wheel', (e) => {
      if (this.cinematicLock) return;
      e.preventDefault();
      this.desiredRadius = pc.math.clamp(this.desiredRadius + e.deltaY * 0.012, 12.5, 28);
    }, { passive: false });
  }

  private update(dt: number) {
    const k = 1 - Math.exp(-dt * 5.5);
    this.yaw = this.lerpAngle(this.yaw, this.desiredYaw, k);
    this.pitch = pc.math.lerp(this.pitch, this.desiredPitch, k);
    this.radius = pc.math.lerp(this.radius, this.desiredRadius, k);
    this.target.lerp(this.target, this.desiredTarget, k);
    this.applyTransform();
  }

  private snap() {
    this.yaw = this.desiredYaw;
    this.pitch = this.desiredPitch;
    this.radius = this.desiredRadius;
    this.target.copy(this.desiredTarget);
    this.applyTransform();
  }

  private applyTransform() {
    const yaw = this.yaw * pc.math.DEG_TO_RAD;
    const pitch = this.pitch * pc.math.DEG_TO_RAD;
    const horizontal = Math.cos(pitch) * this.radius;
    const pos = new pc.Vec3(
      this.target.x + Math.sin(yaw) * horizontal,
      this.target.y + Math.sin(pitch) * this.radius,
      this.target.z + Math.cos(yaw) * horizontal
    );
    this.entity.setPosition(pos);
    this.entity.lookAt(this.target);
  }

  private lerpAngle(a: number, b: number, t: number) {
    const delta = ((b - a + 180) % 360 + 360) % 360 - 180;
    return a + delta * t;
  }

  private wait(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }
}
