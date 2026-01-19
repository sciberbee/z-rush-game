export interface ResourceManifest {
  audio: { [key: string]: string };
  textures: { [key: string]: string };
}

const defaultManifest: ResourceManifest = {
  audio: {
    shoot: '/audio/shoot.mp3',
    hit: '/audio/hit.mp3',
    explosion: '/audio/explosion.mp3',
    pickup: '/audio/pickup.mp3',
    bgm: '/audio/bgm.mp3',
    victory: '/audio/victory.mp3',
    gameover: '/audio/gameover.mp3',
  },
  textures: {},
};

export class Resources {
  private static instance: Resources;
  private loaded: boolean = false;
  private manifest: ResourceManifest;

  private constructor() {
    this.manifest = defaultManifest;
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

    // For now, we'll skip actual loading since we don't have audio files yet
    // In production, this would load all audio files

    const totalItems = Object.keys(this.manifest.audio).length +
      Object.keys(this.manifest.textures).length;

    let loadedItems = 0;

    // Simulate loading
    for (const _key of Object.keys(this.manifest.audio)) {
      loadedItems++;
      onProgress?.(loadedItems / totalItems);
      // await this.loadAudio(key, this.manifest.audio[key]);
    }

    this.loaded = true;
  }

  public getAudioPath(key: string): string | undefined {
    return this.manifest.audio[key];
  }

  public isLoaded(): boolean {
    return this.loaded;
  }
}
