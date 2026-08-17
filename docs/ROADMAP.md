# Roadmap

Full spec: [ARCHITECTURE.md](./ARCHITECTURE.md). The 5 phases it lists in section 8 are
condensed here into 4 milestones — each milestone doc is self-contained enough to hand to a
fresh session as a standalone prompt (link the doc, or paste its content).

| # | Milestone | Doc | Status |
|---|---|---|---|
| 1 | Foundation, rendering & local pathfinding (Phases 1+2) | *(this repo's initial scaffold — see below)* | **Done** |
| 2 | Local combat system (Phase 3) | [milestone-2-combat.md](./milestone-2-combat.md) | **Done** |
| 3 | Advanced systems: spells, minions, structures (Phase 4) | [milestone-3-advanced-systems.md](./milestone-3-advanced-systems.md) | Not started |
| 4 | Network architecture (Phase 5) | [milestone-4-networking.md](./milestone-4-networking.md) | Not started |

## Milestone 1 — what's already built

Bun + Vite + SolidJS + TypeScript + Babylon.js + Yuka.js scaffold. Concretely:

- Babylon.js scene with a flat ARAM corridor ground (`src/game/map/aramCorridor.ts`, 100×500
  units, see `mapConfig.ts` for every boundary constant) and a static destructible-wall mesh
  blocking the center third of the lane (`src/game/map/destructibleWall.ts`) — HP is stored but
  inert, no destruction logic yet.
- The 3 heroes (Apex, Brutus, Aura) as geometric placeholder meshes with their spec'd silhouettes
  (`src/game/heroes/visuals/`). No HP/Mana/stats/spells yet.
- A `FollowCamera` locked onto the controlled hero (`CONTROLLED_HERO_ID` in `mapConfig.ts`,
  defaults to Apex).
- A hand-authored Yuka `NavMesh` with a hole at the wall's footprint
  (`src/game/navigation/navMeshBuilder.ts`, unit-tested in `tests/navMeshBuilder.test.ts`), plus
  a dev-only debug overlay toggled with the `N` key (`navMeshDebug.ts`).
- Right-click-to-move on the controlled hero only: raycast → NavMesh path → Yuka
  `Vehicle`/`FollowPathBehavior` steering, synced back onto the Babylon mesh every frame
  (`src/game/input/pointerInput.ts`, `src/game/hero-controller/`, `src/game/navigation/yukaSync.ts`).
- Orchestration + lifecycle: `src/game/bootstrap.ts`, mounted from Solid's `GameCanvas.tsx` via
  `onMount`/`onCleanup` (`game/**` has zero Solid imports — the render loop lives entirely
  outside Solid's reactive graph).

Run it: `bun install && bun run dev`. Checks: `bun run typecheck`, `bun run lint`, `bun run test`,
`bun run build`.

**Known non-goals carried forward, not bugs:** only one hero is controllable/networked (the
others are static props); the wall never breaks; heroes have no stats, health, or combat; Brutus'
body is a sharp-edged box (Babylon core has no beveled-box primitive — art-pass detail, not
blocking).

## Milestone 2 — what's already built

Client-local combat on top of Milestone 1's scaffold (see `milestone-2-combat.md` for the
original scope). Concretely:

- HP component (`src/game/combat/health.ts`) and a pure `Idle/Moving/Attacking/Casting/Dead`
  state derivation (`src/game/combat/stateMachine.ts`, unit-tested) wired onto each hero via
  `CombatEntity` (`src/game/combat/combatEntity.ts`) — `Casting` has no producer yet (spells are
  Milestone 3), the priority slot is just reserved.
- All 3 heroes now have HP/collision-radius/auto-attack stats
  (`src/game/combat/heroStats.ts`, placeholder numbers, real balancing deferred per
  ARCHITECTURE.md §6). Brutus and Aura are the initial "enemy" test dummies (`team: "red"` vs
  Apex's `"blue"`), per the milestone doc's suggestion — they don't move or fight back yet.
- Right-click-on-enemy targeting: `src/game/input/pointerInput.ts`'s `registerRightClickCommand`
  now picks against both the ground and any registered attackable entity mesh and dispatches
  accordingly; `src/game/combat/autoAttackController.ts` drives "move into range, then stop and
  fire on a cooldown loop while the target is in range and alive" for the controlled hero.
- Pooled projectile system on Babylon `InstancedMesh` (`src/game/combat/projectile.ts`, fixed-size
  pool, round-robin reuse — no unbounded `scene.meshes` growth) with XZ-plane
  distance-based collision (`src/game/combat/collision.ts`, the same primitive doubles as the
  attack-range check, unit-tested).
- Apex's auto-attack (thin cylinder projectile) is the one fully wired end-to-end per the
  milestone doc; Brutus/Aura's auto-attack stats exist but aren't fired by anything yet.
- A plain-DOM (non-Solid) HP/state debug readout, top-left of the page
  (`src/game/combat/hpDebugOverlay.ts`) — the real HUD health bars are still Milestone 3+.
- `heroMovementController.ts` gained `stop()` (cancels path + zeroes velocity) and `isMoving()`
  (speed-based, feeds the state machine) alongside the existing `moveTo()`.

**Known non-goals carried forward, not bugs:** Brutus/Aura are stationary and never attack back;
`Casting` state is unreachable (no spells yet); the destructible wall is still inert (Milestone
3.1); no HUD health bars yet (Milestone 3.5, debug DOM readout stands in for now).

## Sizing note

Milestone 3 is the next unit, and it's the largest remaining one — its own doc already splits it
into 4 independently-completable chunks (3.1–3.4) plus the HUD (3.5). A session may only get
through part of it; if so, update this table's Status column (`Not started` → `In progress` →
`Done`) and leave a short note in `milestone-3-advanced-systems.md` about what's left, so the next
session doesn't have to rediscover it. Milestone 4 is likewise large — same practice applies.
