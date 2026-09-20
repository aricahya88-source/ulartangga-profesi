import {
  Animation,
  Color3,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  PBRMetallicRoughnessMaterial,
  Scene,
  SceneLoader,
  ShadowGenerator,
  StandardMaterial,
  Texture,
  TransformNode,
  Vector3
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { Board, type Competency } from '../game/Board';
import { BONUS_TILES, LADDERS, SNAKES } from '../game/TileEvent';

const ZONE_COLORS: Record<Competency, Color3> = {
  Pedagogik: new Color3(0.18, 0.55, 0.95),
  Profesional: new Color3(0.48, 0.31, 0.90),
  Kepribadian: new Color3(0.96, 0.50, 0.12),
  Sosial: new Color3(0.18, 0.68, 0.39),
  Integratif: new Color3(0.88, 0.18, 0.34)
};

export class BoardScene {
  readonly board = new Board();
  playerRoots!: [TransformNode, TransformNode];
  diceRoot!: TransformNode;
  private readonly snakeRoots: TransformNode[] = [];

  private constructor(
    private readonly scene: Scene,
    private readonly shadows: ShadowGenerator
  ) {}

  static async create(scene: Scene, shadows: ShadowGenerator): Promise<BoardScene> {
    const helper = new BoardScene(scene, shadows);
    helper.createEnvironment();
    helper.createTiles();
    helper.createConnections();
    const blue = helper.createStandingPawn('playerA', new Color3(0.18, 0.46, 0.95), new Color3(0.90, 0.94, 1.0));
    const red = helper.createStandingPawn('playerB', new Color3(0.86, 0.24, 0.32), new Color3(1.0, 0.92, 0.92));
    blue.scaling.setAll(0.90);
    red.scaling.setAll(0.90);
    const dice = await helper.importModel('dice.glb', 'dice');
    dice.scaling.setAll(0.82);
    dice.position = new Vector3(8.8, 1.1, -2.7);
    helper.playerRoots = [blue, red];
    helper.diceRoot = dice;
    helper.animateSnakes();
    return helper;
  }

  private createEnvironment() {
    this.scene.clearColor.set(0.03, 0.06, 0.10, 1);

    const base = MeshBuilder.CreateBox('boardBase', { width: 16.7, depth: 8.9, height: 0.54 }, this.scene);
    base.position.y = -0.12;
    const baseMat = new PBRMaterial('baseMat', this.scene);
    baseMat.albedoColor = new Color3(0.09, 0.11, 0.14);
    baseMat.metallic = 0.22;
    baseMat.roughness = 0.40;
    baseMat.reflectivityColor = new Color3(0.26, 0.28, 0.30);
    base.material = baseMat;
    base.receiveShadows = true;
    this.shadows.addShadowCaster(base);

    const bezel = MeshBuilder.CreateBox('boardBezel', { width: 17.15, depth: 9.35, height: 0.20 }, this.scene);
    bezel.position.y = -0.35;
    const bezelMat = new PBRMaterial('bezelMat', this.scene);
    bezelMat.albedoColor = new Color3(0.34, 0.20, 0.07);
    bezelMat.metallic = 0.06;
    bezelMat.roughness = 0.48;
    bezelMat.reflectivityColor = new Color3(0.25, 0.18, 0.06);
    bezel.material = bezelMat;
    bezel.receiveShadows = true;

    const felt = MeshBuilder.CreateGround('feltTop', { width: 15.95, height: 8.15 }, this.scene);
    felt.position.y = 0.03;
    const feltMat = new PBRMaterial('feltMat', this.scene);
    feltMat.albedoColor = new Color3(0.08, 0.25, 0.22);
    feltMat.albedoTexture = new Texture('/textures/board-felt.png', this.scene);
    feltMat.roughness = 0.94;
    feltMat.metallic = 0.0;
    felt.material = feltMat;
    felt.receiveShadows = true;

    const floor = MeshBuilder.CreateGround('floor', { width: 28, height: 20 }, this.scene);
    floor.position.y = -0.40;
    const floorMat = new PBRMaterial('floorMat', this.scene);
    floorMat.albedoColor = new Color3(0.06, 0.10, 0.12);
    floorMat.albedoTexture = new Texture('/textures/board-felt.png', this.scene);
    floorMat.metallic = 0;
    floorMat.roughness = 1;
    floor.material = floorMat;
    floor.receiveShadows = true;
  }

  private createTiles() {
    for (let tile = 1; tile <= 50; tile++) {
      const competency = this.board.competencyFor(tile);
      const position = this.board.tilePosition(tile);
      const box = MeshBuilder.CreateBox(`tile-${tile}`, { width: this.board.tileSize, depth: this.board.tileSize, height: 0.42 }, this.scene);
      box.position = new Vector3(position.x, 0.22, position.z);

      const material = new PBRMaterial(`tileMat-${tile}`, this.scene);
      material.albedoColor = ZONE_COLORS[competency];
      material.metallic = 0.06;
      material.roughness = 0.36;
      if (BONUS_TILES.has(tile)) {
        material.emissiveColor = new Color3(0.22, 0.18, 0.06);
        material.albedoColor = material.albedoColor.scale(1.08);
      }
      if (tile === 50) {
        material.emissiveColor = new Color3(0.30, 0.08, 0.12);
        material.albedoColor = new Color3(0.95, 0.30, 0.36);
      }
      box.material = material;
      box.receiveShadows = true;
      this.shadows.addShadowCaster(box);
      this.createTileLabel(tile, competency, position);
    }
  }

  private createTileLabel(tile: number, competency: Competency, position: Vector3) {
    const texture = new DynamicTexture(`label-${tile}`, { width: 1024, height: 1024 }, this.scene, true);
    texture.hasAlpha = true;
    const ctx = texture.getContext();
    ctx.clearRect(0, 0, 1024, 1024);

    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    this.roundRect(ctx, 80, 80, 864, 864, 60);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 10;
    this.roundRect(ctx, 80, 80, 864, 864, 60);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 280px Arial';
    const tileText = String(tile);
    const tileTextWidth = ctx.measureText(tileText).width;
    ctx.fillText(tileText, 512 - tileTextWidth / 2, 510);

    ctx.font = 'bold 84px Arial';
    const marker = tile === 50 ? 'FINAL' : BONUS_TILES.has(tile) ? 'BONUS' : (LADDERS.has(tile) ? 'TANGGA' : SNAKES.has(tile) ? 'ULAR' : competency.toUpperCase().slice(0, 3));
    const markerWidth = ctx.measureText(marker).width;
    ctx.fillText(marker, 512 - markerWidth / 2, 700);

    texture.update();

    const mat = new StandardMaterial(`labelMat-${tile}`, this.scene);
    mat.diffuseTexture = texture;
    mat.opacityTexture = texture;
    mat.emissiveColor = new Color3(1, 1, 1);
    mat.disableLighting = true;
    mat.specularColor = Color3.Black();
    const plane = MeshBuilder.CreatePlane(`labelPlane-${tile}`, { size: this.board.tileSize * 0.98, sideOrientation: Mesh.DOUBLESIDE }, this.scene);
    plane.rotation.x = Math.PI / 2;
    plane.position = new Vector3(position.x, 0.452, position.z);
    plane.material = mat;
    plane.isPickable = false;
  }

  private roundRect(ctx: any, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  private createStandingPawn(name: string, bodyColor: Color3, accentColor: Color3): TransformNode {
    const root = new TransformNode(name, this.scene);

    const bodyMat = new PBRMaterial(`${name}-bodyMat`, this.scene);
    bodyMat.albedoColor = bodyColor;
    bodyMat.metallic = 0.12;
    bodyMat.roughness = 0.28;
    bodyMat.reflectivityColor = accentColor.scale(0.55);

    const accentMat = new PBRMaterial(`${name}-accentMat`, this.scene);
    accentMat.albedoColor = accentColor;
    accentMat.metallic = 0.04;
    accentMat.roughness = 0.36;

    const base = MeshBuilder.CreateCylinder(`${name}-base`, { height: 0.18, diameterTop: 0.60, diameterBottom: 0.72, tessellation: 28 }, this.scene);
    base.parent = root;
    base.position.y = 0.10;
    base.material = accentMat;

    const torso = MeshBuilder.CreateCylinder(`${name}-torso`, { height: 0.74, diameterTop: 0.34, diameterBottom: 0.44, tessellation: 28 }, this.scene);
    torso.parent = root;
    torso.position.y = 0.56;
    torso.material = bodyMat;

    const shoulder = MeshBuilder.CreateSphere(`${name}-shoulder`, { diameterX: 0.50, diameterY: 0.22, diameterZ: 0.42, segments: 20 }, this.scene);
    shoulder.parent = root;
    shoulder.position.y = 0.90;
    shoulder.material = bodyMat;

    const neck = MeshBuilder.CreateCylinder(`${name}-neck`, { height: 0.10, diameter: 0.16, tessellation: 18 }, this.scene);
    neck.parent = root;
    neck.position.y = 1.00;
    neck.material = accentMat;

    const head = MeshBuilder.CreateSphere(`${name}-head`, { diameter: 0.34, segments: 24 }, this.scene);
    head.parent = root;
    head.position.y = 1.22;
    head.material = accentMat;

    const brim = MeshBuilder.CreateTorus(`${name}-brim`, { diameter: 0.30, thickness: 0.04, tessellation: 22 }, this.scene);
    brim.parent = root;
    brim.position.y = 1.08;
    brim.rotation.x = Math.PI / 2;
    brim.material = bodyMat;

    const badge = MeshBuilder.CreateBox(`${name}-badge`, { width: 0.16, height: 0.12, depth: 0.03 }, this.scene);
    badge.parent = root;
    badge.position.set(0, 0.62, -0.20);
    badge.material = accentMat;

    [base, torso, shoulder, neck, head, brim, badge].forEach((m) => {
      m.receiveShadows = true;
      this.shadows.addShadowCaster(m);
    });

    return root;
  }

  private createConnections() {
    for (const [from, to] of LADDERS) this.createLadder(`ladder-${from}-${to}`, from, to);
    for (const [from, to] of SNAKES) this.createSnake(`snake-${from}-${to}`, from, to);
  }

  private createLadder(name: string, from: number, to: number) {
    const a = this.board.tilePosition(from);
    const b = this.board.tilePosition(to);
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const distance = Math.hypot(dx, dz);
    const root = new TransformNode(name, this.scene);
    root.position = new Vector3((a.x + b.x) / 2, 0.60, (a.z + b.z) / 2);
    root.rotation.y = -Math.atan2(dz, dx);

    const wood = new PBRMaterial(`${name}-wood`, this.scene);
    wood.albedoColor = new Color3(0.63, 0.45, 0.18);
    wood.metallic = 0.03;
    wood.roughness = 0.70;
    wood.reflectivityColor = new Color3(0.18, 0.12, 0.05);

    const half = distance / 2;
    const railOffset = 0.24;
    const railRadiusTop = 0.07;
    const railRadiusBottom = 0.09;

    const rail1 = MeshBuilder.CreateCylinder(`${name}-rail1`, { height: distance, diameterTop: railRadiusTop, diameterBottom: railRadiusBottom, tessellation: 18 }, this.scene);
    rail1.parent = root;
    rail1.rotation.z = Math.PI / 2;
    rail1.position = new Vector3(0, 0, -railOffset);
    rail1.material = wood;
    rail1.receiveShadows = true;
    this.shadows.addShadowCaster(rail1);

    const rail2 = rail1.clone(`${name}-rail2`)!;
    rail2.parent = root;
    rail2.position.z = railOffset;

    const rungCount = Math.max(4, Math.round(distance / 0.58));
    for (let i = 0; i < rungCount; i++) {
      const t = rungCount === 1 ? 0.5 : i / (rungCount - 1);
      const x = -half + t * distance;
      const rung = MeshBuilder.CreateCylinder(`${name}-rung-${i}`, { height: railOffset * 2.3, diameterTop: 0.075, diameterBottom: 0.085, tessellation: 16 }, this.scene);
      rung.parent = root;
      rung.rotation.x = Math.PI / 2;
      rung.position = new Vector3(x, 0.02, 0);
      rung.material = wood;
      rung.receiveShadows = true;
      this.shadows.addShadowCaster(rung);
    }
  }

  private createSnake(name: string, from: number, to: number) {
    const a = this.board.tilePosition(from);
    const b = this.board.tilePosition(to);
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const distance = Math.hypot(dx, dz);
    const root = new TransformNode(name, this.scene);
    root.position = new Vector3((a.x + b.x) / 2, 0.58, (a.z + b.z) / 2);
    root.rotation.y = -Math.atan2(dz, dx);

    const bodyMat = new PBRMaterial(`${name}-body`, this.scene);
    bodyMat.albedoColor = new Color3(0.14, 0.52, 0.24);
    bodyMat.metallic = 0.02;
    bodyMat.roughness = 0.44;
    bodyMat.reflectivityColor = new Color3(0.16, 0.28, 0.14);

    const bellyMat = new PBRMaterial(`${name}-belly`, this.scene);
    bellyMat.albedoColor = new Color3(0.88, 0.82, 0.60);
    bellyMat.metallic = 0;
    bellyMat.roughness = 0.72;

    const half = distance / 2;
    const waves = Math.max(2, Math.round(distance / 2.1));
    const points: Vector3[] = [];
    const segments = 54;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -half + distance * t;
      const z = Math.sin(t * Math.PI * waves) * 0.26;
      const y = Math.sin(t * Math.PI) * 0.05;
      points.push(new Vector3(x, y, z));
    }

    const snake = MeshBuilder.CreateTube(`${name}-tube`, {
      path: points,
      radiusFunction: (i) => {
        const t = i / segments;
        if (t < 0.18) return 0.14 - t * 0.14;
        if (t > 0.82) return 0.09 - (t - 0.82) * 0.35;
        return 0.095;
      },
      cap: Mesh.CAP_ALL,
      tessellation: 22,
      updatable: false
    }, this.scene);
    snake.parent = root;
    snake.material = bodyMat;
    snake.receiveShadows = true;
    this.shadows.addShadowCaster(snake);

    const belly = MeshBuilder.CreateRibbon(`${name}-belly`, {
      pathArray: [points.map((p) => new Vector3(p.x, p.y - 0.042, p.z - 0.035)), points.map((p) => new Vector3(p.x, p.y - 0.042, p.z + 0.035))],
      sideOrientation: Mesh.DOUBLESIDE,
      closeArray: false,
      closePath: false
    }, this.scene);
    belly.parent = root;
    belly.material = bellyMat;
    belly.receiveShadows = true;

    const head = MeshBuilder.CreateSphere(`${name}-head`, { diameterX: 0.38, diameterY: 0.24, diameterZ: 0.30, segments: 20 }, this.scene);
    head.parent = root;
    head.position = new Vector3(-half + 0.08, 0.02, 0);
    head.material = bodyMat;
    head.receiveShadows = true;
    this.shadows.addShadowCaster(head);

    const eyeMat = new StandardMaterial(`${name}-eyeMat`, this.scene);
    eyeMat.diffuseColor = new Color3(0.05, 0.05, 0.05);
    eyeMat.emissiveColor = new Color3(0.02, 0.02, 0.02);
    for (const side of [-1, 1]) {
      const eye = MeshBuilder.CreateSphere(`${name}-eye-${side}`, { diameter: 0.045, segments: 10 }, this.scene);
      eye.parent = root;
      eye.position = new Vector3(-half + 0.01, 0.09, side * 0.078);
      eye.material = eyeMat;
    }

    const tongueMat = new StandardMaterial(`${name}-tongueMat`, this.scene);
    tongueMat.diffuseColor = new Color3(0.84, 0.16, 0.25);
    tongueMat.emissiveColor = new Color3(0.18, 0.04, 0.05);
    const tongue = MeshBuilder.CreateBox(`${name}-tongue`, { width: 0.18, height: 0.01, depth: 0.028 }, this.scene);
    tongue.parent = root;
    tongue.position = new Vector3(-half - 0.20, 0.01, 0);
    tongue.material = tongueMat;
    const tongueFork1 = MeshBuilder.CreateBox(`${name}-tongue-f1`, { width: 0.05, height: 0.01, depth: 0.01 }, this.scene);
    tongueFork1.parent = root;
    tongueFork1.position = new Vector3(-half - 0.30, 0.01, -0.02);
    tongueFork1.rotation.y = -0.45;
    tongueFork1.material = tongueMat;
    const tongueFork2 = tongueFork1.clone(`${name}-tongue-f2`)!;
    tongueFork2.parent = root;
    tongueFork2.position.z = 0.02;
    tongueFork2.rotation.y = 0.45;

    this.snakeRoots.push(root);
  }

  private animateSnakes() {
    this.snakeRoots.forEach((root, index) => {
      const yBase = root.position.y;
      const zBase = root.position.z;
      this.scene.registerBeforeRender(() => {
        const t = performance.now() * 0.0012 + index * 0.8;
        root.position.y = yBase + Math.sin(t * 2.0) * 0.025;
        root.position.z = zBase + Math.sin(t * 1.7) * 0.015;
        root.rotation.y += Math.sin(t) * 0.00045;
      });
    });
  }

  private async importModel(file: string, name: string): Promise<TransformNode> {
    const result = await SceneLoader.ImportMeshAsync('', '/models/', file, this.scene);
    const outer = new TransformNode(name, this.scene);
    result.meshes.filter((mesh: any) => !mesh.parent).forEach((mesh: any) => mesh.parent = outer);
    result.meshes.forEach((mesh: any) => {
      mesh.receiveShadows = true;
      this.shadows.addShadowCaster(mesh);
    });
    return outer;
  }
}
