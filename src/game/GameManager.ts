import type { Scene } from '@babylonjs/core';
import { Dice } from './Dice';
import { Player } from './Player';
import { TurnManager } from './TurnManager';
import type { TileEvent } from './TileEvent';
import { BoardScene } from '../scene/BoardScene';
import { QuestionEngine } from '../questions/QuestionEngine';

interface UIRefs {
  rollButton: HTMLButtonElement;
  cameraButton: HTMLButtonElement;
  diceValue: HTMLElement;
  turnName: HTMLElement;
  zonePill: HTMLElement;
  questionCount: HTMLElement;
  logList: HTMLElement;
  playerNames: [HTMLElement, HTMLElement];
  playerPositions: [HTMLElement, HTMLElement];
  playerScores: [HTMLElement, HTMLElement];
  playerAccuracy: [HTMLElement, HTMLElement];
  playerCards: [HTMLElement, HTMLElement];
  winOverlay: HTMLElement;
  winCard: HTMLElement;
}

export class GameManager {
  readonly players = [new Player('Player A', 0), new Player('Player B', 1)] as const;
  private readonly turns = new TurnManager();
  private readonly dice: Dice;
  private started = false;
  private busy = false;
  private logs: string[] = [];

  constructor(
    private readonly scene: Scene,
    private readonly boardScene: BoardScene,
    private readonly questionEngine: QuestionEngine,
    private readonly ui: UIRefs,
    private readonly toggleCamera: () => void
  ) {
    this.players[0].attach(boardScene.playerRoots[0]);
    this.players[1].attach(boardScene.playerRoots[1]);
    this.dice = new Dice(scene, boardScene.diceRoot);
    ui.rollButton.addEventListener('click', () => void this.roll());
    ui.cameraButton.addEventListener('click', toggleCamera);
  }

  start(nameA: string, nameB: string) {
    this.players[0].name = nameA || 'Player A';
    this.players[1].name = nameB || 'Player B';
    this.turns.reset();
    this.questionEngine.reset();
    this.players.forEach((p) => p.reset(this.boardScene.board));
    this.started = true;
    this.busy = false;
    this.logs = [];
    this.addLog(`Pertandingan dimulai. ${this.players[0].name} mendapat giliran pertama.`);
    this.renderHUD();
  }

  private async roll() {
    if (!this.started || this.busy) return;
    this.busy = true;
    this.renderHUD();
    this.playSound('/sounds/roll.wav');
    const player = this.players[this.turns.current];
    const value = await this.dice.roll();
    this.ui.diceValue.textContent = String(value);

    if (player.position + value > 50) {
      this.addLog(`${player.name} mendapat ${value}; dibutuhkan angka tepat untuk mencapai 50.`);
      this.finishTurn();
      return;
    }

    const target = player.position + value;
    this.addLog(`${player.name}: ${player.position} → ${target} (dadu ${value}).`);
    for (let tile = player.position + 1; tile <= target; tile++) {
      await player.moveTo(tile, this.boardScene.board, this.scene, 210);
      this.playSound('/sounds/move.wav', 0.18);
      this.renderHUD();
    }

    const competency = this.boardScene.board.competencyFor(target);
    const event = this.boardScene.board.eventFor(target);
    const question = this.questionEngine.draw(competency);
    this.renderHUD();
    const outcome = await this.questionEngine.ask(question, this.eventLabel(event));

    player.answered += 1;
    if (outcome.fullCorrect) player.correct += 1;
    let points = outcome.points;
    if (event.kind === 'bonus' && outcome.fullCorrect) points += 50;
    player.score += points;
    this.playSound(outcome.fullCorrect ? '/sounds/correct.wav' : '/sounds/wrong.wav', 0.45);

    await this.resolveEvent(event, outcome.fullCorrect);
    this.renderHUD();
  }

