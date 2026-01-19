import * as THREE from 'three';
import { Entity } from './Entity';
import { GameConfig } from '../config/GameConfig';

export class Bullet extends Entity {
  public direction: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
  public speed: number = GameConfig.BULLET_SPEED;
  public damage: number = GameConfig.BULLET_DAMAGE;
  private static geometry: THREE.SphereGeometry | null = null;
  private static material: THREE.MeshBasicMaterial | null = null;

  constructor() {
    // Use shared geometry and material for performance
    if (!Bullet.geometry) {
      Bullet.geometry = new THREE.SphereGeometry(GameConfig.BULLET_SIZE, 8, 8);
    }
    if (!Bullet.material) {
      Bullet.material = new THREE.MeshBasicMaterial({
        color: GameConfig.COLOR_BULLET,
      });
    }

    const mesh = new THREE.Mesh(Bullet.geometry, Bullet.material);
    super(mesh);

    this.maxHealth = 1;
    this.health = 1;
  }

  public reset(): void {
    super.reset();
    this.direction.set(0, 0, 1);
    this.speed = GameConfig.BULLET_SPEED;
    this.damage = GameConfig.BULLET_DAMAGE;
    this.mesh.visible = true;
  }

  public fire(
    startPosition: THREE.Vector3,
    targetPosition: THREE.Vector3
  ): void {
    this.position.copy(startPosition);
    this.position.y = 0.5;

    this.direction.subVectors(targetPosition, startPosition);
    this.direction.y = 0;
    this.direction.normalize();
  }

  public update(deltaTime: number): void {
    if (!this.active) return;

    // Move bullet
    this.position.x += this.direction.x * this.speed * deltaTime;
    this.position.z += this.direction.z * this.speed * deltaTime;
  }

  public die(): void {
    super.die();
    this.mesh.visible = false;
  }

  public static disposeSharedResources(): void {
    Bullet.geometry?.dispose();
    Bullet.material?.dispose();
    Bullet.geometry = null;
    Bullet.material = null;
  }
}
