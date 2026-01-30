export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

export type WeaponType = 'pistol' | 'rifle' | 'shotgun' | 'smg';

export interface Profile {
  id: string;
  userId: string;
  playerName: string;
  playerColor: string;
  weaponType: WeaponType;
}

// Backend returns User with nested Profile from /users/profile
export interface UserWithProfile extends User {
  profile: Profile | null;
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

// Backend returns this from /leaderboard/submit
export interface SubmitScoreResponse {
  id: string;
  rank: number;
  score: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
