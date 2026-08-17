# Roadmap

Full spec: [ARCHITECTURE.md](./ARCHITECTURE.md). The 5 phases it lists in section 8 are
condensed here into 4 milestones — each milestone doc is self-contained enough to hand to a
fresh session as a standalone prompt (link the doc, or paste its content).

| # | Milestone | Doc | Status |
|---|---|---|---|
| 1 | Foundation, rendering & local pathfinding (Phases 1+2) | *(this repo's initial scaffold — see below)* | **Done** |
| 2 | Local combat system (Phase 3) | [milestone-2-combat.md](./milestone-2-combat.md) | Not started |
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

## Sizing note

Milestone 2 is the next reasonable session-sized unit. Milestones 3 and 4 are each large enough
that a session may only get through part of one — if so, update this table's Status column
(`Not started` → `In progress` → `Done`) and leave a short note in the relevant milestone doc
about what's left, so the next session doesn't have to rediscover it.
