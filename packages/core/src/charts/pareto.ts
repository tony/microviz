import { a11yItemsForSegments, a11yLabelWithSegmentsSummary } from "../a11y";
import type { ChartDefinition } from "./chart-definition";
import {
  coerceFiniteNonNegative,
  layoutSegmentsByPct,
  normalizeSegments,
} from "./shared";
import type { BitfieldData, NormalizedPareto, ParetoSpec } from "./types";

export const paretoChart = {
  a11y(_spec, normalized, _layout) {
    return {
      items: a11yItemsForSegments(normalized.segments, {
        idPrefix: "pareto-seg",

        labelFallback: "Segment",
      }),
      label: a11yLabelWithSegmentsSummary("Pareto chart", normalized.segments),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Pareto",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);
    const x0 = layout.pad;
    const y0 = layout.pad;

    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const gap = coerceFiniteNonNegative(
      spec.gap ?? 0,
      0,
      warnings,
      "Non-finite pareto gap; defaulted to 0.",
    );

    const bgOpacity = spec.bgOpacity ?? 0.25;
    const runs = layoutSegmentsByPct(segments, usableW, gap);
    const classSuffix = spec.className ? ` ${spec.className}` : "";

    // Calculate cumulative percentages
    const cumulativePcts: number[] = [];
    let cumulative = 0;
    for (const seg of segments) {
      cumulative += seg.pct;
      cumulativePcts.push(cumulative);
    }

    const marks: Array<{
      className: string;
      fill: string;
      fillOpacity?: number;
      h: number;
      id: string;
      rx: number;
      ry: number;
      type: "rect";
      w: number;
      x: number;
      y: number;
    }> = [];

    // Background layer: full-height segments at reduced opacity
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      if (!run) continue;
      marks.push({
        className: `mv-pareto-bg${classSuffix}`,
        fill: run.color,
        fillOpacity: bgOpacity,
        h: usableH,
        id: `pareto-bg-${i}`,
        rx: 0,
        ry: 0,
        type: "rect" as const,
        w: run.w,
        x: x0 + run.x,
        y: y0,
      });
    }

    // Foreground layer: cumulative height bars (bottom-aligned)
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      const cumPct = cumulativePcts[i];
      if (!run || cumPct === undefined) continue;

      const h = (cumPct / 100) * usableH;
      const y = y0 + usableH - h;

      marks.push({
        className: `mv-pareto-seg${classSuffix}`,
        fill: run.color,
        h,
        id: `pareto-seg-${i}`,
        rx: 0,
        ry: 0,
        type: "rect" as const,
        w: run.w,
        x: x0 + run.x,
        y,
      });
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "pareto" as const };
  },
  preferredAspectRatio: "wide" as const,
  type: "pareto",
} satisfies ChartDefinition<
  "pareto",
  ParetoSpec,
  BitfieldData,
  NormalizedPareto
>;
