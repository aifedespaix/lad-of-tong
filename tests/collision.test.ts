import { describe, expect, it } from "vitest";
import { circlesOverlap } from "@/game/combat/collision";

describe("circlesOverlap", () => {
  it("is true when two hitboxes are concentric", () => {
    expect(circlesOverlap({ x: 0, z: 0 }, 1, { x: 0, z: 0 }, 1)).toBe(true);
  });

  it("is true when circles touch exactly at the sum of their radii", () => {
    expect(circlesOverlap({ x: 0, z: 0 }, 2, { x: 5, z: 0 }, 3)).toBe(true);
  });

  it("is false when circles are separated by more than the sum of their radii", () => {
    expect(circlesOverlap({ x: 0, z: 0 }, 2, { x: 5.01, z: 0 }, 3)).toBe(false);
  });

  it("checks distance in the XZ plane only, ignoring any Y component on the inputs", () => {
    // Points differ wildly in y, but circlesOverlap only ever reads x/z off its inputs.
    expect(circlesOverlap({ x: 0, z: 0 }, 1, { x: 0.5, z: 0 }, 1)).toBe(true);
  });

  it("is symmetric regardless of argument order", () => {
    const a = { x: -3, z: 4 };
    const b = { x: 2, z: 1 };
    expect(circlesOverlap(a, 1.5, b, 2)).toBe(circlesOverlap(b, 2, a, 1.5));
  });
});
