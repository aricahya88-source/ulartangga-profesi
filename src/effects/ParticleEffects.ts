import * as pc from 'playcanvas';

interface SparkParticle {
  entity: pc.Entity;
  velocity: pc.Vec3;
}

/** Lightweight procedural sparkle burst without external textures. */
export async function sparkleBurst(app: pc.Application, world: pc.Vec3, color = new pc.Color(1, 0.75, 0.18)) {
  const mat = new pc.StandardMaterial();
  mat.diffuse.copy(color);
  mat.emissive.copy(color);
  mat.emissiveIntensity = 1.5;
  mat.update();

  const particles: SparkParticle[] = [];
  for (let i = 0; i < 12; i++) {
    const entity = new pc.Entity(`Spark ${i}`);
    entity.addComponent('render', { type: 'sphere' });
    if (entity.render) entity.render.material = mat;
    entity.setLocalScale(0.07, 0.07, 0.07);
    entity.setPosition(world);
    app.root.addChild(entity);
    const angle = (i / 12) * Math.PI * 2;
    particles.push({
      entity,
      velocity: new pc.Vec3(Math.cos(angle) * 1.2, 1.0 + Math.random() * 0.7, Math.sin(angle) * 1.2)
    });
  }

  const started = performance.now();
  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      const dt = 1 / 60;
      const elapsed = (now - started) / 1000;
      particles.forEach((p) => {
        p.velocity.y -= 2.3 * dt;
        const pos = p.entity.getPosition().clone().add(p.velocity.clone().mulScalar(dt));
        p.entity.setPosition(pos);
        const scale = Math.max(0.01, 0.07 * (1 - elapsed / 0.75));
        p.entity.setLocalScale(scale, scale, scale);
      });
      if (elapsed < 0.75) requestAnimationFrame(tick);
      else {
        particles.forEach((p) => p.entity.destroy());
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });
}
