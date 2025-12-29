import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import solid from "vite-plugin-solid";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      name: "MicrovizSolid",
    },
    rollupOptions: {
      external: [
        "@microviz/core",
        "@microviz/renderers",
        "solid-js",
        "solid-js/web",
      ],
    },
  },
  plugins: [solid(), dts()],
});
