import { a11yLabelWithSegmentsSummary } from "../a11y";
import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import {
  clamp,
  coerceFiniteInt,
  coerceFiniteNonNegative,
  layoutSegmentsByPct,
  normalizeSegments,
} from "./shared";
import type {
  BitfieldData,
  NormalizedSplitRibbon,
  SplitRibbonSpec,
} from "./types";

export const splitRibbonChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSegmentsSummary(
        "Split ribbon chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Split Ribbon",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const { segments } = normalized;
    if (segments.length === 0) return [];

    const { width, height, pad } = layout;
    const usableW = Math.max(0, width - pad * 2);
    const usableH = Math.max(0, height - pad * 2);
    const x0 = pad;
    const y0 = pad;

    const gap = coerceFiniteNonNegative(
      spec.gap ?? 2,
      2,
      warnings,
      "Non-finite split-ribbon gap; defaulted to 2.",
    );

    const ribbonGap = coerceFiniteNonNegative(
      spec.ribbonGap ?? 4,
      4,
      warnings,
      "Non-finite split-ribbon ribbonGap; defaulted to 4.",
    );

    const defaultSplitAt = Math.ceil(segments.length / 2);
    const splitAt = clamp(
      coerceFiniteInt(
        spec.splitAt ?? defaultSplitAt,
        defaultSplitAt,
        0,
        warnings,
        "Non-finite split-ribbon splitAt; defaulted to half the segments.",
      ),
      0,
      segments.length,
    );

    // Calculate ribbon heights
    const ribbonHeight = (usableH - ribbonGap) / 2;
    if (ribbonHeight <= 0) return [];

    const topY = y0;
    const bottomY = y0 + ribbonHeight + ribbonGap;

    const topSegments = segments.slice(0, splitAt);
    const bottomSegments = segments.slice(splitAt);

    const topTotal = topSegments.reduce((sum, s) => sum + s.pct, 0) || 1;
    const bottomTotal = bottomSegments.reduce((sum, s) => sum + s.pct, 0) || 1;

    const topLayouts = layoutSegmentsByPct(
      topSegments.map((s) => ({ ...s, pct: (s.pct / topTotal) * 100 })),
      usableW,
      gap,
    );

    const bottomLayouts = layoutSegmentsByPct(
      bottomSegments.map((s) => ({ ...s, pct: (s.pct / bottomTotal) * 100 })),
      usableW,
      gap,
    );

    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const marks: Mark[] = [];

    // Top ribbon
    for (const [i, seg] of topLayouts.entries()) {
      marks.push({
        className: `mv-split-ribbon-top${classSuffix}`,
        fill: seg.color,
        h: ribbonHeight,
        id: `split-ribbon-top-${i}`,
        type: "rect" as const,
        w: seg.w,
        x: x0 + seg.x,
        y: topY,
      });
    }

    // Bottom ribbon
    for (const [i, seg] of bottomLayouts.entries()) {
      marks.push({
        className: `mv-split-ribbon-bottom${classSuffix}`,
        fill: seg.color,
        h: ribbonHeight,
        id: `split-ribbon-bottom-${i}`,
        type: "rect" as const,
        w: seg.w,
        x: x0 + seg.x,
        y: bottomY,
      });
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "split-ribbon" as const };
  },
  type: "split-ribbon",
} satisfies ChartDefinition<
  "split-ribbon",
  SplitRibbonSpec,
  BitfieldData,
  NormalizedSplitRibbon
>;
