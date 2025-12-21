/**
 * CDN build configuration for @microviz/elements.
 *
 * This builds a pre-bundled ESM file with all dependencies
 * (@microviz/core, @microviz/renderers) inlined. Enables direct
 * browser import without esm.sh or import maps.
 *
 * Usage:
 *   pnpm build:cdn
 *
 * Output:
 *   dist/cdn/microviz.js (~200KB, ~50KB gzipped)
 *
 * CDN URLs after npm publish:
 *   - https://cdn.jsdelivr.net/npm/@microviz/elements/cdn/microviz.js
 *   - https://unpkg.com/@microviz/elements/cdn/microviz.js
 */
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      fileName: () => "microviz.js",
    },
    outDir: "dist/cdn",
    emptyOutDir: true,
    // No externals - bundle everything for CDN use
    rollupOptions: {
      external: [],
    },
    minify: "esbuild",
    sourcemap: true,
  },
  // Resolve workspace dependencies
  resolve: {
    alias: {
      "@microviz/core": resolve(__dirname, "../core/src/index.ts"),
      "@microviz/renderers": resolve(__dirname, "../renderers/src/index.ts"),
    },
  },
});
