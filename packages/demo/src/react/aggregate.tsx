import type {
  Mark,
  MicrovizPercentageSlice,
  RenderModel,
} from "@microviz/core";
import { computeModel, normalizeSlices as normalize } from "@microviz/core";
import { MicrovizSvg } from "@microviz/react";
import { type FC, type ReactNode, useEffect, useMemo, useState } from "react";
import { VirtualizedStack } from "../ui/VirtualizedStack";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Utilities
// ─────────────────────────────────────────────────────────────────────────────

export type PieSlice = MicrovizPercentageSlice;

export const FALLBACK_COLOR = "oklch(0.6 0.02 250)";
export const OTHER_COLOR = "oklch(0.75 0.02 250)";

export const DEMO_SLICES: PieSlice[] = [
  { color: "oklch(0.65 0.15 250)", name: "TypeScript", percentage: 38 },
  { color: "oklch(0.7 0.15 150)", name: "React", percentage: 22 },
  { color: "oklch(0.72 0.15 80)", name: "CSS", percentage: 14 },
  { color: "oklch(0.72 0.12 30)", name: "HTML", percentage: 10 },
  { color: OTHER_COLOR, name: "Other", percentage: 16 },
];

const DemoContent: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="flex flex-col gap-6">{children}</div>
);

export function prepareSlices(
  slices: readonly PieSlice[],
  maxSlices = 5,
  minPercentage = 3,
): PieSlice[] {
  if (slices.length === 0) return [];

  const sorted = [...slices].sort(
    (a, b) => b.percentage - a.percentage || a.name.localeCompare(b.name),
  );
  const qualifying: PieSlice[] = [];
  const toGroup: PieSlice[] = [];

  for (const slice of sorted) {
    if (qualifying.length < maxSlices && slice.percentage >= minPercentage) {
      qualifying.push(slice);
    } else {
      toGroup.push(slice);
    }
  }

  const otherPercentage = toGroup.reduce(
    (sum, slice) => sum + slice.percentage,
    0,
  );
  if (otherPercentage >= 1) {
    return [
      ...qualifying,
      {
        color: OTHER_COLOR,
        name: "Other",
        percentage: otherPercentage,
      },
    ];
  }

  return qualifying;
}

// ─────────────────────────────────────────────────────────────────────────────
// Micro-Visualization Components
// ─────────────────────────────────────────────────────────────────────────────

export const StackedBar: FC<{ slices: PieSlice[] }> = ({ slices }) => {
  const normalized = normalize(slices);
  const segments = normalized.map((slice) => ({
    color: slice.color,
    name: slice.name,
    pct: slice.percentage,
  }));

  const model = computeModel({
    data: segments,
    size: { height: 8, width: 32 },
    spec: { type: "stacked-bar" },
  });

  return (
    <MicrovizSvg
      className="overflow-hidden rounded-full transition-all duration-500 ease-out"
      model={model}
      title={normalized
        .map((s) => `${s.name} ${s.percentage.toFixed(0)}%`)
        .join(", ")}
    />
  );
};

export const StackedBarGaps: FC<{ slices: PieSlice[] }> = ({ slices }) => {
  const normalized = normalize(slices);
  const segments = normalized.map((slice) => ({
    color: slice.color,
    name: slice.name,
    pct: slice.percentage,
  }));

  const model = computeModel({
    data: segments,
    size: { height: 8, width: 32 },
    spec: { gap: 1, type: "segmented-bar" },
  });

  return (
    <MicrovizSvg
      className="overflow-hidden rounded-full bg-slate-300 dark:bg-slate-600 transition-all duration-500 ease-out"
      model={model}
      title={normalized
        .map((s) => `${s.name} ${s.percentage.toFixed(0)}%`)
        .join(", ")}
    />
  );
};

export const DonutChart: FC<{ slices: PieSlice[] }> = ({ slices }) => {
  const normalized = normalize(slices);
  const segments = normalized.map((slice) => ({
    color: slice.color,
    name: slice.name,
    pct: slice.percentage,
  }));

  const model = computeModel({
    data: segments,
    size: { height: 32, width: 32 },
    spec: { innerRadius: 0.45, pad: 0, type: "donut" },
  });

  return (
    <MicrovizSvg
      className="transition-all duration-500 ease-out"
      model={model}
      title={normalized
        .map((s) => `${s.name} ${s.percentage.toFixed(0)}%`)
        .join(", ")}
    />
  );
};

export const ConcentricArcs: FC<{ slices: PieSlice[] }> = ({ slices }) => {
  const segments = normalize(slices)
    .slice(0, 4)
    .map((slice) => ({
      color: slice.color,
      name: slice.name,
      pct: slice.percentage,
    }))
    .reverse();

  const model = computeModel({
    data: segments,
    size: { height: 32, width: 32 },
    spec: {
      ringGap: 1,
      rings: 4,
      strokeWidth: 2.5,
      type: "concentric-arcs",
    },
  });

  return (
    <MicrovizSvg
      className="overflow-visible"
      model={model}
      title="Concentric Arcs"
    />
  );
};

