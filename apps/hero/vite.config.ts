import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative base: the game is published in a folder next to Cube Teacher (…/cube-teacher/hero/).
  base: "./",
  plugins: [react()],
  // three.js is big but only loads with the 3D cube.
  build: { chunkSizeWarningLimit: 1000 },
  test: {
    environment: "node",
  },
});
