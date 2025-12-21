import { a11yLabelWithSegmentsSummary } from "../a11y";
import type { ChartDefinition } from "./chart-definition";
import {
  coerceFiniteNonNegative,
  layoutSegmentsByPct,
  normalizeSegments,
} from "./shared";
import type {
  BitfieldData,
  NormalizedSegmentedBar,
  SegmentedBarSpec,
} from "./types";

export const segmentedBarChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSegmentsSummary(
        "Segmented bar chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Segmented bar",
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
      "Non-finite segmented-bar gap; defaulted to 2.",
    );
    const runs = layoutSegmentsByPct(segments, usableW, gap);
    const classSuffix = spec.className ? ` ${spec.className}` : "";

    return runs.map((run, i) => ({
      className: `mv-segmented-bar-seg${classSuffix}`,
      fill: run.color,
      h: usableH,
      id: `segmented-bar-seg-${i}`,
      rx: Math.min(usableH / 2, 2, run.w / 2),
      ry: Math.min(usableH / 2, 2, run.w / 2),
      type: "rect",
      w: run.w,
      x: x0 + run.x,
      y: y0,
    }));
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "segmented-bar" };
  },
  type: "segmented-bar",
} satisfies ChartDefinition<
  "segmented-bar",
  SegmentedBarSpec,
  BitfieldData,
  NormalizedSegmentedBar
>;
