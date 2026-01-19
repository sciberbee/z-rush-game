export class GameOver {
  private element: HTMLElement;
  private titleEl: HTMLElement;
  private onRestart: () => void;

  constructor(container: HTMLElement, onRestart: () => void) {
    this.onRestart = onRestart;
    this.element = this.createScreen();
    this.titleEl = this.element.querySelector('h1')!;
    container.appendChild(this.element);
  }

  private createScreen(): HTMLElement {
    const screen = document.createElement('div');
    screen.className = 'game-over-screen hidden';
    screen.innerHTML = `
      <h1>GAME OVER</h1>
      <button class="menu-button restart-button">RETRY</button>
      <button class="menu-button menu-button-secondary">MAIN MENU</button>
    `;

    screen.querySelector('.restart-button')!.addEventListener('click', () => {
      this.onRestart();
    });

    screen.querySelector('.menu-button-secondary')!.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('game:quit'));
    });

    return screen;
  }

  public show(isVictory: boolean): void {
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
  }

  public hide(): void {
    this.element.classList.add('hidden');
  }

  public dispose(): void {
    this.element.remove();
  }
}
