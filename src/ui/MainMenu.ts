export class MainMenu {
  private element: HTMLElement;
  private onStart: () => void;

  constructor(container: HTMLElement, onStart: () => void) {
    this.onStart = onStart;
    this.element = this.createMenu();
    container.appendChild(this.element);
  }

  private createMenu(): HTMLElement {
    const menu = document.createElement('div');
    menu.className = 'menu';
    menu.innerHTML = `
      <h1>Z-RUSH</h1>
      <button class="menu-button start-button">START</button>
    `;

    const startButton = menu.querySelector('.start-button')!;
    startButton.addEventListener('click', () => {
      this.onStart();
    });

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

  public show(): void {
    this.element.classList.remove('hidden');
  }

  public hide(): void {
    this.element.classList.add('hidden');
  }

  public dispose(): void {
    this.element.remove();
  }
}
