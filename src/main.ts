import './style.css';
import { Game } from './core/Game';
import { UIManager } from './ui/UIManager';

// Global game instance
let game: Game | null = null;
let uiManager: UIManager | null = null;

async function main(): Promise<void> {
  const gameContainer = document.getElementById('game-container');

  if (!gameContainer) {
    console.error('Game container not found');
    return;
  }

  // Create and initialize game
  game = new Game(gameContainer);

  try {
    await game.init();

    // Initialize UI Manager
    uiManager = new UIManager(game);

    // Set up game control events
    window.addEventListener('game:pause', () => game?.pause());
    window.addEventListener('game:resume', () => game?.resume());
    window.addEventListener('game:quit', () => {
      game?.dispose();
      game = new Game(gameContainer);
      game.init().then(() => {
        uiManager?.dispose();
        uiManager = new UIManager(game!);
      });
    });
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
}

// Handle visibility change (pause when tab is hidden)
document.addEventListener('visibilitychange', () => {
  if (!game) return;

  if (document.hidden && game.getState() === 'PLAYING') {
    game.pause();
  }
});

// Prevent default touch behaviors
document.addEventListener('touchmove', (e) => {
  if (e.target instanceof HTMLCanvasElement) {
    e.preventDefault();
  }
}, { passive: false });

// Start the game
main();
