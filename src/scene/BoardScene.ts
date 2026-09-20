import '@babylonjs/loaders/glTF';
import {
  Color3,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  PBRMetallicRoughnessMaterial,
  Scene,
  SceneLoader,
  ShadowGenerator,
  StandardMaterial,
  Texture,
  TransformNode,
  Vector3
} from '@babylonjs/core';
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

  private constructor(
    private readonly scene: Scene,
    private readonly shadows: ShadowGenerator
  ) {}

  static async create(scene: Scene, shadows: ShadowGenerator): Promise<BoardScene> {
    const helper = new BoardScene(scene, shadows);
    helper.createEnvironment();
    helper.createTiles();
    helper.createConnections();
    const blue = await helper.importModel('pawn-blue.glb', 'playerA');
    const red = await helper.importModel('pawn-red.glb', 'playerB');
    blue.scaling.setAll(0.64);
    red.scaling.setAll(0.64);
    const dice = await helper.importModel('dice.glb', 'dice');
    dice.scaling.setAll(0.82);
    dice.position = new Vector3(8.8, 1.1, -2.7);
    helper.playerRoots = [blue, red];
    helper.diceRoot = dice;
    return helper;
  }

  private createEnvironment() {
    this.scene.clearColor.set(0.03, 0.06, 0.10, 1);

    const base = MeshBuilder.CreateBox('boardBase', { width: 16.7, depth: 8.9, height: 0.54 }, this.scene);
    base.position.y = -0.12;
    const baseMat = new PBRMetallicRoughnessMaterial('baseMat', this.scene);
    baseMat.baseColor = new Color3(0.08, 0.12, 0.15);
    baseMat.metallic = 0.18;
    baseMat.roughness = 0.48;
    base.material = baseMat;
    base.receiveShadows = true;
    this.shadows.addShadowCaster(base);

    const bezel = MeshBuilder.CreateBox('boardBezel', { width: 17.15, depth: 9.35, height: 0.20 }, this.scene);
    bezel.position.y = -0.35;
    const bezelMat = new PBRMetallicRoughnessMaterial('bezelMat', this.scene);
    bezelMat.baseColor = new Color3(0.55, 0.42, 0.18);
    bezelMat.metallic = 0.05;
    bezelMat.roughness = 0.72;
    bezel.material = bezelMat;
    bezel.receiveShadows = true;

    const floor = MeshBuilder.CreateGround('floor', { width: 28, height: 20 }, this.scene);
    floor.position.y = -0.40;
    const floorMat = new PBRMetallicRoughnessMaterial('floorMat', this.scene);
    floorMat.baseColor = new Color3(0.06, 0.10, 0.12);
    floorMat.baseTexture = new Texture('/textures/board-felt.png', this.scene);
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

      const material = new PBRMetallicRoughnessMaterial(`tileMat-${tile}`, this.scene);
      material.baseColor = ZONE_COLORS[competency];
      material.metallic = 0.05;
      material.roughness = 0.42;
      if (BONUS_TILES.has(tile)) {
        material.emissiveColor = new Color3(0.22, 0.18, 0.06);
        material.baseColor = material.baseColor.scale(1.08);
      }
      if (tile === 50) {
        material.emissiveColor = new Color3(0.24, 0.08, 0.11);
        material.baseColor = new Color3(0.95, 0.30, 0.36);
      }
      box.material = material;
      box.receiveShadows = true;
      this.shadows.addShadowCaster(box);
      this.createTileLabel(tile, competency, position);
    }
  }

  private createTileLabel(tile: number, competency: Competency, position: Vector3) {
    const texture = new DynamicTexture(`label-${tile}`, { width: 512, height: 512 }, this.scene, true);
    const ctx = texture.getContext();
    ctx.clearRect(0, 0, 512, 512);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(22, 22, 468, 468);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 150px Arial';
    const tileText = String(tile);
    const tileTextWidth = ctx.measureText(tileText).width;
    ctx.fillText(tileText, 256 - tileTextWidth / 2, 270);
    ctx.font = 'bold 42px Arial';
    const marker = tile === 50 ? 'FINAL' : BONUS_TILES.has(tile) ? 'BONUS' : (LADDERS.has(tile) ? 'TANGGA' : SNAKES.has(tile) ? 'ULAR' : competency.toUpperCase().slice(0, 3));
    const markerWidth = ctx.measureText(marker).width;
    ctx.fillText(marker, 256 - markerWidth / 2, 360);
    texture.update();

    const mat = new StandardMaterial(`labelMat-${tile}`, this.scene);
    mat.diffuseTexture = texture;
    mat.emissiveColor = new Color3(0.28, 0.28, 0.30);
    mat.useAlphaFromDiffuseTexture = true;
    mat.specularColor = Color3.Black();
    const plane = MeshBuilder.CreatePlane(`labelPlane-${tile}`, { size: this.board.tileSize * 0.88, sideOrientation: Mesh.DOUBLESIDE }, this.scene);
    plane.rotation.x = Math.PI / 2;
    plane.position = new Vector3(position.x, 0.445, position.z);
    plane.material = mat;
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

    const wood = new PBRMetallicRoughnessMaterial(`${name}-wood`, this.scene);
    wood.baseColor = new Color3(0.63, 0.45, 0.18);
    wood.metallic = 0.03;
    wood.roughness = 0.86;

    const half = distance / 2;
    const railOffset = 0.22;
    const railRadiusTop = 0.07;
    const railRadiusBottom = 0.09;

    const rail1 = MeshBuilder.CreateCylinder(`${name}-rail1`, {
      height: distance,
      diameterTop: railRadiusTop,
      diameterBottom: railRadiusBottom,
      tessellation: 18
    }, this.scene);
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
      const rung = MeshBuilder.CreateCylinder(`${name}-rung-${i}`, {
        height: railOffset * 2.3,
        diameterTop: 0.075,
        diameterBottom: 0.085,
        tessellation: 16
      }, this.scene);
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

    const bodyMat = new PBRMetallicRoughnessMaterial(`${name}-body`, this.scene);
    bodyMat.baseColor = new Color3(0.16, 0.58, 0.26);
    bodyMat.metallic = 0.02;
    bodyMat.roughness = 0.55;

    const bellyMat = new PBRMetallicRoughnessMaterial(`${name}-belly`, this.scene);
    bellyMat.baseColor = new Color3(0.88, 0.82, 0.60);
    bellyMat.metallic = 0;
    bellyMat.roughness = 0.75;

    const half = distance / 2;
    const waves = Math.max(2, Math.round(distance / 2.2));
    const points: Vector3[] = [];
    const segments = 36;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -half + distance * t;
      const z = Math.sin(t * Math.PI * waves) * 0.24;
      const y = Math.sin(t * Math.PI) * 0.04;
      points.push(new Vector3(x, y, z));
    }

    const snake = MeshBuilder.CreateTube(`${name}-tube`, {
      path: points,
      radiusFunction: (i, dist) => {
        const t = i / segments;
        if (t < 0.15) return 0.14 - t * 0.12;
        if (t > 0.85) return 0.08 - (t - 0.85) * 0.32;
        return 0.09;
      },
      cap: Mesh.CAP_ALL,
      tessellation: 20,
      updatable: false
    }, this.scene);
    snake.parent = root;
    snake.material = bodyMat;
    snake.receiveShadows = true;
    this.shadows.addShadowCaster(snake);

    const belly = MeshBuilder.CreateRibbon(`${name}-belly`, {
      pathArray: [points.map((p) => new Vector3(p.x, p.y - 0.04, p.z - 0.035)), points.map((p) => new Vector3(p.x, p.y - 0.04, p.z + 0.035))],
      sideOrientation: Mesh.DOUBLESIDE,
      closeArray: false,
      closePath: false
    }, this.scene);
    belly.parent = root;
    belly.material = bellyMat;
    belly.receiveShadows = true;

    const head = MeshBuilder.CreateSphere(`${name}-head`, { diameterX: 0.34, diameterY: 0.22, diameterZ: 0.26, segments: 20 }, this.scene);
    head.parent = root;
    head.position = new Vector3(-half + 0.10, 0.02, 0);
    head.material = bodyMat;
    head.receiveShadows = true;
    this.shadows.addShadowCaster(head);

    const eyeMat = new StandardMaterial(`${name}-eyeMat`, this.scene);
    eyeMat.diffuseColor = new Color3(0.05, 0.05, 0.05);
    eyeMat.emissiveColor = new Color3(0.02, 0.02, 0.02);
    for (const side of [-1, 1]) {
      const eye = MeshBuilder.CreateSphere(`${name}-eye-${side}`, { diameter: 0.04, segments: 10 }, this.scene);
      eye.parent = root;
      eye.position = new Vector3(-half + 0.00, 0.08, side * 0.07);
      eye.material = eyeMat;
      const pupil = MeshBuilder.CreateSphere(`${name}-pupil-${side}`, { diameter: 0.018, segments: 8 }, this.scene);
      pupil.parent = root;
      pupil.position = new Vector3(-half - 0.015, 0.08, side * 0.07);
      pupil.material = eyeMat;
    }

    const tongueMat = new StandardMaterial(`${name}-tongueMat`, this.scene);
    tongueMat.diffuseColor = new Color3(0.84, 0.16, 0.25);
    tongueMat.emissiveColor = new Color3(0.2, 0.04, 0.05);
    const tongue = MeshBuilder.CreateBox(`${name}-tongue`, { width: 0.16, height: 0.01, depth: 0.03 }, this.scene);
    tongue.parent = root;
    tongue.position = new Vector3(-half - 0.18, 0.01, 0);
    tongue.material = tongueMat;
    const tongueFork1 = MeshBuilder.CreateBox(`${name}-tongue-f1`, { width: 0.05, height: 0.01, depth: 0.01 }, this.scene);
    tongueFork1.parent = root;
    tongueFork1.position = new Vector3(-half - 0.27, 0.01, -0.018);
    tongueFork1.rotation.y = -0.4;
    tongueFork1.material = tongueMat;
    const tongueFork2 = tongueFork1.clone(`${name}-tongue-f2`)!;
    tongueFork2.parent = root;
    tongueFork2.position.z = 0.018;
    tongueFork2.rotation.y = 0.4;
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
