import { FollowCamera } from "@babylonjs/core/Cameras/followCamera";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";

export function createFollowCamera(scene: Scene, target: AbstractMesh): FollowCamera {
  const camera = new FollowCamera("followCamera", target.position.clone(), scene);
  camera.lockedTarget = target;
  camera.radius = 45;
  camera.heightOffset = 35;
  camera.rotationOffset = 180;
  camera.cameraAcceleration = 0.05;
  camera.maxCameraSpeed = 20;
  camera.attachControl(true);
  scene.activeCamera = camera;

  return camera;
}
