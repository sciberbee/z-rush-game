import * as THREE from 'three';
import { Enemy } from './Enemy';
import { GameConfig } from '../config/GameConfig';

export class Zombie extends Enemy {
  private static geometry: THREE.BoxGeometry | null = null;
  private static material: THREE.MeshLambertMaterial | null = null;

  constructor() {
    // Use shared geometry and material for performance
    if (!Zombie.geometry) {
      Zombie.geometry = new THREE.BoxGeometry(0.5, 0.8, 0.5);
    }
    if (!Zombie.material) {
      Zombie.material = new THREE.MeshLambertMaterial({
        color: GameConfig.COLOR_ENEMY,
      });
    }

    const mesh = new THREE.Mesh(Zombie.geometry, Zombie.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.y = 0.4;

    super(mesh);
  }

  public static disposeSharedResources(): void {
    Zombie.geometry?.dispose();
    Zombie.material?.dispose();
    Zombie.geometry = null;
    Zombie.material = null;
  }
}
