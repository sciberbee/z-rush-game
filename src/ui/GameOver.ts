import { EventBus } from '../core/EventBus';
import { authService } from '../services/AuthService';

export class GameOver {
  private element: HTMLElement;
  private titleEl: HTMLElement;
  private scoreEl: HTMLElement;
  private rankEl: HTMLElement;
  private onRestart: () => void;

  constructor(container: HTMLElement, onRestart: () => void) {
    this.onRestart = onRestart;
    this.element = this.createScreen();
    this.titleEl = this.element.querySelector('.result-title')!;
    this.scoreEl = this.element.querySelector('.score-value')!;
    this.rankEl = this.element.querySelector('.rank-info')!;
    container.appendChild(this.element);

    // Listen for score events
    EventBus.on('GAME_SCORE', (event) => {
      const data = event.data as { score: number; soldierCount: number; completed: boolean };
      this.updateScore(data.score, data.soldierCount);
    });

    EventBus.on('SCORE_SUBMITTED', (event) => {
      const data = event.data as { rank: number; score: number };
      this.showRank(data.rank);
    });
  }

  private createScreen(): HTMLElement {
    const screen = document.createElement('div');
    screen.className = 'game-over-screen hidden';
    screen.innerHTML = `
      <h1 class="result-title">GAME OVER</h1>
      <div class="score-container">
        <div class="score-label">SCORE</div>
        <div class="score-value">0</div>
        <div class="rank-info hidden"></div>
      </div>
      <div class="result-buttons">
        <button class="menu-button restart-button">RETRY</button>
        <button class="menu-button menu-button-secondary">MAIN MENU</button>
      </div>
    `;

    screen.querySelector('.restart-button')!.addEventListener('click', () => {
      this.onRestart();
    });

    screen.querySelector('.menu-button-secondary')!.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('game:quit'));
    });

    return screen;
  }

  private updateScore(score: number, soldierCount: number): void {
    this.scoreEl.textContent = score.toLocaleString();

    // Show soldier count
    const soldierInfo = this.element.querySelector('.soldier-info');
    if (!soldierInfo) {
      const info = document.createElement('div');
      info.className = 'soldier-info';
      info.textContent = `${soldierCount} soldiers survived`;
      this.scoreEl.parentElement?.insertBefore(info, this.scoreEl.nextSibling);
    } else {
      soldierInfo.textContent = `${soldierCount} soldiers survived`;
    }
  }

  private showRank(rank: number): void {
    this.rankEl.classList.remove('hidden');
    this.rankEl.innerHTML = `<span class="rank-label">RANK</span> <span class="rank-number">#${rank}</span>`;
  }

  public show(isVictory: boolean): void {
    // Reset rank display
    this.rankEl.classList.add('hidden');

    if (isVictory) {
      this.element.className = 'victory-screen';
      this.titleEl.textContent = 'VICTORY!';
      this.element.querySelector('.restart-button')!.textContent = 'NEXT LEVEL';
    } else {
      this.element.className = 'game-over-screen';
      this.titleEl.textContent = 'GAME OVER';
      this.element.querySelector('.restart-button')!.textContent = 'RETRY';
    }
    this.element.classList.remove('hidden');

    // Show login prompt if not authenticated
    if (!authService.isAuthenticated()) {
      const loginPrompt = this.element.querySelector('.login-prompt');
      if (!loginPrompt) {
        const prompt = document.createElement('div');
        prompt.className = 'login-prompt';
        prompt.innerHTML = `
          <span>Login to save your score!</span>
          <button class="login-prompt-btn">Login</button>
        `;
        prompt.querySelector('.login-prompt-btn')?.addEventListener('click', () => {
          window.location.href = authService.getLoginUrl();
        });
        this.element.querySelector('.score-container')?.appendChild(prompt);
      }
    }
  }

  public hide(): void {
    this.element.classList.add('hidden');
  }

  public dispose(): void {
    this.element.remove();
  }
}
