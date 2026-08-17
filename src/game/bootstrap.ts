import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { EntityManager } from "yuka";
import { createAutoAttackController } from "@/game/combat/autoAttackController";
import {
  type CombatEntity,
  createCombatEntity,
  updateCombatEntityState,
} from "@/game/combat/combatEntity";
import { createHpDebugOverlay } from "@/game/combat/hpDebugOverlay";
import { createProjectileSystem } from "@/game/combat/projectile";
import { createFollowCamera } from "@/game/core/camera";
import { createEngine } from "@/game/core/engine";
import { createScene } from "@/game/core/scene";
import { createHeroMovementController } from "@/game/hero-controller/heroMovementController";
import { createHeroMesh } from "@/game/heroes/heroFactory";
import type { HeroId, HeroMeshHandle } from "@/game/heroes/heroTypes";
import { registerRightClickCommand } from "@/game/input/pointerInput";
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

  // Brutus/Aura stand in for real enemies until Milestone 3 adds minions (milestone-2-combat.md).
  const combatEntities: Record<HeroId, CombatEntity> = {
    apex: createCombatEntity("apex", "blue", heroMeshes.apex),
    brutus: createCombatEntity("brutus", "red", heroMeshes.brutus),
    aura: createCombatEntity("aura", "red", heroMeshes.aura),
  };
  const allCombatEntities = Object.values(combatEntities);

  const controlledHero = heroMeshes[CONTROLLED_HERO_ID];
  const controlledEntity = combatEntities[CONTROLLED_HERO_ID];

  const attackableEntitiesByMesh = new Map<AbstractMesh, CombatEntity>();
  for (const entity of allCombatEntities) {
    if (entity.id === CONTROLLED_HERO_ID) continue;
    attackableEntitiesByMesh.set(entity.mesh.body, entity);
  }

  const navMesh = buildAramNavMesh();
  const navMeshDebug = createNavMeshDebugOverlay(scene, navMesh);

  const entityManager = new EntityManager();
  const controller = createHeroMovementController(navMesh, controlledHero.body);
  entityManager.add(controller.vehicle);

  const projectiles = createProjectileSystem(scene);
  const autoAttack = createAutoAttackController(controlledEntity, controller, projectiles);

  createFollowCamera(scene, controlledHero.body);

  const unregisterInput = registerRightClickCommand(scene, ground, attackableEntitiesByMesh, {
    onGroundClick: (point) => {
      autoAttack.setTarget(null);
      controller.moveTo(point);
    },
    onEntityClick: (entity) => {
      autoAttack.setTarget(entity);
    },
  });

  const hpDebugOverlay = createHpDebugOverlay(document.body);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.code === NAVMESH_DEBUG_KEY) navMeshDebug.toggle();
  };
  window.addEventListener("keydown", handleKeyDown);

  function handleEntityDeath(entity: CombatEntity): void {
    entity.mesh.body.setEnabled(false);
    attackableEntitiesByMesh.delete(entity.mesh.body);
    console.log(`[combat] ${entity.id} has died`);
  }

  const renderObserver = scene.onBeforeRenderObservable.add(() => {
    const deltaSeconds = engine.getDeltaTime() / 1000;
    entityManager.update(deltaSeconds);
    controller.syncMesh();
    autoAttack.update(deltaSeconds);
    projectiles.update(deltaSeconds, allCombatEntities);

    for (const entity of allCombatEntities) {
      const isControlled = entity.id === CONTROLLED_HERO_ID;
      const justDied = updateCombatEntityState(entity, {
        isMoving: isControlled && controller.isMoving(),
        isAttacking: isControlled && autoAttack.isAttacking,
      });
      if (justDied) handleEntityDeath(entity);
    }

    hpDebugOverlay.update(allCombatEntities);
    for (const hero of Object.values(heroMeshes)) hero.update?.(deltaSeconds);
  });

  engine.runRenderLoop(() => scene.render());

  function dispose(): void {
    window.removeEventListener("keydown", handleKeyDown);
    unregisterInput();
    scene.onBeforeRenderObservable.remove(renderObserver);
    hpDebugOverlay.dispose();
    projectiles.dispose();
    navMeshDebug.dispose();
    engine.stopRenderLoop();
    scene.dispose();
    engine.dispose();
  }

  return { dispose };
}
