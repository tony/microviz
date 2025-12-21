import { a11yItemsForSegments, a11yLabelWithSegmentsSummary } from "../a11y";
import type { ChartDefinition } from "./chart-definition";
import {
  coerceFiniteNonNegative,
  layoutSegmentsByPct,
  normalizeSegments,
} from "./shared";
import type {
  BitfieldData,
  FadedPyramidSpec,
  NormalizedFadedPyramid,
} from "./types";

export const fadedPyramidChart = {
  a11y(_spec, normalized, _layout) {
    return {
      items: a11yItemsForSegments(normalized.segments, {
        idPrefix: "faded-pyramid-seg",

        labelFallback: "Segment",
      }),
      label: a11yLabelWithSegmentsSummary(
        "Faded pyramid chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Faded pyramid",
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
      spec.gap ?? 2,
      2,
      warnings,
      "Non-finite faded-pyramid gap; defaulted to 2.",
    );

    const heightDecrement = spec.heightDecrement ?? 15;
    const minHeightPct = spec.minHeightPct ?? 30;

    const runs = layoutSegmentsByPct(segments, usableW, gap);
    const classSuffix = spec.className ? ` ${spec.className}` : "";

    return runs
      .map((run, i) => {
        const seg = segments[i];
        if (!seg) return null;

        // Height decreases by heightDecrement% per segment, with minimum
        const heightPct = Math.max(minHeightPct, 100 - i * heightDecrement);
        const h = (heightPct / 100) * usableH;
        const y = y0 + usableH - h; // Align to bottom

        const rx = Math.min(2, run.w / 2);

        return {
          className: `mv-faded-pyramid-bar${classSuffix}`,
          fill: run.color,
          h,
          id: `faded-pyramid-bar-${i}`,
          rx,
          ry: rx,
          type: "rect" as const,
          w: run.w,
          x: x0 + run.x,
          y,
        };
      })
      .filter((m) => m !== null);
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "faded-pyramid" as const };
  },
  preferredAspectRatio: "wide" as const,
  type: "faded-pyramid",
} satisfies ChartDefinition<
  "faded-pyramid",
  FadedPyramidSpec,
  BitfieldData,
  NormalizedFadedPyramid
>;
