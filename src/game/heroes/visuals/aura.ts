import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";
import type { HeroMeshHandle } from "@/game/heroes/heroTypes";

const BODY_DIAMETER = 2.8;
const SPIN_SPEED = 1.4; // radians / second

/** Aura: floating sphere body with a rotating luminous torus ring. */
export function buildAura(scene: Scene, position: Vector3): HeroMeshHandle {
  const body = MeshBuilder.CreateSphere("auraBody", { diameter: BODY_DIAMETER }, scene);
  body.position = position.clone();
  body.position.y = BODY_DIAMETER / 2 + 1.2;

  const bodyMat = new StandardMaterial("auraBodyMat", scene);
  bodyMat.diffuseColor = new Color3(0.85, 0.85, 0.95);
  bodyMat.emissiveColor = new Color3(0.15, 0.2, 0.3);
  bodyMat.specularColor = Color3.Black();
  body.material = bodyMat;

  const weapon = MeshBuilder.CreateTorus(
    "auraWeapon",
    { diameter: BODY_DIAMETER * 1.5, thickness: 0.3 },
    scene,
  );
  weapon.parent = body;

  const weaponMat = new StandardMaterial("auraWeaponMat", scene);
  weaponMat.diffuseColor = new Color3(0.3, 0.75, 0.9);
  weaponMat.emissiveColor = new Color3(0.2, 0.55, 0.7);
  weaponMat.specularColor = Color3.Black();
  weapon.material = weaponMat;

  const update = (deltaSeconds: number) => {
    // Rotate about a non-symmetry axis (X) so the ring visibly tumbles rather than
    // spinning invisibly about its own axis of symmetry (Y).
    weapon.rotation.x += SPIN_SPEED * deltaSeconds;
  };

  return { body, weapon, update };
}
