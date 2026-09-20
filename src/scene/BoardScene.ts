import '@babylonjs/loaders/glTF';
import {
  Color3,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  Scene,
  SceneLoader,
  ShadowGenerator,
  StandardMaterial,
  TransformNode,
  Texture,
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
    await helper.createConnections();
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
    this.scene.clearColor.set(0.025, 0.06, 0.095, 1);
    const base = MeshBuilder.CreateBox('boardBase', { width: 16.3, depth: 8.55, height: 0.42 }, this.scene);
    base.position.y = -0.08;
    const material = new StandardMaterial('baseMat', this.scene);
    material.diffuseColor = new Color3(0.07, 0.13, 0.17);
    material.specularColor = new Color3(0.25, 0.32, 0.35);
    base.material = material;
    base.receiveShadows = true;

    const floor = MeshBuilder.CreateGround('floor', { width: 26, height: 18 }, this.scene);
    floor.position.y = -0.31;
    const floorMat = new StandardMaterial('floorMat', this.scene);
    floorMat.diffuseColor = new Color3(0.025, 0.045, 0.06);
    floorMat.diffuseTexture = new Texture('/textures/board-felt.png', this.scene);
    floorMat.specularColor = Color3.Black();
    floor.material = floorMat;
    floor.receiveShadows = true;
  }

  private createTiles() {
    for (let tile = 1; tile <= 50; tile++) {
      const competency = this.board.competencyFor(tile);
      const position = this.board.tilePosition(tile);
      const box = MeshBuilder.CreateBox(`tile-${tile}`, { width: this.board.tileSize, depth: this.board.tileSize, height: 0.42 }, this.scene);
      box.position = new Vector3(position.x, 0.22, position.z);
      const material = new StandardMaterial(`tileMat-${tile}`, this.scene);
      material.diffuseColor = ZONE_COLORS[competency];
      material.specularColor = new Color3(0.35, 0.35, 0.38);
      if (BONUS_TILES.has(tile)) material.emissiveColor = new Color3(0.16, 0.12, 0.01);
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
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 150px Arial';
    const tileText = String(tile);
    const tileTextWidth = ctx.measureText(tileText).width;
    ctx.fillText(tileText, 256 - tileTextWidth / 2, 285);
    ctx.font = 'bold 48px Arial';
    const marker = tile === 50 ? 'FINAL' : BONUS_TILES.has(tile) ? 'BONUS' : (LADDERS.has(tile) ? 'TANGGA' : SNAKES.has(tile) ? 'ULAR' : competency.toUpperCase().slice(0, 3));
    const markerWidth = ctx.measureText(marker).width;
    ctx.fillText(marker, 256 - markerWidth / 2, 390);
    texture.update();

    const mat = new StandardMaterial(`labelMat-${tile}`, this.scene);
    mat.diffuseTexture = texture;
    mat.emissiveColor = new Color3(0.22, 0.22, 0.22);
    mat.useAlphaFromDiffuseTexture = true;
    mat.specularColor = Color3.Black();
    const plane = MeshBuilder.CreatePlane(`labelPlane-${tile}`, { size: this.board.tileSize * 0.88, sideOrientation: Mesh.DOUBLESIDE }, this.scene);
    plane.rotation.x = Math.PI / 2;
    plane.position = new Vector3(position.x, 0.445, position.z);
    plane.material = mat;
  }

  private async createConnections() {
    for (const [from, to] of LADDERS) await this.placeConnection('ladder.glb', `ladder-${from}-${to}`, from, to, 2.4, 0.92);
    for (const [from, to] of SNAKES) await this.placeConnection('snake.glb', `snake-${from}-${to}`, from, to, 3.43, 0.86);
  }

  private async placeConnection(file: string, name: string, from: number, to: number, modelLength: number, verticalScale: number) {
    const root = await this.importModel(file, name);
    const a = this.board.tilePosition(from);
    const b = this.board.tilePosition(to);
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const distance = Math.hypot(dx, dz);
    root.position = new Vector3((a.x + b.x) / 2, 0.67, (a.z + b.z) / 2);
    root.rotation.y = -Math.atan2(dz, dx);
    root.scaling = new Vector3(distance / modelLength, verticalScale, 0.92);
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
