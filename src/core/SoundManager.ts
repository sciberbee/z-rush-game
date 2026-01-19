import * as THREE from 'three';
import { EventBus } from './EventBus';
import { Resources } from './Resources';

export class SoundManager {
  private listener: THREE.AudioListener;
  private camera: THREE.Camera;
  private bgm: THREE.Audio | null = null;
  private soundPool: THREE.Audio[] = [];
  private poolSize = 10;

  constructor(camera: THREE.Camera) {
    this.camera = camera;
    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);

    this.initializePool();
    this.setupEventListeners();
  }

  private initializePool(): void {
    for (let i = 0; i < this.poolSize; i++) {
      const audio = new THREE.Audio(this.listener);
      this.soundPool.push(audio);
    }
  }

  private setupEventListeners(): void {
    EventBus.on('PLAY_SFX', (data: any) => {
      this.playSound(data.name, data.volume, data.loop);
    });

    EventBus.on('PLAY_BGM', (data: any) => {
      this.playMusic(data.name, data.volume);
    });

    EventBus.on('STOP_BGM', () => {
      this.stopMusic();
    });
  }

  private getFreeAudio(): THREE.Audio | null {
    return this.soundPool.find(audio => !audio.isPlaying) || null;
  }

  public playSound(name: string, volume: number = 1.0, loop: boolean = false): void {
    const buffer = Resources.getInstance().getAudio(name);
    if (!buffer) return;

    const audio = this.getFreeAudio();
    if (audio) {
      audio.setBuffer(buffer);
      audio.setLoop(loop);
      audio.setVolume(volume);
      audio.play();
    }
  }

  public playMusic(name: string, volume: number = 0.5): void {
    if (this.bgm && this.bgm.isPlaying) {
      this.bgm.stop();
    }

    const buffer = Resources.getInstance().getAudio(name);
    if (!buffer) return;

    if (!this.bgm) {
      this.bgm = new THREE.Audio(this.listener);
    }

    this.bgm.setBuffer(buffer);
    this.bgm.setLoop(true);
    this.bgm.setVolume(volume);
    this.bgm.play();
  }

  public stopMusic(): void {
    if (this.bgm && this.bgm.isPlaying) {
      this.bgm.stop();
    }
  }

  public setMasterVolume(volume: number): void {
    this.listener.setMasterVolume(volume);
  }

  public dispose(): void {
    this.stopMusic();
    this.camera.remove(this.listener);
  }
}
