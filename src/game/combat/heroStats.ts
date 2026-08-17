import type { HeroId } from "@/game/heroes/heroTypes";

export interface AutoAttackStats {
  damage: number;
  /** Attack range, measured from the attacker's center to the target hitbox's edge. */
  range: number;
  /** Seconds between auto-attacks. */
  interval: number;
  projectileSpeed: number;
}

export interface HeroCombatStats {
  maxHp: number;
  /** Horizontal (XZ) collision radius, used for attack-range and projectile-hit checks. */
  collisionRadius: number;
  autoAttack: AutoAttackStats;
}

/**
 * Placeholder values — ARCHITECTURE.md §6 defers real balancing ("équilibrées itérativement").
 * Only Apex's auto-attack is wired end-to-end this milestone (see milestone-2-combat.md); Brutus'
 * melee cleave and Aura's homing orbs keep their stats here for when Milestone 3+ wires them up.
 */
export const HERO_COMBAT_STATS: Record<HeroId, HeroCombatStats> = {
  apex: {
    maxHp: 400,
    collisionRadius: 2,
    autoAttack: { damage: 40, range: 20, interval: 0.75, projectileSpeed: 60 },
  },
  brutus: {
    maxHp: 750,
    collisionRadius: 2.6,
    autoAttack: { damage: 25, range: 5, interval: 1.5, projectileSpeed: 0 },
  },
  aura: {
    maxHp: 480,
    collisionRadius: 2,
    autoAttack: { damage: 18, range: 18, interval: 1, projectileSpeed: 45 },
  },
};
