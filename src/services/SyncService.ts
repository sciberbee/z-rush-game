import { apiClient } from './ApiClient';
import { authService } from './AuthService';
import type { GameProgress, Settings, Profile, LeaderboardEntry } from '../types/api';

// Local storage keys for offline caching
const STORAGE_KEYS = {
  PROGRESS: 'zrush_progress',
  SETTINGS: 'zrush_settings',
  PROFILE: 'zrush_profile',
};

class SyncService {
  private progress: Map<number, GameProgress> = new Map();
  private settings: Settings | null = null;
  private profile: Profile | null = null;
  private pendingSyncs: { type: string; data: unknown }[] = [];

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    try {
      const progressJson = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (progressJson) {
        const progressArray: GameProgress[] = JSON.parse(progressJson);
        progressArray.forEach(p => this.progress.set(p.levelIndex, p));
      }

      const settingsJson = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settingsJson) {
        this.settings = JSON.parse(settingsJson);
      }

      const profileJson = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (profileJson) {
        this.profile = JSON.parse(profileJson);
      }
    } catch (e) {
      console.error('Failed to load from local storage:', e);
    }
  }

  private saveToLocalStorage() {
    try {
      const progressArray = Array.from(this.progress.values());
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progressArray));
      
      if (this.settings) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      }
      
      if (this.profile) {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(this.profile));
      }
    } catch (e) {
      console.error('Failed to save to local storage:', e);
    }
  }

  async loadUserData(): Promise<void> {
    if (!authService.isAuthenticated()) return;

    try {
      // Load profile
      const userWithProfile = await apiClient.getProfile();
      if (userWithProfile.profile) {
        this.profile = userWithProfile.profile;
      }

      // Load progress
      const progressArray = await apiClient.getProgress();
      this.progress.clear();
      progressArray.forEach(p => this.progress.set(p.levelIndex, p));

      // Load settings
      const serverSettings = await apiClient.getSettings();
      if (serverSettings) {
        this.settings = serverSettings;
      }

      this.saveToLocalStorage();
    } catch (e) {
      console.error('Failed to load user data:', e);
      // Try to refresh token
      if (await authService.tryRefreshToken()) {
        return this.loadUserData();
      }
    }
  }

  // Progress methods
  getProgress(levelIndex: number): GameProgress | null {
    return this.progress.get(levelIndex) || null;
  }

  getAllProgress(): GameProgress[] {
    return Array.from(this.progress.values());
  }

  async saveProgress(
    levelIndex: number,
    data: { completed?: boolean; highestWave?: number; stars?: number }
  ): Promise<void> {
    const current = this.progress.get(levelIndex);
    
    // Merge with existing data
    const updated = {
      levelIndex,
      completed: data.completed ?? current?.completed ?? false,
      highestWave: Math.max(data.highestWave ?? 0, current?.highestWave ?? 0),
      stars: Math.max(data.stars ?? 0, current?.stars ?? 0),
    };

    if (authService.isAuthenticated()) {
      try {
        const saved = await apiClient.saveProgress(updated);
        this.progress.set(levelIndex, saved);
      } catch (e) {
        console.error('Failed to save progress to server:', e);
        // Queue for later sync
        this.pendingSyncs.push({ type: 'progress', data: updated });
      }
    } else {
      // Save locally only
      this.progress.set(levelIndex, {
        id: `local_${levelIndex}`,
        userId: 'local',
        ...updated,
      } as GameProgress);
    }

    this.saveToLocalStorage();
  }

  // Settings methods
  getSettings(): Settings | null {
    return this.settings;
  }

  async saveSettings(data: {
    musicVolume?: number;
    sfxVolume?: number;
    vibrationEnabled?: boolean;
  }): Promise<void> {
    if (authService.isAuthenticated()) {
      try {
        this.settings = await apiClient.updateSettings(data);
      } catch (e) {
        console.error('Failed to save settings to server:', e);
        this.pendingSyncs.push({ type: 'settings', data });
      }
    }

    // Update local settings
    this.settings = {
      ...this.settings,
      ...data,
    } as Settings;

    this.saveToLocalStorage();
  }

  // Profile methods
  getProfile(): Profile | null {
    return this.profile;
  }

  async saveProfile(data: {
    playerName?: string;
    playerColor?: string;
    weaponType?: string;
  }): Promise<Profile | null> {
    if (!authService.isAuthenticated()) {
      // Save locally for non-authenticated users
      this.profile = {
        ...this.profile,
        ...data,
      } as Profile;
      this.saveToLocalStorage();
      return this.profile;
    }

    try {
      this.profile = await apiClient.updateProfile(data);
      this.saveToLocalStorage();
      return this.profile;
    } catch (e) {
      console.error('Failed to save profile:', e);
      this.pendingSyncs.push({ type: 'profile', data });
      return null;
    }
  }

  // Leaderboard methods
  async getLeaderboard(levelIndex: number): Promise<LeaderboardEntry[]> {
    try {
      return await apiClient.getLeaderboard(levelIndex);
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e);
      return [];
    }
  }

  async submitScore(levelIndex: number, score: number, soldierCount: number): Promise<{ rank: number } | null> {
    if (!authService.isAuthenticated()) {
      console.log('Score submission requires login');
      return null;
    }

    try {
      const result = await apiClient.submitScore({ levelIndex, score, soldierCount });
      return { rank: result.rank };
    } catch (e) {
      console.error('Failed to submit score:', e);
      return null;
    }
  }

  // Sync pending changes when coming back online
  async syncPending(): Promise<void> {
    if (!authService.isAuthenticated() || this.pendingSyncs.length === 0) return;

    const syncs = [...this.pendingSyncs];
    this.pendingSyncs = [];

    for (const sync of syncs) {
      try {
        switch (sync.type) {
          case 'progress':
            await apiClient.saveProgress(sync.data as Parameters<typeof apiClient.saveProgress>[0]);
            break;
          case 'settings':
            await apiClient.updateSettings(sync.data as Parameters<typeof apiClient.updateSettings>[0]);
            break;
          case 'profile':
            await apiClient.updateProfile(sync.data as Parameters<typeof apiClient.updateProfile>[0]);
            break;
        }
      } catch (e) {
        console.error(`Failed to sync ${sync.type}:`, e);
        this.pendingSyncs.push(sync);
      }
    }
  }

  // Clear all local data (for logout)
  clearLocalData() {
    this.progress.clear();
    this.settings = null;
    this.profile = null;
    this.pendingSyncs = [];
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
  }
}

export const syncService = new SyncService();
