import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export interface ResourceManifest {
  audio: { [key: string]: string };
  textures: { [key: string]: string };
  models: { [key: string]: string };
}

const defaultManifest: ResourceManifest = {
  audio: {
    shoot: '/audio/shoot.mp3',
    hit: '/audio/hit.mp3',
    explosion: '/audio/explosion.mp3',
    pickup: '/audio/pickup.mp3',
    bgm: '/audio/bgm.mp3',
    victory: '/audio/victory.mp3',
    gameover: '/audio/gameover.wav',
  },
  textures: {},
  models: {
    zombie: '/models/zombie.glb',
    boss: '/models/boss.glb',
  },
};

export class Resources {
  private static instance: Resources;
  private loaded: boolean = false;
  private manifest: ResourceManifest;
  private models: { [key: string]: THREE.Group } = {};
  private audioBuffers: { [key: string]: AudioBuffer } = {};

  private constructor() {
    this.manifest = {
      ...defaultManifest,
      audio: {
        ...defaultManifest.audio,
        boss_spawn: '/audio/boss_spawn.wav',
      },
    };
  }

  public static getInstance(): Resources {
    if (!Resources.instance) {
      Resources.instance = new Resources();
    }
    return Resources.instance;
  }

  public async load(
    onProgress?: (progress: number) => void
  ): Promise<void> {
    if (this.loaded) return;

    const audioKeys = Object.keys(this.manifest.audio);
    const modelKeys = Object.keys(this.manifest.models);
    const totalItems = audioKeys.length + modelKeys.length;
    let loadedItems = 0;

    const updateProgress = () => {
      loadedItems++;
      onProgress?.(loadedItems / totalItems);
    };

    // Load Models
    const gltfLoader = new GLTFLoader();
    const loadModelPromises = modelKeys.map(async (key) => {
      const url = this.manifest.models[key];
      try {
        const gltf = await gltfLoader.loadAsync(url);
        this.models[key] = gltf.scene;
      } catch (error) {
        console.warn(`Failed to load model: ${key} at ${url}`, error);
      } finally {
        updateProgress();
      }
    });

    // Load Audio
    const audioLoader = new THREE.AudioLoader();
    const loadAudioPromises = audioKeys.map(async (key) => {
      const url = this.manifest.audio[key];
      try {
        const buffer = await audioLoader.loadAsync(url);
        this.audioBuffers[key] = buffer;
      } catch (error) {
        console.warn(`Failed to load audio: ${key} at ${url}`, error);
      } finally {
        updateProgress();
      }
    });

    await Promise.all([...loadModelPromises, ...loadAudioPromises]);

    this.loaded = true;
  }

  public getAudio(key: string): AudioBuffer | undefined {
    return this.audioBuffers[key];
  }

  public getAudioPath(key: string): string | undefined {
    return this.manifest.audio[key];
  }

  public getModel(key: string): THREE.Group | undefined {
    return this.models[key];
  }

  public isLoaded(): boolean {
    return this.loaded;
  }
}
