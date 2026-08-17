# Milestone 2 — Local Combat System

Corresponds to [ARCHITECTURE.md](./ARCHITECTURE.md) §8 Phase 3. Client-local only — no
networking yet (that's Milestone 4). Builds directly on Milestone 1's scaffold; read
[ROADMAP.md](./ROADMAP.md)'s "what's already built" section first.

## Goal

Give entities HP, a state machine, and a working ranged attack (projectile → collision → damage
→ death), testable end-to-end in the browser without needing minions or networking yet.

## Scope

1. **Entity state machine**: `Idle`, `Moving`, `Attacking`, `Casting`, `Dead`. Applies to heroes
   (all 3, not just the controlled one — Brutus and Aura become the initial test targets for
   attacks, standing in for real enemies until Milestone 3 adds minions). Suggested location:
   `src/game/combat/stateMachine.ts`, keyed off the existing `HeroMeshHandle` /
   `HeroMovementController` from Milestone 1 rather than replacing them — the state machine reads
   movement state (e.g. "is the Yuka vehicle still following a path") to drive `Idle`↔`Moving`.
2. **HP component**: current/max HP per entity, a `takeDamage(amount)` method, and a `Dead` state
   transition at 0 HP (see ARCHITECTURE.md §7.2 for the health-bar UI this eventually feeds —
   HUD widgets are Milestone 3+, not required for this milestone's verification).
3. **Targeting via right-click on an enemy** (ARCHITECTURE.md §7.1): extend
   `src/game/input/pointerInput.ts`'s right-click handler to pick against hero meshes too (not
   only the ground); if the pick hits an attackable entity, move into attack range instead of a
   raw ground point, then auto-attack on a loop while the target is in range and alive.
4. **Projectile system**: reusable, not hero-specific. Use Babylon `Mesh.createInstance()` /
   thin instances for the projectile visuals (ARCHITECTURE.md §2 calls out Instanced Meshes for
   performance — relevant once minions add many simultaneous shooters in Milestone 3, so build
   the instancing approach now rather than retrofitting it). A projectile is: spawn position,
   direction/target, speed, damage, owner (for friendly-fire rules later). Suggested location:
   `src/game/combat/projectile.ts` (spawn/update/pool) — advance projectiles in the same
   `scene.onBeforeRenderObservable` tick `bootstrap.ts` already uses for the entity manager.
5. **Collision detection**: per-frame distance/bounding check between live projectiles and
   candidate targets (`AbstractMesh.intersectsMesh` or a simpler squared-distance check against
   each entity's collision radius — the latter is cheaper and sufficient for simple geometric
   hitboxes at this scale). On hit: apply damage, dispose/pool the projectile.
6. **Apex's auto-attack** as the first concrete attack to wire end-to-end (ARCHITECTURE.md §6.1):
   fires a thin, fast cylinder projectile at the targeted enemy. This is the one to get fully
   working; Brutus/Aura's spec'd auto-attacks (melee cleave, weak homing orbs) can follow the
   same pattern once Apex's is verified, but aren't required to finish this milestone.

## Explicitly out of scope

Hero spells (A/B/C — Milestone 3), minions/structures as real combat participants (Milestone 3),
mana/cooldowns UI, HUD health bars as actual UI (a debug/placeholder indicator, e.g. a console
log or a simple non-styled DOM readout, is enough to verify HP is tracked correctly), networking.

## Verification

- `bun run dev`, right-click Brutus or Aura as the controlled Apex hero: Apex moves into range,
  auto-attacks fire visible projectiles, target's HP decreases, target reaches `Dead` state at 0
  HP (disable or visually mark the mesh — no need for a death animation).
- Multiple simultaneous projectiles in flight don't leak meshes (check the instance/pool count
  doesn't grow unbounded after repeated attacks — a quick `scene.meshes.length` check before/after
  a burst of attacks is enough).
- `bun run typecheck && bun run lint && bun run test` all pass; add a unit test for the pure
  collision-check function (distance-based hit test) analogous to `tests/navMeshBuilder.test.ts`.
