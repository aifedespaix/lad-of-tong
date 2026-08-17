import path from "node:path";
import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  optimizeDeps: {
    include: ["yuka"],
  },
  build: {
    target: "esnext",
  },
  test: {
    environment: "node",
  },
});
