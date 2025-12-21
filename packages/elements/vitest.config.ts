import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@microviz/core": resolve(__dirname, "../core/src/index.ts"),
      "@microviz/renderers": resolve(__dirname, "../renderers/src/index.ts"),
    },
  },
  test: {
    environment: "happy-dom",
    include: ["test/**/*.test.ts"],
  },
});
