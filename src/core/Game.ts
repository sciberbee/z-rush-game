import { SceneManager } from './SceneManager';
import { Resources } from './Resources';
import { EventBus } from './EventBus';
import { Input } from './Input';
import { SoundManager } from './SoundManager';
import type { GameState, System } from '../types';
import { Player } from '../entities/Player';
import { MovementSystem } from '../systems/MovementSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { WaveSystem } from '../systems/WaveSystem';
import { syncService } from '../services/SyncService';
import { authService } from '../services/AuthService';

export class Game {
  private sceneManager: SceneManager;
  private systems: System[] = [];
  private soundManager: SoundManager | null = null;
  private state: GameState = 'LOADING';
  private lastTime: number = 0;
  private animationFrameId: number = 0;
  private isPaused: boolean = false;

  private player: Player | null = null;
  private input: Input | null = null;

  constructor(container: HTMLElement) {
    this.sceneManager = new SceneManager(container);
  }

  public async init(): Promise<void> {
    // Load resources
    await Resources.getInstance().load((progress: number) => {
      console.log(`Loading resources: ${(progress * 100).toFixed(0)}%`);
    });

    const scene = this.sceneManager.scene;

    // Initialize input
    this.input = new Input();

    // Initialize player
    this.player = new Player(scene);

    // Initialize systems
    // Initialize systems
    this.soundManager = new SoundManager(this.sceneManager.camera); // Add SoundManager
    
    const movementSystem = new MovementSystem(this.player, this.input);
    const spawnSystem = new SpawnSystem(scene, this.player);
    const collisionSystem = new CollisionSystem(this.player, spawnSystem);
    const combatSystem = new CombatSystem(scene, this.player, spawnSystem);
    const waveSystem = new WaveSystem(spawnSystem, this.player, this);

    this.addSystem(movementSystem);
    this.addSystem(spawnSystem);
    this.addSystem(collisionSystem);
    this.addSystem(combatSystem);
    this.addSystem(waveSystem);
    // SoundManager doesn't need to be in the update loop unless we want to do something per-frame
    // But we need to keep a reference to dispose it.
    
    // Listen for events to trigger global sounds (Victory/GameOver)
    EventBus.on('PLAYER_DIED', () => {
        EventBus.emit('PLAY_SFX', { name: 'gameover' });
        EventBus.emit('STOP_BGM');
        this.gameOver();
    });
    
    EventBus.on('WAVE_COMPLETED', (data: any) => {
        if (data.bossDefeated) {
            EventBus.emit('PLAY_SFX', { name: 'victory' });
            EventBus.emit('STOP_BGM');
            // Save score on victory if authenticated
            this.saveGameResult(true);
        }
    });

    this.setState('MENU');
    console.log('Game initialized');
  }

  public addSystem(system: System): void {
    this.systems.push(system);
  }

  public start(): void {
    if (this.state === 'PLAYING') return;

    this.setState('PLAYING');
    EventBus.emit('PLAY_BGM', { name: 'bgm', volume: 0.3 });
    
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public pause(): void {
    if (this.state !== 'PLAYING') return;

    this.isPaused = true;
    this.setState('PAUSED');
    cancelAnimationFrame(this.animationFrameId);
  }

  public resume(): void {
    if (this.state !== 'PAUSED') return;

    this.isPaused = false;
    this.setState('PLAYING');
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public gameOver(): void {
    this.setState('GAME_OVER');
    cancelAnimationFrame(this.animationFrameId);
  }

  public victory(): void {
    this.setState('VICTORY');
    cancelAnimationFrame(this.animationFrameId);
  }

  private async saveGameResult(completed: boolean): Promise<void> {
    if (!this.player) return;

    const soldierCount = this.player.getSoldierCount();
    const score = soldierCount * 100; // Simple score calculation
    const levelIndex = 0; // Currently single level

    // Emit score for UI display
    EventBus.emit('GAME_SCORE', { score, soldierCount, completed });

    if (!authService.isAuthenticated()) {
      console.log('Not authenticated - score not saved to server');
      return;
    }

    try {
      // Submit score to leaderboard
      const result = await syncService.submitScore(levelIndex, score, soldierCount);
      if (result) {
        EventBus.emit('SCORE_SUBMITTED', { rank: result.rank, score });
      }

      // Save progress
      await syncService.saveProgress(levelIndex, {
        completed,
        stars: completed ? Math.min(3, Math.floor(soldierCount / 10)) : 0,
      });
    } catch (error) {
      console.error('Failed to save game result:', error);
    }
  }

  public restart(): void {
    // Reset all systems
    this.systems.forEach(system => system.dispose());
    this.systems = [];

    // Re-initialize (will be expanded in later phases)
    this.init().then(() => this.start());
  }

  private setState(newState: GameState): void {
    this.state = newState;
    EventBus.emit('GAME_STATE_CHANGED', { state: newState });
  }

  public getState(): GameState {
    return this.state;
  }

  public getSceneManager(): SceneManager {
    return this.sceneManager;
  }

  private loop(currentTime: number): void {
    if (this.isPaused) return;

    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));

    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();
  }

  private update(deltaTime: number): void {
    // Update all systems
    for (const system of this.systems) {
      system.update(deltaTime);
    }

    // Update camera to follow player
    if (this.player) {
      this.sceneManager.updateCamera(this.player.position.z);
    }
  }

  private render(): void {
    this.sceneManager.render();
  }

  public dispose(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.systems.forEach(system => system.dispose());
    this.soundManager?.dispose();
    this.sceneManager.dispose();
    EventBus.clear();
  }
}
