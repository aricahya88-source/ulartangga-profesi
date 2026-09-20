import './styles.css';
import { Engine, Scene } from '@babylonjs/core';
import { GameManager } from './game/GameManager';
import { QuestionEngine } from './questions/QuestionEngine';
import { BoardScene } from './scene/BoardScene';
import { GameCamera } from './scene/Camera';
import { createLighting } from './scene/Lighting';

function must<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Elemen tidak ditemukan: ${selector}`);
  return element;
}

async function bootstrap() {
  const canvas = must<HTMLCanvasElement>('#renderCanvas');
  const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
  const scene = new Scene(engine);
  const camera = new GameCamera(scene, canvas);
  const shadows = createLighting(scene);

  const startButton = must<HTMLButtonElement>('#start-btn');
  startButton.disabled = true;
  startButton.textContent = 'Memuat papan 3D…';

  const boardScene = await BoardScene.create(scene, shadows);
  const questionEngine = new QuestionEngine(must('#question-overlay'), must('#question-card'));

  const game = new GameManager(scene, boardScene, questionEngine, {
    rollButton: must<HTMLButtonElement>('#roll-btn'),
    cameraButton: must<HTMLButtonElement>('#camera-btn'),
    diceValue: must('#dice-value'),
    turnName: must('#turn-name'),
    zonePill: must('#zone-pill'),
    questionCount: must('#question-count'),
    logList: must('#log-list'),
    playerNames: [must('#player-name-0'), must('#player-name-1')],
    playerPositions: [must('#player-pos-0'), must('#player-pos-1')],
    playerScores: [must('#player-score-0'), must('#player-score-1')],
    playerAccuracy: [must('#player-acc-0'), must('#player-acc-1')],
    playerCards: [must('#player-card-0'), must('#player-card-1')],
    winOverlay: must('#win-overlay'),
    winCard: must('#win-card')
  }, () => camera.toggleAngle());

  startButton.disabled = false;
  startButton.textContent = 'Mulai Pertandingan';
  startButton.addEventListener('click', () => {
    const nameA = must<HTMLInputElement>('#name-a').value.trim();
    const nameB = must<HTMLInputElement>('#name-b').value.trim();
    must('#start-overlay').classList.add('hidden');
    game.start(nameA, nameB);
  });

  engine.runRenderLoop(() => scene.render());
  window.addEventListener('resize', () => engine.resize());
}

bootstrap().catch((error) => {
  console.error(error);
  const overlay = must('#start-overlay');
  overlay.innerHTML = `<div class="start-card"><span class="eyebrow">Gagal memuat</span><h2>Papan 3D belum dapat dijalankan</h2><p>${String(error instanceof Error ? error.message : error)}</p><p>Pastikan menjalankan proyek melalui <code>npm run dev</code>, bukan membuka file HTML secara langsung.</p></div>`;
});
