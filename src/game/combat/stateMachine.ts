export type CombatState = "Idle" | "Moving" | "Attacking" | "Casting" | "Dead";

export interface CombatStateInputs {
  isMoving: boolean;
  isAttacking: boolean;
  isCasting: boolean;
  isDead: boolean;
}

/**
 * Pure state derivation, priority order: Dead (terminal) > Casting > Attacking > Moving > Idle.
 * `Casting` has no producer until Milestone 3's spells, but the priority slot is reserved so
 * wiring a spell system later doesn't require touching this ordering.
 */
export function deriveCombatState(inputs: CombatStateInputs): CombatState {
  if (inputs.isDead) return "Dead";
  if (inputs.isCasting) return "Casting";
  if (inputs.isAttacking) return "Attacking";
  if (inputs.isMoving) return "Moving";
  return "Idle";
}