export const DotMatrix: FC<{ slices: PieSlice[] }> = ({ slices }) => {
  const normalized = normalize(slices);
  const segments = normalized.map((slice) => ({
    color: slice.color,
    name: slice.name,
    pct: slice.percentage,
  }));

  const model = computeModel({
    data: segments,
    size: { height: 32, width: 32 },
    spec: {
      className: "transition-all duration-500 ease-out",
      cols: 4,
      gap: 2,
      pad: 3,
      rows: 4,
      type: "pixel-grid",
    },
  });

  return (
    <MicrovizSvg
      className="[&_.mv-pixel-grid-cell]:[rx:999px] [&_.mv-pixel-grid-cell]:[ry:999px]"
      model={model}
      title="Dot Matrix"
    />
  );
};

export const SegmentedRing: FC<{ slices: PieSlice[] }> = ({ slices }) => {
  const segments = normalize(slices).map((slice) => ({
    color: slice.color,
    name: slice.name,
    pct: slice.percentage,
  }));

  const model = computeModel({
    data: segments,
    size: { height: 32, width: 32 },
    spec: { type: "segmented-ring" },
  });

  return <MicrovizSvg model={model} title="Segmented Ring" />;
};

export const VerticalStack: FC<{ slices: PieSlice[] }> = ({ slices }) => {
  const normalized = normalize(slices);
  const segments = normalized.map((slice) => ({
    color: slice.color,
    name: slice.name,
    pct: slice.percentage,
  }));

  const model = computeModel({
    data: segments,
    size: { height: 32, width: 8 },
    spec: { type: "vertical-stack" },
  });

  return (
    <MicrovizSvg
      className="transition-all duration-500"
      model={model}
      title={normalized
        .map((s) => `${s.name} ${s.percentage.toFixed(0)}%`)
        .join(", ")}
    />
  );
};

export const DotRow: FC<{ slices: PieSlice[] }> = ({ slices }) => {
  const normalized = normalize(slices);
  const segments = normalized.map((slice) => ({
    color: slice.color,
    name: slice.name,
    pct: slice.percentage,
  }));

  const model = computeModel({
    data: segments,
    size: { height: 4, width: 32 },
    spec: { dots: 8, gap: 0, type: "dot-row" },
  });

  return <MicrovizSvg model={model} title="Dot Row" />;
};

export const MosaicGrid: FC<{ slices: PieSlice[] }> = ({ slices }) => {
  const normalized = normalize(slices);
  const segments = normalized.map((slice) => ({
    color: slice.color,
    name: slice.name,
    pct: slice.percentage,
  }));

  const model = computeModel({
    data: segments,
    size: { height: 32, width: 32 },
    spec: {
      className: "transition-all duration-500 ease-out",
      cols: 4,
      gap: 1,
      pad: 1,
      rows: 4,
      type: "pixel-grid",
    },
  });

  return (
    <MicrovizSvg
      className="overflow-hidden rounded-sm"
      model={model}
      title="Mosaic Grid"
    />
  );
};

export const ProgressPills: FC<{ slices: PieSlice[] }> = ({ slices }) => {
  const normalized = normalize(slices).slice(0, 4);
  const segments = normalized.map((slice) => ({
    color: slice.color,
    name: slice.name,
    pct: slice.percentage,
  }));

  const model = computeModel({
    data: segments,
    size: { height: 8, width: 32 },
    spec: { gap: 2, type: "progress-pills" },
  });

  return (
    <MicrovizSvg
      className="transition-all duration-500"
      model={model}
      title={normalized
        .map((s) => `${s.name} ${s.percentage.toFixed(0)}%`)
        .join(", ")}
    />
  );
};

export const MiniPie: FC<{ slices: PieSlice[] }> = ({ slices }) => {
  const segments = normalize(slices).map((slice) => ({
    color: slice.color,
    name: slice.name,
    pct: slice.percentage,
  }));

  const model = computeModel({
    data: segments,
    size: { height: 32, width: 32 },
    spec: {
      className: "transition-all duration-500",
      innerRadius: 0,
      pad: 2,
      type: "donut",
    },
  });

  return (
    <MicrovizSvg
      model={model}
      style={{ stroke: "rgba(255,255,255,0.2)", strokeWidth: 0.5 }}
      title="Mini Pie Chart"
    />
  );
};

export const CurvedBar: FC<{ slices: PieSlice[] }> = ({ slices }) => {
  const segments = normalize(slices).map((slice) => ({
    color: slice.color,
    name: slice.name,
    pct: slice.percentage,
  }));

  const model = computeModel({
    data: segments,
    size: { height: 16, width: 32 },
    spec: {
      className: "transition-all duration-500 ease-out",
      gap: 0.5,
      pad: 0,
      pillHeight: 4,
      type: "progress-pills",
    },
  });

  return <MicrovizSvg model={model} title="Curved Bar" />;
};

