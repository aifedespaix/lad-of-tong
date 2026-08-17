# Milestone 4 — Network Architecture

Corresponds to [ARCHITECTURE.md](./ARCHITECTURE.md) §2 (networking stack), §3 (host-authoritative
model), §8 Phase 5. The largest, riskiest remaining milestone — "le gros morceau" per the
original spec. Requires Milestones 1-3's gameplay to exist locally first; this milestone's job is
making that gameplay run across multiple browsers with one host as the authority.

## Precondition: decouple simulation from rendering

Milestones 1-3 build gameplay directly against Babylon meshes (e.g.
`heroMovementController.ts`'s `Vehicle` writes straight onto a `Mesh` via `syncMeshFromYuka`).
That's correct for a single-player-feeling local client, but a host-authoritative model needs a
**pure simulation layer that runs identically whether or not a renderer is attached** — the host
runs it standalone (no need to render other players' screens), clients run a thin predicted copy
of just their own hero. Before adding any networking code, refactor so `src/game/**`'s combat/
movement/AI logic can run against plain state objects (position, HP, cooldowns — no Babylon
`Mesh` references), with a separate sync layer translating that state onto Babylon meshes for
whichever entities a given client actually renders. This is a structural refactor, not new
gameplay — budget real time for it before the network code itself.

## Scope

1. **Signaling server**: a minimal Bun server (ARCHITECTURE.md §2 suggests Socket.io or
   uWebSockets) whose only job is exchanging WebRTC connection offers/answers between players so
   they can establish direct P2P `RTCDataChannel`s — it does not run any game logic and is not in
   the hot path once P2P connections are up.
2. **P2P data channels**: PeerJS or Geckos.io per ARCHITECTURE.md §2, for low-latency
   host↔client messaging (inputs upstream, snapshots downstream).
3. **Host authority loop**: the pure simulation layer from the precondition above, advanced on a
   fixed tick (20-30Hz per ARCHITECTURE.md §3.1) — this is what actually runs minion AI, resolves
   damage, checks NavMesh-based movement validity, and owns entity lifecycle (spawns, deaths,
   structure destruction).
4. **Snapshot broadcast**: the host serializes relevant state (positions, HP, animation state)
   each tick and sends it to all clients — start with "send everything" (simplest correct
   version) before optimizing to delta/interest-managed snapshots.
5. **Client input → host**: clients never mutate authoritative state directly; they send intents
   ("move to X,Z", "cast spell A at point P") and the host validates/applies them, per
   ARCHITECTURE.md §3.1's "validates all displacement" requirement.
6. **Client-side prediction**: for the local player's own hero only (ARCHITECTURE.md §3.2) — on
   right-click, move locally immediately using the same movement code the host uses (now
   possible because of the precondition's decoupling), then reconcile against the host's next
   snapshot rather than waiting for round-trip confirmation before showing movement.
7. **Remote entity interpolation**: other players'/entities' positions from snapshots are
   interpolated between ticks for smooth rendering rather than snapping.

## Explicitly out of scope

Anti-cheat hardening beyond "host validates movement/damage" (ARCHITECTURE.md's stated minimum),
matchmaking/lobby UX polish, reconnection handling — get one host + N clients working correctly
on a stable connection first.

## Verification

- Two browser instances (can be two tabs/profiles against the same signaling server) connect,
  one as host: host-side actions (movement, combat, minion waves) are visible on the client's
  screen within roughly one snapshot interval.
- Killing the host's tab or a client's tab doesn't crash the other side (bare-minimum
  disconnect handling, not full reconnection).
- Local input on the client's own hero feels immediate (prediction working) and doesn't
  visibly rubber-band under normal conditions (reconciliation not fighting prediction).
- Add integration-style tests where feasible for the pure simulation layer (it should be
  testable exactly like `tests/navMeshBuilder.test.ts` — plain function calls, no browser/DOM),
  even though the P2P transport itself is easiest to verify manually per the two-browser check
  above.
