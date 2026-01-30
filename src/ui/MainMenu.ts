import { authService } from '../services/AuthService';
import { SettingsModal } from './SettingsModal';
import { Leaderboard } from './Leaderboard';
import type { User, Profile } from '../types/api';

export class MainMenu {
  private element: HTMLElement;
  private onStart: () => void;
  private authButton: HTMLButtonElement | null = null;
  private profilePanel: HTMLElement | null = null;
  private settingsModal: SettingsModal | null = null;
  private leaderboard: Leaderboard | null = null;
  private unsubscribeAuth: (() => void) | null = null;
  private onProfileUpdate: ((profile: Profile) => void) | null = null;

  constructor(container: HTMLElement, onStart: () => void, onProfileUpdate?: (profile: Profile) => void) {
    this.onStart = onStart;
    this.onProfileUpdate = onProfileUpdate || null;
    this.element = this.createMenu();
    container.appendChild(this.element);

    // Create leaderboard
    this.leaderboard = new Leaderboard(container);

    // Create settings modal
    this.settingsModal = new SettingsModal(container);

    // Listen for auth changes
    this.unsubscribeAuth = authService.onAuthChange((user) => {
      this.updateAuthUI(user);
    });

    // Set initial auth state
    this.updateAuthUI(authService.getUser());
  }

  private createMenu(): HTMLElement {
    const menu = document.createElement('div');
    menu.className = 'menu';
    menu.innerHTML = `
      <div class="auth-container"></div>
      <h1>Z-RUSH</h1>
      <button class="menu-button start-button">START</button>
      <button class="leaderboard-button">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v14h14V5H5zm2 12h3v-6H7v6zm4 0h3V8h-3v9zm4 0h3v-4h-3v4z"/>
        </svg>
        Leaderboard
      </button>
    `;

    const startButton = menu.querySelector('.start-button')!;
    startButton.addEventListener('click', () => {
      this.onStart();
    });

    const leaderboardButton = menu.querySelector('.leaderboard-button')!;
    leaderboardButton.addEventListener('click', () => {
      this.leaderboard?.show(0);
    });

    // Create auth UI
    this.createAuthUI(menu.querySelector('.auth-container')!);

    // Also start on any key press or touch
    const handleStart = (e: Event) => {
      if (e.type === 'keydown') {
        const keyEvent = e as KeyboardEvent;
        if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
          this.onStart();
          document.removeEventListener('keydown', handleStart);
        }
      }
    };

    document.addEventListener('keydown', handleStart);

    return menu;
  }

  private createAuthUI(container: HTMLElement): void {
    // Create login button
    this.authButton = document.createElement('button');
    this.authButton.className = 'auth-button';
    this.authButton.innerHTML = `
      <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      <span>Sign in with Google</span>
    `;
    this.authButton.addEventListener('click', () => {
      window.location.href = authService.getLoginUrl();
    });

    // Create profile panel (hidden by default)
    this.profilePanel = document.createElement('div');
    this.profilePanel.className = 'profile-panel hidden';

    container.appendChild(this.authButton);
    container.appendChild(this.profilePanel);
  }

  private updateAuthUI(user: User | null): void {
    if (!this.authButton || !this.profilePanel) return;

    if (user) {
      // Show profile panel, hide login button
      this.authButton.classList.add('hidden');
      this.profilePanel.classList.remove('hidden');
      this.profilePanel.innerHTML = `
        <div class="profile-info">
          ${user.avatarUrl ? `<img class="profile-avatar" src="${user.avatarUrl}" alt="avatar">` : '<div class="profile-avatar-placeholder"></div>'}
          <span class="profile-name">${user.displayName}</span>
        </div>
        <div class="profile-actions">
          <button class="settings-button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Settings
          </button>
          <button class="logout-button">Logout</button>
        </div>
      `;

      // Settings button handler
      const settingsButton = this.profilePanel.querySelector('.settings-button');
      settingsButton?.addEventListener('click', () => {
        this.openSettings();
      });

      // Logout button handler
      const logoutButton = this.profilePanel.querySelector('.logout-button');
      logoutButton?.addEventListener('click', () => {
        authService.logout();
      });
    } else {
      // Show login button, hide profile panel
      this.authButton.classList.remove('hidden');
      this.profilePanel.classList.add('hidden');
    }
  }

  private openSettings(): void {
    this.settingsModal?.open((profile) => {
      if (this.onProfileUpdate) {
        this.onProfileUpdate(profile);
      }
    });
  }

  public show(): void {
    this.element.classList.remove('hidden');
  }

  public hide(): void {
    this.element.classList.add('hidden');
  }

  public dispose(): void {
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
    }
    this.settingsModal?.dispose();
    this.leaderboard?.dispose();
    this.element.remove();
  }
}
