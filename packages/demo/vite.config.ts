import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { cdnBundlePlugin } from "./vite-plugin-cdn-bundle";

/**
 * Get current git branch for esm.sh GitHub URLs.
 * Safe: uses execFileSync (no shell), no user input.
 */
function getGitBranch(): string {
  try {
    return execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      encoding: "utf-8",
    }).trim();
  } catch {
    return "main";
  }
}

export default defineConfig({
  define: {
    __GIT_BRANCH__: JSON.stringify(getGitBranch()),
  },
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
      "@microviz/solid": resolve(__dirname, "../solid/dist/solid.js"),
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
