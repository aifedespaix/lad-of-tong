export type HeroId = "apex" | "brutus" | "aura";

export interface HeroMeshHandle {
  /** Root mesh of the hero. Always a concrete Mesh (never a bare TransformNode) so it can be
   * passed directly as a Babylon FollowCamera lockedTarget and as a Yuka movement sync target. */
  body: import("@babylonjs/core/Meshes/mesh").Mesh;
  weapon: import("@babylonjs/core/Meshes/mesh").Mesh;
  /** Optional per-frame visual hook (e.g. Aura's spinning torus). */
  update?: (deltaSeconds: number) => void;
}
