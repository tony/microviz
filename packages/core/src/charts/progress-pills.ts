import { a11yItemsForSegments, a11yLabelWithSegmentsSummary } from "../a11y";
import type { ChartDefinition } from "./chart-definition";
import {
  coerceFiniteNonNegative,
  layoutSegmentsByPct,
  normalizeSegments,
} from "./shared";
import type {
  BitfieldData,
  NormalizedProgressPills,
  ProgressPillsSpec,
} from "./types";

export const progressPillsChart = {
  a11y(_spec, normalized, _layout) {
    return {
      items: a11yItemsForSegments(normalized.segments, {
        idPrefix: "progress-pill",
        labelFallback: "Pill",
      }),
      label: a11yLabelWithSegmentsSummary(
        "Progress pills chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Progress pills",
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
      spec.gap ?? 4,
      4,
      warnings,
      "Non-finite progress-pills gap; defaulted to 4.",
    );
    const runs = layoutSegmentsByPct(segments, usableW, gap);
    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const defaultPillHeight = Math.min(usableH, 10);
    const pillHeightRequested = coerceFiniteNonNegative(
      spec.pillHeight ?? defaultPillHeight,
      defaultPillHeight,
      warnings,
      "Non-finite progress-pills pill height; defaulted to auto.",
    );
    const pillH = Math.min(pillHeightRequested, usableH);
    const y = y0 + (usableH - pillH) / 2;
    const radius = pillH / 2;

    return runs.map((run, i) => ({
      className: `mv-progress-pill${classSuffix}`,
      fill: run.color,
      h: pillH,
      id: `progress-pill-${i}`,
      rx: Math.min(radius, run.w / 2),
      ry: Math.min(radius, run.w / 2),
      type: "rect",
      w: run.w,
      x: x0 + run.x,
      y,
    }));
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "progress-pills" };
  },
  preferredAspectRatio: "wide" as const,
  type: "progress-pills",
} satisfies ChartDefinition<
  "progress-pills",
  ProgressPillsSpec,
  BitfieldData,
  NormalizedProgressPills
>;