// NanoRing - Magic radius where C = 100 (r = 15.9155)
export const NanoRing: FC<{ slices: PieSlice[] }> = ({ slices }) => {
  const segments = [...normalize(slices)]
    .sort((a, b) => b.percentage - a.percentage || a.name.localeCompare(b.name))
    .map((slice) => ({
      color: slice.color,
      name: slice.name,
      pct: slice.percentage,
    }));

  const model = computeModel({
    data: segments,
    size: { height: 32, width: 32 },
    spec: { gapSize: 2, pad: 0, strokeWidth: 4, type: "nano-ring" },
  });

  return <MicrovizSvg model={model} title="Nano Ring" />;
};

// SegmentedPill - Flexbox with border separators
export const SegmentedPill: FC<{ slices: PieSlice[] }> = ({ slices }) => {
  const normalized = normalize(slices);
  const segments = normalized.map((slice) => ({
    color: slice.color,
    name: slice.name,
    pct: slice.percentage,
  }));

  const model = computeModel({
    data: segments,
    size: { height: 8, width: 32 },
    spec: {
      className: "transition-all duration-500 ease-out",
      type: "segmented-pill",
    },
  });

  return (
    <MicrovizSvg
      className="overflow-hidden rounded-full bg-slate-200 dark:bg-slate-600 isolate ring-1 ring-inset ring-black/5"
      model={model}
      title={normalized
        .map((s) => `${s.name} ${s.percentage.toFixed(0)}%`)
        .join(", ")}
    />
  );
};

// BitGrid - Largest Remainder Method for accurate distribution
export const BitGrid: FC<{ slices: PieSlice[] }> = ({ slices }) => {
  const normalized = normalize(slices);
  const segments = normalized.map((slice) => ({
    color: slice.color,
    name: slice.name,
    pct: slice.percentage,
  }));

  const model = computeModel({
    data: segments,
    size: { height: 32, width: 32 },
    spec: {
      className: "transition-colors duration-300",
      cols: 4,
      gap: 1,
      pad: 2,
      rows: 4,
      type: "pixel-grid",
    },
  });

  return (
    <MicrovizSvg
      className="[&_.mv-pixel-grid-cell]:[rx:1px] [&_.mv-pixel-grid-cell]:[ry:1px]"
      model={model}
      title="Bit Grid"
    />
  );
};

// RadialBars - Lines from center (sunburst style)
export const RadialBars: FC<{ slices: PieSlice[] }> = ({ slices }) => {
  const normalized = normalize(slices).slice(0, 6);
  const segments = normalized.map((slice) => ({
    color: slice.color,
    name: slice.name,
    pct: slice.percentage,
  }));

  const baseModel = computeModel({
    data: segments,
    size: { height: 32, width: 32 },
    spec: {
      className: "transition-all duration-500",
      maxLength: 12,
      minLength: 3,
      pad: 0,
      strokeWidth: 2.5,
      type: "radial-bars",
    },
  });

  const model: RenderModel = {
    ...baseModel,
    marks: [
      {
        className: "text-slate-300 dark:text-slate-600",
        cx: 16,
        cy: 16,
        fill: "currentColor",
        id: "radial-bars-center",
        r: 2,
        type: "circle",
      } satisfies Mark,
      ...baseModel.marks,
    ],
  };

  return <MicrovizSvg model={model} title="Radial Bars" />;
};

// PatternTiles - Accessibility-focused with patterns
export const PatternTiles: FC<{ slices: PieSlice[] }> = ({ slices }) => {
  const segments = normalize(slices).map((slice) => ({
    color: slice.color,
    name: slice.name,
    pct: slice.percentage,
  }));

  const model = computeModel({
    data: segments,
    size: { height: 8, width: 32 },
    spec: { pad: 0, type: "pattern-tiles" },
  });

  return (
    <MicrovizSvg
      className="overflow-hidden rounded-full transition-all duration-500"
      model={model}
      title="Pattern Tiles"
    />
  );
};

// OrbitalDots - dots on a circular path with variable sizes
export const OrbitalDots: FC<{ slices: PieSlice[] }> = ({ slices }) => {
  const normalized = normalize(slices).slice(0, 6);
  const segments = normalized.map((slice) => ({
    color: slice.color,
    name: slice.name,
    pct: slice.percentage,
  }));

  const model = computeModel({
    data: segments,
    size: { height: 32, width: 32 },
    spec: {
      className:
        "transition-all duration-500 text-slate-200 dark:text-slate-600",
      maxDotRadius: 6,
      minDotRadius: 2,
      pad: 0,
      radius: 10,
      ringStrokeWidth: 1,
      type: "orbital-dots",
    },
  });

  return <MicrovizSvg model={model} title="Orbital Dots" />;
};

