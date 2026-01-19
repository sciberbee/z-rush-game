import * as THREE from 'three';
import { Entity } from './Entity';
import { GameConfig } from '../config/GameConfig';
import { GateOperation } from '../types';
import type { Poolable } from '../types';

export class Gate extends Entity implements Poolable {
  public operation: GateOperation = GateOperation.ADD;
  public value: number = 1;
  public isPositive: boolean = true;
  private textSprite: THREE.Sprite | null = null;

  constructor() {
    const geometry = new THREE.BoxGeometry(
      GameConfig.GATE_WIDTH,
      GameConfig.GATE_HEIGHT,
      GameConfig.GATE_DEPTH
    );
    const material = new THREE.MeshLambertMaterial({
      color: GameConfig.COLOR_GATE_POSITIVE,
      transparent: true,
      opacity: 0.8,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.y = GameConfig.GATE_HEIGHT / 2;

    super(mesh);
    this.maxHealth = Infinity; // Gates don't take damage
  }

  public setup(operation: GateOperation, value: number, xPosition: number, zPosition: number): void {
    this.operation = operation;
    this.value = value;
    this.position.set(xPosition, GameConfig.GATE_HEIGHT / 2, zPosition);

    // Determine if positive or negative effect
    this.isPositive = this.calculateIsPositive();

    // Update material color
    const material = (this.mesh as THREE.Mesh).material as THREE.MeshLambertMaterial;
    material.color.setHex(
      this.isPositive ? GameConfig.COLOR_GATE_POSITIVE : GameConfig.COLOR_GATE_NEGATIVE
    );

    // Update or create text
    this.updateText();
  }

  private calculateIsPositive(): boolean {
    switch (this.operation) {
      case GateOperation.ADD:
        return this.value > 0;
      case GateOperation.SUBTRACT:
        return this.value < 0;
      case GateOperation.MULTIPLY:
        return this.value > 1;
      case GateOperation.DIVIDE:
        return this.value < 1;
      default:
        return true;
    }
  }

  private updateText(): void {
    // Remove old text
    if (this.textSprite && this.mesh instanceof THREE.Mesh) {
      this.mesh.remove(this.textSprite);
    }

    // Create canvas for text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 128;
    canvas.height = 64;

    context.fillStyle = 'white';
    context.font = 'bold 48px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    const text = `${this.operation}${Math.abs(this.value)}`;
    context.fillText(text, 64, 32);

    // Create sprite
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    this.textSprite = new THREE.Sprite(spriteMaterial);
    this.textSprite.scale.set(2, 1, 1);
    this.textSprite.position.y = 0;
    this.textSprite.position.z = GameConfig.GATE_DEPTH / 2 + 0.1;

    if (this.mesh instanceof THREE.Mesh) {
      this.mesh.add(this.textSprite);
    }
  }

  public applyEffect(currentCount: number): number {
    switch (this.operation) {
      case GateOperation.ADD:
        return currentCount + this.value;
      case GateOperation.SUBTRACT:
        return currentCount - this.value;
      case GateOperation.MULTIPLY:
        return Math.floor(currentCount * this.value);
      case GateOperation.DIVIDE:
        return Math.floor(currentCount / this.value);
      default:
        return currentCount;
    }
  }

  public reset(): void {
    super.reset();
    this.operation = GateOperation.ADD;
    this.value = 1;
    this.mesh.visible = true;
  }

  public update(_deltaTime: number): void {
    // Gates don't move
  }

  public die(): void {
    super.die();
    this.mesh.visible = false;
  }
}
