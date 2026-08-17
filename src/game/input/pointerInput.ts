import "@babylonjs/core/Culling/ray";

import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";

const RIGHT_MOUSE_BUTTON = 2;

/**
 * Right-click-to-move: raycasts strictly against the ground mesh and invokes the callback with
 * the picked world point. Also suppresses the OS/browser context menu on the canvas so a
 * right-click doesn't pop up a menu instead of issuing a move command.
 *
 * Side-effect import note: `scene.pick` silently returns no hits unless `Culling/ray`'s runtime
 * side effects (`RegisterRay`) have been imported somewhere in the app — Babylon's granular
 * per-submodule imports don't pull this in automatically.
 *
 * @return an unregister function.
 */
export function registerRightClickMove(
  scene: Scene,
  groundMesh: AbstractMesh,
  onGroundRightClick: (point: Vector3) => void,
): () => void {
  const canvas = scene.getEngine().getRenderingCanvas();
  const contextMenuHandler = (event: Event) => event.preventDefault();
  canvas?.addEventListener("contextmenu", contextMenuHandler);

  const observer = scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type !== PointerEventTypes.POINTERDOWN) return;
    if (pointerInfo.event.button !== RIGHT_MOUSE_BUTTON) return;

    const pickInfo = scene.pick(scene.pointerX, scene.pointerY, (mesh) => mesh === groundMesh);
    if (pickInfo?.hit && pickInfo.pickedPoint) {
      onGroundRightClick(pickInfo.pickedPoint);
    }
  });

  return () => {
    scene.onPointerObservable.remove(observer);
    canvas?.removeEventListener("contextmenu", contextMenuHandler);
  };
}
