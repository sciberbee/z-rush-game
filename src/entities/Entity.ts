import * as THREE from 'three';
import type { Poolable } from '../types';

export abstract class Entity implements Poolable {
  public mesh: THREE.Object3D;
  public active: boolean = true;
  public position: THREE.Vector3;
  public health: number = 100;
  public maxHealth: number = 100;

  constructor(mesh: THREE.Object3D) {
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
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        } else if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        }
      }
    });
  }
}
