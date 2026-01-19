import * as THREE from 'three';
import type { Poolable } from '../types';

export abstract class Entity implements Poolable {
  public mesh: THREE.Mesh | THREE.Group;
  public active: boolean = true;
  public position: THREE.Vector3;
  public health: number = 100;
  public maxHealth: number = 100;

  constructor(mesh: THREE.Mesh | THREE.Group) {
    this.mesh = mesh;
    this.position = mesh.position;
  }

  public reset(): void {
    this.active = true;
    this.health = this.maxHealth;
    this.position.set(0, 0, 0);
  }

  public takeDamage(amount: number): boolean {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.die();
      return true;
    }
    return false;
  }

  public die(): void {
    this.active = false;
  }

  public setPosition(x: number, y: number, z: number): void {
    this.position.set(x, y, z);
  }

  public abstract update(deltaTime: number): void;

  public dispose(): void {
    if (this.mesh instanceof THREE.Mesh) {
      this.mesh.geometry?.dispose();
      if (this.mesh.material instanceof THREE.Material) {
        this.mesh.material.dispose();
      }
    }
  }
}
