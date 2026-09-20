import { Color3, DirectionalLight, HemisphericLight, Scene, ShadowGenerator, Vector3 } from '@babylonjs/core';

export function createLighting(scene: Scene) {
  const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.78;
  hemi.groundColor = new Color3(0.12, 0.16, 0.20);

  const sun = new DirectionalLight('sun', new Vector3(-0.45, -1, 0.3), scene);
  sun.position = new Vector3(8, 14, -10);
  sun.intensity = 1.1;

  const shadows = new ShadowGenerator(2048, sun);
  shadows.useBlurExponentialShadowMap = true;
  shadows.blurKernel = 24;
  return shadows;
}