// StackedChips - overlapping rounded segments
export const StackedChips: FC<{ slices: PieSlice[] }> = ({ slices }) => {
  const normalized = normalize(slices).slice(0, 4);
  const segments = normalized.map((slice) => ({
    color: slice.color,
    name: slice.name,
    pct: slice.percentage,
  }));

  const model = computeModel({
    data: segments,
    size: { height: 12, width: 32 },
    spec: {
      className: "transition-all duration-500 text-white dark:text-slate-800",
      maxChips: 4,
      maxChipWidth: 24,
      minChipWidth: 12,
      overlap: 4,
      pad: 0,
      strokeWidth: 2,
      type: "stacked-chips",
    },
  });

  return (
    <MicrovizSvg
      model={model}
      title={normalized
        .map((s) => `${s.name} ${s.percentage.toFixed(0)}%`)
        .join(", ")}
    />
  );
};

// SparklineBars - vertical bars showing relative heights
export const SparklineBars: FC<{ slices: PieSlice[] }> = ({ slices }) => {
  const normalized = normalize(slices).slice(0, 6);

  const model = computeModel({
    data: normalized.map((slice) => slice.percentage),
    size: { height: 32, width: 32 },
    spec: {
      barRadius: 1,
      className: "transition-all duration-500 ease-out",
      colors: normalized.map((slice) => slice.color),
      gap: 1,
      pad: 0,
      type: "sparkline-bars",
    },
  });

  return <MicrovizSvg model={model} title="Sparkline Bars" />;
};

// PixelStackedBar - Integer-snapped segments with optional glossy finish
export const PixelStackedBar: FC<{
  slices: PieSlice[];
  width?: number;
  height?: number;
  gap?: number;
  glossy?: boolean;
}> = ({ slices, width = 32, height = 8, gap = 1, glossy = true }) => {
  const normalized = normalize(slices);
  const segments = normalized.map((slice) => ({
    color: slice.color,
    name: slice.name,
    pct: slice.percentage,
  }));

  const baseModel = computeModel({
    data: segments,
    size: { height, width },
    spec: {
      className: "transition-all duration-500",
      gap,
      minPx: 1,
      pad: 0,
      type: "pixel-pill",
    },
  });

  const model: RenderModel = glossy
    ? {
        ...baseModel,
        defs: [
          ...(baseModel.defs ?? []),
          {
            id: "pixel-pill-gloss",
            stops: [
              { color: "white", offset: 0, opacity: 0.18 },
              { color: "white", offset: 0.58, opacity: 0 },
            ],
            type: "linearGradient",
            x1: 0,
            x2: 0,
            y1: 0,
            y2: 1,
          },
        ],
        marks: [
          ...baseModel.marks,
          {
            className: "mix-blend-soft-light pointer-events-none",
            clipPath: "pixel-pill-clip",
            fill: "url(#pixel-pill-gloss)",
            h: baseModel.height,
            id: "pixel-pill-gloss-overlay",
            type: "rect",
            w: baseModel.width,
            x: 0,
            y: 0,
          } satisfies Mark,
        ],
      }
    : baseModel;

  return (
    <MicrovizSvg
      className="overflow-hidden rounded-full bg-slate-200 dark:bg-slate-600 transition-all duration-500"
      model={model}
      style={{ shapeRendering: "crispEdges" }}
      title={normalized
        .map((s) => `${s.name} ${s.percentage.toFixed(0)}%`)
        .join(", ")}
    />
  );
};

// Mosaic8x8 - 64-cell grid with interleaved colors for small-slice visibility
export const Mosaic8x8: FC<{ slices: PieSlice[] }> = ({ slices }) => {
  const normalized = normalize(slices);
  const segments = normalized.map((slice) => ({
    color: slice.color,
    name: slice.name,
    pct: slice.percentage,
  }));

  const model = computeModel({
    data: segments,
    size: { height: 32, width: 32 },
    spec: {
      className: "transition-colors duration-500",
      cols: 8,
      gap: 0,
      interleave: true,
      pad: 0,
      rows: 8,
      type: "pixel-grid",
    },
  });

  return (
    <MicrovizSvg
      className="rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-600 transition-all duration-500"
      model={model}
      style={{ shapeRendering: "crispEdges" }}
      title="Mosaic 8x8"
    />
  );
};

// BarcodeStrip - 32 columns interleaved for small-slice visibility
export const BarcodeStrip: FC<{ slices: PieSlice[]; height?: number }> = ({
  slices,
  height = 8,
}) => {
  const segments = normalize(slices).map((slice) => ({
    color: slice.color,
    name: slice.name,
    pct: slice.percentage,
  }));

  const model = computeModel({
    data: segments,
    size: { height, width: 32 },
    spec: { bins: 32, gap: 0, interleave: true, pad: 0, type: "barcode" },
  });

  return (
    <MicrovizSvg
      className="overflow-hidden rounded-full bg-slate-200 dark:bg-slate-600 transition-all duration-500"
      model={model}
      style={{ shapeRendering: "crispEdges" }}
      title="Barcode Strip"
    />
  );
};

