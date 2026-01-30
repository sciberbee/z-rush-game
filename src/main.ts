import './style.css';
import { Game } from './core/Game';
import { UIManager } from './ui/UIManager';
import { authService } from './services/AuthService';
import { syncService } from './services/SyncService';

// Global game instance
let game: Game | null = null;
let uiManager: UIManager | null = null;

function handleOAuthCallback(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.has('accessToken')) {
    const success = authService.handleOAuthCallback(params);
    // Clear the URL parameters and redirect to root
    window.history.replaceState({}, '', '/');
    return success;
  }
  // Also check if we're on /auth/callback path (backend redirects here)
  if (window.location.pathname === '/auth/callback') {
    window.history.replaceState({}, '', '/');
  }
  return false;
}

async function main(): Promise<void> {
  const gameContainer = document.getElementById('game-container');

  if (!gameContainer) {
    console.error('Game container not found');
    return;
  }

  // Handle OAuth callback if present
  handleOAuthCallback();

  // Load user data if authenticated
  if (authService.isAuthenticated()) {
    await syncService.loadUserData();
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
