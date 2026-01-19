import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { Enemy } from './Enemy';
import { Resources } from '../core/Resources';
import { GameConfig } from '../config/GameConfig';

export class Zombie extends Enemy {
  // Fallback geometry/material
  private static geometry: THREE.BoxGeometry | null = null;
  private static material: THREE.MeshLambertMaterial | null = null;

  constructor() {
    const resources = Resources.getInstance();
    const modelTemplate = resources.getModel('zombie');

    let mesh: THREE.Object3D;

    if (modelTemplate) {
      // Clone the model properly (supports skinned meshes/animations)
      mesh = SkeletonUtils.clone(modelTemplate);
      
      // Initial scale and rotation adjustments for the model
      // These might need tuning based on the specific model used
      mesh.scale.set(2.0, 2.0, 2.0); 
      mesh.rotation.y = Math.PI; // Face forward
      
      // Enable shadows for all meshes in the model
      mesh.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    } else {
      // Fallback to box if model not found
      if (!Zombie.geometry) {
        Zombie.geometry = new THREE.BoxGeometry(0.5, 0.8, 0.5);
      }
      if (!Zombie.material) {
        Zombie.material = new THREE.MeshLambertMaterial({
          color: GameConfig.COLOR_ENEMY,
        });
      }
      mesh = new THREE.Mesh(Zombie.geometry, Zombie.material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.y = 0.4;
    }

    super(mesh);
  }

  public static disposeSharedResources(): void {
    Zombie.geometry?.dispose();
    Zombie.material?.dispose();
    Zombie.geometry = null;
    Zombie.material = null;
  }
}
