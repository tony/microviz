import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  optimizeDeps: {
    include: ["react/jsx-dev-runtime"],
  },
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
      expect: {
        toMatchScreenshot: {
          comparatorName: "pixelmatch",
          comparatorOptions: {
            threshold: 0.15,
          },
        },
      },
      headless: true,
      instances: [
        {
          browser: "chromium",
          viewport: { height: 720, width: 1280 },
        },
      ],
      provider: playwright({
        launchOptions: {
          args: ["--font-render-hinting=none", "--disable-skia-runtime-opts"],
        },
      }),
    },
    include: ["tests/visual/**/*.test.tsx"],
    setupFiles: ["vitest-browser-react", "tests/visual/setup.ts"],
    watch: false,
  },
});
