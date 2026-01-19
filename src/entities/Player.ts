import * as THREE from 'three';
import { Soldier } from './Soldier';
import { GameConfig } from '../config/GameConfig';
import { EventBus } from '../core/EventBus';
import { getFormationPositions, clamp } from '../utils/MathUtils';
import { ObjectPool } from '../utils/ObjectPool';

export class Player {
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public soldiers: Soldier[] = [];
  private soldierPool: ObjectPool<Soldier>;
  private scene: THREE.Scene;
  private horizontalInput: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Create soldier pool
    this.soldierPool = new ObjectPool<Soldier>(
      () => new Soldier(),
      GameConfig.POOL_SOLDIERS,
      GameConfig.MAX_SOLDIER_COUNT
    );

    // Add initial soldiers
    this.addSoldiers(GameConfig.INITIAL_SOLDIER_COUNT);
  }

  public addSoldiers(count: number): void {
    for (let i = 0; i < count; i++) {
      if (this.soldiers.length >= GameConfig.MAX_SOLDIER_COUNT) break;

      const soldier = this.soldierPool.acquire();
      if (soldier) {
        soldier.mesh.position.copy(this.position);
        this.scene.add(soldier.mesh);
        this.soldiers.push(soldier);
      }
    }

    this.updateFormation();
    EventBus.emit('SOLDIER_COUNT_CHANGED', { count: this.soldiers.length });
  }

  public removeSoldiers(count: number): void {
    const toRemove = Math.min(count, this.soldiers.length);

    for (let i = 0; i < toRemove; i++) {
      const soldier = this.soldiers.pop();
      if (soldier) {
        this.scene.remove(soldier.mesh);
        this.soldierPool.release(soldier);
      }
    }

    this.updateFormation();
    EventBus.emit('SOLDIER_COUNT_CHANGED', { count: this.soldiers.length });

    if (this.soldiers.length === 0) {
      EventBus.emit('PLAYER_DIED');
    }
  }

  public multiplySoldiers(multiplier: number): void {
    const newCount = Math.floor(this.soldiers.length * multiplier);
    const diff = newCount - this.soldiers.length;

    if (diff > 0) {
      this.addSoldiers(diff);
    } else if (diff < 0) {
      this.removeSoldiers(-diff);
    }
  }

  public getSoldierCount(): number {
    return this.soldiers.length;
  }

  public setHorizontalInput(value: number): void {
    this.horizontalInput = clamp(value, -1, 1);
  }

  private updateFormation(): void {
    const positions = getFormationPositions(
      this.soldiers.length,
      GameConfig.SOLDIER_SPACING
    );

    for (let i = 0; i < this.soldiers.length; i++) {
      const soldier = this.soldiers[i];
      const formationPos = positions[i];

      soldier.targetPosition.set(
        this.position.x + formationPos.x,
        GameConfig.SOLDIER_HEIGHT / 2,
        this.position.z + formationPos.z
      );
    }
  }

  public update(deltaTime: number): void {
    if (this.soldiers.length === 0) return;

    // Move forward
    this.position.z += GameConfig.FORWARD_SPEED * deltaTime;

    // Move horizontally based on input
    const horizontalMovement = this.horizontalInput * GameConfig.HORIZONTAL_SPEED * deltaTime;
    this.position.x += horizontalMovement;
    this.position.x = clamp(
      this.position.x,
      -GameConfig.HORIZONTAL_LIMIT,
      GameConfig.HORIZONTAL_LIMIT
    );

    // Update formation positions
    this.updateFormation();

    // Update all soldiers
    for (const soldier of this.soldiers) {
      soldier.update(deltaTime);
    }
  }

  public getSoldiersReadyToFire(): Soldier[] {
    return this.soldiers.filter(s => s.active && s.canFire());
  }

  public getAveragePosition(): THREE.Vector3 {
    if (this.soldiers.length === 0) {
      return this.position.clone();
    }

    const avg = new THREE.Vector3();
    for (const soldier of this.soldiers) {
      avg.add(soldier.position);
    }
    avg.divideScalar(this.soldiers.length);
    return avg;
  }

  public dispose(): void {
    for (const soldier of this.soldiers) {
      this.scene.remove(soldier.mesh);
    }
    this.soldiers = [];
    this.soldierPool.dispose();
    Soldier.disposeSharedResources();
  }
}
