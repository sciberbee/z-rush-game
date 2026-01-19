import nipplejs from 'nipplejs';
import { GameConfig } from '../config/GameConfig';

export type InputCallback = (horizontalValue: number) => void;

export class Input {
  private joystick: nipplejs.JoystickManager | null = null;
  private onHorizontalChange: InputCallback | null = null;
  private currentHorizontalValue: number = 0;
  private keyboardState: { left: boolean; right: boolean } = { left: false, right: false };
  private isTouchDevice: boolean;

  constructor() {
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (this.isTouchDevice) {
      this.setupTouchControls();
    }
    this.setupKeyboardControls();
  }

  private setupTouchControls(): void {
    // Create joystick zone
    const joystickZone = document.createElement('div');
    joystickZone.className = 'joystick-zone';
    document.getElementById('ui-container')?.appendChild(joystickZone);

    this.joystick = nipplejs.create({
      zone: joystickZone,
      mode: 'semi',
      catchDistance: 150,
      color: 'rgba(255, 255, 255, 0.5)',
      size: GameConfig.JOYSTICK_SIZE,
      position: { left: '50%', top: '50%' },
      dynamicPage: true,
    });

    this.joystick.on('move', (_evt, data) => {
      if (data.vector) {
        // Only use horizontal component
        this.currentHorizontalValue = data.vector.x;
        this.notifyChange();
      }
    });

    this.joystick.on('end', () => {
      this.currentHorizontalValue = 0;
      this.notifyChange();
    });
  }

  private setupKeyboardControls(): void {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.keyboardState.left = true;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.keyboardState.right = true;
        break;
    }
    this.updateKeyboardInput();
  }

  private handleKeyUp(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.keyboardState.left = false;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.keyboardState.right = false;
        break;
    }
    this.updateKeyboardInput();
  }

  private updateKeyboardInput(): void {
    // Don't override touch input
    if (this.isTouchDevice && this.joystick) {
      return;
    }

    let value = 0;
    if (this.keyboardState.left) value -= 1;
    if (this.keyboardState.right) value += 1;

    this.currentHorizontalValue = value;
    this.notifyChange();
  }

  private notifyChange(): void {
    if (this.onHorizontalChange) {
      this.onHorizontalChange(this.currentHorizontalValue);
    }
  }

  public setHorizontalCallback(callback: InputCallback): void {
    this.onHorizontalChange = callback;
  }

  public getHorizontalValue(): number {
    return this.currentHorizontalValue;
  }

  public dispose(): void {
    if (this.joystick) {
      this.joystick.destroy();
    }
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
  }
}
