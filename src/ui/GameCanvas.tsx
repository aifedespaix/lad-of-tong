import { onCleanup, onMount } from "solid-js";
import { bootstrapGame } from "@/game/bootstrap";

export function GameCanvas() {
  let canvasRef: HTMLCanvasElement | undefined;

  onMount(() => {
    if (!canvasRef) return;
    const handle = bootstrapGame(canvasRef);
    onCleanup(() => handle.dispose());
  });

  return <canvas ref={canvasRef} class="game-canvas" />;
}
