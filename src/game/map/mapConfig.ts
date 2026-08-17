import type { HeroId } from "@/game/heroes/heroTypes";

/**
 * Single source of truth for all ARAM corridor geometry. Both the rendered wall mesh
 * (destructibleWall.ts) and the NavMesh hole (navMeshBuilder.ts) must read their boundary
 * coordinates from here — Yuka's polygon-neighbor detection requires bit-for-bit identical
 * shared vertices, so never re-derive these numbers elsewhere.
 */

export const CORRIDOR_WIDTH = 100; // x extent
export const CORRIDOR_LENGTH = 500; // z extent

export const CORRIDOR_MIN_X = -CORRIDOR_WIDTH / 2;
export const CORRIDOR_MAX_X = CORRIDOR_WIDTH / 2;
export const CORRIDOR_MIN_Z = -CORRIDOR_LENGTH / 2;
export const CORRIDOR_MAX_Z = CORRIDOR_LENGTH / 2;

/** Destructible wall footprint: blocks only the center third of the lane, leaving two
 * flanking gaps wide enough to path around. */
export const WALL_MIN_X = -15;
export const WALL_MAX_X = 15;
export const WALL_MIN_Z = -155;
export const WALL_MAX_Z = -145;
export const WALL_CENTER_Z = (WALL_MIN_Z + WALL_MAX_Z) / 2;
export const WALL_HEIGHT = 4;
export const WALL_HP_STUB = 500;

export interface Spawn {
  x: number;
  z: number;
}

export const HERO_SPAWNS: Record<HeroId, Spawn> = {
  apex: { x: -8, z: CORRIDOR_MIN_Z + 30 },
  brutus: { x: 0, z: CORRIDOR_MIN_Z + 30 },
  aura: { x: 8, z: CORRIDOR_MIN_Z + 30 },
};

export const CONTROLLED_HERO_ID: HeroId = "apex";
