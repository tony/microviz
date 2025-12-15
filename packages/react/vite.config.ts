import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      name: "MicrovizReact",
    },
    rollupOptions: {
      external: [
        "@microviz/core",
        "@microviz/renderers",
        "react",
        "react/jsx-runtime",
      ],
    },
  },
  plugins: [react(), dts()],
});
