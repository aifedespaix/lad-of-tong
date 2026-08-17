import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";
import {
  WALL_HEIGHT,
  WALL_HP_STUB,
  WALL_MAX_X,
  WALL_MAX_Z,
  WALL_MIN_X,
  WALL_MIN_Z,
} from "@/game/map/mapConfig";

export interface WallFootprint {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface DestructibleWall {
  mesh: Mesh;
  hp: number;
  footprint: WallFootprint;
}

const BLOCK_COLUMNS = 5;
const BLOCK_ROWS = 3;
const BLOCK_GAP = 0.3;

/**
 * Builds the destructible wall as an assembly of flat rectangular blocks merged into a single
 * mesh. HP is tracked but inert this milestone — destruction and NavMesh updates are deferred
 * (see docs/milestone-3-advanced-systems.md).
 */
export function buildDestructibleWall(scene: Scene): DestructibleWall {
  const footprint: WallFootprint = {
    minX: WALL_MIN_X,
    maxX: WALL_MAX_X,
    minZ: WALL_MIN_Z,
    maxZ: WALL_MAX_Z,
  };

  const totalWidth = footprint.maxX - footprint.minX;
  const totalDepth = footprint.maxZ - footprint.minZ;
  const blockWidth = (totalWidth - BLOCK_GAP * (BLOCK_COLUMNS - 1)) / BLOCK_COLUMNS;
  const blockDepth = totalDepth * 0.8;
  const blockHeightStep = WALL_HEIGHT / BLOCK_ROWS;

  const material = new StandardMaterial("destructibleWallMat", scene);
  material.diffuseColor = new Color3(0.45, 0.42, 0.38);
  material.specularColor = Color3.Black();

  const blocks: Mesh[] = [];
  for (let row = 0; row < BLOCK_ROWS; row++) {
    for (let col = 0; col < BLOCK_COLUMNS; col++) {
      const block = MeshBuilder.CreateBox(
        `wallBlock_${row}_${col}`,
        { width: blockWidth, height: blockHeightStep * 0.9, depth: blockDepth },
        scene,
      );
      const centerX = footprint.minX + blockWidth / 2 + col * (blockWidth + BLOCK_GAP);
      const centerZ = (footprint.minZ + footprint.maxZ) / 2;
      const centerY = blockHeightStep / 2 + row * blockHeightStep;
      block.position = new Vector3(centerX, centerY, centerZ);
      block.material = material;
      blocks.push(block);
    }
  }

  const merged = Mesh.MergeMeshes(blocks, true, true, undefined, false, false);
  if (!merged) {
    throw new Error("Failed to merge destructible wall blocks");
  }
  merged.name = "destructibleWall";
  merged.isPickable = true;

  return { mesh: merged, hp: WALL_HP_STUB, footprint };
}
