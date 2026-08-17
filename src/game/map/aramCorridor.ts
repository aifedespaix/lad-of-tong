import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";
import { CORRIDOR_LENGTH, CORRIDOR_WIDTH } from "@/game/map/mapConfig";

export function buildCorridorGround(scene: Scene): Mesh {
  const ground = MeshBuilder.CreateGround(
    "corridorGround",
    { width: CORRIDOR_WIDTH, height: CORRIDOR_LENGTH },
    scene,
  );

  const material = new StandardMaterial("corridorGroundMat", scene);
  material.diffuseColor = new Color3(0.16, 0.18, 0.22);
  material.specularColor = Color3.Black();
  ground.material = material;
  ground.isPickable = true;
  ground.receiveShadows = true;

  return ground;
}
