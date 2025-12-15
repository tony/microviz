import type { Mark } from "../model";
import type { ChartDefinition } from "./chart-definition";
import {
  clamp,
  coerceFiniteNonNegative,
  layoutSegmentsByPct,
  normalizeSegments,
} from "./shared";
import type { BitfieldData, NormalizedTapered, TaperedSpec } from "./types";

function taperedPath(options: {
  height: number;
  taperPct: number;
  width: number;
  x: number;
  y: number;
}): string {
  const h = Math.max(0, options.height);
  const w = Math.max(0, options.width);
  const x = options.x;
  const y = options.y;

  const taper = clamp(options.taperPct, 0, 0.49);
  const inset = taper * h;

  const xRight = x + w;
  const yBottom = y + h;

  return `M ${x.toFixed(2)} ${y.toFixed(2)} L ${xRight.toFixed(2)} ${(y + inset).toFixed(2)} L ${xRight.toFixed(2)} ${(yBottom - inset).toFixed(2)} L ${x.toFixed(2)} ${yBottom.toFixed(2)} Z`;
}

export const taperedChart = {
  a11y(_spec, _normalized, _layout) {
    return { label: "Tapered chart", role: "img" };
  },
  category: "bars" as const,
  defaultPad: 0,
  displayName: "Tapered",
  emptyDataWarningMessage: "No segments data.",
  isEmpty(normalized) {
    return normalized.segments.length === 0;
  },
  marks(spec, normalized, layout, _state, _theme, warnings) {
    const segments = normalized.segments;
    if (segments.length === 0) return [];

    const usableW = Math.max(0, layout.width - layout.pad * 2);
    const usableH = Math.max(0, layout.height - layout.pad * 2);
    const x0 = layout.pad;
    const y0 = layout.pad;

    const taperPct = coerceFiniteNonNegative(
      spec.taperPct ?? 0.1,
      0.1,
      warnings,
      "Non-finite tapered taperPct; defaulted to 0.1.",
    );
    const heightStepPct = coerceFiniteNonNegative(
      spec.heightStepPct ?? 0.12,
      0.12,
      warnings,
      "Non-finite tapered heightStepPct; defaulted to 0.12.",
    );
    const minHeightPct = coerceFiniteNonNegative(
      spec.minHeightPct ?? 0.4,
      0.4,
      warnings,
      "Non-finite tapered minHeightPct; defaulted to 0.4.",
    );

    const runs = layoutSegmentsByPct(segments, usableW, 0);
    const classSuffix = spec.className ? ` ${spec.className}` : "";

    const marks: Mark[] = [];
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      if (!run) continue;

      const heightPct = Math.max(minHeightPct, 1 - i * heightStepPct);
      const h = usableH * heightPct;
      const y = y0 + (usableH - h) / 2;
      const x = x0 + run.x;

      marks.push({
        className: `mv-tapered-seg${classSuffix}`,
        d: taperedPath({ height: h, taperPct, width: run.w, x, y }),
        fill: run.color,
        id: `tapered-seg-${i}`,
        type: "path",
      });
    }

    return marks;
  },
  normalize(_spec, data) {
    const segments = normalizeSegments(data);
    return { segments, type: "tapered" as const };
  },
  preferredAspectRatio: "wide" as const,
  type: "tapered",
} satisfies ChartDefinition<
  "tapered",
  TaperedSpec,
  BitfieldData,
  NormalizedTapered
>;
