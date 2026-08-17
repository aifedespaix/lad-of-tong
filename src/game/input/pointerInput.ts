import "@babylonjs/core/Culling/ray";

import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";
import type { CombatEntity } from "@/game/combat/combatEntity";

const RIGHT_MOUSE_BUTTON = 2;

export interface RightClickHandlers {
  /** Right-click on the ground: issue a normal move-to-point command. */
  onGroundClick: (point: Vector3) => void;
  /** Right-click on a registered attackable entity: acquire it as an attack target. */
  onEntityClick: (entity: CombatEntity) => void;
}

/**
 * Right-click-to-move/attack: raycasts against the ground mesh and any registered attackable
 * entity meshes, and dispatches to the matching handler (ARCHITECTURE.md §7.1). Also suppresses
 * the OS/browser context menu on the canvas so a right-click doesn't pop up a menu instead of
 * issuing a command.
 *
 * Side-effect import note: `scene.pick` silently returns no hits unless `Culling/ray`'s runtime
 * side effects (`RegisterRay`) have been imported somewhere in the app — Babylon's granular
 * per-submodule imports don't pull this in automatically.
 *
 * @return an unregister function.
 */
export function registerRightClickCommand(
  scene: Scene,
  groundMesh: AbstractMesh,
  attackableEntitiesByMesh: ReadonlyMap<AbstractMesh, CombatEntity>,
  handlers: RightClickHandlers,
): () => void {
  const canvas = scene.getEngine().getRenderingCanvas();
  const contextMenuHandler = (event: Event) => event.preventDefault();
  canvas?.addEventListener("contextmenu", contextMenuHandler);

  const observer = scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type !== PointerEventTypes.POINTERDOWN) return;
    if (pointerInfo.event.button !== RIGHT_MOUSE_BUTTON) return;

    const pickInfo = scene.pick(
      scene.pointerX,
      scene.pointerY,
      (mesh) => mesh === groundMesh || attackableEntitiesByMesh.has(mesh),
    );
    if (!pickInfo?.hit || !pickInfo.pickedMesh) return;

    const entity = attackableEntitiesByMesh.get(pickInfo.pickedMesh);
    if (entity) {
      handlers.onEntityClick(entity);
    } else if (pickInfo.pickedMesh === groundMesh && pickInfo.pickedPoint) {
      handlers.onGroundClick(pickInfo.pickedPoint);
    }
  });

  return () => {
    scene.onPointerObservable.remove(observer);
    canvas?.removeEventListener("contextmenu", contextMenuHandler);
  };
}
