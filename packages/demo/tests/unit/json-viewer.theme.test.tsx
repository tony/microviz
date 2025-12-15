import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, test } from "vitest";
import {
  JsonViewer,
  MICROVIZ_JSON_VIEWER_THEME_DARK,
  MICROVIZ_JSON_VIEWER_THEME_LIGHT,
} from "../../src/playground/JsonViewer";

const SAMPLE_DATA = {
  bool: true,
  float: Math.PI,
  int: 42,
  nil: null,
  str: "hello",
};

function createMatchMedia(matches: boolean): typeof window.matchMedia {
  return (query: string) => {
    const list = {
      addEventListener: () => {},
      addListener: () => {},
      dispatchEvent: () => false,
      matches: query.includes("prefers-color-scheme") ? matches : false,
      media: query,
      onchange: null,
      removeEventListener: () => {},
      removeListener: () => {},
    };

    return list as unknown as MediaQueryList;
  };
}

function findThemeStyleText(viewer: Element): string {
  const styles = viewer.shadowRoot?.querySelectorAll("style");
  if (!styles) throw new Error("Expected json-viewer shadow styles");

  const themeStyle = Array.from(styles).find((style) =>
    style.textContent?.includes("--base00:"),
  );

  const text = themeStyle?.textContent;
  if (!text) throw new Error("Expected json-viewer theme style content");
  return text;
}

let root: Root | null = null;
let container: HTMLElement | null = null;
let originalMatchMedia: typeof window.matchMedia | null = null;

afterEach(async () => {
  if (root) {
    await act(async () => {
      root?.unmount();
    });
  }
  container?.remove();
  root = null;
  container = null;

  if (originalMatchMedia) {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia,
    });
  }
  originalMatchMedia = null;
});

test("JsonViewer applies the microviz light theme", async () => {
  originalMatchMedia = window.matchMedia;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: createMatchMedia(false),
  });

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root?.render(<JsonViewer data={SAMPLE_DATA} showToolbar />);
  });

  const viewer = container.querySelector("andypf-json-viewer");
  if (!viewer) throw new Error("Expected andypf-json-viewer element");

  const themeCss = findThemeStyleText(viewer);
  expect(themeCss).toContain(
    `--base00: ${MICROVIZ_JSON_VIEWER_THEME_LIGHT.base00};`,
  );
  expect(themeCss).toContain(
    `--base02: ${MICROVIZ_JSON_VIEWER_THEME_LIGHT.base02};`,
  );
  expect(themeCss).toContain(
    `--base0D: ${MICROVIZ_JSON_VIEWER_THEME_LIGHT.base0D};`,
  );
});

test("JsonViewer applies the microviz dark theme", async () => {
  originalMatchMedia = window.matchMedia;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: createMatchMedia(true),
  });

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root?.render(<JsonViewer data={SAMPLE_DATA} showToolbar />);
  });

  const viewer = container.querySelector("andypf-json-viewer");
  if (!viewer) throw new Error("Expected andypf-json-viewer element");

  const themeCss = findThemeStyleText(viewer);
  expect(themeCss).toContain(
    `--base00: ${MICROVIZ_JSON_VIEWER_THEME_DARK.base00};`,
  );
  expect(themeCss).toContain(
    `--base02: ${MICROVIZ_JSON_VIEWER_THEME_DARK.base02};`,
  );
  expect(themeCss).toContain(
    `--base0D: ${MICROVIZ_JSON_VIEWER_THEME_DARK.base0D};`,
  );
});
