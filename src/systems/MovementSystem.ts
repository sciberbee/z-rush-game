import type { System } from '../types';
import { Player } from '../entities/Player';
import { Input } from '../core/Input';

export class MovementSystem implements System {
  private player: Player;
  private input: Input;

  constructor(player: Player, input: Input) {
    this.player = player;
    this.input = input;

    // Connect input to player
    this.input.setHorizontalCallback((value) => {
      this.player.setHorizontalInput(value);
    });
  }

  public update(deltaTime: number): void {
    this.player.update(deltaTime);
  }

  public dispose(): void {
    this.input.dispose();
  }
}
