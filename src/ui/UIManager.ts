import type { GameState } from '../types';
import { EventBus } from '../core/EventBus';
import { HUD } from './HUD';
import { MainMenu } from './MainMenu';
import { GameOver } from './GameOver';
import { Game } from '../core/Game';

export class UIManager {
  private container: HTMLElement;
  private hud: HUD;
  private mainMenu: MainMenu;
  private gameOver: GameOver;
  private game: Game;

  constructor(game: Game) {
    this.game = game;
    this.container = document.getElementById('ui-container')!;

    this.hud = new HUD(this.container);
    this.mainMenu = new MainMenu(this.container, () => this.onStartGame());
    this.gameOver = new GameOver(this.container, () => this.onRestart());

    this.setupEventListeners();
    this.updateUIState(game.getState());
  }

  private setupEventListeners(): void {
    EventBus.on('GAME_STATE_CHANGED', (event) => {
      const { state } = event.data as { state: GameState };
      this.updateUIState(state);
    });

    EventBus.on('SOLDIER_COUNT_CHANGED', (event) => {
      const { count } = event.data as { count: number };
      this.hud.updateSoldierCount(count);
    });

    EventBus.on('BOSS_SPAWNED', () => {
      this.hud.showBossHP(true);
    });
  }

  private updateUIState(state: GameState): void {
    this.mainMenu.hide();
    this.gameOver.hide();
    this.hud.hide();

    switch (state) {
      case 'MENU':
        this.mainMenu.show();
        break;
      case 'PLAYING':
        this.hud.show();
        break;
      case 'PAUSED':
        this.hud.show();
        this.hud.showPauseMenu(true);
        break;
      case 'GAME_OVER':
        this.gameOver.show(false);
        break;
      case 'VICTORY':
        this.gameOver.show(true);
        break;
    }
  }

  private onStartGame(): void {
    this.game.start();
  }

  private onRestart(): void {
    this.game.restart();
  }

  public updateProgress(progress: number): void {
    this.hud.updateProgress(progress);
  }

  public updateBossHP(current: number, max: number): void {
    this.hud.updateBossHP(current, max);
  }

  public dispose(): void {
    this.hud.dispose();
    this.mainMenu.dispose();
    this.gameOver.dispose();
  }
}
