import { HeroType } from '../types';
import type { HeroConfig } from '../entities/Hero';

export const heroConfigs: HeroConfig[] = [
  {
    type: HeroType.TANK,
    name: 'Guardian',
    stats: {
      health: 200,
      attack: 15,
      attackSpeed: 0.8,
      range: 3,
    },
    skill: {
      name: 'Shield Wall',
      cooldown: 15,
      duration: 5,
    },
    passive: {
      soldierHealthMultiplier: 1.2,
    },
    color: 0x4488ff,
  },
  {
    type: HeroType.DEALER,
    name: 'Striker',
    stats: {
      health: 100,
      attack: 30,
      attackSpeed: 1.5,
      range: 8,
    },
    skill: {
      name: 'Fury',
      cooldown: 12,
      duration: 4,
    },
    passive: {
      soldierDamageMultiplier: 1.3,
      fireRateMultiplier: 1.2,
    },
    color: 0xff4444,
  },
  {
    type: HeroType.SUPPORT,
    name: 'Medic',
    stats: {
      health: 120,
      attack: 10,
      attackSpeed: 1.0,
      range: 5,
    },
    skill: {
      name: 'Rally',
      cooldown: 20,
      duration: 3,
    },
    passive: {
      soldierHealthMultiplier: 1.1,
      soldierDamageMultiplier: 1.1,
    },
    color: 0x44ff44,
  },
];

export function getHeroConfig(type: HeroType): HeroConfig | undefined {
  return heroConfigs.find(h => h.type === type);
}

export function getHeroByName(name: string): HeroConfig | undefined {
  return heroConfigs.find(h => h.name.toLowerCase() === name.toLowerCase());
}
