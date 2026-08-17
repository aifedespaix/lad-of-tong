import { describe, expect, it } from "vitest";
import { deriveCombatState } from "@/game/combat/stateMachine";

describe("deriveCombatState", () => {
  it("is Idle when nothing else is happening", () => {
    expect(
      deriveCombatState({ isMoving: false, isAttacking: false, isCasting: false, isDead: false }),
    ).toBe("Idle");
  });

  it("is Moving when only isMoving is set", () => {
    expect(
      deriveCombatState({ isMoving: true, isAttacking: false, isCasting: false, isDead: false }),
    ).toBe("Moving");
  });

  it("prioritizes Attacking over Moving", () => {
    expect(
      deriveCombatState({ isMoving: true, isAttacking: true, isCasting: false, isDead: false }),
    ).toBe("Attacking");
  });

  it("prioritizes Casting over Attacking and Moving", () => {
    expect(
      deriveCombatState({ isMoving: true, isAttacking: true, isCasting: true, isDead: false }),
    ).toBe("Casting");
  });

  it("Dead is terminal, overriding every other flag", () => {
    expect(
      deriveCombatState({ isMoving: true, isAttacking: true, isCasting: true, isDead: true }),
    ).toBe("Dead");
  });
});
