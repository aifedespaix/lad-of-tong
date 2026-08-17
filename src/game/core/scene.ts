import type { Engine } from "@babylonjs/core/Engines/engine";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";

export function createScene(engine: Engine): Scene {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.04, 0.05, 0.08, 1);

  const hemi = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.7;
  hemi.diffuse = new Color3(0.85, 0.9, 1);

  const sun = new DirectionalLight("sunLight", new Vector3(-0.5, -1, 0.4), scene);
  sun.intensity = 0.9;
  sun.position = new Vector3(0, 80, -40);

  return scene;
}
