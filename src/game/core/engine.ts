import { Engine } from "@babylonjs/core/Engines/engine";

export function createEngine(canvas: HTMLCanvasElement): Engine {
  const engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: true }, true);

  const handleResize = () => engine.resize();
  window.addEventListener("resize", handleResize);
  engine.onDisposeObservable.addOnce(() => {
    window.removeEventListener("resize", handleResize);
  });

  return engine;
}
