import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import type { HeroId, HeroMeshHandle } from "@/game/heroes/heroTypes";
import { buildApex } from "@/game/heroes/visuals/apex";
import { buildAura } from "@/game/heroes/visuals/aura";
import { buildBrutus } from "@/game/heroes/visuals/brutus";

export function createHeroMesh(scene: Scene, id: HeroId, position: Vector3): HeroMeshHandle {
  switch (id) {
    case "apex":
      return buildApex(scene, position);
    case "brutus":
      return buildBrutus(scene, position);
    case "aura":
      return buildAura(scene, position);
  }
}
