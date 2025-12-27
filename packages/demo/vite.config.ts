import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { cdnBundlePlugin } from "./vite-plugin-cdn-bundle";

export default defineConfig({
  plugins: [
    cdnBundlePlugin(),
    TanStackRouterVite({
      autoCodeSplitting: true,
      generatedRouteTree: "./src/routeTree.gen.ts",
      quoteStyle: "double",
      routesDirectory: "./src/routes",
      semicolons: true,
      target: "react",
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@microviz/core": resolve(__dirname, "../core/src/index.ts"),
      "@microviz/elements": resolve(__dirname, "../elements/src/index.ts"),
      "@microviz/react": resolve(__dirname, "../react/src/index.ts"),
      "@microviz/renderers": resolve(__dirname, "../renderers/src/index.ts"),
    },
  },
  server: {
    cors: true, // Allow CORS for sandboxed iframe (origin: null)
    fs: {
      allow: [resolve(__dirname, "..")],
    },
    port: 5173,
    strictPort: true,
  },
});
