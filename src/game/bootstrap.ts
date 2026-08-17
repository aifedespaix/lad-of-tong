import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { EntityManager } from "yuka";
import { createFollowCamera } from "@/game/core/camera";
import { createEngine } from "@/game/core/engine";
import { createScene } from "@/game/core/scene";
import { createHeroMovementController } from "@/game/hero-controller/heroMovementController";
import { createHeroMesh } from "@/game/heroes/heroFactory";
import type { HeroId, HeroMeshHandle } from "@/game/heroes/heroTypes";
import { registerRightClickMove } from "@/game/input/pointerInput";
import { buildCorridorGround } from "@/game/map/aramCorridor";
import { buildDestructibleWall } from "@/game/map/destructibleWall";
import { CONTROLLED_HERO_ID, HERO_SPAWNS } from "@/game/map/mapConfig";
import { buildAramNavMesh } from "@/game/navigation/navMeshBuilder";
import { createNavMeshDebugOverlay } from "@/game/navigation/navMeshDebug";

export interface GameHandle {
  dispose(): void;
}

/** KeyboardEvent.code (layout-independent) that toggles the NavMesh debug overlay. */
const NAVMESH_DEBUG_KEY = "KeyN";

export function bootstrapGame(canvas: HTMLCanvasElement): GameHandle {
  const engine = createEngine(canvas);
  const scene = createScene(engine);

  const ground = buildCorridorGround(scene);
  buildDestructibleWall(scene);

  const heroMeshes: Record<HeroId, HeroMeshHandle> = {
    apex: createHeroMesh(scene, "apex", new Vector3(HERO_SPAWNS.apex.x, 0, HERO_SPAWNS.apex.z)),
    brutus: createHeroMesh(
      scene,
      "brutus",
      new Vector3(HERO_SPAWNS.brutus.x, 0, HERO_SPAWNS.brutus.z),
    ),
    aura: createHeroMesh(scene, "aura", new Vector3(HERO_SPAWNS.aura.x, 0, HERO_SPAWNS.aura.z)),
  };

  const controlledHero = heroMeshes[CONTROLLED_HERO_ID];

  const navMesh = buildAramNavMesh();
  const navMeshDebug = createNavMeshDebugOverlay(scene, navMesh);

  const entityManager = new EntityManager();
  const controller = createHeroMovementController(navMesh, controlledHero.body);
  entityManager.add(controller.vehicle);

  createFollowCamera(scene, controlledHero.body);

  const unregisterInput = registerRightClickMove(scene, ground, (point) => {
    controller.moveTo(point);
  });

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.code === NAVMESH_DEBUG_KEY) navMeshDebug.toggle();
  };
  window.addEventListener("keydown", handleKeyDown);

  const renderObserver = scene.onBeforeRenderObservable.add(() => {
    const deltaSeconds = engine.getDeltaTime() / 1000;
    entityManager.update(deltaSeconds);
    controller.syncMesh();
    for (const hero of Object.values(heroMeshes)) hero.update?.(deltaSeconds);
  });

  engine.runRenderLoop(() => scene.render());

  function dispose(): void {
    window.removeEventListener("keydown", handleKeyDown);
    unregisterInput();
    scene.onBeforeRenderObservable.remove(renderObserver);
    navMeshDebug.dispose();
    engine.stopRenderLoop();
    scene.dispose();
    engine.dispose();
  }

  return { dispose };
}
