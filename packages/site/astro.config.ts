import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import type { AstroUserConfig } from "astro";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  // Experimental fonts API configuration
  experimental: {
    fonts: [
      // IBM Plex Sans
      {
        cssVariable: "--font-ibm-plex-sans",
        fallbacks: ["ui-sans-serif", "system-ui", "sans-serif"],
        name: "IBM Plex Sans",
        optimizedFallbacks: true,
        provider: "local",
        variants: [
          {
            display: "swap",
            src: [
              {
                url: "../../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2",
              },
            ],
            style: "normal",
            weight: "400",
          },
          {
            display: "swap",
            src: [
              {
                url: "../../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2",
              },
            ],
            style: "normal",
            weight: "600",
          },
        ],
      },
      // IBM Plex Mono
      {
        cssVariable: "--font-ibm-plex-mono",
        fallbacks: ["ui-monospace", "monospace"],
        name: "IBM Plex Mono",
        optimizedFallbacks: true,
        provider: "local",
        variants: [
          {
            display: "swap",
            src: [
              {
                url: "../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2",
              },
            ],
            style: "normal",
            weight: "400",
          },
          {
            display: "swap",
            src: [
              {
                url: "../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff2",
              },
            ],
            style: "normal",
            weight: "600",
          },
        ],
      },
    ],
  },
  integrations: [
    starlight({
      components: {
        Footer: "./src/components/Footer.astro",
        Head: "./src/components/Head.astro",
        Search: "./src/components/Search.astro",
      },
      credits: true,
      customCss: [
        // Path to your Tailwind base styles:
        "./src/tailwind.css",
      ],
      editLink: {
        baseUrl:
          "https://github.com/microviz/microviz/edit/main/packages/site/",
      },
      favicon: "/favicon.svg",
      logo: {
        alt: "microviz",
        dark: "./src/assets/img/logo-dark.svg",
        light: "./src/assets/img/logo-light.svg",
      },
      sidebar: [
        "getting-started",
        {
          autogenerate: { directory: "elements" },
          badge: { text: "@microviz/elements", variant: "note" },
          label: "Elements",
        },
        {
          autogenerate: { directory: "core" },
          badge: { text: "@microviz/core", variant: "tip" },
          label: "Core",
        },
        {
          autogenerate: { directory: "renderers" },
          badge: { text: "@microviz/renderers", variant: "note" },
          label: "Renderers",
        },
        {
          autogenerate: { directory: "themes" },
          badge: { text: "@microviz/themes", variant: "note" },
          label: "Themes",
        },
        {
          autogenerate: { directory: "themes-tailwind" },
          badge: { text: "@microviz/themes-tailwind", variant: "note" },
          label: "Tailwind",
        },
        "gallery",
      ],
      social: [
        {
          href: "https://github.com/microviz/microviz",
          icon: "github",
          label: "GitHub",
        },
      ],
      title: "microviz",
    }),
    react(),
  ],
  site: "https://microviz.example.com",
  vite: {
    // Type cast needed due to Vite version mismatch between @tailwindcss/vite and Astro's internal Vite
    plugins: [tailwindcss() as never],
  },
} satisfies AstroUserConfig);