// PixelStackedColumn - Pixel-snapped vertical bar (8×32)
export const PixelStackedColumn: FC<{
  slices: PieSlice[];
  width?: number;
  height?: number;
  gap?: number;
}> = ({ slices, width = 8, height = 32, gap = 1 }) => {
  const normalized = normalize(slices);
  const segments = normalized.map((slice) => ({
    color: slice.color,
    name: slice.name,
    pct: slice.percentage,
  }));

  const model = computeModel({
    data: segments,
    size: { height, width },
    spec: {
      className: "transition-all duration-500",
      gap,
      minPx: 1,
      pad: 0,
      type: "pixel-column",
    },
  });

  return (
    <MicrovizSvg
      className="overflow-hidden rounded-full bg-slate-200 dark:bg-slate-600 transition-all duration-500"
      model={model}
      style={{ shapeRendering: "crispEdges" }}
      title={normalized
        .map((s) => `${s.name} ${s.percentage.toFixed(0)}%`)
        .join(", ")}
    />
  );
};

// Equalizer - Bar heights by percentage (music EQ style)
export const Equalizer: FC<{ slices: PieSlice[]; bars?: number }> = ({
  slices,
  bars = 6,
}) => {
  const segments = useMemo(
    () =>
      [...normalize(slices)]
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, bars)
        .map((slice) => ({
          color: slice.color,
          name: slice.name,
          pct: slice.percentage,
        })),
    [slices, bars],
  );
  const series = useMemo(
    () => segments.map((segment) => segment.pct),
    [segments],
  );

  const model = computeModel({
    data: series,
    size: { height: 32, width: 32 },
    spec: {
      barWidth: 4,
      bins: bars,
      colors: segments.map((segment) => segment.color),
      gap: 1,
      pad: 1,
      type: "equalizer",
    },
  });

  return (
    <MicrovizSvg
      className="overflow-hidden rounded-[6px] bg-slate-200 dark:bg-slate-600"
      model={model}
      style={{ shapeRendering: "crispEdges" }}
      title="Equalizer"
    />
  );
};

// CodeMinimap - Dev-themed 8 "code lines" colored by distribution
export const CodeMinimap: FC<{ slices: PieSlice[] }> = ({ slices }) => {
  const segments = normalize(slices).map((slice) => ({
    color: slice.color,
    name: slice.name,
    pct: slice.percentage,
  }));
  const series = segments.map((segment) => segment.pct);

  const model = computeModel({
    data: series,
    size: { height: 32, width: 32 },
    spec: {
      colors: segments.map((segment) => segment.color),
      type: "code-minimap",
    },
  });

  return (
    <MicrovizSvg
      className="overflow-hidden rounded-[6px] bg-slate-200 dark:bg-slate-600 transition-all duration-500"
      model={model}
      style={{ shapeRendering: "crispEdges" }}
      title="Code Minimap"
    />
  );
};

// PixelTreemap - Slice-and-dice algorithm
export const PixelTreemap: FC<{ slices: PieSlice[]; radius?: number }> = ({
  slices,
  radius = 6,
}) => {
  const normalized = useMemo(
    () => [...normalize(slices)].sort((a, b) => b.percentage - a.percentage),
    [slices],
  );

  const segments = normalized.map((slice) => ({
    color: slice.color,
    name: slice.name,
    pct: slice.percentage,
  }));

  const model = computeModel({
    data: segments,
    size: { height: 32, width: 32 },
    spec: {
      className: "transition-all duration-500",
      cornerRadius: radius,
      pad: 0,
      type: "pixel-treemap",
    },
  });

  return (
    <MicrovizSvg
      model={model}
      style={{ shapeRendering: "crispEdges" }}
      title="Pixel Treemap"
    />
  );
};

// ShapeRow - Categorical glyphs (circle, square, triangle, diamond)
export const ShapeRow: FC<{ slices: PieSlice[] }> = ({ slices }) => {
  const normalized = useMemo(
    () =>
      [...normalize(slices)]
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 4),
    [slices],
  );

  const segments = normalized.map((slice) => ({
    color: slice.color,
    name: slice.name,
    pct: slice.percentage,
  }));

  const model = computeModel({
    data: segments,
    size: { height: 8, width: 32 },
    spec: {
      className: "transition-colors duration-500",
      maxShapes: 4,
      pad: 0,
      type: "shape-row",
    },
  });

  return <MicrovizSvg model={model} title="Shape Row" />;
};

