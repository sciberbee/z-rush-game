import { syncService } from '../services/SyncService';
import { authService } from '../services/AuthService';
import type { LeaderboardEntry } from '../types/api';

export class Leaderboard {
  private element: HTMLElement;
  private contentEl: HTMLElement;
  private levelIndex: number = 0;

  constructor(container: HTMLElement) {
    this.element = this.createElement();
    this.contentEl = this.element.querySelector('.leaderboard-content')!;
    container.appendChild(this.element);
    this.hide();
  }

  private createElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'leaderboard-container hidden';
    el.innerHTML = `
      <div class="leaderboard-panel">
        <div class="leaderboard-header">
          <h2>LEADERBOARD</h2>
          <button class="leaderboard-close-btn">&times;</button>
        </div>
        <div class="leaderboard-content">
          <div class="leaderboard-loading">Loading...</div>
        </div>
      </div>
    `;

    el.querySelector('.leaderboard-close-btn')!.addEventListener('click', () => {
      this.hide();
    });

    // Close on background click
    el.addEventListener('click', (e) => {
      if (e.target === el) {
        this.hide();
      }
    });

    return el;
  }

  public async show(levelIndex: number = 0): Promise<void> {
    this.levelIndex = levelIndex;
    this.element.classList.remove('hidden');
    this.contentEl.innerHTML = '<div class="leaderboard-loading">Loading...</div>';

    await this.loadLeaderboard();
  }

  public hide(): void {
    this.element.classList.add('hidden');
  }

  private async loadLeaderboard(): Promise<void> {
    try {
      const entries = await syncService.getLeaderboard(this.levelIndex);

      if (entries.length === 0) {
        this.contentEl.innerHTML = '<div class="leaderboard-empty">No scores yet. Be the first!</div>';
        return;
      }

      // Get current user to highlight their entry
      const currentUser = authService.getUser();

      this.contentEl.innerHTML = entries.map(entry => this.renderEntry(entry, currentUser?.displayName)).join('');
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      this.contentEl.innerHTML = '<div class="leaderboard-empty">Failed to load leaderboard</div>';
    }
  }

  private renderEntry(entry: LeaderboardEntry, currentUserName?: string): string {
    const isCurrentUser = currentUserName && entry.player.displayName === currentUserName;
    const rankClass = entry.rank <= 3 ? `rank-${entry.rank}` : '';

    return `
      <div class="leaderboard-entry ${isCurrentUser ? 'highlight' : ''}">
        <div class="leaderboard-rank ${rankClass}">${this.formatRank(entry.rank)}</div>
        <div class="leaderboard-player">
          ${entry.player.avatarUrl
            ? `<img class="leaderboard-avatar" src="${entry.player.avatarUrl}" alt="avatar">`
            : `<div class="leaderboard-avatar-placeholder" style="background: ${entry.player.playerColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}"></div>`
          }
          <span class="leaderboard-name">${this.escapeHtml(entry.player.displayName)}</span>
        </div>
        <div class="leaderboard-score">${entry.score.toLocaleString()}</div>
      </div>
    `;
  }

  private formatRank(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  public dispose(): void {
    this.element.remove();
  }
}
