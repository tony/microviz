import "@andypf/json-viewer";
import type { FC } from "react";
import { useEffect, useRef, useState } from "react";

type ExpandIconType = "arrow" | "circle" | "square";

type Base16Key =
  | "base00"
  | "base01"
  | "base02"
  | "base03"
  | "base04"
  | "base05"
  | "base06"
  | "base07"
  | "base08"
  | "base09"
  | "base0A"
  | "base0B"
  | "base0C"
  | "base0D"
  | "base0E"
  | "base0F";

type Base16Theme = Record<Base16Key, string>;
type JsonViewerTheme = string | Base16Theme;

export const MICROVIZ_JSON_VIEWER_THEME_LIGHT: Base16Theme = {
  base0A: "#d97706",
  base0B: "#0d9488",
  base0C: "#0284c7",
  base0D: "#2563eb",
  base0E: "#7c3aed",
  base0F: "#db2777",
  base00: "#f8fafc",
  base01: "#f1f5f9",
  base02: "#e2e8f0",
  base03: "#94a3b8",
  base04: "#64748b",
  base05: "#0f172a",
  base06: "#0f172a",
  base07: "#0f172a",
  base08: "#dc2626",
  base09: "#16a34a",
};

export const MICROVIZ_JSON_VIEWER_THEME_DARK: Base16Theme = {
  base0A: "#f59e0b",
  base0B: "#2dd4bf",
  base0C: "#38bdf8",
  base0D: "#60a5fa",
  base0E: "#a78bfa",
  base0F: "#f472b6",
  base00: "#0f172a",
  base01: "#1e293b",
  base02: "#334155",
  base03: "#94a3b8",
  base04: "#94a3b8",
  base05: "#e2e8f0",
  base06: "#e2e8f0",
  base07: "#f1f5f9",
  base08: "#f87171",
  base09: "#4ade80",
};

type JsonViewerElement = HTMLElement & {
  data: unknown;
  indent: number;
  expanded: boolean | number;
  theme: JsonViewerTheme;
  showToolbar: boolean;
  showDataTypes: boolean;
  showCopy: boolean;
  showSize: boolean;
  expandIconType: ExpandIconType;
};

function useUiIsDark(): boolean {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains("dark"));
    });
    observer.observe(root, { attributeFilter: ["class"], attributes: true });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

export type JsonViewerProps = {
  data: unknown;
  expanded?: boolean | number;
  indent?: number;
  showCopy?: boolean;
  showDataTypes?: boolean;
  showSize?: boolean;
  showToolbar?: boolean;
};

export const JsonViewer: FC<JsonViewerProps> = ({
  data,
  expanded = 2,
  indent = 2,
  showCopy = true,
  showDataTypes = true,
  showSize = true,
  showToolbar = true,
}) => {
  const isDark = useUiIsDark();
  const ref = useRef<JsonViewerElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.data = data;
    el.expanded = expanded;
    el.indent = indent;
    el.showCopy = showCopy;
    el.showDataTypes = showDataTypes;
    el.showSize = showSize;
    el.showToolbar = showToolbar;
    el.expandIconType = "arrow";
    el.theme = isDark
      ? MICROVIZ_JSON_VIEWER_THEME_DARK
      : MICROVIZ_JSON_VIEWER_THEME_LIGHT;
  }, [
    data,
    expanded,
    indent,
    isDark,
    showCopy,
    showDataTypes,
    showSize,
    showToolbar,
  ]);

  return <andypf-json-viewer ref={ref} />;
};
