import { Quaternion as BabylonQuaternion } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { GameEntity } from "yuka";

/** Copies a YUKA entity's simulated position/orientation onto its Babylon mesh counterpart. */
export function syncMeshFromYuka(entity: GameEntity, mesh: AbstractMesh): void {
  mesh.position.set(entity.position.x, entity.position.y, entity.position.z);

  if (!mesh.rotationQuaternion) {
    mesh.rotationQuaternion = new BabylonQuaternion();
  }
  mesh.rotationQuaternion.set(
    entity.rotation.x,
    entity.rotation.y,
    entity.rotation.z,
    entity.rotation.w,
  );
}
