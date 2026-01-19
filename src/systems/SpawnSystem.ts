import * as THREE from 'three';
import type { System, GateSpawnData, EnemyConfig } from '../types';
import { Gate } from '../entities/Gate';
import { Enemy } from '../entities/Enemy';
import { Zombie } from '../entities/Zombie';
import { Boss } from '../entities/Boss';
import { Player } from '../entities/Player';
import { ObjectPool } from '../utils/ObjectPool';
import { GameConfig } from '../config/GameConfig';

export class SpawnSystem implements System {
  private scene: THREE.Scene;
  private player: Player;
  private gatePool: ObjectPool<Gate>;
  private enemyPool: ObjectPool<Enemy>;
  public activeGates: Gate[] = [];
  public activeEnemies: Enemy[] = [];
  public boss: Boss | null = null;

  constructor(scene: THREE.Scene, player: Player) {
    this.scene = scene;
    this.player = player;

    // Create pools
    this.gatePool = new ObjectPool<Gate>(
      () => new Gate(),
      20,
      50
    );

    this.enemyPool = new ObjectPool<Enemy>(
      () => new Zombie(),
      GameConfig.POOL_ENEMIES,
      GameConfig.POOL_ENEMIES * 2
    );
  }

  public spawnGatePair(zPosition: number, gateData: GateSpawnData): void {
    const leftGate = this.gatePool.acquire();
    const rightGate = this.gatePool.acquire();

    if (leftGate) {
      leftGate.setup(
        gateData.left.operation,
        gateData.left.value,
        -GameConfig.GATE_SPACING / 2 - GameConfig.GATE_WIDTH / 2,
        zPosition
      );
      this.scene.add(leftGate.mesh);
      this.activeGates.push(leftGate);
    }

    if (rightGate) {
      rightGate.setup(
        gateData.right.operation,
        gateData.right.value,
        GameConfig.GATE_SPACING / 2 + GameConfig.GATE_WIDTH / 2,
        zPosition
      );
      this.scene.add(rightGate.mesh);
      this.activeGates.push(rightGate);
    }
  }

  public spawnEnemy(config: EnemyConfig): Enemy | null {
    let enemy: Enemy | null = null;

    if (config.type === 'boss') {
      this.boss = new Boss(config);
      this.scene.add(this.boss.mesh);
      return this.boss;
    }

    enemy = this.enemyPool.acquire();
    if (enemy) {
      enemy.health = config.health;
      enemy.maxHealth = config.health;
      enemy.damage = config.damage;
      enemy.speed = config.speed;
      enemy.setPosition(config.position.x, 0.4, config.position.z);
      enemy.mesh.visible = true;
      this.scene.add(enemy.mesh);
      this.activeEnemies.push(enemy);
    }

    return enemy;
  }

  public spawnEnemyWave(
    type: EnemyConfig['type'],
    count: number,
    zPosition: number,
    formation: 'line' | 'v-shape' | 'scattered'
  ): void {
    const positions = this.getFormationPositions(count, zPosition, formation);

    for (const pos of positions) {
      this.spawnEnemy({
        type,
        position: pos,
        health: GameConfig.ZOMBIE_HEALTH,
        damage: GameConfig.ZOMBIE_DAMAGE,
        speed: GameConfig.ZOMBIE_SPEED,
      });
    }
  }

  private getFormationPositions(
    count: number,
    zPosition: number,
    formation: 'line' | 'v-shape' | 'scattered'
  ): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    const spacing = 1.5;

    switch (formation) {
      case 'line':
        const startX = -((count - 1) * spacing) / 2;
        for (let i = 0; i < count; i++) {
          positions.push(new THREE.Vector3(startX + i * spacing, 0, zPosition));
        }
        break;

      case 'v-shape':
        const mid = Math.floor(count / 2);
        for (let i = 0; i < count; i++) {
          const x = (i - mid) * spacing;
          const z = zPosition + Math.abs(i - mid) * spacing;
          positions.push(new THREE.Vector3(x, 0, z));
        }
        break;

      case 'scattered':
        for (let i = 0; i < count; i++) {
          const x = (Math.random() - 0.5) * GameConfig.HORIZONTAL_LIMIT * 1.5;
          const z = zPosition + Math.random() * 5;
          positions.push(new THREE.Vector3(x, 0, z));
        }
        break;
    }

    return positions;
  }

  public removeGate(gate: Gate): void {
    const index = this.activeGates.indexOf(gate);
    if (index !== -1) {
      this.activeGates.splice(index, 1);
      this.scene.remove(gate.mesh);
      this.gatePool.release(gate);
    }
  }

  public removeEnemy(enemy: Enemy): void {
    const index = this.activeEnemies.indexOf(enemy);
    if (index !== -1) {
      this.activeEnemies.splice(index, 1);
      this.scene.remove(enemy.mesh);
      this.enemyPool.release(enemy);
    }
  }

  public update(_deltaTime: number): void {
    // Clean up gates that are too far behind the player
    const playerZ = this.player.position.z;

    for (let i = this.activeGates.length - 1; i >= 0; i--) {
      const gate = this.activeGates[i];
      if (gate.position.z < playerZ - 20) {
        this.removeGate(gate);
      }
    }

    // Clean up enemies that are too far behind
    for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
      const enemy = this.activeEnemies[i];
      if (!enemy.active || enemy.position.z < playerZ - 20) {
        this.removeEnemy(enemy);
      }
    }
  }

  public getActiveEnemies(): Enemy[] {
    return this.activeEnemies.filter(e => e.active);
  }

  public dispose(): void {
    for (const gate of this.activeGates) {
      this.scene.remove(gate.mesh);
    }
    for (const enemy of this.activeEnemies) {
      this.scene.remove(enemy.mesh);
    }
    if (this.boss) {
      this.scene.remove(this.boss.mesh);
    }
    this.activeGates = [];
    this.activeEnemies = [];
    this.boss = null;
    this.gatePool.dispose();
    this.enemyPool.dispose();
  }
}
