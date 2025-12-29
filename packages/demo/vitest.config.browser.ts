import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@microviz/core": resolve(__dirname, "../core/src/index.ts"),
      "@microviz/elements": resolve(__dirname, "../elements/src/index.ts"),
      "@microviz/renderers": resolve(__dirname, "../renderers/src/index.ts"),
    },
  },
  server: {
    fs: {
      allow: [resolve(__dirname, "..")],
    },
  },
  test: {
    browser: {
      enabled: true,
      headless: true,
      instances: [{ browser: "chromium" }],
      provider: playwright(),
    },
    include: ["tests/browser/**/*.test.{ts,tsx}"],
    setupFiles: ["vitest-browser-react"],
    watch: false,
  },
});
