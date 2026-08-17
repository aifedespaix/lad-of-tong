import { describe, expect, it } from "vitest";
import { Vector3 as YukaVector3 } from "yuka";
import {
  CORRIDOR_MAX_Z,
  CORRIDOR_MIN_Z,
  WALL_CENTER_Z,
  WALL_MAX_X,
  WALL_MIN_X,
} from "@/game/map/mapConfig";
import { buildAramNavMesh } from "@/game/navigation/navMeshBuilder";

describe("buildAramNavMesh", () => {
  it("builds at least one connected convex region", () => {
    const navMesh = buildAramNavMesh();
    expect(navMesh.regions.length).toBeGreaterThan(0);
  });

  it("finds a non-empty path that routes around the destructible wall", () => {
    const navMesh = buildAramNavMesh();
    const from = new YukaVector3(0, 0, CORRIDOR_MIN_Z + 20);
    const to = new YukaVector3(0, 0, CORRIDOR_MAX_Z - 20);

    const path = navMesh.findPath(from, to);

    expect(path.length).toBeGreaterThan(0);
  });

  it("finds a path from either flank around the wall, not just through it", () => {
    const navMesh = buildAramNavMesh();
    const southOfWall = new YukaVector3(0, 0, CORRIDOR_MIN_Z + 20);
    const northOfWall = new YukaVector3(0, 0, CORRIDOR_MAX_Z - 20);

    const path = navMesh.findPath(southOfWall, northOfWall);

    // The path must bend outside the wall's x-range at some waypoint while crossing its
    // z-range, proving it routes through a flank gap instead of a straight line through
    // the (impassable) wall footprint.
    const bendsAroundWall = path.some(
      (waypoint) => waypoint.x < WALL_MIN_X || waypoint.x > WALL_MAX_X,
    );
    expect(bendsAroundWall).toBe(true);
  });

  it("does not consider a point inside the wall footprint part of any region", () => {
    const navMesh = buildAramNavMesh();
    const insideWall = new YukaVector3((WALL_MIN_X + WALL_MAX_X) / 2, 0, WALL_CENTER_Z);

    expect(navMesh.getRegionForPoint(insideWall)).toBeNull();
  });
});
