import { GateOperation } from '../types';
import type { System, LevelConfig, WaveConfig } from '../types';
import { SpawnSystem } from './SpawnSystem';
import { Player } from '../entities/Player';
import { Game } from '../core/Game';
import { EventBus } from '../core/EventBus';
import { GameConfig } from '../config/GameConfig';

// Default level configuration
const defaultLevel: LevelConfig = {
  name: 'Level 1',
  length: 300,
  waves: [
    {
      triggerZ: 20,
      enemies: [{ type: 'zombie', count: 3, formation: 'line' }],
      gatesAfter: {
        left: { operation: GateOperation.ADD, value: 3 },
        right: { operation: GateOperation.MULTIPLY, value: 2 },
      },
    },
    {
      triggerZ: 50,
      enemies: [{ type: 'zombie', count: 5, formation: 'v-shape' }],
      gatesAfter: {
        left: { operation: GateOperation.ADD, value: 5 },
        right: { operation: GateOperation.SUBTRACT, value: 2 },
      },
    },
    {
      triggerZ: 80,
      enemies: [{ type: 'zombie', count: 7, formation: 'scattered' }],
      gatesAfter: {
        left: { operation: GateOperation.MULTIPLY, value: 2 },
        right: { operation: GateOperation.ADD, value: 10 },
      },
    },
    {
      triggerZ: 120,
      enemies: [{ type: 'zombie', count: 10, formation: 'line' }],
      gatesAfter: {
        left: { operation: GateOperation.ADD, value: 8 },
        right: { operation: GateOperation.DIVIDE, value: 2 },
      },
    },
    {
      triggerZ: 160,
      enemies: [{ type: 'zombie', count: 12, formation: 'v-shape' }],
      gatesAfter: {
        left: { operation: GateOperation.MULTIPLY, value: 3 },
        right: { operation: GateOperation.SUBTRACT, value: 5 },
      },
    },
    {
      triggerZ: 200,
      enemies: [{ type: 'zombie', count: 15, formation: 'scattered' }],
    },
  ],
  boss: {
    type: 'boss',
    triggerZ: 250,
    position: { x: 0, y: 1.5, z: 280 } as any,
    health: GameConfig.ZOMBIE_HEALTH * GameConfig.BOSS_HEALTH_MULTIPLIER,
    damage: GameConfig.ZOMBIE_DAMAGE * GameConfig.BOSS_DAMAGE_MULTIPLIER,
    speed: GameConfig.ZOMBIE_SPEED * 0.5,
  },
};

export class WaveSystem implements System {
  private spawnSystem: SpawnSystem;
  private player: Player;
  private game: Game;
  private currentLevel: LevelConfig;
  private triggeredWaves: Set<number> = new Set();
  private bossSpawned: boolean = false;

  constructor(spawnSystem: SpawnSystem, player: Player, game: Game) {
    this.spawnSystem = spawnSystem;
    this.player = player;
    this.game = game;
    this.currentLevel = defaultLevel;

    // Listen for boss death
    EventBus.on('WAVE_COMPLETED', (event) => {
      if ((event.data as { bossDefeated: boolean })?.bossDefeated) {
        this.game.victory();
      }
    });
  }

  public update(_deltaTime: number): void {
    const playerZ = this.player.position.z;

    // Check wave triggers
    for (let i = 0; i < this.currentLevel.waves.length; i++) {
      const wave = this.currentLevel.waves[i];

      if (!this.triggeredWaves.has(i) && playerZ >= wave.triggerZ - 30) {
        this.triggerWave(wave, i);
      }
    }

    // Check boss trigger
    if (
      this.currentLevel.boss &&
      !this.bossSpawned &&
      playerZ >= this.currentLevel.boss.triggerZ - 50
    ) {
      this.spawnBoss();
    }

    // Check if player reached end without boss
    if (!this.currentLevel.boss && playerZ >= this.currentLevel.length) {
      this.game.victory();
    }
  }

  private triggerWave(wave: WaveConfig, index: number): void {
    this.triggeredWaves.add(index);

    // Spawn enemies
    for (const enemyData of wave.enemies) {
      this.spawnSystem.spawnEnemyWave(
        enemyData.type,
        enemyData.count,
        wave.triggerZ + 20,
        enemyData.formation
      );
    }

    // Spawn gates after enemies
    if (wave.gatesAfter) {
      this.spawnSystem.spawnGatePair(wave.triggerZ + 40, wave.gatesAfter);
    }
  }

  private spawnBoss(): void {
    if (!this.currentLevel.boss) return;

    this.bossSpawned = true;

    this.spawnSystem.spawnEnemy({
      type: 'boss',
      position: this.currentLevel.boss.position,
      health: this.currentLevel.boss.health,
      damage: this.currentLevel.boss.damage,
      speed: this.currentLevel.boss.speed,
    });
    
    EventBus.emit('PLAY_SFX', { name: 'boss_spawn', volume: 1.0 });
  }

  public setLevel(level: LevelConfig): void {
    this.currentLevel = level;
    this.triggeredWaves.clear();
    this.bossSpawned = false;
  }

  public dispose(): void {
    this.triggeredWaves.clear();
    this.bossSpawned = false;
  }
}
