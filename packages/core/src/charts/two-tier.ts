import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import {
  coerceFiniteNonNegative,
  layoutSegmentsByPct,
  normalizeSegments,
} from "./shared";
import type { BitfieldData, NormalizedTwoTier, TwoTierSpec } from "./types";

export const twoTierChart = {
  a11y(_spec, _normalized, _layout) {
    return { label: "Two-tier chart", role: "img" };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Two-tier",
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
      spec.gap ?? 1,
      1,
      warnings,
      "Non-finite two-tier gap; defaulted to 1.",
    );

    // Top row height ratio (default 60%)
    const topRatio = spec.topRatio ?? 0.6;
    const bottomOpacity = spec.bottomOpacity ?? 0.6;

    const topH = usableH * topRatio - gap / 2;
    const bottomH = usableH * (1 - topRatio) - gap / 2;
    const topY = y0;
    const bottomY = y0 + topH + gap;

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const marks: Mark[] = [];

    // Top row: first 2 segments scaled to 100% width
    const topSegments = segments.slice(0, 2);
    if (topSegments.length > 0) {
      const topTotal = topSegments.reduce((sum, s) => sum + s.pct, 0) || 1;
      // Scale top segments to fill full width
      const scaledTopSegments = topSegments.map((s) => ({
        ...s,
        pct: (s.pct / topTotal) * 100,
      }));
      const topRuns = layoutSegmentsByPct(scaledTopSegments, usableW, gap);

      for (let i = 0; i < topRuns.length; i++) {
        const run = topRuns[i];
        if (!run) continue;

        marks.push({
          className: `mv-two-tier-top${classSuffix}`,
          fill: run.color,
          h: topH,
          id: `two-tier-top-${i}`,
          rx: 0,
          ry: 0,
          type: "rect" as const,
          w: run.w,
          x: x0 + run.x,
          y: topY,
        });
      }
    }

    // Bottom row: all segments at original proportions
    const bottomRuns = layoutSegmentsByPct(segments, usableW, gap);

    for (let i = 0; i < bottomRuns.length; i++) {
      const run = bottomRuns[i];
      if (!run) continue;

      marks.push({
        className: `mv-two-tier-bottom${classSuffix}`,
        fill: run.color,
        fillOpacity: bottomOpacity,
        h: bottomH,
        id: `two-tier-bottom-${i}`,
        rx: 0,
        ry: 0,
        type: "rect" as const,
        w: run.w,
        x: x0 + run.x,
        y: bottomY,
      });
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "two-tier" as const };
  },
  type: "two-tier",
} satisfies ChartDefinition<
  "two-tier",
  TwoTierSpec,
  BitfieldData,
  NormalizedTwoTier
>;
