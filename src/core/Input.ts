export type InputCallback = (horizontalValue: number) => void;

export class Input {
  private onHorizontalChange: InputCallback | null = null;
  private currentHorizontalValue: number = 0;
  private keyboardState: { left: boolean; right: boolean } = { left: false, right: false };
  private isTouchDevice: boolean;

  // Touch handling
  private touchStartX: number = 0;
  private isTouching: boolean = false;
  private readonly TOUCH_SENSITIVITY = 100; // Pixels to reach full speed

  constructor() {
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (this.isTouchDevice) {
      this.setupTouchControls();
    }
    this.setupKeyboardControls();
  }

  private setupTouchControls(): void {
    const container = document.getElementById('game-container') || document.body;

    container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    container.addEventListener('touchend', this.handleTouchEnd.bind(this));
    container.addEventListener('touchcancel', this.handleTouchEnd.bind(this));
  }

  private handleTouchStart(evt: TouchEvent): void {
    // Prevent default to avoid scrolling/zooming while playing
    if (evt.cancelable) evt.preventDefault();
    
    this.isTouching = true;
    this.touchStartX = evt.touches[0].clientX;
  }

  private handleTouchMove(evt: TouchEvent): void {
    if (!this.isTouching) return;
    if (evt.cancelable) evt.preventDefault();

    const currentX = evt.touches[0].clientX;
    const deltaX = currentX - this.touchStartX;

    // Calculate normalized value [-1, 1]
    // Invert direction for swipe: swiping left (negative delta) should move left (negative value)
    // Wait, let's check current logic. 
    // deltaX = current - start. Swipe Left: deltaX is negative. Control value should be negative?
    // User asked to INVERT. Current: deltaX / SENS. Swipe Left -> Negative Value -> Move Left.
    // User said "swipe is reversed". Maybe they want Swipe Left -> Move Right? Or Swipe Left -> Move Left?
    // Usually Swipe Left -> Move Left (camera/soldiers move left).
    // If user says "swipe is reversed", maybe currently Swipe Left moves Right?
    // Let's look at Input usage. Horizontal value -1 is left?
    // Input.ts: updateKeyboardInput: left -> value -= 1. So -1 is Left.
    // deltaX (Left) is negative. So Swipe Left -> Negative Value -> Move Left.
    // That seems correct "physically".
    // If user wants inverted: Swipe Left -> Move Right.
    // So negate the result.
    let normalized = -(deltaX / this.TOUCH_SENSITIVITY);
    
    // Clamp values
    if (normalized > 1) normalized = 1;
    if (normalized < -1) normalized = -1;

    // Apply deadzone if needed, or just set it
    this.currentHorizontalValue = normalized;
    this.notifyChange();
    
    // Optional: Reset start X to dragging feels like "pulling" the stick, 
    // OR keep it absolute relative to start point. 
    // Current implementation: Relative to start point (joystick-like).
    // To make it "follow finger" style, we might want to reset touchStartX, 
    // but for "control speed", typically joystick-style (hold to move) is better.
  }

  private handleTouchEnd(_evt: TouchEvent): void {
    this.isTouching = false;
    this.currentHorizontalValue = 0;
    this.notifyChange();
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
    // Don't override touch input if user is actively touching
    if (this.isTouching) {
      return;
    }

    let value = 0;
    if (this.keyboardState.left) value += 1;  // Inverted: Left key moves Right (+)
    if (this.keyboardState.right) value -= 1; // Inverted: Right key moves Left (-)

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
    const container = document.getElementById('game-container') || document.body;
    container.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    container.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    container.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    container.removeEventListener('touchcancel', this.handleTouchEnd.bind(this));

    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
  }
}
