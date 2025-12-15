import type { ChartDefinition } from "./chart-definition";
import {
  coerceFiniteNonNegative,
  layoutSegmentsByPct,
  normalizeSegments,
} from "./shared";
import type {
  BitfieldData,
  NormalizedVariableRibbon,
  VariableRibbonSpec,
} from "./types";

export const variableRibbonChart = {
  a11y(_spec, _normalized, _layout) {
    return { label: "Variable ribbon chart", role: "img" };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Variable Ribbon",
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
      "Non-finite variable-ribbon gap; defaulted to 1.",
    );

    // Height decreases by this percentage per step
    const stepDecrement = spec.stepDecrement ?? 18;
    const minHeightPct = spec.minHeightPct ?? 30;

    const runs = layoutSegmentsByPct(segments, usableW, gap);
    const classSuffix = spec.className ? ` ${spec.className}` : "";

    return runs
      .map((run, i) => {
        const seg = segments[i];
        if (!seg) return null;

        // Height decreases by index: 100 - i * stepDecrement
        const heightPct = Math.max(minHeightPct, 100 - i * stepDecrement);
        const h = (heightPct / 100) * usableH;
        // Center vertically
        const y = y0 + (usableH - h) / 2;

        const rx = Math.min(2, run.w / 2, h / 2);

        return {
          className: `mv-variable-ribbon-seg${classSuffix}`,
          fill: run.color,
          h,
          id: `variable-ribbon-seg-${i}`,
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
    return { segments, type: "variable-ribbon" as const };
  },
  type: "variable-ribbon",
} satisfies ChartDefinition<
  "variable-ribbon",
  VariableRibbonSpec,
  BitfieldData,
  NormalizedVariableRibbon
>;
