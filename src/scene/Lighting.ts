import {
  Color3,
  DirectionalLight,
  GlowLayer,
  HemisphericLight,
  PointLight,
  Scene,
  ShadowGenerator,
  SpotLight,
  Vector3
} from '@babylonjs/core';

export function createLighting(scene: Scene) {
  scene.ambientColor = new Color3(0.08, 0.10, 0.12);
  scene.imageProcessingConfiguration.exposure = 1.1;
  scene.imageProcessingConfiguration.contrast = 1.18;
  scene.imageProcessingConfiguration.toneMappingEnabled = true;

  const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.58;
  hemi.diffuse = new Color3(0.86, 0.91, 1.0);
  hemi.groundColor = new Color3(0.10, 0.13, 0.16);

  const sun = new DirectionalLight('sun', new Vector3(-0.45, -1, 0.22), scene);
  sun.position = new Vector3(10, 16, -10);
  sun.intensity = 1.7;
  sun.diffuse = new Color3(1.0, 0.96, 0.90);
  sun.specular = new Color3(1.0, 0.95, 0.90);

  const key = new SpotLight('key', new Vector3(-7, 9, -3), new Vector3(0.52, -1, 0.24), Math.PI / 2.4, 2, scene);
  key.intensity = 0.85;
  key.diffuse = new Color3(1.0, 0.88, 0.72);

  const rim = new PointLight('rim', new Vector3(8, 5, 7), scene);
  rim.intensity = 0.42;
  rim.diffuse = new Color3(0.46, 0.70, 1.0);

  const shadows = new ShadowGenerator(2048, sun);
  shadows.usePercentageCloserFiltering = true;
  shadows.filteringQuality = ShadowGenerator.QUALITY_HIGH;
  shadows.bias = 0.0005;
  shadows.normalBias = 0.02;
  shadows.darkness = 0.35;

  const glow = new GlowLayer('glow', scene, { blurKernelSize: 32 });
  glow.intensity = 0.25;

  return shadows;
}
