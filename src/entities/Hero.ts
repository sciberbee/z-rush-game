import * as THREE from 'three';
import { Entity } from './Entity';
import { HeroType } from '../types';
import type { HeroStats, Skill, PassiveBonus } from '../types';
import { EventBus } from '../core/EventBus';

export interface HeroConfig {
  type: HeroType;
  name: string;
  stats: HeroStats;
  skill: Omit<Skill, 'execute'>;
  passive: PassiveBonus;
  color: number;
}

export class Hero extends Entity {
  public heroType: HeroType;
  public heroName: string;
  public stats: HeroStats;
  public skill: Skill;
  public passive: PassiveBonus;
  private skillCooldownTimer: number = 0;
  private isSkillActive: boolean = false;

  constructor(config: HeroConfig, skillExecute: () => void) {
    const geometry = new THREE.CapsuleGeometry(0.3, 0.8, 4, 8);
    const material = new THREE.MeshLambertMaterial({ color: config.color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.position.y = 0.7;

    super(mesh);

    this.heroType = config.type;
    this.heroName = config.name;
    this.stats = { ...config.stats };
    this.maxHealth = config.stats.health;
    this.health = this.maxHealth;
    this.passive = { ...config.passive };

    this.skill = {
      name: config.skill.name,
      cooldown: config.skill.cooldown,
      duration: config.skill.duration,
      execute: skillExecute,
    };
  }

  public update(deltaTime: number): void {
    if (!this.active) return;

    // Update skill cooldown
    if (this.skillCooldownTimer > 0) {
      this.skillCooldownTimer -= deltaTime;
    }
  }

  public canUseSkill(): boolean {
    return this.skillCooldownTimer <= 0 && !this.isSkillActive;
  }

  public useSkill(): void {
    if (!this.canUseSkill()) return;

    this.isSkillActive = true;
    this.skill.execute();

    EventBus.emit('HERO_SKILL_USED', {
      hero: this.heroName,
      skill: this.skill.name,
    });

    // If skill has duration, deactivate after duration
    if (this.skill.duration) {
      setTimeout(() => {
        this.isSkillActive = false;
        this.skillCooldownTimer = this.skill.cooldown;
      }, this.skill.duration * 1000);
    } else {
      this.isSkillActive = false;
      this.skillCooldownTimer = this.skill.cooldown;
    }
  }

  public getSkillCooldownPercent(): number {
    if (this.skillCooldownTimer <= 0) return 0;
    return this.skillCooldownTimer / this.skill.cooldown;
  }

  public reset(): void {
    super.reset();
    this.skillCooldownTimer = 0;
    this.isSkillActive = false;
  }
}
