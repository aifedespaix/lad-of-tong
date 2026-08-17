import { describe, expect, it } from "vitest";
import { createHealth } from "@/game/combat/health";

describe("createHealth", () => {
  it("starts at max HP, alive", () => {
    const health = createHealth(100);
    expect(health.current).toBe(100);
    expect(health.max).toBe(100);
    expect(health.isDead()).toBe(false);
  });

  it("subtracts damage from current HP", () => {
    const health = createHealth(100);
    health.takeDamage(30);
    expect(health.current).toBe(70);
    expect(health.isDead()).toBe(false);
  });

  it("clamps at 0 and reports dead instead of going negative", () => {
    const health = createHealth(100);
    health.takeDamage(150);
    expect(health.current).toBe(0);
    expect(health.isDead()).toBe(true);
  });

  it("stays dead when further damage is applied at 0 HP", () => {
    const health = createHealth(50);
    health.takeDamage(50);
    health.takeDamage(10);
    expect(health.current).toBe(0);
    expect(health.isDead()).toBe(true);
  });
});
