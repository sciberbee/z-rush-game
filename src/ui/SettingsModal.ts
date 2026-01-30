import { authService } from '../services/AuthService';
import { apiClient } from '../services/ApiClient';
import type { Profile, WeaponType } from '../types/api';

export interface WeaponInfo {
  type: WeaponType;
  name: string;
  description: string;
  icon: string;
}

export const WEAPONS: WeaponInfo[] = [
  { type: 'pistol', name: 'Pistol', description: 'Balanced damage and fire rate', icon: '🔫' },
  { type: 'rifle', name: 'Rifle', description: 'High damage, slower fire rate', icon: '🎯' },
  { type: 'shotgun', name: 'Shotgun', description: 'Spread shot, close range', icon: '💥' },
  { type: 'smg', name: 'SMG', description: 'Fast fire rate, lower damage', icon: '⚡' },
];

export const PRESET_COLORS = [
  '#4a90d9', // Blue
  '#e74c3c', // Red
  '#2ecc71', // Green
  '#f39c12', // Orange
  '#9b59b6', // Purple
  '#1abc9c', // Teal
  '#e91e63', // Pink
  '#ff5722', // Deep Orange
];

export class SettingsModal {
  private element: HTMLElement;
  private overlay: HTMLElement;
  private isOpen = false;
  private currentProfile: Profile | null = null;
  private onSave: ((profile: Profile) => void) | null = null;

  constructor(container: HTMLElement) {
    this.overlay = this.createOverlay();
    this.element = this.createModal();
    container.appendChild(this.overlay);
    container.appendChild(this.element);
  }

  private createOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'settings-overlay hidden';
    overlay.addEventListener('click', () => this.close());
    return overlay;
  }

  private createModal(): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'settings-modal hidden';
    modal.innerHTML = `
      <div class="settings-header">
        <h2>Settings</h2>
        <button class="settings-close-btn">&times;</button>
      </div>
      <div class="settings-content">
        <div class="settings-section">
          <label class="settings-label">Player Name</label>
          <input type="text" class="settings-input player-name-input" maxlength="20" placeholder="Enter your name">
        </div>

        <div class="settings-section">
          <label class="settings-label">Player Color</label>
          <div class="color-picker">
            ${PRESET_COLORS.map(color => `
              <button class="color-option" data-color="${color}" style="background-color: ${color}"></button>
            `).join('')}
          </div>
          <div class="custom-color-row">
            <input type="color" class="custom-color-input" value="#4a90d9">
            <span class="color-value">#4a90d9</span>
          </div>
        </div>

        <div class="settings-section">
          <label class="settings-label">Weapon</label>
          <div class="weapon-selector">
            ${WEAPONS.map(weapon => `
              <button class="weapon-option" data-weapon="${weapon.type}">
                <span class="weapon-icon">${weapon.icon}</span>
                <span class="weapon-name">${weapon.name}</span>
                <span class="weapon-desc">${weapon.description}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
      <div class="settings-footer">
        <button class="settings-btn cancel-btn">Cancel</button>
        <button class="settings-btn save-btn">Save</button>
      </div>
    `;

    // Event listeners
    modal.querySelector('.settings-close-btn')?.addEventListener('click', () => this.close());
    modal.querySelector('.cancel-btn')?.addEventListener('click', () => this.close());
    modal.querySelector('.save-btn')?.addEventListener('click', () => this.save());

    // Color picker
    modal.querySelectorAll('.color-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const color = (btn as HTMLElement).dataset.color;
        if (color) this.selectColor(color);
      });
    });

    // Custom color input
    const customColorInput = modal.querySelector('.custom-color-input') as HTMLInputElement;
    customColorInput?.addEventListener('input', (e) => {
      const color = (e.target as HTMLInputElement).value;
      this.selectColor(color);
    });

    // Weapon selector
    modal.querySelectorAll('.weapon-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const weapon = (btn as HTMLElement).dataset.weapon as WeaponType;
        if (weapon) this.selectWeapon(weapon);
      });
    });

    // Prevent clicks inside modal from closing it
    modal.addEventListener('click', (e) => e.stopPropagation());

    return modal;
  }

  private selectColor(color: string): void {
    // Update color options
    this.element.querySelectorAll('.color-option').forEach(btn => {
      btn.classList.toggle('selected', (btn as HTMLElement).dataset.color === color);
    });

    // Update custom color input and value display
    const customInput = this.element.querySelector('.custom-color-input') as HTMLInputElement;
    const colorValue = this.element.querySelector('.color-value');
    if (customInput) customInput.value = color;
    if (colorValue) colorValue.textContent = color;

    // Store selected color
    if (this.currentProfile) {
      this.currentProfile.playerColor = color;
    }
  }

  private selectWeapon(weapon: WeaponType): void {
    this.element.querySelectorAll('.weapon-option').forEach(btn => {
      btn.classList.toggle('selected', (btn as HTMLElement).dataset.weapon === weapon);
    });

    if (this.currentProfile) {
      this.currentProfile.weaponType = weapon;
    }
  }

  public async open(onSave?: (profile: Profile) => void): Promise<void> {
    if (!authService.isAuthenticated()) {
      alert('Please login to access settings');
      return;
    }

    this.onSave = onSave || null;

    try {
      // Fetch current profile
      const userData = await apiClient.getProfile();
      this.currentProfile = userData.profile || {
        id: '',
        userId: userData.id,
        playerName: userData.displayName,
        playerColor: '#4a90d9',
        weaponType: 'pistol' as WeaponType,
      };

      // Populate form
      const nameInput = this.element.querySelector('.player-name-input') as HTMLInputElement;
      if (nameInput) nameInput.value = this.currentProfile.playerName;

      this.selectColor(this.currentProfile.playerColor);
      this.selectWeapon(this.currentProfile.weaponType);

      // Show modal
      this.overlay.classList.remove('hidden');
      this.element.classList.remove('hidden');
      this.isOpen = true;
    } catch (error) {
      console.error('Failed to load profile:', error);
      alert('Failed to load settings');
    }
  }

  public close(): void {
    this.overlay.classList.add('hidden');
    this.element.classList.add('hidden');
    this.isOpen = false;
  }

  private async save(): Promise<void> {
    if (!this.currentProfile) return;

    const nameInput = this.element.querySelector('.player-name-input') as HTMLInputElement;
    const playerName = nameInput?.value.trim() || this.currentProfile.playerName;

    try {
      const saveBtn = this.element.querySelector('.save-btn') as HTMLButtonElement;
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
      }

      const updatedProfile = await apiClient.updateProfile({
        playerName,
        playerColor: this.currentProfile.playerColor,
        weaponType: this.currentProfile.weaponType,
      });

      this.currentProfile = updatedProfile;

      if (this.onSave) {
        this.onSave(updatedProfile);
      }

      this.close();
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save settings');
    } finally {
      const saveBtn = this.element.querySelector('.save-btn') as HTMLButtonElement;
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save';
      }
    }
  }

  public isVisible(): boolean {
    return this.isOpen;
  }

  public dispose(): void {
    this.overlay.remove();
    this.element.remove();
  }
}
