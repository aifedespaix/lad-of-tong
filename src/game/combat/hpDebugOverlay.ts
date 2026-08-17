import type { CombatEntity } from "@/game/combat/combatEntity";

export interface HpDebugOverlay {
  update(entities: readonly CombatEntity[]): void;
  dispose(): void;
}

/**
 * Placeholder combat readout — milestone-2-combat.md explicitly allows "a simple non-styled DOM
 * readout" in place of the real HUD health bars (ARCHITECTURE.md §7.2, deferred to Milestone 3+).
 * Plain DOM, not Solid: `game/**` stays free of Solid imports (see ROADMAP.md).
 */
export function createHpDebugOverlay(container: HTMLElement): HpDebugOverlay {
  const root = document.createElement("div");
  root.style.position = "absolute";
  root.style.top = "8px";
  root.style.left = "8px";
  root.style.color = "#fff";
  root.style.font = "12px monospace";
  root.style.whiteSpace = "pre";
  root.style.pointerEvents = "none";
  root.style.textShadow = "0 0 3px black";
  container.appendChild(root);

  function update(entities: readonly CombatEntity[]): void {
    root.textContent = entities
      .map(
        (entity) =>
          `${entity.id.padEnd(7)} HP ${Math.ceil(entity.health.current)}/${entity.health.max}  [${entity.state}]`,
      )
      .join("\n");
  }

  function dispose(): void {
    root.remove();
  }

  return { update, dispose };
}
