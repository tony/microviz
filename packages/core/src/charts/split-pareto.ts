import { a11yItemsForSegments, a11yLabelWithSegmentsSummary } from "../a11y";
import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import {
  clamp,
  coerceFiniteNonNegative,
  layoutSegmentsByPct,
  normalizeSegments,
} from "./shared";
import type {
  BitfieldData,
  NormalizedSplitPareto,
  SplitParetoSpec,
} from "./types";

export const splitParetoChart = {
  a11y(_spec, normalized, _layout) {
    return {
      items: a11yItemsForSegments(normalized.segments, {
        idPrefix: "split-pareto-seg",

        labelFallback: "Segment",
      }),
      label: a11yLabelWithSegmentsSummary(
        "Split Pareto chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Split Pareto",
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
      "Non-finite split-pareto gap; defaulted to 0.",
    );

    // Threshold for the divider (default 80%)
    const threshold = spec.threshold ?? 80;
    const dividerOpacity = spec.dividerOpacity ?? 0.6;
    const dividerWidth = spec.dividerWidth ?? 2;

    const runs = layoutSegmentsByPct(segments, usableW, gap);
    const classSuffix = spec.className ? ` ${spec.className}` : "";

    // Calculate cumulative percentages and find divider position
    let cumulative = 0;
    let dividerPct = 0;
    for (const seg of segments) {
      if (cumulative < threshold) {
        dividerPct = cumulative + seg.pct;
      }
      cumulative += seg.pct;
    }
    dividerPct = clamp(dividerPct, 0, 100);

    const marks: Mark[] = [];

    // Segment rects
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      if (!run) continue;

      marks.push({
        className: `mv-split-pareto-seg${classSuffix}`,
        fill: run.color,
        h: usableH,
        id: `split-pareto-seg-${i}`,
        rx: 0,
        ry: 0,
        type: "rect" as const,
        w: run.w,
        x: x0 + run.x,
        y: y0,
      });
    }

    // Divider line
    const dividerX = x0 + (dividerPct / 100) * usableW;
    marks.push({
      className: `mv-split-pareto-divider${classSuffix}`,
      id: "split-pareto-divider",
      stroke: "#ffffff",
      strokeOpacity: dividerOpacity,
      strokeWidth: dividerWidth,
      type: "line" as const,
      x1: dividerX,
      x2: dividerX,
      y1: y0,
      y2: y0 + usableH,
    });

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "split-pareto" as const };
  },
  preferredAspectRatio: "wide" as const,
  type: "split-pareto",
} satisfies ChartDefinition<
  "split-pareto",
  SplitParetoSpec,
  BitfieldData,
  NormalizedSplitPareto
>;
