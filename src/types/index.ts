import * as THREE from 'three';

// === Game States ===
export type GameState = 'LOADING' | 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY';

// === System Interface ===
export interface System {
  update(deltaTime: number): void;
  dispose(): void;
}

// === Entity Related ===
export interface EntityConfig {
  position: THREE.Vector3;
  rotation?: THREE.Euler;
  scale?: THREE.Vector3;
}

export interface EnemyConfig extends EntityConfig {
  type: 'zombie' | 'runner' | 'tank' | 'boss';
  health: number;
  damage: number;
  speed: number;
}

// === Gate Operations ===
export const GateOperation = {
  ADD: '+',
  SUBTRACT: '-',
  MULTIPLY: 'x',
  DIVIDE: '/',
} as const;
export type GateOperation = typeof GateOperation[keyof typeof GateOperation];

// === Level/Wave Configuration ===
export interface WaveConfig {
  triggerZ: number;
  enemies: EnemySpawnData[];
  gatesAfter?: GateSpawnData;
}

export interface EnemySpawnData {
  type: EnemyConfig['type'];
  count: number;
  formation: 'line' | 'v-shape' | 'scattered';
}

export interface GateSpawnData {
  left: { operation: GateOperation; value: number };
  right: { operation: GateOperation; value: number };
}

export interface LevelConfig {
  name: string;
  length: number;
  waves: WaveConfig[];
  boss?: EnemyConfig & { triggerZ: number };
}

// === Hero Related ===
export const HeroType = {
  TANK: 'tank',
  DEALER: 'dealer',
  SUPPORT: 'support',
} as const;
export type HeroType = typeof HeroType[keyof typeof HeroType];

export interface HeroStats {
  health: number;
  attack: number;
  attackSpeed: number;
  range: number;
}

export interface Skill {
  name: string;
  cooldown: number;
  duration?: number;
  execute: () => void;
}

export interface PassiveBonus {
  soldierDamageMultiplier?: number;
  soldierHealthMultiplier?: number;
  fireRateMultiplier?: number;
}

// === Events ===
export type GameEventType =
  | 'SOLDIER_COUNT_CHANGED'
  | 'ENEMY_KILLED'
  | 'BOSS_SPAWNED'
  | 'WAVE_COMPLETED'
  | 'GATE_PASSED'
  | 'HERO_SKILL_USED'
  | 'GAME_STATE_CHANGED'
  | 'PLAYER_DIED'
  | 'PLAY_SFX'
  | 'PLAY_BGM'
  | 'STOP_BGM';

export interface GameEvent {
  type: GameEventType;
  data?: unknown;
}

export type EventCallback = (event: GameEvent) => void;

// === Poolable Interface ===
export interface Poolable {
  active: boolean;
  reset(): void;
}
