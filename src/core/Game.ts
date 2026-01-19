import { SceneManager } from './SceneManager';
import { EventBus } from './EventBus';
import { Input } from './Input';
import type { GameState, System } from '../types';
import { Player } from '../entities/Player';
import { MovementSystem } from '../systems/MovementSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { WaveSystem } from '../systems/WaveSystem';

export class Game {
  private sceneManager: SceneManager;
  private systems: System[] = [];
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
    const scene = this.sceneManager.scene;

    // Initialize input
    this.input = new Input();

    // Initialize player
    this.player = new Player(scene);

    // Initialize systems
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

    // Listen for game events
    EventBus.on('PLAYER_DIED', () => this.gameOver());

    this.setState('MENU');
    console.log('Game initialized');
  }

  public addSystem(system: System): void {
    this.systems.push(system);
  }

  public start(): void {
    if (this.state === 'PLAYING') return;

    this.setState('PLAYING');
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
    this.sceneManager.dispose();
    EventBus.clear();
  }
}
