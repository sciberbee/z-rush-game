import type {
  AuthResponse,
  UserWithProfile,
  GameProgress,
  Settings,
  LeaderboardEntry,
  SubmitScoreResponse,
  Profile,
} from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  private accessToken: string | null = null;

  setToken(token: string) {
    this.accessToken = token;
  }

  clearToken() {
    this.accessToken = null;
  }

  getToken(): string | null {
    return this.accessToken;
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const text = await response.text();
    if (!text) return {} as T;

    return JSON.parse(text);
  }

  // Auth
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return this.fetch('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  // Profile
  async getProfile(): Promise<UserWithProfile> {
    return this.fetch('/users/profile');
  }

  async updateProfile(data: { playerName?: string; playerColor?: string; weaponType?: string }): Promise<Profile> {
    return this.fetch('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Game Data
  async getProgress(): Promise<GameProgress[]> {
    return this.fetch('/game-data/progress');
  }

  async saveProgress(data: {
    levelIndex: number;
    completed?: boolean;
    highestWave?: number;
    stars?: number;
  }): Promise<GameProgress> {
    return this.fetch('/game-data/progress', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSettings(): Promise<Settings | null> {
    try {
      return await this.fetch('/game-data/settings');
    } catch {
      return null;
    }
  }

  async updateSettings(data: {
    musicVolume?: number;
    sfxVolume?: number;
    vibrationEnabled?: boolean;
  }): Promise<Settings> {
    return this.fetch('/game-data/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Leaderboard
  async getLeaderboard(levelIndex: number): Promise<LeaderboardEntry[]> {
    return this.fetch(`/leaderboard/${levelIndex}`);
  }

  async submitScore(data: {
    levelIndex: number;
    score: number;
    soldierCount: number;
  }): Promise<SubmitScoreResponse> {
    return this.fetch('/leaderboard/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserBestScores(): Promise<{ levelIndex: number; score: number; rank: number }[]> {
    return this.fetch('/leaderboard/user/best');
  }
}

export const apiClient = new ApiClient();
