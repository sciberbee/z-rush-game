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
    try {
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const userJson = localStorage.getItem(STORAGE_KEYS.USER);

      if (accessToken && userJson) {
        this.user = JSON.parse(userJson);
        apiClient.setToken(accessToken);
      }
    } catch (e) {
      console.error('Failed to load auth from storage:', e);
      this.clearStorage();
    }
  }

  private clearStorage() {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  onAuthChange(callback: (user: User | null) => void): () => void {
    this.onAuthChangeCallbacks.push(callback);
    return () => {
      this.onAuthChangeCallbacks = this.onAuthChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyAuthChange() {
    this.onAuthChangeCallbacks.forEach(cb => cb(this.user));
  }

  handleOAuthCallback(params: URLSearchParams): boolean {
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const userJson = params.get('user');

    if (accessToken && refreshToken && userJson) {
      try {
        this.user = JSON.parse(decodeURIComponent(userJson));
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this.user));
        apiClient.setToken(accessToken);
        this.notifyAuthChange();
        return true;
      } catch (e) {
        console.error('Failed to parse OAuth callback:', e);
        return false;
      }
    }
    return false;
  }

  async tryRefreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) return false;

    try {
      const response: AuthResponse = await apiClient.refreshToken(refreshToken);
      this.user = response.user;
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
      apiClient.setToken(response.accessToken);
      this.notifyAuthChange();
      return true;
    } catch (e) {
      console.error('Failed to refresh token:', e);
      this.logout();
      return false;
    }
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.user !== null && apiClient.getToken() !== null;
  }

  logout() {
    this.user = null;
    this.clearStorage();
    apiClient.clearToken();
    this.notifyAuthChange();
  }

  getLoginUrl(): string {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${apiUrl}/auth/google`;
  }
}

export const authService = new AuthService();
