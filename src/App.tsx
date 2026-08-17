import { GameCanvas } from "@/ui/GameCanvas";
import { HudRoot } from "@/ui/HudRoot";

export function App() {
  return (
    <div class="app-root">
      <GameCanvas />
      <HudRoot />
    </div>
  );
}
