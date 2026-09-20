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
  private yaw = -8;
  private pitch = 46;
  private radius = 18.5;
  private target = new pc.Vec3(0, 0.45, 0);
  private desiredYaw = this.yaw;
  private desiredPitch = this.pitch;
  private desiredRadius = this.radius;
  private desiredTarget = this.target.clone();
  private dragging = false;
  private lastX = 0;
  private lastY = 0;

  private readonly presets: CameraPreset[] = [
    { yaw: -8, pitch: 46, radius: 18.5, target: new pc.Vec3(0, 0.45, 0) },
    { yaw: 38, pitch: 37, radius: 16.2, target: new pc.Vec3(0.5, 0.72, -0.15) },
    { yaw: -48, pitch: 52, radius: 19.3, target: new pc.Vec3(-0.4, 0.35, 0.25) },
    { yaw: 0, pitch: 71, radius: 20.5, target: new pc.Vec3(0, 0, 0) }
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
    this.current = (this.current + 1) % this.presets.length;
    const p = this.presets[this.current];
    this.desiredYaw = p.yaw;
    this.desiredPitch = p.pitch;
    this.desiredRadius = p.radius;
    this.desiredTarget.copy(p.target);
  }

  focus(world: pc.Vec3, radius = 13.7, durationBias = 1) {
    this.desiredTarget.lerp(this.desiredTarget, world, Math.min(1, 0.88 * durationBias));
    this.desiredRadius = radius;
    this.desiredPitch = Math.min(this.desiredPitch, 43);
  }

  restoreOverview() {
    const p = this.presets[this.current];
    this.desiredTarget.copy(p.target);
    this.desiredRadius = p.radius;
    this.desiredPitch = p.pitch;
    this.desiredYaw = p.yaw;
  }

  private bindInput() {
    this.canvas.addEventListener('pointerdown', (e) => {
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
      if (!this.dragging) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.desiredYaw -= dx * 0.25;
      this.desiredPitch = pc.math.clamp(this.desiredPitch - dy * 0.20, 25, 76);
    });
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.desiredRadius = pc.math.clamp(this.desiredRadius + e.deltaY * 0.012, 11.5, 24);
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
    let delta = ((b - a + 180) % 360 + 360) % 360 - 180;
    return a + delta * t;
  }
}
