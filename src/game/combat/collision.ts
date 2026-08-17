export interface GroundPoint {
  x: number;
  z: number;
}

/**
 * XZ-plane (ground) distance-based hit test: true when two circular hitboxes overlap. Used for
 * both projectile-vs-entity collision and attack-range checks (range is just a hitbox radius
 * around the attacker) — cheaper than `AbstractMesh.intersectsMesh` and sufficient for this
 * project's simple geometric hitboxes.
 */
export function circlesOverlap(
  a: GroundPoint,
  aRadius: number,
  b: GroundPoint,
  bRadius: number,
): boolean {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  const radiusSum = aRadius + bRadius;
  return dx * dx + dz * dz <= radiusSum * radiusSum;
}
