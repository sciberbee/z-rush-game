import * as THREE from 'three';
import { GateOperation } from '../types';
import type { LevelConfig } from '../types';
import { GameConfig } from './GameConfig';

export const levels: LevelConfig[] = [
  {
    name: 'Tutorial',
    length: 150,
    waves: [
      {
        triggerZ: 20,
        enemies: [{ type: 'zombie', count: 2, formation: 'line' }],
        gatesAfter: {
          left: { operation: GateOperation.ADD, value: 3 },
          right: { operation: GateOperation.ADD, value: 5 },
        },
      },
      {
        triggerZ: 60,
        enemies: [{ type: 'zombie', count: 4, formation: 'line' }],
        gatesAfter: {
          left: { operation: GateOperation.MULTIPLY, value: 2 },
          right: { operation: GateOperation.ADD, value: 3 },
        },
      },
      {
        triggerZ: 100,
        enemies: [{ type: 'zombie', count: 6, formation: 'v-shape' }],
      },
    ],
  },
  {
    name: 'The Horde',
    length: 300,
    waves: [
      {
        triggerZ: 20,
        enemies: [{ type: 'zombie', count: 5, formation: 'line' }],
        gatesAfter: {
          left: { operation: GateOperation.ADD, value: 5 },
          right: { operation: GateOperation.MULTIPLY, value: 2 },
        },
      },
      {
        triggerZ: 60,
        enemies: [{ type: 'zombie', count: 8, formation: 'v-shape' }],
        gatesAfter: {
          left: { operation: GateOperation.SUBTRACT, value: 3 },
          right: { operation: GateOperation.ADD, value: 10 },
        },
      },
      {
        triggerZ: 100,
        enemies: [{ type: 'zombie', count: 10, formation: 'scattered' }],
        gatesAfter: {
          left: { operation: GateOperation.MULTIPLY, value: 2 },
          right: { operation: GateOperation.DIVIDE, value: 2 },
        },
      },
      {
        triggerZ: 150,
        enemies: [{ type: 'zombie', count: 15, formation: 'line' }],
        gatesAfter: {
          left: { operation: GateOperation.ADD, value: 20 },
          right: { operation: GateOperation.MULTIPLY, value: 3 },
        },
      },
      {
        triggerZ: 200,
        enemies: [{ type: 'zombie', count: 20, formation: 'scattered' }],
      },
    ],
    boss: {
      type: 'boss',
      triggerZ: 250,
      position: new THREE.Vector3(0, 1.5, 280),
      health: GameConfig.ZOMBIE_HEALTH * GameConfig.BOSS_HEALTH_MULTIPLIER,
      damage: GameConfig.ZOMBIE_DAMAGE * GameConfig.BOSS_DAMAGE_MULTIPLIER,
      speed: GameConfig.ZOMBIE_SPEED * 0.5,
    },
  },
  {
    name: 'Apocalypse',
    length: 400,
    waves: [
      {
        triggerZ: 30,
        enemies: [{ type: 'zombie', count: 10, formation: 'v-shape' }],
        gatesAfter: {
          left: { operation: GateOperation.MULTIPLY, value: 2 },
          right: { operation: GateOperation.ADD, value: 8 },
        },
      },
      {
        triggerZ: 80,
        enemies: [
          { type: 'zombie', count: 8, formation: 'line' },
          { type: 'zombie', count: 5, formation: 'scattered' },
        ],
        gatesAfter: {
          left: { operation: GateOperation.ADD, value: 15 },
          right: { operation: GateOperation.SUBTRACT, value: 5 },
        },
      },
      {
        triggerZ: 140,
        enemies: [{ type: 'zombie', count: 20, formation: 'scattered' }],
        gatesAfter: {
          left: { operation: GateOperation.DIVIDE, value: 2 },
          right: { operation: GateOperation.MULTIPLY, value: 3 },
        },
      },
      {
        triggerZ: 200,
        enemies: [{ type: 'zombie', count: 25, formation: 'v-shape' }],
        gatesAfter: {
          left: { operation: GateOperation.MULTIPLY, value: 2 },
          right: { operation: GateOperation.ADD, value: 30 },
        },
      },
      {
        triggerZ: 280,
        enemies: [{ type: 'zombie', count: 30, formation: 'scattered' }],
      },
    ],
    boss: {
      type: 'boss',
      triggerZ: 350,
      position: new THREE.Vector3(0, 1.5, 380),
      health: GameConfig.ZOMBIE_HEALTH * GameConfig.BOSS_HEALTH_MULTIPLIER * 2,
      damage: GameConfig.ZOMBIE_DAMAGE * GameConfig.BOSS_DAMAGE_MULTIPLIER * 1.5,
      speed: GameConfig.ZOMBIE_SPEED * 0.7,
    },
  },
];

export function getLevel(index: number): LevelConfig {
  return levels[Math.min(index, levels.length - 1)];
}
