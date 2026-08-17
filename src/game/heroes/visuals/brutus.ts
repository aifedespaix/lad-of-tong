import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";
import type { HeroMeshHandle } from "@/game/heroes/heroTypes";

const BODY_SIZE = 3.6;

/**
 * Brutus: stocky cube body with a huge rectangular-prism hammer in front.
 * Note: Babylon core has no native beveled/rounded-box primitive, so "beveled edges" from the
 * spec is deferred as an art-pass detail (see docs/milestone-3-advanced-systems.md) — this
 * milestone uses a plain sharp-edged box.
 */
export function buildBrutus(scene: Scene, position: Vector3): HeroMeshHandle {
  const body = MeshBuilder.CreateBox(
    "brutusBody",
    { width: BODY_SIZE, height: BODY_SIZE * 0.85, depth: BODY_SIZE },
    scene,
  );
  body.position = position.clone();
  body.position.y = (BODY_SIZE * 0.85) / 2 + 0.5;

  const bodyMat = new StandardMaterial("brutusBodyMat", scene);
  bodyMat.diffuseColor = new Color3(0.3, 0.35, 0.45);
  bodyMat.specularColor = Color3.Black();
  body.material = bodyMat;

  const weapon = MeshBuilder.CreateBox(
    "brutusWeapon",
    { width: BODY_SIZE * 0.55, height: BODY_SIZE * 0.5, depth: BODY_SIZE * 1.3 },
    scene,
  );
  weapon.parent = body;
  weapon.position = new Vector3(0, 0, BODY_SIZE * 0.85);

  const weaponMat = new StandardMaterial("brutusWeaponMat", scene);
  weaponMat.diffuseColor = new Color3(0.5, 0.42, 0.3);
  weaponMat.specularColor = Color3.Black();
  weapon.material = weaponMat;

  return { body, weapon };
}
