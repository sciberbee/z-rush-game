import { Howl, Howler } from 'howler';

interface SoundConfig {
  src: string[];
  volume?: number;
  loop?: boolean;
  sprite?: { [key: string]: [number, number] };
}

export class AudioManager {
  private static instance: AudioManager;
  private sounds: Map<string, Howl> = new Map();
  private bgm: Howl | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 1.0;
  private sfxVolume: number = 0.7;
  private bgmVolume: number = 0.4;

  private constructor() {
    // Initialize Howler settings
    Howler.autoUnlock = true;
    Howler.html5PoolSize = 10;
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public loadSound(key: string, config: SoundConfig): void {
    if (this.sounds.has(key)) return;

    const sound = new Howl({
      src: config.src,
      volume: (config.volume ?? this.sfxVolume) * this.masterVolume,
      loop: config.loop ?? false,
      sprite: config.sprite,
      preload: true,
    });

    this.sounds.set(key, sound);
  }

  public play(key: string, sprite?: string): number | undefined {
    if (this.isMuted) return;

    const sound = this.sounds.get(key);
    if (sound) {
      return sound.play(sprite);
    }
    return undefined;
  }

  public stop(key: string): void {
    const sound = this.sounds.get(key);
    if (sound) {
      sound.stop();
    }
  }

  public playBGM(src: string): void {
    if (this.bgm) {
      this.bgm.stop();
    }

    this.bgm = new Howl({
      src: [src],
      volume: this.bgmVolume * this.masterVolume,
      loop: true,
      html5: true, // Use HTML5 audio for long files
    });

    if (!this.isMuted) {
      this.bgm.play();
    }
  }

  public stopBGM(): void {
    if (this.bgm) {
      this.bgm.stop();
    }
  }

  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.masterVolume);
  }

  public setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(sound => {
      sound.volume(this.sfxVolume * this.masterVolume);
    });
  }

  public setBGMVolume(volume: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    if (this.bgm) {
      this.bgm.volume(this.bgmVolume * this.masterVolume);
    }
  }

  public mute(): void {
    this.isMuted = true;
    Howler.mute(true);
  }

  public unmute(): void {
    this.isMuted = false;
    Howler.mute(false);
  }

  public toggleMute(): boolean {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
    return this.isMuted;
  }

  public dispose(): void {
    this.sounds.forEach(sound => sound.unload());
    this.sounds.clear();
    if (this.bgm) {
      this.bgm.unload();
      this.bgm = null;
    }
  }
}
