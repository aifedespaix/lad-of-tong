# Milestone 3 — Advanced Systems: Spells, Minions & Structures

Corresponds to [ARCHITECTURE.md](./ARCHITECTURE.md) §8 Phase 4. This is the largest remaining
milestone — treat the four sub-sections below as independently completable chunks, in the
suggested order (each depends on the previous one's foundations, except Wall Destruction which
can be done any time after Milestone 1). If a session only finishes part of this file, update
[ROADMAP.md](./ROADMAP.md)'s status and leave a note in this file about what's left.

Requires Milestone 2 (combat system: HP, state machine, projectiles, collision) as a foundation.

## 3.1 Wall destruction & NavMesh update

Closes the gap deliberately left open in Milestone 1
(`src/game/map/destructibleWall.ts`'s `hp` field is currently inert). ARCHITECTURE.md §4.1.4:

- Wire the wall into Milestone 2's HP/damage system so it can actually take damage and reach 0.
- On destruction: remove/hide the wall mesh, and **rebuild the NavMesh** with the center cell
  (currently omitted in `src/game/navigation/navMeshBuilder.ts`) included — i.e. call
  `buildAramNavMesh()` again with a "wall destroyed" flag that adds the 9th grid cell, rather
  than trying to mutate the existing `YUKA.NavMesh` in place. Any in-flight
  `FollowPathBehavior` paths computed against the old NavMesh should be recomputed after the
  swap (the controller in `src/game/hero-controller/heroMovementController.ts` already recomputes
  the whole path on every `moveTo()` call — cheapest fix is just triggering a fresh `moveTo` at
  the hero's current pending destination, if any, after the swap).

## 3.2 Hero spells

ARCHITECTURE.md §6 has full specs for all 9 spells (3 heroes × A/B/C) plus §7.1's input model
(key + mouse cursor direction/position, "Smart Cast"). Suggested structure: a `Spell` base
concept with `cooldown`, `cast(caster, targetPointOrDirection)`, sharing the projectile/collision
primitives from Milestone 2 where applicable (e.g. Apex's Piercing Ray and Cone of Shards are
both instant-hit shape queries against nearby entities, not traveling projectiles — a different
primitive than Milestone 2's projectiles, worth its own `spellHit.ts`-style shape-query helper).
Recommended order: **Apex's 3 spells first** (only Apex is controlled/tested so far), matching
Milestone 2's precedent of getting one hero fully working before generalizing to the other two.
Input wiring: extend the keyboard handling already started in `bootstrap.ts` (currently only used
for the `N` navmesh-debug toggle) using `KeyboardEvent.code` per ARCHITECTURE.md §7.1 — add A/B/C
(or Q/W/E-equivalent by physical position) bindings that read the current mouse world position
(reuse the ground-raycast pattern from `pointerInput.ts`) for targeted/directional spells.

## 3.3 Minion waves

ARCHITECTURE.md §5.1. A spawner (every 30s, at each team's Idol position) creating a wave (3
melee + 1 mage + 3 ranged) that advances along waypoints toward the enemy base, using Yuka
steering — this reuses Milestone 1's NavMesh/pathfinding and Milestone 2's combat primitives
directly, it's mostly composition of existing pieces plus:

- Targeting-priority logic (enemy minions > enemy heroes > structures) — a small utility function
  minions and (later) structures both call, not duplicated per unit type.
- The 3 minion visual types (`Cube`+triangle / `Cylinder`+cylinder / inverted-`Cone`+sphere) as a
  new `src/game/minions/` sibling to `src/game/heroes/`, following the same
  factory-per-visual-type pattern established in `heroFactory.ts` / `heroes/visuals/`.
- **Team/faction concept doesn't exist yet** (Milestone 1-2 only ever had one controlled hero
  with no enemies) — this is the first milestone that needs it. Keep it minimal: an entity gets a
  `team: "blue" | "red"` field: this determines targeting eligibility and eventually rendering
  (blue/red team colors mentioned throughout ARCHITECTURE.md §4).

## 3.4 Structures: Idol, Forts, Outer Towers

ARCHITECTURE.md §4.1.1–4.1.3. Each is: a static mesh (Octahedron / Cylinder / rectangular Prism)
+ HP (Milestone 2's system) + an attack behavior (nearest-enemy targeting, reusing 3.3's priority
logic) + the Fort's extra "Vulnerability" debuff (damage-taken multiplier for 2s, a small buff/
debuff system worth generalizing since Brutus's spells and other future heroes will want the
same mechanism for stuns/slows). Needs the team concept from §3.3.

## 3.5 HUD (ARCHITECTURE.md §7.2)

Now that entities have HP/mana/cooldowns worth displaying, build out `src/ui/HudRoot.tsx`
(currently an empty placeholder `<div>`): health bars above entities (billboard-projected from
world space to screen space — Babylon's `Vector3.Project`), the bottom HUD (portrait, HP/mana
bars, spell cooldown radials), and ground-projected targeting indicators for spell aim (Babylon
Decals or a semi-transparent ground-plane mesh, per §7.2's suggestion). This is Solid-authored UI
reading from the game state each frame — keep the read direction one-way (`game/**` stays
Solid-free per Milestone 1's architecture; expose a small subscribable state snapshot from
`bootstrap.ts` instead of importing Solid signals into `game/**`).

## Explicitly out of scope

Networking (Milestone 4) — everything above stays client-local/single-player-feeling, even
though multiple "enemy" entities now exist.

## Verification

- Destroying the wall opens a path through its former footprint (verify via the `N` debug
  overlay from Milestone 1 — the center cell should now render as a navigable region).
- Each implemented hero spell visibly fires and applies its effect (damage, stun, dash, etc.) —
  spot-check against ARCHITECTURE.md §6's per-spell description.
- A minion wave spawns, advances, fights, and dies/kills according to the targeting priority.
- Structures attack and can be destroyed.
- `bun run typecheck && bun run lint && bun run test` pass; extend the test suite with pure-logic
  unit tests (targeting priority, buff/debuff math, NavMesh-with-wall-removed connectivity) the
  same way `tests/navMeshBuilder.test.ts` covers Milestone 1's NavMesh.
