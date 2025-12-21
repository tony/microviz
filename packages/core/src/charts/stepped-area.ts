import { a11yLabelWithSegmentsSummary } from "../a11y";
import type { ChartDefinition } from "./chart-definition";
import {
  coerceFiniteNonNegative,
  layoutSegmentsByPct,
  normalizeSegments,
} from "./shared";
import type {
  BitfieldData,
  NormalizedSteppedArea,
  SteppedAreaSpec,
} from "./types";

export const steppedAreaChart = {
  a11y(_spec, normalized, _layout) {
    return {
      label: a11yLabelWithSegmentsSummary(
        "Stepped area chart",
        normalized.segments,
      ),
      role: "img",
    };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Stepped Area",
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
      "Non-finite stepped-area gap; defaulted to 0.",
    );

    // Height decreases by this amount (px) per step
    const stepOffset = spec.stepOffset ?? 5;

    const runs = layoutSegmentsByPct(segments, usableW, gap);
    const classSuffix = spec.className ? ` ${spec.className}` : "";

    return runs
      .map((run, i) => {
        const seg = segments[i];
        if (!seg) return null;

        // Each segment is offset downward and shorter
        const yOffset = i * stepOffset;
        const h = Math.max(0, usableH - yOffset);
        const y = y0 + yOffset;

        return {
          className: `mv-stepped-area-seg${classSuffix}`,
          fill: run.color,
          h,
          id: `stepped-area-seg-${i}`,
          rx: 0,
          ry: 0,
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
    return { segments, type: "stepped-area" as const };
  },
  preferredAspectRatio: "wide" as const,
  type: "stepped-area",
} satisfies ChartDefinition<
  "stepped-area",
  SteppedAreaSpec,
  BitfieldData,
  NormalizedSteppedArea
>;
