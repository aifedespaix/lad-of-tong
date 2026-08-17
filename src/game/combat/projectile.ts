// Side-effect import: registers Mesh.prototype.createInstance. Babylon's granular
// per-submodule imports don't pull this in automatically (same pitfall as `scene.pick`'s
// Culling/ray side effect noted in pointerInput.ts) — a type-only import of InstancedMesh below
// would get erased and silently drop this, so it's a plain import.
import "@babylonjs/core/Meshes/instancedMesh";

import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";
import { circlesOverlap } from "@/game/combat/collision";
import type { CombatEntity } from "@/game/combat/combatEntity";

/** Fixed pool size: generous for a 1-attacker POC, reused (never grown) across bursts of fire. */
const POOL_SIZE = 32;
const PROJECTILE_RADIUS = 0.3;
/** Longer than the corridor so a straight shot that misses despawns instead of flying forever. */
const MAX_TRAVEL_DISTANCE = 260;

export interface ProjectileSpawnOptions {
  origin: Vector3;
  target: Vector3;
  speed: number;
  damage: number;
  owner: CombatEntity;
}

export interface ProjectileSystem {
  spawn(options: ProjectileSpawnOptions): void;
  /** Advances all in-flight projectiles and resolves hits against candidate entities. */
  update(deltaSeconds: number, candidates: readonly CombatEntity[]): void;
  dispose(): void;
}

interface ProjectileSlot {
  instance: InstancedMesh;
  active: boolean;
  direction: Vector3;
  speed: number;
  damage: number;
  owner: CombatEntity | null;
  traveled: number;
}

/** A thin, elongated cylinder — Apex's "Cylindre étiré" sniper shot (ARCHITECTURE.md §6.1). */
function buildProjectileTemplate(scene: Scene): Mesh {
  const template = MeshBuilder.CreateCylinder(
    "projectileTemplate",
    { diameter: 0.3, height: 3, tessellation: 6 },
    scene,
  );

  const material = new StandardMaterial("projectileMat", scene);
  material.diffuseColor = new Color3(1, 0.85, 0.3);
  material.emissiveColor = new Color3(0.6, 0.45, 0.1);
  material.specularColor = Color3.Black();
  template.material = material;

  // Only the pooled instances below are ever rendered — hide the source mesh's own draw.
  template.isVisible = false;
  template.isPickable = false;

  return template;
}

export function createProjectileSystem(scene: Scene): ProjectileSystem {
  const template = buildProjectileTemplate(scene);

  const slots: ProjectileSlot[] = Array.from({ length: POOL_SIZE }, (_, index) => {
    const instance = template.createInstance(`projectile_${index}`);
    instance.isPickable = false;
    instance.setEnabled(false);
    return {
      instance,
      active: false,
      direction: new Vector3(0, 0, 1),
      speed: 0,
      damage: 0,
      owner: null,
      traveled: 0,
    };
  });

  let nextSlotIndex = 0;

  function deactivate(slot: ProjectileSlot): void {
    slot.active = false;
    slot.owner = null;
    slot.instance.setEnabled(false);
  }

  function spawn(options: ProjectileSpawnOptions): void {
    // Round-robin over the pool: if 32 shots are simultaneously in flight (not expected at this
    // milestone's scale) the oldest one is reclaimed rather than dropping the new shot.
    const slot = slots[nextSlotIndex];
    nextSlotIndex = (nextSlotIndex + 1) % slots.length;
    if (!slot) return; // unreachable: nextSlotIndex is always kept within [0, slots.length)

    const direction = options.target.subtract(options.origin);
    if (direction.lengthSquared() < 1e-6) direction.set(0, 0, 1);
    direction.normalize();

    slot.active = true;
    slot.direction = direction;
    slot.speed = options.speed;
    slot.damage = options.damage;
    slot.owner = options.owner;
    slot.traveled = 0;

    slot.instance.position.copyFrom(options.origin);
    slot.instance.rotationQuaternion = Quaternion.FromUnitVectorsToRef(
      Vector3.Up(),
      direction,
      new Quaternion(),
    );
    slot.instance.setEnabled(true);
  }

  function update(deltaSeconds: number, candidates: readonly CombatEntity[]): void {
    for (const slot of slots) {
      if (!slot.active || !slot.owner) continue;
      const owner = slot.owner;

      const step = slot.speed * deltaSeconds;
      slot.instance.position.addInPlace(slot.direction.scale(step));
      slot.traveled += step;

      if (slot.traveled >= MAX_TRAVEL_DISTANCE) {
        deactivate(slot);
        continue;
      }

      const hit = candidates.find(
        (candidate) =>
          candidate.team !== owner.team &&
          !candidate.health.isDead() &&
          circlesOverlap(
            slot.instance.position,
            PROJECTILE_RADIUS,
            candidate.mesh.body.position,
            candidate.collisionRadius,
          ),
      );

      if (hit) {
        hit.health.takeDamage(slot.damage);
        deactivate(slot);
      }
    }
  }

  function dispose(): void {
    for (const slot of slots) slot.instance.dispose();
    template.dispose();
  }

  return { spawn, update, dispose };
}