  private async resolveEvent(event: TileEvent, fullCorrect: boolean) {
    const player = this.players[this.turns.current];
    if (event.kind === 'ladder') {
      if (fullCorrect && event.to) {
        this.addLog(`${player.name} menjawab benar dan naik tangga ke ${event.to}.`);
        await player.moveTo(event.to, this.boardScene.board, this.scene, 560);
      } else this.addLog(`${player.name} belum berhasil naik tangga.`);
    } else if (event.kind === 'snake') {
      if (fullCorrect) this.addLog(`${player.name} menjawab benar dan selamat dari ular.`);
      else if (event.to) {
        this.addLog(`${player.name} turun karena ular ke petak ${event.to}.`);
        await player.moveTo(event.to, this.boardScene.board, this.scene, 620);
      }
    } else if (event.kind === 'bonus') {
      this.addLog(fullCorrect ? `${player.name} mendapat bonus +50 poin.` : `${player.name} belum memperoleh bonus.`);
    } else if (event.kind === 'final') {
      if (fullCorrect) {
        this.showWinner(this.turns.current);
        return;
      }
      this.addLog(`${player.name} belum lolos Final Challenge dan kembali ke petak 49.`);
      await player.moveTo(49, this.boardScene.board, this.scene, 520);
    } else {
      this.addLog(`${player.name} menyelesaikan tantangan zona ${this.boardScene.board.competencyFor(player.position)}.`);
    }
    this.finishTurn();
  }

  private finishTurn() {
    if (!this.started) return;
    this.turns.next();
    this.busy = false;
    this.renderHUD();
  }

  private showWinner(index: number) {
    const winner = this.players[index];
    const other = this.players[index === 0 ? 1 : 0];
    this.started = false;
    this.busy = true;
    this.ui.winCard.innerHTML = `<div class="trophy">🏆</div><span class="eyebrow">Pertandingan selesai</span><h2>${winner.name} Menang!</h2><p>${winner.name} mencapai petak 50 dan menuntaskan Final Challenge.</p><div class="win-stats"><div><b>${winner.name}</b><br>Skor ${winner.score}<br>Akurasi ${winner.accuracy}</div><div><b>${other.name}</b><br>Skor ${other.score}<br>Akurasi ${other.accuracy}</div></div><button id="reload-game" class="primary">Main Lagi</button>`;
    this.ui.winOverlay.classList.remove('hidden');
    this.ui.winCard.querySelector<HTMLButtonElement>('#reload-game')?.addEventListener('click', () => location.reload());
  }

  private renderHUD() {
    this.players.forEach((player, index) => {
      this.ui.playerNames[index].textContent = player.name;
      this.ui.playerPositions[index].textContent = String(player.position);
      this.ui.playerScores[index].textContent = String(player.score);
      this.ui.playerAccuracy[index].textContent = player.accuracy;
      this.ui.playerCards[index].classList.toggle('active', this.started && !this.busy && this.turns.current === index);
    });
    const current = this.players[this.turns.current];
    this.ui.turnName.textContent = current.name.toUpperCase();
    this.ui.zonePill.textContent = current.position ? `Zona: ${this.boardScene.board.competencyFor(current.position)}` : 'Mulai dari petak awal';
    this.ui.questionCount.textContent = `Soal unik terpakai: ${this.questionEngine.usedCount} / 50`;
    this.ui.rollButton.disabled = !this.started || this.busy;
  }

  private eventLabel(event: TileEvent) {
    return ({ normal: 'Tantangan Kompetensi', ladder: 'Ladder Challenge', snake: 'Snake Escape', bonus: 'Bonus Tile', final: 'Final Challenge' })[event.kind];
  }

  private addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString('id-ID', { hour12: false });
    this.logs.unshift(`[${timestamp}] ${message}`);
    this.logs = this.logs.slice(0, 6);
    this.ui.logList.innerHTML = this.logs.map((line) => `<div>${line}</div>`).join('');
  }

  private playSound(url: string, volume = 0.32) {
    try {
      const audio = new Audio(url);
      audio.volume = volume;
      void audio.play();
    } catch { /* audio is enhancement only */ }
  }
}
