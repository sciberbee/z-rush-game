import { GameConfig } from '../config/GameConfig';

export class HUD {
  private container: HTMLElement;
  private element: HTMLElement;
  private soldierCountEl: HTMLElement;
  private progressBarFill: HTMLElement;
  private bossHPContainer: HTMLElement;
  private bossHPFill: HTMLElement;
  private pauseButton: HTMLElement;
  private pauseMenu: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.element = this.createHUD();
    this.soldierCountEl = this.element.querySelector('.soldier-count')!;
    this.progressBarFill = this.element.querySelector('.progress-bar-fill')!;
    this.bossHPContainer = this.element.querySelector('.boss-hp-bar')!;
    this.bossHPFill = this.element.querySelector('.boss-hp-fill')!;
    this.pauseButton = this.element.querySelector('.pause-button')!;

    container.appendChild(this.element);
    this.setupPauseButton();
  }

  private createHUD(): HTMLElement {
    const hud = document.createElement('div');
    hud.className = 'hud hidden';
    hud.innerHTML = `
      <div class="soldier-count">${GameConfig.INITIAL_SOLDIER_COUNT}</div>
      <div class="progress-bar">
        <div class="progress-bar-fill" style="width: 0%"></div>
      </div>
      <button class="pause-button" aria-label="Pause"></button>
      <div class="boss-hp-bar">
        <div class="boss-name">BOSS</div>
        <div class="boss-hp-track">
          <div class="boss-hp-fill" style="width: 100%"></div>
        </div>
      </div>
    `;
    return hud;
  }

  private setupPauseButton(): void {
    this.pauseButton.addEventListener('click', () => {
      // Dispatch pause event (handled by Game)
      window.dispatchEvent(new CustomEvent('game:pause'));
    });
  }

  public updateSoldierCount(count: number): void {
    this.soldierCountEl.textContent = count.toString();

    // Animate count change
    this.soldierCountEl.style.transform = 'scale(1.2)';
    setTimeout(() => {
      this.soldierCountEl.style.transform = 'scale(1)';
    }, 100);
  }

  public updateProgress(progress: number): void {
    const percent = Math.min(100, Math.max(0, progress * 100));
    this.progressBarFill.style.width = `${percent}%`;
  }

  public showBossHP(visible: boolean): void {
    if (visible) {
      this.bossHPContainer.classList.add('visible');
    } else {
      this.bossHPContainer.classList.remove('visible');
    }
  }

  public updateBossHP(current: number, max: number): void {
    const percent = Math.max(0, (current / max) * 100);
    this.bossHPFill.style.width = `${percent}%`;
  }

  public showPauseMenu(visible: boolean): void {
    if (visible && !this.pauseMenu) {
      this.pauseMenu = document.createElement('div');
      this.pauseMenu.className = 'pause-menu';
      this.pauseMenu.innerHTML = `
        <h2>PAUSED</h2>
        <button class="menu-button resume-button">RESUME</button>
        <button class="menu-button quit-button">QUIT</button>
      `;

      this.pauseMenu.querySelector('.resume-button')!.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('game:resume'));
        this.showPauseMenu(false);
      });

      this.pauseMenu.querySelector('.quit-button')!.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('game:quit'));
      });

      this.container.appendChild(this.pauseMenu);
    } else if (!visible && this.pauseMenu) {
      this.pauseMenu.remove();
      this.pauseMenu = null;
    }
  }

  public show(): void {
    this.element.classList.remove('hidden');
  }

  public hide(): void {
    this.element.classList.add('hidden');
  }

  public dispose(): void {
    this.element.remove();
    if (this.pauseMenu) {
      this.pauseMenu.remove();
    }
  }
}
