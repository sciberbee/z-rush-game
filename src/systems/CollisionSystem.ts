import type { System } from '../types';
import { Player } from '../entities/Player';
import { SpawnSystem } from './SpawnSystem';
import { EventBus } from '../core/EventBus';
import { GameConfig } from '../config/GameConfig';

export class CollisionSystem implements System {
  private player: Player;
  private spawnSystem: SpawnSystem;
  private passedGates: Set<number> = new Set(); // Track passed gates by their z position

  constructor(player: Player, spawnSystem: SpawnSystem) {
    this.player = player;
    this.spawnSystem = spawnSystem;
  }

  public update(_deltaTime: number): void {
    this.checkGateCollisions();
    this.checkEnemyCollisions();
  }

  private checkGateCollisions(): void {
    const playerZ = this.player.position.z;
    const playerX = this.player.position.x;

    for (const gate of this.spawnSystem.activeGates) {
      if (!gate.active) continue;

      // Check if player has passed through the gate
      const gateZ = gate.position.z;
      const gateKey = Math.round(gateZ * 100); // Use z position as unique key

      // Check if we've already passed this gate
      if (this.passedGates.has(gateKey)) continue;

      // Check if player is at gate z position
      if (Math.abs(playerZ - gateZ) < 1) {
        // Check if player is within gate bounds
        const gateX = gate.position.x;
        const halfWidth = GameConfig.GATE_WIDTH / 2;

        if (playerX >= gateX - halfWidth && playerX <= gateX + halfWidth) {
          // Player passed through this gate
          this.passedGates.add(gateKey);

          const currentCount = this.player.getSoldierCount();
          const newCount = gate.applyEffect(currentCount);
          const diff = newCount - currentCount;

          if (diff > 0) {
            this.player.addSoldiers(diff);
          } else if (diff < 0) {
            this.player.removeSoldiers(-diff);
          }

          EventBus.emit('GATE_PASSED', {
            operation: gate.operation,
            value: gate.value,
            newCount: this.player.getSoldierCount(),
          });

          // Deactivate the gate
          gate.die();
        }
      }
    }

    // Clean up old gate keys
    if (this.passedGates.size > 100) {
      const oldKeys = Array.from(this.passedGates).filter(
        key => key / 100 < playerZ - 50
      );
      oldKeys.forEach(key => this.passedGates.delete(key));
    }
  }

  private checkEnemyCollisions(): void {
    const soldiers = this.player.soldiers;
    const enemies = this.spawnSystem.getActiveEnemies();

    for (const enemy of enemies) {
      if (!enemy.active) continue;

      for (const soldier of soldiers) {
        if (!soldier.active) continue;

        // Simple distance-based collision
        const dx = soldier.position.x - enemy.position.x;
        const dz = soldier.position.z - enemy.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < 1) {
          // Collision! Enemy damages soldier
          const killed = soldier.takeDamage(enemy.damage);
          if (killed) {
            this.player.removeSoldiers(1);
          }
          // Enemy also takes damage
          enemy.takeDamage(10);
        }
      }
    }

    // Check boss collision
    const boss = this.spawnSystem.boss;
    if (boss && boss.active) {
      for (const soldier of soldiers) {
        if (!soldier.active) continue;

        const dx = soldier.position.x - boss.position.x;
        const dz = soldier.position.z - boss.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < 2) {
          soldier.takeDamage(boss.damage);
          if (!soldier.active) {
            this.player.removeSoldiers(1);
          }
        }
      }
    }
  }

  public dispose(): void {
    this.passedGates.clear();
  }
}