// Orbital - Dominant core + satellite ring for others
export const Orbital: FC<{
  slices: PieSlice[];
  stroke?: number;
  gap?: number;
}> = ({ slices, stroke = 3, gap = 2.0 }) => {
  const normalized = useMemo(
    () => [...normalize(slices)].sort((a, b) => b.percentage - a.percentage),
    [slices],
  );
  const primary = normalized[0];
  const others = normalized.slice(1).map((slice) => ({
    color: slice.color,
    name: slice.name,
    pct: slice.percentage,
  }));

  // Keep the legacy ring radius (r=12) stable by choosing a pad that matches the
  // segmented-ring radius calculation for a 32×32 model.
  const ringPad = Math.max(0, 4 - stroke / 2);

  const ringModel = computeModel({
    data: others,
    size: { height: 32, width: 32 },
    spec: {
      className: "transition-all duration-500",
      gapSize: gap,
      pad: ringPad,
      strokeWidth: stroke,
      type: "segmented-ring",
    },
  });

  const ringCircle = ringModel.marks.find(
    (mark): mark is Extract<Mark, { type: "circle" }> => mark.type === "circle",
  );

  const track: Mark = {
    className: "text-slate-300 dark:text-slate-500",
    cx: ringCircle?.cx ?? 16,
    cy: ringCircle?.cy ?? 16,
    fill: "none",
    id: "orbital-track",
    r: ringCircle?.r ?? 12,
    stroke: "currentColor",
    strokeWidth: 2,
    type: "circle",
  };

  const model: RenderModel = {
    ...ringModel,
    marks: [
      {
        className: "text-slate-200 dark:text-slate-600",
        fill: "currentColor",
        h: 32,
        id: "orbital-bg",
        rx: 6,
        ry: 6,
        type: "rect",
        w: 32,
        x: 0,
        y: 0,
      } satisfies Mark,
      {
        className: "transition-colors duration-500",
        cx: 16,
        cy: 16,
        fill: primary?.color ?? OTHER_COLOR,
        id: "orbital-core",
        r: 6,
        type: "circle",
      } satisfies Mark,
      track,
      ...ringModel.marks,
    ],
  };

  return <MicrovizSvg model={model} title="Orbital" />;
};

// ─────────────────────────────────────────────────────────────────────────────
// Demo Layout Components
// ─────────────────────────────────────────────────────────────────────────────

interface VizCardProps {
  title: string;
  footprint: string;
  children: ReactNode;
}

export const VizCard: FC<VizCardProps> = ({ title, footprint, children }) => {
  return (
    <div className="relative rounded-xl p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700">
          {children}
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {footprint}
          </p>
        </div>
      </div>
    </div>
  );
};

