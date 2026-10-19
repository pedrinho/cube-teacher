import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative base so the static build works from any folder (e.g. GitHub Pages).
  base: "./",
  plugins: [react()],
  // cubing.js's 3D and solver chunks are big but only load when a cube is shown.
  build: { chunkSizeWarningLimit: 1000 },
  test: {
    environment: "node",
  },
});
