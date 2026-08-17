import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";
import type { HeroMeshHandle } from "@/game/heroes/heroTypes";

const BODY_SIZE = 2.4;

/** Apex: inverted tetrahedron body (sniper silhouette) with a long thin side-mounted prism. */
export function buildApex(scene: Scene, position: Vector3): HeroMeshHandle {
  const body = MeshBuilder.CreatePolyhedron("apexBody", { type: 0, size: BODY_SIZE }, scene);
  body.position = position.clone();
  body.position.y = BODY_SIZE + 0.5;
  body.rotation.x = Math.PI;

  const bodyMat = new StandardMaterial("apexBodyMat", scene);
  bodyMat.diffuseColor = new Color3(0.82, 0.22, 0.22);
  bodyMat.specularColor = Color3.Black();
  body.material = bodyMat;

  const weapon = MeshBuilder.CreateBox(
    "apexWeapon",
    { width: 0.4, height: 0.4, depth: 4.5 },
    scene,
  );
  weapon.parent = body;
  weapon.position = new Vector3(BODY_SIZE * 0.9, 0, 0);

  const weaponMat = new StandardMaterial("apexWeaponMat", scene);
  weaponMat.diffuseColor = new Color3(0.88, 0.88, 0.9);
  weaponMat.specularColor = Color3.Black();
  weapon.material = weaponMat;

  return { body, weapon };
}
