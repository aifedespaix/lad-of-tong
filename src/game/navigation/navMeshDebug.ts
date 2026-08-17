import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import type { Scene } from "@babylonjs/core/scene";
import type { NavMesh, Polygon } from "yuka";

const REGION_COLORS = [
  new Color3(0.9, 0.3, 0.3),
  new Color3(0.3, 0.9, 0.3),
  new Color3(0.3, 0.3, 0.9),
  new Color3(0.9, 0.9, 0.3),
  new Color3(0.9, 0.3, 0.9),
  new Color3(0.3, 0.9, 0.9),
  new Color3(0.9, 0.6, 0.2),
  new Color3(0.6, 0.3, 0.9),
];

export interface NavMeshDebugOverlay {
  toggle(): void;
  dispose(): void;
}

/** Triangulates a convex region's half-edge fan into a colored, non-pickable overlay mesh.
 * Returns null for a not-yet-built region (defensive only — regions produced by
 * NavMesh.fromPolygons always have a fully circular, non-null edge chain). */
function buildRegionMesh(scene: Scene, region: Polygon, index: number): Mesh | null {
  const startEdge = region.edge;
  if (!startEdge) return null;

  const positions: number[] = [region.centroid.x, region.centroid.y + 0.15, region.centroid.z];
  const indices: number[] = [];

  let edge = startEdge;
  let vertexCount = 0;
  do {
    positions.push(edge.vertex.x, edge.vertex.y + 0.15, edge.vertex.z);
    vertexCount++;
    const next = edge.next;
    if (!next) break;
    edge = next;
  } while (edge !== startEdge);

  for (let i = 1; i <= vertexCount; i++) {
    const next = (i % vertexCount) + 1;
    indices.push(0, i, next);
  }

  const mesh = new Mesh(`navMeshRegion_${index}`, scene);
  const vertexData = new VertexData();
  vertexData.positions = positions;
  vertexData.indices = indices;
  vertexData.applyToMesh(mesh, false);

  const material = new StandardMaterial(`navMeshRegionMat_${index}`, scene);
  const color = REGION_COLORS[index % REGION_COLORS.length] ?? Color3.White();
  material.diffuseColor = color;
  material.emissiveColor = color.scale(0.5);
  material.alpha = 0.35;
  material.backFaceCulling = false;
  mesh.material = material;
  mesh.isPickable = false;
  mesh.setEnabled(false);

  return mesh;
}

/**
 * Dev-only overlay: triangulates each NavMesh convex region as a half-edge fan and renders it
 * as a colored, non-pickable mesh slightly above the ground. Used to visually confirm the
 * NavMesh hole at the destructible wall lines up with the rendered wall footprint.
 */
export function createNavMeshDebugOverlay(scene: Scene, navMesh: NavMesh): NavMeshDebugOverlay {
  const regionMeshes: Mesh[] = [];
  navMesh.regions.forEach((region, index) => {
    const mesh = buildRegionMesh(scene, region, index);
    if (mesh) regionMeshes.push(mesh);
  });

  let visible = false;

  return {
    toggle() {
      visible = !visible;
      for (const mesh of regionMeshes) mesh.setEnabled(visible);
    },
    dispose() {
      for (const mesh of regionMeshes) mesh.dispose();
    },
  };
}