export const Legend: FC<{ slices: PieSlice[] }> = ({ slices }) => {
  const normalized = normalize(slices);
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {normalized.map((slice) => (
        <div className="flex items-center gap-1.5" key={slice.name}>
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: slice.color }}
          />
          <span className="text-slate-600 dark:text-slate-300">
            {slice.name}
          </span>
          <span className="text-slate-400 dark:text-slate-500">
            {slice.percentage.toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  );
};

export const SectionHeader: FC<{
  title: string;
  description: string;
  isFirst?: boolean;
}> = ({ title, description, isFirst = false }) => (
  <div
    className={[
      "mb-4 border-b border-slate-200 pb-2 dark:border-slate-800/50",
      isFirst ? "mt-0" : "mt-8",
    ].join(" ")}
  >
    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
      <span className="h-4 w-1 rounded-full bg-blue-500" />
      {title}
    </h3>
    <p className="ml-3 mt-1 text-xs text-slate-500 dark:text-slate-500">
      {description}
    </p>
  </div>
);

type VirtualBlock = {
  key: string;
  node: ReactNode;
  estimateSize?: number;
};

type GridColumns = {
  base: number;
  sm?: number;
  lg?: number;
};

type GridSection = {
  key: string;
  title: string;
  description: string;
  gridClassName: string;
  rowGapClass: string;
  rowTailClass?: string;
  columns: GridColumns;
  estimateRowSize?: number;
  cards: ReactNode[];
};

const DEFAULT_VIEWPORT_WIDTH = 1024;
const TAILWIND_SM = 640;
const TAILWIND_LG = 1024;

function useViewportWidth(): number {
  const [width, setWidth] = useState(() =>
    typeof window === "undefined" ? DEFAULT_VIEWPORT_WIDTH : window.innerWidth,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return width;
}

function resolveColumns(width: number, columns: GridColumns): number {
  if (width >= TAILWIND_LG) return columns.lg ?? columns.sm ?? columns.base;
  if (width >= TAILWIND_SM) return columns.sm ?? columns.base;
  return columns.base;
}

function chunkRows<T>(items: readonly T[], columns: number): T[][] {
  const rows: T[][] = [];
  const step = Math.max(columns, 1);
  for (let i = 0; i < items.length; i += step) {
    rows.push(items.slice(i, i + step));
  }
  return rows;
}

function buildSectionBlocks(
  sections: readonly GridSection[],
  width: number,
): VirtualBlock[] {
  const blocks: VirtualBlock[] = [];

  sections.forEach((section, sectionIndex) => {
    blocks.push({
      estimateSize: 72,
      key: `${section.key}-header`,
      node: (
        <SectionHeader
          description={section.description}
          isFirst={sectionIndex === 0}
          title={section.title}
        />
      ),
    });

    const cols = resolveColumns(width, section.columns);
    const rows = chunkRows(section.cards, cols);
    rows.forEach((row, rowIndex) => {
      const isLast = rowIndex === rows.length - 1;
      const rowClassName = [
        section.gridClassName,
        isLast ? (section.rowTailClass ?? "") : section.rowGapClass,
      ]
        .filter(Boolean)
        .join(" ");

      blocks.push({
        estimateSize: section.estimateRowSize ?? 200,
        key: `${section.key}-row-${rowIndex}`,
        node: <div className={rowClassName}>{row}</div>,
      });
    });
  });

  return blocks;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Demo Component
// ─────────────────────────────────────────────────────────────────────────────

export const MicroVizAggregateDemo: FC<{
  slices?: PieSlice[];
  getScrollElement?: () => HTMLElement | null;
}> = ({ slices: allSlices = DEMO_SLICES, getScrollElement }) => {
  const [maxSlices, setMaxSlices] = useState(5);
  const [minPercentage, setMinPercentage] = useState(3);

  const slices = useMemo(
    () => prepareSlices(allSlices, maxSlices, minPercentage),
    [allSlices, maxSlices, minPercentage],
  );

  const viewportWidth = useViewportWidth();

  const sections: GridSection[] = [
    {
      cards: [
        <VizCard footprint="32×32px" key="nano-ring" title="Nano Ring">
          <NanoRing slices={slices} />
        </VizCard>,
        <VizCard footprint="32×32px" key="mini-pie" title="Mini Pie (SVG)">
          <MiniPie slices={slices} />
        </VizCard>,
        <VizCard footprint="32×32px" key="orbital" title="Orbital">
          <Orbital slices={slices} />
        </VizCard>,
        <VizCard footprint="32×32px" key="orbital-dots" title="Orbital Dots">
          <OrbitalDots slices={slices} />
        </VizCard>,
      ],
      columns: { base: 1, lg: 4, sm: 2 },
      description: "Compact circular indicators for tight spaces",
      gridClassName: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4",
      key: "circles",
      rowGapClass: "mb-3",
      title: "1. Circles",
    },
    {
      cards: [
        <VizCard footprint="32×32px" key="dot-matrix" title="Dot Matrix">
          <DotMatrix slices={slices} />
        </VizCard>,
        <VizCard footprint="32×32px" key="mosaic-grid" title="Mosaic Grid">
          <MosaicGrid slices={slices} />
        </VizCard>,
        <VizCard footprint="32×32px" key="bit-grid" title="Bit Grid">
          <BitGrid slices={slices} />
        </VizCard>,
        <VizCard footprint="32×32px" key="mosaic-8x8" title="Mosaic 8×8">
          <Mosaic8x8 slices={slices} />
        </VizCard>,
        <VizCard footprint="32×32px" key="pixel-treemap" title="Pixel Treemap">
          <PixelTreemap slices={slices} />
        </VizCard>,
      ],
      columns: { base: 1, lg: 3, sm: 2 },
      description: "Grid-based patterns for discrete visualization",
      gridClassName: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
      key: "clusters",
      rowGapClass: "mb-3",
      title: "2. Clusters / Mosaics",
    },
    {
      cards: [
        <VizCard footprint="32×32px" key="code-minimap" title="Code Minimap">
          <CodeMinimap slices={slices} />
        </VizCard>,
        <VizCard footprint="32×8px" key="barcode-strip" title="Barcode Strip">
          <BarcodeStrip slices={slices} />
        </VizCard>,
        <VizCard footprint="32×32px" key="equalizer" title="Equalizer">
          <Equalizer slices={slices} />
        </VizCard>,
        <VizCard
          footprint="32×32px"
          key="sparkline-bars"
          title="Sparkline Bars"
        >
          <SparklineBars slices={slices} />
        </VizCard>,
      ],
      columns: { base: 1, lg: 4, sm: 2 },
      description: "Minimap and equalizer-style visualizations",
      gridClassName: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4",
      key: "mini-charts",
      rowGapClass: "mb-3",
      title: "3. Mini-Charts",
    },
    {
      cards: [
        <VizCard footprint="32×8px" key="stacked-bar" title="Stacked Bar">
          <StackedBar slices={slices} />
        </VizCard>,
        <VizCard footprint="32×8px" key="bar-gaps" title="Bar + Gaps">
          <StackedBarGaps slices={slices} />
        </VizCard>,
        <VizCard footprint="32×8px" key="progress-pills" title="Progress Pills">
          <ProgressPills slices={slices} />
        </VizCard>,
        <VizCard footprint="32×8px" key="segmented-pill" title="Segmented Pill">
          <SegmentedPill slices={slices} />
        </VizCard>,
        <VizCard footprint="32×8px" key="pixel-pill" title="Pixel Pill">
          <PixelStackedBar slices={slices} />
        </VizCard>,
        <VizCard footprint="32×16px" key="curved-bar" title="Curved Bar">
          <CurvedBar slices={slices} />
        </VizCard>,
        <VizCard footprint="32×12px" key="stacked-chips" title="Stacked Chips">
          <StackedChips slices={slices} />
        </VizCard>,
        <VizCard footprint="32×8px" key="pattern-tiles" title="Pattern Tiles">
          <PatternTiles slices={slices} />
        </VizCard>,
        <VizCard footprint="8×32px" key="vertical-stack" title="Vertical Stack">
          <VerticalStack slices={slices} />
        </VizCard>,
        <VizCard footprint="8×32px" key="pixel-column" title="Pixel Column">
          <PixelStackedColumn slices={slices} />
        </VizCard>,
      ],
      columns: { base: 1, lg: 3, sm: 2 },
      description: "Horizontal and vertical bar-based layouts",
      gridClassName: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
      key: "bars",
      rowGapClass: "mb-3",
      title: "4. Bars",
    },
    {
      cards: [
        <VizCard footprint="32×32px" key="donut" title="Donut">
          <DonutChart slices={slices} />
        </VizCard>,
        <VizCard
          footprint="32×32px"
          key="segmented-ring"
          title="Segmented Ring"
        >
          <SegmentedRing slices={slices} />
        </VizCard>,
        <VizCard
          footprint="32×32px"
          key="concentric-arcs"
          title="Concentric Arcs"
        >
          <ConcentricArcs slices={slices} />
        </VizCard>,
        <VizCard footprint="32×32px" key="radial-bars" title="Radial Bars">
          <RadialBars slices={slices} />
        </VizCard>,
      ],
      columns: { base: 1, lg: 4, sm: 2 },
      description: "Ring and arc-based circular patterns",
      gridClassName: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4",
      key: "circular",
      rowGapClass: "mb-3",
      title: "5. Circular",
    },
    {
      cards: [
        <VizCard footprint="32×8px" key="shape-row" title="Shape Row">
          <ShapeRow slices={slices} />
        </VizCard>,
        <VizCard footprint="32×4px" key="dot-row" title="Dot Row">
          <DotRow slices={slices} />
        </VizCard>,
      ],
      columns: { base: 1, sm: 2 },
      description: "Unconventional shapes and layouts",
      gridClassName: "grid grid-cols-1 gap-3 sm:grid-cols-2",
      key: "odd",
      rowGapClass: "mb-3",
      rowTailClass: "mb-6",
      title: "6. Odd",
    },
  ];

  const sectionBlocks = [
    ...buildSectionBlocks(sections, viewportWidth),
    {
      estimateSize: 260,
      key: "size-comparison",
      node: (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-3 text-xs font-medium text-slate-500 dark:text-slate-400">
            Actual size comparison
          </p>
          <div className="flex flex-wrap items-center gap-6 rounded-lg bg-slate-100 p-3 dark:bg-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Bar:
              </span>
              <StackedBarGaps slices={slices} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Arcs:
              </span>
              <ConcentricArcs slices={slices} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Dots:
              </span>
              <DotRow slices={slices} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Pills:
              </span>
              <ProgressPills slices={slices} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Ring:
              </span>
              <SegmentedRing slices={slices} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Nano:
              </span>
              <NanoRing slices={slices} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Grid:
              </span>
              <BitGrid slices={slices} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Chips:
              </span>
              <StackedChips slices={slices} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Pixel:
              </span>
              <PixelStackedBar slices={slices} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                8×8:
              </span>
              <Mosaic8x8 slices={slices} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Barcode:
              </span>
              <BarcodeStrip slices={slices} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Orbital:
              </span>
              <Orbital slices={slices} />
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <DemoContent>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
          Micro-Visualization Patterns
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-sm">
          Language distribution at 32×32px using your actual CV data. Adjust
          controls to see transitions.
        </p>
      </div>

      {/* Sticky controls + legend */}
      <div className="sticky top-0 z-20 -mx-1 sm:-mx-2">
        <div className="border-y border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 sm:flex-nowrap sm:gap-4 sm:min-w-max">
              {/* Max Slices */}
              <div className="flex items-center gap-2 shrink-0">
                <label
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap"
                  htmlFor="maxSlices"
                >
                  Slices:
                </label>
                <input
                  className="w-16 accent-blue-500"
                  id="maxSlices"
                  max={6}
                  min={3}
                  onChange={(e) => setMaxSlices(Number(e.target.value))}
                  title={`Slices: ${maxSlices}`}
                  type="range"
                  value={maxSlices}
                />
                <span className="w-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                  {maxSlices}
                </span>
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-600 shrink-0" />

              {/* Min Percentage */}
              <div className="flex items-center gap-2 shrink-0">
                <label
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap"
                  htmlFor="minPct"
                >
                  Min %:
                </label>
                <input
                  className="w-20 accent-blue-500"
                  id="minPct"
                  max={15}
                  min={1}
                  onChange={(e) => setMinPercentage(Number(e.target.value))}
                  title={`Min %: ${minPercentage}`}
                  type="range"
                  value={minPercentage}
                />
                <span className="w-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                  {minPercentage}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
          <div className="px-3 py-2">
            <Legend slices={slices} />
          </div>
        </div>
      </div>

      <VirtualizedStack
        blocks={sectionBlocks}
        getScrollElement={getScrollElement}
      />
    </DemoContent>
  );
};
