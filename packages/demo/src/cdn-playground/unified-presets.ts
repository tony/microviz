/**
 * Unified preset schema for multi-format code generation.
 * Enables generating HTML, JSX, and future formats from the same data.
 */

import type { OutputFormat } from "./generators/types";

// ─────────────────────────────────────────────────────────────────────────────
// Core Types
// ─────────────────────────────────────────────────────────────────────────────

export type ChartType =
  | "sparkline"
  | "sparkline-bars"
  | "donut"
  | "bullet-gauge"
  | "bar"
  | "auto";

export type ElementTag =
  | "microviz-sparkline"
  | "microviz-chart"
  | "microviz-auto";

export type DataShape =
  | { type: "series"; length: number }
  | { type: "segments"; count: number }
  | { type: "delta" }
  | { type: "value" }
  | { type: "csv"; headers: string[]; rows: number };

export type ChartInstance = {
  /** Unique identifier within the preset */
  id: string;
  /** Chart type for React component selection */
  chartType: ChartType;
  /** Web Component element tag */
  element: ElementTag;
  /** Data shape for random generation */
  dataShape: DataShape;
  /** For microviz-auto: data-kind attribute */
  dataKind?: "series" | "delta" | "segments" | "value" | "csv" | "override";
  /** Chart spec (for microviz-chart) */
  spec?: Record<string, unknown>;
  /** Chart dimensions */
  width: number;
  height: number;
  /** Additional HTML attributes */
  extraAttrs?: Record<string, string>;
  /** Label/title for display */
  label?: string;
};

export type LayoutTemplate =
  | { type: "single" }
  | { type: "grid"; columns: number; gap?: string }
  | { type: "cards"; title?: string; columns?: number; gap?: string };

export type InteractiveConfig = {
  /** Event type to listen for */
  eventType: "microviz-hit";
  /** ID of output element */
  outputId: string;
  /** Initial output text */
  initialText: string;
};

