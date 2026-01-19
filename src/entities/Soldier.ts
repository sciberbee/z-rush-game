import * as THREE from 'three';
import { Entity } from './Entity';
import { GameConfig } from '../config/GameConfig';

export class Soldier extends Entity {
  public targetPosition: THREE.Vector3 = new THREE.Vector3();
  public fireTimer: number = 0;
  private static geometry: THREE.BoxGeometry | null = null;
  private static material: THREE.MeshLambertMaterial | null = null;

  constructor() {
    // Use shared geometry and material for performance
    if (!Soldier.geometry) {
      Soldier.geometry = new THREE.BoxGeometry(
        GameConfig.SOLDIER_SIZE,
        GameConfig.SOLDIER_HEIGHT,
        GameConfig.SOLDIER_SIZE
      );
    }
    if (!Soldier.material) {
      Soldier.material = new THREE.MeshLambertMaterial({
        color: GameConfig.COLOR_SOLDIER,
      });
    }

    const mesh = new THREE.Mesh(Soldier.geometry, Soldier.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.y = GameConfig.SOLDIER_HEIGHT / 2;

    super(mesh);
    this.maxHealth = GameConfig.SOLDIER_HEALTH;
    this.health = this.maxHealth;
  }

  public reset(): void {
    super.reset();
    this.fireTimer = 0;
    this.targetPosition.set(0, 0, 0);
    this.mesh.visible = true;
  }

  public update(deltaTime: number): void {
    if (!this.active) return;

    // Update fire timer
    this.fireTimer += deltaTime;

    // Move towards target position (smoothly)
    const speed = 10;
    const dx = this.targetPosition.x - this.position.x;
    const dz = this.targetPosition.z - this.position.z;

    if (Math.abs(dx) > 0.01) {
      this.position.x += dx * speed * deltaTime;
    }
    if (Math.abs(dz) > 0.01) {
      this.position.z += dz * speed * deltaTime;
    }
  }

  public canFire(): boolean {
    return this.fireTimer >= GameConfig.FIRE_RATE;
  }

  public fire(): void {
    this.fireTimer = 0;
  }

  public die(): void {
    super.die();
    this.mesh.visible = false;
  }

  public static disposeSharedResources(): void {
    Soldier.geometry?.dispose();
    Soldier.material?.dispose();
    Soldier.geometry = null;
    Soldier.material = null;
  }
}
