import * as THREE from 'three';
import { Entity } from './Entity';
import { GameConfig } from '../config/GameConfig';
import { EventBus } from '../core/EventBus';

export class Enemy extends Entity {
  public damage: number = GameConfig.ZOMBIE_DAMAGE;
  public speed: number = GameConfig.ZOMBIE_SPEED;
  public targetPosition: THREE.Vector3 | null = null;

  constructor(mesh?: THREE.Mesh) {
    if (!mesh) {
      const geometry = new THREE.BoxGeometry(0.5, 0.8, 0.5);
      const material = new THREE.MeshLambertMaterial({
        color: GameConfig.COLOR_ENEMY,
      });
      mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }

    super(mesh);
    this.maxHealth = GameConfig.ZOMBIE_HEALTH;
    this.health = this.maxHealth;
  }

  public reset(): void {
    super.reset();
    this.damage = GameConfig.ZOMBIE_DAMAGE;
    this.speed = GameConfig.ZOMBIE_SPEED;
    this.mesh.visible = true;
    this.targetPosition = null;
  }

  public setTarget(target: THREE.Vector3): void {
    this.targetPosition = target;
  }

  public update(deltaTime: number): void {
    if (!this.active || !this.targetPosition) return;

    // Move towards target
    const direction = new THREE.Vector3();
    direction.subVectors(this.targetPosition, this.position);
    direction.y = 0;

    const distance = direction.length();
    if (distance > 0.1) {
      direction.normalize();
      this.position.x += direction.x * this.speed * deltaTime;
      this.position.z += direction.z * this.speed * deltaTime;
    }
  }

  public die(): void {
    super.die();
    this.mesh.visible = false;
    EventBus.emit('ENEMY_KILLED', { enemy: this });
  }
}