export type UnifiedPreset = {
  id: string;
  name: string;
  description: string;
  /** Which output formats this preset supports */
  formats: OutputFormat[];
  /** Charts to render */
  charts: ChartInstance[];
  /** Layout wrapper */
  layout: LayoutTemplate;
  /** For interactive presets */
  interactive?: InteractiveConfig;
  /** For CSP-safe preset - uses direct imports instead of CDN */
  cspSafe?: boolean;
  /** For cdn-dev-preview - custom CDN URL pattern */
  customCdnPattern?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Preset Definitions
// ─────────────────────────────────────────────────────────────────────────────

export const UNIFIED_PRESETS: UnifiedPreset[] = [
  {
    charts: [
      {
        chartType: "auto",
        dataKind: "series",
        dataShape: { length: 5, type: "series" },
        element: "microviz-auto",
        height: 32,
        id: "series",
        label: "Series → Sparkline",
        width: 200,
      },
      {
        chartType: "auto",
        dataKind: "delta",
        dataShape: { type: "delta" },
        element: "microviz-auto",
        height: 40,
        id: "delta",
        label: "Delta → Bullet",
        width: 220,
      },
      {
        chartType: "auto",
        dataKind: "segments",
        dataShape: { count: 3, type: "segments" },
        element: "microviz-auto",
        height: 140,
        id: "segments",
        label: "Segments → Donut",
        width: 140,
      },
      {
        chartType: "auto",
        dataKind: "value",
        dataShape: { type: "value" },
        element: "microviz-auto",
        height: 32,
        id: "value",
        label: "Value → Bar",
        width: 220,
      },
    ],
    description: "Auto chart inference for common data shapes",
    formats: ["html", "jsx", "solid"],
    id: "auto-inference",
    layout: { columns: 4, gap: "1.5rem", type: "cards" },
    name: "Auto Inference (Basics)",
  },
  {
    charts: [
      {
        chartType: "auto",
        dataKind: "csv",
        dataShape: { headers: ["pct", "color", "name"], rows: 3, type: "csv" },
        element: "microviz-auto",
        height: 160,
        id: "csv",
        width: 160,
      },
    ],
    description: "CSV pct/color parsing for auto donut inference",
    formats: ["html", "jsx", "solid"],
    id: "auto-csv",
    layout: { type: "single" },
    name: "Auto Inference (CSV)",
  },
  {
    charts: [
      {
        chartType: "auto",
        dataKind: "override",
        dataShape: { count: 3, type: "segments" },
        element: "microviz-auto",
        extraAttrs: { type: "bullet-gauge" },
        height: 60,
        id: "override",
        width: 240,
      },
    ],
    description: "Override inference with an explicit chart type",
    formats: ["html", "jsx", "solid"],
    id: "auto-override",
    layout: { type: "single" },
    name: "Auto Override",
  },
  {
    charts: [
      {
        chartType: "sparkline",
        dataShape: { length: 9, type: "series" },
        element: "microviz-sparkline",
        height: 32,
        id: "main",
        width: 200,
      },
    ],
    description: "Simple sparkline chart",
    formats: ["html", "jsx", "solid"],
    id: "sparkline",
    layout: { type: "single" },
    name: "Sparkline",
  },
  {
    charts: [
      {
        chartType: "sparkline-bars",
        dataShape: { length: 7, type: "series" },
        element: "microviz-chart",
        height: 120,
        id: "bars",
        spec: { type: "sparkline-bars" },
        width: 280,
      },
    ],
    description: "Vertical bar chart with labels",
    formats: ["html", "jsx", "solid"],
    id: "bar-chart",
    layout: { type: "single" },
    name: "Bar Chart",
  },
  {
    charts: [
      {
        chartType: "sparkline",
        dataShape: { length: 12, type: "series" },
        element: "microviz-chart",
        extraAttrs: {
          "hit-slop": "8",
          id: "myChart",
          interactive: "",
        },
        height: 64,
        id: "interactive",
        spec: { type: "sparkline" },
        width: 280,
      },
    ],
    description: "Chart with hover events",
    formats: ["html", "jsx", "solid"],
    id: "interactive",
    interactive: {
      eventType: "microviz-hit",
      initialText: "Hover over the chart...",
      outputId: "output",
    },
    layout: { type: "single" },
    name: "Interactive Chart",
  },
  {
    charts: [
      {
        chartType: "donut",
        dataShape: { count: 3, type: "segments" },
        element: "microviz-chart",
        height: 160,
        id: "donut",
        spec: { type: "donut" },
        width: 160,
      },
    ],
    description: "Donut/pie chart with segments",
    formats: ["html", "jsx", "solid"],
    id: "donut",
    layout: { type: "single" },
    name: "Donut Chart",
  },
  {
    charts: [
      {
        chartType: "sparkline",
        dataShape: { length: 10, type: "series" },
        element: "microviz-sparkline",
        height: 32,
        id: "csp",
        width: 200,
      },
    ],
    cspSafe: true,
    description: "Direct SVG rendering for restricted sandboxes",
    formats: ["html"], // JSX not supported - uses direct core/renderers imports
    id: "csp-safe",
    layout: { type: "single" },
    name: "CSP-Safe (No Web Components)",
  },
  {
    charts: [
      {
        chartType: "sparkline",
        dataShape: { length: 7, type: "series" },
        element: "microviz-sparkline",
        height: 40,
        id: "revenue",
        label: "Revenue Trend",
        width: 180,
      },
      {
        chartType: "sparkline-bars",
        dataShape: { length: 4, type: "series" },
        element: "microviz-chart",
        height: 80,
        id: "sales",
        label: "Sales by Region",
        spec: { type: "sparkline-bars" },
        width: 180,
      },
      {
        chartType: "donut",
        dataShape: { count: 3, type: "segments" },
        element: "microviz-chart",
        height: 100,
        id: "traffic",
        label: "Traffic Sources",
        spec: { type: "donut" },
        width: 100,
      },
    ],
    description: "Dashboard with multiple chart types",
    formats: ["html", "jsx", "solid"],
    id: "multiple-charts",
    layout: { columns: 3, gap: "1rem", type: "cards" },
    name: "Multiple Charts",
  },
  {
    charts: [
      {
        chartType: "sparkline",
        dataShape: { length: 9, type: "series" },
        element: "microviz-sparkline",
        height: 32,
        id: "preview",
        width: 200,
      },
    ],
    customCdnPattern:
      "https://cdn-dev.microviz.org/preview/pr/1/sha/REPLACE_SHA",
    description: "Preview a PR build from cdn-dev.microviz.org",
    formats: ["html"], // HTML only - custom CDN pattern
    id: "cdn-dev-preview",
    layout: { type: "single" },
    name: "CDN Dev Preview",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_UNIFIED_PRESET = UNIFIED_PRESETS[0];

export function findUnifiedPreset(
  id: string | null,
): UnifiedPreset | undefined {
  if (!id) return undefined;
  return UNIFIED_PRESETS.find((p) => p.id === id);
}

export function getPresetFormats(id: string): OutputFormat[] {
  const preset = findUnifiedPreset(id);
  return preset?.formats ?? ["html"];
}
