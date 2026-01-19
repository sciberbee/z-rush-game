import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { Enemy } from './Enemy';
import { Resources } from '../core/Resources';
import { GameConfig } from '../config/GameConfig';
import type { EnemyConfig } from '../types';
import { EventBus } from '../core/EventBus';

export class Boss extends Enemy {
  public name: string = 'BOSS';
  private healthBar: THREE.Mesh | null = null;
  private healthBarBackground: THREE.Mesh | null = null;

  constructor(config: EnemyConfig) {
    // Create boss mesh (larger than regular enemies)
    // Try to load model
    const resources = Resources.getInstance();
    const modelTemplate = resources.getModel('boss');
    let mesh: THREE.Object3D;

    if (modelTemplate) {
      mesh = SkeletonUtils.clone(modelTemplate);
      mesh.scale.set(1.0, 1.0, 1.0);
      // mesh.rotation.y = Math.PI; // Face forward
      
      mesh.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    } else {
      const geometry = new THREE.BoxGeometry(2, 3, 2);
      const material = new THREE.MeshLambertMaterial({
        color: GameConfig.COLOR_BOSS,
      });
      mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }

    mesh.position.y = 1.5;

    super(mesh);

    this.maxHealth = config.health;
    this.health = this.maxHealth;
    this.damage = config.damage;
    this.speed = config.speed;

    this.setPosition(config.position.x, 1.5, config.position.z);

    // Create health bar
    this.createHealthBar();

    EventBus.emit('BOSS_SPAWNED', { boss: this });
  }

  private createHealthBar(): void {
    // Background bar
    const bgGeometry = new THREE.PlaneGeometry(2.5, 0.3);
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    this.healthBarBackground = new THREE.Mesh(bgGeometry, bgMaterial);
    this.healthBarBackground.position.y = 2;
    this.mesh.add(this.healthBarBackground);

    // Health bar
    const hpGeometry = new THREE.PlaneGeometry(2.4, 0.25);
    const hpMaterial = new THREE.MeshBasicMaterial({ color: 0xff4444 });
    this.healthBar = new THREE.Mesh(hpGeometry, hpMaterial);
    this.healthBar.position.y = 2;
    this.healthBar.position.z = 0.01;
    this.mesh.add(this.healthBar);
  }

  public takeDamage(amount: number): boolean {
    const died = super.takeDamage(amount);

    // Update health bar
    if (this.healthBar) {
      const healthPercent = this.health / this.maxHealth;
      this.healthBar.scale.x = healthPercent;
      this.healthBar.position.x = -(1 - healthPercent) * 1.2;
    }

    return died;
  }

  public update(deltaTime: number): void {
    super.update(deltaTime);

    // Boss-specific behavior: move side to side while advancing
    if (this.active && this.targetPosition) {
      const time = Date.now() * 0.001;
      const sideMovement = Math.sin(time * 2) * GameConfig.HORIZONTAL_LIMIT * 0.5;
      this.position.x = sideMovement;
    }
  }

  public die(): void {
    super.die();
    EventBus.emit('WAVE_COMPLETED', { bossDefeated: true });
  }
}
