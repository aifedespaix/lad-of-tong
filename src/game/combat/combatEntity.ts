import { createHealth, type HealthComponent } from "@/game/combat/health";
import { HERO_COMBAT_STATS } from "@/game/combat/heroStats";
import { type CombatState, deriveCombatState } from "@/game/combat/stateMachine";
import type { HeroId, HeroMeshHandle } from "@/game/heroes/heroTypes";

export type Team = "blue" | "red";

export interface CombatEntity {
  readonly id: HeroId;
  readonly team: Team;
  readonly mesh: HeroMeshHandle;
  readonly health: HealthComponent;
  readonly collisionRadius: number;
  state: CombatState;
}

export function createCombatEntity(id: HeroId, team: Team, mesh: HeroMeshHandle): CombatEntity {
  const stats = HERO_COMBAT_STATS[id];
  return {
    id,
    team,
    mesh,
    health: createHealth(stats.maxHp),
    collisionRadius: stats.collisionRadius,
    state: "Idle",
  };
}

export interface CombatStateSources {
  isMoving: boolean;
  isAttacking: boolean;
}

/**
 * Re-derives an entity's combat state for the current frame from its live movement/attack status
 * and HP. Returns true only on the single frame the entity transitions into Dead, so callers can
 * react exactly once (death VFX, unregistering it from targeting) instead of every frame after.
 */
export function updateCombatEntityState(
  entity: CombatEntity,
  sources: CombatStateSources,
): boolean {
  const wasDead = entity.state === "Dead";
  entity.state = deriveCombatState({
    isMoving: sources.isMoving,
    isAttacking: sources.isAttacking,
    isCasting: false,
    isDead: entity.health.isDead(),
  });
  return !wasDead && entity.state === "Dead";
}
