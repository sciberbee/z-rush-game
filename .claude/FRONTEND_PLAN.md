# Z-Rush Frontend Integration Plan

## Backend Status: COMPLETE ✅
The NestJS backend server has been created at `~/Documents/z-rush-server` with:
- Prisma schema with User, Profile, GameProgress, Settings, Score models
- Google OAuth authentication
- JWT token handling
- All API endpoints implemented

## Frontend Implementation (Remaining Work)

### Step 1: Create 'user-save' Branch
```bash
git checkout -b user-save
```

### Step 2: Create Directory Structure
```
src/
├── services/
│   ├── ApiClient.ts      # HTTP client for API calls
│   ├── AuthService.ts    # Authentication state management
│   └── SyncService.ts    # Data synchronization
├── ui/
│   ├── AuthButton.ts     # Google login button
│   └── ProfilePanel.ts   # User profile display
└── types/
    └── api.ts            # TypeScript types for API
```

### Step 3: Files to Create

#### src/types/api.ts
```typescript
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface Profile {
  id: string;
  userId: string;
  playerName: string;
  playerColor: string;
}

export interface GameProgress {
  id: string;
  userId: string;
  levelIndex: number;
  completed: boolean;
  highestWave: number;
  stars: number;
}

export interface Settings {
  id: string;
  userId: string;
  musicVolume: number;
  sfxVolume: number;
  vibrationEnabled: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  score: number;
  soldierCount: number;
  createdAt: string;
  player: {
    displayName: string;
    playerColor: string;
    avatarUrl: string | null;
  };
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
```

#### src/services/ApiClient.ts
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  private accessToken: string | null = null;

  setToken(token: string) {
    this.accessToken = token;
  }

  clearToken() {
    this.accessToken = null;
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return this.fetch('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  // Profile
  async getProfile() {
    return this.fetch('/users/profile');
  }

  async updateProfile(data: { playerName?: string; playerColor?: string }) {
    return this.fetch('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Game Data
  async getProgress() {
    return this.fetch('/game-data/progress');
  }

  async saveProgress(data: { levelIndex: number; completed?: boolean; highestWave?: number; stars?: number }) {
    return this.fetch('/game-data/progress', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSettings() {
    return this.fetch('/game-data/settings');
  }

  async updateSettings(data: { musicVolume?: number; sfxVolume?: number; vibrationEnabled?: boolean }) {
    return this.fetch('/game-data/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Leaderboard
  async getLeaderboard(levelIndex: number) {
    return this.fetch(`/leaderboard/${levelIndex}`);
  }

  async submitScore(data: { levelIndex: number; score: number; soldierCount: number }) {
    return this.fetch('/leaderboard/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
```

#### src/services/AuthService.ts
```typescript
import { apiClient } from './ApiClient';
import type { User, AuthResponse } from '../types/api';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'zrush_access_token',
  REFRESH_TOKEN: 'zrush_refresh_token',
  USER: 'zrush_user',
};

class AuthService {
  private user: User | null = null;
  private onAuthChangeCallbacks: ((user: User | null) => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const userJson = localStorage.getItem(STORAGE_KEYS.USER);

    if (accessToken && userJson) {
      this.user = JSON.parse(userJson);
      apiClient.setToken(accessToken);
    }
  }

  onAuthChange(callback: (user: User | null) => void) {
    this.onAuthChangeCallbacks.push(callback);
    return () => {
      this.onAuthChangeCallbacks = this.onAuthChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyAuthChange() {
    this.onAuthChangeCallbacks.forEach(cb => cb(this.user));
  }

  handleOAuthCallback(params: URLSearchParams) {
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const userJson = params.get('user');

    if (accessToken && refreshToken && userJson) {
      this.user = JSON.parse(userJson);
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      localStorage.setItem(STORAGE_KEYS.USER, userJson);
      apiClient.setToken(accessToken);
      this.notifyAuthChange();
      return true;
    }
    return false;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.user !== null;
  }

  logout() {
    this.user = null;
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    apiClient.clearToken();
    this.notifyAuthChange();
  }

  getLoginUrl(): string {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${apiUrl}/auth/google`;
  }
}

export const authService = new AuthService();
```

### Step 4: Modify Existing Files

#### src/config/GameConfig.ts
Add API URL configuration.

#### src/ui/MainMenu.ts
Add login button that uses AuthService.

#### src/core/Game.ts
- Check for OAuth callback on startup
- Save scores after game ends
- Load user progress on login

#### src/style.css
Add styles for auth button and profile panel.

### Step 5: Environment Variables
Create `.env` file:
```
VITE_API_URL=http://localhost:3000
```

## API Endpoints Summary
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/google` | Start Google OAuth |
| GET | `/auth/google/callback` | OAuth callback |
| POST | `/auth/refresh` | Refresh token |
| GET | `/users/profile` | Get user profile |
| PUT | `/users/profile` | Update profile |
| GET | `/game-data/progress` | Get game progress |
| POST | `/game-data/progress` | Save progress |
| GET | `/game-data/settings` | Get settings |
| PUT | `/game-data/settings` | Update settings |
| GET | `/leaderboard/:levelIndex` | Get leaderboard |
| POST | `/leaderboard/submit` | Submit score |

## Testing
1. Start backend: `cd ~/Documents/z-rush-server && npm run start:dev`
2. Start frontend: `npm run dev`
3. Visit `/auth/google` to test OAuth flow
4. Check API calls in Network tab
