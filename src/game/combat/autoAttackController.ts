import { circlesOverlap } from "@/game/combat/collision";
import type { CombatEntity } from "@/game/combat/combatEntity";
import { HERO_COMBAT_STATS } from "@/game/combat/heroStats";
import type { ProjectileSystem } from "@/game/combat/projectile";
import type { HeroMovementController } from "@/game/hero-controller/heroMovementController";

export interface AutoAttackController {
  /** Acquires (or clears, via `null`) the entity to move into range of and auto-attack. */
  setTarget(target: CombatEntity | null): void;
  readonly isAttacking: boolean;
  update(deltaSeconds: number): void;
}

/**
 * Right-click-on-enemy → move-into-range → auto-attack-on-a-loop, per ARCHITECTURE.md §7.1.
 * Movement is delegated to the hero's existing `HeroMovementController`; this controller only
 * decides *when* to path toward the target vs. stop and fire.
 */
export function createAutoAttackController(
  self: CombatEntity,
  movement: HeroMovementController,
  projectiles: ProjectileSystem,
): AutoAttackController {
  const stats = HERO_COMBAT_STATS[self.id].autoAttack;
  let target: CombatEntity | null = null;
  let cooldown = 0;
  let isAttacking = false;

  function inRangeOf(candidate: CombatEntity): boolean {
    return circlesOverlap(
      self.mesh.body.position,
      stats.range,
      candidate.mesh.body.position,
      candidate.collisionRadius,
    );
  }

  function setTarget(next: CombatEntity | null): void {
    target = next;
    isAttacking = false;
    if (target && !inRangeOf(target)) movement.moveTo(target.mesh.body.position);
  }

  function fire(): void {
    if (!target) return;
    projectiles.spawn({
      origin: self.mesh.body.position.clone(),
      target: target.mesh.body.position.clone(),
      speed: stats.projectileSpeed,
      damage: stats.damage,
      owner: self,
    });
  }

  function update(deltaSeconds: number): void {
    if (self.health.isDead() || !target || target.health.isDead()) {
      target = null;
      isAttacking = false;
      return;
    }

    if (!inRangeOf(target)) {
      isAttacking = false;
      if (!movement.isMoving()) movement.moveTo(target.mesh.body.position);
      return;
    }

    movement.stop();
    isAttacking = true;
    cooldown -= deltaSeconds;
    if (cooldown <= 0) {
      fire();
      cooldown = stats.interval;
    }
  }

  return {
    setTarget,
    get isAttacking() {
      return isAttacking;
    },
    update,
  };
}
