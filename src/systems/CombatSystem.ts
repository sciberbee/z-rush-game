import * as THREE from 'three';
import type { System } from '../types';
import { Player } from '../entities/Player';
import { SpawnSystem } from './SpawnSystem';
import { Bullet } from '../entities/Bullet';
import { ObjectPool } from '../utils/ObjectPool';
import { GameConfig } from '../config/GameConfig';
import { distance2D } from '../utils/MathUtils';
import { EventBus } from '../core/EventBus';

export class CombatSystem implements System {
  private scene: THREE.Scene;
  private player: Player;
  private spawnSystem: SpawnSystem;
  private bulletPool: ObjectPool<Bullet>;
  private activeBullets: Bullet[] = [];

  constructor(scene: THREE.Scene, player: Player, spawnSystem: SpawnSystem) {
    this.scene = scene;
    this.player = player;
    this.spawnSystem = spawnSystem;

    // Create bullet pool
    this.bulletPool = new ObjectPool<Bullet>(
      () => new Bullet(),
      GameConfig.POOL_BULLETS,
      GameConfig.POOL_BULLETS * 2
    );
  }

  public update(deltaTime: number): void {
    this.handleAutoFire();
    this.updateBullets(deltaTime);
    this.updateEnemyAI(deltaTime);
    this.checkBulletCollisions();
  }

  private handleAutoFire(): void {
    const enemies = this.spawnSystem.getActiveEnemies();
    const boss = this.spawnSystem.boss;

    // Combine enemies and boss
    const allTargets = [...enemies];
    if (boss && boss.active) {
      allTargets.push(boss);
    }

    if (allTargets.length === 0) return;

    // Get soldiers ready to fire
    const readySoldiers = this.player.getSoldiersReadyToFire();

    for (const soldier of readySoldiers) {
      // Find nearest enemy within range
      let nearestEnemy = null;
      let nearestDistance: number = GameConfig.AUTO_AIM_RANGE;

      for (const enemy of allTargets) {
        const dist = distance2D(
          soldier.position.x,
          soldier.position.z,
          enemy.position.x,
          enemy.position.z
        );

        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearestEnemy = enemy;
        }
      }

      if (nearestEnemy) {
        this.fireBullet(soldier.position, nearestEnemy.position);
        soldier.fire();
      }
    }
  }

  private fireBullet(from: THREE.Vector3, to: THREE.Vector3): void {
    const bullet = this.bulletPool.acquire();
    if (bullet) {
      bullet.fire(from, to);
      this.scene.add(bullet.mesh);
      this.activeBullets.push(bullet);
      EventBus.emit('PLAY_SFX', { name: 'shoot', volume: 0.3 });
    }
  }

  private updateBullets(deltaTime: number): void {
    const playerZ = this.player.position.z;

    for (let i = this.activeBullets.length - 1; i >= 0; i--) {
      const bullet = this.activeBullets[i];

      if (!bullet.active) {
        this.removeBullet(i);
        continue;
      }

      bullet.update(deltaTime);

      // Remove bullets that are too far
      if (
        bullet.position.z > playerZ + GameConfig.AUTO_AIM_RANGE + 10 ||
        bullet.position.z < playerZ - 10 ||
        Math.abs(bullet.position.x) > GameConfig.HORIZONTAL_LIMIT + 10
      ) {
        bullet.die();
        this.removeBullet(i);
      }
    }
  }

  private removeBullet(index: number): void {
    const bullet = this.activeBullets[index];
    this.scene.remove(bullet.mesh);
    this.bulletPool.release(bullet);
    this.activeBullets.splice(index, 1);
  }

  private updateEnemyAI(deltaTime: number): void {
    const playerPos = this.player.getAveragePosition();

    // Update regular enemies
    for (const enemy of this.spawnSystem.activeEnemies) {
      if (enemy.active) {
        enemy.setTarget(playerPos);
        enemy.update(deltaTime);
      }
    }

    // Update boss
    const boss = this.spawnSystem.boss;
    if (boss && boss.active) {
      boss.setTarget(playerPos);
      boss.update(deltaTime);
    }
  }

  private checkBulletCollisions(): void {
    const enemies = this.spawnSystem.getActiveEnemies();
    const boss = this.spawnSystem.boss;

    for (let i = this.activeBullets.length - 1; i >= 0; i--) {
      const bullet = this.activeBullets[i];
      if (!bullet.active) continue;

      // Check against regular enemies
      for (const enemy of enemies) {
        if (!enemy.active) continue;

        const dist = distance2D(
          bullet.position.x,
          bullet.position.z,
          enemy.position.x,
          enemy.position.z
        );

        if (dist < 0.5) {
          enemy.takeDamage(bullet.damage);
          bullet.die();
          EventBus.emit('PLAY_SFX', { name: 'hit', volume: 0.2 });

          if (!enemy.active) {
            EventBus.emit('PLAY_SFX', { name: 'explosion', volume: 0.4 });
            this.spawnSystem.removeEnemy(enemy);
          }
          break;
        }
      }

      // Check against boss
      if (boss && boss.active && bullet.active) {
        const dist = distance2D(
          bullet.position.x,
          bullet.position.z,
          boss.position.x,
          boss.position.z
        );

        if (dist < 1.5) {
          boss.takeDamage(bullet.damage);
          bullet.die();
        }
      }
    }
  }

  public dispose(): void {
    for (const bullet of this.activeBullets) {
      this.scene.remove(bullet.mesh);
    }
    this.activeBullets = [];
    this.bulletPool.dispose();
    Bullet.disposeSharedResources();
  }
}
