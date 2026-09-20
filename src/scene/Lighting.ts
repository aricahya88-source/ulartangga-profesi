import * as pc from 'playcanvas';

export function createLighting(app: pc.Application) {
  app.scene.ambientLight = new pc.Color(0.16, 0.18, 0.22);

  const sun = new pc.Entity('Key Sun');
  sun.addComponent('light', {
    type: 'directional',
    color: new pc.Color(1.0, 0.91, 0.78),
    intensity: 1.65,
    castShadows: true,
    shadowResolution: 2048,
    shadowDistance: 30
  });
  sun.setEulerAngles(48, -32, 0);
  app.root.addChild(sun);

  const fill = new pc.Entity('Cool Fill');
  fill.addComponent('light', {
    type: 'omni',
    color: new pc.Color(0.32, 0.58, 1.0),
    intensity: 1.15,
    range: 16,
    castShadows: false
  });
  fill.setPosition(6.5, 6.0, 5.5);
  app.root.addChild(fill);

  const warm = new pc.Entity('Warm Fill');
  warm.addComponent('light', {
    type: 'omni',
    color: new pc.Color(1.0, 0.56, 0.28),
    intensity: 0.85,
    range: 14,
    castShadows: false
  });
  warm.setPosition(-6.5, 5.2, -4.5);
  app.root.addChild(warm);

  return { sun, fill, warm };
}
